import os

def fix_delay(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # In ng2-smart-table, DefaultFilter had `delay`. In angular2-smart-table, it was removed.
    new_content = content.replace('debounceTime(this.delay)', 'debounceTime(300)')

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Fixed delay in: {filepath}")

def main():
    directory = r'c:\Users\Hernan_Buitrago\Documents\SuperApp ESAP\melmac\frontend\src\app'
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.ts'):
                fix_delay(os.path.join(root, file))
    
    print("DELAY FIX COMPLETE!")

if __name__ == '__main__':
    main()
