// Update

import React, { useState, useEffect } from 'react';
import { 
  Plus, Eye, Trash2, QrCode, Search, Filter, 
  ArrowUp, ArrowDown, X, Calendar, Package, TrendingUp, Download, Edit,
  CheckCircle, Clock, AlertCircle, Ban, User, Truck, Store
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const CreateBatches = ({ crops, userRole = 'FARMER' }) => {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [cropFilter, setCropFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [sortBy, setSortBy] = useState('harvestDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    batchNumber: '',
    harvestDate: '',
    quantity: '',
    availableQuantity: '',
    unit: 'kg',
    storageConditions: '',
    price: '',
    cropId: '',
    status: 'AVAILABLE'
  });

  const [statusFormData, setStatusFormData] = useState({
    status: 'AVAILABLE',
    availableQuantity: ''
  });

  const BASE_URL = 'http://localhost:8080';

  // Batch status options and configurations
  const batchStatuses = {
    AVAILABLE: { label: 'Available', color: '#10b981', icon: CheckCircle, bgColor: '#f0fdf4' },
    RESERVED: { label: 'Reserved', color: '#f59e0b', icon: Clock, bgColor: '#fffbeb' },
    SOLD: { label: 'Sold', color: '#3b82f6', icon: CheckCircle, bgColor: '#eff6ff' },
    EXPIRED: { label: 'Expired', color: '#ef4444', icon: Ban, bgColor: '#fef2f2' }
  };

  // Batch creator roles
  const batchCreatorRoles = {
    FARMER: { label: 'Farmer', color: '#147a48', icon: User, bgColor: '#f0fdf4' },
    DISTRIBUTOR: { label: 'Distributor', color: '#1d4ed8', icon: Truck, bgColor: '#eff6ff' },
    RETAILER: { label: 'Retailer', color: '#7c3aed', icon: Store, bgColor: '#faf5ff' }
  };

  // Helper functions for authentication
  const getAuthToken = () => localStorage.getItem('token') || localStorage.getItem('authToken');
  const getUserId = () => localStorage.getItem('userId');

  // Consistent headers for all API calls
  const getHeaders = () => ({
    'Authorization': `Bearer ${getAuthToken()}`,
    'Content-Type': 'application/json'
  });

  // Enhanced error handler
  const handleApiError = async (response) => {
    if (!response.ok) {
      let errorMessage = 'Request failed';
      
      try {
        const errorText = await response.text();
        if (errorText) {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorText;
        }
      } catch (e) {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }

      switch (response.status) {
        case 401:
          errorMessage = 'Session expired. Please login again.';
          break;
        case 403:
          errorMessage = 'Access denied. Insufficient permissions.';
          break;
        case 404:
          errorMessage = 'Resource not found.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
      }
      
      throw new Error(errorMessage);
    }
    return response;
  };

  // Fetch batches from backend - UPDATED ENDPOINT
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('Authentication required. Please login again.');
      }

      const userId = getUserId();
      if (!userId) {
        throw new Error('User ID not found. Please login again.');
      }

      // Updated endpoint: /batches/user/{userId}
      const response = await fetch(`${BASE_URL}/batches/user/${userId}`, {
        headers: getHeaders()
      });
      
      const checkedResponse = await handleApiError(response);
      const batchesData = await checkedResponse.json();
      
      setBatches(batchesData || []);
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError(err.message || 'Failed to fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch batches on mount
  useEffect(() => {
    fetchBatches();
  }, []);

  // Filter and sort batches
  useEffect(() => {
    let filtered = [...batches];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(batch =>
        batch.batchNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.crop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        batch.storageConditions?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply crop filter
    if (cropFilter !== 'all') {
      filtered = filtered.filter(batch => batch.crop?.cropId?.toString() === cropFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(batch => batch.status === statusFilter);
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(batch => batch.createdByRole === roleFilter);
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(batch => 
        new Date(batch.harvestDate) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(batch => 
        new Date(batch.harvestDate) <= new Date(dateRange.end + 'T23:59:59')
      );
    }

    // Apply sorting with proper null handling
    filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'harvestDate':
          aValue = a.harvestDate ? new Date(a.harvestDate).getTime() : 0;
          bValue = b.harvestDate ? new Date(b.harvestDate).getTime() : 0;
          break;
        case 'batchNumber':
          aValue = (a.batchNumber || '').toLowerCase();
          bValue = (b.batchNumber || '').toLowerCase();
          break;
        case 'quantity':
          aValue = parseFloat(a.quantity) || 0;
          bValue = parseFloat(b.quantity) || 0;
          break;
        case 'price':
          aValue = parseFloat(a.price) || 0;
          bValue = parseFloat(b.price) || 0;
          break;
        case 'availableQuantity':
          aValue = parseFloat(a.availableQuantity) || 0;
          bValue = parseFloat(b.availableQuantity) || 0;
          break;
        case 'crop':
          aValue = (a.crop?.name || '').toLowerCase();
          bValue = (b.crop?.name || '').toLowerCase();
          break;
        case 'status':
          aValue = a.status || '';
          bValue = b.status || '';
          break;
        case 'role':
          aValue = a.createdByRole || '';
          bValue = b.createdByRole || '';
          break;
        default:
          return 0;
      }

      // Handle comparison based on data type
      let comparison = 0;
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        comparison = aValue.localeCompare(bValue);
      } else {
        comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      }

      return sortOrder === 'desc' ? comparison * -1 : comparison;
    });

    setFilteredBatches(filtered);
  }, [batches, searchTerm, cropFilter, statusFilter, roleFilter, dateRange, sortBy, sortOrder]);

  // Add new batch - UPDATED FOR ROLE SUPPORT
  const handleAddBatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const userId = getUserId();
      if (!userId) throw new Error('User ID not found. Please login again.');

      if (!formData.cropId) throw new Error('Please select a crop');

      // Validate form data
      if (!formData.batchNumber?.trim()) throw new Error('Batch number is required');
      if (!formData.harvestDate) throw new Error('Harvest date is required');
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) throw new Error('Valid quantity is required');
      if (!formData.price || parseFloat(formData.price) <= 0) throw new Error('Valid price is required');

      // Prepare the data with status and available quantity
      const batchData = {
        batchNumber: formData.batchNumber.trim(),
        harvestDate: formData.harvestDate + 'T00:00:00',
        quantity: parseFloat(formData.quantity),
        availableQuantity: parseFloat(formData.availableQuantity || formData.quantity),
        unit: formData.unit,
        storageConditions: formData.storageConditions?.trim() || '',
        price: parseFloat(formData.price),
        status: formData.status
      };

      console.log('Sending batch data:', batchData);

      // Choose endpoint based on user role
      let endpoint;
      switch (userRole) {
        case 'DISTRIBUTOR':
          endpoint = `${BASE_URL}/batches/distributor/${userId}/crop/${formData.cropId}`;
          break;
        case 'RETAILER':
          endpoint = `${BASE_URL}/batches/retailer/${userId}/crop/${formData.cropId}`;
          break;
        case 'FARMER':
        default:
          endpoint = `${BASE_URL}/batches/farmer/${localStorage.getItem('id')}/crop/${formData.cropId}`;
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(batchData)
      });

      await handleApiError(response);
      
      setMessage('Batch created successfully!');
      setShowAddModal(false);
      resetFormData();
      fetchBatches();
    } catch (err) {
      console.error('Error adding batch:', err);
      setError(err.message || 'Failed to create batch. Please check the data format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update batch - SAME ENDPOINT
  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedBatch) throw new Error('No batch selected for update');

      // Validate form data
      if (!formData.batchNumber?.trim()) throw new Error('Batch number is required');
      if (!formData.harvestDate) throw new Error('Harvest date is required');
      if (!formData.quantity || parseFloat(formData.quantity) <= 0) throw new Error('Valid quantity is required');
      if (!formData.price || parseFloat(formData.price) <= 0) throw new Error('Valid price is required');
      

      // Prepare update data
      const updateData = {
        batchNumber: formData.batchNumber.trim(),
        harvestDate: formData.harvestDate + 'T00:00:00',
        quantity: parseFloat(formData.quantity),
        availableQuantity: parseFloat(formData.availableQuantity),
        unit: formData.unit,
        storageConditions: formData.storageConditions?.trim() || '',
        price: parseFloat(formData.price),
        status: formData.status
      };

      console.log('Updating batch with data:', updateData);

      const response = await fetch(`${BASE_URL}/batches/${selectedBatch.batchId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      });

      await handleApiError(response);
      
      setMessage('Batch updated successfully!');
      setShowEditModal(false);
      setSelectedBatch(null);
      resetFormData();
      fetchBatches();
    } catch (err) {
      console.error('Error updating batch:', err);
      setError(err.message || 'Failed to update batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update batch status - UPDATED ENDPOINT
  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedBatch) throw new Error('No batch selected');

      // Validate available quantity
      const availableQuantity = parseFloat(statusFormData.availableQuantity);
      if (isNaN(availableQuantity) || availableQuantity < 0) {
        throw new Error('Valid available quantity is required');
      }
      if (availableQuantity > selectedBatch.quantity) {
        throw new Error('Available quantity cannot exceed total quantity');
      }

      const statusData = {
        status: statusFormData.status,
        availableQuantity: availableQuantity
      };

      // Use the quantity update endpoint
      const response = await fetch(`${BASE_URL}/batches/${selectedBatch.batchId}/quantity`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(statusData)
      });

      await handleApiError(response);
      
      setMessage('Batch status updated successfully!');
      setShowStatusModal(false);
      setSelectedBatch(null);
      setStatusFormData({ status: 'AVAILABLE', availableQuantity: '' });
      fetchBatches();
    } catch (err) {
      console.error('Error updating batch status:', err);
      setError(err.message || 'Failed to update batch status');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to reset form data
  const resetFormData = () => {
    setFormData({
      batchNumber: '',
      harvestDate: '',
      quantity: '',
      availableQuantity: '',
      unit: 'kg',
      storageConditions: '',
      price: '',
      cropId: '',
      status: 'AVAILABLE'
    });
  };

  // Delete batch - SAME ENDPOINT
  const handleDeleteBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`${BASE_URL}/batches/${batchId}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      await handleApiError(response);
      
      setMessage('Batch deleted successfully!');
      fetchBatches();
    } catch (err) {
      console.error('Error deleting batch:', err);
      setError(err.message || 'Failed to delete batch');
    }
  };

  // Edit batch
  const handleEditBatch = (batch) => {
    setSelectedBatch(batch);
    
    const harvestDate = batch.harvestDate ? 
      new Date(batch.harvestDate).toISOString().split('T')[0] : '';
    
    setFormData({
      batchNumber: batch.batchNumber || '',
      harvestDate: harvestDate,
      quantity: batch.quantity || '',
      availableQuantity: batch.availableQuantity || '',
      unit: batch.unit || 'kg',
      storageConditions: batch.storageConditions || '',
      price: batch.price || '',
      cropId: batch.crop?.cropId || '',
      status: batch.status || 'AVAILABLE'
    });
    setShowEditModal(true);
  };

  // Update batch status
  const handleStatusUpdate = (batch) => {
    setSelectedBatch(batch);
    setStatusFormData({
      status: batch.status || 'AVAILABLE',
      availableQuantity: batch.availableQuantity?.toString() || batch.quantity?.toString() || ''
    });
    setShowStatusModal(true);
  };

  // Generate batch number
  const generateBatchNumber = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `BATCH-${timestamp}-${random}`;
  };

  // Download QR Code
  const handleDownloadQR = () => {
    const canvas = document.getElementById('batch-qr-canvas');
    if (!canvas) return;
    
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${selectedBatch?.batchId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setMessage('QR Code downloaded successfully!');
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code');
    }
  };

  // Get status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = batchStatuses[status] || batchStatuses.AVAILABLE;
    const IconComponent = statusConfig.icon;
    
    return (
      <span style={{
        ...styles.statusBadge,
        background: statusConfig.bgColor,
        color: statusConfig.color,
        border: `1px solid ${statusConfig.color}20`
      }}>
        <IconComponent size={12} style={{ marginRight: 4 }} />
        {statusConfig.label}
      </span>
    );
  };

  // Get role badge component
  const RoleBadge = ({ role }) => {
    const roleConfig = batchCreatorRoles[role] || batchCreatorRoles.FARMER;
    const IconComponent = roleConfig.icon;
    
    return (
      <span style={{
        ...styles.roleBadge,
        background: roleConfig.bgColor,
        color: roleConfig.color,
        border: `1px solid ${roleConfig.color}20`
      }}>
        <IconComponent size={12} style={{ marginRight: 4 }} />
        {roleConfig.label}
      </span>
    );
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

  // Auto-generate batch number when add modal opens
  useEffect(() => {
    if (showAddModal && !formData.batchNumber) {
      setFormData(prev => ({
        ...prev,
        batchNumber: generateBatchNumber()
      }));
    }
  }, [showAddModal]);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading batches...</p>
      </div>
    );
  }

  return (
    <div style={styles.tabContentInner}>
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

      {/* Action Bar with Search and Filters */}
      <div style={styles.actionBar}>
        <div style={styles.searchFilterContainer}>
          <div style={styles.searchBox}>
            <Search size={20} style={{color: '#6b7280', marginRight: 8}} />
            <input
              type="text"
              placeholder="Search batches by number, crop, or storage..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          
          <div style={styles.filterButtons}>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              style={{
                ...styles.filterButton,
                ...(showFilters && styles.filterButtonActive)
              }}
            >
              <Filter size={16} style={{marginRight: 6}} />
              Filters
              {showFilters && <span style={styles.activeDot}></span>}
            </button>
            
            <button 
              onClick={() => {
                setSearchTerm('');
                setCropFilter('all');
                setStatusFilter('all');
                setRoleFilter('all');
                setDateRange({ start: '', end: '' });
                setSortBy('harvestDate');
                setSortOrder('desc');
                setMessage('Filters cleared');
              }}
              style={styles.resetButton}
            >
              Clear Filters
            </button>
            
            <button 
              onClick={() => {
                setFormData({
                  batchNumber: generateBatchNumber(),
                  harvestDate: new Date().toISOString().split('T')[0],
                  quantity: '',
                  availableQuantity: '',
                  unit: 'kg',
                  storageConditions: '',
                  price: '',
                  cropId: '',
                  status: 'AVAILABLE'
                });
                setShowAddModal(true);
              }} 
              style={styles.addButton}
            >
              <Plus size={20} style={{marginRight: 8}} />
              Create Batch
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={styles.advancedFilters}>
            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Crop</h4>
              <select
                value={cropFilter}
                onChange={(e) => setCropFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Crops</option>
                {crops.map(crop => (
                  <option key={crop.cropId} value={crop.cropId}>
                    {crop.name} - {crop.variety}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Status</h4>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                {Object.entries(batchStatuses).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Creator Role</h4>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Roles</option>
                {Object.entries(batchCreatorRoles).map(([value, config]) => (
                  <option key={value} value={value}>
                    {config.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Harvest Date Range</h4>
              <div style={styles.dateRangeContainer}>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  style={styles.dateInput}
                  placeholder="Start date"
                />
                <span style={styles.dateSeparator}>to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  style={styles.dateInput}
                  placeholder="End date"
                />
              </div>
            </div>

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Sort By</h4>
              <div style={styles.sortContainer}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={styles.sortSelect}
                >
                  <option value="harvestDate">Harvest Date</option>
                  <option value="batchNumber">Batch Number</option>
                  <option value="quantity">Total Quantity</option>
                  <option value="availableQuantity">Available Quantity</option>
                  <option value="price">Price</option>
                  <option value="crop">Crop Name</option>
                  <option value="status">Status</option>
                  <option value="role">Creator Role</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  style={styles.sortOrderButton}
                >
                  {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div style={styles.resultsInfo}>
          <span style={styles.resultsText}>
            Showing {filteredBatches.length} of {batches.length} batches
          </span>
        </div>
      </div>

      {/* Batches Grid */}
      {filteredBatches.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Package size={48} style={{color: '#147a48'}} />
          </div>
          <h3 style={styles.emptyTitle}>
            {batches.length === 0 ? 'No batches yet' : 'No batches found'}
          </h3>
          <p style={styles.emptyText}>
            {batches.length === 0 
              ? 'Start by creating your first batch from your crops'
              : 'Try adjusting your search or filters'
            }
          </p>
          <button 
            onClick={() => {
              setFormData({
                batchNumber: generateBatchNumber(),
                harvestDate: new Date().toISOString().split('T')[0],
                quantity: '',
                availableQuantity: '',
                unit: 'kg',
                storageConditions: '',
                price: '',
                cropId: '',
                status: 'AVAILABLE'
              });
              setShowAddModal(true);
            }} 
            style={styles.emptyButton}
          >
            <Plus size={20} style={{marginRight: 8}} />
            Create First Batch
          </button>
        </div>
      ) : (
        <div style={styles.batchesGrid}>
          {filteredBatches.map((batch) => (
            <div key={batch.batchId} style={styles.batchCard}>
              <div style={styles.batchHeader}>
                <div>
                  <h3 style={styles.batchNumber}>{batch.batchNumber}</h3>
                  <div style={styles.batchBadges}>
                    <StatusBadge status={batch.status} />
                    <RoleBadge role={batch.createdByRole} />
                  </div>
                </div>
                <span style={styles.batchCrop}>{batch.crop?.name}</span>
              </div>
              
              <div style={styles.batchDetails}>
                <div style={styles.batchDetail}>
                  <Calendar size={14} style={{color: '#6b7280', marginRight: 8}} />
                  <span style={styles.detailLabel}>Harvest Date:</span>
                  <span style={styles.detailValue}>
                    {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                
                <div style={styles.batchDetail}>
                  <Package size={14} style={{color: '#6b7280', marginRight: 8}} />
                  <span style={styles.detailLabel}>Total Quantity:</span>
                  <span style={styles.detailValue}>
                    {batch.quantity} {batch.unit}
                  </span>
                </div>

                <div style={styles.batchDetail}>
                  <Package size={14} style={{color: '#6b7280', marginRight: 8}} />
                  <span style={styles.detailLabel}>Available:</span>
                  <span style={{
                    ...styles.detailValue,
                    color: batch.availableQuantity === 0 ? '#ef4444' : 
                           batch.availableQuantity < batch.quantity ? '#f59e0b' : '#10b981',
                    fontWeight: '600'
                  }}>
                    {batch.availableQuantity} {batch.unit}
                  </span>
                </div>
                
                <div style={styles.batchDetail}>
                  <TrendingUp size={14} style={{color: '#6b7280', marginRight: 8}} />
                  <span style={styles.detailLabel}>Price:</span>
                  <span style={styles.detailValue}>₹{batch.price}</span>
                </div>

                {batch.storageConditions && (
                  <div style={styles.storageInfo}>
                    <span style={styles.storageLabel}>Storage:</span>
                    <span style={styles.storageValue}>{batch.storageConditions}</span>
                  </div>
                )}
              </div>

              <div style={styles.batchActions}>
                <button 
                  onClick={() => handleEditBatch(batch)}
                  style={styles.editButton}
                >
                  <Edit size={14} style={{marginRight: 4}} />
                  Edit
                </button>
                {/* <button 
                  onClick={() => handleStatusUpdate(batch)}
                  style={styles.statusButton}
                >
                  <CheckCircle size={14} style={{marginRight: 4}} />
                  Status
                </button> */}
                <button 
                  onClick={() => {
                    setSelectedBatch(batch);
                    setShowQRModal(true);
                  }}
                  style={styles.qrButton}
                >
                  <QrCode size={14} style={{marginRight: 4}} />
                  QR Code
                </button>
                <button 
                  onClick={() => handleDeleteBatch(batch.batchId)}
                  style={styles.deleteButton}
                >
                  <Trash2 size={14} style={{marginRight: 4}} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Batch Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Batch</h2>
              <button onClick={() => setShowAddModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleAddBatch} style={styles.modalContent}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                    style={styles.input}
                    required
                    placeholder="e.g., BATCH-001"
                    disabled
                    readOnly
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Crop *</label>
                  <select
                    value={formData.cropId}
                    onChange={(e) => setFormData({...formData, cropId: e.target.value})}
                    style={styles.input}
                    required
                  >
                    <option value="">Select a crop</option>
                    {crops.map(crop => (
                      <option key={crop.cropId} value={crop.cropId}>
                        {crop.name} - {crop.variety} ({crop.quantityAvailable} kg available)
                      </option>
                    ))}
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Harvest Date *</label>
                  <input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({...formData, harvestDate: e.target.value})}
                    style={styles.input}
                    required
                    max={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    style={styles.input}
                    required
                    placeholder="150.0"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Available Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({...formData, availableQuantity: e.target.value})}
                    style={styles.input}
                    required
                    placeholder="150.0"
                  />
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    Initial available quantity (usually same as total quantity)
                  </small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    style={styles.input}
                    required
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="tons">Tons</option>
                    <option value="quintals">Quintals</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={styles.input}
                    required
                    placeholder="1200.50"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={styles.input}
                    required
                  >
                    {Object.entries(batchStatuses).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Storage Conditions</label>
                <textarea
                  value={formData.storageConditions}
                  onChange={(e) => setFormData({...formData, storageConditions: e.target.value})}
                  style={styles.textarea}
                  rows={3}
                  placeholder="e.g., Cool dry place, Temperature controlled..."
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitButton,
                    ...(isSubmitting && styles.submitButtonDisabled)
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={styles.buttonSpinner}></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus size={16} style={{marginRight: 6}} />
                      Create Batch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditModal && selectedBatch && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Edit Batch</h2>
              <button onClick={() => setShowEditModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateBatch} style={styles.modalContent}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>Batch Number *</label>
                  <input
                    type="text"
                    value={formData.batchNumber}
                    onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                    style={styles.input}
                    required
                    readOnly
                    disabled
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Crop</label>
                  <input
                    type="text"
                    value={selectedBatch.crop?.name || ''}
                    style={{...styles.input, background: '#f9fafb'}}
                    disabled
                    placeholder="Crop cannot be changed"
                  />
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    Crop cannot be changed after creation
                  </small>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Harvest Date *</label>
                  <input
                    type="date"
                    value={formData.harvestDate}
                    onChange={(e) => setFormData({...formData, harvestDate: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Available Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.availableQuantity}
                    onChange={(e) => setFormData({...formData, availableQuantity: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Unit *</label>
                  <select
                    value={formData.unit}
                    onChange={(e) => setFormData({...formData, unit: e.target.value})}
                    style={styles.input}
                    required
                  >
                    <option value="kg">Kilograms (kg)</option>
                    <option value="tons">Tons</option>
                    <option value="quintals">Quintals</option>
                    <option value="bags">Bags</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                    style={styles.input}
                    required
                  >
                    {Object.entries(batchStatuses).map(([value, config]) => (
                      <option key={value} value={value}>
                        {config.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Storage Conditions</label>
                <textarea
                  value={formData.storageConditions}
                  onChange={(e) => setFormData({...formData, storageConditions: e.target.value})}
                  style={styles.textarea}
                  rows={3}
                  placeholder="e.g., Cool dry place, Temperature controlled..."
                />
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitButton,
                    ...(isSubmitting && styles.submitButtonDisabled)
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={styles.buttonSpinner}></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <Edit size={16} style={{marginRight: 6}} />
                      Update Batch
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedBatch && (
        <div style={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Batch Status</h2>
              <button onClick={() => setShowStatusModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} style={styles.modalContent}>
              <div style={styles.formGroup}>
                <label style={styles.label}>Batch Number</label>
                <input
                  type="text"
                  value={selectedBatch.batchNumber}
                  style={{...styles.input, background: '#f9fafb'}}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Crop</label>
                <input
                  type="text"
                  value={selectedBatch.crop?.name || ''}
                  style={{...styles.input, background: '#f9fafb'}}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Total Quantity</label>
                <input
                  type="text"
                  value={`${selectedBatch.quantity} ${selectedBatch.unit}`}
                  style={{...styles.input, background: '#f9fafb'}}
                  disabled
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Available Quantity *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={selectedBatch.quantity}
                  value={statusFormData.availableQuantity}
                  onChange={(e) => setStatusFormData({...statusFormData, availableQuantity: e.target.value})}
                  style={styles.input}
                  required
                />
                <small style={{color: '#6b7280', fontSize: '12px'}}>
                  Maximum: {selectedBatch.quantity} {selectedBatch.unit}
                </small>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Status *</label>
                <select
                  value={statusFormData.status}
                  onChange={(e) => setStatusFormData({...statusFormData, status: e.target.value})}
                  style={styles.input}
                  required
                >
                  {Object.entries(batchStatuses).map(([value, config]) => (
                    <option key={value} value={value}>
                      {config.label}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.modalActions}>
                <button 
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  style={styles.cancelButton}
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitButton,
                    ...(isSubmitting && styles.submitButtonDisabled)
                  }}
                >
                  {isSubmitting ? (
                    <>
                      <div style={styles.buttonSpinner}></div>
                      Updating...
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} style={{marginRight: 6}} />
                      Update Status
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedBatch && (
        <div style={styles.modalOverlay} onClick={() => setShowQRModal(false)}>
          <div style={styles.qrModal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Batch QR Code</h2>
              <button onClick={() => setShowQRModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.qrContent}>
              <div style={styles.qrInfo}>
                <h4 style={styles.qrBatchNumber}>{selectedBatch.batchNumber}</h4>
                <StatusBadge status={selectedBatch.status} />
                <p style={styles.qrCropName}>{selectedBatch.crop?.name}</p>
                <p style={styles.qrDetails}>
                  {selectedBatch.availableQuantity}/{selectedBatch.quantity} {selectedBatch.unit} • ₹{selectedBatch.price}
                </p>
              </div>
              
              <QRCodeCanvas
                id="batch-qr-canvas"
                value={JSON.stringify({
                  batchId: selectedBatch.batchId,
                  batchNumber: selectedBatch.batchNumber,
                  crop: selectedBatch.crop?.name,
                  harvestDate: selectedBatch.harvestDate,
                  quantity: selectedBatch.quantity,
                  availableQuantity: selectedBatch.availableQuantity,
                  unit: selectedBatch.unit,
                  price: selectedBatch.price,
                  status: selectedBatch.status
                })}
                size={200}
                level="H"
                includeMargin={true}
              />
              
              <button onClick={handleDownloadQR} style={styles.downloadButton}>
                <Download size={16} style={{marginRight: 6}} />
                Download QR Code
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  tabContentInner: {
    padding: '24px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #147a48',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280'
  },
  successMessage: {
    padding: '16px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '20px'
  },
  errorMessage: {
    padding: '16px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    marginBottom: '20px'
  },
  actionBar: {
    marginBottom: '24px'
  },
  searchFilterContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    gap: '16px',
    flexWrap: 'wrap'
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 12px',
    flex: '1',
    minWidth: '300px'
  },
  batchBadges: {
    display: 'flex',
    gap: '8px',
    marginTop: '4px'
  },
  
  roleBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    width: '100%'
  },
  filterButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  filterButton: {
    padding: '10px 16px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    position: 'relative',
    transition: 'all 0.2s ease'
  },
  filterButtonActive: {
    background: '#147a48',
    color: 'white',
    borderColor: '#147a48'
  },
  resetButton: {
    padding: '10px 16px',
    background: '#fef3f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },
  addButton: {
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(20, 122, 72, 0.2)'
  },
  activeDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '6px',
    height: '6px',
    background: '#147a48',
    borderRadius: '50%'
  },
  advancedFilters: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '16px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px'
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column'
  },
  filterTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    background: 'white'
  },
  dateRangeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dateInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    flex: '1'
  },
  dateSeparator: {
    fontSize: '12px',
    color: '#6b7280'
  },
  sortContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  sortSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    background: 'white',
    flex: '1'
  },
  sortOrderButton: {
    padding: '8px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsInfo: {
    textAlign: 'right',
    marginBottom: '16px'
  },
  resultsText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  batchesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '24px'
  },
  batchCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    ':hover': {
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      transform: 'translateY(-2px)'
    }
  },
  batchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  batchNumber: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  batchCrop: {
    background: '#f0fdf4',
    color: '#147a48',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  batchDetails: {
    marginBottom: '16px'
  },
  batchDetail: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500',
    marginRight: '8px',
    minWidth: '100px'
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 'auto'
  },
  storageInfo: {
    marginTop: '12px',
    padding: '8px',
    background: '#f9fafb',
    borderRadius: '6px'
  },
  storageLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    marginRight: '8px'
  },
  storageValue: {
    fontSize: '13px',
    color: '#374151'
  },
  batchActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px'
  },
  editButton: {
    padding: '8px 12px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    color: '#1d4ed8',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  statusButton: {
    padding: '8px 12px',
    background: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '6px',
    color: '#d97706',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  qrButton: {
    padding: '8px 12px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    color: '#147a48',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  deleteButton: {
    padding: '8px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '4px'
  },
  emptyState: {
    background: 'white',
    padding: '80px 20px',
    textAlign: 'center',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb'
  },
  emptyIcon: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  emptyTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  emptyText: {
    color: '#6b7280',
    margin: '0 0 24px 0',
    fontSize: '14px'
  },
  emptyButton: {
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s ease'
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
    borderRadius: '12px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  qrModal: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  modalHeader: {
    borderRadius:'12px 12px 0 0',
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    padding: '20px 24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: 'white'
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
    ':hover': {
      background: 'rgba(255, 255, 255, 0.1)'
    }
  },
  modalContent: {
    padding: '24px'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: '#147a48',
      boxShadow: '0 0 0 3px rgba(20, 122, 72, 0.1)'
    }
  },
  textarea: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '80px',
    outline: 'none',
    boxSizing: 'border-box',
    ':focus': {
      borderColor: '#147a48',
      boxShadow: '0 0 0 3px rgba(20, 122, 72, 0.1)'
    }
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    ':hover': {
      background: '#f3f4f6'
    }
  },
  submitButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(20, 122, 72, 0.3)'
    }
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    transform: 'none',
    boxShadow: 'none',
    ':hover': {
      transform: 'none',
      boxShadow: 'none'
    }
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid white',
    borderTop: '2px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
  },
  qrContent: {
    padding: '32px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px'
  },
  qrInfo: {
    textAlign: 'center'
  },
  qrBatchNumber: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  qrCropName: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0'
  },
  qrDetails: {
    fontSize: '12px',
    color: '#374151',
    margin: 0
  },
  downloadButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    ':hover': {
      transform: 'translateY(-1px)',
      boxShadow: '0 4px 8px rgba(20, 122, 72, 0.3)'
    }
  }
};

export default CreateBatches;