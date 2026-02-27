from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework import status

from api.models import System_Log
from api.permissions import IsSuperAdmin
from datetime import datetime, timedelta

import json
import traceback


def register_log(data, user_val, enterprise=None):
    try:
        if user_val is None and enterprise is None:
            raise Exception('No se envio usuario para identificar la empresa')
        sys_log_val = System_Log()
        sys_log_val.action = data['action']
        sys_log_val.type = data['type']
        sys_log_val.source = data['source']
        sys_log_val.url = data['url']
        sys_log_val.data = data['data']
        if 'response_data' in data:
            sys_log_val.response_data = data['response_data']
        sys_log_val.enterprise_id = user_val.enterprise_id if user_val and type(user_val) != type(0) else enterprise
        sys_log_val.save()
    except Exception as err:
        sys_log_val = System_Log()
        sys_log_val.action = 'Guardado de Log'
        sys_log_val.type = 5
        sys_log_val.source = 1
        sys_log_val.url = 'INTERNO'
        sys_log_val.data = json.dumps(data)
        sys_log_val.response_data = 'Excepcion Capturada {} - {} - {}'.format(type(err), err.args, traceback.format_exception_only(etype=type(err), value=err)[-10:])
        sys_log_val.enterprise_id = 1
        sys_log_val.save()
    
@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def get_logs(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        date_init = data['date_init'] if 'date_init' in data else None
        date_end = data['date_end'] if 'date_end' in data else None
        
        if date_end:
            # Se añade un dia para la funcionalidad del filtro
            date_end = datetime.strptime(date_end.split('T')[0], '%Y-%m-%d') + timedelta(days=1)
        sys_log_values = System_Log.objects.all()
        if date_init and date_end:
            sys_log_values = sys_log_values.filter(
                creation_date__gte = date_init,
                creation_date__lte = date_end,
            )
        elif date_init:
            sys_log_values = sys_log_values.filter(
                creation_date__gte = date_init,
            )
        elif date_end:
            sys_log_values = sys_log_values.filter(
                creation_date__lte = date_end,
            )
        sys_log_values = sys_log_values.values('type', 'creation_date', 'enterprise_id', 'action', 'url', 'data', 'response_data', 'source')
        response['status'] = True
        response['data'] = list(sys_log_values)
    except Exception as err:
        print(err)
        pass
    return Response(response)