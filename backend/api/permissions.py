from rest_framework import permissions
from api.models import User_Enterprise, Permit_Enterprise, Permit_Role, Device_Info_Movil

from datetime import datetime
import pytz

TZ_INFO = pytz.timezone('America/Bogota')

class ExamplePermission(permissions.BasePermission):
    message = 'Tienes que iniciar sesión para acceder a esto o no tienes los permisos suficientes.'

    def has_permission(self, request, view):
        # print(request.user, request.auth, request.user.is_authenticated)
        return request.user and request.user.is_authenticated

class IsSuperAdmin(permissions.IsAuthenticated):
    message = 'No tienes acceso a este servicio'

    def has_permission(self, request, view):
        # print(self.__class__, request.user, request.user.is_authenticated, request.auth)
        return request.user and request.user.is_authenticated and User_Enterprise.objects.filter(user_id=request.user.id, token=request.auth.key, role_id=1).exists()

class IsAdmin(permissions.IsAuthenticated):
    message = 'No tienes acceso a este servicio'

    def has_permission(self, request, view):
        # print(self.__class__, request.user, request.user.is_authenticated, request.auth)
        return request.user and request.user.is_authenticated and User_Enterprise.objects.filter(user_id=request.user.id, token=request.auth.key, role_id=2).exists()

class IsSuperAdminOrEntAdmin(permissions.IsAuthenticated):
    message = 'No tienes acceso a este servicio'

    def has_permission(self, request, view):
        # print(self.__class__, request.user, request.user.is_authenticated, request.auth)
        return request.user and request.user.is_authenticated and (User_Enterprise.objects.filter(user_id=request.user.id, token=request.auth.key, role_id__in=[1,2]).exists())

class IsUserAdmin(permissions.IsAuthenticated):
    message = 'No tienes acceso a este servicio'

    def has_permission(self, request, view):
        # print(self.__class__, request.user, request.user.is_authenticated, request.auth)
        return request.user and request.user.is_authenticated and User_Enterprise.objects.filter(user_id=request.user.id, token=request.auth.key, role_enterprise__null=False, role_enterprise__is_admin=True).exists()

class IsUserAdminOrHasPermission(permissions.IsAuthenticated):
    message = 'No tienes acceso a este servicio'
    
    def has_permission(self, request, view):
        try:
            token = request.auth.key
            user_enterprise_val = User_Enterprise.objects.get(user=request.user, token=token)
            if request.user and request.user.is_authenticated:
                permission = []
                if user_enterprise_val.role_id == 1:
                    permission = Permit_Enterprise.objects.filter(enterprise_id=user_enterprise_val.enterprise_id).values_list('permit_type_id', flat=True)
                elif user_enterprise_val.role_id == 2:
                    permission = Permit_Enterprise.objects.filter(enterprise_id=user_enterprise_val.enterprise_id, status=True).values_list('permit_type_id', flat=True)
                else:
                    permission = Permit_Role.objects.filter(
                        role_enterprise_id=user_enterprise_val.role_enterprise_id,
                        state=True, 
                        permit__status=True,
                    ).select_related(
                        'permit',
                    ).values_list('permit__permit_type_id', flat=True)
                
                response = check_permit(request, permission)
                if 'message' in response:
                    self.message = response['message']
                elif 'dart' in str(request.headers['User-Agent']).lower():
                    try:
                        dev_info = Device_Info_Movil.objects.get(user=user_enterprise_val)
                        dev_info.last_update = datetime.now(tz=TZ_INFO)
                        dev_info.save()
                    except (Device_Info_Movil.DoesNotExist, Device_Info_Movil.MultipleObjectsReturned):
                        pass
                return response['status']
        except User_Enterprise.DoesNotExist:
            return False
        return True

DICT_PERMIT = {
    '/user/': {
        'entity': 'usuarios',
        'method': {
            'POST': 2,
            'PUT': 3,
            'DELETE': 4,
            'GET': 5,
        }
    },
    '/answer/excel/document/': {
        'entity': 'reporte del documento',
        'method': {
            'POST': 59,
        }
    },
    '/answer/form/': {
        'entity': 'la respuesta del formulario',
        'method': {
            'PUT': 31,
            'GET': 33,
        }
    },
    '/answer/': {
        'entity': 'la respuesta del formulario',
        'method': {
            'POST': [
                [30],
                [65]
            ],
            'DELETE': 32,
        }
    },
    '/form/associate/': {
        'entity': 'asociar',
        'method': {
            'POST': 35,
            'DELETE': 36,
            'GET': 37,
        }
    },
    '/form/': {
        'entity': 'formularios',
        'method': {
            'POST': [
                [15],
                [16, 'PUT', 'id']
            ],
            'DELETE': 17,
            'GET': 0,
        }
    },
    '/permits/': {
        'entity': 'permisos',
        'method': {
            'PUT': 7,
            'GET': 8,
        }
    },
    '/role/': {
        'entity': 'rol',
        'method': {
            'POST': 10,
            'PUT': 11,
            'DELETE': 12,
            'GET': 13,
        }
    },
    '/device_type/': {
        'entity': 'categorias de dispositivo',
        'method': {
            'POST': 20,
            'PUT': 21,
            'DELETE': 22,
            'GET': 23,
        }
    },
    '/devices/': {
        'entity': 'dispositivos',
        'method': {
            'POST': 25,
            'PUT': 26,
            'DELETE': 27,
            'GET': 28,
        }
    },
    '/enroll/': {
        'entity': 'enrolamiento',
        'method': {
            'GET': 39,
        }
    },
    '/routes/': {
        'entity': 'ruta',
        'method': {
            'POST': 41,
            'PUT': 42,
            'DELETE': 43,
            'GET': 44,
        }
    },
    '/projects/': {
        'entity': 'proyectos',
        'method': {
            'POST': 46,
            'PUT': 47,
            'DELETE': 48,
            'GET': 49,
        }
    },
    '/locations/': {
        'entity': 'sucursales',
        'method': {
            'POST': 51,
            'PUT': 52,
            'DELETE': 53,
            'GET': 54,
        }
    },
    '/parameter/': {
        'entity': 'parámetros',
        'method': {
            'PUT': 57,
        }
    },
    '/traceability/': {
        'entity': 'trazabilidad',
        'method': {
            'GET': 58,
            'POST': 58,
        }
    },
    '/geoportal/': {
        'entity': 'geoportal',
        'method': {
            'GET': 60,
        }
    },
    '/contacts/': {
        'entity': 'contactos',
        'method': {
            'POST': 74,
            'PUT': 75,
            'DELETE': 76,
            'GET': 77,
        }
    },
}

def check_permit(request, permission):
    response = {
        'status': True
    }
    # print('permission:::::::::::')
    # print(list(permission))
    for key, permit in DICT_PERMIT.items():
        if key in request.path:
            # print('key:::::::::::')
            # print(key)
            if request.method in permit['method']:
                # print('request.method:::::::::::')
                # print(request.method)
                if type(permit['method'][request.method]) == type([]):
                    for method in permit['method'][request.method]:
                        if len(method) > 1 and method[2] in request.data:
                            if method[0] not in permission:
                                response['message'] = message_method(method[1], permit['entity'])
                                response['status'] = False
                            else:
                                response = {'status': True}
                                break
                        else:
                            if method[0] not in permission:
                                response['message'] = message_method(request.method, permit['entity'])
                                response['status'] = False
                            else:
                                response['status'] = True
                                break
                else:
                    if permit['method'][request.method] not in permission:
                        if permit['method'][request.method] != 0:
                            response['message'] = message_method(request.method, permit['entity'])
                            response['status'] = False

                break
    return response

def message_method(method, entity):
    message = ''
    if method == 'GET':
        message = 'No tienes permiso para ver ' + entity
    elif method == 'POST':
        message = 'No tienes permiso para crear ' + entity
    elif method == 'PUT':
        message = 'No tienes permiso para editar ' + entity
    elif method == 'DELETE':
        message = 'No tienes permiso para eliminar ' + entity
    return message
        