import os
import re

def fix_viewcell(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = re.sub(r'import\s*\{\s*ViewCell\s*\}\s*from\s*[\'"].*?[\'"]\s*;?', '', content)
    new_content = re.sub(r'\s+implements\s+ViewCell\s+', ' ', new_content)
    new_content = re.sub(r',\s*ViewCell\b', '', new_content)
    new_content = re.sub(r'\bViewCell\s*,', '', new_content)
    new_content = re.sub(r'this\.delay\s*=\s*\d+;', '', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed ViewCell/delay in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_viewcell(os.path.join(root, file))
    
    print("VIEWCELL AND DELAY ASSIGNMENT FIX COMPLETE!")

if __name__ == '__main__':
    main()
