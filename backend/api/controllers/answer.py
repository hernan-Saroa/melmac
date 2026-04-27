# rest_framework
from api.controllers.notification import send_email_signers_admin, list_restric
from api.util import create_qr
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from api.permissions import IsUserAdminOrHasPermission, IsSuperAdmin
from rest_framework.permissions import IsAuthenticated
# models
from django.db.models.functions import Concat
from django.db.models import F, Q, Value, CharField
from api.models import (
    Answer_Consecutive,
    Answer_Envelope_User,
    Answer_Envelope_Field,
    Answer_Field,
    Answer_Form,
    Answer_Form_Consecutive,
    Digital_Field,
    Env_Form_Field,
    Env_Option_Field,
    Field_User,
    Document_Without_Sing,
    Form_Consecutive,
    Form_Digital,
    Form_Enterprise,
    Form_Field,
    Field_Condition,
    Form_Field_Parameter,
    Form_Link,
    Form_Version,
    List_Field,
    Massive_File,
    Massive_Zip_Pdf,
    Visit_Task_Answer_Form,
    Option,
    Option_Field,
    Option_List_Field,
    Role_Form,
    Sign_OTP_Document,
    Sign_Profile_Document,
    Profile_document,
    Serial_Number,
    Service_Location,
    Signed_Document_Consecutive,
    User_Enterprise,
    Signed_Document,
    Variable_Plataform,
    sign_doc_directory_path,
    template_directory_zip_path,
    Traceability_User,
    Document_Identification,
    Role_Enterprise,
    Permit_Role,
    Sign_Email,
    User_Form,
    Validate_Answer_Form,
    Form_Temporal_Digital,
)
# others
from api.controllers.traceability import create_traceability, generate_log
from api.controllers.system_log import register_log, traceback
from api.util import EcciSigner, ExcelFormater, GSESigner
from api.data import COUNTRYS_DATA_DICT, COUNTRYS_DATA_DICT_VALUES, IDENTIFICATION
from django.conf import settings
from django.core.exceptions import ValidationError
from datetime import datetime, timedelta
# from django_xhtml2pdf.utils import generate_pdf
from django.http import HttpResponse
from django.shortcuts import render
from django.template.loader import render_to_string
from itertools import chain
# from PyPDF2 import PdfFileWriter, PdfFileReader
from threading import Thread
# from weasyprint import HTML
from api.controllers.site import get_nit_info, get_ani_external
from PIL import Image, ImageDraw, ImageFont
import base64
# import fpdf
import hashlib
import itertools
import json
import os
import pandas
import pytz
import subprocess
import sys
import string
import zipfile
import shutil
import imghdr
import requests

TZ_INFO = pytz.timezone('America/Bogota')

def assing_values_answer(answer, form=None, consecutive=None, user=None):
    """Este metodo se creo para ser un auxiliar para la asignación de datos
    quitados de las consultas de respuesta, los cuales son :
    - id_form
    - name_form
    - digital
    - consecutive
    - created_by__first_name
    - created_by__first_last_name

    Args:
        answer (dict): La actual iteración de respuestas formulario o respuestas consecutivas.
        form (dict, optional): Si es un formulario de sección unica se le asigna los valores que se contengan en este diccionario. Defaults to None.
        consecutive (dict, optional): Si es un formulario consecutivo se le asigna los valores que se contengan en este diccionario. Defaults to None.
        user (dict, optional): Datos correspondientes a quien diligencio el documento. Defaults to None.

    Returns:
        dict: Se devuelve la estructura de la actual iteración incluyendo los cambios que le hacen falta para una lectura correcta en el front.
    """

    if (form):
        answer['id_form'] = answer['form_enterprise_id']
        answer['name_form'] = form['name']
        answer['digital'] = form['digital']
        answer['consecutive'] = False
    elif (consecutive):
        answer['id_form'] = consecutive['id']
        answer['name_form'] = consecutive['name']
        answer['digital'] = consecutive['digital']
        answer['consecutive'] = True

    if user:
        answer['created_by__first_name'] = user['first_name']
        answer['created_by__first_last_name'] = user['first_last_name']
    else:
        answer['created_by__first_name'] = 'Usuario'
        answer['created_by__first_last_name'] = 'Público'

    return answer

class AnswerList(APIView):
    """
    API endpoint que permite la consulta de los formularios y la creación de nuevos.
    """
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, format=None, state=1):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        x_count = 0
        req_data = request.GET
        try:
            page = int(req_data['_page']) if '_page' in req_data else 1
            limit = int(req_data['_limit']) if '_limit' in req_data else 10
            state = True if state == 1 else False
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

            # Informacion de Formularios de sección única
            form_values = Form_Enterprise.objects.filter(
                enterprise_id=user_val.enterprise_id,
                consecutive=False,
            ).values(
                'id',
                'name',
                'digital'
            )

            # Reestructuración a Diccionario para facilitar acceso
            form_values = { form['id']: form for form in list(form_values) }

            # Informacion de Formularios consecutivos
            consecutive_form_values = Form_Enterprise.objects.filter(
                enterprise_id=user_val.enterprise_id,
                consecutive=True,
                visible=True,
                state=state
            ).values('id', 'name', 'consecutive', 'digital')

            # Reestructuración a Diccionario para facilitar acceso
            consecutive_form_values = { consecutive['id']: consecutive for consecutive in list(consecutive_form_values) }

            # Condicional para administrador de empresa
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:

                # Información de usuarios en la empresa que podian diligenciar los formularios
                user_values = User_Enterprise.objects.filter(
                    enterprise_id=user_val.enterprise_id
                ).values(
                    'id',
                    'first_name',
                    'first_last_name'
                )

                # Reestructuración a Diccionario para facilitar acceso
                user_values = { user['id']: user for user in list(user_values) }

                # Consulta de Respuestas de una sola sección
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__enterprise_id=user_val.enterprise_id,
                    consecutive=False,
                )

                if state:
                    answer_values = answer_values.filter(
                        form_enterprise__state=True,
                        state=True
                    )
                else:
                    answer_values = answer_values.filter(
                        Q(form_enterprise__state=False) | Q(form_enterprise__state=True, state=False),
                    )

                answer_values = answer_values.values(
                    'id',
                    'form_enterprise_id',
                    'created_by_id',
                    'source',
                    'public',
                    'online',
                    'latitude',
                    'longitude',
                    'creation_date'
                ).order_by('-creation_date')

                # Consulta de Respuestas de consecutivos
                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__enterprise_id=user_val.enterprise_id,
                )
                if state:
                    consecutive_values = consecutive_values.filter(
                        form_consecutive__state=True,
                        state=True
                    )
                else:
                    consecutive_values = consecutive_values.filter(
                        Q(form_consecutive__state=False) | Q(form_consecutive__state=True, state=False),
                    )

                consecutive_values = consecutive_values.values(
                    'id',
                    'form_consecutive_id',
                    'created_by_id',
                    'source',
                    'public',
                    'online',
                    'latitude',
                    'longitude',
                    'creation_date'
                ).order_by('-creation_date')
            else:  # Condicional para el resto de la empresa

                # Estructura auxiliar para creados por una persona en especifico
                user_values = {
                    user_val.id: {
                        'first_name': user_val.first_name,
                        'first_last_name': user_val.first_last_name,
                    }
                }

                # Consulta de Respuestas de una sola sección creados por el usuario que consulta
                answer_values = Answer_Form.objects.filter(
                    created_by=user_val,
                    consecutive=False,
                )
                if state:
                    answer_values = answer_values.filter(
                        form_enterprise__state=True,
                        state=True
                    )
                else:
                    answer_values = answer_values.filter(
                        Q(form_enterprise__state=False) | Q(form_enterprise__state=True, state=False),
                    )

                answer_values = answer_values.values(
                    'id',
                    'form_enterprise_id',
                    'created_by_id',
                    'source',
                    'public',
                    'online',
                    'latitude',
                    'longitude',
                    'creation_date'
                ).order_by('-creation_date')

                # Consulta de Respuestas de consecutivos creados por el usuario que consulta
                consecutive_values = Answer_Consecutive.objects.filter(
                    created_by=user_val,
                )
                if state:
                    consecutive_values = consecutive_values.filter(
                        form_consecutive__state=True,
                        state=True
                    )
                else:
                    consecutive_values = consecutive_values.filter(
                        Q(form_consecutive__state=False) | Q(form_consecutive__state=True, state=False),
                    )

                consecutive_values = consecutive_values.values(
                    'id',
                    'form_consecutive_id',
                    'created_by_id',
                    'source',
                    'public',
                    'online',
                    'latitude',
                    'longitude',
                    'creation_date'
                ).order_by('-creation_date')

            # union de datos, se utiliza el método assing_values para asignar los datos que se quitaron de la consulta y no afecte la estructura ya definida para el frontend
            data_values = [
                assing_values_answer(
                    answer,
                    form_values[answer['form_enterprise_id']] if 'form_enterprise_id' in answer and answer['form_enterprise_id'] in form_values else None,
                    consecutive_form_values[answer['form_consecutive_id']] if 'form_consecutive_id' in answer and answer['form_consecutive_id'] in consecutive_form_values else None,
                    user_values[answer['created_by_id']] if answer['created_by_id'] in user_values else None
                ) for answer in chain(answer_values, consecutive_values)]

            data_values = sorted(data_values, key=lambda k: k['creation_date'], reverse=True)
            x_count = len(data_values)

            response['status'] = True
            response['data'] = (data_values[(page-1)*limit:page*limit])
            response['x-total-count'] = x_count

            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def post(self, request, format=None):

        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST

        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        data = request.data
        files_data = request.FILES
        offline_consecutive = False
        ans_con_id = False
        form_con_id = False

        try:
            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': data['form'],
                'action': 30,
                'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                    user_val.first_last_name + ' realiza petición de envio de respuesta' +
                    " del documento #" + str(data['form'])),
            }
            create_traceability(log_content)
        except:
            pass

        action = 1
        action_name = ' diligencio'
        if 'update' in data and data['update'] != '':
            action = 2
            action_name = ' modifico'

        # Verificación de permisos
        if user_val.role_id != 2:
            if 'source' in data:
                # Movil
                try:
                    Permit_Role.objects.get(role_enterprise_id=user_val.role_enterprise_id, permit__permit_type_id=65, state=True)
                except Permit_Role.DoesNotExist:
                    response['message'] = 'No tienes permitido diligenciar desde la aplicación movil'
                    return Response(response, status_response)
            else:
                # Web
                try:
                    Permit_Role.objects.get(role_enterprise_id=user_val.role_enterprise_id, permit__permit_type_id=30, state=True)
                except Permit_Role.DoesNotExist:
                    response['message'] = 'No tienes permitido diligenciar desde la plataforma web'
                    return Response(response, status_response)


        if 'consecutive' in data and data['consecutive'] != '':
            if 'update' in data and data['update'] != '':
                # Edición de Respuesta
                try:
                    answer_consecutive_val = Answer_Consecutive.objects.get(id=data['update'], created_by=user_val)
                    answer_consecutive_val.state = True
                    answer_consecutive_val.save()
                    log_content = {
                        'user': user_val.id,
                        'group': 61,
                        'element': answer_consecutive_val.id,
                        'action': action,
                        'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                            user_val.first_last_name + action_name + " la respuesta #" + str(answer_consecutive_val.id) +
                            " del documento #" + str(answer_consecutive_val.form_consecutive_id) + ' "' +
                            answer_consecutive_val.form_consecutive.name + '"'),
                    }
                    create_traceability(log_content)
                except (Answer_Consecutive.DoesNotExist):
                    return Response(response)
            elif 'answer' in data and data['answer'] != '':
                try:
                    answer_consecutive_val = Answer_Consecutive.objects.get(id=data['answer'], created_by=user_val)
                    answer_consecutive_val.state = True
                    answer_consecutive_val.save()
                except (Answer_Consecutive.DoesNotExist):
                    return Response(response)
            else:
                # Asignación de Serial
                serial_number_val = assing_serial(user_val.enterprise_id)

                answer_consecutive_val = Answer_Consecutive()
                answer_consecutive_val.form_consecutive_id = data['consecutive']
                answer_consecutive_val.created_by = user_val
                if 'source' in data and data['source'] != '':
                    # 1 Web - 2 Movil
                    answer_consecutive_val.source = data['source']
                if 'position' in data:
                    position = json.loads(data['position'])
                    answer_consecutive_val.latitude = position['lat']
                    answer_consecutive_val.longitude = position['lon']
                if 'online' in data and data['online'] != '':
                    # 0 Offline - 1 Online
                    answer_consecutive_val.online = data['online']
                    if data['online'] == 0 or data['online'] == '0':
                        offline_consecutive = True
                answer_consecutive_val.serial_number = serial_number_val
                # Version
                if 'version_consecutive' in data:
                    answer_consecutive_val.form_version = data['version_consecutive']
                else:
                    answer_consecutive_val.form_version = answer_consecutive_val.form_consecutive.version
                answer_consecutive_val.save()

                log_content = {
                    'user': user_val.id,
                    'group': 61,
                    'element': answer_consecutive_val.id,
                    'action': action,
                    'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                        user_val.first_last_name + action_name + " la respuesta #" + str(answer_consecutive_val.id) +
                        " del documento #" + str(answer_consecutive_val.form_consecutive_id) + ' "' +
                        answer_consecutive_val.form_consecutive.name + '"'),
                }
                create_traceability(log_content)

            response['answer'] = answer_consecutive_val.id
            ans_con_id = answer_consecutive_val
            form_con_id = answer_consecutive_val.form_consecutive_id

        source = 1
        # 1 Web - 2 Movil
        if 'source' in data and data['source'] != '':
            source = data['source']

        # Guardado Online
        if not offline_consecutive:
            # Edición de Respuesta
            if 'update' in data and data['update'] != '':
                # Respuesta Multi-sección
                if 'consecutive' in data and data['consecutive'] != '':
                    try:
                        if user_val.role_id == 2:
                            answer_form_consecutive_val = Answer_Form_Consecutive.objects.get(
                                answer_consecutive_id=data['update'],
                                answer_form__form_enterprise_id=data['form'],
                                state=True
                            )
                        else:
                            answer_form_consecutive_val = Answer_Form_Consecutive.objects.get(
                                answer_consecutive_id=data['update'],
                                answer_consecutive__created_by=user_val,
                                answer_form__form_enterprise_id=data['form'],
                                state=True
                            )
                        answer_form_val = answer_form_consecutive_val.answer_form
                    except (Answer_Form_Consecutive.DoesNotExist):
                        # Nueva respuesta de consecutivo sin terminar
                        answer_form_val = Answer_Form()
                        answer_form_val.form_enterprise_id = data['form']
                        answer_form_val.created_by = user_val
                        answer_form_val.source = source
                        # Version
                        if 'version' in data:
                            answer_form_val.form_version = data['version']
                        else:
                            answer_form_val.form_version = answer_form_val.form_enterprise.version
                # Respuesta de Sección Única
                else:
                    try:
                        if user_val.role_id == 2:
                            answer_form_val = Answer_Form.objects.get(
                                id=data['update'],
                                state=True
                            )
                        else:
                            answer_form_val = Answer_Form.objects.get(
                                id=data['update'],
                                created_by=user_val,
                                state=True
                            )

                        if 'duplicate' in data and data['duplicate'] == '1':
                            # Verificación de permisos - Editar respuesta campo único
                            if user_val.role_id != 2:
                                try:
                                    Permit_Role.objects.get(role_enterprise_id=user_val.role_enterprise_id, permit__permit_type_id=70, state=True)
                                except Permit_Role.DoesNotExist:
                                    response['message'] = 'No tiene los permisos necesarios para esta acción. Por favor, comuníquese con el administrador'
                                    return Response(response, status_response)

                            try:
                                validate_answer_form_val = Validate_Answer_Form.objects.get(answer_form=answer_form_val, cause=0, show=False)
                                validate_answer_form_val.show = True
                                validate_answer_form_val.save()

                                # Trazabilidad
                                log_content = {
                                    'user': answer_form_val.created_by_id,
                                    'group': 53,
                                    'element': answer_form_val.id,
                                    'action': 38,
                                    'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                                        user_val.first_last_name + " ha editado las respuestas del documento #" +
                                        str(answer_form_val.form_enterprise_id) + ' "' + answer_form_val.form_enterprise.name + '"' +
                                        " el cual se identifica en recibidos con el ID " + str(answer_form_val.id))
                                }
                                create_traceability(log_content)
                            except:
                                pass

                    except (Answer_Form.DoesNotExist):
                        return Response(response)
            else:
                time_stamp = None

                if source == 2:
                    try:
                        # Validación desde movil de respuesta de campo con opción única
                        response['unique'] = False
                        response['unique_answer'] = False
                        data['fields']= str(data['fields'].replace(',"','","'))
                        data['fields']= str(data['fields'].replace('"","','","'))
                        data['fields']= str(data['fields'].replace(':","','"","'))
                        print(data['fields'])
                        for field_unique, value_unique in json.loads(data['fields']).items():
                            field_dataP = field_unique.split('_')
                            if len(field_dataP) > 1 and field_dataP[0] == 'field':
                                field_type_date = get_type_field(field_dataP[1])
                                if field_type_date['status'] and str(field_type_date['type_field_id']) in ['1','2','5']:
                                    response_unique = validate_answer_exists(data['form'], field_dataP[1], value_unique)
                                    if not response_unique['status'] and 'detail' in response_unique:
                                        if data['online'] == 0:
                                            response['status'] = True
                                            response['unique'] = True
                                        else:
                                            response['status'] = True
                                            response['unique'] = True
                                            response['unique_answer'] = True
                                            response['detail'] = response_unique['detail']
                                            return Response(response)
                    except (KeyError, Exception) as err:
                        print('======================= UNIQUE MOVIL: ', err)
                        response['message'] = 'Hay error en validacion unica online'
                        return Response(response)

                if source == 2 and data['online'] == 0:
                    try:
                        time_stamp = datetime.strptime(data['time_stamp'], '%Y-%m-%d %H:%M:%S')
                        Answer_Form.objects.get(
                            form_enterprise_id=data['form'],
                            created_by= user_val,
                            source=source,
                            online=data['online'],
                            time_stamp=time_stamp,
                        )
                        response['message'] = 'Respuesta omitida, ya se almaceno en el sistema'
                        response['clone'] = True
                        return Response(response)
                    except Answer_Form.DoesNotExist:
                        pass
                    except Answer_Form.MultipleObjectsReturned:
                        response['message'] = 'Respuesta omitida por más de un duplicado'
                        response['clone'] = True
                        return Response(response)
                    except (KeyError, Exception) as err:
                        print('=======================', err)
                        response['message'] = 'Hay inconsistencias con el envio'
                        return Response(response)
                    time_stamp = datetime.strptime(data['time_stamp'], '%Y-%m-%d %H:%M:%S')

                # Respuesta Nueva
                answer_form_val = Answer_Form()
                answer_form_val.form_enterprise_id = data['form']
                answer_form_val.created_by = user_val
                answer_form_val.source = source

                # Version
                if 'version' in data:
                    answer_form_val.form_version = data['version']
                else:
                    answer_form_val.form_version = answer_form_val.form_enterprise.version

                if not ('consecutive' in data and data['consecutive'] != ''):
                    # Asignación de Serial
                    serial_number_val = assing_serial(user_val.enterprise_id)
                    answer_form_val.serial_number = serial_number_val

            if ('position' in data):
                position = json.loads(data['position'])
                answer_form_val.latitude = position['lat']
                answer_form_val.longitude = position['lon']
            if 'online' in data and data['online'] != '':
                # 0 Offline - 1 Online
                answer_form_val.online = data['online']
            answer_form_val.save()
            # VALIDACION MOBILE Y OFFLINE
            if source == 2 and data['online'] == 0:
                answer_form_val.time_stamp = time_stamp
                answer_form_val.save()


            response['data'] = {
                'id': answer_form_val.id
            }

            id_Task=''
            if 'visit_task_id' in data and data['visit_task_id'] != '':
                task_answer_form_val = Visit_Task_Answer_Form()
                task_answer_form_val.answer_form_id=answer_form_val.id
                task_answer_form_val.task_id=data['visit_task_id']
                task_answer_form_val.save()
                id_Task=data['visit_task_id']

            if 'service' in data and data['service'] != '':
                save_answer_service(answer_form_val, data['service'])

            if 'consecutive' in data and data['consecutive'] != '':
                save_answer_consecutive(answer_consecutive_val, answer_form_val)

            if 'extencion' in data and data['extencion'] != '':
                ext = json.loads(data['extencion'])
            else:
                ext = ""

            arrayEmails=[]
            if 'emails' in data and data['emails'] != '':
                arrayEmails=data["emails"]

            lr_threads = save_answer_field(user_val.enterprise_id, data['form'], answer_form_val, data['fields'], files_data, True, consecutive=ans_con_id, ext=ext, emails = arrayEmails)
            generate_log("", str(data), "Información del documento guardada:",user_val.enterprise_id, user_val.id, "1")
        else:
            # Proceso de guardado Offline - Consecutivo
            for form_data in json.loads(data['forms']):
                # Respuesta Nueva
                answer_form_val = Answer_Form()
                answer_form_val.form_enterprise_id = form_data['form']
                answer_form_val.created_by = user_val
                answer_form_val.source = source

                if ('position' in data):
                    position = json.loads(data['position'])
                    answer_form_val.latitude = position['lat']
                    answer_form_val.longitude = position['lon']
                if 'online' in data and data['online'] != '':
                    # 0 Offline - 1 Online
                    answer_form_val.online = data['online']
                answer_form_val.save()

                response['data'] = {
                    'id': answer_form_val.id
                }

                if 'visit_task_id' in data and data['visit_task_id'] != '':
                    task_answer_form_val = Visit_Task_Answer_Form()
                    task_answer_form_val.answer_form_id=answer_form_val.id
                    task_answer_form_val.task_id=data['visit_task_id']
                    task_answer_form_val.save()

                save_answer_consecutive(answer_consecutive_val, answer_form_val)
                lr_threads = save_answer_field(user_val.enterprise_id, form_data['form'], answer_form_val, form_data['fields'], files_data, False)
            generate_log("", str(data), "Información del documento guardada:",user_val.enterprise_id, user_val.id, "1")

        if not ('consecutive' in data and data['consecutive'] != ''):
            log_content = {
                'user': user_val.id,
                'group': 53,
                'element': answer_form_val.id,
                'action': action,
                'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                    user_val.first_last_name + action_name + " la respuesta #" + str(answer_form_val.id) +
                    " del documento #" + str(answer_form_val.form_enterprise_id) + ' "' +
                    answer_form_val.form_enterprise.name + '"'),
            }
            create_traceability(log_content)
            if 'trace_token' in data and data['trace_token'] != '':
                # print('Traceability_User')
                Traceability_User.objects.filter(element=data['trace_token']).update(group=53, element=answer_form_val.id)
        else:
            log_content = {
                'user': None,
                'group': 61,
                'element': answer_consecutive_val.id,
                'action': action,
                'description': ("Un Usuario Público" + action_name + " la respuesta #" + str(answer_consecutive_val.id) +
                " del documento multisección #" + str(answer_consecutive_val.form_consecutive_id) + ' "' +
                answer_consecutive_val.form_consecutive.name + '"'),
            }
            if 'trace_token' in data and data['trace_token'] != '':
                Traceability_User.objects.filter(element=data['trace_token']).update(group=61, element=answer_consecutive_val.id)

        # Verifica y genera el pdf del formulario con la firma digital
        if form_needs_doc_sign(answer_form_val.form_enterprise_id, ans_con_id, form_con_id):
            if ans_con_id:
                ans_con_id.refresh_from_db()
                if ans_con_id.doc_hash:
                    val_hash = hashlib.md5(ans_con_id.doc_hash.encode())
                    ans_con_id.doc_hash = val_hash.hexdigest()
                    ans_con_id.save()
            else:
                answer_form_val.refresh_from_db()
                if answer_form_val.doc_hash:
                    val_hash = hashlib.md5(answer_form_val.doc_hash.encode())
                    answer_form_val.doc_hash = val_hash.hexdigest()
                    answer_form_val.save()

            Thread(target=sign_doc_digitally, args=(None, user_val.enterprise_id,
                answer_form_val,
                answer_consecutive_val if ans_con_id else ans_con_id, lr_threads, id_Task)).start()
        else:
            Thread(target=save_pdf_answer, args=(answer_form_val, user_val)).start()

        response['status'] = True

        status_response = status.HTTP_201_CREATED

        return Response(response, status=status_response)

def save_pdf_answer(answer_form_val, user_val):
    try:
    # guardar pdf.
        media_path = settings.MEDIA_ROOT + '/'
        file_path_table =  sign_doc_directory_path(user_val.enterprise_id, str(answer_form_val.id))
        if answer_form_val.form_enterprise.digital:
            # Cuando sea digital
            answer_field_values = Answer_Field.objects.filter(
                answer_form=answer_form_val
            ).select_related(
                'form_field',
            ).values(
                'id',
                'form_field_id',
                'value'
            )

            answer_field_values = {
                temporal['form_field_id']: {'value': temporal['value'] ,'id': temporal['id']} for temporal in list(answer_field_values)
            }
            overlay_pdf_path, result = generate_pdf_digital(answer_form_val.form_enterprise, answer_form_val.id, answer_field_values, sign=answer_form_val.doc_hash)
            shutil.copy(result, media_path + file_path_table)
        else:
            result = generate_pdf_from_data(answer_form_val.created_by, 0, answer_form_val.id, logo=user_val.enterprise.logo if user_val else answer_form_val.enterprise.logo, sign=answer_form_val.doc_hash)
            with open(media_path + file_path_table, 'wb+') as f:
                f.write(result.content)
                f.close()

        # Guardar en la tabla
        try:
            doc_file_val = Document_Without_Sing.objects.get(answer_form=answer_form_val, status=True)
        except Document_Without_Sing.DoesNotExist:
            doc_file_val = Document_Without_Sing()
            doc_file_val.answer_form_id = answer_form_val.id
        doc_file_val.pdf_path = file_path_table
        doc_file_val.save()
    except:
        pass

def save_answer_service(answer_form_val, service_location):
    try:
        service_location_val = Service_Location.objects.get(id=service_location)
        service_location_val.answer_form = answer_form_val
        service_location_val.save()
    except (Service_Location.DoesNotExist):
        pass

def save_answer_consecutive(answer_consecutive_val, answer_form_val):
    answer_form_val.consecutive = True
    answer_form_val.save()
    try:
        answer_form_consecutive_val = Answer_Form_Consecutive.objects.get(answer_consecutive=answer_consecutive_val, answer_form=answer_form_val)
        answer_form_consecutive_val.state = True
        answer_form_consecutive_val.save()
    except (Answer_Form_Consecutive.DoesNotExist):
        answer_form_consecutive_val = Answer_Form_Consecutive()
        answer_form_consecutive_val.answer_consecutive = answer_consecutive_val
        answer_form_consecutive_val.answer_form = answer_form_val
        answer_form_consecutive_val.save()
    return answer_form_consecutive_val

def special_text(text):
    dictionary = {
        '\\': ''
    }
    transTable = text.maketrans(dictionary)
    text = text.translate(transTable)
    return text

def save_answer_field(enterprise_id, form_id, answer_form_val, fields, files_data, json_convert=True, consecutive=False, envelope=False, ext="", emails=[]):
    field_list_values = []
    if envelope:
        field_list_values = Env_Form_Field.objects.filter(
            envelope_version_form__envelope_version_id=form_id,
        ).values('id', 'field_type_id')
        # Trae las opciones del sobre
        option_field_values = Env_Option_Field.objects.select_related(
            'option',
            'env_form_field'
        ).filter(
            env_form_field__envelope_version_form__envelope_version_id=form_id,
            env_form_field__field_type_id__in=[3, 12, 13],
        ).values('env_form_field_id', 'option_id', 'option__value')
        # Arreglo con todas las opciones por campo
        get_attr = lambda option: option['env_form_field_id'] if 'env_form_field_id' in option else 0
    else:
        field_list_values = Form_Field.objects.filter(
            form_enterprise_id=form_id,
        ).values('id', 'field_type_id')
        # Trae las opciones del documento
        option_field_values = Option_Field.objects.select_related(
            'option',
            'form_field'
        ).filter(
            form_field__form_enterprise_id=form_id,
            form_field__field_type_id__in=[3, 12, 13],
        ).values('form_field_id', 'option_id', 'option__value')
        # Arreglo con todas las opciones por campo
        get_attr = lambda option: option['form_field_id'] if 'form_field_id' in option else 0
    option_field_values = {
        k: {j['option__value']: j['option_id'] for j in g }
        for k, g in itertools.groupby(sorted(option_field_values, key=get_attr), get_attr)
    }

    unique_fields = {}
    try:
        form_field_parameter_values = Form_Field_Parameter.objects.filter(
            form_field__form_enterprise_id=form_id,
            form_field__state=True,
            parameter_validate_id=5,
            state=True
        )
        unique_fields = {
            form_field_parameter_val.form_field_id: form_field_parameter_val.form_field.name for form_field_parameter_val in list(form_field_parameter_values)
        }
    except Exception as err:
        pass

    try:
        # Variables para validación de firma digital y LR
        threads = []
        # Todos los campos y sus tipos
        field_values = { j['id']: j['field_type_id'] for j in field_list_values }
        field_list = []
        for field_val in field_list_values:
            field_list.append(field_val['id'])

        if json_convert:
            try:
                for rep in ['""""', '"""']:
                    fields = fields.replace(rep, '"')
                convert_fields = special_text(fields)
                data_field = json.loads(convert_fields)
            except:
                try:
                    data_field = json.loads(fields, strict=False)
                except:
                    try:
                        data_field = json.loads(fields)
                    except Exception as err:
                        register_log(
                            {
                                'action': 'String to Json Fields - Respuesta',
                                'type': 5,
                                'source': answer_form_val.source,
                                'url': 'answer',
                                'data': fields,
                                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
                            }, None, enterprise_id)
                        data_field = {}
        else:
            data_field = fields

        validate_unique_fields = "" # Campos para trazabilidad de respuestas únicas

        for field, value in data_field.items():
            try:
                val_field = field.split('_')
                # Valida que el campo de la respuesta sea del formulario.
                # if len(val_field) == 2 and val_field[0] == 'field' and int(val_field[1]) in field_list:
                if len(val_field) >= 2 and val_field[0] == 'field' and int(val_field[1]) in field_list:
                    try:
                        # Verifica si existe la respuesta para actualizar.
                        if envelope:
                            field_user_val = Field_User.objects.get(envelope_user=answer_form_val.envelope_user, env_form_field_id=val_field[1])
                            answer_envelope_field_val = Answer_Envelope_Field.objects.get(answer_envelope_user=answer_form_val, field_user=field_user_val)
                            answer_field_val = answer_envelope_field_val
                        else:
                            answer_field_val = Answer_Field.objects.get(answer_form=answer_form_val, form_field_id=val_field[1])
                        value_answer = value

                        if value != '':
                            # Valida que sea tipo archivo o firma
                            if field_values[int(val_field[1])] in [8,9]:
                                # Guardar Archivo
                                name_field = 'file_' + str(val_field[1])
                                if name_field in files_data.keys():
                                    print("Almacenamientooooooo imagen")
                                    print(str(val_field[1]))
                                    sign_file = files_data[name_field]
                                    print(sign_file)
                                    value_answer = handle_uploaded_file(sign_file, val_field[1], enterprise_id, answer_form_val.id)
                            elif field_values[int(val_field[1])] == 4:
                                value_answer = '-'.join(value.split('-')[::-1])
                            elif field_values[int(val_field[1])] == 7:
                                # Guardar Firma
                                if value != answer_field_val.value:
                                    value_answer = handle_drawn_signature(value, val_field[1], enterprise_id, answer_form_val.id)
                            elif field_values[int(val_field[1])] == 17:
                                if value != "":
                                    value_answer = value
                                    list_field_answer = json.loads(value_answer)
                                    list_field_values = List_Field.objects.filter(form_field_id=val_field[1]).values('id', 'field_type_id').order_by('position')
                                    sign_list_fields = []
                                    for list_field_val in list_field_values:
                                        if list_field_val['field_type_id'] == 7:
                                            sign_list_fields.append(list_field_val['id'])
                                    row = 0
                                    for list_row_answer in list_field_answer:
                                        row += 1
                                        for list_answer in list_row_answer:
                                            if int(list_answer['field']) in sign_list_fields:
                                                # Validar y Guardar Firma
                                                if '/answer_form/' not in list_answer['answer']:
                                                    answer_path = handle_drawn_signature(list_answer['answer'], str(val_field[1]) + '_' + str(list_answer['field']) + '_'  + str(row), enterprise_id, answer_form_val.id)
                                                    list_answer['answer'] = answer_path
                                    value_answer = json.dumps(list_field_answer)
                            elif field_values[int(val_field[1])] == 25:
                                #print('Tipo direccion')
                                value_answer = value_answer.upper()
                                try:
                                    field_address_val = Form_Field_Parameter.objects.get(form_field_id=val_field[1], parameter_validate_id=3)
                                    if field_address_val.value != '':
                                        if field_address_val.value == 'nomenclature':
                                            value_answer = convert_address(value_answer)
                                except Form_Field_Parameter.DoesNotExist:
                                    print('no existe Estandar en la tabla')
                        if not (field_values[int(val_field[1])] == 21 and value_answer == ''):
                            answer_field_val.value = value_answer
                            answer_field_val.save()
                    except (Answer_Field.DoesNotExist, Answer_Envelope_Field.DoesNotExist):
                        if field_values[int(val_field[1])] == 24:
                            value = 1
                        if value != '':
                            value_answer = value

                            if field_values[int(val_field[1])] in [1,2,5]:
                                if answer_form_val.source == 2 and not answer_form_val.online:
                                    if int(val_field[1]) in unique_fields:
                                        name_unique_field = unique_fields[int(val_field[1])]
                                        answer_field_validate = Answer_Field.objects.filter(
                                            answer_form__state=True,
                                            form_field_id=int(val_field[1]),
                                            value=value
                                        ).exists()

                                        # Si no existe la respuesta
                                        if answer_field_validate:
                                            try:
                                                validate_answer_form_val = Validate_Answer_Form.objects.get(answer_form=answer_form_val, cause=0)
                                                validate_answer_form_val.show = False
                                            except (Validate_Answer_Form.DoesNotExist):
                                                validate_answer_form_val = Validate_Answer_Form()
                                                validate_answer_form_val.answer_form = answer_form_val
                                            validate_answer_form_val.save()

                                            validate_unique_fields += ("," if validate_unique_fields != "" else "") + (" #" + str(val_field[1]) + " " + name_unique_field)

                            elif field_values[int(val_field[1])] in [3,12]:
                                # En caso de que sea desde Movil, se hace la conversión
                                if answer_form_val.source == 2:
                                    value_answer = option_field_values[int(val_field[1])][value]
                            elif field_values[int(val_field[1])] == 4:
                                value_answer = '-'.join(value.split('-')[::-1])
                            elif field_values[int(val_field[1])] == 24:
                                serial = Serial_Number.objects.get(id=answer_form_val.serial_number_id)
                                value_answer=str(serial.serial)+str(serial.count)
                            elif field_values[int(val_field[1])] in [8,9]:
                                # Valida que sea tipo archivo o firma biometrica offline
                                # Guardar Archivo
                                name_field = 'file_' + str(val_field[1])
                                if answer_form_val.source == 1:
                                    # Web
                                    if name_field in files_data.keys():
                                        sign_file = files_data[name_field]
                                        register_log(
                                            {
                                                'action': 'Registro de campo archivo',
                                                'type': 1,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': str(sign_file),
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        value_answer = handle_uploaded_file(sign_file, val_field[1], enterprise_id, answer_form_val.id)
                                else:
                                    # Movil
                                    split_value = value.split('Extension')
                                    base64_file = split_value[0]
                                    extension = split_value[1]
                                    register_log(
                                        {
                                            'action': 'Registro de campo archivo/firma biometrica offline',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': value,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                        },
                                        None, enterprise_id)
                                    value_answer = handle_drawn_signature(base64_file, val_field[1], enterprise_id, answer_form_val.id, extension)

                            elif field_values[int(val_field[1])] == 7 or (field_values[int(val_field[1])] == 10 and not answer_form_val.online):
                                # Guardar Firma
                                name_field = 'file_' + str(val_field[1])
                                # if name_field in files_data.keys():
                                # sign_file = value
                                register_log(
                                    {
                                        'action': 'Registro de firma (grafo)',
                                        'type': 1,
                                        'source': answer_form_val.source,
                                        'url': 'answer',
                                        'data': value,
                                        'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                    },
                                    None, enterprise_id)

                                if envelope:
                                    id_user_answer = answer_form_val.envelope_user_id
                                else:
                                    id_user_answer = answer_form_val.created_by_id

                                #si es vacio viene de movil, y guarda la extencion en png
                                extF="png"
                                if ext != "":
                                    for ext1 in ext:
                                        if ext1 != None:
                                            ExtJson=json.loads(ext1)
                                            for option_id in ExtJson:
                                                if option_id == val_field[1]:
                                                    if str(ExtJson[val_field[1]]) != "undefined":
                                                        extF=str(ExtJson[val_field[1]])
                                                        value_answer = handle_drawn_signature(value, val_field[1], enterprise_id, answer_form_val.id,extF)
                                                    else:
                                                        value_answer = handle_drawn_signature(value, val_field[1], enterprise_id, answer_form_val.id,extF)
                                        else:
                                            value_answer = handle_drawn_signature(value, val_field[1], enterprise_id, answer_form_val.id,extF)
                                else:
                                    value_answer = handle_drawn_signature(value, val_field[1], enterprise_id, answer_form_val.id,extF)

                                if not envelope:
                                    log_content = {
                                        'user': answer_form_val.created_by_id,
                                        'group': 53,
                                        'element': answer_form_val.id,
                                        'action': 12,
                                        'description': "El usuario denominado: " + str(id_user_answer)+" adjunto una firma basica al documento diligenciado #" + str(answer_form_val.id),
                                    }
                                    create_traceability(log_content)
                            elif field_values[int(val_field[1])] == 13:
                                # En caso de que sea desde Movil, se hace la conversión
                                if answer_form_val.source == 2:
                                    if value != "null" and value != "[]":
                                        value = value.replace("'", '"')
                                        list_answer = json.loads(value)
                                        array_answer = []
                                        for option_id in list_answer:
                                            array_answer.append(str(option_field_values[int(val_field[1])][option_id]))
                                        value_answer = json.dumps(array_answer)
                                    else:
                                        value_answer = ''
                            elif field_values[int(val_field[1])] == 20:
                                # En caso de que sea desde Movil, se hace llamado de servicio de NIT
                                if True or answer_form_val.source == 2:
                                    if value != "null" and value != "":
                                        value_answer =  str(get_nit_info(str(value), answer_form_val.created_by_id, answer_form_val.id)).replace("'", '"')
                                    else:
                                        value_answer = ''

                                    # value_answer = '[{"razon_social": "SAROA SAS"}, {"clase_identificacion_rl": "CEDULA DE CIUDADANIA"}, {"num_identificacion_representante_legal": "1136885841"}, {"representante_legal": "MARIA JOSE MARTINEZ CASTRO"}, {"numero_identificacion": "901106996"}, {"digito_verificacion": "5"}, {"matricula": "2856664"}, {"codigo_camara": "04"}, {"ultimo_ano_renovado": "2023"}, {"fecha_cancelacion": ""}, {"organizacion_juridica": "SOCIEDADES POR ACCIONES SIMPLIFICADAS SAS"}, {"estado_matricula": "ACTIVA"}, {"fecha_actualizacion": "2023/06/15 19:07:20.530000000"}]'
                                    # Proceso para guardar respuestas del campo nit
                                    field_condition_values = Field_Condition.objects.filter(field_father=val_field[1])
                                    if len(field_condition_values) > 0:
                                        field_parameter_val = Form_Field_Parameter.objects.get(form_field_id=val_field[1], parameter_validate_id=4)
                                        arreglo = {
                                            "razón social": "razon_social",
                                            "clase identificación rl": "clase_identificacion_rl",
                                            "num identificación representante legal": "num_identificacion_representante_legal",
                                            "representante legal": "representante_legal",
                                            "numero identificación": "numero_identificacion",
                                            "digito verificación": "digito_verificacion",
                                            "matricula": "matricula",
                                            "código camara": "codigo_camara",
                                            "ultimo ano renovado": "ultimo_ano_renovado",
                                            "fecha cancelación": "fecha_cancelacion",
                                            "organización juridica": "organizacion_juridica",
                                            "estado Matrícula": "estado_matricula",
                                            "Fecha actualización": "fecha_actualizacion",
                                        }

                                        nit_answer_array = json.loads(value_answer)
                                        nit_answer_dict = {}
                                        for array in nit_answer_array:
                                            for key in array:
                                                nit_answer_dict[key] = array[key]

                                        for field_condition_val in field_condition_values:
                                            name_data = field_condition_val.field_son.name.split(" - ")
                                            try:
                                                validation_key = arreglo[name_data[1]]
                                                value_nit = nit_answer_dict[validation_key]
                                            except Exception as err:
                                                value_nit = ""
                                            answer_field_val_nit = Answer_Field()
                                            answer_field_val_nit.answer_form = answer_form_val
                                            answer_field_val_nit.form_field_id = field_condition_val.field_son_id
                                            answer_field_val_nit.value = value_nit
                                            answer_field_val_nit.save()

                            elif field_values[int(val_field[1])] == 17:
                                if value != "":
                                    value_answer = value
                                    if answer_form_val.source == 2:
                                        value_answer = value.replace("'", '"')

                                        # Trae las opciones del documento
                                        option_field_list_values = Option_List_Field.objects.select_related(
                                            'option',
                                            'list_field'
                                        ).filter(
                                            list_field__form_field_id=val_field[1],
                                            list_field__field_type_id__in=[3, 12, 13],
                                        ).values('list_field_id', 'option_id', 'option__value')
                                        # Arreglo con todas las opciones por campo
                                        get_attr_list = lambda option: option['list_field_id'] if 'list_field_id' in option else 0
                                        option_field_list_values = {
                                            k: {j['option__value']: j['option_id'] for j in g }
                                            for k, g in itertools.groupby(sorted(option_field_list_values, key=get_attr_list), get_attr_list)
                                        }

                                    list_field_answer = json.loads(value_answer)
                                    list_field_values = List_Field.objects.filter(form_field_id=val_field[1]).values('id', 'field_type_id').order_by('position')

                                    sign_list_fields = []
                                    select_list_fields = []
                                    check_list_fields = []
                                    for list_field_val in list_field_values:
                                        if list_field_val['field_type_id'] in [3, 12]:
                                            select_list_fields.append(list_field_val['id'])
                                        elif list_field_val['field_type_id'] == 13:
                                            check_list_fields.append(list_field_val['id'])
                                        elif list_field_val['field_type_id'] == 7:
                                            sign_list_fields.append(list_field_val['id'])

                                    row = 0
                                    for list_row_answer in list_field_answer:
                                        row += 1
                                        for list_answer in list_row_answer:
                                            if answer_form_val.source == 2:
                                                if int(list_answer['field']) in select_list_fields:
                                                    if list_answer['answer'] != "":
                                                        list_answer['answer'] = str(option_field_list_values[int(list_answer['field'])][list_answer['answer']])
                                                elif int(list_answer['field']) in check_list_fields:
                                                    if list_answer['answer'] != "null" and list_answer['answer'] != "[]":
                                                        list_answer['answer'] = list_answer['answer'].replace("|*", '"')
                                                        check_list_answer = json.loads(list_answer['answer'])
                                                        array_answer = []
                                                        for option_id in check_list_answer:
                                                            array_answer.append(str(option_field_list_values[int(list_answer['field'])][option_id]))
                                                        list_answer['answer'] = array_answer
                                                    else:
                                                        list_answer['answer'] = []
                                            if int(list_answer['field']) in sign_list_fields:
                                                # Validar y Guardar Firma
                                                if '/answer_form/' not in list_answer['answer']:
                                                    register_log(
                                                        {
                                                            'action': 'Registro de campo firma - Tabla',
                                                            'type': 1,
                                                            'source': answer_form_val.source,
                                                            'url': 'answer',
                                                            'data': list_answer['answer'],
                                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, str(val_field[1]) + '-' + str(list_answer['field']), answer_form_val.id)
                                                        },
                                                        None, enterprise_id)
                                                    answer_path = handle_drawn_signature(list_answer['answer'], str(val_field[1]) + '_' + str(list_answer['field']) + '_'  + str(row), enterprise_id, answer_form_val.id)
                                                    list_answer['answer'] = answer_path
                                    value_answer = json.dumps(list_field_answer)
                            elif field_values[int(val_field[1])] == 11:
                                # print('Tipo documento')
                                try:
                                    field_parameter_val = Form_Field_Parameter.objects.get(form_field_id=val_field[1], parameter_validate_id=3)
                                    if field_parameter_val.value != '':
                                        validation_doc = json.loads(field_parameter_val.value)
                                        for validation in validation_doc:
                                            if validation == 'registraduria':
                                                doc_numer = value_answer
                                                if answer_form_val.source == 1:
                                                    doc_data = value_answer.split('-')
                                                    doc_numer = doc_data[1]
                                                data = get_ani_external(doc_numer, answer_form_val.created_by_id, answer_form_val.id)
                                                value = Document_Identification()
                                                value.answer_form = answer_form_val
                                                value.form_id = form_id
                                                value.form_field_id = val_field[1]
                                                value.data_form = data
                                                value.save()

                                                if data['state'] == "True":
                                                    dict_key = {
                                                        'Nombre' : 'pName',
                                                        'snombre' : 'sName',
                                                        'Apellido' : 'pLastname',
                                                        'sapellido' : 'sLastname',
                                                        'fexpedicion' : 'fexpedicion',
                                                        'Existencia' :  'fdefuncion',
                                                        'Identificacion': 'document'
                                                    }

                                                    options_field = Option_Field.objects.filter(form_field_id=val_field[1], state=True).order_by('position')
                                                    for option_field in options_field:
                                                        try:
                                                            dataRorm = Form_Field.objects.get(help=option_field.id, field_type_id=21, form_enterprise_id=form_id)

                                                            array_data=dataRorm.name.split(" - ")
                                                            name_ani=array_data[1]
                                                            value_field = data[dict_key[name_ani]]

                                                            answer_field_val = Answer_Field()
                                                            answer_field_val.answer_form = answer_form_val
                                                            answer_field_val.form_field_id = dataRorm.id
                                                            answer_field_val.value = value_field
                                                            answer_field_val.save()
                                                        except:
                                                            print(':::::::::::::::::Except Form_Field data')
                                                            pass
                                            if validation == 'restrictivas':
                                                doc_numer = value_answer
                                                if  answer_form_val.source == 1:
                                                    doc_data = value_answer.split('-')
                                                    doc_numer = doc_data[1]
                                                new_thread = Thread(target=Restrictive, args=(answer_form_val, form_id, doc_numer, val_field[1]))
                                                new_thread.start()
                                                threads.append(new_thread)
                                except Form_Field_Parameter.DoesNotExist:
                                    print('no existe')

                            elif field_values[int(val_field[1])] == 23:
                                if answer_form_val.source == 2:
                                    data_answer = json.loads(value_answer.replace("'", '"'))
                                    country = data_answer[0]
                                    state = data_answer[1]
                                    city = data_answer[2]

                                    value_temp = ['','','']
                                    if country != '':
                                        # País
                                        value_temp[0] = COUNTRYS_DATA_DICT_VALUES[str(country)]['value']
                                    if country != '' and state != '':
                                        # Departamento
                                        value_temp[1] = COUNTRYS_DATA_DICT_VALUES[str(country)]['states'][str(state)]['value']
                                    if country != '' and state != '' and city != '':
                                        # Ciudad
                                        value_temp[2] = COUNTRYS_DATA_DICT_VALUES[str(country)]['states'][str(state)]['cities'][str(city)]
                                    value_answer = json.dumps(value_temp)

                            elif field_values[int(val_field[1])] == 25:
                                #print('Tipo direccion')
                                value_answer = value_answer.upper()
                                try:
                                    field_address_val = Form_Field_Parameter.objects.get(form_field_id=val_field[1], parameter_validate_id=3)
                                    if field_address_val.value != '':
                                        if field_address_val.value == 'nomenclature':
                                            value_answer = convert_address(value_answer)
                                except Form_Field_Parameter.DoesNotExist:
                                    print('no existe Estandar en la tabla')

                            if envelope:
                                answer_field_val = Answer_Envelope_Field()
                                answer_field_val.answer_envelope_user = answer_form_val
                                answer_field_val.field_user = field_user_val
                            else:
                                answer_field_val = Answer_Field()
                                answer_field_val.answer_form = answer_form_val
                                answer_field_val.form_field_id = val_field[1]
                            answer_field_val.value = value_answer
                            answer_field_val.save()

                            if not envelope:
                                if field_values[int(val_field[1])] == 7:
                                    try:
                                        if emails !='' and len(emails) != 0:
                                            for email in json.loads(emails):
                                                if email != None:
                                                    data_sign = Sign_Email()
                                                    data_sign.answer_field = answer_field_val
                                                    data_sign.email = str(email)
                                                    data_sign.save()
                                    except Exception as error:
                                        print('error::::::::::')
                                        print(error)

                                if field_values[int(val_field[1])] == 22:
                                    register_log({
                                        'action': 'Registro de campo OTP',
                                        'type': 1,
                                        'source': answer_form_val.source,
                                        'url': 'answer',
                                        'data': value,
                                        'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                    }, None, enterprise_id)
                                    profile_id = str(value).split('-')[1].strip()

                                    try:
                                        sign_otp_val = Sign_OTP_Document.objects.get(id=profile_id)
                                        sign_otp_val.answer_id = answer_field_val.id
                                        url_sign = settings.URL_FRONTEND + 'public/trace/' + sign_otp_val.token_url
                                        register_log(
                                            {
                                                'action': 'Inicio de creacion QR para OTP',
                                                'type': 1,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': value,
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        qr_path = create_sign_qr(enterprise_id, answer_field_val.id, answer_field_val.id, url_sign)
                                        sign_otp_val.qr_file = qr_path

                                        sign_otp_val.save()
                                        if consecutive:
                                            if consecutive.doc_hash is None:
                                                consecutive.doc_hash = ''
                                            consecutive.doc_hash += '-' + str(sign_otp_val.hash_info)
                                        else:
                                            if answer_form_val.doc_hash is None:
                                                answer_form_val.doc_hash = ''
                                            answer_form_val.doc_hash += '-' + str(sign_otp_val.hash_info)
                                        register_log(
                                        {
                                            'action': 'Vinculacion de campo OTP Exitoso (QR)',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': qr_path,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                        },
                                        None, enterprise_id)
                                    except Sign_OTP_Document.DoesNotExist:
                                        register_log(
                                            {
                                                'action': 'No existe el comprobante de OTP',
                                                'type': 5,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': 'value: {}, reason:{}'.format(value, 'Se busca el identificador vinculado a la respuesta y no existe.'),
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        answer_field_val.value = 'OTP INVALIDO POR FALTA DE COMPROBANTE - ' + profile_id
                                        answer_field_val.save()

                                if field_values[int(val_field[1])] == 18:
                                    register_log(
                                        {
                                            'action': 'Registro de campo firma electronica',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': value,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                        },
                                        None, enterprise_id)
                                    # Obtiene el id del firmante
                                    profile_id = str(value).split('-')[1].strip()
                                    try:
                                        pro_doc_val = Profile_document.objects.get(id=profile_id)
                                        pro_doc_val.answer_id = answer_field_val.id
                                        url_sign = settings.URL_FRONTEND + 'public/trace/' + pro_doc_val.token_url
                                        register_log(
                                            {
                                                'action': 'Inicio de creacion QR para firma electronica',
                                                'type': 1,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': value,
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        qr_path = create_sign_qr(enterprise_id, answer_field_val.id, answer_field_val.id, url_sign)
                                        pro_doc_val.qr_file = qr_path

                                        pro_doc_val.save()
                                        if consecutive:
                                            if consecutive.doc_hash is None:
                                                consecutive.doc_hash = ''
                                            consecutive.doc_hash += '-' + str(pro_doc_val.hash_info)
                                        else:
                                            if answer_form_val.doc_hash is None:
                                                answer_form_val.doc_hash = ''
                                            answer_form_val.doc_hash += '-' + str(pro_doc_val.hash_info)
                                        register_log(
                                        {
                                            'action': 'Vinculacion de campo firma electronica Exitoso (QR)',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': qr_path,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                        },
                                        None, enterprise_id)
                                    except Profile_document.DoesNotExist:
                                        register_log(
                                            {
                                                'action': 'No existe el comprobante de Firma Electronica',
                                                'type': 5,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': 'value: {}, reason:{}'.format(value, 'Se busca el identificador vinculado a la respuesta y no existe.'),
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        answer_field_val.value = 'FIRMA INVALIDA POR FALTA DE COMPROBANTE - ' + profile_id
                                        answer_field_val.save()

                                if field_values[int(val_field[1])] == 10 and answer_form_val.online:
                                    # Obtiene el id del firmante
                                    profile_id = str(value).split('-')[1].strip()
                                    register_log(
                                        {
                                            'action': 'Registro de campo firma biometrica',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': value,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                        },
                                        None, enterprise_id)
                                    try:
                                        pro_doc_val = Sign_Profile_Document.objects.get(id=profile_id)
                                        pro_doc_val.answer_id = answer_field_val.id
                                        url_sign = settings.URL_FRONTEND + 'public/trace/' + pro_doc_val.token_url
                                        register_log(
                                            {
                                                'action': 'Inicio de creacion QR para firma biometrica',
                                                'type': 1,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': value,
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        qr_path = create_sign_qr(enterprise_id, answer_field_val.id, answer_field_val.id, url_sign)
                                        pro_doc_val.qr_file = qr_path
                                        pro_doc_val.save()

                                        if consecutive:
                                            if consecutive.doc_hash is None:
                                                consecutive.doc_hash = ''
                                            consecutive.doc_hash += '-' + str(pro_doc_val.hash_info)
                                        else:
                                            if answer_form_val.doc_hash is None:
                                                answer_form_val.doc_hash = ''
                                            answer_form_val.doc_hash += '-' + str(pro_doc_val.hash_info)
                                        register_log(
                                        {
                                            'action': 'Vinculacion de campo firma biometrica Exitoso (QR)',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': qr_path,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                        },
                                        None, enterprise_id)
                                    except Sign_Profile_Document.DoesNotExist:
                                        register_log(
                                            {
                                                'action': 'No existe el comprobante de Firma Biometrica',
                                                'type': 5,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': 'value: {}, reason:{}'.format(value, 'Se busca el identificador vinculado a la respuesta y no existe.'),
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(form_id, val_field[1], answer_form_val.id)
                                            },
                                            None, enterprise_id)
                                        answer_field_val.value = 'FIRMA INVALIDA POR FALTA DE COMPROBANTE - ' + profile_id
                                        answer_field_val.save()
            except Exception as err:
                if not envelope:
                    register_log(
                        {
                            'action': 'Guardar Respuesta Campo',
                            'type': 5,
                            'source': answer_form_val.source,
                            'url': 'answer',
                            'data': 'Form: {}, Field: {}, Answer: {}, value: {}'.format(form_id, val_field[1], answer_form_val.id, value),
                            'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
                        }, None, enterprise_id)

        # Trazabilidad
        if validate_unique_fields != "":
            log_content = {
                'user': answer_form_val.created_by_id,
                'group': 53,
                'element': answer_form_val.id,
                'action': 37,
                'description': ("El usuario #" + str(answer_form_val.created_by_id) + " " + answer_form_val.created_by.first_name + " " +
                    answer_form_val.created_by.first_last_name + " ha diligenciado y enviado el documento #" +
                    str(answer_form_val.form_enterprise_id) + ' "' + answer_form_val.form_enterprise.name + '"' +
                    ". Sin embargo, dicho documento ha sido registrado en la lista de documentos con respuestas" +
                    " duplicadas debido a que fue enviado en un momento en el que no se contaba con una conexión a" +
                    " internet estable. La identificación del documento es #" + str(answer_form_val.id) +
                    " y los campos que se han identificado como duplicados son: " + validate_unique_fields)
            }
            create_traceability(log_content)

        if not envelope:
            if consecutive:
                str_form_id = str(consecutive.id)
                while len(str_form_id) < 5:
                    str_form_id = '0' + str_form_id
                consecutive.doc_hash = str_form_id[-4:] + '-' + str(float(str_form_id)//10000) + consecutive.doc_hash
                consecutive.save()
            elif answer_form_val.doc_hash is not None:
                str_form_id = str(answer_form_val.id)
                while len(str_form_id) < 5:
                    str_form_id = '0' + str_form_id
                answer_form_val.doc_hash = str_form_id[-4:] + '-' + str(float(str_form_id)//10000) + answer_form_val.doc_hash
                answer_form_val.save()
        return threads
    except Exception as err:
        if not envelope:
            register_log(
                {
                    'action': 'Guardar Respuesta Formulario',
                    'type': 5,
                    'source': answer_form_val.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_id, answer_form_val.id),
                    'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
                }, None, enterprise_id)

            # Deshabilitado de respuesta incompleta
            answer_form_val.state = False
            answer_form_val.save()

            raise Exception('Error al guardar la respuesta, por favor intente nuevamente en un rato.')

def convert_address(address):

    try:
        address = address.upper()
        addr_values = address.split('-')

        list_road = {
            "AUTOPISTA": "AU",
            "AVENIDA": "AV",
            "AVENIDA CALLE": "AC",
            "AVENIDA CARRERA": "AK",
            "BULEVAR": "BL",
            "CALLE": "CL" ,
            "CARRERA": "KR" ,
            "CARRETERA": "CT" ,
            "CIRCULAR": "CQ" ,
            "CIRCUNVALAR": "CV" ,
            "CUENTAS CORRIDAS": "CC" ,
            "DIAGONAL": "DG" ,
            "PASAJE": "PJ" ,
            "PASEO": "PS" ,
            "PEATONAL": "PT" ,
            "TRANSVERSAL": "TV" ,
            "TRONCAL": "TC" ,
            "VARIANTE": "VT",
            "VÍA": "VI" ,
        }
        if addr_values[0] in list_road:
            # print("print(list_road[option_addr])")
            # print(list_road[addr_values[0]])
            addr_values[0] = list_road[addr_values[0]]
        return ' '.join(addr_values)
    except:
        return address


def Restrictive(answer_form_val, form_id, document, val_field, typed=1):
    if typed != 1:
        data = list_restric(document,typed)
    else:
        data = list_restric(document)
    value = Document_Identification()
    value.answer_form_id = str(answer_form_val)
    value.form_id = form_id
    value.form_field_id = val_field
    value.data_form = data
    value.save()

def handle_uploaded_file(f, field, enterprise, answer_id, envelope=False):
    ext = f.name.split('.')[-1]
    now_time = datetime.now(tz=TZ_INFO).strftime("%d%m%Y")
    loc_file_name = str(field) + '_' + now_time + '.' + ext
    folder_answer = '/answer_form/'
    if envelope:
        folder_answer = '/answer_envelope/'
    folder = '/' + str(enterprise) + folder_answer + str(answer_id) + '/'
    path = settings.MEDIA_ROOT + folder

    if not os.path.exists(path):
        os.makedirs(path)
    path += loc_file_name

    with open(path, 'wb+') as destination:
        for chunk in f.chunks():
            destination.write(chunk)
    return folder + loc_file_name

def handle_drawn_signature(bArray, field, enterprise, answer_id, envelope=False, ext = 'png'):
    is_windows = sys.platform.startswith('win')
    png_route = '\SignatureResource\Captura.png'
    font_route = '\SignatureResource\mistral\MISTRAL.TTF'
    img_route = "\SignatureResource\image.png"
    if not is_windows:
        png_route = '/home/saroa/melmac/backend/SignatureResource/Captura.PNG'
        font_route = '/home/saroa/melmac/backend/SignatureResource/mistral/MISTRAL.TTF'
        img_route = '/home/saroa/melmac/backend/SignatureResource/image.png'
    if "nombre@" in bArray:
        nombre=bArray.split("@")
        # open image
        img = Image.open(png_route)
        # draw image object
        I1 = ImageDraw.Draw(img)
        myFont = ImageFont.truetype(font_route, 45)
        # add text to image
        I1.text((0, 20),nombre[1], fill=(0, 0, 0),font=myFont)
        # save image
        img.save(img_route)
        image = open(img_route, "rb")
        image_read = image.read()
        image_64_encode = base64.encodebytes(image_read)
        image_64_encode = image_64_encode.split()
        image_64_encode = "".join(map(str,image_64_encode))
        image_64_encode = image_64_encode.replace("'b'", "")
        image_64_encode = image_64_encode.replace("b'", "")
        image_64_encode = image_64_encode.replace("'", "")
        bArray = "data:image/png;base64,"+image_64_encode
    else:
        bArray = bArray
    ext = ext
    now_time = datetime.now(tz=TZ_INFO).strftime("%d%m%Y")
    loc_file_name = str(field) + '_' + now_time + '.' + ext

    folder_answer = '/answer_form/'
    if envelope:
        folder_answer = '/answer_envelope/'
    folder = '/' + str(enterprise) + folder_answer + str(answer_id) + '/'
    path = settings.MEDIA_ROOT + folder

    if not os.path.exists(path):
        os.makedirs(path)
    path += loc_file_name

    with open(path, 'wb+') as destination:
        destination.write(base64.decodebytes(bytearray(bArray.replace('data:image/'+ext+';base64,','').encode())))
    return folder + loc_file_name

class AnswerFormList(APIView):
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, format=None, *args, **kwargs):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            if user_val.role_id == 2:
                form_values = Answer_Form.objects.filter(
                    form_enterprise_id=kwargs.get('form'),
                    form_enterprise__state=True,
                    consecutive=False,
                    state=True
                )
            else:
                form_values = Answer_Form.objects.filter(
                    form_enterprise_id=kwargs.get('form'),
                    form_enterprise__state=True,
                    created_by=user_val,
                    consecutive=False,
                    state=True
                )

            answer_values = form_values.select_related(
                'created_by'
            ).values(
                'id',
                'created_by__first_name',
                'created_by__first_last_name',
                'source',
                'online',
                'creation_date'
            ).order_by('-id')
            response['status'] = True
            response['data'] = list(answer_values)
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

class AnswerFormConsecutiveList(APIView):
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, format=None, *args, **kwargs):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            if user_val.role_id == 2:
                form_values = Answer_Consecutive.objects.filter(
                    form_consecutive_id=kwargs.get('form'),
                    form_consecutive__state=True,
                    state=True
                )
            else:
                form_values = Answer_Consecutive.objects.filter(
                    form_consecutive_id=kwargs.get('form'),
                    form_consecutive__state=True,
                    created_by=user_val,
                    state=True
                )

            answer_values = form_values.select_related(
                'created_by'
            ).values(
                'id',
                'created_by__first_name',
                'created_by__first_last_name',
                'source',
                'online',
                'creation_date'
            ).order_by('-id')
            response['status'] = True
            response['data'] = list(answer_values)
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

class AnswerDetail(APIView):
    permission_classes = [IsUserAdminOrHasPermission]

    def get(self, request, pk, consecutive, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:

            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            if consecutive == 1:
                hash_val = Answer_Consecutive.objects.get(
                    id=pk,
                    state=True
                ).doc_hash
            else:
                hash_val = Answer_Form.objects.get(id=pk, state=True).doc_hash
            list_form, data_template = data_list_form(user_val, consecutive, pk, sign=hash_val)

            try:
                answer_form_vals = []
                # Bio
                if consecutive == 1:
                    answer_form_vals = Answer_Form_Consecutive.objects.filter(answer_consecutive_id=pk).values_list('answer_form_id',flat=True)
                    trace_link = Sign_Profile_Document.objects.filter(answer__answer_form_id__in=answer_form_vals).last()
                else:
                    trace_link = Sign_Profile_Document.objects.filter(answer__answer_form_id=pk).last()
                if trace_link is None:
                    # Elect
                    if consecutive == 1:
                        trace_link = Profile_document.objects.filter(answer__answer_form_id__in=answer_form_vals).last()
                    else:
                        trace_link = Profile_document.objects.filter(answer__answer_form_id=pk).last()
                if trace_link is None:
                    if consecutive == 1:
                        trace_link = Sign_OTP_Document.objects.filter(answer__answer_form_id__in=answer_form_vals).last()
                    else:
                        trace_link = Sign_OTP_Document.objects.filter(answer__answer_form_id=pk).last()
            except :
                pass
            data_form = {
                'list_form': list_form,
                'trace': trace_link.token_url if trace_link else None
            }

            if consecutive == 1:
                answer_consecutive_val = Answer_Consecutive.objects.get(
                    id=pk,
                    state=True
                )
                data_form['consecutive'] = answer_consecutive_val.form_consecutive_id

            response['status'] = True
            response['data'] = data_form
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def delete(self, request, pk, consecutive, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST

        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

            if consecutive == 0:
                try:
                    if user_val.role_id == 2:
                        answer_form_val = Answer_Form.objects.get(
                            id=pk,
                            state=True
                        )
                    else:
                        answer_form_val = Answer_Form.objects.get(
                            id=pk,
                            created_by=user_val,
                            state=True
                        )
                    # Cambia de estado la respuesta
                    answer_form_val.state = False
                    answer_form_val.save()

                    log_content = {
                        'user': user_val.id,
                        'group': 53,
                        'element': answer_form_val.id,
                        'action': 3,
                        'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                            user_val.first_last_name + " elimino la respuesta #" + str(answer_form_val.id) +
                            " del documento #" + str(answer_form_val.form_enterprise_id) + ' "' +
                            answer_form_val.form_enterprise.name + '"'),
                    }

                except Answer_Form.DoesNotExist:
                    response["message"] = 'Solo puedes eliminar respuestas tuyas.'
                    return Response(response, status=status_response)
            else:
                try:
                    if user_val.role_id == 2:
                        answer_consecutive_val = Answer_Consecutive.objects.get(
                            id=pk,
                            state=True
                        )
                    else:
                        answer_consecutive_val = Answer_Consecutive.objects.get(
                            id=pk,
                            created_by=user_val,
                            state=True
                        )

                    # Cambia de estado la respuesta consecutiva
                    answer_consecutive_val.state = False
                    answer_consecutive_val.save()

                    log_content = {
                        'user': user_val.id,
                        'group': 61,
                        'element': answer_consecutive_val.id,
                        'action': 3,
                        'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                            user_val.first_last_name + " elimino la respuesta #" + str(answer_consecutive_val.id) +
                            " del documento #" + str(answer_consecutive_val.form_consecutive_id) + ' "' +
                            answer_consecutive_val.form_consecutive.name + '"'),
                    }
                except Answer_Consecutive.DoesNotExist:
                    response["message"] = 'Solo puedes eliminar respuestas tuyas.'
                    return Response(response, status=status_response)


            create_traceability(log_content)

            response['status'] = True
            status_response = status.HTTP_202_ACCEPTED
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

def data_list_form(user_val, consecutive, pk, pdf=False, external=False, type_doc=0, sign=False):
    list_form = []
    data_template = {}
    # Individual
    if consecutive == 0:
        try:
            if user_val and (user_val.role_id == 2 or user_val.role_enterprise.view_all):
                answer_form_val = Answer_Form.objects.get(
                    id=pk,
                )
            else:
                answer_form_val = Answer_Form.objects.get(
                    id=pk,
                    created_by=user_val,
                )
        except Answer_Form.DoesNotExist:
            return list_form, data_template
        # Template
        data_template = {
            'theme': answer_form_val.form_enterprise.theme,
            'color': answer_form_val.form_enterprise.color,
            'logo': settings.URL+'media/'+str(answer_form_val.form_enterprise.logo_path) if answer_form_val.form_enterprise.logo_path else '',
        }
        list_field = []

        if not external:
            # print(answer_form_val.form_version)
            # print(answer_form_val.form_enterprise.version)

            if answer_form_val.form_version == answer_form_val.form_enterprise.version:
                list_field_values = List_Field.objects.filter(
                    form_field__form_enterprise=answer_form_val.form_enterprise_id,
                    form_field__state=True,
                    state=True
                ).order_by('position').values(
                    'form_field_id',
                    'field_type_id',
                    'id',
                    'name',
                )
                # Arreglo con todas las columnas
                get_attr = lambda list: list['form_field_id'] if 'form_field_id' in list else 0
                list_field_values = {
                    k: [[j['id'],j['name'], j['field_type_id']] for j in g]
                    for k, g in itertools.groupby(sorted(list_field_values, key=get_attr), get_attr)
                }

                fields_form = Form_Field.objects.filter(
                    form_enterprise_id=answer_form_val.form_enterprise_id,
                    state=True
                ).order_by('position', '-field_type__name')
                for field_form in fields_form:
                    answer = get_asnwer_field(answer_form_val.id, field_form, list_field_values, answer_form_val.online, sign=sign)
                    if not (field_form.field_type_id == 14 and pdf):
                        list_field.append({
                            'name': field_form.name,
                            'type': field_form.field_type_id,
                            'answer': answer
                        })
            else:
                list_field = get_answer_version(answer_form_val)
        else:
            fields_form = Form_Field.objects.filter(
                form_enterprise_id=answer_form_val.form_enterprise_id,
                state=True
            ).order_by('position', '-field_type__name')
            document_forms = Document_Identification.objects.filter(
                answer_form=pk,
                form=answer_form_val.form_enterprise_id,
                state=True
            )
            if type_doc == 1:
                for field in fields_form:
                    if field.field_type_id == 11:
                        url_form = settings.URL_FRONTEND + 'detail/'
                        for item in document_forms:
                            if field.id == item.form_field_id:
                                data = []
                                idF=item.id
                                nameConsUser=''
                                if 'pName' in item.data_form:
                                    data_json = str(item.data_form.replace("'",'"'))
                                    json_data = json.loads(data_json)
                                    data2 = '{"Primer_Nombre": "'+ json_data["pName"] + '", "Segundo_Nombre": "' + json_data["sName"] + '" , "Primer_apellido": "' + json_data["pLastname"] +'" , "Segundo_apellido": "' + json_data["sLastname"] + '" , "Fecha_Expedicion": "' + json_data["fexpedicion"] + '", "Fecha_de_Defuncion": "' + json_data["fdefuncion"] + '", "Documento": "' + json_data["document"] + '" , "Estado": "' + ("Vivo" if json_data["state"] == "True" else "Fallecido")+'"}'
                                    nameP = json_data["pName"]+' '+json_data["sName"]+' '+ json_data["pLastname"]+' '+ json_data["sLastname"]
                                    data.append(json.loads(data2))
                                    typeDoc = 1
                                elif 'response' in item.data_form:
                                    try:
                                        data_json = str(item.data_form.replace('"','$*'))
                                        data_json = str(data_json.replace("'",'"'))
                                        json_data = json.loads(data_json)
                                        json_data['response'] = json_data['response'].replace('$*', '"')
                                        data = json.loads(json_data['response'])
                                        nameConsUser=json_data['nombre']
                                        typeDoc = 2
                                        nameP = ''
                                    except Exception as err:
                                        print(err)
                                        data = "No se tiene información de listas restrictivas"
                                list_field.append({
                                    'name': field.name,
                                    'type': 11,
                                    'answer': data,
                                    'typeDoc':typeDoc,
                                    'nameP':nameP,
                                    'url_form':url_form+str(idF),
                                    'nameConsUser':nameConsUser
                                })
            elif type_doc == 2:
                for field in fields_form:
                    if field.field_type_id == 20:
                        answer_field_val = Answer_Field.objects.get(answer_form=pk, form_field_id=field.id)
                        answer_nit = json.loads(answer_field_val.value)
                        answer = ''
                        data = ""
                        data2 = ""
                        if answer_nit[0]['razon_social'] == '':
                            answer = '{"Razon social": " - No Existe "}'
                            nit=""
                        else:
                            answer = '{ "Matricula": "'+ answer_nit[6]['matricula'] +'" ,"Estado Matricula": "' + answer_nit[11]['estado_matricula'] + '" , "Ultimo Año Renovado": "' + answer_nit[8]['ultimo_ano_renovado'] +'" ,"Razón social": "'+ answer_nit[0]['razon_social'] +  '" , "Nit": "' + answer_nit[4]['numero_identificacion'] + '", "Digito verificación": "' + answer_nit[5]['digito_verificacion'] + '", "Código de la Cámara de comercio ": "' + answer_nit[7]['codigo_camara'] + '" , "Organización Jurídica": "' + answer_nit[10]['organizacion_juridica'] + '" , "Fecha Cancelación": "' + answer_nit[9]['fecha_cancelacion'] + '" , "Ultima Actualización de datos al RUES": "' + answer_nit[12]['fecha_actualizacion'] +'" , "Representante Legal": "' + answer_nit[3]['representante_legal'] + '", "Tipo de identificación del rep. legal": "' + answer_nit[1]['clase_identificacion_rl']  + '" , "# Identificación de rep. legal": "' + answer_nit[2]['num_identificacion_representante_legal'] +'"}'
                            answer = json.loads(answer)
                            nit= answer_nit[0]['razon_social']+" IDENTIFICADO CON EL NIT #"+answer_nit[4]['numero_identificacion']+"-"+answer_nit[5]['digito_verificacion']
                            # answer = "Razon social: " + answer_nit[0]['razon_social'] + " | Clase identificacion rl: " + answer_nit[1]['clase_identificacion_rl'] + " | Num. identificacion representante legal: "+ answer_nit[2]['num_identificacion_representante_legal']+ " | representante legal: "+answer_nit[3]['representante_legal']+" | Nit: "+answer_nit[4]['numero_identificacion']+ " | Digito verificacion: "+answer_nit[5]['digito_verificacion']+" | codigo camara: "+answer_nit[7]['codigo_camara']+" | Ultimo año renovado: "+answer_nit[8]['ultimo_ano_renovado']+" | fecha cancelacion: "+answer_nit[9]['fecha_cancelacion']+" | Organizacion juridica: "+answer_nit[10]['organizacion_juridica']+" | Estado matricula: "+answer_nit[11]['estado_matricula']+ " | fecha actualizacion: "+answer_nit[12]['fecha_actualizacion']
                            document_forms = Document_Identification.objects.filter(answer_form=pk,form=answer_form_val.form_enterprise_id,form_field_id=str(field.id),state=True)
                            if len(document_forms) > 0:
                                for item in document_forms:
                                    if 'response' in item.data_form:
                                        data_json = str(item.data_form.replace('"','$*'))
                                        data_json = str(data_json.replace("'",'"'))
                                        json_data = json.loads(data_json)
                                        json_data['response'] = json_data['response'].replace('$*', '"')
                                        if json_data['type'] != 1:
                                            data2 = json.loads(json_data['response'])
                                        else:
                                            data = json.loads(json_data['response'])
                            else:
                                print("DOS")
                                if answer_nit[1]['clase_identificacion_rl'] != 'CEDULA DE EXTRANJERIA':
                                    threads = []
                                    new_thread = Thread(target=Restrictive, args=(int(pk), answer_form_val.form_enterprise_id, answer_nit[2]['num_identificacion_representante_legal'], str(field.id)))
                                    new_thread.start()
                                    threads.append(new_thread)
                                threads = []
                                new_thread = Thread(target=Restrictive, args=(int(pk), answer_form_val.form_enterprise_id, answer_nit[4]['numero_identificacion'], str(field.id),2))
                                new_thread.start()
                                threads.append(new_thread)

                        list_field.append({
                            'name': field.name,
                            'type': 20,
                            'answer': answer,
                            'nitC':nit,
                            'data':data,
                            'data2':data2,
                        })
        user_name = 'Usuario Público'
        if answer_form_val.created_by != None:
            user_name = answer_form_val.created_by.first_name + ' ' + answer_form_val.created_by.first_last_name

        list_form.append({
            'id': answer_form_val.form_enterprise_id,
            'name': answer_form_val.form_enterprise.name,
            'version': answer_form_val.form_version,
            'user': user_name,
            'latitude': answer_form_val.latitude,
            'longitude': answer_form_val.longitude,
            'source': answer_form_val.source,
            'online': answer_form_val.online,
            'creation_date': answer_form_val.creation_date,
            'solicitude_date': datetime.now(tz=TZ_INFO).strftime("%d%m%Y"),
            'fields': list_field
        })

    # Consecutivo
    else:
        try:
            if user_val and (user_val.role_id == 2 or user_val.role_enterprise.view_all):
                answer_consecutive_val = Answer_Consecutive.objects.get(
                    id=pk,
                )
            else:
                answer_consecutive_val = Answer_Consecutive.objects.get(
                    id=pk,
                    created_by=user_val,
                )
        except Answer_Consecutive.DoesNotExist:
            return list_form, data_template

        # Template
        data_template = {
            'theme': answer_consecutive_val.form_consecutive.theme,
            'color': answer_consecutive_val.form_consecutive.color,
            'logo': settings.URL+'media/'+str(answer_consecutive_val.form_consecutive.logo_path) if answer_consecutive_val.form_consecutive.logo_path else '',
        }

        # Validación respuesta consecutiva
        # consecutive_validate(answer_consecutive_val.form_consecutive_id, answer_consecutive_val.id)

        # print(answer_consecutive_val.form_version)
        # print(answer_consecutive_val.form_consecutive.version)

        answer_form_consecutive_val = Answer_Form_Consecutive.objects.filter(answer_consecutive=answer_consecutive_val)
        for form in answer_form_consecutive_val:
            # print(form.answer_form.form_version)
            # print(form.answer_form.form_enterprise.version)
            if form.answer_form.form_version == form.answer_form.form_enterprise.version:
                list_field_values = List_Field.objects.filter(
                    form_field__form_enterprise=form.answer_form.form_enterprise_id,
                    form_field__state=True,
                    state=True
                ).order_by('form_field_id').values(
                    'form_field_id',
                    'id',
                    'name',
                )
                # Arreglo con todas las columnas
                get_attr = lambda list: list['form_field_id'] if 'form_field_id' in list else 0
                list_field_values = {
                    k: [[j['id'],j['name']] for j in g]
                    for k, g in itertools.groupby(sorted(list_field_values, key=get_attr), get_attr)
                }

                list_field = []

                fields_form = Form_Field.objects.filter(
                    form_enterprise_id=form.answer_form.form_enterprise_id,
                    state=True
                ).order_by('position')

                for field_form in fields_form:
                    answer = get_asnwer_field(form.answer_form_id, field_form, list_field_values, answer_consecutive_val.online, sign=sign)
                    if not (field_form.field_type_id == 14 and pdf):
                        list_field.append({
                            'name': field_form.name,
                            'type': field_form.field_type_id,
                            'answer': answer
                        })
            else:
                list_field = get_answer_version(form.answer_form)

            user_name = 'Usuario Público'
            if form.answer_form.created_by != None:
                user_name = form.answer_form.created_by.first_name + ' ' + form.answer_form.created_by.first_last_name

            list_form.append({
                'id': form.answer_form.form_enterprise_id,
                'name': form.answer_form.form_enterprise.name,
                'user': user_name,
                'source': form.answer_form.source,
                'online': form.answer_form.online,
                'creation_date': form.answer_form.creation_date,
                'fields': list_field
            })

    return list_form, data_template

def get_answer_version(answer_form_val):
    list_field = []
    sign = answer_form_val.doc_hash
    try:
        data_form = Form_Version.objects.get(form_enterprise_id=answer_form_val.form_enterprise_id, version=answer_form_val.form_version)
        json_to_form = json.loads(data_form.json_data)
        # print('data_form.json_data::::::::::::')
        # print(data_form.json_data)

        type_option = ['3', '12', '13']
        for field_form in json_to_form['fields']:
            answer = ''
            if field_form['field_type'] in type_option:
                options = field_form['data']['values']
                options_dict = {val['value']: val['label'] for val in options}
            try:
                answer_field_val = Answer_Field.objects.get(answer_form=answer_form_val, form_field_id=field_form['field'])
                if field_form['field_type'] == '3' or field_form['field_type'] == '12':
                    answer = options_dict[answer_field_val.value]
                elif field_form['field_type'] == '13':
                    if answer_field_val.value != '':
                        list_answer = json.loads(answer_field_val.value)
                        for option_id in list_answer:
                            if answer != '':
                                answer += ', ' + options_dict[option_id]
                            else:
                                answer = options_dict[option_id]
                elif field_form['field_type'] in ['7', '8', '9']:
                    answer = settings.URL + 'media' + answer_field_val.value
                elif field_form['field_type'] == '17':
                    fields = field_form['fields']
                    list_field_head = [[int(val['field']), val['label'], int(val['field_type'])] for val in fields]

                    answer = {
                        'head': list_field_head,
                        'body': '',
                        'max_row': field_form['row']
                    }

                    if answer_field_val.value != '':
                        single_list_fields = []
                        check_list_fields = []
                        sign_list_fields = []

                        for list_field_val in fields:
                            if list_field_val['field_type'] in ['3', '12']:
                                single_list_fields.append(list_field_val['field'])
                            elif list_field_val['field_type'] == '13':
                                check_list_fields.append(list_field_val['field'])
                            elif list_field_val['field_type'] == '7':
                                sign_list_fields.append(list_field_val['field'])

                        list_field_options_dict = {val['field']: val['values'] if val['field_type'] in ['3', '12', '13'] else [] for val in fields}
                        list_field_answer = json.loads(answer_field_val.value)
                        row = 0
                        for list_row_answer in list_field_answer:
                            row += 1
                            for list_answer in list_row_answer:
                                if list_answer['field'] in single_list_fields:
                                    if list_answer['answer'] != '':
                                        list_options_dict = {val['value']: val['label'] for val in list_field_options_dict[list_answer['field']]}
                                        list_answer['answer'] = list_options_dict[list_answer['answer']]
                                elif list_answer['field'] in check_list_fields:
                                    answer_check = ''
                                    list_options_dict = {val['value']: val['label'] for val in list_field_options_dict[list_answer['field']]}
                                    for option_id in list_answer['answer']:
                                        if answer_check != '':
                                            answer_check += ', ' + list_options_dict[option_id]
                                        else:
                                            answer_check = list_options_dict[option_id]
                                    list_answer['answer'] = answer_check
                                elif list_answer['field'] in sign_list_fields:
                                    list_answer['answer'] = settings.URL + 'media' + list_answer['answer']
                        answer['body'] = list_field_answer
                        answer = answer
                elif field_form['field_type'] in ['10', '18', '22']:
                    if field_form['field_type'] == '10':
                        try:
                            spd_val = Sign_Profile_Document.objects.get(answer_id=answer_field_val.id)
                            img_answer = settings.MEDIA_ROOT + '/' + spd_val.qr_file
                            profile = spd_val.profile.id
                            identification = spd_val.profile.identification
                        except Sign_Profile_Document.DoesNotExist:
                            img_answer = ''
                            profile = ''
                            identification = ''
                    elif field_form['field_type'] == '18':
                        try:
                            pro_doc_val = Profile_document.objects.get(answer_id=answer_field_val.id)
                            img_answer = settings.MEDIA_ROOT + '/' + pro_doc_val.qr_file
                            profile = pro_doc_val.id
                            identification = pro_doc_val.identification
                        except Profile_document.DoesNotExist:
                            img_answer = ''
                            profile = ''
                            identification = ''
                    elif field_form['field_type'] == '22':
                        try:
                            otp_val = Sign_OTP_Document.objects.get(answer_id=answer_field_val.id)
                            img_answer = settings.MEDIA_ROOT + '/' + otp_val.qr_file
                            profile = ''
                            identification = ''
                        except Sign_OTP_Document.DoesNotExist:
                            img_answer = ''
                            profile = ''
                            identification = ''
                    if img_answer and sign:
                        img_answer = image_to_base64(img_answer)

                    value_answer = ''
                    if answer_field_val.value != '':
                        try:
                            value_answer = answer_field_val.value.split('-')[2]
                        except:
                            pass

                    answer = {
                        'hash': sign,
                        'answer': img_answer,
                        'profile': profile,
                        'identification':identification,
                        'value': value_answer
                    }
                elif field_form['field_type'] == '20':
                    answer_nit = json.loads(answer_field_val.value)
                    answer = answer_nit[4]['numero_identificacion']
                else:
                    answer = answer_field_val.value
            except (Answer_Field.DoesNotExist):
                pass

            data_field = {
                'type': int(field_form['field_type']),
                'name': field_form['label'],
                'answer': answer,
            }
            list_field.append(data_field)

    except (Form_Version.DoesNotExist):
        pass
    return list_field

def get_asnwer_field(answer_form_id, field_form, list_field_values, online, sign=False):

    answer = ''
    try:
        answer_field_val = Answer_Field.objects.get(answer_form_id=answer_form_id, form_field_id=field_form.id)
        if field_form.field_type_id == 3 or field_form.field_type_id == 12:
            answer = answer_field_val.value
            if answer_field_val.value.isdigit():
                option_val = Option.objects.get(id=answer_field_val.value)
                answer = option_val.value
        elif field_form.field_type_id == 13:
            if answer_field_val.value != '':
                list_answer = json.loads(answer_field_val.value)
                for option_id in list_answer:
                    if option_id != '' and option_id.isdigit():
                        option_val = Option.objects.get(id=option_id)
                        if answer != '':
                            answer += ', ' + option_val.value
                        else:
                            answer = option_val.value
        elif field_form.field_type_id == 8:
            answer = settings.URL + 'media' + answer_field_val.value
        elif field_form.field_type_id in [7, 9] or (field_form.field_type_id == 10 and not online):
            if sign:
                answer = image_to_base64(settings.MEDIA_ROOT +
                                     answer_field_val.value)
            else:
                #answer = settings.URL + 'media' + answer_field_val.value
                answer = image_to_base64(settings.MEDIA_ROOT + answer_field_val.value)
        elif field_form.field_type_id == 17:
            # Campos de tipo tabla
            answer = {
                'head': list_field_values[field_form.id],
                'body': '',
                'max_row': field_form.row
            }
            if answer_field_val.value != '':
                list_field_values_input = List_Field.objects.filter(form_field_id=field_form.id, state=True).values('id', 'field_type_id').order_by('position')

                single_list_fields = []
                check_list_fields = []
                sign_list_fields = []

                for list_field_val in list_field_values_input:
                    if list_field_val['field_type_id'] in [3, 12]:
                        single_list_fields.append(list_field_val['id'])
                    elif list_field_val['field_type_id'] == 13:
                        check_list_fields.append(list_field_val['id'])
                    elif list_field_val['field_type_id'] == 7:
                        sign_list_fields.append(list_field_val['id'])

                list_field_answer = json.loads(answer_field_val.value)
                row = 0
                for list_row_answer in list_field_answer:
                    row += 1
                    for list_answer in list_row_answer:
                        if int(list_answer['field']) in single_list_fields:
                            if list_answer['answer'] != '':
                                option_val = Option.objects.get(id=list_answer['answer'])
                                list_answer['answer'] = option_val.value
                        elif int(list_answer['field']) in check_list_fields:
                            answer_check = ''
                            for option_id in list_answer['answer']:
                                if option_id != '' and option_id.isdigit():
                                    option_val = Option.objects.get(id=option_id)
                                    if answer_check != '':
                                        answer_check += ', ' + option_val.value
                                    else:
                                        answer_check = option_val.value
                            list_answer['answer'] = answer_check
                        elif int(list_answer['field']) in sign_list_fields:
                            list_answer['answer'] = settings.URL + 'media' + list_answer['answer']
                answer['body'] = list_field_answer
                answer = answer
        elif field_form.field_type_id in [10, 18, 22] and online:
            if field_form.field_type_id == 10:
                try:
                    spd_val = Sign_Profile_Document.objects.get(answer_id=answer_field_val.id)
                    if sign:
                        img_answer = settings.MEDIA_ROOT + '/' + spd_val.qr_file
                    else:
                        img_answer = settings.URL + 'media/' + spd_val.qr_file
                    profile = spd_val.profile.id
                    identification = spd_val.profile.identification
                except Sign_Profile_Document.DoesNotExist:
                    img_answer = ''
                    profile = ''
                    identification = ''
            elif field_form.field_type_id == 18:
                try:
                    pro_doc_val = Profile_document.objects.get(answer_id=answer_field_val.id)
                    if sign:
                        img_answer = settings.MEDIA_ROOT + '/' + pro_doc_val.qr_file
                    else:
                        img_answer = settings.URL + 'media/' + pro_doc_val.qr_file
                    profile = pro_doc_val.id
                    identification = pro_doc_val.identification
                except Profile_document.DoesNotExist:
                    img_answer = ''
                    profile = ''
                    identification = ''

                    # Borrar Temporal
                    if answer_field_val.value != '':
                        answer_form_val = answer_field_val.answer_form
                        datetime_str = '2023-07-02'
                        date_time = datetime.strptime(datetime_str, '%Y-%m-%d')
                        if Answer_Form.objects.filter(id=answer_field_val.answer_form_id, creation_date__gte=date_time).exists():
                            profile_id = str(answer_field_val.value).split('-')[1].strip()
                            try:
                                pro_doc_val = Profile_document.objects.get(id=profile_id)
                                pro_doc_val.answer_id = answer_field_val.id
                                url_sign = settings.URL_FRONTEND + 'public/trace/' + pro_doc_val.token_url
                                register_log(
                                    {
                                        'action': 'Inicio de creacion QR para firma electronica',
                                        'type': 1,
                                        'source': answer_form_val.source,
                                        'url': 'answer',
                                        'data': answer_field_val.value,
                                        'response_data': 'Form: {}, Field: {}, Answer: {}'.format(answer_form_val.form_enterprise_id, answer_field_val.form_field_id, answer_form_val.id)
                                    },
                                    None, answer_form_val.form_enterprise.enterprise_id)
                                qr_path = create_sign_qr(answer_form_val.form_enterprise.enterprise_id, answer_field_val.id, answer_field_val.id, url_sign)
                                pro_doc_val.qr_file = qr_path

                                pro_doc_val.save()
                                if answer_form_val.doc_hash is None:
                                    answer_form_val.doc_hash = ''
                                answer_form_val.doc_hash += '-' + str(pro_doc_val.hash_info)
                                register_log(
                                {
                                    'action': 'Vinculacion de campo firma electronica Exitoso (QR)',
                                    'type': 1,
                                    'source': answer_form_val.source,
                                    'url': 'answer',
                                    'data': qr_path,
                                    'response_data': 'Form: {}, Field: {}, Answer: {}'.format(answer_form_val.form_enterprise_id, answer_field_val.form_field_id, answer_form_val.id)
                                },
                                None, answer_form_val.form_enterprise_id)

                                if sign:
                                    img_answer = settings.MEDIA_ROOT + '/' + pro_doc_val.qr_file
                                else:
                                    img_answer = settings.URL + 'media/' + pro_doc_val.qr_file
                                profile = pro_doc_val.id
                                identification = pro_doc_val.identification
                            except Profile_document.DoesNotExist:
                                pass
            elif field_form.field_type_id == 22:
                try:
                    otp_val = Sign_OTP_Document.objects.get(answer_id=answer_field_val.id)
                    if sign:
                        img_answer = settings.MEDIA_ROOT + '/' + otp_val.qr_file
                    else:
                        img_answer = settings.URL + 'media/' + otp_val.qr_file
                    profile = ''
                    identification = ''
                except Sign_OTP_Document.DoesNotExist:
                    img_answer = ''
                    profile = ''
                    identification = ''
            if img_answer and sign:
                img_answer = image_to_base64(img_answer)

            value_answer = ''
            if answer_field_val.value != '':
                try:
                    value_answer = answer_field_val.value.split('-')[2]
                except:
                    pass

            answer = {
                'hash': sign,
                'answer': img_answer,
                'profile': profile,
                'identification':identification,
                'value': value_answer
            }
        elif field_form.field_type_id == 20:
            answer_nit = json.loads(answer_field_val.value)
            answer = answer_nit[4]['numero_identificacion']
        else:
            answer = answer_field_val.value
    except (Answer_Field.DoesNotExist):
        if field_form.field_type_id == 17:
            # Campos de tipo tabla
            answer = {
                'head': list_field_values[field_form.id],
                'body': '',
                'max_row': field_form.row
            }
    except (Option.DoesNotExist):
        pass
    except KeyError:
        pass
    return answer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_data(request, answer):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        list_form, data_template = data_list_form(user_val, 0, answer)

        response['status'] = True
        response['data'] = list_form
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pdf(request, consecutive, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        try:
            if consecutive == 0:
                doc_val = Signed_Document.objects.get(answer_form=pk, status=True)
            else:
                doc_val = Signed_Document_Consecutive.objects.get(answer_consecutive=pk, status=True)
            result_pdf_path = '{}/{}'.format(settings.MEDIA_ROOT, doc_val.pdf_path)
            with open(result_pdf_path, 'rb') as f:
                file_data = f.read()
            response = HttpResponse(file_data, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename=form.pdf'
            return response
        except Exception as err:
            pass
        try:
            result = generate_pdf_from_data(user_val, consecutive, pk, logo=user_val.enterprise.logo)
            return result
        except Exception as e:
            # Fallback for WeasyPrint missing GTK deps on Windows. Avoids 500 error in Client Console.
            return HttpResponse(status=status.HTTP_204_NO_CONTENT)
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pdf_external(request, consecutive, pk, type_doc):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        result = generate_pdf_from_data(user_val, consecutive, pk, logo=user_val.enterprise.logo, external=True, type_doc=type_doc)
        return result
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

def generate_pdf_from_data(user_val, consecutive, pk, logo=None, html=False, req=None, external=False, type_doc=0, sign=False):

    if external:
        list_form, data_template = data_list_form(user_val, consecutive, pk, True, external, type_doc)
    else:
        list_form, data_template = data_list_form(user_val, consecutive, pk, True, sign=sign)
    if html:
        return render(req, 'my_template.html', {
            'type':'answer',
            'type_doc':type_doc,
            'data_template': data_template,
            'forms': list_form,
            'logo': settings.URL+'media/'+str(logo) if logo else 'https://desarrolladorsaroa.github.io/Styles/descarga.jpg'
        })

    print(list_form[0]["name"] , " " , list_form[0]["id"])
    # result = generate_pdf(
    #     'my_template.html',
    #     file_object=resp,
    #     context={
    #         'type':'answer',
    #         'type_doc':type_doc,
    #         'data_template': data_template,
    #         'forms': list_form,
    #         'logo': settings.URL+'media/'+str(logo) if logo else 'https://desarrolladorsaroa.github.io/Styles/descarga.jpg'
    #     })
    template = render_to_string('my_template.html', context={
            'type':'answer',
            'type_doc':type_doc,
            'data_template': data_template,
            'forms': list_form,
            'logo': settings.URL+'media/'+str(logo) if logo else 'https://desarrolladorsaroa.github.io/Styles/descarga.jpg'
        })
    html_string = template
    # html_string = template.render()
    # print(html_string)
    try:
        from weasyprint import HTML
        pdf = HTML(string=html_string).write_pdf()
        result = HttpResponse(pdf, content_type='application/pdf')
        return result
    except Exception as e:
        # Fallback if WeasyPrint fails in the environment (e.g., Windows GTK issues)
        try:
            from xhtml2pdf import pisa
            from io import BytesIO
            result_file = BytesIO()
            pisa_status = pisa.CreatePDF(BytesIO(html_string.encode("UTF-8")), dest=result_file)
            if not pisa_status.err:
                return HttpResponse(result_file.getvalue(), content_type='application/pdf')
            else:
                return HttpResponse(status=status.HTTP_204_NO_CONTENT)
        except Exception:
            return HttpResponse(status=status.HTTP_204_NO_CONTENT)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_digital_pdf(request, consecutive, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        try:
            try:
                if consecutive == 0:
                    doc_val = Signed_Document.objects.get(answer_form=pk, status=True)
                else:
                    doc_val = Signed_Document_Consecutive.objects.get(answer_consecutive=pk, status=True)
            except:
                doc_val = Document_Without_Sing.objects.get(answer_form=pk, status=True)
            result_pdf_path = '{}/{}'.format(settings.MEDIA_ROOT, doc_val.pdf_path)
            with open(result_pdf_path, 'rb') as f:
                file_data = f.read()
            response = HttpResponse(file_data, content_type='application/pdf')
            response['Content-Disposition'] = 'attachment; filename=form.pdf'
            return response
        except:
            pass
        # Individual
        if consecutive == 0:
            # Respuesta
            try:
                if user_val.role_id == 2:
                    answer_form_val = Answer_Form.objects.get(
                        id=pk,
                    )
                else:
                    roleEnt = Role_Enterprise.objects.get(id=user_val.role_enterprise_id)
                    if roleEnt.view_all:
                        answer_form_val = Answer_Form.objects.get(
                            id=pk,
                        )
                    else:
                        answer_form_val = Answer_Form.objects.get(
                            id=pk,
                            created_by=user_val,
                        )
                id_form = answer_form_val.form_enterprise_id
            except Answer_Form.DoesNotExist:
                return Response(response, status=status_response)

            # Respuestas del formulario
            answer_field_values = Answer_Field.objects.filter(
                answer_form=answer_form_val
            ).select_related(
                'form_field',
            ).values(
                'id',
                'form_field_id',
                'value'
            )

            answer_field_values = {
                temporal['form_field_id']: {'value': temporal['value'] ,'id': temporal['id']} for temporal in list(answer_field_values)
            }
        # Consecutivo
        else:
            try:
                if user_val.role_id == 2:
                    answer_consecutive_val = Answer_Consecutive.objects.get(
                        id=pk,
                    )
                else:
                    answer_consecutive_val = Answer_Consecutive.objects.get(
                        id=pk,
                        created_by=user_val,
                    )
                id_form = answer_consecutive_val.form_consecutive_id
            except Answer_Consecutive.DoesNotExist:
                return Response(response, status=status_response)

            answer_list = []
            answer_form_consecutive_val = Answer_Form_Consecutive.objects.filter(answer_consecutive=answer_consecutive_val)
            for form in list(answer_form_consecutive_val):
                answer_list.append(form.answer_form_id)

            # Respuestas del formulario
            answer_field_values = Answer_Field.objects.filter(
                answer_form_id__in=answer_list
            ).select_related(
                'form_field',
            ).values(
                'id',
                'form_field_id',
                'value'
            )

            answer_field_values = {
                temporal['form_field_id']: {'value': temporal['value'] ,'id': temporal['id']} for temporal in list(answer_field_values)
            }

        # Plantilla del documento digital
        form_val = Form_Enterprise.objects.get(id=id_form, enterprise_id=user_val.enterprise_id)
        overlay_pdf_path, result_pdf_path = generate_pdf_digital(form_val, pk, answer_field_values)

        # return pdf
        with open(result_pdf_path, 'rb') as f:
            file_data = f.read()
        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=form.pdf'
        #os.remove(overlay_pdf_path)
        #os.remove(result_pdf_path)
        return response
    except User_Enterprise.DoesNotExist:
        pass
    except (Form_Enterprise.DoesNotExist):
        pass
    except:
        pass
    return Response(response, status=status_response)

def generate_pdf_digital(form_val, num, answer_values, temporal=False, files_data=None, sign=False, previous=False):
    # Plantilla del documento digital
    form_digital_val = Form_Digital.objects.get(form_enterprise=form_val)
    pdf_template_file = settings.MEDIA_ROOT + '/' + str(form_digital_val.template)
    pdf_template = PdfFileReader(open(pdf_template_file, 'rb'))

    medidas = pdf_template.getPage(0).mediaBox
    num_pages = pdf_template.getNumPages()
    # Asigna el formato y/o tamaño.
    width_pag, height_pag = float(float(medidas[2]) * 0.0352777), float(float(medidas[3]) * 0.0352777)
    pdf = fpdf.FPDF('P', 'cm', [width_pag, height_pag])

    for i in range(num_pages):
        page = i + 1
        # Agrega pagina
        pdf.add_page()
        # Busca los campos que van en el documento digital
        fields_digital = Digital_Field.objects.filter(
            form_digital=form_digital_val,
            page=page,
            state=True
        ).select_related(
            'form_field',
        ).annotate(
            field=F('form_field_id'),
            field_type=F('form_field__field_type_id'),
        ).order_by('form_field_id').values(
            'id',
            'field',
            'field_type',
            'form_field_id',
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

        fields_ids = [ field['form_field_id'] for field in list(fields_digital) ]
        # Campos de tipo tabla
        list_fields = List_Field.objects.filter(
            form_field__id__in=fields_ids,
            form_field__state=True,
            state=True
        ).values(
            'id',
            'field_type_id',
        )
        fields_column_ids = { column['id']: column['field_type_id'] for column in list(list_fields) }
        for field in list(fields_digital):
            answer = ''
            column_type_sign = False
            line_option = False
            try:
                answer = answer_values[field['field']]['value']
                answer_id = answer_values[field['field']]['id']
                if field['field_type'] == 3 or field['field_type'] == 12:
                    if field['option'] == 0:
                        # Muestra el texto de la opción
                        if answer.isdigit():
                            option_val = Option.objects.get(id=answer)
                            answer = option_val.value
                    else:
                        # Marca con una x
                        if str(field['option_value']) == answer:
                            answer = 'x'
                        else:
                            answer = ''
                # Checkbox
                elif field['field_type'] == 13:
                    if answer != '':
                        list_answer = json.loads(answer)
                        if field['option'] == 0:
                            # Muestra el texto de la opción
                            answer_result = ''
                            for option_id in list_answer:
                                if option_id != '' and option_id.isdigit():
                                    option_val = Option.objects.get(id=option_id)
                                    if answer_result != '':
                                        answer_result += ', ' + option_val.value
                                    else:
                                        answer_result = option_val.value
                            answer = answer_result
                        else:
                            # Marca con una x
                            if answer != '':
                                if str(field['option_value']) in list_answer:
                                    answer = 'x'
                                else:
                                    answer = ''
                elif field['field_type'] == 4:
                    if answer != '':
                        if field['option'] in [1, 2, 3]:
                            date_answer = answer.split('-')
                            if field['option'] == 1:
                                # Día
                                answer = date_answer[2]
                            elif field['option'] == 2:
                                # Mes
                                answer = date_answer[1]
                            elif field['option'] == 3:
                                # Año
                                answer = date_answer[0]
                elif field['field_type'] in [7, 8, 9]:
                    if answer != '' and not temporal:
                        answer = settings.MEDIA_ROOT + answer
                elif field['field_type'] == 11:
                    if answer != '':
                        date_answer = answer.split('-')
                        if field['option'] == 0:
                            # Tipo de Documento
                            if len(date_answer) > 1:
                                answer = IDENTIFICATION[date_answer[0]]
                            else:
                                answer = IDENTIFICATION['1']
                        else:
                            # Numero de Documento
                            if len(date_answer) > 1:
                                answer = date_answer[1]
                elif field['field_type'] in [10, 18, 22] and answer and not temporal:
                    # Query Buscar QR
                    if field['field_type'] == 10:
                        try:
                            spd_val = Sign_Profile_Document.objects.get(answer_id=answer_id)
                            img_answer = settings.MEDIA_ROOT +  '/' + spd_val.qr_file
                        except Sign_Profile_Document.DoesNotExist:
                            img_answer = ''
                    elif field['field_type'] == 18:
                        try:
                            pro_doc_val = Profile_document.objects.get(answer_id=answer_id)
                            img_answer = settings.MEDIA_ROOT +  '/' + pro_doc_val.qr_file
                        except Profile_document.DoesNotExist:
                            img_answer = ''
                            # Borrar Temporal
                            if answer != '':
                                datetime_str = '2023-07-02'
                                date_time = datetime.strptime(datetime_str, '%Y-%m-%d')
                                answer_field_val = Answer_Field.objects.get(id=answer_id)
                                if Answer_Form.objects.filter(id=answer_field_val.answer_form_id, creation_date__gte=date_time).exists():
                                    answer_form_val = answer_field_val.answer_form
                                    profile_id = str(answer_field_val.value).split('-')[1].strip()
                                    try:
                                        pro_doc_val = Profile_document.objects.get(id=profile_id)
                                        pro_doc_val.answer_id = answer_field_val.id
                                        url_sign = settings.URL_FRONTEND + 'public/trace/' + pro_doc_val.token_url
                                        register_log(
                                            {
                                                'action': 'Inicio de creacion QR para firma electronica',
                                                'type': 1,
                                                'source': answer_form_val.source,
                                                'url': 'answer',
                                                'data': answer_field_val.value,
                                                'response_data': 'Form: {}, Field: {}, Answer: {}'.format(answer_form_val.form_enterprise_id, answer_field_val.form_field_id, answer_form_val.id)
                                            },
                                            None, answer_form_val.form_enterprise.enterprise_id)
                                        qr_path = create_sign_qr(answer_form_val.form_enterprise.enterprise_id, answer_field_val.id, answer_field_val.id, url_sign)
                                        pro_doc_val.qr_file = qr_path

                                        pro_doc_val.save()
                                        if answer_form_val.doc_hash is None:
                                            answer_form_val.doc_hash = ''
                                        answer_form_val.doc_hash += '-' + str(pro_doc_val.hash_info)
                                        register_log(
                                        {
                                            'action': 'Vinculacion de campo firma electronica Exitoso (QR)',
                                            'type': 1,
                                            'source': answer_form_val.source,
                                            'url': 'answer',
                                            'data': qr_path,
                                            'response_data': 'Form: {}, Field: {}, Answer: {}'.format(answer_form_val.form_enterprise_id, answer_field_val.form_field_id, answer_form_val.id)
                                        },
                                        None, answer_form_val.form_enterprise_id)
                                        img_answer = settings.MEDIA_ROOT +  '/' + pro_doc_val.qr_file
                                    except Profile_document.DoesNotExist:
                                        pass
                    elif field['field_type'] == 22:
                        try:
                            otp_val = Sign_OTP_Document.objects.get(answer_id=answer_id)
                            img_answer = settings.URL + 'media/' + otp_val.qr_file
                        except Sign_OTP_Document.DoesNotExist:
                            img_answer = ''

                    value_answer = ''
                    if answer != '':
                        try:
                            value_answer = answer.split('-')[2]
                        except:
                            pass

                    answer = {
                        'hash': sign if sign else '',
                        'answer': img_answer,
                        'value': value_answer
                    }
                elif field['field_type'] == 17:
                    if answer != '':
                        answer_array = json.loads(answer)
                        try:
                            list_answer_dict = {
                                k: list(g) for k, g in itertools.groupby(list(answer_array[field['row_field']-1]), lambda list: list['field'])
                            }
                            list_answer_dict = {key: [{'answer':val['answer'], 'field':val['field']} for val in value] for key, value in list_answer_dict.items()}
                            answer = list_answer_dict[str(field['list_field'])][0]['answer']
                            field_column = list_answer_dict[str(field['list_field'])][0]['field']

                            if fields_column_ids[int(field_column)] in [3, 12]:
                                if field['option'] == 0:
                                    # Muestra el texto de la opción
                                    if answer.isdigit():
                                        option_val = Option.objects.get(id=answer)
                                        answer = option_val.value
                                else:
                                    # Marca con una x
                                    if str(field['option_value']) == answer:
                                        answer = 'x'
                                    else:
                                        answer = ''
                            elif fields_column_ids[int(field_column)] == 13:
                                if field['option'] == 0:
                                    # Muestra el texto de la opción
                                    answer_result = ''
                                    for option_id in answer:
                                        if option_id != '' and option_id.isdigit():
                                            option_val = Option.objects.get(id=option_id)
                                            if answer_result != '':
                                                answer_result += ', ' + option_val.value
                                            else:
                                                answer_result = option_val.value
                                    answer = answer_result
                                else:
                                    # Marca con una x
                                    if answer != '':
                                        if str(field['option_value']) in answer:
                                            answer = 'x'
                                        else:
                                            answer = ''

                            elif fields_column_ids[int(field_column)] == 7:
                                column_type_sign = True
                                if answer != '' and not temporal:
                                    answer = settings.MEDIA_ROOT + answer
                            elif fields_column_ids[int(field_column)] in [1,2,5,6]:
                                line_option = True

                        except IndexError:
                            answer = ''
                        except KeyError:
                            answer = ''
                elif field['field_type'] == 20:
                    if answer != '' and not temporal:
                        answer_nit = json.loads(answer)
                        answer = answer_nit[4]['numero_identificacion']

                elif field['field_type'] == 23:
                    if answer != '':
                        data_answer = json.loads(answer.replace("'", '"'))
                        country = data_answer[0]
                        state = data_answer[1]
                        city = data_answer[2]

                        answer = ''
                        if field['option'] in [1, 2, 3]:
                            if field['option'] == 1 and country != '':
                                # País
                                answer = COUNTRYS_DATA_DICT[str(country)]['label']
                            elif field['option'] == 2 and country != '' and state != '':
                                # Departamento
                                answer = COUNTRYS_DATA_DICT[str(country)]['states'][str(state)]['label']
                            elif field['option'] == 3 and country != '' and state != '' and city != '':
                                # Ciudad
                                answer = COUNTRYS_DATA_DICT[str(country)]['states'][str(state)]['cities'][str(city)]
                        else:
                            # Todo
                            if country != '':
                                answer = COUNTRYS_DATA_DICT[str(country)]['label']
                                if state != '':
                                    answer += ' - ' + COUNTRYS_DATA_DICT[str(country)]['states'][str(state)]['label']
                                    if city != '':
                                        answer += ' - ' + COUNTRYS_DATA_DICT[str(country)]['states'][str(state)]['cities'][str(city)]

            except (Answer_Field.DoesNotExist):
                pass
            except (Option.DoesNotExist):
                pass
            except KeyError:
                pass
            except Exception as err:
                print('err:::::::::::::::::::::::')
                print(err)

            if answer != '' and answer != None:
                # Tipo firma
                if field['field_type'] in [7, 9, 10, 18] or (field['field_type'] == 22 and field['option'] == 0) or column_type_sign:
                    # Ubicación y tamaño en el documento
                    width = float((float(field['width'])) * 0.0352777)
                    height = float((float(field['height'])) * 0.0352777)
                    left = float((float(field['left']) - 14.99554443359375) * 0.0352777)
                    top = float((float(field['top'])) * 0.0352777)
                    if field['field_type'] == 7:
                        height = float((float(field['height']) + 10.00445556640625) * 0.0352777)
                        # top = float((float(field['top']) + 10.00445556640625) * 0.0352777) - (height/4)
                    if not temporal:
                        if field['field_type'] in [10, 18]:
                            answer_file = answer['answer']
                            extension = imghdr.what(answer_file).lower()
                        elif field['field_type'] != 22:
                            answer_file = answer
                            extension = imghdr.what(answer_file).lower()
                        else:
                            split_value = answer['answer'].split('.')
                            answer_file = answer['answer']
                            extension = split_value[2].lower()

                        if extension in ['jpg', 'jpeg', 'png', 'gif']:
                            pdf.image(answer_file, x=left, y=top, w=width, h=height, type=extension, link = '')

                        if field['field_type'] in [10, 18, 22]:
                            # Pintar el Hash
                            h = "#000000".lstrip('#')
                            color = tuple(int(h[j:j+2], 16) for j in (0, 2, 4))
                            pdf.set_text_color(color[0],color[1],color[2])
                            pdf.set_font('Arial', style='B', size=6)
                            pdf.text(left, top, answer['hash'])
                    else:
                        try:
                            temporal_num = 'temporal/' + num
                            value_answer = ''
                            # Guardar Imagen
                            if field['field_type'] == 7 or column_type_sign:
                                if column_type_sign:
                                    value_answer = handle_drawn_signature(answer, str(field['field']) + '_' + str(field['row_field']), form_val.enterprise_id, temporal_num)
                                else:
                                    value_answer = handle_drawn_signature(answer, field['field'], form_val.enterprise_id, temporal_num)
                            elif files_data != None:
                                if previous:
                                    name_field = 'file_' + str(field['field'])
                                    for fileValue in files_data:
                                      if name_field in fileValue.keys():
                                          value_answer = handle_drawn_signature(str(fileValue[name_field]), field['field'], form_val.enterprise_id, temporal_num, False,fileValue["ext"])
                                else:
                                    name_field = 'file_' + str(field['field'])
                                    if name_field in files_data.keys():
                                        sign_file = files_data[name_field]
                                    value_answer = handle_uploaded_file(sign_file, field['field'], form_val.enterprise_id, temporal_num)

                            if value_answer != '':
                                split_value = value_answer.split('.')
                                extension = split_value[1].lower()
                                if extension in ['jpg', 'jpeg', 'png', 'gif']:
                                    pdf.image(settings.MEDIA_ROOT + value_answer, x=left, y=top, w=width, h=height, type=extension, link = '')
                                # Se elimina la imagen temporal
                                os.remove(settings.MEDIA_ROOT + value_answer)
                        except Exception as er:
                            pass

                else:
                    pdf_style = ''
                    if field['bold']:
                        pdf_style += 'B'
                    if field['italic']:
                        pdf_style += 'I'
                    if field['underline']:
                        pdf_style += 'U'
                    # Conversión de hexadecimal a rgb
                    h = field['color'].lstrip('#')
                    color = tuple(int(h[j:j+2], 16) for j in (0, 2, 4))
                    # Se asigna el color, fuente, estilos y tamaño
                    pdf.set_text_color(color[0],color[1],color[2])
                    pdf.set_font(field['font'], style=pdf_style, size=field['size'])
                    # Ubicación en el documento
                    left = float((float(field['left']) - 14.99554443359375) * 0.0352777)
                    if field['field_type'] == 3:
                        if field['option'] == 1:
                            left = float((float(field['left']) - 11.99554443359375) * 0.0352777)
                    if field['size'] < 15:
                        top = float((float(field['top']) + 10.00445556640625 + (float(field['size'])**0.1)) * 0.0352777)
                    else:
                        top = float((float(field['top']) + 10.00445556640625 + (float(field['size'])**0.45)) * 0.0352777)

                    if field['field_type'] == 22:
                        answer = answer['value']
                    if (field['field_type'] in [1, 2, 5, 6, 25] or line_option) and field['width'] != '' and field['line_height'] != '':
                        width = float((float(field['width'])) * 0.0352777)
                        line_height = float((float(field['line_height'])) * 0.0352777)
                        if top+line_height+1.6516506990765354 > height_pag:
                            pdf.text(left, top, answer)
                        else:
                            pdf.set_xy(left, top - line_height)
                            pdf.multi_cell(w=width, h=line_height, txt= answer, border = 0, align = '', fill = False)
                        # pdf.multi_cell(5,float(20 * 0.0352777), answer, 0, '', False)
                    else:
                        pdf.text(left, top, answer)

    # Archivo temporal
    overlay_pdf_name = 'temp_' + str(num) + '_' + str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + 'pdf'
    result_pdf_name = 'result_' + str(num) + '_' + str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + 'pdf'
    # Carpeta temporal de los archivos
    folder = str(form_val.enterprise_id) + '/digital/temporal/'
    path = settings.MEDIA_ROOT + '/' + folder
    if not os.path.exists(path):
        os.makedirs(path)
    # Ubicación de los archivos
    overlay_pdf_path = path + overlay_pdf_name
    result_pdf_path = path + result_pdf_name

    pdf.output(overlay_pdf_path)
    pdf.close()

    output_pdf = PdfFileWriter()
    for page in range(num_pages):
        # Combinar la página de superposición en la página de plantilla
        template_page = pdf_template.getPage(page)
        overlay_pdf = PdfFileReader(open(overlay_pdf_path, 'rb'))
        template_page.mergePage(overlay_pdf.getPage(page))
        output_pdf.addPage(template_page)
    # Resultado en un archivo nuevo
    output_pdf.write(open(result_pdf_path, "wb"))

    return overlay_pdf_path, result_pdf_path



@api_view(['POST'])
def get_temporal_pdf_movil(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        print(request.auth.key)
        #print(request.data)
        print(user_val)
        response = {"status": True}
        status_response = status.HTTP_200_OK

        data = request.data
        #print(data['fields'])

        answer_field_values = {}
        for field, value in json.loads(data['fields']).items():
            field_data = field.split('_')
            if len(field_data) > 1 and field_data[0] == 'field':
                answer_field_values[int(field_data[1])] = {'value': value,'id': ''}
        #print(answer_field_values)
        #print(str(data['form']))
        form_link_val = Form_Link.objects.get(
                    form_enterprise_id=str(data['form']),
                    state=True
                )
        print(form_link_val.token_link)
        url_form = settings.URL_FRONTEND + 'public/view/pdf/' + form_link_val.token_link+'/'+str(user_val.id)
        print(url_form)

        try:
            form_date_temp = Form_Temporal_Digital.objects.get(
                        user=str(user_val.id)
                    )
            form_date_temp.temporal=answer_field_values
            form_date_temp.id_form=str(data['form'])
            form_date_temp.token=form_link_val.token_link
            form_date_temp.save()

        except Form_Temporal_Digital.DoesNotExist:
            valueFormTemp=Form_Temporal_Digital()
            valueFormTemp.user_id=str(user_val.id)
            valueFormTemp.temporal=answer_field_values
            valueFormTemp.id_form=str(data['form'])
            valueFormTemp.token=form_link_val.token_link
            valueFormTemp.save()

        response['url'] = url_form

    except User_Enterprise.DoesNotExist:
        pass
    except Exception as err:
        print(err)
    return Response(response, status=status_response)


@api_view(['POST'])
# @permission_classes([IsAuthenticated])
def get_temporal_pdf(request, pk, token=None):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        if request.auth and request.user:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            form_val = Form_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
            num = str(pk) + '' + str(user_val.id)
        else:
            form_link_val = Form_Link.objects.get(token_link=token, form_enterprise_id=pk, form_enterprise__state=True, state=True)
            form_val = form_link_val.form_enterprise
            num = str(pk) + '' + str(form_link_val.id)

        data = request.data
        files_data = request.FILES
        # Respuestas del formulario

        answer_field_values = {}
        for field, value in json.loads(data['fields']).items():
            field_data = field.split('_')
            if len(field_data) > 1 and field_data[0] == 'field':
                answer_field_values[int(field_data[1])] = {'value': value,'id': ''}

        print(answer_field_values)
        print(type(answer_field_values))
        print(files_data)
        print(pk)
        # Plantilla del documento digital
        overlay_pdf_path, result_pdf_path = generate_pdf_digital(form_val, num, answer_field_values, True, files_data)

        # return pdf
        with open(result_pdf_path, 'rb') as f:
            file_data = f.read()
        response = HttpResponse(file_data, content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename=form.pdf'
        #os.remove(overlay_pdf_path)
        #os.remove(result_pdf_path)
        print(response)
        return response
    except User_Enterprise.DoesNotExist:
        pass
    except (Form_Link.DoesNotExist):
        pass
    except (Form_Enterprise.DoesNotExist):
        pass
    except Exception as err:
        print(err)
    return Response(response, status=status_response)

class MassiveFormAsnwer(APIView):

    permission_classes = [IsSuperAdmin]

    def get(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            mass_files = Massive_File.objects.filter(
                type=4,
                enterprise__user_enterprise__role_id=2
            ).select_related(
                'enterprise',
            ).annotate(
                name_user=Concat(F('enterprise__user_enterprise__first_name'), Value(' '), F('enterprise__user_enterprise__first_last_name'), output_field=CharField())
            ).values(
                'id',
                'name_user',
                'amount',
                'success',
                'status',
                'date'
            ).order_by('-date')

            return Response({'status': True, 'data': list(mass_files)})
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status_response)

    def post(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        data = request.POST
        if "template" in request.FILES:
            try:
                if data['form'] != '':
                    user_val = User_Enterprise.objects.get(id=data['user'])

                    name_file = str(request.FILES['template'])
                    if name_file.lower().endswith(('.xlsx')):

                        massive_val = Massive_File()
                        massive_val.enterprise_id = user_val.enterprise_id
                        massive_val.amount = 0
                        massive_val.type = 4
                        massive_val.template = request.FILES['template']
                        massive_val.save()

                        form_exists = False
                        try:
                            form_val = Form_Enterprise.objects.get(name=data['form'], enterprise_id=user_val.enterprise_id, state=True)
                            form_exists = True
                        except:
                            form_val = Form_Enterprise()
                            form_val.enterprise_id = user_val.enterprise_id
                            form_val.name = data['form']
                            form_val.description = 'Documento Cargado'
                            form_val.save()

                        path = settings.MEDIA_ROOT + '/' + str(massive_val.template)
                        xlsx = pandas.ExcelFile(path)
                        if len(xlsx.sheet_names) > 0:
                            data_frame = pandas.read_excel(path)
                            # Creación de Preguntas
                            info = 0
                            position = 0
                            array_field = []
                            for index, column in enumerate(data_frame.columns):
                                position_info = False
                                if index == 0 and column.lower() == "coordenadas":
                                    array_field.append(-1)
                                    position_info = True
                                    info += 1
                                if index == 1 and column.lower() == "fecha":
                                    array_field.append(-2)
                                    position_info = True
                                    info += 1
                                if index == 2 and column.lower() == "hora":
                                    array_field.append(-3)
                                    position_info = True
                                    info += 1

                                if not position_info:
                                    position += 1
                                    create_field = True
                                    if form_exists:
                                        try:
                                            field_form_val = Form_Field.objects.get(name=column[:50], form_enterprise=form_val)
                                            create_field = False
                                        except:
                                            pass
                                    if create_field:
                                        field_form_val = Form_Field()
                                        field_form_val.form_enterprise = form_val
                                        field_form_val.name = column[:50]
                                        field_form_val.position = position
                                        field_form_val.help = ''
                                        field_form_val.obligatory = False
                                        field_form_val.field_type_id = 1
                                        field_form_val.save()

                                    array_field.append(field_form_val.id)

                            all_position = info + position

                            values_answer = data_frame.to_numpy().tolist()

                            massive_val.amount = len(values_answer)
                            massive_val.save()

                            new_thread = Thread(target=run_form, args=(massive_val, user_val, form_val, values_answer, all_position, array_field))
                            new_thread.start()


                            response['status'] = True
                            response['data'] = {
                                'id': massive_val.id,
                                'name_user': user_val.first_name + ' ' + user_val.first_last_name,
                                'amount': massive_val.amount,
                                'success': 0,
                                'status': 0
                            }
                            status_response = status.HTTP_202_ACCEPTED
            except User_Enterprise.DoesNotExist:
                pass
            except Exception as e:
                print(e)
        return Response(response, status_response)

def run_form(massive, user_val, form_val, values_answer, position, array_field):
    for answer in values_answer:
        location_data = ''
        date = ''
        hour = ''
        for i in range(3):
            if array_field[i] == -1:
                location_data = answer[i]
            if array_field[i] == -2:
                date = answer[i]
            if array_field[i] == -3:
                hour = answer[i]

        answer_form_val = Answer_Form()
        answer_form_val.form_enterprise = form_val
        answer_form_val.created_by = user_val
        answer_form_val.source = 1
        if location_data != '':
            location = location_data.split(',')
            answer_form_val.latitude = location[0]
            answer_form_val.longitude = location[1]
        if date != '':
            try:
                date_answer = date
                if hour != '':
                    date_answer += ' ' + hour
                    date_time = datetime.strptime(date_answer, '%Y-%m-%d %H:%M:%S')
                else:
                    date_time = datetime.strptime(date_answer, '%Y-%m-%d')
                answer_form_val.creation_date = date_time
            except:
                pass
        answer_form_val.save()
        for i in range(position):
            if array_field[i] > 0 and str(answer[i]) != '':
                answer_field_val = Answer_Field()
                answer_field_val.answer_form = answer_form_val
                answer_field_val.form_field_id = array_field[i]
                answer_field_val.value = str(answer[i])[:200]
                answer_field_val.save()
        massive.success += 1
        massive.save()

    massive.status = 1
    massive.save()

def form_needs_doc_sign(form_id, answer_id=False, form_consecutive_id=False):
    if not form_consecutive_id:
        return Form_Field.objects.filter(
            form_enterprise_id=form_id,
            field_type_id__in=[7,10,18,22],
            state=True).exists()
    else:
        answer_form_consecutive = Answer_Form_Consecutive.objects.filter(answer_consecutive_id=answer_id, state=True).count()
        form_vals_ids = Form_Consecutive.objects.filter(form_enterprise_id=form_consecutive_id, state=True).values_list('form_id', flat=True)
        return Form_Field.objects.filter(
            form_enterprise_id__in=form_vals_ids,
            field_type_id__in=[7,10,18,22],
            state=True).exists() and (
                answer_form_consecutive == len(form_vals_ids)
            )

test_service = True

def sign_doc_digitally(user_val, enterprise, form_answer, consecutive_answer=False, lr_threads = [], id_Task=''):
    for thread in lr_threads:
        thread.join()
    form_val = form_answer.form_enterprise
    register_log(
        {
            'action': 'Preparación de PDF para firmado',
            'type': 1,
            'source': form_answer.source,
            'url': 'answer',
            'data': 'Form: {}, Answer: {}'.format(enterprise, str(form_answer.id) + ('-' + str(consecutive_answer.id) if consecutive_answer else '')),
        }, None, enterprise)
    # Rutas de archivos temporales y finales
    media_path = settings.MEDIA_ROOT + '/'
    path, final_path = sign_doc_directory_path(enterprise, consecutive_answer.id if consecutive_answer else form_answer.id , include_path=True)

    file_path = sign_doc_directory_path(enterprise, 'temp_' + str(consecutive_answer.id if consecutive_answer else form_answer.id))

    # crear la ruta si no existe
    if not os.path.exists(media_path + path):
        os.makedirs(media_path + path)

    # Consecutivo
    if consecutive_answer:
        # Consecutivo Digital
        if consecutive_answer.form_consecutive.digital:
            answer_list = []
            answer_form_consecutive_val = Answer_Form_Consecutive.objects.filter(answer_consecutive=consecutive_answer)
            for form in list(answer_form_consecutive_val):
                answer_list.append(form.answer_form_id)
            # Respuestas del formulario
            answer_field_values = Answer_Field.objects.filter(
                answer_form_id__in=answer_list, form_field__state=True
            ).values(
                'id',
                'form_field_id',
                'value'
            )

            answer_field_values = {
                temporal['form_field_id']: {'value': temporal['value'] ,'id': temporal['id']} for temporal in list(answer_field_values)
            }
            register_log(
                {
                    'action': 'Creacion de PDF Temporal para firmado - Consecutivo - Digital',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id) + ('-' + str(consecutive_answer) if consecutive_answer else '')),
                }, None, enterprise)
            overlay_pdf_path, temp_file_path = generate_pdf_digital(consecutive_answer.form_consecutive, consecutive_answer.form_consecutive.id, answer_field_values, sign=consecutive_answer.doc_hash)
        # Consecutivo Sin plantilla
        else:
            register_log(
                {
                    'action': 'Creacion de PDF Temporal para firmado - Consecutivo',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id) + ('-' + str(consecutive_answer) if consecutive_answer else '')),
                }, None, enterprise)
            result = generate_pdf_from_data(form_answer.created_by, 1, consecutive_answer.id, logo=user_val.enterprise.logo if user_val else form_val.enterprise.logo, sign=consecutive_answer.doc_hash)
            temp_file_path = media_path + file_path
            with open(temp_file_path, 'wb+') as f:
                f.write(result.content)
                f.close()
        register_log(
            {
                'action': 'Creacion de PDF Temporal para firmado - Consecutivo' + (' - Digital' if consecutive_answer.form_consecutive.digital else '') + ' - Exitoso',
                'type': 1,
                'source': form_answer.source,
                'url': 'answer',
                'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id) + ('-' + str(consecutive_answer) if consecutive_answer else '')),
                'response_data': temp_file_path,
            }, None, enterprise)
        sign_document(user_val, temp_file_path, final_path, consecutive_answer, enterprise, True)
    # Individual
    else:
        # Individual Digital
        if form_answer.form_enterprise.digital:
            answer_field_values = Answer_Field.objects.filter(
                answer_form=form_answer
            ).select_related(
                'form_field',
            ).values(
                'id',
                'form_field_id',
                'value'
            )

            answer_field_values = {
                temporal['form_field_id']: {'value': temporal['value'] ,'id': temporal['id']} for temporal in list(answer_field_values)
            }

            register_log(
                {
                    'action': 'Creacion de PDF Temporal para firmado - Digital',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id) + ('-' + str(consecutive_answer) if consecutive_answer else '')),
                }, None, enterprise)
            overlay_pdf_path, temp_file_path = generate_pdf_digital(form_val, form_answer.id, answer_field_values, sign=form_answer.doc_hash)
        # Individual Sin plantilla
        else:
            register_log(
                {
                    'action': 'Creacion de PDF Temporal para firmado',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id) + ('-' + str(consecutive_answer) if consecutive_answer else '')),
                }, None, enterprise)
            result = generate_pdf_from_data(form_answer.created_by, 0, form_answer.id, logo=user_val.enterprise.logo if user_val else form_val.enterprise.logo, sign=form_answer.doc_hash)
            temp_file_path = media_path + file_path
            with open(temp_file_path, 'wb+') as f:
                f.write(result.content)
                f.close()
        register_log(
            {
                'action': 'Creacion de PDF Temporal para firmado' + (' - Digital' if form_answer.form_enterprise.digital else '') + ' - Exitoso',
                'type': 1,
                'source': form_answer.source,
                'url': 'answer',
                'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id) + ('-' + str(consecutive_answer) if consecutive_answer else '')),
                'response_data': temp_file_path,
            }, None, enterprise)
        sign_done = sign_document(user_val, temp_file_path, final_path, form_answer, enterprise)
    Thread(target=send_email_signers_admin, args=(enterprise, final_path if sign_done else temp_file_path, form_answer.id, consecutive_answer,id_Task)).start()


def sign_document(user_val, temp_file_path, final_path, form_answer, enterprise, consecutive=False):
    media_path = settings.MEDIA_ROOT + '/'
    # print(temp_file_path)
    # print('===========================================================')
    # print(final_path)

    try:
        if GSESigner().sign_doc(temp_file_path, media_path + final_path):
            register_log(
                {
                    'action': 'Primera Firma - GSE - Exitosa',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id)),
                }, None, enterprise)

            os.unlink(temp_file_path)
            log_content = {
                'user': user_val.id if user_val else None,
                'group': 53 if not consecutive else 61,
                'element': form_answer.id,
                'action': 12,
                'description': "El usuario denominado: " + ('#'+str(user_val.id) if user_val else 'Usuario Publico')+" genero la firma digital del documento diligenciado #" + str(form_answer.id),
            }
            if not consecutive:
                Signed_Document.objects.filter(answer_form_id=form_answer.id).update(status=False)
                doc_sign_val = Signed_Document()
                doc_sign_val.answer_form_id = form_answer.id
                doc_sign_val.created_by = form_answer.created_by
                doc_sign_val.pdf_path = final_path
                doc_sign_val.save()
            else:
                Signed_Document_Consecutive.objects.filter(answer_consecutive_id=form_answer.id).update(status=False)
                doc_sign_val = Signed_Document_Consecutive()
                doc_sign_val.answer_consecutive_id = form_answer.id
                doc_sign_val.created_by = form_answer.created_by
                doc_sign_val.pdf_path = final_path
                doc_sign_val.save()
            register_log(
                {
                    'action': 'Vinculado de PDF Firmado a Respuesta Documento',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id)),
                }, None, enterprise)
            # funcion para log de firma digital
            create_traceability(log_content)

            if (not consecutive and enterprise == 11) or (consecutive and enterprise == 11):
                register_log(
                {
                    'action': 'Inicio de Segunda Firma - ECCI',
                    'type': 1,
                    'source': form_answer.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id)),
                }, None, enterprise)
                if EcciSigner().sign_doc(media_path + final_path):
                    register_log(
                        {
                            'action': 'Segunda Firma - ECCI - Exitosa',
                            'type': 1,
                            'source': form_answer.source,
                            'url': 'answer',
                            'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id)),
                        }, None, enterprise)
            return True
        else:
            raise Exception('Fallo Servicio GSE')
    except Exception as err:
        register_log(
            {
                'action': 'Firma Digital PDF',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'Form: {}, Answer: {}'.format(form_answer.form_enterprise_id, str(form_answer.id)),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, enterprise)
    return False


@api_view(['POST'])
def create_public_answer(request, token):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    files_data = request.FILES
    ans_con_id = False
    form_con_id = False
    url_path = request.path

    action = 1
    action_name = ' diligencio'

    try:
        form_link_val = Form_Link.objects.get(token_link=token, state=True)
        # Condicionales
        if form_link_val.date_state:
            now = datetime.now(tz=TZ_INFO)
            if now.date() > form_link_val.max_date:
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
                return Response(response, status=status_response)

        if 'consecutive' in data and data['consecutive'] != '':
            if 'answer' in data and data['answer'] != '':
                try:
                    answer_consecutive_val = Answer_Consecutive.objects.get(id=data['answer'], created_by=None)
                    answer_consecutive_val.state = True
                    answer_consecutive_val.save()
                except (Answer_Consecutive.DoesNotExist):
                    return Response(response)
            else:
                # Asignación de Serial
                serial_number_val = assing_serial(form_link_val.form_enterprise.enterprise_id)

                answer_consecutive_val = Answer_Consecutive()
                answer_consecutive_val.form_consecutive_id = data['consecutive']
                answer_consecutive_val.created_by = None
                answer_consecutive_val.public = True
                if 'source' in data and data['source'] != '':
                    # 1 Web - 2 Movil
                    answer_consecutive_val.source = data['source']
                if 'position' in data:
                    position = json.loads(data['position'])
                    answer_consecutive_val.latitude = position['lat']
                    answer_consecutive_val.longitude = position['lon']
                if 'online' in data and data['online'] != '':
                    # 0 Offline - 1 Online
                    answer_consecutive_val.online = data['online']
                    if data['online'] == 0 or data['online'] == '0':
                        offline_consecutive = True
                answer_consecutive_val.serial_number = serial_number_val
                answer_consecutive_val.save()
            response['answer'] = answer_consecutive_val.id
            ans_con_id = answer_consecutive_val.id
            form_con_id = answer_consecutive_val.form_consecutive_id

        source = 1
        # 1 Web - 2 Movil
        if 'source' in data and data['source'] != '':
            source = data['source']

        # Respuesta Nueva
        answer_form_val = Answer_Form()
        answer_form_val.form_enterprise_id = data['form']
        answer_form_val.created_by = None
        answer_form_val.source = source
        answer_form_val.public = True
        # Version
        if 'version' in data:
            answer_form_val.form_version = data['version']
        else:
            answer_form_val.form_version = answer_form_val.form_enterprise.version


        if not ('consecutive' in data and data['consecutive'] != ''):
            # Asignación de Serial
            serial_number_val = assing_serial(form_link_val.form_enterprise.enterprise_id)
            answer_form_val.serial_number = serial_number_val

        if ('position' in data):
            position = json.loads(data['position'])
            answer_form_val.latitude = position['lat']
            answer_form_val.longitude = position['lon']
        if 'online' in data and data['online'] != '':
            # 0 Offline - 1 Online
            answer_form_val.online = data['online']
        answer_form_val.save()

        if 'service' in data and data['service'] != '':
            save_answer_service(answer_form_val, data['service'])

        if 'consecutive' in data and data['consecutive'] != '':
            save_answer_consecutive(answer_consecutive_val, answer_form_val)
        if 'extencion' in data and data['extencion'] != '':
                ext = json.loads(data['extencion'])
        else:
            ext = ""

        arrayEmails=[]
        if 'emails' in data and data['emails'] != '':
            arrayEmails=data["emails"]
        lr_threads = save_answer_field(form_link_val.form_enterprise.enterprise_id, data['form'], answer_form_val, data['fields'], files_data, ext=ext, emails = arrayEmails)
        if not ('consecutive' in data and data['consecutive'] != ''):
            log_content = {
                'user': None,
                'group': 53,
                'element': answer_form_val.id,
                'action': action,
                'description': ("Un Usuario Público" + action_name + " la respuesta #" + str(answer_form_val.id) +
                " del documento #" + str(answer_form_val.form_enterprise_id) + ' "' +
                answer_form_val.form_enterprise.name + '"'),
            }
            create_traceability(log_content)
            if 'trace_token' in data and data['trace_token'] != '':
                # print('Traceability_User')
                Traceability_User.objects.filter(element=data['trace_token']).update(group=53, element=answer_form_val.id)
            url = url_path[:-1].split('/')
            Form_Link.objects.filter(token_link=str(url[len(url)-1])).update(process_state_id=21)
        else:
            log_content = {
                'user': None,
                'group': 61,
                'element': answer_consecutive_val.id,
                'action': action,
                'description': ("Un Usuario Público" + action_name + " la respuesta #" + str(answer_consecutive_val.id) +
                " del documento multisección #" + str(answer_consecutive_val.form_consecutive_id) + ' "' +
                answer_consecutive_val.form_consecutive.name + '"'),
            }
            if 'trace_token' in data and data['trace_token'] != '':
                Traceability_User.objects.filter(element=data['trace_token']).update(group=61, element=answer_consecutive_val.id)
        generate_log("", str(data), "Información del documento guardada:",form_link_val.form_enterprise.enterprise_id, None, "1")

        # Verifica y genera el pdf del formulario con la firma digital
        if form_needs_doc_sign(answer_form_val.form_enterprise_id, ans_con_id, form_con_id):
            id_Task = ''
            register_log(
                {
                    'action': 'Inicio de Firmado de PDF - Publico',
                    'type': 1,
                    'source': answer_form_val.source,
                    'url': 'answer',
                    'data': 'Form: {}, Answer: {}'.format(str(answer_form_val.form_enterprise_id), str(answer_form_val) + ('-' + str(ans_con_id) if ans_con_id else '')),
                }, None, form_link_val.form_enterprise.enterprise_id)
            Thread(target=sign_doc_digitally, args=(None, form_link_val.form_enterprise.enterprise_id,
                answer_form_val,
                answer_consecutive_val if ans_con_id else ans_con_id, lr_threads,id_Task)).start()

        response['status'] = True
        status_response = status.HTTP_200_OK
    except (Form_Link.DoesNotExist):
        pass
    return Response(response, status=status_response)

def create_sign_qr(enterprise, form, field, url):
    # Crear QR
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + ".png"
    folder = str(enterprise) + '/answer_form/' + str(form) + '/' + str(field) + '/'
    path = settings.MEDIA_ROOT + '/' + folder

    if not os.path.exists(path):
        os.makedirs(path)
    path += name

    create_qr(url, path)

    return folder + name

def get_unique_answer_field(form_field_id, answer):
    try:
        fields_form = Form_Field.objects.filter(
                form_field_id = form_field_id, value = answer, state=True
            )
        return True
    except Form_Field.DoesNotExist:
        return False

@api_view(['POST'])
def get_sign_info(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    try:
        token = data['token']
        consecutive = None
        sign_data = []
        logs_data = []
        # log_group = [53, 19]
        log_group = [53]
        target = [-1]
        try:
            sign_val = Profile_document.objects.get(token_url=token)
        except Profile_document.DoesNotExist:
            try:
                sign_val = Sign_Profile_Document.objects.get(token_url=token)
            except Sign_Profile_Document.DoesNotExist:
                try:
                    sign_val = Sign_OTP_Document.objects.get(token_url=token)
                except Sign_OTP_Document.DoesNotExist:
                    raise Exception('Datos Erroneos, este link es invalido.')
        answer_field_val = sign_val.answer
        answer_form_id = answer_field_val.answer_form_id
        doc_hash = answer_field_val.answer_form.doc_hash
        latitude = answer_field_val.answer_form.latitude
        longitude = answer_field_val.answer_form.longitude
        form_val = answer_field_val.answer_form.form_enterprise
        enterprise_val = answer_field_val.answer_form.form_enterprise.enterprise
        user_val = answer_field_val.answer_form.created_by
        user_name = '{} {}({})'.format(user_val.first_name + ' ' + (user_val.middle_name if user_val.middle_name else ''),
                                       user_val.first_last_name + ' ' + (user_val.second_last_name if user_val.second_last_name else ''),
                                       user_val.email) if user_val else 'Usuario Publico'

        # Verificar si forma parte de una respuesta consecutivo
        try:
            consecutive = Answer_Form_Consecutive.objects.get(answer_form_id=answer_form_id)
            log_group = [61]
            target = [consecutive.answer_consecutive_id]
            doc_hash = consecutive.answer_consecutive.doc_hash

        except Answer_Form_Consecutive.DoesNotExist:
            target = [answer_form_id]

        if consecutive:
            answer_form_ids = Answer_Form_Consecutive.objects.filter(answer_consecutive_id=consecutive.answer_consecutive_id).values_list('answer_form_id', flat=True)
        else:
            answer_form_ids = [answer_form_id]

        # Carga las respuestas que sean Firma Electroníca, biometríca u OTP
        sign_fields = Answer_Field.objects.filter(
                answer_form_id__in=answer_form_ids,
                form_field__field_type_id__in=[10, 18, 22],
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
        otp_fields_ids = answer_list['22'] if '22' in answer_list else []

        sign_data = []

        # Adjunta la información de los firmantes de biometrico
        if bio_fields_ids:
            bio_array = Sign_Profile_Document.objects.filter(
                    answer_id__in=[bio['id'] for bio in bio_fields_ids]
                ).select_related(
                    'profile'
                ).values(
                    'profile__name',
                    'profile__identification',
                    'profile__email',
                    'profile__phone',
                    'hash_info',
                    'token_registry'
                    # 'restrictive_lists',
                )

            sign_data += [
                {
                    'name': bio['profile__name'],
                    'identification': bio['profile__identification'],
                    'email': bio['profile__email'],
                    'phone': bio['profile__phone'],
                    'hash_info': bio['hash_info'],
                    'bio': True,
                    # 'restrictive_lists': bio['restrictive_lists'],
                } for bio in list(bio_array)
            ]

            target = target + [bio['token_registry'] for bio in list(bio_array)]

        # Adjunta la información de los firmantes electronicos
        if sign_fields_ids:
            sign_data += list(Profile_document.objects.filter(
                    answer_id__in=[sign['id'] for sign in sign_fields_ids]
                ).select_related(
                    'profile'
                ).values(
                    'name',
                    'identification',
                    'email',
                    'phone',
                    'hash_info',
                    # 'restrictive_lists',
                ))

        if otp_fields_ids:
            otp_array = Sign_OTP_Document.objects.filter(
                answer_id__in=[otp['id'] for otp in otp_fields_ids]
            ).values(
                'email',
                'hash_info',
                'token_registry'
            )

            sign_data += [{
                'name': '',
                'identification': '',
                'email': otp['email'],
                'phone': '',
                'hash_info': otp['hash_info'],
            } for otp in list(otp_array)]

            target = target + [otp['token_registry'] for otp in list(otp_array)]

        # Consulta de Logs del documento
        logs_data = Traceability_User.objects.filter(group__in=log_group, element__in=target).order_by('creation_date').values('action', 'description', 'creation_date', 'extra')

        # Info empresa
        variable_footer = Variable_Plataform.objects.get(name="footer")
        data_enterprise = {
            'name': enterprise_val.name,
            'logo': [settings.URL + 'media/', str(enterprise_val.logo)],
            'footer': variable_footer.value
        }

        response['data'] = {
            'logs': logs_data,
            'signs': sign_data,
            'enterprise': data_enterprise,
            'user': user_name,
            'form': form_val.name,
            'ubication': str(latitude)+", "+str(longitude),
            'form_id': answer_form_id,
            'doc_hash': doc_hash,
            'doc_hash_sha': hashlib.sha512( str( doc_hash ).encode("utf-8") ).hexdigest(),
            'doc_hash_sha2': hashlib.sha256(doc_hash.encode('utf-8')).hexdigest(),
        }

        response['status'] = True
        status_response = status.HTTP_200_OK
    except KeyError:
        response['detail'] = 'Faltan Datos'
    except (Answer_Form.DoesNotExist):
        response['detail'] = 'No existe este registro'
    except Exception as err:
        response['detail'] = str(err)

    return Response(response, status=status_response)

import pandas as pd
import numpy as np

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_as_excel(request, consecutive, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        list_form, data_template = data_list_form(user_val, consecutive, pk, True)

        columns = []
        answers = []

        for n, form in enumerate(list_form):
            for col in form['fields']:
                if col['type'] == 17:
                    if col['answer']:
                        for i in range(0, col['answer']['max_row']):
                            columns = columns + [col['name'] + '-' + str(i+1)+ '-' + head[1] for head in col['answer']['head']]
                            for head in col['answer']['head']:
                                temp_value = ''
                                try:
                                    for ans in col['answer']['body'][i]:
                                        if ans['field'] == str(head[0]):
                                            temp_value = ans['answer']
                                            break
                                except IndexError:
                                    pass
                                answers.append(temp_value)
                else:
                    columns.append(col['name'])
                    answers.append(col['answer'])

        if columns and answers:
            df = pd.DataFrame(np.array([answers]), columns=columns)
            file_path = os.path.join(settings.MEDIA_ROOT, str(user_val.enterprise_id), 'answer_form', 'temporal')

            if not os.path.exists(file_path):
                os.makedirs(file_path)

            file_path = os.path.join(file_path, 'reporte'+ datetime.now().strftime('%Y%m%d_%H%M%S%f') + '.xlsx')
            df.to_excel(file_path, index=False)
            content = None
            with open(file_path, 'rb') as f:
                content = f.read()
            response = HttpResponse(content, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="{}"'.format('Subidas.xlsx')
            os.unlink(file_path)
            return response
        return Response({'col': columns, 'ans': answers}, status=status.HTTP_200_OK)
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

def data_list_form_by_document(user:User_Enterprise, doc_id, option_date, date_init, date_end, limit,rol_select,user_select,formatDate,field_disabled):
    formatter = ExcelFormater()
    form_val = Form_Enterprise.objects.get(
        id = doc_id,
        enterprise_id = user.enterprise_id
    )
    if date_end:
        # Se añade un dia para la funcionalidad del filtro
        date_end = datetime.strptime(date_end.split('T')[0], '%Y-%m-%d').replace(tzinfo=TZ_INFO) + timedelta(days=1, minutes=4)
    answer_forms = []
    if not form_val.consecutive:
        if rol_select == "0" and  user_select == []:
            query_answer_forms = Answer_Form.objects.filter(
                form_enterprise_id=doc_id,
                consecutive=False,
                state=True
            )
        else:
            query_answer_forms = Answer_Form.objects.filter(
                form_enterprise_id=doc_id,
                consecutive=False,
                state=True,
                created_by_id__in=user_select
            )

        query_answer_forms = query_answer_forms.filter(
            Q(validate_answer_form__show=True) | Q(validate_answer_form__show=None),
        )

        # Busqueda de respuestas segun el rol
        if user.role_id != 2 and (user.role_enterprise and not user.role_enterprise.view_all):
            query_answer_forms = query_answer_forms.filter(
                created_by=user
            )
        # Rango de fechas
        if option_date == "1":
            if date_init and date_end:
                query_answer_forms = query_answer_forms.filter(
                    creation_date__gte = date_init,
                    creation_date__lte = date_end,
                )
            elif date_init:
                query_answer_forms = query_answer_forms.filter(
                    creation_date__gte = date_init,
                )
            elif date_end:
                query_answer_forms = query_answer_forms.filter(
                    creation_date__lte = date_end,
                )
        else:
            if option_date == "2":
                if date_init and date_end:
                    query_answer_forms = query_answer_forms.filter(
                        time_stamp__gte = date_init,
                        time_stamp__lte = date_end,
                    )
                elif date_init:
                    query_answer_forms = query_answer_forms.filter(
                        time_stamp__gte = date_init,
                    )
                elif date_end:
                    query_answer_forms = query_answer_forms.filter(
                        time_stamp__lte = date_end,
                    )

        # Contador de respuestas totales por rol
        count = query_answer_forms.count()
        # limit
        if limit:
            answer_forms = query_answer_forms[:10].values_list('id', flat=True)
        else:
            answer_forms = query_answer_forms.values_list('id', flat=True)

        if count == 0:
            return [], [], 0

        # Lista de Campos en tipo tabla
        list_field_values = List_Field.objects.filter(
            form_field__form_enterprise_id=doc_id,
            form_field__state=True,
            state=True
        ).select_related(
            'form_field'
        ).order_by('position').values(
            'form_field_id',
            'field_type_id',
            'id',
            'name',
            'form_field__form_enterprise_id',
        )
        # Arreglo con todas las columnas
        get_attr = lambda list: str(list['form_field__form_enterprise_id']) + '_' + str(list['form_field_id'])  \
            if 'form_field_id' in list and 'form_field__form_enterprise_id' in list else 0
        list_field_values = {
            k: [[j['id'],j['name'], j['field_type_id']] for j in g]
            for k, g in itertools.groupby(sorted(list_field_values, key=get_attr), get_attr)
        }

        fields_form = Form_Field.objects.filter(
            form_enterprise_id=doc_id
        ).order_by(
            'position',
            '-field_type__name'
        ).values(
            'field_type_id',
            'id',
            'row',
            'name',
            'form_enterprise_id',
            'state'
        )

        # field_type_id, id, row, name

        answer_field_values = Answer_Field.objects.filter(
            answer_form_id__in=[ans for ans in list(answer_forms)],
            state=True
        ).select_related(
            'form_field',
            'answer_form'
        ).order_by(
            'answer_form_id',
            'form_field__position',
            'form_field__field_type_id'
        ).values(
            'answer_form_id',
            'answer_form__online',
            'form_field_id',
            'value',
            'form_field__field_type_id',
            'form_field__name',
            'form_field__state',
            'answer_form__creation_date',
            'answer_form__time_stamp',
            'answer_form__created_by_id',
            'answer_form__latitude',
            'answer_form__longitude',
        )

        get_attr = lambda list: list['answer_form_id']
        answer_field_vals = {
            k: list(g) for k, g in itertools.groupby(answer_field_values, get_attr)
        }

        # Consulta de opciones de los campos unicos y lista
        option_list = Option.objects.filter(
            id__in=[
                ans_val['value']
                for ans_val in answer_field_values
                if ans_val['form_field__field_type_id'] in [3, 12] and ans_val['value'].isdigit()
            ]
        ).values('id', 'value')

        # Busqueda y concatenación de opciones de campo multiple
        multiple_id_list = []
        for ans_val in [a_v for a_v in answer_field_values if a_v['form_field__field_type_id'] == 13 and a_v['value']!='']:
            multiple_id_list = multiple_id_list + \
                [
                    ans_mul
                    for ans_mul in json.loads(ans_val['value'])
                    if ans_mul != '' and ans_mul.isdigit() and ans_mul not in multiple_id_list
                ]

        # Opciones en campos de tipo tabla
        option_list_table = Option_List_Field.objects.select_related(
            'option'
        ).filter(
            list_field__form_field_id__in=[field['id'] for field in fields_form if field['field_type_id'] == 17]
        ).values_list('option_id', flat=True)

        option_list = list(option_list) + list(Option.objects.filter(
            id__in=multiple_id_list + list(option_list_table)
        ).values('id', 'value'))

        option_list = {
            str(option['id']): option['value'] for option in option_list
        }

        # Información de usuarios en la empresa que podian diligenciar los formularios
        user_values = User_Enterprise.objects.filter(
            enterprise_id=user.enterprise_id
        )
        if not (rol_select == "0" and user_select == []):
            user_values = user_values.filter(
                id__in=user_select
            )
        user_values = user_values.values(
            'id',
            'identification',
            'first_name',
            'middle_name',
            'first_last_name',
            'second_last_name',
        )

        # Reestructuración a Diccionario para facilitar acceso
        user_values = { user['id']: user for user in list(user_values) }

        answer_data = []
        for answer_id, answer_fields in (answer_field_vals).items():
            list_field = [answer_id,]
            # date=answer_fields[0]['answer_form__creation_date'] - timedelta(hours=5)
            date=answer_fields[0]['answer_form__creation_date']
            list_field.append(date.astimezone(TZ_INFO).strftime('%Y-%m-%d %H:%M:%S') if len(answer_fields) else '')
            # Sincronización
            if len(answer_fields) and answer_fields[0]['answer_form__time_stamp'] != None:
                # date_sinc=answer_fields[0]['answer_form__time_stamp'] - timedelta(hours=5)
                date_sinc=answer_fields[0]['answer_form__time_stamp']
                list_field.append(date_sinc.astimezone(TZ_INFO).strftime('%Y-%m-%d %H:%M:%S') if len(answer_fields) else '')
            else:
                list_field.append('')
            # Datos Usuario
            if len(answer_fields) and answer_fields[0]['answer_form__created_by_id'] != None:
                usar_data = user_values[answer_fields[0]['answer_form__created_by_id']] if answer_fields[0]['answer_form__created_by_id'] in user_values else None
                name_user = (
                    usar_data['first_name'] + " " +
                    (usar_data['middle_name'] + " " if usar_data['middle_name'] else '') +
                    usar_data['first_last_name'] +
                    (" " + usar_data['second_last_name'] if usar_data['second_last_name'] else '')
                )
                list_field.append(name_user)
                list_field.append(usar_data['identification'])
            else:
                list_field.append('Usuario Publico')
                list_field.append('')
            list_field.append(answer_fields[0]['answer_form__latitude'] if len(answer_fields) else '')
            list_field.append(answer_fields[0]['answer_form__longitude'] if len(answer_fields) else '')
            for answer_field_val in answer_fields:
                if not int(field_disabled) and answer_field_val['form_field__state'] == False:
                    continue
                answer = ''
                type_field = answer_field_val['form_field__field_type_id']
                field_form_id = answer_field_val['form_field_id']
                # print(answer_field_val)
                try:
                    if type_field in [3, 12]:
                        answer = answer_field_val['value']
                        if answer.isdigit() and str(answer) in option_list:
                            answer = option_list[str(answer)]
                    elif type_field == 13:
                        if answer_field_val['value'] != '':
                            list_answer = json.loads(answer_field_val['value'])
                            for option_id in list_answer:
                                if option_id != '' and option_id.isdigit():
                                    option_val = option_list[str(option_id)]
                                    if answer != '':
                                        answer += ', ' + option_val
                                    else:
                                        answer = option_val
                    elif type_field in [7, 8, 9] or (type_field == 10 and not answer_field_val['answer_form__online']):
                        answer =  settings.URL + 'media' + answer_field_val['value']
                    elif type_field == 17:
                        # print(list_field_values)
                        # Campos de tipo tabla
                        answer = {
                            'head': list_field_values[str(doc_id)+'_'+str(field_form_id)],
                            'body': '',
                        }
                        if answer_field_val['value'] != '':

                            single_list_fields = []
                            check_list_fields = []
                            sign_list_fields = []
                            key = str(doc_id) + '_' + str(field_form_id)
                            for list_field_val in list_field_values[key]:
                                if list_field_val[2] in [3, 12]:
                                    single_list_fields.append(list_field_val[0])
                                elif list_field_val[2] == 13:
                                    check_list_fields.append(list_field_val[0])
                                elif list_field_val[2] == 7:
                                    sign_list_fields.append(list_field_val[0])

                            list_field_answer = json.loads(answer_field_val['value'])
                            row = 0
                            for list_row_answer in list_field_answer:
                                row += 1
                                for list_answer in list_row_answer:
                                    if int(list_answer['field']) in single_list_fields:
                                        if list_answer['answer'] != '':
                                            option_val = option_list[str(list_answer['answer'])]
                                            list_answer['answer'] = option_val
                                    elif int(list_answer['field']) in check_list_fields:
                                        answer_check = ''
                                        for option_id in list_answer['answer']:
                                            if option_id != '' and option_id.isdigit():
                                                option_val = option_list[str(option_id)]
                                                if answer_check != '':
                                                    answer_check += ', ' + option_val
                                                else:
                                                    answer_check = option_val
                                        list_answer['answer'] = answer_check
                                    elif int(list_answer['field']) in sign_list_fields:
                                        list_answer['answer'] = settings.URL + 'media' + list_answer['answer']
                            answer['body'] = list_field_answer
                            answer = answer
                    elif type_field in [10, 18, 22] and answer_field_val['answer_form__online']:
                        if type_field == 10:
                            try:
                                spd_val = Sign_Profile_Document.objects.get(answer_id=answer_field_val['answer_form_id'])
                                answer = settings.URL + 'media/' + spd_val.qr_file
                            except Sign_Profile_Document.DoesNotExist:
                                answer = ''
                        elif type_field == 18:
                            try:
                                pro_doc_val = Profile_document.objects.get(answer_id=answer_field_val['answer_form_id'])
                                answer = settings.URL + 'media/' + pro_doc_val.qr_file
                            except Profile_document.DoesNotExist:
                                answer = ''
                        elif type_field == 22:
                            try:
                                otp_val = Sign_OTP_Document.objects.get(answer_id=answer_field_val['answer_form_id'])
                                answer = settings.URL + 'media/' + otp_val.qr_file
                            except Sign_OTP_Document.DoesNotExist:
                                answer = ''
                    else:
                        answer = answer_field_val['value']
                except KeyError as e:
                    print('KEYERROR::::::::::::::::::::::::::::::::', e,)
                    pass
                if type_field == 11:
                    type_answer_ident =''
                    number_answer_ident =''

                    if answer != '':
                        data_answer_ident = answer.split('-')
                        if len(data_answer_ident) > 1:
                            type_answer_ident = IDENTIFICATION[data_answer_ident[0]]
                            number_answer_ident = data_answer_ident[1]
                        else:
                            type_answer_ident = IDENTIFICATION['1']
                            number_answer_ident = answer

                    list_field.append({
                        'id': field_form_id,
                        'name': 'Tipo de Documento',
                        'type': type_field,
                        'answer': type_answer_ident
                    })
                    list_field.append({
                        'id': field_form_id,
                        'name': answer_field_val['form_field__name'] + ' #',
                        'type': type_field,
                        'answer': number_answer_ident
                    })
                elif type_field == 15:
                    geo_data_lat = ''
                    geo_data_lon = ''

                    if answer != '':
                        geo_data = answer.split(',')
                        geo_data_lat = geo_data[0]
                        geo_data_lon = geo_data[1]

                    list_field.append({
                        'id': field_form_id,
                        'name': answer_field_val['form_field__name'] + ' Latitud',
                        'type': type_field,
                        'answer': geo_data_lat
                    })
                    list_field.append({
                        'id': field_form_id,
                        'name': answer_field_val['form_field__name'] + ' Longitud',
                        'type': type_field,
                        'answer': geo_data_lon
                    })
                elif type_field == 23:
                    data_answer = json.loads(answer.replace("'", '"'))
                    country = data_answer[0]
                    state = data_answer[1]
                    city = data_answer[2]

                    answer = ''
                    try:
                        field_parameter_val = Form_Field_Parameter.objects.get(form_field_id=field_form_id, parameter_validate_id=3)
                    except Form_Field_Parameter.DoesNotExist:
                        field_parameter_val = False

                    country_name = ''
                    state_name = ''
                    city_name = ''

                    if country != '':
                        country_name = COUNTRYS_DATA_DICT[str(country)]['label']
                        if state != '':
                            state_name = COUNTRYS_DATA_DICT[str(country)]['states'][str(state)]['label']
                            if city != '':
                                city_name = COUNTRYS_DATA_DICT[str(country)]['states'][str(state)]['cities'][str(city)]

                    if field_parameter_val:
                        if field_parameter_val.value == 'dep':
                            list_field.append({
                                'id': field_form_id,
                                'name': answer_field_val['form_field__name'] + ' País',
                                'type': type_field,
                                'answer': country_name
                            })
                            list_field.append({
                                'id': field_form_id,
                                'name': answer_field_val['form_field__name'] + ' Departamento',
                                'type': type_field,
                                'answer': state_name
                            })
                        elif field_parameter_val.value == 'dep_ciu':
                            list_field.append({
                                'id': field_form_id,
                                'name': answer_field_val['form_field__name'] + ' País',
                                'type': type_field,
                                'answer': country_name
                            })
                            list_field.append({
                                'id': field_form_id,
                                'name': answer_field_val['form_field__name'] + ' Departamento',
                                'type': type_field,
                                'answer': state_name
                            })
                            list_field.append({
                                'id': field_form_id,
                                'name': answer_field_val['form_field__name'] + ' Ciudad',
                                'type': type_field,
                                'answer': city_name
                            })
                    else:
                        list_field.append({
                            'id': field_form_id,
                            'name': answer_field_val['form_field__name'] + ' País',
                            'type': type_field,
                            'answer': country_name
                        })
                else:
                    list_field.append({
                        'id': field_form_id,
                        'name': answer_field_val['form_field__name'],
                        'type': type_field,
                        'answer': answer
                    })
            answer_data.append(list_field)
        columns = []
        for col in fields_form:
            if not int(field_disabled) and col['state'] == False:
                continue

            column = col['name'] + ('' if col['state'] else ' (-)')
            if col['field_type_id'] == 11:
                columns.append([col['id'], 'Tipo de Documento'])
                columns.append([col['id'], column + ' #'])
            elif col['field_type_id'] == 15:
                columns.append([col['id'], column + ' Latitud'])
                columns.append([col['id'], column + ' Longitud'])
            elif col['field_type_id'] == 23:
                try:
                    field_parameter_val = Form_Field_Parameter.objects.get(form_field_id=col['id'], parameter_validate_id=3)
                except Form_Field_Parameter.DoesNotExist:
                    field_parameter_val = False
                if field_parameter_val:
                    if field_parameter_val.value == 'dep':
                        columns.append([col['id'], column + ' País'])
                        columns.append([col['id'], column + ' Departamento'])
                    elif field_parameter_val.value == 'dep_ciu':
                        columns.append([col['id'], column + ' País'])
                        columns.append([col['id'], column + ' Departamento'])
                        columns.append([col['id'], column + ' Ciudad'])
                else:
                    columns.append([col['id'], column + ' País'])
            elif col['field_type_id'] == 17:
                columns = columns + [[col['id'], column + '-' + head[1], head[0]] for head in list_field_values[str(doc_id) + '_' + str(col['id'])]]
            else:
                columns.append([col['id'], column])
    data = []
    if columns and answer_data:
        data, columns = formatter.format_data(answer_data, columns,formatDate)

    return columns, data, count

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_as_excel_document(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        doc_id = data['id']
        date_init = data['date_init'] if 'date_init' in data else None
        date_end = data['date_end'] if 'date_end' in data else None
        rol_select = data['rol_select']
        user_select = data['user_select']
        formatDate = data['formatDate']
        field_disabled = data['field_disabled']
        option_date = data['option_date']

        send_file = 'file' in data

        col, ans, count = data_list_form_by_document(user_val, doc_id, option_date, date_init, date_end, not send_file, rol_select, user_select, formatDate, field_disabled)
        if col and ans and send_file:
            file = None
            df = pd.DataFrame(np.array(ans), columns=col)
            file_path = os.path.join(settings.MEDIA_ROOT, str(user_val.enterprise_id), 'answer_form', 'temporal')

            if not os.path.exists(file_path):
                os.makedirs(file_path)

            file_path = os.path.join(file_path, 'reporte'+ datetime.now().strftime('%Y%m%d_%H%M%S%f') + '.xlsx')
            df.to_excel(file_path, index=False)
            with open(file_path, 'rb') as f:
                file = f.read()
            response = HttpResponse(file, content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
            response['Content-Disposition'] = 'attachment; filename="{}"'.format('Reporte.xlsx')
            os.unlink(file_path)
            return response

        data_table = {
            'count': count,
            'table': {
                'head': col,
                'body': ans[:10]
            }
        }
        return Response({'status': True, 'data': data_table}, status=status.HTTP_200_OK)
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_massive_zip(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        massive_zip_list = []
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        massive_zip_values = Massive_Zip_Pdf.objects.filter(
            user=user_val,
            state=True
        ).order_by(
            '-id'
        )
        for massive_val in massive_zip_values:
            percentage = (((massive_val.success+massive_val.error)*100)/massive_val.amount)
            massive = {
                'id': massive_val.id,
                'filters': json.loads(massive_val.filters),
                'template_folder': massive_val.template_folder,
                'template_zip': str(massive_val.template_zip),
                'date' : massive_val.date,
                'percentage': int(percentage),
                'amount': massive_val.amount,
                'success': massive_val.success,
                'error': massive_val.error,
                'status': massive_val.status,
            }
            massive_zip_list.append(massive)
        response['status'] = True
        response['data'] = massive_zip_list
        status_response = status.HTTP_200_OK
    except:
        pass
    return Response(response, status_response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def export_as_zip_pdf_document(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        if Massive_Zip_Pdf.objects.filter(user=user_val, status=0).exists():
            response['status'] = False
            response['detail'] = "Ya hay un proceso activo"
            status_response = status.HTTP_200_OK
            return Response(response, status=status_response)

        doc_id = data['id']
        date_init = data['date_init'] if 'date_init' in data else None
        date_end = data['date_end'] if 'date_end' in data else None
        rol_select = data['rol_select']
        user_select = data['user_select']
        option_date = data['option_date']

        filters = json.dumps({
            "doc_id": doc_id,
            "date_init": data['date_init'] if 'date_init' in data else "",
            "date_end": data['date_end'] if 'date_end' in data else "",
            "rol_select": rol_select,
            "user_select": user_select,
            "option_date": option_date
        })

        form_val = Form_Enterprise.objects.get(
            id = doc_id,
            enterprise_id = user_val.enterprise_id
        )
        if date_end:
            # Se añade un dia para la funcionalidad del filtro
            date_end = datetime.strptime(date_end.split('T')[0], '%Y-%m-%d').replace(tzinfo=TZ_INFO) + timedelta(days=1, minutes=4)
        if not form_val.consecutive:
            if rol_select == "0" and  user_select == []:
                query_answer_forms = Answer_Form.objects.filter(
                    form_enterprise_id=doc_id,
                    consecutive=False,
                    state=True
                )
            else:
                query_answer_forms = Answer_Form.objects.filter(
                    form_enterprise_id=doc_id,
                    consecutive=False,
                    state=True,
                    created_by_id__in=user_select
                )

            # Busqueda de respuestas segun el rol
            if user_val.role_id != 2 and (user_val.role_enterprise and not user_val.role_enterprise.view_all):
                query_answer_forms = query_answer_forms.filter(
                    created_by=user_val
                )
            # Range dates
            if option_date == "1":
                if date_init and date_end:
                    query_answer_forms = query_answer_forms.filter(
                        creation_date__gte = date_init,
                        creation_date__lte = date_end,
                    )
                elif date_init:
                    query_answer_forms = query_answer_forms.filter(
                        creation_date__gte = date_init,
                    )
                elif date_end:
                    query_answer_forms = query_answer_forms.filter(
                        creation_date__lte = date_end,
                    )
            else:
                if option_date == "2":
                    if date_init and date_end:
                        query_answer_forms = query_answer_forms.filter(
                            time_stamp__gte = date_init,
                            time_stamp__lte = date_end,
                        )
                    elif date_init:
                        query_answer_forms = query_answer_forms.filter(
                            time_stamp__gte = date_init,
                        )
                    elif date_end:
                        query_answer_forms = query_answer_forms.filter(
                            time_stamp__lte = date_end,
                        )

            # Count Total Answer
            amount = query_answer_forms.count()
            if amount != 0 :
                massive_zip_pdf_val = Massive_Zip_Pdf()
                massive_zip_pdf_val.user = user_val
                massive_zip_pdf_val.filters = filters
                massive_zip_pdf_val.template_folder = ''
                massive_zip_pdf_val.amount = amount
                massive_zip_pdf_val.save()

                folder = str(user_val.enterprise_id) + '/zip/' + str(massive_zip_pdf_val.id) + '/'
                path = settings.MEDIA_ROOT + '/' + folder
                if not os.path.exists(path):
                    os.makedirs(path)
                massive_zip_pdf_val.template_folder = folder
                massive_zip_pdf_val.save()

                answer_forms = query_answer_forms.values_list('id', flat=True)
                Thread(target=export_as_zip, args=(user_val, form_val, massive_zip_pdf_val, answer_forms)).start()
                response['status'] = True
            else:
                response['status'] = False
                response['detail'] = "No hay datos para ese filtro"
            status_response = status.HTTP_200_OK

    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

def export_as_zip(user_val, form_val, massive_zip_pdf_val, answer_list):
    try:
        media_path = settings.MEDIA_ROOT + '/'

        for answer in answer_list:
            file_path = massive_zip_pdf_val.template_folder + str(answer) + "-" + form_val.name + ".pdf"
            temp_file_path = media_path + file_path

            try:
                if form_val.consecutive:
                    doc_val = Signed_Document_Consecutive.objects.get(answer_consecutive=answer, status=True)
                else:
                    doc_val = Signed_Document.objects.get(answer_form=answer, status=True)
                result_pdf_path = '{}/{}'.format(settings.MEDIA_ROOT, doc_val.pdf_path)
                # Hace una copia del archivo
                shutil.copy(result_pdf_path, temp_file_path)

            except Exception as err:
                # Signed_File
                try:
                    doc_file_val = Document_Without_Sing.objects.get(answer_form=answer, status=True)
                    result_pdf_path = '{}/{}'.format(settings.MEDIA_ROOT, doc_file_val.pdf_path)
                    # copy file
                    shutil.copy(result_pdf_path, temp_file_path)
                except Document_Without_Sing.DoesNotExist:
                    form_answer = Answer_Form.objects.get(id=answer)
                    file_path_table =  sign_doc_directory_path(user_val.enterprise_id, str(form_answer.id))
                    if form_val.digital:
                        # When is Digital
                        answer_field_values = Answer_Field.objects.filter(
                            answer_form=form_answer
                        ).select_related(
                            'form_field',
                        ).values(
                            'id',
                            'form_field_id',
                            'value'
                        )

                        answer_field_values = {
                            temporal['form_field_id']: {'value': temporal['value'] ,'id': temporal['id']} for temporal in list(answer_field_values)
                        }
                        overlay_pdf_path, result = generate_pdf_digital(form_val, form_answer.id, answer_field_values, sign=form_answer.doc_hash)
                        shutil.copy(result, temp_file_path)
                        shutil.copy(result, media_path + file_path_table)
                    else:
                        result = generate_pdf_from_data(form_answer.created_by, 0, form_answer.id, logo=user_val.enterprise.logo if user_val else form_val.enterprise.logo, sign=form_answer.doc_hash)

                        with open(temp_file_path, 'wb+') as f:
                            f.write(result.content)
                            f.close()

                        with open(media_path + file_path_table, 'wb+') as f:
                            f.write(result.content)
                            f.close()

                    # Save Table
                    doc_file_val = Document_Without_Sing()
                    doc_file_val.answer_form_id = form_answer.id
                    doc_file_val.pdf_path = file_path_table
                    doc_file_val.save()

            massive_zip_pdf_val.success += 1
            massive_zip_pdf_val.save()

        folder_path = media_path + massive_zip_pdf_val.template_folder
        zip_filename = str(user_val.enterprise_id) + '/zip/' + str(massive_zip_pdf_val.id) + '.zip'
        files_pdf = [archivo for archivo in os.listdir(folder_path) if archivo.endswith('.pdf')]

        with zipfile.ZipFile(media_path + zip_filename, 'w') as zip_file:
            for file_pdf in files_pdf:
                ruta_pdf = os.path.join(folder_path, file_pdf)
                zip_file.write(ruta_pdf, file_pdf)

        massive_zip_pdf_val.template_zip = zip_filename
        massive_zip_pdf_val.status = 1
        massive_zip_pdf_val.save()
    except:
        massive_zip_pdf_val.status = 2
        massive_zip_pdf_val.save()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_digital_pdf_to_zip(request, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        try:
            massive_zip_pdf_val = Massive_Zip_Pdf.objects.get(id=pk, user=user_val, status=1)
            with open(settings.MEDIA_ROOT + '/' + str(massive_zip_pdf_val.template_zip), 'rb') as f:
                file_data = f.read()
            response = HttpResponse(file_data, content_type='application/zip')
            response['Content-Disposition'] = 'attachment; filename=form.zip'
            return response
        except:
            pass
        return response
    except User_Enterprise.DoesNotExist:
        pass
    except (Form_Enterprise.DoesNotExist):
        pass
    except:
        pass
    return Response(response, status=status_response)

def assing_serial(enterprise_id):
    serial_number = Serial_Number.objects.filter(enterprise_id=enterprise_id).last()
    if serial_number:
        count_number = serial_number.count + 1
        serial = serial_number.serial
    else:
        count_number = 1
        serial = 1

    if count_number > 999999:
        count_number = 1
        serial += 1

    serial_number_val = Serial_Number()
    serial_number_val.enterprise_id = enterprise_id
    serial_number_val.serial = serial
    serial_number_val.count = count_number
    serial_number_val.save()

    return serial_number_val

def image_to_base64(path):
    """
    Converts an image file to a base64 encoded string with the appropriate data type based on the file extension.

    Args:
        path (str): The path of the image file.

    Returns:
        str: The base64 encoded string with the appropriate data type based on the file extension.

    Raises:
        FileNotFoundError: If the file is not found at the specified path.
        ValueError: If the file type is invalid. Only JPG, PNG, and GIF are supported.
    """
    try:
        with open(path, "rb") as img_file:
            ext = path.split(".")[-1]
            data = img_file.read()
            return f"data:image/{ext};base64,{base64.b64encode(data).decode('utf-8')}"
    except FileNotFoundError:
        print(f"Error: File not found at {path}")
    except ValueError:
        print(f"Error: Invalid file type. Only JPG, PNG, and GIF are supported.")
    return ""

@api_view(['POST'])
def unique_validate(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        data = request.data
        form_id = data['form']
        field_id = data['field']
        answer = data['answer']
        answer_id = data['id'] if ('id' in data and data['id'] != '') else None
        response = validate_answer_exists(form_id, field_id, answer, answer_id)
        if response['status'] == True:
            status_response = status.HTTP_200_OK
        elif 'detail' in response:
            status_response = status.HTTP_406_NOT_ACCEPTABLE
    except Exception as err:
        pass
    return Response(response, status=status_response)

def validate_answer_exists(form_id, field_id, answer, answer_id=None):
    response = {"status": False}
    try:
        form_field_val = Form_Field.objects.get(id=field_id, form_enterprise_id=form_id)

        if answer.translate({ord(c): None for c in string.whitespace}) == '':
            raise Exception()

        # Busca la validación
        form_field_parameter_val = Form_Field_Parameter.objects.get(form_field=form_field_val, parameter_validate_id=5, state=True)
        if form_field_parameter_val.value == "" or not "unique" in json.loads(form_field_parameter_val.value):
            # Si no existe la validación
            response['status'] = True
        else:
            answer_field_validate = Answer_Field.objects.filter(
                answer_form__state=True,
                form_field=form_field_val,
                value=answer
            )

            if answer_id != None:
                answer_field_validate = answer_field_validate.exclude(
                    answer_form_id=answer_id
                )

            answer_field_validate = answer_field_validate.exists()
            # Si no existe la respuesta
            if not answer_field_validate:
                response['status'] = True
            else:
                response['detail'] = "La respuesta del campo " + form_field_val.name + " ya existe y/o esta repetida. Por favor, cambie su respuesta."
    except Exception as err:
        pass
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_unique_state(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        validate_answer_form_query = Validate_Answer_Form.objects.filter(
            answer_form__form_enterprise__state=True,
            show=False,
            cause=0,
        )

        if user_val.role_id == 2 or user_val.role_enterprise.view_all:
            validate_answer_form = validate_answer_form_query.filter(
                answer_form__form_enterprise__enterprise_id=user_val.enterprise_id
            ).exists()
        else:
            for_user = User_Form.objects.filter(user_id=user_val.id, state=True).values_list('form_enterprise_id', flat=True)
            for_rol = []
            if user_val.role_enterprise_id != None:
                for_rol = Role_Form.objects.filter(role_id=user_val.role_enterprise_id, state=True).values_list('form_enterprise_id', flat=True)
            list_form = list(for_rol) + list(for_user)

            validate_answer_form = validate_answer_form_query.filter(
                answer_form__form_enterprise_id__in=list_form,
                answer_form__created_by=user_val,
            ).exists()

        response['status'] = True
        response['data'] = validate_answer_form
        status_response = status.HTTP_200_OK
    except:
        pass
    return Response(response, status_response)

def get_type_field(field_id):
    response = {"status": False}
    try:
        field_type_data = Form_Field.objects.get(id=field_id)
        Form_Field_Parameter.objects.get(form_field_id=field_id, parameter_validate_id=5,value='["unique"]')
        response['type_field_id'] = field_type_data.field_type_id
        response['status'] = True
    except Form_Field_Parameter.DoesNotExist:
        response['status'] = False
        response['type_field_id'] = '0'
    except Form_Field.DoesNotExist:
        response['status'] = False
        response['type_field_id'] = '0'
    return response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_state_answer(request, pk):
    return Response({"status": True, "data": []}, status=status.HTTP_200_OK)
