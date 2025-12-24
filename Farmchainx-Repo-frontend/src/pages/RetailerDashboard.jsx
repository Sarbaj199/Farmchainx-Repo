// src/pages/RetailerDashboard.jsx
import React, { useState, useEffect } from 'react';
import { 
  Store, Package, Users, CheckCircle, AlertCircle, 
  Eye, CreditCard, LogOut, Plus, X, 
  ShoppingCart, Truck, Building, Search,
  Settings, Receipt, Filter, Calendar, Clock,
  ArrowUp, ArrowDown, Download, Edit, TrendingUp,
  QrCode, Trash2,RefreshCw
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import CreateBatchesTab from './RetailerCreateBatches';

const RetailerDashboard = () => {
  const [activeTab, setActiveTab] = useState('available-batches');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [retailerBatches, setRetailerBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingDeliveries, setLoadingDeliveries] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingPurchaseId, setProcessingPurchaseId] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
  // Create Batch Modal States
  const [showCreateBatchModal, setShowCreateBatchModal] = useState(false);
  const [showEditBatchModal, setShowEditBatchModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedRetailerBatch, setSelectedRetailerBatch] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Batch Form Data
  const [batchFormData, setBatchFormData] = useState({
    batchNumber: '',
    harvestDate: '',
    quantity: '',
    availableQuantity: '',
    unit: 'kg',
    storageConditions: '',
    price: '',
    pricePerUnit: '',
    cropName: '',
    status: 'AVAILABLE'
  });

  // Filter states for each tab
  const [batchFilters, setBatchFilters] = useState({
    search: '',
    cropType: '',
    priceRange: '',
    distributor: '',
    quality: '',
    status: 'all'
  });

  const [deliveryFilters, setDeliveryFilters] = useState({
    search: '',
    deliveryStatus: 'all',
    paymentStatus: 'all',
    customer: ''
  });

  const [transactionFilters, setTransactionFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all',
    dateRange: { start: '', end: '' }
  });

  const [retailerBatchFilters, setRetailerBatchFilters] = useState({
    search: '',
    cropType: '',
    priceRange: '',
    status: 'all'
  });

  // UI states
  const [showBatchFilters, setShowBatchFilters] = useState(false);
  const [showDeliveryFilters, setShowDeliveryFilters] = useState(false);
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  const [showRetailerBatchFilters, setShowRetailerBatchFilters] = useState(false);
  const [sortBy, setSortBy] = useState('harvestDate');
  const [sortOrder, setSortOrder] = useState('desc');

  const BASE_URL = 'http://localhost:8080';
  const RAZORPAY_KEY_ID = 'rzp_test_Ri3ACL3H3N4yNW';


  const [refreshing, setRefreshing] = useState(false);

// Enhanced refresh function
const handleRefresh = async () => {
  setRefreshing(true);
  try {
    switch(activeTab) {
      case 'available-batches':
        await fetchAvailableBatches();
        break;
      case 'delivery-management':
        await fetchCustomerOrders();
        break;
      case 'my-transactions':
        await fetchMyTransactions();
        break;
      case 'create-batches':
        setRefreshTrigger(prev => prev + 1);
        break;
      default:
        await fetchAvailableBatches();
    }
    // setMessage('Data refreshed successfully!');
  } catch (err) {
    setError('Failed to refresh data');
  } finally {
    setRefreshing(false);
  }
};
  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (!token) {
      throw new Error('No authentication token found. Please login again.');
    }
    return token.replace('Bearer ', '');
  };

  // Get current user ID
  const getCurrentUserId = () => {
    const userId = localStorage.getItem('userId') || localStorage.getItem('user_id');
    if (!userId) {
      throw new Error('User ID not found. Please login again.');
    }
    return parseInt(userId);
  };

  // Get current user details
  const getCurrentUser = async () => {
    try {
      const userId = getCurrentUserId();
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/user/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        const userData = await response.json();
        return userData;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      const user = await getCurrentUser();
      if (user) {
        setCurrentUser(user);
      }
    };
    initializeUser();
  }, []);

  // Fetch available batches from distributors
  const fetchAvailableBatches = async () => {
    try {
      setLoading(true);
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/batches/available/role/DISTRIBUTOR`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableBatches(data);
      } else {
        throw new Error('Failed to fetch available batches');
      }
    } catch (err) {
      console.error('Error fetching available batches:', err);
      setAvailableBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer orders (where customer paid, retailer needs to deliver)
  const fetchCustomerOrders = async () => {
    try {
      setLoadingDeliveries(true);
      const retailerId = getCurrentUserId();
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/transactions/from/${retailerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCustomerOrders(data);
      } else {
        throw new Error('Failed to fetch customer orders');
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      setCustomerOrders([]);
    } finally {
      setLoadingDeliveries(false);
    }
  };

  // Fetch retailer's transactions (purchases from distributors)
  const fetchMyTransactions = async () => {
    try {
      setLoading(true);
      const retailerId = getCurrentUserId();
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/transactions/to/${getCurrentUserId()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMyTransactions(data);
      } else {
        throw new Error('Failed to fetch transactions');
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setMyTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch retailer's own batches
  const fetchRetailerBatches = async () => {
    try {
      setLoading(true);
      const retailerId = getCurrentUserId();
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/batches/user/${retailerId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRetailerBatches(data || []);
      } else {
        throw new Error('Failed to fetch retailer batches');
      }
    } catch (err) {
      console.error('Error fetching retailer batches:', err);
      setRetailerBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'available-batches') {
      fetchAvailableBatches();
    } else if (activeTab === 'delivery-management') {
      fetchCustomerOrders();
    } else if (activeTab === 'my-transactions') {
      fetchMyTransactions();
    } else if (activeTab === 'create-batches') {
      fetchRetailerBatches();
    }
  }, [activeTab, currentUser]);

  // Initialize Razorpay
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Handle purchase initiation with quantity selection
  const handlePurchaseInitiate = (batch) => {
    setSelectedBatch(batch);
    setPurchaseQuantity('');
    setShowQuantityModal(true);
  };

  // Process payment after quantity selection
  const processPurchasePayment = async () => {
    if (!purchaseQuantity || purchaseQuantity <= 0) {
      setError('Please enter a valid quantity');
      return;
    }

    const availableQty = selectedBatch.availableQuantity || selectedBatch.quantity;
    if (parseFloat(purchaseQuantity) > availableQty) {
      setError(`Maximum available quantity is ${availableQty}kg`);
      return;
    }

    try {
      setProcessingPayment(true);
      setProcessingPurchaseId(selectedBatch.batchId);
      setError('');
      
      const totalAmount = Math.round((selectedBatch.pricePerUnit * purchaseQuantity) * 100);
      
      const toUserId = selectedBatch.user?.id;
      const currentUserId = getCurrentUserId();

      const razorpayLoaded = await loadRazorpay();
      if (!razorpayLoaded) {
        throw new Error('Razorpay SDK failed to load');
      }

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: totalAmount,
        currency: 'INR',
        name: 'FarmChainX',
        description: `Purchase from ${selectedBatch.distributorName || 'Distributor'} for ${purchaseQuantity}kg ${selectedBatch.cropName || 'crop'}`,
        handler: async function (response) {
          try {
            const token = getAuthToken();
            const purchaseResponse = await fetch(`${BASE_URL}/transactions/create`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                batchId: selectedBatch.batchId,
                fromUserId: selectedBatch.user?.id,
                toUserId: currentUserId,
                quantity: parseFloat(purchaseQuantity),
                pricePerUnit: selectedBatch.pricePerUnit,
                unit: 'kg',
                remarks: `Purchase from available batch - ${selectedBatch.cropName}`,
                transactionType: 'DISTRIBUTOR_TO_RETAILER',
                payNow: true,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpayOrderId: response.razorpay_order_id
              })
            });

            if (purchaseResponse.ok) {
              setMessage('Purchase completed successfully!');
              setShowQuantityModal(false);
              setSelectedBatch(null);
              setPurchaseQuantity('');
              
              await fetchAvailableBatches();
              await fetchMyTransactions();
            } else {
              const errorText = await purchaseResponse.text();
              setError(`Payment successful but purchase creation failed: ${errorText}`);
            }
          } catch (err) {
            setError('Payment successful but purchase failed: ' + err.message);
          } finally {
            setProcessingPayment(false);
            setProcessingPurchaseId(null);
          }
        },
        prefill: {
          name: currentUser?.name || 'Retailer',
          email: currentUser?.email || 'retailer@example.com',
          contact: currentUser?.phone || '9999999999'
        },
        theme: {
          color: '#d46a00'
        },
        modal: {
          ondismiss: function() {
            setProcessingPayment(false);
            setProcessingPurchaseId(null);
            setMessage('Purchase was cancelled.');
          }
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
      
    } catch (err) {
      console.error('Payment processing error:', err);
      setError(err.message || 'Failed to process purchase');
      setProcessingPayment(false);
      setProcessingPurchaseId(null);
    }
  };

  // Update delivery status for customer orders
  const handleUpdateCustomerDeliveryStatus = async (transactionId, status) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/transactions/${transactionId}/delivery-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryStatus: status })
      });

      if (response.ok) {
        setMessage('Delivery status updated successfully!');
        await fetchCustomerOrders();
      } else {
        throw new Error('Failed to update delivery status');
      }
    } catch (err) {
      setError(err.message || 'Failed to update delivery status');
    }
  };

  // Create Retailer Batch
  const handleCreateRetailerBatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const retailerId = getCurrentUserId();
      if (!retailerId) throw new Error('Retailer ID not found. Please login again.');

      // Validate form data
      if (!batchFormData.batchNumber?.trim()) throw new Error('Batch number is required');
      if (!batchFormData.cropName?.trim()) throw new Error('Crop name is required');
      if (!batchFormData.quantity || parseFloat(batchFormData.quantity) <= 0) throw new Error('Valid quantity is required');
      if (!batchFormData.price || parseFloat(batchFormData.price) <= 0) throw new Error('Valid price is required');

      // Prepare batch data
      const batchData = {
        batchNumber: batchFormData.batchNumber.trim(),
        harvestDate: batchFormData.harvestDate ? batchFormData.harvestDate + 'T00:00:00' : new Date().toISOString(),
        quantity: parseFloat(batchFormData.quantity),
        availableQuantity: parseFloat(batchFormData.availableQuantity || batchFormData.quantity),
        unit: batchFormData.unit,
        storageConditions: batchFormData.storageConditions?.trim() || '',
        price: parseFloat(batchFormData.price),
        pricePerUnit: parseFloat(batchFormData.pricePerUnit || batchFormData.price),
        status: batchFormData.status,
        createdByRole: 'RETAILER'
      };

      // Create batch (you might need to adjust the endpoint based on your API)
      const response = await fetch(`${BASE_URL}/batches/retailer/${retailerId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...batchData,
          cropName: batchFormData.cropName.trim()
        })
      });

      if (response.ok) {
        setMessage('Batch created successfully!');
        setShowCreateBatchModal(false);
        resetBatchFormData();
        fetchRetailerBatches();
      } else {
        throw new Error('Failed to create batch');
      }
    } catch (err) {
      console.error('Error creating batch:', err);
      setError(err.message || 'Failed to create batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update Retailer Batch
  const handleUpdateRetailerBatch = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (!selectedRetailerBatch) throw new Error('No batch selected for update');

      const updateData = {
        batchNumber: batchFormData.batchNumber.trim(),
        harvestDate: batchFormData.harvestDate ? batchFormData.harvestDate + 'T00:00:00' : selectedRetailerBatch.harvestDate,
        quantity: parseFloat(batchFormData.quantity),
        availableQuantity: parseFloat(batchFormData.availableQuantity),
        unit: batchFormData.unit,
        storageConditions: batchFormData.storageConditions?.trim() || '',
        price: parseFloat(batchFormData.price),
        pricePerUnit: parseFloat(batchFormData.pricePerUnit || batchFormData.price),
        status: batchFormData.status
      };

      const response = await fetch(`${BASE_URL}/batches/${selectedRetailerBatch.batchId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        setMessage('Batch updated successfully!');
        setShowEditBatchModal(false);
        setSelectedRetailerBatch(null);
        resetBatchFormData();
        fetchRetailerBatches();
      } else {
        throw new Error('Failed to update batch');
      }
    } catch (err) {
      console.error('Error updating batch:', err);
      setError(err.message || 'Failed to update batch');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Retailer Batch
  const handleDeleteRetailerBatch = async (batchId) => {
    if (!window.confirm('Are you sure you want to delete this batch? This action cannot be undone.')) return;
    
    try {
      const response = await fetch(`${BASE_URL}/batches/${batchId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setMessage('Batch deleted successfully!');
        fetchRetailerBatches();
      } else {
        throw new Error('Failed to delete batch');
      }
    } catch (err) {
      console.error('Error deleting batch:', err);
      setError(err.message || 'Failed to delete batch');
    }
  };

  // Reset batch form data
  const resetBatchFormData = () => {
    setBatchFormData({
      batchNumber: '',
      harvestDate: '',
      quantity: '',
      availableQuantity: '',
      unit: 'kg',
      storageConditions: '',
      price: '',
      pricePerUnit: '',
      cropName: '',
      status: 'AVAILABLE'
    });
  };

  // Generate batch number
  const generateBatchNumber = () => {
    const timestamp = new Date().getTime();
    const random = Math.floor(Math.random() * 1000);
    return `RETAIL-BATCH-${timestamp}-${random}`;
  };

  // Open create batch modal
  const handleOpenCreateBatch = () => {
    setBatchFormData({
      ...batchFormData,
      batchNumber: generateBatchNumber(),
      harvestDate: new Date().toISOString().split('T')[0]
    });
    setShowCreateBatchModal(true);
  };

  // Open edit batch modal
  const handleEditRetailerBatch = (batch) => {
    setSelectedRetailerBatch(batch);
    const harvestDate = batch.harvestDate ? 
      new Date(batch.harvestDate).toISOString().split('T')[0] : '';
    
    setBatchFormData({
      batchNumber: batch.batchNumber || '',
      harvestDate: harvestDate,
      quantity: batch.quantity || '',
      availableQuantity: batch.availableQuantity || '',
      unit: batch.unit || 'kg',
      storageConditions: batch.storageConditions || '',
      price: batch.price || '',
      pricePerUnit: batch.pricePerUnit || '',
      cropName: batch.crop?.name || '',
      status: batch.status || 'AVAILABLE'
    });
    setShowEditBatchModal(true);
  };

  // Download QR Code
  const handleDownloadQR = () => {
    const canvas = document.getElementById('retailer-batch-qr-canvas');
    if (!canvas) return;
    
    try {
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch-${selectedRetailerBatch?.batchId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      setMessage('QR Code downloaded successfully!');
    } catch (err) {
      console.error('Error downloading QR code:', err);
      setError('Failed to download QR code');
    }
  };

  // Filter functions
  const filterBatches = (batches) => {
    return batches.filter(batch => {
      const cropName = (batch.cropName || batch.crop?.name || '').toLowerCase();
      const distributorName = (batch.distributorName || batch.fromUser?.name || '').toLowerCase();
      const quality = (batch.quality || batch.storageConditions || '').toLowerCase();
      const price = batch.pricePerUnit || batch.price;
      const status = batch.status || 'AVAILABLE';

      const matchesSearch = !batchFilters.search || 
        cropName.includes(batchFilters.search.toLowerCase()) ||
        distributorName.includes(batchFilters.search.toLowerCase()) ||
        batch.batchNumber?.toLowerCase().includes(batchFilters.search.toLowerCase());

      const matchesCropType = !batchFilters.cropType || 
        cropName.includes(batchFilters.cropType.toLowerCase());

      const matchesDistributor = !batchFilters.distributor ||
        distributorName.includes(batchFilters.distributor.toLowerCase());

      const matchesQuality = !batchFilters.quality ||
        quality.includes(batchFilters.quality.toLowerCase());

      const matchesStatus = batchFilters.status === 'all' || status === batchFilters.status;

      const matchesPrice = !batchFilters.priceRange || (
        batchFilters.priceRange === 'low' && price < 50 ||
        batchFilters.priceRange === 'medium' && price >= 50 && price <= 100 ||
        batchFilters.priceRange === 'high' && price > 100
      );

      return matchesSearch && matchesCropType && matchesDistributor && matchesQuality && matchesPrice && matchesStatus;
    });
  };

  const filterDeliveries = (deliveries) => {
    return deliveries.filter(delivery => {
      const customerName = (delivery.fromUser?.name || '').toLowerCase();
      const productName = (delivery.batch?.crop?.name || delivery.cropName || '').toLowerCase();

      const matchesSearch = !deliveryFilters.search || 
        customerName.includes(deliveryFilters.search.toLowerCase()) ||
        productName.includes(deliveryFilters.search.toLowerCase());

      const matchesDeliveryStatus = deliveryFilters.deliveryStatus === 'all' ||
        delivery.deliveryStatus === deliveryFilters.deliveryStatus;

      const matchesPaymentStatus = deliveryFilters.paymentStatus === 'all' ||
        delivery.paymentStatus === deliveryFilters.paymentStatus;

      const matchesCustomer = !deliveryFilters.customer ||
        customerName.includes(deliveryFilters.customer.toLowerCase());

      return matchesSearch && matchesDeliveryStatus && matchesPaymentStatus && matchesCustomer;
    });
  };

  const filterTransactions = (transactions) => {
    return transactions.filter(transaction => {
      const productName = (transaction.batch?.crop?.name || transaction.cropName || '').toLowerCase();
      const distributorName = (transaction.fromUser?.name || '').toLowerCase();

      const matchesSearch = !transactionFilters.search || 
        productName.includes(transactionFilters.search.toLowerCase()) ||
        distributorName.includes(transactionFilters.search.toLowerCase());

      const matchesStatus = transactionFilters.status === 'all' ||
        transaction.deliveryStatus === transactionFilters.status;

      const matchesPaymentStatus = transactionFilters.paymentStatus === 'all' ||
        transaction.paymentStatus === transactionFilters.paymentStatus;

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  };

  const filterRetailerBatches = (batches) => {
    return batches.filter(batch => {
      const cropName = (batch.crop?.name || '').toLowerCase();
      const status = batch.status || 'AVAILABLE';

      const matchesSearch = !retailerBatchFilters.search || 
        cropName.includes(retailerBatchFilters.search.toLowerCase()) ||
        batch.batchNumber?.toLowerCase().includes(retailerBatchFilters.search.toLowerCase());

      const matchesCropType = !retailerBatchFilters.cropType || 
        cropName.includes(retailerBatchFilters.cropType.toLowerCase());

      const matchesStatus = retailerBatchFilters.status === 'all' || status === retailerBatchFilters.status;

      const matchesPrice = !retailerBatchFilters.priceRange || (
        retailerBatchFilters.priceRange === 'low' && batch.price < 50 ||
        retailerBatchFilters.priceRange === 'medium' && batch.price >= 50 && batch.price <= 100 ||
        retailerBatchFilters.priceRange === 'high' && batch.price > 100
      );

      return matchesSearch && matchesCropType && matchesStatus && matchesPrice;
    });
  };

  // Reset filter functions
  const resetBatchFilters = () => {
    setBatchFilters({
      search: '',
      cropType: '',
      priceRange: '',
      distributor: '',
      quality: '',
      status: 'all'
    });
  };

  const resetDeliveryFilters = () => {
    setDeliveryFilters({
      search: '',
      deliveryStatus: 'all',
      paymentStatus: 'all',
      customer: ''
    });
  };

  const resetTransactionFilters = () => {
    setTransactionFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all',
      dateRange: { start: '', end: '' }
    });
  };

  const resetRetailerBatchFilters = () => {
    setRetailerBatchFilters({
      search: '',
      cropType: '',
      priceRange: '',
      status: 'all'
    });
  };

  // Get status badge
  const getStatusBadge = (status, type = 'payment') => {
    const statusConfig = {
      payment: {
        'PAID': { color: '#0a8a3a', bgColor: '#f0fdf4', label: 'Paid' },
        'PENDING': { color: '#f59e0b', bgColor: '#fffbeb', label: 'Pending' },
        'FAILED': { color: '#ef4444', bgColor: '#fef2f2', label: 'Failed' }
      },
      delivery: {
        'DELIVERED': { color: '#0a8a3a', bgColor: '#f0fdf4', label: 'Delivered' },
        'IN_TRANSIT': { color: '#f59e0b', bgColor: '#fffbeb', label: 'In Transit' },
        'PENDING': { color: '#6b7280', bgColor: '#f9fafb', label: 'Pending' }
      }
    };
    
    const config = statusConfig[type][status] || statusConfig.payment.PENDING;
    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        color: config.color,
        backgroundColor: config.bgColor,
        border: `1px solid ${config.color}33`
      }}>
        {type === 'payment' ? 'Payment: ' : 'Delivery: '}{config.label}
      </span>
    );
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

  // Calculate statistics
  const stats = {
    availableBatches: availableBatches.length,
    customerOrders: customerOrders.length,
    pendingDeliveries: customerOrders.filter(t => t.deliveryStatus !== 'DELIVERED').length,
    totalTransactions: myTransactions.length,
    totalSpent: myTransactions
      .filter(t => t.paymentStatus === 'PAID')
      .reduce((sum, transaction) => sum + (transaction.totalAmount || 0), 0),
    totalRevenue: customerOrders
      .filter(t => t.paymentStatus === 'PAID')
      .reduce((sum, transaction) => sum + (transaction.totalAmount || 0), 0),
    retailerBatches: retailerBatches.length,
    availableRetailerBatches: retailerBatches.filter(b => b.status === 'AVAILABLE').length
  };

  // Tab Components with Enhanced UI
  const AvailableBatchesTab = () => {
    const filteredBatches = filterBatches(availableBatches);
    
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
                placeholder="Search batches by crop, distributor, batch number..."
                value={batchFilters.search}
                onChange={(e) => setBatchFilters({...batchFilters, search: e.target.value})}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.filterButtons}>
              <button 
                onClick={() => setShowBatchFilters(!showBatchFilters)}
                style={{
                  ...styles.filterButton,
                  ...(showBatchFilters && styles.filterButtonActive)
                }}
              >
                <Filter size={16} style={{marginRight: 6}} />
                Filters
                {showBatchFilters && <span style={styles.activeDot}></span>}
              </button>
              
              <button 
                onClick={resetBatchFilters}
                style={styles.resetButton}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showBatchFilters && (
            <div style={styles.advancedFilters}>
              {/* <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Crop Type</h4>
                <input
                  type="text"
                  placeholder="e.g., Tomato, Wheat"
                  value={batchFilters.cropType}
                  onChange={(e) => setBatchFilters({...batchFilters, cropType: e.target.value})}
                  style={styles.filterInput}
                />
              </div> */}

              {/* <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Distributor</h4>
                <input
                  type="text"
                  placeholder="Distributor name"
                  value={batchFilters.distributor}
                  onChange={(e) => setBatchFilters({...batchFilters, distributor: e.target.value})}
                  style={styles.filterInput}
                />
              </div> */}

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Price Range</h4>
                <select
                  value={batchFilters.priceRange}
                  onChange={(e) => setBatchFilters({...batchFilters, priceRange: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="">All Prices</option>
                  <option value="low">Low (&lt; ₹50/kg)</option>
                  <option value="medium">Medium (₹50-100/kg)</option>
                  <option value="high">High (&gt; ₹100/kg)</option>
                </select>
              </div>

              {/* <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Quality</h4>
                <input
                  type="text"
                  placeholder="e.g., Grade A"
                  value={batchFilters.quality}
                  onChange={(e) => setBatchFilters({...batchFilters, quality: e.target.value})}
                  style={styles.filterInput}
                />
              </div> */}

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Status</h4>
                <select
                  value={batchFilters.status}
                  onChange={(e) => setBatchFilters({...batchFilters, status: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="AVAILABLE">Available</option>
                  <option value="RESERVED">Reserved</option>
                  <option value="SOLD">Sold</option>
                </select>
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
                    <option value="price">Price</option>
                    <option value="quantity">Quantity</option>
                    <option value="crop">Crop Name</option>
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
              Showing {filteredBatches.length} of {availableBatches.length} batches
            </span>
          </div>
        </div>

        {/* Batches Grid */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading available batches...</p>
          </div>
        ) : filteredBatches.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Building size={48} style={{color: '#d46a00'}} />
            </div>
            <h3 style={styles.emptyTitle}>
              {batchFilters.search ? 'No matching batches found' : 'No distributor batches available'}
            </h3>
            <p style={styles.emptyText}>
              {batchFilters.search ? 'Try adjusting your search or filters' : 'Distributor batches will appear here when available'}
            </p>
            {batchFilters.search && (
              <button onClick={resetBatchFilters} style={styles.clearFiltersButton}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.batchesGrid}>
            {filteredBatches.map((batch) => (
              <div key={batch.batchId} style={styles.batchCard}>
                <div style={styles.batchHeader}>
                  <div>
                    <h3 style={styles.batchName}>{batch.cropName || batch.crop?.name || 'Product'}</h3>
                    <div style={styles.batchStatusRow}>
                      {getBatchStatusBadge(batch.status || 'AVAILABLE')}
                      <span style={styles.batchNumber}>Batch: {batch.batchNumber}</span>
                    </div>
                  </div>
                  <span style={styles.batchCrop}>{batch.distributorName || batch.fromUser?.name || 'Distributor'}</span>
                </div>
                
                <div style={styles.batchDetails}>
                  <div style={styles.batchDetail}>
                    <Package size={14} style={{color: '#6b7280', marginRight: 8}} />
                    <span style={styles.detailLabel}>Available Quantity:</span>
                    <span style={styles.detailValue}>{batch.availableQuantity || batch.quantity} kg</span>
                  </div>
                  <div style={styles.batchDetail}>
                    <TrendingUp size={14} style={{color: '#6b7280', marginRight: 8}} />
                    <span style={styles.detailLabel}>Price per kg:</span>
                    <span style={styles.detailValue}>₹{batch.pricePerUnit || batch.price}/kg</span>
                  </div>
                  <div style={styles.batchDetail}>
                    <Calendar size={14} style={{color: '#6b7280', marginRight: 8}} />
                    <span style={styles.detailLabel}>Harvest Date:</span>
                    <span style={styles.detailValue}>
                      {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                  <div style={styles.batchDetail}>
                    <span style={styles.detailLabel}>Storage:</span>
                    <span style={styles.detailValue}>{batch.storageConditions || batch.quality || 'Standard'}</span>
                  </div>
                </div>

                <div style={styles.batchActions}>
                  <button 
                    onClick={() => handlePurchaseInitiate(batch)}
                    disabled={processingPayment && processingPurchaseId === batch.batchId || (batch.status && batch.status !== 'AVAILABLE')}
                    style={{
                      ...styles.purchaseButton,
                      ...((processingPayment && processingPurchaseId === batch.batchId) && styles.buttonDisabled),
                      ...((batch.status && batch.status !== 'AVAILABLE') && styles.buttonDisabled)
                    }}
                  >
                    {processingPayment && processingPurchaseId === batch.batchId ? (
                      <>
                        <div style={styles.buttonSpinner}></div>
                        Processing...
                      </>
                    ) : (batch.status && batch.status !== 'AVAILABLE') ? (
                      'Not Available'
                    ) : (
                      <>
                        <CreditCard size={16} style={{marginRight: 8}} />
                        Purchase Now
                      </>
                    )}
                  </button>
                  {/* <button 
                    onClick={() => {
                      setSelectedBatch(batch);
                      // Show batch details modal
                    }}
                    style={styles.viewButton}
                  >
                    <Eye size={16} style={{marginRight: 8}} />
                    View Details
                  </button> */}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const DeliveryManagementTab = () => {
    const filteredDeliveries = filterDeliveries(customerOrders);
    
    return (
      <div style={styles.tabContentInner}>
        {/* Action Bar with Search and Filters */}
        <div style={styles.actionBar}>
          <div style={styles.searchFilterContainer}>
            <div style={styles.searchBox}>
              <Search size={20} style={{color: '#6b7280', marginRight: 8}} />
              <input
                type="text"
                placeholder="Search deliveries by customer, product..."
                value={deliveryFilters.search}
                onChange={(e) => setDeliveryFilters({...deliveryFilters, search: e.target.value})}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.filterButtons}>
              <button 
                onClick={() => setShowDeliveryFilters(!showDeliveryFilters)}
                style={{
                  ...styles.filterButton,
                  ...(showDeliveryFilters && styles.filterButtonActive)
                }}
              >
                <Filter size={16} style={{marginRight: 6}} />
                Filters
                {showDeliveryFilters && <span style={styles.activeDot}></span>}
              </button>
              
              <button 
                onClick={resetDeliveryFilters}
                style={styles.resetButton}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showDeliveryFilters && (
            <div style={styles.advancedFilters}>
              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Delivery Status</h4>
                <select
                  value={deliveryFilters.deliveryStatus}
                  onChange={(e) => setDeliveryFilters({...deliveryFilters, deliveryStatus: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Payment Status</h4>
                <select
                  value={deliveryFilters.paymentStatus}
                  onChange={(e) => setDeliveryFilters({...deliveryFilters, paymentStatus: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="all">All Payments</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Customer</h4>
                <input
                  type="text"
                  placeholder="Customer name"
                  value={deliveryFilters.customer}
                  onChange={(e) => setDeliveryFilters({...deliveryFilters, customer: e.target.value})}
                  style={styles.filterInput}
                />
              </div>
            </div>
          )}

          {/* Results Count */}
          <div style={styles.resultsInfo}>
            <span style={styles.resultsText}>
              Showing {filteredDeliveries.length} of {customerOrders.length} orders
            </span>
          </div>
        </div>

        {/* Delivery Statistics */}
        <div style={styles.deliveryStatsGrid}>
          <div style={styles.deliveryStatCard}>
            <div style={styles.deliveryStatIcon}>
              <Truck size={24} style={{color: '#d46a00'}} />
            </div>
            <div style={styles.deliveryStatContent}>
              <p style={styles.deliveryStatLabel}>Total Orders</p>
              <p style={styles.deliveryStatValue}>{stats.customerOrders}</p>
            </div>
          </div>

          <div style={styles.deliveryStatCard}>
            <div style={styles.deliveryStatIcon}>
              <Clock size={24} style={{color: '#f59e0b'}} />
            </div>
            <div style={styles.deliveryStatContent}>
              <p style={styles.deliveryStatLabel}>Pending Deliveries</p>
              <p style={styles.deliveryStatValue}>{stats.pendingDeliveries}</p>
            </div>
          </div>

          <div style={styles.deliveryStatCard}>
            <div style={styles.deliveryStatIcon}>
              <CheckCircle size={24} style={{color: '#0a8a3a'}} />
            </div>
            <div style={styles.deliveryStatContent}>
              <p style={styles.deliveryStatLabel}>Completed</p>
              <p style={styles.deliveryStatValue}>{stats.customerOrders - stats.pendingDeliveries}</p>
            </div>
          </div>

          <div style={styles.deliveryStatCard}>
            <div style={styles.deliveryStatIcon}>
              <CreditCard size={24} style={{color: '#a35200'}} />
            </div>
            <div style={styles.deliveryStatContent}>
              <p style={styles.deliveryStatLabel}>Total Revenue</p>
              <p style={styles.deliveryStatValue}>₹{stats.totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Customer Orders List */}
        {loadingDeliveries ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading customer orders...</p>
          </div>
        ) : filteredDeliveries.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Users size={48} style={{color: '#3b82f6'}} />
            </div>
            <h3 style={styles.emptyTitle}>
              {deliveryFilters.search ? 'No matching orders found' : 'No customer orders'}
            </h3>
            <p style={styles.emptyText}>
              {deliveryFilters.search ? 'Try adjusting your search or filters' : 'Customer orders will appear here after they make purchases from you'}
            </p>
            {deliveryFilters.search && (
              <button onClick={resetDeliveryFilters} style={styles.clearFiltersButton}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.deliveryList}>
            {filteredDeliveries.map((transaction) => (
              <div key={transaction.transactionId} style={styles.deliveryCard}>
                <div style={styles.deliveryInfo}>
                  <div style={styles.deliveryHeaderRow}>
                    <h4 style={styles.deliveryId}>Order #{transaction.transactionId}</h4>
                    {getStatusBadge(transaction.deliveryStatus, 'delivery')}
                  </div>
                  
                  <div style={styles.deliveryDetails}>
                    <div style={styles.deliveryDetail}>
                      <span style={styles.detailLabel}>Customer:</span>
                      <span style={styles.detailValue}>{transaction.fromUser?.name || 'Customer'}</span>
                    </div>
                    <div style={styles.deliveryDetail}>
                      <span style={styles.detailLabel}>Product:</span>
                      <span style={styles.detailValue}>
                        {transaction.batch?.crop?.name || transaction.cropName || 'Product'} - {transaction.quantity}kg
                      </span>
                    </div>
                    <div style={styles.deliveryDetail}>
                      <span style={styles.detailLabel}>Order Date:</span>
                      <span style={styles.detailValue}>
                        {new Date(transaction.transactionDate).toLocaleDateString()}
                      </span>
                    </div>
                    <div style={styles.deliveryDetail}>
                      <span style={styles.detailLabel}>Amount:</span>
                      <span style={styles.detailValue}>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div style={styles.paymentStatusSection}>
                    <div style={styles.paymentStatus}>
                      <span style={styles.paymentLabel}>Payment Status:</span>
                      {getStatusBadge(transaction.paymentStatus, 'payment')}
                    </div>
                  </div>
                </div>

                <div style={styles.deliveryActions}>
                  {transaction.deliveryStatus !== 'DELIVERED' && (
                    <button 
                      onClick={() => handleUpdateCustomerDeliveryStatus(transaction.transactionId, 'DELIVERED')}
                      style={styles.updateStatusButton}
                    >
                      <CheckCircle size={16} style={{marginRight: 6}} />
                      Mark Delivered
                    </button>
                  )}
                  {transaction.deliveryStatus === 'DELIVERED' && (
                    <span style={styles.completedBadge}>
                      <CheckCircle size={16} style={{marginRight: 6}} />
                      Completed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const MyTransactionsTab = () => {
    const filteredTransactions = filterTransactions(myTransactions);
    
    return (
      <div style={styles.tabContentInner}>
        {/* Action Bar with Search and Filters */}
        <div style={styles.actionBar}>
          <div style={styles.searchFilterContainer}>
            <div style={styles.searchBox}>
              <Search size={20} style={{color: '#6b7280', marginRight: 8}} />
              <input
                type="text"
                placeholder="Search transactions by product, distributor..."
                value={transactionFilters.search}
                onChange={(e) => setTransactionFilters({...transactionFilters, search: e.target.value})}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.filterButtons}>
              <button 
                onClick={() => setShowTransactionFilters(!showTransactionFilters)}
                style={{
                  ...styles.filterButton,
                  ...(showTransactionFilters && styles.filterButtonActive)
                }}
              >
                <Filter size={16} style={{marginRight: 6}} />
                Filters
                {showTransactionFilters && <span style={styles.activeDot}></span>}
              </button>
              
              <button 
                onClick={resetTransactionFilters}
                style={styles.resetButton}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showTransactionFilters && (
            <div style={styles.advancedFilters}>
              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Delivery Status</h4>
                <select
                  value={transactionFilters.status}
                  onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="all">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="IN_TRANSIT">In Transit</option>
                  <option value="DELIVERED">Delivered</option>
                </select>
              </div>

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Payment Status</h4>
                <select
                  value={transactionFilters.paymentStatus}
                  onChange={(e) => setTransactionFilters({...transactionFilters, paymentStatus: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="all">All Payments</option>
                  <option value="PAID">Paid</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Date Range</h4>
                <div style={styles.dateRangeContainer}>
                  <input
                    type="date"
                    value={transactionFilters.dateRange.start}
                    onChange={(e) => setTransactionFilters({
                      ...transactionFilters, 
                      dateRange: {...transactionFilters.dateRange, start: e.target.value}
                    })}
                    style={styles.dateInput}
                    placeholder="Start date"
                  />
                  <span style={styles.dateSeparator}>to</span>
                  <input
                    type="date"
                    value={transactionFilters.dateRange.end}
                    onChange={(e) => setTransactionFilters({
                      ...transactionFilters, 
                      dateRange: {...transactionFilters.dateRange, end: e.target.value}
                    })}
                    style={styles.dateInput}
                    placeholder="End date"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Results Count */}
          <div style={styles.resultsInfo}>
            <span style={styles.resultsText}>
              Showing {filteredTransactions.length} of {myTransactions.length} transactions
            </span>
          </div>
        </div>

        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading transactions...</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <Receipt size={48} style={{color: '#d46a00'}} />
            </div>
            <h3 style={styles.emptyTitle}>
              {transactionFilters.search ? 'No matching transactions found' : 'No transactions yet'}
            </h3>
            <p style={styles.emptyText}>
              {transactionFilters.search ? 'Try adjusting your search or filters' : 'Your purchases will appear here after you buy from distributor batches'}
            </p>
            {transactionFilters.search && (
              <button onClick={resetTransactionFilters} style={styles.clearFiltersButton}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.transactionsList}>
            {filteredTransactions.map((transaction) => (
              <div key={transaction.transactionId} style={styles.transactionCard}>
                <div style={styles.transactionIcon}>
                  <Truck size={20} style={{color: '#d46a00'}} />
                </div>
                
                <div style={styles.transactionInfo}>
                  <h4 style={styles.transactionName}>
                    {transaction.batch?.crop?.name || transaction.cropName || 'Product'} - {transaction.quantity}kg
                  </h4>
                  <p style={styles.transactionDate}>
                    {new Date(transaction.transactionDate).toLocaleDateString()} • 
                    From: {transaction.fromUser?.name || 'Distributor'}
                  </p>
                  <div style={styles.statusBadges}>
                    {getStatusBadge(transaction.paymentStatus, 'payment')}
                    {getStatusBadge(transaction.deliveryStatus, 'delivery')}
                  </div>
                </div>
                
                <div style={styles.transactionAmount}>
                  <div style={styles.amount}>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</div>
                  <div style={styles.quantity}>{transaction.quantity} kg</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // const CreateBatchesTab = () => {
  //   const filteredBatches = filterRetailerBatches(retailerBatches);
    
  //   return (
  //     <div style={styles.tabContentInner}>
  //       {/* Messages */}
  //       {message && (
  //         <div style={styles.successMessage}>
  //           <CheckCircle size={20} style={{marginRight: 8}} />
  //           <span>{message}</span>
  //         </div>
  //       )}

  //       {error && (
  //         <div style={styles.errorMessage}>
  //           <AlertCircle size={20} style={{marginRight: 8}} />
  //           <span>{error}</span>
  //         </div>
  //       )}

  //       {/* Action Bar with Search and Filters */}
  //       <div style={styles.actionBar}>
  //         <div style={styles.searchFilterContainer}>
  //           <div style={styles.searchBox}>
  //             <Search size={20} style={{color: '#6b7280', marginRight: 8}} />
  //             <input
  //               type="text"
  //               placeholder="Search your batches by crop, batch number..."
  //               value={retailerBatchFilters.search}
  //               onChange={(e) => setRetailerBatchFilters({...retailerBatchFilters, search: e.target.value})}
  //               style={styles.searchInput}
  //             />
  //           </div>
            
  //           <div style={styles.filterButtons}>
  //             <button 
  //               onClick={() => setShowRetailerBatchFilters(!showRetailerBatchFilters)}
  //               style={{
  //                 ...styles.filterButton,
  //                 ...(showRetailerBatchFilters && styles.filterButtonActive)
  //               }}
  //             >
  //               <Filter size={16} style={{marginRight: 6}} />
  //               Filters
  //               {showRetailerBatchFilters && <span style={styles.activeDot}></span>}
  //             </button>
              
  //             <button 
  //               onClick={resetRetailerBatchFilters}
  //               style={styles.resetButton}
  //             >
  //               Clear Filters
  //             </button>
              
  //             <button 
  //               onClick={handleOpenCreateBatch}
  //               style={styles.addButton}
  //             >
  //               <Plus size={20} style={{marginRight: 8}} />
  //               Create Batch
  //             </button>
  //           </div>
  //         </div>

  //         {/* Advanced Filters */}
  //         {showRetailerBatchFilters && (
  //           <div style={styles.advancedFilters}>
  //             <div style={styles.filterSection}>
  //               <h4 style={styles.filterTitle}>Crop Type</h4>
  //               <input
  //                 type="text"
  //                 placeholder="e.g., Tomato, Wheat"
  //                 value={retailerBatchFilters.cropType}
  //                 onChange={(e) => setRetailerBatchFilters({...retailerBatchFilters, cropType: e.target.value})}
  //                 style={styles.filterInput}
  //               />
  //             </div>

  //             <div style={styles.filterSection}>
  //               <h4 style={styles.filterTitle}>Price Range</h4>
  //               <select
  //                 value={retailerBatchFilters.priceRange}
  //                 onChange={(e) => setRetailerBatchFilters({...retailerBatchFilters, priceRange: e.target.value})}
  //                 style={styles.filterSelect}
  //               >
  //                 <option value="">All Prices</option>
  //                 <option value="low">Low (&lt; ₹50/kg)</option>
  //                 <option value="medium">Medium (₹50-100/kg)</option>
  //                 <option value="high">High (&gt; ₹100/kg)</option>
  //               </select>
  //             </div>

  //             <div style={styles.filterSection}>
  //               <h4 style={styles.filterTitle}>Status</h4>
  //               <select
  //                 value={retailerBatchFilters.status}
  //                 onChange={(e) => setRetailerBatchFilters({...retailerBatchFilters, status: e.target.value})}
  //                 style={styles.filterSelect}
  //               >
  //                 <option value="all">All Status</option>
  //                 <option value="AVAILABLE">Available</option>
  //                 <option value="RESERVED">Reserved</option>
  //                 <option value="SOLD">Sold</option>
  //               </select>
  //             </div>

  //             <div style={styles.filterSection}>
  //               <h4 style={styles.filterTitle}>Sort By</h4>
  //               <div style={styles.sortContainer}>
  //                 <select
  //                   value={sortBy}
  //                   onChange={(e) => setSortBy(e.target.value)}
  //                   style={styles.sortSelect}
  //                 >
  //                   <option value="harvestDate">Harvest Date</option>
  //                   <option value="price">Price</option>
  //                   <option value="quantity">Quantity</option>
  //                   <option value="crop">Crop Name</option>
  //                 </select>
  //                 <button
  //                   onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
  //                   style={styles.sortOrderButton}
  //                 >
  //                   {sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
  //                 </button>
  //               </div>
  //             </div>
  //           </div>
  //         )}

  //         {/* Results Count */}
  //         <div style={styles.resultsInfo}>
  //           <span style={styles.resultsText}>
  //             Showing {filteredBatches.length} of {retailerBatches.length} batches
  //           </span>
  //         </div>
  //       </div>

  //       {/* Batches Grid */}
  //       {loading ? (
  //         <div style={styles.loadingState}>
  //           <div style={styles.spinner}></div>
  //           <p style={styles.loadingText}>Loading your batches...</p>
  //         </div>
  //       ) : filteredBatches.length === 0 ? (
  //         <div style={styles.emptyState}>
  //           <div style={styles.emptyIcon}>
  //             <Package size={48} style={{color: '#d46a00'}} />
  //           </div>
  //           <h3 style={styles.emptyTitle}>
  //             {retailerBatchFilters.search ? 'No matching batches found' : 'No batches created yet'}
  //           </h3>
  //           <p style={styles.emptyText}>
  //             {retailerBatchFilters.search ? 'Try adjusting your search or filters' : 'Start by creating your first batch to sell to customers'}
  //           </p>
  //           {retailerBatchFilters.search ? (
  //             <button onClick={resetRetailerBatchFilters} style={styles.clearFiltersButton}>
  //               Clear All Filters
  //             </button>
  //           ) : (
  //             <button onClick={handleOpenCreateBatch} style={styles.emptyButton}>
  //               <Plus size={20} style={{marginRight: 8}} />
  //               Create First Batch
  //             </button>
  //           )}
  //         </div>
  //       ) : (
  //         <div style={styles.batchesGrid}>
  //           {filteredBatches.map((batch) => (
  //             <div key={batch.batchId} style={styles.batchCard}>
  //               <div style={styles.batchHeader}>
  //                 <div>
  //                   <h3 style={styles.batchName}>{batch.crop?.name || 'Product'}</h3>
  //                   <div style={styles.batchStatusRow}>
  //                     {getBatchStatusBadge(batch.status || 'AVAILABLE')}
  //                     <span style={styles.batchNumber}>Batch: {batch.batchNumber}</span>
  //                   </div>
  //                 </div>
  //                 <span style={styles.batchCrop}>Your Batch</span>
  //               </div>
                
  //               <div style={styles.batchDetails}>
  //                 <div style={styles.batchDetail}>
  //                   <Package size={14} style={{color: '#6b7280', marginRight: 8}} />
  //                   <span style={styles.detailLabel}>Available Quantity:</span>
  //                   <span style={styles.detailValue}>{batch.availableQuantity || batch.quantity} {batch.unit}</span>
  //                 </div>
  //                 <div style={styles.batchDetail}>
  //                   <TrendingUp size={14} style={{color: '#6b7280', marginRight: 8}} />
  //                   <span style={styles.detailLabel}>Price:</span>
  //                   <span style={styles.detailValue}>₹{batch.price}</span>
  //                 </div>
  //                 <div style={styles.batchDetail}>
  //                   <Calendar size={14} style={{color: '#6b7280', marginRight: 8}} />
  //                   <span style={styles.detailLabel}>Harvest Date:</span>
  //                   <span style={styles.detailValue}>
  //                     {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A'}
  //                   </span>
  //                 </div>
  //                 {batch.storageConditions && (
  //                   <div style={styles.batchDetail}>
  //                     <span style={styles.detailLabel}>Storage:</span>
  //                     <span style={styles.detailValue}>{batch.storageConditions}</span>
  //                   </div>
  //                 )}
  //               </div>

  //               <div style={styles.batchActions}>
  //                 <button 
  //                   onClick={() => handleEditRetailerBatch(batch)}
  //                   style={styles.editButton}
  //                 >
  //                   <Edit size={14} style={{marginRight: 4}} />
  //                   Edit
  //                 </button>
  //                 <button 
  //                   onClick={() => {
  //                     setSelectedRetailerBatch(batch);
  //                     setShowQRModal(true);
  //                   }}
  //                   style={styles.qrButton}
  //                 >
  //                   <QrCode size={14} style={{marginRight: 4}} />
  //                   QR Code
  //                 </button>
  //                 <button 
  //                   onClick={() => handleDeleteRetailerBatch(batch.batchId)}
  //                   style={styles.deleteButton}
  //                 >
  //                   <Trash2 size={14} style={{marginRight: 4}} />
  //                   Delete
  //                 </button>
  //               </div>
  //             </div>
  //           ))}
  //         </div>
  //       )}
  //     </div>
  //   );
  // };

  const SettingsTab = () => (
    <div style={styles.tabContentInner}>
      <div style={styles.settingsGrid}>
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>Profile Information</h3>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Store Name</label>
            <input 
              type="text" 
              style={styles.settingsInput}
              defaultValue={currentUser?.companyName || ''}
              placeholder="Enter store name"
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
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Store Location</label>
            <input 
              type="text" 
              style={styles.settingsInput}
              placeholder="Enter store location"
            />
          </div>
          <button style={styles.saveButton}>Save Changes</button>
        </div>

        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>Business Settings</h3>
          <div style={styles.settingsItem}>
            <label style={styles.settingsCheckbox}>
              <input type="checkbox" defaultChecked />
              Enable email notifications for new orders
            </label>
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsCheckbox}>
              <input type="checkbox" defaultChecked />
              Auto-update inventory after sales
            </label>
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsCheckbox}>
              <input type="checkbox" />
              Low stock alerts
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
                  <Store size={24} style={{color: 'white'}} />
                </div>
                <div>
                  <h1 style={styles.headerTitle}>Retailer Dashboard</h1>
                  <p style={styles.headerSubtitle}>Buy from distributors, create batches, and manage customer orders</p>
                </div>
              </div>
              <div style={styles.headerRight}>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{currentUser?.name || 'Retailer'}</p>
                  <p style={styles.userRole}>Retailer Account</p>
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
                <Building size={24} style={{color: '#d46a00'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Available Batches</p>
                <p style={styles.statValue}>{stats.availableBatches}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Users size={24} style={{color: '#a35200'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Customer Orders</p>
                <p style={styles.statValue}>{stats.customerOrders}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Package size={24} style={{color: '#d46a00'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>My Batches</p>
                <p style={styles.statValue}>{stats.retailerBatches}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <CreditCard size={24} style={{color: '#a35200'}} />
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
                { id: 'available-batches', label: 'Available Batches', icon: Building },
                { id: 'my-transactions', label: 'My Transactions', icon: Receipt },
                { id: 'create-batches', label: 'Create Batches', icon: Package },
                { id: 'delivery-management', label: 'Delivery Management', icon: Truck },
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

        {/* Tab Content */}
        <div style={styles.tabContent}>
          {activeTab === 'available-batches' && <AvailableBatchesTab />}
          {activeTab === 'create-batches' && <CreateBatchesTab key={refreshTrigger} />}
          {activeTab === 'delivery-management' && <DeliveryManagementTab />}
          {activeTab === 'my-transactions' && <MyTransactionsTab />}
          {/* {activeTab === 'settings' && <SettingsTab />} */}
        </div>

        {/* Quantity Selection Modal */}
        {showQuantityModal && selectedBatch && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Purchase {selectedBatch.cropName || selectedBatch.crop?.name}</h3>
                <button 
                  onClick={() => {
                    setShowQuantityModal(false);
                    setSelectedBatch(null);
                    setPurchaseQuantity('');
                  }}
                  style={styles.closeButton}
                >
                  <X size={20} />
                </button>
              </div>
              <div style={styles.modalContent}>
                <div style={styles.purchaseInfo}>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Batch Number:</span>
                    <span style={styles.purchaseValue}>{selectedBatch.batchNumber}</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Available Quantity:</span>
                    <span style={styles.purchaseValue}>{selectedBatch.availableQuantity || selectedBatch.quantity} kg</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Price per kg:</span>
                    <span style={styles.purchaseValue}>₹{selectedBatch.pricePerUnit || selectedBatch.price}</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Distributor:</span>
                    <span style={styles.purchaseValue}>{selectedBatch.distributorName || selectedBatch.fromUser?.name || 'Distributor'}</span>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Quantity to Purchase (kg) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={selectedBatch.availableQuantity || selectedBatch.quantity}
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
                      <span>₹{((selectedBatch.pricePerUnit || selectedBatch.price) * purchaseQuantity).toFixed(2)}</span>
                    </div>
                    <div style={styles.amountTotal}>
                      <span>Total Amount:</span>
                      <span>₹{((selectedBatch.pricePerUnit || selectedBatch.price) * purchaseQuantity).toFixed(2)}</span>
                    </div>
                  </div>
                )}

                <div style={styles.modalActions}>
                  <button 
                    onClick={() => {
                      setShowQuantityModal(false);
                      setSelectedBatch(null);
                      setPurchaseQuantity('');
                    }}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={processPurchasePayment}
                    disabled={!purchaseQuantity || processingPayment}
                    style={{
                      ...styles.submitButton,
                      ...((!purchaseQuantity || processingPayment) && styles.submitButtonDisabled)
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

        {/* Create Batch Modal */}
        {showCreateBatchModal && (
          <div style={styles.modalOverlay} onClick={() => setShowCreateBatchModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Create New Batch</h2>
                <button onClick={() => setShowCreateBatchModal(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateRetailerBatch} style={styles.modalContent}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Batch Number *</label>
                    <input
                      type="text"
                      value={batchFormData.batchNumber}
                      onChange={(e) => setBatchFormData({...batchFormData, batchNumber: e.target.value})}
                      style={styles.input}
                      required
                      placeholder="e.g., RETAIL-BATCH-001"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Crop Name *</label>
                    <input
                      type="text"
                      value={batchFormData.cropName}
                      onChange={(e) => setBatchFormData({...batchFormData, cropName: e.target.value})}
                      style={styles.input}
                      required
                      placeholder="e.g., Tomatoes, Potatoes"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Harvest Date</label>
                    <input
                      type="date"
                      value={batchFormData.harvestDate}
                      onChange={(e) => setBatchFormData({...batchFormData, harvestDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Total Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={batchFormData.quantity}
                      onChange={(e) => setBatchFormData({...batchFormData, quantity: e.target.value})}
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
                      value={batchFormData.availableQuantity}
                      onChange={(e) => setBatchFormData({...batchFormData, availableQuantity: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Unit *</label>
                    <select
                      value={batchFormData.unit}
                      onChange={(e) => setBatchFormData({...batchFormData, unit: e.target.value})}
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
                    <label style={styles.label}>Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={batchFormData.price}
                      onChange={(e) => setBatchFormData({...batchFormData, price: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Price per Unit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={batchFormData.pricePerUnit}
                      onChange={(e) => setBatchFormData({...batchFormData, pricePerUnit: e.target.value})}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status *</label>
                    <select
                      value={batchFormData.status}
                      onChange={(e) => setBatchFormData({...batchFormData, status: e.target.value})}
                      style={styles.input}
                      required
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="SOLD">Sold</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Storage Conditions</label>
                  <textarea
                    value={batchFormData.storageConditions}
                    onChange={(e) => setBatchFormData({...batchFormData, storageConditions: e.target.value})}
                    style={styles.textarea}
                    rows={3}
                    placeholder="e.g., Cool dry place, Temperature controlled..."
                  />
                </div>

                <div style={styles.modalActions}>
                  <button 
                    type="button"
                    onClick={() => setShowCreateBatchModal(false)}
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
        {showEditBatchModal && selectedRetailerBatch && (
          <div style={styles.modalOverlay} onClick={() => setShowEditBatchModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Edit Batch</h2>
                <button onClick={() => setShowEditBatchModal(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleUpdateRetailerBatch} style={styles.modalContent}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Batch Number *</label>
                    <input
                      type="text"
                      value={batchFormData.batchNumber}
                      onChange={(e) => setBatchFormData({...batchFormData, batchNumber: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Crop Name</label>
                    <input
                      type="text"
                      value={batchFormData.cropName}
                      style={{...styles.input, background: '#f9fafb'}}
                      disabled
                      placeholder="Crop cannot be changed"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Harvest Date</label>
                    <input
                      type="date"
                      value={batchFormData.harvestDate}
                      onChange={(e) => setBatchFormData({...batchFormData, harvestDate: e.target.value})}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Total Quantity *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={batchFormData.quantity}
                      onChange={(e) => setBatchFormData({...batchFormData, quantity: e.target.value})}
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
                      value={batchFormData.availableQuantity}
                      onChange={(e) => setBatchFormData({...batchFormData, availableQuantity: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Unit *</label>
                    <select
                      value={batchFormData.unit}
                      onChange={(e) => setBatchFormData({...batchFormData, unit: e.target.value})}
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
                    <label style={styles.label}>Price (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={batchFormData.price}
                      onChange={(e) => setBatchFormData({...batchFormData, price: e.target.value})}
                      style={styles.input}
                      required
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Price per Unit (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={batchFormData.pricePerUnit}
                      onChange={(e) => setBatchFormData({...batchFormData, pricePerUnit: e.target.value})}
                      style={styles.input}
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Status *</label>
                    <select
                      value={batchFormData.status}
                      onChange={(e) => setBatchFormData({...batchFormData, status: e.target.value})}
                      style={styles.input}
                      required
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RESERVED">Reserved</option>
                      <option value="SOLD">Sold</option>
                    </select>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Storage Conditions</label>
                  <textarea
                    value={batchFormData.storageConditions}
                    onChange={(e) => setBatchFormData({...batchFormData, storageConditions: e.target.value})}
                    style={styles.textarea}
                    rows={3}
                    placeholder="e.g., Cool dry place, Temperature controlled..."
                  />
                </div>

                <div style={styles.modalActions}>
                  <button 
                    type="button"
                    onClick={() => setShowEditBatchModal(false)}
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

        {/* QR Code Modal */}
        {showQRModal && selectedRetailerBatch && (
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
                  <h4 style={styles.qrBatchNumber}>{selectedRetailerBatch.batchNumber}</h4>
                  {getBatchStatusBadge(selectedRetailerBatch.status)}
                  <p style={styles.qrCropName}>{selectedRetailerBatch.crop?.name}</p>
                  <div style={styles.qrDetails}>
                    <span>Quantity: {selectedRetailerBatch.quantity} {selectedRetailerBatch.unit}</span>
                    <span>Available: {selectedRetailerBatch.availableQuantity} {selectedRetailerBatch.unit}</span>
                    <span>Price: ₹{selectedRetailerBatch.price}</span>
                  </div>
                </div>

                <div style={styles.qrCodeContainer}>
                  <QRCodeCanvas
                    id="retailer-batch-qr-canvas"
                    value={JSON.stringify({
                      batchId: selectedRetailerBatch.batchId,
                      batchNumber: selectedRetailerBatch.batchNumber,
                      crop: selectedRetailerBatch.crop?.name,
                      quantity: selectedRetailerBatch.quantity,
                      unit: selectedRetailerBatch.unit,
                      price: selectedRetailerBatch.price,
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
    </div>
  );
};

// Enhanced CSS Styles with Create Batches UI
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    padding: '20px'
  },
  content: {
    maxWidth: '1400px',
    margin: '0 auto',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden'
  },
  
  // Header Styles
  headerCard: {
    background: 'white',
    marginBottom: '0'
  },
  headerBackground: {
    background: 'linear-gradient(135deg, #d46a00 0%, #a35200 100%)',
    padding: '24px',
    borderRadius: '12px 12px 0 0'
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
    background: '#fef6e9',
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
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#d46a00',
    margin: 0
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
  // Add to your styles object:
tabsHeader: {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%'
},
refreshButton: {
  padding: '10px 16px',
  background: 'linear-gradient(135deg, #d46a00 0%, #a35200 100%)',
  border: '1px solid #d1d5db',
  borderRadius: '8px',
  color: 'white',
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
  tabActive: {
    background: 'linear-gradient(135deg, #d46a00 0%, #a35200 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 4px rgba(212, 106, 0, 0.2)'
  },

  // Tab Content
  tabContent: {
    background: 'white',
    minHeight: '500px'
  },
  tabContentInner: {
    padding: '24px'
  },

  // Action Bar Styles (Enhanced from Distributor Create Batches)
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
    minWidth: '400px'
  },
  searchInput: {
    border: 'none',
    background: 'transparent',
    outline: 'none',
    fontSize: '14px',
    width: '100%',
    color: '#374151'
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
    background: '#d46a00',
    color: 'white',
    borderColor: '#d46a00'
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
    background: 'linear-gradient(135deg, #d46a00 0%, #a35200 100%)',
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
    boxShadow: '0 2px 4px rgba(212, 106, 0, 0.2)'
  },
  activeDot: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    width: '6px',
    height: '6px',
    background: '#ef4444',
    borderRadius: '50%'
  },

  // Advanced Filters
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
  filterInput: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s ease'
  },
  filterSelect: {
    padding: '8px 12px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    background: 'white',
    cursor: 'pointer'
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

  // Results Info
  resultsInfo: {
    textAlign: 'right',
    marginBottom: '16px'
  },
  resultsText: {
    fontSize: '14px',
    color: '#6b7280'
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
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px'
  },
  batchName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  batchStatusRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '8px'
  },
  batchNumber: {
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'monospace'
  },
  batchCrop: {
    background: '#f0f9ff',
    color: '#d46a00',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  batchDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  batchDetail: {
    display: 'flex',
    alignItems: 'center',
    padding: '4px 0'
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500',
    marginRight: '8px',
    minWidth: '120px'
  },
  detailValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600'
  },

  // Batch Actions
  batchActions: {
    display: 'flex',
    gap: '8px'
  },
  purchaseButton: {
    padding: '12px 16px',
    background: '#d46a00',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'background-color 0.2s ease',
    flex: 1,
    justifyContent: 'center'
  },
  viewButton: {
    padding: '12px 16px',
    background: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    flex: 1,
    justifyContent: 'center'
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
    transition: 'all 0.2s ease',
    flex: 1
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
    transition: 'all 0.2s ease',
    flex: 1
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
    transition: 'all 0.2s ease',
    flex: 1
  },

  // Delivery Management Styles
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
    background: '#fef6e9',
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
    color: '#d46a00',
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
  deliveryActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginLeft: '16px'
  },
  updateStatusButton: {
    padding: '10px 16px',
    background: '#0a8a3a',
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
  completedBadge: {
    padding: '10px 16px',
    background: '#f0fdf4',
    color: '#0a8a3a',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    minWidth: '140px'
  },

  // Transactions
  transactionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  transactionCard: {
    display: 'flex',
    alignItems: 'center',
    padding: '20px',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  transactionIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    background: '#fef6e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '20px',
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
    marginRight: '20px'
  },
  amount: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#d46a00',
    margin: '0 0 4px 0'
  },
  quantity: {
    fontSize: '14px',
    color: '#6b7280'
  },
  statusBadges: {
    display: 'flex',
    gap: '8px',
    marginTop: '8px'
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
    background: '#d46a00',
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
    zIndex: 1000,
    padding: '20px'
  },
  modal: {
    background: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '800px',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  qrModal: {
    background: 'white',
    borderRadius: '12px',
    width: '100%',
    maxWidth: '400px',
    maxHeight: '90vh',
    overflow: 'auto'
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
    color: '#1f2937',
    margin: 0
  },
  closeButton: {
    background: 'none',
    border: 'none',
    color: '#6b7280',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px'
  },
  modalContent: {
    padding: '24px'
  },

  // Form Styles
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
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
    marginBottom: '6px',
    display: 'block'
  },
  input: {
    padding: '10px 12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    transition: 'border-color 0.2s ease',
    outline: 'none',
    boxSizing: 'border-box'
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
    background: '#d46a00',
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
    background: '#fef6e9',
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
    color: '#d46a00'
  },

  // QR Code Styles
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
    fontSize: '16px',
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
    padding: '12px 24px',
    background: '#d46a00',
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

  // Common Components
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    color: '#6b7280',
    fontSize: '16px',
    gap: '16px'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #d46a00',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    margin: 0
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
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    background: '#fef6e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  emptyTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  emptyText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    maxWidth: '300px',
    lineHeight: '1.5'
  },
  emptyButton: {
    padding: '10px 20px',
    background: '#d46a00',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center'
  },
  clearFiltersButton: {
    padding: '10px 20px',
    background: '#d46a00',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '16px'
  },

  // Messages
  successMessage: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#f0fdf4',
    color: '#166534',
    border: '1px solid #bbf7d0',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'center',
    padding: '12px 16px',
    background: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '500'
  },

  // Button States
  buttonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid transparent',
    borderTop: '2px solid currentColor',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginRight: '8px'
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

export default RetailerDashboard;