from datetime import datetime
from api.controllers.admin import get_enterprise
from api.models import Api_Detail, Api_Usage, Api_Packages, Api_Registry, Enterprise, User_Enterprise
from api.permissions import IsSuperAdmin, IsAdmin, IsSuperAdminOrEntAdmin
from django.db import IntegrityError
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView

import pytz

TZ_INFO = pytz.timezone('America/Bogota')


class ApiEnterpriseList(APIView):
    """
    API endpoint que permite la consulta de los permisos y la creación de nuevos.
    """
    permission_classes = [IsAdmin]

    # Consulta
    def get(self, request, format=None):
        response = {'status': False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            enterprise = get_enterprise(request)
            
            api_values = Api_Usage.objects.filter(enterprise_id=enterprise).select_related('api').values('id', 'api__name', 'api__description', 'limit', 'state')
            
            response = {'status': True, 'data': list(api_values)}
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            response = {'status': False, 'detail': "This user isn't on the system."}
        return Response(response, status=status_response)
    

class ApiEnterpriseDetail(APIView):
    """
    API endpoint que permite la consulta de los permisos y la creación de nuevos.
    """
    permission_classes = [IsSuperAdmin]

    # Consulta
    def get(self, request, format=None):
        response = {'status': False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            enterprise = get_enterprise(request)
            
            api_values = Api_Usage.objects.all().select_related('api').values('id', 'enterprise_id', 'api_id', 'api__name', 'api__description', 'limit', 'state')
            
            response = {'status': True, 'data': list(api_values)}
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            response = {'status': False, 'detail': "This user isn't on the system."}
        return Response(response, status=status_response)
    
    def post(self, request):
        response = {'status': False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            data = request.data
            enterprise = data['enterprise']
            api_id = data['api']
            limit = int(data['limit'])
            
            api_val = Api_Usage()
            api_val.api_id = api_id
            api_val.enterprise_id = enterprise
            api_val.limit = limit
            api_val.save()
            
            response = {
                'status': True, 
                'data': {
                    'id': api_val.id,
                    'api_id': api_id,
                    'limit': limit,
                    'enterprise_id': enterprise,
                },
            }
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            response = {'status': False, 'detail': "This user isn't on the system."}
        except IndexError:
            response['detail'] = 'Faltan datos.'
        except IntegrityError:
            response['detail'] = 'Ya existe el par de datos Empresa y API.'
        except ValueError:
            response['detail'] = 'Los parametros enterprise, api y limit deben ser numericos.'
        except Exception as e:
            response['detail'] = str(e)
        return Response(response, status=status_response)
    
    def put(self, request):
        response = {'status': False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            data = request.data
            
            api_id = int(data['id'])
            limit = int(data['limit']) if 'limit' in data else None
            state = data['status'] if 'limit' in data else None
            
            if limit is None and state is None:
                raise IndexError('')
            
            api_val = Api_Usage.objects.get(id=api_id)
            
            if limit:
                api_val.limit = limit
            if state is not None:
                api_val.state = state
            api_val.save()
            
            response = {
                'status': True,
            }
            status_response = status.HTTP_200_OK
        except IndexError:
            response['detail'] = 'Faltan datos.'
        except ValueError:
            response['detail'] = 'Los parametros id y limit deben ser numericos.'
        except Exception as e:
            response['detail'] = str(e)
        return Response(response, status=status_response)


@api_view(["GET"])
@permission_classes([IsSuperAdminOrEntAdmin])
def get_api_list(request):
    data = list(Api_Detail.objects.filter(state=True).values('id', 'name', 'description'))
    return Response(data, status=status.HTTP_200_OK)

def get_api_consumption(api, enterprise):
    first_of_month = datetime.now(tz=TZ_INFO).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    if first_of_month.month == 12:
        end_of_month = first_of_month.replace(year=first_of_month.year+1, month=1)
    else:
        end_of_month = first_of_month.replace(month=first_of_month.month+1)
    
    month_counter = Api_Registry.objects.filter(
        api_id=api, 
        enterprise_id=enterprise, 
        date__gte=first_of_month, 
        date__lt=end_of_month
    ).count()
    
    return month_counter

def check_usage_api_enterprise(api, enterprise, opc=0):
    '''
    Verificación de consumo en el mes, si la empresa ya consumio su paquete gratis y en caso de que si, su paquete todavia pueda servirle para consumo.
    
    Opcional, se verifica, teniendo en cuenta una posible cantidad de consumos esperados.
    '''
    try:
        if api == -1:
            ent_val = Enterprise.objects.get(id=enterprise)
            limit_users = ent_val.max_users
            current_users = User_Enterprise.objects.filter(enterprise_id=enterprise).count()
            return current_users + opc <= limit_users
        
        api_val = Api_Usage.objects.get(api_id=api, enterprise_id=enterprise, state=True)
        month_counter = get_api_consumption(api, enterprise) + opc
        
        if month_counter <= api_val.limit:
            return True
        else:
            try:
                active_packages = Api_Packages.objects.filter(enterprise_id=enterprise, api_id=api, state=True).values('limit', 'used')
                limit = 0
                used = 0
                temp_counter = month_counter - api_val.limit
                for act_pkg in list(active_packages):
                    limit += act_pkg['limit']
                    used += act_pkg['used']
                if limit - used > temp_counter:
                    return True
            except Exception as err:
                print(err)
    except Exception as err:
        print(err)
    return False
    

def register_api_usage(enterprise, api, status, data=None):
    '''
    Los datos de consumo de la API para ser guardados como nuevos registros en la BD.
    Se actualiza el paquete de consumo de API de ser necesario.
    '''
    month_counter = get_api_consumption(api, enterprise)
    active_package = None
    paid = month_counter > 200
    if paid:
        active_package = Api_Packages.objects.filter(enterprise_id=enterprise, api_id=api, state=True).order_by('creation_date').first()
        if active_package:
            active_package.used += 1
            if active_package.used == active_package.limit:
                active_package.state = False
            active_package.save()
    
    registry = Api_Registry()
    registry.api_id = api
    registry.enterprise_id = enterprise
    if data:
        registry.value = str(data)
    if active_package:
        registry.consume_pkg = active_package
        registry.type_consume = 1
    elif paid:
        registry.type_consume = 2
    registry.status = status
    registry.save()
