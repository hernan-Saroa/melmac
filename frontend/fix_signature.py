import os

def fix_signature(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content.replace("'angular2-signaturepad'", "'@almothafar/angular-signature-pad'")
    new_content = new_content.replace('"angular2-signaturepad"', "'@almothafar/angular-signature-pad'")

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated signature pad in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_signature(os.path.join(root, file))
    print("SIGNATURE PAD FIX COMPLETE!")

if __name__ == '__main__':
    main()
