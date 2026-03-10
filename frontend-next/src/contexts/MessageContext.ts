import { createContext, useContext } from 'react';

export interface SystemMessage {
  messageKey: string;
  category: string;
  description: string;
  translations: Record<string, string>;
}

export interface MessageContextType {
  messages: Record<string, string>;
  getMessage: (key: string, values?: (string | number)[], fallback?: string) => string;
  refreshMessages: () => Promise<void>;
  isLoading: boolean;
}

export const MessageContext = createContext<MessageContextType | undefined>(undefined);

export const useSystemMessages = () => {
  const context = useContext(MessageContext);
  if (!context) {
    throw new Error('useSystemMessages must be used within a MessageProvider');
  }
  return context;
};
