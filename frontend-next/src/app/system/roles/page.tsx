'use client';

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import classNames from 'classnames';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { DataTable, Column } from '../../../components/common/DataTable';
import { Plus, Eraser, Save } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import { useModal } from '../../../contexts/ModalContext';
import './RoleManagement.css';

// Mock Data
interface RoleData {
  id: string;
  name: string;
  userCount?: number;
}

const RoleManagement: React.FC = () => {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingRole, setEditingRole] = useState<Partial<RoleData> | null>(null);

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<RoleData[]>('/api/v1/system/roles');
      setRoles(data);
    } catch (error) {
      console.warn("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSave = () => {
    const dataToSave = editingRole || selectedRole;
    if (!dataToSave?.id || !dataToSave.name) {
      showAlert({ title: t('common.input_error'), message: t('role.messages.required') });
      return;
    }
    const isEdit = !!roles.find(r => r.id === dataToSave.id);
    showConfirm({
      title: isEdit ? t('role.edit_title') : t('role.add_btn'),
      message: isEdit
        ? t('common.confirm_update') || t('common.save')
        : t('common.confirm_create') || t('common.save'),
      confirmText: t('common.save'),
      onConfirm: async () => {
        try {
          await apiClient.post('/api/v1/system/roles', dataToSave);
          showAlert({ title: t('common.save_complete'), message: t('common.save_complete') });
          setEditingRole(null);
          // If we were creating new, select it or refresh
          fetchRoles();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + errorMessage });
        }
      }
    });
  };

  const handleCreateNew = () => {
    setSelectedRole(null);
    setEditingRole({ id: 'ROLE_', name: '' });
  };

  const handleDelete = async (id: string, name: string) => {
    showConfirm({
      title: t('common.delete'),
      message: t('role.messages.delete_confirm', { name }),
      confirmText: t('common.delete'),
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/v1/system/roles/${id}`);
          showAlert({ title: t('common.delete_complete'), message: t('common.delete_complete') });
          if (selectedRole?.id === id) {
            setSelectedRole(null);
            setEditingRole(null);
          }
          fetchRoles();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.delete_failed'), message: t('common.delete_failed_msg') + errorMessage });
        }
      }
    });
  };

  const columns: Column<RoleData>[] = [
    { header: t('role.fields.id'), accessor: 'id' },
    { header: t('role.fields.name'), accessor: 'name' },
    {
      header: t('role.fields.actions'),
      accessor: (row) => (
        <div className="role-mgmt-table-actions">
          <button 
              className="pagination-btn" 
              title={t('common.delete')} 
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.name); }}
          >
              <Eraser size={16} color="var(--status-danger)" />
          </button>
        </div>
      ),
      colWidth: '80px', align: 'center'
    }
  ];

  const headerActions = (
    <button className="btn btn-primary" onClick={handleCreateNew}>
        <Plus size={18} /> {t('role.add_btn')}
    </button>
  );

  const currentRole = editingRole || selectedRole;

  return (
    <div className="template-page fade-in role-mgmt-page">
      <PageHeader 
        title={t('role.page_title')} 
        description={t('role.page_desc')}
        breadcrumbs={[t('common.breadcrumb.system_management'), t('sidebar.role_management')]}
        actions={headerActions}
      />

      <div className="role-mgmt-main-grid">
        {/* Left: Role List */}
        <Card title={t('role.list_title')} noPadding className="split-view-left">
          <div className="role-mgmt-list-container">
            {loading ? (
                <div className="role-mgmt-loading">{t('common.please_wait')}</div>
            ) : (
                <DataTable 
                  columns={columns} 
                  data={roles} 
                  onRowClick={(row) => { setSelectedRole(row); setEditingRole(null); }}
                  selectedRowId={selectedRole?.id}
                />
            )}
          </div>
        </Card>

        {/* Right: Permission Setup & Details */}
        <Card 
          title={editingRole ? t('role.new_title') : selectedRole ? `[${selectedRole.name}] ${t('role.setup_title')}` : t('role.empty_msg')} 
          className="split-view-right"
          headerActions={currentRole && (
            <div className="flex gap-8">
              <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save')}</button>
              {editingRole && <button className="btn btn-outline" onClick={() => setEditingRole(null)}>{t('common.cancel')}</button>}
            </div>
          )}
        >
          {currentRole ? (
            <div className="role-mgmt-permission-setup">
              <div className="role-mgmt-details-row">
                 <span className="role-mgmt-details-label">{t('role.fields.id')}</span>
                 <input 
                   type="text" 
                   className={classNames("form-input", { "role-mgmt-details-input-disabled": !editingRole })} 
                   value={currentRole.id || ''} 
                   onChange={(e) => editingRole ? setEditingRole({...editingRole, id: e.target.value}) : null}
                   disabled={!editingRole} 
                   title={t('role.fields.id')}
                 />
              </div>
              <div className="role-mgmt-details-row">
                 <span className="role-mgmt-details-label">{t('role.fields.name')}</span>
                 <input 
                   type="text" 
                   className="form-input" 
                   value={currentRole.name || ''} 
                   onChange={(e) => {
                     if (editingRole) setEditingRole({...editingRole, name: e.target.value});
                     else setSelectedRole({...selectedRole!, name: e.target.value});
                   }}
                   title={t('role.fields.name')}
                 />
              </div>

              <hr className="role-mgmt-divider" />

              <div className="role-mgmt-placeholder-box">
                {t('role.messages.placeholder_box')}
              </div>

            </div>
          ) : (
            <div className="role-mgmt-empty-state">
              {t('role.empty_hint')}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default RoleManagement;
