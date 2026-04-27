import os

file_path = 'c:/Users/Hernan_Buitrago/Documents/SuperApp ESAP/melmac/frontend/src/app/pages/form/create/create.component.html'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.read().split('\n')

# 1. We need to extract the metadata block from the sidebar.
start_idx = -1
end_idx = -1
for i, line in enumerate(lines):
    if '<nb-card class="wc-doc-card mb-3">' in line:
        start_idx = i
    if '<nb-card-body [hidden]="!process_digital_ia">' in line:
        pass
    if '</nb-card>' in line and start_idx != -1 and i > start_idx:
        # We found the end of the doc card. Wait, there are nested cards. Let's count indents or cards.
        # It's better to just reconstruct it directly since we know exactly what it should look like.
        break

# Rather than complicated extraction, let's just find the insertion point at the top 
# (which is right after <div class="col-12"> <nb-card> stepper card </nb-card> </div>)
# and insert a clean, perfectly structured horizontal metadata card.
# And remove the old one from the sidebar.

top_insert_idx = -1
for i in range(len(lines)):
    if '</nb-stepper>' in lines[i]:
        top_insert_idx = i + 4 # </div></nb-card-body></nb-card></div>
        break

metadata_html = """
    <div class="col-12" *ngIf="create_process || form_process">
        <nb-card class="wc-doc-card">
            <nb-card-header class="wc-compact-header">
                <div class="wc-header-left">
                    <nb-icon icon="file-text-outline" class="wc-h-icon"></nb-icon>
                    <span class="wc-h-title">{{ title_component }}</span>
                    <span *ngIf="version!=null" class="wc-h-version">v{{ version }}</span>
                    <span *ngIf="id" class="wc-h-saved"><nb-icon icon="checkmark-circle-2-outline"></nb-icon></span>
                </div>
                <div class="wc-header-right">
                    <button nbButton size="small" ghost status="basic" type="button"
                        (click)="metadataCollapsed = !metadataCollapsed"
                        nbTooltip="{{ metadataCollapsed ? 'Expandir configuración avanzada' : 'Ocultar configuración avanzada' }}">
                        <nb-icon [icon]="metadataCollapsed ? 'settings-2-outline' : 'minus-outline'"></nb-icon>
                    </button>
                    <button nbButton size="small" status="primary" class="wc-save-btn"
                        (click)="onFirstSubmit(next_first)"
                        [disabled]="!createForm.valid || loading"
                        [nbSpinner]="loading" nbSpinnerStatus="control">
                        <nb-icon icon="save-outline"></nb-icon> {{ id ? 'Actualizar' : 'Guardar' }}
                    </button>
                </div>
            </nb-card-header>
            
            <nb-card-body [hidden]="!process_digital_ia">
              <div class="col-12 col-md-6 offset-md-3" [nbSpinner]="loading" nbSpinnerStatus="primary">
                <div class="IA-loading">
                  <nb-icon icon="loader-outline"></nb-icon>
                  <div style="width: 100%;"><h1>IA</h1></div>
                  <div style="width: 100%; padding: 10px;">Se activo la generación automática por IA</div>
                  <div style="width: 100%; padding: 10px; font-weight: 100;">
                    <label>¡Puedes esperar o volver luego!</label>
                  </div>
                </div>
              </div>
            </nb-card-body>
            
            <nb-card-body [hidden]="process_digital_ia" class="wc-meta-body">
                <form [formGroup]="createForm" (ngSubmit)="onFirstSubmit(next_first)" class="step-container">
                    <div class="content-data wc-compact-form">
                    
                        <!-- TITLE AND DESC ALWAYS VISIBLE -->
                        <div class="wc-inline-fields">
                            <input type="text" placeholder="Nombre de este Formulario/Documento..." class="form-control wc-title-input" formControlName="name"
                                fullWidth maxlength="100"
                                [ngClass]="{'form-control-danger': createForm.invalid && (createForm.dirty || createForm.touched)}">
                            <textarea rows="1" placeholder="Añade una descripción (opcional)..." class="form-control wc-desc-input"
                                formControlName="description" fullWidth maxlength="1000"
                                style="resize: none;" required></textarea>
                        </div>

                        <input type="file" (change)="onFileSelected($event, 'template')"
                            class="file-input" formControlName="template"
                            accept="application/pdf" [required]="!is_digital && digital" #fileUpload>

                        <input type="file" (change)="onFileSelected($event, 'logo')"
                            class="file-input" formControlName="logo"
                            accept="image/png, image/jpeg" #logoUpload>

                        <!-- ADVANCED OPTIONS TOOLBAR (COLLAPSIBLE) -->
                        <div class="row wc-options-toolbar" [hidden]="metadataCollapsed">
                            <div [hidden]="is_digital" class="col-12 col-md-4">
                                <label class="label">Plantilla</label>
                                <nb-select fullWidth [disabled]="digital" [(ngModel)]="template_option" [ngModelOptions]="{standalone: true}"
                                    style="margin-bottom: 15px;" class="select-form" placeholder="Seleccionar Plantilla">
                                    <nb-option value="0">Plantilla Predeterminada</nb-option>
                                    <nb-option value="1">Plantilla 1</nb-option>
                                    <nb-option value="2">Plantilla 2</nb-option>
                                </nb-select>
                                <div style="position: relative;" *ngIf="template_option != '0' && !digital">
                                    <label class="label">Color Plantilla</label><br>
                                    <input style="margin-bottom: 15px;"
                                        [(ngModel)]="template_color" [ngModelOptions]="{standalone: true}"
                                        type="color" nbInput fieldSize="small" nbInput
                                        placeholder="Color">
                                    <button nbButton size="tiny" type="button" outline status="primary" class="logo-btn"
                                        (click)="logoUpload.click()">Logo <nb-icon icon="cloud-upload"></nb-icon></button>
                                    {{ logo_name }}
                                </div>
                            </div>
                            <div class="col-12 col-md-4">
                                <label class="label">Establecer Pin</label><br>
                                <nb-select fullWidth
                                    style="margin-bottom: 15px;" class="select-form" [(ngModel)]="pin_color" [ngModelOptions]="{standalone: true}" placeholder="Seleccionar Pin">
                                    <nb-option value="">Aleatorio</nb-option>
                                    <nb-option *ngFor="let pin of pines; let i=index;" [value]="pin">Pin-{{ i+1 }}</nb-option>
                                </nb-select>
                            </div>
                            <div class="col-12 col-md-4">
                                <div class="file-upload">
                                    <nb-checkbox [hidden]="is_digital" [checked]="digital" status="primary" (checkedChange)="toggle($event)">Con plantilla PDF</nb-checkbox><br>
                                    <button [disabled]="!digital" nbButton type="button" outline status="primary" class="upload-btn"
                                        (click)="fileUpload.click()">Plantilla PDF <nb-icon icon="cloud-upload"></nb-icon></button>
                                    {{ file_name }}
                                </div>
                                <div [hidden]="id" class="IA-select mt-2" (click)="toggleIA()">
                                    <div [class.disabled]="!digital" class="upload-btn"> IA </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </form>
            </nb-card-body>
        </nb-card>
    </div>
"""

lines = lines[:top_insert_idx] + metadata_html.split('\n') + lines[top_insert_idx:]

# Now delete the sidebar one.
start_idx_del = -1
end_idx_del = -1
for i, line in enumerate(lines):
    if '<nb-card class="wc-doc-card mb-3">' in line:
        start_idx_del = i
    if '</nb-card>' in line and start_idx_del != -1 and i > start_idx_del:
        if '</form>' in '\n'.join(lines[start_idx_del:i+1]):
            end_idx_del = i
            break

if start_idx_del != -1 and end_idx_del != -1:
    del lines[start_idx_del:end_idx_del+1]

with open(file_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(lines))
    
print("Reverted to horizontal layout successfully")
