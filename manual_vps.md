# 🚀 Manual de Despliegue y Administración en VPS — MAIS_IA

Este documento sirve como manual oficial de referencia para administrar el servidor de producción (VPS) del proyecto **MAIS_IA** (asistente inteligente "Maisito"). Contiene las instrucciones técnicas avanzadas para el administrador de sistemas y una guía simplificada dirigida a personal sin conocimientos de programación.

---

# 🛠️ PARTE 1: Guía Técnica Avanzada (SysAdmin)

## 1. Topología y Arquitectura Docker
La infraestructura en producción se orquesta mediante un fichero `docker-compose.prod.yml` que corre en la dirección IP **`57.131.148.194`** bajo una red interna de tipo bridge llamada `mais-prod-network`.

Orquesta **7 contenedores Docker**:

| Servicio | Imagen / Origen | Puerto Host | Puerto Interno | Volumen Persistente | Propósito |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `postgres` | `postgres:16-alpine` | `5433` | `5432` | `maisito_postgres_data` | Almacenamiento SQL relacional |
| `qdrant` | `qdrant/qdrant:v1.18.2` | `6333`, `6334` | `6333`, `6334` | `maisito_qdrant_data` | Base de datos vectorial (RAG) |
| `redis` | `redis:7-alpine` | Ninguno | `6379` | Memoria temporal | Broker de mensajería para Celery |
| `backend` | `./backend/Dockerfile` | `8000` | `8000` | `./backend/uploads` | API FastAPI principal |
| `celery_worker`| `./backend/Dockerfile.worker` | Ninguno | Ninguno | `./backend/uploads` | Ejecución de tareas asíncronas |
| `celery_beat` | `./backend/Dockerfile.worker` | Ninguno | Ninguno | Ninguno | Planificador de tareas recurrentes |
| `frontend` | `./frontend/Dockerfile` | `3000` | `3000` | Ninguno | Aplicación Next.js Standalone |

---

## 2. Configuración del Entorno (`.env`)
El archivo de entorno está localizado en el VPS en `/home/ubuntu/opt/maisito/backend/.env`.

### Variables Críticas de Producción:
* **`POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB`**: Credenciales de la base de datos PostgreSQL (`MAIS_IA` / `MAIS_IA_secret`).
* **`QDRANT_COLLECTION`**: Colección vectorial por defecto en producción (`Maisito_chunks`).
* **`CORS_ORIGINS`**: Lista en formato JSON de orígenes permitidos:
  `["http://localhost:3000", "http://localhost:8000", "https://maisformacion.com", "https://www.maisformacion.com", "https://formacion.mais.es"]`
* **`MAIS_IA_SECURITY_TOKEN`**: Clave de comunicación interna segura entre servicios.
* **`LLM_PROVIDER` / `LLM_MODEL`**: Proveedor del modelo (`groq`, `gemini`, o `deepseek`) y modelo a ejecutar.
* **Claves de API**: `GROQ_API_KEY`, `GEMINI_API_KEY` o `DEEPSEEK_API_KEY` según el proveedor seleccionado.

---

## 3. Guía de Operaciones en Producción (Línea de Comandos)

### Requisito Inicial: Volúmenes Persistentes
Antes del primer arranque en una máquina limpia, se deben crear manualmente los volúmenes externos definidos en Docker Compose para evitar fallos de inicialización:
```bash
sudo docker volume create maisito_postgres_data
sudo docker volume create maisito_qdrant_data
```

### Inicialización Completa:
Para compilar y levantar toda la pila en segundo plano:
```bash
sudo docker compose -f docker-compose.prod.yml up -d --build
```

### Reconstrucción de un Servicio Específico (Ej: Backend):
Si solo se actualiza el código del backend, se puede compilar e iniciar de forma aislada para minimizar el tiempo de inactividad:
```bash
sudo docker compose -f docker-compose.prod.yml up -d --build backend celery_worker celery_beat
```

### Parada del Entorno:
```bash
sudo docker compose -f docker-compose.prod.yml down
```

### Monitoreo de Logs:
* **Ver logs generales en tiempo real:**
  ```bash
  sudo docker compose -f docker-compose.prod.yml logs -f --tail 100
  ```
* **Ver logs de un contenedor específico (Ej: backend):**
  ```bash
  sudo docker compose -f docker-compose.prod.yml logs -f backend
  ```

---

## 4. Matriz de Troubleshooting (Resolución de Conflictos)

### Error A: `volume "maisito_postgres_data" is declared as external, but could not be found`
* **Causa:** El volumen relacional no fue inicializado en el host de producción.
* **Solución:** Ejecutar `sudo docker volume create maisito_postgres_data` antes de arrancar los contenedores.

### Error B: `bind: address already in use` en puerto `5433` o `6380`
* **Causa:** Hay otra instancia de PostgreSQL o Redis instalada directamente sobre la máquina VPS (bare metal) bloqueando el puerto.
* **Solución:** Detener los servicios locales:
  ```bash
  sudo systemctl stop postgresql
  sudo systemctl disable postgresql
  ```

### Error C: La IA no responde o da mensaje de "Error al conectar con el servidor"
* **Causa:** El túnel base, el backend o Celery están caídos.
* **Solución:**
  1. Verificar el estado de los contenedores: `sudo docker ps`.
  2. Si el contenedor del backend está abajo, revisar los logs: `sudo docker compose -f docker-compose.prod.yml logs backend`.
  3. Si es un fallo de conexión a Redis, reiniciar la base de mensajes: `sudo docker compose -f docker-compose.prod.yml restart redis`.

### Error D: Límite de cuota excedido o error de API en el LLM
* **Causa:** El token del proveedor de la IA (`Groq`, `Gemini`, `DeepSeek`) superó su límite de llamadas gratuitas o la API Key ha expirado.
* **Solución:** Abrir el archivo `/home/ubuntu/opt/maisito/backend/.env`, introducir una API Key válida y reiniciar el backend:
  ```bash
  sudo docker compose -f docker-compose.prod.yml restart backend celery_worker
  ```

---
---

# 🧸 PARTE 2: Guía Sencilla (Casi para bobos)

Para entender cómo funciona el servidor sin ser informático, imagínate esto: la **VPS** es como un ordenador que tenemos alquilado en internet y que nunca se apaga (está encendido las 24 horas del día, los 365 días del año). 

En lugar de instalar los programas directamente como harías en tu ordenador de casa, usamos **Docker**. Imagina que Docker es un puerto de barcos donde cada programa (`Base de datos`, `FastAPI Backend`, `Maisito Chat`) está metido dentro de su propio **contenedor de mercancías metálico cerrado**. Ninguno molesta al otro y todos trabajan en equipo a través de cables invisibles.

---

## 1. El archivo de secretos y configuración (`.env`)
En la carpeta `/home/ubuntu/opt/maisito/backend/` hay un archivo de texto llamado `.env`. Este archivo es como la libreta de contraseñas de Maisito. Si alguna vez tienes que cambiar la clave de la IA o los dominios web autorizados, debes modificar este archivo.

* **GEMINI_API_KEY / GROQ_API_KEY**: Las contraseñas del proveedor que le da el cerebro a Maisito. Si la IA deja de responder de repente y dice que "no puede conectar con el servidor", es muy probable que tu clave de Groq o Gemini se haya caducado o haya alcanzado el límite. Tienes que meter una nueva clave aquí.
* **LLM_PROVIDER**: Aquí escribes qué IA quieres usar. Escribe `groq` o `gemini` según corresponda.

---

## 2. Cómo subir una actualización al servidor (Paso a Paso)

Si hemos hecho cambios en la oficina y queremos subirlos a la web de producción para que los clientes vean las mejoras:

1. **Empaquetar el código**: Genera el archivo comprimido `maisito.zip` (que tiene las carpetas `backend`, `frontend`, etc.).
2. **Subir el archivo**: Abre un programa de transferencia como **FileZilla**, conéctate al servidor con la IP `57.131.148.194` usando tus credenciales de acceso, y arrastra el archivo `maisito.zip` a la carpeta `/home/ubuntu/opt/maisito/`.
3. **Abrir la consola del servidor**: Conéctate al servidor mediante la consola negra (terminal) ejecutando en tu ordenador:
   ```bash
   ssh ubuntu@57.131.148.194
   ```
4. **Limpiar el código viejo**: Entra a la carpeta y borra los archivos viejos copiando y pegando este comando (y luego pulsa Enter):
   ```bash
   cd /home/ubuntu/opt/maisito && sudo rm -rf backend frontend docker docker-compose* README.md
   ```
5. **Descomprimir la actualización**: Extrae el contenido del zip copiando y pegando este comando:
   ```bash
   unzip maisito.zip && rm maisito.zip
   ```
6. **Aplicar los cambios**: Para que el ordenador de internet empiece a usar el nuevo código, ejecuta este comando:
   ```bash
   sudo docker compose -f docker-compose.prod.yml up -d --build backend celery_worker celery_beat
   ```
   *Esto apagará momentáneamente la versión anterior, leerá el nuevo código y encenderá la nueva versión en menos de un minuto.*

---

## 3. Recetario de Emergencia (¿Qué hago si algo falla?)

### Pregunta: "Maisito no responde a las preguntas en la web, se queda cargando"
* **Solución rápida:** Conéctate a la consola negra (paso 3 anterior) y escribe el siguiente comando para reiniciar la máquina del chat:
  ```bash
  cd /home/ubuntu/opt/maisito && sudo docker compose -f docker-compose.prod.yml restart backend celery_worker
  ```

### Pregunta: "Quiero ver qué está haciendo Maisito por dentro ahora mismo"
* **Solución rápida:** Escribe esto en la consola negra para ver pasar en directo lo que piensa el backend:
  ```bash
  cd /home/ubuntu/opt/maisito && sudo docker compose -f docker-compose.prod.yml logs -f backend
  ```
  *(Para salir de esa pantalla de texto y volver a escribir comandos normales, pulsa en tu teclado las teclas `Ctrl` + `C` a la vez).*
