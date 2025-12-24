import React, { useState, useEffect } from 'react';
import { User, LogOut, Package, Truck, Store, Shield, CheckCircle, Eye, BarChart3, Users, X ,CreditCard, DollarSign, TrendingUp, Receipt} from 'lucide-react';
import Approvals from './Approvals';
import Analytics from './Analytics';
import UserManagement from './UserManagement';
import TransactionManagement from './TransactionManagement';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Check authentication and admin status
  useEffect(() => {
    const token = getAuthToken();
    const userData = localStorage.getItem('user');
    const userRole = localStorage.getItem('userRole');
    
    setIsAuthenticated(!!token);
    
    if (userData) {
      try {
        const user = JSON.parse(userData);
        setCurrentUser(user);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Check if user is admin
    const adminCheck = userRole === 'ADMIN' || userRole === 'ROLE_ADMIN' || userRole === 'admin';
    setIsAdmin(adminCheck);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    window.location.href = '/';
  };

  // Authentication checks
  if (!isAuthenticated) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.authIcon}>
            <X size={32} style={{color: '#dc2626'}} />
          </div>
          <h2 style={styles.authTitle}>Access Denied</h2>
          <p style={styles.authText}>Please login to access the admin dashboard.</p>
          <button 
            onClick={() => window.location.href = '/'}
            style={styles.authButton}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div style={styles.authContainer}>
        <div style={styles.authCard}>
          <div style={styles.authIcon}>
            <Shield size={32} style={{color: '#dc2626'}} />
          </div>
          <h2 style={styles.authTitle}>Admin Access Required</h2>
          <p style={styles.authText}>You need administrator privileges to access this dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.headerCard}>
          <div style={styles.headerBackground}>
            <div style={styles.headerContent}>
              <div style={styles.headerLeft}>
                <div style={styles.headerIcon}>
                  <Shield size={24} style={{color: 'white'}} />
                </div>
                <div>
                  <h1 style={styles.headerTitle}>Admin Dashboard</h1>
                  <p style={styles.headerSubtitle}>Manage user approvals and system operations</p>
                </div>
              </div>
              <div style={styles.headerRight}>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{currentUser?.name || 'Admin User'}</p>
                  <p style={styles.userRole}>Administrator</p>
                </div>
                <button 
                  onClick={handleLogout}
                  style={styles.logoutButton}
                >
                  <LogOut size={20} style={{color: 'white', borderRadius: 100}} />
                </button>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabs}>
              {[
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'approvals', label: 'User Approvals', icon: CheckCircle },
                { id: 'users', label: 'Manage Users', icon: Users },
                {id: 'transactions',label: 'Manage Transactions', icon: TrendingUp // or use DollarSign, TrendingUp, or Receipt based on your icon library
                  }
              ].map((tab) => {
                const IconComponent = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      ...styles.tab,
                      ...(activeTab === tab.id ? styles.tabActive : {})
                    }}
                  >
                    <IconComponent size={18} style={{marginRight: 8}} />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'approvals' && <Approvals onUpdate={() => {}} />}
          {activeTab === 'analytics' && (
            <div style={styles.placeholderContent}>
              <Analytics />
              {/* <div style={styles.placeholderIcon}>
                <BarChart3 size={48} style={{color: '#6b7280'}} />
              </div> */}
              {/* <h3 style={styles.placeholderTitle}>Analytics Dashboard</h3>
              <p style={styles.placeholderText}>
                System analytics and reports will be displayed here.
              </p> */}
            </div>
          )}
          {activeTab === 'users' && (
            // <div style={styles.placeholderContent}>
            //   <div style={styles.placeholderIcon}>
            //     <Users size={48} style={{color: '#6b7280'}} />
            //   </div>
            //   <h3 style={styles.placeholderTitle}>User Management</h3>
            //   <p style={styles.placeholderText}>
            //     Complete user management system will be displayed here.
            //   </p>
            // </div>
            <UserManagement />
          )}
          {activeTab === 'transactions' && (
            <div style={styles.placeholderContent}>
              <TransactionManagement />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Complete Styles Object
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    paddingTop: '5px',
    borderRadius: '8px'
  },
  content: {
    maxWidth: '1350px',
    margin: '0 auto'
  },
  
  // Header Styles
  headerCard: {
    
    background: 'white',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '0'
  },
  headerBackground: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    padding: '20px',
    borderRadius: '10px 10px 0 0'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center'
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0
  },
  headerSubtitle: {
    fontSize: '14px',
    color: 'rgba(255, 255, 255, 0.9)',
    margin: '4px 0 0 0'
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  userInfo: {
    textAlign: 'right',
    color: 'white'
  },
  userName: {
    fontSize: '16px',
    fontWeight: '600',
    margin: 0
  },
  userRole: {
    fontSize: '12px',
    color: 'rgba(255, 255, 255, 0.8)',
    margin: '2px 0 0 0'
  },
  logoutButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '6px',
    padding: '8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },

  // Tabs Styles
  tabsContainer: {
    padding: '30px',
    borderBottom: '1px solid #e5e7eb'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '12px 24px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none'
  },

  // Tab Content Styles
  tabContent: {
    background: 'white',
    minHeight: '400px'
  },
  placeholderContent: {
    padding: '60px 20px',
    textAlign: 'center',
    background: 'white'
  },
  placeholderIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  placeholderTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0'
  },
  placeholderText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },

  // Auth Styles
  authContainer: {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px'
  },
  authCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    padding: '32px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  authIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  authTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 16px 0'
  },
  authText: {
    color: '#6b7280',
    margin: '0 0 24px 0'
  },
  authButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%'
  }
};

export default AdminDashboard;