# rest_framework
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
# authentication
from rest_framework.permissions import IsAuthenticated
# models
from api.models import (
    Answer_Form,
    Answer_Consecutive,
    Answer_Envelope,
    Envelope_Enterprise,
    Envelope_User,
    Device_Enterprise,
    Enterprise,
    Form_Enterprise,
    Role_Form,
    User_Enterprise,
    User_Form,
)
from django.db.models import Count, F, Q
from itertools import chain

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_indicator(request, option):
    response = {'status': False}
    status_response = status.HTTP_400_BAD_REQUEST

    """
    Datos:
    1 - usuarios
    2 - formularios
    3 - answer
    4 - device
    5 - numero de empresas - super admin
    6 - formularios totales - super admin
    7 - sobres
    8 - answer sobres
    9 - sobres totales - super admin
    """
    try:
        data_values = 0
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        if option == 1:
            if user_val.role_id == 1:
                data_values = User_Enterprise.objects.filter(role_id__in=[2,3], state=True).count()
            elif user_val.role_id == 2:
                data_values = User_Enterprise.objects.filter(enterprise_id=user_val.enterprise_id, role_id=3, state=True).count()
        elif option == 2:
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                data_values = Form_Enterprise.objects.filter(enterprise_id=user_val.enterprise_id, state=True).count()
            else:
                for_user = User_Form.objects.filter(user_id=user_val.id, state=True).values_list('form_enterprise_id', flat=True)
                for_rol = []
                if user_val.role_enterprise_id != None:
                    for_rol = Role_Form.objects.filter(role_id=user_val.role_enterprise_id, state=True).values_list('form_enterprise_id', flat=True)
                list_form = list(for_rol) + list(for_user)
                # Filtra los asignados al usuario.
                data_values = Form_Enterprise.objects.filter(id__in=list_form, state=True).count()
        elif option == 3:
            if user_val.role_id == 1:
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__state=True,
                    consecutive=False,
                    state=True
                ).count()
                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__state=True,
                    state=True
                ).count()
                data_values = answer_values + consecutive_values
            elif user_val.role_id == 2 or user_val.role_enterprise.view_all:
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__enterprise_id=user_val.enterprise_id,
                    form_enterprise__state=True,
                    consecutive=False,
                    state=True
                ).count()
                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__enterprise_id=user_val.enterprise_id,
                    form_consecutive__state=True,
                    state=True
                ).count()
                data_values = answer_values + consecutive_values
            else:
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__state=True,
                    created_by=user_val,
                    consecutive=False,
                    state=True
                ).count()
                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__state=True,
                    created_by=user_val,
                    state=True
                ).count()
                data_values = answer_values + consecutive_values
        elif option == 4:
            data_values = Device_Enterprise.objects.filter(enterprise_id=user_val.enterprise_id).count()
        elif option == 5:
            if user_val.role_id == 1:
                data_values = Enterprise.objects.all().count() - 1
        elif option == 6:
            if user_val.role_id == 1:
                data_values = Form_Enterprise.objects.filter(state=True).count()
        elif option == 7:
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                data_values = Envelope_Enterprise.objects.filter(user=user_val, state=True).count()
            else:
                list_version = Envelope_User.objects.filter(
                    Q(type_user=1, user=user_val.id) | Q(type_user=2, user=user_val.role_enterprise_id),
                ).values_list('envelope_version_id', flat=True)
                # Filtra los asignados al usuario.
                data_values = Envelope_Enterprise.objects.filter(envelope_version__id__in=list_version, state=True).count()
        elif option == 8:
            answer_values = Answer_Envelope.objects.filter(
                envelope_version__envelope_enterprise__state=True,
                state=True
            )
            if user_val.role_id == 1:
                data_values = answer_values.filter().count()
            elif user_val.role_id == 2 or user_val.role_enterprise.view_all:
                data_values = answer_values.filter(
                    envelope_version__envelope_enterprise__user=user_val,
                ).count()
            else:
                data_values = answer_values.filter(
                    Q(
                        answer_envelope_user__envelope_user__type_user=1,
                        answer_envelope_user__envelope_user__user=user_val.id,
                    ) | Q(answer_envelope_user__user_rol=user_val),
                ).count()
        elif option == 9:
            if user_val.role_id == 1:
                data_values = Envelope_Enterprise.objects.filter(state=True).count()
        response['data'] = data_values
        response['status'] = True
        status_response = status.HTTP_200_OK
    except:
        pass
    return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_graph(request, option):
    response = {'status': False}
    """
    Datos:
    1 - formularios and answer
    2 - answer all
    3 - sobres and answer
    4 - sobres answer all
    """
    try:
        data_graph = []
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)

        # Formularios
        if option == 1 or option == 2:
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__enterprise_id=user_val.enterprise_id,
                    form_enterprise__state=True,
                    consecutive=False,
                    state=True
                ).select_related(
                    'form_enterprise'
                ).values(
                    'form_enterprise__name',
                ).annotate(
                    name=F('form_enterprise__name'), value=Count('form_enterprise__name')
                ).order_by('-value').values(
                    'name', 'value'
                )

                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__enterprise_id=user_val.enterprise_id,
                    form_consecutive__state=True,
                    state=True
                ).select_related(
                    'form_consecutive'
                ).values(
                    'form_consecutive__name',
                ).annotate(
                    name=F('form_consecutive__name'), value=Count('form_consecutive__name')
                ).order_by('-value').values(
                    'name', 'value'
                )
            else:
                answer_values = Answer_Form.objects.filter(
                    form_enterprise__state=True,
                    created_by=user_val,
                    consecutive=False,
                    state=True
                ).select_related(
                    'form_enterprise'
                ).values(
                    'form_enterprise__name',
                ).annotate(
                    name=F('form_enterprise__name'), value=Count('form_enterprise__name')
                ).order_by('-value').values(
                    'name', 'value'
                )

                consecutive_values = Answer_Consecutive.objects.filter(
                    form_consecutive__state=True,
                    created_by=user_val,
                    state=True
                ).select_related(
                    'form_consecutive'
                ).values(
                    'form_consecutive__name',
                ).annotate(
                    name=F('form_consecutive__name'), value=Count('form_consecutive__name')
                ).order_by('-value').values(
                    'name', 'value'
                )

            if option == 1:
                data_values = chain(answer_values[:3], consecutive_values[:3])
            elif option == 2:
                data_values = chain(answer_values, consecutive_values)
            data_graph = list(data_values)

        # Sobres
        elif option == 3 or option == 4:
                answer_values = Answer_Envelope.objects.filter(
                    envelope_version__envelope_enterprise__state=True,
                    state=True
                )

                if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                    answer_values = answer_values.filter(
                        envelope_version__envelope_enterprise__user=user_val
                    )
                else:
                    answer_values = answer_values.filter(
                        Q(
                            answer_envelope_user__envelope_user__type_user=1,
                            answer_envelope_user__envelope_user__user=user_val.id,
                        ) | Q(answer_envelope_user__user_rol=user_val)
                    )

                answer_values = answer_values.select_related(
                    'envelope_version__envelope_enterprise'
                ).values(
                    'envelope_version__envelope_enterprise__name',
                ).annotate(
                    name=F('envelope_version__envelope_enterprise__name'), value=Count('envelope_version__envelope_enterprise__id')
                ).order_by('-value').values(
                    'name', 'value'
                )
                
                if option == 3:
                    data_values = answer_values[:3]
                elif option == 4:
                    data_values = answer_values
                data_graph = list(data_values)

        response['data'] = data_graph
        response['status'] = True
        status_response = status.HTTP_200_OK
    except:
        pass
    return Response(response, status=status_response)