import React, { useState, useEffect, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../utils/apiClient';
import { useAuth } from '../auth/AuthContext';
import { SystemMessage, MessageContextType, MessageContext } from './MessageContext';


export const MessageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t, i18n } = useTranslation();
  const { isAuthenticated } = useAuth();
  const [rawMessages, setRawMessages] = useState<SystemMessage[]>([]);
  const [processedMessages, setProcessedMessages] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!isAuthenticated) return;
    
    setIsLoading(true);
    try {
      const data = await apiClient.get<SystemMessage[]>('/api/v1/system/messages');
      setRawMessages(data);
    } catch (error) {
      console.error("Failed to fetch system messages:", error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchMessages();
    }
  }, [fetchMessages, isAuthenticated]);

  useEffect(() => {
    const lang = i18n.resolvedLanguage || i18n.language || 'ko';
    const baseLang = lang.split('-')[0];
    
    const mapped: Record<string, string> = {};
    rawMessages.forEach(msg => {
      const translation = msg.translations[baseLang] || 
                          msg.translations['ko'] || 
                          Object.values(msg.translations)[0];
      
      mapped[msg.messageKey] = translation || (msg.description || msg.messageKey);
    });
    
    setProcessedMessages(mapped);
  }, [rawMessages, i18n.language, i18n.resolvedLanguage]);

  const getMessage = useCallback((key: string, values?: (string | number)[], fallback?: string) => {
    let msg = processedMessages[key] || t(key) || fallback || key;
    if (values && values.length > 0) {
      values.forEach((val, index) => {
        msg = msg.replace(`{${index}}`, String(val));
      });
    }
    return msg;
  }, [processedMessages, t]);

  const value: MessageContextType = {
    messages: processedMessages,
    getMessage,
    refreshMessages: fetchMessages,
    isLoading
  };

  return (
    <MessageContext.Provider value={value}>
      {children}
    </MessageContext.Provider>
  );
};
