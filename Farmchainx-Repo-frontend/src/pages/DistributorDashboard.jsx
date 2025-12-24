// src/pages/DistributorDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Truck, Package, Users, TrendingUp, CheckCircle, AlertCircle, 
  Eye, Download, CreditCard, Receipt, BarChart3, Settings, 
  LogOut, Plus, X, Calendar, MapPin, Phone, Building,
  Clock, ArrowRight, ShoppingCart, Search, Filter,
  PlusCircle, RefreshCw 
} from 'lucide-react';
import DistributorCreateBatches from './DistributorCreateBatches';

const DistributorDashboard = () => {
  const [activeTab, setActiveTab] = useState('batches');
  const [batches, setBatches] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [retailerTransactions, setRetailerTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('pay_now');
  const [currentUser, setCurrentUser] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const BASE_URL = 'http://localhost:8080';
  const RAZORPAY_KEY_ID = 'rzp_test_Ri3ACL3H3N4yNW';

  // Safe data access helper functions
  const getCropName = (batch) => {
    return batch?.crop?.name || batch?.cropName || 'Crop';
  };

  // Refresh function
const handleRefresh = async () => {
  setRefreshing(true);
  try {
    switch(activeTab) {
      case 'batches':
        await fetchBatches();
        break;
      case 'transactions':
        await fetchTransactions();
        break;
      case 'deliveries':
        await fetchRetailerTransactions();
        break;
      case 'create-batches':
        setRefreshTrigger(prev => prev + 1);
        break;
      default:
        await fetchBatches();
    }
    // setMessage('Data refreshed successfully!');
  } catch (err) {
    setError('Failed to refresh data');
  } finally {
    setRefreshing(false);
  }
};

  const getFarmerName = (batch) => {
    return batch?.farmer?.user?.name || batch?.farmer?.name || batch?.farmerName || 'Farmer';
  };

  const getAvailableQuantity = (batch) => {
    return batch?.availableQuantity || batch?.quantity || 0;
  };

  const getPrice = (batch) => {
    return batch?.price;
  };

  // Get farmer ID with multiple fallback methods
  const getFarmerId = (batch) => {
    if (batch?.crop?.farmer?.farmerId) return batch.crop.farmer.farmerId;
    
    console.error('Could not find farmer ID in batch:', batch);
    throw new Error('Farmer ID not found in batch data');
  };

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || localStorage.getItem('authToken');
  };

  // Get current user ID
  const getCurrentUserId = () => {
    const userId = localStorage.getItem('userId') || 
                   localStorage.getItem('user_id') ||
                   (currentUser?.id ? currentUser.id.toString() : null);
    
    console.log('Current User ID from storage:', userId);
    
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }
    
    return parseInt(userId);
  };

  // Get current user details
  const getCurrentUser = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('No user ID found in localStorage');
        return null;
      }

      const token = getAuthToken();
      if (!token) {
        console.error('No auth token found');
        return null;
      }

      const response = await fetch(`${BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('User data fetched:', userData);
        return userData;
      } else {
        console.error('Failed to fetch user data, status:', response.status);
        return null;
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };

  // Initialize user data
  // useEffect(() => {
  //   const initializeUser = async () => {
  //     console.log('Initializing user data...');
  //     const user = await getCurrentUser();
  //     if (user) {
  //       setCurrentUser(user);
  //       if (user.id && !localStorage.getItem('id')) {
  //         localStorage.setItem('id', user.id.toString());
  //       }
  //     } else {
  //       console.error('Could not initialize user data');
  //       setError('Unable to load user data. Please login again.');
  //     }
  //   };
  //   initializeUser();
  // }, []);

  // Fetch available batches
  const fetchBatches = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = getAuthToken();
      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${BASE_URL}/batches/available/role/FARMER`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const batchesData = await response.json();
        setBatches(batchesData || []);
      } else {
        setError('Failed to fetch batches');
      }
    } catch (err) {
      console.error('Error fetching batches:', err);
      setError('Failed to fetch batches');
      setBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch distributor transactions (purchases from farmers)
  const fetchTransactions = async () => {
    try {
      const distributorId = getCurrentUserId();
      if (!distributorId) {
        console.error('No distributor ID found for fetching transactions');
        return;
      }

      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/transactions/to/${getCurrentUserId()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const transactionsData = await response.json();
        setTransactions(transactionsData || []);
        console.log('Transactions fetched:', transactionsData);

      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    }
  };

  // NEW: Fetch retailer transactions (sales to retailers)
  const fetchRetailerTransactions = async () => {
    try {
      setLoadingDeliveries(true);
      const distributorId = getCurrentUserId();
      if (!distributorId) {
        console.error('No distributor ID found for fetching retailer transactions');
        return;
      }

      const token = getAuthToken();
      
      // First try the specific endpoint for distributor to retailer transactions
      let response = await fetch(`${BASE_URL}/transactions/from/${localStorage.getItem("userId")}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // If that endpoint doesn't exist, filter from all transactions
      if (!response.ok) {
        response = await fetch(`${BASE_URL}/transactions/distributor/${localStorage.getItem("id")}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const allTransactions = await response.json();
          // Filter transactions where distributor is sender (to retailers)
          const retailerTxns = allTransactions.filter(t => 
            t.fromUser?.id === distributorId && 
            t.toUser?.role === 'RETAILER'
          );
          setRetailerTransactions(retailerTxns);
          return;
        }
      } else {
        const retailerTxns = await response.json();
        setRetailerTransactions(retailerTxns || []);
      }
    } catch (err) {
      console.error('Error fetching retailer transactions:', err);
      setRetailerTransactions([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Fetch data on mount and when tab changes
  useEffect(() => {
    fetchBatches();
    if (activeTab === 'transactions') {
      fetchTransactions();
    }
    if (activeTab === 'deliveries') {
      fetchRetailerTransactions();
    }
  }, [activeTab]);

  // Calculate statistics
  const stats = {
    totalBatches: batches.length,
    availableQuantity: batches.reduce((sum, batch) => sum + getAvailableQuantity(batch), 0),
    totalTransactions: transactions.length,
    completedTransactions: transactions.filter(t => t.paymentStatus === 'PAID').length,
    pendingTransactions: transactions.filter(t => t.paymentStatus === 'PENDING').length,
    totalSpent: transactions
      .filter(t => t.paymentStatus === 'PAID')
      .reduce((sum, transaction) => sum + (transaction.totalAmount || 0), 0)
  };

  // Calculate delivery statistics
 // Update delivery statistics calculation
const deliveryStats = {
  pendingDeliveries: retailerTransactions.filter(t => t.deliveryStatus === 'PENDING').length,
  completedDeliveries: retailerTransactions.filter(t => t.deliveryStatus === 'DELIVERED').length,
  inTransitDeliveries: retailerTransactions.filter(t => t.deliveryStatus === 'IN_TRANSIT').length,
  pendingPayments: retailerTransactions.filter(t => t.paymentStatus === 'PENDING').length
};

  // Initialize Razorpay
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => {
        console.log('Razorpay SDK loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('Failed to load Razorpay SDK');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Create transaction function
  const createTransaction = async (transactionData) => {
    try {
      console.log('Creating transaction with:', transactionData);
      
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      const farmerId = getFarmerId(transactionData.batch);
      const distributorId = getCurrentUserId();

      console.log('Extracted farmerId:', farmerId);
      console.log('Current distributors UserId:', distributorId);

      const payload = {
        batchId: transactionData.batchId,
        fromUserId: farmerId,
        toUserId: distributorId,
        quantity: transactionData.quantity,
        pricePerUnit: getPrice(transactionData.batch),
        unit: 'kg',
        remarks: `Purchase of ${transactionData.quantity}kg ${getCropName(transactionData.batch)}`,
        transactionType: 'FARMER_TO_DISTRIBUTOR',
        payNow: transactionData.payNow || false,
        razorpayOrderId: transactionData.paymentId || null
      };

      console.log('Sending transaction request:', payload);

      const response = await fetch(`${BASE_URL}/transactions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      console.log('Transaction response status:', response.status);

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Ignore JSON parsing error
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Transaction created successfully:', result);
      return result;

    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  };

  // Update batch quantity function
  const updateBatchQuantity = async (batchId, purchasedQuantity) => {
    try {
      const token = getAuthToken();
      
      const requestBody = {
        purchasedQuantity: parseFloat(purchasedQuantity)
      };

      console.log('Updating batch quantity:', { batchId, purchasedQuantity });

      const response = await fetch(`${BASE_URL}/batches/${batchId}/update-quantity`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });

      console.log('Update quantity response status:', response.status);

      if (!response.ok) {
        if (response.type === 'opaque' || response.status === 0) {
          console.warn('CORS issue detected, but continuing...');
          return { success: true, warning: 'CORS issue but operation likely succeeded' };
        }
        
        const errorText = await response.text();
        console.error('Update quantity failed:', errorText);
        throw new Error(`Failed to update batch quantity: ${response.status}`);
      }

      const result = await response.json();
      console.log('Batch quantity updated successfully:', result);
      return result;

    } catch (error) {
      console.error('Error updating batch quantity:', error);
      
      if (error.message.includes('Failed to fetch') || error.message.includes('CORS')) {
        console.warn('Network/CORS error in batch update, but transaction was created');
        return { success: true, warning: 'Network issue but transaction created' };
      }
      
      throw error;
    }
  };

  // Process immediate payment with Razorpay UI
  const processImmediatePayment = async (batch, quantity) => {
    try {
      setProcessingPayment(true);
      setError('');
      
      const totalAmount = Math.round((getPrice(batch) * quantity) * 100);
      
      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Razorpay SDK failed to load. Please check your internet connection.');
      }

      console.log('Initializing Razorpay with amount:', totalAmount);

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: totalAmount,
        currency: 'INR',
        name: 'FarmChainX',
        description: `Purchase of ${quantity}kg ${getCropName(batch)}`,
        handler: async function (response) {
          try {
            console.log('Razorpay payment successful:', response);
            
            const transactionData = {
              batch: batch,
              batchId: batch.batchId,
              quantity: parseFloat(quantity),
              paymentId: response.razorpay_payment_id,
              payNow: true
            };

            const transactionResult = await createTransaction(transactionData);
            
            try {
              await updateBatchQuantity(batch.batchId, quantity);
              console.log('Batch quantity updated successfully');
            } catch (updateError) {
              console.warn('Batch quantity update failed, but transaction was created:', updateError);
            }
            
            setMessage('Payment successful! Transaction completed.');
            setShowPaymentModal(false);
            setSelectedBatch(null);
            setPurchaseQuantity('');
            
            await fetchBatches();
            await fetchTransactions();
            
          } catch (err) {
            console.error('Error in payment handler:', err);
            setError('Payment successful but transaction recording failed: ' + err.message);
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: currentUser?.name || 'Customer',
          email: currentUser?.email || 'customer@example.com',
          contact: '7972162632'
                    // contact: currentUser?.phone || '9999999999'

        },
        notes: {
          batchId: batch.batchId.toString(),
          cropName: getCropName(batch),
          quantity: quantity.toString(),
          farmerId: getFarmerId(batch).toString()
        },
        theme: {
          color: '#007b91'
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
            setMessage('Payment was cancelled.');
          }
        }
      };

      console.log('Razorpay options:', options);

      const razorpay = new window.Razorpay(options);
      
      setTimeout(() => {
        razorpay.open();
      }, 100);
      
    } catch (err) {
      console.error('Error processing payment:', err);
      setError(err.message || 'Failed to process payment');
      setProcessingPayment(false);
    }
  };

  // Process pay-later transaction
  const processPayLater = async (batch, quantity) => {
    try {
      setProcessingPayment(true);
      setError('');
      
      const transactionData = {
        batch: batch,
        batchId: batch.batchId,
        quantity: parseFloat(quantity),
        payNow: false
      };

      await createTransaction(transactionData);
      
      try {
        await updateBatchQuantity(batch.batchId, quantity);
      } catch (updateError) {
        console.warn('Batch quantity update failed, but transaction was created:', updateError);
      }
      
      setMessage('Transaction created successfully! You can pay later.');
      setShowPaymentModal(false);
      setSelectedBatch(null);
      setPurchaseQuantity('');
      
      await fetchBatches();
      await fetchTransactions();
      
    } catch (err) {
      console.error('Error creating transaction:', err);
      setError(err.message || 'Failed to create transaction');
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle purchase initiation
  const handlePurchaseInitiate = async (batch) => {
    if (!purchaseQuantity || purchaseQuantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const availableQty = getAvailableQuantity(batch);
    if (parseFloat(purchaseQuantity) > availableQty) {
      setError(`Maximum available quantity is ${availableQty}kg`);
      return;
    }

    try {
      setProcessingPayment(true);
      setError('');

      if (paymentMethod === 'pay_now') {
        await processImmediatePayment(batch, parseFloat(purchaseQuantity));
      } else {
        await processPayLater(batch, parseFloat(purchaseQuantity));
      }
    } catch (err) {
      console.error('Purchase error:', err);
      setError(err.message || 'Failed to process purchase. Please try again.');
      setProcessingPayment(false);
    }
  };

  // NEW: Update delivery status for retailer transactions
  const updateDeliveryStatus = async (transactionId, newStatus) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryStatus: newStatus })
      });

      if (response.ok) {
        setMessage('Delivery status updated successfully!');
        await fetchRetailerTransactions(); // Refresh data
      } else {
        setError('Failed to update delivery status');
      }
    } catch (err) {
      console.error('Error updating delivery status:', err);
      setError('Failed to update delivery status');
    }
  };

  // Get batch status badge
  const getBatchStatusBadge = (status) => {
    const statusConfig = {
      'AVAILABLE': { color: '#0a8a3a', bgColor: '#f0fdf4', label: 'Available' },
      'RESERVED': { color: '#f59e0b', bgColor: '#fffbeb', label: 'Reserved' },
      'SOLD': { color: '#6b7280', bgColor: '#f9fafb', label: 'Sold' },
      'EXPIRED': { color: '#ef4444', bgColor: '#fef2f2', label: 'Expired' }
    };
    
    const config = statusConfig[status] || statusConfig.AVAILABLE;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        color: config.color,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}33`
      }}>
        {config.label}
      </span>
    );
  };

  // NEW: Get delivery status badge
  const getDeliveryStatusBadge = (status) => {
    const statusConfig = {
      'PENDING': { icon: Clock, color: '#f59e0b', bgColor: '#fffbeb', label: 'Pending Pickup' },
      'IN_TRANSIT': { icon: Truck, color: '#007b91', bgColor: '#f0f9ff', label: 'In Transit' },
      'DELIVERED': { icon: CheckCircle, color: '#0a8a3a', bgColor: '#f0fdf4', label: 'Delivered' },
      // 'DELAYED': { icon: AlertCircle, color: '#ef4444', bgColor: '#fef2f2', label: 'Delayed' },
      'CANCELLED': { icon: X, color: '#6b7280', bgColor: '#f9fafb', label: 'Cancelled' }
    };
    
    const config = statusConfig[status] || statusConfig.PENDING;
    const IconComponent = config.icon;
    
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: config.bgColor,
        color: config.color,
        border: `1px solid ${config.color}`,
        display: 'flex',
        alignItems: 'center'
      }}>
        <IconComponent size={14} style={{marginRight: 4}} />
        {config.label}
      </span>
    );
  };

  // NEW: Get payment status badge
  const getPaymentStatusBadge = (status) => {
    const isPaid = status === 'PAID';
    const IconComponent = isPaid ? CheckCircle : Clock;
    
    return (
      <span style={{
        padding: '6px 12px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
        background: isPaid ? '#f0fdf4' : '#fffbeb',
        color: isPaid ? '#0a8a3a' : '#f59e0b',
        border: `1px solid ${isPaid ? '#0a8a3a' : '#f59e0b'}`,
        display: 'flex',
        alignItems: 'center'
      }}>
        <IconComponent size={14} style={{marginRight: 4}} />
        {isPaid ? 'Paid' : 'Pending'}
      </span>
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('id');
    localStorage.removeItem('userId');
    localStorage.removeItem('user_id');
    window.location.href = '/';
  };

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Tab Components
  const BatchesTab = () => (
    <div style={styles.tabContentInner}>
      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          Loading batches...
        </div>
      ) : batches.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Package size={48} style={{color: '#147a48'}} />
          </div>
          <h3 style={styles.emptyTitle}>No batches available</h3>
          <p style={styles.emptyText}>Check back later for new crop batches from farmers</p>
        </div>
      ) : (
        <div style={styles.batchesGrid}>
          {batches.map((batch) => (
            <div key={batch.batchId} style={styles.batchCard}>
              <div style={styles.batchHeader}>
                <div style={styles.batchTitleRow}>
                  <h3 style={styles.batchName}>{getCropName(batch)}</h3>
                  {getBatchStatusBadge(batch.status)}
                </div>
                <span style={styles.batchVariety}>{batch.crop?.variety || ''}</span>
              </div>
              
              <div style={styles.batchDetails}>
                <div style={styles.batchDetail}>
                  <span style={styles.detailLabel}>Available:</span>
                  <span style={styles.detailValue}>{getAvailableQuantity(batch)} kg</span>
                </div>
                <div style={styles.batchDetail}>
                  <span style={styles.detailLabel}>Price:</span>
                  <span style={styles.detailValue}>₹{getPrice(batch)}/kg</span>
                </div>
                <div style={styles.batchDetail}>
                  <span style={styles.detailLabel}>Farmer:</span>
                  <span style={styles.detailValue}>{getFarmerName(batch)}</span>
                </div>
                <div style={styles.batchDetail}>
                  <span style={styles.detailLabel}>Location:</span>
                  <span style={styles.detailValue}>{batch.crop?.farmer?.farmLocation || 'N/A'}</span>
                </div>
                {batch.harvestDate && (
                  <div style={styles.batchDetail}>
                    <span style={styles.detailLabel}>Harvest Date:</span>
                    <span style={styles.detailValue}>
                      {new Date(batch.harvestDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div style={styles.batchActions}>
                <button 
                  onClick={() => {
                    setSelectedBatch(batch);
                    setPurchaseQuantity('');
                    setShowPaymentModal(true);
                  }}
                  style={styles.purchaseButton}
                  disabled={batch.status !== 'AVAILABLE'}
                >
                  <ShoppingCart size={16} style={{marginRight: 6}} />
                  {batch.status === 'AVAILABLE' ? 'Purchase' : 'Not Available'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // NEW: Delivery Management Tab
  // NEW: Delivery Management Tab
const DeliveryManagementTab = () => (
  <div style={styles.tabContentInner}>
    <div style={styles.deliveryHeader}>
      <h3 style={styles.deliveryTitle}>Retailer Delivery Management</h3>
      <p style={styles.deliverySubtitle}>Track and manage deliveries to retailers</p>
    </div>

    {/* Delivery Statistics */}
    <div style={styles.deliveryStatsGrid}>
      <div style={styles.deliveryStatCard}>
        <div style={styles.deliveryStatIcon}>
          <Truck size={24} style={{color: '#007b91'}} />
        </div>
        <div style={styles.deliveryStatContent}>
          <p style={styles.deliveryStatLabel}>Pending Deliveries</p>
          <p style={styles.deliveryStatValue}>{deliveryStats.pendingDeliveries}</p>
        </div>
      </div>

      <div style={styles.deliveryStatCard}>
        <div style={styles.deliveryStatIcon}>
          <CheckCircle size={24} style={{color: '#0a8a3a'}} />
        </div>
        <div style={styles.deliveryStatContent}>
          <p style={styles.deliveryStatLabel}>Completed</p>
          <p style={styles.deliveryStatValue}>{deliveryStats.completedDeliveries}</p>
        </div>
      </div>

      {/* <div style={styles.deliveryStatCard}>
        <div style={styles.deliveryStatIcon}>
          <AlertCircle size={24} style={{color: '#f59e0b'}} />
        </div>
        <div style={styles.deliveryStatContent}>
          <p style={styles.deliveryStatLabel}>Delayed</p>
          <p style={styles.deliveryStatValue}>{deliveryStats.delayedDeliveries}</p>
        </div>
      </div> */}

      <div style={styles.deliveryStatCard}>
        <div style={styles.deliveryStatIcon}>
          <CreditCard size={24} style={{color: '#005a6b'}} />
        </div>
        <div style={styles.deliveryStatContent}>
          <p style={styles.deliveryStatLabel}>Pending Payments</p>
          <p style={styles.deliveryStatValue}>{deliveryStats.pendingPayments}</p>
        </div>
      </div>
    </div>

    {/* Delivery List - Updated to match farmer transactions style */}
    <div style={styles.deliveryList}>
      {loadingDeliveries ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          Loading retailer orders...
        </div>
      ) : retailerTransactions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Truck size={48} style={{color: '#007b91'}} />
          </div>
          <h3 style={styles.emptyTitle}>No retailer orders found</h3>
          <p style={styles.emptyText}>Retailer orders will appear here once they place orders</p>
        </div>
      ) : (
        retailerTransactions.map((transaction) => (
          <div key={transaction.transactionId} style={styles.deliveryTransactionCard}>
            <div style={styles.deliveryTransactionIcon}>
              <Truck size={20} style={{color: '#007b91'}} />
            </div>
            
            <div style={styles.deliveryTransactionInfo}>
              <h4 style={styles.deliveryTransactionName}>
                {transaction.batch?.crop?.name || 'Crop'} - {transaction.quantity}kg
              </h4>
              <p style={styles.deliveryTransactionDate}>
                {new Date(transaction.transactionDate).toLocaleDateString()} • 
                To: {transaction.toUser?.name || 'Retailer'}
              </p>
              <div style={styles.deliveryStatusBadges}>
                <span style={{
                  ...styles.deliveryStatusBadge,
                  ...(transaction.paymentStatus === 'PAID' ? styles.deliveryStatusPaid : 
                      transaction.paymentStatus === 'PENDING' ? styles.deliveryStatusPending : styles.deliveryStatusFailed)
                }}>
                  Payment: {transaction.paymentStatus}
                </span>
                <span style={{
                  ...styles.deliveryStatusBadge,
                  ...(transaction.deliveryStatus === 'DELIVERED' ? styles.deliveryStatusCompleted : 
                      transaction.deliveryStatus === 'IN_TRANSIT' ? styles.deliveryStatusInTransit :
                      transaction.deliveryStatus === 'PENDING' ? styles.deliveryStatusPending:styles.deliveryStatusInitiated)
                      // transaction.deliveryStatus === 'DELAYED' ? styles.deliveryStatusDelayed : styles.deliveryStatusInitiated
                }}>
                  Delivery: {transaction.deliveryStatus || 'PENDING'}
                </span>
              </div>
            </div>
            
            <div style={styles.deliveryTransactionAmount}>
              <div style={styles.deliveryAmount}>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</div>
              <div style={styles.deliveryQuantity}>{transaction.quantity} kg</div>
            </div>

            <div style={styles.deliveryTransactionActions}>
              {transaction.deliveryStatus === 'PENDING' && (
                <button 
                  onClick={() => updateDeliveryStatus(transaction.transactionId, 'IN_TRANSIT')}
                  style={styles.deliveryActionButton}
                >
                  <Truck size={14} style={{marginRight: 4}} />
                  Start Delivery
                </button>
              )}
              {transaction.deliveryStatus === 'IN_TRANSIT' && (
                <button 
                  onClick={() => updateDeliveryStatus(transaction.transactionId, 'DELIVERED')}
                  style={styles.deliveryActionButton}
                >
                  <CheckCircle size={14} style={{marginRight: 4}} />
                  Mark Delivered
                </button>
              )}
              {/* {(transaction.deliveryStatus === 'DELIVERED' || transaction.deliveryStatus === 'IN_TRANSIT') && (
                <button 
                  onClick={() => updateDeliveryStatus(transaction.transactionId, 'DELAYED')}
                  style={styles.deliveryDelayedButton}
                >
                  <AlertCircle size={14} style={{marginRight: 4}} />
                  Mark Delayed
                </button>
              )} */}
              
              {/* <button 
                onClick={() => console.log('View details:', transaction)}
                style={styles.deliveryViewButton}
              >
                <Eye size={14} style={{marginRight: 4}} />
                Details
              </button> */}
            </div>
          </div>
        ))
      )}
    </div>
  </div>
);

  const TransactionsTab = () => (
    <div style={styles.tabContentInner}>
      <div style={styles.transactionsList}>
        {transactions.map((transaction) => (
          <div key={transaction.transactionId} style={styles.transactionCard}>
            <div style={styles.transactionIcon}>
              <Receipt size={20} style={{color: '#007b91'}} />
            </div>
            
            <div style={styles.transactionInfo}>
              <h4 style={styles.transactionName}>
                {transaction.batch?.crop?.name || 'Crop'} - {transaction.quantity}kg
              </h4>
              <p style={styles.transactionDate}>
                {new Date(transaction.transactionDate).toLocaleDateString()} • 
                From: {transaction.fromUser?.name || 'Farmer'}
              </p>
              <div style={styles.statusBadges}>
                <span style={{
                  ...styles.statusBadge,
                  ...(transaction.paymentStatus === 'PAID' ? styles.statusPaid : 
                      transaction.paymentStatus === 'PENDING' ? styles.statusPending : styles.statusFailed)
                }}>
                  Payment: {transaction.paymentStatus}
                </span>
                <span style={{
                  ...styles.statusBadge,
                  ...(transaction.deliveryStatus === 'DELIVERED' ? styles.statusCompleted : styles.statusInitiated)
                }}>
                  Delivery: {transaction.deliveryStatus || 'PENDING'}
                </span>
              </div>
            </div>
            
            <div style={styles.transactionAmount}>
              <div style={styles.amount}>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</div>
            </div>
          </div>
        ))}
        
        {transactions.length === 0 && (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Receipt size={48} style={{color: '#007b91'}} />
            </div>
            <h3 style={styles.emptyTitle}>No transactions yet</h3>
            <p style={styles.emptyText}>Purchase your first batch to get started</p>
          </div>
        )}
      </div>
    </div>
  );

  const SettingsTab = () => (
    <div style={styles.tabContentInner}>
      <div style={styles.settingsGrid}>
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>Profile Information</h3>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Company Name</label>
            <input 
              type="text" 
              style={styles.settingsInput}
              defaultValue={currentUser?.companyName || ''}
              placeholder="Enter company name"
            />
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Contact Number</label>
            <input 
              type="tel" 
              style={styles.settingsInput}
              placeholder="Enter contact number"
            />
          </div>
          <button style={styles.saveButton}>Save Changes</button>
        </div>

        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>Payment Settings</h3>
          <div style={styles.settingsItem}>
            <label style={styles.settingsCheckbox}>
              <input type="checkbox" defaultChecked />
              Enable automatic payment notifications
            </label>
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsCheckbox}>
              <input type="checkbox" />
              Save payment methods for faster checkout
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.headerCard}>
          <div style={styles.headerBackground}>
            <div style={styles.headerContent}>
              <div style={styles.headerLeft}>
                <div style={styles.headerIcon}>
                  <Truck size={24} style={{color: 'white'}} />
                </div>
                <div>
                  <h1 style={styles.headerTitle}>Distributor Dashboard</h1>
                  <p style={styles.headerSubtitle}>Purchase crops, manage deliveries and track payments</p>
                </div>
              </div>
              <div style={styles.headerRight}>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{currentUser?.name || 'Distributor'}</p>
                  <p style={styles.userRole}>Distributor Account</p>
                </div>
                <button onClick={handleLogout} style={styles.logoutButton}>
                  <LogOut size={20} style={{color: 'white'}} />
                </button>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Package size={24} style={{color: '#007b91'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Available Batches</p>
                <p style={styles.statValue}>{stats.totalBatches}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <TrendingUp size={24} style={{color: '#005a6b'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Available Quantity</p>
                <p style={styles.statValue}>{stats.availableQuantity.toFixed(2)} kg</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Receipt size={24} style={{color: '#007b91'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Transactions</p>
                <p style={styles.statValue}>{stats.totalTransactions}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <CreditCard size={24} style={{color: '#005a6b'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Spent</p>
                <p style={styles.statValue}>₹{stats.totalSpent.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabs}>
              {[
                { id: 'batches', label: 'Available Stocks', icon: Package },
                { id: 'transactions', label: 'My Transactions', icon: Receipt },
                { id: 'create-batches', label: 'Create Batches', icon: PlusCircle },
                { id: 'deliveries', label: 'Delivery Management', icon: Truck }
                // ,
                // { id: 'settings', label: 'Settings', icon: Settings }
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
            <button 
                onClick={handleRefresh}
                disabled={refreshing}
                style={{
                  ...styles.refreshButton,
                  ...(refreshing && styles.refreshButtonDisabled)
                }}
                title="Refresh current tab data"
                >
                    <RefreshCw 
                      size={18} 
                      style={{
                        marginRight: 6,
                        animation: refreshing ? 'spin 1s linear infinite' : 'none'
                      }} 
                      />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
                      </div>
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
            <button 
              onClick={() => setError('')} 
              style={styles.dismissButton}
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'batches' && <BatchesTab />}
          {activeTab === 'deliveries' && <DeliveryManagementTab />}
          {activeTab === 'transactions' && <TransactionsTab />}
          {activeTab === 'create-batches' && <DistributorCreateBatches key={refreshTrigger} />}
          {activeTab === 'settings' && <SettingsTab />}
        </div>

        {/* Purchase/Payment Modal */}
        {showPaymentModal && selectedBatch && (
          <div style={styles.modalOverlay} onClick={() => setShowPaymentModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Purchase {getCropName(selectedBatch)}</h2>
                <button onClick={() => setShowPaymentModal(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <div style={styles.modalContent}>
                <div style={styles.purchaseInfo}>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Status:</span>
                    <span style={styles.purchaseValue}>{getBatchStatusBadge(selectedBatch.status)}</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Price per kg:</span>
                    <span style={styles.purchaseValue}>₹{getPrice(selectedBatch)}</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Available Quantity:</span>
                    <span style={styles.purchaseValue}>{getAvailableQuantity(selectedBatch)} kg</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Farmer:</span>
                    <span style={styles.purchaseValue}>{getFarmerName(selectedBatch)}</span>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={getAvailableQuantity(selectedBatch)}
                    value={purchaseQuantity}
                    onChange={(e) => setPurchaseQuantity(e.target.value)}
                    style={styles.input}
                    placeholder="Enter quantity"
                  />
                </div>

                {purchaseQuantity && (
                  <div style={styles.amountSummary}>
                    <div style={styles.amountRow}>
                      <span>Subtotal:</span>
                      <span>₹{(getPrice(selectedBatch) * purchaseQuantity).toFixed(2)}</span>
                    </div>
                    <div style={styles.amountTotal}>
                      <span>Total Amount:</span>
                      <span>₹{(getPrice(selectedBatch) * purchaseQuantity).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div style={styles.formGroup}>
                  <label style={styles.label}>Payment Method</label>
                  <div style={styles.paymentOptions}>
                    <label style={{
                      ...styles.paymentOption,
                      ...(paymentMethod === 'pay_now' ? styles.paymentOptionSelected : {})
                    }}>
                      <input
                        type="radio"
                        value="pay_now"
                        checked={paymentMethod === 'pay_now'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <div style={styles.paymentOptionContent}>
                        <CreditCard size={18} />
                        <span>Pay Now</span>
                        <small>Secure payment via Razorpay</small>
                      </div>
                    </label>
                  </div>
                </div>

                <div style={styles.modalActions}>
                  <button 
                    onClick={() => setShowPaymentModal(false)}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handlePurchaseInitiate(selectedBatch)}
                    disabled={!purchaseQuantity || processingPayment || selectedBatch.status !== 'AVAILABLE'}
                    style={{
                      ...styles.submitButton,
                      ...((selectedBatch.status !== 'AVAILABLE' || processingPayment) && styles.submitButtonDisabled)
                    }}
                  >
                    {processingPayment ? (
                      <>
                        <div style={styles.buttonSpinner}></div>
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} style={{marginRight: 6}} />
                        Pay Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles (including all previous styles plus new delivery management styles)
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    paddingTop: '7px'
  },
  content: {
    maxWidth: '1450px',
    margin: '0 auto',
    background: 'white'
  },
  
  // Header Styles
  headerCard: {
    background: 'white',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    marginBottom: '0'
  },
  headerBackground: {
    background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
    padding: '24px',
    borderRadius: '10px 10px 0 0'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  headerIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: 'rgba(255, 255, 255, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: 'white',
    margin: 0,
    lineHeight: '1.2'
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
    justifyContent: 'center',
    transition: 'background-color 0.2s ease'
  },

  // Statistics Styles
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '0',
    borderBottom: '1px solid #e5e7eb'
  },
  statCard: {
    background: 'white',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderRight: '1px solid #e5e7eb',
    transition: 'background-color 0.2s ease'
  },
  statIcon: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    background: '#f0f9ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  statContent: {
    flex: 1
  },
  statLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    fontWeight: '500'
  },
  statValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007b91',
    margin: 0
  },
// Add to your styles object
tabsHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%'
},
refreshButton: {
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
  color:'white',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.2s ease',
  marginLeft: 'auto',
  '&:hover': {
    background: '#f3f4f6',
    borderColor: '#9ca3af'
  }
},
refreshButtonDisabled: {
  opacity: 0.6,
  cursor: 'not-allowed',
  background: '#f3f4f6'
},
  // Tabs Styles
  tabsContainer: {
    padding: '20px 24px',
    borderBottom: '1px solid #e5e7eb'
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  tab: {
    padding: '12px 20px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    background: '#f9fafb',
    color: '#374151',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    outline: 'none'
  },
  tabActive: {
    background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 4px rgba(0, 123, 145, 0.2)'
  },

  // Tab Content
  tabContent: {
    background: 'white',
    minHeight: '500px'
  },
  tabContentInner: {
    padding: '24px'
  },

  // Batches Grid
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
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  batchHeader: {
    marginBottom: '16px'
  },
  batchName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  batchVariety: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  batchDetails: {
    marginBottom: '20px'
  },
  batchDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  detailLabel: {
    fontSize: '13px',
    color: '#6b7280',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937'
  },
  batchActions: {
    display: 'flex',
    justifyContent: 'flex-end'
  },
  purchaseButton: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },

  // Transactions
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  transactionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    transition: 'all 0.2s ease'
  },
  transactionIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    background: '#f0f9ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '16px',
    flexShrink: 0
  },
  transactionInfo: {
    flex: 1
  },
  transactionName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  transactionDate: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  transactionAmount: {
    textAlign: 'right',
    marginRight: '16px'
  },
  amount: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#007b91',
    margin: '0 0 4px 0'
  },
  statusBadges: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
  },
  statusBadge: {
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '11px',
    fontWeight: '600'
  },
  statusPaid: {
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0'
  },
  statusPending: {
    background: '#fffbeb',
    color: '#92400e',
    border: '1px solid #fcd34d'
  },
  statusFailed: {
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca'
  },
  statusCompleted: {
    background: '#f0f9ff',
    color: '#0369a1',
    border: '1px solid #bae6fd'
  },
  statusInitiated: {
    background: '#fafafa',
    color: '#6b7280',
    border: '1px solid #e5e7eb'
  },

  // Settings
  settingsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px'
  },
  settingsCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  settingsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0'
  },
  settingsItem: {
    marginBottom: '16px'
  },
  settingsLabel: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px'
  },
  settingsInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
  },
  deliveryTransactionCard: {
  display: 'flex',
  alignItems: 'center',
  padding: '20px',
  background: 'white',
  border: '1px solid #e5e7eb',
  borderRadius: '12px',
  transition: 'all 0.2s ease',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  marginBottom: '12px'
},
deliveryTransactionIcon: {
  width: '48px',
  height: '48px',
  borderRadius: '50%',
  background: '#f0f9ff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginRight: '20px',
  flexShrink: 0
},
deliveryTransactionInfo: {
  flex: 1
},
deliveryTransactionName: {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 4px 0'
},
deliveryTransactionDate: {
  fontSize: '14px',
  color: '#6b7280',
  margin: 0
},
deliveryTransactionAmount: {
  textAlign: 'right',
  marginRight: '20px'
},
deliveryAmount: {
  fontSize: '18px',
  fontWeight: '600',
  color: '#007b91',
  margin: '0 0 4px 0'
},
deliveryQuantity: {
  fontSize: '14px',
  color: '#6b7280'
},
deliveryStatusBadges: {
  display: 'flex',
  gap: '8px',
  marginTop: '8px'
},
deliveryStatusBadge: {
  padding: '4px 8px',
  borderRadius: '12px',
  fontSize: '11px',
  fontWeight: '600'
},
deliveryStatusPaid: {
  background: '#f0fdf4',
  color: '#166534',
  border: '1px solid #bbf7d0'
},
deliveryStatusPending: {
  background: '#fffbeb',
  color: '#92400e',
  border: '1px solid #fcd34d'
},
deliveryStatusFailed: {
  background: '#fef2f2',
  color: '#991b1b',
  border: '1px solid #fecaca'
},
deliveryStatusCompleted: {
  background: '#f0f9ff',
  color: '#0369a1',
  border: '1px solid #bae6fd'
},
deliveryStatusInTransit: {
  background: '#fef6e9',
  color: '#d46a00',
  border: '1px solid #fed7aa'
},
deliveryStatusDelayed: {
  background: '#fef2f2',
  color: '#ef4444',
  border: '1px solid #fecaca'
},
deliveryStatusInitiated: {
  background: '#fafafa',
  color: '#6b7280',
  border: '1px solid #e5e7eb'
},
deliveryTransactionActions: {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
},
deliveryActionButton: {
  padding: '8px 12px',
  background: '#007b91',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s ease'
},
deliveryDelayedButton: {
  padding: '8px 12px',
  background: '#f59e0b',
  color: 'white',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  transition: 'background-color 0.2s ease'
},
deliveryViewButton: {
  padding: '8px 12px',
  background: '#f3f4f6',
  color: '#374151',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  transition: 'all 0.2s ease'
},
  settingsCheckbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#374151',
    cursor: 'pointer'
  },
  saveButton: {
    padding: '12px 24px',
    background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    marginTop: '8px'
  },

  // Modal Styles
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
    background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
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
    justifyContent: 'center'
  },
  modalContent: {
    padding: '24px'
  },

  // Purchase Modal Styles
  purchaseInfo: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  purchaseDetail: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  purchaseLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  purchaseValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937'
  },
  amountSummary: {
    background: '#f0f9ff',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  amountRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#6b7280'
  },
  amountTotal: {
    display: 'flex',
    justifyContent: 'space-between',
    paddingTop: '8px',
    borderTop: '1px solid #e5e7eb',
    fontSize: '16px',
    fontWeight: '600',
    color: '#007b91'
  },
  paymentOptions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  paymentOption: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px',
    border: '2px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  paymentOptionSelected: {
    border: '2px solid #007b91',
    backgroundColor: '#f0f9ff'
  },
  paymentOptionContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginLeft: '12px'
  },

  // Form Styles
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '6px',
    display: 'block'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
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
    transition: 'all 0.2s ease'
  },
  submitButton: {
    padding: '10px 20px',
    background: 'linear-gradient(135deg, #007b91 0%, #005a6b 100%)',
    border: 'none',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },
  submitButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
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
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },

  // Empty State
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
    background: '#f0f9ff',
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
  batchTitleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '4px'
  },
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e7eb',
    borderTop: '4px solid #007b91',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
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
  dismissButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    cursor: 'pointer',
    marginLeft: '8px'
  },

  // NEW: Delivery Management Styles
  deliveryHeader: {
    marginBottom: '24px'
  },
  deliveryTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  deliverySubtitle: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  deliveryStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  deliveryStatCard: {
    background: 'white',
    padding: '20px',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #e5e7eb'
  },
  deliveryStatIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#f0f9ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  deliveryStatContent: {
    flex: 1
  },
  deliveryStatLabel: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 4px 0',
    fontWeight: '500'
  },
  deliveryStatValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#007b91',
    margin: 0
  },
  deliveryList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  deliveryCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  deliveryInfo: {
    flex: 1
  },
  deliveryHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  deliveryId: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  deliveryDetails: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '16px'
  },
  paymentStatusSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    background: '#f8fafc',
    borderRadius: '8px',
    border: '1px solid #e5e7eb'
  },
  paymentStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  paymentLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  paymentAmount: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  amountLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  amountValue: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#007b91'
  },
  deliveryActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '16px'
  },
  updateStatusButton: {
    padding: '10px 16px',
    background: '#007b91',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    minWidth: '140px'
  },
  delayedButton: {
    padding: '10px 16px',
    background: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    minWidth: '140px'
  },
  
  viewDetailsButton: {
    padding: '10px 16px',
    background: 'transparent',
    color: '#007b91',
    border: '1px solid #007b91',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    minWidth: '140px'
  },
  
 
};

export default DistributorDashboard;