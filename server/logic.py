from __future__ import print_function
import threading, asyncio, os, time, datetime
from core import OptionReader

class Logic(object):
    def __init__(self, sendMsgFunc, loop):
        self.sendMsg = sendMsgFunc
        self.loop = loop
        self.core = None
        self.approot = ''
        self.symbol_src = ''

    async def cmd_wrap(self, websocket, cmd, data):
        print(f"cmd: {cmd}")
        print(f"data: {data}")
        if cmd == 'pong':
            pass
        elif cmd == 'isInited':
            await self.sendMsg(websocket, 'reply_init_ok')
        elif cmd == 'load_sys_config':
            await self.sendMsg(websocket, 'reply_load_sys_config')
        elif cmd == 'set_approot':
            self.approot = data
            self.symbol_src = os.path.join(self.approot, 'nasdaq.csv')
        elif cmd == 'refresh':
            threading.Thread(target=self.run_core, args=[websocket,]).start()
        elif cmd == 'get_data_freom_db':
            keyword = data
            threading.Thread(target=self.get_data_freom_db, args=[websocket,keyword]).start()
        else:
            pass
    
    def run_core(self, ws):
        print('start update')
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', '開始更新...'), self.loop).result()
        self.core = OptionReader(self.loop)
        self.core.set_symbols_source(self.symbol_src)
        self.core.connect_db()
        asyncio.run_coroutine_threadsafe(self.core.update(ws), self.loop).result()
        ret = self.core.get_optioins_by_condition()
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_streaming_data', ret), self.loop).result()
        now = datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', f'更新完畢...{now}'), self.loop).result()
        self.core.close_db()

    def get_data_freom_db(self, ws, keyword):
        print('start update')
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', f'取回資料中...'), self.loop).result()
        self.core = OptionReader(self.loop)
        self.core.connect_db()
        ret = self.core.get_optioins_by_condition(keyword)
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_update_data', ret), self.loop).result()
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', f'資料取回完畢!'), self.loop).result()
        self.core.close_db()
