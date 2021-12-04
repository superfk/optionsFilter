import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../components/Button/Button';
import Table from '../../components/Table/Table';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Switch from '@material-ui/core/Switch';
import TextField from '@material-ui/core/TextField';
import { makeStyles } from '@material-ui/core/styles';

import classes from './App.module.css';

const electron = window.require('electron');
const ipcRenderer = electron.ipcRenderer;

const useStyles = makeStyles((theme) => ({
  container: {
    display: 'flex',
    flexWrap: 'wrap',
  },
  textField: {
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    width: 200,
  },
}));

function getCurrentDate(separator=''){

  let newDate = new Date();
  newDate.setMonth(newDate.getMonth()+3)
  let date = newDate.getDate();
  let month = newDate.getMonth() + 1;
  let year = newDate.getFullYear();
  let fmt = `${year}${separator}${month<10?`0${month}`:`${month}`}${separator}${date<10?`0${date}`:`${date}`}`;
  return fmt
  }

const App = props => {


  const materialClasses = useStyles();

  const [data, setdata] = useState([]);
  const [keyword, setkeyword] = useState('');
  const [statustext, setstatustext] = useState('歡迎使用Options小工具!')
  const [progress, setprogress] = useState('')
  const [bgRefresh, setbgRefresh] = useState(false)
  const [selectedDate, setselectedDate] = useState(getCurrentDate('-'))

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
  const onReplyStatustext = useCallback(
    (e, txt) => {
      setstatustext(txt);
    },
    []
  )
  const onReplyProgresstxt = useCallback(
    (e, txt) => {
      setprogress(txt);
    },
    []
  )

  useEffect(() => {
    ipcRenderer.on('reply_streaming_data', onStreamingData);
    ipcRenderer.on('reply_update_data', onReplyData);
    ipcRenderer.on('reply_statustext', onReplyStatustext);
    ipcRenderer.on('reply_progresstext', onReplyProgresstxt);
    return () => {
      ipcRenderer.removeListener('reply_streaming_data', onStreamingData);
      ipcRenderer.removeListener('reply_update_data', onReplyData);
      ipcRenderer.removeListener('reply_statustext', onReplyStatustext);
      ipcRenderer.removeListener('reply_progresstext', onReplyProgresstxt);
    }
  }, [onStreamingData, onReplyData, onReplyStatustext,onReplyProgresstxt])

  const refreshHandler = e => {
    ipcRenderer.send('to_server', {cmd: 'refresh', data: {keyword:keyword, date: selectedDate}})
  }
  const queryHandler = e => {
    ipcRenderer.send('to_server', {cmd: 'get_data_freom_db', data: {keyword:keyword, date: selectedDate}})
  }

  const handlerBackgroundRefresh = (e) => {
    setbgRefresh(e.target.checked)
    ipcRenderer.send('to_server', {cmd: 'refresh_bg', data: {enable_bg: e.target.checked,keyword:keyword, date: selectedDate}})
  }

  return <div className={classes.Background}>
    <div className={classes.Search}>
      <input value={keyword} placeholder='Search..' onChange={(e)=>{setkeyword(e.target.value)}}></input>
    </div>
    <div className={classes.StatusText}>
      <p>{statustext}</p>
      <p>{progress}</p>
    </div>
    <div className={classes.Buttons}>
    <FormControlLabel
        control={
          <Switch
            checked={bgRefresh}
            onChange={handlerBackgroundRefresh}
            name="background_"
            color="primary"
          />
        }
        label="背景自動更新"
      />
      <Button clicked={refreshHandler} text='Refresh' />
    <Button clicked={queryHandler} text='Query' />
    <TextField
        id="date"
        label="感興趣時間"
        type="date"
        defaultValue={getCurrentDate('-')}
        className={materialClasses.textField}
        InputLabelProps={{
          shrink: true,
        }}
        onChange={(e)=>{setselectedDate(e.target.value)}}
        value={selectedDate}
      />
    </div>
    <div className={classes.Table}>
      <Table data={data}/>
    </div>
  </div>;
}

export default App;
