#!/usr/bin/python
# -*- coding: UTF-8 -*-

from __future__ import print_function
import os, traceback
import asyncio
import websockets
import json
from logic import Logic

SCRIPT_DIR = os.path.dirname(os.path.realpath(os.path.join(os.getcwd(), os.path.expanduser(__file__))))
os.chdir(SCRIPT_DIR)

class PyServerAPI(object):
    def __init__(self, loop):
        self.users = set()
        self.logic = Logic(self.sendMsg,loop)

    async def register(self,websocket):
        self.users.add(websocket)

    async def unregister(self,websocket):
        self.users.remove(websocket)

    async def handler(self,websocket, path):
        # register(websocket) sends user_event() to websocket
        await self.register(websocket)
        async for message in websocket:
            try:
                # print(message)
                # print(message)
                msg = json.loads(message)
                cmd = msg["cmd"]
                data = msg["data"]
                await self.logic.cmd_wrap(websocket,cmd,data)
            except Exception as e:
                try:
                    err_msg = traceback.format_exc()
                    await self.sendMsg(websocket,'reply_server_error',{'error':err_msg})
                except:
                    print('error during excetipn handling')
                    print(e)

    async def sendMsg(self, websocket, cmd, data=None):
        msg = {'cmd': cmd, 'data': data}
        filter_cmd = ['update_cur_status', 'pong', 'ignore']
        if 'ignore' not in filter_cmd:
            if cmd not in filter_cmd:
                print('server sent msg: {}'.format(msg))

        try:
            jData = json.dumps(msg)
            # print(f"sending msg [{cmd}] with buffer size [{len(jData)}] bytes")
            await websocket.send(jData)
        except Exception as e:
            err_msg = traceback.format_exc()
            print(err_msg)            

def main():
    try:
        loop = asyncio.get_event_loop()
        sokObj = PyServerAPI(loop)
        port=6849
        addr = 'tcp://127.0.0.1:{}'.format(port)
        print('start running on {}'.format(addr))

        start_server = websockets.serve(sokObj.handler, "127.0.0.1", port, ping_interval=30, write_limit=2**20)
        loop = asyncio.get_event_loop()
        loop.run_until_complete(start_server)
        loop.run_forever()
        loop.close()
    except Exception as e:
        err_msg = traceback.format_exc()
        print(f'backend fatal error when initializing: {err_msg}')

if __name__ == '__main__':
    main()