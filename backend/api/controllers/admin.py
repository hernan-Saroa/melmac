from api.models import Enterprise, Permit_Enterprise, Permit_Role, Role_Enterprise, User_Enterprise
from rest_framework.views import APIView
from api.serializers import PermitSerializer, RoleSerializer
from api.permissions import IsSuperAdmin, IsAdmin, IsUserAdminOrHasPermission
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.http import Http404, HttpResponseBadRequest
from itertools import groupby
from datetime import datetime
# api
from api.controllers.traceability import create_traceability
from api.util import group_view_keys

def get_enterprise(request):
    token = request.auth.key
    user = User_Enterprise.objects.get(user=request.user, token=token)
    return user.enterprise_id

class PermitList(APIView):
    """
    API endpoint que permite la consulta de los permisos y la creación de nuevos.
    """
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, format=None):
        try:
            enterprise = get_enterprise(request)
            exclude_list=[18]
            permits = Permit_Enterprise.objects.filter(enterprise_id=enterprise, status=True).exclude(permit_type_id__in=exclude_list)
            serializer = PermitSerializer(permits, many=True)
            return Response({'status': True, 'data': serializer.data})
        except User_Enterprise.DoesNotExist:
            return HttpResponseBadRequest({'status': False, 'detail': "This user isn't on the system."})
    
class PermitEntList(APIView):
    """
    API endpoint que permite la consulta de los permisos por empresa y la actualización de estos.
    """
    permission_classes = [IsSuperAdmin]
    def get(self, request, pk=None, format=None):
        try:
            enterprise = pk
            permits = Permit_Enterprise.objects.filter(enterprise_id=enterprise).order_by('permit_type__view', 'id')
            serializer = PermitSerializer(permits, many=True)
            return Response(serializer.data)
        except User_Enterprise.DoesNotExist:
            return HttpResponseBadRequest({'status': False, 'detail': "This user isn't on the system."})
    
    def post(self, request, pk=None):
        try:
            enterprise = pk
            data = request.data
            permits = Permit_Enterprise.objects.filter(enterprise_id=enterprise).order_by('permit_type__view', 'id')
            permits.filter(id__in=data['selected']).update(status=True)
            permits.exclude(id__in=data['selected']).update(status=False)
            return Response({ 'status': True })
        except Exception as err:
            return HttpResponseBadRequest({'status': False, 'detail': str(err)})
        
        
class PermitListGrouped(APIView):
    """
    API endpoint que permite la consulta de los permisos y la creación de nuevos.
    """
    permission_classes = [IsUserAdminOrHasPermission]

    def group_by_view(self, e):
        if e['permit_type__view'] not in group_view_keys:
            return e['permit_type__view']
        else:
            return group_view_keys[e['permit_type__view']]
    
    # Consulta
    def get(self, request, format=None):
        try:
            enterprise = get_enterprise(request)
            if enterprise != 1:
                exclude_list=[18]
                permits = Permit_Enterprise.objects.filter(enterprise_id=enterprise, status=True).exclude(permit_type_id__in=exclude_list)
            else:
                enterprise_admin = request.GET['ent']
                permits = Permit_Enterprise.objects.filter(enterprise_id=enterprise_admin)
            permits = list(permits.select_related('permit_type').values('id', 'name', 'description', 'permit_type__view', 'status'))
            data_grouped = groupby(permits, lambda permit : self.group_by_view(permit))
            data = {}
            for key, value in data_grouped:
                if key not in data:
                    data[key] = list(value)
                else:
                    data[key] += list(value)
            return Response({'status': True, 'data': data})
        except User_Enterprise.DoesNotExist:
            return HttpResponseBadRequest({'status': False, 'detail': "This user isn't on the system."})


class PermitDetail(APIView):
    permission_classes = [IsUserAdminOrHasPermission]
    
    def get_object(self, pk, enterprise):
        try:
            return Permit_Enterprise.objects.get(pk=pk, enterprise_id=enterprise)
        except Permit_Enterprise.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            enterprise = get_enterprise(request)
            permit = self.get_object(pk, enterprise)
            serializer = PermitSerializer(permit)
            response['data'] = serializer.data
            response['status'] = True
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            response['detail'] = "You have no permissions for this action."
        return Response(response, status_response)

    def put(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            # get user
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            permit = self.get_object(pk, user_val.enterprise_id)
            permit.description = request.data['description']
            permit.modify_date = datetime.now()
            permit.save()
            
            log_content = {
                'user': user_val.id,
                'group': 55,
                'element': permit.id,
                'action': 2,
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " modifico la descripción del permiso #" + str(permit.id),
            }
            create_traceability(log_content)

            status_response = status.HTTP_202_ACCEPTED
            response['status'] = True
            response['detail'] = "Registry updated."
        except User_Enterprise.DoesNotExist:
            response['detail'] = "You have no permissions for this action."
        except IndexError:
            response['detail'] = "Missing parameter(s)."
        return Response(response, status=status_response)

class RoleList(APIView):
    """
    API endpoint que permite la consulta de los permisos y la creación de nuevos.
    """
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            enterprise = get_enterprise(request)
            roles = Role_Enterprise.objects.filter(enterprise_id=enterprise)
            serializer = RoleSerializer(roles, many=True)
            response['status'] = True
            response['data'] = serializer.data
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)
        
    
    def post(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            # get user
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            data = request.data
            data['enterprise_id'] = user_val.enterprise_id
            permits_to_create = data['permits']
            del data['permits']
            
            try:
                role_val = Role_Enterprise.objects.get(name=data['name'], enterprise_id=data['enterprise_id'])
                response['message'] = 'Ya hay un rol con este nombre'
            except Role_Enterprise.DoesNotExist:
                role_new = Role_Enterprise()
                role_new.name = data['name']
                role_new.description = data['description']
                role_new.enterprise_id = data['enterprise_id']
                role_new.time_zone = data['time_zone']
                role_new.is_admin = data['is_admin']
                role_new.view_all = data['view_all']
                role_new.save()
                
                for permit_id in permits_to_create:
                    permit_new = Permit_Role()
                    permit_new.permit_id = permit_id
                    permit_new.role_enterprise_id = role_new.id
                    permit_new.save()
                    
                data['id'] = role_new.id
                del data['enterprise_id']

                log_content = {
                    'user': user_val.id,
                    'group': 21,
                    'element': role_new.id,
                    'action': 1,
                    'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " creo el nuevo rol " + role_new.name + " #" + str(role_new.id),
                }
                create_traceability(log_content)

                response['status'] = True
                response['data'] = data
                status_response = status.HTTP_201_CREATED
            except Role_Enterprise.MultipleObjectsReturned:
                response['message'] = 'Ya hay un rol con este nombre'
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)


class RoleDetail(APIView):
    permission_classes = [IsUserAdminOrHasPermission]
    
    def get_object(self, pk, enterprise_id):
        try:
            return Role_Enterprise.objects.get(pk=pk, enterprise_id=enterprise_id)
        except Role_Enterprise.DoesNotExist:
            raise Http404

    def get(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            enterprise = get_enterprise(request)
            role = self.get_object(pk, enterprise)
            serializer = RoleSerializer(role)
            response['status'] = True
            response['data'] = serializer.data
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def put(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        
        try:
            # get user
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            data = request.data
            data['enterprise'] = user_val.enterprise_id
            permits_to_update = [int(permit) for permit in data['permits']]
            del data['permits']

            try:
                role_val = Role_Enterprise.objects.exclude(id=pk).get(name=data['name'], enterprise_id=user_val.enterprise_id)
                response['message'] = 'Ya hay un rol con este nombre'
            except Role_Enterprise.DoesNotExist:
            
                role = self.get_object(pk, user_val.enterprise_id)
                role.name = data['name']
                role.description = data['description']
                role.is_admin = data['is_admin']
                role.view_all = data['view_all']
                role.time_zone = data['time_zone']
                role.modify_date = datetime.now()
                role.save()
                
                Permit_Role.objects.filter(role_enterprise_id=pk).exclude(permit_id__in=permits_to_update).update(state=False)
                permits_created = Permit_Role.objects.filter(role_enterprise_id=pk, permit_id__in=permits_to_update)
                permits_created_temp = permits_created
                permits_created_temp.update(state=True)
                
                permits_to_create = [permit_id for permit_id in permits_to_update if int(permit_id) not in list(permits_created.values_list('permit_id', flat=True)) and permit_id is not None]
                for permit_id in permits_to_create:
                    permit_new = Permit_Role()
                    permit_new.permit_id = permit_id
                    permit_new.role_enterprise_id = pk
                    permit_new.save()

                log_content = {
                    'user': user_val.id,
                    'group': 21,
                    'element': role.id,
                    'action': 2,
                    'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " ha modificado el rol " + role.name + " #" + str(role.id),
                }
                create_traceability(log_content)
                
                response['status'] = True
                response['data'] = data
                status_response = status.HTTP_202_ACCEPTED
                
            except Role_Enterprise.MultipleObjectsReturned:
                response['message'] = 'Ya hay un rol con este nombre'
            
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def delete(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            # get user
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            role_enterprise = self.get_object(pk, user_val.enterprise_id)
            
            log_content = {
                'user': user_val.id,
                'group': 21,
                'element': role_enterprise.id,
                'action': 3,
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " elimino el rol " + role_enterprise.name + " #" + str(role_enterprise.id),
            }
            
            if User_Enterprise.objects.filter(enterprise_id=user_val.enterprise_id, role_enterprise=role_enterprise).count() > 0:
                role_enterprise.state = False
                role_enterprise.save()
                status_response=status.HTTP_202_ACCEPTED

                response['status'] = True
                response['message'] = 'Este rol ha sido inhabilitado, debido a que existen usuarios utilizando este rol.'
            else:    
                role_enterprise.delete()
                status_response=status.HTTP_204_NO_CONTENT
                response['status'] = True
            create_traceability(log_content)
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

class PermitRoleList(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request, role, format=None):
        try:
            enterprise = get_enterprise(request)
            permits = Permit_Role.objects.filter(role_enterprise__enterprise_id=enterprise, role_enterprise_id=role, state=True).values_list('permit_id', flat=True)
            return Response({'status': True, 'data': permits})
        except User_Enterprise.DoesNotExist:
            return HttpResponseBadRequest({'status': False, 'detail': "This user isn't on the system."})
    
    def post(self, request, role, format=None):
        try:
            enterprise = get_enterprise(request)
            data = request.data
            permits_ids = data['permits']
            Role_Enterprise.objects.get(enterprise_id=enterprise, id=role)
            permits = Permit_Role.objects.filter(role_enterprise__enterprise_id=enterprise, role_enterprise_id=role, permit_id__in=permits_ids)
            if (permits):
                permits.update(state=True)
            permits_to_create = [permit for permit in permits_ids if permit not in permits.values_list('permit_id', flat=True)]
            for permit_id in permits_to_create:
                permit_new = Permit_Role()
                permit_new.permit_id = permit_id
                permit_new.role_enterprise_id = role
                permit_new.save()
            return Response({'status': True}, status=status.HTTP_200_OK)
        except User_Enterprise.DoesNotExist:
            return Response({'status': False, 'detail': "This user isn't on the system."}, status=status.HTTP_400_BAD_REQUEST)
        except Role_Enterprise.DoesNotExist:
            raise Http404
    