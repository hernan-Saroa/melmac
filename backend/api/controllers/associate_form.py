# rest_framework
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
from api.permissions import IsUserAdminOrHasPermission
# authentication
from rest_framework.permissions import IsAuthenticated
# models
from api.models import (
    User_Enterprise,
    Role_Enterprise,
    Role_Form,
    User_Form,
    Type_Identification,
)
# api
from api.controllers.traceability import create_traceability

class AssociateList(APIView):
    permission_classes = [IsUserAdminOrHasPermission]

    # Consulta
    def get(self, request, form, option, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            if option == 1:
                # Por rol
                form_associate_values = Role_Form.objects.filter(
                    form_enterprise_id=form,
                    role__state=True,
                    state=True
                ).select_related(
                    'role'
                ).values(
                    'id',
                    'role_id',
                    'role__name',
                    'role__description',
                )
            else:
                # Por usuario
                form_associate_values = User_Form.objects.filter(
                    form_enterprise_id=form,
                    user__state=True,
                    state=True
                ).select_related(
                    'user'
                ).values(
                    'id',
                    'user_id',
                    'user__first_name',
                    'user__first_last_name',
                )
            
            response['status'] = True
            response['data'] = list(form_associate_values)
            status_response = status.HTTP_200_OK
        except:
            pass
        return Response(response, status=status_response)

    def post(self, request, form, option, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            data = request.data
            if option == 1:
                # Por rol
                try:
                    role_form_val = Role_Form.objects.get(role_id=data['id'], form_enterprise_id=form)
                    role_form_val.state = True
                except (Role_Form.DoesNotExist):
                    role_form_val = Role_Form()
                    role_form_val.role_id = data['id']
                    role_form_val.form_enterprise_id = form
                role_form_val.save()
                associate = role_form_val.id
                option_message = 'rol ' + role_form_val.role.name + ' #' + str(data['id'])
                name_form = role_form_val.form_enterprise.name
            else:
                # Por usuario
                try:
                    user_form_val = User_Form.objects.get(user_id=data['id'], form_enterprise_id=form)
                    user_form_val.state = True
                except (User_Form.DoesNotExist):
                    user_form_val = User_Form()
                    user_form_val.user_id = data['id']
                    user_form_val.form_enterprise_id = form
                user_form_val.save()
                associate = user_form_val.id
                option_message = 'usuario ' + user_form_val.user.first_name + ' ' + user_form_val.user.first_last_name + ' #' + str(data['id'])
                name_form = user_form_val.form_enterprise.name
            
            data_associate = {
                'id': associate,
            }

            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': form,
                'action': 2,
                'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                    user_val.first_last_name + " agrego el acceso al " + option_message +
                    " del documento #" + str(form) + ' "' + name_form + '"'),
            }
            create_traceability(log_content)
            
            response['status'] = True
            response['data'] = data_associate
            status_response = status.HTTP_201_CREATED
        except:
            pass
        return Response(response, status=status_response)

    def delete(self, request, form, option, id, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            data = request.data
            if option == 1:
                # Por rol
                try:
                    role_form_val = Role_Form.objects.get(role_id=id, form_enterprise_id=form)
                    role_form_val.state = False
                    role_form_val.save()
                    associate = role_form_val.id
                    option_message = 'rol ' + role_form_val.role.name + ' #' + str(id)
                    name_form = role_form_val.form_enterprise.name
                except (Role_Form.DoesNotExist):
                    return Response(response, status=status_response)
            else:
                # Por usuario
                try:
                    user_form_val = User_Form.objects.get(user_id=id, form_enterprise_id=form)
                    user_form_val.state = False
                    user_form_val.save()
                    associate = user_form_val.id
                    option_message = 'usuario ' + user_form_val.user.first_name + ' ' + user_form_val.user.first_last_name + ' #' + str(id)
                    name_form = user_form_val.form_enterprise.name
                except (User_Form.DoesNotExist):
                    return Response(response, status=status_response)
            
            data_associate = {
                'id': associate,
            }

            log_content = {
                'user': user_val.id,
                'group': 15,
                'element': form,
                'action': 3,
                'description': ("El usuario #" + str(user_val.id) + " " + user_val.first_name + " " +
                    user_val.first_last_name + " elimino el acceso al " + option_message +
                    " del documento #" + str(form) + ' "' + name_form + '"'),
            }
            create_traceability(log_content)
            
            response['status'] = True
            response['data'] = data_associate
            status_response = status.HTTP_200_OK
        except:
            pass
        return Response(response, status=status_response)
        