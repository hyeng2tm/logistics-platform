import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { Plus, Edit2, Trash2, Save } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useModal } from '../../contexts/ModalContext';
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
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleSave = () => {
    if (!editingRole?.id || !editingRole.name) {
      showAlert({ title: t('common.input_error'), message: t('role.messages.required') });
      return;
    }
    const isEdit = !!roles.find(r => r.id === editingRole.id);
    showConfirm({
      title: isEdit ? t('role.edit_title') : t('role.add_btn'),
      message: isEdit
        ? t('common.confirm_update') || t('common.save')
        : t('common.confirm_create') || t('common.save'),
      confirmText: t('common.save'),
      onConfirm: async () => {
        try {
          await apiClient.post('/api/v1/system/roles', editingRole);
          showAlert({ title: t('common.save_complete'), message: t('common.save_complete') });
          setEditingRole(null);
          fetchRoles();
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          showAlert({ title: t('common.save_failed'), message: t('common.save_failed_msg') + errorMessage });
        }
      }
    });
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
          if (selectedRole?.id === id) setSelectedRole(null);
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
              title={t('common.edit')} 
              onClick={(e) => { e.stopPropagation(); setEditingRole(row); }}
          >
              <Edit2 size={16} />
          </button>
          <button 
              className="pagination-btn" 
              title={t('common.delete')} 
              onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.name); }}
          >
              <Trash2 size={16} color="var(--status-danger)" />
          </button>
        </div>
      ),
      colWidth: '100px', align: 'center'
    }
  ];

  const headerActions = (
    <button className="btn btn-outline" onClick={() => setEditingRole({ id: 'ROLE_', name: '' })}>
        <Plus size={18} /> {t('role.add_btn')}
    </button>
  );

  return (
    <div className="template-page fade-in role-mgmt-page">
      <PageHeader 
        title={t('role.page_title')} 
        description={t('role.page_desc')}
        breadcrumbs={[t('common.breadcrumb.system_management'), t('sidebar.role_management')]}
        actions={headerActions}
      />

      {editingRole !== null && (
        <Card title={editingRole.id && roles.find(r => r.id === editingRole.id) ? t('role.edit_title') : t('role.new_title')} className="role-mgmt-editor-card">
             <div className="role-mgmt-editor-grid">
                 <div className="form-group role-mgmt-form-group-id">
                    <label className="form-label">{t('role.fields.id_label')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingRole.id || ''} 
                      onChange={(e) => setEditingRole({...editingRole, id: e.target.value})} 
                      readOnly={!!roles.find(r => r.id === editingRole.id)} 
                      placeholder="e.g., ROLE_MANAGER"
                      title={t('role.fields.id')}
                    />
                 </div>
                 <div className="form-group role-mgmt-form-group-name">
                    <label className="form-label">{t('role.fields.name_label')}</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editingRole.name || ''} 
                      onChange={(e) => setEditingRole({...editingRole, name: e.target.value})} 
                      placeholder="e.g., ROLE_MANAGER"
                      title={t('role.fields.name')}
                    />
                 </div>
                 <div className="role-mgmt-actions-container">
                    <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save')}</button>
                    <button className="btn btn-outline" onClick={() => setEditingRole(null)}>{t('common.cancel')}</button>
                 </div>
             </div>
        </Card>
      )}

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
                  onRowClick={(row) => setSelectedRole(row)}
                />
            )}
          </div>
        </Card>

        {/* Right: Permission Setup */}
        <Card title={selectedRole ? `[${selectedRole.name}] ${t('role.setup_title')}` : t('role.empty_msg')} className="split-view-right">
          {selectedRole ? (
            <div className="role-mgmt-permission-setup">
              <div className="role-mgmt-details-row">
                 <span className="role-mgmt-details-label">{t('role.fields.id')}</span>
                 <input 
                   type="text" 
                   className="form-input role-mgmt-details-input-disabled" 
                   defaultValue={selectedRole.id} 
                   disabled 
                   title={t('role.fields.id')}
                 />
              </div>
              <div className="role-mgmt-details-row">
                 <span className="role-mgmt-details-label">{t('role.fields.name')}</span>
                 <input 
                   type="text" 
                   className="form-input role-mgmt-details-input-disabled" 
                   defaultValue={selectedRole.name} 
                   disabled 
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
