'use client';

import React, { useState } from 'react';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { User, Bell, Shield, Smartphone } from 'lucide-react';

import './Template8_Settings.css';

export default function Template8Page() {
  const [activeMenu, setActiveMenu] = useState('profile');

  return (
    <div className="template-page fade-in p-6">
      <PageHeader 
        title="환경 설정 (Settings / Configuration)" 
        description="시스템 또는 사용자 계정의 주요 옵션을 카테고리별로 설정합니다."
        breadcrumbs={['템플릿', '환경 설정']}
      />

      <div className="settings-container mt-6">
        {/* Left: Navigation Menu */}
        <Card noPadding>
          <div className="settings-nav">
            <button 
              onClick={() => setActiveMenu('profile')}
              className={`settings-nav-button ${activeMenu === 'profile' ? 'active' : ''}`}
              title="Profile Settings"
            >
              <User size={18} /> 계정 정보
            </button>
            <button 
              onClick={() => setActiveMenu('notifications')}
              className={`settings-nav-button ${activeMenu === 'notifications' ? 'active' : ''}`}
              title="Notification Settings"
            >
              <Bell size={18} /> 알림 설정
            </button>
            <button 
              onClick={() => setActiveMenu('security')}
              className={`settings-nav-button ${activeMenu === 'security' ? 'active' : ''}`}
              title="Security Settings"
            >
              <Shield size={18} /> 보안 및 로그인
            </button>
            <button 
              onClick={() => setActiveMenu('devices')}
              className={`settings-nav-button ${activeMenu === 'devices' ? 'active' : ''}`}
              title="Connected Devices"
            >
              <Smartphone size={18} /> 연결된 기기
            </button>
          </div>
        </Card>

        {/* Right: Settings Content */}
        <div className="settings-content">
          {activeMenu === 'profile' && (
            <Card title="계정 정보 (Profile)" className="fade-in">
              <div className="account-info-form">
                <div className="profile-avatar-section">
                  <div className="avatar-circle">
                    <User size={32} color="#94A3B8" />
                  </div>
                  <div>
                    <button className="btn btn-outline mb-8" title="Change Profile Picture">프로필 사진 변경</button>
                    <p className="avatar-info-text">JPG, GIF, PNG 파일 허용 (최대 2MB)</p>
                  </div>
                </div>
                <hr className="settings-divider" />
                <div className="profile-fields-grid">
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="name-input">이름</label>
                    <input id="name-input" type="text" className="form-input p-2 border rounded-md" defaultValue="김물류" placeholder="Enter your name" title="Name" />
                  </div>
                  <div className="form-field-group">
                    <label className="form-label" htmlFor="email-input">이메일</label>
                    <input id="email-input" type="email" className="form-input p-2 border rounded-md" defaultValue="admin@logistics.com" placeholder="Enter your email" title="Email" />
                  </div>
                </div>
                <div className="text-right mt-16">
                  <button className="btn btn-primary" title="Save Changes">변경사항 저장</button>
                </div>
              </div>
            </Card>
          )}

          {activeMenu === 'notifications' && (
            <Card title="알림 설정 (Notifications)" className="fade-in">
               <div className="flex flex-col gap-16">
                 <div className="notification-item">
                   <div>
                     <div className="notification-label">시스템 점검 알림</div>
                     <div className="notification-desc">유지보수 및 긴급 점검 시 메일/푸시 안내 받기</div>
                   </div>
                   <input 
                    type="checkbox" 
                    defaultChecked 
                    className="notification-checkbox" 
                    title="Enable System Notifications"
                    aria-label="Enable System Notifications"
                   />
                 </div>
                 <hr className="settings-divider" />
                 <div className="notification-item">
                   <div>
                     <div className="notification-label">배송 이상 발생 알림</div>
                     <div className="notification-desc">배송 지연, 사고 발생 시 즉시 푸시 알림 받기</div>
                   </div>
                   <input 
                    type="checkbox" 
                    defaultChecked 
                    className="notification-checkbox" 
                    title="Enable Shipping Alerts"
                    aria-label="Enable Shipping Alerts"
                   />
                 </div>
               </div>
            </Card>
          )}

          {activeMenu === 'security' && (
            <div className="fade-in">
               <Card title="비밀번호 변경">
                 <div className="security-form">
                   <div className="form-field-group">
                     <label className="form-label" htmlFor="current-pw">현재 비밀번호</label>
                     <input id="current-pw" type="password" className="form-input p-2 border rounded-md" placeholder="Current Password" title="Current Password" />
                   </div>
                   <div className="form-field-group">
                     <label className="form-label" htmlFor="new-pw">새 비밀번호</label>
                     <input id="new-pw" type="password" className="form-input p-2 border rounded-md" placeholder="New Password" title="New Password" />
                   </div>
                   <button className="btn btn-primary self-start" title="Update Password">비밀번호 업데이트</button>
                 </div>
               </Card>
            </div>
          )}

          {activeMenu === 'devices' && (
            <div className="fade-in">
              <Card title="로그인된 기기 (Devices)">
                 <p className="tab-content-desc">현재 로그인된 기기 목록이 여기에 표시됩니다.</p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
