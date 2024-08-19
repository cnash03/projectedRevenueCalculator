import React from 'react';
import PivotTable from 'react-pivottable/PivotTable';
import DataTable from 'react-data-table-component';
import 'react-pivottable/pivottable.css';
import './PivotTable.css';

const StaticPivotTable = ({ data }) => {
    const pivotConfig = {
        rows: ['SubsName'],
        cols: ['Revenue'],
        vals: ['Revenue'],
        aggregatorName: 'Count',
    };

    // Helper function to convert revenue string to number
    const parseRevenue = (revenueStr) => {
        return parseFloat(revenueStr.replace(/[$,]/g, '')) || 0;
    };

    // Count occurrences of each SubsName and get the associated Revenue
    const subsNameCounts = data.reduce((acc, item) => {
        let revenue = parseRevenue(item.Revenue);
            // Apply different calculations based on the SubsName pattern
        if (item.SubsName.includes('1xW')) {
            revenue *= 52;  
        } else if (item.SubsName.includes('2xW')) {
            revenue *= 52*2;  
        } else if (item.SubsName.includes('3xW')) {
            revenue *= 52*3;
        } else if (item.SubsName.includes('bW')) {
            revenue *= 26;  
        }   
        if (!acc[item.SubsName]) {
            acc[item.SubsName] = {
                count: 0,
                revenue: revenue  // Store the first encountered Revenue
            };
        }
        acc[item.SubsName].count += 1;
        return acc;
    }, {});

    // Convert the counts object to an array for DataTable
    const tableData = Object.keys(subsNameCounts).map((subsName, index) => ({
        id: index + 1,
        SubsName: subsName,
        Count: subsNameCounts[subsName].count,
        Revenue: subsNameCounts[subsName].revenue,
    }));

    // Sort tableData by SubsName in ASCII order
    tableData.sort((a, b) => (a.SubsName < b.SubsName ? -1 : a.SubsName > b.SubsName ? 1 : 0));

    // Calculate totals for 12 Month Revenue and Monthly Revenue
    const total12MonthRevenue = tableData.reduce((sum, row) => sum + (row.Count * row.Revenue), 0);
    const totalMonthlyRevenue = tableData.reduce((sum, row) => sum + (row.Count * row.Revenue / 12), 0);

    // Add total row to the tableData
    tableData.push({
        id: 1,
        SubsName: 'Total',
        Total12MonthRevenue: total12MonthRevenue,
        TotalMonthlyRevenue: totalMonthlyRevenue,
    });

    const columns = [
        {
            name: '12 Month Revenue',
            selector: row => row.SubsName === 'Total' 
                ? `$${row.Total12MonthRevenue.toFixed(2)}`
                : `$${(row.Revenue * row.Count).toFixed(2)}`,
            sortable: true,
        },
        {
            name: 'Monthly Revenue',
            selector: row => row.SubsName === 'Total'
                ? `$${row.TotalMonthlyRevenue.toFixed(2)}`
                : `$${(row.Revenue * row.Count / 12).toFixed(2)}`,
            sortable: true,
        },
    ];

    return (
        <div className="table-container">
            <div className="pivot-table">
                <PivotTable
                    data={data}
                    {...pivotConfig}
                />
            </div>
            <div className="data-table">
                <DataTable
                    columns={columns}
                    data={tableData}
                />
            </div>
        </div>
    );
};

export default StaticPivotTable;
