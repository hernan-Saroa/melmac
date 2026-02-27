# chat/routing.py
from django.urls import re_path

from . import consumers

urlpatterns = [
    # path('ws/data/', consumers.ChatConsumer.as_asgi()),
]

websocket_urlpatterns = [
    re_path(r'ws/enterprise/(?P<token>\w+)/$', consumers.WSConsumerEnterprise.as_asgi()),
    re_path(r'ws/user/(?P<token>\w+)/$', consumers.WSConsumerUser.as_asgi()),
    re_path(r'ws/lp_user/(?P<token>\w+)/$', consumers.WSConsumerLastPositionUser.as_asgi()),
]