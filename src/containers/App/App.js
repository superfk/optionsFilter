import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button/Button';
import Table from '../../components/Table/Table';
import classes from './App.module.css';

const electron = window.require('electron');
const ipcRenderer = electron.ipcRenderer;


const App = props => {

  const [data, setdata] = useState([]);
  const [keyword, setkeyword] = useState('')

  const onStreamingData = useCallback(
    (e, dataset) => {
      setdata(prev=>[...prev, ...dataset])
    },
    []
  )
  const onReplyData = useCallback(
    (e, dataset) => {
      setdata(prev=>[...dataset])
    },
    []
  )

  useEffect(() => {
    ipcRenderer.on('reply_streaming_data', onStreamingData);
    ipcRenderer.on('reply_update_data', onReplyData);
    return () => {
      ipcRenderer.removeListener('reply_streaming_data', onStreamingData);
      ipcRenderer.removeListener('reply_update_data', onReplyData);
    }
  }, [onStreamingData, onReplyData])

  const refreshHandler = e => {
    ipcRenderer.send('to_server', {cmd: 'refresh', data: null})
  }
  const queryHandler = e => {
    ipcRenderer.send('to_server', {cmd: 'get_data_freom_db', data: keyword})
  }

  return <div className={classes.Background}>
    <div className={classes.Search}>
      <input value={keyword} placeholder='Search..' onChange={(e)=>{setkeyword(e.target.value)}}></input>
    </div>
    <div className={classes.Buttons}>
      <Button clicked={refreshHandler} text='Refresh' />
    <Button clicked={queryHandler} text='Query' />
    </div>
    <div className={classes.Table}>
      <Table data={data} rowKey='contractSymbol' />
    </div>
  </div>;
}

export default App;
