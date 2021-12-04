import React, {useEffect, useRef} from 'react';
import 'react-tabulator/lib/styles.css'; // required styles
import 'react-tabulator/lib/css/tabulator.min.css'; // theme
import { ReactTabulator } from 'react-tabulator';

import classes from './Table.module.css';


const Table = props => {

  const tableRef = useRef();

    const columns = [
        {
          title: 'contractSymbol',
          field: 'contractSymbol',
          headerFilter:"input",
        },
        {
          title: 'symbol',
          field: 'symbol',
          headerFilter:"input",
        },
        {
          title: 'strike',
          field: 'strike',
          headerFilter:"number", headerFilterPlaceholder:"at least...", headerFilterFunc:">=",
          sorter:"number"
        },
        {
          title: 'currentPrice',
          field: 'currentPrice',
          headerFilter:"number", headerFilterPlaceholder:"at least...", headerFilterFunc:">=",
          sorter:"number"
        },
        {
          title: 'lastPrice',
          field: 'lastPrice',
          headerFilter:"number", headerFilterPlaceholder:"at least...", headerFilterFunc:">=",
          sorter:"number"
        },
        {
          title: 'cp',
          field: 'cp',
          headerFilter:"number", headerFilterPlaceholder:"at least...", headerFilterFunc:">=",
          sorter:"number"
        },
        {
          title: 'expiration',
          field: 'expiration',
          headerFilter:"input",
          sorter:"date"
        },
        {
          title: 'optionType',
          headerFilter:"input",
          field: 'optionType'
        }
      ]
    
    const options = {
        height: 600,
        groupBy:"optionType",
        paginationDataSent: {
          page: 'page',
          size: 'per_page' // change 'size' param to 'per_page'
        },
        paginationDataReceived: {
          last_page: 'total_pages'
        },
        current_page: 1,
        paginationSize: 3
      }

    useEffect(() => {
      tableRef.current.table.setData(props.data)
    }, [props.data])
    


    return <ReactTabulator 
    ref={tableRef}
    layout="fitColumns"
    columns={columns}
    data={[]}
    options={options}
    />
}

export default Table;
