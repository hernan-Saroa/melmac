# rest_framework
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.views import APIView
from api.controllers.task import list_form_answer_task_proccess
from rest_framework import status
from api.controllers.site import save_image
from django.conf import settings
from django.db.models import Q
# models
from api.models import (
    Project_Task,
    Subproject,
    Programming_Visits,
    Task,
    Form_Field,
    Subproject_Parameters,
    Enterprise,
    Form_Enterprise,
    Permit_Role,
    User_Enterprise
)
import json
from .traceability import create_traceability

@api_view(['POST'])
def list_proyect(request):
    response = {}
    response['status'] = False
    data = request.data
    ent_val = Enterprise.objects.get(id=1)
    form_visit_form = ent_val.visit_form
    try:
        proyect_val = Project_Task.objects.filter(enterprise_id=data['idEnt'],state=True).order_by('-creation_date').values('id','name','description','identificator','state','image')
        response['status'] = True
        response['data'] = proyect_val
        response['form_visit_form'] = form_visit_form
        response['message'] = 'Lista de proyectos'
    except (Project_Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene proyectos'
    except KeyError:
            response['message'] = 'Error en listar proyectos'
    return Response(response)

@api_view(['POST'])
def delete_list_proyect(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        proyect_val = Project_Task.objects.get(id=data['idProyect'])
        proyect_val.state=False
        proyect_val.save()
        response['status'] = True
        response['message'] = 'proyecto eliminado'
    except (Project_Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene proyectos'
    except KeyError:
            response['message'] = 'Error al eliminar proyecto'
    return Response(response)


@api_view(['POST'])
def list_sub_proyect(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        ent_val = Enterprise.objects.get(id=data['idEnt'])
        form_visit_form = ent_val.visit_form
        subproyect_val = Subproject.objects.filter(project_id=data['idProyect']).order_by('-creation_date').values('id','name','description','goal','state','main_form')
        response['status'] = True
        response['data'] = subproyect_val
        response['form_visit_form'] = form_visit_form
        response['message'] = 'Lista de Sub-proyectos'
    except (Subproject.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene Sub-proyectos'
    except KeyError:
            response['message'] = 'Error en listar sub-proyectos'
    return Response(response)

@api_view(['POST'])
def list_sub_proyect_unit(request):
    response = {}
    response['status'] = False
    data = request.data
    subProyect_val = Subproject.objects.get(id = data['sub_proyect_id'])
    ParamsSubProyect_val = Subproject_Parameters.objects.get(subproject_id = data['sub_proyect_id'])
    content = {
                    'id': subProyect_val.id,
                    'name': subProyect_val.name,
                    'email': subProyect_val.email,
                    'description': subProyect_val.description,
                    'goal': subProyect_val.goal,
                    'id_forms': subProyect_val.id_forms,
                    "initial_date":subProyect_val.initial_date,
                    "initial_hour":subProyect_val.initial_hour,
                    "finish_date":subProyect_val.finish_date,
                    "finish_hour":subProyect_val.finish_hour,
                    "state":subProyect_val.state,
                    "days_enabled":ParamsSubProyect_val.days_enabled,
                    "start_time_enabled":ParamsSubProyect_val.start_time_enabled,
                    "end_time_enabled":ParamsSubProyect_val.end_time_enabled,
                    "travel_time":ParamsSubProyect_val.travel_time,
                    "lunch_time":ParamsSubProyect_val.lunch_time,
                }
    response['data'] = content
    response['status'] = True
    response['message'] = 'Datos del Sub-proyectos'

    return Response(response)

@api_view(['POST'])
def create_sub_proyect(request):
    response = {}
    response['status'] = False
    data = request.data

    if 'sub_proyect_id' in data and data['sub_proyect_id'] != '':
        subProyect_val = Subproject.objects.get(id = data['sub_proyect_id'])
        subProyect_val.name = data['name']
        subProyect_val.description = data['description']
        subProyect_val.goal = data['goal']
        subProyect_val.email = data['email']
        subProyect_val.id_forms = data['forms']
        subProyect_val.initial_date = data['initialDate']
        subProyect_val.initial_hour = data['initialHour']
        subProyect_val.finish_date = data['finishDate']
        subProyect_val.finish_hour = data['finishHour']
        subProyect_val.state = data['state']
        subProyect_val.project_id = data['project_id']
        subProyect_val.save()
        ParamsSubProyect_val = Subproject_Parameters.objects.get(subproject_id = data['sub_proyect_id'])
        ParamsSubProyect_val.days_enabled = data['days']
        ParamsSubProyect_val.start_time_enabled = data['star']
        ParamsSubProyect_val.end_time_enabled = data['end']
        ParamsSubProyect_val.travel_time = data['travel']
        ParamsSubProyect_val.lunch_time_state = True
        ParamsSubProyect_val.lunch_time = data['lunch']
        ParamsSubProyect_val.save()
        user_val = User_Enterprise.objects.get(id = data['idUser'])

        content = {
                'user': data['idUser'],
                'group': 137,
                'element': data['sub_proyect_id'],
                'action': "27",
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " edito el subproyecto " +  str(data['name']),
                'extra': ""
            }
        create_traceability(content)

        response['status'] = True
        response['message'] = 'Sub Proyecto editado correctamente'
    else:
        user_val = User_Enterprise.objects.get(id = data['idUser'])
        ent_val = Form_Enterprise.objects.get(name="Ticket principal visitas copia #1",enterprise_id=data['idU'])
        subProyect_val = Subproject()
        subProyect_val.name = data['name']
        subProyect_val.description = data['description']
        subProyect_val.goal = data['goal']
        subProyect_val.email = data['email']
        subProyect_val.id_forms = data['forms']
        subProyect_val.initial_date = data['initialDate']
        subProyect_val.initial_hour = data['initialHour']
        subProyect_val.finish_date = data['finishDate']
        subProyect_val.finish_hour = data['finishHour']
        subProyect_val.state = data['state']
        subProyect_val.project_id = data['project_id']
        subProyect_val.main_form = ent_val.id
        subProyect_val.save()
        ParamsSubProyect_val = Subproject_Parameters()
        ParamsSubProyect_val.subproject_id = subProyect_val.id
        ParamsSubProyect_val.days_enabled = data['days']
        ParamsSubProyect_val.start_time_enabled = data['star']
        ParamsSubProyect_val.end_time_enabled = data['end']
        ParamsSubProyect_val.travel_time = data['travel']
        ParamsSubProyect_val.lunch_time_state = True
        ParamsSubProyect_val.lunch_time = data['lunch']
        ParamsSubProyect_val.save()
        ent_val2 = Form_Field.objects.filter(form_enterprise_id=ent_val.id, state=True)
        ent_val2.update(obligatory_visit=True)
        ent_val3 = Form_Field.objects.filter(form_enterprise_id=ent_val.id, field_type_id__in=[4,19])
        ent_val3.update(state=False)
        ent_val.name="Ticket general - "+str(data['name'])
        ent_val.visible=False
        ent_val.save()

        content = {
                'user':  data['idUser'],
                'group': 137,
                'element': subProyect_val.id,
                'action': "26",
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " creo el subproyecto " +  str(data['name']),
                'extra': ""
            }
        create_traceability(content)

        response['status'] = True
        response['message'] = 'Sub Proyecto creado correctamente'

    return Response(response)

@api_view(['POST'])
def list_programming(request):
    response = {}
    response['status'] = False
    data = request.data
    try:
        programming_val = Programming_Visits.objects.filter(subproject_id=data['idSubP']).order_by('-creation_date').values('id','name','description','state')
        response['status'] = True
        response['data'] = programming_val
        response['message'] = 'Lista de programaciones'
    except (Programming_Visits.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene programaciones'
    except KeyError:
            response['message'] = 'Error en listar programaciones'
    return Response(response)

@api_view(['POST'])
def create_proyect_task(request):
    response = {}
    response['status'] = False
    data = request.data

    if 'proyect_id' in data and data['proyect_id'] != '':
        proyect_val = Project_Task.objects.get(id = data['proyect_id'])

        proyect_val.name = data['name']
        proyect_val.description = data['description']
        proyect_val.image = "sin imagen"
        proyect_val.state = data['state']
        proyect_val.enterprise_id = data['enterprise_id']
        proyect_val.save()

        user_val = User_Enterprise.objects.get(id = data['idUser'])
        content_tracaeability = {
                'user': data['idUser'],
                'group': 135,
                'element': data['proyect_id'],
                'action': "25",
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " edito el proyecto " +  str(data['name']),
                'extra': ""
            }
        create_traceability(content_tracaeability)

        response['status'] = True
        response['message'] = 'Proyecto editado correctamente'
    else:
        proyect_val = Project_Task()
        proyect_val.name = data['name']
        proyect_val.description = data['description']
        proyect_val.image = "sin imagen"
        proyect_val.state = data['state']
        proyect_val.enterprise_id = data['enterprise_id']
        proyect_val.save()
        proyect_val.identificator = "IDP"+ str(proyect_val.id)
        proyect_val.save()
        try:
            ent_val = Form_Enterprise.objects.get(name="Ticket principal visitas copia #1",enterprise_id=data['enterprise_id'])
            ent_val.name="Ticket principal visitas"
            ent_val.visible=False
            ent_val.save()
            ent_val2 = Enterprise.objects.get(id=data['enterprise_id'])
            ent_val2.visit_form = ent_val.id
            ent_val2.save()
        except (Form_Enterprise.DoesNotExist):
            pass
        response['status'] = True
        response['message'] = 'Proyecto creado correctamente'

        user_val = User_Enterprise.objects.get(id = data['idUser'])
        content_tracaeability = {
                'user': data['idUser'],
                'group': 135,
                'element': proyect_val.id,
                'action': "24",
                'description': "El usuario denominado: #" + str(user_val.id) + " " + user_val.first_name + " " + user_val.first_last_name + " creo el proyecto " +  str(data['name']),
                'extra': ""
            }
        create_traceability(content_tracaeability)

        content = {
                    'id': proyect_val.id,
                    'name': proyect_val.name,
                    'description': proyect_val.description,
                    'identificator': proyect_val.identificator,
                    'state': proyect_val.state,
                    'image':proyect_val.image,
                }
        response['data'] = content

    return Response(response)

@api_view(['POST'])
def programming_available(request):
    response = {}
    response['status'] = False
    data = request.data
    user = []
    try:
        user_enterprise_val = User_Enterprise.objects.filter(enterprise_id=data['enterprise_id'], state=True)
        response['status'] = True
        arrayDays = data['weekdays'].split(",")
        arrayDisp=[]
        arrayHrCount=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
        arrayApoyo=['01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23','24']
        arrayHr=['01:00','02:00','03:00','04:00','05:00','06:00','07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00','20:00','21:00','22:00','23:00','24:00']
        for aa in user_enterprise_val:
            if aa.role_enterprise_id != None:
                permission = Permit_Role.objects.filter(role_enterprise_id=aa.role_enterprise_id, state=True, permit__status=True).values_list('permit__permit_type_id', flat=True)
                if 64 in permission:
                    content = {
                        'id': aa.id,
                        'name': aa.first_name,
                        'last_name': aa.first_last_name,
                        'email': aa.email,
                        'cell': aa.phone,
                    }
                    user.append(content)
                    i=0
        if len(user)!=0:
            param=Subproject_Parameters.objects.get(subproject_id=data['idSubProyect'])
            while i < 7:
                arrayHrCount=[0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]
                arrayHrCount2=[[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[],[]]
                for a in user:
                    j=0
                    while j < 23:
                        #print("dia",i)
                        #print("hora",j)
                        #print(a['id'])
                        #print(arrayHr[j])
                        #print(arrayHr[j+1])
                        busy = Task.objects.filter(Q(state_id = 23) | Q(state_id = 24), user_id = a['id'], initial_date=arrayDays[i],initial_hour__gte=arrayHr[j],initial_hour__lt=arrayHr[j+1]).values('id','name', 'description', 'initial_date', 'initial_hour', 'finish_hour','duration')
                        #print(busy)
                        #print("------------------------------")
                        if len(busy)==0:
                            arrayHrCount[j]=arrayHrCount[j]+1
                            if a['id'] in arrayHrCount2[j]:
                                arrayHrCount2[j].remove(a['id'])
                            else:
                                arrayHrCount2[j].append(a['id'])
                        else:
                            time=busy[0]['initial_hour'].split(':')
                            hour=time[0]
                            min=time[1]
                            duration=int(param.travel_time)+int(param.lunch_time)+int(busy[0]['duration'])
                            d1=duration/60
                            d1E=int(d1)
                            d1D=d1-d1E
                            if d1D == 0.5:
                                d1D=30
                            else:
                                d1D=00
                            minF=d1D+int(min)
                            if minF == 60:
                                minF=00
                                d1E=d1E+1
                            elif minF > 60:
                                minF=minF-60
                                d1E=d1E+1
                            k=1
                            HoraF=str(int(hour)+d1E)+':'+str(minF)
                            while k <= d1E:
                                hourF=int(hour)+k
                                hourF=str(hourF)+':'+str(minF)
                                if busy[0]['initial_hour'] <= hourF < HoraF:
                                    arrayHrCount[j+k]=arrayHrCount[j+k]-1
                                    arrayHrCount2[j+k].append(a['id'])
                                k +=1
                        j +=1
                content = {
                    'day':arrayDays[i],
                    'hrI': arrayHrCount,
                    'users': arrayHrCount2,
                }
                arrayDisp.append(content)
                i +=1

            #Validacion de sugerido para tarea
            task = Task.objects.get(id=data['idTask'])
            time=task.initial_hour.split(':')
            hour=time[0]
            min=time[1]
            duration=int(param.travel_time)+int(param.lunch_time)+int(task.duration)
            d1=duration/60
            d1E=int(d1)
            d1D=d1-d1E
            if d1D == 0.5:
                d1D=30
            else:
                d1D=00
            minF=d1D+int(min)
            if minF == 60:
                minF=00
                d1E=d1E+1
            elif minF > 60:
                minF=minF-60
                d1E=d1E+1
            k=1
            HoraF=str(int(hour)+d1E)+':'+str(minF)
            index=arrayApoyo.index(hour)
            index2=arrayDays.index(task.initial_date)
            aux=0
            burbuja=[]
            temp=""
            temp1=len(user)
            if aux < d1E:
                while aux < d1E:
                    temp=arrayDisp[index2]['hrI'][index+aux]
                    if temp < temp1:
                        temp1=temp
                        burbuja=arrayDisp[index2]['users'][index+aux]
                    else:
                        burbuja=arrayDisp[index2]['users'][index+aux]
                    aux +=1
            else:
                burbuja=arrayDisp[index2]['users'][index]
            response['data'] = {
                                'users': user,
                                'daysDisp' : arrayDisp,
                                'users_suggested_homework':burbuja
                                }
            #print(response)
            response['message'] = 'usurios con permiso de visitas'
        else:
            response['message'] = 'No tiene usurios con permiso de visitas'

    except (User_Enterprise.DoesNotExist):
        pass

    #permission = []
    #permission = Permit_Role.objects.filter(role_enterprise_id=user_enterprise_val.role_enterprise_id, state=True, permit__status=True).values_list('permit__permit_type_id', flat=True)

    return Response(response)

@api_view(['POST'])
def list_proyect_subproyect(request):
    response = {}
    response['status'] = False
    data = request.data
    group = []
    ticketsF = []
    try:
        ent_val = Enterprise.objects.get(id=data['idEnt'])
        proyect_val = Project_Task.objects.filter(enterprise_id=data['idEnt'],state=True).order_by('-creation_date').values('id','name','description','identificator','state','image')

        for value in proyect_val:
            subproyect = []
            ticketsAF = []
            subproyect_val = Subproject.objects.filter(project_id=value["id"]).order_by('-creation_date').values('id','name','description','goal','state','main_form')
            for value2 in subproyect_val:
                tickets=list_form_answer_task_proccess('',int(value2["main_form"]),value2["id"],1)
                contend={
                    "id":value2["id"],
                    "name":value2["name"],
                    "mainF":int(value2["main_form"])
                }
                subproyect.append(contend)
                for values3 in tickets:
                    ticketsF.append(values3)
                    ticketsAF.append(values3)

            group.append({
                "idP":value['id'],
                "nameP":value['name'],
                "data":subproyect,
                "ticketsP":ticketsAF
            })

        response['status'] = True
        response['data'] = group
        response['tickets'] = ticketsF
        response['mainG'] = ent_val.visit_form
        response['message'] = 'Lista de proyectos y subproyectos'
    except (Project_Task.DoesNotExist):
        response['status'] = False
        response['message'] = 'No tiene proyectos'
    except KeyError:
            response['message'] = 'Error en listar proyectos'
    return Response(response)