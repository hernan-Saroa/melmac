from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.db.models import Count, Q
from django.utils.timezone import make_aware
from datetime import datetime
import csv
from django.http import HttpResponse
from api.models import (
    User_Enterprise,
    Answer_Form,
    Form_Enterprise,
    Traceability_User,
    Form_Field,
    Answer_Field
)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_global_statistics(request):
    """
    Returns general statistics:
    - active_users, inactive_users
    - documents_created, templates_created
    - registraduria_transactions, restrictive_lists
    - signature types counts (facial, id_card, otp, handwritten)
    Accepts query params 'enterprise_id', 'start_date', 'end_date'
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        
        # Only Super Admin (role_id=1) can query all, otherwise restricted to user's enterprise
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        form_id = request.GET.get('form_id')

        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        # Filters
        user_filter = Q()
        form_filter = Q()
        answer_filter = Q()
        trace_filter = Q()
        field_filter = Q()

        if enterprise_id:
            user_filter &= Q(enterprise_id=enterprise_id)
            form_filter &= Q(enterprise_id=enterprise_id)
            answer_filter &= Q(form_enterprise__enterprise_id=enterprise_id)
            trace_filter &= Q(user__enterprise_id=enterprise_id)
            field_filter &= Q(answer_form__form_enterprise__enterprise_id=enterprise_id)

        if form_id:
            form_filter &= Q(id=form_id)
            answer_filter &= Q(form_enterprise_id=form_id)
            field_filter &= Q(answer_form__form_enterprise_id=form_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                user_filter &= Q(creation_date__range=(sd, ed))
                form_filter &= Q(creation_date__range=(sd, ed))
                answer_filter &= Q(creation_date__range=(sd, ed))
                trace_filter &= Q(creation_date__range=(sd, ed))
                # For answer fields, we filter by the answer's creation date
                field_filter &= Q(answer_form__creation_date__range=(sd, ed))
            except ValueError:
                pass

        # 1. Users
        active_users = User_Enterprise.objects.filter(user_filter, state=True).count()
        inactive_users = User_Enterprise.objects.filter(user_filter, state=False).count()

        # 2. Templates and Documents
        templates_created = Form_Enterprise.objects.filter(form_filter).count()
        documents_created = Answer_Form.objects.filter(answer_filter).count()

        # 3. Transactions from Traceability_User
        # Enrolamiento/Registraduria = Action 8, 9, 10
        registraduria = Traceability_User.objects.filter(trace_filter, action__in=[8, 9, 10]).count()
        # Listas Restrictivas = Action 7
        restrictive_lists = Traceability_User.objects.filter(trace_filter, action=7).count()

        # 4. Signatures (From Answer_Field mapping to Form_Field.field_type)
        # 7: Grafo, 10: Biometrica facial, 18: Cedula, 22: OTP
        sig_types = [7, 10, 18, 22]
        signatures = Answer_Field.objects.filter(field_filter).values('form_field__field_type_id').annotate(count=Count('id'))
        
        sig_data = {
            'grafo': 0,
            'facial': 0,
            'cedula': 0,
            'otp': 0
        }

        for sig in signatures:
            ft_id = sig['form_field__field_type_id']
            count = sig['count']
            if ft_id == 7:
                sig_data['grafo'] = count
            elif ft_id == 10:
                sig_data['facial'] = count
            elif ft_id == 18:
                sig_data['cedula'] = count
            elif ft_id == 22:
                sig_data['otp'] = count

        # Signed vs Unsigned Documents
        signed_docs_count = Answer_Field.objects.filter(
            field_filter,
            form_field__field_type_id__in=sig_types
        ).values('answer_form_id').distinct().count()
        
        unsigned_docs_count = documents_created - signed_docs_count
        if unsigned_docs_count < 0: unsigned_docs_count = 0

        return Response({
            'status': True,
            'data': {
                'users': {
                    'active': active_users,
                    'inactive': inactive_users
                },
                'templates': templates_created,
                'documents': documents_created,
                'signed_documents': signed_docs_count,
                'unsigned_documents': unsigned_docs_count,
                'transactions': {
                    'registraduria': registraduria,
                    'restrictive_lists': restrictive_lists
                },
                'signatures': sig_data
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_field_distribution(request):
    """
    Returns the distribution of the most included field types in templates.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')

        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        field_filter = Q()
        if enterprise_id:
            field_filter &= Q(form_enterprise__enterprise_id=enterprise_id)

        # Count occurrences of each field type in forms
        distribution = Form_Field.objects.filter(field_filter).values(
            'field_type__name'
        ).annotate(
            count=Count('id')
        ).order_by('-count')

        data = [{'name': item['field_type__name'], 'value': item['count']} for item in distribution if item['field_type__name']]

        return Response({
            'status': True,
            'data': data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_audit_trail(request):
    """
    Exports the Traceability_User logs as a CSV file.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        trace_filter = Q()
        if enterprise_id:
            trace_filter &= Q(user__enterprise_id=enterprise_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                trace_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        traces = Traceability_User.objects.filter(trace_filter).select_related('user', 'user__enterprise').order_by('-creation_date')

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="audit_trail.csv"'
        response.write(u'\ufeff'.encode('utf8')) # BOM for Excel UTF-8

        writer = csv.writer(response, delimiter=';')
        writer.writerow(['Fecha', 'Empresa', 'Usuario', 'Correo', 'Accion', 'Elemento', 'Descripción', 'Extra'])

        action_map = {
            1: 'Crear', 2: 'Modificar', 3: 'Eliminar', 4: 'Inicio de sesión',
            5: 'Video match', 6: 'Image match', 7: 'Listas restrictivas',
            8: 'Enrolamiento', 9: 'Escaneo documento', 10: 'OCR', 11: 'Validacion SMS'
        }

        for trace in traces:
            user_name = f"{trace.user.first_name} {trace.user.first_last_name}" if trace.user else "Sistema"
            user_email = trace.user.email if trace.user else ""
            enterprise_name = trace.user.enterprise.name if (trace.user and trace.user.enterprise) else ""
            action_name = action_map.get(trace.action, str(trace.action))

            writer.writerow([
                trace.creation_date.strftime('%Y-%m-%d %H:%M:%S'),
                enterprise_name,
                user_name,
                user_email,
                action_name,
                trace.element,
                trace.description,
                trace.extra
            ])

        return response

    except Exception as e:
        return HttpResponse(str(e), status=400)


from django.db.models.functions import TruncDate
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_timeline(request):
    """
    Returns document creation counts over time (grouped by day).
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        form_id = request.GET.get('form_id')

        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        answer_filter = Q()
        if enterprise_id:
            answer_filter &= Q(form_enterprise__enterprise_id=enterprise_id)
        if form_id:
            answer_filter &= Q(form_enterprise_id=form_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                answer_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        timeline = Answer_Form.objects.filter(answer_filter).annotate(
            date=TruncDate('creation_date')
        ).values('date').annotate(count=Count('id')).order_by('date')

        data = [{'date': item['date'].strftime('%Y-%m-%d'), 'count': item['count']} for item in timeline if item['date']]

        return Response({
            'status': True,
            'data': data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_top_enterprises(request):
    """
    Returns the Top 5 Enterprises by documents created.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        
        if user_val.role_id != 1:
            return Response({'status': False, 'message': 'Solo super administradores'}, status=status.HTTP_403_FORBIDDEN)

        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        answer_filter = Q()
        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                answer_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        # Top 5 records
        top_docs = Answer_Form.objects.filter(answer_filter).values(
            'form_enterprise__enterprise__name'
        ).annotate(count=Count('id')).order_by('-count')[:5]

        data = [{'enterprise': item['form_enterprise__enterprise__name'] or 'General', 'docs_count': item['count']} for item in top_docs if item['form_enterprise__enterprise__name']]

        return Response({
            'status': True,
            'data': data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_services(request):
    """
    Returns the volume of services consumed (Registraduria vs Biometria vs SMS vs Listas)
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        trace_filter = Q()
        if enterprise_id:
            trace_filter &= Q(user__enterprise_id=enterprise_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                trace_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        # Action 8,9,10: Registraduria
        # Action 7: Listas Restrictivas
        # Action 5,6: Biometria
        # Action 11: Validacion SMS
        traces = Traceability_User.objects.filter(trace_filter).values('action').annotate(count=Count('id'))
        
        services = {
            'Registraduría': 0,
            'Biometría': 0,
            'Listas Restrictivas': 0,
            'Validacion SMS': 0
        }
        
        for t in traces:
            act = t['action']
            c = t['count']
            if act in [8, 9, 10]:
                services['Registraduría'] += c
            elif act in [5, 6]:
                services['Biometría'] += c
            elif act == 7:
                services['Listas Restrictivas'] += c
            elif act == 11:
                services['Validacion SMS'] += c

        data = [{'name': k, 'value': v} for k, v in services.items()]

        return Response({
            'status': True,
            'data': data
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_active_plans(request):
    """
    Returns the distribution of active plans among enterprises based on History_Plans.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        if user_val.role_id != 1:
            return Response({'status': False, 'message': 'Permiso denegado'}, status=status.HTTP_403_FORBIDDEN)

        # Get latest plan for each enterprise
        from django.db.models import Max
        from api.models import History_Plans
        latest_plans = History_Plans.objects.values('enterprise_id').annotate(
            latest_buy=Max('buy_date')
        )
        
        # This is a simplification. We will group by plan name.
        plan_counts = {}
        for lp in latest_plans:
            hp = History_Plans.objects.filter(
                enterprise_id=lp['enterprise_id'], 
                buy_date=lp['latest_buy']
            ).first()
            if hp and hp.plan:
                plan_name = hp.plan.name
                plan_counts[plan_name] = plan_counts.get(plan_name, 0) + 1

        data = [{'name': k, 'value': v} for k, v in plan_counts.items()]

        return Response({
            'status': True,
            'data': data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_types(request):
    """
    Returns the distribution of user types: Web, Mobile, Facebook, Google, Administrativos
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        user_filter = Q(state=True)
        if enterprise_id and enterprise_id != 'all':
            user_filter &= Q(enterprise_id=enterprise_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                user_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        users = User_Enterprise.objects.filter(user_filter).values(
            'register_platform', 'role_enterprise__is_admin'
        ).annotate(count=Count('id'))

        types = {
            'Administrativo Web': 0,
            'Administrativo Móvil': 0,
            'Usuario Web': 0,
            'Usuario Móvil': 0,
            'Usuario Externo (Google/FB/Tel)': 0
        }

        for u in users:
            is_admin = u['role_enterprise__is_admin']
            plat = u['register_platform']
            c = u['count']

            if is_admin:
                if plat == 1:
                    types['Administrativo Móvil'] += c
                else:
                    types['Administrativo Web'] += c
            else:
                if plat == 1:
                    types['Usuario Móvil'] += c
                elif plat in [2, 3, 4]:
                    types['Usuario Externo (Google/FB/Tel)'] += c
                else:
                    types['Usuario Web'] += c

        data = [{'name': k, 'value': v} for k, v in types.items()]
        return Response({'status': True, 'data': data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_document_types(request):
    """
    Returns the ratio of public vs private documents
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        form_id = request.GET.get('form_id')
        
        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        doc_filter = Q(state=True)
        if enterprise_id and enterprise_id != 'all':
            doc_filter &= Q(form_enterprise__enterprise_id=enterprise_id)
        if form_id:
            doc_filter &= Q(form_enterprise_id=form_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                doc_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        docs = Answer_Form.objects.filter(doc_filter).values('public').annotate(count=Count('id'))
        
        priv_count = 0
        pub_count = 0
        for d in docs:
            if d['public']: pub_count += d['count']
            else: priv_count += d['count']

        data = [
            {'name': 'Documentos Privados Internos', 'value': priv_count},
            {'name': 'Documentos Públicos Externos', 'value': pub_count}
        ]
        return Response({'status': True, 'data': data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_shared_documents(request):
    """
    Returns the distribution of shared documents by medium (WhatsApp, SMS, Correo) based on Traceability logs.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        trace_filter = Q()
        if enterprise_id and enterprise_id != 'all':
            trace_filter &= Q(user__enterprise_id=enterprise_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                trace_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass
        
        traces = Traceability_User.objects.filter(trace_filter).values('description')
        
        counts = {
            'WhatsApp': 0,
            'SMS': 0,
            'Correo Electrónico': 0
        }

        for t in traces:
            desc = t['description'].lower() if t['description'] else ''
            if 'whatsapp' in desc:
                counts['WhatsApp'] += 1
            if 'sms' in desc:
                counts['SMS'] += 1
            if 'correo' in desc or 'email' in desc:
                counts['Correo Electrónico'] += 1

        data = [{'name': k, 'value': v} for k, v in counts.items()]
        return Response({'status': True, 'data': data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_template_metrics(request):
    """
    Returns the ratio of active templates (Digital vs Non-Digital) and the top used fields.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        form_id = request.GET.get('form_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        
        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        form_filter = Q(state=True)
        field_filter = Q(state=True)

        if enterprise_id and enterprise_id != 'all':
            form_filter &= Q(enterprise_id=enterprise_id)
            field_filter &= Q(form_enterprise__enterprise_id=enterprise_id)
        
        if form_id:
            form_filter &= Q(id=form_id)
            field_filter &= Q(form_enterprise_id=form_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                form_filter &= Q(creation_date__range=(sd, ed))
                field_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        # 1. Digital vs Non-Digital
        from api.models import Form_Enterprise, Form_Field
        from django.db.models import Count
        forms = Form_Enterprise.objects.filter(form_filter).values('digital').annotate(count=Count('id'))
        
        templates_data = [
            {'name': 'Con Plantilla PDF', 'value': 0},
            {'name': 'Formulario Básico (Sin PDF)', 'value': 0}
        ]

        for f in forms:
            if f['digital']: templates_data[0]['value'] += f['count']
            else: templates_data[1]['value'] += f['count']

        # 2. Top Field Types
        top_fields = Form_Field.objects.filter(field_filter).values(
            'field_type__name'
        ).annotate(count=Count('id')).order_by('-count')[:5]

        fields_data = [{'name': f['field_type__name'], 'value': f['count']} for f in top_fields]

        return Response({
            'status': True,
            'data': {
                'templates': templates_data,
                'top_fields': fields_data
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_billable_transactions(request):
    """
    Returns billable authentication and external services with success vs failure (fraud) rates.
    """
    try:
        user_val = User_Enterprise.objects.get(user=request.user, token=request.auth.key)
        enterprise_id = request.GET.get('enterprise_id')
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')
        form_id = request.GET.get('form_id')
        
        if user_val.role_id != 1:
            enterprise_id = user_val.enterprise_id

        trace_filter = Q()
        if enterprise_id and enterprise_id != 'all':
            trace_filter &= Q(user__enterprise_id=enterprise_id)

        if start_date and end_date:
            try:
                sd = make_aware(datetime.strptime(start_date, '%Y-%m-%d'))
                ed = make_aware(datetime.strptime(end_date + " 23:59:59", '%Y-%m-%d %H:%M:%S'))
                trace_filter &= Q(creation_date__range=(sd, ed))
            except ValueError:
                pass

        doc_filter = Q(state=True)
        if enterprise_id and enterprise_id != 'all':
            doc_filter &= Q(form_enterprise__enterprise_id=enterprise_id)
        if form_id:
            doc_filter &= Q(form_enterprise_id=form_id)

        doc_count = Answer_Form.objects.filter(doc_filter).count()

        traces = Traceability_User.objects.filter(trace_filter).values('action', 'description', 'extra')

        metrics = {
            'Firma Biométrica Facial': {'success': 0, 'fail': 0},
            'Firma OTP (SMS/WA/Email)': {'success': 0, 'fail': 0},
            'Firma con Cédula': {'success': 0, 'fail': 0},
            'Firma Manuscrita (Grafo)': {'success': 0, 'fail': 0},
            'Transacción Registraduría': {'success': 0, 'fail': 0},
            'Transacción Listas Restrictivas': {'success': 0, 'fail': 0}
        }

        for t in traces:
            act = t['action']
            desc = t['description'].lower() if t['description'] else ""
            extra = t['extra'].lower() if t['extra'] else ""
            
            comb = desc + " " + extra
            is_success = 'error' not in comb and 'fall' not in comb and 'rechaza' not in comb and 'no coinc' not in comb and 'fraude' not in comb
            
            target = None
            if act in [5, 6, 8] or 'biometr' in comb or 'facial' in comb: target = 'Firma Biométrica Facial'
            elif act == 11 or 'otp' in comb: target = 'Firma OTP (SMS/WA/Email)'
            elif 'cedula' in comb or 'cédula' in comb or act == 9: target = 'Firma con Cédula'
            elif 'grafo' in comb or 'manuscrit' in comb: target = 'Firma Manuscrita (Grafo)'
            elif act == 10 or 'registraduria' in comb or 'ocr' in comb: target = 'Transacción Registraduría'
            elif act == 7 or 'listas' in comb: target = 'Transacción Listas Restrictivas'

            if target:
                if is_success: metrics[target]['success'] += 1
                else: metrics[target]['fail'] += 1

        categories = list(metrics.keys())
        success_data = [metrics[c]['success'] for c in categories]
        fail_data = [metrics[c]['fail'] for c in categories]

        data = {
            'documentos_recibidos': doc_count,
            'categories': categories,
            'success': success_data,
            'fail': fail_data
        }

        return Response({'status': True, 'data': data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'status': False, 'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)
