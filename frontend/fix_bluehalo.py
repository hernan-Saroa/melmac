import os
import re

def fix_bluehalo(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content.replace('@asymmetrik/ngx-leaflet', '@bluehalo/ngx-leaflet')
    new_content = new_content.replace('@asymmetrik/ngx-leaflet-markercluster', '@bluehalo/ngx-leaflet-markercluster')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated bluehalo in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_bluehalo(os.path.join(root, file))

if __name__ == '__main__':
    main()
