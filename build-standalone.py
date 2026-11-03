"""Génère standalone/*.html : pages avec CSS + JS intégrés (utile en content:// ou en pièce jointe).
Usage : python3 build-standalone.py"""
import glob, os
read = lambda p: open(p, encoding='utf-8').read()
fb = read('fallback.css')
css = read('style.css')
js = read('script.js')
os.makedirs('standalone', exist_ok=True)
for f in glob.glob('*.html'):
    h = read(f)
    h = h.replace('<link rel="stylesheet" href="fallback.css">', '<style>\n' + fb + '\n</style>')
    h = h.replace('<link rel="stylesheet" href="style.css">', '<style>\n' + css + '\n</style>')
    h = h.replace('<script src="script.js"></script>', '<script>\n' + js + '\n</script>')
    open('standalone/' + f, 'w', encoding='utf-8').write(h)
print('OK')
