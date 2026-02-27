# rest_framework
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from rest_framework import status
from api.controllers.site import save_image
from api.controllers.answer import assing_serial
from django.conf import settings
# models
from api.models import (
    Task,
    Visit_Task_Answer_Form,
    Form_Enterprise,
    Traceability_User,
    Form_Answer_Task,
    Answer_Form,
    Answer_Field,
    User_Enterprise,
    Serial_Number,
    Subproject
)
import json
from .traceability import create_traceability
from django.db.models import Q
from datetime import datetime,timedelta
import pytz
TZ_INFO = pytz.timezone('America/Bogota')

@api_view(['POST'])
def list_task(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        if data['option'] != 1:
            task_val = Task.objects.filter(state_id=data['idState'],subproject_id=data['idSubP']).order_by('-modify_date').values('id', 'name', 'description', 'address', 'phone', 'creation_date', 'modify_date', 'initial_date', 'initial_hour', 'finish_date', 'finish_hour', 'state_id', 'user_id', 'subproject_id','duration','serial_number','answer_form_id','subproject__name')
            Answer=[]
            for value in task_val:
                if value['answer_form_id'] is not None:
                    Answer=Answer_Form.objects.filter(id=value['answer_form_id']).select_related('form_enterprise').values('form_enterprise__digital')
        else:
            arrayDate=data['idSubP'].split(',')
            task_val = Task.objects.filter(state_id=data['idState'],subproject_id__project_id__in=arrayDate).order_by('-modify_date').values('id', 'name', 'description', 'address', 'phone', 'creation_date', 'modify_date', 'initial_date', 'initial_hour', 'finish_date', 'finish_hour', 'state_id', 'user_id', 'subproject_id','duration','serial_number','answer_form_id','subproject__name')
            Answer=[]
            for value in task_val:
                if value['answer_form_id'] is not None:
                    Answer=Answer_Form.objects.filter(id=value['answer_form_id']).select_related('form_enterprise').values('form_enterprise__digital')
        response['status'] = True
        response['taskList'] = task_val
        response['formDigital'] = Answer
        response['message'] = 'Lista de tareas'
    except (Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene tareas'
    except KeyError:
            response['message'] = 'Error en listar tareas'
    return Response(response)

@api_view(['POST'])
def list_task_all(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        if not data['listComplet']:
            task_val = Task.objects.filter(subproject_id=data['idSubP']).select_related('Enterprise_Process_State','User_Enterprise').order_by('-modify_date').values('id', 'name', 'description', 'address', 'phone', 'creation_date', 'modify_date', 'initial_date', 'initial_hour', 'finish_date', 'finish_hour', 'state_id', 'user_id', 'subproject_id','duration',"state__name","user__first_name","user__middle_name","user__first_last_name","user__second_last_name","user__role_enterprise_id",'serial_number','answer_form_id','subproject__name')
            response['status'] = True
            response['taskList'] = task_val
            response['message'] = 'Lista de tareas por sub proyecto completa'
        else:
            arrayDate=data['idSubP'].split(',')
            task_val = Task.objects.filter(subproject_id__project_id__in=arrayDate).select_related('Enterprise_Process_State','User_Enterprise').order_by('-modify_date').values('id', 'name', 'description', 'address', 'phone', 'creation_date', 'modify_date', 'initial_date', 'initial_hour', 'finish_date', 'finish_hour', 'state_id', 'user_id', 'subproject_id','duration',"state__name","user__first_name","user__middle_name","user__first_last_name","user__second_last_name","user__role_enterprise_id",'serial_number','answer_form_id','subproject__name')
            response['status'] = True
            response['taskList'] = task_val
            response['message'] = 'Lista de tareas completa'
    except (Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene tareas'
    except KeyError:
            response['message'] = 'Error en listar tareas'
    return Response(response)


@api_view(['POST'])
def list_task_user(request):
    response = {}
    response['status'] = False
    data = request.data
    user_id = data ['user_id']
    list_form = []
    try:
        task_val = Task.objects.filter(Q(state = 23) | Q(state = 24), user_id = user_id).select_related('Subproject', 'Enterprise_Process_State').values('id','name', 'description', 'address', 'phone', 'initial_date', 'finish_date', 'initial_hour', 'finish_hour',  'subproject__name', 'subproject__id_forms',"state__name",'answer_form_id')
        for a in task_val:
             json_forms = json.loads(a['subproject__id_forms'])
             for form in json_forms:
                form = Form_Enterprise.objects.filter(id= form).values("id","name","digital")
                list_form.append(form[0])
             a['forms'] = list_form
             list_form = []
        response['status'] = True
        response['data'] = task_val
    except (Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene visitas para realizar'
    except KeyError:
            response['message'] = 'No tiene visitas para realizar'
    return Response(response)

@api_view(['POST'])
def change_state_task(request):
    response = {}
    response['status'] = False
    data = request.data
    task_id = data ['task_id']
    state_id = data ['state_id']
    observation = data ['observation']
    msg = ""
    action = 0
    user_id = data ['user_id']
    extra = ""
    try:
        task_val = Task.objects.get(id = str(task_id))
        task_val.state_id = str(state_id)
        task_val.user_id = str(user_id)
        task_val.save()

        if state_id == 24 or state_id == "24":
            action = 23
            msg = "El usuario empezo la visita"
        elif state_id == 23 or state_id == "23":
            action = 18
            msg = "Tarea sin iniciar"
            if task_val.serial_number != 'NA':
                serial=task_val.serial_number.split('-')
                task_val.serial_number="V-"+serial[1]
                task_val.save()
        elif state_id == 25 or state_id == "25":
            action = 19
            msg = "El usuario reasigno la visita"
            extra = json.dumps({"state" : "Reasignada", "name" : task_val.name, "date" : task_val.finish_date, "msg" : observation, "address" : task_val.address})
        elif state_id == 26 or state_id == "26":
            action = 20
            msg = "El usuario Finalizo la visita"
            extra = json.dumps({"state" : "Finalizada", "name" : task_val.name, "date" : task_val.finish_date, "msg" : observation,  "address" : task_val.address})
        content = {
                    'user': user_id,
                    'group': 136,
                    'element': task_id,
                    'action': action,
                    'description': msg,
                    'extra': extra
                }
        create_traceability(content)
        response['status'] = True
        response['message'] = 'Estado de visita actualizado'
    except (Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'Esta visita no se encuentra agendada'
    except KeyError:
            response['message'] = 'Faltan parametros por enviar'
    return Response(response)

@api_view(['POST'])
def list_history_task(request):
    response = {}
    response['status'] = False
    data = request.data
    user_id = data ['user_id']
    try:
        task_val = Traceability_User.objects.filter(Q(action = 19) | Q(action = 20), user_id = user_id).values('extra','creation_date')
        response['status'] = True
        response['data'] = task_val
    except (Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene visitas finalizadas'
    except KeyError:
            response['message'] = 'No tiene visitas finalizadas'
    return Response(response)

@api_view(['POST'])
def create_task(request):
    response = {}
    response['status'] = False
    data = request.data
    user_val = User_Enterprise.objects.get(id = data['user_id'])
    if 'task_id' in data and data['task_id'] != '':
        if 'state_id' in data and data['state_id'] != '':
            stateId=data['state_id']
        else:
            stateId=28
        task_val = Task.objects.get(id = data['task_id'])
        task_val.name = data['name']
        task_val.description = data['description']
        task_val.address = data['dir']
        task_val.phone = data['cellPhone']
        task_val.initial_date = data['fecha']
        task_val.finish_date = data['fecha']
        task_val.initial_hour = data['hourI']
        task_val.finish_hour = data['hourF']
        task_val.state_id = stateId
        task_val.user_id = data['user_id']
        task_val.duration = data['duration']
        task_val.save()

        des=''
        if 'rest' in data and data['rest'] != '':
             msg = "Se libera tarea reasignada"
             extra = json.dumps({"state" : "Tarea liberada", "name" : task_val.name, "date" : task_val.finish_date, "msg" : "Se libera tarea reasignada.", "address" : task_val.address})
             content = {
                        'user': data['user_id'],
                        'group': 136,
                        'element': task_val.id,
                        'action': 30,
                        'description': msg,
                        'extra': extra
                    }
        else:
             des ="El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " edito la tarea " +  str(data['name']),
             content = {
                    'user': data['user_id'],
                    'group': 135,
                    'element': task_val.id,
                    'action': "28",
                    'description': des,
                    'extra': ""
                }
        create_traceability(content)

        response['status'] = True
        response['message'] = 'Tareas editada correctamente'
    else:
        task_val = Task()
        task_val.name = data['name']
        task_val.description = data['description']
        task_val.address = data['dir']
        task_val.phone = data['cellPhone']
        task_val.initial_date = data['fecha']
        task_val.finish_date = data['fecha']
        task_val.initial_hour = data['hourI']
        task_val.finish_hour = data['hourF']
        task_val.state_id = 28
        task_val.user_id = data['user_id']
        task_val.subproject_id = data['sub_proyect_id']
        task_val.duration = data['duration']
        task_val.answer_form_id = data['Answer_Form_id']
        task_val.save()

        if 'ticket' not in data or data['ticket'] == '':
            serial_number_val = assing_serial(user_val.enterprise_id)
            serial_number_val = serial_number_val.id
        else:
            serial_number_val = data['ticket']

        try:
            serial = Serial_Number.objects.get(id=serial_number_val)
            ticket='T-'+str(serial.serial)+str(serial.count)
            task_val.serial_number = ticket
            task_val.save()
        except Exception as e:
            print('error task::::::::::::::::: ' + str(e))
            try:
                serial = Serial_Number.objects.get(id=serial_number_val)
                ticket='T-'+str(serial.serial)+str(serial.count)
                task_val.serial_number = ticket
                task_val.save()
            except Exception as e:
                print('error task:::::::::::::::::  dos intentos' + str(e))

        content = {
                'user': data['user_id'],
                'group': 135,
                'element': task_val.id,
                'action': "28",
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " creo la tarea " +  str(data['name']+ ' con número de ticket '+str(ticket)),
                'extra': ""
            }
        create_traceability(content)

        response['status'] = True
        response['message'] = 'Tarea creada correctamente'

        if 'task_link_id' in data and data['task_link_id'] != '':
            if data['task_link_id'] == '1':
                task_form_val = Form_Answer_Task()
                task_form_val.Answer_Form_id = data['Answer_Form_id']
                task_form_val.subproject_id = data['sub_proyect_id']
                task_form_val.task_id=task_val.id
                task_form_val.description="Tarea creada desde ticket"
                task_form_val.save()
            else:
                task_form_val = Form_Answer_Task()
                task_form_val.Answer_Form_id = data['Answer_Form_id']
                task_form_val.subproject_id = data['sub_proyect_id']
                task_form_val.description="Tarea rechazada desde tickets"
                task_form_val.save()
            response['message'] = 'Tarea creada correctamente con tickets'

    return Response(response)

@api_view(['POST'])
def list_form_answer_task(request):
    response = list_form_answer_task_proccess(request)
    return response

def list_form_answer_task_proccess(request,idForm='',idSubP='',option='0'):
    response = {}
    response['status'] = False
    if option == "0":
        data = request.data
        idForm=data['idForm']
        idSubP=data['idSubP']
    AnsForm=[]
    AnsFormRest=[]
    try:
        ans_val = Answer_Form.objects.filter(form_enterprise_id=idForm).values('id','serial_number_id','creation_date')
        count=0
        for a in ans_val:
            try:
                Form_Answer_Task.objects.get(subproject_id=idSubP,Answer_Form_id=a['id'])
            except (Form_Answer_Task.DoesNotExist):
                count +=1
                ans_val_res = Answer_Field.objects.filter(answer_form_id=a['id']).order_by('form_field_id').select_related('form_enterprise','answer_form').values('id','value','form_field_id','answer_form_id','answer_form__form_enterprise__digital')
                for b in ans_val_res:
                    AnsFormRest.append(b)
                valueSubName = Subproject.objects.get(id=idSubP)
                a['nameSubproyect'] = valueSubName.name
                a['resp']=AnsFormRest
                serial = Serial_Number.objects.get(id=a['serial_number_id'])
                ticket='A-'+str(serial.serial)+str(serial.count)
                a['serial']=ticket
                AnsForm.append(a)
                AnsFormRest=[]
        response['status'] = True
        response['count'] = count
        response['data'] = AnsForm
        response['message'] = 'Cantidad de tickes sin asignar'
    except (Answer_Form.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene tickes creados'
    except KeyError:
            response['message'] = 'Error en listar tickes'
    if option == '0':
        return Response(response)
    else:
        return AnsForm

@api_view(['POST'])
def list_trazability_task(request):
    response = {}
    response['status'] = False
    data = request.data
    ansTraza=[]
    try:
        trazability=Traceability_User.objects.filter(group=136,element=data['idTask'],action__in=[19,20,30]).order_by('-action','-creation_date').values('creation_date','extra','description','action')
        for value in trazability:
            datas=json.loads(value['extra'])
            ansTraza.append({
                "title":datas['state'],
                "detail":datas['msg'],
                "create_date":value['creation_date'],
                "description":value['description']
            })
        response['data'] = ansTraza
        response['status'] = True
    except (Traceability_User.DoesNotExist):
        pass
    return Response(response)

@api_view(['POST'])
def detail_task(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
            aux=data['idtask'].split('-')
            if aux[1] =='T':
                task_val = Task.objects.filter(id=aux[0]).select_related('Enterprise_Process_State','User_Enterprise').order_by('-modify_date').values('id', 'name', 'description', 'address', 'phone', 'creation_date', 'modify_date', 'initial_date', 'initial_hour', 'finish_date', 'finish_hour', 'state_id', 'user_id', 'subproject_id','duration',"state__name","user__first_name","user__middle_name","user__first_last_name","user__second_last_name","user__role_enterprise_id",'serial_number','answer_form_id')
                Answer=None
                for value in task_val:
                    if value['answer_form_id'] is not None:
                        Answer=Answer_Form.objects.filter(id=value['answer_form_id']).select_related('form_enterprise').values('form_enterprise__digital')
                response['status'] = True
                response['taskList'] = task_val
                response['formDigital'] = Answer
                response['message'] = 'detalle de la tarea completa'
            else:
                a={}
                AnsFormRest=[]
                Answer=Answer_Form.objects.get(id=aux[0])
                ans_val_res = Answer_Field.objects.filter(answer_form_id=Answer.id).order_by('form_field_id').select_related('form_enterprise','answer_form').values('id','value','form_field_id','answer_form_id','answer_form__form_enterprise__digital')
                for b in ans_val_res:
                    AnsFormRest.append(b)
                a['resp']=AnsFormRest
                response['status'] = True
                response['taskList'] = a
                response['create'] = Answer.creation_date
                response['message'] = 'detalle de la tarea ticket completa'
    except (Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene información de la tarea'
    except KeyError:
            response['message'] = 'Error en listar tareas'
    return Response(response)

@api_view(['POST'])
def document_task(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
            desc_task_val = Visit_Task_Answer_Form.objects.filter(task_id=data['idtask']).select_related('Answer_Form','Form_Enterprise').values('id','answer_form_id', 'answer_form__form_enterprise__name','answer_form__form_enterprise__digital')
            response['status'] = True
            response['data'] = desc_task_val
            response['message'] = 'soporte de tareas completa'
    except (Visit_Task_Answer_Form.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene información soportes de la tarea'
    except KeyError:
            response['message'] = 'Error en listar tareas'
    return Response(response)