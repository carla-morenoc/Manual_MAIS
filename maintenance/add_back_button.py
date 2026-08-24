import os
import glob

html_files = glob.glob('pages/*.html')
button_html = """
<div style="margin-bottom: 20px; text-align: left;">
    <a href="inicio.html" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #0f3a68; font-weight: 600; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: background 0.2s, transform 0.2s;" onmouseover="this.style.background='#f8fafc'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#fff'; this.style.transform='none';">
        &#8592; Volver al Menú Principal
    </a>
</div>
"""

for file_path in html_files:
    if os.path.basename(file_path) == 'inicio.html':
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already added
    if "Volver al Menú Principal" in content:
        continue
        
    # Insert before <section class="documento">
    if '<section class="documento">' in content:
        content = content.replace('<section class="documento">', button_html + '\n<section class="documento">', 1)
    elif '<main>' in content:
        content = content.replace('<main>', '<main>\n' + button_html, 1)
    elif '<body>' in content:
        content = content.replace('<body>', '<body>\n' + button_html, 1)
        
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Boton añadido a los archivos HTML de pages/")
