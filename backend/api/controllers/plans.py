# rest_framework
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from api.controllers.site import save_image
from django.conf import settings
# models
from api.models import (
    Plans,
    Service_Plans,
    Items_Plans,
    Home_Items,
    Home_Items_User
)


@api_view(['POST'])
def create_plan(request):
    response = {}
    response['status'] = False
    data = request.data
    name_val = data.get('name', '')
    desc_val = data.get('desc', '')
    price_val = data.get('price', '')
    image_val = data.get('image', '')
    state_val = data.get('state', True)
    color_val = data.get('color', '')
    image_path = ""
    if 'image' in data and data['image'] != '':
        image_path = save_image(str(image_val), "melmac", 1, "plans",None,0)
    name_val = name_val.upper()
    try:
        plans_val = Plans.objects.get(name=name_val)
        plans_val.message = 'Plan actualizado'
    except (Plans.DoesNotExist):
        plans_val = Plans()
        plans_val.message = 'Plan creado'

    plans_val.name = name_val
    plans_val.description = desc_val
    plans_val.price = price_val
    if image_val != '':
        plans_val.image = image_path
    plans_val.state = state_val
    plans_val.color = color_val

    # Feature Flags mapped directly to model
    plans_val.feature_received = data.get('feature_received', False)
    plans_val.feature_documents = data.get('feature_documents', False)
    plans_val.feature_roles = data.get('feature_roles', False)
    plans_val.feature_reports = data.get('feature_reports', False)
    plans_val.feature_statistics = data.get('feature_statistics', False)
    plans_val.feature_flows = data.get('feature_flows', False)
    plans_val.feature_my_drive = data.get('feature_my_drive', False)
    plans_val.feature_lists = data.get('feature_lists', False)
    plans_val.feature_visits = data.get('feature_visits', False)
    plans_val.feature_field_service = data.get('feature_field_service', False)
    plans_val.feature_db_segmented = data.get('feature_db_segmented', False)

    plans_val.save()
    response['status'] = True
    response['id']= plans_val.id
    response['message'] = plans_val.message
    return Response(response) 

@api_view(['POST'])
def list_plan(request):
    response = {}
    response['status'] = False
    try:
        plans_val = Plans.objects.filter().values('id', 'name', 'description', 'price', 'image', 'creation_date', 'state', 'color', 'feature_received', 'feature_documents', 'feature_roles', 'feature_reports', 'feature_statistics', 'feature_flows', 'feature_my_drive', 'feature_lists', 'feature_visits', 'feature_field_service', 'feature_db_segmented').order_by('id')
        for plan in plans_val:
            plan['items'] =  list_item_plan(plan['id'])
        
        response['items'] = list_service_plan()
        response['status'] = True
        response['data'] = list(plans_val)
        response['url'] = settings.URL + 'media/'
    except (Plans.DoesNotExist):
        response['items'] = list_service_plan()
        response['status'] = True
        response['message'] = 'No hay planes creados'
    except KeyError:
            response['message'] = 'No hay planes creados'
    return Response(response)

def list_service_plan():
    response = {}
    response['status'] = False
    plans_val = Service_Plans.objects.filter().values('id','description','cant','service','state')
    
    return plans_val

def list_item_plan(id):
    response = {}
    response['status'] = False
    plan_id = id
    plans_val = Items_Plans.objects.filter(plan_id = plan_id).select_related('Service_Plans').values('plan_id','service_id','state', 'service__cant','service__service')
        
    return plans_val

@api_view(['POST'])
def create_service_plan(request):
    response = {}
    response['status'] = False
    data = request.data
    plan_id = data ['plan_id']
    service_id = data ['service_id']
    state = data ['state']
    try:
        plans_val = Items_Plans.objects.get(plan_id = plan_id, service_id = service_id)
        plans_val.plan_id = plan_id
        plans_val.service_id = service_id
        plans_val.state = state
        plans_val.save()
        response['status'] = True
        response['message'] = 'Registro actualizado'
    except (Items_Plans.DoesNotExist):
        plans_val = Items_Plans()
        plans_val.plan_id = plan_id
        plans_val.service_id = service_id
        plans_val.state = state
        plans_val.save()
        response['status'] = True
        response['message'] = 'Registro creado creado'
    except KeyError:
            response['message'] = 'Faltan parametros por enviar'
    return Response(response)

@api_view(['POST'])
def list_home_item_user(request):
    response = {}
    response['status'] = False
    data = request.data
    user_id = data ['user_id']
    try:
        plans_val = Home_Items_User.objects.filter(user_id = user_id).select_related('Home_Items').values('cant','home_item_id', "user_id", 'home_item__name','home_item__image_name','home_item__path')
        response['status'] = True
        response['data'] = plans_val
    except (Home_Items_User.DoesNotExist):
        response['status'] = True
        response['message'] = 'No hay items creados'
    except KeyError:
            response['message'] = 'No hay items creados'
    return Response(response)

