from email.policy import default
from django.db import models
from datetime import datetime
from django.contrib.auth.models import User, Permission
from django.core.validators import MaxValueValidator, MinValueValidator

class Theme(models.Model):
    name = models.CharField(max_length=30)

    def __str__(self):
        return self.name

def enterprise_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/{1}'.format(instance.id, name)

class Enterprise(models.Model):
    theme = models.ForeignKey(Theme, on_delete=models.CASCADE)
    logo = models.FileField(upload_to=enterprise_directory_path, null=True, blank=True)
    name = models.CharField(max_length=40, blank=True)
    website = models.CharField(max_length=50, blank=True)
    nit = models.CharField(max_length=20, blank=True)
    rut = models.FileField(upload_to=enterprise_directory_path, null=True, blank=True)
    camara_comercio = models.FileField(upload_to=enterprise_directory_path, null=True, blank=True)
    confidencialidad = models.FileField(upload_to=enterprise_directory_path, null=True, blank=True)
    tratamiento_datos = models.FileField(upload_to=enterprise_directory_path, null=True, blank=True)
    certificado_digital = models.FileField(upload_to=enterprise_directory_path, null=True, blank=True)
    acronym = models.CharField(max_length=20, blank=True, null=True)
    login_page_state = models.BooleanField(default=False, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    max_users = models.IntegerField(default=20)
    serial = models.CharField(max_length=4, unique=True, null=True)
    state = models.BooleanField(default=True)
    api_key = models.CharField(max_length=60, null=True)
    public_color = models.CharField(max_length=60, null=True)
    public_color_Text = models.CharField(max_length=60, null=True)
    public_color_text_title = models.CharField(max_length=60, null=True)
    public_color_header_title = models.CharField(max_length=60, null=True)
    public_color_footer = models.CharField(max_length=60, null=True)
    public_color_footer_title = models.CharField(max_length=60, null=True)
    visit_form = models.IntegerField(null=True)
    token_link = models.CharField(max_length=100, default='') # Token de la empresa para compartir
    answer_to = models.CharField(max_length=80, default='')
    email_title = models.CharField(max_length=80, default='')

    def __str__(self):
        return str(self.id)

class Type_Identification(models.Model):
    name = models.CharField(max_length=30)

    def __str__(self):
        return self.name

class Permit(models.Model):
    name = models.CharField(max_length=30)
    auth_permission = models.ForeignKey(Permission, on_delete=models.CASCADE, null=True)
    view = models.CharField(max_length=50, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Permit_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    description = models.TextField()
    permit_type = models.ForeignKey(Permit, on_delete=models.CASCADE)
    modify_date = models.DateTimeField(auto_now=True)
    status = models.BooleanField(default=True)

    class Meta:
        unique_together = (('enterprise', 'permit_type'))

class Role_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=30)
    description = models.CharField(max_length=200)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    time_zone = models.CharField(default="08:00*%*18:00", max_length=100)
    is_admin = models.BooleanField(default=False)
    view_all = models.BooleanField(default=False)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Permit_Role(models.Model):
    permit = models.ForeignKey(Permit_Enterprise, on_delete=models.CASCADE)
    role_enterprise = models.ForeignKey(Role_Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Role(models.Model):
    name = models.CharField(max_length=30)
    description = models.CharField(max_length=200)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

def user_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/{1}/{2}'.format(instance.enterprise.id, instance.id, name)

class User_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    first_name = models.CharField(max_length=20)
    middle_name = models.CharField(max_length=20, null=True)
    first_last_name = models.CharField(max_length=20)
    second_last_name = models.CharField(max_length=20, null=True)
    type_identification = models.ForeignKey(Type_Identification, on_delete=models.CASCADE)
    identification = models.BigIntegerField(null=False)
    phone = models.BigIntegerField(null=False)
    email = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    image = models.FileField(upload_to=user_directory_path, null=True, blank=True)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    role_enterprise = models.ForeignKey(Role_Enterprise, on_delete=models.CASCADE, null=True)
    login_count = models.IntegerField(default=0)
    token = models.CharField(max_length=40, null=True)
    register_state = models.BooleanField(default=True)
    register_platform  = models.IntegerField(default=0)
    register_admin = models.BooleanField(default=True)
    login_state = models.BooleanField(default=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    class Meta:
        unique_together = (('enterprise', 'email'),)

    def __str__(self):
        return str(self.identification)

class Parameter(models.Model):
    name = models.CharField(max_length=30)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Parameter_Enterprise(models.Model):
    parameter = models.ForeignKey(Parameter, on_delete=models.CASCADE)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    value = models.CharField(max_length=200)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.value

class Value_Parameter(models.Model):
    parameter = models.ForeignKey(
        Parameter, on_delete=models.CASCADE
    )
    description = models.CharField(max_length=30)
    value = models.CharField(max_length=200)

    def __str__(self):
        return self.value

class Category_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=30)
    description = models.CharField(max_length=200)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Category_User(models.Model):
    category_enterprise = models.ForeignKey(Category_Enterprise, on_delete=models.CASCADE)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Traceability_User(models.Model):
    """
    El grupo especificara a que objecto se le esta haciendo la acción.
    El elemento es el id del objeto al que se le realiza la acción.

    action
    1: Crear
    2: Modificar
    3: Eliminar
    4: Inicio de sesión
    5: Video_match
    6: Image_match
    7: listas restrictivas
    8: Enrolamiento de usuario
    9: Escaneo de documento
    10: OCR
    11: Validacion de SMS
    """
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    group = models.IntegerField(null=False)
    element = models.CharField(max_length=100)
    action = models.IntegerField(null=False)
    description = models.TextField()
    creation_date = models.DateTimeField(auto_now_add=True)
    extra = models.TextField(null=True)

    def __str__(self):
        return str(self.action)

class Authentication(models.Model):
    name = models.CharField(max_length=40)
    description = models.CharField(max_length=500)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Authentication_User(models.Model):
    authentication = models.ForeignKey(Authentication, on_delete=models.CASCADE)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    content = models.CharField(max_length=500)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Chat_User(models.Model):
    from_user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    to_user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, related_name='to_user')
    message = models.CharField(max_length=500)
    creation_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.message

class Type_Device(models.Model):
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=500, null=True)
    icon = models.CharField(null=True, max_length=50)
    color = models.CharField(null=True, max_length=7)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Device_Enterprise(models.Model):
    type_device = models.ForeignKey(Type_Device, on_delete=models.CASCADE)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    mac = models.CharField(max_length=20, blank=True, default="")
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Route_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Point_Route(models.Model):
    route_enterprise = models.ForeignKey(Route_Enterprise, on_delete=models.CASCADE)
    position = models.IntegerField()
    latitude = models.CharField(max_length=40)
    longitude = models.CharField(max_length=40)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.position)

class Follow_User(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    latitude = models.CharField(max_length=40)
    longitude = models.CharField(max_length=40)
    creation_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Conference_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    date = models.DateField()
    hour = models.TimeField()
    duration = models.DurationField()
    token = models.CharField(max_length=10)
    code = models.CharField(max_length=10)
    status = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.date)

class Participant_Conference(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    conference_enterprise = models.ForeignKey(Conference_Enterprise, on_delete=models.CASCADE)
    status = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Record_Conference(models.Model):
    conference_enterprise = models.ForeignKey(Conference_Enterprise, on_delete=models.CASCADE)
    code_reference = models.CharField(max_length=30)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.code_reference)

def media_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/{1}/{2}/{3}'.format(
        instance.record_conference.conference_enterprise.enterprise.id,
        instance.record_conference.conference_enterprise.id,
        instance.record_conference.id,
        name
    )

class Media_Record(models.Model):
    record_conference = models.ForeignKey(Record_Conference, on_delete=models.CASCADE)
    code_media = models.CharField(max_length=30)
    media_type = models.CharField(max_length=10, null=True)
    size = models.IntegerField(null=True)
    duration = models.IntegerField(null=True)
    format = models.CharField(max_length=15, null=True)
    track_name = models.CharField(max_length=45, null=True)
    file_media = models.FileField(upload_to=media_directory_path, null=True, blank=True)
    url = models.CharField(max_length=200, null=True)
    status = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Enterprise_Alert(models.Model):
    """
    Type: Define que tipo de alerta es y como se muestra al usuario(1 -Sonido, 2 - Alerta de pantalla completa o 3 - Notificación)
    """
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    token = models.CharField(max_length=20)
    code = models.CharField(max_length=20)
    type = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.type)

# class Template_Theme(models.Model):
#     name = models.CharField(max_length=30)

#     def __str__(self):
#         return self.name

def form_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/form/{1}/{2}'.format(
        instance.enterprise.id,
        instance.id,
        name
    )

class Form_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    version = models.IntegerField(default=1)
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=1000)
    logo_path = models.FileField(upload_to=form_directory_path, null=True, blank=True)
    visible = models.BooleanField(default=True)
    editable = models.BooleanField(default=True)
    consecutive = models.BooleanField(default=False)
    digital = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    theme = models.IntegerField(default=0)
    color = models.CharField(max_length=10, default='')
    pin = models.CharField(max_length=10, default='')
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

def qr_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/QR/{1}/{2}'.format(
        instance.form_enterprise.enterprise.id,
        instance.form_enterprise.id,
        name
    )

class Form_Version(models.Model):
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    version = models.IntegerField(default=1)
    json_data = models.TextField()

    def __str__(self):
        return str(self.id)

class Form_Consecutive(models.Model):
    form_enterprise = models.ForeignKey(
        Form_Enterprise, on_delete=models.CASCADE, related_name='%(class)s_padre'
    )
    form = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    version = models.IntegerField(default=1)
    position = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

def digital_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/digital/{1}/{2}'.format(
        instance.form_enterprise.enterprise.id,
        instance.form_enterprise.id,
        name
    )

class Form_Digital(models.Model):
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    template = models.FileField(upload_to=digital_directory_path, null=True, blank=True)
    status = models.IntegerField(default=0)

    def __str__(self):
        return str(self.status)

class Role_Form(models.Model):
    role = models.ForeignKey(Role_Enterprise, on_delete=models.CASCADE)
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class User_Form(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Field_Type(models.Model):
    name = models.CharField(max_length=30)
    description = models.CharField(max_length=50)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Option(models.Model):
    value = models.CharField(max_length=40)

    def __str__(self):
        return self.value

class Form_Field(models.Model):
    field_type = models.ForeignKey(Field_Type, on_delete=models.CASCADE)
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    position = models.IntegerField()
    name = models.CharField(max_length=100)
    help = models.CharField(max_length=5000, null=True)
    obligatory = models.BooleanField(default=True)
    row = models.IntegerField(default=0)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)
    obligatory_visit = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class List_Field(models.Model):
    form_field = models.ForeignKey(Form_Field, on_delete=models.CASCADE)
    field_type = models.ForeignKey(Field_Type, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    position = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Option_List_Field(models.Model):
    list_field = models.ForeignKey(List_Field, on_delete=models.CASCADE)
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    position = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Form_Field_Consecutive(models.Model):
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    form_field_get = models.ForeignKey(
        Form_Field, on_delete=models.CASCADE, related_name='%(class)s_padre'
    )
    form_field_set = models.ForeignKey(
        Form_Field, on_delete=models.CASCADE
    )
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Digital_Field(models.Model):
    form_digital = models.ForeignKey(
        Form_Digital, on_delete=models.CASCADE
    )
    form_field = models.ForeignKey(
        Form_Field, on_delete=models.CASCADE
    )
    page = models.IntegerField()
    left = models.CharField(max_length=20)
    top = models.CharField(max_length=20)
    font = models.CharField(max_length=15)
    size = models.IntegerField()
    color = models.CharField(max_length=7)
    bold = models.BooleanField(default=False)
    italic = models.BooleanField(default=False)
    underline = models.BooleanField(default=False)
    width = models.CharField(max_length=5)
    height = models.CharField(max_length=5)
    line_height = models.CharField(max_length=5, default='')
    option = models.IntegerField(default=0)
    option_value = models.IntegerField(null=True)
    row_field = models.IntegerField(default=1)
    list_field = models.IntegerField(null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.state)

class Parameter_Validate(models.Model):
    name = models.CharField(max_length=20)
    description = models.CharField(max_length=50)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Form_Field_Parameter(models.Model):
    form_field = models.ForeignKey(Form_Field, on_delete=models.CASCADE)
    parameter_validate = models.ForeignKey(Parameter_Validate, on_delete=models.CASCADE)
    value = models.CharField(max_length=1000)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.value

class Option_Field(models.Model):
    form_field = models.ForeignKey(Form_Field, on_delete=models.CASCADE)
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    position = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Field_Condition(models.Model):
    field_father = models.ForeignKey(Form_Field, on_delete=models.CASCADE)
    field_son = models.ForeignKey(Form_Field, on_delete=models.CASCADE, related_name='field_son')
    type = models.IntegerField()
    extra = models.CharField(max_length=60)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Serial_Number(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    serial = models.IntegerField(default=1)
    count = models.IntegerField()

    def __str__(self):
        return str(self.id)

class Answer_Form(models.Model):
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    form_version = models.IntegerField(default=1)
    created_by = models.ForeignKey(
        User_Enterprise, null=True, on_delete=models.CASCADE
    )
    serial_number = models.ForeignKey(Serial_Number, on_delete=models.CASCADE, null=True)
    source = models.IntegerField()
    online = models.BooleanField(default=True)
    public = models.BooleanField(default=False)
    consecutive = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    time_stamp = models.DateTimeField(auto_now_add=True, null=True)
    longitude = models.FloatField(null=True)
    latitude = models.FloatField(null=True)
    doc_hash = models.TextField(null=True, default=None)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

# cause {0: unica}
class Validate_Answer_Form(models.Model):
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    show = models.BooleanField(default=False)
    cause = models.IntegerField(default=0)
    modify_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.id)

class Answer_Consecutive(models.Model):
    form_consecutive = models.ForeignKey(
        Form_Enterprise, on_delete=models.CASCADE
    )
    form_version = models.IntegerField(default=1)
    created_by = models.ForeignKey(
        User_Enterprise, null=True, on_delete=models.CASCADE
    )
    serial_number = models.ForeignKey(Serial_Number, on_delete=models.CASCADE, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    source = models.IntegerField(default=1)
    online = models.BooleanField(default=True)
    public = models.BooleanField(default=False)
    longitude = models.FloatField(null=True)
    latitude = models.FloatField(null=True)
    doc_hash = models.TextField(null=True, default=None)
    status = models.IntegerField(default=0)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Document_Identification(models.Model):
    form = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    data_form = models.CharField(max_length=60000)
    form_field = models.ForeignKey(Form_Field, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.data_form

class Answer_Form_Consecutive(models.Model):
    answer_consecutive = models.ForeignKey(Answer_Consecutive, on_delete=models.CASCADE)
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Answer_Field(models.Model):
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    form_field = models.ForeignKey(Form_Field, on_delete=models.CASCADE)
    value = models.TextField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Contact_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    category = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Contact_Comm(models.Model):
    contact_enterprise = models.ForeignKey(Contact_Enterprise, on_delete=models.CASCADE)
    type = models.IntegerField()
    info = models.CharField(max_length=100)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Enterprise_Event(models.Model):
    """
    Icon: Icono de una selección limitada (1- Robo, 2- Asalto, 3- Persona Sospechosa)
    Priority: Que tan prioritaria seria el actuar ante una denuncia de este tipo (1- No mucha, 5- Respuessta Inmediata)
    """
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    icon = models.IntegerField()
    color = models.CharField(max_length=10)
    priority = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Notification_User(models.Model):
    """
    Type: Tipo de Notificación (1- Critica, 2- Advertencia, 3- Informativa, 4- Exito, 5- Otro)
    Status: Estado de la notificación (0-No leido, 1- Visto, 2- Eliminado)
    """
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    title = models.CharField(max_length=20)
    type = models.IntegerField()
    description = models.CharField(max_length=200)
    status = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    extra = models.TextField(null=True)

    def __str__(self):
        return str(self.id)

class Profile(models.Model):
    # enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    identification = models.BigIntegerField()
    type_identification = models.ForeignKey(Type_Identification, on_delete=models.CASCADE)
    email = models.CharField(max_length=50, default='')
    phone = models.BigIntegerField(null=False)
    lookout_count = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)
    # user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    restrictive_lists = models.CharField(max_length=60000)
    token_autorization = models.IntegerField()

    def __str__(self):
        return str(self.identification)

class Profile_Enterprise(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    last_searched = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

    class Meta:
        unique_together = (('enterprise', 'profile'),)

def profile_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/{1}/{2}/{3}'.format(
        instance.profile.enterprise.id,
        'profile',
        instance.profile.id,
        name
    )

class Profile_document(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    identification = models.BigIntegerField()
    type_identification = models.ForeignKey(Type_Identification, on_delete=models.CASCADE)
    email = models.CharField(max_length=50, default='')
    phone = models.BigIntegerField(null=False)
    lookout_count = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    token_autorization = models.IntegerField()
    restrictive_lists = models.TextField(default='')
    token_url = models.TextField()
    hash_info = models.TextField()
    answer = models.ForeignKey(Answer_Field, on_delete=models.CASCADE, null=True)
    qr_file = models.CharField(max_length=200, default='')

    def __str__(self):
        return str(self.identification)

class Profile_Image(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    image = models.FileField(upload_to=profile_directory_path, null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Profile_Record(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    date = models.DateTimeField()
    type = models.IntegerField()
    description = models.CharField(max_length=200)
    search_date = models.DateTimeField()
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)

class Map_Capture(models.Model):
    created_by = models.ForeignKey(Profile, on_delete=models.CASCADE)
    image = models.FileField(upload_to=profile_directory_path, null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Api_Detail(models.Model):
    '''Aqui se realiza el registro de las APIs con costos para que sea listado para los usuarios.'''
    name = models.CharField(max_length=100)
    description = models.CharField(max_length=200)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Api_Usage(models.Model):
    '''En este apartado se genera el limitante de consumo de APIs por empresa, esta información solo la ve y controla el super administrador,
    mientras el administrador de empresa solo puede consultar esta información.'''
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, null=True)
    api = models.ForeignKey(Api_Detail, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    limit = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

    class Meta:
        unique_together = (('enterprise', 'api'),)

class Api_Packages(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE, null=True)
    api = models.ForeignKey(Api_Detail, on_delete=models.CASCADE)
    limit = models.IntegerField()
    used = models.IntegerField()
    state = models.BooleanField()
    creation_date = models.DateTimeField(auto_now_add=True)


class Data_Column(models.Model):
    source = models.CharField(max_length=200)
    name = models.CharField(max_length=20)
    type = models.IntegerField()
    date = models.DateTimeField()

    def __str__(self):
        return str(self.id)

class Api_Registry(models.Model):
    '''
    Aqui se registra en su totalidad los resultados de las APIs, guardando el estado de la consulta:
    - 200 OK
    - 4xx-5xx Fallido

    Type_consume:
    - 0: Gratis
    - 1: Descontado de Paquete
    - 2: Pendiente
    En el campo de value se guarda toda la respuesta para poder incluirla en logs para los usuarios llegado el caso.
    '''
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    api = models.ForeignKey(Api_Detail, on_delete=models.CASCADE)
    status = models.IntegerField(default=0)
    value = models.TextField()
    type_consume = models.IntegerField(default=0)
    consume_pkg = models.ForeignKey(Api_Packages, on_delete=models.CASCADE, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)

class Device_Registry(models.Model):
    device = models.ForeignKey(Device_Enterprise, on_delete=models.CASCADE)
    column = models.ForeignKey(Data_Column, on_delete=models.CASCADE)
    value = models.CharField(max_length=200)
    date = models.DateTimeField()

    def __str__(self):
        return str(self.id)

class System_Log(models.Model):
    '''
    Modelo para Logs del sistema

    Se guardan por:
     - empresa
     - accion realizada p. ej. (API ANI, API BIOFACIAL, Envio Form, etc.)
     - fuente
       - 1 Servidor
       - 2 Movil
     - tipo
       - 1 trace
       - 2 debug
       - 3 info
       - 4 warn
       - 5 error
       - 6 fatal
     - url del servicio (sea interno o externo)
     - data enviada en el servicio
     - data con la que se respondio (si hubo)
     - fecha del suceso
    '''
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    action = models.TextField()
    source = models.IntegerField(default=0)
    type = models.IntegerField()
    url = models.TextField()
    data = models.TextField()
    response_data = models.TextField(null=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)

class Sms_Token(models.Model):
    token = models.BigIntegerField()
    phone_user = models.BigIntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.IntegerField()
    status = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

def template_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/{1}'.format(instance.enterprise.id, name)

class Massive_File(models.Model):
    '''
    El type se divide en los que sean necesarios, seguramente tendran carga masiva de

    1- Usuarios
    2- Dispositivos
    3- Rutas
    4- Formulario con Respuestas
    5- GeoPortal
    '''
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    template = models.FileField(upload_to=template_directory_path, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    type = models.IntegerField(default=0)
    amount = models.IntegerField()
    success = models.IntegerField(default=0)
    error = models.IntegerField(default=0)
    status = models.IntegerField(default=0)

    def __str__(self):
        return str(self.date)

def route_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/route/{1}/{2}'.format(
        instance.enterprise.id,
        instance.id,
        name
    )

class Route(models.Model):
    """El estado (status) se manejara de la siguiente manera

        1 - JSON generado
        2 - Direcciones en Sistema
        3 - Esperando confirmación de rutas generadas
        4 - Esperando asignación de mensajero a ruta

    """
    massive_file = models.ForeignKey(Massive_File, on_delete=models.CASCADE)
    json_path = models.FileField(upload_to=route_directory_path, null=True, blank=True)
    status = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.status)

class Massive_User(models.Model):
    massive_file = models.ForeignKey(
        Massive_File, on_delete=models.CASCADE
    )
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.user)

class Massive_Device(models.Model):
    massive_file = models.ForeignKey(
        Massive_File, on_delete=models.CASCADE
    )
    device = models.ForeignKey(Device_Enterprise, on_delete=models.CASCADE)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.user)

class Massive_Errors(models.Model):
    massive_file = models.ForeignKey(
        Massive_File, on_delete=models.CASCADE
    )
    row = models.IntegerField()
    data = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.row)


class Country(models.Model):
    name = models.CharField(max_length=50)
    code = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Region(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    code = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class City(models.Model):
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True)
    name = models.CharField(max_length=50)
    code = models.IntegerField(null=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Address_Zone(models.Model):
    name = models.CharField(max_length=30)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Address_Locality(models.Model):
    name = models.CharField(max_length=50)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    zone = models.ForeignKey(Address_Zone, on_delete=models.CASCADE)
    subzone = models.ForeignKey(Address_Zone, on_delete=models.CASCADE, related_name="subzone")
    code = models.IntegerField(null=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Address_UPZ(models.Model):
    locality = models.ForeignKey(Address_Locality, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    code = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Address_Neighborhood(models.Model):
    upz = models.ForeignKey(Address_UPZ, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Address_Order(models.Model):
    upz = models.ForeignKey(Address_UPZ, on_delete=models.CASCADE)
    order = models.IntegerField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Project_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    identifier = models.CharField(max_length=10)
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=300, blank=True, default="")
    form = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE, null=True, default=None)
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = (('enterprise', 'identifier'),)


class Location_Enterprise(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=128)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    address = models.CharField(max_length=128)
    lat = models.FloatField()
    lon = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    modified_at = models.DateTimeField(auto_now_add=True)
    is_default = models.BooleanField(default=False)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

    class Meta:
        unique_together = (('enterprise', 'address'),)


class Enterprise_Processs(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=128)
    description = models.CharField(max_length=256, default='')
    state = models.BooleanField(default=True)

    class Meta:
        unique_together = (('enterprise', 'name'))

    def __str__(self):
        return str(self.id)

class Enterprise_Process_State(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    process = models.ForeignKey(Enterprise_Processs, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=200)
    order = models.IntegerField()
    custom = models.BooleanField(default=False)
    cancel = models.BooleanField(default=False)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Form_Link(models.Model):
    form_enterprise = models.ForeignKey(Form_Enterprise, on_delete=models.CASCADE)
    token_link = models.CharField(max_length=100, default='')
    access = models.IntegerField(default=1)
    max_date = models.DateField(null=True)
    date_state = models.BooleanField(default=False)
    max_send = models.IntegerField(default=0)
    send_state = models.BooleanField(default=False)
    modify_date = models.DateTimeField(auto_now=True)
    qr_path = models.FileField(upload_to=qr_directory_path, null=True, blank=True)
    state = models.BooleanField(default=True)
    shared_media = models.CharField(max_length=200, null=True)
    shared_to = models.CharField(max_length=60, null=True)
    general_shared = models.BooleanField(default=True)
    process_state = models.ForeignKey(Enterprise_Process_State, on_delete=models.CASCADE, default=20)

    def __str__(self):
        return self.token_link

class Enterprise_Service(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    route_file = models.ForeignKey(Route, on_delete=models.CASCADE, null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

def service_capture_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = 'optimal_route' + "." + ext
    return '{0}/service/{1}/{2}'.format(
        instance.service.enterprise.id,
        instance.service.id,
        name
    )


class Service_Detail(models.Model):
    service = models.ForeignKey(Enterprise_Service, on_delete=models.CASCADE)
    initial_position = models.ForeignKey(Location_Enterprise, on_delete=models.CASCADE)
    process_state = models.ForeignKey(Enterprise_Process_State, on_delete=models.CASCADE)
    location_quantity = models.IntegerField()
    total_distance = models.FloatField()
    api_route = models.CharField(max_length=300, null=True, blank=True)
    optimal_capture = models.FileField(upload_to=service_capture_directory_path, null=True, blank=True)
    name = models.CharField(max_length=200, default= "Servicio de entrega")
    description = models.CharField(max_length=200, default= "Sin descripción")
    initial_addres = models.CharField(max_length=200)

    def __str__(self):
        return str(self.id)

class Service_Location(models.Model):
    service = models.ForeignKey(Enterprise_Service, on_delete=models.CASCADE)
    route_file = models.ForeignKey(Route, on_delete=models.CASCADE, null=True)
    order = models.IntegerField()
    address = models.CharField(max_length=128)
    address_normalized = models.CharField(max_length=128)
    comment = models.CharField(max_length=200)
    comment_address = models.CharField(max_length=200)
    user_name = models.CharField(max_length=128)
    user_email = models.CharField(max_length=50)
    user_phone_number = models.CharField(max_length=13)
    user_id_number = models.CharField(max_length=20, null=True)
    guide_number = models.CharField(max_length=30)
    guide_number_internal = models.CharField(max_length=30, null=True)
    project = models.ForeignKey(Project_Enterprise, on_delete=models.CASCADE, null=True)
    country = models.ForeignKey(Country, on_delete=models.CASCADE)
    region = models.ForeignKey(Region, on_delete=models.CASCADE, null=True)
    city = models.ForeignKey(City, on_delete=models.CASCADE)
    locality = models.ForeignKey(Address_Locality, on_delete=models.CASCADE, null=True)
    neighborhood = models.ForeignKey(Address_Neighborhood, on_delete=models.CASCADE, null=True)
    upz = models.ForeignKey(Address_UPZ, on_delete=models.CASCADE, null=True)
    zipcode = models.IntegerField(null=True)
    latitude = models.FloatField()
    longitude = models.FloatField()
    process_state = models.ForeignKey(Enterprise_Process_State, on_delete=models.CASCADE)
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE, null=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Service_User(models.Model):
    service = models.ForeignKey(Service_Location, on_delete=models.CASCADE)
    distance = models.FloatField()
    distance_api = models.CharField(max_length=300)
    time_api = models.CharField(max_length=300)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    process_state = models.ForeignKey(Enterprise_Process_State, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Service_Trazability(models.Model):
    process = models.ForeignKey(Enterprise_Processs, on_delete=models.CASCADE) # Reference for type Service or Service_Location
    group = models.IntegerField(null=False, default=1) # Reference of Tabla
    reference = models.IntegerField() # Id of Service or Service_Location
    description = models.CharField(max_length=300, default='')
    creation_date = models.DateTimeField(auto_now_add=True)
    date_trace = models.CharField(max_length=50)
    hour_trace = models.CharField(max_length=50)
    latitude = models.FloatField()
    longitude = models.FloatField()
    process_state = models.ForeignKey(Enterprise_Process_State, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Variable_Plataform(models.Model):
    name = models.CharField(max_length=30)
    value = models.TextField()

    def __str__(self):
        return self.name

def geoportal_directory_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/geo/{1}_{2}'.format(
        instance.enterprise.id,
        instance.id,
        name
    )

class Geo_Portal(models.Model):
    '''
    El estado (status) se manejara de la siguiente manera
        0 - En procesamiento
        1 - Finalizada la carga
        2 - JSON generado
        3 - Con error
    '''
    massive_file = models.ForeignKey(
        Massive_File, on_delete=models.CASCADE
    )
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=300)
    json_path = models.CharField(max_length=300, null=True, blank=True)
    created_by = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)
    status = models.IntegerField(default=0)

    def __str__(self):
        return str(self.id)

def sign_doc_directory_path(enterprise, answer_id, include_path=False):
    ext = 'pdf'
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    if include_path:
        return  '{0}/sign_doc/'.format(
            enterprise
        ), '{0}/sign_doc/{1}_{2}'.format(
            enterprise,
            answer_id,
            name
        )
    return '{0}/sign_doc/{1}_{2}'.format(
        enterprise,
        answer_id,
        name
    )


class Signed_Document(models.Model):
    '''
    Estructura para guardar los documentos que se necesitan firmados con estampa de tiempo.
    '''
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    pdf_path = models.CharField(max_length=100)
    created_by = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    date = models.DateTimeField(auto_now_add=True)
    status = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Signed_Document_Consecutive(models.Model):
    '''
    Estructura para guardar los documentos que se necesitan firmados con estampa de tiempo.
    '''
    answer_consecutive = models.ForeignKey(Answer_Consecutive, on_delete=models.CASCADE)
    pdf_path = models.CharField(max_length=100)
    created_by = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    date = models.DateTimeField(auto_now_add=True)
    status = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Sign_Profile_Document(models.Model):
    '''
    Estructura para guardar la relación entre el campo respuesta y la inscripción de las personas
    a la hora de firmar.
    '''
    profile = models.ForeignKey(Profile, on_delete=models.CASCADE)
    token_url = models.TextField(default='')
    hash_info = models.TextField(default='')
    answer = models.ForeignKey(Answer_Field, on_delete=models.CASCADE, null=True)
    qr_file = models.CharField(max_length=200, null=True)
    restrictive_lists = models.TextField(default='')
    token_registry = models.TextField(default='')
    date = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return str(self.id)

class Sign_Email(models.Model):
    '''
    Estructura para guardar la relación entre el campo manuscrito y el correo electronico.
    '''
    answer_field = models.ForeignKey(Answer_Field, on_delete=models.CASCADE, null=True)
    email = models.CharField(max_length=100)
    creation_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.id)


class Sign_OTP_Document(models.Model):
    email = models.CharField(max_length=100)
    token_url = models.TextField(default='')
    hash_info = models.TextField(default='')
    answer = models.ForeignKey(Answer_Field, on_delete=models.CASCADE, null=True)
    qr_file = models.CharField(max_length=200, null=True)
    token_registry = models.TextField(default='')
    date = models.DateTimeField(auto_now_add=True, null=True)

    def __str__(self):
        return str(self.id)


class Device_Info_Movil(models.Model):
    product = models.CharField(max_length=100)
    model = models.CharField(max_length=100)
    brand = models.CharField(max_length=100)
    serial = models.CharField(max_length=100)
    version = models.CharField(max_length=100)
    battery = models.IntegerField()
    gps = models.BooleanField(default=True)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    version_app = models.CharField(max_length=100)
    last_update = models.DateTimeField(auto_now=True)
    last_conection  = models.DateTimeField()
    permission_location = models.IntegerField()

    def __str__(self):
        return str(self.id)


class Follow_User_Offline(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    latitude = models.CharField(max_length=40)
    longitude = models.CharField(max_length=40)
    creation_date = models.DateTimeField(auto_now_add=False)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Envelope_Enterprise(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE, null=True)
    version = models.IntegerField(default=1)
    name = models.CharField(max_length=100)
    pin = models.CharField(max_length=10, default='')
    creation_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Envelope_Version(models.Model):
    """
    Tabla para mantener las versiones con sus cambios y tener control de los estados en los que se encuentra el sobre.

    Estados:

    - 0 -> En construccion
    - 1 -> En Verificacion
    - 2 -> Finalizado
    """
    envelope_enterprise = models.ForeignKey(Envelope_Enterprise, on_delete=models.CASCADE)
    version = models.IntegerField(default=1)
    flow_type = models.IntegerField(default=1)
    order_important = models.BooleanField(default=False)
    respect_participant = models.BooleanField(default=False)
    autosave = models.BooleanField(default=False)
    message_type = models.IntegerField(default=1)
    subject = models.CharField(max_length=100, null=True)
    content = models.TextField(null=True)
    sms = models.BooleanField(default=False)
    ws = models.BooleanField(default=False)
    limit_date = models.DateTimeField(null=True)
    limit_alert = models.BooleanField(default=False)
    limit_time = models.IntegerField(default=30)
    checker = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    status = models.IntegerField(default=0)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

def env_version_template_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/envelope/{1}/{2}/{3}'.format(
        instance.envelope_version.envelope_enterprise.user.enterprise.id,
        instance.envelope_version.envelope_enterprise.id,
        instance.envelope_version.id,
        name
    )

class Envelope_Version_Form(models.Model):
    envelope_version = models.ForeignKey(Envelope_Version, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    template = models.FileField(upload_to=env_version_template_path, null=True, blank=True)
    position = models.IntegerField(default=1)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Element_Type_Config(models.Model):
    name = models.CharField(max_length=50)
    description = models.CharField(max_length=100)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.name

class Env_Digital_Element(models.Model):
    envelope_version_form = models.ForeignKey(Envelope_Version_Form, on_delete=models.CASCADE)
    element_type_config = models.ForeignKey(Element_Type_Config, on_delete=models.CASCADE)
    label = models.CharField(max_length=5000, null=True)
    url_src = models.CharField(max_length=5000, null=True)
    page = models.IntegerField()
    left = models.CharField(max_length=20)
    top = models.CharField(max_length=20)
    font = models.CharField(max_length=15)
    size = models.IntegerField()
    color = models.CharField(max_length=7)
    justify = models.CharField(max_length=15)
    bold = models.BooleanField(default=False)
    italic = models.BooleanField(default=False)
    underline = models.BooleanField(default=False)
    width = models.CharField(max_length=5)
    height = models.CharField(max_length=5)
    line_height = models.CharField(max_length=5, default='')
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.state)

class Env_Form_Field(models.Model):
    envelope_version_form = models.ForeignKey(Envelope_Version_Form, on_delete=models.CASCADE)
    field_type = models.ForeignKey(Field_Type, on_delete=models.CASCADE)
    position = models.IntegerField()
    name = models.CharField(max_length=50)
    help = models.CharField(max_length=5000, null=True)
    obligatory = models.BooleanField(default=True)
    row = models.IntegerField(default=0)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

class Env_Digital_Field(models.Model):
    env_form_field = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE)
    page = models.IntegerField()
    envelope_version_form_id = models.IntegerField(null=True)
    left = models.CharField(max_length=20)
    top = models.CharField(max_length=20)
    font = models.CharField(max_length=15)
    size = models.IntegerField()
    color = models.CharField(max_length=7)
    bold = models.BooleanField(default=False)
    italic = models.BooleanField(default=False)
    underline = models.BooleanField(default=False)
    width = models.CharField(max_length=5)
    height = models.CharField(max_length=5)
    line_height = models.CharField(max_length=5, default='')
    option = models.IntegerField(default=0)
    option_value = models.IntegerField(null=True)
    row_field = models.IntegerField(default=1)
    list_field = models.IntegerField(null=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.state)

class Env_Form_Field_Parameter(models.Model):
    env_form_field = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE)
    parameter_validate = models.ForeignKey(Parameter_Validate, on_delete=models.CASCADE)
    value = models.CharField(max_length=1000)
    state = models.BooleanField(default=True)

    def __str__(self):
        return self.value

class Env_Option_Field(models.Model):
    env_form_field = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE)
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    position = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Env_Field_Condition(models.Model):
    field_father = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE)
    field_son = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE, related_name='field_son')
    type = models.IntegerField()
    extra = models.CharField(max_length=20)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class External_User(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    name = models.CharField(max_length=100)
    email = models.CharField(max_length=50)
    phone_ind = models.CharField(max_length=10, default='+57-co')
    phone = models.CharField(max_length=100)
    state = models.BooleanField(default=True)
    creation_date = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (('email', 'phone_ind', 'phone', 'enterprise'))

    def __str__(self):
        return str(self.id)

class Envelope_User(models.Model):
    envelope_version = models.ForeignKey(Envelope_Version, on_delete=models.CASCADE)
    position = models.IntegerField(default=1)
    color = models.CharField(max_length=7)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Message_User(models.Model):
    envelope_user = models.ForeignKey(Envelope_User, on_delete=models.CASCADE)
    subject = models.CharField(max_length=100)
    content = models.TextField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Field_User(models.Model):
    envelope_user = models.ForeignKey(Envelope_User, on_delete=models.CASCADE)
    env_form_field = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.id)

class Answer_Envelope(models.Model):
    """
    Respuesta general del sobre

    Estados:
    - 0 -> Default
    - 1 -> Compartido
    - 2 -> En Verificacion
    - 3 -> En Diligenciamiento
    - 4 -> Pendiente Aprobación
    - 5 -> Vencido
    - 6 -> Rechazado
    - 7 -> Finalizado
    """
    envelope_version = models.ForeignKey(Envelope_Version, on_delete=models.CASCADE)
    serial_number = models.ForeignKey(Serial_Number, on_delete=models.CASCADE, null=True)
    public = models.BooleanField(default=False)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    doc_hash = models.TextField(null=True, default=None)
    token_link = models.CharField(max_length=100, default='')
    state = models.BooleanField(default=True)
    status = models.IntegerField(default=0)

    def __str__(self):
        return str(self.id)

class Answer_Envelope_Extend(models.Model):
    answer_envelope = models.ForeignKey(
        Answer_Envelope, on_delete=models.CASCADE
    )
    answer_envelope_child = models.ForeignKey(
        Answer_Envelope, on_delete=models.CASCADE, related_name='%(class)s_extend'
    )
    external_user = models.ForeignKey(
        External_User, on_delete=models.CASCADE, null=True
    )

    def __str__(self):
        return str(self.id)

class Answer_Envelope_User(models.Model):
    """
    Respuesta por participante del sobre

    type_user:
    - 1 Usuario interno
    - 2 Rol
    - 3 Usuario Externo
    """
    answer_envelope = models.ForeignKey(Answer_Envelope, on_delete=models.CASCADE)
    envelope_user = models.ForeignKey(Envelope_User, on_delete=models.CASCADE)
    type_user = models.IntegerField(default=1)
    user = models.IntegerField(null=True)
    user_rol = models.ForeignKey(User_Enterprise, null=True, on_delete=models.CASCADE)
    token_link = models.CharField(max_length=100, default='')
    source = models.IntegerField()
    online = models.BooleanField(default=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    longitude = models.FloatField(null=True)
    latitude = models.FloatField(null=True)
    notification_date = models.DateTimeField(null=True)
    approver = models.BooleanField(default=False)
    limit_time = models.CharField(max_length=10, default='')
    limit_public = models.IntegerField(default=1)
    state = models.BooleanField(default=False)

    def __str__(self):
        return str(self.id)

class Envelope_User_Verified(models.Model):
    """
    Usuario a ser verificado y que tipo de verificación se realizará
    """
    answer_envelope_user = models.ForeignKey(Answer_Envelope_User, on_delete=models.CASCADE, null=True)
    type_check = models.IntegerField(default=1)
    send_time = models.DateTimeField(null=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Answer_Envelope_Checker(models.Model):
    """
    Verificador de la respuesta del sobre
    """
    answer_envelope_user = models.ForeignKey(Answer_Envelope_User, on_delete=models.CASCADE)
    token_link = models.CharField(max_length=100, default='')
    token = models.IntegerField(default=0)
    creation_date = models.DateTimeField(auto_now_add=True)
    state = models.BooleanField(default=False)

    def __str__(self):
        return str(self.id)

def env_doc_verified_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/envelope/{1}/{2}/answer/{3}/verified/{4}'.format(
        instance.answer_envelope_user.answer_envelope.envelope_version.envelope_enterprise.user.enterprise.id,
        instance.answer_envelope_user.answer_envelope.envelope_version.envelope_enterprise.id,
        instance.answer_envelope_user.answer_envelope.envelope_version.id,
        instance.answer_envelope_user.answer_envelope.id,
        name
    )

class Answer_Envelope_Verified(models.Model):
    """
    Registro de aceptación legal y datos por usuario a ser verificado
    """
    answer_envelope_user = models.ForeignKey(Answer_Envelope_User, on_delete=models.CASCADE, null=True)
    type_identification = models.ForeignKey(Type_Identification, on_delete=models.CASCADE, null=True)
    identification = models.BigIntegerField(null=True)
    identification_front = models.FileField(upload_to=env_doc_verified_path, null=True, blank=True)
    identification_back = models.FileField(upload_to=env_doc_verified_path, null=True, blank=True)
    token_link = models.CharField(max_length=100, default='')
    checker_td = models.BooleanField(null=True)
    checker_hd = models.BooleanField(null=True)
    verified = models.BooleanField(null=True)
    comment = models.TextField()
    verified_date = models.DateTimeField(null=True)
    checker_date = models.DateTimeField(null=True)
    status = models.IntegerField(default=0)

    def __str__(self):
        return str(self.id)

class Field_Verified(models.Model):
    """Respuesta por consulta de verificación"""
    envelope_user_verified = models.ForeignKey(Envelope_User_Verified, on_delete=models.CASCADE)
    answer_verified = models.ForeignKey(Answer_Envelope_Verified, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    response = models.TextField()

    def __str__(self):
        return str(self.id)

class Answer_Envelope_Approve(models.Model):
    """Respuesta de Aprobador"""
    answer_envelope_user = models.ForeignKey(Answer_Envelope_User, on_delete=models.CASCADE)
    token_link = models.CharField(max_length=100, default='')
    approve = models.BooleanField(null=True)
    comment = models.TextField()
    approve_date = models.DateTimeField(null=True)

    def __str__(self):
        return str(self.id)

class Answer_Envelope_Field(models.Model):
    """Respuesta por campo de participante"""
    answer_envelope_user = models.ForeignKey(Answer_Envelope_User, on_delete=models.CASCADE, null=True)
    field_user = models.ForeignKey(Field_User, on_delete=models.CASCADE)
    value = models.TextField()
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Env_List_Field(models.Model):
    env_form_field = models.ForeignKey(Env_Form_Field, on_delete=models.CASCADE)
    field_type = models.ForeignKey(Field_Type, on_delete=models.CASCADE)
    name = models.CharField(max_length=50)
    position = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Env_Option_List_Field(models.Model):
    env_list_field = models.ForeignKey(Env_List_Field, on_delete=models.CASCADE)
    option = models.ForeignKey(Option, on_delete=models.CASCADE)
    position = models.IntegerField()
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Plans(models.Model):
    name = models.CharField(max_length=40, blank=True)
    description = models.CharField(max_length=500, blank=True)
    price = models.CharField(max_length=40, blank=True)
    color = models.CharField(max_length=40, blank=True)
    image = models.FileField(upload_to=profile_directory_path, null=True, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Enterprise_Plans(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    initial_date = models.DateTimeField(auto_now_add=False)
    finish_date = models.DateTimeField(auto_now=False)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class History_Plans(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    plan = models.ForeignKey(Plans, on_delete=models.CASCADE)
    type_pay = models.IntegerField()
    price = models.IntegerField()
    buy_date = models.DateTimeField(auto_now=False)

    def __str__(self):
        return str(self.id)

class Service_Plans(models.Model):
    description = models.CharField(max_length=500, blank=True)
    cant = models.IntegerField()
    service = models.CharField(max_length=500, blank=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Items_Plans(models.Model):
    service = models.ForeignKey(Service_Plans, on_delete=models.CASCADE)
    plan =  models.ForeignKey(Plans, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Home_Items(models.Model):
    name = models.CharField(max_length=500, blank=True)
    image_name = models.CharField(max_length=500, blank=True)
    path = models.CharField(max_length=500, blank=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Home_Items_User(models.Model):
    user = models.ForeignKey(User_Enterprise, null=True, on_delete=models.CASCADE)
    home_item = models.ForeignKey(Home_Items, on_delete=models.CASCADE)
    cant = models.IntegerField()

    def __str__(self):
        return str(self.id)

class Project_Task(models.Model):
    name = models.CharField(max_length=40, blank=True)
    description = models.CharField(max_length=500, blank=True)
    image = models.CharField(max_length=500, blank=True)
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    identificator = models.CharField(max_length=500, blank=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Subproject(models.Model):
    name = models.CharField(max_length=40, blank=True)
    description = models.CharField(max_length=500, blank=True)
    goal = models.CharField(max_length=500, blank=True)
    email = models.CharField(max_length=70, blank=True)
    project = models.ForeignKey(Project_Task, on_delete=models.CASCADE)
    id_forms = models.CharField(max_length=500, blank=True)
    main_form = models.CharField(max_length=10, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    initial_date = models.CharField(max_length=500, blank=True)
    initial_hour = models.CharField(max_length=500, blank=True)
    finish_date = models.CharField(max_length=500, blank=True)
    finish_hour = models.CharField(max_length=500, blank=True)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Task(models.Model):
    name = models.CharField(max_length=40, blank=True)
    description = models.CharField(max_length=500, blank=True)
    address = models.CharField(max_length=500, blank=True)
    phone = models.CharField(max_length=500, blank=True)
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    initial_date = models.CharField(max_length=500, blank=True)
    initial_hour = models.CharField(max_length=500, blank=True)
    finish_date = models.CharField(max_length=500, blank=True)
    finish_hour = models.CharField(max_length=500, blank=True)
    duration = models.CharField(max_length=10, default=30)
    serial_number = models.CharField(max_length=40, default='NA')
    answer_form_id=models.CharField(max_length=50, null=True)
    state = models.ForeignKey(Enterprise_Process_State, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.id)

class Programming_Visits(models.Model):
    name = models.CharField(max_length=40, blank=True)
    description = models.CharField(max_length=500, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Programming_Visits_Task(models.Model):
    programming_visits = models.ForeignKey(Programming_Visits, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.id)

class Visit_Task_Answer_Form(models.Model):
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    task = models.ForeignKey(Task, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.id)

class Subproject_Parameters(models.Model):
    days_enabled = models.CharField(max_length=500, blank=True)
    start_time_enabled = models.CharField(max_length=500, blank=True)
    end_time_enabled = models.CharField(max_length=500, blank=True)
    travel_time = models.CharField(max_length=500, blank=True)
    lunch_time_state = models.BooleanField(default=False)
    lunch_time = models.CharField(max_length=500, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE)

    def __str__(self):
        return str(self.id)

class Form_Answer_Task(models.Model):
    Answer_Form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    subproject = models.ForeignKey(Subproject, on_delete=models.CASCADE)
    task = models.ForeignKey(
        Task, null=True, on_delete=models.CASCADE
    )
    description = models.CharField(max_length=200, blank=True)

    def __str__(self):
        return str(self.id)

class Logs_Form(models.Model):
    """
    state:
    - 0 Documento no salio del dispositivo
    - 1 Enviado con exito
    - 2 Enviado por sincronizacion
    - 3 Documento por sincronizar

    platform:
    - 0 movil
    - 1 web
    """
    id_form = models.CharField(max_length=40, blank=True)
    latitude = models.CharField(max_length=500, blank=True)
    longitude = models.CharField(max_length=500, blank=True)
    creation_date = models.DateTimeField(auto_now_add=True)
    date = models.CharField(max_length=500, blank=True)
    hour = models.CharField(max_length=500, blank=True)
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    platform = models.IntegerField()
    state = models.IntegerField()

    def __str__(self):
        return str(self.id)

class Enterprise_Email_Conf(models.Model):
    """
    Tabla para guardado de configuracion SMTP de empresas.
    """

    enterprise = models.OneToOneField(Enterprise, models.CASCADE)
    host = models.TextField()
    port = models.IntegerField(default=587)
    username = models.CharField(max_length=100)
    password = models.CharField(max_length=100)
    use_tls = models.BooleanField(default=True)
    create_date = models.DateTimeField(auto_now_add=True)
    authenticate_domain = models.BooleanField(default=False)
    verify_sender = models.BooleanField(default=False)
    brand_link = models.BooleanField(default=False)
    dns = models.CharField(max_length=100,null=True)
    domain = models.CharField(max_length=100,null=True)
    email_config = models.CharField(max_length=100,null=True)
    sender = models.CharField(max_length=300,default='')
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

def template_directory_zip_path(instance, filename):
    ext = filename.rsplit(".", 1)[1]
    name = str(datetime.now().strftime("%d%m%Y-%H%M%S-%f")) + "." + ext
    return '{0}/zip/{1}'.format(instance.user.enterprice.id, name)

class Massive_Zip_Pdf(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    filters = models.TextField()
    template_folder = models.TextField(null=True)
    template_zip = models.FileField(upload_to=template_directory_zip_path, null=True, blank=True)
    date = models.DateTimeField(auto_now_add=True)
    amount = models.IntegerField()
    success = models.IntegerField(default=0)
    error = models.IntegerField(default=0)
    status = models.IntegerField(default=0)
    state = models.BooleanField(default=True)

    def __str__(self):
        return str(self.date)

class Document_Without_Sing(models.Model):
    '''
    Estructura para guardar los documentos que no son de firma
    '''
    answer_form = models.ForeignKey(Answer_Form, on_delete=models.CASCADE)
    pdf_path = models.CharField(max_length=100)
    date = models.DateTimeField(auto_now_add=True)
    status = models.BooleanField(default=True)

    def __str__(self):
        return str(self.id)

class Zip_Errors(models.Model):
    massive_zip_pdf = models.ForeignKey(
        Massive_Zip_Pdf, on_delete=models.CASCADE
    )
    pdf = models.IntegerField()
    data = models.TextField()
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return str(self.pdf)

class History_Create_Share_Documents(models.Model):
    enterprise = models.ForeignKey(Enterprise, on_delete=models.CASCADE)
    creation_date = models.DateTimeField(auto_now_add=True)
    token = models.CharField(max_length=100)
    Share = models.CharField(max_length=150)
    id_form = models.CharField(max_length=40, blank=True)
    def __str__(self):
        return str(self.id)


class Landing_Form(models.Model):
    name = models.CharField(max_length=60)
    last_name = models.CharField(max_length=60)
    creation_date = models.DateTimeField(auto_now_add=True)
    corporate = models.CharField(max_length=60)
    email = models.CharField(max_length=60)
    phone = models.BigIntegerField(null=False)
    city = models.CharField(max_length=60)
    ip_address = models.CharField(max_length=20)
    terms = models.BooleanField(default=False)
    newslet = models.BooleanField(default=False)

    def __str__(self):
        return str(self.id)

class Ani_Lyn_Melmac(models.Model):
    first_name = models.CharField(max_length=20)
    middle_name = models.CharField(max_length=20, null=True)
    first_last_name = models.CharField(max_length=20)
    second_last_name = models.CharField(max_length=20, null=True)
    type_identification = models.ForeignKey(Type_Identification, on_delete=models.CASCADE)
    identification = models.BigIntegerField(null=False)
    live = models.CharField(max_length=20, null=True)
    expedition_date = models.CharField(max_length=20)
    data_form = models.CharField(max_length=60000)
    creation_date = models.DateTimeField(auto_now_add=True)
    modify_date = models.DateTimeField(auto_now=True)

    def __str__(self):
        return str(self.id)

class Form_Temporal_Digital(models.Model):
    user = models.ForeignKey(User_Enterprise, on_delete=models.CASCADE)
    temporal = models.CharField(max_length=7000000)
    id_form = models.CharField(max_length=40, blank=True)
    token = models.CharField(max_length=70, blank=True)

    def __str__(self):
        return str(self.id)