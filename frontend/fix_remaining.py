import os
import re

def fix_remaining(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = content
    # Fix any variations of debounceTime(this.delay)
    new_content = re.sub(r'debounceTime\(\s*this\.delay\s*\)', 'debounceTime(300)', new_content)
    
    # Fix Ng2SmartTableComponent -> Angular2SmartTableComponent
    new_content = new_content.replace('Ng2SmartTableComponent', 'Angular2SmartTableComponent')
    
    # Fix this.cell.setValue(this.phone) in contacts.component.ts if it exists
    new_content = new_content.replace('this.cell.setValue(this.phone)', 'this.cell.setValue(String(this.phone.phoneNumber || this.phone))')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed final issues in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_remaining(os.path.join(root, file))
    
    print("REMAINING FIX COMPLETE!")

if __name__ == '__main__':
    main()
