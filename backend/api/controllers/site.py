# rest_framework
from django.contrib.auth.models import User
from api.controllers.api import check_usage_api_enterprise
from api.controllers.enterprise import create_user_enterprise
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
# authentication
from rest_framework.permissions import IsAuthenticated
# models
from api.models import (
    Answer_Form,
    Device_Info_Movil,
    Follow_User,
    Notification_User,
    Permit_Enterprise,
    Permit_Role,
    Profile,
    Profile_document,
    Profile_Enterprise,
    Profile_Image,
    Sign_Profile_Document,
    Sign_OTP_Document,
    Sms_Token,
    User_Enterprise,
    Variable_Plataform,
    Enterprise,
    Landing_Form,
    Ani_Lyn_Melmac
)
# others
from api.controllers.notification import Sms
from api.controllers.traceability import create_traceability
from api.encrypt import Encrypt
from api.util import send_whatsapp_msg_token,send_whatsapp_msg_token_v2
from api.ws_bridge import WS_Bridge
from datetime import datetime, timedelta
from django.db.models import Q
from django.conf import settings
from random import randint
from threading import Thread

import base64
import json
import os
import pytz
import requests
import re

TZ_INFO = pytz.timezone('America/Bogota')

@api_view(['POST'])
def login(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        if 'email' in data and data['email'] != '':
            email = data['email'].strip().lower()
            ent = int(data['ent']) if 'ent' in data else None
            try:
                # Valida si existe el usuario
                if ent:
                    user_enterprise_val = User_Enterprise.objects.get(email=email, enterprise_id=ent, state=True)
                else:
                    count_user = User_Enterprise.objects.filter(email=email, state=True).count()
                    if count_user > 1:
                        user_enterprise_val = User_Enterprise.objects.get(email=email, role_id=2, state=True)
                    else:
                        user_enterprise_val = User_Enterprise.objects.get(email=email, state=True)

                if not user_enterprise_val.register_state and not user_enterprise_val.register_admin and user_enterprise_val.role_id == 2:
                    response['message'] = 'El usuario no ha terminado el registro'
                    return Response(response)

                if user_enterprise_val.enterprise.state == True:
                    if user_enterprise_val.login_state == True:
                        validate = False
                        # Verifica la contraseña
                        if 'password' in data and data['password'] != '':
                            if Encrypt().verify(data['password'], user_enterprise_val.password):
                                validate = True
                        elif 'platform' in data and data['platform'] != '':
                            if data['platform'] == 2 and 'auth_token' in data and data['auth_token'] != '':
                                data_auth = verifyFacebookAuth(data['auth_token'])
                                if data_auth['data']['is_valid']:
                                    validate = True

                        if validate:
                            # Reinicia el contador a 0
                            user_enterprise_val.login_count = 0
                            # Consulta y genera el token
                            user = User.objects.get(id=user_enterprise_val.user_id)
                            user.last_login = datetime.now()
                            user.save()

                            try:
                                user.auth_token.delete()
                            except (AttributeError, Token.DoesNotExist):
                                pass

                            token, created = Token.objects.get_or_create(user=user)
                            user_enterprise_val.token = token.key
                            user_enterprise_val.save()

                            response['status'] = True

                            # Permisos
                            permission = []
                            permission = permission_list(user_enterprise_val)

                            variable_plataform_values = Variable_Plataform.objects.all().values(
                                'name',
                                'value',
                            )

                            change_password = False
                            if not user_enterprise_val.register_state:
                                change_password = True

                            response['data'] = {
                                'parameters' : {
                                    'token': token.key,
                                    'id': user_enterprise_val.id,
                                    'enterprise': user_enterprise_val.enterprise_id,
                                    'first_name': user_enterprise_val.first_name,
                                    'middle_name': user_enterprise_val.middle_name,
                                    'first_last_name': user_enterprise_val.first_last_name,
                                    'second_last_name': user_enterprise_val.second_last_name,
                                    'identification': user_enterprise_val.identification,
                                    'type_doc': user_enterprise_val.type_identification_id,
                                    'email': user_enterprise_val.email,
                                    'phone': user_enterprise_val.phone,
                                    'role': user_enterprise_val.role_id,
                                    'role_enterprise': user_enterprise_val.role_enterprise_id,
                                    'state': user_enterprise_val.state,
                                    'permission': permission,
                                    'image' : 'media/' + str(user_enterprise_val.image),
                                    'variable_plataform': list(variable_plataform_values),
                                    'theme': user_enterprise_val.enterprise.theme_id,
                                    'change_password': change_password,
                                }
                            }
                            content = {
                                'user': user_enterprise_val.id,
                                'group': 25,
                                'element': user_enterprise_val.id,
                                'action': 4,
                                'description': "El usuario denominado: " +  email + " ingreso a la plataforma con exito",
                            }
                            create_traceability(content)
                            data_ws = {
                                "action": "Login",
                                "message": "Ingreso a la plataforma con exito",
                                'source': 'back',
                                'data': token.key,
                            }
                            WS_Bridge().send_user(token.key, data_ws)
                        else:
                            # Suma 1 al contador
                            if (user_enterprise_val.login_count + 1) >= 3:
                                response['message'] = 'Tu cuenta ha diso bloqueada, por favor comunicate con soporte'
                                user_enterprise_val.login_state = False
                            else:
                                response['message'] = ('¡Ups! ingresaste mal un dato, te quedan ' +
                                    str(3 - (user_enterprise_val.login_count + 1)) +
                                    ' de 3 intentos para que tu cuenta sea bloqueada'
                                )
                            user_enterprise_val.login_count = user_enterprise_val.login_count + 1
                            user_enterprise_val.save()
                    else:
                        response['message'] = 'Su cuenta se encuentra bloqueada comunícate con el administrador'
                else:
                    response['message'] = 'No tienes acceso a la aplicación'
            except User_Enterprise.DoesNotExist:
                response['message'] = 'El usuario no existe'
            except User_Enterprise.MultipleObjectsReturned:
                response['message'] = 'Por favor, usa la página de logueo de la empresa con la que desees entrar'
        else:
            response['message'] = 'Datos incompletos'
    except Exception as error:
        response['message'] = 'Error con los datos ' + str(error)

    return Response(response)

def restartToken(objUserEnt):
    user = User.objects.get(id=objUserEnt.user_id)
    try:
        user.auth_token.delete()
    except (AttributeError, Token.DoesNotExist):
        pass
    token, created = Token.objects.get_or_create(user=user)
    objUserEnt.token = token.key
    objUserEnt.save()
    data_ws = {
                    "action": "Login",
                    "message": "Ingreso a la plataforma con exito",
                    'source': 'back',
                    'data': token.key,
                }
    WS_Bridge().send_user(token.key, data_ws)

    return user


def verifyFacebookAuth(input_token):
    try:
        url = 'https://graph.facebook.com/debug_token'
        access_token = "280968730607389|59545c706bdc7c71e0c23d62e33e183e"
        data = requests.get(
            url,
            params={
                "input_token": input_token,
                "access_token": access_token
        })
        return data.json()
    except:
        return False

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def login_validate(request):
    return Response({
        'status': True,
        'message': 'Loggeado',
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def logout(request):
    try:
        User_Enterprise.objects.filter(user=request.user, token=request.auth.key).update(token=None)
        request.user.auth_token.delete()
    except (AttributeError, Token.DoesNotExist):
        return Response({
        'status': False,
        'message': 'Ya estabas desconectado.',
        })
    return Response({
        'status': True,
        'message': 'Desconexión exitosa.',
    })

@api_view(['POST'])
def register(request):
    response = create_user(request.data)
    return Response(response)

@api_view(['POST'])
def signup(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        data = request.data
        # Datos
        theme_id = 1 # Light
        state = True

        if 'platform' in data and data['platform'] in [2,4]:
            platform = data['platform']
            identification = 0
            phone = 0
            data_auth = verifyFacebookAuth(data['auth_token'])
            if not data_auth['data']['is_valid']:
                response['message'] = 'Error en la validación de cuenta'
                return Response(response)
        else:
            platform = 0
            identification = str(data['identification']).strip()
            phone = str(data['phone']).strip()

        first_name = str(data['first_name']).strip()
        first_last_name = str(data['first_last_name']).strip()
        type_identification_id = 3 # CC
        email = str(data['email']).strip().lower()
        max_users = 5

        try:
            # Valida si existe el usuario
            user_val = User_Enterprise.objects.get(email=email, role_id=2)
            if user_val.register_state == True:
                response['message'] = 'El usuario ya existe como administrador de otra empresa.'
            else:
                user_val.first_name = data['first_name']
                user_val.first_last_name = data['first_last_name']
                user_val.identification = data['identification']
                user_val.phone = data['phone']
                user_val.save()
                response['status'] = True
        except User_Enterprise.DoesNotExist:
            data_create = {
                'theme_id' : theme_id,
                'state' : state,
                'max_users' : max_users,
                'first_name' : first_name,
                'first_last_name' : first_last_name,
                'type_identification_id' : type_identification_id,
                'identification' : identification,
                'email' : email,
                'phone' : phone,
            }
            enterprise_new, user_enterprise_new = create_user_enterprise(data_create)

            if 'platform' in data and data['platform'] in [2,4]:
                user_enterprise_new.register_state = True
            else:
                user_enterprise_new.register_state = False
            user_enterprise_new.register_admin = False
            user_enterprise_new.register_platform = platform
            user_enterprise_new.save()

            if user_enterprise_new.register_platform == 1:
                platform_string = "Movil"
            elif user_enterprise_new.register_platform == 2:
                platform_string = "Facebook"
            elif user_enterprise_new.register_platform == 3:
                platform_string = "Número teléfonico"
            elif user_enterprise_new.register_platform == 4:
                platform_string = "Google"
            else:
                platform_string = "Web"

            content = {
                'user': user_enterprise_new.id,
                'group': 25,
                'element': user_enterprise_new.id,
                'action': 1,
                'description': ("El usuario #" + str(user_enterprise_new.id) + " " + user_enterprise_new.first_name + " " +
                    user_enterprise_new.first_last_name + " acepto términos y condiciones para realizar el registro por medio de "
                    + platform_string),
            }
            create_traceability(content)
            if 'ip_address' in data:
                content = {
                    'user': user_enterprise_new.id,
                    'group': 25,
                    'element': user_enterprise_new.id,
                    'action': 1,
                    'description': ("El usuario #" + str(user_enterprise_new.id) + " " + user_enterprise_new.first_name + " " +
                        user_enterprise_new.first_last_name + " se registro desde la IP: "
                        +  data['ip_address']),
                }
                create_traceability(content)
            response['status'] = True
    except Exception as error:
        response['message'] = 'Algo salio mal, ' + str(error)

    return Response(response)

def create_user(data):
    response = {}
    response['status'] = False
    try:
        password = ''
        if 'password' in data:
            password = data['password']
        else:
            password = data['identification']
        email = data['email'].strip().lower()
        enterprise = data['enterprise_id']
        first_name = data['first_name'].strip()
        middle_name = data['middle_name'].strip() if data['middle_name'] != None else ''
        first_last_name = data['first_last_name'].strip()
        second_last_name = data['second_last_name'].strip() if data['second_last_name'] != None else ''
        type_identification = data['type_identification_id']
        identification = data['identification'].strip()
        phone = data['phone'].strip()
        password_enc = Encrypt().encrypt_code(password)

        try:
            description = "El usuario se habilito correctamente."
            # Valida si existe el usuario
            user_enterprise_val = User_Enterprise.objects.get(enterprise_id=enterprise, email=email)
            if(user_enterprise_val):
                try:
                    user_enterprise_val = User_Enterprise.objects.filter(email=email).update(state=True)
                    response['message'] = 'Cambio de estado exitoso!'
                    content = {
                        'user': user_enterprise_val.id,
                        'group': 25,
                        'element': user_enterprise_val.id,
                        'action': 2,
                        'description': description,
                    }
                    create_traceability(content)

                    response['status'] = True
                    response['message'] = 'Cambio de estado exitoso!'
                except:
                    response['message'] = 'Se cambio el estado de un usuario que ya existia'
            #response['message'] = 'El usuario existe mera'
        except User_Enterprise.DoesNotExist:
            if not check_usage_api_enterprise(-1, enterprise):
                raise Exception('esta empresa ya supero el limite de usuarios permitidos')
            # Create User Django
            try:
                user_new = User.objects.get(username=email)
            except User.DoesNotExist:
                user_new = User()
                user_new.username = email
                user_new.first_name = first_name
                user_new.last_name = first_last_name
                user_new.email = email
                user_new.save()

            # Create User Enterprise
            user_enterprise_new = User_Enterprise()
            user_enterprise_new.enterprise_id = enterprise
            user_enterprise_new.user = user_new
            user_enterprise_new.first_name = first_name
            user_enterprise_new.middle_name = middle_name
            user_enterprise_new.first_last_name = first_last_name
            user_enterprise_new.second_last_name = second_last_name
            user_enterprise_new.type_identification_id = type_identification
            user_enterprise_new.identification = identification
            user_enterprise_new.phone = phone
            user_enterprise_new.email = email
            user_enterprise_new.password = password_enc
            user_enterprise_new.role_id = 3
            user_enterprise_new.register_admin = False
            user_enterprise_new.register_state = False
            # Imagen
            image_path = ''
            if 'image' in data and data['image'] != '':
                image_path = save_image(str(data['image']), enterprise, 1, user_new.id)
            if 'platform' in data:
                user_enterprise_new.register_platform = data['platform']
            if 'role_enterprise_id' in data and data['role_enterprise_id'] != '':
                user_enterprise_new.role_enterprise_id  = data['role_enterprise_id']
            user_enterprise_new.save()
            # Plataforma
            if user_enterprise_new.register_platform == 1:
                platform_string = "Movil"
            elif user_enterprise_new.register_platform == 2:
                platform_string = "Facebook"
            elif user_enterprise_new.register_platform == 3:
                platform_string = "Número teléfonico"
            else:
                platform_string = "Web"
            content = {
                'user': user_enterprise_new.id,
                'group': 25,
                'element': user_enterprise_new.id,
                'action': 1,
                'description': "Se realiza registro del usuario: " + email + " con el identificador: " + str(user_enterprise_new.id) + " por medio de " + str(platform_string),
            }
            create_traceability(content)

            response['status'] = True

            response['data'] = {
                'parameters' : {
                    'id': user_enterprise_new.id,
                    'password' : password,
                    'email' : email,
                    'first_name' : first_name,
                    'middle_name' : middle_name,
                    'first_last_name' : first_last_name,
                    'second_last_name' : second_last_name,
                    'type_identification' : type_identification,
                    'identification' : identification,
                    'phone' : phone,
                    'role' : 3,
                    'image' : 'media/' + str(image_path),
                }
            }

        except User_Enterprise.MultipleObjectsReturned:
            response['message'] = 'El usuario existe'
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        response['message'] = 'Algo salio mal, ' + str(error)
    return response

@api_view(['POST'])
def recovery_pass(request):
    response = {}
    response['status'] = False
    try:
        data = request.data

        new_password = data['password']
        email = data['email'].strip().lower()
        ent = int(data['ent']) if 'ent' in data else None
        password_enc = Encrypt().encrypt_code(new_password)
        # print(password_enc)
        try:
            if data['temporal_pass'] != '':
                if 'option' in data and data['option'] == 'change_password':
                    # user_enterprise_val = User_Enterprise.objects.get(email=email)
                    description = "El usuario ha asignado correctamente su nueva contraseña."
                    # Valida si existe el usuario
                    if ent:
                        user_enterprise_val = User_Enterprise.objects.get(email=email, enterprise_id=ent, state=True)
                    else:
                        count_user = User_Enterprise.objects.filter(email=email, state=True).count()
                        if count_user > 1:
                            user_enterprise_val = User_Enterprise.objects.get(email=email, role_id=2, state=True)
                        else:
                            user_enterprise_val = User_Enterprise.objects.get(email=email, state=True)
                else:
                    # user_enterprise_val = User_Enterprise.objects.get(email=email, register_state=False)
                    description = "El usuario se ha registrado correctamente."
                    if ent:
                        user_enterprise_val = User_Enterprise.objects.get(email=email, enterprise_id=ent, register_state=False, state=True)
                    else:
                        count_user = User_Enterprise.objects.filter(email=email, state=True).count()
                        if count_user > 1:
                            user_enterprise_val = User_Enterprise.objects.get(email=email, role_id=2, register_state=False, state=True)
                        else:
                            user_enterprise_val = User_Enterprise.objects.get(email=email, register_state=False, state=True)

                if Encrypt().verify(data['temporal_pass'], user_enterprise_val.password):
                    User_Enterprise.objects.filter(email=email).update(register_state=True, password=password_enc)

                    content = {
                        'user': user_enterprise_val.id,
                        'group': 25,
                        'element': user_enterprise_val.id,
                        'action': 1,
                        'description': description,
                    }
                    create_traceability(content)

                    response['status'] = True
                    response['message'] = 'Cambio de contraseña exitoso!'
        except User_Enterprise.DoesNotExist:
            if 'temporal_pass' in data and data['temporal_pass'] != '':
                response['message'] = 'El usuario no existe o ya está registrado'
            else:
                response['message'] = 'El usuario no existe'
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada'
    return Response(response)

def random_token(n):
    range_start = 10**(n-1)
    range_end = (10**n)-1
    return randint(range_start, range_end)


@api_view(['POST'])
def send_token(request):
    response = {}
    response['status'] = False
    try:
        data = request.data

        if 'email' in data and data['email'] != '':
            email = data['email'].strip().lower()
            ent = int(data['ent']) if 'ent' in data else None
            # Valida si existe el usuario
            if ent:
                user_val = User_Enterprise.objects.get(email=email, enterprise_id=ent, state=True)
            else:
                count_user = User_Enterprise.objects.filter(email=email, state=True).count()
                if count_user > 1:
                    user_val = User_Enterprise.objects.get(email=email, role_id=2, state=True)
                else:
                    user_val = User_Enterprise.objects.get(email=email, state=True)

            # user_val = User_Enterprise.objects.get(email=email, state=True)
            if not user_val.login_state:
                raise Exception("Tu Usuario no tiene acceso a la plataforma.")
            if not user_val.enterprise.state:
                raise Exception("La Empresa se encuentra inactiva.")
            phone = str(user_val.phone)
        else:
            phone = data['phone']
        token = str(random_token(6))
        aux = 1
        while aux < 2:
            try:
                # Valida si existe el usuario
                token_sms_val = Sms_Token.objects.get(token=token, phone_user=phone)
                token = random_token(6)
            except Sms_Token.DoesNotExist:
                Sms_Token.objects.filter(state=0, phone_user=phone).update(state=2)
                token_new = Sms_Token()
                token_new.token = token
                token_new.phone_user = phone
                token_new.state = 0
                token_new.save()
                Sms.send(phone, token + " Es tu codigo de confirmacion de Melmac")
                if 'enterprise' in data and data['enterprise'] != '':
                    enterprise = Enterprise.objects.get(id=data['enterprise'], state=True)
                    #empresa = enterprise.name if enterprise.name != '' else 'Melmac'
                    empresa = 'MELMAC'
                    send_whatsapp_msg_token_v2(phone, token, empresa)
                else:
                    send_whatsapp_msg_token(phone, token)
                response['status'] = True
                response['message'] = 'Token enviado!'
                aux = 2
                # print('token')
                # print(token)

                if 'trace_token' in data and data['trace_token']:
                    content = {
                            'user': None,
                            'group': 19,
                            'element': data['trace_token'],
                            'action': 10,
                            'description': "Se realizó envió del código OTP al teléfono " + str(phone) + " por medio de WhatsApp y SMS.",
                        }
                    create_traceability(content)

    except User_Enterprise.DoesNotExist:
        response['message'] = 'El usuario no existe'
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada' + str(error)
    return Response(response)

@api_view(['POST'])
def get_phone(request):
    response = {}
    response['status'] = False
    try:
        data = request.data

        email = data['email'].strip().lower()
        try:
            # Valida si existe el usuario
            phone_val = User_Enterprise.objects.get(email=email)
            phone_user = phone_val.phone
            response['status'] = True
            response['message'] = str(phone_user)

        except User_Enterprise.DoesNotExist:
            response['message'] = 'Este correo electrónico no esta registrado en nuestra plataforma.'

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada ' + str(error)
    return Response(response)

@api_view(['POST'])
def validate_token(request):
    response = {}
    response['status'] = False
    try:
        data = request.data

        token = data['token']
        if 'email' in data and data['email'] != '':
            email = data['email'].strip().lower()
            # print(data['email'])
            ent = int(data['ent']) if 'ent' in data else None
            # Valida si existe el usuario
            if ent:
                user_val = User_Enterprise.objects.get(email=email, enterprise_id=ent, state=True)
            else:
                count_user = User_Enterprise.objects.filter(email=email, state=True).count()
                if count_user > 1:
                    user_val = User_Enterprise.objects.get(email=email, role_id=2, state=True)
                else:
                    user_val = User_Enterprise.objects.get(email=email, state=True)

            if not user_val.login_state:
                raise Exception("Tu Usuario no tiene acceso a la plataforma.")
            if not user_val.enterprise.state:
                raise Exception("La Empresa se encuentra inactiva.")
            phone = str(user_val.phone)
        else:
            phone = data['phone']
        try:
            # Valida si existe el token
            token_val = Sms_Token.objects.get(token=token, phone_user=phone)
            if(token_val.state == 0):
                Sms_Token.objects.filter(phone_user=phone, token=token).update(state=1)
                response['status'] = True
                response['message'] = 'Token valido!'
            elif(token_val.state == 1):
                response['status'] = True
                response['message'] = 'El token ya ha sido usado anteriormente!'
            elif(token_val.state == 2):
                response['status'] = True
                response['message'] = 'El token ya ha expirado!'
            else:
                response['status'] = True
                response['message'] = 'El token no esta asociado a este número de telefono'

            if 'trace_token' in data and data['trace_token']:
                if 'mail' in data and data['mail'] != '':
                    mail = data['mail'].strip().lower()
                    description = "Se realizó validación del código OTP: "+ token +" enviado al correo " + mail

                    # Registro único para la firma biometrica por respuesta campo.
                    hash_info = Encrypt().encrypt_code('{}-{}'.format(mail, phone))

                    profile_new = Sign_OTP_Document()
                    profile_new.email=mail
                    profile_new.hash_info=hash_info
                    profile_new.save()

                    token_url = Encrypt().encrypt_code('{}-{}'.format(profile_new.id, token))
                    profile_new.token_url=token_url
                    profile_new.save()

                    response['data'] = str(profile_new.id) + "-" + str(data['mail'])
                else:
                    description = "Se realizó validación del código OTP: " + token + " enviado al teléfono " + str(phone)

                    profile_new = Sign_OTP_Document()
                    profile_new.email=str(phone)
                    profile_new.save()

                    hash_info = Encrypt().encrypt_code('{}-{}'.format("Token hash" + str(profile_new.id), phone))
                    profile_new.hash_info=hash_info
                    profile_new.save()

                    token_url = Encrypt().encrypt_code('{}-{}'.format(profile_new.id, token))
                    profile_new.token_url=token_url
                    profile_new.save()

                    response['data'] = str(profile_new.id) + "-" + str(data['phone'])

                content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': description,
                    }
                create_traceability(content)
            else:
                if 'email' in data and data['email']:
                    user_id = user_val
                    group = 25
                    action = 1

                    token_pass = str(random_token(6))
                    password_enc = Encrypt().encrypt_code(token_pass)
                    user_val.password = password_enc
                    user_val.save()
                    response['temporal_pass'] = token_pass
                else:
                    user_id = User_Enterprise.objects.get(email="super@saroa.co")
                    group = 19
                    action = 11
                content = {
                    'user': user_id.id,
                    'group': group,
                    'element': user_id.id,
                    'action': action,
                    'description': "Se a validado el token " + token + " con la siguiente respuesta: " + response['message'] + " ,para el número " + str(phone)
                }
                create_traceability(content)

        except Sms_Token.DoesNotExist:
            response['message'] = 'Token no existe!'

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada ' + str(error)
    return Response(response)

@api_view(['POST'])
def verificate_user(request):
    response = {}
    response['status'] = False
    try:
        data = request.data

        phone = data['phone']
        email = data['email'].strip().lower()
        identification = data['identification']
        try:
            # Valida si existe el usuario
           user_enterprise_val = User_Enterprise.objects.get(Q(email=email) | Q(phone=phone) | Q(identification=identification))
           response['message'] = 'El usuario existe'
        except User_Enterprise.DoesNotExist:
            response['status'] = True
            response['message'] = 'El usuario no existe'
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada'
    return Response(response)

@api_view(['POST'])
def verificate_phone(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        phone = data['phone']
        try:
            # Valida si existe el usuario
           user_enterprise_val = User_Enterprise.objects.get(phone=phone)
           email = user_enterprise_val.email
           response['status'] = True
           response['data'] = {
                'parameters' : {
                    'email' : email,
                }
            }
        except User_Enterprise.DoesNotExist:
            response['message'] = 'El usuario no existe'
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada'
    return Response(response)

@api_view(['POST'])
def get_idCard(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        idCard = data['idCard']
        id_user = data['id_user']
        data_split = idCard.split('@')
        str_match = [s for s in data_split if s.__contains__("0M") or s.__contains__("0F") or s.__contains__("1F") or s.__contains__("1M")]
        idx1 = data_split.index(str_match[0])
        person_data = []
        person_data2 = []
        data_count = 0
        for idx, val in enumerate(data_split):
            if idx <= idx1:
               if val != "":
                person_data.append(val)
        str_match = [s for s in person_data if s.__contains__("0M") or s.__contains__("0F") or s.__contains__("1F") or s.__contains__("1M")]
        idx1 = person_data.index(str_match[0])
        for idx, val in enumerate(reversed(person_data)):
            if( data_count == 0):
                if idx > 0:
                    print(val)
                    print(any(chr.isdigit() for chr in val))
                    if any(chr.isdigit() for chr in val) == False:
                        person_data2.append(val)
                    else:
                        person_data2.append(val)
                        data_count +=1

        print(person_data)
        print(person_data[idx1])
        print(person_data2)
        size = len(person_data2)
        name = get_name_complete(reversed(person_data2))
        print(name)
        order = order_document(person_data2[size-1])

        group = int(str(19) + str(id_user))

        content = {
                'user': id_user,
                'group': group,
                'element': id_user,
                'action': 9,
                'description': "El usuario denominado: " + str(id_user) +  " genero la captura de PDF417 de la persona identificada con el número " + str(int(order[0])),
            }
        create_traceability(content)

        try:
           response['status'] = True
           response['data'] = {
                'parameters' : {
                    'document' : int(order[0]),
                    'name' : name,
                    'lastname' : order[1],
                    'other' : person_data[idx1],
                }
            }
        except User_Enterprise.DoesNotExist:
            response['message'] = 'El documento no funciona'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada'
    return Response(response)

def order_document(person_data):
    lastname = re.sub(r'[0-9]+', '', person_data)
    document = re.sub(r'[A-Za-z]+', '', person_data)
    document_array_rev = []
    document_array = []
    for idx, number in enumerate(reversed(document)):
        if idx <= 9:
            document_array_rev.append(number)
    for number in reversed(document_array_rev):
        document_array.append(number)

    document_person = "".join(document_array)
    return document_person, lastname

def get_name_complete (person_data):
    person_name = []
    for idx, val in enumerate(person_data):
            if idx > 0 :
                person_name.append(str(val))
    return(" ".join(person_name))

@api_view(['POST'])
def update_profile(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        print(data)
        id_user = data['id_user']
        id_enterprise = data['id_enterprise']
        fname = data['fname']
        sname = data['sname']
        lfname = data['lfname']
        lsname = data['lsname']
        image = data['image'] if 'image' in data else "0"

        try:
            # Valida si existe el usuario
            user_enterprise_val = User_Enterprise.objects.get(id=id_user)
            if(image != "0"):
                image_path= save_image(str(image), id_enterprise, 1, id_user)
            else:
                image_path = user_enterprise_val.image
            User_Enterprise.objects.filter(id=id_user).update(first_name = fname, middle_name = sname, first_last_name = lfname, second_last_name = lsname, image = image_path)
            response['status'] = True
            response['data'] = {
                'parameters' : {
                    'fname' : fname,
                    'sname' : sname,
                    'flname' : lfname,
                    'slname' : lsname,
                    'image' : "media/" + str(image_path),
                }
            }
            content = {
                'user': user_enterprise_val.id,
                'group': 25,
                'element': user_enterprise_val.id,
                'action': 2,
                'description': "El usuario denominado: " + user_enterprise_val.email + " realizo la actualización de sus datos correctamente.",
            }
            create_traceability(content)

        except User_Enterprise.DoesNotExist:
            response['message'] = 'El usuario no existe'
    except KeyError as error:
        print(error)
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada ' + error
    return Response(response)

def save_image(bArray, id_enterprise, folder, id_user=None, id_profile=None, ext = 1):
    if ext == 1:
        name_file = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + 'jpeg'
    else:
        name_file = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + 'png'
    if(folder == 1):
        folder = id_enterprise + '/' + (id_user + '/' if id_user is not None else '')
    else:
        folder = id_enterprise + '/' + (id_user + '/' if id_user is not None else '') + 'enrolment' + '/' +  (str(id_profile) + '/' if id_profile is not None else '')
    path = settings.MEDIA_ROOT + '/' + folder

    if not os.path.exists(path):
        os.makedirs(path)
    path += name_file

    with open(path, 'wb+') as destination:
        if ext ==1:
            destination.write(base64.decodebytes(bytearray(bArray.replace('data:image/jpeg;base64,','').encode())))
        else:
            destination.write(base64.decodebytes(bytearray(bArray.replace('data:image/png;base64,','').encode())))
        print(folder + name_file)
    return folder + name_file


@api_view(['POST'])
def enrolment_user(request):
    response = {}
    response['status'] = False
    register_state = False
    try:
        data = request.data
        name = data['name']
        identification = data['identification']
        enterprise_id = data['enterprise_id']
        restrictive_lists = data['restrictive_lists'] if 'restrictive_lists' in data else ''
        user_id = data['user_id'] if 'user_id' in data else None
        image_erolment= data['image_enrolment'] #video
        image_document= data['image_document'] #Documento CC frontal
        image_back= data['image_back'] #Documento CC posterior
        ipAddress = data['ip_address'] if 'ip_address' in data else None
        email = data['email']
        phone = data['phone']
        token = data['token'] #token tipo 2
        try:
            # Valida si existe el usuario
            profile_new = Profile.objects.filter(identification = identification).order_by('modify_date').last()
            if not profile_new:
                raise Profile.DoesNotExist()

            profile_enterprise = Profile_Enterprise.objects.get(
                enterprise_id=enterprise_id,
                profile=profile_new,
                state=True,
            )
            register_state = True
        except Profile.DoesNotExist:
            profile_new = Profile()
            profile_new.name = name
            profile_new.identification = identification
            # profile_new.enterprise_id= enterprise_id
            profile_new.lookout_count = 1
            profile_new.state = 1
            profile_new.type_identification_id = 3
            profile_new.restrictive_lists = restrictive_lists
            # profile_new.user_id = user_id
            profile_new.token_autorization = token
            # Información para envio
            profile_new.email= email
            profile_new.phone= phone
            profile_new.save()

            profile_enterprise = Profile_Enterprise()
            profile_enterprise.enterprise_id = enterprise_id
            profile_enterprise.profile = profile_new
            profile_enterprise.user_id = user_id
            profile_enterprise.save()

            image_erolment_path = save_image(str(image_erolment), str(enterprise_id), 2, str(user_id), profile_new.id)
            image_document_path = save_image(str(image_document), str(enterprise_id), 2, str(user_id), profile_new.id)
            image_document_path_post = save_image(str(image_back), str(enterprise_id), 2, str(user_id), profile_new.id)

            for image_path in [image_erolment_path, image_document_path,image_document_path_post]:
                profile_image_new = Profile_Image()
                profile_image_new.profile_id = profile_new.id
                profile_image_new.image = image_path
                profile_image_new.save()

            # Registro único para la firma biometrica por respuesta campo.
            hash_info = Encrypt().encrypt_code('{}-{}-{}'.format(profile_new.id, enterprise_id, identification))
            token_url = Encrypt().encrypt_code('{}-{}'.format(profile_new.id, token))
            spd_val = Sign_Profile_Document()
            spd_val.hash_info = hash_info
            spd_val.profile_id = profile_new.id
            spd_val.token_url = token_url
            spd_val.save()

            register_state = True

        except Profile_Enterprise.DoesNotExist:
            profile_enterprise = Profile_Enterprise()
            profile_enterprise.enterprise_id = enterprise_id
            profile_enterprise.profile = profile_new
            profile_enterprise.user_id = user_id
            profile_enterprise.save()
            register_state = True
        finally:
            if register_state:
                user = User_Enterprise.objects.get(id=user_id) if user_id else None
                profile_new.modify_date = datetime.now(tz=TZ_INFO)
                profile_new.save()
                if 'trace_token' in data and data['trace_token']:
                    content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario denominado: " + ('{} {}({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " realizó el proceso de firma con cédula desde la Direccion IP: " + str(ipAddress)
                        )
                    }
                    create_traceability(content)
                    content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " finalizo el proceso de enrolamiento y registro al usuario " + str(profile_new.id) + " con éxito"
                        )
                    }
                    create_traceability(content)
                else:
                    content = {
                        'user': None,
                        'group': 19,
                        'element': data['trace_token'],
                        'action': 10,
                        'description': ("El usuario " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                            " realizó el proceso de firma con cédula desde la Direccion IP: " + str(ipAddress)
                        )
                    }
                    create_traceability(content)
                    content = {
                        'user': user_id,
                        'group': 19,
                        'element': profile_new.id,
                        'action': 8,
                        'description': "El usuario denominado: " + str(user_id) + " finalizo el proceso de enrolamiento y registro al usuario " + str(profile_new.id) + " con éxito",
                    }
                    create_traceability(content)
                response['status'] = True
                response['message'] = 'Enrolado con exito'
                response['data'] = spd_val.id

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada' + str(error)
    return Response(response)


@api_view(['POST'])
def enrolment_user_validate(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        identification = data['identification']
        enterprise_id = data['enterprise_id']
        user_id = data['user_id'] if 'user_id' in data else None

        if 'signatureType' in data and data['signatureType'] != '':
            try:
                # Valida si existe el usuario
                profile_val = Profile_document.objects.get(identification = identification, enterprise_id = enterprise_id)
                response['message'] = 'El usuario existe enrolado en la plataforma'
            except Profile_document.DoesNotExist:
                response['message'] = 'El usuario no esta enrolado en la plataforma'
                response['status'] = True
        else:
            try:
                # Valida si existe el usuario en Biometria
                try:
                    profile_enterprise = Profile_Enterprise.objects.get(
                        enterprise_id=enterprise_id,
                        profile__identification=identification,
                        state=True,
                    )
                except Profile_Enterprise.DoesNotExist:
                    profile_new = Profile.objects.filter(identification = identification).order_by('modify_date').last()
                    if not profile_new:
                        raise Profile.DoesNotExist()

                    profile_enterprise = Profile_Enterprise()
                    profile_enterprise.enterprise_id = enterprise_id
                    profile_enterprise.profile = profile_new
                    profile_enterprise.user_id = user_id
                    profile_enterprise.save()
                response['message'] = 'El usuario existe en la empresa'
                now_time = datetime.now(tz=TZ_INFO).strftime("%d%m%Y%H%M%S")
                trace_token = Encrypt().encrypt_code('{}-{}'.format(identification, now_time))
                response['trace_token'] = trace_token
            except Profile.DoesNotExist:
                response['message'] = 'El usuario no esta enrolado en la plataforma ni empresa'
                response['status'] = True
                # print("no existe")
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        # print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada' + str(error)
    return Response(response)

@api_view(['POST'])
def enrolment_user_document(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        name = data['name']
        identification = data['identification']
        enterprise_id = data['enterprise_id']
        restrictive_lists = data['restrictive_lists'] if 'restrictive_lists' in data else ''
        user_id = data['user_id'] if 'user_id' in data else None
        ipAddress = data['ip_address'] if 'ip_address' in data else None
        email = data['email']
        phone = data['phone']
        token = data['token']

        profile_new = Profile_document()
        profile_new.name = name
        profile_new.identification = identification
        profile_new.enterprise_id= enterprise_id
        profile_new.email= email
        profile_new.phone= phone
        profile_new.lookout_count = 1
        profile_new.state = 1
        profile_new.type_identification_id = 3
        profile_new.user_id = user_id
        profile_new.token_autorization = token
        profile_new.save()
        hash_info = Encrypt().encrypt_code('{}-{}-{}'.format(profile_new.id, enterprise_id, identification))
        token_url = Encrypt().encrypt_code('{}-{}'.format(profile_new.id, token))
        profile_new.token_url = str(token_url)
        profile_new.hash_info = str(hash_info)
        profile_new.save()
        user = User_Enterprise.objects.get(id=user_id) if user_id else None

        if 'trace_token' in data and data['trace_token']:
            content = {
                'user': None,
                'group': 19,
                'element': data['trace_token'],
                'action': 10,
                'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                    " realizó el proceso de firma con cédula desde la Direccion IP: " + str(ipAddress)
                )
            }
            create_traceability(content)
            content = {
                'user': None,
                'group': 19,
                'element': data['trace_token'],
                'action': 10,
                'description': ("El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                    " finalizo el proceso de firma con cédula con éxito"
                )
            }
            create_traceability(content)

        response['status'] = True
        response['message'] = 'Firmante registrado'
        response['data'] = profile_new.id
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada' + str(error)
    return Response(response)

@api_view(['POST'])
def verification_follow_user(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        id = data['user_id']
        now = datetime.now(tz=TZ_INFO)
        two_hours_ago = now - timedelta(hours=2)
        try:
            # Valida si dos horas antes a la hora actual existe algun registro
            user_val = Follow_User.objects.filter(user_id = id).order_by("-id").values('creation_date')[:1]
            date_user = user_val[0]['creation_date']
            date_user = date_user.astimezone(TZ_INFO)
            if(two_hours_ago > date_user):
               response['status'] = True
               response['message'] ="Enviar"
            else:
               response['message'] = "No Enviar"
        except User_Enterprise.DoesNotExist:
            response['message'] = 'Este usuario no esta registrado en nuestra plataforma.'

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada ' + str(error)
    return Response(response)

@api_view(['POST'])
def device_info_user(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        id_user = data['id_user']
        product_user = data['product_user']
        model_user = data['model_user']
        brand_user = data['brand_user']
        serial_user = data['serial_user']
        version_user = data['version_user']
        battery_user = data['battery_user']
        gps_user = data['gps_user']
        last_conection_user = data['last_conection_user']
        version_app_user = data['version_app_user']
        if 'permission_location_user' in data:
            permission_location_user = data['permission_location_user']
        else:
            permission_location_user = 0

        if(gps_user == "true"):
            gps_user = True
        elif (gps_user == "false"):
            gps_user = False
        try:
            # Valida si el usuario existe
            user_val = Device_Info_Movil.objects.get(user_id= id_user)
            Device_Info_Movil.objects.filter(user_id = id_user).update(product = product_user, model = model_user, brand = brand_user, serial = serial_user, version = version_user, battery = battery_user, gps = gps_user, version_app = version_app_user, permission_location = permission_location_user)
            response['status'] = True
            response['data'] = {
                'Datos actualizados' : {
                    'id_user' : id_user,
                    'product_user' : product_user,
                    'model_user' : model_user,
                    'brand_user' : brand_user,
                    'serial_user' : serial_user,
                    'version_user' : version_user,
                    'battery_user' : battery_user,
                    'gps_user' : gps_user,
                    'last_conection_user' : last_conection_user,
                    'version_app_user' : version_app_user,
                    'permission_location_user' : permission_location_user
                }
            }
        except Device_Info_Movil.DoesNotExist:
            device_info_user_new = Device_Info_Movil()
            device_info_user_new.product = product_user
            device_info_user_new.model = model_user
            device_info_user_new.brand = brand_user
            device_info_user_new.serial = serial_user
            device_info_user_new.version = version_user
            device_info_user_new.battery = battery_user
            device_info_user_new.gps = gps_user
            device_info_user_new.user_id = id_user
            device_info_user_new.last_conection = last_conection_user
            device_info_user_new.version_app = version_app_user
            device_info_user_new.permission_location = permission_location_user
            device_info_user_new.save()

            response['status'] = True
            response['data'] = {
                'Datos insertados' : {
                    'id_user' : id_user,
                    'product_user' : product_user,
                    'model_user' : model_user,
                    'brand_user' : brand_user,
                    'serial_user' : serial_user,
                    'version_user' : version_user,
                    'battery_user' : battery_user,
                    'gps_user' : gps_user,
                    'last_conection_user' : last_conection_user,
                    'version_app_user' : version_app_user,
                    'permission_location_user' : permission_location_user
                }
            }

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada ' + str(error)
    return Response(response)

@api_view(['POST'])
def update_gps_battery(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        id_user = data['id_user']
        battery_user = data['battery_user']
        gps_user = data['gps_user']
        last_conection_user = data['last_conection_user']
        version_app_user = data['version_app_user']
        if(gps_user == "true"):
            gps_user = True
        elif (gps_user == "false"):
            gps_user = False
        try:
            # Valida si el usuario existe
            user_val = Device_Info_Movil.objects.get(user_id= id_user)
            Device_Info_Movil.objects.filter(user_id = id_user).update(battery = battery_user, gps = gps_user, version_app = version_app_user, last_conection = last_conection_user)
            response['status'] = True
            response['data'] = {
                'Datos actualizados' : {
                    'id_user' : id_user,
                    'battery_user' : battery_user,
                    'gps_user' : gps_user,
                    'last_conection' : last_conection_user,
                    'version_app_user' : version_app_user
                }
            }
        except Device_Info_Movil.DoesNotExist:
            response['message'] = 'El usuario no cuenta con datos del dispositivo registrados en la plataforma'
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        print(error)
        response['message'] = 'Algo salio mal, verifica la información enviada ' + str(error)
    return Response(response)

@api_view(['POST'])
def get_token_auth_ANI(request):
    response = {}
    response['status'] = False
    try:
        data = request.data
        user_id = data['user_id'] if 'user_id' in data else None
        user = User_Enterprise.objects.get(id=user_id) if user_id else None

        if 'identification' in data and data['identification'] != '' and 'trace_token' in data and data['trace_token'] and 'exp_date' in data and data['exp_date'] != '':
            identification = str(data['identification'])
            fech_exp = data['exp_date']
            try:
                url = 'https://ani.gse.com.co/v1/auth/login'
                email = 'luzstella@saroa.co'
                password = '6f4?Baa=*de<8B2C'
                data_auth = {
                    "email": email,
                    "password": password
                }
                headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
                data_auth = requests.post(url, data=json.dumps(data_auth), headers=headers)
                response_auth = data_auth.json()
                if response_auth['statusCode'] == 200 and response_auth['statusMessage'] == 'OK':
                    token_auth = response_auth['result']['token']
                    response_document = get_document_info_ANI(token_auth, identification)
                    if type(response_document) is str:
                        response_document = json.loads(response_document.replace("\'","\""))
                    # print(response_document)
                    if response_document != False:
                        if response_document['statusCode'] == 200 and response_document['statusMessage'] == 'OK':
                            pName = response_document['result'][0]['primerNombre']
                            sName = response_document['result'][0]['segundoNombre']
                            pLastname = response_document['result'][0]['primerApellido']
                            sLastname = response_document['result'][0]['segundoApellido']
                            pExpDate = response_document['result'][0]['fechaExpedicion'].replace('/','-')
                            fdefuncion = 'Vivo' if response_document['result'][0]['fechaDefuncion'] == '' else 'Fallecido'

                            try:
                                Ani_Lyn_Melmac.objects.get(identification=identification)
                            except Ani_Lyn_Melmac.DoesNotExist:
                                ani_lynn = Ani_Lyn_Melmac()
                                ani_lynn.first_name = pName
                                ani_lynn.middle_name = sName
                                ani_lynn.first_last_name = pLastname
                                ani_lynn.second_last_name = sLastname
                                ani_lynn.type_identification_id = 1
                                ani_lynn.identification = identification
                                ani_lynn.expedition_date = pExpDate
                                ani_lynn.data_form = response_document
                                ani_lynn.live = fdefuncion
                                ani_lynn.save()

                            if response_document['result'][0]['fechaDefuncion'] == '':
                                response['data'] = {
                                    'name': pName + " " + sName + " " + pLastname + " " + sLastname,
                                    'alive': "True"
                                }
                            else:
                                response['data'] = {
                                    'name': pName + " " + sName + " " + pLastname + " " + sLastname,
                                    'alive': "False"
                                }

                            content = {
                                'user': user_id,
                                'group': 19,
                                'element': data['trace_token'],
                                'action': 10,
                                'description': "El usuario denominado: " + ('{} {} ({}) '.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                                " realizo la confirmación exitosa del documento " + str(identification) + " por medio de ANI (Archivo Nacional de Identificación) y Registraduría Nacional del Estado Civil.",
                            }
                            create_traceability(content)

                            if fech_exp == pExpDate:
                                response['status'] = True

                                content = {
                                    'user': user_id,
                                    'group': 19,
                                    'element': data['trace_token'],
                                    'action': 10,
                                    'description': "El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                                    " realizo la comparación exitosa de la fecha de expedicion del documento " + str(identification) +
                                    " obtenida por OCR (Optical Character Recognition) con la obtenida por medio de ANI (Archivo Nacional de Identificación) y Registraduría Nacional del Estado Civil.",
                                }
                            else:
                                content = {
                                    'user': user_id,
                                    'group': 19,
                                    'element': data['trace_token'],
                                    'action': 10,
                                    'description': "El usuario denominado: " + ('{} {} ({})'.format(user.first_name.capitalize(), user.first_last_name.capitalize(), user.email) if user else 'Usuario Publico') +
                                    " realizo la comparación fallida de la fecha de expedicion del documento " + str(identification) +
                                    " obtenida por OCR (Optical Character Recognition) con la obtenida por medio de ANI (Archivo Nacional de Identificación) y Registraduría Nacional del Estado Civil.",
                                }
                            create_traceability(content)
            except Exception as err:
                print('err: get_token_auth_ANI: ')
                print(err)
                response['message'] = 'Algo salio mal, verifica la información enviada.'
    except Exception as err:
        print(err)
    return Response(response)

def get_login_ani():
    try:
        url = 'https://ani.gse.com.co/v1/auth/login'
        email = 'luzstella@saroa.co'
        password = '6f4?Baa=*de<8B2C'
        data_auth = {
            "email": email,
            "password": password
        }
        headers = {'Content-type': 'application/json', 'Accept': 'text/plain'}
        data_auth = requests.post(url, data=json.dumps(data_auth), headers=headers)
        response_auth = data_auth.json()
        if response_auth['statusCode'] == 200 and response_auth['statusMessage'] == 'OK':
            token_auth = response_auth['result']['token']

        return token_auth
    except Exception as err:
        print(err)
        return 'token_auth'

def get_ani_external(document, user_id, answer_id):
    data = data_ANI(document)
    if data['state'] == "False":
        Thread(target=notify_no_data, args=(user_id, answer_id, document)).start()
    return data

def data_ANI(document):
    try:
        token = get_login_ani()
        response_document = get_document_info_ANI(token, str(document))
        if type(response_document) is str:
            response_document = json.loads(response_document.replace("\'","\""))
        pName = response_document['result'][0]['primerNombre']
        sName = response_document['result'][0]['segundoNombre']
        pLastname = response_document['result'][0]['primerApellido']
        sLastname = response_document['result'][0]['segundoApellido']
        fexpedicion = response_document['result'][0]['fechaExpedicion']
        fdefuncion = 'Vivo' if response_document['result'][0]['fechaDefuncion'] == '' else 'Fallecido'
        data = {
            'pName' : pName,
            'sName' : sName,
            'pLastname' : pLastname,
            'sLastname' : sLastname,
            'fexpedicion' : fexpedicion,
            'fdefuncion' :  fdefuncion,
            'document': document,
            'state' :  "True",
        }

        try:
            Ani_Lyn_Melmac.objects.get(identification = document)
        except Ani_Lyn_Melmac.DoesNotExist:
            ani_lynn = Ani_Lyn_Melmac()
            ani_lynn.first_name = pName
            ani_lynn.middle_name = sName
            ani_lynn.first_last_name = pLastname
            ani_lynn.second_last_name = sLastname
            ani_lynn.type_identification_id = 1
            ani_lynn.identification = document
            ani_lynn.expedition_date = fexpedicion
            ani_lynn.live = fdefuncion
            ani_lynn.data_form = response_document
            ani_lynn.save()

    except Exception as err:
        data = {
            'pName' : '',
            'sName' : '',
            'pLastname' : '',
            'sLastname' : '',
            'fexpedicion' : '',
            'fdefuncion' :  '',
            'document': '',
            'state' :  "False",
        }
    return data

def get_document_info_ANI(token, document):
    try:
        try:
            print("No consume")
            dateAni = Ani_Lyn_Melmac.objects.get(identification=document)
            return dateAni.data_form
        except Ani_Lyn_Melmac.DoesNotExist:
            print("Consume")
            url = 'https://ani.gse.com.co/v1/ani/' + document
            headers = {"Authorization": "Token " + token}
            data = requests.get(
                url,
                headers=headers
            )
            return data.json()
    except:
        return False


def get_nit_info(nit, user_id, answer_id):
    try:
        token = 'HDzlULMJhEmrqGk66WudbKz38'
        url = 'http://www.datos.gov.co/resource/c82u-588k.csv?$$app_token=' + token +\
              '&$select=razon_social,' +\
              'clase_identificacion_rl, num_identificacion_representante_legal, representante_legal, numero_identificacion, ' +\
              'digito_verificacion, matricula,codigo_camara, ultimo_ano_renovado, fecha_cancelacion, organizacion_juridica, ' +\
              'estado_matricula, fecha_actualizacion' +\
              '&nit=' + nit
        data = requests.get(url)
        data = data.content.decode().split("\n")
        data_value = data[1].split(',')
        data_headers = data[0].split(',')

        data=[]
        #Limpieza de Datos y creacion de estructura
        for i in range(len(data_headers)):
            item = {}
            item[data_headers[i].replace('"', '')] = ((data_value[i]).replace('"', '') if len(data_value[i]) != 0 else "")
            data.append(item)
        data = json.loads(json.dumps(data))
        return data
    except Exception as err:
        data = '[{"razon_social": ""}, {"clase_identificacion_rl": ""},'+\
                    '{"num_identificacion_representante_legal": ""},'+\
                    '{"representante_legal": ""},'+\
                    '{"numero_identificacion": "'+ nit +'"}, {"digito_verificacion": ""}, '+\
                    '{"matricula": ""}, {"codigo_camara": ""}, {"ultimo_ano_renovado": ""},'+\
                    '{"fecha_cancelacion": ""}, {"organizacion_juridica": ""},'+\
                    '{"estado_matricula": ""},'+\
                    '{"fecha_actualizacion": ""}]'
        data = json.loads(json.dumps(data))
        Thread( target=notify_no_data, args=(user_id, answer_id, nit, True)).start()
        return data

def notify_no_data(user_id, answer_id, document, nit=False):
    enterprise_id = None
    val_user = user_id
    if not user_id:
        try:
            answer_val =  Answer_Form.objects.get(id=answer_id)
            enterprise_id =  answer_val.form_enterprise.enterprise_id
            val_user =  User_Enterprise.objects.filter(enterprise_id=enterprise_id, role_id=2).order_by('id').first()
            if not val_user:
                raise User_Enterprise.DoesNotExist()
            else:
                user_id = val_user.id
        except (Answer_Form.DoesNotExist, User_Enterprise.DoesNotExist) as e:
            pass
    else:
        val_user =  User_Enterprise.objects.get(id=user_id)

    if val_user and answer_id:
        notification_val =  Notification_User()
        notification_val.title = 'Problema en consulta'
        notification_val.description =  'No se obtuvo resultados del {} {}'.format('nit' if nit else 'documento' ,document)
        notification_val.type = 2
        notification_val.status = 0
        notification_val.user = val_user
        notification_val.extra = json.dumps({'answer_id': answer_id})
        notification_val.save()

        try:
            token =  Token.objects.get(user=val_user.user)
            message = {
                "action": "Notify",
                "message": "No hay data del Documento",
                'source': 'back',
                'data': {
                    'title': notification_val.title,
                    'description': notification_val.description,
                    'type': notification_val.type,
                    'id': notification_val.id,
                    'status': 0,
                    'extra': notification_val.extra,
                },
            }
            WS_Bridge().send_user(token.key, message)
        except:
            pass

def permission_list(value):

    user_enterprise_val = value
    # Permisos
    permission = []
    if user_enterprise_val.role_id == 1:
        permission = Permit_Enterprise.objects.filter(enterprise_id=user_enterprise_val.enterprise_id).values_list('permit_type_id', flat=True)
    elif user_enterprise_val.role_id == 2:
        permission = Permit_Enterprise.objects.filter(enterprise_id=user_enterprise_val.enterprise_id, status=True).values_list('permit_type_id', flat=True)
    else:
        permission = Permit_Role.objects.filter(role_enterprise_id=user_enterprise_val.role_enterprise_id, state=True, permit__status=True).values_list('permit__permit_type_id', flat=True)

    return permission

@api_view(['POST'])
def api_permission_list(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        if 'idUserEnterprise' in data and data['idUserEnterprise'] != '':
            id=data['idUserEnterprise']
            user_enterprise_val = User_Enterprise.objects.get(id=id, state=True)

            # Permisos
            permission = []
            permission = permission_list(user_enterprise_val)

            response['data'] = {
                'permission': permission,
            }
            response['message'] = 'Se lista los permisos del usuario con exito!'
            response['status'] = True
        else:
            response['message'] = 'Faltan parametros para completar la operación'

    except Exception as error:
        response['message'] = 'Error con los datos ' + str(error)
    return Response(response)

@api_view(['GET'])
def api_data_ANI(request, document):
    response = {}
    response['status'] = False
    try:
        data = data_ANI(document)
        response['status'] = True
        response['data'] = data
    except Exception as error:
        response['message'] = 'Error con los datos ' + str(error)
    return Response(response)

@api_view(['POST'])
def create_user_landing(request):
    response = {"status": False}
    try:
        data = request.data

        name = str(data['name']).strip()
        last_name = str(data['last_name']).strip()
        corporate = str(data['corporate']).strip()
        email = str(data['email']).strip().lower()
        phone = str(data['phone']).strip()
        city = str(data['city']).strip()
        ip_address = str(data['ip_address']).strip()
        terms = data['terms']
        newslet = data['newslet']
        try:
            # Create User Landing Form
            user_landing = Landing_Form()
            user_landing.name = name
            user_landing.last_name = last_name
            user_landing.corporate = corporate
            user_landing.email = email
            user_landing.phone = phone
            user_landing.city = city
            user_landing.ip_address = ip_address
            user_landing.terms = terms
            user_landing.newslet = newslet
            user_landing.save()
            response['status'] = True

            content = {
                'user': user_landing.id,
                'group': 25,
                'element': user_landing.id,
                'action': 1,
                'description': "Se realiza registro del usuario: " + name + " en el formulario del landing: ",
            }
            create_traceability(content)

            response['data'] = {
                'parameters' : {
                    'id': user_landing.id,
                    'name' : name,
                    'last_name' : last_name,
                    'corporate' : corporate,
                    'email' : email,
                    'phone' : phone,
                    'city' : city,
                    'ip_address' : ip_address,
                    'terms' : terms,
                    'newslet' : newslet,
                }
            }
        except Exception as error:
            print(error)
            response['message'] = 'Algo salio mal, ' + str(error)
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    except Exception as error:
        response['message'] = 'Algo salio mal, ' + str(error)

    return Response(response)