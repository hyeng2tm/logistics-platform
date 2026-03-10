import { createContext, useContext } from 'react';

export type ModalType = 'alert' | 'confirm' | 'info';

export interface ModalOptions {
  title: string;
  message: string;
  messageValues?: (string | number)[];
  type?: ModalType;
  onConfirm?: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
}

export interface ModalContextType {
  showAlert: (options: Omit<ModalOptions, 'type' | 'onCancel' | 'cancelText'>) => void;
  showConfirm: (options: Omit<ModalOptions, 'type'>) => void;
  showInfo: (options: Omit<ModalOptions, 'type' | 'onCancel' | 'cancelText'>) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
