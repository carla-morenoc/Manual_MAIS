import os
import glob

html_files = glob.glob('pages/*.html')

old_button = """<div style="margin-bottom: 20px; text-align: left;">
    <a href="inicio.html" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #0f3a68; font-weight: 600; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 10px 16px; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); transition: background 0.2s, transform 0.2s;" onmouseover="this.style.background='#f8fafc'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#fff'; this.style.transform='none';">
        &#8592; Volver al Menú Principal
    </a>
</div>"""

new_button = """<div style="margin-bottom: 20px; text-align: left;">
    <a href="inicio.html" style="display: inline-flex; align-items: center; gap: 8px; text-decoration: none; color: #fff; font-weight: 600; font-family: 'Segoe UI', Tahoma, sans-serif; padding: 10px 16px; background: #0f3a68; border: 1px solid #0f3a68; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transition: background 0.2s, transform 0.2s;" onmouseover="this.style.background='#2c5c92'; this.style.transform='translateY(-2px)';" onmouseout="this.style.background='#0f3a68'; this.style.transform='none';">
        &#8592; Volver al Menú Principal
    </a>
</div>"""

for file_path in html_files:
    if os.path.basename(file_path) == 'inicio.html':
        continue
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if old_button in content:
        content = content.replace(old_button, new_button)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)

print("Botón actualizado a color azul en todos los archivos HTML")
