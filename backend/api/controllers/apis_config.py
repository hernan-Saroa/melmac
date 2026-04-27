from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status
from django.utils.crypto import get_random_string

from api.models import Apis_Config, Apis_Config_Params, Env_Form_Field
from api.permissions import IsSuperAdminOrEntAdmin
from api.controllers.admin import get_enterprise

class ApisConfigList(APIView):
    permission_classes = [IsSuperAdminOrEntAdmin]

    def get(self, request):
        try:
            enterprise_id = get_enterprise(request)
            
            if enterprise_id == -1:
                configs = Apis_Config.objects.filter(state=True).values('id', 'enterprise_id', 'service_type', 'service', 'token', 'name', 'url', 'description')
            else:
                configs = Apis_Config.objects.filter(enterprise_id=enterprise_id, state=True).values('id', 'enterprise_id', 'service_type', 'service', 'token', 'name', 'url', 'description')
                
            return Response({
                'status': True, 
                'data': list(configs), 
                'user_hash': request.user.password if hasattr(request.user, 'password') else 'default_hash'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            data = request.data
            enterprise_id = data.get('enterprise_id')
            if not enterprise_id:
                enterprise_id = get_enterprise(request)
                
            token = get_random_string(length=40)
            
            api_conf = Apis_Config.objects.create(
                enterprise_id=enterprise_id,
                service_type=data.get('service_type'),
                service=data.get('service'),
                name=data.get('name'),
                url=data.get('url'),
                description=data.get('description'),
                token=token
            )
            return Response({
                'status': True, 
                'data': {'id': api_conf.id, 'token': api_conf.token}
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            data = request.data
            api_conf = Apis_Config.objects.get(id=data.get('id'))
            
            if 'service_type' in data: api_conf.service_type = data['service_type']
            if 'service' in data: api_conf.service = data['service']
            if 'name' in data: api_conf.name = data['name']
            if 'url' in data: api_conf.url = data['url']
            if 'description' in data: api_conf.description = data['description']
            
            api_conf.save()
            return Response({'status': True, 'data': {'id': api_conf.id}}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ApisConfigParamsList(APIView):
    permission_classes = [IsSuperAdminOrEntAdmin]

    def get(self, request, config_id=None):
        try:
            if not config_id:
                return Response({'status': False, 'message': 'ID required'}, status=status.HTTP_400_BAD_REQUEST)
                
            params = Apis_Config_Params.objects.filter(apis_config_id=config_id, state=True).values('id', 'param', 'type', 'param_type', 'required', 'value', 'description')
            return Response({'status': True, 'data': list(params)}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def post(self, request):
        try:
            data = request.data
            apis_config_id = data.get('apis_config_id')
            param = data.get('param')
            type_val = data.get('type')
            param_type = data.get('param_type')
            req_str = str(data.get('required')).lower()
            required = True if req_str in ['true', '1', 'yes', 't'] else False
            value = data.get('value')
            description = data.get('description')
            
            api_param = Apis_Config_Params.objects.create(
                apis_config_id=apis_config_id,
                param=param,
                type=type_val,
                param_type=param_type,
                required=required,
                value=value,
                description=description
            )
            return Response({'status': True, 'data': {'id': api_param.id}}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    def put(self, request):
        try:
            data = request.data
            api_param = Apis_Config_Params.objects.get(id=data.get('id'))
            
            if 'param' in data: api_param.param = data['param']
            if 'type' in data: api_param.type = data['type']
            if 'required' in data: 
                req_str = str(data.get('required')).lower()
                api_param.required = True if req_str in ['true', '1', 'yes', 't'] else False
            if 'value' in data: api_param.value = data['value']
            if 'description' in data: api_param.description = data['description']
            
            api_param.save()
            return Response({'status': True, 'data': {'id': api_param.id}}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@permission_classes([IsSuperAdminOrEntAdmin])
def get_forms_for_apis_config(request, field_type, enterprise):
    try:
        # Search forms by field_type and enterprise
        # Based on available models trying Env_Form_Field
        forms = Env_Form_Field.objects.filter(field_type_id=field_type, envelope_version_form__envelope_version__envelope_enterprise__user__enterprise_id=enterprise, state=True).values('id', 'name')
        
        return Response({'status': True, 'data': list(forms)}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
