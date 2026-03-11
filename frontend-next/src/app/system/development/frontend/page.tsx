'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Layout, Layers, Smartphone, Globe, Zap, Monitor, FileCode, MessageSquare } from 'lucide-react';
import '../DevelopmentGuide.css';

const FrontendGuide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="guide-container p-24">
      <header className="guide-header">
        <div className="header-icon-wrapper">
          <Smartphone className="header-icon" />
        </div>
        <div className="header-text">
          <h1>{t('development.frontend.title', 'Frontend App Development Guide')}</h1>
          <p className="text-muted mt-2">{t('development.frontend.desc', 'Standard guide for logistics platform frontend development.')}</p>
        </div>
      </header>

      <div className="guide-content mt-8">
        <section className="guide-section card mb-6">
          <h2>
            <Layers size={20} className="me-2" /> {t('development.frontend.tech_stack', 'Core Technology Stack')}
          </h2>
          <div className="tech-grid">
            <div className="tech-item">
              <strong>Next.js 15 (App Router)</strong>
              <span>React Framework for SSR & Optimized Routing</span>
            </div>
            <div className="tech-item">
              <strong>TypeScript</strong>
              <span>Static typing for robust code</span>
            </div>
            <div className="tech-item">
              <strong>Vanilla CSS</strong>
              <span>Custom styling without Tailwind</span>
            </div>
            <div className="tech-item">
              <strong>Lucide React</strong>
              <span>Icon library</span>
            </div>
          </div>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Layout size={20} className="me-2" /> {t('development.frontend.structure', 'Project Structure')}
          </h2>
          <pre className="code-block">
{`src/
  app/            # App Router pages and layouts
  components/     # Reusable UI components
    common/       # Generic components (Buttons, Inputs, etc.)
    layout/       # App layout (Sidebar, Header, MainLayout)
  contexts/       # React Contexts (Auth, Modal, Message, MultiTab)
  hooks/          # Custom React Hooks
  utils/          # Utility functions (API client, Formatters)
  auth/           # OAuth2 configuration & constants`}
          </pre>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Monitor size={20} className="me-2" /> {t('development.frontend.ui_frame', 'UI Frame Structure')}
          </h2>
          <p className="mb-4 text-muted">The Frontend React application uses a standardized layout frame.</p>
          
          <div className="ui-frame-diagram">
            <div className="ui-frame-sidebar">
              <div className="ui-frame-logo">LOGISTICS PLATFORM</div>
              <div className="ui-frame-menu-item"></div>
              <div className="ui-frame-menu-item active"></div>
              <div className="ui-frame-menu-item"></div>
            </div>
            <div className="ui-frame-main">
              <div className="ui-frame-header">
                <div>PageHeader (Breadcrumbs / Title)</div>
                <div className="ui-frame-actions">
                  <div className="ui-frame-btn"></div>
                  <div className="ui-frame-btn-alt"></div>
                </div>
              </div>
              <div className="ui-frame-content">
                <div className="ui-frame-tabs">
                  <div className="ui-frame-tab">Dashboard</div>
                  <div className="ui-frame-tab active">MultiTabContext</div>
                </div>
                <div className="ui-frame-card">
                  &lt;Card&gt; Component Content (Split Views, Grids, Forms)
                </div>
              </div>
            </div>
          </div>

          <ul className="convention-list">
            <li><strong>Header (PageHeader):</strong> Displays the page title, descriptions, breadcrumbs, and top-right action buttons (e.g., Save, Add, Delete).</li>
            <li><strong>Sidebar:</strong> Contains the navigation menu linked to the database routes. Rendered globally in the MainLayout.</li>
            <li><strong>Main Content Area (MultiTab):</strong> The central working area is managed by the <code>MultiTabContext</code>, allowing users to open and switch between multiple menu screens without reloading the browser.</li>
            <li><strong>Cards & Split Views:</strong> Content within a page is typically organized using <code>&lt;Card&gt;</code> components or a <code>split-view-container</code> (e.g., a List on the left and detail form on the right).</li>
          </ul>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <FileCode size={20} className="me-2" /> {t('development.frontend.menu_structure', 'Single Menu Source Structure')}
          </h2>
          <p className="mb-4 text-muted">When creating a new menu page, construct the files as follows:</p>
          <pre className="code-block">
{`src/app/domain/feature/
  page.tsx        # Main UI component (Header, Cards, Logic)
  Feature.css     # Localized styles specifically for this menu
  components/     # (Optional) Sub-components if the page is too large`}
          </pre>
          <ul className="convention-list mt-4">
            <li><strong>page.tsx:</strong> Should contain standard imports (<code>useTranslation</code>, <code>PageHeader</code>, <code>Card</code>, <code>apiClient</code>). Define your state and API calls here.</li>
            <li><strong>CSS:</strong> Import the localized CSS file at the top of <code>page.tsx</code>. Use specific class prefixes (e.g., <code>.feature-list-container</code>) to prevent global style bleeding.</li>
          </ul>

          <h3 className="mt-6 mb-3 text-lg font-bold text-slate-700">Menu Source Sample Code</h3>
          <pre className="code-block">
{`import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../../../components/common/PageHeader';
import { Card } from '../../../components/common/Card';
import { InputField, SelectField } from '../../../components/common/FormFields';
import { Search } from 'lucide-react';
import { apiClient } from '../../../utils/apiClient';
import './Feature.css'; // Always import scoped CSS

const FeatureMenu: React.FC = () => {
  // ==========================================
  // [1. Logic Region] 
  // State, Hooks, Data Fetching, and Event Handlers
  // ==========================================
  const { t } = useTranslation();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/api/v1/feature/data');
        setData(response);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSearch = () => {
    // Perform search logic using searchFilter state
    console.log("Searching for:", searchFilter);
  };

  const headerActions = (
    <button className="btn btn-primary">{t('common.save')}</button>
  );

  // ==========================================
  // [2. Design (UI) Region] 
  // JSX Rendering Area
  // ==========================================
  return (
    <div className="page-container">
      {/* 2-A. Header Region */}
      <PageHeader 
        title={t('feature.title')} 
        breadcrumbs={[t('common.sidebar'), t('feature.title')]} 
        actions={headerActions}
      />

      <div className="page-content">
        {/* 2-B. Body Filter Region */}
        <div className="filter-section mb-4">
          <div className="filter-grid grid-4">
            <InputField 
              label="Search keyword" 
              value={searchFilter} 
              onChange={(e) => setSearchFilter(e.target.value)} 
            />
            {/* Add more filter fields here */}
            <div className="filter-actions flex items-end">
              <button className="btn btn-primary mb-1" onClick={handleSearch}>
                <Search size={18} className="me-2" /> Search
              </button>
            </div>
          </div>
        </div>

        {/* 2-C. Body List Region */}
        <Card title={t('feature.list_title')} className="mt-4">
           {loading ? (
             <p>Loading data...</p>
           ) : (
             <div className="feature-grid">
               {data.map(item => <div key={item.id}>{item.name}</div>)}
             </div>
           )}
        </Card>
      </div>
    </div>
  );
};

export default FeatureMenu;`}
          </pre>

          <h3 className="mt-6 mb-3 text-lg font-bold text-slate-700">Scoped CSS Sample Code (Feature.css)</h3>
          <pre className="code-block">
{`/* Scope your styles prefixing with the feature name */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
  padding: 16px;
  background-color: var(--bg-primary);
  border-radius: 8px;
}

.feature-grid > div {
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 6px;
  background-color: white;
  transition: box-shadow 0.2s;
}

.feature-grid > div:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}`}
          </pre>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <MessageSquare size={20} className="me-2" /> {t('development.frontend.modal_guide', 'Alert & Confirm (Modal) Guide')}
          </h2>
          <p className="mb-4 text-muted">Never use browser-native <code>alert()</code> or <code>confirm()</code>. Always use the <code>ModalContext</code> to display consistent application-styled dialogs.</p>
          
          <ul className="convention-list">
            <li><strong>Import:</strong> <code>{`import { useModal } from '@/contexts/ModalContext';`}</code></li>
            <li><strong>showAlert:</strong> Use for simple notifications (Success, Error, Info).</li>
            <li><strong>showConfirm:</strong> Use when requiring user consideration before executing an action (Delete, Force Save).</li>
          </ul>

          <h3 className="mt-6 mb-3 text-lg font-bold text-slate-700">Modal API Usage</h3>
          <pre className="code-block">
{`import React from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '../../../contexts/ModalContext';

const MyComponent = () => {
  const { showAlert, showConfirm } = useModal();
  const { t } = useTranslation();

  // 1. Alert Example
  const handleSaveSuccess = () => {
    showAlert({
      title: t('common.notice', 'Notice'),
      message: t('msg.save_success', 'Saved successfully.')
    });
  };

  // 2. Confirm Example
  const handleDelete = () => {
    showConfirm({
      title: t('common.delete', 'Delete'),
      message: t('msg.delete_confirm', 'Are you sure you want to delete?'),
      onConfirm: async () => {
        // Execute delete API logic here...
        showAlert({ 
          title: t('common.notice', 'Notice'), 
          message: t('msg.delete_success', 'Deleted successfully.') 
        });
      }
    });
  };
  
  return (
    <div className="flex gap-2">
       <button className="btn btn-primary" onClick={handleSaveSuccess}>Show Alert</button>
       <button className="btn btn-danger" onClick={handleDelete}>Show Confirm</button>
    </div>
  );
};`}
          </pre>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Zap size={20} className="me-2" /> {t('development.frontend.crud_guide', 'CRUD Implementation Guide')}
          </h2>
          <p className="mb-4 text-muted">A standard approach for implementing Create, Read, Update, and Delete operations using React State, <code>apiClient</code>, and <code>ModalContext</code>.</p>
          
          <ul className="convention-list">
            <li><strong>State Management:</strong> Use <code>useState</code> to manage arrays of data (e.g., <code>[items, setItems]</code>), loading states, and the currently editing item (e.g., <code>[editingItem, setEditingItem]</code>).</li>
            <li><strong>Read (Fetch):</strong> Wrap your GET requests in a <code>useCallback</code> to avoid infinite re-renders. Use <code>apiClient.get()</code> and set the data. Trigger the fetch inside a <code>useEffect</code>.</li>
            <li><strong>Create &amp; Update (Save):</strong> Use the <code>&lt;Modal&gt;</code> component for forms. When &quot;Save&quot; is clicked, validate the input, use <code>showConfirm</code> from <code>useModal()</code>, and if confirmed, send a <code>apiClient.post()</code> or <code>put()</code>. Re-fetch the data upon success.</li>
            <li><strong>Delete:</strong> Trigger a <code>showConfirm</code> dialog. Upon confirmation, execute <code>apiClient.delete()</code> and re-fetch the list.</li>
            <li><strong>Feedback:</strong> Always use <code>showAlert</code> from <code>useModal()</code> to provide success or error feedback to the user after mutations.</li>
          </ul>

          <h3 className="mt-6 mb-3 text-lg font-bold text-slate-700">CRUD Methods Boilerplate</h3>
          <pre className="code-block">
{`const { showAlert, showConfirm } = useModal();
const [items, setItems] = useState<Item[]>([]);
const [editingItem, setEditingItem] = useState<Partial<Item> | null>(null);

// 1. READ
const fetchItems = useCallback(async () => {
  try {
    const data = await apiClient.get<Item[]>('/api/v1/items');
    setItems(data);
  } catch (error) {
    showAlert({ title: 'Error', message: 'Failed to load items' });
  }
}, []);

// 2. CREATE / UPDATE
const handleSave = () => {
  showConfirm({
    title: editingItem.id ? 'Edit Item' : 'Add Item',
    message: 'Are you sure you want to save?',
    onConfirm: async () => {
      try {
        await apiClient.post('/api/v1/items', editingItem);
        showAlert({ title: 'Success', message: 'Saved successfully.' });
        setEditingItem(null); // Close modal
        fetchItems();         // Refresh list
      } catch (error) {
        // Handle error...
      }
    }
  });
};

// 3. DELETE
const handleDelete = (id: string) => {
  showConfirm({
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item?',
    onConfirm: async () => {
      try {
        await apiClient.delete(\`/api/v1/items/\${id}\`);
        showAlert({ title: 'Success', message: 'Deleted successfully.' });
        fetchItems(); // Refresh list
      } catch (error) {
        // Handle error...
      }
    }
  });
};`}
          </pre>
        </section>

        <section className="guide-section card mb-6">
          <h2>
            <Zap size={20} className="me-2" /> {t('development.frontend.conventions', 'Development Conventions')}
          </h2>
          <ul className="convention-list">
            <li><strong>Component Naming:</strong> Use PascalCase for components (e.g., <code>UserList.tsx</code>).</li>
            <li><strong>Server/Client Components:</strong> Use <code>&apos;use client&apos;</code> directive only when hooks or interactivity are needed.</li>
            <li><strong>I18n:</strong> Use <code>useTranslation</code> hook. Never hardcode strings.</li>
            <li><strong>Data Fetching:</strong> Use the central <code>apiClient</code> with async/await.</li>
          </ul>
        </section>

        <section className="guide-section card">
          <h2>
            <Globe size={20} className="me-2" /> {t('development.frontend.ui_standard', 'UI Standard')}
          </h2>
          <p>Follow the established grid system (<code>grid-4</code> or <code>grid-5</code>) for filter areas and use the standard Next.js routing patterns (currently wrapped inside <code>MultiTab</code> context).</p>
        </section>
      </div>
    </div>
  );
};

export default FrontendGuide;
