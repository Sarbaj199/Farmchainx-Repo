import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, ArrowUp, ArrowDown, X, 
  Calendar, Package, TrendingUp, Truck, CheckCircle, 
  Clock, AlertCircle, Edit, Eye, Download, RefreshCw
} from 'lucide-react';

const FarmerTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Filter and sort states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryStatusFilter, setDeliveryStatusFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const BASE_URL = 'http://localhost:8080';

  // Get auth token and farmer ID - IMPROVED VERSION
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    return token;
  };

  const getFarmerId = () => {
    // Try multiple possible storage locations for farmer ID
    const farmerId = localStorage.getItem('id') || 
                     localStorage.getItem('userId') || 
                     localStorage.getItem('user_id');
    
    if (!farmerId) {
      throw new Error('Farmer ID not found. Please login again.');
    }
    
    return farmerId;
  };

  // Fetch farmer's transactions - IMPROVED VERSION
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      const farmerId = getFarmerId();

      console.log('🔐 Fetching transactions for farmer ID:', farmerId);
      console.log('📝 Auth token available:', !!token);

      // Try multiple endpoints to get farmer transactions
      const endpoints = [
        `${BASE_URL}/transactions/farmer/${farmerId}`,
        `${BASE_URL}/transactions/from/${farmerId}`,
        `${BASE_URL}/transactions/my-transactions`
      ];

      let transactionsData = [];
      let lastError = null;

      // Try each endpoint until one works
      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            transactionsData = await response.json();
            console.log(`✅ Success with endpoint: ${endpoint}`, transactionsData);
            break;
          } else {
            lastError = `Endpoint ${endpoint} failed with status: ${response.status}`;
            console.log(`❌ ${lastError}`);
          }
        } catch (err) {
          lastError = err.message;
          console.log(`❌ Error with endpoint ${endpoint}:`, err.message);
        }
      }

      if (!transactionsData || transactionsData.length === 0) {
        console.log('📭 No transactions found or empty response');
        setTransactions([]);
        return;
      }

      // Process and normalize transaction data
      const processedTransactions = transactionsData.map(transaction => ({
        ...transaction,
        // Ensure we have proper batch number
        batchNumber: getBatchNumber(transaction),
        // Ensure we have proper receiver info
        receiverName: getReceiverName(transaction),
        // Normalize status values
        status: transaction.status || 'PENDING',
        deliveryStatus: transaction.deliveryStatus || 'PENDING',
        paymentStatus: transaction.paymentStatus || 'PENDING'
      }));

      console.log('📊 Processed transactions:', processedTransactions);
      setTransactions(processedTransactions);
      
    } catch (err) {
      console.error('❌ Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions. Please try again.');
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Get batch number from transaction data - IMPROVED VERSION
  const getBatchNumber = (transaction) => {
    if (transaction.batch?.batchNumber) {
      return transaction.batch.batchNumber;
    }
    if (transaction.batch?.batchId) {
      return `BATCH-${transaction.batch.batchId}`;
    }
    if (transaction.batchId) {
      return `BATCH-${transaction.batchId}`;
    }
    if (transaction.batchNumber) {
      return transaction.batchNumber;
    }
    return 'N/A';
  };

  // Get receiver name from transaction data - IMPROVED VERSION
  const getReceiverName = (transaction) => {
    if (transaction.toUser?.username) {
      return transaction.toUser.username;
    }
    if (transaction.toUser?.name) {
      return transaction.toUser.name;
    }
    if (transaction.toUser?.companyName) {
      return transaction.toUser.companyName;
    }
    if (transaction.toUserId) {
      return `Distributor-${transaction.toUserId}`;
    }
    return 'Distributor';
  };

  // Filter and sort transactions - FIXED VERSION
  useEffect(() => {
    console.log('🔍 Applying filters...', {
      transactionsCount: transactions.length,
      searchTerm,
      statusFilter,
      deliveryStatusFilter,
      paymentStatusFilter,
      dateRange,
      sortBy,
      sortOrder
    });

    let filtered = [...transactions];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(transaction => {
        const batchNumber = getBatchNumber(transaction).toLowerCase();
        const receiverName = getReceiverName(transaction).toLowerCase();
        const remarks = (transaction.remarks || '').toLowerCase();
        const cropName = (transaction.batch?.crop?.name || '').toLowerCase();

        return (
          batchNumber.includes(searchLower) ||
          receiverName.includes(searchLower) ||
          remarks.includes(searchLower) ||
          cropName.includes(searchLower)
        );
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        (transaction.status || 'PENDING') === statusFilter
      );
    }

    // Apply delivery status filter
    if (deliveryStatusFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        (transaction.deliveryStatus || 'PENDING') === deliveryStatusFilter
      );
    }

    // Apply payment status filter
    if (paymentStatusFilter !== 'all') {
      filtered = filtered.filter(transaction => 
        (transaction.paymentStatus || 'PENDING') === paymentStatusFilter
      );
    }

    // Apply date range filter
    if (dateRange.start) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        const startDate = new Date(dateRange.start);
        return transactionDate >= startDate;
      });
    }
    if (dateRange.end) {
      filtered = filtered.filter(transaction => {
        const transactionDate = new Date(transaction.transactionDate);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include entire end day
        return transactionDate <= endDate;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'transactionDate':
          aValue = new Date(a.transactionDate);
          bValue = new Date(b.transactionDate);
          break;
        case 'quantity':
          aValue = a.quantity || 0;
          bValue = b.quantity || 0;
          break;
        case 'totalAmount':
          aValue = a.totalAmount || 0;
          bValue = b.totalAmount || 0;
          break;
        case 'batchNumber':
          aValue = getBatchNumber(a).toLowerCase();
          bValue = getBatchNumber(b).toLowerCase();
          break;
        case 'receiver':
          aValue = getReceiverName(a).toLowerCase();
          bValue = getReceiverName(b).toLowerCase();
          break;
        default:
          aValue = new Date(a.transactionDate);
          bValue = new Date(b.transactionDate);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
      } else {
        return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
      }
    });

    console.log('✅ Filtered results:', filtered.length);
    setFilteredTransactions(filtered);
  }, [transactions, searchTerm, statusFilter, deliveryStatusFilter, paymentStatusFilter, dateRange, sortBy, sortOrder]);

  // Update delivery status - FIXED VERSION with proper authentication
  const handleUpdateDeliveryStatus = async (deliveryStatus) => {
    if (!selectedTransaction) return;
    
    setIsSubmitting(true);
    setError('');
    try {
      const token = getAuthToken();
      
      console.log('🔄 Updating delivery status:', {
        transactionId: selectedTransaction.transactionId,
        deliveryStatus,
        token: token ? 'Present' : 'Missing'
      });

      // Create minimal update payload
      const updateData = {
        id: selectedTransaction.transactionId,
        deliveryStatus: deliveryStatus,
        status: selectedTransaction.status,
        paymentStatus: selectedTransaction.paymentStatus
      };

      // Try multiple endpoints for update
      const endpoints = [
        `${BASE_URL}/transactions/${selectedTransaction.transactionId}/status`,
        `${BASE_URL}/transactions/${selectedTransaction.transactionId}/delivery-status`,
        `${BASE_URL}/transactions/${selectedTransaction.transactionId}`
      ];

      let success = false;
      let lastError = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`🔄 Trying update endpoint: ${endpoint}`);
          const response = await fetch(endpoint, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(updateData)
          });

          if (response.ok) {
            const updatedTransaction = await response.json();
            console.log('Delivery status updated successfully:', updatedTransaction);
            setMessage(`Delivery status updated to ${deliveryStatus} successfully!`);
            success = true;
            break;
          } else {
            const errorText = await response.text();
            lastError = `Endpoint ${endpoint} failed: ${response.status} - ${errorText}`;
            console.log(`❌ ${lastError}`);
          }
        } catch (err) {
          lastError = err.message;
          console.log(`❌ Error with update endpoint ${endpoint}:`, err.message);
        }
      }

      if (!success) {
        throw new Error(lastError || 'Failed to update delivery status. Please check your permissions.');
      }

      setShowEditModal(false);
      setSelectedTransaction(null);
      fetchTransactions(); // Refresh the list
      
    } catch (err) {
      console.error('❌ Error updating delivery status:', err);
      
      // Provide user-friendly error messages
      if (err.message.includes('403') || err.message.includes('Permission')) {
        setError('🚫 Permission denied. You are not authorized to update this transaction.');
      } else if (err.message.includes('401')) {
        setError('🔐 Session expired. Please login again.');
      } else {
        setError(`❌ ${err.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status badge style
  const getStatusBadgeStyle = (status) => {
    const statusValue = status || 'PENDING';
    switch (statusValue) {
      case 'COMPLETED':
        return { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
      case 'IN_TRANSIT':
        return { background: '#fffbeb', color: '#92400e', border: '1px solid #fed7aa' };
      case 'INITIATED':
        return { background: '#eff6ff', color: '#1e40af', border: '1px solid #bfdbfe' };
      case 'CANCELLED':
        return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
      case 'PENDING':
        return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
      default:
        return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  // Get delivery status badge style
  const getDeliveryStatusBadgeStyle = (status) => {
    const statusValue = status || 'PENDING';
    switch (statusValue) {
      case 'DELIVERED':
        return { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
      case 'IN_TRANSIT':
        return { background: '#fffbeb', color: '#92400e', border: '1px solid #fed7aa' };
      case 'PENDING':
        return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
      default:
        return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  // Get payment status badge style
  const getPaymentStatusBadgeStyle = (status) => {
    const statusValue = status || 'PENDING';
    switch (statusValue) {
      case 'PAID':
        return { background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' };
      case 'PENDING':
        return { background: '#fffbeb', color: '#92400e', border: '1px solid #fed7aa' };
      case 'FAILED':
        return { background: '#fef2f2', color: '#991b1b', border: '1px solid #fecaca' };
      default:
        return { background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' };
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    const statusValue = status || 'PENDING';
    switch (statusValue) {
      case 'COMPLETED':
        return <CheckCircle size={14} />;
      case 'IN_TRANSIT':
        return <Truck size={14} />;
      case 'INITIATED':
        return <Clock size={14} />;
      case 'CANCELLED':
        return <AlertCircle size={14} />;
      default:
        return <Clock size={14} />;
    }
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDeliveryStatusFilter('all');
    setPaymentStatusFilter('all');
    setDateRange({ start: '', end: '' });
    setSortBy('transactionDate');
    setSortOrder('desc');
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

  // Add CSS for spinner animation
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // Fetch transactions on component mount
  useEffect(() => {
    fetchTransactions();
  }, []);

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <p style={styles.loadingText}>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Messages */}
      {message && (
        <div style={styles.successMessage}>
          <CheckCircle size={20} style={{marginRight: 8}} />
          <span>{message}</span>
          <button onClick={() => setMessage('')} style={styles.dismissButton}>
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div style={styles.errorMessage}>
          <AlertCircle size={20} style={{marginRight: 8}} />
          <span>{error}</span>
          <button onClick={() => setError('')} style={styles.dismissButton}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerTop}>
          <h1 style={styles.title}>Distributor Delivery Management</h1>
          {/* <button onClick={fetchTransactions} style={styles.refreshButton}>
            <RefreshCw size={20} />
            Refresh
          </button> */}
        </div>
        <p style={styles.subtitle}>Track and manage deliveries to distributors</p>
      </div>

      {/* Action Bar with Search and Filters */}
      <div style={styles.actionBar}>
        <div style={styles.searchFilterContainer}>
          <div style={styles.searchBox}>
            <Search size={20} style={{color: '#6b7280', marginRight: 8}} />
            <input
              type="text"
              placeholder="Search by batch number, receiver, crop, or remarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={styles.searchInput}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                style={styles.clearSearchButton}
              >
                <X size={16} />
              </button>
            )}
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
              onClick={clearAllFilters}
              style={styles.resetButton}
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={styles.advancedFilters}>
            {/* <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Transaction Status</h4>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Statuses</option>
                <option value="INITIATED">Initiated</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="PENDING">Pending</option>
              </select>
            </div> */}

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Delivery Status</h4>
              <select
                value={deliveryStatusFilter}
                onChange={(e) => setDeliveryStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Delivery Status</option>
                <option value="PENDING">Pending</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Payment Status</h4>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value)}
                style={styles.filterSelect}
              >
                <option value="all">All Payment Status</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="FAILED">Failed</option>
              </select>
            </div>

            {/* <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Transaction Date</h4>
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
            </div> */}

            <div style={styles.filterSection}>
              <h4 style={styles.filterTitle}>Sort By</h4>
              <div style={styles.sortContainer}>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={styles.sortSelect}
                >
                  <option value="transactionDate">Transaction Date</option>
                  <option value="quantity">Quantity</option>
                  <option value="totalAmount">Total Amount</option>
                  <option value="batchNumber">Batch Number</option>
                  <option value="receiver">Receiver</option>
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
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </span>
          {(searchTerm || statusFilter !== 'all' || deliveryStatusFilter !== 'all' || paymentStatusFilter !== 'all' || dateRange.start || dateRange.end) && (
            <span style={styles.filteredText}>(Filtered)</span>
          )}
        </div>
      </div>

      {/* Transactions Table */}
      {filteredTransactions.length === 0 ? (
  <div style={styles.emptyStateContainer}>
    <div style={styles.emptyState}>
      <div style={styles.emptyIcon}>
        <Package size={48} style={{color: '#147a48'}} />
      </div>
      <h3 style={styles.emptyTitle}>
        {transactions.length === 0 ? 'No transactions yet' : 'No transactions found'}
      </h3>
      <p style={styles.emptyText}>
        {transactions.length === 0 
          ? 'Your transactions with distributors will appear here'
          : 'Try adjusting your search or filters'
        }
      </p>
      {transactions.length === 0 ? (
        <button onClick={fetchTransactions} style={styles.retryButton}>
          <RefreshCw size={16} style={{marginRight: 8}} />
          Refresh Transactions
        </button>
      ) : (
        <button onClick={clearAllFilters} style={styles.retryButton}>
          Clear All Filters
        </button>
      )}
    </div>
  </div>
      ) : (
        <div style={styles.tableContainer}>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead style={styles.tableHeader}>
                <tr>
                  <th style={styles.tableHeaderCell}>Batch Number</th>
                  <th style={styles.tableHeaderCell}>Receiver</th>
                  <th style={styles.tableHeaderCell}>Date</th>
                  <th style={styles.tableHeaderCell}>Quantity</th>
                  <th style={styles.tableHeaderCell}>Price</th>
                  <th style={styles.tableHeaderCell}>Total</th>
                  <th style={styles.tableHeaderCell}>Delivery</th>
                  <th style={styles.tableHeaderCell}>Payment</th>
                  <th style={styles.tableHeaderCell}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.transactionId} style={styles.tableRow}>
                    <td style={styles.tableCell}>
                      <div style={styles.batchInfo}>
                        <span style={styles.batchNumber}>
                          {getBatchNumber(transaction)}
                        </span>
                        {transaction.batch?.crop?.name && (
                          <span style={styles.cropName}>
                            {transaction.batch.crop.name}
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={styles.receiverName}>
                        {getReceiverName(transaction)}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      {new Date(transaction.transactionDate).toLocaleDateString()}
                    </td>
                    <td style={styles.tableCell}>
                      {transaction.quantity} {transaction.unit || 'kg'}
                    </td>
                    <td style={styles.tableCell}>
                      ₹{transaction.pricePerUnit?.toFixed(2) || '0.00'}
                    </td>
                    <td style={styles.tableCell}>
                      <strong>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</strong>
                    </td>
                    {/* <td style={styles.tableCell}>
                      <span style={{...styles.statusBadge, ...getStatusBadgeStyle(transaction.status)}}>
                        {getStatusIcon(transaction.status)}
                        <span style={{marginLeft: 4}}>{transaction.status || 'PENDING'}</span>
                      </span>
                    </td> */}
                    <td style={styles.tableCell}>
                      <span style={{...styles.statusBadge, ...getDeliveryStatusBadgeStyle(transaction.deliveryStatus)}}>
                        {transaction.deliveryStatus || 'PENDING'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <span style={{...styles.statusBadge, ...getPaymentStatusBadgeStyle(transaction.paymentStatus)}}>
                        {transaction.paymentStatus || 'PENDING'}
                      </span>
                    </td>
                    <td style={styles.tableCell}>
                      <div style={styles.actionButtons}>
                        <button
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowEditModal(true);
                          }}
                          style={styles.editButton}
                          title="Update Delivery Status"
                          disabled={transaction.status === 'CANCELLED' || transaction.status === 'COMPLETED'}
                        >
                          <Edit size={14} />
                        </button>
                        {/* <button */}
                        {/* //   onClick={() => { */}
                        {/* //     setSelectedTransaction(transaction);
                        //     console.log('View transaction details:', transaction);
                        //   }}
                        //   style={styles.viewButton}
                        //   title="View Details"
                        // > */}
                          {/* <Eye size={14} /> */}
                        {/* // </button> */}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Delivery Status Modal */}
      {showEditModal && selectedTransaction && (
        <div style={styles.modalOverlay} onClick={() => setShowEditModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>Update Delivery Status</h2>
              <button onClick={() => setShowEditModal(false)} style={styles.closeButton}>
                <X size={24} />
              </button>
            </div>

            <div style={styles.modalContent}>
              <div style={styles.transactionInfo}>
                <h4 style={styles.infoTitle}>Transaction Details</h4>
                <div style={styles.infoGrid}>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Batch:</span>
                    <span style={styles.infoValue}>{getBatchNumber(selectedTransaction)}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>To:</span>
                    <span style={styles.infoValue}>{getReceiverName(selectedTransaction)}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Quantity:</span>
                    <span style={styles.infoValue}>{selectedTransaction.quantity} {selectedTransaction.unit || 'kg'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Total Amount:</span>
                    <span style={styles.infoValue}>₹{selectedTransaction.totalAmount?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Current Delivery:</span>
                    <span style={styles.infoValue}>{selectedTransaction.deliveryStatus || 'PENDING'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.infoLabel}>Payment:</span>
                    <span style={styles.infoValue}>{selectedTransaction.paymentStatus || 'PENDING'}</span>
                  </div>
                </div>
              </div>

              <div style={styles.statusOptions}>
                <h4 style={styles.optionsTitle}>Update Delivery Status</h4>
                <p style={styles.optionsDescription}>
                  Update the delivery status for this transaction. This helps track the progress of your crop delivery.
                </p>
                <div style={styles.statusButtons}>
                  <button
                    onClick={() => handleUpdateDeliveryStatus('PENDING')}
                    disabled={isSubmitting || (selectedTransaction.deliveryStatus || 'PENDING') === 'PENDING'}
                    style={{
                      ...styles.statusButton,
                      ...((selectedTransaction.deliveryStatus || 'PENDING') === 'PENDING' ? styles.statusButtonActive : {}),
                      background: '#f3f4f6',
                      color: '#374151'
                    }}
                  >
                    <Clock size={16} style={{marginRight: 8}} />
                    Mark as Pending
                  </button>
                  
                  <button
                    onClick={() => handleUpdateDeliveryStatus('IN_TRANSIT')}
                    disabled={isSubmitting || (selectedTransaction.deliveryStatus || 'PENDING') === 'IN_TRANSIT'}
                    style={{
                      ...styles.statusButton,
                      ...((selectedTransaction.deliveryStatus || 'PENDING') === 'IN_TRANSIT' ? styles.statusButtonActive : {}),
                      background: '#fffbeb',
                      color: '#92400e'
                    }}
                  >
                    <Truck size={16} style={{marginRight: 8}} />
                    Mark as In Transit
                  </button>
                  
                  <button
                    onClick={() => handleUpdateDeliveryStatus('DELIVERED')}
                    disabled={isSubmitting || (selectedTransaction.deliveryStatus || 'PENDING') === 'DELIVERED'}
                    style={{
                      ...styles.statusButton,
                      ...((selectedTransaction.deliveryStatus || 'PENDING') === 'DELIVERED' ? styles.statusButtonActive : {}),
                      background: '#f0fdf4',
                      color: '#166534'
                    }}
                  >
                    <CheckCircle size={16} style={{marginRight: 8}} />
                    Mark as Delivered
                  </button>
                </div>
              </div>

              {selectedTransaction.remarks && (
                <div style={styles.remarksSection}>
                  <h4 style={styles.remarksTitle}>Remarks</h4>
                  <p style={styles.remarksText}>{selectedTransaction.remarks}</p>
                </div>
              )}

              <div style={styles.modalActions}>
                <button 
                  onClick={() => setShowEditModal(false)}
                  style={styles.cancelButton}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '24px',
    background: '#f8fafc',
    minHeight: '100vh',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
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
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
    marginBottom: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    marginLeft: 'auto',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    marginBottom: '24px'
  },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    fontSize: '16px',
    color: '#6b7280',
    margin: 0
  },
  refreshButton: {
    padding: '10px 16px',
    background: '#147a48',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background 0.2s ease'
  },
  actionBar: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
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
    minWidth: '300px',
    position: 'relative'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
    paddingRight: '30px'
  },
  clearSearchButton: {
    position: 'absolute',
    right: '8px',
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
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
  activeDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '6px',
    height: '6px',
    background: '#ffffff',
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
    background: 'white',
    outline: 'none'
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
    flex: '1',
    outline: 'none'
  },
  dateSeparator: {
    fontSize: '12px',
    color: '#6b7280'
  },
  sortContainer: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center'
  },
  sortSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    background: 'white',
    flex: '1',
    outline: 'none'
  },
  sortOrderButton: {
    padding: '8px',
    background: 'green',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
    color: 'white'
  },
  resultsInfo: {
    textAlign: 'right',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px'
  },
  resultsText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  filteredText: {
    fontSize: '12px',
    color: '#147a48',
    fontWeight: '500'
  },
  tableContainer: {
    background: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  tableWrapper: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1000px'
  },
  tableHeader: {
    background: '#f8fafc'
  },
  tableHeaderCell: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb',
    whiteSpace: 'nowrap'
  },
  tableRow: {
    borderBottom: '1px solid #f3f4f6',
    transition: 'background 0.2s ease'
  },
  tableCell: {
    padding: '16px',
    fontSize: '14px',
    color: '#374151',
    whiteSpace: 'nowrap'
  },
  batchInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  batchNumber: {
    fontWeight: '600',
    color: '#1f2937'
  },
  cropName: {
    fontSize: '12px',
    color: '#6b7280'
  },
  receiverName: {
    fontWeight: '500'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    whiteSpace: 'nowrap'
  },
  actionButtons: {
    display: 'flex',
    gap: '8px'
  },
  editButton: {
    padding: '8px',
    background: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '6px',
    color: '#1e40af',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  viewButton: {
    padding: '8px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    color: '#166534',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
   emptyStateContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '400px', // Adjust this value as needed
    width: '100%'
  },

  // Update the emptyState style
  emptyState: {
    background: 'white',
    padding: '60px 40px',
    textAlign: 'center',
    borderRadius: '12px',
    border: '2px dashed #e5e7eb',
    maxWidth: '500px',
    width: '100%',
    margin: '0 auto'
  },

  // Keep your existing emptyState styles but ensure they're properly centered
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
    fontSize: '14px',
    lineHeight: '1.5'
  },
  retryButton: {
    padding: '12px 24px',
    background: '#147a48',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s ease',
    margin: '0 auto'
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
    maxWidth: '500px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  modalHeader: {
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
    transition: 'background 0.2s ease'
  },
  modalContent: {
    padding: '24px'
  },
  transactionInfo: {
    marginBottom: '24px'
  },
  infoTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0'
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px'
  },
  infoItem: {
    display: 'flex',
    flexDirection: 'column'
  },
  infoLabel: {
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px'
  },
  infoValue: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#1f2937'
  },
  statusOptions: {
    marginBottom: '24px'
  },
  optionsTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  optionsDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0',
    lineHeight: '1.5'
  },
  statusButtons: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  statusButton: {
    padding: '12px 16px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  statusButtonActive: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  remarksSection: {
    marginBottom: '24px'
  },
  remarksTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  remarksText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: 0
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end'
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
    transition: 'all 0.2s ease'
  }
};

export default FarmerTransactions;