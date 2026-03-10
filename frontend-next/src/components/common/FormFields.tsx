'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import classNames from 'classnames';
import './SharedComponents.css';

// Input Field
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fullWidth?: boolean;
}

export const InputField = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = true, className, ...props }, ref) => {
    return (
      <div className={classNames('form-field-group', { 'full-width': fullWidth }, className)}>
        <label className="form-label">{label}</label>
        <input 
          ref={ref} 
          className={classNames('form-input', { 'has-error': error })} 
          {...props} 
        />
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);
InputField.displayName = 'InputField';

// Select Field
interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: SelectOption[];
  error?: string;
  fullWidth?: boolean;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, fullWidth = true, className, ...props }, ref) => {
    return (
      <div className={classNames('form-field-group', { 'full-width': fullWidth }, className)}>
        <label className="form-label">{label}</label>
        <select 
          ref={ref} 
          className={classNames('form-select', { 'has-error': error })} 
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <span className="form-error">{error}</span>}
      </div>
    );
  }
);
SelectField.displayName = 'SelectField';

// Date Picker (Single)
interface DatePickerProps {
  label: string;
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  fullWidth?: boolean;
  className?: string;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  label, selected, onChange, placeholderText, fullWidth = true, className
}) => {
  return (
    <div className={classNames('form-field-group', { 'full-width': fullWidth }, className)}>
      <label className="form-label">{label}</label>
      <ReactDatePicker
        selected={selected}
        onChange={(date: Date | null) => onChange(date)}
        placeholderText={placeholderText}
        className="form-input"
        dateFormat="yyyy-MM-dd"
        isClearable
        autoComplete="off"
        portalId="datepicker-portal"
      />
    </div>
  );
};

// Date Range Picker
interface DateRangePickerProps {
  label: string;
  startDate: Date | null;
  endDate: Date | null;
  onChange: (start: Date | null, end: Date | null) => void;
  fullWidth?: boolean;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  label, startDate, endDate, onChange, fullWidth = true, className
}) => {
  return (
    <div className={classNames('form-field-group', { 'full-width': fullWidth }, className)}>
      <label className="form-label">{label}</label>
      <div className="date-range-container">
        <div className="range-picker-item">
          <ReactDatePicker
            selected={startDate}
            onChange={(date: Date | null) => onChange(date, endDate)}
            selectsStart
            startDate={startDate}
            endDate={endDate}
            placeholderText="시작일"
            className="form-input"
            dateFormat="yyyy-MM-dd"
            isClearable
            autoComplete="off"
            portalId="datepicker-portal"
          />
        </div>
        <span className="date-range-separator">~</span>
        <div className="range-picker-item">
          <ReactDatePicker
            selected={endDate}
            onChange={(date: Date | null) => onChange(startDate, date)}
            selectsEnd
            startDate={startDate}
            endDate={endDate}
            minDate={startDate || undefined}
            placeholderText="종료일"
            className="form-input"
            dateFormat="yyyy-MM-dd"
            isClearable
            autoComplete="off"
            portalId="datepicker-portal"
          />
        </div>
      </div>
    </div>
  );
};

// Action Buttons Row (Save/Cancel)
interface ActionButtonsProps {
  onCancel?: () => void;
  onSave?: () => void;
  cancelText?: string;
  saveText?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  onCancel, onSave, cancelText, saveText, align = 'right', className
}) => {
  const { t } = useTranslation();
  const finalCancelText = cancelText || t('common.cancel') || 'Cancel';
  const finalSaveText = saveText || t('common.save') || 'Save';

  return (
    <div className={classNames('form-action-buttons', `align-${align}`, className)}>
      {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>{finalCancelText}</button>}
      {onSave && <button type="button" className="btn btn-primary" onClick={onSave}>{finalSaveText}</button>}
    </div>
  );
};
