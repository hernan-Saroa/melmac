from api.controllers.system_log import register_log
import asyncio
import json
import traceback
import websockets

URL_WS = 'ws://localhost:9001'

class WS_Bridge:
    async def connect_send(self, channel, message):
        # channel = '/ws/data/1/'
        print('websocket',  channel)
        async with websockets.connect(URL_WS + channel) as websocket:
            y = json.dumps(message)
            x = await websocket.send(y)
            await websocket.recv()

    def send_enterprise(self, token, message):
        try:
            channel = '/ws/enterprise/' + token + '/'
            asyncio.run(self.connect_send(channel, message))
        except:
            register_log(
            {
                'action': 'Envio mensaje a Socket Empresa desde servidor Back',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'url: {}, message: {}'.format('/ws/user/' + token + '/', message),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None)

    def send_user(self, token, message):
        try:
            channel = '/ws/user/' + token + '/'
            asyncio.run(self.connect_send(channel, message))
        except Exception as err:
            register_log(
            {
                'action': 'Envio mensaje a Socket Usuario desde servidor Back',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'url: {}, message: {}'.format('/ws/user/' + token + '/', message),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None)
