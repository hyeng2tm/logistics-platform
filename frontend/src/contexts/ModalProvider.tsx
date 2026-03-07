import React, { useState, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Info, TriangleAlert } from 'lucide-react';
import { useSystemMessages } from './MessageContext';
import { ModalOptions, ModalContext } from './ModalContext';

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const { getMessage } = useSystemMessages();
  const [isOpen, setIsOpen] = useState(false);
  const [modalOptions, setModalOptions] = useState<ModalOptions | null>(null);

  const showAlert = (options: Omit<ModalOptions, 'type' | 'onCancel' | 'cancelText'>) => {
    setModalOptions({ 
      ...options, 
      type: 'alert', 
      title: t(options.title) || options.title || t('common.warning'),
      confirmText: options.confirmText || t('common.confirm') || 'OK' 
    });
    setIsOpen(true);
  };

  const showConfirm = (options: Omit<ModalOptions, 'type'>) => {
    setModalOptions({ 
      ...options, 
      type: 'confirm', 
      title: t(options.title) || options.title || t('common.confirm'),
      confirmText: options.confirmText || t('common.confirm') || 'Confirm',
      cancelText: options.cancelText || t('common.cancel') || 'Cancel'
    });
    setIsOpen(true);
  };

  const showInfo = (options: Omit<ModalOptions, 'type' | 'onCancel' | 'cancelText'>) => {
    setModalOptions({ 
      ...options, 
      type: 'info', 
      title: t(options.title) || options.title || t('common.info'),
      confirmText: options.confirmText || t('common.confirm') || 'OK' 
    });
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setTimeout(() => setModalOptions(null), 200); // Wait for transition
  };

  const handleConfirm = () => {
    if (modalOptions?.onConfirm) {
      modalOptions.onConfirm();
    }
    closeModal();
  };

  const handleCancel = () => {
    if (modalOptions?.onCancel) {
      modalOptions.onCancel();
    }
    closeModal();
  };

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, showInfo, closeModal }}>
      {children}
      
      {isOpen && modalOptions && (
        <div className="modal-overlay" onClick={handleCancel}>
          <div className="modal-content fade-in" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-container">
                {modalOptions.type === 'alert' && <TriangleAlert size={24} color="#ef4444" />}
                {modalOptions.type === 'info' && <Info size={24} color="#3b82f6" />}
                {modalOptions.type === 'confirm' && <TriangleAlert size={24} color="#f59e0b" />}
                <h3 className="modal-title">{modalOptions.title}</h3>
              </div>
              <button className="modal-close" onClick={handleCancel} title="Close modal" aria-label="Close modal">
                <X size={20} />
              </button>
            </div>
            
            <div className="modal-body">
              {getMessage(modalOptions.message, modalOptions.messageValues)}
            </div>
            
            <div className="modal-footer">
              {modalOptions.type === 'confirm' && (
                <button className="btn btn-outline" onClick={handleCancel}>
                  {modalOptions.cancelText}
                </button>
              )}
              <button 
                className={`btn ${modalOptions.type === 'alert' ? 'btn-danger' : 'btn-primary'}`} 
                onClick={handleConfirm}
              >
                {modalOptions.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  );
};
