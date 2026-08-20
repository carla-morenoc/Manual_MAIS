document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const mainLayout = document.getElementById("mainLayout");
    const pdfViewerContainer = document.getElementById("pdfViewerContainer");
    const pdfFrame = document.getElementById("pdfFrame");
    const pdfTitle = document.getElementById("pdfTitle");
    const closePdfBtn = document.getElementById("closePdfBtn");
    
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    const BASE_URL = 'https://footing-jellied-glamorous.ngrok-free.dev';

    // Variables de estado del visor de PDF
    let currentViewerDocId = null;
    let currentViewerFilename = "";
    let currentViewerPage = 1;

    function addMessage(text, sender, sources = []) {
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
        
        if (sender === "bot") {
            contentDiv.innerHTML = formatMessage(text, sources);
        } else {
            contentDiv.textContent = text;
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);
        scrollToBottom();
    }

    // Formatear texto del bot en HTML estructurado (Párrafos, Negritas, Listas y Citas)
    function formatMessage(text, sources) {
        if (!text) return "";

        const normalizeName = (n) => n.toLowerCase().replace(/[\+_\s]/g, "");

        // 1. Convertir negritas: **texto** -> <strong>texto</strong>
        let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        // 2. Convertir saltos de línea y listas (- / * / 1.)
        const lines = formatted.split('\n');
        let inList = false;
        let listType = null;
        let processedLines = [];

        lines.forEach(line => {
            const trimmed = line.trim();
            const bulletMatch = /^[-*]\s(.*)/.exec(trimmed);
            const numberMatch = /^\d+\.\s(.*)/.exec(trimmed);

            if (bulletMatch) {
                if (!inList || listType !== 'ul') {
                    if (inList) processedLines.push(`</${listType}>`);
                    processedLines.push('<ul class="chat-list">');
                    inList = true;
                    listType = 'ul';
                }
                processedLines.push(`<li>${bulletMatch[1]}</li>`);
            } else if (numberMatch) {
                if (!inList || listType !== 'ol') {
                    if (inList) processedLines.push(`</${listType}>`);
                    processedLines.push('<ol class="chat-list">');
                    inList = true;
                    listType = 'ol';
                }
                processedLines.push(`<li>${numberMatch[1]}</li>`);
            } else {
                if (inList) {
                    processedLines.push(`</${listType}>`);
                    inList = false;
                    listType = null;
                }
                if (trimmed) {
                    processedLines.push(`<p class="chat-paragraph">${trimmed}</p>`);
                }
            }
        });
        
        if (inList) {
            processedLines.push(`</${listType}>`);
        }

        formatted = processedLines.join('\n');

        // 3. Convertir citas [archivo.pdf, pág. X] en botones interactivos
        const citationRegex = /\[([^\]]+?\.pdf)(?:[,\s]*(?:pág|pag|página|pagina|p)\.?\s*(\d+))?\]/gi;
        formatted = formatted.replace(citationRegex, (match, filename, pageStr) => {
            const pageNumber = pageStr ? parseInt(pageStr, 10) : 1;
            
            // Buscar docId correspondiente en las fuentes
            let matchingSource = sources?.find(
                (src) => src.filename.toLowerCase() === filename.toLowerCase()
            );

            if (!matchingSource) {
                const normCitation = normalizeName(filename);
                matchingSource = sources?.find((src) => {
                    const normSrc = normalizeName(src.filename);
                    return normSrc === normCitation || normSrc.includes(normCitation) || normCitation.includes(normSrc);
                });
            }

            if (!matchingSource && sources && sources.length > 0) {
                matchingSource = sources[0];
            }

            if (matchingSource) {
                const docId = matchingSource.doc_id;
                return `<button class="citation-pill" data-doc-id="${docId}" data-filename="${matchingSource.filename}" data-page="${pageNumber}"><i class="fa-solid fa-file-pdf"></i> ${match}</button>`;
            }

            return match;
        });

        return formatted;
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
            const response = await fetch(`${BASE_URL}/api/v1/chat/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify({
                    query: texto,
                    document_ids: []
                })
            });

            if (!response.ok) {
                console.error("Error en la respuesta del servidor:", response.statusText);
                return { answer: "Lo siento, ha ocurrido un error al conectar con el servidor de Maisito.", sources: [] };
            }

            const data = await response.json();
            return { answer: data.answer, sources: data.sources || [] };
        } catch (error) {
            console.error("Error de conexión:", error);
            return { 
                answer: "Lo siento, no puedo conectar con el servidor en este momento. Verifica que la API y el túnel de Ngrok estén corriendo.", 
                sources: [] 
            };
        }
    }

    // Abrir visor de PDF
    function openPdfViewer(docId, filename, page) {
        currentViewerDocId = docId;
        currentViewerFilename = filename;
        currentViewerPage = parseInt(page, 10) || 1;

        pdfTitle.innerHTML = `<i class="fa-solid fa-file-pdf"></i> ${filename}`;
        pageIndicator.textContent = `Pág. ${currentViewerPage}`;
        
        // Hacemos que se cargue la URL limpia con parámetros para ocultar la barra por defecto del navegador (toolbar=0)
        // Usamos un timestamp (?t=...) para obligar al navegador a recargar y aplicar el salto de página si ya estaba cargado
        pdfFrame.src = `${BASE_URL}/api/v1/documents/${docId}/file?t=${Date.now()}#page=${currentViewerPage}&toolbar=0&navpanes=0&view=FitH`;
        
        mainLayout.classList.add("pdf-open");
    }

    // Navegar páginas en el visor de PDF
    function navigatePdfPage(direction) {
        if (!currentViewerDocId) return;

        let newPage = currentViewerPage + direction;
        if (newPage < 1) newPage = 1;

        currentViewerPage = newPage;
        pageIndicator.textContent = `Pág. ${currentViewerPage}`;
        
        // Forzar recarga con el nuevo hash de página
        pdfFrame.src = `${BASE_URL}/api/v1/documents/${currentViewerDocId}/file?t=${Date.now()}#page=${currentViewerPage}&toolbar=0&navpanes=0&view=FitH`;
    }

    // Cerrar visor de PDF
    function closePdfViewer() {
        mainLayout.classList.remove("pdf-open");
        pdfFrame.src = "";
        currentViewerDocId = null;
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text) return;

        userInput.value = "";
        userInput.focus();
        addMessage(text, "user");

        showTypingIndicator();

        // Obtener respuesta del backend de la IA con fuentes
        const dataRespuesta = await enviarMensajeAegis(text);

        removeTypingIndicator();
        addMessage(dataRespuesta.answer, "bot", dataRespuesta.sources);
    }

    // Eventos
    sendBtn.addEventListener("click", handleSend);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    });

    // Detectar clics en píldoras de cita mediante delegación de eventos
    chatMessages.addEventListener("click", (e) => {
        const pill = e.target.closest(".citation-pill");
        if (pill) {
            const docId = pill.getAttribute("data-doc-id");
            const filename = pill.getAttribute("data-filename");
            const page = pill.getAttribute("data-page");
            openPdfViewer(docId, filename, page);
        }
    });

    closePdfBtn.addEventListener("click", closePdfViewer);
    
    // Eventos de controles de página del visor de PDF
    prevPageBtn.addEventListener("click", () => navigatePdfPage(-1));
    nextPageBtn.addEventListener("click", () => navigatePdfPage(1));
});
