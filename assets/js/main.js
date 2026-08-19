console.log("MAIN.JS VERSION NUEVA");

document.addEventListener("DOMContentLoaded", function () {

    const chatBtn = document.getElementById("chatBtn");
    const chatWindow = document.getElementById("chatWindow");
    const closeChat = document.getElementById("closeChat");
    const sendBtn = document.getElementById("sendBtn");
    const userInput = document.getElementById("userInput");
    const chatMessages = document.getElementById("chatMessages");

    if (!chatBtn || !chatWindow || !closeChat || !sendBtn || !userInput || !chatMessages) {
        console.error("Faltan elementos del chat");
        return;
    }

    // Abrir / cerrar chat
    chatBtn.addEventListener("click", () => {

        //console.log("BOTON PULSADO");

        chatWindow.classList.toggle("hidden");

    });

    closeChat.addEventListener("click", () => {

        chatWindow.classList.add("hidden");

    });

    // Añadir mensajes
    function addMessage(text, clase) {

        const div = document.createElement("div");

        div.className = clase + "-msg";

        div.textContent = text;

        chatMessages.appendChild(div);

        chatMessages.scrollTop = chatMessages.scrollHeight;

    }

    // Enviar pregunta
    async function enviarPregunta() {

        const pregunta = userInput.value.trim();

        if (!pregunta) return;

        addMessage(pregunta, "user");

        userInput.value = "";

        addMessage("Pensando...", "bot");

        try {

            const r = await fetch("http://localhost:5000/chat", {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    pregunta: pregunta
                })

            });

            if (!r.ok) {
                throw new Error("HTTP " + r.status);
            }

            const datos = await r.json();

            if (chatMessages.lastElementChild) {
                chatMessages.lastElementChild.remove();
            }

            addMessage(datos.respuesta, "bot");

        } catch (e) {

            if (chatMessages.lastElementChild) {
                chatMessages.lastElementChild.remove();
            }

            addMessage("❌ Error conectando con la IA.", "bot");

            console.error(e);

        }

    }

    sendBtn.addEventListener("click", enviarPregunta);

    userInput.addEventListener("keydown", function (e) {

        if (e.key === "Enter") {

            enviarPregunta();

        }

    });

});