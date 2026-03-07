import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { DataTable, Column } from '../../components/common/DataTable';
import { InputField, SelectField } from '../../components/common/FormFields';
import { Search, Plus, Download, Edit2, Trash2, Save } from 'lucide-react';
import { apiClient } from '../../utils/apiClient';
import { useModal } from '../../contexts/ModalContext';
import { Modal } from '../../components/common/Modal';

// Mock Data for Users
interface UserData {
  id: string;
  username: string;
  name: string;
  department: string;
  roleId: string;
  lastLogin?: string;
  status: 'active' | 'inactive';
  language: string;
  email?: string;
  password?: string;
}

const UserManagement: React.FC = () => {
  const { t } = useTranslation();
  const { showAlert, showConfirm } = useModal();
  const [users, setUsers] = useState<UserData[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Form State
  const [editingUser, setEditingUser] = useState<Partial<UserData> | null>(null);

  // Filter State
  const [filterDept, setFilterDept] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSearch, setFilterSearch] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserData[]>([]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<UserData[]>('/api/v1/system/users');
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  React.useEffect(() => {
    setFilteredUsers(users);
  }, [users]);

  const handleFilter = useCallback(() => {
    let result = [...users];

    if (filterDept) {
      result = result.filter(u => u.department === filterDept);
    }
    if (filterRole) {
      result = result.filter(u => u.roleId === filterRole);
    }
    if (filterStatus) {
      result = result.filter(u => u.status === filterStatus);
    }
    if (filterSearch) {
      const search = filterSearch.toLowerCase().trim();
      result = result.filter(u => 
        u.name.toLowerCase().includes(search) || 
        u.id.toLowerCase().includes(search)
      );
    }

    setFilteredUsers(result);
    setCurrentPage(1);
  }, [users, filterDept, filterRole, filterStatus, filterSearch]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleFilter();
    }
  };

  const handleSave = () => {
    if (!editingUser?.id || !editingUser.username || !editingUser.name || !editingUser.roleId) {
      showAlert({ title: '입력 오류', message: '사번/ID, 로그인 ID, 이름, 권한 그룹을 모두 입력해주세요.' });
      return;
    }
    const isEdit = !!users.find(u => u.id === editingUser.id);
    showConfirm({
      title: isEdit ? '사용자 정보 수정' : '신규 사용자 등록',
      message: isEdit
        ? '사용자 정보를 수정하시겠습니까?'
        : '새 사용자를 등록하시겠습니까?',
      confirmText: '저장',
      onConfirm: async () => {
        try {
          await apiClient.post('/api/v1/system/users', { ...editingUser, status: editingUser.status || 'active' });
          showAlert({ title: '저장 완료', message: '사용자 정보가 성공적으로 저장되었습니다.' });
          setEditingUser(null);
          fetchUsers();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: '저장 실패', message: '저장에 실패했습니다:\n' + message });
        }
      }
    });
  };

  const handleDelete = async (id: string, name: string) => {
    showConfirm({
      title: '사용자 삭제',
      message: `정말 [${name}] 계정을 삭제하시겠습니까?`,
      confirmText: '삭제',
      onConfirm: async () => {
        try {
          await apiClient.delete(`/api/v1/system/users/${id}`);
          showAlert({ title: '삭제 완료', message: '사용자 계정이 삭제되었습니다.' });
          fetchUsers();
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          showAlert({ title: '삭제 실패', message: '삭제에 실패했습니다:\n' + message });
        }
      }
    });
  };

  const columns: Column<UserData>[] = [
    { header: t('user.fields.id'), accessor: 'id', colWidth: '100px' },
    { header: t('user.fields.username'), accessor: 'username', colWidth: '120px' },
    { header: t('user.fields.name'), accessor: 'name', colWidth: '120px' },
    { header: t('user.fields.email'), accessor: 'email', colWidth: '200px' },
    { header: t('user.fields.dept'), accessor: 'department' },
    { header: t('user.fields.role'), accessor: 'roleId' },
    { header: t('user.fields.language'), accessor: (row) => row.language === 'ko' ? t('common.languages.ko') : row.language === 'en' ? t('common.languages.en') : row.language === 'ja' ? t('common.languages.ja') : row.language === 'zh' ? t('common.languages.zh') : row.language, colWidth: '100px' },
    { header: t('user.fields.last_login'), accessor: 'lastLogin' },
    { 
      header: t('user.fields.status'), 
      accessor: (row) => (row.status === 'active' ? t('user.status.active') : t('user.status.inactive')),
      colWidth: '120px'
    },
    {
      header: t('user.fields.actions'),
      accessor: (row) => (
        <div className="flex gap-8">
          <button className="pagination-btn" title={t('common.edit')} onClick={(e) => { e.stopPropagation(); setEditingUser(row); }}><Edit2 size={16} /></button>
          <button className="pagination-btn" title={t('common.delete')} onClick={(e) => { e.stopPropagation(); handleDelete(row.id, row.name); }}><Trash2 size={16} color="var(--status-danger)" /></button>
        </div>
      ),
      colWidth: '120px',
      align: 'center'
    }
  ];

  const headerActions = (
    <>
      <button className="btn btn-outline" onClick={() => showAlert({title: '안내', message: '현재 외부 기능입니다.'})}>
         <Download size={18} /> 계정 엑셀 다운로드
      </button>
      <button className="btn btn-primary" onClick={() => setEditingUser({ id: '', username: '', name: '', department: '', roleId: 'ROLE_USER', status: 'active', language: 'ko', email: '', password: '' })}>
         <Plus size={18} /> 신규 사용자 등록
      </button>
    </>
  );

  return (
    <div className="template-page fade-in">
      <PageHeader 
        title={t('user.page_title')} 
        description={t('user.page_desc')}
        breadcrumbs={[t('common.breadcrumb.system_management'), t('sidebar.user_management')]}
        actions={headerActions}
      />

      <Modal 
        isOpen={editingUser !== null} 
        onClose={() => setEditingUser(null)}
        title={editingUser?.id && users.find(u => u.id === editingUser.id) ? t('user.edit_title') : t('user.add_btn')}
        size="lg"
        footer={(
          <div className="flex gap-8">
            <button className="btn btn-outline" onClick={() => setEditingUser(null)}>{t('common.cancel')}</button>
            <button className="btn btn-primary" onClick={handleSave}><Save size={16} /> {t('common.save')}</button>
          </div>
        )}
      >
        <div className="grid grid-cols-2 gap-16">
          <InputField 
            label={t('user.fields.id')} 
            value={editingUser?.id || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, id: e.target.value} : null)} 
            readOnly={!!users.find(u => u.id === editingUser?.id)} 
            placeholder="EMP1001" 
          />
          <InputField 
            label={t('user.fields.username')} 
            value={editingUser?.username || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, username: e.target.value} : null)} 
            placeholder="admin" 
          />
          <InputField 
            label={t('user.fields.name')} 
            value={editingUser?.name || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, name: e.target.value} : null)} 
            placeholder="Name" 
          />
          <InputField 
            label={t('user.fields.email')} 
            value={editingUser?.email || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, email: e.target.value} : null)} 
            placeholder="admin@logistics.com" 
          />
          <InputField 
            label={t('user.fields.password')} 
            type="password"
            value={editingUser?.password || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, password: e.target.value} : null)} 
            placeholder={editingUser?.id && users.find(u => u.id === editingUser?.id) ? t('user.messages.password_hint') : t('user.fields.password')} 
          />
          <InputField 
            label={t('user.fields.dept')} 
            value={editingUser?.department || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, department: e.target.value} : null)} 
            placeholder="IT team" 
          />
          <InputField 
            label={t('user.fields.role')} 
            value={editingUser?.roleId || ''} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, roleId: e.target.value} : null)} 
            placeholder="ROLE_USER" 
          />
          <SelectField 
            label={t('user.fields.status')} 
            value={editingUser?.status || 'active'} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, status: e.target.value as 'active' | 'inactive'} : null)}
            options={[
              { value: 'active', label: t('user.status.active_label') },
              { value: 'inactive', label: t('user.status.inactive_label') }
            ]}
          />
          <SelectField 
            label={t('user.fields.language')} 
            value={editingUser?.language || 'ko'} 
            onChange={(e) => setEditingUser(prev => prev ? {...prev, language: e.target.value} : null)}
            options={[
              { value: 'ko', label: t('common.languages.ko') },
              { value: 'en', label: t('common.languages.en') },
              { value: 'ja', label: t('common.languages.ja') },
              { value: 'zh', label: t('common.languages.zh') }
            ]}
          />
        </div>
      </Modal>

      <div className="flex flex-col gap-24">
        {/* Search Header Card */}
        <Card title={t('user.filter.title')}>
          <div className="filter-panel horizontal grid-5">
            <SelectField 
              label={t('user.filter.dept')} 
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              options={[
                { value: '', label: t('user.filter.all_dept') },
                { value: '시스템 관리팀', label: '시스템 관리팀' },
                { value: '운송 1팀', label: '운송 파트' },
                { value: 'WMS 파트', label: '창고 관리 파트' },
                { value: 'CS팀', label: 'CS팀' }
              ]} 
              className="mb-0"
              fullWidth={false}
            />
            <SelectField 
              label={t('user.filter.role')} 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              options={[
                { value: '', label: t('user.filter.all_role') },
                { value: 'ROLE_ADMIN', label: 'Admin' },
                { value: 'ROLE_MANAGER', label: 'Manager' },
                { value: 'ROLE_DRIVER', label: 'Driver' },
                { value: 'ROLE_CS', label: 'CS' },
              ]} 
              className="mb-0"
              fullWidth={false}
            />
            <SelectField 
              label={t('user.filter.status')} 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              options={[
                { value: '', label: t('user.filter.all_status') },
                { value: 'active', label: t('user.status.active') },
                { value: 'inactive', label: t('user.status.inactive') },
              ]} 
              className="mb-0"
              fullWidth={false}
            />
            <InputField 
              label={t('user.filter.search')} 
              placeholder={t('user.filter.search_placeholder')} 
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              onKeyDown={handleKeyDown}
              className="mb-0" 
              fullWidth={false}
            />
            <button className="btn btn-primary" onClick={handleFilter}><Search size={18} /> {t('user.filter.apply')}</button>
          </div>
        </Card>

        {/* User Data Table */}
        <Card noPadding>
          <div className="user-table-header">
            <h3 className="m-0 text-1rem text-primary">{t('user.list_title')} (<span className="text-accent-blue">{filteredUsers.length}</span>)</h3>
          </div>
          {loading ? (
             <div className="loading-container">{t('common.please_wait')}</div>
          ) : (
            <DataTable 
              columns={columns} 
              data={filteredUsers.slice((currentPage - 1) * 10, currentPage * 10)} 
              onRowClick={setEditingUser}
              pagination={{
                currentPage: currentPage,
                totalPages: Math.ceil(filteredUsers.length / 10) || 1,
                onPageChange: setCurrentPage
              }}
            />
          )}
        </Card>
      </div>
    </div>
  );
};

export default UserManagement;
