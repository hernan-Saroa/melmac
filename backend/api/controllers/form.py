# rest_framework
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from api.permissions import IsUserAdminOrHasPermission
from rest_framework.permissions import IsAuthenticated
from api.controllers.admin import get_enterprise
from api.controllers.notification import Sms
from django.core.mail import EmailMultiAlternatives
# models
from api.models import (
    Answer_Consecutive,
    Answer_Field,
    Answer_Form,
    Answer_Form_Consecutive,
    Digital_Field,
    Env_Digital_Element,
    Field_Condition,
    Form_Consecutive,
    Form_Digital,
    Form_Enterprise,
    Form_Field,
    Form_Field_Consecutive,
    Form_Field_Parameter,
    Form_Link,
    Form_Version,
    List_Field,
    Option,
    Option_Field,
    Option_List_Field,
    Role_Form,
    User_Form,
    User_Enterprise,
    Variable_Plataform,
    Logs_Form,
    Enterprise,
    Validate_Answer_Form,
    Form_Temporal_Digital,
)
# api
from api.controllers.traceability import create_traceability
from api.controllers.answer import generate_pdf_digital
from api.util import send_email, create_qr, send_whatsapp_msg, send_whatsapp_msg_v2
# Others
from datetime import datetime
from django.conf import settings
from django.http import HttpResponse
from api.encrypt import Encrypt
from threading import Thread
from PyPDF2 import PdfReader
import itertools
import os
import pytz
import json
import time
import csv
import io
import ast
from api.controllers.general_resources import create_qr_link, create_link_document, send_link_shared

TZ_INFO = pytz.timezone('America/Bogota')

class FormList(APIView):
    permission_classes = [IsUserAdminOrHasPermission]
    """
    API endpoint que permite la consulta de los formularios y la creación de nuevos.
    """
    # Consulta
    def get(self, request, format=None, state=1):
        # permission_classes = [IsAuthenticated]
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

            try:
                # Se genera token unico por documento
                token_link = Encrypt().encrypt_code('Enterprise_Access' + str(user_val.enterprise.id))
                enterprise_val = user_val.enterprise
                enterprise_val.token_link = token_link
                enterprise_val.save()
            except:
                pass

            form_list = []
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                form_values = Form_Enterprise.objects.filter(
                    enterprise_id=user_val.enterprise_id,
                    visible=True,
                )
                if state == 0:
                    form_values = form_values.filter(state=False)
                elif state == 1:
                    form_values = form_values.filter(state=True)
                form_values = form_values.values('id', 'name', 'description', 'consecutive', 'digital', 'creation_date').order_by('-modify_date')
            else:
                for_user = User_Form.objects.filter(user_id=user_val.id, state=True).values_list('form_enterprise_id', flat=True)
                for_rol = []
                if user_val.role_enterprise_id != None:
                    for_rol = Role_Form.objects.filter(role_id=user_val.role_enterprise_id, state=True).values_list('form_enterprise_id', flat=True)
                list_form = list(for_rol) + list(for_user)
                form_values = Form_Enterprise.objects.filter(
                    id__in=list_form,
                    visible=True,
                )
                if state == 0:
                    form_values = form_values.filter(state=False)
                elif state == 1:
                    form_values = form_values.filter(state=True)
                form_values = form_values.values('id', 'name', 'description', 'consecutive', 'digital', 'creation_date').order_by('-modify_date')
            # lista de formularios
            for form_val in form_values:
                # Campo biometrico
                if form_val['consecutive']:
                    # Consecutivo de los formularios
                    forms_id = [item['form_id'] for item in list(Form_Consecutive.objects.filter(form_enterprise_id=form_val['id'], state=True).values('form_id'))]
                    biometric_state = Form_Field.objects.filter(
                        form_enterprise_id__in=forms_id,
                        field_type_id=10,
                        state=True,
                    ).exists()
                else:
                    biometric_state = Form_Field.objects.filter(
                        form_enterprise_id=form_val['id'],
                        field_type_id=10,
                        state=True,
                    ).exists()

                form_list.append({
                    'id': form_val['id'],
                    'name': replace_character(form_val['name']),
                    'description': replace_character(form_val['description']),
                    'consecutive': form_val['consecutive'],
                    'digital': form_val['digital'],
                    'biometric': biometric_state,
                    'creation_date': form_val['creation_date']
                })
            response['status'] = True
            response['data'] = form_list
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)


    def post(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            # get user and data
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            data = request.data
            files = request.FILES
            if 'name' in data and 'description' in data:
                if data['name'] != '' and data['description'] != '':
                    # se valida si es creación o actualización
                    if 'id' in data and data['id'] != '':
                        try:
                            form_val = Form_Enterprise.objects.get(id=data['id'], enterprise_id=user_val.enterprise_id)
                            form_data = {
                                'name': form_val.name,
                                'description': form_val.description,
                                'digital': form_val.digital,
                                'theme': form_val.theme,
                                'color': form_val.color,
                            }
                            form_val.name = data['name']
                            form_val.description = data['description']
                            if 'consecutive' in data and data['consecutive'] == '1':
                                form_val.consecutive = True
                            if 'digital' in data and data['digital'] == '1':
                                form_val.digital = True
                            else:
                                # Plantilla, color y pin
                                if 'theme' in data and data['theme'] != '0':
                                    form_val.theme = data['theme']
                                    form_val.color = data['color']
                                    if 'logo' in files:
                                        form_val.logo_path = files['logo']
                                elif 'pin' in data and data['pin'] != '#000000':
                                    form_val.pin = data['pin']
                                else:
                                    form_val.theme = 0
                                    form_val.color = ''
                                    form_val.logo_path = None
                            form_val.save()
                            # actualiza el template del formulario digital
                            if 'digital' in data and data['digital'] == '1':
                                if 'template' in files:
                                    try:
                                        form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)
                                        form_digital_val.template = files['template']
                                        form_digital_val.save()
                                    except (Form_Digital.DoesNotExist):
                                        form_digital_val = Form_Digital()
                                        form_digital_val.form_enterprise = form_val
                                        form_digital_val.template = files['template']
                                        form_digital_val.save()

                                    response['digital'] = form_digital_val.id
                            form_id = form_val.id
                            # Detectar los cambios realizados
                            form_differences = lookFormDifferences(form_data, form_val)
                            if form_differences != None:
                                log_content = {
                                    'user': user_val.id,
                                    'group': 15,
                                    'element': form_id,
                                    'action': 2,
                                    'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                                        user_val.first_last_name + " ha modificado " + form_differences +
                                        " del documento #" + str(form_id) + ' "' + form_val.name + '"'),
                                }
                                create_traceability(log_content)

                        except (Form_Enterprise.DoesNotExist):
                            return Response(response)
                    else:
                        response_form = create_form(user_val, data, files)
                        form_id = response_form['form']
                        log_content = {
                            'user': user_val.id,
                            'group': 15,
                            'element': form_id,
                            'action': 1,
                            'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " crea el documento #" + str(form_id) + " " + data['name'],
                        }
                        create_traceability(log_content)
                        if 'digital' in response_form:
                            response['digital'] = response_form['digital']

                    if 'fields' in data and data['fields']:
                        # Primeras validaciones para nueva versión
                        version_new = False
                        if 'id' in data and data['id'] != '':
                            answer_form = False
                            if Answer_Form.objects.filter(form_enterprise_id=form_val.id, form_version=form_val.version).exists():
                                answer_form = True

                            if answer_form:
                                json_data = form_to_json(form_val)
                                version_new = True

                            if version_new:
                                form_version_val = Form_Version()
                                form_version_val.form_enterprise = form_val
                                form_version_val.version = form_val.version
                                form_version_val.json_data = json_data
                                form_version_val.save()

                                # Version en Individual
                                form_val.version = form_val.version + 1
                                form_val.save()
                                # Version en Consecutivos que contengan el Individual
                                # list_form_consecutive = list(Form_Consecutive.objects.filter(form_id=form_val.id, state=True).values_list('form_enterprise_id', flat=True))
                                # if Answer_Consecutive.objects.filter(form_consecutive_id__in=list_form_consecutive).exists():
                                Form_Consecutive.objects.filter(form_id=form_val.id, state=True).update(version=form_val.version)

                                log_content = {
                                    'user': user_val.id,
                                    'group': 15,
                                    'element': form_val.id,
                                    'action': 2,
                                    'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                                        user_val.first_last_name + " ha modificado el documento #" +
                                        str(form_val.id) + ' "' + form_val.name + '"' + " generando una nueva versión V" +
                                        str(form_val.version) + " del documento"),
                                }
                                create_traceability(log_content)

                        # Todos los campos(id) del formulario.
                        field_all_form = [item['id'] for item in list(Form_Field.objects.filter(form_enterprise_id=form_id, state=True).values('id'))]
                        # recorre los campos
                        position_field = 1
                        for index, field in enumerate(data['fields']):
                            if 'label' in field and field['label'] != '':
                                # print(field['label'])
                                update_field_cont = True
                                if 'id' in data and data['id'] and 'field' in field and field['field'] != '':
                                    # Valida si el campo es del formulario.
                                    try:
                                        field_form_val = Form_Field.objects.get(id=field['field'], form_enterprise_id=form_id)
                                        field_form_val.name = field['label']
                                        field_form_val.obligatory = field['required']
                                        field_form_val.position = position_field
                                        # field_form_val.position = index + 1
                                    except (Form_Field.DoesNotExist):
                                        update_field_cont = False
                                else:
                                    field_form_val = Form_Field()
                                    field_form_val.form_enterprise_id = form_id
                                    field_form_val.name = field['label'][:50]
                                    field_form_val.field_type_id = field['field_type']
                                    field_form_val.obligatory = field['required']
                                    field_form_val.position = position_field

                                position_field += 1

                                if update_field_cont == True:
                                    if 'description' in field and field['description'] != '':
                                        if field['field_type'] == '14':
                                            field_form_val.help = field['description'][:5000]
                                        else:
                                            field_form_val.help = field['description'][:200]
                                    else:
                                        field_form_val.help = ''

                                    type_same = ['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '14', '15', '16','18', '19', '20', '22', '23', '24', '25']
                                    type_option = ['3', '12', '13']
                                    if field['field_type'] in type_same:
                                        if field['field_type'] == '11':
                                            if 'id' in data and data['id'] and 'field' in field:
                                                try:
                                                    field_condition_val = Field_Condition.objects.get(field_son=field_form_val, type=1)
                                                except (Field_Condition.DoesNotExist):
                                                    field_form_val.save()
                                            else:
                                                field_form_val.save()
                                        else:
                                            field_form_val.save()

                                        # Campo Número de documento de Firma biométrica y Firma de documento
                                        if field['field_type'] == '10':
                                            # or field['field_type'] == '18'
                                            if field['field_type'] == '10':
                                                textLabel='Número de documento a validar biometricamente'
                                            else:
                                                textLabel='Número de documento para validar'
                                            field_form_val.obligatory = True
                                            field_form_val.save()
                                            if 'id' in data and data['id'] and 'field' in field and field['field'] != '':
                                                create_identification = False
                                                # Verifica que tenga campos relacionados
                                                try:
                                                    field_condition_val = Field_Condition.objects.get(field_father=field_form_val, type=1)

                                                    field_identification_val = Form_Field.objects.get(id=field_condition_val.field_son_id)
                                                    field_identification_val.name = textLabel
                                                    field_identification_val.position = index + 1
                                                    field_identification_val.state = True
                                                    field_identification_val.save()

                                                except (Field_Condition.DoesNotExist):
                                                    create_identification = True
                                            else:
                                                create_identification = True

                                            # Crea el campo y la condicional con el campo biométrico
                                            if create_identification:
                                                field_identification_val = Form_Field()
                                                field_identification_val.form_enterprise_id = form_id
                                                field_identification_val.name = textLabel
                                                field_identification_val.help = ''
                                                field_identification_val.position = index + 1
                                                field_identification_val.field_type_id = 11
                                                field_identification_val.save()

                                                field_condition_val = Field_Condition()
                                                field_condition_val.field_father = field_form_val
                                                field_condition_val.field_son = field_identification_val
                                                field_condition_val.type = 1
                                                field_condition_val.save()

                                        # limit and validate field
                                        if 'validate' in field:
                                            data_validate = field['validate']
                                            if 'min' in data_validate:
                                                create_parameter(field_form_val.id, 1, data_validate['min'])
                                            if 'max' in data_validate:
                                                create_parameter(field_form_val.id, 2, data_validate['max'])
                                            if 'advancedNit' in data_validate:
                                                if field['field_type'] == '20':
                                                    if len(data_validate['advancedNit']) > 0:
                                                        create_parameter(field_form_val.id, 4, data_validate['advancedNit'])
                                                        dataNit = json.loads(data_validate['advancedNit'])
                                                        position = int(field_form_val.position)
                                                        position2 = 1
                                                        try:
                                                            field_condition_val = Field_Condition.objects.get(field_father=field_form_val.id, type=1, extra=1)
                                                            field_condition_val2 = Field_Condition.objects.filter(field_father=field_condition_val.field_father_id)
                                                            for option_field_a in field_condition_val2:
                                                                name=option_field_a.field_son.name.split(" - ")
                                                                if name[1] in dataNit:
                                                                    Form_Field.objects.filter(id=option_field_a.field_son.id).update(state=True)
                                                                    indice = dataNit.index(name[1])
                                                                    dataNit.pop(indice)
                                                                    position2 +=1
                                                                else:
                                                                    Form_Field.objects.filter(id=option_field_a.field_son.id).update(state=False)
                                                                    indice = dataNit.index(name[1])
                                                                    dataNit.pop(indice)
                                                                    position2 +=1
                                                            for option_field in dataNit:
                                                                position2 +=1
                                                                field_form_val2 = Form_Field()
                                                                field_form_val2.form_enterprise_id = form_id
                                                                field_form_val2.name = field_form_val.name + ' - ' + option_field
                                                                field_form_val2.field_type_id = 21
                                                                field_form_val2.obligatory = False
                                                                field_form_val2.help = ''
                                                                field_form_val2.position = position_field
                                                                field_form_val2.save()
                                                                position = int(field_form_val2.position)
                                                                field_condition_val = Field_Condition()
                                                                field_condition_val.field_father_id = field_form_val.id
                                                                field_condition_val.field_son_id = field_form_val2.id
                                                                field_condition_val.type = 1
                                                                field_condition_val.extra = position2
                                                                field_condition_val.save()

                                                        except (Field_Condition.DoesNotExist):
                                                            for option_field in dataNit:
                                                                field_form_val2 = Form_Field()
                                                                field_form_val2.form_enterprise_id = form_id
                                                                field_form_val2.name = field_form_val.name + ' - ' + option_field
                                                                field_form_val2.field_type_id = 21
                                                                field_form_val2.obligatory = False
                                                                field_form_val2.help = ''
                                                                field_form_val2.position = position_field
                                                                field_form_val2.save()
                                                                position = int(field_form_val2.position)
                                                                field_condition_val = Field_Condition()
                                                                field_condition_val.field_father_id = field_form_val.id
                                                                field_condition_val.field_son_id = field_form_val2.id
                                                                field_condition_val.type = 1
                                                                field_condition_val.extra = position2
                                                                field_condition_val.save()
                                                                position2 +=1
                                                                position_field += 1

                                            if 'advanced' in data_validate:
                                                if field['field_type'] == '11':
                                                    create_parameter(field_form_val.id, 3, data_validate['advanced'])
                                                    data_values = field['optionDocuments']
                                                    advanced_confirm_values = data_validate['advanced_confirm'] if 'advanced_confirm' in data_validate else ''
                                                    field_form_val.save()
                                                    save_field = add_option_field(field, field_form_val, data_values)

                                                    if 'id' in data and data['id'] and 'field' in field:
                                                        try:
                                                            field_condition_val = Field_Condition.objects.get(field_father=field_form_val.id, type=1, extra=1)
                                                            print('Field_Condition True')
                                                            options_field = Option_Field.objects.filter(form_field_id=field_form_val.id, state=False).order_by('position')
                                                            for option_field in options_field:
                                                                Form_Field.objects.filter(help=option_field.id, form_enterprise_id=form_id).update(state=False)
                                                            options_field = Option_Field.objects.filter(form_field_id=field_form_val.id, state=True).order_by('position')
                                                            position = int(field_form_val.position)
                                                            for option_field in options_field:
                                                                try:
                                                                    field_form_val2 = Form_Field.objects.get(help=option_field.id, field_type_id=21, form_enterprise_id=form_id)
                                                                    field_form_val2.state=True
                                                                    field_form_val2.save()
                                                                    # Form_Field.objects.filter(help=option_field.id).update(state=True)

                                                                    if option_field.option.value in advanced_confirm_values:
                                                                        print('create_parameter True::::::::::::::')
                                                                        create_parameter(field_form_val2.id, 3, 'confirm_validation')
                                                                    else:
                                                                        print('create_parameter False:::::::::::')
                                                                        create_parameter(field_form_val2.id, 3, None)
                                                                except (Form_Field.DoesNotExist):
                                                                    field_form_val2 = Form_Field()
                                                                    field_form_val2.form_enterprise_id = form_id
                                                                    field_form_val2.name = field_form_val.name + ' - ' + option_field.option.value
                                                                    field_form_val2.field_type_id = 21
                                                                    field_form_val2.obligatory = False
                                                                    field_form_val2.help = option_field.id
                                                                    # field_form_val2.position = position + 1
                                                                    field_form_val2.position = position_field
                                                                    field_form_val2.save()
                                                                    position = int(field_form_val2.position)
                                                                    field_condition_val = Field_Condition()
                                                                    field_condition_val.field_father_id = field_form_val.id
                                                                    field_condition_val.field_son_id = field_form_val2.id
                                                                    field_condition_val.type = 1
                                                                    field_condition_val.extra = 10
                                                                    field_condition_val.save()

                                                                position_field += 1
                                                        except (Field_Condition.DoesNotExist):
                                                            print('Field_Condition False')
                                                            options_field = Option_Field.objects.filter(form_field_id=field_form_val.id, state=True).order_by('position')
                                                            if len(options_field) > 0:
                                                                # position = int(field_form_val.position)
                                                                position2 = 1
                                                                for option_field in options_field:
                                                                    field_form_val2 = Form_Field()
                                                                    field_form_val2.form_enterprise_id = form_id
                                                                    field_form_val2.name = field_form_val.name + ' - ' + option_field.option.value
                                                                    field_form_val2.field_type_id = 21
                                                                    field_form_val2.obligatory = False
                                                                    field_form_val2.help = option_field.id
                                                                    field_form_val2.position = position_field
                                                                    # field_form_val2.position = position + 1
                                                                    field_form_val2.save()
                                                                    position = int(field_form_val2.position)
                                                                    field_condition_val = Field_Condition()
                                                                    field_condition_val.field_father_id = field_form_val.id
                                                                    field_condition_val.field_son_id = field_form_val2.id
                                                                    field_condition_val.type = 1
                                                                    field_condition_val.extra = position2
                                                                    field_condition_val.save()
                                                                    position2 +=1
                                                                    position_field += 1

                                                                    if option_field.option.value in advanced_confirm_values:
                                                                        create_parameter(field_form_val2.id, 3, 'confirm_validation')
                                                    else:
                                                        field_form_val.save()
                                                else:
                                                    create_parameter(field_form_val.id, 3, data_validate['advanced'])

                                            if 'special' in data_validate:
                                                create_parameter(field_form_val.id, 5, data_validate['special'])

                                    elif field['field_type'] in type_option:
                                        data_values = field['values']
                                        field_form_val.save()
                                        save_field = add_option_field(field, field_form_val, data_values)
                                        if save_field == False:
                                            field_form_val.state = False
                                            field_form_val.save()
                                    elif field['field_type'] == '17':
                                        data_fields = field['fields']
                                        field_form_val.row = field['row']
                                        field_form_val.save()
                                        list_all_field = []
                                        if 'field' in field and field['field'] != '':
                                            list_all_field = [item['id'] for item in list(List_Field.objects.filter(form_field_id=field_form_val.id, state=True).values('id'))]
                                        for idx, field_list in enumerate(data_fields):
                                            update_list_cont = True
                                            if 'field' in field_list and field_list['field'] != '':
                                                try:
                                                    list_field_val = List_Field.objects.get(id=field_list['field'], form_field_id=field_form_val.id)
                                                    list_field_val.name = field_list['label']
                                                    list_field_val.position = idx + 1
                                                    list_all_field.remove(list_field_val.id)
                                                except (List_Field.DoesNotExist):
                                                    update_list_cont = False
                                            else:
                                                list_field_val = List_Field()
                                                list_field_val.form_field_id = field_form_val.id
                                                list_field_val.name = field_list['label'][:50]
                                                list_field_val.field_type_id = field_list['field_type']
                                                list_field_val.position = idx + 1

                                            if update_list_cont:
                                                list_field_val.save()

                                                if field_list['field_type'] in type_option:
                                                    data_values = field_list['values']
                                                    save_list_field = add_option_list_field(field_list, list_field_val, data_values)
                                                    if save_list_field == False:
                                                        list_field_val.state = False
                                                        list_field_val.save()

                                        if 'field' in field and field['field'] != '' and list_all_field:
                                            List_Field.objects.filter(id__in=list_all_field, form_field_id=field_form_val.id).update(state=False)

                                    if 'id' in data and data['id'] and 'field' in field and field['field'] != '':
                                        field_all_form.remove(field_form_val.id)

                        if 'id' in data and data['id'] and field_all_form:
                            # Campos relacionados
                            field_condition_values = [item['field_son_id'] for item in list(Field_Condition.objects.filter(field_father__form_enterprise_id=form_id, field_father__state=True, type=1).values('field_son_id'))]
                            update_not_field = Form_Field.objects.filter(id__in=field_all_form, form_enterprise_id=form_id).exclude(id__in=field_condition_values).update(state=False)
                            # Campos relacionados a eliminar
                            condition_fields = [item['field_son_id'] for item in list(Field_Condition.objects.filter(field_father_id__in=field_all_form, type=1).values('field_son_id'))]
                            Form_Field.objects.filter(id__in=condition_fields, form_enterprise_id=form_id).update(state=False)

                        log_content = {
                            'user': user_val.id,
                            'group': 15,
                            'element': form_id,
                            'action': 2,
                            'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                                user_val.first_last_name + " ha modificado la estructura de los campos del documento #" +
                                str(form_id) + ' "' + data['name'] + '"'),
                        }
                        create_traceability(log_content)

                    response['status'] = True
                    response['id'] = form_id

                    status_response = status.HTTP_201_CREATED
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

def add_option_field(field, field_form_val, data_values):
    save_field = False
    option_all_field = []
    if 'field' in field and field['field'] != '':
        option_all_field = [item['id'] for item in list(Option_Field.objects.filter(form_field_id=field_form_val.id, state=True).values('id'))]
    for idx, opt in enumerate(data_values):
        # print(opt['label'])
        if opt['label'] != '':
            save_field = True
            option = opt['label'][:40]
            try:
                option_val = Option.objects.get(value=option)
            except (Option.DoesNotExist):
                option_val = Option()
                option_val.value = option
                option_val.save()
            try:
                option_field = Option_Field.objects.get(option_id=option_val.id, form_field_id=field_form_val.id)
                option_field.position = idx + 1
                option_field.state = True
                option_field.save()
                if 'field' in field and field['field'] != '':
                    try:
                        option_all_field.remove(option_field.id)
                    except:
                        pass
            except (Option_Field.DoesNotExist):
                option_field = Option_Field()
                option_field.option = option_val
                option_field.form_field = field_form_val
                option_field.position = idx + 1
                option_field.save()

    if 'field' in field and field['field'] != '' and option_all_field:
        Option_Field.objects.filter(id__in=option_all_field, form_field=field_form_val).update(state=False)
    return save_field

def add_option_list_field(field, list_field_val, data_values):
    save_list_field = False
    option_all_field = []
    if 'field' in field and field['field'] != '':
        option_all_field = [item['id'] for item in list(Option_List_Field.objects.filter(list_field_id=list_field_val.id, state=True).values('id'))]
    for idx, opt in enumerate(data_values):
        # print(opt['label'])
        if opt['label'] != '':
            save_list_field = True
            option = opt['label'][:40]
            try:
                option_val = Option.objects.get(value=option)
            except (Option.DoesNotExist):
                option_val = Option()
                option_val.value = option
                option_val.save()
            try:
                option_field = Option_List_Field.objects.get(option_id=option_val.id, list_field_id=list_field_val.id)
                option_field.position = idx + 1
                option_field.state = True
                option_field.save()
                if 'field' in field and field['field'] != '':
                    try:
                        option_all_field.remove(option_field.id)
                    except:
                        pass
            except (Option_List_Field.DoesNotExist):
                option_field = Option_List_Field()
                option_field.option = option_val
                option_field.list_field = list_field_val
                option_field.position = idx + 1
                option_field.save()

    if 'field' in field and field['field'] != '' and option_all_field:
        Option_List_Field.objects.filter(id__in=option_all_field, list_field=list_field_val).update(state=False)
    return save_list_field

@api_view(['DELETE'])
@permission_classes([IsUserAdminOrHasPermission])
def delete(request, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        # get user and data
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        try:
            form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
            form_val.state = False
            form_val.save()

            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': form_val.id,
                'action': 3,
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " elimino el documento #" + str(form_val.id) + " " + form_val.name,
            }
            create_traceability(log_content)

            response['status'] = True
            response['id'] = form_val.id
            status_response = status.HTTP_200_OK
        except (Form_Enterprise.DoesNotExist):
            pass
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['POST'])
# @permission_classes([IsUserAdminOrHasPermission])
@permission_classes([IsAuthenticated])
def activate(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    try:
        # get user and data
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        try:
            form_val = Form_Enterprise.objects.get(id=data['id'], enterprise_id=user_val.enterprise_id)
            form_val.state = True
            form_val.save()

            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': form_val.id,
                'action': 2,
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " reactivo el documento #" + str(form_val.id) + " " + form_val.name,
            }
            create_traceability(log_content)

            response['status'] = True
            response['id'] = form_val.id
            status_response = status.HTTP_200_OK
        except (Form_Enterprise.DoesNotExist):
            pass
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_send_form(request, enterprise):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        form_link_val_share = Form_Link.objects.filter(form_enterprise_id__enterprise_id=enterprise,state=True,general_shared=False).select_related('Enterprise_Process_State').values('id','token_link','shared_media', 'shared_to', 'process_state_id','modify_date','process_state__name','form_enterprise_id__name').order_by('-modify_date')
    except Form_Link.DoesNotExist:
        form_link_val_share = []

    data_form = {
        'form_link_val_share':form_link_val_share
    }
    response['status'] = True
    response['data'] = data_form
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_detail(request, form):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        enterprise = get_enterprise(request)
        try:
            form_val = Form_Enterprise.objects.get(
                id=form,
                enterprise_id=enterprise,
                state=True
            )
            # Campo biometrico
            biometric_state = Form_Field.objects.filter(
                form_enterprise_id=form,
                form_enterprise__state=True,
                field_type_id=10,
                state=True,
            ).exists()

            # Enlace documento
            try:
                form_link_val = Form_Link.objects.get(
                    form_enterprise_id=form,
                    state=True,
                    general_shared=True
                )
                url_form = settings.URL_FRONTEND + 'public/' + form_link_val.token_link
            except Form_Link.DoesNotExist:
                # Se genera token unico por documento
                token_link = Encrypt().encrypt_code(form)
                form_link_val = Form_Link()
                form_link_val.form_enterprise_id = form
                form_link_val.token_link = token_link
                form_link_val.general_shared=True
                form_link_val.save()

                url_form = settings.URL_FRONTEND + 'public/' + form_link_val.token_link
                path = create_qr_link(enterprise, form, url_form)
                form_link_val.qr_path = path
                form_link_val.save()

            url_qr = settings.URL + 'media/' + str(form_link_val.qr_path)

            try:
                form_link_val_share = Form_Link.objects.filter(form_enterprise_id=form,state=True,general_shared=False).select_related('Enterprise_Process_State').values('id','token_link','shared_media', 'shared_to', 'process_state_id','modify_date','process_state__name')
            except Form_Link.DoesNotExist:
                form_link_val_share = []

            data_form = {
                'id': form_val.id,
                'name': replace_character(form_val.name),
                'description': replace_character(form_val.description),
                'consecutive': form_val.consecutive,
                'creation_date': form_val.creation_date,
                'biometric': biometric_state,
                'token_link': url_form,
                'access': form_link_val.access,
                'max_date': form_link_val.max_date,
                'date_state': form_link_val.date_state,
                'max_send': form_link_val.max_send,
                'send_state': form_link_val.send_state,
                'modify_date': form_link_val.modify_date,
                'url_qr': url_qr,
                'form_link_val_share':form_link_val_share
            }
            response['status'] = True
            response['data'] = data_form
            status_response = status.HTTP_200_OK
        except Form_Enterprise.DoesNotExist:
            pass
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_link(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        data = request.data
        try:
            form_val = Form_Enterprise.objects.get(
                id=data['id'],
                enterprise_id=user_val.enterprise_id,
                state=True
            )
            # Enlace documento
            try:
                form_link_val = Form_Link.objects.get(
                    form_enterprise_id=form_val.id,
                    state=True,
                    general_shared=True
                )
            except Form_Link.DoesNotExist:
                # Se genera token unico por documento
                token_link = Encrypt().encrypt_code(form_val.id)
                form_link_val = Form_Link()
                form_link_val.form_enterprise_id = form_val.id
                form_link_val.token_link = token_link
                form_link_val.general_shared=True

            form_link_val.access = data['access']
            form_link_val.date_state = data['date_state']
            if data['date_state']:
                form_link_val.max_date = data['max_date']
            form_link_val.send_state = data['send_state']
            if data['send_state']:
                form_link_val.max_send = data['max_send']
            form_link_val.save()
            data_form = {
                'id': form_val.id,
                'modify_date': form_link_val.modify_date,
            }

            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': form_val.id,
                'action': 2,
                'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                    user_val.first_last_name + " ha modificado la configuración de acceso al enlace del documento #" +
                    str(form_val.id) + ' "' + form_val.name + '"'),
            }
            create_traceability(log_content)
            response['status'] = True
            response['data'] = data_form
            status_response = status.HTTP_200_OK
        except Form_Enterprise.DoesNotExist:
            pass
        except KeyError:
            pass
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def share_forwarding(request, form):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    form_id_link = form

    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        name_enterprise = user_val.enterprise.name if user_val.enterprise.name != '' else 'Melmac'
        name_enterprise_v2 = "a "+user_val.enterprise.name if user_val.enterprise.name != '' else ''
        img = settings.URL + 'media/' + str(user_val.enterprise.logo) if user_val.enterprise.logo != '' else settings.URL_FRONTEND + 'assets/images/landing/logo_melmac.png'
        data = []

        try:
            data_token_link = Form_Link.objects.get(id=form_id_link)
            name_form = data_token_link.form_enterprise.name

            if data_token_link.shared_media == 'correo electrónico':
                arrayEmail=[]
                arrayEmail.append(data_token_link.shared_to)
                send_link_shared('1', arrayEmail, data_token_link, data, name_form, name_enterprise, img)
            elif data_token_link.shared_media == 'SMS':
                send_link_shared('2', data_token_link.shared_to, data_token_link, data, name_form, name_enterprise, img)
            elif data_token_link.shared_media == 'WhatsApp':
                send_link_shared('3', data_token_link.shared_to, data_token_link, data, name_form, name_enterprise, img)
            elif data_token_link.shared_media == 'WhatsApp y SMS':
                send_link_shared('2', data_token_link.shared_to, data_token_link, data, name_form, name_enterprise, img)
                send_link_shared('3', data_token_link.shared_to, data_token_link, data, name_form, name_enterprise, img)

            response['status'] = True
            status_response = status.HTTP_200_OK
        except Form_Link.DoesNotExist:
            pass

    except User_Enterprise.DoesNotExist:
            pass
    except IndexError:
        response['detail'] = 'Faltan parametros'
    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_forwarding_all(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        dataForm=request.data['data']
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        name_enterprise = user_val.enterprise.name if user_val.enterprise.name != '' else 'Melmac'
        name_enterprise_v2 = "a "+user_val.enterprise.name if user_val.enterprise.name != '' else ''
        img = settings.URL + 'media/' + str(user_val.enterprise.logo) if user_val.enterprise.logo != '' else settings.URL_FRONTEND + 'assets/images/landing/logo_melmac.png'
        data = []

        for value in dataForm:
            print(value)
            media = value['shared_media']
            token = value['token_link']
            name_form = value['form_enterprise_id__name']
            shared_to =  value['shared_to']
            data_token_link = Form_Link.objects.get(id=value['id'])
            print(data_token_link)
            print(media)
            if media == 'correo electrónico':
                arrayEmail=[]
                arrayEmail.append(shared_to)
                send_link_shared('1', arrayEmail, data_token_link, data, name_form, name_enterprise, img)
            elif media == 'SMS':
                send_link_shared('2', shared_to, data_token_link, data, name_form, name_enterprise, img)
            elif media == 'WhatsApp':
                send_link_shared('3', shared_to, data_token_link, data, name_form, name_enterprise, img)
            elif media == 'WhatsApp y SMS':
                send_link_shared('2', shared_to, data_token_link, data, name_form, name_enterprise, img)
                send_link_shared('3', shared_to, data_token_link, data, name_form, name_enterprise, img)

        response['status'] = True
        status_response = status.HTTP_200_OK
        pass
    except IndexError:
        response['detail'] = 'Faltan parametros'
    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def share_document(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        # get user, data and files
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        data = request.data
        form_id = data['id']
        option = data['option']
        to_list = data['list']

        name_enterprise = user_val.enterprise.name if user_val.enterprise.name != '' else 'Melmac'
        name_enterprise_v2 = "a "+user_val.enterprise.name if user_val.enterprise.name != '' else ''
        img = settings.URL + 'media/' + str(user_val.enterprise.logo) if user_val.enterprise.logo != '' else settings.URL_FRONTEND + 'assets/images/landing/logo_melmac.png'

        # Enlace documento
        try:
            form_link_val = Form_Link.objects.get(
                form_enterprise_id=form_id,
                form_enterprise__enterprise_id=user_val.enterprise_id,
                state=True,
                general_shared=True
            )
        except Form_Link.DoesNotExist:
            # Se genera token unico por documento
            token_link = Encrypt().encrypt_code(form_id)
            form_link_val = Form_Link()
            form_link_val.form_enterprise_id = form_id
            form_link_val.token_link = token_link
            form_link_val.save()

        url_form =  settings.URL_FRONTEND + 'public/' + form_link_val.token_link
        if 'qr' in data and data['qr']:
            if form_link_val.qr_path == None:
                path = create_qr_link(user_val.enterprise_id, form_id, url_form)
                form_link_val.qr_path = path
                form_link_val.save()

        if type(to_list) == type(''):
            to_list = to_list.split(';')

        name_form = form_link_val.form_enterprise.name
        description_type = ''
        description_qr = ''
        description_subject = ''

        # Opciones de envio
        if option == '1':
            for valuesEmail in to_list:
                arrayEmail=[]
                arrayEmail.append(valuesEmail)
                data_token_link = create_link_document(valuesEmail+str(form_id)+str(datetime.now()),form_id,user_val.enterprise_id,valuesEmail,"correo electrónico",form_link_val.send_state,form_link_val.max_send,0,False,form_link_val.max_date,form_link_val.date_state)
                description_type = 'correo electrónico'
                send_link_shared(option, to_list, data_token_link, data, name_form, name_enterprise, img)

        elif option == '2':
            for phoneSMS in to_list:
                data_token_link = create_link_document(phoneSMS+str(form_id)+str(datetime.now()),form_id,user_val.enterprise_id,phoneSMS,"SMS",form_link_val.send_state,form_link_val.max_send,0,False,form_link_val.max_date,form_link_val.date_state)
                description_type = 'SMS'
                send_link_shared(option, phoneSMS, data_token_link, data, name_form, name_enterprise, img)

        elif option == '3':
            for phoneWhatsApp in to_list:
                data_token_link = create_link_document(phoneWhatsApp+str(form_id)+str(datetime.now()),form_id,user_val.enterprise_id,phoneWhatsApp,"WhatsApp",form_link_val.send_state,form_link_val.max_send,0,False,form_link_val.max_date,form_link_val.date_state)
                description_type = 'WhatsApp'
                send_link_shared(option, phoneWhatsApp, data_token_link, data, name_form, name_enterprise, img, name_enterprise_v2)

        for subject in to_list:
            description_subject += (', ' if description_subject != '' else ' ha ') + subject

        log_content = {
            'user': user_val.id,
            'group': 15,
            'element': form_id,
            'action': 14,
            'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                user_val.first_last_name + " ha compartido el enlace " + description_qr +
                "del documento #" + str(form_id) + ' "' + form_link_val.form_enterprise.name + '"' +
                description_subject + " mediante " + description_type),
        }
        create_traceability(log_content)

        response['status'] = True
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    except IndexError:
        response['detail'] = 'Faltan parametros'
    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_consecutive(request):
    response = {}
    response['status'] = False
    # get user and data
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    data = request.data

    if 'name' in data and 'description' in data:
        if data['name'] != '' and data['description'] != '':
            if 'id' in data and data['id']:
                try:
                    form_val = Form_Enterprise.objects.get(id=data['id'], enterprise_id=user_val.enterprise_id)
                    # Todos los campos(id) del formulario.
                    all_forms = [item['id'] for item in list(Form_Consecutive.objects.filter(form_enterprise=form_val, state=True).values('id'))]
                    all_fields = [item['id'] for item in list(Form_Field_Consecutive.objects.filter(form_enterprise=form_val, state=True).values('id'))]
                except (Form_Enterprise.DoesNotExist):
                    return Response(response)

                # Primeras validaciones para nueva versión
                if 'forms' in data or 'fields' in data:
                    version_new = False
                    if 'id' in data and data['id']:
                        answer_form = False
                        if Answer_Consecutive.objects.filter(form_consecutive_id=form_val.id, form_version=form_val.version).exists():
                            answer_form = True

                        if answer_form:
                            json_data = form_to_json(form_val)
                            version_new = True

                        if version_new:
                            form_version_val = Form_Version()
                            form_version_val.form_enterprise = form_val
                            form_version_val.version = form_val.version
                            form_version_val.json_data = json_data
                            form_version_val.save()

                            form_val.version = form_val.version + 1
                            form_val.save()

                            log_content = {
                                'user': user_val.id,
                                'group': 15,
                                'element': form_val.id,
                                'action': 2,
                                'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                                    user_val.first_last_name + " ha modificado el documento en serie #" +
                                    str(form_val.id) + ' "' + form_val.name + '"' + " generando una nueva versión V" +
                                    str(form_val.version) + " del documento"),
                            }
                            create_traceability(log_content)

                if 'forms' in data:
                    for index, field in enumerate(data['forms']):
                        if 'id' in field and field['id'] != '':
                            # Valida si el formulario es del consecutivo.
                            try:
                                form_consecutive_val = Form_Consecutive.objects.get(form_id=field['id'], form_enterprise=form_val)
                                form_consecutive_val.position = index + 1
                                form_consecutive_val.state = True
                                form_consecutive_val.save()
                                # Se retira de la lista de los que se van a descativar.
                                try:
                                    all_forms.remove(form_consecutive_val.id)
                                except:
                                    pass
                            except (Form_Consecutive.DoesNotExist):
                                form_consecutive_new = Form_Consecutive()
                                form_consecutive_new.form_enterprise = form_val
                                form_consecutive_new.form_id = field['id']
                                form_consecutive_new.position = index + 1
                                form_consecutive_new.version = form_consecutive_new.form.version
                                form_consecutive_new.save()

                    # Se inactivan los que ya no vienen en el listado.
                    if 'id' in data and data['id']:
                        if all_forms:
                            update_not_consecutive = Form_Consecutive.objects.filter(id__in=all_forms, form_enterprise=form_val).update(state=False)

                    log_content = {
                        'user': user_val.id,
                        'group': 15,
                        'element': form_val.id,
                        'action': 2,
                        'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                            user_val.first_last_name + " ha modificado la secuencia del documento #" +
                            str(form_val.id) + ' "' + form_val.name + '"'),
                    }
                    create_traceability(log_content)

                if 'fields' in data:
                    for index, field in enumerate(data['fields']):
                        if 'set' in field and field['set'] != '' and 'get' in field and field['get'] != '':
                            # Valida si el campo es del concecutivo.
                            try:
                                field_consecutive_val = Form_Field_Consecutive.objects.get(
                                    form_enterprise=form_val,
                                    form_field_get_id=field['get'],
                                    form_field_set_id=field['set']
                                )
                                field_consecutive_val.state = True
                                field_consecutive_val.save()
                                # Se retira de la lista de los que se van a descativar.
                                try:
                                    all_fields.remove(field_consecutive_val.id)
                                except:
                                    pass
                            except (Form_Field_Consecutive.DoesNotExist):
                                field_consecutive_new = Form_Field_Consecutive()
                                field_consecutive_new.form_enterprise = form_val
                                field_consecutive_new.form_field_get_id = field['get']
                                field_consecutive_new.form_field_set_id = field['set']
                                field_consecutive_new.save()

                    # Se inactivan los que ya no vienen en el listado.
                    if 'id' in data and data['id']:
                        if all_fields:
                            update_not_field = Form_Field_Consecutive.objects.filter(id__in=all_fields, form_enterprise=form_val).update(state=False)

                    log_content = {
                        'user': user_val.id,
                        'group': 15,
                        'element': form_val.id,
                        'action': 2,
                        'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                            user_val.first_last_name + " ha modificado la configuración de los campos autocompletables del documento #" +
                            str(form_val.id) + ' "' + form_val.name + '"'),
                    }
                    create_traceability(log_content)

                response['status'] = True
                response['id'] = form_val.id

    return Response(response)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_form(request, consecutive):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST

    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        if user_val.role_id == 2:
            form_values = Form_Enterprise.objects.filter(
                enterprise_id=user_val.enterprise_id,
                consecutive=consecutive,
                visible=True,
                # digital=False,
                state=True
            ).values('id', 'name', 'description', 'digital', 'creation_date').order_by('-creation_date')
        else:
            for_user = User_Form.objects.filter(user_id=user_val.id, state=True).values_list('form_enterprise_id', flat=True)
            for_rol = []
            if user_val.role_enterprise_id != None:
                for_rol = Role_Form.objects.filter(role_id=user_val.role_enterprise_id, state=True).values_list('form_enterprise_id', flat=True)
            list_form = list(for_rol) + list(for_user)
            form_values = Form_Enterprise.objects.filter(
                id__in=list_form,
                consecutive=consecutive,
                visible=True,
                # digital=False,
                state=True
            ).values('id', 'name', 'description', 'digital', 'creation_date').order_by('-creation_date')
        response['status'] = True
        response['data'] = form_values
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_field_form(request, form):
    field_values = Form_Field.objects.filter(form_enterprise_id=form, state=True).values('id', 'name', 'help', 'obligatory', 'field_type_id').order_by('position')
    return Response(field_values)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_field_type(request, form, field_type):
    field_values = Form_Field.objects.filter(form_enterprise_id=form, field_type_id=field_type, state=True).values('id', 'name')
    return Response(field_values)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_data_form(request, form, consecutive=None, answer=None):
    response = {}
    response['status'] = False
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

    try:
        # Edición de Respuesta
        update = False
        # Respuesta de un Multi-sección
        answer_form_val = None
        version_consecutive = None
        version = None
        form_consecutive_id = None
        # Respuesta repetida
        answer_duplicate = False

        if consecutive != None and consecutive != 0 and consecutive != '' and answer != None and answer != 0 and answer != '':
            try:
                if user_val.role_id == 2:
                    answer_form_consecutive_val = Answer_Form_Consecutive.objects.get(
                        answer_consecutive_id=answer,
                        answer_form__form_enterprise_id=form,
                        state=True
                    )
                else:
                    answer_form_consecutive_val = Answer_Form_Consecutive.objects.get(
                        answer_consecutive_id=answer,
                        answer_consecutive__created_by=user_val,
                        answer_form__form_enterprise_id=form,
                        state=True
                    )
                update = True
                answer_form_val = answer_form_consecutive_val.answer_form
                form_consecutive_id = answer_form_consecutive_val.answer_consecutive.form_consecutive_id
                version_form_consecutive = answer_form_consecutive_val.answer_consecutive.form_consecutive.version
                version_consecutive = answer_form_consecutive_val.answer_consecutive.form_version
                version = answer_form_consecutive_val.answer_form.form_version
            except Answer_Form_Consecutive.DoesNotExist:
                try:
                    if user_val.role_id == 2:
                        answer_consecutive_val = Answer_Consecutive.objects.get(
                            id=answer
                        )
                    else:
                        answer_consecutive_val = Answer_Consecutive.objects.get(
                            id=answer,
                            created_by=user_val,
                        )
                    form_consecutive_id = answer_consecutive_val.form_consecutive_id
                    version_form_consecutive = answer_consecutive_val.form_consecutive.version
                    version_consecutive = answer_consecutive_val.form_version
                except Answer_Consecutive.DoesNotExist:
                    pass
        # Respuesta de única sección y Digital
        elif answer != None and answer != 0 and answer != '':
            if user_val.role_id == 2:
                answer_form_val = Answer_Form.objects.get(
                    id=answer,
                    state=True
                )
            else:
                answer_form_val = Answer_Form.objects.get(
                    id=answer,
                    created_by=user_val,
                    state=True
                )
            update = True
            version = answer_form_val.form_version

            # Validación de respuesta repetida
            try:
                Validate_Answer_Form.objects.get(answer_form=answer_form_val, show=False, cause=0)
                answer_duplicate = True
            except (Validate_Answer_Form.DoesNotExist):
                pass

        public = answer_form_val != None and answer_form_val.public
        # Valida si el formulario es de la empresa
        form_val = Form_Enterprise.objects.get(id=form, enterprise_id=user_val.enterprise_id, consecutive=False)

        # Versión de consecutivo en caso de tener
        version_consecutive_change = None
        if version_consecutive != None and version_consecutive != version_form_consecutive:
            version_consecutive_change = version_consecutive

        if version == form_val.version:
            fields_array = get_field(form_val.id, consecutive, update, answer_form_val, form_consecutive_id, version_consecutive_change)
        elif version != None:
            fields_array = get_field_version(answer_form_val, consecutive, form_consecutive_id, version_consecutive_change)

        if version == None:
            fields_array = get_field(form_val.id, consecutive, update, answer_form_val)
            version = form_val.version
        response['status'] = True
        response['form'] = {
            'name': replace_character(form_val.name),
            'description': replace_character(form_val.description),
            'theme': str(form_val.theme),
            'version_consecutive': version_consecutive,
            'version': version,
            'color': form_val.color,
            'pin': form_val.pin,
            'digital': form_val.digital,
            'public': public,
            'fields': fields_array,
            'answer_duplicate': answer_duplicate
        }

    except Answer_Form.DoesNotExist:
        response["message"] = 'Solo puedes editar respuestas tuyas.'
    except (Form_Enterprise.DoesNotExist):
        pass
    return Response(response)

def get_field(form_id, consecutive=None, update=False, answer_form_val=None, consecutive_id=None, version_consecutive=None):
    # Campos del formulario
    fields_form = Form_Field.objects.filter(form_enterprise_id=form_id, state=True).order_by('position', '-field_type__name')
    # exclude(field_type=21) Revisarlo
    fields_array = []
    type_option = [3, 12, 13]
    for field_form in fields_form:
        options = []
        if field_form.field_type_id in type_option:
            options_field = Option_Field.objects.filter(form_field_id=field_form.id, state=True).order_by('position')
            for option_field in options_field:
                options.append({
                    'value': str(option_field.option_id),
                    'label': option_field.option.value,
                })

        fields = []
        if field_form.field_type_id == 17:
            list_field_values = List_Field.objects.filter(form_field_id=field_form.id, state=True).order_by('position')
            for list_field in list_field_values:
                options_list = []
                if list_field.field_type_id in type_option:
                    options_list_field = Option_List_Field.objects.filter(list_field_id=list_field.id, state=True).order_by('position')
                    for option_list_field in options_list_field:
                        options_list.append({
                            'value': str(option_list_field.option_id),
                            'label': option_list_field.option.value,
                        })
                fields.append({
                    'field': str(list_field.id),
                    'label': list_field.name,
                    'field_type': str(list_field.field_type_id),
                    'values': options_list,
                })

        answer = ''
        # En caso de tener campos autocompletables obtiene sus respuestas
        if consecutive != None and consecutive != 0:
            # Si es de una versión anterior
            if version_consecutive != None:
                try:
                    data_form = Form_Version.objects.get(form_enterprise_id=consecutive_id, version=version_consecutive)
                    json_to_form = json.loads(data_form.json_data)
                    if json_to_form['consecutive'] and 'consecutive_data' in json_to_form:
                        for consecutive_data in json_to_form['consecutive_data']:
                            if field_form.id == int(consecutive_data['form_field_set_id']):
                                try:
                                    answer_field_fill = Answer_Field.objects.get(answer_form__answer_form_consecutive__answer_consecutive_id=consecutive, form_field_id=consecutive_data['form_field_get_id'])
                                    if answer != '':
                                        answer += ' ' + answer_field_fill.value
                                    else:
                                        answer += answer_field_fill.value
                                except (Answer_Field.DoesNotExist):
                                    answer += ''
                except (Form_Version.DoesNotExist):
                    pass
            else:
                # Versión actual
                try:
                    form_field_consecutive_val = Form_Field_Consecutive.objects.filter(form_enterprise__answer_consecutive__id=consecutive, form_field_set_id=field_form.id, state=True)
                    for field_fill in form_field_consecutive_val:
                        try:
                            answer_field_fill = Answer_Field.objects.get(answer_form__answer_form_consecutive__answer_consecutive_id=consecutive, form_field_id=field_fill.form_field_get_id)
                            if answer != '':
                                answer += ' ' + answer_field_fill.value
                            else:
                                answer += answer_field_fill.value
                        except (Answer_Field.DoesNotExist):
                            answer += ''
                except (Form_Field_Consecutive.DoesNotExist):
                    pass

        # Trae las respuesta al editar
        if update:
            try:
                if answer == '':
                    answer_field_val = Answer_Field.objects.get(answer_form=answer_form_val, form_field_id=field_form.id)
                    answer = answer_field_val.value
            except (Answer_Field.DoesNotExist):
                pass

        data_field = {
            'field': str(field_form.id),
            'field_type': str(field_form.field_type_id),
            'label': replace_character(field_form.name),
            'description': replace_character(field_form.help),
            'required': field_form.obligatory,
            'answer': answer,
            'values': options,
            'fields': fields,
            'row': field_form.row,
            'obligatory_visit': field_form.obligatory_visit,
        }

        type_field_limit = [1, 2, 5, 6, 11, 20, 21, 22, 23, 25]
        data_field['validate'] = {}
        data_field['valuesDocuments'] = {}
        data_field['valuesNit'] = {}
        data_field['optionDocuments'] = {}
        # max o min and advanced
        if field_form.field_type_id in type_field_limit:
            field_parameters = Form_Field_Parameter.objects.filter(form_field_id=field_form.id, state=True)
            for field_parameter in field_parameters:
                if field_parameter.parameter_validate_id == 1:
                    data_field['validate']['min'] = field_parameter.value
                elif field_parameter.parameter_validate_id == 2:
                    data_field['validate']['max'] = field_parameter.value
                elif field_parameter.parameter_validate_id == 3 or field_parameter.parameter_validate_id == 4:
                    arr = field_parameter.value.replace("\"", "").replace("[", "").replace("]", "").split(',')
                    option_array = []
                    count =0
                    for parameter in arr:
                        if parameter != '':
                            option_array.append({
                                'label': parameter,
                                'value': count
                            })
                            count +=1
                    if field_form.field_type_id == 11:
                        data_field['validate']['advanced'] = field_parameter.value
                        data_field['valuesDocuments'] = option_array

                        # if field_form.field_type_id == 11 and update:
                        #     fields_doc = []
                        #     fields_form_doc = Form_Field.objects.filter(form_enterprise_id=form_id, field_type=21, state=True).order_by('position', '-field_type__name')
                        #     for field_doc in fields_form_doc:
                        #         # Trae las respuesta al editar
                        #         try:
                        #             answer_field_val = Answer_Field.objects.get(answer_form=answer_form_val, form_field_id=field_doc.id)
                        #             answer_doc = answer_field_val.value
                        #         except (Answer_Field.DoesNotExist):
                        #             answer_doc = ''
                        #         fields_doc.append({
                        #             'label': replace_character(field_doc.name),
                        #             'answer': answer_doc
                        #         })
                        #     data_field['fields_doc'] = fields_doc

                    elif field_form.field_type_id == 20:
                        data_field['validate']['advancedNit'] = field_parameter.value
                        data_field['valuesNit'] = option_array
                    else:
                        data_field['validate']['advanced'] = field_parameter.value


                    options = []
                    options2 = []
                    confirm_validation = []
                    options_field = Option_Field.objects.filter(form_field_id=field_form.id, state=True).order_by('position')
                    for option_field in options_field:
                        # Id Field Registraduria
                        dataRorm = Form_Field.objects.get(help=option_field.id, field_type_id=21, form_enterprise_id=form_id)
                        options2.append(str(option_field.option.value))
                        options.append({
                            'value': str(option_field.option_id),
                            'label': option_field.option.value,
                            'field': str(dataRorm.id)
                        })

                        validate_field_parameters = Form_Field_Parameter.objects.filter(form_field_id=dataRorm.id, state=True)
                        for validate_field in validate_field_parameters:
                            if str(validate_field.value) == "confirm_validation":
                                confirm_validation.append(str(option_field.option.value))

                    data_field['optionDocuments'] = options
                    data_field['validate']['advanced_options'] = str(options2).replace("'", "\"")
                    data_field['validate']['advanced_confirm'] = str(confirm_validation).replace("'", "\"")

                elif field_parameter.parameter_validate_id == 5:
                    data_field['validate']['special'] = field_parameter.value

        fields_array.append(data_field)

    return fields_array

def get_field_version(answer_form_val, consecutive=None, consecutive_id=None, version_consecutive=None):
    fields_array = []
    try:
        data_form = Form_Version.objects.get(form_enterprise_id=answer_form_val.form_enterprise_id, version=answer_form_val.form_version)
        json_to_form = json.loads(data_form.json_data)
        type_option = ['3', '12', '13']
        for field_form in json_to_form['fields']:
            if field_form['field_type'] != '21':
                answer = ''
                options = []
                fields = []
                if field_form['field_type'] in type_option:
                    options = field_form['data']['values']
                elif field_form['field_type'] == '17':
                    fields = field_form['fields']

                if version_consecutive != None:
                    try:
                        data_form_consecutive = Form_Version.objects.get(form_enterprise_id=consecutive_id, version=version_consecutive)
                        json_to_consecutive = json.loads(data_form_consecutive.json_data)
                        if json_to_consecutive['consecutive'] and 'consecutive_data' in json_to_consecutive:
                            for consecutive_data in json_to_consecutive['consecutive_data']:
                                if int(field_form['field']) == int(consecutive_data['form_field_set_id']):
                                    try:
                                        answer_field_fill = Answer_Field.objects.get(answer_form__answer_form_consecutive__answer_consecutive_id=consecutive, form_field_id=consecutive_data['form_field_get_id'])
                                        if answer != '':
                                            answer += ' ' + answer_field_fill.value
                                        else:
                                            answer += answer_field_fill.value
                                    except (Answer_Field.DoesNotExist):
                                        answer += ''
                    except (Form_Version.DoesNotExist):
                        pass

                try:
                    if answer == '':
                        answer_field_val = Answer_Field.objects.get(answer_form=answer_form_val, form_field_id=field_form['field'])
                        answer = answer_field_val.value
                except (Answer_Field.DoesNotExist):
                    pass

                data_field = {
                    'field': str(field_form['field']),
                    'field_type': int(field_form['field_type']),
                    'label': replace_character(field_form['label']),
                    'description': replace_character(field_form['description']),
                    'required': field_form['required'],
                    'answer': answer,
                    'values': options,
                    'fields': fields,
                    'row': field_form['row'],
                    'validate': field_form['validate'] if 'validate' in field_form else {},
                    'optionDocuments': field_form['optionDocuments'] if 'optionDocuments' in field_form else {},
                    'valuesDocuments': field_form['valuesDocuments'] if 'valuesDocuments' in field_form else {},
                    'valuesNit': field_form['valuesNit'] if 'valuesNit' in field_form else {},
                }
                fields_array.append(data_field)

    except (Form_Version.DoesNotExist):
        pass
    return fields_array

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_data_consecutive(request, form):
    response = {}
    response['status'] = False

    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    data = request.data

    try:
        # Valida si el formulario es de la empresa y consecutivo.
        form_val = Form_Enterprise.objects.get(id=form, enterprise_id=user_val.enterprise_id, consecutive=True)

        not_form = []
        forms_array = []
        # Consecutivo de los formularios
        forms_consecutive = Form_Consecutive.objects.filter(form_enterprise=form_val, state=True).order_by('position')
        for consecutive in forms_consecutive:
            not_form.append(consecutive.form_id)
            fields_array = []
            # Campos que se autocompletan
            fields_consecutive = Form_Field_Consecutive.objects.filter(form_enterprise=form_val, form_field_set__form_enterprise_id=consecutive.form_id, state=True)
            for field in fields_consecutive:
                fields_array.append({
                    'id_set': field.form_field_set_id,
                    'set': field.form_field_set.name,
                    'id_get': field.form_field_get_id,
                    'get': field.form_field_get.name,
                })

            forms_array.append({
                'id': consecutive.form_id,
                'name': consecutive.form.name,
                'fields': fields_array,
            })

        if user_val.role_id == 2:
            form_values = Form_Enterprise.objects.filter(
                enterprise_id=user_val.enterprise_id,
                consecutive=False,
                visible=True,
                state=True
            ).exclude(
                id__in=not_form
            ).values('id', 'name', 'description')
        else:
            for_user = User_Form.objects.filter(user_id=user_val.id, state=True).values_list('form_enterprise_id', flat=True)
            for_rol = []
            if user_val.role_enterprise_id != None:
                for_rol = Role_Form.objects.filter(role_id=user_val.role_enterprise_id, state=True).values_list('form_enterprise_id', flat=True)
            list_form = list(for_rol) + list(for_user)
            form_values = Form_Enterprise.objects.filter(
                id__in=list_form,
                consecutive=False,
                visible=True,
                state=True
            ).exclude(
                id__in=not_form
            ).values('id', 'name', 'description')

        response['status'] = True
        response['consecutive'] = {
            'name': form_val.name,
            'description': form_val.description,
            'version': form_val.version,
            'theme': str(form_val.theme),
            'color': form_val.color,
            'pin': form_val.pin,
            'digital': form_val.digital,
            'forms': forms_array,
            'todo': list(form_values)
        }

    except (Form_Enterprise.DoesNotExist):
        pass
    return Response(response)

@api_view(['GET'])
# @permission_classes([IsAuthenticated])
def get_sequence(request, form, answer=None):
    response = {}
    response['status'] = False

    try:
        # Valida si el formulario es de la empresa y consecutivo.
        form_val = Form_Enterprise.objects.get(id=form, consecutive=True, state=True)

        forms_array = []
        forms_id = []
        version = None
        if answer != None:
            answer_consecutive_val = Answer_Consecutive.objects.get(
                id=answer,
            )
            version = answer_consecutive_val.form_version

        if version != None and version != form_val.version:
            data_form = Form_Version.objects.get(form_enterprise=form_val, version=version)
            json_to_form = json.loads(data_form.json_data)
            for form in json_to_form['forms']:
                forms_id.append(form['id'])
                try:
                    form_sec_val = Form_Enterprise.objects.get(id=form['id'], version=form['version'])
                    name = form_sec_val.name
                    description = form_sec_val.description
                except (Form_Enterprise.DoesNotExist):
                    form_sec_val = Form_Version.objects.get(form_enterprise_id=form['id'], version=form['version'])
                    json_to_form_sec = json.loads(form_sec_val.json_data)
                    name = json_to_form_sec['name']
                    description = json_to_form_sec['description']
                forms_array.append({
                    'id': form['id'],
                    'name': replace_character(name),
                    'description': replace_character(description),
                    'version': form['version'],
                })
        else:
            # Consecutivo de los formularios
            version = form_val.version
            forms_consecutive = Form_Consecutive.objects.filter(form_enterprise=form_val, state=True).order_by('position')
            for consecutive in forms_consecutive:
                forms_id.append(consecutive.form_id)
                forms_array.append({
                    'id': consecutive.form_id,
                    'name': replace_character(consecutive.form.name),
                    'description': replace_character(consecutive.form.description),
                    'version': consecutive.form.version,
                })

        # Campo biometrico
        biometric_state = Form_Field.objects.filter(
            form_enterprise_id__in=forms_id,
            form_enterprise__state=True,
            field_type_id=10,
            state=True,
        ).exists()

        response['status'] = True
        response['version'] = version
        response['consecutive'] = {
            'name': replace_character(form_val.name),
            'description': replace_character(form_val.description),
            'forms': forms_array,
            'biometric': biometric_state,
        }

    except (Form_Enterprise.DoesNotExist):
        pass
    except (Form_Version.DoesNotExist):
        pass
    return Response(response)

def create_project_form(request_user):
    form_data = {
        'name': 'Evidencia de Entrega',
        'description': 'Documento que se debe llenar para poder confirmar la entrega de un mensajero.',
        'fields': [
            {'label': 'Número de documento', 'required': True, 'field_type': '11'},
            {'label': 'Firma', 'required': True, 'field_type': '7'},
            {'label': 'Captura', 'required': False, 'field_type': '9'}
        ],
    }
    user_val = User_Enterprise.objects.get(user=request_user)
    response_form = create_form(user_val, form_data)
    create_field(response_form['form'], form_data['fields'], 'project')
    return response_form['form']

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_all_data_consecutive(request):
    response = {}
    response['status'] = False

    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

    try:
        # Valida si el formulario es de la empresa y consecutivo.
        forms_val = Form_Enterprise.objects.filter(enterprise_id=user_val.enterprise_id, consecutive=True).order_by('id').values()
        consecutive_ids = [form['id'] for form in forms_val]
        not_form = []

        forms_consecutive = Form_Consecutive.objects.filter(form_enterprise_id__in=consecutive_ids, state=True).select_related('form').order_by('position').values('id', 'form_enterprise_id', 'form_id', 'position', 'state', 'form__name', 'form__description')

        get_attr = lambda form: form['form_enterprise_id'] if 'form_enterprise_id' in form else 0
        consecutive_dict = {k: list(g) for k, g in itertools.groupby(sorted(forms_consecutive, key=get_attr), get_attr)}

        form_parents = Form_Enterprise.objects.filter(id__in=consecutive_dict.keys()).values('id', 'name', 'description')
        form_parents = {form['id']: form for form in form_parents}

        forms_data = []
        for parent, form_list in consecutive_dict.items():
            temp = {'id': parent}
            forms_array = []

            for consecutive in form_list:
                not_form.append(consecutive['form_id'])
                # Campos que se autocompletan
                fields_array = []
                # Campos que se autocompletan
                fields_consecutive = Form_Field_Consecutive.objects.filter(form_enterprise_id=parent, form_field_set__form_enterprise_id=consecutive['form_id'], state=True)
                for field in fields_consecutive:
                    fields_array.append({
                        'id_set': field.form_field_set_id,
                        'set': field.form_field_set.name,
                        'id_get': field.form_field_get_id,
                        'get': field.form_field_get.name,
                    })

                forms_array.append({
                    'id': consecutive['form_id'],
                    'name': replace_character(consecutive['form__name']),
                    'description': replace_character(consecutive['form__description']),
                    'fields': fields_array,
                })

            temp['name'] = replace_character(form_parents[parent]['name'])
            temp['description'] = replace_character(form_parents[parent]['description'])
            temp['forms']= forms_array
            forms_data.append(temp)

        response['status'] = True
        response['data'] = forms_data

    except (Form_Enterprise.DoesNotExist):
        pass
    return Response(response)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_all_data_fields(request):
    response = {}
    response['status'] = False
    response['data'] = []

    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

    try:
        # Valida si el formulario es de la empresa
        form_values = Form_Enterprise.objects.filter(enterprise_id=user_val.enterprise_id, consecutive=False, state=True)
        # Campos del formulario
        fields_form_values = Form_Field.objects.filter(form_enterprise__enterprise_id=user_val.enterprise_id, state=True).order_by('position', '-field_type__name')
        get_attr = lambda field: field.form_enterprise_id
        field_form_dict = {k: list(g) for k, g in itertools.groupby(sorted(fields_form_values, key=get_attr), get_attr)}

        for form_val in form_values:
            fields_array = []
            fields_form = field_form_dict[form_val.id] if form_val.id in field_form_dict else []
            for field_form in fields_form:
                options = []
                if field_form.field_type_id == 3 or field_form.field_type_id == 12 or field_form.field_type_id == 13:
                    options_field = Option_Field.objects.filter(form_field_id=field_form.id, state=True).order_by('position')
                    for option_field in options_field:
                        options.append({
                            'value': str(option_field.option_id),
                            'label': replace_character(option_field.option.value),
                        })

                fields = []
                if field_form.field_type_id == 17:
                    list_field_values = List_Field.objects.filter(form_field_id=field_form.id, state=True).order_by('position')
                    for list_field in list_field_values:
                        fields.append({
                            'field': str(list_field.id),
                            'label': list_field.name,
                            'field_type': str(list_field.field_type_id),
                        })

                data_field = {
                    'field': str(field_form.id),
                    'field_type': str(field_form.field_type_id),
                    'label': replace_character(field_form.name),
                    'description': replace_character(field_form.help),
                    'required': field_form.obligatory,
                    'answer': '',
                    'values': options,
                    'fields': fields,
                    'row': field_form.row,
                }

                type_field_limit = [1, 2, 5, 6, 11, 20, 22, 23, 25]
                data_field['validate'] = {}
                # max o min
                if field_form.field_type_id in type_field_limit:
                    field_parameters = Form_Field_Parameter.objects.filter(form_field_id=field_form.id, state=True)
                    for field_parameter in field_parameters:
                        if field_parameter.parameter_validate_id == 1:
                            data_field['validate']['min'] = field_parameter.value
                        elif field_parameter.parameter_validate_id == 2:
                            data_field['validate']['max'] = field_parameter.value
                        elif field_parameter.parameter_validate_id == 3:
                            data_field['validate']['advanced'] = field_parameter.value
                        elif field_parameter.parameter_validate_id == 4:
                            data_field['validate']['advancedNit'] = field_parameter.value
                        elif field_parameter.parameter_validate_id == 5:
                            data_field['validate']['special'] = field_parameter.value

                fields_array.append(data_field)
            response['data'].append({
                'id': form_val.id,
                'name': replace_character(form_val.name),
                'description': replace_character(form_val.description),
                'fields': fields_array
            })
        response['status'] = True
    except Answer_Form.DoesNotExist:
        pass
    except Answer_Form_Consecutive.DoesNotExist:
        pass
    except (Form_Enterprise.DoesNotExist):
        pass
    return Response(response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def count_forms_sync(request):
    response = {}
    response['status'] = False
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    count_unic_val = Answer_Form.objects.filter(created_by = user_val, online = False, consecutive = False).count()
    count_consecutive_val = Answer_Consecutive.objects.filter(created_by_id = user_val, online = False).count()
    try:
        response['status'] = True
        response['data'] = count_unic_val + count_consecutive_val
    except KeyError:
        response['status'] = False
        response['message'] = 'Faltan parametros por enviar'
    return Response(response)


def get_options(options_field:list):
    options = []
    for option_field in options_field:
        options.append({
            'value': str(option_field['option_id']),
            'label': option_field['option__value'],
        })
    return options

def get_fields(list_field:list):
    fields = []
    type_option = [3, 12, 13]
    fields_ids = [ field['id'] for field in list_field ]
    # Opciones de la tabla.
    options_field = Option_List_Field.objects.filter(
        list_field_id__in=fields_ids,
        state=True
    ).select_related(
        'option'
    ).order_by(
        'list_field_id',
        'position'
    ).values(
        'list_field_id',
        'option_id',
        'option__value'
    )

    field_options_dict = {
        k: list(g) for k, g in itertools.groupby(list(options_field), lambda option: option['list_field_id'])
    }

    for field in list_field:
        data_field = {
            'field': str(field['id']),
            'label': field['name'],
            'field_type': str(field['field_type_id']),
        }
        if field['field_type_id'] in type_option:
            options_field = field_options_dict[field['id']]
            options = get_options(options_field)
            data_field['values'] = options

        fields.append(data_field)
    return fields

def get_field_arrays(form_val:Form_Enterprise, form_digital_val, type):
    consecutive_fields = None
    forms_ids = [form_val.id]
    # Campos del formulario.
    fields_form = Form_Field.objects.filter(
        form_enterprise_id=form_val.id,
        state=True
    ).order_by(
        'position',
        '-field_type__name'
    ).values(
        'id',
        'field_type_id',
        'name',
        'help',
        'obligatory',
        'row',
        'form_enterprise_id'
    )

    if form_val.consecutive:
        # Campos de los formularios en la secuencia.
        sequence_ids = Form_Consecutive.objects.filter(
            form_enterprise=form_val,
            state=True
        ).order_by(
            'position'
        ).values_list(
            'form_id',
            flat=True
        )

        forms_ids += sequence_ids

        consecutive_fields = Form_Field.objects.filter(
            form_enterprise__in=sequence_ids,
            state=True
        ).order_by(
            'form_enterprise_id',
            'position',
            '-field_type_id',
        ).values(
            'id',
            'field_type_id',
            'name',
            'help',
            'obligatory',
            'row',
            'form_enterprise_id'
        )

        fields_form = list(fields_form) + list(consecutive_fields)

        # Campos de tipo tabla
        list_fields = List_Field.objects.filter(
            form_field__form_enterprise__in=sequence_ids,
            form_field__state=True,
            state=True
        ).order_by('form_field_id').values(
            'form_field_id',
            'id',
            'field_type_id',
            'name',
        )
    else:
        # Campos de tipo tabla
        list_fields = List_Field.objects.filter(
            form_field__form_enterprise=form_val.id,
            form_field__state=True,
            state=True
        ).order_by('form_field_id').values(
            'form_field_id',
            'id',
            'field_type_id',
            'name',
        )

    list_field_dict = {
        k: list(g) for k, g in itertools.groupby(list(list_fields), lambda list: list['form_field_id'])
    }

    fields_ids = [ field['id'] for field in list(fields_form) ]

    # Opciones de los formularios.
    options_field = Option_Field.objects.filter(
        form_field_id__in=fields_ids,
        state=True
    ).select_related(
        'option'
    ).order_by(
        'form_field_id',
        'position'
    ).values(
        'form_field_id',
        'option_id',
        'option__value'
    )

    field_options_dict = {
        k: list(g) for k, g in itertools.groupby(list(options_field), lambda option: option['form_field_id'])
    }

    forms_dict = {
        k: list(g) for k, g in itertools.groupby(list(fields_form), lambda form: form['form_enterprise_id'])
    }

    # Nombre de los formularios
    if len(forms_ids) > 1:
        form_vals = Form_Enterprise.objects.filter(id__in=forms_ids).values('id', 'name', 'description')
        form_vals = { form['id']: {
            'name': form['name'],
            'description': form['description'],
        } for form in form_vals }
    else:
        form_vals = { form_val.id: {
            'name': form_val.name,
            'description': form_val.description,
        }}

    # Campos en el documento digital
    if form_digital_val != None:
        fields_digital = Digital_Field.objects.filter(
            form_digital=form_digital_val,
            state=True
        ).order_by('form_field_id').values(
            'form_field_id',
            'id',
            'page',
            'left',
            'top',
            'font',
            'size',
            'color',
            'bold',
            'italic',
            'underline',
            'width',
            'height',
            'line_height',
            'option',
            'option_value',
            'row_field',
            'list_field',
        )

        field_digital_dict = {
            k: list(g) for k, g in itertools.groupby(list(fields_digital), lambda digital: digital['form_field_id'])
        }

    forms_array = []
    fields_digital_array = []
    type_validate = [1, 2, 5, 6, 11, 20, 21, 22, 23]
    type_option = [3, 12, 13]
    for form_id, fields in forms_dict.items():
        data_form = {
            'id': form_id,
            'name': form_vals[form_id]['name'],
            'description': form_vals[form_id]['description'],
            'fields':[],
        }
        for field_form in fields:
            data_field = {
                'field': str(field_form['id']),
                'field_type': str(field_form['field_type_id']),
                'label': field_form['name'],
                'row': field_form['row'],
                'description': field_form['help'],
                'required': field_form['obligatory'],
            }
            if field_form['field_type_id'] in type_validate:
                data_field['validate'] = {}
                data_field['valuesDocuments'] = {}
                data_field['valuesNit'] = {}
                data_field['optionDocuments'] = {}
                # max o min and advanced
                field_parameters = Form_Field_Parameter.objects.filter(form_field_id=field_form['id'], state=True)
                for field_parameter in field_parameters:
                    if field_parameter.parameter_validate_id == 1:
                        data_field['validate']['min'] = field_parameter.value
                    elif field_parameter.parameter_validate_id == 2:
                        data_field['validate']['max'] = field_parameter.value
                    elif field_parameter.parameter_validate_id == 3 or field_parameter.parameter_validate_id == 4:
                        arr = field_parameter.value.replace("\"", "").replace("[", "").replace("]", "").split(',')
                        option_array = []
                        count = 0
                        for parameter in arr:
                            if parameter != '':
                                option_array.append({
                                    'label': parameter,
                                    'value': count
                                })
                                count +=1
                        if field_form['field_type_id'] == 11:
                            data_field['validate']['advanced'] = field_parameter.value
                            data_field['valuesDocuments'] = option_array
                        elif field_form['field_type_id'] == 20:
                            data_field['validate']['advancedNit'] = field_parameter.value
                            data_field['valuesNit'] = option_array
                        else:
                            data_field['validate']['advanced'] = field_parameter.value

                        options = []
                        options2 = []
                        options_field = Option_Field.objects.filter(form_field_id=field_form['id'], state=True).order_by('position')
                        for option_field in options_field:
                            options2.append(str(option_field.option.value))
                            options.append({
                                'value': str(option_field.option_id),
                                'label': option_field.option.value,
                            })

                        data_field['optionDocuments'] = options
                        data_field['validate']['advanced_options'] = str(options2).replace("'", "\"")
                    elif field_parameter.parameter_validate_id == 5:
                        data_field['validate']['special'] = field_parameter.value

            elif field_form['field_type_id'] in type_option:
                options_field = field_options_dict[field_form['id']]
                options = get_options(options_field)
                data_field['data'] = {'values': options}
            elif field_form['field_type_id'] == 17:
                list_column_field = list_field_dict[field_form['id']]
                fields = get_fields(list_column_field)
                data_field['fields'] = fields

            if form_digital_val != None:
                if field_form['id'] in field_digital_dict:
                    for field_digital in field_digital_dict[field_form['id']]:
                        data_digital = {
                            'id': field_digital['id'],
                            'field': str(field_form['id']),
                            'field_type': str(field_form['field_type_id']),
                            'label': field_form['name'],
                            'page': field_digital['page'],
                            'left': field_digital['left'],
                            'top': field_digital['top'],
                            'font': field_digital['font'],
                            'size': field_digital['size'],
                            'color': field_digital['color'],
                            'bold': field_digital['bold'],
                            'italic': field_digital['italic'],
                            'underline': field_digital['underline'],
                            'size_image_x': field_digital['width'],
                            'size_image_y': field_digital['height'],
                            'line_height': field_digital['line_height'],
                            'option': str(field_digital['option']),
                            'option_value': str(field_digital['option_value']),
                            'row': field_form['row'],
                            'row_field': field_digital['row_field'],
                            'column_value': str(field_digital['list_field']),
                            'fields': get_fields(list_field_dict[field_form['id']]) if field_form['id'] in list_field_dict else [],
                            'data': {
                                'values': get_options(field_options_dict[field_form['id']]) if field_form['id'] in field_options_dict else []
                            },
                        }
                        fields_digital_array.append(data_digital)
            data_form['fields'].append(data_field)
        forms_array.append(data_form)

    return forms_array, fields_digital_array

class DigitalDetail(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST

        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        try:
        # Valida si el formulario es de la empresa.
            form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
            form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)

            # Información del pdf
            pdf_template_file = settings.MEDIA_ROOT + '/' + str(form_digital_val.template)
            pdf_template = PdfReader(open(pdf_template_file, 'rb'))
            pages = len(pdf_template.pages)
            measures = pdf_template.pages[0].mediabox
            width = float(measures[2])
            height = float(measures[3])

            # Campos del formulario.
            forms_array, fields_digital_array = get_field_arrays(form_val, form_digital_val, 'get')

            response['status'] = True
            response['data'] = {
                'width': str(width),
                'height': str(height),
                'pages': pages,
                'forms': forms_array,
                'digital': fields_digital_array
            }
            status_response = status.HTTP_200_OK

        except (Form_Enterprise.DoesNotExist):
            pass
        except (Form_Digital.DoesNotExist):
            pass
        return Response(response, status=status_response)

    def post(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            # get user, data and files
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            data = request.data

            try:
                form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
                form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)

                log_content = {
                    'user': user_val.id,
                    'group': 15,
                    'element': form_val.id,
                    'action': 2,
                    'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                        user_val.first_last_name + " ha modificado la configuración de los campos en la plantilla del documento #" +
                        str(form_val.id) + ' "' + form_val.name + '"'),
                }
                create_traceability(log_content)

                all_fields = [item['id'] for item in list(Digital_Field.objects.filter(form_digital=form_digital_val, state=True).values('id'))]

                if 'fields' in data:
                    if data['fields']:
                        # recorre los campos
                        for field in data['fields']:
                            update_field_cont = True
                            if 'id' in field and field['id'] != 0:
                                # Valida si el campo es del documento digital.
                                try:
                                    digital_field_val = Digital_Field.objects.get(id=field['id'], form_digital=form_digital_val)
                                    digital_field_val.state = True
                                except (Digital_Field.DoesNotExist):
                                    update_field_cont = False
                            else:
                                digital_field_val = Digital_Field()
                                digital_field_val.form_digital = form_digital_val
                                digital_field_val.form_field_id = field['field']

                            if update_field_cont:
                                digital_field_val.page = field['page']
                                digital_field_val.left = field['left']
                                digital_field_val.top = field['top']
                                digital_field_val.font = field['font']
                                digital_field_val.size = field['size']
                                digital_field_val.color = field['color']
                                digital_field_val.bold = field['bold']
                                digital_field_val.italic = field['italic']
                                digital_field_val.underline = field['underline']
                                digital_field_val.width = field['size_image_x']
                                digital_field_val.height = field['size_image_y']
                                if field['field_type'] in ['1','2','5','6','25']:
                                    digital_field_val.line_height = field['line_height']
                                digital_field_val.option = field['option']
                                # Guarda la opción escogida
                                if field['field_type'] == '3' or field['field_type'] == '12' or field['field_type'] == '13':
                                    if field['option'] == '1':
                                        digital_field_val.option_value = field['option_value']
                                if field['field_type'] == '17':
                                    digital_field_val.row_field = field['row_field']
                                    digital_field_val.list_field = field['column_value']
                                    fields_column_ids = { column['field']: column['field_type'] for column in field['fields'] }
                                    try:
                                        if fields_column_ids[field['column_value']] in ['3', '12', '13'] and field['option'] == '1':
                                            digital_field_val.option_value = field['option_value']
                                        elif fields_column_ids[field['column_value']] in ['1','2','5','6']:
                                            digital_field_val.line_height = field['line_height']
                                    except:
                                        pass
                                digital_field_val.save()
                                # Se retira de la lista de los que se van a descativar.
                                if 'id' in field and field['id'] != 0:
                                    all_fields.remove(digital_field_val.id)

                        if all_fields:
                            # Se inactivan los que ya no vienen en la actualización.
                            Digital_Field.objects.filter(id__in=all_fields, form_digital=form_digital_val).update(state=False)

                        form_digital_val.status = 1
                        form_digital_val.save()

                        response['status'] = True
                        response['id'] = form_val.id
                        status_response = status.HTTP_201_CREATED

            except (Form_Enterprise.DoesNotExist):
                pass
            except (Form_Digital.DoesNotExist):
                pass
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def put(self, request, pk, format=None):
        permission_classes = [IsAuthenticated]
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        start = initial_clone(user_val,request.data,pk)
        if start:
            response['status'] = True
            status_response = status.HTTP_200_OK
        return Response(response, status=status_response)

def initial_clone(user_val,data,pk):
    try:
        if 'clone' in data and data['clone'] != '':
            try:
                if 'visit' in data and data['visit'] != '':
                    form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=1)
                elif 'api_create_share_document' in data and data['api_create_share_document'] != '':
                    form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=data['enterprise_id'])
                else:
                    form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
                form_data = {
                    'id': form_val.id,
                    'name': form_val.name,
                    'description': form_val.description,
                    'consecutive': form_val.consecutive,
                    'digital': form_val.digital,
                    'theme': form_val.theme,
                    'color': form_val.color,
                    'logo_path': str(form_val.logo_path),
                }

                if 'api_create_share_document' in data and data['api_create_share_document'] != '':
                    form_data['api_create_share_document'] = data['api_create_share_document']

                if form_val.digital:
                    try:
                        form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)
                        forms_array, fields_digital_array = get_field_arrays(form_val, form_digital_val, 'clone')
                        form_data['digital_data'] = fields_digital_array
                        form_data['digital_template'] = str(form_digital_val.template)
                    except (Form_Digital.DoesNotExist):
                        form_data['digital'] = False
                else:
                    forms_array, fields_digital_array = get_field_arrays(form_val, None, 'clone')

                if form_val.consecutive:
                    form_data['forms'] = forms_array
                    field_consecutive_values = Form_Field_Consecutive.objects.filter(
                        form_enterprise_id=form_data['id'], state=True
                    ).values('form_field_get_id', 'form_field_set_id')
                    form_data['consecutive_data'] = field_consecutive_values
                else:
                    if forms_array != []:
                        form_data['fields'] = forms_array[0]['fields']
                    else:
                        form_data['fields'] = []
                    field_condition_values = Field_Condition.objects.filter(
                        field_father__form_enterprise_id=form_data['id'],
                        field_father__state=True,
                        state=True
                    ).values('field_father_id', 'field_son_id', 'type', 'extra')
                    form_data['condition_data'] = field_condition_values

                    log_content = {
                        'user': user_val.id,
                        'group': 15,
                        'element': form_val.id,
                        'action': 13,
                        'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name +  " clona el documento #" + str(form_val.id) + " " + form_val.name + " un total de " + str(data['clone']) + " veces",
                    }
                    create_traceability(log_content)

                new_clone = Thread(target=process_clone, args=(user_val, form_data, data['clone']))
                new_clone.start()
                return True
            except (Form_Enterprise.DoesNotExist):
                pass

    except User_Enterprise.DoesNotExist:
        pass


def process_clone(user_val, form_data, clone):
    name_form = form_data['name']
    for i in range(clone):
        form_data['name'] = name_form + " copia #" + str(i + 1)
        response_form = create_form(user_val, form_data)
        form_id = response_form['form']
        if 'digital' in response_form:
            digital_id = response_form['digital']

        fields_list = []
        if form_data['consecutive']:
            create_sequence(form_id, form_data['forms'])
            create_autocomplete(form_id, form_data['consecutive_data'])
        elif form_data['fields'] != []:
            fields_list = create_field(form_id, form_data['fields'], 'clone')
            create_condition(form_data['condition_data'], fields_list, 'clone')

        if form_data['digital']:
            create_field_digital(form_data['digital_data'], fields_list, digital_id, form_data['consecutive'])

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pdf(request, pk):
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    try:
        form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
        form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)

        pdf_template_file = settings.MEDIA_ROOT + '/' + str(form_digital_val.template)
        with open(pdf_template_file, 'rb') as f:
            file_data = f.read()

        # sending response
        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=form.pdf'
        return response

    except (Form_Enterprise.DoesNotExist):
        pass
    except (Form_Digital.DoesNotExist):
        pass

    response = {"status": False}
    return Response(response)

""" Funciones """
def create_form(user_val, data, files=None):
    response = {}
    form_val = Form_Enterprise()
    form_val.enterprise_id = user_val.enterprise_id
    form_val.name = data['name']
    if 'api_create_share_document' in data:
        form_val.description = data['description']+' '+str(data['api_create_share_document'])
    else:
        form_val.description = data['description']
    if 'consecutive' in data and (data['consecutive'] == '1' or data['consecutive'] == True):
        form_val.consecutive = True
    if 'digital' in data and (data['digital'] == '1' or data['digital'] == True):
        form_val.digital = True
    else:
        if 'theme' in data and data['theme'] != '0':
            form_val.theme = data['theme']
            form_val.color = data['color']
            if files != None:
                if 'logo' in files:
                    form_val.save()
                    form_val.logo_path = files['logo']
            else:
                form_val.logo_path = data['logo_path']

        else:
            form_val.theme = 0
            form_val.color = ''
    form_val.save()

    if user_val.role_id == 3:
        user_form_val = User_Form()
        user_form_val.user = user_val
        user_form_val.form_enterprise = form_val
        user_form_val.save()

    if 'digital' in data and data['digital'] == '1' or data['digital'] == True:
        form_digital_val = Form_Digital()
        form_digital_val.form_enterprise = form_val
        if files != None:
            form_digital_val.template = files['template']
        else:
            form_digital_val.template = data['digital_template']
        form_digital_val.save()
        response['digital'] = form_digital_val.id

    response['form'] = form_val.id
    return response

def create_sequence(form, forms):
    for index, sequence in enumerate(forms):
        form_consecutive_new = Form_Consecutive()
        form_consecutive_new.form_enterprise_id = form
        form_consecutive_new.form_id = sequence['id']
        form_consecutive_new.position = index + 1
        form_consecutive_new.save()

def create_autocomplete(form, fields):
    for field in fields:
        field_consecutive_new = Form_Field_Consecutive()
        field_consecutive_new.form_enterprise_id = form
        field_consecutive_new.form_field_get_id = field['form_field_get_id']
        field_consecutive_new.form_field_set_id = field['form_field_set_id']
        field_consecutive_new.save()

def create_field(form, fields, type):
    fields_list = {}
    type_same = ['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '14', '15', '16', '18', '21', '22', '23','25']
    type_option = ['3', '12', '13']
    for index, field in enumerate(fields):
        field_form_val = Form_Field()
        field_form_val.form_enterprise_id = form
        field_form_val.name = field['label'][:50]
        field_form_val.field_type_id = field['field_type']
        field_form_val.obligatory = field['required']
        field_form_val.position = index + 1
        if 'description' in field and field['description'] != '':
            if field['field_type'] == '14':
                field_form_val.help = field['description'][:5000]
            else:
                field_form_val.help = field['description'][:200]
        else:
            field_form_val.help = ''

        if field['field_type'] in type_same:
            field_form_val.save()
            if 'validate' in field:
                data_validate = field['validate']
                if 'min' in data_validate:
                    create_parameter(field_form_val.id, 1, data_validate['min'])
                if 'max' in data_validate:
                    create_parameter(field_form_val.id, 2, data_validate['max'])
                if 'advanced' in data_validate:
                    create_parameter(field_form_val.id, 3, data_validate['advanced'])
                if 'advancedNit' in data_validate:
                    create_parameter(field_form_val.id, 4, data_validate['advancedNit'])
                if 'special' in data_validate:
                    create_parameter(field_form_val.id, 5, data_validate['special'])

                if field['field_type'] == '11' and type == 'clone':
                    data_values = field['optionDocuments']

                    for idx, opt in enumerate(data_values):
                        option_val = Option.objects.get(id=opt['value'])
                        option_field = Option_Field()
                        option_field.option = option_val
                        option_field.form_field = field_form_val
                        option_field.position = idx + 1
                        option_field.save()
        elif field['field_type'] in type_option:
            if type == 'clone':
                data_values = field['data']['values']
            else:
                data_values = field['values']
            field_form_val.save()

            for idx, opt in enumerate(data_values):
                if type == 'clone':
                    option_val = Option.objects.get(id=opt['value'])
                else:
                    option_val = Option.objects.get(value=opt)
                option_field = Option_Field()
                option_field.option = option_val
                option_field.form_field = field_form_val
                option_field.position = idx + 1
                option_field.save()
        elif field['field_type'] == '17':
            data_fields = field['fields']
            field_form_val.row = field['row']
            field_form_val.save()
            fields_table = {}
            for idx, field_list in enumerate(data_fields):
                list_field_val = List_Field()
                list_field_val.form_field_id = field_form_val.id
                list_field_val.name = field_list['label'][:50]
                list_field_val.field_type_id = field_list['field_type']
                list_field_val.position = idx + 1
                list_field_val.save()
                if type == 'clone':
                    fields_table[field_list['field']] = str(list_field_val.id)
        else:
            field_form_val.save()

        if type == 'clone':
            fields_list[field['field']] = {
                'field': str(field_form_val.id)
            }
            if field['field_type'] == '17':
                fields_list[field['field']]['table'] = fields_table
    return fields_list

def create_parameter(field, parameter, value):
    if value == None:
        value = ''
    try:
        field_parameter_val = Form_Field_Parameter.objects.get(form_field_id=field, parameter_validate_id=parameter)
        field_parameter_val.value = value
        field_parameter_val.save()
    except (Form_Field_Parameter.DoesNotExist):
        if value != '':
            field_parameter_val = Form_Field_Parameter()
            field_parameter_val.form_field_id = field
            field_parameter_val.parameter_validate_id = parameter
            field_parameter_val.value = value
            field_parameter_val.save()

def create_condition(fields, fields_list, type=''):
    for field in fields:
        field_condition_val = Field_Condition()
        field_condition_val.field_father_id = fields_list[str(field['field_father_id'])]['field']
        field_condition_val.field_son_id = fields_list[str(field['field_son_id'])]['field']
        field_condition_val.type = field['type']
        field_condition_val.extra = field['extra']
        field_condition_val.save()

        if type == 'clone' and field_condition_val.field_son.field_type_id == 21:
            try:
                option_field_before_val = Option_Field.objects.get(id=field_condition_val.field_son.help, form_field_id=field['field_father_id'])
                option_field_val = Option_Field.objects.get(form_field_id=field_condition_val.field_father_id, option=option_field_before_val.option)
                Form_Field.objects.filter(id=field_condition_val.field_son_id).update(help=option_field_val.id)
            except:
                pass

def create_field_digital(fields, fields_list, form_digital, consecutive):
    # recorre los campos
    for field in fields:
        digital_field_val = Digital_Field()
        digital_field_val.form_digital_id = form_digital
        # Busca el id del campo nuevo
        field_id = field['field']
        if not consecutive:
            field_id = fields_list[str(field['field'])]['field']
        digital_field_val.form_field_id = field_id

        digital_field_val.page = field['page']
        digital_field_val.left = field['left']
        digital_field_val.top = field['top']
        digital_field_val.font = field['font']
        digital_field_val.size = field['size']
        digital_field_val.color = field['color']
        digital_field_val.bold = field['bold']
        digital_field_val.italic = field['italic']
        digital_field_val.underline = field['underline']
        digital_field_val.width = field['size_image_x']
        digital_field_val.height = field['size_image_y']
        digital_field_val.line_height = field['line_height']
        digital_field_val.option = field['option']
        # Guarda la opción escogida
        if field['field_type'] == '3' or field['field_type'] == '12' or field['field_type'] == '13':
            if field['option'] == '1':
                digital_field_val.option_value = field['option_value']
        if field['field_type'] == '17':
            digital_field_val.row_field = field['row_field']
            # Busca el id del campo tabla
            list_field_id = field['column_value']
            if not consecutive:
                list_field_id = fields_list[str(field['field'])]['table'][field['column_value']]
            digital_field_val.list_field = list_field_id
        digital_field_val.save()

def replace_character(text):
    characters = [' , ', ' ,', ', ']
    special_characters = [':', "'", '"']
    while '  ' in text:
        text = text.replace('  ', ' ')
    for character in characters:
        if character in text:
            text = text.replace(character, ',')
    for character in special_characters:
        if character in text:
            text = text.replace(character, '')
    return text


@api_view(['GET'])
def get_form_token(request, token, consecutive=None, current=None, answer=None):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST

    try:
        form_link_val = Form_Link.objects.get(token_link=token, state=True)

        response['form'] = {
            'id': form_link_val.form_enterprise_id,
            'name': replace_character(form_link_val.form_enterprise.name),
            'description': replace_character(form_link_val.form_enterprise.description),
            'theme': str(form_link_val.form_enterprise.theme),
            'color': form_link_val.form_enterprise.color,
            'digital': form_link_val.form_enterprise.digital,
            'consecutive': form_link_val.form_enterprise.consecutive,
            'access': form_link_val.access,
            'enterprise': {
                'id': form_link_val.form_enterprise.enterprise_id,
                'acronym': form_link_val.form_enterprise.enterprise.acronym,
            },
        }
        # Condicionales Acceso Publico
        if form_link_val.access == 0:
            if form_link_val.date_state:
                now = datetime.now(tz=TZ_INFO)
                if now.date() > form_link_val.max_date:
                    response['info'] = 'Este documento se encuentra vencido'
                    status_response = status.HTTP_203_NON_AUTHORITATIVE_INFORMATION
                    return Response(response, status=status_response)

            if form_link_val.send_state:
                if form_link_val.form_enterprise.consecutive:
                    answer_count = Answer_Consecutive.objects.filter(
                        form_consecutive__id=form_link_val.form_enterprise_id,
                        creation_date__gte=form_link_val.modify_date,
                        public=True,
                        state=True
                    ).count()
                else:
                    answer_count = Answer_Form.objects.filter(
                        form_enterprise__id=form_link_val.form_enterprise_id,
                        creation_date__gte=form_link_val.modify_date,
                        consecutive=False,
                        public=True,
                        state=True
                    ).count()

                if answer_count >= form_link_val.max_send:
                    response['info'] = 'Se han completado los diligenciamientos máximos del documento'
                    status_response = status.HTTP_203_NON_AUTHORITATIVE_INFORMATION
                    return Response(response, status=status_response)

        fields_array = []
        if form_link_val.form_enterprise.consecutive:
            if current != None:
                # Respuesta de un Multi-sección
                answer_form_val = None
                if consecutive != None and consecutive != 0 and consecutive != '' and answer != None and answer != 0 and answer != '':
                    answer_form_consecutive_val = Answer_Form_Consecutive.objects.get(
                        answer_consecutive_id=answer,
                        answer_form__form_enterprise_id=current,
                        state=True
                    )
                    answer_form_val = answer_form_consecutive_val.answer_form
                fields_array = get_field(current, consecutive, None, answer_form_val)
        else:
            fields_array = get_field(form_link_val.form_enterprise_id)
        response['form']['fields'] = fields_array
        response['status'] = True
        status_response = status.HTTP_200_OK
    except (Form_Link.DoesNotExist):
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
def get_pdf_token(request, token, idUser):
    print("GETTTTTTTT")
    try:
        #print(token)
        #print(idUser)
        if idUser != '0':
            form_date_temp = Form_Temporal_Digital.objects.get(
                            user=str(idUser),
                            token=token
                        )

            form_link_val = Form_Link.objects.get(token_link=token, state=True)
            user_val = User_Enterprise.objects.get(id=str(idUser))
            form_val = Form_Enterprise.objects.get(id=form_date_temp.id_form, enterprise_id=user_val.enterprise_id)
            num = str(form_date_temp.id_form) + '' + str(form_link_val.id)


            print(form_date_temp.temporal)
            answer_field_values = ast.literal_eval(form_date_temp.temporal)
            print(answer_field_values)
            print(type(answer_field_values))
            print(form_date_temp.id_form)

            files = []
            count = 0
            for field, value3 in answer_field_values.items():
                for value4 in value3.items():
                    if value4[1] != '' and len(value4[1]) > 250:
                      count = 1
                      value5= value4[1].split('Extension')
                      files.append({
                          'file_'+str(field):value5[0],
                          'ext':value5[1]
                      })
            if count > 0 :
                overlay_pdf_path, result_pdf_path = generate_pdf_digital(form_val, num, answer_field_values, True, files,False, True)
            else :
                overlay_pdf_path, result_pdf_path = generate_pdf_digital(form_val, num, answer_field_values, True)
        else:
            form_link_val = Form_Link.objects.get(token_link=token, state=True)
            form_digital_val = Form_Digital.objects.get(form_enterprise_id=form_link_val.form_enterprise_id)

            result_pdf_path = settings.MEDIA_ROOT + '/' + str(form_digital_val.template)

        # return pdf
        with open(result_pdf_path, 'rb') as f:
            file_data = f.read()


        # sending response
        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=form.pdf'
        return response

    except (Form_Link.DoesNotExist):
        print(token)
        print(idUser)
        pass
    except (Form_Digital.DoesNotExist):
        print(token)
        print(idUser)
        pass


    response = {"status": False}
    return Response(response)

@api_view(['GET'])
def get_enterprise_token(request, token):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        form_link_val = Form_Link.objects.get(token_link=token, state=True)
        enterprise_val = form_link_val.form_enterprise.enterprise
        variable_footer = Variable_Plataform.objects.get(name="footer")
        data_enterprise = {
            'id': enterprise_val.id,
            'name': enterprise_val.name,
            'logo': [settings.URL + 'media/', str(enterprise_val.logo)],
            'footer': variable_footer.value,
            'theme': enterprise_val.theme_id,
            'colorB':str(enterprise_val.public_color),
            'colorBT':str(enterprise_val.public_color_Text),
            'colorBTP':str(enterprise_val.public_color_text_title),
            'colorBF':str(enterprise_val.public_color_footer),
            'colorBFT':str(enterprise_val.public_color_footer_title),
            'colorBTPH':str(enterprise_val.public_color_header_title)
        }
        response['status'] = True
        response['data'] = data_enterprise
        status_response = status.HTTP_200_OK
    except (Form_Link.DoesNotExist):
        pass
    return Response(response, status=status_response)

def lookFormDifferences(original, changed):
    parameters = ''
    if original['name'] != changed.name:
        parameters += 'Nombre ' + original['name'] + ' a ' + changed.name
    if original['description'] != changed.description:
        parameters += (', ' if parameters != '' else '') + 'descripción ' + original['description'] + ' a ' + changed.description
    if original['digital'] != changed.digital:
        parameters += (', ' if parameters != '' else '') + 'plantilla digital'
    if str(original['theme']) != str(changed.theme):
        parameters += (', ' if parameters != '' else '') + 'tema ' + str(original['theme']) + ' a ' + str(changed.theme )
    if original['color'] != changed.color:
        parameters += (', ' if parameters != '' else '') + 'color ' + original['color'] + ' a ' + changed.color
    return parameters if parameters != '' else None

def form_to_json(form_val):
    form_data = {
        'id': form_val.id,
        'name': form_val.name,
        'description': form_val.description,
        'consecutive': form_val.consecutive,
        'digital': form_val.digital,
        'theme': form_val.theme,
        'color': form_val.color,
        'logo_path': str(form_val.logo_path),
    }

    if form_val.digital:
        try:
            form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)
            forms_array, fields_digital_array = get_field_arrays(form_val, form_digital_val, 'data')
            form_data['digital_data'] = fields_digital_array
            form_data['digital_template'] = str(form_digital_val.template)
        except (Form_Digital.DoesNotExist):
            form_data['digital'] = False
    else:
        if not form_val.consecutive:
            forms_array, fields_digital_array = get_field_arrays(form_val, None, 'data')

    if form_val.consecutive:
        forms_array = []
        form_consecutive_values = Form_Consecutive.objects.filter(
            form_enterprise=form_val,
            state=True
        ).order_by('position')
        for form_consecutive_val in form_consecutive_values:
            forms_array.append({
                'id': form_consecutive_val.form_id,
                'version': form_consecutive_val.version,
            })

        form_data['forms'] = forms_array
        field_consecutive_values = Form_Field_Consecutive.objects.filter(
            form_enterprise_id=form_data['id'], state=True
        ).values('form_field_get_id', 'form_field_set_id')
        form_data['consecutive_data'] = list(field_consecutive_values) if field_consecutive_values else []
    else:
        if forms_array != []:
            form_data['fields'] = forms_array[0]['fields']
        else:
            form_data['fields'] = []
        field_condition_values = Field_Condition.objects.filter(
            field_father__form_enterprise_id=form_data['id'], state=True
        ).values('field_father_id', 'field_son_id', 'type', 'extra')
        form_data['condition_data'] = list(field_condition_values) if field_condition_values else []
    json_data = json.dumps(form_data)
    return json_data

""" Proceso de Migración de Formulario a Sobre """
from api.models import (
    Answer_Envelope,
    Answer_Envelope_Field,
    Answer_Envelope_User,
    Env_Form_Field,
    Env_Form_Field_Parameter,
    Env_Digital_Field,
    Env_Field_Condition,
    Env_List_Field,
    Env_Option_Field,
    Env_Option_List_Field,
    Envelope_Enterprise,
    Envelope_Version,
    Envelope_Version_Form,
    Envelope_User,
    External_User,
    Field_User,
)

@api_view(['GET'])
def migrate_envelope(request):
    # Realizar pruebas
    new_migrate = Thread(target=process_migrate, args=())
    new_migrate.start()

    return Response({
        'status': True,
        'message': 'Migración',
    })

""" Funciones """
def process_migrate():
    print('process_migrate')
    form_values = Form_Enterprise.objects.filter(consecutive=False, digital=True, state=True)
    for form_val in form_values:
        form_data = {
            'id': form_val.id,
            'name': form_val.name,
            'enterprise': form_val.enterprise_id,
            'consecutive': form_val.consecutive,
            'digital': form_val.digital,
            'pin': form_val.pin,
            'state': form_val.state,
        }

        if form_val.digital:
            try:
                form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)
                forms_array, fields_digital_array = get_field_arrays(form_val, form_digital_val, 'clone')
                form_data['digital_data'] = fields_digital_array
                form_data['digital_template'] = str(form_digital_val.template)
            except (Form_Digital.DoesNotExist):
                form_data['digital'] = False
        else:
            forms_array, fields_digital_array = get_field_arrays(form_val, None, 'clone')

        form_data['forms'] = forms_array
        if form_val.consecutive:
            field_consecutive_values = Form_Field_Consecutive.objects.filter(
                form_enterprise_id=form_data['id'], state=True
            ).values('form_field_get_id', 'form_field_set_id')
            form_data['consecutive_data'] = field_consecutive_values
        else:
            field_condition_values = Field_Condition.objects.filter(
                field_father__form_enterprise_id=form_data['id'], state=True
            ).values('field_father_id', 'field_son_id', 'type', 'extra')
            form_data['condition_data'] = field_condition_values

        create_envelope(form_data)

def create_envelope(data):
    envelope_enterprise_val = Envelope_Enterprise()
    envelope_enterprise_val.enterprise_id = data['enterprise']
    envelope_enterprise_val.name = data['name']
    envelope_enterprise_val.pin = data['pin']
    envelope_enterprise_val.state = data['state']
    envelope_enterprise_val.save()

    envelope_version_val = Envelope_Version()
    envelope_version_val.envelope_enterprise = envelope_enterprise_val
    envelope_version_val.save()

    for index, form in enumerate(data['forms']):

        env_version_form = Envelope_Version_Form()
        env_version_form.envelope_version = envelope_version_val
        env_version_form.name = form['name']
        env_version_form.template = data['digital_template']
        env_version_form.position = index + 1
        env_version_form.save()

        fields_list = create_env_field(env_version_form.id, form['fields'])
        create_env_field_digital(data['digital_data'], fields_list)

        # Guardado de respuestas
        answer_values = Answer_Form.objects.filter(
            form_enterprise_id=data['id'],
            consecutive=False,
            state=True
        )

        for answer in answer_values:
            answer_envelope_val = Answer_Envelope()
            answer_envelope_val.envelope_version = envelope_version_val
            answer_envelope_val.serial_number = answer.serial_number
            answer_envelope_val.public = answer.public
            answer_envelope_val.creation_date = answer.creation_date
            answer_envelope_val.modify_date = answer.modify_date
            answer_envelope_val.doc_hash = answer.doc_hash
            answer_envelope_val.save()

            user_id = answer.created_by_id
            type_user = 1

            # Condicional usuario publico
            if not answer.created_by_id:
                try:
                    external_user_val = External_User.objects.get(enterprise_id=data['enterprise'], name='Usuario Público')
                except (External_User.DoesNotExist):
                    external_user_val = External_User()
                    external_user_val.enterprise_id = data['enterprise']
                    external_user_val.name = 'Usuario Público'
                    external_user_val.email = ''
                    external_user_val.phone_ind = ''
                    external_user_val.phone = ''
                    external_user_val.save()
                user_id = external_user_val.id
                type_user = 3

            try:
                envelope_user_val = Envelope_User.objects.get(envelope_version=envelope_version_val, type_user=type_user, user=user_id)
            except (Envelope_User.DoesNotExist):
                envelope_user_val = Envelope_User()
                envelope_user_val.envelope_version = envelope_version_val
                envelope_user_val.type_user = type_user
                envelope_user_val.user = user_id
                envelope_user_val.color = '#000000'
                envelope_user_val.save()

            answer_envelope_user_val = Answer_Envelope_User()
            answer_envelope_user_val.answer_envelope = answer_envelope_val
            answer_envelope_user_val.envelope_user = envelope_user_val
            answer_envelope_user_val.source = answer.source
            answer_envelope_user_val.online = answer.online
            answer_envelope_user_val.creation_date = answer.creation_date
            answer_envelope_user_val.modify_date = answer.modify_date
            answer_envelope_user_val.longitude = answer.longitude
            answer_envelope_user_val.latitude = answer.latitude
            answer_envelope_user_val.save()

            answer_field_values = Answer_Field.objects.filter(
                form_field__state=True,
                answer_form=answer,
                state=True
            )

            for answer_field in answer_field_values:
                field_id = fields_list[str(answer_field.form_field_id)]['field']
                try:
                    field_user_val = Field_User.objects.get(envelope_user=envelope_user_val, env_form_field_id=field_id)
                except (Field_User.DoesNotExist):
                    field_user_val = Field_User()
                    field_user_val.envelope_user = envelope_user_val
                    field_user_val.env_form_field_id = field_id
                    field_user_val.save()

                answer_envelope_field_val = Answer_Envelope_Field()
                answer_envelope_field_val.answer_envelope_user = answer_envelope_user_val
                answer_envelope_field_val.field_user = field_user_val
                answer_envelope_field_val.value = answer_field.value
                answer_envelope_field_val.save()

def create_env_field(version_form, fields, create=False):
    fields_list = {}
    type_same = ['1', '2', '4', '5', '6', '7', '8', '9', '10', '11', '14', '15', '16','18', '22', '23', '25']
    type_option = ['3', '12', '13']

    # Todos los campos del formulario.
    fields_all_envelope = list(Env_Form_Field.objects.filter(envelope_version_form_id=version_form, state=True).values_list('id', flat=True))

    for index, field in enumerate(fields):
        update_list_cont = True
        if 'field' in field and field['field'] != '':
            try:
                env_field_form_val = Env_Form_Field.objects.get(id=field['field'], envelope_version_form_id=version_form)
                fields_all_envelope.remove(env_field_form_val.id)
            except (Env_Form_Field.DoesNotExist):
                update_list_cont = False
        else:
            env_field_form_val = Env_Form_Field()
            env_field_form_val.envelope_version_form_id = version_form

        if update_list_cont:
            env_field_form_val.name = field['label'][:50]
            env_field_form_val.field_type_id = field['field_type']
            env_field_form_val.obligatory = field['required']
            env_field_form_val.position = index + 1
            env_field_form_val.help = ''

            if field['field_type'] in type_same:
                env_field_form_val.save()
                if 'validate' in field:
                    data_validate = field['validate']
                    if 'min' in data_validate:
                        create_env_parameter(env_field_form_val.id, 1, data_validate['min'])
                    if 'max' in data_validate:
                        create_env_parameter(env_field_form_val.id, 2, data_validate['max'])
                    if 'advanced' in data_validate:
                        create_env_parameter(env_field_form_val.id, 3, data_validate['advanced'])
                    if 'advancedNit' in data_validate:
                        create_env_parameter(env_field_form_val.id, 4, data_validate['advancedNit'])
            elif field['field_type'] in type_option:
                data_values = field['data']['values']
                env_field_form_val.save()

                for idx, opt in enumerate(data_values):
                    option_val = Option.objects.get(id=opt['value'])
                    option_field = Env_Option_Field()
                    option_field.option = option_val
                    option_field.env_form_field = env_field_form_val
                    option_field.position = idx + 1
                    option_field.save()
            elif field['field_type'] == '17':
                data_fields = field['fields']
                env_field_form_val.row = field['row']
                env_field_form_val.save()
                fields_table = {}
                for idx, env_field_list in enumerate(data_fields):
                    env_list_field_val = Env_List_Field()
                    env_list_field_val.env_form_field_id = env_field_form_val.id
                    env_list_field_val.name = env_field_list['label'][:50]
                    env_list_field_val.field_type_id = env_field_list['field_type']
                    env_list_field_val.position = idx + 1
                    env_list_field_val.save()

                    if env_field_list['field_type'] in type_option:
                        data_values = env_field_list['values']
                        save_list_field = add_option_env_list_field(env_field_list, env_list_field_val, data_values)
                        if save_list_field == False:
                            env_list_field_val.state = False
                            env_list_field_val.save()

                    fields_table[env_field_list['field']] = str(env_list_field_val.id)
            else:
                env_field_form_val.save()

            if create:
                save_env_field_digital(field, env_field_form_val)
            else:
                fields_list[field['field']] = {
                    'field': str(env_field_form_val.id)
                }
                if field['field_type'] == '17':
                    fields_list[field['field']]['table'] = fields_table
    if fields_all_envelope:
        Env_Form_Field.objects.filter(id__in=fields_all_envelope, envelope_version_form_id=version_form).update(state=False)

    return fields_list

def create_env_element(version_form, elements, create=False):
    for index, element in enumerate(elements):
        if 'id' in element:
            try:
                env_Digital_Element = Env_Digital_Element.objects.get(id = element['id'], envelope_version_form_id = version_form)
            except (Env_Form_Field.DoesNotExist):
                env_Digital_Element = Env_Digital_Element()
        else:
            env_Digital_Element = Env_Digital_Element()

        env_Digital_Element.envelope_version_form_id = version_form
        env_Digital_Element.element_type_config_id = element['field_type']
        env_Digital_Element.label = element['label']
        env_Digital_Element.url_src = element['url_src']
        env_Digital_Element.page = element['page']
        env_Digital_Element.left = element['left']
        env_Digital_Element.top = element['top']
        env_Digital_Element.font = element['font']
        env_Digital_Element.size = element['size']
        env_Digital_Element.color = element['color']
        env_Digital_Element.justify = element['justify']
        env_Digital_Element.bold = element['bold']
        env_Digital_Element.italic = element['italic']
        env_Digital_Element.underline = element['underline']
        env_Digital_Element.width = element['size_image_x']
        env_Digital_Element.height = element['size_image_y']
        env_Digital_Element.line_height = element['line_height']
        env_Digital_Element.save()

def add_option_env_list_field(field, env_list_field_val, data_values):
    save_list_field = False
    option_all_field = []
    if 'field' in field and field['field'] != '':
        option_all_field = [item['id'] for item in list(Env_Option_List_Field.objects.filter(env_list_field_id=env_list_field_val.id, state=True).values('id'))]
    for idx, opt in enumerate(data_values):
        if opt['label'] != '':
            save_list_field = True
            option = opt['label'][:40]
            try:
                option_val = Option.objects.get(value=option)
            except (Option.DoesNotExist):
                option_val = Option()
                option_val.value = option
                option_val.save()
            try:
                option_field = Env_Option_List_Field.objects.get(option_id=option_val.id, env_list_field_id=env_list_field_val.id)
                option_field.position = idx + 1
                option_field.state = True
                option_field.save()
                if 'field' in field and field['field'] != '':
                    try:
                        option_all_field.remove(option_field.id)
                    except:
                        pass

            except (Env_Option_List_Field.DoesNotExist):
                option_field = Env_Option_List_Field()
                option_field.option = option_val
                option_field.env_list_field = env_list_field_val
                option_field.position = idx + 1
                option_field.save()

    if 'field' in field and field['field'] != '' and option_all_field:
        Env_Option_List_Field.objects.filter(id__in=option_all_field, env_list_field=env_list_field_val).update(state=False)
    return save_list_field

def create_env_parameter(field, parameter, value):
    if value == None:
        value = ''
    try:
        env_field_parameter_val = Env_Form_Field_Parameter.objects.get(env_form_field_id=field, parameter_validate_id=parameter)
        env_field_parameter_val.value = value
        env_field_parameter_val.save()
    except (Env_Form_Field_Parameter.DoesNotExist):
        if value != '':
            env_field_parameter_val = Env_Form_Field_Parameter()
            env_field_parameter_val.env_form_field_id = field
            env_field_parameter_val.parameter_validate_id = parameter
            env_field_parameter_val.value = value
            env_field_parameter_val.save()

def create_env_field_digital(fields, fields_list):
    # recorre los campos
    for field in fields:
        env_digital_field_val = Env_Digital_Field()
        # Busca el id del campo nuevo
        field_id = fields_list[str(field['field'])]['field']
        env_digital_field_val.env_form_field_id = field_id

        env_digital_field_val.page = field['page']
        env_digital_field_val.left = field['left']
        env_digital_field_val.top = field['top']
        env_digital_field_val.font = field['font']
        env_digital_field_val.size = field['size']
        env_digital_field_val.color = field['color']
        env_digital_field_val.bold = field['bold']
        env_digital_field_val.italic = field['italic']
        env_digital_field_val.underline = field['underline']
        env_digital_field_val.width = field['size_image_x']
        env_digital_field_val.height = field['size_image_y']
        env_digital_field_val.line_height = field['line_height']
        env_digital_field_val.option = field['option']
        # Guarda la opción escogida
        if field['field_type'] == '3' or field['field_type'] == '12' or field['field_type'] == '13':
            if field['option'] == '1':
                env_digital_field_val.option_value = field['option_value']
        if field['field_type'] == '17':
            env_digital_field_val.row_field = field['row_field']
            # Busca el id del campo tabla
            list_field_id = fields_list[str(field['field'])]['table'][field['column_value']]
            env_digital_field_val.list_field = list_field_id
        env_digital_field_val.save()

def save_env_field_digital(field, env_field_form_val):

    try:
        field_user_val = Field_User.objects.get(envelope_user_id=field['user']['id'], env_form_field=env_field_form_val)
    except (Field_User.DoesNotExist):
        field_user_val = Field_User()
        field_user_val.envelope_user_id = field['user']['id']
        field_user_val.env_form_field=env_field_form_val
        field_user_val.save()

    env_digital_field_val = Env_Digital_Field.objects.filter(env_form_field=env_field_form_val).order_by('id').first()
    if not env_digital_field_val:
        env_digital_field_val = Env_Digital_Field()
        # Busca el id del campo nuevo
        env_digital_field_val.env_form_field = env_field_form_val

    env_digital_field_val.page = field['page']
    env_digital_field_val.left = field['left']
    env_digital_field_val.top = field['top']
    env_digital_field_val.font = field['font']
    env_digital_field_val.size = field['size']
    env_digital_field_val.color = field['color']
    env_digital_field_val.bold = field['bold']
    env_digital_field_val.italic = field['italic']
    env_digital_field_val.underline = field['underline']
    env_digital_field_val.width = field['size_image_x']
    env_digital_field_val.height = field['size_image_y']
    if field['field_type'] in [1,2,5,6,25]:
        env_digital_field_val.line_height = field['line_height']
    env_digital_field_val.option = field['option']
    # Guarda la opción escogida
    if field['field_type'] in [3,12,13]:
        if field['option'] == '1':
            env_digital_field_val.option_value = field['option_value']
    if field['field_type'] == 17:
        env_digital_field_val.row_field = field['row_field']
        # Busca el id del campo tabla
        # list_field_id = fields_list[str(field['field'])]['table'][field['column_value']]
        # env_digital_field_val.list_field = list_field_id
    env_digital_field_val.save()

    save_dup_field_digital(field['clone'], env_field_form_val, env_digital_field_val.id, field['field_type'])

def save_dup_field_digital(drags, env_field_form_val, env_digital_field_id, field_type):

    # Todos los drag del campo
    fields_env_digital = list(Env_Digital_Field.objects.filter(env_form_field=env_field_form_val, state=True).values_list('id', flat=True))
    # Se remueve el drag padre original.
    fields_env_digital.remove(env_digital_field_id)

    for index, field in enumerate(drags):
        update_drag_cont = True
        if 'id' in field and field['id'] != '':
            try:
                env_digital_field_val = Env_Digital_Field.objects.get(id=field['id'], env_form_field=env_field_form_val)
                env_digital_field_val.state = True
                fields_env_digital.remove(env_digital_field_val.id)
            except (Env_Form_Field.DoesNotExist):
                update_drag_cont = False
        else:
            env_digital_field_val = Env_Digital_Field()
            # Busca el id del campo
            env_digital_field_val.env_form_field = env_field_form_val

        if update_drag_cont:
            env_digital_field_val.page = field['page']
            env_digital_field_val.envelope_version_form_id = field['envelope_version_form_id']
            env_digital_field_val.left = field['left']
            env_digital_field_val.top = field['top']
            env_digital_field_val.font = field['font']
            env_digital_field_val.size = field['size']
            env_digital_field_val.color = field['color']
            env_digital_field_val.bold = field['bold']
            env_digital_field_val.italic = field['italic']
            env_digital_field_val.underline = field['underline']
            env_digital_field_val.width = field['size_image_x']
            env_digital_field_val.height = field['size_image_y']
            if field_type in [1,2,5,6,25]:
                env_digital_field_val.line_height = field['line_height']
            env_digital_field_val.option = field['option']
            # Guarda la opción escogida
            if field_type in [3,12,13]:
                if field['option'] == '1':
                    env_digital_field_val.option_value = field['option_value']
            if field_type == 17:
                env_digital_field_val.row_field = field['row_field']
            env_digital_field_val.save()

    Env_Digital_Field.objects.filter(id__in=fields_env_digital, env_form_field=env_field_form_val).update(state=False)

@api_view(['POST'])
def approving_acept(request):
    response = {}
    response['status'] = False
    data = request.data
    response['status'] = True
    print(data)
    return Response(response)

@api_view(['POST'])
def resend_data(request):
    response = {}
    response['status'] = False
    request_file = request.FILES
    my_file = request_file['file']
    file = my_file.read().decode('utf-8')
    reader = csv.DictReader(io.StringIO(file))

    # Generate a list comprehension
    data = [line for line in reader]
    for text in data:
        list=[]
        if request.data['option'] == "1":
            list.append(text['correo'])
        else:
            list.append(text['telefono'])
        try:
            # get user, data and files
            user_val = User_Enterprise.objects.get(user=request.data['idUser'])
            data = request.data
            form_id = text['formulario']
            option = request.data['option']
            to_list = list

            name_enterprise = user_val.enterprise.name if user_val.enterprise.name != '' else 'Melmac'
            name_enterprise_v2 = "a "+user_val.enterprise.name if user_val.enterprise.name != '' else ''
            img = settings.URL + 'media/' + str(user_val.enterprise.logo) if user_val.enterprise.logo != '' else 'https://melmac.co/assets/images/logo_melmac.png'
            # Enlace documento
            try:
                form_link_val = Form_Link.objects.filter(
                    form_enterprise_id=form_id,
                    form_enterprise__enterprise_id=user_val.enterprise_id,
                    state=True,
                    access=0
                )[:1]
            except Form_Link.DoesNotExist:
                # Se genera token unico por documento
                token_link = Encrypt().encrypt_code(form_id)
                form_link_val = Form_Link()
                form_link_val.form_enterprise_id = form_id
                form_link_val.token_link = token_link
                form_link_val.save()

            for value in form_link_val:
                tokenv=value.token_link
                qr_path=value.qr_path
                date_state=value.date_state
                form_enterprise_name=value.form_enterprise.name
                max_date=value.max_date

            url_form =  settings.URL_FRONTEND + 'public/' + tokenv
            if type(to_list) == type(''):
                to_list = to_list.split(';')

            name_form = form_enterprise_name
            limit_link = ''
            description_type = ''
            description_qr = ''
            description_subject = ''
            if date_state:
                limit_link = 'El documento tiene una fecha máxima de envió hasta ' + str(max_date)
            # Opciones de envio
            if option == '1':
                description_type = 'correo electrónico'
                html_message = '<br><br><img style="width: 350px;" src="' + img + '"><br><br>'
                html_message += ('Hola, se te ha compartido el siguiente documento: <b>' + name_form + '</b>, ' +
                    'por favor diligencialo por medio de este enlace ' + url_form + ' ' +
                    'recuerda diligenciarlo lo más pronto posible, gracias. <br>' + limit_link)
                if 'qr' in data and data['qr']:
                    description_qr = 'con QR '
                    html_message += '<br><br><img style="width: 150px;" src="' + settings.URL + 'media/' + str(qr_path) + '">'
                send_email('DOCUMENTO COMPARTIDO POR ' + name_enterprise, '', to_list, html_message)
            elif option == '2':
                description_type = 'SMS'
                message = ('DOCUMENTO COMPARTIDO POR ' + name_enterprise + '. ' +
                    'Hola, se te ha compartido el siguiente documento: ' + name_form + ', ' +
                    'por favor diligencialo por medio de este enlace ' + url_form + ' ' +
                    'Recuerda hacerlo lo antes posible. Â¡Gracias!. ' + limit_link)
                for phone in to_list:
                    Sms.send(phone, message)
            elif option == '3':
                description_type = 'WhatsApp'
                for whatsapp in to_list:
                    send_whatsapp_msg_v2(whatsapp, name_enterprise, name_form, url_form, name_enterprise_v2, img)

            for subject in to_list:
                description_subject += (', ' if description_subject != '' else ' ha ') + subject

            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': form_id,
                'action': 14,
                'description': ("El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " +
                    user_val.first_last_name + " ha compartido de nuevo el enlace " + description_qr +
                    "del documento #" + str(form_id) + ' "' + form_enterprise_name + '"' +
                    description_subject + " mediante " + description_type),
            }
            create_traceability(log_content)

            response['status'] = True
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass

    return Response(response)

@api_view(['POST'])
def forward_handwritten_pdf(request):
    response = {}
    response['status'] = True
    request_file = request.FILES
    my_file = request_file['file']
    file = my_file.read().decode('latin-1')
    reader = csv.DictReader(io.StringIO(file))
    enterprise = Enterprise.objects.get(id=request.data['idEnterprise'])
    name_enterprise = enterprise.name if enterprise.name != '' else 'Melmac'
    img = settings.URL + 'media/' + str(enterprise.logo) if enterprise.logo != '' else 'https://melmac.co/assets/images/logo_melmac.png'
    arrayemailname = []
    data = [line for line in reader]
    for text in data:
      email = text['correo']
      arrayemail=[]
      arrayemail.append(email)
      name_document = text['documento']
      title = text["nom_documento"]
      from_email = settings.EMAIL_HOST_USER
      subject = 'ðŸ–‹ï¸Â¡GRACIAS, FIRMASTE CON '+ name_enterprise.upper() +' EL DOCUMENTO '+ title.upper() +' EXITOSAMENTE!ðŸ“„'
      text_content = 'Se enví­a documento diligenciado con la firma respectiva del usuario.'
      Logo = '<br><br><img style="width: 350px;" src="' + img + '"><br><br>'
      content = (
      '<b>NOTIFICACIÓN FIRMA DE DOCUMENTO</b>.<br><br>'+
      'Nos complace informarte que el proceso de Firma manuscrita del documento '+ title.upper() +' con la '+name_enterprise.upper()+
      ' ha sido completado con éxito. Adjunto a este mensaje, encontrarás una copia del documento en '+
      'formato PDF autenticado por <b>Melmac DMS</b>, cumpliendo las consideraciones contenidas en la Ley 527 de 1999 y ' +
      'sus modificaciones posteriores (COL) y normas equivalentes internacionales. ' +
      'Cualquier duda o aclaración sobre el proceso, comuní­cate con: ' +'<b>'+ name_enterprise.upper() + '</b>')
      html_message = ('<div style="padding:20px; font-family: sans-serif;">' +
            '<div style="text-align: center;">' +
                Logo +
            '</div>' +
            '<div style="font-size:14px; text-align: justify; width: 625px;">' +
                content +
            '</div>' +
            '<div>' +
                '<p style="font-size:10px">Derechos reservados Melmac DMS - by SAROA SAS</p>' +
            '</div>' +
        '</div>'
        )
      try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, arrayemail)
        msg.attach_alternative(html_message, "text/html")
        msg.attach_file(settings.MEDIA_ROOT + '/'+str(enterprise.id)+'/sign_doc/' +  name_document)
        msg.send()
        arrayemailname.append(email)
      except Exception as err:
        print("Error envio PDF")
        print(err)
    response['emails'] = arrayemailname
    return Response(response)

@api_view(['POST'])
def list_handwritten_pdf(request):
    response = {}
    response['status'] = True
    contenido = os.listdir(settings.MEDIA_ROOT + '/11/sign_doc/')
    response['date'] = contenido
    return Response(response)

@api_view(['POST'])
def logs_form(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        logs_form_val = Logs_Form()
        logs_form_val.id_form = data['id_form']
        logs_form_val.latitude = data['latitude']
        logs_form_val.longitude = data['longitude']
        logs_form_val.date = data['date']
        logs_form_val.hour = data['hour']
        logs_form_val.platform = data['platform']
        logs_form_val.state = data['state']
        logs_form_val.user_id = data['user_id']
        logs_form_val.save()
        response['status'] = True
        response['message'] = 'Log enviado con exito'
    except KeyError:
            response['message'] = 'Faltan parametros por enviar'
    return Response(response)

@api_view(['GET'])
def send_public_share(request, token, phones, emails, semail, sSms, sWhatsapp, idForm):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        enterprise_val = Enterprise.objects.get(token_link=token, state=True)
        idEnterprise=enterprise_val.id
        use_val = User_Enterprise.objects.get(enterprise_id=idEnterprise, role_id=2)


        name_enterprise = enterprise_val.name if enterprise_val.name != '' else 'Melmac'
        name_enterprise_v2 = "a "+enterprise_val.name if enterprise_val.name != '' else ''
        img = settings.URL + 'media/' + str(enterprise_val.logo) if enterprise_val.logo != '' else 'https://melmac.co/assets/images/logo_melmac.png'
        form_val = Form_Enterprise.objects.get(id=idForm)

        form_link_val = Form_Link.objects.filter(
            form_enterprise_id=idForm,
            form_enterprise__enterprise_id=idEnterprise,
            state=True,
            access=0
        )[:1]



        for value in form_link_val:
            tokenv=value.token_link

        if sWhatsapp == "true":
            if phones != 'NA':
                destinatario=phones
                phonesF = phones.split(',')
                description_type = 'WhatsApp'
                if sSms == "true":
                    description_type = 'WhatsApp y SMS'
                for whatsapp in phonesF:
                    url_form=form_link_val_public_share(idForm,whatsapp,description_type)
                    send_whatsapp_msg_v2(whatsapp, name_enterprise, form_val.name, url_form, name_enterprise_v2, img)
                logs_send_public_share(use_val.id,idForm,name_enterprise,form_val.name,description_type,destinatario)

        if sSms == "true":
            if phones != 'NA':
                destinatario=phones
                phonesF = phones.split(',')
                description_type = 'SMS'
                if sWhatsapp == "true":
                    description_type = 'WhatsApp y SMS'
                for phone in phonesF:
                    url_form=form_link_val_public_share(idForm,phone,description_type)
                    message = ('DOCUMENTO COMPARTIDO POR ' + name_enterprise + '. ' +
                    'Hola, se te ha compartido el siguiente documento: ' + form_val.name + ', ' +
                    'por favor diligencialo por medio de este enlace ' + url_form + ' ' +
                    'Recuerda hacerlo lo antes posible. Â¡Gracias!. ')
                    Sms.send(phone, message)
                logs_send_public_share(use_val.id,idForm,name_enterprise,form_val.name,description_type,destinatario)

        if semail == "true":
            destinatario=emails
            emailsF = emails.split(',')
            if emails != 'NA':
                description_type = 'correo electrónico'
                for email in emailsF:
                    arrayEmail=[]
                    url_form=form_link_val_public_share(idForm,email,description_type)
                    arrayEmail.append(email)
                    html_message = '<br><br><img style="width: 350px;" src="' + img + '"><br><br>'
                    html_message += ('Hola, se te a compartido el siguiente documento: <b>' + form_val.name + '</b>, ' +
                        'por favor diligencialo por medio de este enlace ' + url_form + ' ' +
                        'recuerda diligenciarlo lo más pronto posible, gracias. <br>')
                    send_email('DOCUMENTO COMPARTIDO POR ' + name_enterprise, '', arrayEmail, html_message)
                logs_send_public_share(use_val.id,idForm,name_enterprise,form_val.name,description_type,destinatario)

        response['status'] = True
        status_response = status.HTTP_200_OK
    except (Enterprise.DoesNotExist):
        pass
    return Response(response, status=status_response)

def form_link_val_public_share(idForm,date,description_type):
    token_link = Encrypt().encrypt_code('Enterprise_Access' + str(idForm)+str(date))
    try:
        form_link_val = Form_Link.objects.get(form_enterprise_id=idForm,state=True,token_link=token_link,shared_to=date)
        form_link_val.access=0
        form_link_val.shared_media=description_type
        form_link_val.save()
    except Form_Link.DoesNotExist:
        form_link_val = Form_Link()
        form_link_val.form_enterprise_id = idForm
        form_link_val.token_link = token_link
        form_link_val.shared_media = description_type
        form_link_val.shared_to = str(date)
        form_link_val.access=0
        form_link_val.save()

    url_form =  settings.URL_FRONTEND + 'public/' + form_link_val.token_link
    return str(url_form)

def logs_send_public_share(userId,idForm,name_enterprise,form_valName,descriptionType,destinatario):
    log_content = {
                'user': userId,
                'group': 15,
                'element': idForm,
                'action': 14,
                'description': ("El cliente: " + str(name_enterprise) +
                    " ha compartido el enlace del documento #" + str(idForm) + ' "' + form_valName.upper() + '"' +
                    " mediante servicio externo de MELMAC, por el medio de " + descriptionType + " a los destinatarios: "+ str(destinatario)),
            }
    create_traceability(log_content)
    response = {"status": True}
    return Response(response)