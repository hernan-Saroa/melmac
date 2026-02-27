from json.decoder import JSONDecodeError
from api.controllers.admin import get_enterprise
from api.models import User_Enterprise, Profile, Profile_Image, Traceability_User, Profile_Enterprise
from api.permissions import IsUserAdminOrHasPermission
from api.controllers.answer import image_to_base64
from django.db.models import CharField, F, Value
from django.db.models.functions import Concat
from django.http.response import HttpResponse
from django.template.loader import render_to_string
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from django_xhtml2pdf.utils import generate_pdf
from weasyprint import HTML
from django.conf import settings
import json

class EnrollList(APIView):
    permission_classes = [IsUserAdminOrHasPermission]
    # permission_classes = [IsAuthenticated]

    def get(self, request, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            enterprise = user_val.enterprise_id
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                profile_values = Profile_Enterprise.objects.filter(
                    enterprise_id=enterprise
                ).order_by('-id')
            else:
                profile_values = Profile_Enterprise.objects.filter(
                    user=user_val
                ).order_by('-id')

            profile_values = profile_values.select_related(
                'user', 'profile', 'type_identification'
            ).annotate(
                user_name=Concat(F('user__first_name'), Value(' '), F('user__first_last_name'), output_field=CharField()),
            ).values(
                'id',
                'user_name',
                'profile__name',
                'profile__type_identification__name',
                'profile__identification',
                'creation_date'
            )
            response['status'] = True
            response['data'] = list(profile_values)
            status_response = status.HTTP_200_OK
        except (User_Enterprise.DoesNotExist, Profile_Enterprise.DoesNotExist):
            pass
        return Response(response, status=status_response)


class EnrollDetail(APIView):
    # permission_classes = [IsUserAdminOrHasPermission]
    permission_classes = [IsAuthenticated]

    def get(self, request, pk, format=None):
        response = {"status": False}
        status_response = status.HTTP_400_BAD_REQUEST
        try:
            user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                profile_ent_val = Profile_Enterprise.objects.get(
                    id=pk,
                    enterprise_id=user_val.enterprise_id
                )
            else:
                profile_ent_val = Profile_Enterprise.objects.get(
                    id=pk,
                    user=user_val
                )
            profile_val = profile_ent_val.profile

            profile_image_values = Profile_Image.objects.filter(profile=profile_val)
            files = []
            for profile_image_val in profile_image_values:
                files.append(settings.URL + 'media/' + str(profile_image_val.image))

            traceability_values = Traceability_User.objects.filter(group=19, element=profile_val.id)
            traceability = []
            for traceability_val in traceability_values:
                traceability.append({
                    'action': traceability_val.action,
                    'description': traceability_val.description,
                    'creation_date': traceability_val.creation_date,
                })

            # restrictive_lists = dict(profile_val.restrictive_lists)
            # print(profile_val.restrictive_lists)
            # restrictive_lists = profile_val.restrictive_lists.split('more_nfo:')[1]
            # restrictive_lists = restrictive_lists.split('}')[0]
            try:
                restrictive_lists = json.loads(profile_val.restrictive_lists)
                print(restrictive_lists)
            except JSONDecodeError:
                restrictive_lists = "No se tiene información de listas restrictivas"

            response['data'] = {
                'user_name': profile_ent_val.user.first_name + ' ' + profile_ent_val.user.first_last_name if profile_ent_val.user else 'Usuario Público',
                'user_email': profile_ent_val.user.email if profile_ent_val.user else 'N/A',
                'name': profile_val.name,
                'type_identification': profile_val.type_identification.name,
                'identification': profile_val.identification,
                'creation_date': profile_ent_val.creation_date,
                'restrictive_lists': restrictive_lists,
                'files': files,
                'traceability': traceability,
            }
            response['status'] = True
            status_response = status.HTTP_200_OK
        except User_Enterprise.DoesNotExist:
            pass
        return Response(response, status=status_response)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_pdf(request, pk):
    response = {"status": False}
    status_response = status.HTTP_400_BAD_REQUEST
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        logo=user_val.enterprise.logo
        enroll = {}
        try:
            if user_val.role_id == 2 or user_val.role_enterprise.view_all:
                profile_ent_val = Profile_Enterprise.objects.get(
                    profile_id=pk,
                    enterprise_id=user_val.enterprise_id
                )
            else:
                profile_ent_val = Profile_Enterprise.objects.get(
                    profile_id=pk,
                    user=user_val
                )
            profile_val = profile_ent_val.profile

            profile_image_values = Profile_Image.objects.filter(profile=profile_val)
            files = []
            for profile_image_val in profile_image_values:
                image_base64 = image_to_base64(settings.MEDIA_ROOT + '/' + str(profile_image_val.image))
                files.append({'url':settings.URL + 'media/' + str(profile_image_val.image),
                              'image': image_base64})

            traceability_values = Traceability_User.objects.filter(group=19, element=profile_val.id).values('action', 'description', 'creation_date', 'user_id')
            traceability = list(traceability_values)

            # restrictive_lists = dict(profile_val.restrictive_lists)
            # print(profile_val.restrictive_lists)
            # restrictive_lists = profile_val.restrictive_lists.split('more_nfo:')[1]
            # restrictive_lists = restrictive_lists.split('}')[0]
            #try:
            #    restrictive_lists = json.loads(profile_val.restrictive_lists)
            #    print(restrictive_lists)
            #except JSONDecodeError:
            #    restrictive_lists = "No se tiene información de listas restrictivas"

            enroll = {
                'user_name': profile_ent_val.user.first_name + ' ' + profile_ent_val.user.first_last_name if profile_ent_val.user else 'Usuario Público',
                'user_email': profile_ent_val.user.email if profile_ent_val.user else 'N/A',
                'user_identification': profile_ent_val.user.identification if profile_ent_val.user else 'N/A',
                'name': profile_val.name,
                'type_identification': profile_val.type_identification.name,
                'identification': profile_val.identification,
                'creation_date': profile_val.creation_date,
                'class_str': str(type("A")),
                'files': files,
                'traceability': traceability,
            }

        except Profile_Enterprise.DoesNotExist:
            pass
        template = render_to_string('my_template.html', context={'type':'enroll', 'enroll': enroll,'logo': settings.URL+'media/'+str(logo) if logo else 'https://desarrolladorsaroa.github.io/Styles/descarga.jpg'})
        html_string = template
        pdf = HTML(string=html_string).write_pdf()
        result = HttpResponse(pdf, content_type='application/pdf')
        
        return result
    except User_Enterprise.DoesNotExist:
        pass
    return Response(response, status=status_response)
