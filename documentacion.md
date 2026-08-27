# 📚 Documentación del Manual MAIS — En lenguaje humano

> **Para quién es esto:** Cualquier persona del equipo, aunque no sepa nada de informática. Aquí se explica qué hace cada cosa, por qué existe y cómo todo encaja.

---

## ¿Qué es el Manual MAIS?

Es una **página web corporativa** hecha con HTML puro que sirve como guía de uso del software de gestión MAIS. Cualquier usuario del sistema puede abrirla en el navegador y aprender a usar MAIS sin necesidad de llamar a soporte.

---

## ¿Qué contiene?

El sitio tiene un **menú principal** (`inicio.html`) desde el que se accede a todas las secciones:

### Acceso y Primeros Pasos
- **Cómo entrar en MAIS** (`uso.html`): Los pasos para iniciar sesión y orientarse en el sistema.
- **Panel de Inicio**: Explicación del panel principal, desde dónde se accede a clientes, artículos y documentos.
- **Menús Adicionales**: Herramientas avanzadas como maestros, informes y copias de seguridad.

### Gestión y Facturación
- **Abonos y Documentos Rectificativos** (`abonosyrectificativos.html`): Cómo corregir una factura o hacer una devolución sin liar la contabilidad.
- **Control de Caja** (`caja.html`): Gestión del efectivo diario, arqueos y cierres de jornada.
- **Documentos** (`documentos.html`): Facturas, albaranes, presupuestos...
- **Clientes y Proveedores** (`clientes.html`): Alta, consulta y gestión de entidades.
- **Artículos** (`articulos.html`): Catálogo de productos y servicios.

### Contabilidad y Obligaciones
- **Gestión Contable** (`contabilidad.html`): Conceptos contables del día a día.
- **Cierre de Año**: Cómo cerrar el ejercicio contable sin que nada se descuadre.

### Recursos y Soporte
- **Videotutoriales**: Enlace al canal de YouTube oficial de MAIS.
- **Manuales PDF descargables**: PDFs del manual, apuntes básicos, albarán-a-factura, presupuesto-a-factura y cierre contable.
- **Contacto técnico**: Teléfono y email del equipo de soporte.

### Maisito (`maisia.html`)
Un acceso directo al asistente de IA Maisito. Hay un botón flotante en todas las páginas que dice *"¿Tienes alguna duda? Habla con Maisito"*.

---

## ¿Cómo está estructurado técnicamente?

```
Manual_MAIS-index/
├── index.html              ← Portada (redirige a inicio.html)
├── pages/                  ← Una página por sección
│   ├── inicio.html         ← Menú principal
│   ├── uso.html
│   ├── clientes.html
│   ├── articulos.html
│   ├── documentos.html
│   ├── abonosyrectificativos.html
│   ├── caja.html
│   ├── contabilidad.html
│   ├── maestros.html
│   ├── listados.html
│   ├── copiasSeguridad.html
│   ├── tutoriales.html
│   └── maisia.html         ← Pantalla del chat con Maisito
├── assets/
│   ├── css/site.css        ← El diseño visual de todo el sitio
│   ├── js/main.js          ← Pequeñas animaciones e interacciones
│   └── images/             ← Capturas de pantalla del software MAIS
└── BACKEND/                ← Dos scripts PHP para leer/guardar datos de empresa
```

- **HTML**: La estructura de cada página (textos, botones, imágenes).
- **CSS** (`site.css`): El aspecto visual: colores, tipografías, tarjetas, botones.
- **JavaScript** (`main.js`): Pequeñas interacciones: menús desplegables, animaciones al hacer scroll, el chat con Maisito.
- **PHP** (`BACKEND/`): Dos scripts pequeños para obtener y guardar datos de la empresa desde el sistema MAIS.

---

*Documentación generada el 26/08/2026 — Manual MAIS v2.0*
