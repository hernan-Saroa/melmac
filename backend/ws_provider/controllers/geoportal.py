from threading import Thread
from datetime import datetime, timedelta
from api.controllers.site import TZ_INFO
from api.models import Follow_User, Permit_Role, User_Enterprise
from django.db.models import F
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from time import sleep

channel_layer = get_channel_layer()

class LastPosUpdater(Thread):
    
    def __init__(self, thread_name, thread_ID, enterprise):
        Thread.__init__(self)
        self.thread_name = thread_name
        self.thread_ID = thread_ID
        self.daemon = True
        self.done = False
        self.json_data = {}
        self.enterprise = enterprise

        role_list = Permit_Role.objects.filter(
            role_enterprise__enterprise_id=enterprise,
            role_enterprise__state=True,
            permit__permit_type_id=55,
            state=True
        ).select_related(
            'role_enterprise',
            'permit',
        ).values_list(
            'role_enterprise_id', flat=True
        )

        self.user_list = User_Enterprise.objects.filter(
            enterprise_id=enterprise,
            role_id=3,
            state=True,
            role_enterprise_id__in=role_list,
        ).select_related(
            'role_enterprise',
        ).values_list('id', flat=True)
    
    def run(self):
        # print(self.thread_ID)
        while not self.done:    
            self.updateInfo()
            sleep(120)

    def updateInfo(self):
        time_start = datetime.now(tz=TZ_INFO) - timedelta(minutes=5)
        last_pos = {}
        for user_id in self.user_list:
            today_pos = Follow_User.objects.filter(
                user_id=user_id,
                creation_date__gte=time_start,
                latitude__isnull=False,
                longitude__isnull=False,
            ).select_related('user').annotate(
                first_name=F('user__first_name'),
                first_last_name=F('user__first_last_name'),
                email=F('user__email')
            ).order_by(
                '-creation_date'
            ).values(
                'latitude', 
                'longitude',
                'creation_date__hour',
                'creation_date__minute',
                'user_id',
                'first_name',
                'first_last_name',
                'email',
            )[0:1]
            if len(today_pos):
                last_pos[user_id] = today_pos[0]
        self.json_data['last'] = last_pos
        async_to_sync(channel_layer.group_send)(
            'user_lp_%s' % str(self.enterprise),
            { 
                'type': 'message', 
                'action': 'Last Pos',
                'message': self.json_data,
            }
        )
                    
