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


@app.route("/chat", methods=["POST"])
def chat():

    datos = request.get_json()

    pregunta = datos.get("pregunta", "").strip()

    if not pregunta:
        return jsonify({
            "respuesta": "Escribe una pregunta."
        })

    print("\n==============================")
    print("Pregunta:", pregunta)

    # Buscar los 8 mejores
    resultados = vectorstore.similarity_search_with_score(
        pregunta,
        k=8
    )

    # Ordenar por score (menor = mejor)
    resultados.sort(key=lambda x: x[1])

    contexto = []
    fuentes = []

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

    contexto = "\n".join(contexto)

    # Limitar contexto
    contexto = contexto[:2000]

    prompt = f"""
Eres el asistente oficial de MAIS.

REGLAS IMPORTANTES

- Responde únicamente usando la documentación.
- Nunca inventes.
- Si no encuentras la respuesta responde exactamente:

"No he encontrado esa información en la documentación de MAIS."

Responde de forma breve.

DOCUMENTACIÓN

{contexto}

PREGUNTA

{pregunta}
"""

    inicio = time.time()

    respuesta = ollama.chat(

        model="qwen2.5:1.5b",

        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]

    )

    fin = time.time()

    print(f"Ollama tardó {round(fin-inicio,2)} segundos")

    texto = respuesta["message"]["content"]

    texto += "\n\n---\n"
    texto += "### 📚 Fuentes utilizadas\n\n"
    texto += "\n".join(sorted(set(fuentes)))

    return jsonify({
        "respuesta": texto
    })


if __name__ == "__main__":

    app.run(
        host="0.0.0.0",
        port=5000
    )