from pathlib import Path
import re
root = Path(r'c:\wamp64\www\Manual_MAIS')
for p in root.rglob('*.html'):
    text = p.read_text(encoding='utf-8')
    if '<style' in text and 'site.css' in text:
        index_style = text.index('<style')
        index_link = text.index('site.css')
        if index_style < index_link:
            print(str(p))
