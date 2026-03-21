'use client';

import React, { useState } from 'react';
import { Card } from './Card';
import { FileCode, Copy, Check } from 'lucide-react';

interface SourceCodeViewerProps {
  code: string;
  language?: string;
  title?: string;
}

export const SourceCodeViewer: React.FC<SourceCodeViewerProps> = ({ 
  code, 
  language = 'tsx', 
  title = 'Source Code' 
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card 
      title={<><FileCode size={20} className="me-2 text-accent-blue" /> {title}</>} 
      collapsible 
      defaultCollapsed
      className="mt-32"
      headerActions={
        <button 
          className="btn btn-outline btn-xs flex items-center gap-4 py-4 px-8 source-code-copy-btn" 
          onClick={(e) => { e.stopPropagation(); handleCopy(); }}
          data-language={language}
        >
          {copied ? <Check size={14} className="text-status-success" /> : <Copy size={14} />}
          <span>{copied ? 'Copied!' : 'Copy Source'}</span>
        </button>
      }
    >
      <pre className="code-block">
        <code>{code}</code>
      </pre>
    </Card>
  );
};
