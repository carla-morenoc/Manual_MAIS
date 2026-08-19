from pathlib import Path
root = Path(r'c:\wamp64\www\Manual_MAIS')
for p in [root / 'index.html'] + sorted((root / 'pages').glob('*.html')):
    text = p.read_text(encoding='utf-8')
    style_start = text.find('<style')
    if style_start == -1:
        continue
    link_pos = text.find('assets/css/site.css')
    if link_pos == -1:
        continue
    if link_pos > style_start:
        # find full <link ...> block containing site.css
        link_start = text.rfind('<link', 0, link_pos)
        link_end = text.find('>', link_pos) + 1
        if link_start == -1 or link_end == 0:
            continue
        link_block = text[link_start:link_end]
        style_end = text.find('</style>', style_start)
        if style_end == -1:
            continue
        style_end += len('</style>')
        style_block = text[style_start:style_end]
        # swap them
        before = text[:link_start]
        middle = text[link_end:style_start]
        after = text[style_end:]
        new_text = before + style_block + middle + link_block + after
        p.write_text(new_text, encoding='utf-8')
        print(f'Fixed {p}')
