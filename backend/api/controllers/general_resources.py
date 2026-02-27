import os
from datetime import datetime
from django.conf import settings
from api.encrypt import Encrypt
from api.models import Form_Link
from api.util import create_qr
from api.util import send_email, create_qr, send_whatsapp_msg_v2
from api.controllers.notification import Sms

#Crear link de para documentos publicos directos
def create_link_document(token,idForm,idEnterprise,shared_to = None,shared_media = None,send_state=False,max_send=0,access=1,general_shared=True,max_date = None,date_state=False):
    token_link = Encrypt().encrypt_code(token)
    form_link_val = Form_Link()
    form_link_val.form_enterprise_id = idForm
    form_link_val.token_link = token_link
    form_link_val.access=access
    form_link_val.send_state=send_state
    form_link_val.max_send=max_send
    form_link_val.max_date=max_date
    form_link_val.date_state=date_state
    form_link_val.shared_to=shared_to
    form_link_val.shared_media=shared_media
    form_link_val.general_shared=general_shared
    form_link_val.save()
    url_form = settings.URL_FRONTEND + 'public/' + form_link_val.token_link
    path = create_qr_link(idEnterprise, idForm, url_form)
    form_link_val.qr_path = path
    form_link_val.save()

    return form_link_val

def send_link_shared(option, to_list, data_token_link, data = [], name_form= '', name_enterprise = '', img = '', name_enterprise_v2 = ''):
    # Opciones de envio
    limit_link = ''
    if option == '1':
        url_form =  settings.URL_FRONTEND + 'public/' + data_token_link.token_link

        if data_token_link.date_state:
            limit_link = 'El documento tiene una fecha máxima de envió hasta ' + str(data_token_link.max_date)

        html_message = ('Hola, se te a compartido el siguiente documento: <b>' + name_form + '</b>, ' +
            'por favor diligencialo por medio de este enlace ' + url_form + '.<br> ' +
            'Recuerda diligenciarlo lo más pronto posible, gracias. <br>' + limit_link)
        if 'qr' in data and data['qr'] != '':
            html_message += '<br><br><img style="width: 150px;" src="' + settings.URL + 'media/' + str(data_token_link.qr_path) + '">'
        send_email('DOCUMENTO COMPARTIDO POR ' + name_enterprise, '', to_list, html_message, img)
    elif option == '2':
        url_form =  settings.URL_FRONTEND + 'public/' + data_token_link.token_link
        if data_token_link.date_state:
            limit_link = 'El documento tiene una fecha máxima de envió hasta ' + str(data_token_link.max_date)

        message = ('DOCUMENTO COMPARTIDO POR ' + name_enterprise + '. ' +
            'Hola, se te a compartido el siguiente documento: ' + name_form + ', ' +
            'por favor diligencialo por medio de este enlace ' + url_form + ' ' +
            'recuerda diligenciarlo lo mas pronto posible, gracias. ' + limit_link)
        Sms.send(to_list, message)
    elif option == '3':
        url_form =  settings.URL_FRONTEND + 'public/' + data_token_link.token_link
        if data_token_link.date_state:
            limit_link = 'El documento tiene una fecha máxima de envió hasta ' + str(data_token_link.max_date)

        send_whatsapp_msg_v2(to_list, name_enterprise, name_form, url_form, name_enterprise_v2, img)

    return True

def create_qr_link(enterprise, form, url):
    # Crear QR
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + ".png"
    folder = str(enterprise) + '/QR/' + str(form) + '/'
    path = settings.MEDIA_ROOT + '/' + folder

    if not os.path.exists(path):
        os.makedirs(path)
    path += name

    create_qr(url, path)

    return folder + name