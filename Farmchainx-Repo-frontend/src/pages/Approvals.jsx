import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Eye, AlertCircle, User, Package, Truck, Store, Calendar, Mail, Phone, MapPin, Building, X, RefreshCw } from 'lucide-react';

const Approvals = ({ activeTab, onUpdate }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [viewingUser, setViewingUser] = useState(null);
  const [filter, setFilter] = useState('PENDING');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actioningUserId, setActioningUserId] = useState(null);
  const [roleTab, setRoleTab] = useState('farmers');

  const currentActiveTab = activeTab || roleTab;
  const BASE_URL = 'http://localhost:8080';

  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Add CSS animation
  useEffect(() => {
    if (!document.getElementById('approvals-spin-animation')) {
      const style = document.createElement('style');
      style.id = 'approvals-spin-animation';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // Fetch the specific entity ID based on role
  const fetchEntityIdByRole = async (userId, role) => {
    try {
      const token = getAuthToken();
      let endpoint = '';
      
      switch (role.toUpperCase()) {
        case 'FARMER':
          endpoint = `/admin/farmer/by-user/${userId}`;
          break;
        case 'DISTRIBUTOR':
          endpoint = `/admin/distributor/by-user/${userId}`;
          break;
        case 'RETAILER':
          endpoint = `/admin/retailer/by-user/${userId}`;
          break;
        default:
          return null;
      }

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (role.toUpperCase() === 'FARMER') return data.farmerId;
        if (role.toUpperCase() === 'DISTRIBUTOR') return data.distributorId;
        if (role.toUpperCase() === 'RETAILER') return data.retailerId;
      }
      
      return null;
    } catch (err) {
      console.error(`Error fetching entity ID for user ${userId}:`, err);
      return null;
    }
  };

  // Fetch users for approvals
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      console.log('🔄 Fetching business users from:', `${BASE_URL}/admin/get/business-users`);
      
      const response = await fetch(`${BASE_URL}/admin/get/business-users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please login again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Admin permissions required.');
        }
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const usersData = await response.json();
      
      console.log('📦 Fetched users:', usersData);
      
      // Fetch entity IDs for each user
      const enrichedUsers = await Promise.all(usersData.map(async (user) => {
        const entityId = await fetchEntityIdByRole(user.id, user.role);
        return {
          ...user,
          entityId: entityId
        };
      }));
      
      console.log('✅ Enriched users with entity IDs:', enrichedUsers);
      
      setUsers(enrichedUsers);
      applyFilters(enrichedUsers);

    } catch (err) {
      console.error('❌ Error fetching users:', err);
      setError(err.message || 'Failed to fetch users from server');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (usersList = users) => {
    let result = [...usersList];

    // Filter by Role (activeTab)
    if (currentActiveTab !== 'all') {
      result = result.filter(user => {
        if (!user) return false;
        const userRole = (user.role || '').toString().toLowerCase().trim();
        const tabRole = currentActiveTab.slice(0, -1).toLowerCase().trim();
        return userRole === tabRole;
      });
    }

    // Filter by Status
    result = result.filter(user => {
      if (filter === 'ALL') return true;
      
      const isVerified = user.is_verified;
      
      if (filter === 'PENDING') return isVerified === false;
      if (filter === 'APPROVED') return isVerified === true;
      if (filter === 'REJECTED') return isVerified === null;
      
      return true;
    });

    console.log(`✅ Filtered: ${result.length} users for ${currentActiveTab} with filter ${filter}`);
    setFilteredUsers(result);
  };

  // Handle approve action
  const handleApprove = async (user) => {
    setIsSubmitting(true);
    setActioningUserId(user.id);
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const entityId = user.entityId;
      if (!entityId) {
        throw new Error('Entity ID not found. Cannot approve user.');
      }

      let endpoint = '';
      let userType = '';
      
      switch (user.role.toUpperCase()) {
        case 'FARMER':
          endpoint = `/admin/approve/farmer/${entityId}`;
          userType = 'Farmer';
          break;
        case 'RETAILER':
          endpoint = `/admin/approve/retailer/${entityId}`;
          userType = 'Retailer';
          break;
        case 'DISTRIBUTOR':
          endpoint = `/admin/approve/distributor/${entityId}`;
          userType = 'Distributor';
          break;
        default:
          throw new Error('Invalid user type');
      }

      console.log(`🔄 Approving ${userType} with entity ID: ${entityId}`);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to approve ${userType}`);
      }

      console.log(`✅ ${userType} approved successfully`);
      
      setMessage(`${userType} approved successfully!`);
      setViewingUser(null);
      
      await fetchUsers();
      
      if (onUpdate) onUpdate();

    } catch (err) {
      console.error('❌ Approval error:', err);
      setError(err.message || 'Failed to approve user');
    } finally {
      setIsSubmitting(false);
      setActioningUserId(null);
    }
  };

  // Handle reject action
  const handleReject = async (user) => {
    setIsSubmitting(true);
    setActioningUserId(user.id);
    
    try {
      const token = getAuthToken();
      if (!token) throw new Error('Authentication required');

      const entityId = user.entityId;
      if (!entityId) {
        throw new Error('Entity ID not found. Cannot reject user.');
      }

      let endpoint = '';
      let userType = '';
      
      switch (user.role.toUpperCase()) {
        case 'FARMER':
          endpoint = `/admin/reject/farmer/${entityId}`;
          userType = 'Farmer';
          break;
        case 'RETAILER':
          endpoint = `/admin/reject/retailer/${entityId}`;
          userType = 'Retailer';
          break;
        case 'DISTRIBUTOR':
          endpoint = `/admin/reject/distributor/${entityId}`;
          userType = 'Distributor';
          break;
        default:
          throw new Error('Invalid user type');
      }

      console.log(`🔄 Rejecting ${userType} with entity ID: ${entityId}`);

      const response = await fetch(`${BASE_URL}${endpoint}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed to reject ${userType}`);
      }

      console.log(`✅ ${userType} rejected successfully`);
      
      setMessage(`${userType} rejected successfully!`);
      setViewingUser(null);
      
      await fetchUsers();
      
      if (onUpdate) onUpdate();

    } catch (err) {
      console.error('❌ Rejection error:', err);
      setError(err.message || 'Failed to reject user');
    } finally {
      setIsSubmitting(false);
      setActioningUserId(null);
    }
  };

  // Get status badge
  const getStatusBadge = (user) => {
    const isVerified = user.is_verified;
    
    if (isVerified === true) {
      return (
        <span style={styles.approvedBadge}>
          <CheckCircle size={14} style={{marginRight: 4}} />
          Approved
        </span>
      );
    } else if (isVerified === false) {
      return (
        <span style={styles.pendingBadge}>
          <Eye size={14} style={{marginRight: 4}} />
          Pending
        </span>
      );
    } else {
      return (
        <span style={styles.rejectedBadge}>
          <XCircle size={14} style={{marginRight: 4}} />
          Rejected
        </span>
      );
    }
  };

  // Get role badge
  const getRoleBadge = (user) => {
    const userRole = (user.role || '').toString().toUpperCase();
    
    let badgeStyle = {};
    let icon = null;
    
    switch (userRole) {
      case 'FARMER':
        badgeStyle = styles.farmerRoleBadge;
        icon = <Package size={14} style={{marginRight: 4}} />;
        break;
      case 'DISTRIBUTOR':
        badgeStyle = styles.distributorRoleBadge;
        icon = <Truck size={14} style={{marginRight: 4}} />;
        break;
      case 'RETAILER':
        badgeStyle = styles.retailerRoleBadge;
        icon = <Store size={14} style={{marginRight: 4}} />;
        break;
      default:
        badgeStyle = styles.defaultRoleBadge;
        icon = <User size={14} style={{marginRight: 4}} />;
    }
    
    return (
      <span style={badgeStyle}>
        {icon}
        {userRole.charAt(0) + userRole.slice(1).toLowerCase()}
      </span>
    );
  };

  // Get role icon
  const getRoleIcon = () => {
    switch (currentActiveTab) {
      case 'farmers': return <Package size={24} style={{color: 'white'}} />;
      case 'distributors': return <Truck size={24} style={{color: 'white'}} />;
      case 'retailers': return <Store size={24} style={{color: 'white'}} />;
      case 'all': return <User size={24} style={{color: 'white'}} />;
      default: return <User size={24} style={{color: 'white'}} />;
    }
  };

  // Get role title
  const getRoleTitle = () => {
    switch (currentActiveTab) {
      case 'farmers': return 'Farmers';
      case 'distributors': return 'Distributors';
      case 'retailers': return 'Retailers';
      case 'all': return 'All Business Users';
      default: return 'Users';
    }
  };

  // Get filter counts
  const getFilterCounts = () => {
    let tabUsers = users;
    
    if (currentActiveTab !== 'all') {
      tabUsers = users.filter(user => {
        const userRole = (user.role || '').toString().toLowerCase().trim();
        const tabRole = currentActiveTab.slice(0, -1).toLowerCase().trim();
        return userRole === tabRole;
      });
    }

    const pending = tabUsers.filter(u => u.is_verified === false).length;
    const approved = tabUsers.filter(u => u.is_verified === true).length;
    const rejected = tabUsers.filter(u => u.is_verified === null).length;

    return {
      ALL: tabUsers.length,
      PENDING: pending,
      APPROVED: approved,
      REJECTED: rejected
    };
  };

  // Clear messages
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Fetch users when component mounts or activeTab changes
  useEffect(() => {
    fetchUsers();
  }, [currentActiveTab]);

  // Apply filters when dependencies change
  useEffect(() => {
    applyFilters();
  }, [users, currentActiveTab, filter]);

  const filterCounts = getFilterCounts();

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingCard}>
          <div style={styles.spinnerContainer}>
            <div style={styles.spinner}></div>
          </div>
          <h2 style={styles.loadingText}>Loading {getRoleTitle().toLowerCase()}...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Role Filter Tabs */}
      <div style={styles.roleTabsContainer}>
        <div style={styles.roleTabs}>
          {['farmers', 'distributors', 'retailers', 'all'].map((tab) => (
            <button
              key={tab}
              onClick={() => setRoleTab(tab)}
              style={{
                ...styles.roleTab,
                ...(roleTab === tab ? styles.roleTabActive : {})
              }}
            >
              {tab === 'farmers' && <Package size={16} style={{marginRight: 6}} />}
              {tab === 'distributors' && <Truck size={16} style={{marginRight: 6}} />}
              {tab === 'retailers' && <Store size={16} style={{marginRight: 6}} />}
              {tab === 'all' && <User size={16} style={{marginRight: 6}} />}
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div style={styles.filterContainer}>
        <div style={styles.filters}>
          {['PENDING', 'ALL', 'APPROVED', 'REJECTED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                ...styles.filter,
                ...(filter === status ? styles.filterActive : {})
              }}
            >
              {status === 'ALL' ? 'All' : status}
              <span style={styles.filterCount}>
                ({filterCounts[status] || 0})
              </span>
            </button>
          ))}
          <button onClick={fetchUsers} style={styles.refreshButton} title="Refresh data">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Messages */}
      {message && (
        <div style={styles.successMessage}>
          <CheckCircle size={20} style={{marginRight: 8}} />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={20} style={{marginRight: 8}} />
          <span>{error}</span>
        </div>
      )}

      {/* Content */}
      {filteredUsers.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            {getRoleIcon()}
          </div>
          <h3 style={styles.emptyTitle}>No {getRoleTitle().toLowerCase()} found</h3>
          <p style={styles.emptyText}>
            {filter === 'ALL' 
              ? `There are no ${getRoleTitle().toLowerCase()} in the system yet.` 
              : `There are no ${filter.toLowerCase()} ${getRoleTitle().toLowerCase()} applications.`
            }
          </p>
          <button onClick={fetchUsers} style={styles.retryButton}>
            <RefreshCw size={16} style={{marginRight: 6}} />
            Refresh Data
          </button>
        </div>
      ) : (
        <div style={styles.usersGrid}>
          {filteredUsers.map((user) => (
            <div key={user.id} style={styles.userCard}>
              <div style={styles.userCardContent}>
                <div style={styles.userHeader}>
                  <div style={styles.userInfo}>
                    <h3 style={styles.userName}>
                      {user.businessName || user.name || 'Unnamed Business'}
                    </h3>
                    <p style={styles.userEmail}>
                      {user.name || 'Business Owner'}
                    </p>
                  </div>
                  <div style={styles.badgesContainer}>
                    <div style={styles.statusBadge}>
                      {getStatusBadge(user)}
                    </div>
                    <div style={styles.roleBadge}>
                      {getRoleBadge(user)}
                    </div>
                  </div>
                </div>
                
                <div style={styles.userDetails}>
                  <div style={styles.detailItem}>
                    <Mail size={16} style={{marginRight: 8, color: '#6b7280'}} />
                    <span style={styles.detailText}>{user.email || 'N/A'}</span>
                  </div>
                  <div style={styles.detailItem}>
                    <Phone size={16} style={{marginRight: 8, color: '#6b7280'}} />
                    <span style={styles.detailText}>{user.phone || 'N/A'}</span>
                  </div>
                  {user.address && (
                    <div style={styles.detailItem}>
                      <MapPin size={16} style={{marginRight: 8, color: '#6b7280'}} />
                      <span style={styles.detailText}>{user.address}</span>
                    </div>
                  )}
                </div>

                <div style={styles.userMeta}>
                  <p style={styles.metaText}>User ID: {user.id}</p>
                  {user.entityId && (
                    <p style={styles.metaText}>
                      {user.role} ID: {user.entityId}
                    </p>
                  )}
                </div>

                <div style={styles.userActions}>
                  <button
                    onClick={() => setViewingUser(user)}
                    style={styles.viewButton}
                  >
                    <Eye size={14} style={{marginRight: 4}} />
                    View Details
                  </button>
                  
                  {user.is_verified === false && (
                    <div style={styles.actionButtons}>
                      <button
                        onClick={() => handleApprove(user)}
                        disabled={isSubmitting && actioningUserId === user.id}
                        style={styles.approveButton}
                      >
                        {isSubmitting && actioningUserId === user.id ? (
                          <div style={styles.buttonSpinner}></div>
                        ) : (
                          <CheckCircle size={14} style={{marginRight: 4}} />
                        )}
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(user)}
                        disabled={isSubmitting && actioningUserId === user.id}
                        style={styles.rejectButton}
                      >
                        <XCircle size={14} style={{marginRight: 4}} />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View User Modal */}
      {viewingUser && (
        <div style={styles.modalOverlay} onClick={() => setViewingUser(null)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <div style={styles.modalHeaderContent}>
                <div style={styles.modalIcon}>
                  <Building size={24} style={{color: 'white'}} />
                </div>
                <div>
                  <h2 style={styles.modalTitle}>
                    {viewingUser.businessName || viewingUser.name || 'Unnamed Business'}
                  </h2>
                  <p style={styles.modalSubtitle}>
                    {viewingUser.role} Application Details
                  </p>
                </div>
              </div>
              <button onClick={() => setViewingUser(null)} style={styles.closeButton}>
                <X size={24} style={{color: 'white'}} />
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.modalGrid}>
                <div style={styles.modalSection}>
                  <h4 style={styles.sectionTitle}>
                    <User size={16} style={{marginRight: 8}} />
                    Basic Information
                  </h4>
                  <div style={styles.sectionContent}>
                    <p><strong>User ID:</strong> {viewingUser.id}</p>
                    {viewingUser.entityId && (
                      <p><strong>{viewingUser.role} ID:</strong> {viewingUser.entityId}</p>
                    )}
                    <p><strong>Name:</strong> {viewingUser.name || 'N/A'}</p>
                    <p><strong>Business Name:</strong> {viewingUser.businessName || 'Not provided'}</p>
                    <p><strong>Email:</strong> {viewingUser.email || 'N/A'}</p>
                    <p><strong>Phone:</strong> {viewingUser.phone || 'Not provided'}</p>
                    <p><strong>Username:</strong> {viewingUser.username || 'N/A'}</p>
                  </div>
                </div>

                <div style={styles.modalSection}>
                  <h4 style={styles.sectionTitle}>
                    <MapPin size={16} style={{marginRight: 8}} />
                    Address
                  </h4>
                  <div style={styles.sectionContent}>
                    <p>{viewingUser.address || 'Not provided'}</p>
                  </div>
                </div>
              </div>

              <div style={styles.modalSection}>
                <h4 style={styles.sectionTitle}>
                  <Calendar size={16} style={{marginRight: 8}} />
                  Status
                </h4>
                <div style={styles.sectionContent}>
                  <p><strong>Status:</strong> {getStatusBadge(viewingUser)}</p>
                  <p><strong>Role:</strong> {getRoleBadge(viewingUser)}</p>
                </div>
              </div>

              {viewingUser.is_verified === false && (
                <div style={styles.modalActions}>
                  <button
                    onClick={() => handleReject(viewingUser)}
                    disabled={isSubmitting}
                    style={styles.modalRejectButton}
                  >
                    {isSubmitting && actioningUserId === viewingUser.id ? (
                      <div style={styles.modalSpinner}></div>
                    ) : (
                      <XCircle size={16} style={{marginRight: 6}} />
                    )}
                    Reject Application
                  </button>
                  <button
                    onClick={() => handleApprove(viewingUser)}
                    disabled={isSubmitting}
                    style={styles.modalApproveButton}
                  >
                    {isSubmitting && actioningUserId === viewingUser.id ? (
                      <div style={styles.modalSpinner}></div>
                    ) : (
                      <CheckCircle size={16} style={{marginRight: 6}} />
                    )}
                    Approve {viewingUser.role.toLowerCase()}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles
const styles = {
  container: {
    background: 'white',
    borderRadius: '0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '0'
  },
  roleTabsContainer: {
    padding: '20px 20px 0 20px',
    borderBottom: '1px solid #e5e7eb'
  },
  roleTabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    marginBottom: '12px'
  },
  roleTab: {
    padding: '8px 16px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center'
  },
  roleTabActive: {
    background: 'linear-gradient(135deg, #4f46e5 0%, #4338ca 100%)',
    color: 'white',
    border: 'none'
  },
  filterContainer: {
    padding: '20px',
    borderBottom: '1px solid #e5e7eb'
  },
  filters: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  filter: {
    padding: '10px 20px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  filterActive: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none'
  },
  filterCount: {
    fontSize: '12px',
    opacity: '0.75',
    marginLeft: '4px'
  },
  refreshButton: {
    padding: '10px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto'
  },
  successMessage: {
    padding: '16px',
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '0',
    marginBottom: '0',
    display: 'flex',
    alignItems: 'center'
  },
  errorMessage: {
    padding: '16px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: '0',
    marginBottom: '0',
    display: 'flex',
    alignItems: 'center'
  },
  badgesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    alignItems: 'flex-end'
  },
  roleBadge: {
    marginLeft: '8px',
    flexShrink: 0
  },
  farmerRoleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600'
  },
  distributorRoleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#dbeafe',
    color: '#1e40af',
    border: '1px solid #93c5fd',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600'
  },
  retailerRoleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#f3e8ff',
    color: '#7e22ce',
    border: '1px solid #d8b4fe',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600'
  },
  defaultRoleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '600'
  },
  emptyState: {
    background: 'white',
    borderRadius: '0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '60px 20px',
    textAlign: 'center'
  },
  emptyIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  emptyText: {
    color: '#6b7280',
    margin: '0 0 16px 0'
  },
  retryButton: {
    marginTop: '16px',
    padding: '10px 20px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center'
  },
  usersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '0'
  },
  userCard: {
    background: 'white',
    borderRadius: '0',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    border: '1px solid #f3f4f6',
    borderBottom: '1px solid #e5e7eb'
  },
  userCardContent: {
    padding: '20px'
  },
  userHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  userInfo: {
    flex: 1,
    minWidth: 0
  },
  userName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  userEmail: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  statusBadge: {
    marginLeft: '8px',
    flexShrink: 0
  },
  approvedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#dcfce7',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  pendingBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fde68a',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  rejectedBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '6px 12px',
    background: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600'
  },
  userDetails: {
    marginBottom: '16px'
  },
  detailItem: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#6b7280'
  },
  detailText: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  userMeta: {
    marginBottom: '16px',
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '6px'
  },
  metaText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: '2px 0'
  },
  userActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  viewButton: {
    width: '100%',
    padding: '10px 16px',
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  actionButtons: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  approveButton: {
    padding: '10px 16px',
    background: '#dcfce7',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    color: '#166534',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  rejectButton: {
    padding: '10px 16px',
    background: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#991b1b',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid currentColor',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    zIndex: 1000
  },
  modal: {
    background: 'white',
    borderRadius: '8px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
    maxWidth: '700px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    color: 'white'
  },
  modalHeaderContent: {
    display: 'flex',
    alignItems: 'center'
  },
  modalIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px'
  },
  modalTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0
  },
  modalSubtitle: {
    fontSize: '14px',
    opacity: '0.9',
    margin: '4px 0 0 0'
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    color: 'white'
  },
  modalContent: {
    padding: '24px'
  },
  modalGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px'
  },
  modalSection: {
    marginBottom: '16px'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0',
    display: 'flex',
    alignItems: 'center'
  },
  sectionContent: {
    background: '#f9fafb',
    padding: '16px',
    borderRadius: '8px',
    fontSize: '14px',
    lineHeight: '1.6'
  },
  modalActions: {
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px'
  },
  modalApproveButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center'
  },
  modalRejectButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center'
  },
  modalSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid white',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '6px'
  },
  loadingContainer: {
    background: 'white',
    borderRadius: '0',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    padding: '60px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingCard: {
    textAlign: 'center'
  },
  spinnerContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#fef2f2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #dc2626',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  }
};

export default Approvals;