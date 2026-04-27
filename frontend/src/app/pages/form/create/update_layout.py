import os

file_path = 'c:/Users/Hernan_Buitrago/Documents/SuperApp ESAP/melmac/frontend/src/app/pages/form/create/create.component.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if '<div class="col-12" *ngIf="create_process || form_process">' in line and start_idx == -1:
        start_idx = i
        
    if '<ng-template #template>' in line and end_idx == -1:
        end_idx = i - 2 # point to </div>

metadata_block = lines[start_idx:end_idx+1]

# Remove the block from its original position
del lines[start_idx:end_idx+1]

# Modify the metadata block layout
for i in range(len(metadata_block)):
    if 'class="col-12 col-md-4"' in metadata_block[i]:
        metadata_block[i] = metadata_block[i].replace('class="col-12 col-md-4"', 'class="col-12"')
    if '<nb-card class="wc-doc-card">' in metadata_block[i]:
        metadata_block[i] = metadata_block[i].replace('<nb-card class="wc-doc-card">', '<nb-card class="wc-doc-card mb-3">')
    if '<button nbButton size="small" status="primary" class="wc-save-btn"' in metadata_block[i]:
        metadata_block[i] = metadata_block[i].replace('class="wc-save-btn"', 'class="wc-save-btn" fullWidth style="margin-top: 15px;"')
        
# Find the new insertion point above the accordion
insert_idx = -1
for i, line in enumerate(lines):
    if '<div class="col-xl-3 col-lg-4 col-md-4 col-12">' in line:
        insert_idx = i + 1
        break

if insert_idx != -1:
    lines = lines[:insert_idx] + metadata_block + lines[insert_idx:]

# Find the builder wrapper and make it always render
for i in range(len(lines)):
    if 'ngIf="form_process || (create_process && id)"' in lines[i]:
        lines[i] = lines[i].replace('ngIf="form_process || (create_process && id)"', 'ngIf="create_process || form_process"')

# Find the drop list and add an empty state wrapper
for i in range(len(lines)):
    if '<div cdkDropList #fieldList="cdkDropList"' in lines[i]:
        empty_state = """
                        <div *ngIf="!id" class="wc-empty-state" style="text-align: center; padding: 50px 20px; border: 2px dashed #edf1f7; border-radius: 8px; margin-bottom: 20px;">
                            <nb-icon icon="lock-outline" style="font-size: 3rem; color: #c5cee0;"></nb-icon>
                            <h5 style="margin-top: 15px; color: #8f9bb3;">Guarda el documento para habilitar el constructor</h5>
                        </div>
                        <div *ngIf="id" cdkDropList #fieldList="cdkDropList" [cdkDropListData]="form_field"
"""
        lines[i] = empty_state
        break
        
with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
    
print("Success")
