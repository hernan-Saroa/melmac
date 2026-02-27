from django.contrib.auth.models import User, Group
from rest_framework import serializers

from api.models import Device_Enterprise, External_User, Massive_File, Permit_Enterprise, Permit_Role, Role_Enterprise, Type_Device, User_Enterprise

class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ['url', 'username', 'email', 'groups']


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ['url', 'name']

class PermitSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permit_Enterprise
        fields = ['id', 'name', 'description', 'permit_type', 'status']

class RoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Role_Enterprise
        fields = ['id', 'name', 'description', 'is_admin', 'view_all', 'state', 'time_zone']
        

class PermitRoleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permit_Role
        fields = ['id', 'permit', 'role_enterprise', 'state']
        depth = 1

class UserEnterpriseModelSerializer(serializers.ModelSerializer):
    """User Enterprise model serializer."""
    enterprise_id = serializers.IntegerField()
    type_identification_id = serializers.IntegerField()
    role_id = serializers.IntegerField()
    role_enterprise_id = serializers.IntegerField()

    class Meta:
        model = User_Enterprise
        fields = (
            'id',
            'enterprise_id',
            'first_name',
            'middle_name',
            'first_last_name',
            'second_last_name',
            'type_identification_id',
            'identification',
            'phone',
            'email',
            'role_id',
            'login_state',
            'role_enterprise_id'
        )

class ExternalUserModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = External_User
        fields = (
            'id',
            'name',
            'email',
            'phone',
            'enterprise_id',
            'phone_ind',
            'state'
        )

class UserUpdateModelSerializer(serializers.ModelSerializer):
    """User Enterprise model serializer."""
    role_enterprise_id = serializers.IntegerField(required=False)

    class Meta:
        model = User_Enterprise
        fields = (
            'id',
            'first_name',
            'middle_name',
            'first_last_name',
            'second_last_name',
            'login_count',
            'login_state',
            'role_enterprise_id',
        )
        extra_kwargs = {
            'role_enterprise_id': {'required': False, 'allow_null': True},
        }


class TypeDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Type_Device
        fields = (
            'id',
            'name',
            'description',
            'icon',
            'state'
        )
        
class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device_Enterprise
        fields = (
            'id',
            'type_device_id',
            'mac',
            'name',
            'state'
        )

class MassiveFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Massive_File
        fields = (
            'id',
            'template',
            'amount',
            'success',
            'error',
            'status'
        )
