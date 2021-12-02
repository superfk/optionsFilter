#!/usr/bin/env python
# coding: utf-8

import pandas as pd
import asyncio, os, traceback
from concurrent.futures import ThreadPoolExecutor, as_completed
import time, threading
from pandas_datareader.yahoo.headers import DEFAULT_HEADERS
import datetime, random
import requests_cache
from Proxy_List_Scrapper import ALL, Scrapper
import sqlite3 as sql3
from sqlite3 import Error
import json
from yahooquery import Ticker
import requests
import pandas as pd


class OptionReader(object):
    def __init__(self, loop) -> None:
        self.loop = loop
        self.ws = None
        self.con = None
        self.dbname = 'db.db'
        self.symbol_file_path = ''
        self.proxy = []
        self.goodproxy = []
        self.symbols = []
        self.col_def = ['symbol','contractSymbol', 'currentPrice', 'strike', 'lastPrice', 'cp', 'expiration', 'optionType']

    def set_symbols_source(self, csvpath):
        self.symbol_file_path = csvpath

    def _create_table(self, create_table_sql):
        """ create a table from the create_table_sql statement
        :param conn: Connection object
        :param create_table_sql: a CREATE TABLE statement
        :return:
        """
        try:
            c = self.con.cursor()
            c.execute(create_table_sql)
        except Error as e:
            print(e)

    def connect_db(self):
        self.con = sql3.connect(self.dbname, check_same_thread=False)
        sql_create_projects_table = """ CREATE TABLE IF NOT EXISTS data (
                                            contractSymbol text PRIMARY KEY,
                                            symbol text,
                                            optionType text,
                                            strike text,
                                            currentPrice real,
                                            lastPrice REAL, 
                                            cp REAL,
                                            expiration timestamp
                                        ); """
        self._create_table(sql_create_projects_table)
    
    async def get_proxy(self):
        scrapper = Scrapper(category=ALL, print_err_trace=False)
        data = scrapper.getProxies()
        for item in data.proxies:
            self.proxy.append('{}:{}'.format(item.ip, item.port))

        print(f'total found proxy: {len(self.proxy)}')

        def get_proxy_list(proxy):
            proxy = {'http':f'http://{proxy}',
                    'https':f'http://{proxy}'} 
            headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:80.0) Gecko/20100101 Firefox/80.0'}
            url = 'https://httpbin.org/ip'
            try:
                resp = requests.get(url,headers=headers,proxies=proxy, timeout=1)
                if str(resp.status_code) == '200':
                    print(f'Succed: {proxy}')
                    self.goodproxy.append(proxy)
                else:
                    # print(f'Failed: {proxy}')
                    pass
            except:
                # print(f'Failed: {proxy}')
                pass

        
        with ThreadPoolExecutor(max_workers=200) as executor:
            tasks = [self.loop.run_in_executor(executor, get_proxy_list, p) for p in self.proxy]
            await asyncio.gather(*tasks)

        self.goodproxy = list(self.goodproxy)
        print(f'total valid proxy: {len(self.goodproxy)}')
        return self.goodproxy
    
    def get_symbol(self):
        self.symbols=pd.read_csv(self.symbol_file_path).Symbol.values
        # self.symbols = ['aapl']
        print('all symbols:')
        print(self.symbols)

        # delete csv
        if os.path.exists('all_calls.csv'):
            os.remove('all_calls.csv')
        if os.path.exists('all_puts.csv'):
            os.remove('all_puts.csv')
        return self.symbols
    
    async def sendMsg(self, cmd, data=None):
        if self.ws:
            msg = {'cmd': cmd, 'data': data}
            try:
                jData = json.dumps(msg)
                # print(f"sending msg [{cmd}] with buffer size [{len(jData)}] bytes")
                await self.ws.send(jData)
            except Exception as e:
                err_msg = traceback.format_exc()
                print(err_msg)      

    def calc_cp_and_price(self, df, prices):
        sb = df['symbol'].values[0]
        price = prices.loc[sb]['regularMarketPrice']
        df['currentPrice'] = price
        df = self.get_best_cp(df, price)
        dfCall = df.loc[(df['optionType'] == 'calls') & (df['strike'] >= price)]
        dfPut = df.loc[(df['optionType'] == 'puts') & (df['strike'] <= price)]
        df = pd.concat([dfCall, dfPut], ignore_index=True)
        df = df.reset_index(drop=True)
        # dfCopy = df[self.col_def]
        # dfCopy['expiration'] = dfCopy['expiration'].dt.strftime('%Y-%m-%d')
        # dfCopy.fillna('', inplace=True)
        # ret = dfCopy.to_dict('records')
        # asyncio.run_coroutine_threadsafe(self.sendMsg('reply_streaming_data', ret), self.loop).result()
        return df

    def get_all(self, symbols, i):
        df = pd.DataFrame(columns=self.col_def)
        sybols = ' '.join(symbols)
        # proxy = random.choice(proxies)
        try:
            proxy = self.goodproxy[i]
        except:
            proxy = None
        print(f"current proxy: {proxy}")
        try:
            print(f"{datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')} ########## {sybols} started!  ##########\n")
            tickers = Ticker(
                ' '.join(symbols), 
                asynchronous=True,
                max_workers=16, 
                progress=True, 
                retry=5,
                proxies=proxy,
                user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36',
                )
            # dfPrice = tickers.history(period='7d', interval='1d')
            data = tickers.all_modules
            dfPrice = pd.DataFrame(data)
            prices = dfPrice.loc['price']
            df = tickers.option_chain
            df = df.reset_index(drop=False)
            df = df.groupby('symbol').apply(lambda x: self.calc_cp_and_price(x, prices))
            print(f"{datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')} ########## {sybols} completed!##########")
            # asyncio.run_coroutine_threadsafe(self.sendMsg('reply_statustext', f"成功更新 {sybols} @ {datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')}"), self.loop).result()
        except Exception as e:
            err = traceback.format_exc()
            print(f"opps! error in {sybols}")
        
        return df

    def get_best_cp(self, df, cur_price):
        df['cp'] = df['lastPrice'] / cur_price
        return df

    async def update(self, websocket=None):
        self.ws = websocket
        self.get_symbol()
        self.loop = asyncio.get_running_loop()
        await self.get_proxy()
        await self.sendMsg('reply_statustext', f"取得{len(self.goodproxy)}個有效的Proxy...")
        workers_number = len(self.goodproxy) # len(proxies)
        symbols_chunks = []
        chunk_size = max(1, len(self.symbols) // workers_number)
        print(f"chunk_size: {chunk_size}")
        s = self.symbols[:]
        random.shuffle(s)
        self.dfAll = pd.DataFrame(columns=self.col_def)

        for i in range(workers_number):
            if i == workers_number-1:
                chunk = s[0:]
            chunk = s[0:chunk_size]
            s = s[chunk_size:]
            symbols_chunks.append(chunk)

        print(f"start fetching...")
        counter = 0
        with ThreadPoolExecutor(max_workers=workers_number) as executor:
            tasks = {executor.submit(self.get_all, s, i): s for i, s in enumerate(symbols_chunks)}
            for future in as_completed(tasks):
                symb = tasks[future]
                symb = ' '.join(symb)
                try:
                    df = future.result()
                    self.dfAll = self.dfAll.append(df, ignore_index=True)
                except Exception as exc:
                    print('%r generated an exception: %s' % (exc))
                finally:
                    counter += 1
                    await self.sendMsg('reply_statustext', f"成功更新 {symb} @ {datetime.datetime.strftime(datetime.datetime.now(), '%Y-%m-%d %H:%M:%S')}")
                    await self.sendMsg('reply_progresstext', f"{counter} / {len(symbols_chunks)}")
            # for df in await asyncio.gather(*tasks):
            #     self.dfAll = self.dfAll.append(df, ignore_index=True)
            #     counter += 1
            #     await self.sendMsg('reply_progresstext', f"{counter} / {len(symbols_chunks)}")
        
        self.dfAll = self.dfAll.reset_index(drop=True)
        df = self.dfAll.sort_values(by=['cp'],ascending=False)
        df = df[self.col_def]
        df.reset_index(drop=True, inplace=True)
        curDf = pd.read_sql(f'SELECT * FROM data', self.con, parse_dates=["expiration"])
        curDf.reset_index(drop=True, inplace=True)
        dfNew = (pd.concat([curDf, df], ignore_index=True)
            .drop_duplicates(['contractSymbol'] , keep='last')
            .reset_index(drop=True))
        dfNew.set_index('contractSymbol',inplace=True)
        st = time.time()
        print(f"start saving files")
        now = datetime.datetime.now().strftime("%Y-%m-%d")
        dfNew = dfNew.loc[dfNew['expiration'] >= now]
        dfNew.to_sql("data", con=self.con, if_exists='replace', chunksize=10000)
        print(dfNew)
        print(f"end saving files...{time.time()-st}")
    
    def close_db(self):
        self.con.close()

    def saveall_helper(self, symbol, df, dtype='calls'):
        df.to_csv(f"{symbol}_{dtype}.csv", index=False, chunksize= 10000)
        return dtype

    def get_optioins_by_condition(self, keyword='', group=''):
        search = f"AND optionType='{group}'"
        if group == '':
            search = f""
        curDf = pd.read_sql(f"SELECT * FROM data WHERE contractSymbol LIKE '%{keyword}%' {search}", self.con, parse_dates=["expiration"])
        curDf.reset_index(drop=True, inplace=True)
        curDf = curDf.sort_values(by=['cp'],ascending=False)
        curDf['expiration'] = curDf['expiration'].dt.strftime('%Y-%m-%d')
        curDf.fillna('', inplace=True)
        ret = curDf.to_dict('records')
        return ret

    async def sql_to_csv(self):
        curDf = pd.read_sql(f'SELECT * FROM data', self.con, parse_dates=["expiration"])
        curDf.reset_index(drop=True, inplace=True)
        now = datetime.datetime.now().strftime("%Y-%m-%d")
        curDf = curDf.loc[curDf['expiration'] >= now]
        curDf = curDf.sort_values(by=['cp'],ascending=False)
        target = ['calls', 'puts']
        with ThreadPoolExecutor(max_workers=2) as executor:
            tasks = [self.loop.run_in_executor(executor, self.saveall_helper, 'all', curDf.loc[curDf['optionType'] == s], s ) for i, s in enumerate(target)]
            for df in await asyncio.gather(*tasks):
                pass

if __name__ == '__main__':
    core = OptionReader(None)
    core.connect_db()
    ret = core.get_optioins_by_condition('G')
    print(ret)
    core.close_db()