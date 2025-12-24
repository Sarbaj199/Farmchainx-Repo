// src/components/admin/TransactionManagement.jsx
import React, { useState, useEffect } from 'react';
import { Search, Edit, Trash2, Download, Filter, RefreshCw, Package, Truck, Store, User, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

const TransactionManagement = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const BASE_URL = 'http://localhost:8080';

  // Get authentication token
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  const getAuthHeaders = () => {
    const token = getAuthToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  // Fetch all transactions
  const fetchTransactions = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${BASE_URL}/transactions/get-all`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      setTransactions(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  // Update transaction status
  const updateTransactionStatus = async (transactionId, updates) => {
    try {
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/status`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update transaction');
      }

      const updatedTransaction = await response.json();
      
      // Update local state
      setTransactions(prev => 
        prev.map(t => t.transactionId === transactionId ? updatedTransaction : t)
      );

      return true;
    } catch (err) {
      setError(err.message);
      console.error('Error updating transaction:', err);
      return false;
    }
  };

  // Delete transaction
  const deleteTransaction = async (transactionId) => {
    // if (!window.confirm('Are you sure you want to delete this transaction?')) return;

    try {
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Failed to delete transaction');
      }

      // Remove from local state
      setTransactions(prev => 
        prev.filter(t => t.transactionId !== transactionId)
      );

    //   alert('Transaction deleted successfully');
    } catch (err) {
      setError(err.message);
      console.error('Error deleting transaction:', err);
    }
  };

  // Handle status update
  const handleStatusUpdate = async (transactionId, field, value) => {
    const updates = { [field]: value };
    const success = await updateTransactionStatus(transactionId, updates);
    if (success) {
    //   alert('Transaction updated successfully');
    }
  };

  // Handle edit transaction
  const handleEditTransaction = async (e) => {
    e.preventDefault();
    if (!editingTransaction) return;

    const { transactionId, quantity, pricePerUnit, unit, remarks } = editingTransaction;
    const updates = { quantity, pricePerUnit, unit, remarks };

    const success = await updateTransactionStatus(transactionId, updates);
    if (success) {
      setShowEditModal(false);
      setEditingTransaction(null);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  useEffect(() => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(transaction =>
        transaction.transactionId.toString().includes(searchTerm) ||
        transaction.remarks?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.batch?.batchId.toString().includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.transactionType === typeFilter);
    }

    // Payment filter
    if (paymentFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.paymentStatus === paymentFilter);
    }

    // Delivery filter
    if (deliveryFilter !== 'all') {
      filtered = filtered.filter(transaction => transaction.deliveryStatus === deliveryFilter);
    }

    setFilteredTransactions(filtered);
  }, [searchTerm, statusFilter, typeFilter, paymentFilter, deliveryFilter, transactions]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = ['Transaction ID', 'Type', 'Date', 'Quantity', 'Unit', 'Price/Unit', 'Total Amount', 'Status', 'Payment', 'Delivery', 'Remarks', 'Batch ID'];
    const csvData = filteredTransactions.map(transaction => [
      transaction.transactionId,
      transaction.transactionType,
      transaction.transactionDate,
      transaction.quantity,
      transaction.unit,
      transaction.pricePerUnit,
      transaction.totalAmount,
      transaction.status,
      transaction.paymentStatus,
      transaction.deliveryStatus,
      `"${transaction.remarks || ''}"`,
      transaction.batch?.batchId || 'N/A'
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETED': return '#10b981';
      case 'IN_TRANSIT': return '#3b82f6';
      case 'PENDING': return '#f59e0b';
      case 'INITIATED': return '#8b5cf6';
      case 'CANCELLED': return '#ef4444';
      case 'RETURNED': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Get payment status color
  const getPaymentColor = (status) => {
    switch (status) {
      case 'PAID': return '#10b981';
      case 'PENDING': return '#f59e0b';
      case 'FAILED': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Get delivery status color
  const getDeliveryColor = (status) => {
    switch (status) {
      case 'DELIVERED': return '#10b981';
      case 'IN_TRANSIT': return '#3b82f6';
      case 'PENDING': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // Get transaction type icon
  const getTransactionTypeIcon = (type) => {
    switch (type) {
      case 'FARMER_TO_DISTRIBUTOR': return <User size={16} />;
      case 'DISTRIBUTOR_TO_RETAILER': return <Truck size={16} />;
      case 'RETAILER_TO_CUSTOMER': return <Store size={16} />;
      default: return <Package size={16} />;
    }
  };

  // Get transaction type label
  const getTransactionTypeLabel = (type) => {
    return type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  // Stats calculation
  const stats = {
    total: transactions.length,
    completed: transactions.filter(t => t.status === 'COMPLETED').length,
    pending: transactions.filter(t => t.status === 'PENDING' || t.status === 'INITIATED').length,
    inTransit: transactions.filter(t => t.deliveryStatus === 'IN_TRANSIT').length,
    totalRevenue: transactions.reduce((sum, t) => sum + (t.totalAmount || 0), 0)
  };

  return (
    <div style={styles.container}>
      {/* Header with Stats */}
      <div style={styles.statsContainer}>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.total}</div>
          <div style={styles.statLabel}>Total Transactions</div>
        </div>
        {/* <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.completed}</div>
          <div style={styles.statLabel}>Completed</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.pending}</div>
          <div style={styles.statLabel}>Pending</div>
        </div>
        <div style={styles.statCard}>
          <div style={styles.statNumber}>{stats.inTransit}</div>
          <div style={styles.statLabel}>In Transit</div>
        </div> */}
        <div style={styles.statCard}>
          <div style={styles.statNumber}>₹{stats.totalRevenue.toLocaleString()}</div>
          <div style={styles.statLabel}>Total Revenue</div>
        </div>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <div style={styles.searchContainer}>
          <Search size={20} style={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search by transaction ID, remarks, or batch ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
        </div>

        <div style={styles.filterContainer}>
          <Filter size={16} style={{marginRight: 8}} />
          {/* <select 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Status</option>
            <option value="INITIATED">Initiated</option>
            <option value="PENDING">Pending</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="RETURNED">Returned</option>
          </select> */}

          <select 
            value={typeFilter} 
            onChange={(e) => setTypeFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Types</option>
            <option value="FARMER_TO_DISTRIBUTOR">Farmer → Distributor</option>
            <option value="DISTRIBUTOR_TO_RETAILER">Distributor → Retailer</option>
            <option value="RETAILER_TO_CUSTOMER">Retailer → Customer</option>
          </select>

          <select 
            value={paymentFilter} 
            onChange={(e) => setPaymentFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Payments</option>
            <option value="PENDING">Payment Pending</option>
            <option value="PAID">Paid</option>
            <option value="FAILED">Failed</option>
          </select>

          <select 
            value={deliveryFilter} 
            onChange={(e) => setDeliveryFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Delivery</option>
            <option value="PENDING">Delivery Pending</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>

        <div style={styles.actionButtons}>
          <button 
            onClick={fetchTransactions}
            style={styles.refreshButton}
            disabled={loading}
          >
            <RefreshCw size={16} style={{marginRight: 8}} />
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button 
            onClick={exportToCSV}
            style={styles.exportButton}
            disabled={filteredTransactions.length === 0}
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

      {/* Transactions Table */}
      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Transaction ID</th>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Date & Time</th>
              <th style={styles.th}>Quantity & Price</th>
              <th style={styles.th}>Total Amount</th>
              {/* <th style={styles.th}>Status</th> */}
              <th style={styles.th}>Payment</th>
              <th style={styles.th}>Delivery</th>
              <th style={styles.th}>Remarks</th>
              <th style={styles.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.map((transaction) => (
              <tr key={transaction.transactionId} style={styles.tr}>
                <td style={styles.td}>
                  <div style={styles.transactionId}>
                    #{transaction.transactionId}
                  </div>
                  <div style={styles.batchId}>
                    Batch: {transaction.batch?.batchId || 'N/A'}
                  </div>
                </td>
                
                <td style={styles.td}>
                  <div style={styles.typeCell}>
                    {getTransactionTypeIcon(transaction.transactionType)}
                    <span style={styles.typeText}>
                      {getTransactionTypeLabel(transaction.transactionType)}
                    </span>
                  </div>
                </td>
                
                <td style={styles.td}>
                  <div style={styles.dateCell}>
                    {new Date(transaction.transactionDate).toLocaleDateString()}
                  </div>
                  <div style={styles.timeCell}>
                    {new Date(transaction.transactionDate).toLocaleTimeString()}
                  </div>
                </td>
                
                <td style={styles.td}>
                  <div style={styles.quantityCell}>
                    <strong>{transaction.quantity} {transaction.unit}</strong>
                  </div>
                  <div style={styles.priceCell}>
                    ₹{transaction.pricePerUnit}/unit
                  </div>
                </td>
                
                <td style={styles.td}>
                  <div style={styles.amountCell}>
                    ₹{transaction.totalAmount?.toLocaleString() || '0'}
                  </div>
                </td>
                
                {/* <td style={styles.td}>
                  <select
                    value={transaction.status}
                    onChange={(e) => handleStatusUpdate(transaction.transactionId, 'status', e.target.value)}
                    style={{
                      ...styles.statusSelect,
                      background: getStatusColor(transaction.status)
                    }}
                  >
                    <option value="INITIATED">Initiated</option>
                    <option value="PENDING">Pending</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                    <option value="RETURNED">Returned</option>
                  </select>
                </td> */}
                
                <td style={styles.td}>
                  <select
                    value={transaction.paymentStatus}
                    onChange={(e) => handleStatusUpdate(transaction.transactionId, 'paymentStatus', e.target.value)}
                    style={{
                      ...styles.statusSelect,
                      background: getPaymentColor(transaction.paymentStatus)
                    }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PAID">Paid</option>
                    <option value="FAILED">Failed</option>
                  </select>
                </td>
                
                <td style={styles.td}>
                  <select
                    value={transaction.deliveryStatus}
                    onChange={(e) => handleStatusUpdate(transaction.transactionId, 'deliveryStatus', e.target.value)}
                    style={{
                      ...styles.statusSelect,
                      background: getDeliveryColor(transaction.deliveryStatus)
                    }}
                  >
                    <option value="PENDING">Pending</option>
                    <option value="IN_TRANSIT">In Transit</option>
                    <option value="DELIVERED">Delivered</option>
                  </select>
                </td>
                
                <td style={styles.td}>
                  <div style={styles.remarks}>
                    {transaction.remarks || 'No remarks'}
                  </div>
                </td>
                
                <td style={styles.td}>
                  <div style={styles.actionButtons}>
                    <button
                      onClick={() => {
                        setEditingTransaction(transaction);
                        setShowEditModal(true);
                      }}
                      style={styles.editButton}
                      title="Edit Transaction"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteTransaction(transaction.transactionId)}
                      style={styles.deleteButton}
                      title="Delete Transaction"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {filteredTransactions.length === 0 && !loading && (
          <div style={styles.emptyState}>
            No transactions found matching your criteria.
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {showEditModal && editingTransaction && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <h3 style={styles.modalTitle}>Edit Transaction #{editingTransaction.transactionId}</h3>
            <form onSubmit={handleEditTransaction}>
              <div style={styles.formRow}>
                <label style={styles.label}>
                  Quantity
                  <input
                    type="number"
                    step="0.01"
                    value={editingTransaction.quantity}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      quantity: parseFloat(e.target.value),
                      totalAmount: parseFloat(e.target.value) * editingTransaction.pricePerUnit
                    })}
                    style={styles.input}
                    required
                  />
                </label>
                <label style={styles.label}>
                  Unit
                  <input
                    type="text"
                    value={editingTransaction.unit}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      unit: e.target.value
                    })}
                    style={styles.input}
                    required
                  />
                </label>
              </div>
              
              <div style={styles.formRow}>
                <label style={styles.label}>
                  Price Per Unit
                  <input
                    type="number"
                    step="0.01"
                    value={editingTransaction.pricePerUnit}
                    onChange={(e) => setEditingTransaction({
                      ...editingTransaction,
                      pricePerUnit: parseFloat(e.target.value),
                      totalAmount: editingTransaction.quantity * parseFloat(e.target.value)
                    })}
                    style={styles.input}
                    required
                  />
                </label>
                <label style={styles.label}>
                  Total Amount
                  <input
                    type="number"
                    step="0.01"
                    value={editingTransaction.totalAmount}
                    style={{...styles.input, background: '#f3f4f6'}}
                    readOnly
                  />
                </label>
              </div>
              
              <label style={styles.label}>
                Remarks
                <textarea
                  value={editingTransaction.remarks}
                  onChange={(e) => setEditingTransaction({
                    ...editingTransaction,
                    remarks: e.target.value
                  })}
                  style={styles.textarea}
                  rows="3"
                />
              </label>
              
              <div style={styles.modalActions}>
                <button type="submit" style={styles.primaryButton}>
                  Update Transaction
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingTransaction(null);
                  }}
                  style={styles.secondaryButton}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
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
  statsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
    gap: '12px',
    flexWrap: 'wrap'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    background: 'white',
    minWidth: '120px'
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
  tableContainer: {
    overflowX: 'auto',
    border: '1px solid #e5e7eb',
    borderRadius: '8px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1200px'
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
  transactionId: {
    fontWeight: '600',
    color: '#1f2937'
  },
  batchId: {
    fontSize: '12px',
    color: '#6b7280',
    marginTop: '4px'
  },
  typeCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  typeText: {
    fontSize: '13px',
    fontWeight: '500'
  },
  dateCell: {
    fontWeight: '500',
    marginBottom: '4px'
  },
  timeCell: {
    fontSize: '12px',
    color: '#6b7280'
  },
  quantityCell: {
    marginBottom: '4px'
  },
  priceCell: {
    fontSize: '12px',
    color: '#6b7280'
  },
  amountCell: {
    fontWeight: '600',
    color: '#059669'
  },
  statusSelect: {
    padding: '6px 10px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500',
    color: 'white',
    cursor: 'pointer',
    minWidth: '100px'
  },
  remarks: {
    fontSize: '13px',
    color: '#6b7280',
    maxWidth: '200px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  editButton: {
    background: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 8px',
    cursor: 'pointer',
    marginRight: '8px'
  },
  deleteButton: {
    background: '#ef4444',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '6px 8px',
    cursor: 'pointer'
  },
  emptyState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280',
    fontSize: '14px'
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
    zIndex: 1000
  },
  modal: {
    background: 'white',
    padding: '24px',
    borderRadius: '8px',
    width: '90%',
    maxWidth: '500px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
  },
  modalTitle: {
    margin: '0 0 20px 0',
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937'
  },
  formRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px'
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px'
  },
  input: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box'
  },
  textarea: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    boxSizing: 'border-box',
    resize: 'vertical'
  },
  modalActions: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'flex-end',
    marginTop: '20px'
  },
  primaryButton: {
    background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  secondaryButton: {
    background: 'white',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '10px 20px',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  }
};

export default TransactionManagement;