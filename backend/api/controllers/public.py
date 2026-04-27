# rest_framework
from datetime import datetime, timedelta
import itertools
from api.controllers.admin import get_enterprise
from api.permissions import IsSuperAdmin
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from rest_framework.permissions import IsAuthenticated
from django.conf import settings
# models
from django.db.models import CharField, Q, F, Value, Count
from django.db.models.functions import Concat, LastValue, Trim, Coalesce
from api.models import (
    Answer_Form,
    Answer_Consecutive,
    Api_Detail,
    City,
    Country,
    Permit_Role,
    Role_Enterprise,
    Variable_Plataform,
    Form_Enterprise,
    Theme,
    Type_Identification,
    User_Enterprise,
    Value_Parameter,
    Follow_User,
    Follow_User_Offline,
    Device_Info_Movil,
    Document_Identification,
)
# others
from itertools import chain
import pytz
import json

TZ_INFO = pytz.timezone('America/Bogota')


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_theme(request):
    response = {}
    theme_values = Theme.objects.all().values('id', 'name')
    response['status'] = True
    response['data'] = list(theme_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['GET'])
def get_type_identification(request):
    response = {}
    type_identification_values = Type_Identification.objects.all().values('id', 'name')
    response['status'] = True
    response['data'] = list(type_identification_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_role(request):
    response = {}
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    role_values = Role_Enterprise.objects.filter(
        enterprise_id=user_val.enterprise_id,
        state=True,
    ).order_by('name').values('id', 'name')
    response['status'] = True
    response['data'] = list(role_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_follow_role(request):
    response = {}
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    follow_role_ids = Permit_Role.objects.filter(
        role_enterprise__enterprise_id=user_val.enterprise_id,
        permit__permit_type=44,
        state=True,
        role_enterprise__state=True
    ).values_list('role_enterprise_id', flat=True)

    role_values = Role_Enterprise.objects.filter(
        enterprise_id=user_val.enterprise_id,
        state=True,
        id__in=follow_role_ids,
    ).order_by('name').values('id', 'name')
    response['status'] = True
    response['data'] = list(role_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request, all=0):
    response = {}
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

    user_values = User_Enterprise.objects.filter(
        enterprise_id=user_val.enterprise_id,
        #state=True,
    )

    if all == 0:
        user_values = user_values.filter(role_id=3)

    user_values = user_values.annotate(
        full_name=Trim(
            Concat(
                Coalesce('first_name', Value('')), Value(' '),
                Coalesce('middle_name', Value('')), Value(' '),
                Coalesce('first_last_name', Value('')), Value(' '),
                Coalesce('second_last_name', Value('')),
                output_field=CharField()
            )
        ),
        r=F('role_enterprise_id'),
    ).order_by(
        'full_name'
    ).values('id', 'first_name', 'middle_name', 'first_last_name', 'second_last_name', 'r', 'email', 'state')
    response['status'] = True
    response['data'] = list(user_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['POST'])
def get_user_role(request):
    response = {}
    data=request.data
    user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
    user_values = User_Enterprise.objects.filter(
        enterprise_id=user_val.enterprise_id,
        role_id=3,
        #state=True,
        role_enterprise_id=data["idRole"]
    ).values('id', 'first_name', 'middle_name', 'first_last_name', 'second_last_name', 'state')
    response['status'] = True
    response['data'] = list(user_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def get_admin(request):
    response = {}
    user_values = User_Enterprise.objects.filter(
        role_id=2,
        state=True,
    ).values('id', 'first_name', 'middle_name', 'first_last_name', 'second_last_name')
    response['status'] = True
    response['data'] = list(user_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def get_user_geo(request):
    response = {"status": False}
    try:
        # User Requesting
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        filter_data = request.data
        # has_dates = False

        date_ini = None
        date_fin = None
        usr_sel_values = None
        role_list = None
        if filter_data['date_ini']:
            date_ini = datetime.strptime(filter_data['date_ini'], "%Y-%m-%d")
            date_ini = date_ini.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=TZ_INFO)
        if filter_data['date_fin']:
            date_fin = datetime.strptime(filter_data['date_fin'], "%Y-%m-%d") + timedelta(days=1)
            date_fin = date_fin.replace(hour=0, minute=0, second=0, microsecond=0, tzinfo=TZ_INFO)
        if filter_data['users']:
            usr_sel_values = [int(user) for user in filter_data['users']]
        if 'role' in filter_data and filter_data['role']:
            role_list = [int(role) for role in filter_data['role']]

        get_attr = lambda user: user['user_id'] if 'user_id' in user else '-1'
        user_values = User_Enterprise.objects.filter(
            enterprise_id=user_val.enterprise_id,
            role_id=3,
            #state=True
        )
        users_active = Follow_User.objects.filter(
            user__enterprise_id=user_val.enterprise_id,
            state=True
        )
        data_offline = Follow_User_Offline.objects.filter(
            user__enterprise_id=user_val.enterprise_id,
            state=True
        )
        

        # Uso de los filtros
        if not (user_val.role_id == 2 or (user_val.role_enterprise and user_val.role_enterprise.view_all)):
            user_values = user_values.filter(id=user_val.id)
            users_active = users_active.filter(user_id=user_val.id)
            data_offline = data_offline.filter(user_id=user_val.id)

        if role_list:
            user_values = user_values.filter(role_enterprise_id__in=role_list)

        if usr_sel_values:
            user_values = user_values.filter(id__in=usr_sel_values)
            users_active = users_active.filter(user_id__in=usr_sel_values)
            data_offline = data_offline.filter(user_id__in=usr_sel_values)

        # Fecha inicial
        # if date_ini:
        #     users_active = users_active.filter(creation_date__gte=date_ini)
        #     data_offline = data_offline.filter(creation_date__gte=date_ini)

        if date_fin:
            users_active = users_active.filter(creation_date__lt=date_fin)
            data_offline = data_offline.filter(creation_date__lt=date_fin)

        user_values = user_values.select_related(
            'role_enterprise',
        ).values('id', 'first_name', 'middle_name', 'first_last_name', 'second_last_name', 'email')
        
        mobile_values = Device_Info_Movil.objects.filter(
            user__enterprise_id=user_val.enterprise_id,
        ).order_by(
            '-last_update'
        ).values(
            'user_id', 'brand', 'model', 'version', 'battery', 'gps', 'last_update', 'version_app', 'last_conection'
        )

        user_values = list(user_values)
        user_dict = {user['id']: user for user in user_values}

        for m in mobile_values:
            uid = m['user_id']
            if uid in user_dict:
                if 'mobile' not in user_dict[uid]:
                    user_dict[uid]['mobile'] = m

        data_offline = data_offline.values('user_id', 'creation_date__date')

        users_active = users_active.values('user_id', 'creation_date__date')

        users_active = users_active.union(data_offline)
        users_active = users_active.order_by('user_id', '-creation_date__date'
        ).values('user_id', 'creation_date__date',)

        users_active = list(users_active)
        # Limpieza de duplicados
        list_of_tuples = [tuple(d.items()) for d in users_active]
        unique_list_of_tuples = set(list_of_tuples)
        users_active = [dict(t) for t in sorted(unique_list_of_tuples)]

        get_attr = lambda user: user['user_id'] if 'user_id' in user else '-1'
        users_list = {k: list(g) for k, g in itertools.groupby(sorted(users_active, key=get_attr), get_attr)}

        response['status'] = True
        response['data'] = user_values

        response['user_dates'] = {
            id: [ usr_date for usr_date in user_dates
                    if is_date_between(usr_date['creation_date__date'], date_ini, date_fin)]
            for id, user_dates in users_list.items()}
        if user_values:
            time_start = datetime.now(tz=TZ_INFO) - timedelta(days=1)
            time_start = time_start.replace(hour=0, minute=0, second=0, microsecond=0)
            last_pos = {}
            user_ids = [el['id'] for el in user_values]

            all_today_pos = Follow_User.objects.filter(
                user_id__in=user_ids,
                latitude__isnull=False,
                longitude__isnull=False,
            ).order_by(
                'user_id', '-creation_date'
            ).distinct('user_id').values(
                'latitude',
                'longitude',
                'creation_date',
                'user_id',
            )
            last_pos = {pos['user_id']: pos for pos in all_today_pos}
            response['last'] = last_pos

        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    except Exception as e:
        import traceback
        with open("crash.log", "a") as f:
            f.write(traceback.format_exc())
            f.write("\n")
        raise
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_historical(request, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        user_get = User_Enterprise.objects.get(
            enterprise_id=user_val.enterprise_id,
            id=pk,
            role_id=3,
            state=True
        )

        # Respuestas individuales
        answer_values = Answer_Form.objects.filter(
            form_enterprise__state=True,
            created_by=user_get,
            consecutive=False,
            state=True
        ).select_related(
            'form_enterprise',
            'created_by'
        ).annotate(
            name_form=F('form_enterprise__name')
        ).values(
            'id',
            'name_form',
            'consecutive',
            'source',
            'online',
            'latitude',
            'longitude',
            'creation_date'
        ).order_by('-id')
        # Respuestas Consecutivas
        consecutive_values = Answer_Consecutive.objects.filter(
            form_consecutive__state=True,
            created_by=user_get,
            state=True
        ).select_related(
            'form_consecutive',
            'created_by'
        ).annotate(
            consecutive=Value(True),
            name_form=Concat(Value('Consecutivo - '), F('form_consecutive__name'), output_field=CharField()),
        ).values(
            'id',
            'name_form',
            'consecutive',
            'source',
            'online',
            'latitude',
            'longitude',
            'creation_date'
        ).order_by('-id')

        form_values = chain(answer_values, consecutive_values)

        role_name = 'Nínguno'
        if user_get.role_enterprise_id != None:
            role_name = user_get.role_enterprise.name

        data_user = {
            'user': {
                'first_name': user_get.first_name,
                'middle_name': user_get.middle_name,
                'first_last_name': user_get.first_last_name,
                'second_last_name': user_get.second_last_name,
                'type_identification': user_get.type_identification.name,
                'identification': user_get.identification,
                'phone': user_get.phone,
                'email': user_get.email,
                'role_enterprise': role_name,
                'register_platform': user_get.register_platform,
                'creation_date': user_get.creation_date,
                'last_login': user_get.user.last_login,
            },
            'answers': list(form_values)
        }
        response['data'] = data_user
        response['status'] = True
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    except:
        pass
    return Response(response, status=status_response)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_countries(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST

    country_vals = Country.objects.filter(state=True).values('id', 'name', 'code')
    response['status'] = True
    response['data'] = list(country_vals)
    status_response = status.HTTP_200_OK

    return Response(response, status=status_response)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_cities(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST

    city_vals = City.objects.filter(state=True).values('id', 'name', 'country_id', 'code')
    response['status'] = True
    response['data'] = list(city_vals)
    status_response = status.HTTP_200_OK

    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_field_workers(request):
    response = {"status": False}
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        role_values = Permit_Role.objects.filter(
            role_enterprise__enterprise_id=user_val.enterprise_id,
            role_enterprise__state=True,
            permit__permit_type_id=44,
            state=True
        ).select_related(
            'role_enterprise',
            'permit',
        ).values(
            'role_enterprise_id',
        )
        role_list = []
        for role in list(role_values):
            role_list.append(role['role_enterprise_id'])

        user_values = User_Enterprise.objects.filter(
            enterprise_id=user_val.enterprise_id,
            role_id=3,
            state=True,
            role_enterprise_id__in=role_list
        ).select_related(
            'role_enterprise',
        ).values('id', 'first_name', 'first_last_name')
        response['status'] = True
        response['data'] = list(user_values)
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
def get_value_parameter(request):
    response = {}
    parameter_values = Value_Parameter.objects.all().values('parameter_id', 'value', 'description')
    response['status'] = True
    response['data'] = list(parameter_values)
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)


@api_view(['GET'])
def get_api_list(request):
    response = {'status': False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        enterprise = get_enterprise(request)

        api_values = Api_Detail.objects.filter(status=True).values('id', 'name', 'description')

        response = {'status': True, 'data': list(api_values)}
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        response = {'status': False, 'detail': "This user isn't on the system."}
    return Response(response, status=status_response)

@api_view(['POST'])
def get_detail_restritive_list(request):
    response = {'status': False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data

    document_forms = Document_Identification.objects.filter(
            id=data['id']
        )
    for item in document_forms:
        data_json = str(item.data_form.replace('"','$*'))
        data_json = str(data_json.replace("'",'"'))
        json_data = json.loads(data_json)
        json_data['response'] = json_data['response'].replace('$*', '"')
        data = json.loads(json_data['response'])
        Count=0
        for item in data:
            if item['name'] == 'Procuraduría General de la Nación':
                if item['offense'] != 'NA':
                    ind=Count
            Count +=1
    response = {'status': True, 'data': data[ind]}
    status_response = status.HTTP_200_OK
    return Response(response, status=status_response)

def is_date_between(date, start_date, end_date):
    if isinstance(date, str):
        try:
            date = datetime.strptime(date.split(' ')[0].split('T')[0], '%Y-%m-%d').date()
        except Exception:
            pass
    elif hasattr(date, 'date'):
        date = date.date()
    elif isinstance(date, int):
        from datetime import datetime as dt_temp
        try:
            date = dt_temp.fromtimestamp(date).date()
        except Exception:
            pass

    if start_date is None and end_date is None:
        return True
    elif start_date is None:
        return date <= end_date.date()
    elif end_date is None:
        return date >= start_date.date()
    else:
        return start_date.date() <= date <= end_date.date()

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_data_token(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:

        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_val = user_val.enterprise
        variable_footer = Variable_Plataform.objects.get(name="footer")
        data = {
            'user':user_val.first_name + " " +user_val.first_last_name,
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
        response['data'] = data
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        pass
    except:
        pass
    return Response(response, status=status_response)
