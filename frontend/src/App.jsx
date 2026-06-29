import React, { useState } from 'react';
import Dashboard from './components/Dashboard';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import { IconDashboard, IconBag, IconHanger, IconReports } from './components/Icons';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [toasts, setToasts] = useState([]);

  // Toast dispatcher utility
  const addToast = (message, type = 'success', duration = 3000) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  };

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard addToast={addToast} />;
      case 'pos':
        return <POS addToast={addToast} />;
      case 'inventory':
        return <Inventory addToast={addToast} />;
      case 'reports':
        return <Reports addToast={addToast} />;
      default:
        return <Dashboard addToast={addToast} />;
    }
  };

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'dashboard':
        return 'Maison Aura Performance Analytics';
      case 'pos':
        return 'Boutique Checkout Terminal';
      case 'inventory':
        return 'Apparel & Accessory Catalog';
      case 'reports':
        return 'Transaction Archive & Registry';
      default:
        return 'Dashboard';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div>
          <div className="brand-section">
            <div className="brand-logo">M</div>
            <div>
              <h1 className="brand-name">MAISON AURA</h1>
              <span className="brand-tag">Luxury Boutique POS</span>
            </div>
          </div>
          
          <nav className="nav-menu">
            <div 
              className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <IconDashboard size={18} className="nav-icon" />
              <span>Dashboard</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'pos' ? 'active' : ''}`}
              onClick={() => setActiveTab('pos')}
            >
              <IconBag size={18} className="nav-icon" />
              <span>Checkout POS</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveTab('inventory')}
            >
              <IconHanger size={18} className="nav-icon" />
              <span>Inventory</span>
            </div>
            
            <div 
              className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
              onClick={() => setActiveTab('reports')}
            >
              <IconReports size={18} className="nav-icon" />
              <span>Sales Logs</span>
            </div>
          </nav>
        </div>

        <div className="sidebar-footer">
          <span className="user-profile">✨ Salon Concierge</span>
          <span className="user-role">Full Boutique Access</span>
        </div>
      </aside>

      {/* Main Workspace Panels */}
      <main className="main-content">
        <header className="main-header">
          <div className="header-title">
            <h1>{getHeaderTitle()}</h1>
          </div>
          <div className="header-meta">
            <span className="live-indicator"></span>
            <span>Live Server Active</span>
          </div>
        </header>

        <div className="content-body">
          {renderActiveView()}
        </div>
      </main>

      {/* Global Action Toast Overlays */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
