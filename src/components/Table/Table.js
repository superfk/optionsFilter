import React from 'react';
import BaseTable, { Column } from 'react-base-table'
import 'react-base-table/styles.css'

import classes from './Table.module.css';

const Table = props => {

    const columns = [
        {
          key: 'contractSymbol',
          title: 'contractSymbol',
          dataKey: 'contractSymbol',
          width: 200,
          resizable: true,
          sortable: true,
          frozen: Column.FrozenDirection.LEFT,
        },
        {
          key: 'symbol',
          title: 'symbol',
          dataKey: 'symbol',
          width: 100,
          align: Column.Alignment.CENTER,
          resizable: true,
          sortable: true,
        },
        {
          key: 'strike',
          title: 'strike',
          dataKey: 'strike',
          width: 100,
          align: Column.Alignment.CENTER,
          resizable: true,
          sortable: true,
        },
        {
          key: 'currentPrice',
          title: 'currentPrice',
          dataKey: 'currentPrice',
          width: 100,
          align: Column.Alignment.RIGHT,
          resizable: true,
          sortable: true,
        },
        {
          key: 'lastPrice',
          title: 'lastPrice',
          dataKey: 'lastPrice',
          width: 100,
          align: Column.Alignment.CENTER,
          resizable: true,
          sortable: true,
        },
        {
          key: 'cp',
          title: 'cp',
          dataKey: 'cp',
          width: 100,
          resizable: true,
          sortable: true,
        },
        {
          key: 'expiration',
          title: 'expiration',
          dataKey: 'expiration',
          width: 200,
          resizable: true,
          sortable: true,
        }
      ]


    return <BaseTable columns={columns} data={props.data} fixed width={1200} height={600} {...props}>
  </BaseTable>
}

export default Table;
