# from django.test import TestCase

# Create your tests here.

from api.models import Follow_User
from random import randint

def new_follow():
    val = Follow_User()
    val.latitude = 4.600868 * (100 - randint(0,10)/10 ) / 100
    val.longitude = -74.08175 * (100 - randint(0,10)/10 ) / 100
    val.user_id = 3
    val.save()