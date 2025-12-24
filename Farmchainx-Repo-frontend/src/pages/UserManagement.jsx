import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Download, Plus, Filter, CheckCircle, XCircle, User, Phone, Mail, MapPin, Shield, Truck, Store, RefreshCw, Building, Package, Warehouse, Users, Home } from 'lucide-react';

const UserManagement = () => {
  const [activeTab, setActiveTab] = useState('farmers');
  const [users, setUsers] = useState({ farmers: [], distributors: [], retailers: [], customers: [] });
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [verificationFilter, setVerificationFilter] = useState('all');
  const [loading, setLoading] = useState({ farmers: false, distributors: false, retailers: false, customers: false });
  const [error, setError] = useState('');

  const BASE_URL = 'http://localhost:8080'; // Update with your backend URL

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Get authorization headers
  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!getAuthToken();
  };

  // Fetch data based on active tab
  const fetchData = async () => {
    // Check authentication first
    if (!isAuthenticated()) {
      setError('Please login to access user data');
      return;
    }

    const endpoints = {
      farmers: '/farmer',
      distributors: '/distributor',
      retailers: '/retailer',
      customers: '/customer'
    };

    setLoading(prev => ({ ...prev, [activeTab]: true }));
    setError('');

    try {
      const response = await fetch(`${BASE_URL}${endpoints[activeTab]}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch ${activeTab}`);
      }

      const data = await response.json();
      setUsers(prev => ({ ...prev, [activeTab]: data }));
    } catch (err) {
      setError(err.message);
      console.error(`Error fetching ${activeTab}:`, err);
      
      // If authentication error, redirect to login
      if (err.message.includes('Authentication')) {
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      }
    } finally {
      setLoading(prev => ({ ...prev, [activeTab]: false }));
    }
  };

  // Update verification status (for farmers, distributors, retailers)
  const updateVerificationStatus = async (userId, isVerified) => {
    if (!isAuthenticated()) {
      alert('Please login to perform this action');
      return false;
    }

    const endpoints = {
      farmers: `/farmer/${userId}/verify`,
      distributors: `/distributor/${userId}/verify`,
      retailers: `/retailer/${userId}/verify`
    };

    if (activeTab === 'customers') {
      alert('Customers do not require verification');
      return false;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoints[activeTab]}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ isVerified }),
      });

      if (response.status === 401) {
        throw new Error('Authentication failed. Please login again.');
      }
      
      if (!response.ok) {
        throw new Error('Failed to update verification status');
      }
      
      // Update local state
      setUsers(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].map(user => 
          getUserId(user) === userId 
            ? { ...user, isVerified } 
            : user
        )
      }));
      
      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating verification:', err);
      return false;
    }
  };

  // Delete user
  // Update the deleteUser function in UserManagement.jsx

// Delete user (both the specific type and the base user)
const deleteUser = async (userId) => {
  if (!isAuthenticated()) {
    alert('Please login to perform this action');
    return;
  }

  if (!window.confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}? This will also delete the associated user account.`)) return;
  
  const endpoints = {
    farmers: `/farmer/${userId}`,
    distributors: `/distributor/${userId}`,
    retailers: `/retailer/${userId}`,
    customers: `/customer/${userId}`
  };

  try {
    // First, get the user ID from the farmer/distributor/retailer/customer record
    const userToDelete = users[activeTab].find(user => getUserId(user) === userId);
    const baseUserId = userToDelete?.user?.id;

    if (!baseUserId) {
      throw new Error('Could not find associated user record');
    }

    // Delete the specific type (farmer, distributor, etc.)
    const typeResponse = await fetch(`${BASE_URL}${endpoints[activeTab]}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (typeResponse.status === 401) {
      throw new Error('Authentication failed. Please login again.');
    }
    
    if (!typeResponse.ok) {
      throw new Error(`Failed to delete ${activeTab.slice(0, -1)}`);
    }

    // Then delete the base user record
    const userResponse = await fetch(`${BASE_URL}/user/${baseUserId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (!userResponse.ok) {
      console.warn(`Failed to delete base user record, but ${activeTab.slice(0, -1)} was deleted successfully`);
      // Continue even if user deletion fails, as the main record is deleted
    }
    
    // Remove from local state
    setUsers(prev => ({
      ...prev,
      [activeTab]: prev[activeTab].filter(user => getUserId(user) !== userId)
    }));

    alert(`${activeTab.slice(0, -1)} and associated user account deleted successfully`);
    
  } catch (err) {
    setError(err.message);
    console.error('Error deleting user:', err);
  }
};
  // Helper function to get user ID based on type
  const getUserId = (user) => {
    switch (activeTab) {
      case 'farmers': return user.farmerId;
      case 'distributors': return user.distributorId;
      case 'retailers': return user.retailerId;
      case 'customers': return user.customerId;
      default: return user.id;
    }
  };

  // Initial data fetch when tab changes
  useEffect(() => {
    if (users[activeTab].length === 0) {
      fetchData();
    }
  }, [activeTab]);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users[activeTab] || [];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(user => {
        const userData = user.user || {};
        return (
          userData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userData.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          userData.phone?.includes(searchTerm) ||
          (user.farmName || user.companyName || user.businessName || user.deliveryAddress)?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.farmLocation || user.coverageArea || user.operatingArea)?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => {
        const userData = user.user || {};
        if (statusFilter === 'active') return userData.activeStatus === true;
        if (statusFilter === 'inactive') return userData.activeStatus === false;
        return true;
      });
    }

    // Verification filter (not applicable for customers)
    if (verificationFilter !== 'all' && activeTab !== 'customers') {
      filtered = filtered.filter(user => {
        if (verificationFilter === 'verified') return user.isVerified === true;
        if (verificationFilter === 'pending') return user.isVerified === false;
        return true;
      });
    }

    setFilteredUsers(filtered);
  }, [searchTerm, statusFilter, verificationFilter, users, activeTab]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = getCSVHeaders();
    const csvData = filteredUsers.map(user => getCSVRow(user));

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getCSVHeaders = () => {
    const baseHeaders = ['ID', 'Name', 'Email', 'Phone', 'Address', 'Status'];
    
    switch (activeTab) {
      case 'farmers':
        return [...baseHeaders, 'Verified', 'Farm Name', 'Farm Location', 'Farm Size', 'Crops Count'];
      case 'distributors':
        return [...baseHeaders, 'Verified', 'Company Name', 'Transport Type', 'Coverage Area', 'Warehouse Capacity', 'License Number'];
      case 'retailers':
        return [...baseHeaders, 'Verified', 'Business Name', 'Business License', 'Storage Capacity', 'Operating Area'];
      case 'customers':
        return [...baseHeaders, 'Delivery Address'];
      default:
        return baseHeaders;
    }
  };

  // Get CSV row data based on user type
  const getCSVRow = (user) => {
    const userData = user.user || {};
    const baseData = [
      getUserId(user),
      `"${userData.name || ''}"`,
      `"${userData.email || ''}"`,
      `"${userData.phone || ''}"`,
      `"${userData.address || ''}"`,
      userData.activeStatus ? 'Active' : 'Inactive'
    ];

    switch (activeTab) {
      case 'farmers':
        return [...baseData, user.isVerified ? 'Yes' : user.isVerified === false ? 'No' : 'Pending', `"${user.farmName || ''}"`, `"${user.farmLocation || ''}"`, `"${user.farmSize || ''}"`, user.crops?.length || 0];
      case 'distributors':
        return [...baseData, user.isVerified ? 'Yes' : user.isVerified === false ? 'No' : 'Pending', `"${user.companyName || ''}"`, `"${user.transportType || ''}"`, `"${user.coverageArea || ''}"`, `"${user.warehouseCapacity || ''}"`, `"${user.licenseNumber || ''}"`];
      case 'retailers':
        return [...baseData, user.isVerified ? 'Yes' : user.isVerified === false ? 'No' : 'Pending', `"${user.businessName || ''}"`, `"${user.businessLicense || ''}"`, `"${user.storageCapacity || ''}"`, `"${user.operatingArea || ''}"`];
      case 'customers':
        return [...baseData, `"${user.deliveryAddress || ''}"`];
      default:
        return baseData;
    }
  };

  // Get verification badge
  const getVerificationStatus = (isVerified) => {
    if (isVerified === true) return { color: '#10b981', text: 'Verified' };
    if (isVerified === false) return { color: '#ef4444', text: 'Rejected' };
    return { color: '#f59e0b', text: 'Pending' };
  };

  // Handle verification action
  const handleVerification = async (userId, verify) => {
    if (activeTab === 'customers') {
      alert('Customers do not require verification');
      return;
    }
    const success = await updateVerificationStatus(userId, verify);
    if (success) {
      alert(`${activeTab.slice(0, -1)} ${verify ? 'verified' : 'rejected'} successfully`);
    }
  };

  // Tabs configuration
  const tabs = [
    { id: 'farmers', label: 'Farmers', icon: User, count: users.farmers.length },
    { id: 'distributors', label: 'Distributors', icon: Truck, count: users.distributors.length },
    { id: 'retailers', label: 'Retailers', icon: Store, count: users.retailers.length },
    { id: 'customers', label: 'Customers', icon: Users, count: users.customers.length }
  ];

  // Get stats for current tab
  const getStats = () => {
    const currentUsers = users[activeTab] || [];
    return {
      total: currentUsers.length,
      verified: currentUsers.filter(u => u.isVerified === true).length,
      pending: currentUsers.filter(u => u.isVerified === false).length,
      active: currentUsers.filter(u => (u.user || {}).activeStatus === true).length
    };
  };

  const stats = getStats();

  // Show authentication message if not logged in
  if (!isAuthenticated()) {
    return (
      <div style={styles.authMessage}>
        <div style={styles.authCard}>
          <Shield size={48} style={{ color: '#dc2626', marginBottom: '16px' }} />
          <h3 style={styles.authTitle}>Authentication Required</h3>
          <p style={styles.authText}>Please login to access the user management system.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            style={styles.authButton}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Tabs */}
      <div style={styles.tabsContainer}>
        <div style={styles.tabs}>
          {tabs.map((tab) => {
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
                {/* <span style={styles.tabCount}>{tab.count}</span> */}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        {/* Header with Stats */}
        <div style={styles.statsContainer}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.total}</div>
            <div style={styles.statLabel}>Total {activeTab.slice(0, -1)}s</div>
          </div>
          {activeTab !== 'customers' && (
            <>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.verified}</div>
                <div style={styles.statLabel}>Verified</div>
              </div>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>{stats.pending}</div>
                <div style={styles.statLabel}>Pending</div>
              </div>
            </>
          )}
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{stats.active}</div>
            <div style={styles.statLabel}>Active</div>
          </div>
        </div>

        {/* Controls */}
        <div style={styles.controls}>
          <div style={styles.searchContainer}>
            <Search size={20} style={styles.searchIcon} />
            <input
              type="text"
              placeholder={`Search ${activeTab} by name, email, phone...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterContainer}>
            <Filter size={16} style={{marginRight: 8}} />
            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)}
              style={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            {/* {activeTab !== 'customers' && (
              <select 
                value={verificationFilter} 
                onChange={(e) => setVerificationFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Verification</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            )} */}
          </div>

          <div style={styles.actionButtons}>
            <button 
              onClick={fetchData}
              style={styles.refreshButton}
              disabled={loading[activeTab]}
            >
              <RefreshCw size={16} style={{marginRight: 8}} />
              {loading[activeTab] ? 'Loading...' : 'Refresh'}
            </button>
            <button 
              onClick={exportToCSV}
              style={styles.exportButton}
              disabled={filteredUsers.length === 0}
            >
              <Download size={16} style={{marginRight: 8}} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div style={styles.error}>
            {error}
          </div>
        )}

        {/* Loading State */}
        {loading[activeTab] && (
          <div style={styles.loading}>
            Loading {activeTab} data...
          </div>
        )}

        {/* Users Table */}
        {!loading[activeTab] && (
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>User Details</th>
                  <th style={styles.th}>
                    {activeTab === 'customers' ? 'Delivery Information' : `${activeTab.slice(0, -1)} Information`}
                  </th>
                  <th style={styles.th}>Contact</th>
                  <th style={styles.th}>Status</th>
                  {/* {activeTab !== 'customers' && <th style={styles.th}>Verification</th>} */}
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const userId = getUserId(user);
                  const userData = user.user || {};
                  const verification = getVerificationStatus(user.isVerified);
                  
                  return (
                    <tr key={userId} style={styles.tr}>
                      <td style={styles.td}>
                        <div style={styles.userInfo}>
                          <div style={styles.avatar}>
                            {userData.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <div style={styles.userName}>{userData.name || 'N/A'}</div>
                            <div style={styles.userId}>ID: {userId}</div>
                            <div style={styles.username}>@{userData.username}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td style={styles.td}>
                        <div style={styles.businessInfo}>
                          {activeTab === 'farmers' && (
                            <>
                              <div style={styles.infoRow}>
                                <Building size={14} style={{marginRight: 6}} />
                                <strong>{user.farmName || 'N/A'}</strong>
                              </div>
                              <div style={styles.infoText}>{user.farmLocation || 'N/A'}</div>
                              <div style={styles.infoText}>{user.farmSize || 'N/A'}</div>
                              <div style={styles.cropCount}>
                                Crops: {user.crops?.length || 0}
                              </div>
                            </>
                          )}
                          
                          {activeTab === 'distributors' && (
                            <>
                              <div style={styles.infoRow}>
                                <Truck size={14} style={{marginRight: 6}} />
                                <strong>{user.companyName || 'N/A'}</strong>
                              </div>
                              <div style={styles.infoText}>{user.transportType || 'N/A'}</div>
                              <div style={styles.infoText}>{user.coverageArea || 'N/A'}</div>
                              <div style={styles.infoText}>{user.warehouseCapacity || 'N/A'}</div>
                            </>
                          )}
                          
                          {activeTab === 'retailers' && (
                            <>
                              <div style={styles.infoRow}>
                                <Store size={14} style={{marginRight: 6}} />
                                <strong>{user.businessName || 'N/A'}</strong>
                              </div>
                              <div style={styles.infoText}>License: {user.businessLicense || 'N/A'}</div>
                              <div style={styles.infoText}>{user.storageCapacity || 'N/A'}</div>
                              <div style={styles.infoText}>{user.operatingArea || 'N/A'}</div>
                            </>
                          )}
                          
                          {activeTab === 'customers' && (
                            <>
                              <div style={styles.infoRow}>
                                <Home size={14} style={{marginRight: 6}} />
                                <strong>Delivery Address</strong>
                              </div>
                              <div style={styles.infoText}>{user.deliveryAddress || 'N/A'}</div>
                            </>
                          )}
                        </div>
                      </td>
                      
                      <td style={styles.td}>
                        <div style={styles.contactInfo}>
                          <div style={styles.contactRow}>
                            <Mail size={14} style={{marginRight: 6}} />
                            {userData.email || 'N/A'}
                          </div>
                          <div style={styles.contactRow}>
                            <Phone size={14} style={{marginRight: 6}} />
                            {userData.phone || 'N/A'}
                          </div>
                          <div style={styles.contactRow}>
                            <MapPin size={14} style={{marginRight: 6}} />
                            <span style={styles.address}>{userData.address || 'N/A'}</span>
                          </div>
                        </div>
                      </td>
                      
                      <td style={styles.td}>
                        <span style={{
                          ...styles.badge,
                          background: userData.activeStatus ? '#10b981' : '#6b7280'
                        }}>
                          {userData.activeStatus ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      
                      {/* {activeTab !== 'customers' && (
                        <td style={styles.td}>
                          <span style={{
                            ...styles.badge,
                            background: verification.color
                          }}>
                            {verification.text}
                          </span>
                          {user.isVerified === false && (
                            <div style={styles.verificationActions}>
                              {/* <button
                                onClick={() => handleVerification(userId, true)}
                                style={styles.verifyButton}
                                title="Verify"
                              >
                                <CheckCircle size={14} />
                              </button>
                              <button
                                onClick={() => handleVerification(userId, false)}
                                style={styles.rejectButton}
                                title="Reject"
                              >
                                <XCircle size={14} /> */}
                              {/* </button> */}
                            {/* </div> */}
                        
                      
                      <td style={styles.td}>
                        <div style={styles.actionButtons}>
                          <button
                            onClick={() => deleteUser(userId)}
                            style={{...styles.iconButton, color: '#ef4444'}}
                            title={`Delete ${activeTab.slice(0, -1)}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredUsers.length === 0 && !loading[activeTab] && (
              <div style={styles.emptyState}>
                No {activeTab} found matching your criteria.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tabsContainer: {
    marginBottom: '24px',
    borderBottom: '1px solid #e5e7eb'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '12px 20px',
    borderRadius: '6px 6px 0 0',
    border: '1px solid #e5e7eb',
    borderBottom: 'none',
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
    borderColor: '#dc2626'
  },
  tabCount: {
    marginLeft: '8px',
    background: 'rgba(255,255,255,0.2)',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  content: {
    marginTop: '20px'
  },
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  statCard: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    textAlign: 'center',
    border: '1px solid #e2e8f0'
  },
  statNumber: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1e293b'
  },
  statLabel: {
    fontSize: '12px',
    color: '#64748b',
    marginTop: '4px'
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchContainer: {
    position: 'relative',
    flex: '1',
    minWidth: '300px'
  },
  searchIcon: {
    position: 'absolute',
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#64748b'
  },
  searchInput: {
    width: '100%',
    padding: '10px 12px 10px 40px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px'
  },
  filterContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px'
  },
  refreshButton: {
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500'
  },
  exportButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 16px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500'
  },
  error: {
    background: '#fef2f2',
    color: '#dc2626',
    padding: '12px 16px',
    borderRadius: '6px',
    marginBottom: '16px',
    border: '1px solid #fecaca'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '16px'
  },
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    padding: '12px 16px',
    textAlign: 'left',
    borderBottom: '1px solid #e5e7eb',
    fontSize: '12px',
    fontWeight: '600',
    color: '#374151',
    background: '#f9fafb'
  },
  tr: {
    borderBottom: '1px solid #f3f4f6'
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    verticalAlign: 'top'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  avatar: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: '14px'
  },
  userName: {
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '2px'
  },
  userId: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '2px'
  },
  username: {
    fontSize: '11px',
    color: '#9ca3af'
  },
  businessInfo: {
    lineHeight: '1.5'
  },
  infoRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '4px'
  },
  infoText: {
    fontSize: '13px',
    color: '#6b7280',
    marginBottom: '2px'
  },
  cropCount: {
    fontSize: '12px',
    color: '#dc2626',
    fontWeight: '600',
    marginTop: '4px'
  },
  contactInfo: {
    lineHeight: '1.5'
  },
  contactRow: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '6px',
    fontSize: '13px'
  },
  address: {
    fontSize: '12px',
    color: '#6b7280'
  },
  badge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    display: 'inline-block'
  },
  verificationActions: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  verifyButton: {
    background: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  rejectButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center'
  },
  iconButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '14px'
  },
  authMessage: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px',
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  authCard: {
    textAlign: 'center',
    padding: '40px'
  },
  authTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 16px 0'
  },
  authText: {
    color: '#6b7280',
    margin: '0 0 24px 0',
    fontSize: '16px'
  },
  authButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none',
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  }
  
};

export default UserManagement;