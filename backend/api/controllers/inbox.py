import pytz

from pickletools import optimize
from api.controllers.answer import assing_values_answer
from api.models import (
    Answer_Consecutive,
    Answer_Form,
    Form_Enterprise,
    Profile,
    Profile_Enterprise,
    User_Enterprise,
    Traceability_User,
    Validate_Answer_Form
)
from api.permissions import IsUserAdminOrHasPermission, IsSuperAdmin
from itertools import chain
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from rest_framework.permissions import IsAuthenticated
from datetime import datetime, timedelta
# models
from django.db.models.functions import Concat, TruncDate, Cast
from django.db.models import F, Q, Value, CharField, BooleanField, IntegerField, Case, When

TZ_INFO = pytz.timezone('America/Bogota')


class InboxList(APIView):
    """
    API endpoint que permite la consulta de los formularios y la creación de nuevos.
    """
    permission_classes = [IsAuthenticated]

    # Consulta
    def get(self, request, format=None, state=1):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        x_count = 0
        req_data = request.GET
        try:
            page = int(req_data['_page']) if '_page' in req_data else 1
            limit = int(req_data['_limit']) if '_limit' in req_data else 10
            option = state
            # state = True if state == 1 else False
            state = False if state == 0 else True
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            filter_opt = [str(key).removesuffix('_like') for key in req_data.keys() if '_like' in key]

            # Condicional para administrador de empresa
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__enterprise_id=user_val.enterprise_id,
                    consecutive=False,
                )
                # Consulta de Respuestas de consecutivos
                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__enterprise_id=user_val.enterprise_id,
                )
                enrollment_values = Profile_Enterprise.objects.filter(
                    enterprise_id=user_val.enterprise_id, 
                    state=option == 1,
                    profile__state=True,
                )
            # Informacion de solo el usuario
            else:
                answer_values = Answer_Form.objects.filter(
                    created_by=user_val,
                    consecutive=False,
                )
                # Consulta de Respuestas de consecutivos
                consecutive_values = Answer_Consecutive.objects.filter(
                    created_by=user_val,
                )
                enrollment_values = Profile_Enterprise.objects.filter(
                    user=user_val, 
                    state=option == 1
                )

            if option != 2:
                answer_values = answer_values.filter(
                    Q(validate_answer_form__show=True) | Q(validate_answer_form__show=None),
                )
            else:
                answer_values = answer_values.filter(
                    validate_answer_form__show=False
                )

            # Condicional de Respuestas activas / Formularios Activos 
            if state:
                answer_values = answer_values.filter(
                    form_enterprise__state=True,
                    state=True
                )
                consecutive_values = consecutive_values.filter(
                    form_consecutive__state=True,
                    state=True
                )
            # Inactivos
            else:
                answer_values = answer_values.filter(
                    Q(form_enterprise__state=False) | Q(form_enterprise__state=True, state=False),
                )
                consecutive_values = consecutive_values.filter(
                    Q(form_consecutive__state=False) | Q(form_consecutive__state=True, state=False),
                )

            answer_values = answer_values.select_related(
                'form_enterprise',
                'created_by'
            ).annotate(
                id_form=F('form_enterprise_id'),
                user_name=Case(
                    When(created_by__isnull=True, then=Value('Usuario Público')),
                    When(created_by__isnull=False, then=Concat('created_by__first_name',Value(value=' '),
                                                               'created_by__middle_name',Value(value=' '), 
                                                               'created_by__first_last_name',Value(value=' '),
                                                               'created_by__second_last_name', output_field=CharField())),
                    #When(created_by__isnull=False, then=Concat('created_by__middle_name',Value(value=' '), 'created_by__first_last_name', output_field=CharField())),
                    default=Value('N/A'),
                ),
                subject=F('form_enterprise__name'),
                digital=F('form_enterprise__digital'),
                type=Value(value=1, output_field=IntegerField()),
                origin_date=Case(
                    When(time_stamp__isnull=True, then=F('creation_date')),
                    When(time_stamp__isnull=False, then=F('time_stamp')),
                    default=Value(None),
                )
            ).values(
                'id',
                'id_form',
                'subject',
                'user_name',
                'consecutive',
                'type',
                'digital',
                'public',
                'online',
                'source',
                'creation_date',
                'origin_date'
            ).order_by('-creation_date')
            
            consecutive_values = consecutive_values.select_related(
                'form_consecutive',
                'created_by'
            ).annotate(
                id_form=F('form_consecutive_id'),
                user_name=Case(
                    When(created_by__isnull=True, then=Value('Usuario Público')),
                    When(created_by__isnull=False, then=Concat('created_by__first_name',Value(value=' '),
                                                               'created_by__middle_name',Value(value=' '), 
                                                               'created_by__first_last_name',Value(value=' '),
                                                               'created_by__second_last_name', output_field=CharField())),
                    default=Value('N/A'),
                ),
                # subject=Concat(Value('Documento - '), 'form_consecutive__name', output_field=CharField()),
                subject=F('form_consecutive__name'),
                digital=F('form_consecutive__digital'),
                consecutive=Value(value=True, output_field=BooleanField()),
                type=Value(value=1, output_field=IntegerField()),
                origin_date=F('creation_date')
            ).values(
                'id',
                'id_form',
                'subject',
                'user_name',
                'consecutive',
                'type',
                'public',
                'online',
                'source',
                'creation_date',
                'origin_date'
            ).order_by('-creation_date')
            
            enrollment_values = enrollment_values.select_related(
                'profile',
                'user',
            ).annotate(
                user_name=Case(
                    When(user__isnull=True, then=Concat('profile__name',Value(value=''))),
                    When(user__isnull=False, then=Concat('user__first_name',Value(value=' '), 'user__first_last_name', output_field=CharField())),
                    default=Value('Usuario Publico'),
                ),
                type=Value(value=2, output_field=IntegerField()),
                subject=Concat(Value('Inscripción - '), 'profile__name', output_field=CharField()),
                origin_date=F('creation_date')
            ).values(
                'id',
                'subject',
                'user_name',
                'type',
                'creation_date',
                'origin_date'
            ).order_by('-creation_date')

            if filter_opt:
                if 'id' in filter_opt:
                    answer_values = answer_values.filter(id__icontains=req_data['id_like'])
                    consecutive_values = consecutive_values.filter(id__icontains=req_data['id_like'])
                    enrollment_values = enrollment_values.filter(id__icontains=req_data['id_like'])
                if 'user_name' in filter_opt:
                    answer_values = answer_values.filter(user_name__icontains=req_data['user_name_like'])
                    consecutive_values = consecutive_values.filter(user_name__icontains=req_data['user_name_like'])
                    enrollment_values = enrollment_values.filter(user_name__icontains=req_data['user_name_like'])
                if 'subject' in filter_opt:
                    answer_values = answer_values.filter(subject__icontains=req_data['subject_like'])
                    consecutive_values = consecutive_values.filter(subject__icontains=req_data['subject_like'])
                    enrollment_values = enrollment_values.filter(subject__icontains=req_data['subject_like'])
                if 'creation_date' in filter_opt:
                    date_vals = str(req_data['creation_date_like']).strip().split(';')
                    # date_obj = datetime.strptime(date_vals[0], '%Y-%m-%d').replace(tzinfo=TZ_INFO)
                    # date_obj_end = datetime.strptime(date_vals[1], '%Y-%m-%d').replace(tzinfo=TZ_INFO) + timedelta(days=1)
                    date_obj = date_vals[0]
                    date_obj_end = datetime.strptime(date_vals[1].split('T')[0], '%Y-%m-%d').replace(tzinfo=TZ_INFO) + timedelta(days=1, minutes=4)
                    answer_values = answer_values.filter(creation_date__gte=date_obj, creation_date__lt=date_obj_end)
                    consecutive_values = consecutive_values.filter(creation_date__gte=date_obj, creation_date__lt=date_obj_end)
                    enrollment_values = enrollment_values.filter(creation_date__gte=date_obj, creation_date__lt=date_obj_end)
                if 'origin_date' in filter_opt:
                    date_vals_or = str(req_data['origin_date_like']).strip().split(';')
                    # date_or_init = datetime.strptime(date_vals_or[0], '%Y-%m-%d').replace(tzinfo=TZ_INFO)
                    # date_or_end = datetime.strptime(date_vals_or[1], '%Y-%m-%d').replace(tzinfo=TZ_INFO) + timedelta(days=1)
                    date_or_init = date_vals_or[0]
                    date_or_end = datetime.strptime(date_vals_or[1].split('T')[0], '%Y-%m-%d').replace(tzinfo=TZ_INFO) + timedelta(days=1, minutes=4)
                    answer_values = answer_values.filter(time_stamp__gte=date_or_init, time_stamp__lt=date_or_end)
                    consecutive_values = consecutive_values.filter(creation_date__gte=date_or_init, creation_date__lt=date_or_end)
                    enrollment_values = enrollment_values.filter(creation_date__gte=date_or_init, creation_date__lt=date_or_end)
                if 'source' in filter_opt:
                    answer_values = answer_values.filter(source=req_data['source_like'])
                    consecutive_values = consecutive_values.filter(source=req_data['source_like'])
                if 'online' in filter_opt:
                    answer_values = answer_values.filter(online=(req_data['online_like'] == 'true'))
                    consecutive_values = consecutive_values.filter(online=(req_data['online_like'] == 'true'))
                    
            # union de datos, se utiliza el método assing_values para asignar los datos que se quitaron de la consulta y no afecte la estructura ya definida para el frontend
            if option == 2:
                data_values = answer_values
            else:
                if 'type' not in filter_opt:
                    data_values = chain(answer_values, consecutive_values, enrollment_values)
                # Filtro por tipo de dato (Documento / Inscripcion)
                else:
                    if req_data['type_like'] == '1':
                        data_values = chain(answer_values, consecutive_values)
                    elif req_data['type_like'] == '2':
                        data_values = enrollment_values

            data_values = sorted(data_values, key=lambda k: k['creation_date'], reverse=True)
            x_count = len(data_values)

            response['status'] = True
            response['data'] = (data_values[(page-1)*limit:page*limit])
            response['x-total-count'] = x_count

            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)
