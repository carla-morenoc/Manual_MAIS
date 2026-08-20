# Manual MAIS - Frontend y Chat Integrado de Maisito

Este repositorio contiene la versión web del **Manual de MAIS**, actualmente desplegada en el hosting de OVH. 

Incluye la interfaz web del asistente virtual **Maisito** (`maisia.html`), que permite a los clientes realizar consultas en lenguaje natural y visualizar la documentación de soporte de forma interactiva en la misma pantalla.

---

## 📂 Archivos Clave del Chat

### 1. `pages/maisia.html`
* **Layout de Pantalla Dividida (Split Screen):** Implementa un contenedor flexible (`#mainLayout`) que encierra el chat y el visor de archivos PDF (`#pdfViewerContainer`).
* **Estilos:** Define el diseño oscuro característico, las animaciones de transición cuando se despliega el visor y la estética de las "píldoras de cita" (`.citation-pill`).

### 2. `assets/js/maisia.js`
* **Conexión con el Servidor:** Realiza la petición POST a la API local de la IA a través del túnel fijo de Ngrok (`https://footing-jellied-glamorous.ngrok-free.dev`).
* **Formateador de Mensajes (`formatMessage`):** Convierte el texto plano del bot en HTML enriquecido (interpreta negritas `**`, párrafos y genera listas con viñetas o numeradas).
* **Controlador del Visor de PDF:**
  * Detecta referencias como `[archivo.pdf, pág. X]` y las convierte en botones clicables.
  * Al pulsar un botón, despliega el panel del visor y carga el PDF en la página exacta usando el endpoint `/file#page=X` del servidor.
  * Añade un parámetro temporal (`?t=Timestamp`) para evitar que el navegador cachee el iframe y obligarlo a saltar de página inmediatamente si el visor ya estaba abierto.
  * Gestiona los botones de navegación de página de la cabecera del visor.

### 3. `pages/inicio.html` y `pages/soportetecnico.html`
* Contienen el acceso a Maisito en el menú de navegación superior y el botón flotante en la esquina inferior derecha para invitar al usuario a chatear.

---

## ☁️ Despliegue en OVH (Puesta en Producción)
Cuando modifiques el diseño del chat o su Javascript localmente, debes subirlo al hosting de OVH para que los clientes vean los cambios:

1. Conéctate a tu servidor de OVH usando tu cliente de FTP favorito (**FileZilla**).
2. Navega hasta la carpeta correspondiente del servidor web.
3. Sube y sobrescribe únicamente los archivos que hayas cambiado (ej. `pages/maisia.html`, `assets/js/maisia.js` o `pages/inicio.html`).
4. **Importante:** Al probarlo en el navegador, recarga la página limpiando la caché (`Ctrl + F5`) para que el navegador descarte el Javascript antiguo y cargue los últimos cambios.

---

## 🔌 Conexión con el Servidor de IA
El chat estático en OVH se comunica con tu ordenador mediante el túnel de Ngrok. Para que el chat funcione en la web real:
* El ordenador que hace de "Servidor local" debe tener corriendo el backend de la IA y el túnel de Ngrok (`start_mais_ia.bat`).
* Si el túnel de Ngrok o el ordenador servidor se apagan, el chat en la web de OVH mostrará un mensaje indicando que no puede conectar con la IA en ese momento.
