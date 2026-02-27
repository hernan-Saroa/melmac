from django.core.mail import send_mail
from django.core.mail import EmailMultiAlternatives
from django.core.mail.backends.smtp import EmailBackend

from django.conf import settings
from rest_framework.response import Response

def sendgrid():
    response = {}
    response['status'] = False
    try:
        mail = EmailMultiAlternatives(
          subject="Your Subject",
          body="This is a simple text email body.",
          from_email="Universidad Ecci <consultorio@saroa.co>",
          to=["marlon@saroa.co"],
          headers={"Reply-To": "mmarlon@saroa.co"}
        )

        mail.attach_alternative(
            "<p>This is a simple HTML email body</p>", "text/html"
        )

        mail.send()
    except Exception as e:
         print('send_mail ::::::::::::::::: ' + str(e))
    return Response(response)


def send_email_enterprise(subject, html_message, recipient_list, enterprise_data=None):
    if enterprise_data:
        # Si se tiene la configuracion SMTP del usuario se asigna el remitente.
        from_email = enterprise_data['username']

        # Se crea la conexion al servidor SMTP con los datos provistos
        connection = EmailBackend(
            host=enterprise_data['host'],
            port=enterprise_data['port'],
            username=enterprise_data['username'],
            password=enterprise_data['password'],
            use_tls=enterprise_data['use_tls'],
        )

        # Se realiza el envio del correo con la conexion provista
        try:
            send_mail(
                subject=subject,
                message='',
                html_message=html_message,
                from_email=from_email,
                recipient_list=recipient_list,
                connection=connection,
                fail_silently=False
            )
        except Exception as e:
            print('send_mail ::::::::::::::::: ' + str(e))
            raise Exception('Hubo un problema con la configuración SMTP provista.')
    else:
        # Envio estandar de Email
        from_email = settings.EMAIL_HOST_USER
        try:
            send_mail(
                subject=subject,
                message='',
                html_message=html_message,
                from_email=from_email,
                recipient_list=recipient_list
            )
        except Exception as e:
            print('send_mail ::::::::::::::::: ' + str(e))
            raise Exception('Hubo un problema con el envio de correo, por favor contacta con soporte.')