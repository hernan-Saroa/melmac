from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import async_to_sync, sync_to_async

from rest_framework.authtoken.models import Token
from api.models import User_Enterprise
from ws_provider.controllers import geoportal
from api.controllers import system_log

import json

enterprise_channels = {}
user_channels = {}
last_pos_channels = {}

class WSConsumerEnterprise(AsyncWebsocketConsumer):
    actions = ['Message', 'Notify', 'Error']

    async def connect(self):
        try:
            self.token = self.scope['url_route']['kwargs']['token']
            token_val = await sync_to_async(Token.objects.get)(key=self.token)
            user_val = await sync_to_async(User_Enterprise.objects.get)(user=token_val.user, token=self.token)
            self.room_group_name = await self.get_room_name(user_val)

            # Join room group
            await (self.channel_layer.group_add)(
                self.room_group_name,
                self.channel_name
            )

            await self.accept()
            await self.post_connect(user_val)
        except Token.DoesNotExist:
            pass
        except User_Enterprise.DoesNotExist:
            pass


    async def disconnect(self, close_code):
        # Leave room group
        await (self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        await self.post_disconnect(close_code)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        print(text_data_json)
        action = text_data_json['action'] if 'action' in text_data_json else ''
        message = text_data_json['message'] if 'message' in text_data_json else ''
        source = text_data_json['source'] if 'source' in text_data_json else ''
        # print(action, self.actions)
        # print(source, source and source != 'server')
        if action in self.actions and source and source != 'server':
            await self.process(text_data_json)
            # Send message to room group
            await (self.channel_layer.group_send)(
                self.room_group_name,
                await self.get_sent_message(text_data_json)
            )

    # Receive message from room group
    async def message(self, event):
        action = event['action'] if 'action' in event else ''
        message = event['message'] if 'message' in event else '' 
        data = event['data'] if 'data' in event else '' 
        source = event['source'] if 'source' in event else '' 

        # Send message to WebSocket
        await self.send(text_data=json.dumps({
            'action': action,
            'message': message,
            'data': data,
            'source': source,
        }))

    async def get_room_name(self, user_val):
        return 'enterprise_%s' % str(user_val.enterprise_id)
    
    async def process(self, data:dict):
        pass

    async def post_connect(self, data:User_Enterprise):
        pass
    
    async def post_disconnect(self, data):
        pass

    async def get_sent_message(self, data):
        if data['action'] != 'error':
            return {
                    'type': 'message',
                    'action': data['action'],
                    'message': data['message'],
                    'source': 'server'
                }
        return {}

class WSConsumerUser(WSConsumerEnterprise):
    actions = ['Message', 'Notify', 'Error', 'Login']

    async def get_room_name(self, user_val):
        return 'user_%s' % str(user_val.id)
    
    async def get_sent_message(self, data):
        return {
                    'type': 'message',
                    'action': data['action'],
                    'data': data['data'],
                    'source': 'server'
                }
    async def process(self, data: dict):
        if data['action'] == 'Error':
            user_val = None
            try:
                token_val = await sync_to_async(Token.objects.get)(key=self.token)
                user_val = await sync_to_async(User_Enterprise.objects.get)(user=token_val.user, token=self.token)
            except: 
                pass
            system_log.register_log(data['data'], user_val)

class WSConsumerLastPositionUser(WSConsumerEnterprise):
    actions = ['Last Pos']

    async def get_room_name(self, user_val):
        return 'user_lp_%s' % str(user_val.enterprise_id)
    
    async def disconnect(self, close_code):
        # Leave room group
        await (self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )
        # print(self.channel_layer.groups)
        if self.room_group_name not in self.channel_layer.groups:
            last_pos_channels[self.room_group_name].done = True
            del last_pos_channels[self.room_group_name]
            # print(last_pos_channels)
    
    async def post_connect(self, user_val: User_Enterprise):
        if self.room_group_name not in last_pos_channels:
            th = geoportal.LastPosUpdater(self.room_group_name, 'LP_{}'.format(user_val.enterprise_id), user_val.enterprise_id)
            last_pos_channels[self.room_group_name] = th
            last_pos_channels[self.room_group_name].start()
        # print(self.channel_layer.groups)