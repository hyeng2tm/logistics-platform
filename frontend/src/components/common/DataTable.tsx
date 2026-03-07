import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import './SharedComponents.css';

export interface Column<T> {
  header: React.ReactNode;
  accessor: keyof T | ((row: T) => React.ReactNode);
  colWidth?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  selectedRowId?: string | number;
}

export function DataTable<T>({ columns, data, pagination, onRowClick, isLoading, selectedRowId }: DataTableProps<T>) {
  const { t } = useTranslation();

  return (
    <div className="data-table-container">
      <div className="table-responsive">
        <table className="data-table">
          <colgroup>
            {columns.map((col, idx) => (
              <col key={idx} width={col.colWidth} />
            ))}
          </colgroup>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  data-align={col.align || 'left'}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="table-empty-state">
                  {t('common.loading') || 'Loading...'}
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="table-empty-state">
                  {t('common.no_data') || 'No data found.'}
                </td>
              </tr>
            ) : (
              data.map((row, rIdx) => {
                const isSelected = selectedRowId && (row as { id?: string | number }).id === selectedRowId;
                return (
                  <tr 
                    key={rIdx} 
                    onClick={() => onRowClick && onRowClick(row)}
                    className={`${onRowClick ? 'clickable-row' : ''} ${isSelected ? 'active' : ''}`}
                  >
                    {columns.map((col, cIdx) => (
                      <td key={cIdx} data-align={col.align || 'left'}>
                        {typeof col.accessor === 'function' ? col.accessor(row) : (row[col.accessor as keyof T] as React.ReactNode)}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="table-pagination">
          <button 
            className="pagination-btn" 
            disabled={pagination.currentPage === 1}
            onClick={() => pagination.onPageChange(1)}
            title={t('common.pagination.first')}
          >
            <ChevronsLeft size={16} />
          </button>
          <button 
            className="pagination-btn" 
            disabled={pagination.currentPage === 1}
            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            title={t('common.pagination.previous')}
          >
            <ChevronLeft size={16} />
          </button>
          
          <span className="pagination-info">
            <strong>{pagination.currentPage}</strong> / {pagination.totalPages}
          </span>
          
          <button 
            className="pagination-btn" 
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            title={t('common.pagination.next')}
          >
            <ChevronRight size={16} />
          </button>
          <button 
            className="pagination-btn" 
            disabled={pagination.currentPage === pagination.totalPages}
            onClick={() => pagination.onPageChange(pagination.totalPages)}
            title={t('common.pagination.last')}
          >
            <ChevronsRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
