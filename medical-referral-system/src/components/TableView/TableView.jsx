import React from 'react';
import './TableView.css';

const TableView = ({ columns, data, actions, emptyMessage = 'No data available' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="table-empty">
        <svg viewBox="0 0 24 24" className="empty-icon">
          <path
            fill="currentColor"
            d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7 10h2v7H7zm4-3h2v10h-2zm4 6h2v4h-2z"
          />
        </svg>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map((col) => (
                <td key={col.key} data-label={col.label}>
                  {col.render ? col.render(row[col.key], row, index) : row[col.key]}
                </td>
              ))}
              {actions && (
                <td className="actions-cell" data-label="Actions">
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;
