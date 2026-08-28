document.addEventListener("DOMContentLoaded", () => {
    const chatMessages = document.getElementById("chatMessages");
    const userInput = document.getElementById("userInput");
    const sendBtn = document.getElementById("sendBtn");
    const newChatBtn = document.getElementById("newChatBtn");
    const mainLayout = document.getElementById("mainLayout");
    const pdfViewerContainer = document.getElementById("pdfViewerContainer");
    const pdfFrame = document.getElementById("pdfFrame");
    const pdfTitle = document.getElementById("pdfTitle");
    const closePdfBtn = document.getElementById("closePdfBtn");
    
    const prevPageBtn = document.getElementById("prevPageBtn");
    const nextPageBtn = document.getElementById("nextPageBtn");
    const pageIndicator = document.getElementById("pageIndicator");

    const BASE_URL = 'https://formacion.mais.es';
    const WELCOME_MESSAGE = '¡Hola! Soy <strong>Maisito</strong>, tu asistente de MAIS. Estoy aquí para ayudarte a resolver cualquier duda sobre nuestro sistema de gestión ERP. ¿En qué te puedo ayudar hoy?';

    // Variables de estado del visor de PDF
    let currentViewerDocId = null;
    let currentViewerFilename = "";
    let currentViewerPage = 1;
    let currentBlobUrl = null;

    let isSending = false;
    let abortController = null;

    // --- GESTIÓN DE SESIÓN E HISTORIAL PERSISTENTE ---
    function generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9);
    }

    function getOrCreateSessionId() {
        let sid = localStorage.getItem("maisia_session_id");
        if (!sid) {
            sid = generateSessionId();
            localStorage.setItem("maisia_session_id", sid);
        }
        return sid;
    }

    let currentSessionId = getOrCreateSessionId();

    function getSessionHistory(sessionId) {
        try {
            const raw = localStorage.getItem(`maisia_history_${sessionId}`);
            return raw ? JSON.parse(raw) : null;
        } catch (e) {
            console.error("Error al recuperar el historial:", e);
            return null;
        }
    }

    function saveSessionHistory(sessionId, historyList) {
        try {
            localStorage.setItem(`maisia_history_${sessionId}`, JSON.stringify(historyList));
        } catch (e) {
            console.error("Error al guardar el historial:", e);
        }
    }

    function addMessageToDOM(text, sender, sources = [], status = 'ok') {
        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", sender);

        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");
        if (sender === "bot") {
            const avatarImg = status === 'error' ? 'maisito_llorando.jfif' : 'maisito_feliz.jfif';
            avatarDiv.innerHTML = `<img src="../assets/images/${avatarImg}" alt="Maisito" class="bot-avatar-img">`;
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

    function addMessage(text, sender, sources = [], saveToHistory = true, status = 'ok') {
        addMessageToDOM(text, sender, sources, status);

        if (saveToHistory) {
            let history = getSessionHistory(currentSessionId) || [];
            history.push({ text, sender, sources, status, timestamp: Date.now() });
            saveSessionHistory(currentSessionId, history);
        }
    }

    function loadSavedChat() {
        chatMessages.innerHTML = "";
        let history = getSessionHistory(currentSessionId);
        if (history && history.length > 0) {
            history.forEach(msg => {
                addMessageToDOM(msg.text, msg.sender, msg.sources || [], msg.status || 'ok');
            });
            if (history.length === 1 && history[0].sender === "bot") {
                renderFAQs();
            }
        } else {
            // Inicializar mensaje de bienvenida si la sesión es nueva
            addMessageToDOM(WELCOME_MESSAGE, "bot", [], "ok");
            saveSessionHistory(currentSessionId, [{
                text: WELCOME_MESSAGE,
                sender: "bot",
                sources: [],
                status: "ok",
                timestamp: Date.now()
            }]);
            renderFAQs();
        }
    }

    function startNewChat() {
        if (abortController) {
            abortController.abort();
            abortController = null;
        }
        isSending = false;
        removeTypingIndicator();

        currentSessionId = generateSessionId();
        localStorage.setItem("maisia_session_id", currentSessionId);
        closePdfViewer();
        chatMessages.innerHTML = "";
        addMessageToDOM(WELCOME_MESSAGE, "bot", [], "ok");
        saveSessionHistory(currentSessionId, [{
            text: WELCOME_MESSAGE,
            sender: "bot",
            sources: [],
            status: "ok",
            timestamp: Date.now()
        }]);
        renderFAQs();
        if (userInput) {
            userInput.value = "";
            userInput.disabled = false;
            userInput.focus();
        }
        if (sendBtn) {
            sendBtn.disabled = false;
        }
    }

    const FALLBACK_FAQS = [
        { text: "¿Cómo realizo el cierre de ejercicio contable?", desc: "Procedimientos de cierre y apertura de la contabilidad." },
        { text: "¿Qué requisitos tiene la Ley de Fraude Fiscal / Veri*factu?", desc: "Cambios en series, firmas digitales y firmas de registros." },
        { text: "¿Cómo hago una copia de seguridad interna?", desc: "Resguardar la base de datos de la empresa de forma local." },
        { text: "¿Cómo configuro el límite de registros en los GRID?", desc: "Optimizar la visualización de registros en las rejillas." }
    ];

    async function renderFAQs() {
        let faqs = FALLBACK_FAQS;
        try {
            const res = await fetch(`${BASE_URL}/api/v1/chat/popular-questions`, {
                headers: {
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    faqs = data;
                }
            }
        } catch(e) {
            console.warn("Fallo al cargar FAQs dinámicas, usando fallback", e);
        }

        const faqContainer = document.createElement("div");
        faqContainer.id = "faqContainer";
        faqContainer.style.display = "grid";
        faqContainer.style.gridTemplateColumns = "repeat(2, 1fr)";
        faqContainer.style.gap = "15px";
        faqContainer.style.margin = "20px auto 0 auto";
        faqContainer.style.padding = "0 10px";
        faqContainer.style.maxWidth = "700px";

        faqs.forEach(faq => {
            const btn = document.createElement("button");
            btn.className = "faq-card";
            btn.style.background = "#1a1a1a";
            btn.style.border = "1px solid #333";
            btn.style.borderRadius = "12px";
            btn.style.padding = "20px 15px";
            btn.style.minHeight = "110px";
            btn.style.textAlign = "left";
            btn.style.cursor = "pointer";
            btn.style.transition = "all 0.2s";
            btn.style.display = "flex";
            btn.style.flexDirection = "column";
            btn.style.gap = "5px";

            btn.onmouseover = () => { btn.style.borderColor = "var(--accent)"; btn.style.background = "#222"; };
            btn.onmouseout = () => { btn.style.borderColor = "#333"; btn.style.background = "#1a1a1a"; };

            btn.innerHTML = `
                <span style="color: var(--accent); font-size: 0.8rem; font-weight: 600;"><i class="fa-solid fa-lightbulb"></i> Pregunta sugerida</span>
                <span style="color: #fff; font-size: 0.95rem; font-weight: 500; line-height: 1.3;">${faq.text}</span>
                <span style="color: #888; font-size: 0.8rem;">${faq.desc}</span>
            `;

            btn.onclick = () => {
                removeFAQs();
                userInput.value = faq.text;
                handleSend();
            };

            faqContainer.appendChild(btn);
        });

        chatMessages.appendChild(faqContainer);
        scrollToBottom();
    }

    function removeFAQs() {
        const c = document.getElementById("faqContainer");
        if (c) c.remove();
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

        // Helper para convertir marcas de tiempo ("1:52:38", "52:38", "112") a segundos enteros
        function parseTimeToSeconds(timeStr) {
            if (!timeStr) return 0;
            timeStr = timeStr.trim();
            if (/^\d+$/.test(timeStr)) {
                return parseInt(timeStr, 10);
            }
            const parts = timeStr.split(':').map(p => parseInt(p, 10));
            if (parts.some(isNaN)) return 0;
            if (parts.length === 3) {
                return parts[0] * 3600 + parts[1] * 60 + parts[2];
            } else if (parts.length === 2) {
                return parts[0] * 60 + parts[1];
            }
            return 0;
        }

        // 4. Convertir citas [Video: Nombre, seg. 1:52:38] o [Video: Nombre, 52:38] en botones interactivos de YouTube
        const youtubeCitationRegex = /\[Video:\s*(.+?)(?:[,\s]*(?:seg|segundo|min|m|s)?\.?\s*([\d:]+))?\]/gi;
        formatted = formatted.replace(youtubeCitationRegex, (match, videoTitle, timeStr) => {
            const seconds = parseTimeToSeconds(timeStr);
            
            let matchingSource = sources?.find(
                (src) => (src.type === 'youtube' || src.video_id) && src.filename?.toLowerCase().includes(videoTitle.toLowerCase())
            );

            if (!matchingSource) {
                matchingSource = sources?.find((src) => src.type === 'youtube' || src.video_id);
            }

            let videoId = matchingSource?.video_id;
            if (!videoId) {
                const titleLower = videoTitle.toLowerCase();
                if (titleLower.includes("veri*factu") || titleLower.includes("verifactu") || titleLower.includes("fedeto") || titleLower.includes("cierre")) {
                    videoId = "AUuVkLnTBFI";
                } else if (titleLower.includes("contabilidad") || titleLower.includes("conceptos")) {
                    videoId = "JLAEdpaOQrc";
                } else {
                    videoId = "AUuVkLnTBFI"; // Fallback por defecto a video corporativo MAIS
                }
            }

            return `<button class="citation-pill youtube-pill" data-type="youtube" data-video-id="${videoId}" data-seconds="${seconds}"><i class="fa-brands fa-youtube"></i> ${match}</button>`;
        });

        return formatted;
    }

    let typingStatusInterval = null;

    function showTypingIndicator() {
        if (typingStatusInterval) {
            clearInterval(typingStatusInterval);
            typingStatusInterval = null;
        }

        const messageDiv = document.createElement("div");
        messageDiv.classList.add("message", "bot");
        messageDiv.id = "typingIndicator";

        const avatarDiv = document.createElement("div");
        avatarDiv.classList.add("avatar");
        avatarDiv.innerHTML = '<img src="../assets/images/maisito_pensando.jpg" alt="Maisito" class="bot-avatar-img">';

        const contentDiv = document.createElement("div");
        contentDiv.classList.add("message-content", "typing-indicator");
        contentDiv.innerHTML = `
            <div class="dots-wrapper" style="display: inline-flex; gap: 6px; align-items: center;">
                <div class="dot"></div><div class="dot"></div><div class="dot"></div>
            </div>
            <span id="typingStatusText" style="font-size: 0.88rem; color: var(--text-light); margin-left: 10px; transition: opacity 0.3s ease; display: inline-block;">Maisito está pensando...</span>
        `;

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);

        chatMessages.appendChild(messageDiv);
        scrollToBottom();

        const messages = [
            "Pensando...",
            "Buscando en la documentación de MAIS...",
            "Analizando manuales y tutoriales...",
            "La respuesta puede tardar unos 30 segundos...",
            "Generando la respuesta...",
            "Casi listo..."
        ];

        let index = 0;
        typingStatusInterval = setInterval(() => {
            const statusSpan = document.getElementById("typingStatusText");
            if (statusSpan) {
                statusSpan.style.opacity = "0";
                setTimeout(() => {
                    if (statusSpan) {
                        index = (index + 1) % messages.length;
                        statusSpan.textContent = messages[index];
                        statusSpan.style.opacity = "1";
                    }
                }, 250);
            }
        }, 4000);
    }

    function removeTypingIndicator() {
        if (typingStatusInterval) {
            clearInterval(typingStatusInterval);
            typingStatusInterval = null;
        }
        const indicator = document.getElementById("typingIndicator");
        if (indicator) {
            indicator.remove();
        }
    }

    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    async function enviarMensajeAegis(texto, signal) {
        const payload = {
            query: texto,
            pregunta: texto,
            session_id: currentSessionId,
            document_ids: []
        };

        try {
            // Intentar túnel / API Aegis
            const response = await fetch(`${BASE_URL}/api/v1/chat/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Bypass-Tunnel-Reminder': 'true',
                    'ngrok-skip-browser-warning': 'true'
                },
                body: JSON.stringify(payload),
                signal: signal
            });

            if (response.ok) {
                const data = await response.json();
                const rawAnswer = data.answer || data.respuesta || "";
                if (rawAnswer.includes("Error interno en la generación") || rawAnswer.includes("Error interno en")) {
                    return { 
                        answer: "Lo siento, no puedo conectar con el servidor en este momento. Por favor, contacta con el servicio técnico de MAIS.", 
                        sources: [], 
                        status: 'error' 
                    };
                }
                return { answer: rawAnswer, sources: data.sources || [], status: 'ok' };
            }

            // Fallback a servidor local Flask si está corriendo en http://localhost:5000/chat
            try {
                const localRes = await fetch('http://localhost:5000/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: signal
                });
                if (localRes.ok) {
                    const localData = await localRes.json();
                    return { answer: localData.respuesta || localData.answer, sources: localData.sources || [], status: 'ok' };
                }
            } catch (localErr) {
                console.warn("No se pudo conectar al endpoint local de Flask:", localErr);
            }

            console.error("Error en la respuesta del servidor:", response.statusText);
            return { answer: "Lo siento, ha ocurrido un error al conectar con el servidor. Por favor, contacta con el servicio técnico.", sources: [], status: 'error' };
        } catch (error) {
            // Si el error fue por cancelación, propagarlo
            if (error.name === 'AbortError') {
                throw error;
            }
            // Si el túnel ngrok falla, probar endpoint local de Flask
            try {
                const localRes = await fetch('http://localhost:5000/chat', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: signal
                });
                if (localRes.ok) {
                    const localData = await localRes.json();
                    return { answer: localData.respuesta || localData.answer, sources: localData.sources || [], status: 'ok' };
                }
            } catch (localErr) {
                // Propagar AbortError si fue cancelado aquí también
                if (localErr.name === 'AbortError') {
                    throw localErr;
                }
                console.warn("No se pudo conectar al servidor local tras fallo del túnel:", localErr);
            }

            console.error("Error de conexión:", error);
            return { 
                answer: "Lo siento, no puedo conectar con el servidor en este momento. Por favor, contacta con el servicio técnico de MAIS.", 
                sources: [], 
                status: 'error'
            };
        }
    }

    // Abrir visor de YouTube
    function openYoutubeViewer(videoId, seconds) {
        const youtubeFrame = document.getElementById("youtubeFrame");
        const pdfFrame = document.getElementById("pdfFrame");
        const pdfControls = document.querySelector(".pdf-page-controls");

        pdfFrame.style.display = "none";
        if (pdfControls) pdfControls.style.display = "none";
        
        youtubeFrame.style.display = "block";
        pdfTitle.innerHTML = `<i class="fa-brands fa-youtube" style="color: #ff0000; margin-right: 6px;"></i> Videotutorial`;
        youtubeFrame.src = `https://www.youtube.com/embed/${videoId}?start=${seconds}&autoplay=1`;
        mainLayout.classList.add("pdf-open");
    }

    // Abrir visor de PDF
    async function openPdfViewer(docId, filename, page) {
        currentViewerDocId = docId;
        currentViewerFilename = filename;
        currentViewerPage = parseInt(page, 10) || 1;

        const youtubeFrame = document.getElementById("youtubeFrame");
        if (youtubeFrame) {
            youtubeFrame.style.display = "none";
            youtubeFrame.src = "";
        }

        const pdfControls = document.querySelector(".pdf-page-controls");
        if (pdfControls) pdfControls.style.display = "flex";
        pdfFrame.style.display = "block";

        pdfTitle.innerHTML = `<i class="fa-solid fa-file-pdf"></i> Cargando ${filename}...`;
        pageIndicator.textContent = `Pág. ${currentViewerPage}`;
        mainLayout.classList.add("pdf-open");
        pdfFrame.src = "";

        try {
            if (currentBlobUrl) {
                URL.revokeObjectURL(currentBlobUrl);
                currentBlobUrl = null;
            }

            const response = await fetch(`${BASE_URL}/api/v1/documents/${docId}/file`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'Bypass-Tunnel-Reminder': 'true'
                }
            });

            if (!response.ok) {
                throw new Error("No se pudo obtener el PDF");
            }

            const blob = await response.blob();
            const pdfBlob = new Blob([blob], { type: 'application/pdf' });
            currentBlobUrl = URL.createObjectURL(pdfBlob);

            pdfTitle.innerHTML = `<i class="fa-solid fa-file-pdf"></i> ${filename}`;
            pdfFrame.src = `${currentBlobUrl}#page=${currentViewerPage}&toolbar=0&navpanes=0&view=FitH`;
        } catch (error) {
            console.error("Error al cargar PDF:", error);
            pdfTitle.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Error al cargar ${filename}`;
        }
    }

    // Navegar páginas en el visor de PDF
    function navigatePdfPage(direction) {
        if (!currentViewerDocId) return;

        let newPage = currentViewerPage + direction;
        if (newPage < 1) newPage = 1;

        currentViewerPage = newPage;
        pageIndicator.textContent = `Pág. ${currentViewerPage}`;
        
        if (currentBlobUrl) {
            pdfFrame.src = `${currentBlobUrl}#page=${currentViewerPage}&toolbar=0&navpanes=0&view=FitH`;
        }
    }

    // Cerrar visor de PDF / Medios
    function closePdfViewer() {
        mainLayout.classList.remove("pdf-open");
        pdfFrame.src = "";
        
        const youtubeFrame = document.getElementById("youtubeFrame");
        if (youtubeFrame) {
            youtubeFrame.style.display = "none";
            youtubeFrame.src = "";
        }
        
        currentViewerDocId = null;
        if (currentBlobUrl) {
            URL.revokeObjectURL(currentBlobUrl);
            currentBlobUrl = null;
        }
    }

    async function handleSend() {
        const text = userInput.value.trim();
        if (!text || isSending) return;

        isSending = true;
        const sendingSessionId = currentSessionId;

        // Deshabilitar input y botón de enviar
        if (userInput) userInput.disabled = true;
        if (sendBtn) sendBtn.disabled = true;

        removeFAQs(); // Remove FAQs when user types something

        userInput.value = "";
        addMessage(text, "user", [], true);

        showTypingIndicator();

        if (abortController) {
            abortController.abort();
        }
        abortController = new AbortController();

        try {
            // Obtener respuesta del backend de la IA con fuentes
            const dataRespuesta = await enviarMensajeAegis(text, abortController.signal);

            if (currentSessionId !== sendingSessionId) return;

            removeTypingIndicator();
            addMessage(dataRespuesta.answer, "bot", dataRespuesta.sources, true, dataRespuesta.status || 'ok');
        } catch (error) {
            if (error.name === 'AbortError') return;
            
            if (currentSessionId === sendingSessionId) {
                removeTypingIndicator();
                addMessage("Lo siento, ha ocurrido un error al conectar con el servidor. Por favor, contacta con el servicio técnico.", "bot", [], true, 'error');
            }
        } finally {
            if (currentSessionId === sendingSessionId) {
                isSending = false;
                abortController = null;
                if (userInput) {
                    userInput.disabled = false;
                    userInput.focus();
                }
                if (sendBtn) {
                    sendBtn.disabled = false;
                }
            }
        }
    }

    // Eventos
    sendBtn.addEventListener("click", handleSend);
    userInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            handleSend();
        }
    });

    if (newChatBtn) {
        newChatBtn.addEventListener("click", startNewChat);
    }

    // Detectar clics en píldoras de cita mediante delegación de eventos
    chatMessages.addEventListener("click", (e) => {
        const pill = e.target.closest(".citation-pill");
        if (pill) {
            const type = pill.getAttribute("data-type") || "pdf";
            if (type === "youtube") {
                const videoId = pill.getAttribute("data-video-id");
                const seconds = pill.getAttribute("data-seconds");
                openYoutubeViewer(videoId, seconds);
            } else {
                const docId = pill.getAttribute("data-doc-id");
                const filename = pill.getAttribute("data-filename");
                const page = pill.getAttribute("data-page");
                openPdfViewer(docId, filename, page);
            }
        }
    });

    closePdfBtn.addEventListener("click", closePdfViewer);
    
    // Eventos de controles de página del visor de PDF
    prevPageBtn.addEventListener("click", () => navigatePdfPage(-1));
    nextPageBtn.addEventListener("click", () => navigatePdfPage(1));

    // Cargar el historial al iniciar la interfaz
    loadSavedChat();
});
