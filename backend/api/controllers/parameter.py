# rest_framework
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
# authentication
from api.permissions import IsUserAdminOrHasPermission
from rest_framework.permissions import IsAuthenticated
# models
from api.models import (
    Parameter_Enterprise,
    User_Enterprise,
)

class ParameterList(APIView):
    permission_classes = [IsAuthenticated]

    # Consulta
    def get(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            response = {}
            parameter_enterprise_values = Parameter_Enterprise.objects.filter(
                enterprise_id=user_val.enterprise_id
            ).values(
                'id',
                'parameter_id',
                'parameter__name',
                'value',
            )
            response['status'] = True
            response['data'] = list(parameter_enterprise_values)
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

class ParameterDetail(APIView):
    permission_classes = [IsUserAdminOrHasPermission]

    def get(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            parameter_enterprise_val = Parameter_Enterprise.objects.get(id=pk)
            data = {}

            response['status'] = True
            response['data'] = data
            status_response = status.HTTP_200_OK
        except Parameter_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def put(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        data = request.data
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            parameter_enterprise_val = Parameter_Enterprise.objects.get(id=pk, enterprise_id=user_val.enterprise_id)
            parameter_enterprise_val.value = data['value'][:200]
            parameter_enterprise_val.save()

            response['status'] = True
            response['id'] = parameter_enterprise_val.id
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        except Parameter_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)
