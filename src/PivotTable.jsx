import React, {useState} from 'react';
import ReactDOM from 'react-dom';
import PivotTable from 'react-pivottable/PivotTable';
import 'react-pivottable/pivottable.css';

const StaticPivotTable = ({ data }) => {
    const pivotConfig = {
      rows: ['SubsName'],
      cols: ['Revenue'],
      vals: ['Revenue', '12 month revenue', 'Monthly revenue', 'COUNTA of Revenue', 'Grand Total'],
      aggregatorName: 'Count',
    };
  
    return (
      <PivotTable
        data={data}
        {...pivotConfig}
      />
    );
  };
  
  export default StaticPivotTable;