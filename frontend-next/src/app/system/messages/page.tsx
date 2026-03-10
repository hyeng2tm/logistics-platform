'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { Save, Plus, Eraser, Bell, CheckCircle } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { useModal } from '../../../contexts/ModalContext';

import './MessageManagement.css';

interface MessageData {
  id: number;
  messageKey: string;
  category: string;
  description: string;
  translations: Record<string, string>;
}

interface CodeDetail {
  code: string;
  label: string;
  translations: Record<string, string>;
}

const supportedLanguages = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'ja', label: '日本語' },
  { code: 'zh', label: '中文' }
];

const MessageManagement: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [categories, setCategories] = useState<CodeDetail[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageData | null>(null);
  const [formData, setFormData] = useState<Partial<MessageData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMessages = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<MessageData[]>('/api/v1/system/messages');
      setMessages(data);
    } catch (error) {
      console.warn("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const data = await apiClient.get<CodeDetail[]>('/api/v1/system/codes/detail/MSG-001');
      setCategories(data);
    } catch (error) {
      console.warn("Error fetching message categories:", error);
    }
  }, []);

  useEffect(() => {
    fetchMessages();
    fetchCategories();
  }, [fetchMessages, fetchCategories]);

  useEffect(() => {
    if (selectedMessage) {
      setFormData(selectedMessage);
    }
  }, [selectedMessage]);

  const handleCreateNew = () => {
    setSelectedMessage(null);
    setFormData({ messageKey: '', category: categories[0]?.code || 'ALERT', description: '', translations: {} });
  };

  const handleSave = () => {
    if (!formData.messageKey) {
        showAlert({ title: t('common.input_error'), message: t('system.message_key_required', '메시지 키를 입력해주세요.') });
        return;
    }
    const isEdit = !!formData.id;
    showConfirm({
      title: isEdit ? t('common.edit') : t('common.add'),
      message: isEdit
        ? t('system.confirm_update_msg', '메시지 정보를 수정하시겠습니까?')
        : t('system.confirm_create_msg', '새 메시지를 생성하시겠습니까?'),
      confirmText: t('common.save'),
      onConfirm: async () => {
        try {
          await apiClient.post('/api/v1/system/messages', formData);
          showAlert({ title: t('common.save_complete'), message: t('system.save_success_msg', '메시지가 성공적으로 저장되었습니다.') });
          fetchMessages();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + ': ' + message });
        }
      }
    });
  };

  const handleDelete = async () => {
    if (!formData.id) return;
    
    showConfirm({
      title: t('system.delete_confirm_title', '메시지 삭제 확인'),
      message: t('system.delete_confirm_msg', '정말 이 메시지를 삭제하시겠습니까?'),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/v1/system/messages/${formData.id}`);
          showAlert({ title: t('common.delete_complete'), message: t('system.delete_success_msg', '메시지가 삭제되었습니다.') });
          setFormData({});
          setSelectedMessage(null);
          fetchMessages();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + ': ' + message });
        }
      }
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name.startsWith('trans_')) {
      const langCode = name.replace('trans_', '');
      setFormData(prev => ({
        ...prev,
        translations: {
          ...(prev.translations || {}),
          [langCode]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const getDisplayLabel = (code: CodeDetail) => {
    const lang = i18n.resolvedLanguage || i18n.language || 'ko';
    const baseLang = lang.split('-')[0];
    return (code.translations && code.translations[baseLang]) || code.label;
  };

  const filteredMessages = messages.filter(m => 
    m.messageKey.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const headerActions = (
    <button className="btn btn-primary" onClick={handleCreateNew}><Plus size={18} /> {t('system.add_message', '새 메시지 추가')}</button>
  );

  return (
    <div className="page-container">
      <PageHeader 
        title={t('system.message_management', '메시지 관리')} 
        description={t('system.message_management_desc', '시스템에서 사용하는 알람 및 컨펌 메시지를 다국어로 관리합니다.')}
        breadcrumbs={[t('sidebar.system_management'), t('system.message_management')]}
        actions={headerActions}
      />

      <div className="split-view-container">
        {/* Left: Message List */}
        <Card title={t('system.message_list', '메시지 목록')} noPadding className="split-view-left message-mgmt-list-card">
          <div className="message-mgmt-search-box">
             <input 
               type="text" 
               className="form-input" 
               placeholder={t('common.search_placeholder', '검색어 입력...')} 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          <div className="message-mgmt-list-container">
            {loading ? (
                <div className="message-mgmt-loading">{t('common.loading')}</div>
            ) : (
                <div className="message-mgmt-list-wrapper">
                   {filteredMessages.map(msg => (
                     <div 
                       key={msg.id} 
                       className={`message-mgmt-list-item ${formData.id === msg.id ? 'active' : ''}`}
                       onClick={() => { setSelectedMessage(msg); setFormData(msg); }}
                     >
                        <div className="message-mgmt-item-icon">
                           {msg.category === 'CONFIRM' ? <CheckCircle size={16} color="#05CD99" /> : <Bell size={16} color="#FF5B5B" />}
                        </div>
                        <div className="message-mgmt-item-info">
                           <div className="message-mgmt-item-key">{msg.messageKey}</div>
                           <div className="message-mgmt-item-desc">{msg.description}</div>
                        </div>
                     </div>
                   ))}
                   {filteredMessages.length === 0 && <div className="message-mgmt-empty-search">{t('common.no_data')}</div>}
                </div>
            )}
          </div>
        </Card>

        {/* Right: Selected Message Details */}
        <Card title={formData.id ? t('system.edit_message', '메시지 수정') : t('system.create_message', '새 메시지 생성')} className="split-view-right" headerActions={
          Object.keys(formData).length > 0 && (
             <div className="message-mgmt-actions">
                {formData.id && (
                  <button className="btn btn-outline message-mgmt-delete-btn" onClick={handleDelete} title={t('common.delete')}><Eraser size={16} /> {t('common.delete')}</button>
                )}
                <button className="btn btn-primary" onClick={handleSave} title={t('common.save')}><Save size={16} /> {t('common.save')}</button>
             </div>
          )
        }>
          {Object.keys(formData).length > 0 ? (
            <div className="message-mgmt-form-container">
              <div className="form-row">
                <div className="message-mgmt-form-group flex-1">
                  <label className="form-label">{t('system.message_key', '메시지 키')}</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    name="messageKey" 
                    value={formData.messageKey || ''} 
                    onChange={handleChange} 
                    placeholder="e.g., msg.save_confirm" 
                  />
                </div>
                <div className="message-mgmt-form-group w-150">
                  <label className="form-label">{t('common.category', '분류')}</label>
                  <select 
                    className="form-input" 
                    name="category" 
                    value={formData.category || (categories[0]?.code || 'ALERT')} 
                    onChange={handleChange}
                    title={t('common.category')}
                  >
                    {categories.map(cat => (
                      <option key={cat.code} value={cat.code}>
                        {cat.code} ({getDisplayLabel(cat)})
                      </option>
                    ))}
                    {categories.length === 0 && (
                      <>
                        <option value="ALERT">ALERT (알람)</option>
                        <option value="CONFIRM">CONFIRM (확인)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="message-mgmt-form-group">
                <label className="form-label">{t('common.description', '설명')}</label>
                <textarea 
                  className="form-input" 
                  name="description" 
                  value={formData.description || ''} 
                  onChange={handleChange} 
                  rows={2}
                  placeholder={t('system.message_desc_placeholder', '메시지 용도 및 위치 설명')}
                />
              </div>

              <div className="message-mgmt-translations-section">
                <h4 className="section-title">{t('system.translations', '언어별 메시지 내용')}</h4>
                <div className="message-mgmt-translations-grid text-white">
                  {supportedLanguages.map(lang => (
                    <div key={lang.code} className="message-mgmt-form-group">
                      <label className="form-label">{lang.label} ({lang.code.toUpperCase()})</label>
                      <textarea 
                        className="form-input" 
                        name={`trans_${lang.code}`} 
                        value={formData.translations?.[lang.code] || ''} 
                        onChange={handleChange} 
                        rows={3}
                        placeholder={`${lang.label} 내용을 입력하세요.`} 
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="message-mgmt-empty">
              {t('system.select_message_msg', '좌측 목록에서 메시지를 선택하거나 새 메시지를 추가하세요.')}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default MessageManagement;
