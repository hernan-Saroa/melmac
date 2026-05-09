import os
import pdfplumber
from django.conf import settings
from api.models import Form_Enterprise, Form_Digital, Form_Field, Digital_Field

def parse_pdf_for_fields(form_id, digital_id):
    try:
        form_val = Form_Enterprise.objects.get(id=form_id)
        form_digital_val = Form_Digital.objects.get(id=digital_id)
        
        if not form_digital_val.template or not str(form_digital_val.template).strip():
            form_val.digital_ia_status = 2
            form_val.save()
            return
            
        pdf_path = os.path.join(settings.MEDIA_ROOT, str(form_digital_val.template))
        
        if not os.path.exists(pdf_path) or not os.path.isfile(pdf_path):
            form_val.digital_ia_status = 2
            form_val.save()
            return
            
        extracted_fields = []
        
        # Simple heuristic keywords and their corresponding field_type_id
        # 1: Texto, 7: Firma, 11: Documento, 4: Fecha
        keyword_types = {
            'firma': 7,
            'nombre': 5,  # 5 = Solo Letras
            'documento': 11,
            'cédula': 11,
            'cedula': 11,
            'fecha': 4,
            'dirección': 25,
            'direccion': 25,
            'teléfono': 2,
            'telefono': 2,
            'celular': 2,
            'correo': 1,
            'email': 1,
            'nit': 20,
            'ciudad': 5,  # 5 = Solo Letras
            'departamento': 5,  # 5 = Solo Letras
            'razón social': 1,
            'razon social': 1,
            'información': 27,
            'informacion': 27,
            'informacion': 27,
            'datos': 27,
            'sección': 27,
            'seccion': 27,
            'tipo de novedad': 13, # 13 = Checkbox (Seleccion Multiple)
            'c.c.': 12,
            'c.e.': 12
        }
        
        # Load learned keywords from AI_Knowledge_Base
        try:
            from api.models import AI_Knowledge_Base
            learned = AI_Knowledge_Base.objects.filter(state=True)
            for item in learned:
                keyword_types[item.keyword] = item.field_type_id
        except Exception as e:
            pass
        
        with pdfplumber.open(pdf_path) as pdf:
            try:
                # Extract Title from page 0
                page0 = pdf.pages[0]
                words_with_chars = page0.extract_words(extra_attrs=['size'])
                if words_with_chars:
                    max_size = max(w.get('size', 0) for w in words_with_chars)
                    if max_size > 12:
                        # Get words that are close to the max size, top of the page
                        title_words = [w for w in words_with_chars if abs(w.get('size', 0) - max_size) < 6.0 and w.get('top', 1000) < 150]
                        title_words = sorted(title_words, key=lambda x: (x['top'], x['x0']))
                        extracted_title = " ".join([w['text'] for w in title_words]).strip()
                        
                        # Description: text below the title, smaller font
                        extracted_desc = ""
                        if title_words:
                            title_bottom = max(w.get('bottom', w.get('top', 0) + 10) for w in title_words)
                            desc_words = [w for w in words_with_chars if w.get('top', 1000) >= title_bottom and w.get('top', 1000) < title_bottom + 80 and w.get('size', 0) <= max_size - 1]
                            desc_words = sorted(desc_words, key=lambda x: (x['top'], x['x0']))
                            extracted_desc = " ".join([w['text'] for w in desc_words]).strip()

                        if len(extracted_title) > 4:
                            form_val.name = extracted_title[:100]
                        if len(extracted_desc) > 4:
                            form_val.description = extracted_desc[:250]
                            
                # Clear dummy loading texts if they were not overwritten
                if form_val.name == "Procesando con Flo AI...":
                    form_val.name = "Documento Sin Título"
                if form_val.description == "Analizando documento...":
                    form_val.description = ""
                    
                form_val.save()
            except Exception as e:
                print("Error extracting title:", e)
                
            for page_num, page in enumerate(pdf.pages):
                words = page.extract_words(keep_blank_chars=False)
                
                # Group words into lines
                lines = []
                for w in words:
                    added = False
                    for line in lines:
                        if abs(line['top'] - w['top']) < 3:
                            line['words'].append(w)
                            added = True
                            break
                    if not added:
                        lines.append({'top': w['top'], 'words': [w]})
                        
                # Sort lines by vertical position to ensure strict top-to-bottom ordering
                lines = sorted(lines, key=lambda x: x['top'])
                
                for line in lines:
                    line['words'] = sorted(line['words'], key=lambda x: x['x0'])
                    line_text = " ".join([w['text'] for w in line['words']])
                    line_text_clean = line_text.lower()
                    
                    for kw, field_type in keyword_types.items():
                        if kw in line_text_clean:
                            if field_type == 27:
                                # Sections rarely contain colons. If it does, it's probably a field prompt.
                                if ':' in line_text:
                                    continue
                                label = line_text.strip().replace('_', '')
                                # Sections are usually short titles. Ignore long instructional sentences.
                                if len(label) > 70 or len(label.split()) > 10:
                                    continue
                            else:
                                # Extract the exact label if there's only one field, otherwise use keyword
                                if line_text.count(':') > 1:
                                    label = kw.capitalize()
                                else:
                                    label = line_text.split(':')[0].strip().replace('_', '')
                                
                            # Fallback if label gets wiped
                            if not label:
                                label = kw.capitalize()
                            elif len(label) > 100:
                                label = label[:100]
                                
                            # Find the specific word to get coordinates
                            kw_word = next((w for w in line['words'] if kw in w['text'].lower()), line['words'][0])
                            
                            x = kw_word['x0']
                            y = kw_word['top']
                            
                            field_data = {
                                'keyword': label,
                                'field_type': field_type,
                                'page': page_num + 1,
                                'left': str(x + 100) if field_type != 13 else str(x),
                                'top': str(y - 5) if field_type != 13 else str(y + 20),
                                'width': '200' if field_type not in [7, 13] else ('250' if field_type == 7 else '600'),
                                'height': '30' if field_type not in [7, 13] else ('100' if field_type == 7 else '60'),
                            }
                            
                            if kw == 'tipo de novedad':
                                field_data['options'] = [
                                    "Cambio de Usuario",
                                    "Eliminación IP",
                                    "Inscripción Cuentas otros Nit",
                                    "Actualización de datos",
                                    "Inscripción de cuenta para Dispersión",
                                    "Marcación de Cuentas"
                                ]
                                
                            extracted_fields.append(field_data)
                            # Allow multiple fields per line by NOT breaking here
                            
        # Remove duplicates based on exact keyword match globally
        final_fields = []
        for field in extracted_fields:
            duplicate = False
            for f in final_fields:
                if f['keyword'].lower() == field['keyword'].lower():
                    duplicate = True
                    break
            if not duplicate:
                final_fields.append(field)
                
        # Now create Form_Field and Digital_Field
        position = Form_Field.objects.filter(form_enterprise=form_val, state=True).count() + 1
        
        for field_data in final_fields:
            # Create Form_Field
            form_field = Form_Field(
                form_enterprise=form_val,
                name=field_data['keyword'].capitalize(),
                field_type_id=field_data['field_type'],
                position=position,
                obligatory=True,
                state=True
            )
            form_field.save()
            position += 1
            
            if 'options' in field_data:
                from api.models import Option, Option_Field
                opt_pos = 1
                for opt_text in field_data['options']:
                    opt_obj, created = Option.objects.get_or_create(value=opt_text)
                    Option_Field.objects.create(
                        form_field=form_field,
                        option=opt_obj,
                        position=opt_pos,
                        state=True
                    )
                    opt_pos += 1
            
            # Create Digital_Field
            digital_field = Digital_Field(
                form_digital=form_digital_val,
                form_field=form_field,
                page=field_data['page'],
                left=field_data['left'],
                top=field_data['top'],
                font='Helvetica',
                size=12,
                color='#000000',
                width=field_data['width'],
                height=field_data['height'],
                state=True
            )
            digital_field.save()
            
        # Update status
        form_val.digital_ia_status = 2
        form_val.save()
        
    except Exception as e:
        print(f"Error in parse_pdf_for_fields: {e}")
        try:
            form_val = Form_Enterprise.objects.get(id=form_id)
            form_val.digital_ia_status = 2 # Prevent infinite loading on frontend
            form_val.save()
        except:
            pass

def learn_from_user_fields(form_digital_id, fields_data):
    try:
        from api.models import Form_Digital, Form_Field, AI_Knowledge_Base
        from django.conf import settings
        import os
        import pdfplumber
        
        form_digital_val = Form_Digital.objects.get(id=form_digital_id)
        if not form_digital_val.template or not str(form_digital_val.template).strip():
            return
            
        pdf_path = os.path.join(settings.MEDIA_ROOT, str(form_digital_val.template))
        if not os.path.exists(pdf_path) or not os.path.isfile(pdf_path):
            return
            
        pdf_text = ""
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text(keep_blank_chars=True)
                if text:
                    pdf_text += text.lower() + " "
                
        base_keywords = ['firma', 'nombre', 'documento', 'cédula', 'cedula', 'fecha', 'dirección', 'direccion', 'teléfono', 'telefono', 'celular', 'correo', 'email', 'nit', 'ciudad', 'departamento', 'razón social', 'razon social', 'información', 'informacion', 'datos', 'sección', 'seccion', 'c.c.', 'c.e.']
        
        for f_data in fields_data:
            form_field_id = f_data.get('field')
            if not form_field_id:
                continue
                
            try:
                form_field = Form_Field.objects.get(id=form_field_id)
                label = form_field.name.strip().lower()
                field_type = form_field.field_type_id
                
                if not label or len(label) < 3 or len(label) > 100:
                    continue
                    
                if label in base_keywords:
                    continue
                    
                if AI_Knowledge_Base.objects.filter(keyword=label).exists():
                    continue
                    
                if label in pdf_text:
                    AI_Knowledge_Base.objects.create(
                        keyword=label,
                        field_type_id=field_type
                    )
            except Exception as e:
                continue
    except Exception as e:
        print(f"Error in learn_from_user_fields: {e}")
