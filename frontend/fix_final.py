import os
import re

def fix_table_deep_imports(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Remove deep ng2-smart-table imports for Cell and Row manually
    new_content = re.sub(r'import\s+\{\s*Cell\s*\}\s*from\s*[\'"](?:ng|angular)2-smart-table/lib/.*?[\'"];?', "import { Cell } from 'angular2-smart-table';", new_content)
    new_content = re.sub(r'import\s+\{\s*Row\s*\}\s*from\s*[\'"](?:ng|angular)2-smart-table/lib/.*?[\'"];?', "import { Row } from 'angular2-smart-table';", new_content)

    new_content = re.sub(r'import\s+\{\s*Cell,\s*Row\s*\}\s*from\s*[\'"](?:ng|angular)2-smart-table/lib/.*?[\'"];?', "import { Cell, Row } from 'angular2-smart-table';", new_content)
    new_content = re.sub(r'import\s+\{\s*Row,\s*Cell\s*\}\s*from\s*[\'"](?:ng|angular)2-smart-table/lib/.*?[\'"];?', "import { Row, Cell } from 'angular2-smart-table';", new_content)
    
    # If they already changed to 'angular2-smart-table' in the first migration script, we match both.
    
    # Fix .getFilter().filters -> .getFilter()
    new_content = new_content.replace('.getFilter().filters', '.getFilter()')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed deep imports and filters in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_table_deep_imports(os.path.join(root, file))
    
    print("FINAL TABLE FIX COMPLETE!")

if __name__ == '__main__':
    main()
