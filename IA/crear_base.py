import os

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings

print("===================================")
print("LEYENDO DOCUMENTOS...")
print("===================================")

carpeta = "documentos"

documentos = []

for archivo in os.listdir(carpeta):

    if archivo.endswith(".pdf"):

        ruta = os.path.join(carpeta, archivo)

        print("Cargando:", archivo)

        loader = PyPDFLoader(ruta)

        documentos.extend(loader.load())


# eliminar páginas casi vacías

documentos_limpios = []

for doc in documentos:

    texto = doc.page_content.strip()

    if len(texto) > 80:

        documentos_limpios.append(doc)

documentos = documentos_limpios

print("Páginas útiles:", len(documentos))

print("===================================")
print("DIVIDIENDO DOCUMENTOS...")
print("===================================")

splitter = RecursiveCharacterTextSplitter(

    separators=[
        "\n# ",
        "\n## ",
        "\n\n",
        "\n",
        ". ",
        " "
    ],

    chunk_size=1200,

    chunk_overlap=250,

    length_function=len

)

chunks = splitter.split_documents(documentos)

print("Fragmentos:", len(chunks))

print("===================================")
print("CREANDO EMBEDDINGS...")
print("===================================")

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)

print("===================================")
print("CREANDO BASE FAISS...")
print("===================================")

vectorstore = FAISS.from_documents(
    chunks,
    embeddings
)

vectorstore.save_local("vector")

print("")
print("===================================")
print("BASE CREADA CORRECTAMENTE")
print("===================================")
print("Páginas:", len(documentos))
print("Fragmentos:", len(chunks))
print("")