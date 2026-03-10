'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import { AuthProvider } from '../auth/AuthContext';
import { MultiTabProvider } from './MultiTabContext';
import { ModalProvider } from './ModalProvider';
import { MessageProvider } from './MessageProvider';
import '../i18n'; // Ensure i18n is initialized

export function Providers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AuthProvider>
      <MessageProvider>
        <ModalProvider>
          <MultiTabProvider>
            {children}
          </MultiTabProvider>
        </ModalProvider>
      </MessageProvider>
    </AuthProvider>
  );
}
