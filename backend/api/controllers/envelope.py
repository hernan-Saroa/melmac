from api.models import (
    Answer_Envelope,
    Answer_Envelope_Extend,
    Answer_Envelope_Approve,
    Answer_Envelope_Checker,
    Answer_Envelope_User,
    Answer_Envelope_Field,
    Answer_Envelope_Verified,
    Env_Digital_Element,
    Envelope_Enterprise,
    Envelope_Version,
    Envelope_Version_Form,
    Envelope_User,
    External_User,
    Env_Form_Field,
    Env_Form_Field_Parameter,
    Env_Digital_Field,
    Envelope_User_Verified,
    Field_User,
    Field_Verified,
    Message_User,
    Role_Enterprise,
    Traceability_User,
    User_Enterprise,
    Variable_Plataform,
)
from api.permissions import IsUserAdminOrHasPermission, IsSuperAdmin
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
# models
from django.db.models.functions import Concat
from django.db.models import Case, CharField, F, IntegerField, Q, Value, When
# others
from api.controllers.site import data_ANI
from api.controllers.notification import Sms, list_restric, random_token
from api.controllers.traceability import create_traceability, generate_log
from api.controllers.system_log import register_log, traceback
from api.controllers.form import create_env_element, create_env_field, replace_character
from api.controllers.answer import assing_serial, save_answer_field
from api.util import send_email, send_whatsapp_msg
from api.encrypt import Encrypt
from django.http import HttpResponse
from django.conf import settings
from django_xhtml2pdf.utils import generate_pdf
from django.template.loader import render_to_string
from PyPDF2 import PdfFileReader
from threading import Thread
from weasyprint import HTML

import json
import pytz
import base64
import itertools
import os
import time

TZ_INFO = pytz.timezone('America/Bogota')

class EnvelopeList(APIView):
    """
    API endpoint que permite la consulta de los sobres y la creación de nuevos.
    """
    permission_classes = [IsAuthenticated]

    # Consulta
    def get(self, request, format=None, state=1):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            envelope_list = []
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                envelope_values = Envelope_Enterprise.objects.filter(
                    user=user_val,
                    state=True
                )
            else:
                list_envelope = Envelope_User.objects.filter(
                    Q(type_user=1, user=user_val.id) | Q(type_user=2, user=user_val.role_enterprise_id),
                    state=True
                ).values_list('envelope_version__envelope_enterprise_id', flat=True)
                envelope_values = Envelope_Enterprise.objects.filter(
                    id__in=list_envelope,
                    state=True
                )
            envelope_values = envelope_values.values('id', 'name', 'version', 'creation_date').order_by('-creation_date')
            # lista de formularios
            for envelope_val in envelope_values:
                try:
                    envelope_version_val = Envelope_Version.objects.get(
                        envelope_enterprise_id=envelope_val['id'],
                        version=envelope_val['version']
                    )

                    envelope_version_form_val = Envelope_Version_Form.objects.get(
                        envelope_version=envelope_version_val,
                        position=1,
                        state=True
                    )

                    folder = str(envelope_version_form_val.template)
                    path = settings.MEDIA_ROOT + folder
                    template = ''
                    with open(path, 'rb+') as file:
                        content = file.read()
                        content = 'data:application/pdf;base64,' + base64.b64encode(content).decode()
                        template = content

                    envelope_list.append({
                        'id': envelope_val['id'],
                        'name': replace_character(envelope_val['name']),
                        'version': envelope_val['version'],
                        'template': template,
                        'creation_date': envelope_val['creation_date'],
                        'modify_date': envelope_version_val.modify_date,
                        'status': envelope_version_val.status,
                    })
                except:
                    pass
            response['status'] = True
            response['data'] = envelope_list
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

            envelope_exist = False
            answer_envelope_val = False
            if 'id' in data and data['id'] != '':
                try:
                    envelope_enterprise_val = Envelope_Enterprise.objects.get(id=data['id'], user=user_val)
                    envelope_version_val = Envelope_Version.objects.get(envelope_enterprise=envelope_enterprise_val, version=envelope_enterprise_val.version)
                    envelope_exist = True
                    if 'answer' in data and data['answer'] != '':
                        answer_envelope_val = Answer_Envelope.objects.get(id=data['answer'], envelope_version=envelope_version_val, state=True)
                except:
                    return Response(response)

            if 'tab' in data and data['tab'] == 0:
                if not envelope_exist:
                    envelope_enterprise_val = Envelope_Enterprise()
                    envelope_enterprise_val.user = user_val
                    envelope_enterprise_val.name = ''
                    envelope_enterprise_val.save()

                    envelope_version_val = Envelope_Version()
                    envelope_version_val.envelope_enterprise = envelope_enterprise_val
                    envelope_version_val.save()

                # Todos los formularios del sobre.
                forms_all_envelope = [item['id'] for item in list(Envelope_Version_Form.objects.filter(envelope_version=envelope_version_val, state=True).values('id'))]
                # Formularios/Plantillas Cargadas
                response['forms'] = []

                for index, form in enumerate(data['forms']):
                    form_exist = True
                    folder = '/' + str(user_val.enterprise_id) + '/' + str(envelope_enterprise_val.id) + '/' + str(envelope_version_val.id) + '/'
                    if 'id' in form and form['id'] != '':
                        try:
                            env_version_form = Envelope_Version_Form.objects.get(id=form['id'], envelope_version=envelope_version_val)
                            # Obtener Archivo
                            str_template = str(env_version_form.template)
                            path = settings.MEDIA_ROOT + str_template
                        except Envelope_Version_Form.DoesNotExist:
                            form_exist = False
                    else:
                        env_version_form = Envelope_Version_Form()
                        env_version_form.envelope_version = envelope_version_val
                        # Obtener/Crear Archivo.
                        file_name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + ".pdf"
                        path = settings.MEDIA_ROOT + folder
                        if not os.path.exists(path):
                            os.makedirs(path)
                        path += file_name
                        str_template = folder + file_name

                    if form_exist:
                        env_version_form.name = form['name']
                        create = 'create' in form and form['create']
                        if 'data' in form and form['data']:

                            if create:
                                # Crea documento en blanco
                                result_file = open(path, "w+b")
                                generate_pdf(
                                    'base.html',
                                    file_object=result_file,
                                    context={
                                        'size': form['data']['format'],
                                        'pages': range(int(form['data']['pages'])),
                                    })
                                result_file.close()
                            else:
                                # Guardar archivo
                                with open(path, 'wb+') as file:
                                    file.write(base64.decodebytes(bytearray(form['data'].replace('data:application/pdf;base64,','').encode())))

                            if 'id' in form and form['id'] != '':
                                Env_Form_Field.objects.filter(envelope_version_form=env_version_form).update(state=False)
                            env_version_form.template = str_template
                        env_version_form.position = index + 1
                        env_version_form.save()
                        response['forms'].append(assing_data_pdf(path, env_version_form, create))
                        # Se remueve de la lista de inactivos.
                        if 'id' in data and data['id'] != '':
                            try:
                                forms_all_envelope.remove(env_version_form.id)
                            except:
                                pass

                if 'id' in data and data['id'] != '' and forms_all_envelope:
                    Envelope_Version_Form.objects.filter(id__in=forms_all_envelope, envelope_version=envelope_version_val).update(state=False)
                response['id'] = envelope_enterprise_val.id

            elif 'tab' in data and data['tab'] == 1 and envelope_enterprise_val:
                try:
                    user_list = data['users']
                    option = data['partOpt']

                    conditional = (
                        envelope_version_val.order_important != data['order'] or
                        envelope_version_val.respect_participant != data['respect_participant'] or
                        envelope_version_val.limit_alert != data['alert'] or
                        envelope_version_val.limit_time != data['alert_time'] or
                        envelope_version_val.checker != data['checker'] or
                        envelope_version_val.limit_date != data['limit_date']
                    )

                    if conditional:
                        envelope_version_val.order_important = data['order']
                        envelope_version_val.respect_participant = data['respect_participant']
                        envelope_version_val.limit_alert = data['alert']
                        envelope_version_val.limit_time = data['alert_time']
                        envelope_version_val.checker = data['checker']
                        envelope_version_val.limit_date = data['limit_date']
                        envelope_version_val.save()

                    answer_envelope_id, new_part_ids = assing_participants(user_val, envelope_version_val, option, user_list, answer_envelope_val)
                    response['data'] = new_part_ids
                    response['answer_id'] = answer_envelope_id
                except IndexError:
                    return Response({'status': False, 'message': 'Debes incluir por lo menos un Participante'})
            elif 'tab' in data and data['tab'] == 2 and envelope_enterprise_val and answer_envelope_val:
                try:
                    answer_user_checker_val = Answer_Envelope_User.objects.get(
                        answer_envelope=answer_envelope_val,
                        envelope_user_id=data['checker_user']
                    )
                    # Resposable de verificación
                    try:
                        # Busca el participante verificador
                        answer_envelope_checker_val = Answer_Envelope_Checker.objects.get(
                            answer_envelope_user__answer_envelope=answer_envelope_val
                        )
                        answer_envelope_user_checker_val = answer_envelope_checker_val.answer_envelope_user
                        # Se compara si hubo cambio y se guarda el nuevo verificador
                        if answer_envelope_user_checker_val != answer_user_checker_val:
                            answer_envelope_checker_val.answer_envelope_user = answer_user_checker_val
                            answer_envelope_checker_val.save()
                    except (Answer_Envelope_Checker.DoesNotExist):
                        # En caso de no existir crea el participante verificador con su respectivo token
                        answer_envelope_checker_val = Answer_Envelope_Checker()
                        answer_envelope_checker_val.answer_envelope_user = answer_user_checker_val
                        answer_envelope_checker_val.save()

                        token_link = Encrypt().encrypt_code(answer_envelope_checker_val.id)
                        answer_envelope_checker_val.token_link = token_link
                        answer_envelope_checker_val.save()

                    # Busca todos los usuarios para ser verificados
                    # checker_all_envelope = list(Envelope_User_Verified.objects.filter(envelope_user__envelope_version=envelope_version_val).values_list('id', flat=True))
                    checker_all_envelope = list(Envelope_User_Verified.objects.filter(
                        answer_envelope_user__envelope_user__state=True,
                        answer_envelope_user__answer_envelope=answer_envelope_val,
                    ).values_list('id', flat=True))
                    for user in data['users']:
                        try:
                            # envelope_user_val = Envelope_User.objects.get(id=user['id'], envelope_version=envelope_version_val)
                            answer_envelope_user_val = Answer_Envelope_User.objects.get(
                                answer_envelope=answer_envelope_val,
                                envelope_user_id=user['id'],
                            )

                            try:
                                # Se verifica si existe la clase con mayor información para la verificación
                                answer_envelope_verified_val = Answer_Envelope_Verified.objects.get(answer_envelope_user=answer_envelope_user_val)
                            except (Answer_Envelope_Verified.DoesNotExist):
                                # Se crea la respuesta vacia de la verificación de datos y el token de acceso
                                if 'checker' in user and len(user['checker']) > 0:
                                    answer_envelope_verified_val = Answer_Envelope_Verified()
                                    answer_envelope_verified_val.answer_envelope_user = answer_envelope_user_val
                                    answer_envelope_verified_val.save()

                                    token_link = Encrypt().encrypt_code(answer_envelope_verified_val.id)
                                    answer_envelope_verified_val.token_link = token_link
                                    answer_envelope_verified_val.save()

                            if 'checker' in user and len(user['checker']) > 0:
                                for check in user['checker']:
                                    try:
                                        user_verified_val = Envelope_User_Verified.objects.get(answer_envelope_user=answer_envelope_user_val, type_check=check)
                                        user_verified_val.state = True
                                        user_verified_val.save()
                                        checker_all_envelope.remove(user_verified_val.id)
                                    except (Envelope_User_Verified.DoesNotExist):
                                        user_verified_val = Envelope_User_Verified()
                                        user_verified_val.answer_envelope_user = answer_envelope_user_val
                                        user_verified_val.type_check = check
                                        user_verified_val.save()

                        except Answer_Envelope_User.DoesNotExist:
                            pass
                    if checker_all_envelope:
                        Envelope_User_Verified.objects.filter(
                            answer_envelope_user__answer_envelope=answer_envelope_val,
                            id__in=checker_all_envelope
                        ).update(state=False)
                except Exception as er:
                    # print(er)
                    status_response = status.HTTP_403_FORBIDDEN
                    return Response(response, status=status_response)
            elif 'tab' in data and data['tab'] == 3 and envelope_enterprise_val and answer_envelope_val:
                try:
                    msg_opt = data['msgOpt']
                    user_list = data['users']
                    sms = data['sms']
                    whatsapp = data['whatsapp']
                    envelope_version_val.message_type = msg_opt
                    envelope_version_val.sms = sms
                    envelope_version_val.ws = whatsapp
                    if msg_opt in [1,2]:
                        if msg_opt == 2:
                            envelope_version_val.subject = data['msgSubject']
                            envelope_version_val.content = data['msgText']
                        else:
                            envelope_version_val.subject = None
                            envelope_version_val.content = None
                    elif msg_opt == 3:
                        assing_message_participant(user_list, envelope_version_val, user_val)
                    envelope_version_val.save()
                except IndexError:
                    return Response({'status': False, 'message': 'Faltan parametros.'})
                except Exception as e:
                    return Response({'status': False, 'message': str(e)})

            elif 'tab' in data and data['tab'] == 4 and envelope_enterprise_val and answer_envelope_val:

                envelope_enterprise_val.name = data['name']
                envelope_enterprise_val.save()

                for index, form in enumerate(data['forms']):

                    try:
                        env_version_form = Envelope_Version_Form.objects.get(id=form['id'], envelope_version=envelope_version_val)
                        create_env_field(env_version_form.id, form['fields_drag'], create=True)
                        if 'elements_drag' in form:
                            create_env_element(env_version_form.id, form['elements_drag'], create=True)

                    except (Envelope_Version_Form.DoesNotExist):
                        pass
                envelope_version_val.status = 1
                envelope_version_val.save()
                try:
                    Thread(target=share_envelope, args=(answer_envelope_val,)).start()
                    # share_envelope(answer_envelope_val)
                except Exception as err:
                    raise Exception('Fallo al compartir Sobre, '+ str(err))
            response['status'] = True
            status_response = status.HTTP_200_OK

        except (User_Enterprise.DoesNotExist):
            pass
        except Exception as err:
            response['detail'] = str(err)
        return Response(response, status=status_response)


def assing_data_pdf(path, env_ver_form, create):
    temp = {
        'name': env_ver_form.name,
        'pages' : [],
        'pages_count': 0,
        'id': env_ver_form.id
    }
    pdf_template = PdfFileReader(open(path, 'rb'))
    pages = pdf_template.getNumPages()
    temp['pages_count'] = pages
    for page_i in range(0, pages if pages else 0):
        measures = pdf_template.getPage(page_i).mediaBox
        width = float(measures[2])
        height = float(measures[3])
        temp['pages'].append({
            'width': width,
            'height': height,
        })
    if create:
        with open(path, 'rb') as file:
            content = file.read()
            temp['src'] = base64.b64encode(content).decode()
    return temp

def assing_participants(user_val, env_version_val, part_option, user_vals, answer_envelope_val=False):
    user_return = []

    # En caso de no tener ninguna respuesta, crea el primer link por respuesta para los participantes.
    if not answer_envelope_val:
        if not Answer_Envelope.objects.filter(envelope_version=env_version_val, state=True, status=0).exists():
            answer_envelope_val = Answer_Envelope()
            answer_envelope_val.envelope_version = env_version_val
            answer_envelope_val.serial_number = assing_serial(user_val.enterprise_id)
            answer_envelope_val.save()

            token_link = Encrypt().encrypt_code(answer_envelope_val.id)
            answer_envelope_val.token_link = token_link
            answer_envelope_val.save()
        else:
            answer_envelope_val = Answer_Envelope.objects.get(envelope_version=env_version_val, state=True, status=0)

    if part_option in [0,1]:

        for index, item in enumerate(user_vals):
            if item['id'] == user_val.id:
                break
            else:
                index = -1

        data_user = user_vals[index] if index > -1 else None
        data_user['position'] = index

        answer_envelope_user_val = False
        env_user_val = False
        try:
            if 'answer_env_user_id' in data_user and data_user['answer_env_user_id']:
                answer_envelope_user_val = Answer_Envelope_User.objects.get(id=data_user['answer_env_user_id'], answer_envelope=answer_envelope_val, type_user=1, user=user_val.id)
                env_user_val = answer_envelope_user_val.envelope_user
        except Answer_Envelope_User.DoesNotExist:
            pass

        env_id = answer_participant(answer_envelope_val, data_user, answer_envelope_user_val, env_user_val)

        user_return = [env_id]

    if part_option in [1,2]:
        for value in [[idx, val] for idx, val in enumerate(user_vals) if val['id'] != user_val.id or (val['id'] == user_val.id and val['type'] != 1)]:
            user = value[1]
            user['position'] = value[0]
            # internal User/Role/Public
            if user['type'] in [1,2,4,5]:
                answer_envelope_user_val = False
                env_user_val = False
                try:
                    if 'answer_env_user_id' in user and user['answer_env_user_id']:
                        answer_envelope_user_val = Answer_Envelope_User.objects.get(id=user['answer_env_user_id'], answer_envelope=answer_envelope_val, type_user=user['type'], user=user['id'])
                        env_user_val = answer_envelope_user_val.envelope_user
                except Answer_Envelope_User.DoesNotExist:
                    pass

            # External User
            elif user['type'] == 3:
                try:
                    if user['id']:
                        ext_user_val = External_User.objects.get(id=user['id'])
                    else:
                        ext_user_val = External_User.objects.get(enterprise_id=user_val.enterprise_id, email=user['email'], phone=user['phone'], phone_ind=user['phone_ind'])
                except External_User.DoesNotExist:
                    ext_user_val = External_User()
                    ext_user_val.email = user['email']
                    ext_user_val.enterprise_id = user_val.enterprise_id
                ext_user_val.phone = user['phone']
                ext_user_val.phone_ind = user['phone_ind'] #+57-co
                ext_user_val.name = user['name']
                ext_user_val.state = True
                ext_user_val.save()
                user['id'] = ext_user_val.id

                answer_envelope_user_val = False
                env_user_val = False
                try:
                    if 'answer_env_user_id' in user and user['answer_env_user_id']:
                        answer_envelope_user_val = Answer_Envelope_User.objects.get(id=user['answer_env_user_id'], answer_envelope=answer_envelope_val, type_user=3, user=ext_user_val.id)
                        env_user_val = answer_envelope_user_val.envelope_user
                except Answer_Envelope_User.DoesNotExist:
                    pass

            env_id = answer_participant(answer_envelope_val, user, answer_envelope_user_val, env_user_val)
            user_return.append(env_id)
    Envelope_User.objects.filter(envelope_version=env_version_val).exclude(id__in=user_return).update(state=False)

    return answer_envelope_val.id, user_return

def answer_participant(answer_envelope_val:Answer_Envelope, data_user,
                       answer_envelope_user_val:Answer_Envelope_User = False,
                       env_user_val:Envelope_User = False):
    # Aqui va la funciona carlitos :) hagalo bien
    if data_user is None:
        return None

    if not env_user_val:
        env_user_val = Envelope_User()
        env_user_val.envelope_version = answer_envelope_val.envelope_version
    env_user_val.color = data_user['color']
    env_user_val.position = data_user['position']
    env_user_val.save()

    if not answer_envelope_user_val:
        answer_envelope_user_val = Answer_Envelope_User()
        answer_envelope_user_val.answer_envelope = answer_envelope_val
        answer_envelope_user_val.envelope_user = env_user_val
    answer_envelope_user_val.type_user = data_user['type']
    answer_envelope_user_val.user = data_user['id']
    answer_envelope_user_val.source = 1
    answer_envelope_user_val.approver = data_user['approver']
    if 'limit_time' in data_user and data_user['limit_time']:
        answer_envelope_user_val.limit_time = data_user['limit_time']
    if 'limit_public' in data_user and data_user['limit_public']:
        answer_envelope_user_val.limit_public = data_user['limit_public']
    answer_envelope_user_val.save()

    token_link = Encrypt().encrypt_code(answer_envelope_user_val.id)
    answer_envelope_user_val.token_link = token_link
    answer_envelope_user_val.save()

    if answer_envelope_user_val.approver:
        try:
            Answer_Envelope_Approve.objects.get(answer_envelope_user=answer_envelope_user_val)
        except Answer_Envelope_Approve.DoesNotExist:
            answer_envelope_approve_val = Answer_Envelope_Approve()
            answer_envelope_approve_val.answer_envelope_user = answer_envelope_user_val
            answer_envelope_approve_val.save()

            token_link = Encrypt().encrypt_code(answer_envelope_approve_val.id)
            answer_envelope_approve_val.token_link = token_link
            answer_envelope_approve_val.save()

    if env_user_val and answer_envelope_user_val:
        env_user_val.color = data_user['color']
        answer_envelope_user_val.approver = data_user['approver']
        if 'limit_time' in data_user and data_user['limit_time']:
            answer_envelope_user_val.limit_time = data_user['limit_time']
        env_user_val.save()
        answer_envelope_user_val.save()

        return env_user_val.id
    return None

def assing_message_participant(users, env_version_val, user_val):
    for user in users:
        try:
            if user['type'] in [1,2]:
                env_user_val = Envelope_User.objects.get(envelope_version=env_version_val, type_user=user['type'], user=user['id'])
            else:
                if user['id']:
                    ext_user_val = External_User.objects.get(id=user['id'])
                else:
                    ext_user_val = External_User.objects.get(enterprise_id=user_val.enterprise_id, email=user['email'])
                env_user_val = Envelope_User.objects.get(envelope_version=env_version_val, type_user=user['type'], user=ext_user_val.id)

            user_subject = user['subject'].strip() if 'subject' in user and user['subject'].strip() else None
            user_msg = user['msg'].strip() if 'msg' in user and user['msg'].strip() else None
            if (user_subject) or (user_msg):
                try:
                    msg_user_val = Message_User.objects.get(envelope_user=env_user_val)
                    msg_user_val.subject = user_subject if user_subject else 'DOCUMENTO COMPARTIDO por MELMAC'
                    msg_user_val.content = user_msg if user_msg else '''Hola, se te ha compartido el siguiente documento NOMBRE
                        Por favor, realiza tu diligenciamiento por medio de este enlace: <LINK>
                        Entre más pronto, mejor. ¡Gracias!'''
                    msg_user_val.save()
                except Message_User.DoesNotExist:
                    msg_user_val = Message_User()
                    msg_user_val.envelope_user = env_user_val
                    msg_user_val.subject = user_subject if user_subject else 'DOCUMENTO COMPARTIDO por MELMAC'
                    msg_user_val.content = user_msg if user_msg else '''Hola, se te ha compartido el siguiente documento NOMBRE
                            Por favor, realiza tu diligenciamiento por medio de este enlace: <LINK>
                            Entre más pronto, mejor. ¡Gracias!'''
                    msg_user_val.save()
        except (Envelope_User.DoesNotExist, External_User.DoesNotExist):
            raise Exception('No puedes asignarle mensaje a un usuario que no ha sido asignado anteriormente')

@api_view(['POST'])
def get_fields(request):
    response = { 'status':False }
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        data = request.data
        # Obligatorio
        envelope_id = data['id']
        # Opcional
        answer = data['answer'] if 'answer' in data else None
        version = data['version'] if 'version' in data else None
        form_id = data['form'] if 'form' in data else None
        user_id = data['user'] if 'user' in data else None
        edit = 'edit' in data

        if answer:
            answer_envelope_user_val = Answer_Envelope_User.objects.get(id=answer)
            # answer_envelope_val = Answer_Envelope.objects.get(id=answer)
            answer_envelope_val = answer_envelope_user_val.answer_envelope
            env_ver_val = answer_envelope_val.envelope_version
            envelope_val = env_ver_val.envelope_enterprise
        else:
            envelope_val = Envelope_Enterprise.objects.get(id=envelope_id)
            if version:
                env_ver_val = Envelope_Version.objects.get(envelope_enterprise_id=envelope_id, version=version)
            else:
                env_ver_val = Envelope_Version.objects.get(envelope_enterprise_id=envelope_id, version=envelope_val.version)

            if not Answer_Envelope.objects.filter(envelope_version=env_ver_val, state=True, status=0).exists():
                answer_envelope_val = Answer_Envelope()
                answer_envelope_val.envelope_version = env_ver_val
                answer_envelope_val.serial_number = assing_serial(envelope_val.user.enterprise_id)
                answer_envelope_val.save()

                token_link = Encrypt().encrypt_code(answer_envelope_val.id)
                answer_envelope_val.token_link = token_link
                answer_envelope_val.save()
            else:
                answer_envelope_val = Answer_Envelope.objects.get(envelope_version=env_ver_val, state=True, status=0)

        if not form_id:
            env_ver_form_vals = Envelope_Version_Form.objects.filter(envelope_version_id=env_ver_val.id, state=True).order_by('position')
        else:
            env_ver_form_vals = [Envelope_Version_Form.objects.get(envelope_version_id=env_ver_val.id, id=form_id)]


        form_ids = [ ]
        form_templates = []

        for form in list(env_ver_form_vals):
            temp = {
                'id': form.id,
                'data': None
            }
            folder = str(form.template)
            path = settings.MEDIA_ROOT + folder
            with open(path, 'rb+') as file:
                content = file.read()
                content = 'data:application/pdf;base64,' + base64.b64encode(content).decode()
                temp['data'] = content
            temp = temp | assing_data_pdf(path, form, False)
            form_ids.append(temp['id'])
            form_templates.append(temp)

        all_users_fields_query = Field_User.objects.filter(
            env_form_field__envelope_version_form_id__in=form_ids,
            env_form_field__state=True,
        ).select_related('env_form_field').annotate(
            user=F('envelope_user_id'),
            form=F('env_form_field__envelope_version_form_id'),
            field=F('env_form_field_id')
        )
        if user_id:
            all_users_fields_query = all_users_fields_query.exclude(~Q(envelope_user_id=user_id))

        all_users_fields = list(all_users_fields_query.values(
            'user',
            'form',
            'field'
        ))

        fields_ids = [user_field['field'] for user_field in all_users_fields]
        participant_ids = [user_field['user'] for user_field in all_users_fields]

        all_digital_fields = Env_Digital_Field.objects.filter(
            env_form_field_id__in=fields_ids,
            state=True
            ).select_related(
                'env_form_field'
            ).annotate(
                field=F('env_form_field_id'),
                field_type=F('env_form_field__field_type_id'),
                form_id=F('env_form_field__envelope_version_form_id'),
                description=F('env_form_field__help'),
                label=F('env_form_field__name'),
                required=F('env_form_field__obligatory'),
                size_image_x=F('width'),
                size_image_y=F('height'),
                row=F('env_form_field__row'),
            ).order_by(
                'env_form_field_id',
                'id',
            ).values(
                'id',
                'page',
                'envelope_version_form_id',
                'field_type',
                'field',
                'left',
                'top',
                'font',
                'color',
                'size',
                'bold',
                'italic',
                'underline',
                'line_height',
                'size_image_x',
                'size_image_y',
                'option',
                'option_value',
                'row',
                'row_field',
                'description',
                'required',
                'form_id',
                'label',
                'description'
            )

        form_elements = []
        all_digital_elements = Env_Digital_Element.objects.filter(
            envelope_version_form_id__in = form_ids,
            state=True
        ).annotate(
            field_type=F('element_type_config_id'),
            form_id=F('envelope_version_form_id'),
            size_image_x=F('width'),
            size_image_y=F('height'),
        ).order_by('id').values(
            'id',
            'form_id',
            'field_type',
            'label',
            'url_src',
            'page',
            'left',
            'top',
            'font',
            'size',
            'color',
            'justify',
            'bold',
            'italic',
            'underline',
            'size_image_x',
            'size_image_y',
            'line_height',
        )
        for digital_element in all_digital_elements:
            temp = digital_element
            temp['user'] = None
            temp['isConfig'] = True
            form_elements.append(temp)

        get_attr = lambda user_field: user_field['field'] if 'field' in user_field else 0
        dict_digital_field_data = {
            str(k): list(g) for k, g in itertools.groupby(sorted(all_digital_fields, key=get_attr), get_attr)
        }

        all_field_validation = Env_Form_Field_Parameter.objects.filter(
            env_form_field_id__in=fields_ids,
            state=True
        ).select_related(
            'parameter_validate'
        ).annotate(
            field=F('env_form_field_id'),
            parameter=F('parameter_validate__name')
        ).values(
            'value',
            'field',
            'parameter'
        )

        get_attr = lambda user_field: user_field['field'] if 'field' in user_field else 0
        dict_field_validation = {
            str(k): { i['parameter']: i['value'] for i in g } for k, g in itertools.groupby(sorted(all_field_validation, key=get_attr), get_attr)
        }

        all_user_version_query = Envelope_User.objects.filter(
            envelope_version_id=env_ver_val.id,
            state=True
        ).order_by(
            'position'
        )

        if user_id:
            all_user_version_query = all_user_version_query.exclude(~Q(id=user_id))

        all_user_version = all_user_version_query.values('id', 'color')

        dict_user_version = {
            str(user['id']): user for user in all_user_version
        }

        if answer:
            try:
                # Valida si es parte de un flujo de respuestas
                answer_envelope_extend_val = Answer_Envelope_Extend.objects.get(answer_envelope_child=answer_envelope_val)
                answer_envelope_field_values = Answer_Envelope_Field.objects.filter(
                    answer_envelope_user__answer_envelope_id__in=[answer_envelope_val.id, answer_envelope_extend_val.answer_envelope_id],
                    state=True
                )

            except Answer_Envelope_Extend.DoesNotExist:
                answer_envelope_field_values = Answer_Envelope_Field.objects.filter(
                    answer_envelope_user__answer_envelope=answer_envelope_val,
                    state=True
                )

            answer_envelope_field_values = answer_envelope_field_values.select_related(
                'field_user'
            ).annotate(
                field=F('field_user__env_form_field_id')
            ).values(
                'field',
                'value',
            )

            dict_answer_envelope_field = {
                str(answer_field['field']): answer_field['value'] for answer_field in answer_envelope_field_values
            }

        # Estructura que agrupa por usuario los formularios
        user_form_fields = []

        for user_field in all_users_fields:
            temp = {}
            temp['user'] = dict_user_version[str(user_field['user'])]
            temp['isConfig'] = False

            temp_digital = dict_digital_field_data[str(user_field['field'])] if str(user_field['field']) in dict_digital_field_data else []
            if len(temp_digital) > 1:
                temp_digital_clone = temp_digital[1:]
                temp_digital = temp_digital[0]
                temp_digital['clone'] = temp_digital_clone
            elif len(temp_digital) == 1:
                temp_digital = temp_digital[0]
                temp_digital['clone'] = []
            else:
                temp_digital = {}
            temp = temp | temp_digital
            # | dict_digital_field_data[str(user_field['field'])] if str(user_field['field']) in dict_digital_field_data else {}
            if str(user_field['field']) in dict_field_validation:
                temp['validate'] = dict_field_validation[str(user_field['field'])]

            if answer:
                if str(user_field['field']) in dict_answer_envelope_field:
                    temp['answer'] = dict_answer_envelope_field[str(user_field['field'])]
            user_form_fields.append(temp)

        user_form_fields = sorted(user_form_fields, key=lambda field : (field['form_id'], field['page']))

        response['status'] = True
        response['data'] = {
            'answer_id': answer_envelope_val.id,
            'fields': user_form_fields + form_elements,
            'form': form_templates
        }

        if edit:
            user_list = Answer_Envelope_User.objects.select_related(
                'envelope_user'
            ).filter(
                answer_envelope_id=answer_envelope_val.id,
                envelope_user__state=True,
            ).annotate(
                answer_env_user_id=F('id'),
                version_id=F('envelope_user_id'),
                type=F('type_user'),
                position=F('envelope_user__position'),
                color=F('envelope_user__color'),
            ).order_by(
                'envelope_user__position'
            ).values(
                'answer_env_user_id',
                'version_id',
                'type',
                'user',
                'position',
                'color',
                'approver',
                'limit_time',
                'limit_public',
            )

            msg_list = Message_User.objects.filter(
                envelope_user__envelope_version_id=env_ver_val.id,
            ).annotate(
                user=F('envelope_user_id')
            ).order_by(
                'user'
            ).values(
                'user',
                'subject',
                'content'
            )

            dict_user_msg = {
                str(msg['user']): {
                    'subject': msg['subject'],
                    'msg': msg['content'],
                } for msg in list(msg_list)
            }

            internal_user_ids = [user['user'] for user in list(user_list) if user['type'] == 1]
            role_ids = [user['user'] for user in list(user_list) if user['type'] == 2]
            external_user_ids = [user['user'] for user in list(user_list) if user['type'] == 3]

            external_user_data = External_User.objects.filter(
                id__in=external_user_ids
            ).values(
                'id',
                'name',
                'phone',
                'phone_ind',
                'email'
            )

            external_user_data = { str(ext_user['id']): ext_user for ext_user in list(external_user_data)}

            internal_user_data = User_Enterprise.objects.filter(
                id__in=internal_user_ids
            ).annotate(
                name=Concat('first_name', Value(' ', output_field=CharField()), 'first_last_name', output_field=CharField()),
                phone_ind=Value(None, output_field=CharField(null=True)),
            ).values(
                'id',
                'name',
                'phone',
                'phone_ind',
                'email'
            )

            internal_user_data = { str(int_user['id']): int_user for int_user in list(internal_user_data)}

            role_data = Role_Enterprise.objects.filter(
                id__in=role_ids
            ).values(
                'id',
                'name',
            )

            role_data = { str(role['id']): role for role in list(role_data)}

            user_data = []
            for user in user_list:
                temp = {
                    'answer_env_user_id': user['answer_env_user_id'],
                    'version_id': user['version_id'],
                    'type': user['type'],
                    'color': user['color'],
                    'approver': user['approver'],
                    'limit_time': user['limit_time'],
                    'limit_public': user['limit_public'],
                }
                if temp['type'] == 3 and str(user['user']) in external_user_data:
                    temp = temp | external_user_data[str(user['user'])]
                elif temp['type'] == 1 and str(user['user']) in internal_user_data:
                    temp = temp | internal_user_data[str(user['user'])]
                elif temp['type'] == 2 and str(user['user']) in role_data:
                    temp = temp | role_data[str(user['user'])]
                elif temp['type'] == 4 or temp['type'] == 5:
                    public_data = {
                        'id': None,
                        'name': 'Público Uno'
                    }
                    if temp['type'] == 5:
                        public_data['name'] = 'Público Dos'
                    temp = temp | public_data

                if str(user['user']) in dict_user_msg:
                    temp = temp | dict_user_msg[str(user['user'])]
                user_data.append(temp)

            checker = None
            checked_list = []
            if env_ver_val.check:
                checker = Answer_Envelope_Checker.objects.get(
                    answer_envelope_user__answer_envelope_id=answer_envelope_val.id,
                    answer_envelope_user__envelope_user__state=True
                ).answer_envelope_user.envelope_user_id if Answer_Envelope_Checker.objects.filter(
                    answer_envelope_user__answer_envelope_id=answer_envelope_val.id,
                    answer_envelope_user__envelope_user__state=True
                ).exists() else None

                for user in user_data:
                    checker_values = list(
                        Envelope_User_Verified.objects.filter(
                            answer_envelope_user__envelope_user_id=user['version_id'],
                            state=True
                        ).values_list(
                        'type_check',
                        flat=True)
                    )
                    checked_list.append({
                        'id': user['version_id'],
                        'name': user['name'],
                        'type': user['type'],
                        'checker': checker_values
                    })

            response['data']['user_list'] = user_data
            response['data']['partOpt'] = env_ver_val.flow_type
            response['data']['msgOpt'] = env_ver_val.message_type
            response['data']['msgText'] = env_ver_val.content
            response['data']['msgSubject'] = env_ver_val.subject
            response['data']['sms'] = env_ver_val.sms
            response['data']['whatsapp'] = env_ver_val.ws
            response['data']['autosave'] = env_ver_val.autosave
            response['data']['order'] = env_ver_val.order_important
            response['data']['respect_participant'] = env_ver_val.respect_participant
            response['data']['alert'] = env_ver_val.limit_alert
            response['data']['alert_time'] = str(env_ver_val.limit_time)
            response['data']['checker'] = env_ver_val.checker
            response['data']['checker_user'] = checker
            response['data']['checked_list'] = checked_list
            response['data']['limit_date'] = str(env_ver_val.limit_date) if env_ver_val.limit_date else ""
            response['data']['name'] = env_ver_val.envelope_enterprise.name

        status_response = status.HTTP_200_OK

    except KeyError as err:
        print(err)
    except (Envelope_Enterprise.DoesNotExist, Envelope_Version.DoesNotExist, Envelope_Version_Form.DoesNotExist) as err:
        print(err)

    return Response(response, status=status_response)

def share_envelope(answer_envelope_val:Answer_Envelope):
    try:
        env_ver_val = answer_envelope_val.envelope_version

        if env_ver_val.status == 0:
            raise Exception('falta terminar la construcción del sobre.')
        elif env_ver_val.status != 1:
            raise Exception('el sobre ha sido compartido previamente.')

        # if env_ver_val.checker:
        #     # env_ver_val.status = 2
        #     # env_ver_val.save()
        # else:
        #     # env_ver_val.status = 4
        #     # env_ver_val.save()

        send_communication_user(answer_envelope_val)

    except (Envelope_Enterprise.DoesNotExist, Envelope_Version.DoesNotExist) as err:
        raise(Exception('no se encontro el sobre especificado.'))
    except (Answer_Envelope_Checker.DoesNotExist):
        raise(Exception('Tus campos se han guardado pero parte de la configuración esta incompleta, verifica la sección de verificar o desactiva la opción de verificadores.'))
    # except Exception as err:
    #     raise(err)

def send_communication_user(answer_envelope_val):
    env_ver_val = answer_envelope_val.envelope_version
    envelope_val = env_ver_val.envelope_enterprise
    enterprise_id = envelope_val.user.enterprise_id

    envelope_user_values = Answer_Envelope_User.objects.filter(
        answer_envelope_id=answer_envelope_val.id,
        envelope_user__state=True
    ).order_by(
        'envelope_user__position'
    )

    if env_ver_val.order_important:
        # Envio por usuario respetando el orden.
        envelope_user_val = envelope_user_values.first()

        if envelope_user_val.type_user in [4,5]:
            # Otro correo pero al administrador/creador del sobre
            send_communication_answer_public(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id)
        else:
            checker_process = False
            if env_ver_val.checker:
                try:
                    # Envio a usuario verificador, envio a todos los usuarios a ser verificados para iniciar el proceso de verificacion.
                    checker_val = Answer_Envelope_Checker.objects.get(
                        answer_envelope_user=envelope_user_val,
                    )
                    checker_process = True
                    send_communication_verified(answer_envelope_val, checker_val)
                except (Answer_Envelope_Checker.DoesNotExist):
                    pass

            if envelope_user_val.approver:
                send_communication_approve(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id)
            elif not checker_process:
                send_communication_answer(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id)

    else:
        # Envio simultaneo a todos los usuarios.
        for envelope_user_val in envelope_user_values:
            if envelope_user_val.type_user in [4,5]:
                # Otro correo pero al administrador/creador del sobre
                send_communication_answer_public(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id)
            else:
                checker_process = False
                if env_ver_val.checker:
                    try:
                        # Envio a usuario verificador, envio a todos los usuarios a ser verificados para iniciar el proceso de verificacion.
                        checker_val = Answer_Envelope_Checker.objects.get(
                            answer_envelope_user=envelope_user_val,
                        )
                        checker_process = True
                        send_communication_verified(answer_envelope_val, checker_val)
                    except (Answer_Envelope_Checker.DoesNotExist):
                        pass    

                if envelope_user_val.approver:
                    send_communication_approve(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id)
                elif not checker_process:
                    send_communication_answer(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id)

def send_communication_answer(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id):
    user_name, user_email = get_user_name(envelope_user_val, enterprise_id)
    link = 'public/envelope/user/' + answer_envelope_val.token_link + '/' + envelope_user_val.token_link
    subject = 'Tienes el proceso documental ' + envelope_val.name + ' para diligenciamiento'
    html_message = ('<div>'+
        '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
        '<p style="color: #000000;">Se te ha compartido el proceso documental ' + envelope_val.name +
        '. Por favor realiza tu diligenciamiento por medio de este enlace:</p>'+
    '</div>'+
    '<a href="' + settings.URL_FRONTEND + link + '" target="_blank" style="text-decoration: none; background: #412378; color: #FFFFFF; border-radius: 10px !important; padding: 10px 20px 10px 20px; font-size: 11px;">'+
        'VER DOCUMENTO'+
    '</a>'+
    '<p><b>Entre más pronto, mejor... ¡Gracias!</b></p>'+
    '<hr style="background: #412378; height: 2px;">')
    send_email(subject, '', [user_email], html_message)

def send_communication_answer_public(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id):
    user_envelope_val = answer_envelope_val.envelope_version.envelope_enterprise.user
    user_name = user_envelope_val.first_name + " " + user_envelope_val.first_last_name
    user_email = user_envelope_val.email

    # Link
    link = 'public/envelope/user/' + answer_envelope_val.token_link + '/' + envelope_user_val.token_link
    subject = 'Proceso documental ' + envelope_val.name + ' link de diligenciamiento'
    html_message = ('<div>'+
        '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
        '<p style="color: #000000;">Se ha generado un proceso documental ' + envelope_val.name +
        '. Envía el siguiente enlace a las personas interesadas.</p>'+
    '</div>'+
    '<div>'+
        '<label>' + settings.URL_FRONTEND + link + '</label>'
    '</div>'+
    '<hr style="background: #412378; height: 2px;">')
    send_email(subject, '', [user_email], html_message)

def send_communication_approve(answer_envelope_val, envelope_user_val, envelope_val, enterprise_id):
    envelope_approve_val = Answer_Envelope_Approve.objects.get(
        answer_envelope_user=envelope_user_val
    )

    user_name, user_email = get_user_name(envelope_user_val, enterprise_id)
    link = 'public/approve/user/' + answer_envelope_val.token_link + '/' + envelope_approve_val.token_link
    subject = 'APROBAR proceso documental ' + envelope_val.name + ' en MELMAC'
    html_message = ('<div>'+
        '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
        '<p style="color: #000000;">Te informamos que tienes un proceso documental donde te '+
        'han asignado una importante función.</p>'+
        '<p>Revisalo en el botón a continuación y si todo está bien '+
        '¡APRUÉBALO! para continuar el proceso.</p>'+
    '</div>'+
    '<a href="' + settings.URL_FRONTEND + link + '" target="_blank" style="text-decoration: none; background: #412378; color: #FFFFFF; border-radius: 10px !important; padding: 10px 20px 10px 20px; font-size: 11px;">'+
        'VER DOCUMENTO'+
    '</a>'+
    '<hr style="background: #412378; height: 2px;">')
    send_email(subject, '', [user_email], html_message)

def send_communication_verified(answer_envelope_val, checker_val, extend=False):
    try:
        env_ver_val = answer_envelope_val.envelope_version
        envelope_val = env_ver_val.envelope_enterprise
        enterprise_id = envelope_val.user.enterprise_id

        if not extend:
            token = str(random_token(6))
            checker_val.token = token
            checker_val.save()

            user_name, user_email = get_user_name(checker_val.answer_envelope_user, enterprise_id)

            link = 'public/checker/user/' + answer_envelope_val.token_link + '/' + checker_val.token_link
            subject = 'Te hemos enviado el documento ' + envelope_val.name + ' para verificación'

            span_div = ''
            for num in token:
                span_div += '<span style="width: 100%; display: block; flex: 1; margin-right: 2px; border: 1px solid #000; border-radius: 5px; font-size: 59px; text-align: center;" > '+ num +' </span>'
            html_message = ('<div>'+
                '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
                '<p style="color: #000000;">Te informamos que has sido elegido como verificador del documental ' + envelope_val.name +
                ', para el usuario '+ user_email +
                ', hemos enviado el documento a los verificantes para iniciar el'+
                ' proceso, este cuenta con el siguiente código OTP por seguridad:</p>'+
            '</div>'+
            '<div style="--item-height: 4.375em; display: flex; font-size: inherit; color: var(--color); margin-bottom: 15px;">'+ span_div +'</div>'+
            '<a href="' + settings.URL_FRONTEND + link + '" target="_blank" style="text-decoration: none; background: #412378; color: #FFFFFF; border-radius: 10px !important; padding: 10px 20px 10px 20px; font-size: 11px;">'+
                'VER DOCUMENTO'+
            '</a>')
            send_email(subject, '', [user_email], html_message)

        # Verified
        users_to_verify = Envelope_User_Verified.objects.filter(
            answer_envelope_user__answer_envelope_id=answer_envelope_val.id,
            state=True,
            answer_envelope_user__envelope_user__state=True
        ).order_by('id').values_list(
            'answer_envelope_user_id',
            flat=True
        )
        users_to_verify = list(users_to_verify)
        user_verified_values = Answer_Envelope_Verified.objects.filter(
            answer_envelope_user_id__in=users_to_verify
        )

        if extend:
            user_verified_values = user_verified_values.exclude(
                answer_envelope_user__type_user=5,
                answer_envelope_user__user=None,
            )

        user_verified_values = user_verified_values.order_by('id')
        
        for user_verified_val in user_verified_values:
            user_name, user_email = get_user_name(user_verified_val.answer_envelope_user, enterprise_id)

            link = 'public/verified/user/' + answer_envelope_val.token_link + '/' + user_verified_val.token_link
            subject = '¡ATENCIÓN! Tienes un proceso de verificación pendiente'
            html_message = ('<div>'+
                '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
                '<p style="color: #000000;">Te informamos que el proceso documental ' + envelope_val.name +
                ' solicita unos tipos de verificación en el cual necesitamos tu colaboración,'+
                ' por favor selecciona el botón INGRESAR y facilítanos la información'+
                ' indicada para continuar el proceso.</p>'+
            '</div>'+
            '<a href="' + settings.URL_FRONTEND + link + '" target="_blank" style="text-decoration: none; background: #412378; color: #FFFFFF; border-radius: 10px !important; padding: 10px 20px 10px 20px; font-size: 11px;">'+
                'INGRESAR'+
            '</a>'+
            '<hr style="background: #412378; height: 2px;">')
            send_email(subject, '', [user_email], html_message)
            Thread(target=send_reminder_verified, args=(user_verified_val, subject, user_email, html_message)).start()
    except Exception as er:
        pass

def send_reminder_verified(user_verified_val, subject, user_email, html_message):
    # Espera dos horas para la verificación
    time.sleep(7200)
    try:
        Answer_Envelope_Verified.objects.get(
            id=user_verified_val.id,
            status=0
        )
        send_email(subject, '', [user_email], html_message)
    except (Answer_Envelope_User.DoesNotExist):
        pass

def send_communication(user_data, env_users, envelope_val:Envelope_Enterprise, env_ver_val:Envelope_Version, type):
    """
    Metodo de prueba
    Se realiza el envio a la lista de usuarios suministrada según los parametros.
    """
    action = 'aprobar' if type == 0 else ('cargar tu información para ser verificada para poder diligenciar' if type == 2 else 'diligenciar')
    template = 'aprobador' if type == 0 else ('consultado' if type == 2 else 'diligenciador')
    link = 'approve/' if type == 0 else ('input/' if type == 2 else 'answer/')
    user_to_update = []

    print('user_data::::::::::::::::::::::')
    print(user_data)
    # print('type')
    # print(type)

    if type:
        pass
    # for user in user_data:
    #     temp_link = link
    #     env_user = next((sub for sub in env_users if sub['type_user'] == user['type_user'] and sub['user'] == user['id'] and sub['approver'] == (type == 0)), None)
    #     print('env_user::::::::::::::::')
    #     print(env_user)
    #     if env_user:
    #         answer_user = Answer_Envelope_User.objects.filter(answer_envelope__envelope_version=env_ver_val, envelope_user_id=env_user['id']).last()
    #         temp_link += str(answer_user.token_link)
    #         limit_time = str(env_user['limit_time']).split(',')
    #         limit_time_text = None
    #         if limit_time and limit_time[0] == '1' and len(limit_time[1].split(':')) == 2:
    #             limit_time[1] = limit_time[1].split(':')
    #             limit_time_text = 'Tienes ' + limit_time[1][0] + ' horas y ' + limit_time[1][1] + ' minutos para ' + action + ' el sobre.'
    #         elif limit_time and limit_time[0] == '2' and env_ver_val.limit_date:
    #             temp_date = env_ver_val.limit_date
    #             limit_time_text = 'Tienes hasta el ' + temp_date.strftime('%Y/%m/%d') + ' a las ' + temp_date.strftime('%I:%M% p') + ' para ' + action + ' el sobre.'
    #         html_template = ('<table>' +
    #             '<tr><td>Sobre</td><td>' + envelope_val.name + '</td></tr>'+
    #             ('<tr><td>Limite de Tiempo</td><td>' + limit_time_text + '</td></tr>' if limit_time_text else '') +
    #             ('<tr><td>Link</td><td>' + temp_link + '</td></tr>') +
    #             '</table>')
    #         text_template = ('Sobre: '+ envelope_val.name + ' ' +
    #             (limit_time_text if limit_time_text else '') + ' ' +
    #             'Link:' + temp_link)
    #         send_email('Notificación de Sobre', '', user['email'], html_template)
    #         if env_ver_val.sms:
    #             Sms.send(
    #                 user['phone'],
    #                 text_template,
    #                 user['phone_ind'] if 'phone_ind' in user else None
    #             )
    #         if env_ver_val.ws:
    #             send_whatsapp_msg(
    #                 user['phone'],
    #                 envelope_val.user.enterprise.name,
    #                 envelope_val.name,
    #                 link,
    #                 '',
    #                 user['phone_ind'] if 'phone_ind' in user else None,
    #                 template,
    #             )
    #         user_to_update.append(answer_user.id)
    # print(user_to_update)
    # if user_to_update:
    #     if type in [0, 1]:
    #         # Envelope_User.objects.filter(id__in=user_to_update).update(send_time=datetime.now())
    #         print('Aqui por el de answer - notification....')
    #     elif type == 2:
    #         print('Aqui por el de answer - checker....')
    #         Envelope_User_Verified.objects.filter(answer_envelope_user_id__in=user_to_update).update(send_time=datetime.now())


@api_view(['GET'])
def get_envelope_token(request, option, answer, token):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST

    try:
        if option == 1:
            # Diligenciador
            answer_link_val = Answer_Envelope_User.objects.get(
                answer_envelope__token_link=answer,
                token_link=token
            )
        elif option == 2:
            # Aprobador
            answer_envelope_approve_val = Answer_Envelope_Approve.objects.get(
                answer_envelope_user__answer_envelope__token_link=answer,
                token_link=token
            )
            answer_link_val = answer_envelope_approve_val.answer_envelope_user
        elif option == 3:
            # Verificados
            answer_envelope_verified_val = Answer_Envelope_Verified.objects.get(
                answer_envelope_user__answer_envelope__token_link=answer,
                token_link=token
            )
            answer_link_val = answer_envelope_verified_val.answer_envelope_user
        elif option == 4:
            # Verificador
            answer_envelope_checker_val = Answer_Envelope_Checker.objects.get(
                answer_envelope_user__answer_envelope__token_link=answer,
                token_link=token
            )
            answer_link_val = answer_envelope_checker_val.answer_envelope_user

        envelope_version_val = answer_link_val.answer_envelope.envelope_version
        envelope_user_val = answer_link_val.envelope_user
        enterprise_val = envelope_version_val.envelope_enterprise.user.enterprise
        envelope_name = envelope_version_val.envelope_enterprise.name
        variable_footer = Variable_Plataform.objects.get(name="footer")

        response['envelope'] = {
            'id': envelope_version_val.envelope_enterprise_id,
            'user': envelope_user_val.id,
        }

        response['enterprise'] = {
            'id': enterprise_val.id,
            'name': enterprise_val.name,
            'logo': [settings.URL + 'media/', str(enterprise_val.logo)],
            'footer': variable_footer.value,
            'envelope': envelope_name,
            'theme': enterprise_val.theme_id,
            'colorB':enterprise_val.public_color,
            'colorBT':enterprise_val.public_color_Text,
            'colorBTP':enterprise_val.public_color_text_title,
            'colorBF':enterprise_val.public_color_footer,
            'colorBFT':enterprise_val.public_color_footer_title,
            'colorBTPH':enterprise_val.public_color_header_title,
        }

        # Condicionales
        response['validation'] = True
        if option == 1:
            # Diligenciador
            response['envelope']['answer'] = answer_link_val.id
            response['envelope']['type_user'] = answer_link_val.type_user

            if answer_link_val.state:
                # Si ya existe respuesta
                response['validation'] = False
                response['message'] = {
                    'title': 'URL utilizada...',
                    'text': 'Esta URL ya no es valida'
                }
            elif envelope_version_val.order_important and envelope_user_val.position > 0:
                envelope_user_values = Envelope_User.objects.filter(
                    envelope_version=envelope_version_val,
                    state=True
                ).values_list('id', flat=True).order_by('position')
                # Lista de participantes y participante anterior
                envelope_user_values = list(envelope_user_values)
                index = envelope_user_values.index(envelope_user_val.id)
                user_respect = envelope_user_values[index-1]

                # ERROR EN VALIDACIÓN CUANDO ES VERIFICDOR ANTERIOR
                # # Validación de diligenciamiento
                # try:
                #     Answer_Envelope_User.objects.get(
                #         answer_envelope=answer_link_val.answer_envelope,
                #         envelope_user_id=user_respect,
                #         state=True
                #     )
                # except (Answer_Envelope_User.DoesNotExist):
                #     response['validation'] = False
                #     response['message'] = {
                #         'title': 'Falta registro...',
                #         'text': 'Mensaje de prueba falta diligenciamiento'
                #     }
        elif option == 2:
            # Aprobador
            response['envelope']['answer'] = answer_link_val.id
            if answer_envelope_approve_val.approve != None:
                # Si ya existe respuesta
                response['validation'] = False
                response['message'] = {
                    'title': 'URL utilizada...',
                    'text': 'Esta URL ya no es valida'
                }
        elif option == 3:
            # Verificados
            if answer_envelope_verified_val.status != 0:
                # Si ya existe respuesta
                response['validation'] = False
                response['message'] = {
                    'title': 'URL utilizada...',
                    'text': 'Esta URL ya no es valida'
                }
        elif option == 4:
            if answer_envelope_checker_val.state:
                # Si ya existe respuesta
                response['validation'] = False
                response['message'] = {
                    'title': 'URL utilizada...',
                    'text': 'Esta URL ya no es valida'
                }

        response['status'] = True
        status_response = status.HTTP_200_OK
    except:
        pass
    return Response(response, status=status_response)

import base64
from django.core.files.base import ContentFile

def start_verification(answer_envelope_verified_val, data):
    envelope_user_verified_values = Envelope_User_Verified.objects.filter(
        answer_envelope_user=answer_envelope_verified_val.answer_envelope_user,
        state=True
    ).order_by('type_check')

    try:
        # Guarda el documento
        format_front, imgstr_front = data['file_front'].split(';base64,') 
        ext_front = format_front.split('/')[-1]
        data_front = ContentFile(base64.b64decode(imgstr_front), name='temp.' + ext_front)

        format_back, imgstr_back = data['file_back'].split(';base64,') 
        ext_back = format_back.split('/')[-1]
        data_back = ContentFile(base64.b64decode(imgstr_back), name='temp.' + ext_back)

        answer_envelope_verified_val.identification_front = data_front
        answer_envelope_verified_val.identification_back = data_back
        answer_envelope_verified_val.save()
    except:
        pass

    for envelope_user_verified_val in envelope_user_verified_values:
        response = ''
        # ANI
        if envelope_user_verified_val.type_check == 1:
            if data['type'] == '3':
                # Cédula de ciudadanía
                response = data_ANI(data['document'])
        # Datacredito
        elif envelope_user_verified_val.type_check == 2:
            pass
        # Listas Restrictivas
        elif envelope_user_verified_val.type_check == 3:
            response = list_restric(data['document'])
        # Banco Mundial
        elif envelope_user_verified_val.type_check == 4:
            pass

        # Guardar respuesta
        try:
            field_verified_val = Field_Verified.objects.get(envelope_user_verified=envelope_user_verified_val, answer_verified=answer_envelope_verified_val)
        except (Field_Verified.DoesNotExist):
            field_verified_val = Field_Verified()
            field_verified_val.envelope_user_verified = envelope_user_verified_val
            field_verified_val.answer_verified = answer_envelope_verified_val
        field_verified_val.response = response
        field_verified_val.save()

    answer_envelope_verified_val.verified_date = datetime.now()
    answer_envelope_verified_val.status = 1
    answer_envelope_verified_val.save()

def communicate_next_participant(env_ver_val:Envelope_Version):
    env_user = Envelope_User.objects.filter(
        envelope_version=env_ver_val,
        state=True,
        # send_time=None (preguntar a la otra tabla - revisar)
    ).order_by(
        'position'
    ).values(
        'id',
        'type_user',
        'user',
        'approver',
        'limit_time',
        'token_link'
    ).first()
    if env_user:
        enterprise_id = env_ver_val.envelope_enterprise.user.enterprise_id
        envelope_val = env_ver_val.envelope_enterprise
        if env_user['type_user'] == 1:
            user_data = User_Enterprise.objects.filter(
                id__in=[env_user['user']],
                enterprise_id=enterprise_id
            ).annotate(
                type_user=Value(1,output_field=IntegerField())
            ).values('id', 'email', 'phone', 'type_user')
        elif env_user['type_user'] == 3:
            user_data = External_User.objects.filter(
                id__in=[env_user['user']],
                enterprise_id=enterprise_id
            ).annotate(
                type_user=Value(3,output_field=IntegerField())
            ).values('id', 'email', 'phone_ind', 'phone', 'type_user')
        else:
            user_data = []

        send_communication(user_data, [env_user], envelope_val, env_ver_val, 0 if env_user['approver'] else 1)

@api_view(['POST'])
def envelope_answer(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    files_data = request.FILES

    action = 1
    action_name = ' diligencio'

    try:
        answer_envelope_user_val = Answer_Envelope_User.objects.get(
            answer_envelope__token_link=data['answer_token'],
            token_link=data['envelope_token'],
            state=False
        )

        source = 1
        # 1 Web - 2 Movil
        if 'source' in data and data['source'] != '':
            source = data['source']
        # Respuesta Nueva
        answer_envelope_user_val.source = source

        if ('position' in data):
            position = json.loads(data['position'])
            answer_envelope_user_val.latitude = position['lat']
            answer_envelope_user_val.longitude = position['lon']
        if 'online' in data and data['online'] != '':
            # 0 Offline - 1 Online
            answer_envelope_user_val.online = data['online']
        answer_envelope_user_val.save()

        envelope_val = answer_envelope_user_val.answer_envelope.envelope_version.envelope_enterprise
        enterprise_id = envelope_val.user.enterprise_id
        envelope_version_val = answer_envelope_user_val.answer_envelope.envelope_version
        envelope_version_id = envelope_version_val.id
        user_val = answer_envelope_user_val.envelope_user

        user_name, user_email = get_user_name(answer_envelope_user_val, enterprise_id)

        lr_threads = save_answer_field(enterprise_id, envelope_version_id, answer_envelope_user_val, data['fields'], files_data, True, False, True)
        log_content = {
            'user': None,
            'group': 126,
            'element': answer_envelope_user_val.id,
            'action': action,
            'description': ("El participante #" + str(user_val.id) + " " + user_name + action_name + " la respuesta #" + str(answer_envelope_user_val.id) +
                " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"'),
        }

        create_traceability(log_content)
        if 'trace_token' in data and data['trace_token'] != '':
            Traceability_User.objects.filter(element=data['trace_token']).update(group=126, element=answer_envelope_user_val.id)

        generate_log("", str(data), "Información del sobre guardada:", enterprise_id, None, "1")

        subject = 'NOTIFICACIÓN OFICIAL del proceso documental ' + envelope_val.name
        html_message = ('<div>'+
            '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
            '<p style="color: #000000;">Te informamos que se acaba de completar con éxito el proceso documental <b>' + envelope_val.name +
            '</b>, cumpliendo con las normativas vigentes de certificación digital y firma electrónica, que acreditan '+
            'la correcta autenticación del documento por medio de mensajes de datos o evidencias digitales.</p>'+
        '</div>')
        send_email(subject, '', [user_email], html_message)

        answer_envelope_user_val.state = True
        answer_envelope_user_val.save()

        Thread(target=next_process_envelope, args=(envelope_version_val, answer_envelope_user_val, envelope_val, enterprise_id)).start()

        response['status'] = True
        status_response = status.HTTP_200_OK
    except (Answer_Envelope_User.DoesNotExist):
        pass
    return Response(response, status=status_response)

@api_view(['POST'])
def envelope_answer_public_contact(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data

    try:
        answer_envelope_user_val = Answer_Envelope_User.objects.get(
            type_user=5,
            answer_envelope__token_link=data['answer_token'],
            token_link=data['envelope_token'],
            state=False
        )

        answer_envelope_user_extend_values = Answer_Envelope_Extend.objects.filter(
            answer_envelope=answer_envelope_user_val.answer_envelope
        ).count()

        # Validación de cantidad configurada
        if answer_envelope_user_extend_values < answer_envelope_user_val.limit_public:
            # Datos Respuesta Original
            env_user_val = answer_envelope_user_val.envelope_user
            env_version_val = answer_envelope_user_val.answer_envelope.envelope_version
            env_enterprise_val = answer_envelope_user_val.answer_envelope.envelope_version.envelope_enterprise
            enterprise_id = env_enterprise_val.user.enterprise_id

            # Verificación/Creación de Contacto
            try:
                ext_user_val = External_User.objects.get(enterprise_id=enterprise_id, email=data['email'], phone=data['phone'], phone_ind=data['phone_ind'])
            except External_User.DoesNotExist:
                ext_user_val = External_User()
                ext_user_val.email = data['email']
                ext_user_val.enterprise_id = enterprise_id
                ext_user_val.phone = data['phone']
                ext_user_val.phone_ind = data['phone_ind'] #+57-co
                ext_user_val.name = data['name']
            ext_user_val.state = True
            ext_user_val.save()

            # Nueva respuesta
            extend_answer_envelope_val = Answer_Envelope()
            extend_answer_envelope_val.envelope_version = env_version_val
            extend_answer_envelope_val.serial_number = assing_serial(enterprise_id)
            extend_answer_envelope_val.status = 3
            extend_answer_envelope_val.save()

            token_link = Encrypt().encrypt_code(extend_answer_envelope_val.id)
            extend_answer_envelope_val.token_link = token_link
            extend_answer_envelope_val.save()

            # Relacion de respuesta Padre/Hijo
            answer_envelope_extend_val = Answer_Envelope_Extend()
            answer_envelope_extend_val.answer_envelope = answer_envelope_user_val.answer_envelope
            answer_envelope_extend_val.answer_envelope_child = extend_answer_envelope_val
            answer_envelope_extend_val.external_user = ext_user_val
            answer_envelope_extend_val.save()

            # Nueva respuesta por usuario
            extend_answer_envelope_user_val = Answer_Envelope_User()
            extend_answer_envelope_user_val.answer_envelope = extend_answer_envelope_val
            extend_answer_envelope_user_val.envelope_user = env_user_val
            extend_answer_envelope_user_val.type_user = 3
            extend_answer_envelope_user_val.user = ext_user_val.id
            extend_answer_envelope_user_val.source = 1
            extend_answer_envelope_user_val.limit_time = answer_envelope_user_val.limit_time
            extend_answer_envelope_user_val.notification_date = answer_envelope_user_val.notification_date

            extend_answer_envelope_user_val.save()

            token_link = Encrypt().encrypt_code(extend_answer_envelope_user_val.id)
            extend_answer_envelope_user_val.token_link = token_link
            extend_answer_envelope_user_val.save()

            # Trazabilidad
            # user_name, user_email = get_user_name(answer_envelope_user_val, enterprise_id)
            # log_content = {
            #     'user': None,
            #     'group': 126,
            #     'element': answer_envelope_user_val.id,
            #     'action': action,
            #     'description': ("El participante #" + str(user_val.id) + " " + user_name + action_name + " la respuesta #" + str(answer_envelope_user_val.id) +
            #         " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"'),
            # }
            # create_traceability(log_content)

            answer_envelope_user_extend_values += 1

            if answer_envelope_user_val.limit_public == answer_envelope_user_extend_values:
                answer_envelope_user_val.state = True
                answer_envelope_user_val.save()

            response['data'] = {
                'answer_token': extend_answer_envelope_val.token_link,
                'answer_user_token': extend_answer_envelope_user_val.token_link,
            }

            response['status'] = True
            status_response = status.HTTP_200_OK
        else:
            answer_envelope_user_val.state = True
            answer_envelope_user_val.save()

            status_response = status.HTTP_200_OK
            response['message'] = {
                'title': 'URL utilizada...',
                'text': 'Esta URL ya no es valida, llego al limite de participantes.'
            }

    except (Answer_Envelope_User.DoesNotExist):
        pass
    return Response(response, status=status_response)

def next_process_envelope(envelope_version_val, answer_envelope_user_val, envelope_val, enterprise_id):
    if envelope_version_val.order_important:
        envelope_user_values = Envelope_User.objects.filter(
            envelope_version=envelope_version_val,
            state=True
        ).values_list('id', flat=True).order_by('position')
        # Lista de participantes y siguiente participante
        try:
            next_process = False
            envelope_user_values = list(envelope_user_values)
            index = envelope_user_values.index(answer_envelope_user_val.envelope_user_id)

            if envelope_version_val.checker and answer_envelope_user_val.approver:
                try:
                    try:
                        checker_val = Answer_Envelope_Checker.objects.get(
                            answer_envelope_user=answer_envelope_user_val,
                        )
                        approve_val = Answer_Envelope_Approve.objects.get(
                            answer_envelope_user=answer_envelope_user_val
                        )
                        # Valida si finalizo los dos procesos para continuar con el siguiente participante
                        if checker_val.state and approve_val.approve != None:
                            next_process = True
                    except (Answer_Envelope_Checker.DoesNotExist):
                        next_process = True
                except:
                    pass
            else:
                next_process = True
            
            if next_process:
                # Validación ultimo usuario
                if index+1 >= len(envelope_user_values):
                    print('FINISHHHHHHHHHHHHH :::::::::::::::::::')
                    # Cambio de Estado de la respuesta general
                    answer_envelope_val = answer_envelope_user_val.answer_envelope
                    answer_envelope_val.status = 7
                    answer_envelope_val.save()

                    # Validación y Cambio de Estado de la respuesta Extendida
                    print('GOOD :::::::::::::::::::')
                    # Terminar proceso / Correo
                elif index+1 < len(envelope_user_values):
                    user_respect = envelope_user_values[index+1]

                    try:
                        # Valida si es parte de un flujo de respuestas
                        answer_envelope_extend_val = Answer_Envelope_Extend.objects.get(answer_envelope_child=answer_envelope_user_val.answer_envelope)

                        original_answer_envelope_next_user_val = Answer_Envelope_User.objects.get(
                            answer_envelope=answer_envelope_extend_val.answer_envelope,
                            envelope_user_id=user_respect,
                        )

                        extend_answer_envelope_user_val = Answer_Envelope_User()
                        extend_answer_envelope_user_val.answer_envelope = answer_envelope_user_val.answer_envelope
                        extend_answer_envelope_user_val.envelope_user_id = user_respect

                        # Validación tipo de usuario publico 2
                        if original_answer_envelope_next_user_val.type_user == 5:
                            extend_answer_envelope_user_val.type_user = 3
                            extend_answer_envelope_user_val.user = answer_envelope_extend_val.external_user.id
                        else:
                            extend_answer_envelope_user_val.type_user = original_answer_envelope_next_user_val.type_user
                            extend_answer_envelope_user_val.user = original_answer_envelope_next_user_val.user
                            extend_answer_envelope_user_val.user_rol = original_answer_envelope_next_user_val.user_rol

                        extend_answer_envelope_user_val.source = 1
                        extend_answer_envelope_user_val.notification_date = original_answer_envelope_next_user_val.notification_date
                        extend_answer_envelope_user_val.approver = original_answer_envelope_next_user_val.approver
                        extend_answer_envelope_user_val.limit_time = original_answer_envelope_next_user_val.limit_time
                        extend_answer_envelope_user_val.save()

                        token_link = Encrypt().encrypt_code(extend_answer_envelope_user_val.id)
                        extend_answer_envelope_user_val.token_link = token_link
                        extend_answer_envelope_user_val.save()

                        if extend_answer_envelope_user_val.approver:
                            answer_envelope_approve_val = Answer_Envelope_Approve()
                            answer_envelope_approve_val.answer_envelope_user = extend_answer_envelope_user_val
                            answer_envelope_approve_val.save()

                            token_link = Encrypt().encrypt_code(answer_envelope_approve_val.id)
                            answer_envelope_approve_val.token_link = token_link
                            answer_envelope_approve_val.save()

                        # Se valida si es un verificador
                        try:
                            checker_val = Answer_Envelope_Checker.objects.get(
                                answer_envelope_user=original_answer_envelope_next_user_val,
                            )

                            answer_envelope_checker_val = Answer_Envelope_Checker()
                            answer_envelope_checker_val.answer_envelope_user = extend_answer_envelope_user_val
                            answer_envelope_checker_val.save()

                            token_link = Encrypt().encrypt_code(answer_envelope_checker_val.id)
                            answer_envelope_checker_val.token_link = token_link
                            answer_envelope_checker_val.save()

                            try:
                                users_to_verify = Envelope_User_Verified.objects.filter(
                                    answer_envelope_user__answer_envelope=original_answer_envelope_next_user_val.answer_envelope,
                                    answer_envelope_user__envelope_user__state=True,
                                    state=True,
                                ).order_by('id').values_list(
                                    'answer_envelope_user_id',
                                    flat=True
                                )
                                users_to_verify = list(users_to_verify)

                                original_answer_envelope_verified_val = Answer_Envelope_Verified.objects.get(
                                    answer_envelope_user_id__in=users_to_verify,
                                    answer_envelope_user__type_user=5,
                                    answer_envelope_user__user=None,
                                    answer_envelope_user__envelope_user__state=True,
                                )

                                extend_first_answer_envelope_user = Answer_Envelope_User.objects.filter(
                                    answer_envelope=answer_envelope_user_val.answer_envelope,
                                    type_user=3,
                                    user=answer_envelope_extend_val.external_user.id,
                                    envelope_user__state=True,
                                ).first()

                                # En caso de que exista validación para publico 2 crea las información de la tabla para el flujo
                                if extend_first_answer_envelope_user:
                                    answer_envelope_verified_val = Answer_Envelope_Verified()
                                    answer_envelope_verified_val.answer_envelope_user = extend_first_answer_envelope_user
                                    answer_envelope_verified_val.save()

                                    token_link = Encrypt().encrypt_code(answer_envelope_verified_val.id)
                                    answer_envelope_verified_val.token_link = token_link
                                    answer_envelope_verified_val.save()

                                    envelope_user_verified_values = Envelope_User_Verified.objects.filter(
                                        answer_envelope_user=original_answer_envelope_verified_val.answer_envelope_user,
                                        state=True
                                    )

                                    for envelope_user_verified_val in envelope_user_verified_values:
                                        user_verified_val = Envelope_User_Verified()
                                        user_verified_val.answer_envelope_user = extend_first_answer_envelope_user
                                        user_verified_val.type_check = envelope_user_verified_val.type_check
                                        user_verified_val.save()

                            except (Answer_Envelope_Verified.DoesNotExist):
                                pass

                            # Cuando tiene un proceso de verificación solo se envia una vez por respuesta principal
                            if not checker_val.state:
                                send_communication_verified(answer_envelope_extend_val.answer_envelope, checker_val, True)
                                checker_val.state = True
                                checker_val.save()

                        except (Answer_Envelope_Checker.DoesNotExist):
                            pass

                        # Se reasigna el siguinte participante.
                        answer_envelope_next_user_val = extend_answer_envelope_user_val

                    except Answer_Envelope_Extend.DoesNotExist:
                        answer_envelope_next_user_val = Answer_Envelope_User.objects.get(
                            answer_envelope=answer_envelope_user_val.answer_envelope,
                            envelope_user_id=user_respect,
                            state=False
                        )

                    if answer_envelope_next_user_val.type_user in [4,5]:
                        send_communication_answer_public(answer_envelope_user_val.answer_envelope, answer_envelope_next_user_val, envelope_val, enterprise_id)
                    else:
                        checker_process = False
                        if envelope_version_val.checker:
                            try:
                                # Envio a usuario verificador, envio a todos los usuarios a ser verificados para iniciar el proceso de verificacion.
                                checker_next_val = Answer_Envelope_Checker.objects.get(
                                    answer_envelope_user=answer_envelope_next_user_val,
                                )
                                checker_process = True
                                send_communication_verified(answer_envelope_user_val.answer_envelope, checker_next_val)
                            except (Answer_Envelope_Checker.DoesNotExist):
                                pass

                        if answer_envelope_next_user_val.approver:
                            send_communication_approve(answer_envelope_user_val.answer_envelope, answer_envelope_next_user_val, envelope_val, enterprise_id)
                        elif not checker_process:
                            send_communication_answer(answer_envelope_user_val.answer_envelope, answer_envelope_next_user_val, envelope_val, enterprise_id)
        except:
            pass

@api_view(['POST'])
def envelope_approve(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data

    if 'approve' in data:
        action = 31
        action_name = ' aprobo'
        if data['approve'] == '0':
            action = 32
            action_name = ' desaprobo'

        try:
            answer_envelope_approve_val = Answer_Envelope_Approve.objects.get(
                answer_envelope_user__answer_envelope__token_link=data['answer_token'],
                token_link=data['envelope_token']
            )
            answer_envelope_user_val = answer_envelope_approve_val.answer_envelope_user

            # Guardado de los datos recibidos
            if data['approve'] == '1':
                answer_envelope_approve_val.approve = True
            else:
                answer_envelope_approve_val.approve = False
                answer_envelope_approve_val.comment = data['comment']
            answer_envelope_approve_val.approve_date = datetime.now()
            answer_envelope_approve_val.save()

            source = 1
            # Respuesta Nueva
            answer_envelope_user_val.source = source

            if ('position' in data):
                position = json.loads(data['position'])
                answer_envelope_user_val.latitude = position['lat']
                answer_envelope_user_val.longitude = position['lon']

            answer_envelope_user_val.state = True
            answer_envelope_user_val.save()

            envelope_val = answer_envelope_user_val.answer_envelope.envelope_version.envelope_enterprise
            enterprise_id = envelope_val.user.enterprise_id
            user_val = answer_envelope_user_val.envelope_user
            envelope_version_val = answer_envelope_user_val.answer_envelope.envelope_version

            user_name, user_email = get_user_name(answer_envelope_user_val, enterprise_id)

            log_content = {
                'user': None,
                'group': 126,
                'element': answer_envelope_user_val.id,
                'action': action,
                'description': ("El participante #" + str(user_val.id) + " " + user_name + action_name + " la respuesta #" +
                    str(answer_envelope_user_val.answer_envelope.id) +
                    " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"'),
            }

            # User email
            email= []
            user_envelope_val = envelope_val.user
            user_envelope_name = user_envelope_val.first_name + " " + user_envelope_val.first_last_name
            email.append(user_envelope_val.email)
            subject = 'Proceso documental ' + envelope_val.name

            if data['approve'] == '1':
                subject += ' - ¡APROBADO!'
                html_message = ('<div>'+
                    '<h2 style="color: #444444;">¡Hola ' + user_envelope_name + '!</h2>'+
                    '<p style="color: #000000;">Te informamos que el proceso documental ' + envelope_val.name + ' ha sido determinado como APROBADO por el usuario:</p>'+
                    '<label for="">' + user_name + ' - ' + user_email + '</label>'+
                '</div><hr style="background: #412378; height: 2px;">')
            else:
                subject += ' - NO APROBADO'

                html_comment = ''
                if answer_envelope_approve_val.comment != '':
                    comments = json.loads(answer_envelope_approve_val.comment)
                    for comment in comments:
                        html_comment += '<p style="color: #444444;">' + comment['value'] + '</p>'

                html_message = ('<div>'+
                    '<h2 style="color: #444444;">¡Hola ' + user_envelope_name + '!</h2>'+
                    '<p style="color: #000000;">Te informamos que el proceso documental ' + envelope_val.name + ' ha sido determinado como NO APROBADO por el usuario:</p>'+
                    '<label for="">' + user_name + ' - ' + user_email + '</label>'+
                    '<hr style="background: #412378; height: 2px;"><div style="text-align: initial;">'+
                    '<p style="color: #000000;">Con las siguientes anotaciones:</p>' + html_comment + '</div>'+
                '</div>')
            send_email(subject, '', email, html_message)

            create_traceability(log_content)
            generate_log("", str(data), "Información del sobre guardada:", enterprise_id, None, "1")

            # next_process_envelope(envelope_version_val, answer_envelope_user_val, envelope_val, enterprise_id)
            Thread(target=next_process_envelope, args=(envelope_version_val, answer_envelope_user_val, envelope_val, enterprise_id)).start()

            response['status'] = True
            status_response = status.HTTP_200_OK
        except (Answer_Envelope_Approve.DoesNotExist):
            pass
    return Response(response, status=status_response)

@api_view(['POST'])
def envelope_verified(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data

    if 'step' in data:
        try:
            answer_envelope_verified_val = Answer_Envelope_Verified.objects.get(
                answer_envelope_user__answer_envelope__token_link=data['answer_token'],
                token_link=data['envelope_token']
            )
            answer_envelope_user_val = answer_envelope_verified_val.answer_envelope_user
            envelope_val = answer_envelope_user_val.answer_envelope.envelope_version.envelope_enterprise
            enterprise_id = envelope_val.user.enterprise_id
            user_val = answer_envelope_user_val.envelope_user

            user_name, user_email = get_user_name(answer_envelope_user_val, enterprise_id)

            log_content = {
                'user': None,
                'group': 126,
                'element': answer_envelope_user_val.id,
                'action': '',
                'description': '',
            }

            if data['step'] == '1' and 'checker_td' in data:
                # Guardado de los datos recibidos
                if data['checker_td'] == '1':
                    action = 33
                    action_name = ' autoriza'
                    answer_envelope_verified_val.checker_td = True
                else:
                    action = 34
                    action_name = ' no autoriza'
                    answer_envelope_verified_val.checker_td = False
                answer_envelope_verified_val.checker_date = datetime.now()
                answer_envelope_verified_val.save()

                log_content['action'] = action
                log_content['description'] = ("El participante #" + str(user_val.id) + " " + user_name + action_name +
                    " tratamiento de datos personales en la respuesta #" + str(answer_envelope_user_val.answer_envelope.id) +
                    " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"')

                response['data'] = {
                    'name': user_name
                }
            elif data['step'] == '2':
                data_doc = {
                    'type': data['type'],
                    'document': data['doc'],
                    'file_front': data['src_front'],
                    'file_back': data['src_back'],
                }
                new_thread = Thread(target=start_verification, args=(answer_envelope_verified_val, data_doc))
                new_thread.start()

                log_content['action'] = 35
                log_content['description'] = ("El participante #" + str(user_val.id) + " " + user_name +
                    " sube el documento para verificación en la respuesta #" + str(answer_envelope_user_val.answer_envelope.id) +
                    " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"')
            create_traceability(log_content)
            generate_log("", str(data), "Información del sobre guardada:", enterprise_id, None, "1")

            response['status'] = True
            status_response = status.HTTP_200_OK
        except (Answer_Envelope_Verified.DoesNotExist):
            pass
    return Response(response, status=status_response)

@api_view(['POST'])
def envelope_checker(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data

    if 'step' in data:
        try:
            answer_envelope_checker_val = Answer_Envelope_Checker.objects.get(
                answer_envelope_user__answer_envelope__token_link=data['answer_token'],
                token_link=data['envelope_token']
            )
            answer_envelope_user_val = answer_envelope_checker_val.answer_envelope_user
            envelope_val = answer_envelope_user_val.answer_envelope.envelope_version.envelope_enterprise
            enterprise_id = envelope_val.user.enterprise_id
            user_val = answer_envelope_user_val.envelope_user
            envelope_version_val = answer_envelope_user_val.answer_envelope.envelope_version

            user_name, user_email = get_user_name(answer_envelope_user_val, enterprise_id)

            log_content = {
                'save': True,
                'user': user_val.id,
                'group': 126,
                'element': answer_envelope_user_val.id,
                'action': '',
                'description': '',
            }

            if data['step'] == '1' and 'token' in data:
                # Validación de Token de 6 dígitos
                action = 36
                if str(answer_envelope_checker_val.token) == data['token']:
                    validate = True
                    action_name = ' valido'
                else:
                    validate = False
                    action_name = ' no valido'

                log_content['action'] = action
                log_content['description'] = ("El participante #" + str(user_val.id) + " " + user_name + action_name +
                    " el token de 6 dígitos para verificador en la respuesta #" + str(answer_envelope_user_val.answer_envelope.id) +
                    " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"')

                response['data'] = {
                    'validate': validate
                }
            elif data['step'] == '2':
                # Obtener Datos
                log_content['save'] = False

                checked_list = []
                extend_process = False
                try:
                    # Valida si es parte de un flujo de respuestas
                    answer_envelope_extend_val = Answer_Envelope_Extend.objects.get(answer_envelope_child=answer_envelope_user_val.answer_envelope)
                    extend_process = True
                except (Answer_Envelope_Extend.DoesNotExist):
                    pass
                
                users_to_verify = Envelope_User_Verified.objects.filter(
                    state=True,
                    answer_envelope_user__envelope_user__state=True
                )

                if extend_process:
                    users_to_verify = users_to_verify.filter(
                        Q(answer_envelope_user__answer_envelope_id=answer_envelope_user_val.answer_envelope.id) 
                        | Q(answer_envelope_user__answer_envelope_id=answer_envelope_extend_val.answer_envelope.id),
                    ).exclude(
                        answer_envelope_user__type_user=5,
                        answer_envelope_user__user=None,
                    )
                else:
                    users_to_verify = users_to_verify.filter(answer_envelope_user__answer_envelope_id=answer_envelope_user_val.answer_envelope.id)
                
                users_to_verify = users_to_verify.order_by('id').values_list(
                    'answer_envelope_user_id',
                    flat=True
                )
                users_to_verify = list(users_to_verify)
                user_verified_values = Answer_Envelope_Verified.objects.filter(
                    answer_envelope_user_id__in=users_to_verify
                ).order_by('id')

                for user_verified_val in user_verified_values:
                    user_name_verified, user_email_verified = get_user_name(user_verified_val.answer_envelope_user, enterprise_id)

                    checker_values = list(
                        Envelope_User_Verified.objects.filter(
                            answer_envelope_user=user_verified_val.answer_envelope_user,
                            state=True
                        ).values_list(
                        'type_check',
                        flat=True)
                    )
                    checked_list.append({
                        'id': user_verified_val.id,
                        'name': user_name_verified,
                        'checker': checker_values,
                        'status': user_verified_val.status,
                        'verified': user_verified_val.verified,
                        'src_front': settings.URL + 'media/' + str(user_verified_val.identification_front),
                        'src_back': settings.URL + 'media/' + str(user_verified_val.identification_back),
                    })

                response['data'] = checked_list
            elif data['step'] == '3':
                # Aceptar o Rechazar participantes de verificados
                if 'verified' in data:
                    action = 39
                    action_name = ' acepta'
                    if data['verified'] == '0':
                        action = 40
                        action_name = ' rechaza'

                    extend_process = False
                    try:
                        # Valida si es parte de un flujo de respuestas
                        answer_envelope_extend_val = Answer_Envelope_Extend.objects.get(answer_envelope_child=answer_envelope_user_val.answer_envelope)
                        extend_process = True
                    except (Answer_Envelope_Extend.DoesNotExist):
                        pass
                    
                    answer_envelope_verified_val = Answer_Envelope_Verified.objects.get(
                        id=data['id']
                    )
                    # answer_envelope_user__answer_envelope__token_link=data['answer_token'],

                    # Validaciones extras de seguridad
                    if ((extend_process and answer_envelope_verified_val.answer_envelope_user.answer_envelope_id == answer_envelope_extend_val.answer_envelope_id) 
                        or answer_envelope_verified_val.answer_envelope_user.answer_envelope.token_link == data['answer_token']):

                        # Guardado de los datos recibidos
                        if data['verified'] == '1':
                            answer_envelope_verified_val.verified = True
                        else:
                            answer_envelope_verified_val.verified = False
                            answer_envelope_verified_val.comment = data['comment']
                        answer_envelope_verified_val.checker_date = datetime.now()
                        answer_envelope_verified_val.save()

                        user_name_verified, user_email_verified = get_user_name(answer_envelope_verified_val.answer_envelope_user, enterprise_id)

                        log_content['action'] = action
                        log_content['description'] = ("El verificador #" + str(user_val.id) + " " + user_name + action_name + 
                            " verificación del participante " + user_name_verified +
                            " de la respuesta #" + str(answer_envelope_user_val.answer_envelope.id) +
                            " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"')

            elif data['step'] == '4':
                # Envio de correos y Finalización
                
                answer_envelope_checker_val.state = True
                answer_envelope_checker_val.save()

                log_content['action'] = 41
                log_content['description'] = ("El verificador #" + str(user_val.id) + " " + user_name + 
                    " finaliza verificación de la respuesta #" + str(answer_envelope_user_val.answer_envelope.id) +
                    " del sobre #" + str(envelope_val.id) + ' "' + envelope_val.name + '"')
                
                try:
                    checked_list = []
                    users_to_verify = Envelope_User_Verified.objects.filter(
                        answer_envelope_user__answer_envelope_id=answer_envelope_user_val.answer_envelope.id,
                        state=True,
                        answer_envelope_user__envelope_user__state=True
                    ).order_by('id').values_list(
                        'answer_envelope_user_id',
                        flat=True
                    )
                    users_to_verify = list(users_to_verify)
                    user_verified_values = Answer_Envelope_Verified.objects.filter(
                        answer_envelope_user_id__in=users_to_verify
                    ).order_by('id')

                    Thread(target=finish_email_verified, args=(user_verified_values, user_name, user_email, envelope_val, enterprise_id)).start()
                    Thread(target=next_process_envelope, args=(envelope_version_val, answer_envelope_user_val, envelope_val, enterprise_id)).start()
                except:
                    pass

            if log_content['save']:
                create_traceability(log_content)
            generate_log("", str(data), "Información del sobre guardada:", enterprise_id, None, "1")

            response['status'] = True
            status_response = status.HTTP_200_OK
        except (Answer_Envelope_Checker.DoesNotExist):
            pass
        except:
            pass
    return Response(response, status=status_response)

def finish_email_verified(user_verified_values, user_name, user_email, envelope_val, enterprise_id):
    html_users = ''
    for user_verified_val in user_verified_values:
        user_name_verified, user_email_verified = get_user_name(user_verified_val.answer_envelope_user, enterprise_id)
        html_users += '<p style="color: #444444;">' + user_name_verified + '</p>'

        subject = '¡Tenemos una noticia para ti! '
        if user_verified_val.verified:
            subject += 'VERIFICACIÓN COMPLETADA'
            html_message = ('<div>'+
                '<h2 style="color: #444444;">¡Hola ' + user_name_verified + '!</h2>'+
                '<p style="color: #000000;">¡Tenemos una noticia para ti!</p>'+
                '<p style="color: #000000;">En el proceso documental <b>' + envelope_val.name +
                '</b>, la VERIFICACIÓN de tu participación ha sido completada de forma exitosa.</p>'+
            '</div>')
        else:
            subject += 'VERIFICACIÓN NO COMPLETADA'
            html_comment = ''
            if user_verified_val.comment != '':
                comments = json.loads(user_verified_val.comment)
                for comment in comments:
                    html_comment += '<p style="color: #444444;">' + comment['value'] + '</p>'

            html_message = ('<div>'+
                '<h2 style="color: #444444;">¡Hola ' + user_name_verified + '!</h2>'+
                '<p style="color: #000000;">¡Tenemos una noticia para ti!</p>'+
                '<p style="color: #000000;">En el proceso documental <b>' + envelope_val.name + 
                '</b>, la VERIFICACIÓN no se ha podido completar de forma satisfactoria.</p>'+
                '<p style="color: #000000;">Revisa las anotaciones y contacta con el autor del '+
                'proceso documental para tomar decisiones al respecto.</p>'+
                '<label for="">TRANQUILO, SOLO TÚ Y EL AUTOR DEL DOCUMENTO CONOCEN ESTA INFORMACIÓN</label>'+
                '<hr style="background: #412378; height: 2px;"><div style="text-align: initial;">'+
                '<p style="color: #000000;">Con las siguientes anotaciones:</p>' + html_comment + '</div>'+
            '</div>')
        send_email(subject, '', [user_email_verified], html_message)

    # Falta participantes y la linea
    subject = '¡Gracias por cumplir con la responsabilidad de VERIFICACIÓN!'
    html_message = ('<div>'+
        '<h2 style="color: #444444;">¡Hola ' + user_name + '!</h2>'+
        '<p style="color: #000000;">¡Gracias por cumplir con la responsabilidad asignada!</p>'+
        '<p style="color: #000000;">Estos son los participantes que han sido informados sobre tu revisión y decisión:</p>'+
        html_users +
    '</div><hr style="background: #412378; height: 2px;">')

    send_email(subject, '', [user_email], html_message)

@api_view(['POST'])
def checker_file_verified(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data

    if 'id' in data and 'check' in data:
        try:
            answer_envelope_checker_val = Answer_Envelope_Checker.objects.get(
                answer_envelope_user__answer_envelope__token_link=data['answer_token'],
                token_link=data['envelope_token']
            )
            answer_envelope_user_val = answer_envelope_checker_val.answer_envelope_user
            envelope_val = answer_envelope_user_val.answer_envelope.envelope_version.envelope_enterprise
            enterprise_id = envelope_val.user.enterprise_id
            user_val = answer_envelope_user_val.envelope_user

            field_verified = Field_Verified.objects.get(
                envelope_user_verified__type_check=data['check'],
                envelope_user_verified__state=True,
                answer_verified_id=data['id']
            )

            if field_verified.response != '':
                data_verified = json.loads(field_verified.response.replace("'", '"'))

                info = {
                    'envelope': envelope_val.name,
                    'creation_date': field_verified.creation_date,
                    'solicitude_date': field_verified.creation_date,
                    'data_verified': data_verified
                }

                template = render_to_string('verified.html', context={
                    'logo': settings.URL+'media/'+str(envelope_val.user.enterprise.logo) if envelope_val.user.enterprise.logo else 'https://desarrolladorsaroa.github.io/Styles/descarga.jpg',
                    'info': info
                })
                
                html_string = template
                pdf = HTML(string=html_string).write_pdf()
                result = HttpResponse(pdf, content_type='application/pdf')
                return result
        
        except (Answer_Envelope_Checker.DoesNotExist):
            pass
    return Response(response, status=status_response)

def get_user_name(answer_envelope_user_val, enterprise_id):
    user_name = "indefinido"
    user_email = ""
    try:
        if answer_envelope_user_val.type_user == 1:
            user_enterprise = User_Enterprise.objects.get(id=answer_envelope_user_val.user, enterprise_id=enterprise_id)
            user_name = user_enterprise.first_name + " " + user_enterprise.first_last_name
            user_email = user_enterprise.email
        elif answer_envelope_user_val.type_user == 2 and answer_envelope_user_val.user_rol:
            user_name = answer_envelope_user_val.user_rol.first_name + " " + answer_envelope_user_val.user_rol.first_last_name
            user_email = answer_envelope_user_val.user_rol.email
        elif answer_envelope_user_val.type_user == 3:
            user_external = External_User.objects.get(id=answer_envelope_user_val.user, enterprise_id=enterprise_id)
            user_name = user_external.name
            user_email = user_external.email
    except:
        pass
    return user_name, user_email