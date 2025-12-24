import React, { useState, useEffect } from 'react';
import { 
  Plus, Eye, Trash2, QrCode, Search, Filter, 
  ArrowUp, ArrowDown, X, Calendar, Package, TrendingUp, Download, Edit,
  CheckCircle, Clock, AlertCircle, Ban, ShoppingCart, Receipt
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

const CreateBatchesTab = () => {
  const [batches, setBatches] = useState([]);
  const [filteredBatches, setFilteredBatches] = useState([]);
  const [availableTransactions, setAvailableTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [sortBy, setSortBy] = useState('harvestDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    batchNumber: '',
    harvestDate: '',
    quantity: '',
    availableQuantity: '',
    unit: 'kg',
    storageConditions: '',
    price: '',
    pricePerUnit: '',
    cropName: '',
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

  // Get auth token and user info
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token.replace('Bearer ', '');
  };

  const getRetailerId = () => {
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found');
    }
    return parseInt(userId);
  };

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
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorData.error || errorText;
          } catch {
            errorMessage = errorText;
          }
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

  // Fetch retailer's batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const retailerId = getRetailerId();

      // Fetch batches created by this retailer using the standard endpoint
      const response = await fetch(`${BASE_URL}/batches/user/${retailerId}`, {
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

  // Fetch available transactions (purchases from distributors that are paid and delivered)
  const fetchAvailableTransactions = async () => {
    try {
      const retailerId = getRetailerId();

      // Fetch transactions where retailer is the receiver (purchases from distributors)
      const response = await fetch(`${BASE_URL}/transactions/to/${retailerId}`, {
        headers: getHeaders()
      });

      if (response.ok) {
        const allTransactions = await response.json();
        
        // Filter transactions that are delivered and paid, and haven't been converted to batches
        const availableTxns = allTransactions.filter(t => 
          t.deliveryStatus === 'DELIVERED' && 
          t.paymentStatus === 'PAID' &&
          t.quantity > 0 // Only transactions with remaining quantity
        );
        
        setAvailableTransactions(availableTxns);
      } else {
        await handleApiError(response);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setAvailableTransactions([]);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchBatches();
    fetchAvailableTransactions();
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

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(batch => batch.status === statusFilter);
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(batch => 
        batch.harvestDate && new Date(batch.harvestDate) >= new Date(dateRange.start)
      );
    }
    if (dateRange.end) {
      filtered = filtered.filter(batch => 
        batch.harvestDate && new Date(batch.harvestDate) <= new Date(dateRange.end + 'T23:59:59')
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
  }, [batches, searchTerm, statusFilter, dateRange, sortBy, sortOrder]);

  // Open create batch modal with available transactions
  const handleOpenCreateBatch = () => {
    if (availableTransactions.length === 0) {
      setError('No available transactions found. Please purchase crops from distributors first.');
      return;
    }
    setShowCreateBatchModal(true);
  };

  // Select transaction for batch creation - UPDATED with price per kg calculation
  const handleSelectTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    
    // Pre-fill form with transaction data
    const cropName = transaction.batch?.crop?.name || 'Product';
    const cropId = transaction.batch?.crop?.cropId || '';
    const availableQty = transaction.quantity;
    
    // Calculate suggested price per kg (add 20% margin to purchase price per kg)
    const purchasePricePerKg = (transaction.totalAmount || 0) / availableQty;
    const suggestedPricePerKg = (purchasePricePerKg * 1.2).toFixed(2);
    
    setFormData({
      batchNumber: generateBatchNumber(),
      harvestDate: new Date().toISOString().split('T')[0],
      quantity: availableQty.toString(),
      availableQuantity: availableQty.toString(),
      unit: 'kg',
      storageConditions: '',
      price: '', // Will be auto-calculated
      pricePerUnit: suggestedPricePerKg, // User enters price per kg
      cropName: cropName,
      cropId: cropId,
      status: 'AVAILABLE'
    });
  };

  // Auto-calculate total price when price per unit OR available quantity changes
  useEffect(() => {
    if (formData.pricePerUnit && formData.availableQuantity) {
      const pricePerUnit = parseFloat(formData.pricePerUnit);
      const availableQuantity = parseFloat(formData.availableQuantity);
      if (pricePerUnit > 0 && availableQuantity > 0) {
        const totalPrice = (pricePerUnit * availableQuantity).toFixed(2);
        setFormData(prev => ({
          ...prev,
          price: totalPrice
        }));
      }
    }
  }, [formData.pricePerUnit, formData.availableQuantity]);

  // Also auto-calculate when quantity changes (for edit scenarios)
  useEffect(() => {
    if (formData.pricePerUnit && formData.quantity && !formData.availableQuantity) {
      const pricePerUnit = parseFloat(formData.pricePerUnit);
      const quantity = parseFloat(formData.quantity);
      if (pricePerUnit > 0 && quantity > 0) {
        const totalPrice = (pricePerUnit * quantity).toFixed(2);
        setFormData(prev => ({
          ...prev,
          price: totalPrice,
          availableQuantity: quantity.toString()
        }));
      }
    }
  }, [formData.pricePerUnit, formData.quantity]);

  // Create batch from transaction - UPDATED with proper validation
  const handleCreateBatchFromTransaction = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const retailerId = getRetailerId();

      if (!formData.cropName) throw new Error('Please select a crop');
      if (!selectedTransaction) throw new Error('Please select a transaction');
      if (!formData.cropId) throw new Error('Crop ID is required');

      // Validate form data
      if (!formData.batchNumber?.trim()) throw new Error('Batch number is required');
      if (!formData.harvestDate) throw new Error('Harvest date is required');
      
      // FIXED: Proper quantity validation
      const quantity = parseFloat(formData.quantity);
      const availableQuantity = parseFloat(formData.availableQuantity);
      const pricePerUnit = parseFloat(formData.pricePerUnit);
      const price = parseFloat(formData.price);
      
      if (!quantity || quantity <= 0) throw new Error('Valid quantity is required');
      if (isNaN(availableQuantity) || availableQuantity < 0) throw new Error('Valid available quantity is required');
      if (availableQuantity > quantity) throw new Error('Available quantity cannot exceed total quantity');
      if (!pricePerUnit || pricePerUnit <= 0) throw new Error('Valid price per unit is required');
      if (!price || price <= 0) throw new Error('Valid price is required');

      // Prepare batch data for retailer
      const batchData = {
        batchNumber: formData.batchNumber.trim(),
        harvestDate: formData.harvestDate + 'T00:00:00',
        quantity: quantity,
        availableQuantity: availableQuantity,
        unit: formData.unit,
        storageConditions: formData.storageConditions?.trim() || '',
        price: price,
        pricePerUnit: pricePerUnit,
        status: formData.status,
        createdByRole: 'RETAILER',
        crop: {
          cropId: parseInt(formData.cropId),
          name: formData.cropName.trim()
        }
      };

      // Use the standard batch creation endpoint with cropId
      const response = await fetch(`${BASE_URL}/batches/retailer/${retailerId}/crop/${formData.cropId}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(batchData)
      });

      await handleApiError(response);
      
      setMessage('Batch created successfully from transaction!');
      setShowCreateBatchModal(false);
      resetFormData();
      setSelectedTransaction(null);
      fetchBatches();
      fetchAvailableTransactions(); // Refresh transactions
    } catch (err) {
      console.error('Error creating batch:', err);
      setError(err.message || 'Failed to create batch. Please check the data format.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update batch - UPDATED with proper validation
  const handleUpdateBatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedBatch) throw new Error('No batch selected for update');

      // Validate form data
      if (!formData.batchNumber?.trim()) throw new Error('Batch number is required');
      if (!formData.harvestDate) throw new Error('Harvest date is required');
      
      // FIXED: Proper quantity validation
      const quantity = parseFloat(formData.quantity);
      const availableQuantity = parseFloat(formData.availableQuantity);
      const pricePerUnit = parseFloat(formData.pricePerUnit);
      const price = parseFloat(formData.price);
      
      if (!quantity || quantity <= 0) throw new Error('Valid quantity is required');
      if (isNaN(availableQuantity) || availableQuantity < 0) throw new Error('Valid available quantity is required');
      if (availableQuantity > quantity) throw new Error('Available quantity cannot exceed total quantity');
      if (!pricePerUnit || pricePerUnit <= 0) throw new Error('Valid price per unit is required');
      if (!price || price <= 0) throw new Error('Valid price is required');

      const updateData = {
        batchNumber: formData.batchNumber.trim(),
        harvestDate: formData.harvestDate + 'T00:00:00',
        quantity: quantity,
        availableQuantity: availableQuantity,
        unit: formData.unit,
        storageConditions: formData.storageConditions?.trim() || '',
        price: price,
        pricePerUnit: pricePerUnit,
        status: formData.status
      };

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

  // Update batch status
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
      pricePerUnit: '',
      cropName: '',
      cropId: '',
      status: 'AVAILABLE'
    });
  };

  // Delete batch
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

  // Edit batch - UPDATED with cropId
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
      pricePerUnit: batch.pricePerUnit || '',
      cropName: batch.crop?.name || '',
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
    return `RETAIL-BATCH-${timestamp}-${random}`;
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
                setStatusFilter('all');
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
              onClick={handleOpenCreateBatch}
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
            <Package size={48} style={{color: '#d46a00'}} />
          </div>
          <h3 style={styles.emptyTitle}>
            {batches.length === 0 ? 'No batches yet' : 'No batches found'}
          </h3>
          <p style={styles.emptyText}>
            {batches.length === 0 
              ? 'Start by creating your first batch from available transactions'
              : 'Try adjusting your search or filters'
            }
          </p>
          <button 
            onClick={handleOpenCreateBatch}
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
                  <StatusBadge status={batch.status} />
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
                  <span style={styles.detailLabel}>Price per {batch.unit}:</span>
                  <span style={styles.detailValue}>₹{batch.pricePerUnit}</span>
                </div>

                <div style={styles.batchDetail}>
                  <TrendingUp size={14} style={{color: '#6b7280', marginRight: 8}} />
                  <span style={styles.detailLabel}>Total Price:</span>
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
                {/* <button 
                  onClick={() => handleStatusUpdate(batch)}
                  style={styles.statusButton}
                >
                  <CheckCircle size={14} style={{marginRight: 4}} />
                  Status
                </button> */}
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

      {/* Create Batch Modal */}
      {showCreateBatchModal && (
        <div style={styles.modalOverlay} onClick={() => setShowCreateBatchModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Create New Batch from Transaction</h2>
              <button onClick={() => setShowCreateBatchModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateBatchFromTransaction} style={styles.modalContent}>
              {/* Available Transactions Section */}
              <div style={styles.transactionsSection}>
                <h4 style={styles.sectionTitle}>
                  <Receipt size={16} style={{marginRight: 8}} />
                  Select Source Transaction
                </h4>
                <p style={styles.sectionSubtitle}>
                  Choose a paid and delivered transaction to create your batch from
                </p>
                
                <div style={styles.transactionsGrid}>
                  {availableTransactions.length === 0 ? (
                    <div style={styles.emptyTransactionState}>
                      <ShoppingCart size={32} style={{color: '#6b7280'}} />
                      <p style={styles.emptyTransactionText}>
                        No available transactions found. Please purchase crops from distributors first.
                      </p>
                    </div>
                  ) : (
                    availableTransactions.map((transaction) => (
                      <div 
                        key={transaction.transactionId} 
                        style={{
                          ...styles.transactionCard,
                          ...(selectedTransaction?.transactionId === transaction.transactionId && styles.selectedTransaction)
                        }}
                        onClick={() => handleSelectTransaction(transaction)}
                      >
                        <div style={styles.transactionHeader}>
                          <div>
                            <h5 style={styles.transactionId}>TXN-{transaction.transactionId}</h5>
                            <div style={styles.transactionBadges}>
                              <span style={styles.paidBadge}>Paid</span>
                              <span style={styles.deliveredBadge}>Delivered</span>
                            </div>
                          </div>
                          <span style={styles.transactionDate}>
                            {new Date(transaction.transactionDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        <div style={styles.transactionDetails}>
                          <div style={styles.transactionDetail}>
                            <span style={styles.detailLabel}>Crop:</span>
                            <span style={styles.detailValue}>{transaction.batch?.crop?.name}</span>
                          </div>
                          <div style={styles.transactionDetail}>
                            <span style={styles.detailLabel}>Quantity:</span>
                            <span style={styles.detailValue}>{transaction.quantity} kg</span>
                          </div>
                          <div style={styles.transactionDetail}>
                            <span style={styles.detailLabel}>From Distributor:</span>
                            <span style={styles.detailValue}>{transaction.fromUser?.name}</span>
                          </div>
                          <div style={styles.transactionDetail}>
                            <span style={styles.detailLabel}>Purchase Price:</span>
                            <span style={styles.detailValue}>₹{transaction.totalAmount?.toFixed(2)}</span>
                          </div>
                          <div style={styles.transactionDetail}>
                            <span style={styles.detailLabel}>Purchase Price per kg:</span>
                            <span style={styles.detailValue}>₹{((transaction.totalAmount || 0) / transaction.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Batch Form Section */}
              {selectedTransaction && (
                <>
                  <div style={styles.formDivider}></div>
                  
                  <div style={styles.formGrid}>
                    <div style={styles.formGroup}>
                      <label style={styles.label}>Batch Number *</label>
                      <input
                        type="text"
                        value={formData.batchNumber}
                        onChange={(e) => setFormData({...formData, batchNumber: e.target.value})}
                        style={styles.input}
                        required
                        placeholder="e.g., RETAIL-BATCH-001"
                      />
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Crop *</label>
                      <input
                        type="text"
                        value={selectedTransaction.batch?.crop?.name || ''}
                        style={{...styles.input, background: '#f9fafb'}}
                        disabled
                      />
                      <small style={{color: '#6b7280', fontSize: '12px'}}>
                        Crop is automatically selected from the transaction
                      </small>
                    </div>

                    {/* <div style={styles.formGroup}>
                      <label style={styles.label}>Crop ID *</label>
                      <input
                        type="text"
                        value={formData.cropId || ''}
                        style={{...styles.input, background: '#f9fafb'}}
                        disabled
                      />
                      <small style={{color: '#6b7280', fontSize: '12px'}}>
                        Crop ID: {formData.cropId}
                      </small>
                    </div> */}

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
                      <label style={styles.label}>Total Quantity (kg) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={selectedTransaction.quantity}
                        value={formData.quantity}
                        onChange={(e) => {
                          const newQuantity = e.target.value;
                          setFormData(prev => ({
                            ...prev,
                            quantity: newQuantity,
                            availableQuantity: newQuantity // Auto-set available quantity to total
                          }));
                        }}
                        style={styles.input}
                        required
                      />
                      <small style={{color: '#6b7280', fontSize: '12px'}}>
                        Maximum: {selectedTransaction.quantity} kg (from transaction)
                      </small>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Available Quantity (kg) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={formData.quantity}
                        value={formData.availableQuantity}
                        onChange={(e) => setFormData({...formData, availableQuantity: e.target.value})}
                        style={styles.input}
                        required
                      />
                      <small style={{color: '#6b7280', fontSize: '12px'}}>
                        Cannot exceed total quantity
                      </small>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Price per kg (₹) *</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.pricePerUnit}
                        onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})}
                        style={styles.input}
                        required
                        placeholder="Enter price per kilogram"
                      />
                      <small style={{color: '#6b7280', fontSize: '12px'}}>
                        Suggested: ₹{((selectedTransaction.totalAmount / selectedTransaction.quantity) * 1.2).toFixed(2)} (20% margin)
                      </small>
                    </div>

                    <div style={styles.formGroup}>
                      <label style={styles.label}>Total Price (₹)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={formData.price}
                        style={{...styles.input, background: '#f9fafb'}}
                        disabled
                        placeholder="Auto-calculated"
                      />
                      <small style={{color: '#6b7280', fontSize: '12px'}}>
                        Auto-calculated: (Price per kg × Available Quantity)
                      </small>
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

                    <div style={styles.formGroupFull}>
                      <label style={styles.label}>Storage Conditions</label>
                      <textarea
                        value={formData.storageConditions}
                        onChange={(e) => setFormData({...formData, storageConditions: e.target.value})}
                        style={styles.textarea}
                        rows="3"
                        placeholder="Describe storage requirements (temperature, humidity, etc.)"
                      />
                    </div>
                  </div>

                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      onClick={() => setShowCreateBatchModal(false)}
                      style={styles.cancelButton}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      style={styles.submitButton}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create Batch'}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Edit Batch Modal */}
      {showEditModal && (
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
                    value={formData.cropName}
                    style={{...styles.input, background: '#f9fafb'}}
                    disabled
                    placeholder="Crop cannot be changed"
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Crop ID</label>
                  <input
                    type="text"
                    value={formData.cropId || ''}
                    style={{...styles.input, background: '#f9fafb'}}
                    disabled
                  />
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
                    onChange={(e) => {
                      const newQuantity = e.target.value;
                      setFormData(prev => ({
                        ...prev,
                        quantity: newQuantity
                      }));
                    }}
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
                    max={formData.quantity}
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
                    <option value="g">Grams (g)</option>
                    <option value="tons">Tons</option>
                    <option value="quintals">Quintals</option>
                  </select>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Price per Unit (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.pricePerUnit}
                    onChange={(e) => setFormData({...formData, pricePerUnit: e.target.value})}
                    style={styles.input}
                    required
                  />
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Total Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.price}
                    style={{...styles.input, background: '#f9fafb'}}
                    disabled
                    placeholder="Auto-calculated"
                  />
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    Auto-calculated: (Price per unit × Available Quantity)
                  </small>
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

                <div style={styles.formGroupFull}>
                  <label style={styles.label}>Storage Conditions</label>
                  <textarea
                    value={formData.storageConditions}
                    onChange={(e) => setFormData({...formData, storageConditions: e.target.value})}
                    style={styles.textarea}
                    rows="3"
                    placeholder="Describe storage requirements..."
                  />
                </div>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && (
        <div style={styles.modalOverlay} onClick={() => setShowStatusModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Batch Status</h2>
              <button onClick={() => setShowStatusModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateStatus} style={styles.modalContent}>
              <div style={styles.batchInfo}>
                <h4 style={styles.infoTitle}>{selectedBatch?.batchNumber}</h4>
                <p style={styles.infoText}>{selectedBatch?.crop?.name}</p>
                <div style={styles.quantityInfo}>
                  <span>Total Quantity: {selectedBatch?.quantity} {selectedBatch?.unit}</span>
                </div>
              </div>

              <div style={styles.formGrid}>
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

                <div style={styles.formGroup}>
                  <label style={styles.label}>Available Quantity *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={selectedBatch?.quantity}
                    value={statusFormData.availableQuantity}
                    onChange={(e) => setStatusFormData({...statusFormData, availableQuantity: e.target.value})}
                    style={styles.input}
                    required
                  />
                  <small style={{color: '#6b7280', fontSize: '12px'}}>
                    Maximum: {selectedBatch?.quantity} {selectedBatch?.unit}
                  </small>
                </div>
              </div>

              <div style={styles.statusHelp}>
                <AlertCircle size={16} style={{color: '#f59e0b', marginRight: 8}} />
                <span style={styles.helpText}>
                  Updating available quantity helps track inventory. Set to 0 when batch is completely sold.
                </span>
              </div>

              <div style={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowStatusModal(false)}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={styles.submitButton}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Updating...' : 'Update Status'}
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
                <p style={styles.qrCropName}>{selectedBatch.crop?.name}</p>
                <div style={styles.qrDetails}>
                  <span>Quantity: {selectedBatch.quantity} {selectedBatch.unit}</span>
                  <span>Available: {selectedBatch.availableQuantity} {selectedBatch.unit}</span>
                  <span>Price per {selectedBatch.unit}: ₹{selectedBatch.pricePerUnit}</span>
                  <span>Total Price: ₹{selectedBatch.price}</span>
                </div>
              </div>

              <div style={styles.qrCodeContainer}>
                <QRCodeCanvas
                  id="batch-qr-canvas"
                  value={JSON.stringify({
                    batchId: selectedBatch.batchId,
                    batchNumber: selectedBatch.batchNumber,
                    crop: selectedBatch.crop?.name,
                    quantity: selectedBatch.quantity,
                    unit: selectedBatch.unit,
                    pricePerUnit: selectedBatch.pricePerUnit,
                    totalPrice: selectedBatch.price,
                    type: 'RETAILER_BATCH'
                  })}
                  size={200}
                  level="H"
                  includeMargin
                  style={styles.qrCode}
                />
              </div>

              <div style={styles.qrActions}>
                <button 
                  onClick={handleDownloadQR}
                  style={styles.downloadButton}
                >
                  <Download size={16} style={{marginRight: 8}} />
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Styles object with retailer color scheme
const styles = {
  tabContentInner: {
    padding: '24px',
    maxWidth: '1450px',
    margin: '0 auto'
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
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #d46a00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  loadingText: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    color: '#166534',
    marginBottom: '20px',
    fontSize: '14px'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    color: '#dc2626',
    marginBottom: '20px',
    fontSize: '14px'
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
    flex: '1',
    minWidth: '300px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    padding: '8px 12px'
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    width: '100%',
    fontSize: '14px',
    color: '#374151'
  },
  filterButtons: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  filterButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative'
  },
  filterButtonActive: {
    backgroundColor: '#d46a00',
    color: 'white',
    borderColor: '#d46a00'
  },
  activeDot: {
    position: 'absolute',
    top: '4px',
    right: '4px',
    width: '6px',
    height: '6px',
    backgroundColor: '#ef4444',
    borderRadius: '50%'
  },
  resetButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#6b7280',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  addButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#d46a00',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  advancedFilters: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    padding: '20px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '16px'
  },
  filterSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  filterTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: 0
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white'
  },
  dateRangeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  dateInput: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    flex: 1
  },
  dateSeparator: {
    fontSize: '14px',
    color: '#6b7280',
    padding: '0 4px'
  },
  sortContainer: {
    display: 'flex',
    gap: '8px'
  },
  sortSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: 'white',
    flex: 1
  },
  sortOrderButton: {
    padding: '8px 12px',
    backgroundColor: '#d46a00',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  resultsInfo: {
    padding: '12px 0',
    borderTop: '1px solid #e5e7eb'
  },
  resultsText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  batchesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '20px'
  },
  batchCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    transition: 'all 0.2s',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  batchHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  batchNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  statusBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 8px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500'
  },
  batchCrop: {
    fontSize: '14px',
    color: '#d46a00',
    fontWeight: '500',
    backgroundColor: '#fef6e9',
    padding: '4px 8px',
    borderRadius: '6px'
  },
  batchDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    marginBottom: '20px'
  },
  batchDetail: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  },
  detailLabel: {
    color: '#6b7280',
    marginRight: '8px',
    minWidth: '100px'
  },
  detailValue: {
    color: '#374151',
    fontWeight: '500'
  },
  storageInfo: {
    padding: '8px',
    backgroundColor: '#f9fafb',
    borderRadius: '6px',
    fontSize: '13px'
  },
  storageLabel: {
    color: '#6b7280',
    marginRight: '8px'
  },
  storageValue: {
    color: '#374151'
  },
  batchActions: {
    display: 'flex',
    gap: '8px',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '16px'
  },
  editButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#92400e',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  qrButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#dbeafe',
    border: '1px solid #3b82f6',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#1e40af',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  statusButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#f0fdf4',
    border: '1px solid #10b981',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#047857',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  deleteButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '6px 12px',
    backgroundColor: '#fef2f2',
    border: '1px solid #ef4444',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#dc2626',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  emptyIcon: {
    marginBottom: '16px'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px 0',
    maxWidth: '400px'
  },
  emptyButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#d46a00',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  qrModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column'
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '4px',
    borderRadius: '4px'
  },
  modalContent: {
    padding: '24px',
    overflow: 'auto',
    flex: 1
  },
  transactionsSection: {
    marginBottom: '24px'
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  sectionSubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0'
  },
  transactionsGrid: {
    display: 'grid',
    gap: '12px',
    maxHeight: '300px',
    overflow: 'auto'
  },
  transactionCard: {
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  selectedTransaction: {
    borderColor: '#d46a00',
    backgroundColor: '#fef6e9'
  },
  transactionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  transactionId: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  transactionBadges: {
    display: 'flex',
    gap: '6px'
  },
  paidBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: '#dcfce7',
    color: '#166534',
    borderRadius: '12px'
  },
  deliveredBadge: {
    fontSize: '11px',
    padding: '2px 6px',
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    borderRadius: '12px'
  },
  transactionDate: {
    fontSize: '12px',
    color: '#6b7280'
  },
  transactionDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  transactionDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px'
  },
  emptyTransactionState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    textAlign: 'center'
  },
  emptyTransactionText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '16px 0 0 0'
  },
  formDivider: {
    height: '1px',
    backgroundColor: '#e5e7eb',
    margin: '24px 0'
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  formGroupFull: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    transition: 'border-color 0.2s'
  },
  textarea: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    resize: 'vertical',
    fontFamily: 'inherit'
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '24px',
    borderTop: '1px solid #e5e7eb',
    marginTop: '24px'
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: 'white',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer',
    transition: 'all 0.2s'
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#d46a00',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  batchInfo: {
    padding: '16px',
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 4px 0'
  },
  infoText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 8px 0'
  },
  quantityInfo: {
    fontSize: '14px',
    color: '#374151'
  },
  statusHelp: {
    display: 'flex',
    alignItems: 'flex-start',
    padding: '12px',
    backgroundColor: '#fffbeb',
    border: '1px solid #fef3c7',
    borderRadius: '6px',
    marginTop: '16px'
  },
  helpText: {
    fontSize: '13px',
    color: '#92400e',
    flex: 1
  },
  qrContent: {
    padding: '24px',
    textAlign: 'center'
  },
  qrInfo: {
    marginBottom: '24px'
  },
  qrBatchNumber: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
    margin: '0 0 8px 0'
  },
  qrCropName: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 12px 0'
  },
  qrDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    fontSize: '13px',
    color: '#374151'
  },
  qrCodeContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  qrCode: {
    borderRadius: '8px'
  },
  qrActions: {
    display: 'flex',
    justifyContent: 'center'
  },
  downloadButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 20px',
    backgroundColor: '#d46a00',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
};

// Add CSS animation for spinner
const spinnerStyle = `
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.innerText = spinnerStyle;
document.head.appendChild(styleSheet);

export default CreateBatchesTab;