import os

def replace_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    # Replace TS imports
    if filepath.endswith('.ts'):
        new_content = new_content.replace("'ng2-smart-table'", "'angular2-smart-table'")
        new_content = new_content.replace('"ng2-smart-table"', '"angular2-smart-table"')
        new_content = new_content.replace('Ng2SmartTableModule', 'Angular2SmartTableModule')
        # LocalDataSource is the same
        
    # Replace HTML tags
    if filepath.endswith('.html') or filepath.endswith('.ts'):
        new_content = new_content.replace('<ng2-smart-table', '<angular2-smart-table')
        new_content = new_content.replace('</ng2-smart-table>', '</angular2-smart-table>')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Updated: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts') or file.endswith('.html'):
                replace_in_file(os.path.join(root, file))
    
    print("MIGRATION COMPLETE!")

if __name__ == '__main__':
    main()
