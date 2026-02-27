# rest_framework
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework import status
# authentication
from api.permissions import IsSuperAdmin
from rest_framework.permissions import IsAuthenticated
# models
from api.models import (
    Variable_Plataform,
)

class PlataformList(APIView):
    permission_classes = [IsAuthenticated]

    # Consulta
    def get(self, request, format=None):
        response = {}
        variable_plataform_values = Variable_Plataform.objects.all().values(
            'id',
            'name',
            'value',
        )
        response['status'] = True
        response['data'] = list(variable_plataform_values)
        status_response = status.HTTP_200_OK
        return Response(response, status=status_response)

class PlataformDetail(APIView):
    permission_classes = [IsSuperAdmin]

    def get(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            variable_plataform_val = Variable_Plataform.objects.get(id=pk)
            data = {
                'id': variable_plataform_val.id,
                'name': variable_plataform_val.name,
                'value': variable_plataform_val.value,
            }

            response['status'] = True
            response['data'] = data
            status_response = status.HTTP_200_OK
        except Variable_Plataform.DoesNotExist:
            pass
        return Response(response, status=status_response)

    def put(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        data = request.data
        try:
            variable_plataform_val = Variable_Plataform.objects.get(id=pk)
            variable_plataform_val.value = data['value']
            variable_plataform_val.save()

            response['status'] = True
            response['id'] = variable_plataform_val.id
            status_response = status.HTTP_200_OK
        except Variable_Plataform.DoesNotExist:
            pass
        return Response(response, status=status_response)
