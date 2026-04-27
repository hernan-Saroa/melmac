import os
import re

def strip_tel_input(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove import lines
    new_content = re.sub(r'import\s+\{\s*Ng2TelInputModule\s*\}\s*from\s*[\'"]ng2-tel-input[\'"];?', '', content)
    
    # Remove occurrences in the imports arrays: Ng2TelInputModule.forRoot() or Ng2TelInputModule,
    new_content = new_content.replace('Ng2TelInputModule.forRoot(),', '')
    new_content = new_content.replace('Ng2TelInputModule.forRoot()', '')
    new_content = new_content.replace('Ng2TelInputModule,', '')
    new_content = new_content.replace('Ng2TelInputModule', '')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Stripped Ng2TelInputModule from: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                strip_tel_input(os.path.join(root, file))

if __name__ == '__main__':
    main()
