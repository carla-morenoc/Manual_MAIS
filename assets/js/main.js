console.log("MAIN.JS VERSION NUEVA");

// Dynamically restructure layout for side-by-side text and images
document.addEventListener("DOMContentLoaded", function () {
    const images = document.querySelectorAll('main img:not(.img-location)');
    images.forEach(img => {
        if(img.parentElement && img.parentElement.classList.contains('content-image')) return;
        
        let block = img.closest('.doc-block');
        if (!block) {
            const row = document.createElement('div');
            row.className = 'content-row';
            
            const textDiv = document.createElement('div');
            textDiv.className = 'content-text';
            
            const imgDiv = document.createElement('div');
            imgDiv.className = 'content-image';
            
            const prevs = [];
            let prev = img.previousElementSibling;
            while(prev && prev.tagName !== 'IMG' && prev.tagName !== 'HR' && prev.tagName !== 'SECTION' && !prev.classList.contains('content-row')) {
                if(prev.tagName === 'H1' || prev.tagName === 'H2') break;
                if(prev.classList.contains('titulo-general')) break;
                prevs.unshift(prev);
                prev = prev.previousElementSibling;
            }
            
            if(prevs.length > 0) {
                img.parentNode.insertBefore(row, img);
                prevs.forEach(p => textDiv.appendChild(p));
                imgDiv.appendChild(img);
                
                // Let's also grab any following .tip or .button-group if they exist immediately after
                let next = row.nextElementSibling;
                while(next && (next.classList.contains('tip') || next.classList.contains('button-group') || next.classList.contains('nota'))) {
                    let toMove = next;
                    next = next.nextElementSibling;
                    textDiv.appendChild(toMove);
                }
                
                row.appendChild(textDiv);
                row.appendChild(imgDiv);
            }
        } else {
            if(!block.classList.contains('content-row')) {
                block.classList.add('content-row');
                
                const textDiv = document.createElement('div');
                textDiv.className = 'content-text';
                
                const imgDiv = document.createElement('div');
                imgDiv.className = 'content-image';
                
                Array.from(block.childNodes).forEach(node => {
                    if(node === img) {
                        imgDiv.appendChild(node);
                    } else if (node.nodeType === 1 && (node.classList.contains('button-group') || node.classList.contains('tip'))) {
                        textDiv.appendChild(node);
                    } else if (node.tagName !== 'SCRIPT') {
                        textDiv.appendChild(node);
                    }
                });
                
                block.innerHTML = '';
                block.appendChild(textDiv);
                block.appendChild(imgDiv);
            }
        }
    });

    // Setup scroll animations using IntersectionObserver
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15 // Trigger when 15% of the element is visible
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
            } else {
                // Remove the class when it leaves the viewport to animate it again next time
                entry.target.classList.remove('is-visible');
            }
        });
    }, observerOptions);

    // Select all elements that could potentially be animated
    const selectors = '.content-row, .doc-block, header, footer, .card, .section-title, .titulo-general, .status-text, h2, h3, h4, p, ul, ol, .tip, .nota, .button-group, .enlace-externo';
    const allElements = Array.from(document.querySelectorAll(selectors));

    // Filter out children of already animated containers to avoid double-animations
    const elementsToAnimate = allElements.filter(el => {
        // These are our main wrapper blocks. If an element IS one of these, we animate it.
        if (el.tagName === 'HEADER' || el.tagName === 'FOOTER' || el.classList.contains('content-row') || el.classList.contains('doc-block') || el.classList.contains('card')) {
            return true;
        }
        // If the element is INSIDE one of our main wrapper blocks, don't animate it individually.
        if (el.closest('.content-row') || el.closest('.doc-block') || el.closest('.card') || el.closest('header') || el.closest('footer')) {
            return false;
        }
        return true;
    });

    // Apply the fade-in-section class
    elementsToAnimate.forEach(el => {
        el.classList.add('fade-in-section');
        observer.observe(el);
    });

});

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