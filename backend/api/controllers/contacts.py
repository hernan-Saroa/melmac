from urllib import request
from rest_framework import mixins
from rest_framework import generics
from api.permissions import IsUserAdminOrHasPermission
from rest_framework.response import Response

# Serializer
from api.serializers import (
    ExternalUserModelSerializer,
)

# models
from api.models import (
    User_Enterprise,
    External_User
)


from api.controllers.site import restartToken

class ContactApiList(mixins.ListModelMixin,
                  mixins.CreateModelMixin,
                  generics.GenericAPIView):
    """Contact api list view."""
    permission_classes = [IsUserAdminOrHasPermission]
    serializer_class = ExternalUserModelSerializer

    def get_queryset(self):
        # Contact active
        user_val = User_Enterprise.objects.get(user = self.request.user, token = self.request.auth.key)
        queryset = External_User.objects.filter(
            enterprise_id = user_val.enterprise_id
            # state = True
        )
        if self.request.method == 'GET' and 'state' in self.request.query_params:
            state = False
            if self.request.query_params.get('state', None) == 'active':
                state = True
            queryset = queryset.filter(state = state)
            
        return queryset

    def get(self, request, *args, **kwargs):
        return self.list(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        response = {}
        response['status'] = False
        try:
            external_user = External_User()
            external_user.email = request.data['email']
            external_user.enterprise_id = request.data['enterprise_id']
            external_user.phone = request.data['phone']
            external_user.phone_ind = request.data['phone_ind']
            external_user.name = request.data['name']
            external_user.state = True
            external_user.save()
            response['status'] = True
            response['message'] = 'Contacto creado'
            response['id'] = external_user.id
        except KeyError:
            response['message'] = 'Faltan parametros por enviar'
        except Exception as error:
            substring = "duplicate key value violates unique constraint"
            if substring in str(error):
                response['message'] = 'Ya existe un contacto creado para el correo y teléfono ingresado'
            else:
                response['message'] = 'Algo salio mal, intentalo mas tarde'
            response['error'] = str(error)

        return Response(response)


class ContactApiDetail(mixins.RetrieveModelMixin,
                    mixins.UpdateModelMixin,
                    generics.GenericAPIView):
    """Contact api detail view."""
    permission_classes = [IsUserAdminOrHasPermission]
    serializer_class = ExternalUserModelSerializer

    def get_queryset(self):
        # Contact active
        user_val = User_Enterprise.objects.get(user = self.request.user, token = self.request.auth.key)
        queryset = External_User.objects.filter(
            enterprise_id = user_val.enterprise_id,
            # state = True
        )
        return queryset

    def get(self, request, *args, **kwargs):
        return self.retrieve(request, *args, **kwargs)

    def put(self, request, *args, **kwargs):
        response = {}
        response['status'] = False
        id = self.kwargs['pk']
        try:
            external_user = External_User.objects.get(id = id)
            external_user.email = request.data['email']
            external_user.enterprise_id = request.data['enterprise_id']
            external_user.phone = request.data['phone']
            external_user.phone_ind = request.data['phone_ind']
            external_user.name = request.data['name']
            external_user.state = request.data['state']
            external_user.save()
            response['status'] = True
            response['message'] = 'Contacto actualizado'
        except KeyError:
            response['message'] = 'Faltan parametros por enviar'
        except Exception as error:
            substring = "duplicate key value violates unique constraint"
            if substring in str(error):
                response['message'] = 'Ya existe un contacto creado para el correo y teléfono ingresado'
            else:
                response['message'] = 'Algo salio mal, intentalo mas tarde'
            response['error'] = str(error)
        return Response(response)

    def delete(self, request, *args, **kwargs):
        response = {}
        response['status'] = False
        id = self.kwargs['pk']
        try:
            external_user = External_User.objects.get(id=id)
            external_user.state = False
            external_user.save()
            response['status'] = True
            response['message'] = 'Contacto eliminado'
        except KeyError:
            response['message'] = 'Faltan parametros por enviar'
        except Exception as error:
            response['message'] = 'Algo salio mal, intentalo mas tarde'
            response['error'] = str(error)
        return Response(response)

