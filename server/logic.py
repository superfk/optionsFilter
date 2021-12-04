from __future__ import print_function
import threading, asyncio, os, time, datetime, queue
from core import OptionReader

class Logic(object):
    def __init__(self, sendMsgFunc, loop):
        self.sendMsg = sendMsgFunc
        self.loop = loop
        self.core = None
        self.approot = ''
        self.symbol_src = ''
        self.now = datetime.datetime.now()
        self.expired = datetime.datetime(2022,2,1,0,0,0,0)
        self.stop = False
        self.refresh_thread = None
        self.task_queue = queue.Queue()

    async def is_expired(self, websocket):
        expired = self.now > self.expired
        if expired:
            await self.sendMsg(websocket, 'reply_statustext', f'嘿嘿嘿，使用期限到期，請聯絡蕭杯討論訂閱 (゜o゜)')
        return expired
    
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
            keyword = data['keyword']
            date = data['date']
            expired = await self.is_expired(websocket)
            if not expired:
                threading.Thread(target=self.run_core, args=[websocket, keyword, date, False]).start()
        elif cmd == 'refresh_bg':
            expired = await self.is_expired(websocket)
            if not expired:
                enable_bg = data['enable_bg']
                keyword = data['keyword']
                date = data['date']
                if enable_bg:
                    self.refresh_thread = threading.Thread(target=self.run_core, args=[websocket, keyword, date, True])
                    self.refresh_thread.start()
                else:
                    if self.refresh_thread:
                        if self.refresh_thread.is_alive():
                            self.task_queue.put(dict(cmd='stop', data=None))
        elif cmd == 'get_data_freom_db':
            expired = await self.is_expired(websocket)
            if not expired:
                keyword = data['keyword']
                date = data['date']
                threading.Thread(target=self.get_data_freom_db, args=[websocket,keyword,date,]).start()
        else:
            pass
    
    def run_core(self, ws, keyword, date, background=False):
        with self.task_queue.mutex:
            self.task_queue.queue.clear()
        self.task_queue.put(dict(cmd='run', data=None))
        while True:
            msg = self.task_queue.get()
            cmd = msg['cmd']
            data = msg['data']
            if cmd == 'run':
                print('start update')
                asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', '開始更新...'), self.loop).result()
                self.core = OptionReader(self.loop)
                self.core.set_symbols_source(self.symbol_src)
                self.core.connect_db()
                asyncio.run_coroutine_threadsafe(self.core.update(ws), self.loop).result()
                ret = self.core.get_optioins_by_condition(keyword, date=date)
                asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_streaming_data', ret), self.loop).result()
                now = datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')
                asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', f'更新完畢...{now}'), self.loop).result()
                self.core.close_db()
                if background:
                    self.task_queue.put(dict(cmd='run', data=None))
            elif cmd == 'stop':
                break

    def get_data_freom_db(self, ws, keyword, date):
        print('start update')
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', f'取回資料中...'), self.loop).result()
        self.core = OptionReader(self.loop)
        self.core.connect_db()
        ret = self.core.get_optioins_by_condition(keyword, date=date)
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_update_data', ret), self.loop).result()
        asyncio.run_coroutine_threadsafe(self.sendMsg(ws, 'reply_statustext', f'資料取回完畢!'), self.loop).result()
        self.core.close_db()
