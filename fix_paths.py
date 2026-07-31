import os
import re

html_files = []
for root, dirs, files in os.walk('.'):
    for file in files:
        if file.endswith('.html'):
            html_files.append(os.path.join(root, file))

for file in html_files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace href="/..." with href="./..."
    content = re.sub(r'href="/(?!/)', 'href="./', content)
    # Replace src="/..." with src="./..."
    content = re.sub(r'src="/(?!/)', 'src="./', content)
    
    # Specially fix href="./" to href="./index.html" so that it works reliably on GH pages
    content = content.replace('href="./"', 'href="./index.html"')
    
    with open(file, 'w', encoding='utf-8') as f:
        f.write(content)

print(f"Fixed paths in {len(html_files)} HTML files.")
