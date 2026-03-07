import { useEffect, useState, Suspense } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import Callback from "./pages/Callback";
import Dashboard from "./pages/Dashboard/Dashboard";
import MainLayout from "./components/layout/MainLayout";
import { MultiTabProvider } from "./components/layout/MultiTabContext";
import { ModalProvider } from "./contexts/ModalContext";
import { MessageProvider } from "./contexts/MessageContext";
import "./App.css";

// Templates Demo Routes
import Template1_ListSearch from './pages/templates/Template1_ListSearch';
import Template2_DetailView from './pages/templates/Template2_DetailView';
import Template3_CreateEditForm from './pages/templates/Template3_CreateEditForm';
import Template4_SplitView from './pages/templates/Template4_SplitView';
import Template5_Tabbed from './pages/templates/Template5_Tabbed';
import Template6_Wizard from './pages/templates/Template6_Wizard';
import Template7_SummaryList from './pages/templates/Template7_SummaryList';
import Template8_Settings from './pages/templates/Template8_Settings';

// System Admin Routes
import UserManagement from './pages/system/UserManagement';
import RoleManagement from './pages/system/RoleManagement';
import CodeManagement from './pages/system/CodeManagement';
import MenuManagement from './pages/system/MenuManagement';
import MessageManagement from './pages/system/MessageManagement';

// Domains Routes
import ClientManagement from './pages/sales/ClientManagement';
import OrderManagement from './pages/sales/OrderManagement';
import Allocation from './pages/dispatch/Allocation';
import Routing from './pages/dispatch/Routing';
import Inbound from './pages/inventory/Inbound';
import Outbound from './pages/inventory/Outbound';
import StockStatus from './pages/inventory/StockStatus';


function ProtectedRoute({ children }: { children: JSX.Element }) {
  const { isAuthenticated, login } = useAuth();
  const { t } = useTranslation();
  const hasToken = !!localStorage.getItem("access_token");
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !hasToken && !isRedirecting) {
      setIsRedirecting(true);
      login();
    }
  }, [isAuthenticated, hasToken, login, isRedirecting]);

  if (!isAuthenticated && !hasToken) {
    return (
      <div className="login-redirect-container">
        <div className="login-redirect-content">
          <div className="welcome-logo">🚚</div>
          <h3>{t('common.redirecting_to_login')}</h3>
          <p className="text-muted">{t('common.please_wait')}</p>
        </div>
      </div>
    );
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <MessageProvider>
        <ModalProvider>
          <Suspense fallback={<div className="loading-fallback">Loading translations...</div>}>
            <BrowserRouter>
            <Routes>
              <Route path="/callback" element={<Callback />} />
              {/* .well-known 및 기타 비표준 경로는 무시하고 홈으로 */}
              <Route path="/.well-known/*" element={<Navigate to="/" replace />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <MultiTabProvider>
                      <MainLayout>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          {/* Templates Demo Routes */}
                          <Route path="/templates/1" element={<Template1_ListSearch />} />
                          <Route path="/templates/2" element={<Template2_DetailView />} />
                          <Route path="/templates/3" element={<Template3_CreateEditForm />} />
                          <Route path="/templates/4" element={<Template4_SplitView />} />
                          <Route path="/templates/5" element={<Template5_Tabbed />} />
                          <Route path="/templates/6" element={<Template6_Wizard />} />
                          <Route path="/templates/7" element={<Template7_SummaryList />} />
                          <Route path="/templates/8" element={<Template8_Settings />} />
                          
                          {/* System Admin Routes */}
                          <Route path="/system/users" element={<UserManagement />} />
                          <Route path="/system/roles" element={<RoleManagement />} />
                          <Route path="/system/codes" element={<CodeManagement />} />
                          <Route path="/system/menus" element={<MenuManagement />} />
                          <Route path="/system/messages" element={<MessageManagement />} />
  
                          {/* Domain Routes */}
                          <Route path="/sales/clients" element={<ClientManagement />} />
                          <Route path="/sales/orders" element={<OrderManagement />} />
                          <Route path="/dispatch/allocation" element={<Allocation />} />
                          <Route path="/dispatch/routing" element={<Routing />} />
                          <Route path="/inventory/inbound" element={<Inbound />} />
                          <Route path="/inventory/outbound" element={<Outbound />} />
                          <Route path="/inventory/status" element={<StockStatus />} />
  
                          <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </MainLayout>
                    </MultiTabProvider>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </BrowserRouter>
          </Suspense>
        </ModalProvider>
      </MessageProvider>
    </AuthProvider>
  );
}

export default App;
