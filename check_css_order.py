from pathlib import Path
root = Path(r'c:\wamp64\www\Manual_MAIS')
for p in [root / 'index.html'] + sorted((root / 'pages').glob('*.html')):
    text = p.read_text(encoding='utf-8')
    link_pos = text.find('assets/css/site.css')
    style_pos = text.find('<style')
    if link_pos != -1 and style_pos != -1 and style_pos < link_pos:
        print('BAD ORDER:', p)
