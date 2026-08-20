document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");

    // Respuestas predefinidas (Stub temporal hasta integrar la API de Aegis)
    const respuestasAegis = [
        "Esa es una buena pregunta. En MAIS, puedes gestionar ese apartado desde el panel de Mantenimiento.",
        "Para realizar esa acción, asegúrate de haber rellenado los campos obligatorios marcados con asterisco.",
        "Te recomiendo consultar el apartado de 'Clientes y Proveedores' en el manual para ver el paso a paso detallado.",
        "Esa función está disponible en el menú de Contabilidad > Asientos.",
        "No te preocupes, si te has equivocado puedes generar un documento rectificativo o abonar la factura.",
        "Actualmente MAIS_IA está en fase de pruebas visuales. ¡Pronto estaré conectado al motor de Aegis para darte respuestas precisas!"
    ];

    function addMessage(text, sender) {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");
        if (sender === "bot") {
            avatarDiv.innerHTML = '<i class="fa-solid fa-robot"></i>';
        } else {
            avatarDiv.innerHTML = '<i class="fa-solid fa-user"></i>';
        }

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("message-content");
        contentDiv.textContent = text;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function showTypingIndicator() {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", "bot");
        messageDiv.id = "typingIndicator";

        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");
        avatarDiv.innerHTML = '<i class="fa-solid fa-robot"></i>';

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("message-content", "typing-indicator");
        contentDiv.innerHTML = '<div class="dot"></div><div class="dot"></div><div class="dot"></div>';

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        
        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    function removeTypingIndicator() {
        const indicator = document.getElementById("typingIndicator");
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function enviarMensajeAegis(texto) {
        try {
            const response = await fetch('https://api-mais-ia.loca.lt/api/v1/chat/query', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: texto,
                    document_ids: []
                })
            });

            if (!response.ok) {
                console.error("Error en la respuesta del servidor:", response.statusText);
                return "Lo siento, ha ocurrido un error al conectar con el servidor de MAIS_IA.";
            }

            const data = await response.json();
            return data.answer;
        } catch (error) {
            console.error("Error de conexión:", error);
            return "Lo siento, no puedo conectar con el servidor en este momento. Verifica que la API local esté corriendo en el puerto 8000.";
        }
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        // Limpiar input y mostrar mensaje del usuario
        userInput.value = "";
        userInput.focus();
        addMessage(text, "user");

        // Mostrar indicador de "escribiendo..."
        showTypingIndicator();

        // Obtener respuesta de la IA
        const respuesta = await enviarMensajeAegis(text);

        // Quitar indicador y mostrar respuesta
        removeTypingIndicator();
        addMessage(respuesta, "bot");
    }

    sendBtn.addEventListener("click", handleSend);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    });
});
