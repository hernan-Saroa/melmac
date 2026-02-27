# rest_framework
from genericpath import exists
from os import system
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from api.permissions import IsUserAdminOrHasPermission
from rest_framework.permissions import IsAuthenticated
# models
from django.db.models.functions import Concat
from django.db.models import F, Value, CharField
from api.models import (
    Traceability_User,
    User_Enterprise,
    Service_Trazability,
    Follow_User,
    Follow_User_Offline,
)
# others
import pandas as pd
from datetime import datetime, timedelta
import pytz

ACTION = {
    '1': 'Crear',
    '2': 'Modificar',
    '3': 'Eliminar',
    '4': 'Inicio de sesión',
    '5': 'Video_match',
    '6': 'Image_match',
    '7': 'listas restrictivas',
    '8': 'Enrolamiento de usuario',
    '9': 'Escaneo de documento',
    '10': 'OCR',
    '11': 'Validacion de SMS',
    '12': 'Firma de PDF',
    '13': 'Clonar',
    '14': 'Compartir',
    '15': 'Entrega de Documento',
    '16': 'Confirma ver Documento',
    '17': 'autorizar el tratamiento de datos personales',
    '18': 'Proceso Visita',
    '19': 'Reasignacion de Visita',
    '20': 'Finalizacion de Visita',
    '21': 'Finalizacion de Visita por administrador',
    '23': 'En proceso Visita',
    '24': 'Crear Proyecto',
    '25': 'Editar Proyecto',
    '26': 'Crear Subproyecto',
    '27': 'Editar Subproyecto',
    '28': 'Crear Tarea',
    '29': 'Editar Tarea',
    '30': 'Petición de Envio de Respuesta',
    '31': 'Sobre - Aprobo',
    '32': 'Sobre - Desaprobo',
    '33': 'Sobre - Autoriza TD',
    '34': 'Sobre - No Autoriza TD',
    '35': 'Sobre - Sube documento',
    '36': 'Sobre - Verificación de Token Checker',
    '37': 'Offline - Validación Respuesta Campo Único',
    '38': 'Edición Respuesta Campo Único',
    '39': 'Realiza Verificación',
    '40': 'Rechaza Verificación',
    '41': 'Finaliza Verificación',
}

TZ_INFO = pytz.timezone('America/Bogota')

class TraceabilityList(APIView):
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, pk=None, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            id_enterprise = user_val.enterprise_id
            if user_val.role_id == 1:
                if pk != None:
                    user_get = User_Enterprise.objects.get(id=pk)
                    id_enterprise = user_get.enterprise_id

            traceability_user_values = Traceability_User.objects.filter(
                user__enterprise_id=id_enterprise
            ).select_related(
                'user',
            ).annotate(
                name_user=Concat(F('user__first_name'), Value(' '), F('user__first_last_name'), output_field=CharField())
            ).values(
                'id',
                'name_user',
                'group',
                'element',
                'action',
                'description',
                'creation_date',
            ).order_by('-creation_date')

            response['status'] = True
            response['data'] = list(traceability_user_values)
            response['action'] = ACTION
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    # txt
    def post(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            id_enterprise = user_val.enterprise_id

            data = request.data
            if user_val.role_id == 1:
                if 'user' in data and data['user'] != '':
                    user_get = User_Enterprise.objects.get(id=data['user'])
                    id_enterprise = user_get.enterprise_id

            traceability_user_values = Traceability_User.objects.filter(
                user__enterprise_id=id_enterprise
            ).select_related(
                'user',
            ).annotate(
                name_user=Concat(F('user__first_name'), Value(' '), F('user__first_last_name'), output_field=CharField())
            ).values(
                'name_user',
                'group',
                'element',
                'action',
                'description',
                'creation_date',
            ).order_by('-creation_date')

            # Conversión de query a String
            df = pd.DataFrame(list(traceability_user_values))
            file_content = df.to_csv(index=False)

            # Preparación para descarga
            filename = "melmac_logs.txt"
            response = HttpResponse(file_content, content_type='text/plain')
            response['Content-Disposition'] = 'attachment; filename={0}'.format(filename)
            return response
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

def create_traceability(data):
    '''
        group = se tiene en cuenta la tabla django_content_type
        El elemento es el id del objeto al que se le realiza la acción.

        action
        1: Crear
        2: Modificar
        3: Eliminar
        4: Inicio de sesión
        5: Video_match
        6: Image_match
        7: listas restrictivas
        8: Enrolamiento de usuario
        9: Escaneo de documento
        10: OCR
        11: Validacion de SMS
        12: Firma de PDF
        13: Clonar
        14: Compartir
        15: Entrega de Documento via Mail
        16: Confirma ver Documento via Mail
        17: autorizar el tratamiento de datos personales
        18: Proceso Visita
        19: Reasignacion de Visita
        20: Finalizacion de Visita
        21: Finalizacion de Visita por administrador
        23: En proceso Visita
        24: Crear Proyecto
        25: Editar Proyecto
        26: Crear Subproyecto
        27: Editar Subproyecto
        28: Crear Tarea
        29: Editar Tarea
        30: Petición de Envio de Respuesta
        31: Sobre - Aprobo
        32: Sobre - Desaprobo
        33: Sobre - Autoriza TD
        34: Sobre - No Autoriza TD
        35: Sobre - Sube documento
        36: Sobre - Verificación de Token Checker
        37: Offline - Validación Respuesta Campo Único
        38: Edición Respuesta Campo Único
        39: Sobre - Realiza Verificación
        40: Sobre - Rechaza Verificación
        41: Sobre - Finaliza Verificación
    '''

    try:
        new_traceability_user = Traceability_User()
        if 'user' in data and data['user']:
            new_traceability_user.user_id = data['user']
        else:
            new_traceability_user.user = None
        new_traceability_user.group = data['group']
        new_traceability_user.element = data['element']
        new_traceability_user.action = data['action']
        new_traceability_user.description = data['description']
        if 'extra' in data:
            new_traceability_user.extra = data['extra']
        new_traceability_user.save()
        return True
    except Exception as err:
        print(err)
        return False

def create_multiple_traceabilities(log_list):
    objects_to_load = []
    try:
        for data in log_list:
            new_traceability_user = Traceability_User()
            if 'user' in data and data['user']:
                new_traceability_user.user_id = data['user']
            else:
                new_traceability_user.user = None
            new_traceability_user.group = data['group']
            new_traceability_user.element = data['element']
            new_traceability_user.action = data['action']
            new_traceability_user.description = data['description']
            if 'time' in data:
                new_traceability_user.creation_date = data['time']
            objects_to_load.append(new_traceability_user)
        if len(objects_to_load):
            Traceability_User.objects.bulk_create(objects_to_load)
    except Exception as err:
        print(err)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add(request):
    response = {}
    response['status'] = False
    # get user and data
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    data = request.data
    try:
        content = {
            'user': user_val.id,
            'group': data['group'],
            'element': data['element'],
            'action': data['action'],
            'description': data['description'],
        }
        traceability = create_traceability(content)
        if traceability:
            response['status'] = True
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    return Response(response)

"""
    Trazabilidad en los servicios

    group:
    1: Enterprise_Service
    2: Service_Location
    3: Service_User
"""
def create_traceability_service(data):
    try:
        # Hora actual en la zona horaria.
        now = datetime.now(tz=TZ_INFO)
        now_date = now.strftime("%d%m%Y")
        now_time = now.strftime("%H:%M")

        new_traceability = Service_Trazability()
        new_traceability.process_id = data['process']
        new_traceability.group = data['group']
        new_traceability.reference = data['reference']
        new_traceability.description = data['description']
        new_traceability.date_trace = now_date
        new_traceability.hour_trace = now_time
        new_traceability.latitude = data['latitude']
        new_traceability.longitude = data['longitude']
        new_traceability.process_state_id = data['process_state']
        new_traceability.save()
        return True
    except:
        return False

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trace_service(request):
    response = {}
    response['status'] = False
    # get user and data
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    data = request.data
    try:
        content = {
            'process': data['process'],
            'group': data['group'],
            'reference': data['reference'],
            'description': data['description'],
            'latitude': data['latitude'],
            'longitude': data['longitude'],
            'process_state': data['process_state'],
        }
        traceability = create_traceability_service(content)
        if traceability:
            response['status'] = True
    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    return Response(response)


#opcion = 1 : Guarda log de documentos enviados
def generate_log(title = "", data = "NA" , description = "NA", enterprise = 'NA', user = "NA", option = "1"):
    if option == "1":
        response = {}
        response['status'] = False
        inicio = datetime.now()
        log_str = inicio.strftime('%y%m%d_%H%M%S')
        archivo_log = f'Documento_'+ str(enterprise) + '_' + str(user) + '_'+ log_str+ '.log'

        if not exists('Documentos_enviados'):
            system('mkdir Documentos_enviados')

        with open(f'Documentos_enviados/{archivo_log}', 'w') as log:
            log.write(f'{datetime.now()}:' + description + '\n' + data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trace_user(request):
    response = {}
    response['status'] = False
    # get user and data
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    available_time = user_val.role_enterprise.time_zone.split('*%*')
    start = available_time[0].split(':')
    end = available_time[1].split(':')
    now = datetime.now(tz=TZ_INFO)
    start_time = now.replace(hour=int(start[0]), minute=int(start[1]))
    if int(end[0]) != 0:
        end_time = now.replace(hour=int(end[0]), minute=int(end[1]))
    else:
        end_time = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    data = request.data
    try:
        if (now >= start_time and now <= end_time):
            new_follow = Follow_User()
            new_follow.latitude = data['latitude']
            new_follow.longitude = data['longitude']
            new_follow.state = True
            new_follow.user_id = user_val.id
            new_follow.save()
        response['status'] = True

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    return Response(response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def trace_user_offline(request):
    response = {}
    response['status'] = False
    # get user and data
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    data = request.data
    try:
        new_follow = Follow_User_Offline()
        new_follow.latitude = data['latitude']
        new_follow.longitude = data['longitude']
        new_follow.creation_date = data['date']
        new_follow.state = True
        new_follow.user_id = user_val.id
        new_follow.save()
        response['status'] = True

    except KeyError:
        response['message'] = 'Faltan parametros por enviar'
    return Response(response)
