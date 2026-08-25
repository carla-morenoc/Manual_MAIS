from flask import Flask, request, jsonify
from flask_cors import CORS

from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

import ollama
import os
import time

app = Flask(__name__)

CORS(app)

print("===================================")
print("CARGANDO IA...")
print("===================================")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

vectorstore = FAISS.load_local(
    "vector",
    embeddings,
    allow_dangerous_deserialization=True
)

print("Base cargada correctamente.")

# Diccionario global para almacenar el historial de conversación por session_id
sessions_history = {}


@app.route("/chat", methods=["POST"])
@app.route("/api/v1/chat/query", methods=["POST"])
def chat():

    datos = request.get_json() or {}

    pregunta = (datos.get("pregunta") or datos.get("query") or "").strip()
    session_id = datos.get("session_id", "default_session")

    if not pregunta:
        return jsonify({
            "respuesta": "Escribe una pregunta.",
            "answer": "Escribe una pregunta."
        })

    print("\n==============================")
    print(f"Session ID: {session_id}")
    print("Pregunta:", pregunta)

    # Recuperar o crear historial de sesión
    if session_id not in sessions_history:
        sessions_history[session_id] = []

    history = sessions_history[session_id]

    # Buscar los 8 mejores
    resultados = vectorstore.similarity_search_with_score(
        pregunta,
        k=8
    )

    # Ordenar por score (menor = mejor)
    resultados.sort(key=lambda x: x[1])

    contexto = []
    fuentes = []
    sources_list = []

    # Solo usamos los 4 mejores
    for doc, score in resultados[:4]:

        archivo = os.path.basename(
            doc.metadata.get("source", "Documento")
        )

        pagina = doc.metadata.get("page", 0) + 1

        contexto.append(
f"""
DOCUMENTO: {archivo}
PÁGINA: {pagina}

{doc.page_content}
"""
        )

        fuentes.append(
            f"• {archivo} (página {pagina})"
        )
        sources_list.append({
            "doc_id": doc.metadata.get("source", archivo),
            "filename": archivo,
            "page": pagina
        })

    contexto_str = "\n".join(contexto)[:2000]

    system_prompt = f"""
Eres el asistente oficial de MAIS.

REGLAS IMPORTANTES

- Responde únicamente usando la documentación.
- Nunca inventes.
- Si no encuentras la respuesta responde exactamente:

"No he encontrado esa información en la documentación de MAIS."

Responde de forma breve.

DOCUMENTACIÓN

{contexto_str}
"""

    messages = [
        {
            "role": "system",
            "content": system_prompt
        }
    ]

    # Añadir los últimos 4 mensajes del historial para darle contexto conversacional
    for msg in history[-4:]:
        messages.append(msg)

    messages.append({
        "role": "user",
        "content": pregunta
    })

    inicio = time.time()

    respuesta = ollama.chat(
        model="qwen2.5:1.5b",
        messages=messages
    )

    fin = time.time()

    print(f"Ollama tardó {round(fin-inicio,2)} segundos")

    texto = respuesta["message"]["content"]

    # Guardar en el historial de sesión (usuario y asistente)
    history.append({"role": "user", "content": pregunta})
    history.append({"role": "assistant", "content": texto})

    # Mantener el historial acotado a los últimos 10 turnos
    if len(history) > 20:
        sessions_history[session_id] = history[-20:]

    texto_final = texto + "\n\n---\n"
    texto_final += "### 📚 Fuentes utilizadas\n\n"
    texto_final += "\n".join(sorted(set(fuentes)))

    return jsonify({
        "respuesta": texto_final,
        "answer": texto_final,
        "sources": sources_list,
        "session_id": session_id
    })


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000
    )