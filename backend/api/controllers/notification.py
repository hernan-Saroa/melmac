# authentication
from dataclasses import replace
from tokenize import Double
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
# Others
from api.models import Answer_Consecutive, Answer_Field, Answer_Form, Answer_Form_Consecutive, Profile, Profile_Image, Profile_document, Sign_Profile_Document, User_Enterprise, Profile_Enterprise,Sms_Token,Enterprise,Sign_Email,Form_Link,Form_Enterprise,Task
from api.encrypt import Encrypt
from .traceability import create_traceability
from django.core.mail import EmailMultiAlternatives
from datetime import datetime
import requests
import itertools
import json
import base64
import http.client
import pytz
from api.util import send_email, convert_to_readable_date
from random import randint

TZ_INFO = pytz.timezone('America/Bogota')

def special_text(text):
    dictionary = {
        'á': 'a', 'Á': 'A', 'æ': 'a', 'à': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
        'é':'e', 'É':'E', 'è': 'e', 'ê': 'e', 'ë':'e',
        'í': 'i', 'Í': 'I', 'ì': 'i', 'î': 'i', 'ï':'i',
        'ó': 'o', 'Ó': 'O', 'ò': 'o', 'ô': 'o', 'õ':'o', 'ö':'o', 'ø': 'o',
        'ú': 'u', 'Ú': 'U', 'ü': 'u', 'ù': 'u', 'û': 'u', 'ü':'u',
        'ç': 'c', 'ÿ': 'y',
        'ñ': 'n', 'Ñ': 'N'
    }
    transTable = text.maketrans(dictionary)
    text = text.translate(transTable)
    return text

class Sms():
    # Metodo de envio de correo al inicar session
    def send(phone, message):
        """
        Metodo de envio de SMS
        Argumentos: (telefono, mensaje)
        """
        if phone != '' and len(phone) == 10:
            conn = http.client.HTTPSConnection("9rl3qy.api.infobip.com")
            message = special_text(message)
            payload = "{\"messages\":[{\"from\":\"InfoSMS\",\"destinations\":[{\"to\":\"57"+ str(phone) +"\"}],\"text\":\"" + str(message) + "\",\"flash\":false}]}"
            headers = {
                'Authorization': 'App 7ecb91146ce881d22f42b1abdd277c37-77be066d-e90c-4a98-9a53-fff82a1d7b3b',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
            conn.request("POST", "/sms/2/text/advanced", payload, headers)

            res = conn.getresponse()
            data = res.read()
            # print(data.decode("utf-8"))

        return message

class Enrolment():

    @api_view(['POST'])
    def token(request):
        # Metodo para obetener el token para consumo de apis huawei
        # type; token face = 1, token_ocr = 2
        data = request.data
        type = data['type']
        if(type == "1"):
            name = "ap-southeast-1"
        else:
            name = "ap-southeast-2"
        conn = http.client.HTTPSConnection(settings.TOKEN_HUAWEI)
        payload = "{\"auth\": {\"identity\": {\"methods\": [\"password\"],\"password\": {\"user\": {\"domain\": {\"name\": \"hid_lwene9rla_k6n9k\"},\"name\": \"Api\",\"password\": \"M3lmac2023*\"}}},\"scope\": {\"project\": {\"name\":\"" + name +"\"}}}}"
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        conn.request("POST", "/v3/auth/tokens?nocatalog=true", payload, headers)

        res = conn.getresponse()
        data = res.read()
        token_api = ""
        headers = res.getheaders()
        status_code = res.status
        for data_headers in headers:
            if(data_headers[0] == 'X-Subject-Token'):
                token_api = data_headers[1]

        data_decode = json.loads(data)
        response = json.dumps({"id" : data_decode['token']['project']['id'], "token" : token_api, "expired" : data_decode['token']['expires_at']})

        if status_code == 201:
            response_data = Response(json.loads(response), status=status.HTTP_200_OK)
        else:
            response_data = Response(json.loads(response), status=status.HTTP_400_BAD_REQUEST)

        return response_data

    @api_view(['POST'])
    def video_match(request):
        response = {}
        response['status'] = False
        data = request.data
        id_api = data["id_api"]
        token_api = data["token_api"]
        action = data['action']
        video_64 = data['video']
        user_id = data['user_id'] if 'user_id' in data else None
        document_id = data['document_id']
        user = User_Enterprise.objects.get(id=user_id) if user_id else None

        try:
            # Metodo para obetener el token para consumo de apis huawei
            conn = http.client.HTTPSConnection("face.ap-southeast-1.myhuaweicloud.com")
            payload = "{\"video_base64\":\"" + video_64 +"\", \"actions\":\""+str(action)+"\",\"action_time\":\"1000-5000\"}"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Auth-Token' : token_api
            }
            conn.request("POST", "/v2/" + id_api + "/live-detect", payload, headers)
            res = conn.getresponse()
            response = res.read()
            if 'trace_token' in data and data['trace_token']:
                content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " genero la captura de la biometria de la persona identificada con el número de cedula " +
                            str(document_id)
                        )
                    }
                create_traceability(content)
            else:
                content = {
                    'user': user_id,
                    'group': 19,
                    'element': user_id,
                    'action': 5,
                    'description': "El usuario denominado: " + ('{} {}({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                    " genero la captura de la cedula frontal de la persona identificada con el número de cedula " + str(document_id)
                    + " y se verifica que coincide la persona del documento con la biometría facial" ,
                }
                create_traceability(content)

            return Response(json.loads(response), status=status.HTTP_200_OK)

        except Exception as error:
            response['message'] = 'Error con los datos ' + str(error)
        return Response(response, status=status.HTTP_200_OK)

    @api_view(['POST'])
    def image_match(request):
        response = {}
        response['status'] = False
        data = request.data
        id_api = data["id_api"]
        token_api = data["token_api"]
        image1 = data['image1']
        image2 = data['image2']
        user_id = data['user_id']
        document_id = data['document_id']
        user = User_Enterprise.objects.get(id=user_id) if user_id else None
        try:
            # Metodo para obetener el token para consumo de apis huawei
            conn = http.client.HTTPSConnection("face.ap-southeast-1.myhuaweicloud.com")
            payload = "{\"image1_base64\": \"" + str(image1) +"\",\"image2_base64\": \"" + str(image2) +"\"}"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Auth-Token' : token_api
            }
            conn.request("POST", "/v2/" + id_api + "/face-compare", payload, headers)

            res = conn.getresponse()
            response = json.loads(res.read())

            group = int(str(19) + str(user_id))
            if 'trace_token' in data and data['trace_token']:
                content = {
                    'user': None,
                    'group': 19,
                    'element': data['trace_token'],
                    'action': 10,
                    'description': ("El usuario denominado: " + ('{} {}({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                        " realizo la validación de reconocimiento facial con el documento de identidad de la persona idetificada con el número " +
                        str(document_id) + " y se verifica que coincide la persona del documento con la biometría facial en un " +
                        str(round(response['similarity']*100, 2)) + "%"
                    ),
                    'extra':json.dumps({
                        'image': [image1, image2],
                    })
                }
                create_traceability(content)
            else:
                content = {
                    'user': user_id,
                    'group': group,
                    'element': user_id,
                    'action': 6,
                    'description': "El usuario denominado: " + ('{} {}({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                    " realizo la validación de reconocimiento facial con el documento de identidad de la persona idetificada con el numero " + str(document_id),
                }
                create_traceability(content)

            return Response(response, status=status.HTTP_200_OK)

        except Exception as error:
            response['message'] = 'Error con los datos ' + str(error)
        return Response(response)

    @api_view(['POST'])
    def authorization(request):
        print("AUTORIZATIONNNN")
        response = {}
        response['status'] = False
        data = request.data
        user_email = None
        if 'email' in data and data['email'] != '':
            user_email = data['email']
        now_time = datetime.now(tz=TZ_INFO).strftime("%d%m%Y%H%M%S")
        trace_token = data['trace_token'] if 'trace_token' in data and data['trace_token'] else Encrypt().encrypt_code('{}-{}'.format(data['email'], now_time))
        try:
            user = User_Enterprise.objects.get(email=user_email) if user_email else None
            content = {
                        'user': user.id,
                        'group': 19,
                        'element': trace_token,
                        'action': 17,
                        'description': "El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico')+" acepto y autorizo el tratamiento de datos personales.",
                    }
        except:
            content = {
                        'user': None,
                        'group': 19,
                        'element': trace_token,
                        'action': 17,
                        'description': "El usuario denominado: Usuario Publico acepto y autorizo el tratamiento de datos personales.",
                    }

        create_traceability(content)
        response['status'] = True
        response['trace_token'] = trace_token

        return Response(response, status=status.HTTP_200_OK)

    @api_view(['POST'])
    def ocr(request):
        response = {}
        response['status'] = False
        data = request.data
        try:
            id_api = data["id_api"]
            token_api = data["token_api"]
            image = data['image'] #CC
            image_back = data['image_back'] #CC
            document = data['document']
            entreprise = data['enterprise']
            user_id = data['user_id'] if 'user_id' in data else None
            user = User_Enterprise.objects.get(id=user_id) if user_id else None

            from django.core.cache import cache
            from api.models import Enterprise_Attempt
            cache_key = f"attempt_18_{entreprise}_{document}"
            limit_obj = Enterprise_Attempt.objects.filter(enterprise_id=entreprise, field_type_id=18).first()
            if limit_obj and limit_obj.attempts > 0:
                attempts = cache.get(cache_key, 0)
                if attempts >= limit_obj.attempts:
                    response['message'] = 'Firma bloqueada por exceso de intentos fallidos. Posible fraude.'
                    return Response(response, status=status.HTTP_200_OK)
        except:
            response['message'] = 'Faltan Parametros'
            return Response(response, status.HTTP_200_OK)
            # Metodo para obetener el token para consumo de apis huawei

        # Es para llevar la trazabilidad y al final realizar el cambio total al id de la respuesta.
        trace_token = None
        document_val = ""
        confidence = ""
        fech_nac = ""
        lug_nac = ""
        set_lug_nac = False
        fech_exp = ""
        lug_exp = ""
        gs_rh = ""
        sexo = ""
        # Es para llevar la trazabilidad y al final realizar el cambio total al id de la respuesta.
        now_time = datetime.now(tz=TZ_INFO).strftime("%d%m%Y%H%M%S")
        trace_token = data['trace_token'] if 'trace_token' in data and data['trace_token'] else Encrypt().encrypt_code('{}-{}'.format(document, now_time))
        for i, img in enumerate([image,image_back]):
            conn = http.client.HTTPSConnection("ocr.ap-southeast-2.myhuaweicloud.com")
            payload = "{\"image\":\""+str(img)+"\"}"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Auth-Token' : token_api
            }
            conn.request("POST", "/v2/" + str(id_api) + "/ocr/web-image", payload, headers)

            res = conn.getresponse()
            data = res.read()
            data = json.loads(data)

            # Archivo Imagen Frontal
            if i == 0:

                #Tipo de documento:
                # 1 cedula normal
                # 2 cedula nueva
                for charTipe in data['result']['words_block_list']:
                    if charTipe['words'] == 'CEDULA DE CIUDADANIA':
                        tipeDoc=1
                        break
                    else:
                        tipeDoc=2

                if tipeDoc == 1:
                    try:
                        for char in data['result']['words_block_list']:
                            try:
                                document_val = int(char['words'].replace(',','').replace('.',''))
                                confidence = char['confidence']*100
                            except ValueError:
                                pass
                        result =  data['result']['words_block_count']
                    except IndexError:
                            pass
                else:
                    try:
                        for charTwo in data['result']['words_block_list']:
                            try:
                                arrayText = charTwo['words'].split(',')
                                if len(arrayText) < 2:
                                    document_val_aux = int(charTwo['words'].replace('NUIP','').replace(',','').replace('.','').replace(' ',''))
                                    if len(str(document_val_aux)) > 4:
                                        document_val = document_val_aux
                                        confidence = charTwo['confidence']*100
                                else:
                                    fech_exp = convert_to_readable_date(arrayText[0].replace(' ','-'))
                            except ValueError:
                                pass
                        result =  data['result']['words_block_count']
                    except IndexError:
                            pass
                if document_val == '' and result != 0 :
                    if limit_obj and limit_obj.attempts > 0:
                        cache.set(cache_key, cache.get(cache_key, 0) + 1, timeout=86400)
                    response['status'] = False
                    response['message'] = 'No se reconocio el número de documento, suba una nueva imagen frontal e intente nuevamente'
                    return Response(response, status=status.HTTP_200_OK)
                elif result == 0:
                    if limit_obj and limit_obj.attempts > 0:
                        cache.set(cache_key, cache.get(cache_key, 0) + 1, timeout=86400)
                    response['status'] = False
                    response['message'] = 'La imagen frontal está de manera vertical, por favor gire la imagen frontal de manera horizontal'
                    return Response(response, status=status.HTTP_200_OK)

                content = {
                    'user': user_id,
                    'group': 19,
                    'element': trace_token,
                    'action': 10,
                    'description': "El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico')+" realizo la validacion del documento " + str(document) + " contra el número " + str(document_val) + " por medio de OCR (Optical Character Recognition)",
                    'extra': json.dumps({'image': [str(image)]})
                }
                create_traceability(content)
            # Archivo Imagen Posterior
            elif i == 1:
                if tipeDoc == 1:
                    for j, char in enumerate(data['result']['words_block_list']):
                        words = str(char['words'])
                        try:
                            if '-' in words:
                                if len(words) > 3:
                                    # Fecha y Lugar de Expedicion
                                    if ' ' in words:
                                        temp_exp = str(words).split(' ')
                                        fech_exp = temp_exp[0]
                                        lug_exp = ' '.join(temp_exp[1:])
                                    elif len(words) == 11:
                                    # Fecha de Nacimiento
                                        fech_nac = words
                                elif 'A' in words or 'B' in words or 'O' in words:
                                    # Grupo Sanguineo con RH negativo
                                    gs_rh = words
                            elif '+' in words:
                                # Grupo Sanguineo con RH Positivo
                                gs_rh = words
                            elif ' ' in words:
                                if 'FECHA DE NACIMIENTO' in words.strip() and not set_lug_nac:
                                    # Lugar de Nacimiento
                                    # print(words, j)
                                    # print(data['result']['words_block_list'][2]['words'], data['result']['words_block_list'][3]['words'])
                                    try:
                                        if j < len(data['result']['words_block_list'])-2:
                                            lug_nac = data['result']['words_block_list'][j+1]['words'] + data['result']['words_block_list'][j+2]['words']
                                        elif j < len(data['result']['words_block_list'])-1:
                                            lug_nac = data['result']['words_block_list'][j+1]['words']
                                    except IndexError:
                                        lug_nac = data['result']['words_block_list'][j+1]['words']
                                    set_lug_nac = True
                            elif len(words) <= 2:
                                # Genero/Sexo de la persona
                                for s in ['M','F','T','NB']:
                                    if s in words:
                                        sexo = words
                                        break
                        except Exception as err:
                            print(err)
                    # print(fech_nac, lug_nac, fech_exp, lug_exp, gs_rh, sexo)
                    if fech_exp == '' and data['result']['words_block_count']:
                        if limit_obj and limit_obj.attempts > 0:
                            cache.set(cache_key, cache.get(cache_key, 0) + 1, timeout=86400)
                        response['status'] = False
                        response['message'] = 'La imagen posterior está de manera vertical, por favor gire la imagen posterior de manera horizontal'
                        return Response(response, status=status.HTTP_200_OK)
                    elif data['result']['words_block_count'] == 0:
                        if limit_obj and limit_obj.attempts > 0:
                            cache.set(cache_key, cache.get(cache_key, 0) + 1, timeout=86400)
                        response['status'] = False
                        response['message'] = 'La imagen posterior está de manera vertical, por favor gire la imagen posterior de manera horizontal'
                        return Response(response, status=status.HTTP_200_OK)
                    else:
                        fech_exp = convert_to_readable_date(fech_exp)

                content = {
                    'user': user_id,
                    'group': 19,
                    'element': trace_token,
                    'action': 10,
                    'description': "El usuario denominado: " + ('{} {}({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') + " realizo la validacion del documento " + str(document) + " y obtuvo la fecha de expedición por medio de OCR (Optical Character Recognition)",
                    'extra': json.dumps({'image': [str(image_back)]})
                }
                create_traceability(content)

        try:
            if(int(document) == int(document_val)):
                if limit_obj and limit_obj.attempts > 0:
                    cache.delete(cache_key)
                response['status'] = True
                response['data'] = {
                    'parameters' : {
                        'result' : result,
                        'document' : document_val,
                        'confidence_document': confidence,
                        'extra': {
                            # 'fech_nac' : fech_nac,
                            # 'lug_nac' : lug_nac,
                            'fech_exp' : fech_exp,
                            # 'lug_exp' : lug_exp,
                            # 'gs_rh' : gs_rh,
                            # 'sexo' : sexo,
                        }
                    },
                    'trace_token': trace_token
                }
                return Response(response, status=status.HTTP_200_OK)
        except ValueError:
            pass
        
        if limit_obj and limit_obj.attempts > 0:
            cache.set(cache_key, cache.get(cache_key, 0) + 1, timeout=86400)
            
        response['status'] = False
        response['message'] = 'Datos no coinciden'
        return Response(response, status=status.HTTP_200_OK)


    @api_view(['POST'])
    def image_match_form(request):
        response = {}
        response['status'] = False
        data = request.data
        id_api = data["id_api"]
        entreprise = data["enterprise"]
        token_api = data["token_api"]
        image1 = data['image1'] #video
        # image2 = data['image2']
        user_id = data['user_id'] if 'user_id' in data else None
        ipAddress = data['ip_address'] if 'ip_address' in data else None
        document_id = data['document_id']
        user = User_Enterprise.objects.get(id=user_id) if user_id else None

        from django.core.cache import cache
        from api.models import Enterprise_Attempt
        cache_key = f"attempt_10_{entreprise}_{document_id}"
        limit_obj = Enterprise_Attempt.objects.filter(enterprise_id=entreprise, field_type_id=10).first()
        if limit_obj and limit_obj.attempts > 0:
            attempts = cache.get(cache_key, 0)
            if attempts >= limit_obj.attempts:
                response['message'] = 'Firma bloqueada por exceso de intentos fallidos. Posible fraude.'
                return Response(response, status=status.HTTP_200_OK)

        try:
            profile_val = Profile.objects.filter(identification = data['document_id']).order_by('modify_date').last()
            if not profile_val:
                raise Profile.DoesNotExist()
            profile_enterprise = Profile_Enterprise.objects.get(
                enterprise_id=entreprise,
                profile=profile_val,
                state=True,
            )
        except Profile_Enterprise.DoesNotExist:
            profile_enterprise = Profile_Enterprise()
            profile_enterprise.enterprise_id = entreprise
            profile_enterprise.profile = profile_val
            profile_enterprise.user_id = user_id
            profile_enterprise.save()
        profile_image_val = Profile_Image.objects.filter(profile_id = profile_val.id).order_by('id')
        image2 = profile_image_val.first().image
        image = open(settings.MEDIA_ROOT + "/" + str(image2), "rb") #open binary file in read mode
        image_read = image.read()
        image_64_encode = base64.encodebytes(image_read)
        image_64_encode = image_64_encode.split()
        image_64_encode = "".join(map(str,image_64_encode))
        image_64_encode = image_64_encode.replace("'b'", "")
        image_64_encode = image_64_encode.replace("b'", "")
        image_64_encode = image_64_encode.replace("'", "")
        doc_image = profile_image_val.last().image
        image.close()

        image = open(settings.MEDIA_ROOT + "/" + str(doc_image), "rb") #open binary file in read mode
        image_read = image.read()
        doc_image = base64.encodebytes(image_read)
        doc_image = doc_image.split()
        doc_image = "".join(map(str,doc_image))
        doc_image = doc_image.replace("'b'", "")
        doc_image = doc_image.replace("b'", "")
        doc_image = doc_image.replace("'", "")
        image.close()
        try:
            # Metodo para obetener el token para consumo de apis huawei
            conn = http.client.HTTPSConnection("face.ap-southeast-1.myhuaweicloud.com")
            payload = "{\"image1_base64\": \"" + str(image1) +"\",\"image2_base64\": \"" + str(image_64_encode) +"\"}"
            headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Auth-Token' : token_api
            }
            conn.request("POST", "/v2/" + str(id_api) + "/face-compare", payload, headers)

            res = conn.getresponse()
            response = res.read()

            response_service = json.loads(response)

            if response_service.get('similarity', 0) > 0.7:
                if limit_obj and limit_obj.attempts > 0:
                    cache.delete(cache_key)
                # Registro único para la firma biometrica por respuesta campo.
                spd_val = Sign_Profile_Document()
                spd_val.profile_id = profile_val.id
                spd_val.save()
                hash_info = Encrypt().encrypt_code('{}-{}-{}'.format(spd_val.id, entreprise, document_id))
                token_url = Encrypt().encrypt_code('{}-{}'.format(spd_val.id, profile_val.token_autorization))
                spd_val.hash_info = hash_info
                spd_val.token_url = token_url
                if 'trace_token' in data and data['trace_token']:
                    spd_val.token_registry = data['trace_token']
                spd_val.save()
                response_service['data'] = spd_val.id

                if 'trace_token' in data and data['trace_token']:
                    content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " realizo la validación de reconocimiento facial con el documento de identidad de la persona idetificada con el número " +
                            str(document_id) + " y se verifica que coincide la persona del documento con la biometría facial en un " +
                            str(round(response_service['similarity']*100, 2)) + "%",
                        ),
                        'extra':json.dumps({
                            'image': [doc_image, image1],
                        })
                    }
                    create_traceability(content)
                    content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " Realizo una Firma de reconocimiento facial desde la Direccion IP: " + str(ipAddress)
                        )
                    }
                    create_traceability(content)
                    content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " finalizo el proceso de firma con éxito"
                        )
                    }
                    create_traceability(content)

            else:
                if 'similarity' in response_service:
                    if limit_obj and limit_obj.attempts > 0:
                        cache.set(cache_key, cache.get(cache_key, 0) + 1, timeout=86400)

            return Response(response_service, status=status.HTTP_200_OK)

        except Exception as error:
            response['message'] = 'Error con los datos ' + str(error)
        return Response(response, status=status.HTTP_200_OK)

def list_restric(document, typeD=1):
    # typeD 1 = Documento de identidad nacional
    # typeD 2 = Documento Nit
    response = []
    url = 'http://34.203.184.106:10000/api/AnalyzerOnLine'
    data = requests.get(url, params = {"IdentificationType":typeD, "SearchParam":document ,"Token":"594d065d"},headers = {"Authorization" : "594d065d"})
    data = json.loads(data.json())

    for level_1 in data:
        if(level_1['GroupNameList'] != "INFORMACIÓN GENERAL"):
            for level_2 in level_1['SearchList']:
                    response.append({
                        'name' : level_2['ListName'],
                        'offense' : level_2['QueryDetail']['Offense'] if level_2['InRisk'] else "NA",
                        'more_nfo' : level_2['QueryDetail']['MoreInfo'] if level_2['InRisk'] else "NA",
                        'link' : level_2['QueryDetail']['Link'] if level_2['InRisk'] else "NA",
                    })
        else:
            nombre = level_1['Name']

    response=sorted(response, key=lambda x: x['link'], reverse=True)
    data_1 = {}
    data_1['response'] = json.dumps(response)
    data_1['nombre'] = nombre
    data_1['type'] = typeD
    # group = int(str(19) + str(user_id))
    # content = {
    #         'user': user_id,
    #         'group': group,
    #         'element': user_id,
    #         'action': 7,
    #         'description': "Se realiza la validacion de listas restrictivas en el proceso que esta realizando el usuario " + str(user_id) + " para la persona identificada con el número " + document,
    #     }
    # create_traceability(content)
    return data_1


def send_email_signers_admin(enterprise_id, path_file, answer_form, consecutive,id_Task):
    admin_email = User_Enterprise.objects.filter(enterprise_id=enterprise_id, role_id=2, state=True).values_list('email', flat=True)
    enterprise = Enterprise.objects.get(id=enterprise_id, state=True)
    from_email = settings.EMAIL_HOST_USER
    if consecutive:
        name_form = Answer_Consecutive.objects.get(id=consecutive.id).form_consecutive.name
        answer_form_ids = Answer_Form_Consecutive.objects.filter(answer_consecutive_id=consecutive.id).values_list('answer_form_id', flat=True)
    else:
        name_form = Answer_Form.objects.get(id=answer_form).form_enterprise.name
        answer_form_ids = [answer_form]

    if id_Task != '':
        email_subprojectA = []
        email_subproject = Task.objects.get(id=id_Task).subproject.email
        email_subprojectA.append(email_subproject)

    sign_fields = Answer_Field.objects.filter(
            answer_form_id__in=answer_form_ids,
            form_field__field_type_id__in=[10, 18, 7],
            state=True
        ).select_related(
            'form_field'
        ).order_by('form_field__field_type_id').values(
            'id',
            'form_field__field_type_id'
        )
    get_attr = lambda point: point['form_field__field_type_id']
    answer_list = {str(k): list(g) for k, g in itertools.groupby(sign_fields, get_attr)}

    bio_fields_ids = answer_list['10'] if '10' in answer_list else []
    sign_fields_ids = answer_list['18'] if '18' in answer_list else []
    manuscrita_fields_ids = answer_list['7'] if '7' in answer_list else []

    sign_data = []
    sign_data_noQR = []

    if manuscrita_fields_ids:
        sign_data_noQR = list(Sign_Email.objects.filter(answer_field_id__in=[man['id'] for man in manuscrita_fields_ids]).values_list(
                'email', flat=True
            ))

    for email in sign_data_noQR:
        if email not in sign_data:
            sign_data.append(email)

    name_enterprise = enterprise.name if enterprise.name != '' else 'Melmac'
    img = settings.URL + 'media/' + str(enterprise.logo) if enterprise.logo != '' else 'https://melmac.co/assets/images/logo_melmac.png'
    subject = '🖋️¡GRACIAS, FIRMASTE CON '+ name_enterprise.upper() +' EL DOCUMENTO '+ name_form.upper() +' EXITOSAMENTE!📄'
    text_content = 'Se envía documento diligenciado con la firma respectiva del usuario.'
    Logo = '<br><br><img style="width: 350px;" src="' + img + '"><br><br>'
    content = (
    '<b>NOTIFICACIÓN FIRMA DE DOCUMENTO</b>.<br><br>'+
    'Nos complace informarte que el proceso de Firma manuscrita del documento '+ name_form.upper() +' con la '+name_enterprise.upper()+
    ' ha sido completado con éxito. Adjunto a este mensaje, encontrarás una copia del documento en '+
    'formato PDF autenticado por <b>Melmac DMS</b>, cumpliendo las consideraciones contenidas en la Ley 527 de 1999 y ' +
    'sus modificaciones posteriores (COL) y normas equivalentes internacionales. ' +
    'Cualquier duda o aclaración sobre el proceso, comunícate con: ' +'<b>'+ name_enterprise.upper() + '</b>')

    for to in sign_data:
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
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            msg.attach_alternative(html_message, "text/html")
            msg.attach_file(settings.MEDIA_ROOT + '/' + path_file if settings.MEDIA_ROOT not in path_file else path_file)
            msg.send()
        except Exception as err:
            print("Error envio PDF")
            print(err)

    sign_data = []
    # Adjunta la información de los firmantes de biometrico
    if bio_fields_ids:
        bio_array = Sign_Profile_Document.objects.filter(
                answer_id__in=[bio['id'] for bio in bio_fields_ids],
            ).select_related(
                'profile'
            ).values_list(
                'profile__email', flat=True
            )

        sign_data += [
            bio.strip() for bio in list(bio_array) if bio
        ]

    # Adjunta la información de los firmantes electronicos
    if sign_fields_ids:
        sign_vals = list(Profile_document.objects.filter(
                answer_id__in=[sign['id'] for sign in sign_fields_ids]
            ).select_related(
                'profile'
            ).values_list(
                'email', flat=True
            ))
        sign_data += [
            sign.strip() for sign in list(sign_vals) if sign
        ]

    temp_list = sign_data
    sign_data = []

    if enterprise.name != '':
        empresa = enterprise.name
    else:
        empresa = "MELMAC"

    # Verificación para no enviar mas de un correo por email.
    for email in temp_list:
        if email not in sign_data:
            sign_data.append(email)

    subject = 'Notificación '+ empresa.upper() +' proceso documental '+name_form.upper()+' (AUTENTICADO)'
    text_content = 'Se hace entrega del documento diligenciado con su respectiva firma electronica a todos aquellos participes.'

    content = ( empresa.upper() +' notifica que se acaba de cumplir con éxito el proceso para el documento <b>' + name_form.upper() + '</b>, ' +
    'cumpliendo con las normativas vigentes de certificación digital y firma electrónica, que acredita la correcta autenticación del documento, por medio de mensajes de datos o evidencias digitales. <br><br>'+
    'Incluye: Firma digital, tiempo y estampa, firma electrónica y demás detalles verificables en el código QR incluido en el PDF probatorio.<br><br>'+
    'Gracias por su atención.')

    for to in sign_data:
        if consecutive:
            answer_id = consecutive.id
            consecutive_val = 1
        else:
            answer_id = answer_form
            consecutive_val = 0
        pixel = settings.URL + 'control/'+ str(answer_id) +'/'+ str(consecutive_val) +'/'+ to +'/'

        html_message = ('<div style="padding:20px; font-family: sans-serif; text-align:center;">' +
                '<div style="font-size:16px;">' +
                    content +
                '</div>' +
                '<img src="'+ pixel +'" width="0" height="0">' +
                '<div>' +
                    '<p style="font-size:10px"> Servicio prestado por melmac.co a '+empresa.upper()+'</p>' +
                '</div>' +
            '</div>'
        )
        try:
            msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
            msg.attach_alternative(html_message, "text/html")
            msg.attach_file(settings.MEDIA_ROOT + '/' + path_file if settings.MEDIA_ROOT not in path_file else path_file)
            msg.send()
        except Exception as err:
            print(err)

    log_content = {
        'user': None,
        'group': 61 if consecutive else 53,
        'element': consecutive if consecutive else answer_form,
        'action': 15,
        'description': "Se realiza el envio del PDF a todos los firmantes de la respuesta de documento #" + str(consecutive.id if consecutive else answer_form) + " " + name_form + ".",
    }
    create_traceability(log_content)

    if enterprise.name != '':
        empresa = enterprise.name
    else:
        empresa = "MELMAC"

    subject = 'Notificación '+ empresa.upper() +' proceso documental '+name_form.upper()+' (AUTENTICADO)'
    text_content = 'Se hace entrega del documento diligenciado con su respectiva firma electronica a todos aquellos participes.'

    content = ( empresa.upper() +' notifica que se acaba de cumplir con éxito el proceso documental <b>' + name_form.upper() + '</b>, ' +
    'cumpliendo con las normativas vigentes de certificación digital y firma electrónica, que acredita la correcta autenticación del documento, por medio de mensajes de datos o evidencias digitales. <br><br>'+
    'Incluye: Firma digital, tiempo y estampa, firma electrónica y demás detalles verificables en el código QR incluido en el PDF probatorio.<br><br>'+
    'Gracias por su atención.')

    html_message = ('<div style="padding:20px; font-family: sans-serif; text-align:center;">' +
            '<div style="font-size:16px;">' +
                content +
            '</div>' +
            '<div>' +
                '<p style="font-size:10px"> Servicio prestado por melmac.co a '+empresa.upper()+'</p>' +
            '</div>' +
        '</div>'
    )

    if id_Task != '' and email_subproject !='':
        try:
            msg = EmailMultiAlternatives(subject, text_content, from_email, list(email_subprojectA))
            msg.attach_alternative(html_message, "text/html")
            msg.attach_file(settings.MEDIA_ROOT + '/' + path_file if settings.MEDIA_ROOT not in path_file else path_file)
            msg.send()
        except Exception as err:
            print("::::::::::::::::::::::::::::Exception email task")
            print(err)

    try:
        msg = EmailMultiAlternatives(subject, text_content, from_email, list(admin_email))
        msg.attach_alternative(html_message, "text/html")
        msg.attach_file(settings.MEDIA_ROOT + '/' + path_file if settings.MEDIA_ROOT not in path_file else path_file)
        msg.send()
    except Exception as err:
        print("aqui")
        print(err)

def random_token(n):
    range_start = 10**(n-1)
    range_end = (10**n)-1
    return randint(range_start, range_end)

@api_view(['POST'])
def send_token_email(request):
    response = {}
    response['status'] = False
    data = request.data
    email= []
    email.append(data['email'])
    token = str(random_token(6))
    aux = 1
    while aux < 2:
        try:
            Sms_Token.objects.get(token=token, phone_user=data["token"])
            token = random_token(6)
        except Sms_Token.DoesNotExist:
            Sms_Token.objects.filter(state=0, phone_user="0").update(state=2)
            token_new = Sms_Token()
            token_new.token = token
            token_new.phone_user = data["token"]
            token_new.state = 0
            token_new.save()
            aux = 2

            if data["enterprise"] !='':
                idEnt=data["enterprise"]
            elif 'pathname' in data and data['pathname'] != '':
                tam = Form_Link.objects.filter(token_link=data['pathname']).count()
                if tam < 2:
                    form_link_val = Form_Link.objects.get(token_link=data['pathname'])
                    form_val = Form_Enterprise.objects.get(id=form_link_val.form_enterprise_id)
                    idEnt=form_val.enterprise_id
                else:
                    print("Se encuentra mas de una vez la URL de Form_Link")
                    pass

            enterprise = Enterprise.objects.get(id=idEnt, state=True)
            name_enterprise = enterprise.name if enterprise.name != '' else 'Melmac'
            img = settings.URL + 'media/' + str(enterprise.logo) if enterprise.logo != '' else 'https://melmac.co/assets/images/logo_melmac.png'
            if 'aproved' in data:
                link = data['link'] #link publico
                html_message = (str(token) +' es tu código de verificación Melmac. <br> Texto de aprobación <br> <a href=' +link+'><button style="border: none;color: white;padding: 15px 32px; text-align: center; text-decoration: none; display: inline-block; font-size: 16px; margin: 4px 2px; cursor: pointer; background-color: #6610f2; border-radius: 30px">Verificar</button> </a>')
            else:
                html_message = '<br><br><img style="width: 350px;" src="' + img + '"><br><br>'
                html_message += '<br><br><span style="font-size: 28px;font-weight: 900;">'+ str(token) +'</span><br><br>'
                html_message += ('Hola, este es tu código de verificación para confirmar tu correo. <br><br> Por favor no responder este mensaje, solo es informativo.')
            send_email('CODIGO DE VERIFICACIÓN DE '+ name_enterprise +' PARA CONFIRMAR CORREO ', '', email, html_message)
            if 'trace_token' in data and data['trace_token'] != '':
                trace_token = data['trace_token']
            else:
                now_time = datetime.now(tz=TZ_INFO).strftime("%d%m%Y%H%M%S")
                trace_token = Encrypt().encrypt_code('{}-{}'.format(data['email'], now_time))

            content = {
                    'user': None,
                    'group': 19,
                    'element': trace_token,
                    'action': 10,
                    'description': "Se realizó envió del código OTP al correo " + data['email'],
                }
            create_traceability(content)

            response['trace_token'] = trace_token
            response['status'] = True
            response['message'] = 'Código enviado!'
        except KeyError:
            response['message'] = 'Faltan parametros por enviar'
    return Response(response)
