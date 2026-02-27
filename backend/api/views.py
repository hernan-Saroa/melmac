from django.contrib.auth.models import User, Group
from django.conf import settings
from django.views.static import serve
from rest_framework import viewsets
from rest_framework import permissions
from api.serializers import UserSerializer, GroupSerializer
# token
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
# api
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
# authentication
from rest_framework.permissions import IsAuthenticated
from api.permissions import ExamplePermission
# models
from api.models import (
    Address_Order,
    Answer_Consecutive,
    Answer_Form,
    Api_Detail,
    Api_Usage,
    Country,
    Element_Type_Config,
    Enterprise_Process_State,
    Enterprise_Processs,
    Region,
    City,
    Address_Zone,
    Address_Locality,
    Address_UPZ,
    Address_Neighborhood,
    Enterprise,
    Field_Type,
    Parameter,
    Parameter_Validate,
    Permit,
    Permit_Enterprise,
    Theme,
    Type_Identification,
    Traceability_User,
    Role,
    User_Enterprise,
    Value_Parameter,
    Variable_Plataform,
    Home_Items,
)
from api.data import (
    ADDRESS_ORDER_VALUES,
    NEIGHBORHOOD_VALUES,
    UPZ_VALUES,
    DATA_PERMISSIONS,
    DATA_ENT_PERMITS,
)

from api.controllers.enterprise import random_serial
from api.controllers.traceability import create_traceability
import requests
import datetime

class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [permissions.IsAuthenticated]

@api_view(['GET'])
@permission_classes([ExamplePermission])
def prueba(request):
    return Response({
        'prueba': 'exitosa'
    })

class ExampleView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        content = {
            'prueba': 'exitosa'
        }
        return Response(content)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def test(request):
    user_values = User.objects.all().values('username', 'email')
    return Response(user_values)


@api_view(['GET'])
def start_app(request):
    # Theme
    data_theme = [
        { 'id': 1, 'name': 'Light' },
        { 'id': 2, 'name': 'Dark' },
        { 'id': 3, 'name': 'Cosmic' },
        { 'id': 4, 'name': 'Corporate' },
    ]

    for theme in data_theme:
        try:
            theme_new = Theme.objects.get(id=theme['id'])
            theme_new.name = theme['name']
            theme_new.save()
        except Theme.DoesNotExist:
            theme_new = Theme()
            theme_new.id = theme['id']
            theme_new.name = theme['name']
            theme_new.save()

    # Variable_Plataform
    data_variable_plataform = [
        { 'id': 1, 'name': 'footer', 'value': '© Saroa SAS 2022' },
        { 'id': 2, 'name': 'footer_movil', 'value': '© Saroa SAS 2022' },
        { 'id': 3, 'name': 'version_store', 'value': '1.3.1' },
        { 'id': 4, 'name': 'WS TOKEN', 'value': 'EAAffHZBogNjcBABWtAihgweVYGtZBXPM3ZBDj8ty8FEuZBf3UinKUUYfzcJeqWcgzI0DZA1sg7WRvS586kA6KeB82S3RrIlaeSfxEupO0Q6PBWAqIDS80vmxtkf8wBSFgTF6s3nCxd8DMyE5S0FfHfi2ZCiUmZAJH0hbIBFudeaQM0lNOhkzNW2bUZBiylEEDfpeHAvMKarwezm2ZAMTt7V5x' },
    ]

    for variable_plataform in data_variable_plataform:
        try:
            variable_plataform_new = Variable_Plataform.objects.get(id=variable_plataform['id'])
            # variable_plataform_new.name = variable_plataform['name']
            # variable_plataform_new.value = variable_plataform['value']
            # variable_plataform_new.save()

        except Variable_Plataform.DoesNotExist:
            variable_plataform_new = Variable_Plataform()
            variable_plataform_new.id = variable_plataform['id']
            variable_plataform_new.name = variable_plataform['name']
            variable_plataform_new.value = variable_plataform['value']
            variable_plataform_new.save()

    # Type_Identification
    data_identification = [
        { 'id': 1, 'name': 'Registro civil de nacimiento' },
        { 'id': 2, 'name': 'Tarjeta de identidad' },
        { 'id': 3, 'name': 'Cédula de ciudadanía' },
        { 'id': 4, 'name': 'Tarjeta de extranjería' },
        { 'id': 5, 'name': 'Cédula de extranjería' },
        { 'id': 6, 'name': 'NIT' },
        { 'id': 7, 'name': 'Pasaporte' },
    ]

    for identification in data_identification:
        try:
            type_identification_new = Type_Identification.objects.get(id=identification['id'])
            type_identification_new.name = identification['name']
            type_identification_new.save()
        except Type_Identification.DoesNotExist:
            type_identification_new = Type_Identification()
            type_identification_new.id = identification['id']
            type_identification_new.name = identification['name']
            type_identification_new.save()

    # Role
    data_role = [
        { 'id': 1, 'name': 'Super administrador', 'desc': 'Control sobre la aplicación y los usuarios' },
        { 'id': 2, 'name': 'Administrador', 'desc': 'Administra un grupo de usuarios y funciones' },
        { 'id': 3, 'name': 'Usuario', 'desc': 'Usuario con funciones limitadas' },
    ]

    for role in data_role:
        try:
            role_new = Role.objects.get(id=role['id'])
            role_new.name = role['name']
            role_new.description = role['desc']
            role_new.save()
        except Role.DoesNotExist:
            role_new = Role()
            role_new.id = role['id']
            role_new.name = role['name']
            role_new.description = role['desc']
            role_new.save()
    # Home
    data_home = [
        { 'id': 1, 'name': 'Crear un documento', 'image_name': 'crear_un_documento.png', 'path': "/pages/form/create"},
        { 'id': 2, 'name': 'Administrar ursuarios', 'image_name': 'administrar_usuarios.png', 'path': "/pages/user"},
        { 'id': 3, 'name': 'Ver trabajo de campo', 'image_name': 'ver_trabajo_de_campo.png', 'path': "/pages/route/view"},
        { 'id': 4, 'name': 'Ir a mi geoportal', 'image_name': 'ir_a_mi_geoportal.png', 'path':"/pages/geoportal/point"},
        { 'id': 5, 'name': 'Adquirir un plan', 'image_name': 'adquirir_un_plan.png', 'path': "/pages/planUser"},
    ]

    for home in data_home:
        try:
            home_new = Home_Items.objects.get(id=home['id'])
            home_new.name = home['name']
            home_new.image_name = home['image_name']
            home_new.path = home['path']
            home_new.state = True
            home_new.save()
        except Home_Items.DoesNotExist:
            home_new = Home_Items()
            home_new.name = home['name']
            home_new.image_name = home['image_name']
            home_new.path = home['path']
            home_new.state = True
            home_new.save()


    # Super Admin
    try:
        super_new = User_Enterprise.objects.get(email='super@saroa.co', role_id=1)
        enterprise_list = Enterprise.objects.filter(state=True,id=super_new.id).order_by('id')
    except User_Enterprise.DoesNotExist:
        # Enterprise
        enterprise_new = Enterprise()
        enterprise_new.theme_id = 1
        enterprise_new.save()

        # User
        user_new = User()
        user_new.username = 'super@saroa.co'
        user_new.first_name = 'Super'
        user_new.last_name = 'Administrador'
        user_new.email = 'super@saroa.co'
        user_new.save()

        user_enterprise_new = User_Enterprise()
        user_enterprise_new.user = user_new
        user_enterprise_new.enterprise = enterprise_new
        user_enterprise_new.role_id = 1
        user_enterprise_new.first_name = 'Super'
        user_enterprise_new.first_last_name = 'Administrador'
        user_enterprise_new.type_identification_id = 3
        user_enterprise_new.identification = 11111111
        user_enterprise_new.email = 'super@saroa.co'
        user_enterprise_new.phone = 1234567890
        user_enterprise_new.password = '272c3b24ce7cee1dcaade82e37de1f27'
        user_enterprise_new.save()

    # App Permits
    for permit in DATA_PERMISSIONS:
        try:
            permit_new = Permit.objects.get(id=permit['id'])
            permit_new.name = permit['name']
            permit_new.auth_permission_id = permit['auth_permission_id']
            permit_new.view = permit['view']
        except Permit.DoesNotExist:
            permit_new = Permit()
            permit_new.id = permit['id']
            permit_new.name = permit['name']
            permit_new.auth_permission_id = permit['auth_permission_id']
            permit_new.view = permit['view']
        permit_new.save()

    enterprise_list = Enterprise.objects.filter(state=True).order_by('id')

    for enterprise in enterprise_list:
        for ent_permit in DATA_ENT_PERMITS:
            try:
                ent_permit_new = Permit_Enterprise.objects.get(enterprise_id=enterprise.id, permit_type_id=ent_permit['permit_type'])
                ent_permit_new.name = ent_permit['name']
                ent_permit_new.description = ent_permit['desc']
                ent_permit_new.save()
            except Permit_Enterprise.DoesNotExist:
                ent_permit_new = Permit_Enterprise()
                ent_permit_new.enterprise_id = enterprise.id
                ent_permit_new.name = ent_permit['name']
                ent_permit_new.description = ent_permit['desc']
                ent_permit_new.permit_type_id = ent_permit['permit_type']
                ent_permit_new.save()

    for enterprise in enterprise_list:
        if enterprise.serial == None:
            # Random serial
            serial = random_serial()
            aux = 1
            while aux < 2:
                try:
                    # Valida si existe el serial
                    Enterprise.objects.get(serial=serial)
                    # Nuevo random serial
                    serial = random_serial()
                except Enterprise.DoesNotExist:
                    enterprise.serial = serial
                    enterprise.save()
                    aux = 2

    # Field Type
    data_field = [
        { 'id': 1, 'name': 'Alfanumérico', 'description': 'Que está formado por letras y números'},
        { 'id': 2, 'name': 'Numérico', 'description': 'Que está compuesto solo por números'},
        { 'id': 3, 'name': 'Lista', 'description': 'Conjunto de cosas escogidas'},
        { 'id': 4, 'name': 'Fecha', 'description': 'Indicación de fecha'},
        { 'id': 5, 'name': 'Solo letras', 'description': 'Campos para guardar los nombres o apellidos'},
        { 'id': 6, 'name': 'Texto', 'description': 'Campos de texto amplios'},
        { 'id': 7, 'name': 'Firma manuscrita', 'description': 'Campos para guardar la firma'},
        { 'id': 8, 'name': 'Archivo', 'description': 'Guardar los archivos necesarios'},
        { 'id': 9, 'name': 'Captura', 'description': 'Captura de imagen en el momento'},
        { 'id': 10, 'name': 'Firma biométrica facial', 'description': 'Captura de firma electrónica avanzada'},
        { 'id': 11, 'name': 'Número de documento', 'description': 'Captura de número de documento'},
        { 'id': 12, 'name': 'Radio', 'description': 'Campo de selección única'},
        { 'id': 13, 'name': 'Checkbox', 'description': 'Campo de selección múltiple'},
        { 'id': 14, 'name': 'Información', 'description': 'Campo informativo sin respuesta'},
        { 'id': 15, 'name': 'Ubicación', 'description': 'Campo de geolocalización con latitud y longitud'},
        { 'id': 16, 'name': 'Moneda', 'description': 'Campo con formato de moneda'},
        { 'id': 17, 'name': 'Tabla', 'description': 'Formato con varios campos'},
        { 'id': 18, 'name': 'Firma con cédula', 'description': 'Captura de firma electrónica media'},
        { 'id': 19, 'name': 'Hora', 'description': 'Captura de la hora'},
        { 'id': 20, 'name': 'NIT', 'description': 'Captura NIT'},
        { 'id': 21, 'name': 'Oculto', 'description': 'Campos diligenciar internamente en la plataforma'},
        { 'id': 22, 'name': 'OTP básico', 'description': 'Captura de validación por correo electrónico'},
        { 'id': 23, 'name': 'País', 'description': 'Captura de país, departamento y ciudad'},
        { 'id': 24, 'name': 'Número de serie', 'description': 'Almena y muestra el número de serie del documento'},
        { 'id': 25, 'name': 'Dirección', 'description': 'Captura la dirección que se va a diligenciar'},
    ]

    for field in data_field:
        try:
            field_new = Field_Type.objects.get(id=field['id'])
            field_new.name = field['name']
            field_new.description = field['description']
            field_new.save()
        except Field_Type.DoesNotExist:
            field_new = Field_Type()
            field_new.id = field['id']
            field_new.name = field['name']
            field_new.description = field['description']
            field_new.save()
    
    # Field Type to config pdf
    data_field_config = [
        { 'id': 1, 'name': 'Título', 'description': 'Campo de configuración - Título'},
        { 'id': 2, 'name': 'Líena de texto', 'description': 'Campo de configuración - Líena de texto'},
        { 'id': 3, 'name': 'Párrafo', 'description': 'Campo de configuración - Párrafo'},
        { 'id': 4, 'name': 'Elementos gráficos', 'description': 'Campo de configuración - Elementos gráficos'},
        { 'id': 5, 'name': 'Logo o imagen', 'description': 'Campo de configuración - Logo o imagen'},
    ]
    
    for config in data_field_config:
        try:
            config_new = Element_Type_Config.objects.get(id = config['id'])
            config_new.name = config['name']
            config_new.description = config['description']
            config_new.save()
        except Element_Type_Config.DoesNotExist:
            config_new = Element_Type_Config()
            config_new.id = config['id']
            config_new.name = config['name']
            config_new.description = config['description']
            config_new.save()

    # Parameter Validate Field
    data_parameter_field = [
        { 'id': 1, 'name': 'min', 'description': 'Longitud mínima'},
        { 'id': 2, 'name': 'max', 'description': 'Longitud máxima'},
        { 'id': 3, 'name': 'advanced', 'description': 'Validación avanzada'},
        { 'id': 4, 'name': 'advancedNit', 'description': 'Validación avanzada Nit'},
        { 'id': 5, 'name': 'special', 'description': 'Validación especial para los campos'},
    ]

    for parameter_field in data_parameter_field:
        try:
            parameter_field_new = Parameter_Validate.objects.get(id=parameter_field['id'])
            parameter_field_new.name = parameter_field['name']
            parameter_field_new.description = parameter_field['description']
            parameter_field_new.save()
        except Parameter_Validate.DoesNotExist:
            parameter_field_new = Parameter_Validate()
            parameter_field_new.id = parameter_field['id']
            parameter_field_new.name = parameter_field['name']
            parameter_field_new.description = parameter_field['description']
            parameter_field_new.save()

    # Parameter Follow
    data_parameter = [
        { 'id': 1, 'name': 'Tiempo', 'values': [
            {'value': '5', 'description': '5 minutos'},
            {'value': '15', 'description': '15 minutos'},
            {'value': '30', 'description': '30 minutos'},
            {'value': '60', 'description': '1 hora'},
            {'value': '240', 'description': '4 horas'},
        ]},
        { 'id': 2, 'name': 'Distancia', 'values': [
            {'value': '200', 'description': '200 metros'},
            {'value': '500', 'description': '500 metros'},
        ]},
    ]

    for parameter in data_parameter:
        try:
            parameter_new = Parameter.objects.get(id=parameter['id'])
            parameter_new.name = parameter['name']
            parameter_new.save()
        except Parameter.DoesNotExist:
            parameter_new = Parameter()
            parameter_new.id = parameter['id']
            parameter_new.name = parameter['name']
            parameter_new.save()

        for value_parameter in parameter['values']:
            try:
                value_parameter_new = Value_Parameter.objects.get(parameter=parameter_new, description=value_parameter['description'])
                value_parameter_new.description = value_parameter['description']
                value_parameter_new.value = value_parameter['value']
                value_parameter_new.save()
            except Value_Parameter.DoesNotExist:
                value_parameter_new = Value_Parameter()
                value_parameter_new.parameter = parameter_new
                value_parameter_new.description = value_parameter['description']
                value_parameter_new.value = value_parameter['value']
                value_parameter_new.save()

    # Country
    data_countries = [
        {'id': 1, 'name': 'COLOMBIA', 'code': 57}
    ]
    for country in data_countries:
        try:
            country_val = Country.objects.get(id=country['id'])
            country_val.name = country['name']
            country_val.code = country['code']
            country_val.save()
        except Country.DoesNotExist:
            country_new = Country()
            country_new.id = country['id']
            country_new.name = country['name']
            country_new.code = country['code']
            country_new.save()

    # Region
    data_regions = [
        {'id': 1, 'name': 'BOGOTA', 'country': 1, 'code': 1}
    ]
    for region in data_regions:
        try:
            region_val = Region.objects.get(id=region['id'])
            region_val.name = region['name']
            region_val.code = region['code']
            region_val.country_id = region['country']
            region_val.save()
        except Region.DoesNotExist:
            region_new = Region()
            region_new.id = region['id']
            region_new.name = region['name']
            region_new.code = region['code']
            region_new.country_id = region['country']
            region_new.save()

    # City
    data_cities = [
        {'id': 1, 'name': 'BOGOTA', 'country': 1, 'region': 1, 'code': 1}
    ]
    for city in data_cities:
        try:
            city_val = City.objects.get(id=city['id'])
            city_val.name = city['name']
            if 'code' in city:
                city_val.code = city['code']
            if 'region' in city:
                city_val.region_id = city['region']
            city_val.country_id = city['country']
            city_val.save()
        except City.DoesNotExist:
            city_new = City()
            city_new.id = city['id']
            city_new.name = city['name']
            if 'code' in city:
                city_new.code = city['code']
            if 'region' in city:
                city_new.region_id = city['region']
            city_new.country_id = city['country']
            city_new.save()

    # Address Zone
    data_zone = [
        {'id': 1, 'name': 'CENTRO'},
        {'id': 2, 'name': 'NORTE'},
        {'id': 3, 'name': 'SUR'},
        {'id': 4, 'name': 'ORIENTE'},
        {'id': 5, 'name': 'OCCIDENTE'},
        {'id': 6, 'name': 'NOR-OCCIDENTE'},
        {'id': 7, 'name': 'NOR-ORIENTE'},
        {'id': 8, 'name': 'OCCIDENTE-CENTRAL'},
        {'id': 9, 'name': 'SUR-OCCIDENTE'},
        {'id': 10, 'name': 'SUR-ORIENTE'},
    ]
    for zone in data_zone:
        try:
            zone_val = Address_Zone.objects.get(id=zone['id'])
            zone_val.name = zone['name']
            zone_val.save()
        except Address_Zone.DoesNotExist:
            zone_new = Address_Zone()
            zone_new.id = zone['id']
            zone_new.name = zone['name']
            zone_new.save()

    # Address_Locality
    data_localities = [
        {'id': 1, 'city': 1, 'name': 'CHAPINERO', 'code': 2, 'zone':2, 'subzone':7},
        {'id': 2, 'city': 1, 'name': 'ENGATIVA', 'code': 10, 'zone':2, 'subzone':6},
        {'id': 3, 'city': 1, 'name': 'SUBA', 'code': 11, 'zone':2, 'subzone':6},
        {'id': 4, 'city': 1, 'name': 'TEUSAQUILLO', 'code': 13, 'zone':2, 'subzone':7},
        {'id': 5, 'city': 1, 'name': 'USAQUEN', 'code': 1, 'zone':2, 'subzone':7},
        {'id': 6, 'city': 1, 'name': 'FONTIBON', 'code': 9, 'zone':5, 'subzone':8},
        {'id': 7, 'city': 1, 'name': 'KENEDY', 'code': 8, 'zone':5, 'subzone':8},
        {'id': 8, 'city': 1, 'name': 'PUENTE ARANDA', 'code': 16, 'zone':5, 'subzone':8},
        {'id': 9, 'city': 1, 'name': 'ANTONIO NARIÑO', 'code': 15, 'zone':4, 'subzone':1},
        {'id': 10, 'city': 1, 'name': 'CANDELARIA', 'code': 17, 'zone':4, 'subzone':1},
        {'id': 11, 'city': 1, 'name': 'LOS MARTIRES', 'code': 14, 'zone':4, 'subzone':1},
        {'id': 12, 'city': 1, 'name': 'SAN CRISTOBAL', 'code': 4, 'zone':4, 'subzone':1},
        {'id': 13, 'city': 1, 'name': 'SANTA FE', 'code': 3, 'zone':4, 'subzone':1},
        {'id': 14, 'city': 1, 'name': 'BOSA', 'code': 7, 'zone':3, 'subzone':9},
        {'id': 15, 'city': 1, 'name': 'CIUDAD BOLIVAR', 'code': 19, 'zone':3, 'subzone':9},
        {'id': 16, 'city': 1, 'name': 'RAFAEL URIBE URIBE', 'code': 18, 'zone':3, 'subzone':10},
        {'id': 17, 'city': 1, 'name': 'TUNJUELITO', 'code': 6, 'zone':3, 'subzone':9},
        {'id': 18, 'city': 1, 'name': 'USME', 'code': 5, 'zone':3, 'subzone':10},
        {'id': 19, 'city': 1, 'name': 'BARRIOS UNIDOS', 'code': 12, 'zone':2, 'subzone':6},
    ]

    for locality in data_localities:
        try:
            locality_val = Address_Locality.objects.get(id=locality['id'])
            locality_val.city_id = locality['city']
            locality_val.zone_id = locality['zone']
            locality_val.subzone_id = locality['subzone']
            locality_val.name = locality['name']
            locality_val.code = locality['code']
            locality_val.save()
        except Address_Locality.DoesNotExist:
            locality_new = Address_Locality()
            locality_new.id = locality['id']
            locality_new.city_id = locality['city']
            locality_new.zone_id = locality['zone']
            locality_new.subzone_id = locality['subzone']
            locality_new.name = locality['name']
            locality_new.code = locality['code']
            locality_new.save()

    # Address UPZ
    data_upz = UPZ_VALUES

    for upz in data_upz:
        try:
            upz_val = Address_UPZ.objects.get(id=upz['id'])
            upz_val.locality_id = upz['locality']
            upz_val.name = upz['name']
            upz_val.code = upz['code']
            upz_val.save()
        except Address_UPZ.DoesNotExist:
            upz_new = Address_UPZ()
            upz_new.id = upz['id']
            upz_new.locality_id = upz['locality']
            upz_new.name = upz['name']
            upz_new.code = upz['code']
            upz_new.save()

    # Address Neighborhood
    data_neighborhoods = NEIGHBORHOOD_VALUES

    for neigh in data_neighborhoods:
        try:
            neigh_val = Address_Neighborhood.objects.get(id=neigh['id'])
            neigh_val.upz_id = neigh['upz']
            neigh_val.name = neigh['name']
            neigh_val.save()
        except Address_Neighborhood.DoesNotExist:
            neigh_new = Address_Neighborhood()
            neigh_new.id = neigh['id']
            neigh_new.upz_id = neigh['upz']
            neigh_new.name = neigh['name']
            neigh_new.save()

    # Address Order
    data_addr_order = ADDRESS_ORDER_VALUES
    for order in data_addr_order:
        try:
            order_val = Address_Order.objects.get(id=order['id'])
            order_val.upz_id = order['upz']
            order_val.order = order['order']
            order_val.save()
        except Address_Order.DoesNotExist:
            order_new = Address_Order()
            order_new.id = order['id']
            order_new.upz_id = order['upz']
            order_new.order = order['order']
            order_new.save()

    # Enterprise Process
    data_processes = [
        {'name': 'MENSAJERIA', 'description': 'Proceso de entregas por medio de usuarios registrados a una empresa.'},
        {'name': 'ENRUTAMIENTO', 'description': 'Proceso de carga masiva de direcciones para generar servicios de mensajeria.'},
        {'name': 'DOCUMENTACION', 'description': 'Proceso de gestion documental de documentos manuales y digitales.'},
        {'name': 'VISITAS', 'description': 'Proceso de gestion de las tareas y proyectos para las visitas.'},
    ]

    data_process_states = [
        # Mensajeria
        {'name': 'Nuevo Servicio', 'description': 'Se ha creado tu servicio', 'order': 1, 'process': 'MENSAJERIA'},
        {'name': 'En ruta', 'description': 'El servicio forma parte de la ruta', 'order': 2, 'process': 'MENSAJERIA'},
        {'name': 'Asignado a Mensajero', 'description': 'El mensajero ha aceptado tu servicio', 'order': 3, 'process': 'MENSAJERIA'},
        {'name': 'Mensajero de Recogida', 'description': 'El mensajero esta recogiendo tu pedido', 'order': 4, 'process': 'MENSAJERIA'},
        {'name': 'Mensajero en Camino', 'description': 'El mensajero esta llevando tu pedido', 'order': 5, 'process': 'MENSAJERIA'},
        {'name': 'Llegada a punto de entrega', 'description': 'El mensajero esta en el domicilio de entrega', 'order': 6, 'process': 'MENSAJERIA'},
        {'name': 'En proceso de Captura', 'description': 'Captura de comprobantes de entrega', 'order': 7, 'process': 'MENSAJERIA'},
        {'name': 'Entrega Finalizada', 'description': 'Servicio Terminado', 'order': 8, 'process': 'MENSAJERIA'},
        {'name': 'Libre', 'description': 'Mensajero sin servicio activo', 'order': 9, 'process': 'MENSAJERIA'},
        {'name': 'En servicio', 'description': 'Mensajero en servicio activo', 'order': 10, 'process': 'MENSAJERIA'},
        {'name': 'Varado', 'description': 'El mensajero no puede completar la entrega', 'order': 11, 'process': 'MENSAJERIA'},
        {'name': 'En Emergencia', 'description': 'El mensajero se encuentra en una emergencia', 'order': 12, 'process': 'MENSAJERIA'},
        {'name': 'Servicio Cancelado', 'description': 'El servicio fue cancelado por el usuario', 'order': 13, 'process': 'MENSAJERIA'},
        # Enrutamiento
        {'name': 'Carga Iniciada', 'description': 'El archivo para enrutamiento esta siendo procesado', 'order': 1, 'process': 'ENRUTAMIENTO'},
        {'name': 'En revision', 'description': 'Los registros estan siendo revisados por el usuario', 'order': 2, 'process': 'ENRUTAMIENTO'},
        {'name': 'Generando Rutas', 'description': 'Se estan generando las rutas para mensajeria', 'order': 3, 'process': 'ENRUTAMIENTO'},
        {'name': 'Asignando Rutas', 'description': 'Se estan asignando mensajeros a las rutas', 'order': 4, 'process': 'ENRUTAMIENTO'},
        {'name': 'Carga Finalizada', 'description': 'Termino la carga para enrutamiento', 'order': 5, 'process': 'ENRUTAMIENTO'},
        # Documentacion
        {'name': 'En diligenciamiento', 'description': 'Se empezo el proceso de diligenciado de documento', 'order': 1, 'process': 'DOCUMENTACION'},
        {'name': 'Pendiente', 'description': 'Pendiente terminar con una o varias secciones del documento', 'order': 2, 'process': 'DOCUMENTACION'},
        {'name': 'Finalizado', 'description': 'Diligenciamiento de documento terminado', 'order': 3, 'process': 'DOCUMENTACION'},
        {'name': 'Pendiente Firma', 'description': 'Pendiente llenado de campos de grafo o biometria', 'order': 4, 'process': 'DOCUMENTACION'},
        #visitas
        {'name': 'Sin Iniciar', 'description': 'Crea la tarea con usuario asignado pero sin comenzarla', 'order': 1, 'process': 'VISITAS'},
        {'name': 'En Proceso', 'description': 'El usuario asignado esta realizando la tarea', 'order': 2, 'process': 'VISITAS'},
        {'name': 'Reasignada', 'description': 'El usuario asignado no finalizo la tarea', 'order': 3, 'process': 'VISITAS'},
        {'name': 'Finalizada', 'description': 'El usuario asignado finaliza la tarea', 'order': 4, 'process': 'VISITAS'},
        {'name': 'Finalizada por administrador', 'description': 'Fue finalizada por el usuario administrador', 'order': 5, 'process': 'VISITAS'},
        {'name': 'Tarea por asignar', 'description': 'Crea la tarea', 'order': 6, 'process': 'VISITAS'},
    ]

    # Api
    data_api = [
        {
            'id': 1,
            'name': 'Geocodificar',
            'description': 'Permite obtener coordenadas a partir de una dirección'
            # +'u obtener una dirección aproximada a partir de unas coordenadas.',
        },
        {
            'id': 2,
            'name': 'Generación de Rutas',
            'description': 'Permite a partir de una serie de puntos, generar la ruta optima para el recorrido.',
        },
        {
            'id': 3,
            'name': 'Envio de SMS',
            'description': 'Servicio para el envio de mensajes de texto a numeros celulares.',
        },
        {
            'id': 4,
            'name': 'Envio de Whatsapp',
            'description': 'Servicio para el envio de mensajes de texto via Whatsapp.',
        },
        {
            'id': 5,
            'name': 'Envio de Email',
            'description': 'Servicio para envio de correos Electronicos.',
        }
    ]

    for api in data_api:
        try:
            api_val = Api_Detail.objects.get(id=api['id'])
        except Api_Detail.DoesNotExist:
            api_val = Api_Detail()
            api_val.id = api['id']
            api_val.name = api['name']
            api_val.description = api['description']
            api_val.save()

    for enterprise in enterprise_list[1:]:
        for api in data_api:
            try:
                api_val = Api_Usage.objects.get(api_id=api['id'], enterprise_id=enterprise)
            except Api_Usage.DoesNotExist:
                api_val = Api_Usage()
                api_val.api_id = str(api['id'])
                api_val.enterprise_id = str(enterprise)
                api_val.limit = 200
                api_val.save()


    for enterprise in enterprise_list[:1]:
        data_processes_ent = {}
        for i, process in enumerate(data_processes):
            id_i = i+1
            try:
                process_val = Enterprise_Processs.objects.get(id=id_i, enterprise_id=enterprise, name=process['name'])
                process_val.description = process['description']
                process_val.save()
            except Enterprise_Processs.DoesNotExist:
                process_val = Enterprise_Processs()
                process_val.id = id_i
                process_val.enterprise_id = str(enterprise)
                process_val.name = process['name']
                process_val.description = process['description']
                process_val.save()
            data_processes_ent[process['name']] = process_val.id

        for j, process_state in enumerate(data_process_states):
            id_j = j+1
            try:
                process_state_val = Enterprise_Process_State.objects.get(id=id_j, enterprise_id=enterprise, order=process_state['order'], process_id=data_processes_ent[process_state['process']])
                process_state_val.name = process_state['name']
                process_state_val.description = process_state['description']
                process_state_val.save()
            except Enterprise_Process_State.DoesNotExist:
                process_state_val = Enterprise_Process_State()
                process_state_val.id = id_j
                process_state_val.enterprise_id = str(enterprise)
                process_state_val.name = process_state['name']
                process_state_val.description = process_state['description']
                process_state_val.order = process_state['order']
                process_state_val.process_id = data_processes_ent[process_state['process']]
                process_state_val.save()

    return Response({
        'status': True,
        'message': 'Acción Finalizada',
    })

@api_view(['GET'])
def delete_duplicates(request):
    data_eliminated = Answer_Form.objects.filter(
        form_enterprise__enterprise_id=72,
        state=False,
        creation_date__gte=datetime.date(2023, 6, 8), # Fecha Inicial
        creation_date__lte=datetime.date(2023, 6, 9) # Fecha Final(No elimina la fecha final sino hasta el dia anterior)
    ).delete()
    return Response({
        'status': True,
        'message' : "Cantidad de Eliminados {}".format(data_eliminated[1])
        #'message' : "Duplicados eliminados {}".format(data_eliminated[1]['api.Answer_Form'])
    })

@api_view(['GET'])
def detected_trace(request, answer, consecutive, email):
    try:
        if consecutive == 1:
            answer_consecutive_val = Answer_Consecutive.objects.get(id=answer)
            user_val = answer_consecutive_val.created_by
            name_form = answer_consecutive_val.form_consecutive.name
        else:
            answer_form_val = Answer_Form.objects.get(id=answer)
            user_val = answer_form_val.created_by
            name_form = answer_form_val.form_enterprise.name

        group = 61 if consecutive == 1 else 53
        description = 'Se ha visualizado el documento "' + name_form + '" desde el correo "' + email + '"'

        try:
            Traceability_User.objects.get(group=group, element=answer, action=16, description=description)
        except Traceability_User.DoesNotExist:
            log_content = {
                'user': user_val.id if user_val else None,
                'group': group,
                'element': answer,
                'action': 16,
                'description': description,
            }
            create_traceability(log_content)
    except Answer_Consecutive.DoesNotExist:
        pass
    except Answer_Form.DoesNotExist:
        pass

    return Response({
        'status': True,
        'message': 'Pixel detected',
    })
    # return serve(request, "file", settings.MEDIA_ROOT)