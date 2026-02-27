#Clase de apis externas
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.utils.datastructures import MultiValueDictKeyError
from django.conf import settings
from django.http import JsonResponse
from api.models import (
    User_Enterprise,
    Enterprise,
    User,
    Form_Enterprise,
    User_Form,
    Form_Consecutive,
    Role_Form,
    Form_Field,
    Answer_Form,
    Answer_Field,
    History_Create_Share_Documents,
    Form_Link,
    Form_Digital
)
import hashlib, time, json, requests, traceback
import os
from datetime import datetime
from api.controllers.form import replace_character, get_field, create_form, initial_clone
from api.controllers.notification import random_token
from api.controllers.general_resources import create_link_document,send_link_shared
from api.encrypt import Encrypt
from base64 import b64decode
import base64
from threading import Thread

@api_view(['POST'])
def get_token_login(request):
    try:
        response = {}
        response['status'] = False

        data_request = request.data
        headers = request.headers
        if data_request['api_key'] !='' and data_request['user'] !='':
            api_key = data_request['api_key']
            email = data_request['user']
            try:
                enterprise = Enterprise.objects.get(api_key=api_key)

                if enterprise:
                    user_enterprise_val = User_Enterprise.objects.get(email=email, enterprise_id=enterprise, state=True)
                    if user_enterprise_val:
                        user = User.objects.get(id=user_enterprise_val.user_id)
                        token, created = Token.objects.get_or_create(user=user)
                        response['status'] = True
                        response['status_code'] = 6001
                        response['status_description'] = "Succes Login Token Generated"
                        response['data'] = {
                            'token': str(token)
                        }
                        return JsonResponse(response, status=200)

            except Enterprise.DoesNotExist:
                response['status'] = False
                response['status_code'] = 5004
                response['error'] = "La api_key esta mal redactada"
                return JsonResponse(response, status=200)

            except Exception as err:
                print("error")
                print(err)
                response['status'] = False
                response['status_code'] = 5003
                response['error'] = "El correo esta mal redactado"
                return JsonResponse(response, status=200)

        response['status'] = False
        response['status_code'] = 5001
        response['error'] = "Los parámetros están incompletos"
        return JsonResponse(response, status=200)

    except MultiValueDictKeyError as err:
        print(err)
        response['status'] = False
        response['status_code'] = 5002
        response['error'] = "Uno de los parámetros está incompleto"
        return JsonResponse(response, status=200)

@api_view(['POST'])
def set_token(request):
    try:
        response = {}
        data_request = request.data
        if data_request['ent'] !='' and data_request['user'] !='':
            email = data_request['user']
            enterprise = data_request['ent']
            try:
                user_enterprise_val = User_Enterprise.objects.get(email=email, enterprise_id=enterprise, state=True)
                if user_enterprise_val:
                    time_now = round(time.time() * 1000)
                    string = str(time_now) + "-" + str(enterprise)
                    result = hashlib.md5(string.encode())
                    enterprise_update = Enterprise.objects.filter(id=enterprise).update(api_key=str(result.hexdigest()))
                    if enterprise_update:
                            response['status'] = True
                            response['status_code'] = 6000
                            response['status_description'] = "Succes Token Api Generated"
                            response['data'] = {
                                "token_api": str(result.hexdigest())
                            }
                            return JsonResponse(response, status=200)

            except Exception as err:
                response['status'] = False
                response['status_code'] = 5005
                response['error'] = "Los datos suministrados son incorrectos"
                return JsonResponse(response, status=200)
        else:
            response['status'] = False
            response['status_code'] = 5000
            response['error'] = "Ninguno de los campos debe estar vacio"
            return JsonResponse(response, status=200)

    except MultiValueDictKeyError as err:
        response['status'] = False
        response['status_code'] = 5002
        response['error'] = "Uno de los parámetros está incompleto"
        return JsonResponse(response, status=200)

    except Exception as err:
        response['status'] = False
        response['status_code'] = 5001
        response['error'] = "Los parámetros están incompletos"
        return JsonResponse(response, status=200)

@api_view(['POST'])
def get_form_api(request):
    try:
        response = {}
        headers = request.headers
        token_auth = request.auth.key
        print(request)
        if request.data['user']!='' and request.data['api_key'] !='':
            token = token_auth
            email = request.data['user']
            api_key = request.data['api_key']
            token = Token.objects.get(key=token)
            try:
                if token:
                    state=1
                    enterprise = Enterprise.objects.get(api_key=api_key)
                    user_val = User_Enterprise.objects.get(email=email, enterprise_id=enterprise, state=True)
                    if user_val:
                        response = {"status": False}
                        status_response = status.HTTP_400_BAD_REQUEST
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
                                'creation_date': form_val['creation_date']
                            })
                        response['status'] = True
                        response['status_code'] = 6002
                        response['status_description'] = "Succes request form"
                        response['data'] = form_list
                        status_response = status.HTTP_200_OK
                        return JsonResponse(response, status=status_response)

            except Enterprise.DoesNotExist:
                    response['status'] = False
                    response['status_code'] = 5004
                    response['error'] = "La api_key esta mal redactada"
                    return JsonResponse(response, status=200)

            except Exception as err:
                response['status'] = False
                response['status_code'] = 5003
                response['error'] = "El correo esta mal redactado"
                return JsonResponse(response, status=200)
        else:
            response['status'] = False
            response['status_code'] = 5000
            response['error'] = "Ninguno de los campos debe estar vacio"
            return JsonResponse(response, status=200)

    except Token.DoesNotExist:
        response['status'] = False
        response['status_code'] = 5006
        response['error'] = "token"
        return JsonResponse(response, status=200)

    except Exception as err:
        response['status'] = False
        response['status_code'] = 5001
        response['error'] = "Los parámetros están incompletos"
        return JsonResponse(response, status=200)

@api_view(['POST'])
def get_form_id(request, form):
    try:
        response = {}
        answer=None
        consecutive=None
        response['status'] = False
        token_auth = request.auth.key
        if request.data['user']!='' and request.data['api_key']:
            token = token_auth
            email = request.data['user']
            api_key = request.data['api_key']
            token = Token.objects.get(key=token)
            try:
                if token:
                    state=1
                    enterprise = Enterprise.objects.get(api_key=api_key)
                    user_val = User_Enterprise.objects.get(email=email, enterprise_id=enterprise, state=True)
                    # Edición de Respuesta
                    update = False
                    # Respuesta de un Multi-sección
                    answer_form_val = None
                    # Respuesta de Única sección y Digital
                    if answer != None and answer != 0 and answer != '':
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

                    public = answer_form_val != None and answer_form_val.public
                    # Valida si el formulario es de la empresa
                    form_val = Form_Enterprise.objects.get(id=form, enterprise_id=enterprise, consecutive=False)
                    fields_array = get_field(form_val.id, consecutive, update, answer_form_val)
                    response['status'] = True
                    response['status_code'] = 6002
                    response['status_description'] = "Succes request form"
                    response['data'] = {
                        'name': replace_character(form_val.name),
                        'description': replace_character(form_val.description),
                        'theme': str(form_val.theme),
                        'color': form_val.color,
                        'pin': form_val.pin,
                        'digital': form_val.digital,
                        'public': public,
                        'fields': fields_array
                    }
                    status_response = status.HTTP_200_OK
                    return JsonResponse(response, status=status_response)

            except Exception as err:
                response['status'] = False
                response['status_code'] = 5005
                response['error'] = "Los datos suministrados son incorrectos"
                return JsonResponse(response, status=200)

        else:
            response['status'] = False
            response['status_code'] = 5000
            response['error'] = "Ninguno de los campos debe estar vacio"
            return JsonResponse(response, status=200)

    except Exception as err:
        response['status'] = False
        response['status_code'] = 5001
        response['error'] = "Los parámetros están incompletos"
        return JsonResponse(response, status=200)

@api_view(['POST'])
def post_form(request):
    response = {}
    token_auth = request.auth.key
    data_field = [
        { 'id': 1, 'name': 'alfanumerico'},
        { 'id': 2, 'name': 'numerico'},
        { 'id': 3, 'name': 'lista'},
        { 'id': 4, 'name': 'fecha'},
        { 'id': 5, 'name': 'solo_letras'},
        { 'id': 6, 'name': 'texto'},
        { 'id': 7, 'name': 'Firma manuscrita'},
        { 'id': 8, 'name': 'archivo'},
        { 'id': 9, 'name': 'captura'},
        { 'id': 10, 'name': 'Firma biométrica facial'},
        { 'id': 11, 'name': 'numero_documento'},
        { 'id': 12, 'name': 'radio'},
        { 'id': 13, 'name': 'checkbox'},
        { 'id': 14, 'name': 'informacion'},
        { 'id': 15, 'name': 'ubicacion'},
        { 'id': 16, 'name': 'moneda'},
        { 'id': 17, 'name': 'tabla'},
        { 'id': 18, 'name': 'firma con cédula'},
        { 'id': 19, 'name': 'hora'},
        { 'id': 20, 'name': 'nit'},
        { 'id': 21, 'name': 'oculto'},
        { 'id': 22, 'name': 'OTP básico'},
        { 'id': 23, 'name': 'País'},
        { 'id': 24, 'name': 'Número de serie'},
    ]
    if token_auth:
        data = request.data
        token = token_auth
        try:
            token = Token.objects.get(key=token)
            form = {}
            fields_form = []
            if token:
                email = data['user']
                api_key = data['api_key']
                enterprise = Enterprise.objects.get(api_key=api_key)
                user_val = User_Enterprise.objects.get(email=email, enterprise_id=enterprise, state=True)
                if user_val:
                    try:
                        response['status'] = True
                        response['status_code'] = 6004
                        fields = data['fields']
                        fields_number = data['fields_number']
                        options = data['options'].strip('}{').split(',')
                        value_options = data['value_options']
                        validations = data['validations']
                        required = data['required'].strip('}{').split(',')
                        data_form = {
                            'name': data['name'],
                            'description': data['description'],
                            'theme': 0,
                            'color': '#000000',
                            'consecutive': '0',
                            'digital': '0',
                            'pin' : '',
                            'template': 'undefined',
                            'logo': 'undefined',
                            'logo_path' : None
                        }
                        response_form = create_form(user_val, data_form)
                        form_id = response_form['form']
                        print(form_id)
                        form['id'] = form_id
                        form['name'] = data['name']
                        form['description'] = data['description']
                        form['theme'] = "0"
                        form['color'] =  "#000000"
                        form['pin'] =  ""
                        cont = 0
                        fields = json.loads(fields)
                        validations = json.loads(validations)
                        value_options = json.loads(value_options)
                        for n in fields:
                            cont += 1
                        print(str(cont))
                        for indx, n in enumerate(fields):
                            if str(cont) == str(fields_number):
                                for value in data_field:
                                    if n['type'] in value['name']:
                                        try:
                                            print(value_options[indx])
                                            fields_form.append({"field":"",
                                                                "label": n['label'],
                                                                "description": "",
                                                                "required": True if required[indx] == 'True' else False,
                                                                "field_type":str(value['id']),
                                                                "values": value_options[indx],
                                                                "valuesDocuments": [],
                                                                "valuesNit": [],
                                                                "optionDocuments": [],
                                                                "fields": [{"field": "","label": "","field_type": "","values": [{"value": "","label": ""}]},{"field": "","label": "","field_type": "","values": [{"value": "","label": ""}]}],
                                                                "row": 2,
                                                                "validate": {"advanced": "","advancedNit": "","advanced_options": ""} if validations[indx]['min'] == "" else {"min": validations[indx]['min'],"max": validations[indx]['max'],"advanced": "" if validations[indx]['advanced'] == 'false' else 'email',"advancedNit": "","advanced_options": ""}
                                                                })
                                        except Exception as err:
                                            print(traceback.format_exc())
                            else:
                                response['status'] = False
                                response['status_code'] = 5007
                                response['error'] = "Error en la cantidad de campos"
                        response['status'] = True
                        response['status_description'] = "Succes post form"
                        form['fields'] = fields_form
                        url_form = settings.URL + 'form/'
                        headers = {"Authorization": "Token " + token_auth}
                        x = requests.post(url_form, json = form, headers=headers)

                    except MultiValueDictKeyError as err:
                        response['status'] = False
                        response['status_code'] = 5008
                        response['error'] = err
                    except Exception as err:
                        response['status'] = False
                        response['status_code'] = 5008
                        response['error'] = str(err)

                response['data'] = {"Entra":1}
        except MultiValueDictKeyError as err:
            response['status'] = False
            response['status_code'] = 5008
            response['error'] = "Key Error " + str(err)
        except Exception as err:
            response['status'] = False
            response['status_code'] = 5008
            response['error'] = str(err)

    return JsonResponse(response, status=200)

@api_view(['POST'])
def get_form_answer_id(request, form):
    try:
        response = {}
        answer=None
        consecutive=None
        response['status'] = False
        token_auth = request.auth.key
        if request.data['user']!='' and request.data['api_key']:
            token = token_auth
            email = request.data['user']
            api_key = request.data['api_key']
            token = Token.objects.get(key=token)
            try:
                if token:
                    enterprise = Enterprise.objects.get(api_key=api_key)
                    answer_form_val = Answer_Form.objects.filter(form_enterprise_id=form).order_by('-creation_date')
                    form_val = Form_Enterprise.objects.get(id=form, enterprise_id=enterprise, consecutive=False)
                    list=[]
                    countForms=0
                    for value in answer_form_val:
                        countForms +=1
                        location=[]
                        location.append({
                            'latitude':value.latitude,
                            'longitude':value.longitude,
                        })
                        if value.public:
                            user= "Usuario Publico",
                        else:
                            user_val_data = User_Enterprise.objects.get(id=value.created_by_id)
                            name1=''
                            name2=''
                            last_name1=''
                            last_name2=''
                            if str(user_val_data.first_name) != 'None':
                                name1=user_val_data.first_name
                            if str(user_val_data.middle_name) != 'None':
                                name2=' '+user_val_data.middle_name+' '
                            if str(user_val_data.first_last_name) != 'None':
                                last_name1=' '+user_val_data.first_last_name
                            if str(user_val_data.second_last_name) != 'None':
                                last_name2=' '+user_val_data.second_last_name
                            user = name1+name2+last_name1+last_name2

                        answer_val_data = Answer_Field.objects.filter(answer_form_id=value.id)
                        dataAnswer=[]
                        for value2 in answer_val_data:
                            title_answer_data = Form_Field.objects.get(id=value2.form_field_id)
                            answerValue=value2.value
                            type_option = ['7', '9']
                            if str(title_answer_data.field_type_id) in type_option:
                                answerValue = settings.URL + 'media' + value2.value
                            dataAnswer.append({
                                'title':title_answer_data.name,
                                'answer':answerValue,
                            })

                        list.append({
                            'id': value.id,
                            'answerDate':value.creation_date,
                            'user': user,
                            'location':location,
                            'answer':dataAnswer
                        })

                    response['status'] = True
                    response['status_code'] = 6005
                    response['status_description'] = "Succes answer request form"
                    response['data'] = {
                        'form_name': replace_character(form_val.name),
                        'form_description': replace_character(form_val.description),
                        'total_responses_forms':countForms,
                        'general_answers':list
                    }
                    status_response = status.HTTP_200_OK
                    return JsonResponse(response, status=status_response)

            except Exception as err:
                response['status'] = False
                response['status_code'] = 5005
                response['error'] = "Los datos suministrados son incorrectos"
                return JsonResponse(response, status=200)

        else:
            response['status'] = False
            response['status_code'] = 5000
            response['error'] = "Ninguno de los campos debe estar vacio"
            return JsonResponse(response, status=200)

    except Exception as err:
        response['status'] = False
        response['status_code'] = 5001
        response['error'] = "Los parámetros están incompletos"
    return JsonResponse(response, status=200)

@api_view(['POST'])
def create_share_document(request):
    """
    API endpoint que permite crear el clon de un documento que existe en el administrador y despues de clonarlo compartirlo al correo y/o SMS/WhatsApp
    """
    response = {}
    response['status'] = False
    try:
        headers = request.headers
        token_auth = request.auth.key
        data=request.data
        api_key = data['api_key']

        if data['user']!='' and api_key !='':
            token = token_auth
            token = Token.objects.get(key=token)
            try:
                if token:
                    nameDocument = data["nameDocument"]
                    user_val = User_Enterprise.objects.get(email=data['user'], state=True, role_id=2)
                    enterprise = user_val.enterprise_id
                    name_enterprise = user_val.enterprise.name if user_val.enterprise.name != '' else 'Melmac'
                    name_enterprise_v2 = "a "+user_val.enterprise.name if user_val.enterprise.name != '' else ''
                    img = settings.URL + 'media/' + str(user_val.enterprise.logo) if user_val.enterprise.logo != '' else 'https://melmac.co/assets/images/logo_melmac.png'

                    try:
                        form_val = Form_Enterprise.objects.get(name=nameDocument, enterprise_id=user_val.enterprise_id, digital = True, state= True)
                        token_link = Encrypt().encrypt_code('create_share_document' + str(data["nameDocument"]) + str(random_token(8)))
                        dataJson = {'clone': 1, 'api_create_share_document':token_link,'enterprise_id':user_val.enterprise_id}
                        dataJsonShare = json.loads(data["share"])

                        folder = '/' + str(enterprise)+'/digital/temporalP'
                        path = settings.MEDIA_ROOT + folder
                        isPDF = base64_to_pdf(data['file'],path)

                        if isPDF:
                            start = initial_clone(user_val,dataJson,form_val.id)
                            if start:
                                history_share = History_Create_Share_Documents()
                                history_share.token = token_link
                                history_share.enterprise_id = user_val.enterprise_id
                                history_share.save()

                                descriptionF = data["nameDocument"]+' '+str(token_link)
                                new_thread = Thread(target=initial_send, args=(descriptionF, user_val.enterprise_id, data, dataJsonShare, history_share, enterprise, name_enterprise, img, name_enterprise_v2))
                                new_thread.start()

                                response['status'] = True
                                response['detail'] = 'Proceso ejecutado correctamente'

                            status_response = status.HTTP_200_OK
                            return JsonResponse(response, status=status_response)
                        else:
                            status_response = status.HTTP_400_BAD_REQUEST
                            response['status'] = False
                            response['status_code'] = 5010
                            response['error'] = "Error en el PDF, verifique el formato de Base64"
                            return JsonResponse(response, status=status_response)
                    except Form_Enterprise.DoesNotExist:
                        status_response = status.HTTP_400_BAD_REQUEST
                        response['status'] = False
                        response['status_code'] = 5011
                        response['error'] = "Error en nameDocument: el nombre del documento no existe"
                        return JsonResponse(response, status=status_response)

            except Exception as err:
                print(err)
                status_response = status.HTTP_400_BAD_REQUEST
                response['status'] = False
                response['status_code'] = 5005
                response['error'] = "Los datos suministrados son incorrectos"
                return JsonResponse(response, status=status_response)
        else:
            status_response = status.HTTP_400_BAD_REQUEST
            response['status'] = False
            response['status_code'] = 5000
            response['error'] = "Ninguno de los campos debe estar vacio"
            return JsonResponse(response, status=status_response)

    except Token.DoesNotExist:
        status_response = status.HTTP_400_BAD_REQUEST
        response['status'] = False
        response['status_code'] = 5006
        response['error'] = "token"
        return JsonResponse(response, status=status_response)

    except Exception as err:
        print(err)
        status_response = status.HTTP_400_BAD_REQUEST
        response['status'] = False
        response['status_code'] = 5001
        response['error'] = "Los parámetros están incompletos"
        return JsonResponse(response, status=status_response)

def base64_to_pdf(file,path):
    try:
        file_bytes = b64decode(file, validate=True)
        print(file_bytes[0:4])
        if file_bytes[0:4] != b"%PDF":
            raise ValueError("Missing the PDF file signature")
        with open(path, "wb") as f:
            f.write(file_bytes)
        return True

    except Exception as err:
        print(err)
        return False

def initial_send(description, form_id, data, dataJsonShare, history_share, enterprise, name_enterprise, img, name_enterprise_v2):
    form_val_update = Form_Enterprise.objects.get(description = description, enterprise_id=form_id)
    form_val_update.description = data["nameDocument"]
    form_val_update.name = str(dataJsonShare['identification_number'])+'_'+ str(dataJsonShare['name'])+ '_' + data["nameDocument"]
    form_val_update.save()
    history_share.id_form = form_val_update.id
    history_share.save()

    folder = '/' + str(enterprise)+'/digital/'+str(form_val_update.id)
    path = settings.MEDIA_ROOT + folder

    if not os.path.exists(path):
        os.makedirs(path)
    namePDF = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + ".pdf"
    path += '/'+namePDF

    base64_to_pdf(data['file'],path)

    form_digital_val = Form_Digital.objects.get(form_enterprise_id=form_val_update.id)
    form_digital_val.template = folder+'/'+namePDF
    form_digital_val.save()

    # Enlace documento
    try:
        form_link_val = Form_Link.objects.get(form_enterprise_id=form_val_update.id,state=True)
    except Form_Link.DoesNotExist:
        # Se genera token unico por documento
        if 'cell_number' in dataJsonShare and dataJsonShare['cell_number'] != '':
            data_token_link = create_link_document(str(dataJsonShare['cell_number'])+str(form_val_update.id)+str(datetime.now()),form_val_update.id,enterprise,dataJsonShare['cell_number'],"WhatsApp y SMS",True,2,0,False)
            send_link_shared('2', str(dataJsonShare['cell_number']), data_token_link, data, form_val_update.name, name_enterprise, img)
            send_link_shared('3', str(dataJsonShare['cell_number']), data_token_link, data, form_val_update.name, name_enterprise, img, name_enterprise_v2)
        if 'email' in dataJsonShare and dataJsonShare['email'] != '':
            data_token_link = create_link_document(dataJsonShare['email']+str(form_val_update.id)+str(datetime.now()),form_val_update.id,enterprise,dataJsonShare['email'],"correo electrónico",True,2,0,False)
            arrayEmail=[]
            arrayEmail.append(dataJsonShare['email'])
            send_link_shared('1', arrayEmail, data_token_link, data, form_val_update.name, name_enterprise, img)

    return True