import React, { useState } from 'react';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { User, Bell, Shield, Smartphone } from 'lucide-react';

const Template8_Settings: React.FC = () => {
  const [activeMenu, setActiveMenu] = useState('profile');

  return (
    <div className="template-page fade-in">
      <PageHeader 
        title="환경 설정 (Settings / Configuration)" 
        description="시스템 또는 사용자 계정의 주요 옵션을 카테고리별로 설정합니다."
        breadcrumbs={['템플릿', '환경 설정']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 250px) 1fr', gap: '24px', alignItems: 'start' }}>
        {/* Left: Navigation Menu */}
        <Card noPadding>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <button 
              onClick={() => setActiveMenu('profile')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeMenu === 'profile' ? 'var(--accent-light)' : 'transparent', color: activeMenu === 'profile' ? 'var(--accent-blue)' : 'var(--text-secondary)', border: 'none', borderLeft: `3px solid ${activeMenu === 'profile' ? 'var(--accent-blue)' : 'transparent'}`, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
            >
              <User size={18} /> 계정 정보
            </button>
            <button 
              onClick={() => setActiveMenu('notifications')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeMenu === 'notifications' ? 'var(--accent-light)' : 'transparent', color: activeMenu === 'notifications' ? 'var(--accent-blue)' : 'var(--text-secondary)', border: 'none', borderLeft: `3px solid ${activeMenu === 'notifications' ? 'var(--accent-blue)' : 'transparent'}`, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
            >
              <Bell size={18} /> 알림 설정
            </button>
            <button 
              onClick={() => setActiveMenu('security')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeMenu === 'security' ? 'var(--accent-light)' : 'transparent', color: activeMenu === 'security' ? 'var(--accent-blue)' : 'var(--text-secondary)', border: 'none', borderLeft: `3px solid ${activeMenu === 'security' ? 'var(--accent-blue)' : 'transparent'}`, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
            >
              <Shield size={18} /> 보안 및 로그인
            </button>
            <button 
              onClick={() => setActiveMenu('devices')}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '16px 20px', background: activeMenu === 'devices' ? 'var(--accent-light)' : 'transparent', color: activeMenu === 'devices' ? 'var(--accent-blue)' : 'var(--text-secondary)', border: 'none', borderLeft: `3px solid ${activeMenu === 'devices' ? 'var(--accent-blue)' : 'transparent'}`, textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s', fontWeight: 600 }}
            >
              <Smartphone size={18} /> 연결된 기기
            </button>
          </div>
        </Card>

        {/* Right: Settings Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {activeMenu === 'profile' && (
            <Card title="계정 정보 (Profile)" className="fade-in">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <User size={32} color="#94A3B8" />
                  </div>
                  <div>
                    <button className="btn btn-outline" style={{ padding: '6px 12px', marginBottom: '8px' }}>프로필 사진 변경</button>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>JPG, GIF, PNG 파일 허용 (최대 2MB)</p>
                  </div>
                </div>
                <hr style={{ border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '16px' }}>
                  <div className="form-field-group">
                    <label className="form-label">이름</label>
                    <input type="text" className="form-input" defaultValue="김물류" />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label">이메일</label>
                    <input type="email" className="form-input" defaultValue="admin@logistics.com" />
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '16px' }}>
                  <button className="btn btn-primary">변경사항 저장</button>
                </div>
              </div>
            </Card>
          )}

          {activeMenu === 'notifications' && (
            <Card title="알림 설정 (Notifications)" className="fade-in">
               <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>시스템 점검 알림</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>유지보수 및 긴급 점검 시 메일/푸시 안내 받기</div>
                   </div>
                   <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                 </div>
                 <hr style={{ border: 'none', borderBottom: '1px solid rgba(0,0,0,0.05)' }} />
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div>
                     <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>배송 이상 발생 알림</div>
                     <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>배송 지연, 사고 발생 시 즉시 푸시 알림 받기</div>
                   </div>
                   <input type="checkbox" defaultChecked style={{ width: '20px', height: '20px' }} />
                 </div>
               </div>
            </Card>
          )}

          {activeMenu === 'security' && (
            <div className="fade-in">
               <Card title="비밀번호 변경">
                 <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
                   <div className="form-field-group">
                     <label className="form-label">현재 비밀번호</label>
                     <input type="password" className="form-input" />
                   </div>
                   <div className="form-field-group">
                     <label className="form-label">새 비밀번호</label>
                     <input type="password" className="form-input" />
                   </div>
                   <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>비밀번호 업데이트</button>
                 </div>
               </Card>
            </div>
          )}

          {activeMenu === 'devices' && (
            <div className="fade-in">
              <Card title="로그인된 기기 (Devices)">
                 <p style={{ color: 'var(--text-secondary)' }}>현재 로그인된 기기 목록이 여기에 표시됩니다.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Template8_Settings;
