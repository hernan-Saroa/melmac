import os
import re

def fix_signature_component(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Replace SignaturePadModule with SignaturePadComponent
    new_content = new_content.replace('SignaturePadModule', 'SignaturePadComponent')
    
    # Replace exact word SignaturePad with SignaturePadComponent
    # Using regex word boundaries avoids matching SignaturePadComponent or SignaturePadModule
    new_content = re.sub(r'\bSignaturePad\b', 'SignaturePadComponent', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated signature component in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_signature_component(os.path.join(root, file))

if __name__ == '__main__':
    main()
