# rest_framework
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
# authentication
from api.permissions import IsSuperAdmin, IsAdmin
# models
from django.contrib.auth.models import User
from api.models import (
    Api_Detail,
    Api_Usage,
    Enterprise,
    Enterprise_Email_Conf,
    User_Enterprise,
    Parameter,
    Parameter_Enterprise,
    Permit_Enterprise,
    Permit_Role,
    Role_Enterprise,
    Variable_Plataform,
    Form_Enterprise,
    Form_Link,
)
# others
from api.controllers.admin import get_enterprise
from api.data import (
    DATA_PERMISSIONS,
    DATA_ENT_PERMITS,
    NEW_ENT_PERMITS
)
from api.util import send_email
from api.email import send_email_enterprise
from api.email import sendgrid
from api.encrypt import Encrypt
from django.conf import settings
from itertools import product
from random import randint
import string

def random_serial():
    serial_exists = Enterprise.objects.all().values_list('serial', flat=True)
    letters = list(string.ascii_uppercase)
    prefix = [''.join(comb) for comb in product(*([letters] * 4)) if ''.join(comb) not in serial_exists]
    index = randint(0, len(prefix))
    pref = prefix[index]
    return pref

@api_view(['PUT'])
@permission_classes([IsAdmin])
def update_theme(request):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    data = request.data
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_val = Enterprise.objects.get(id=user_val.enterprise_id)
        enterprise_val.theme_id = data['theme']
        enterprise_val.save()

        response['status'] = True
        response['message'] = 'Tema actualizada'
        status_response = status.HTTP_200_OK
    except User_Enterprise.DoesNotExist:
        response['message'] = 'Error con el usuario'
    except Enterprise.DoesNotExist:
        response['message'] = 'Error con el empresa'
    return Response(response, status=status_response)

class EnterpriseList(APIView):
    permission_classes = [IsSuperAdmin]

    # Consulta
    def get(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_enterprise_values = User_Enterprise.objects.filter(
                role_id=2,
            ).select_related(
                'enterprise'
            ).values(
                'id',
                'first_name',
                'first_last_name',
                'type_identification_id',
                'identification',
                'email',
                'phone',
                'enterprise_id',
                'enterprise__name',
                'enterprise__theme_id',
                'enterprise__state',
                'enterprise__max_users',
                'enterprise__visit_form',
                'login_state',
            )

            response['status'] = True
            response['data'] = list(user_enterprise_values)
            status_response = status.HTTP_200_OK
        except:
            pass
        return Response(response, status=status_response)

    def post(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            data = request.data
            # Datos
            theme_id = data['enterprise__theme_id']
            state = data['enterprise__state']

            first_name = data['first_name'].strip()
            first_last_name = data['first_last_name'].strip()
            type_identification_id = data['type_identification_id']
            identification = data['identification'].strip()
            email = data['email'].strip().lower()
            phone = data['phone'].strip()
            max_users = data['enterprise__max_users'].strip()
            visit_form = data['enterprise__visit_form'].strip()

            try:
                # Valida si existe el usuario
                User_Enterprise.objects.get(email=email, role_id=2)
                response['message'] = 'El usuario ya existe como administrador de otra empresa.'
            except User_Enterprise.DoesNotExist:
                data_create = {
                    'theme_id' : theme_id,
                    'state' : state,
                    'max_users' : max_users,
                    'visit_form' : visit_form,
                    'first_name' : first_name,
                    'first_last_name' : first_last_name,
                    'type_identification_id' : type_identification_id,
                    'identification' : identification,
                    'email' : email,
                    'phone' : phone,
                }
                enterprise_new, user_enterprise_new = create_user_enterprise(data_create)

                response['status'] = True
                response['data'] = {
                    'parameters' : {
                        'id': user_enterprise_new.id,
                        'first_name' : first_name,
                        'first_last_name' : first_last_name,
                        'type_identification_id' : type_identification_id,
                        'identification' : identification,
                        'email' : email,
                        'phone' : phone,
                        'enterprise_id': enterprise_new.id,
                        'enterprise__theme_id': theme_id,
                        'enterprise__state': state,
                        'login_state': True,
                        'max_users': enterprise_new.max_users,
                        'visit_form': enterprise_new.visit_form,
                    }
                }
                status_response = status.HTTP_201_CREATED

            except User_Enterprise.MultipleObjectsReturned:
                response['message'] = 'El usuario existe'
        except KeyError:
            response['message'] = 'Faltan parametros por enviar'
        except Exception as error:
            response['message'] = 'Algo salio mal, verifica la información enviada ' + str(error)

        return Response(response, status=status_response)

    def put(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        data = request.data

        try:
            user_enterprise_val = User_Enterprise.objects.get(id=pk)
            user_enterprise_val.first_name = data['first_name'].strip()
            user_enterprise_val.first_last_name = data['first_last_name'].strip()
            user_enterprise_val.login_state = data['login_state']
            user_enterprise_val.login_count = 0
            user_enterprise_val.save()

            enterprise_val = Enterprise.objects.get(id=user_enterprise_val.enterprise_id)
            enterprise_val.theme_id = data['enterprise__theme_id']
            enterprise_val.state = data['enterprise__state']
            enterprise_val.max_users = data['enterprise__max_users']
            enterprise_val.visit_form = data['enterprise__visit_form']
            enterprise_val.save()

            response['status'] = True
            response['message'] = 'Usuario actualizado'
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            response['message'] = 'Error con el usuario'
        except Enterprise.DoesNotExist:
            response['message'] = 'Error con el empresa'
        except KeyError:
            response['message'] = 'Faltan parametros por enviar'

        return Response(response, status=status_response)

def create_user_enterprise(data):
    password_enc = Encrypt().encrypt_code(data['identification'])
    # Enterprise
    enterprise_new = Enterprise()
    enterprise_new.theme_id = data['theme_id']
    enterprise_new.state = data['state']
    if data['max_users']:
        enterprise_new.max_users = data['max_users']

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
            enterprise_new.serial = serial
            aux = 2

    enterprise_new.save()
    enterprise_new.acronym = "empresa" + str(enterprise_new)
    enterprise_new.save()

    # Create User Django
    try:
        user_new = User.objects.get(username=data['email'])
    except User.DoesNotExist:
        user_new = User()
        user_new.username = data['email']
        user_new.first_name = data['first_name']
        user_new.last_name = data['first_last_name']
        user_new.email = data['email']
        user_new.save()

    # Create User Enterprise
    user_enterprise_new = User_Enterprise()
    user_enterprise_new.enterprise = enterprise_new
    user_enterprise_new.user = user_new
    user_enterprise_new.first_name = data['first_name']
    user_enterprise_new.first_last_name = data['first_last_name']
    user_enterprise_new.type_identification_id = data['type_identification_id']
    user_enterprise_new.identification = data['identification']
    user_enterprise_new.phone = data['phone']
    user_enterprise_new.email = data['email']
    user_enterprise_new.password = password_enc
    user_enterprise_new.role_id = 2
    user_enterprise_new.register_platform = 0
    user_enterprise_new.register_state = False
    user_enterprise_new.save()

    data_role = [
        {
            'name': 'Consultor',
            'desc': 'Todos los permisos de consulta en la plataforma.',
            'permits': [
                'Access View Users - WEB',
                'View Users - WEB',
                'Access View Permits - WEB',
                'View Permits - WEB',
                'Access View Roles - WEB',
                'View Roles - WEB',
                'Access View Forms - WEB',
                'View Forms - WEB/MOVIL',
                'Access View Device Category - WEB',
                'View Device Category - WEB',
                'Access View Device - WEB',
                'View Device - WEB',
                'Access View Answer - WEB',
                'View Answer - WEB',
                'Access View Associate - WEB',
                'View Associate - WEB',
                'Access View Enroll - WEB',
                'View Enroll - WEB',
                'Access View Route - WEB',
                'View Route - WEB/MOVIL',
                'Access View Project - WEB',
                'View Project - WEB',
                'Access View Location - WEB',
                'View Location - WEB',
            ],
        },
        {
            'name': 'Servicio en Campo',
            'desc': 'Todos los permisos para servicio en campo.',
            'permits': [
                'Access View Forms - WEB',
                'View Forms - WEB/MOVIL',
                'Access View Answer - WEB',
                'Create Answer - WEB/MOVIL',
                'View Answer - WEB',
                'Access View Route - WEB',
                'View Route - WEB/MOVIL',
                'Field Work - WEB/MOVIL',
                'Follow-up - WEB/MOVIL',
            ],
        },
    ]

    list_permit_id = {
        'Consultor': [],
        'Servicio en Campo': []
    }
    # Permit Enterprise
    for ent_permit in DATA_ENT_PERMITS:
        try:
            ent_permit_new = Permit_Enterprise.objects.get(enterprise=enterprise_new, permit_type_id=ent_permit['permit_type'])
        except Permit_Enterprise.DoesNotExist:
            ent_permit_new = Permit_Enterprise()
            ent_permit_new.enterprise = enterprise_new
            ent_permit_new.name = ent_permit['name']
            ent_permit_new.description = ent_permit['desc']
            ent_permit_new.permit_type_id = ent_permit['permit_type']
            ent_permit_new.save()

        for role in data_role:
            if ent_permit['name'] in role['permits']:
                list_permit_id[role['name']].append(ent_permit_new.id)

    Permit_Enterprise.objects.filter(enterprise=enterprise_new).exclude(permit_type_id__in=NEW_ENT_PERMITS).update(status=False)

    for role in data_role:
        role_new = Role_Enterprise()
        role_new.name = role['name']
        role_new.description = role['desc']
        role_new.enterprise = enterprise_new
        role_new.save()

        for permit_id in list_permit_id[role['name']]:
            Permit_Enterprise
            permit_new = Permit_Role()
            permit_new.permit_id = permit_id
            permit_new.role_enterprise = role_new
            permit_new.save()

    # Parameters
    data_parameter = [
        {'parameter': 'Tiempo', 'value': '5'},
        {'parameter': 'Distancia', 'value': '200'},
    ]

    for parameter in data_parameter:
        try:
            parameter_val = Parameter.objects.get(name=parameter['parameter'])
            parameter_enterprise_new = Parameter_Enterprise.objects.get(enterprise=enterprise_new, parameter=parameter_val)
            parameter_enterprise_new.value = parameter['value']
            parameter_enterprise_new.save()
        except Parameter_Enterprise.DoesNotExist:
            parameter_enterprise_new = Parameter_Enterprise()
            parameter_enterprise_new.enterprise = enterprise_new
            parameter_enterprise_new.parameter = parameter_val
            parameter_enterprise_new.value = parameter['value']
            parameter_enterprise_new.save()
        except Parameter.DoesNotExist:
            pass

    data_api = Api_Detail.objects.all().order_by('id').values_list('id', flat=True)

    for api in data_api:
        try:
            api_val = Api_Usage.objects.get(api_id=api, enterprise=enterprise_new)
        except Api_Usage.DoesNotExist:
            api_val = Api_Usage()
            api_val.api_id = api
            api_val.enterprise = enterprise_new
            api_val.limit = 200
            api_val.save()
    return enterprise_new, user_enterprise_new

class EnterpriseDetail(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST

        try:
            enterprise_id = get_enterprise(request)
            enterprise_val = Enterprise.objects.get(id=enterprise_id)
            brandEnterprise = ''
            senderEnterprise = ''

            try:
                ent_email_val = Enterprise_Email_Conf.objects.get(enterprise_id=enterprise_id,state=True)

                if ent_email_val.authenticate_domain:
                    emailenterprise = 1
                else:
                    emailenterprise = 2

                if ent_email_val.brand_link:
                    brandEnterprise = 1
                else:
                    brandEnterprise = 2

                if ent_email_val.verify_sender:
                    senderEnterprise = 1
                else:
                    if ent_email_val.sender != '':
                        senderEnterprise = 2
                    else:
                        senderEnterprise = 0

            except Enterprise_Email_Conf.DoesNotExist:
                emailenterprise = 0

            status_response = status.HTTP_200_OK
            response['status'] = True
            response['data'] = {
                'name': enterprise_val.name,
                'image': [settings.URL + 'media/', str(enterprise_val.logo)],
                'acronym': enterprise_val.acronym,
                'nit': enterprise_val.nit,
                'website': enterprise_val.website,
                'rut': str(enterprise_val.rut),
                'camara_comercio': str(enterprise_val.camara_comercio),
                'confidencialidad': str(enterprise_val.confidencialidad),
                'tratamiento_datos': str(enterprise_val.tratamiento_datos),
                'certificado_digital': str(enterprise_val.certificado_digital),
                'limit': enterprise_val.max_users,
                'colorB':enterprise_val.public_color,
                'colorBT':enterprise_val.public_color_Text,
                'colorBTP':enterprise_val.public_color_text_title,
                'colorBF':enterprise_val.public_color_footer,
                'colorBFT':enterprise_val.public_color_footer_title,
                'colorBTPH':enterprise_val.public_color_header_title,
                #'emailConf': ent_email_val[0] if len(ent_email_val) else False,
                'emailConf': False,
                'emailEnterprise':emailenterprise,
                'brandEnterprise' :brandEnterprise,
                'senderEnterprise' : senderEnterprise,
                'answer_to':enterprise_val.answer_to,
                'email_title':enterprise_val.email_title,
            }

        except (User_Enterprise.DoesNotExist, Enterprise.DoesNotExist):
            response['detail'] = 'No hay datos relacionados.'

        return Response(response, status=status_response)

    def put(self, request):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        enterprise_id = get_enterprise(request)

        data = request.data
        files = request.FILES

        try:
            enterprise_id = get_enterprise(request)
            enterprise_val = Enterprise.objects.get(id=enterprise_id)
            image = False

            if 'name' in data:
                enterprise_val.name = data['name']
            if 'nit' in data:
                enterprise_val.nit = data['nit']
            if 'website' in data:
                enterprise_val.website = data['website']
            if 'acronym' in data:
                if data['acronym'] and (Enterprise.objects.filter(acronym=data['acronym']).exclude(id=enterprise_id).exists()):
                    raise Exception('Esta URL ya esta ocupada por otra empresa, por favor cambia el acronimo')
                enterprise_val.acronym = data['acronym']
            if 'image' in files:
                enterprise_val.logo = files['image']
                image = True
            if 'colorB' in data:
                enterprise_val.public_color = data['colorB']
            if 'colorBT' in data:
                enterprise_val.public_color_Text = data['colorBT']
            if 'colorBTP' in data:
                enterprise_val.public_color_text_title = data['colorBTP']
            if 'colorBTPH' in data:
                enterprise_val.public_color_header_title = data['colorBTPH']
            if 'colorBF' in data:
                enterprise_val.public_color_footer = data['colorBF']
            if 'colorBFT' in data:
                enterprise_val.public_color_footer_title = data['colorBFT']
            if 'answer_to' in data:
                enterprise_val.answer_to = data['answer_to']
            if 'email_title' in data:
                enterprise_val.email_title = data['email_title']

            enterprise_val.login_page_state = not enterprise_val.acronym in [None, '']
            enterprise_val.save()

            status_response = status.HTTP_200_OK
            response['status'] = True
            if image:
                response['image'] = settings.URL + 'media/' + str(enterprise_val.logo)
            if 'emailConf' not in data:
                Enterprise_Email_Conf.objects.filter(enterprise_id=enterprise_id).update(state=False)
        except (User_Enterprise.DoesNotExist, Enterprise.DoesNotExist):
            response['detail'] = 'No hay datos relacionados.'
        except Exception as e:
            response['detail'] = str(e)

        return Response(response, status=status_response)



@api_view(["GET"])
def acronym_list(request):
    enterprise_values = Enterprise.objects.filter(login_page_state=True).values("id","acronym")
    print(enterprise_values)
    ent_list_values = { ent['acronym']: ent['id'] for ent in enterprise_values}
    return Response({
        'data': ent_list_values
    })

@api_view(['POST'])
def test_email_send(request):
    status_response = status.HTTP_400_BAD_REQUEST
    response = {}
    sendgrid()
    return Response(response, status=status_response)

@api_view(['POST'])
def email_enterprise_general(request):
    print("email_enterprise_general")
    status_response = status.HTTP_400_BAD_REQUEST
    response = {}
    data = request.data

    if data['optionSubmit'] == '1':
        try:

            status_response = status.HTTP_200_OK
            enterprise_id = data['enterprise']
            ent_email_val = Enterprise_Email_Conf.objects.get(enterprise_id=enterprise_id)

        except Enterprise_Email_Conf.DoesNotExist:

            ent_email = Enterprise_Email_Conf()
            ent_email.domain = data['dominio']
            ent_email.dns = data['dns']
            ent_email.email_config = data['email']
            ent_email.enterprise_id = data['enterprise']
            ent_email.save()

            to_list = ['marlon@saroa.co']
            html_message = ''
            html_message += ('Hola, se te ha solicitado agregar el siguiente dominio en SENGRID: <b>' + data['dominio'] + '</b>, ' +
                'los datos enviados inicialmente en el paso de AUTENTCACIÓN DE DOMINIO SON: '+
                '<br> -DOMINIO:'+ str(data['dominio']) +
                '<br> -DNS:'+ str(data['dns']) +
                '<br> -CORREO DONDE SE DEBE ENVIAR LA CONFIGURACIÓN:'+ str(data['email']) +
                '<br> -TEXTO PARA ENVIAR AL CORREO:'+ str(data['bodyEmail']) +
                '<br> -IDENTIFICADOR EMPRESA:'+ str(data['enterprise'])+
                '<br> -IDENTIFICADOR SOLICITUD:'+ str(ent_email.id))

            send_email('CONFIGURAR EMPRESA EN SENGRID - ' + 'MELMAC', '', to_list, html_message)
            response['optionRest'] = "1"
    else:
        status_response = status.HTTP_200_OK
        enterprise_id = data['enterprise']
        ent_email_val = Enterprise_Email_Conf.objects.get(enterprise_id=enterprise_id)
        ent_email_val.sender = str(data['name1'])+'-'+str(data['emailR'])+'-'+str(data['emailR2'])+'-'+str(data['address'])+'-'+str(data['address2'])+'-'+str(data['alias'])
        ent_email_val.save()
        response['optionRest'] = "2"

    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAdmin])
def test_email(request):
    status_response = status.HTTP_400_BAD_REQUEST
    response = {}

    try:
        data = request.data

        enterprise_data = {
            'host': data['host'],
            'port': data['port'] if 'port' in data else 587,
            'username': data['username'],
            'password': data['password'],
            'use_tls': data['use_tls'] if 'use_tls' in data else True,
        }

        send_email_enterprise(data['subject'], data['text'], [data['to']], enterprise_data)
        status_response = status.HTTP_200_OK
    except KeyError as e:
        print(e)
        response['detail'] = 'Faltan parametros, confirma que todos los datos de Proveedor, Usuario y Contraseña esten diligenciados'
    except Exception as e:
        response['detail'] = str(e)
    return Response(response, status=status_response)

@api_view(['POST'])
@permission_classes([IsAdmin])
def save_email(request):
    status_response = status.HTTP_400_BAD_REQUEST
    response = {}

    ent_email_val = None
    enterprise_data = None
    enterprise_id = get_enterprise(request)
    data = request.data

    try:
        enterprise_data = {
            'host': data['host'],
            'port': data['port'] if 'port' in data else 587,
            'username': data['username'],
            'password': data['password'],
            'use_tls': data['use_tls'] if 'use_tls' in data else True,
        }
        ent_email_val = Enterprise_Email_Conf.objects.get(enterprise_id=enterprise_id)
    except Enterprise_Email_Conf.DoesNotExist:
        ent_email_val = Enterprise_Email_Conf()
        ent_email_val.enterprise_id = enterprise_id
    except KeyError as e:
        response['detail'] = 'Faltan parametros, confirma que todos los datos de Proveedor, Usuario y Contraseña esten diligenciados'
    except Exception as e:
        response['detail'] = str(e)
    if ent_email_val and enterprise_data:
        ent_email_val.host = enterprise_data['host']
        ent_email_val.port = enterprise_data['port']
        ent_email_val.username = enterprise_data['username']
        ent_email_val.password = enterprise_data['password']
        ent_email_val.use_tls = enterprise_data['use_tls']
        ent_email_val.state = True
        ent_email_val.save()
        status_response = status.HTTP_200_OK

    return Response(response, status=status_response)

@api_view(['GET'])
def get_enterprise_token(request, token):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST

    try:
        enterprise_val = Enterprise.objects.get(token_link=token, state=True)
        idEnterprise=enterprise_val.id
        variable_footer = Variable_Plataform.objects.get(name="footer")
        data_enterprise = {
            'id': idEnterprise,
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

        form_values = Form_Enterprise.objects.filter(
                    enterprise_id=idEnterprise,
                    state=True,
                ).order_by('-id')

        form_list = []
        for value in form_values:
            form_link_val = Form_Link.objects.filter(
                form_enterprise_id=value.id,
                form_enterprise__enterprise_id=idEnterprise,
                state=True,
                access=0
            )[:1]
            for value2 in form_link_val:
                tokenv=value2.token_link
                date_state=value2.date_state
                max_date=value2.max_date

                form_list.append({
                    'id': value.id,
                    'name': value.name,
                    'token': settings.URL_FRONTEND + 'public/' + tokenv,
                    'date_state':date_state,
                    'max_date':max_date
                })


        response['status'] = True
        response['data'] = data_enterprise
        response['forms'] = form_list

        status_response = status.HTTP_200_OK
    except (Enterprise.DoesNotExist):
        pass
    return Response(response, status=status_response)
