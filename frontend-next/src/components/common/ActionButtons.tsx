'use client';

import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import './SharedComponents.css';

interface ActionButtonsProps {
  left?: ReactNode;
  right?: ReactNode;
  onCancel?: () => void;
  onSave?: () => void;
  cancelText?: string;
  saveText?: string;
  className?: string;
  align?: 'left' | 'center' | 'right';
  children?: ReactNode;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({ 
  left, 
  right, 
  onCancel,
  onSave,
  cancelText,
  saveText,
  className,
  align = 'center',
  children
}) => {
  const { t } = useTranslation();
  
  const finalCancelText = cancelText || t('common.cancel') || 'Cancel';
  const finalSaveText = saveText || t('common.save') || 'Save';

  const defaultRight = (
    <>
      {onCancel && <button type="button" className="btn btn-outline" onClick={onCancel}>{finalCancelText}</button>}
      {onSave && <button type="button" className="btn btn-primary" onClick={onSave}>{finalSaveText}</button>}
    </>
  );

  return (
    <div className={classNames('form-action-buttons', `align-${align}`, className)}>
      {left}
      {children}
      {right || defaultRight}
    </div>
  );
};
