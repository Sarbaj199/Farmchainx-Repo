// src/pages/CustomerDashboard.jsx
import React, { useState, useEffect, useCallback , useRef } from 'react';
import { 
  ShoppingBag, Package, History, Star, User, LogOut, 
  Search, Filter, ArrowUp, ArrowDown, X, Eye,
  CheckCircle, AlertCircle, CreditCard, Truck, Calendar,
  ShoppingCart, Store, Clock, RefreshCw, QrCode, Download, Camera
} from 'lucide-react';
import jsQR from 'jsqr';

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('available-products');
  const [availableBatches, setAvailableBatches] = useState([]);
  const [myTransactions, setMyTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [processingPurchaseId, setProcessingPurchaseId] = useState(null);
  
  // Quantity Modal States
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [purchaseQuantity, setPurchaseQuantity] = useState('');
  
  // Review Modal States
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [selectedTransactionForReview, setSelectedTransactionForReview] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({
    rating: 5,
    comment: ''
  });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  
  // Product Details Modal
  const [showProductDetails, setShowProductDetails] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // QR Scanner States
  const [scannedQRData, setScannedQRData] = useState(null);
  const [qrScanError, setQrScanError] = useState('');
  const [qrImageData, setQrImageData] = useState(null);

  // User Reviews State
  const [userReviews, setUserReviews] = useState([]);

  // Filter states
  const [productFilters, setProductFilters] = useState({
    search: '',
    cropType: '',
    priceRange: '',
    retailer: '',
    quality: ''
  });

  const [transactionFilters, setTransactionFilters] = useState({
    search: '',
    status: 'all',
    paymentStatus: 'all'
  });

  // UI states
  const [showProductFilters, setShowProductFilters] = useState(false);
  const [showTransactionFilters, setShowTransactionFilters] = useState(false);
  const [sortBy, setSortBy] = useState('price');
  const [sortOrder, setSortOrder] = useState('asc');

  const BASE_URL = 'http://localhost:8080';
  const RAZORPAY_KEY_ID = 'rzp_test_Ri3ACL3H3N4yNW';

  // Enhanced auth token retrieval
  const getAuthToken = () => {
    try {
      const token = 
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('token') ||
        sessionStorage.getItem('authToken');

      if (!token) {
        console.error('❌ No token found in storage');
        throw new Error('No authentication token found. Please login again.');
      }

      const cleanToken = token.replace(/^Bearer\s+/i, '');
      return cleanToken;
    } catch (error) {
      console.error('Token retrieval error:', error);
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      throw error;
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  // Enhanced refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      if (activeTab === 'available-products') {
        await fetchAvailableBatches();
      } else if (activeTab === 'my-transactions') {
        await fetchMyTransactions();
      }
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
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
      console.error('Error fetching user:', error);
      return null;
    }
  };

  // Fetch user's reviews
  // Fetch user's reviews - updated to use transaction-based approach
const fetchUserReviews = async () => {
  try {
    const userId = getCurrentUserId();
    const token = getAuthToken();
    
    // Get all reviews and filter by current user
    const response = await fetch(`${BASE_URL}/reviews`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const allReviews = await response.json();
      // Filter reviews where the reviewer is the current user
      const userReviews = allReviews.filter(review => 
        review.reviewerName === currentUser?.name || 
        (review.user && review.user.id === userId)
      );
      setUserReviews(userReviews);
      return userReviews;
    }
    return [];
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    return [];
  }
};

  // Check if user has already reviewed a product
  const hasUserReviewedProduct = (cropId) => {
    return userReviews.some(review => review.crop?.cropId === cropId);
  };
  // Check if user has already reviewed a specific transaction
const hasUserReviewedTransaction = async (transactionId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const review = await response.json();
      return !!review; // Returns true if review exists, false otherwise
    }
    return false;
  } catch (err) {
    console.error('Error checking if transaction reviewed:', err);
    return false;
  }
};

  // Check if user can review a transaction
  // const canUserReviewTransaction = (transaction) => {
  //   // Check if transaction is delivered
  //   if (transaction.deliveryStatus !== 'DELIVERED') {
  //     return false;
  //   }
    
  //   const cropId = transaction.batch?.crop?.cropId;
  //   if (!cropId) {
  //     return false;
  //   }
    
  //   // Check if user has already reviewed this product
  //   return !hasUserReviewedProduct(cropId);
  // };
  // Check if user can review a transaction using backend validation
// Enhanced canUserReviewTransaction with fallback
// Check if user can review a transaction
  // Enhanced canUserReviewTransaction with better error handling
const canUserReviewTransaction = async (transaction) => {
  try {
    console.log('Checking review eligibility for transaction:', transaction.transactionId);
    
    // Basic frontend checks first
    if (transaction.deliveryStatus !== 'DELIVERED') {
      console.log('Transaction not delivered:', transaction.deliveryStatus);
      return false;
    }

    const token = getAuthToken();
    const transactionId = transaction.transactionId;

    // First, check if review already exists
    const reviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (reviewResponse.ok) {
      const reviewData = await reviewResponse.json();
      // Check if we got a valid review object or empty response
      if (reviewData && Object.keys(reviewData).length > 0) {
        console.log('Review already exists for transaction:', transactionId);
        return false;
      }
    }

    // Then check if transaction can be reviewed
    const canReviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}/can-review`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (canReviewResponse.ok) {
      const canReview = await canReviewResponse.json();
      console.log('Can review transaction:', canReview);
      return canReview;
    } else {
      console.log('Failed to check review eligibility');
      return false;
    }

  } catch (err) {
    console.error('Error checking review eligibility:', err);
    return false;
  }
};
// Frontend-only validation as fallback
const canUserReviewTransactionFrontend = async (transaction) => {
  try {
    // Check if transaction is delivered
    if (transaction.deliveryStatus !== 'DELIVERED') {
      return false;
    }

    const cropId = transaction.batch?.crop?.cropId;
    if (!cropId) {
      return false;
    }

    // Check if user has already reviewed this product using the legacy approach
    const token = getAuthToken();
    const userId = getCurrentUserId();

    // Get all reviews for this crop and check if user has reviewed
    const reviewsResponse = await fetch(`${BASE_URL}/reviews/crop/${cropId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (reviewsResponse.ok) {
      const cropReviews = await reviewsResponse.json();
      const userHasReviewed = cropReviews.some(review => 
        review.user?.id === userId || 
        review.reviewerName === currentUser?.name
      );
      
      return !userHasReviewed;
    }

    return true; // Default to allowing review if we can't check
  } catch (err) {
    console.error('Frontend validation error:', err);
    return true; // Default to allowing review on error
  }
};
  // QR Code Functions
  const generateQRCodeData = (batch) => {
    const qrData = {
      cropId: batch.crop?.cropId,
      name: batch.crop?.name,
      variety: batch.crop?.variety,
      season: batch.crop?.season,
      growingPeriod: batch.crop?.growingPeriod,
      description: batch.crop?.description,
      pricePerKg: batch.pricePerUnit,
      quantityAvailable: batch.availableQuantity || batch.quantity,
      harvestDate: batch.harvestDate,
      imageUrl: batch.crop?.imageUrl,
      farmerId: batch.user?.id,
      batchId: batch.batchId,
      retailer: batch.user?.name,
      timestamp: new Date().toISOString()
    };
    return JSON.stringify(qrData, null, 2);
  };
  // Update the downloadQRCode function to use the backend QR image
const downloadQRCode = async (batch) => {
  try {
    const token = getAuthToken();
    
    // Fetch crop details to get the QR code
    const response = await fetch(`${BASE_URL}/crop/${batch.crop?.cropId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const cropData = await response.json();
      
      if (cropData.qrCodeBase64) {
        // Create download link for QR image
        const a = document.createElement('a');
        a.href = cropData.qrCodeBase64;
        a.download = `qr-code-${batch.batchId}-${batch.crop?.name || 'product'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setMessage('QR code image downloaded successfully!');
      } else {
        setError('QR code not available for this product');
      }
    } else {
      throw new Error('Failed to fetch crop details');
    }
  } catch (error) {
    console.error('Error downloading QR code:', error);
    setError('Failed to download QR code image');
  }
};
// Update the processQRImage function with a more robust approach
const processQRImage = (file) => {
  return new Promise((resolve, reject) => {
    // Check if jsQR is available
    if (typeof jsQR === 'undefined') {
      reject(new Error('QR scanning library not available. Please try uploading a JSON file instead.'));
      return;
    }

    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const img = new Image();
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              reject(new Error('Could not create canvas context'));
              return;
            }

            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Use jsQR to decode the QR code
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            
            if (code) {
              console.log('QR Code detected:', code.data);
              
              try {
                const qrData = JSON.parse(code.data);
                console.log('Parsed QR data:', qrData);
                
                if (!qrData.cropId) {
                  throw new Error('QR code does not contain cropId');
                }
                
                resolve(qrData);
              } catch (parseError) {
                console.error('Error parsing QR JSON:', parseError);
                reject(new Error('Invalid QR code format. Expected JSON with cropId.'));
              }
            } else {
              reject(new Error('No QR code found in the image. Please ensure the QR code is clear and well-lit.'));
            }
          } catch (error) {
            reject(error);
          }
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = e.target.result;
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsDataURL(file);
  });
};
const processQRJSON = async (file) => {
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target.result;
        const qrData = JSON.parse(content);
        
        if (qrData.cropId) {
          // Fetch complete crop details using cropId
          await fetchCompleteCropDetails(qrData.cropId);
          setMessage('QR code scanned successfully!');
        } else {
          throw new Error('Invalid QR code format - missing cropId');
        }
      } catch (error) {
        setQrScanError('Failed to read QR code: ' + error.message);
        setScannedQRData(null);
        setQrImageData(null);
      }
    };
    reader.readAsText(file);
  } catch (error) {
    setQrScanError('Error reading file: ' + error.message);
  }
};
const fetchCompleteCropDetails = async (cropId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/crop/${cropId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const cropData = await response.json();
      
      // Set the actual crop image from backend
      setQrImageData(cropData.imageUrl);
      
      // Set scanned data with complete crop information from backend
      setScannedQRData({
        cropId: cropData.cropId,
        name: cropData.name,
        variety: cropData.variety,
        season: cropData.season,
        growingPeriod: cropData.growingPeriod,
        description: cropData.description,
        pricePerKg: cropData.pricePerKg,
        quantityAvailable: cropData.quantityAvailable,
        harvestDate: cropData.harvestDate,
        imageUrl: cropData.imageUrl,
        farmer: cropData.farmer,
        qrCodeBase64: cropData.qrCodeBase64
      });
      
      console.log('Crop details loaded:', cropData);
    } else {
      throw new Error('Failed to fetch crop details from server');
    }
  } catch (err) {
    console.error('Error fetching crop details:', err);
    setQrScanError('Failed to load product details: ' + err.message);
  }
};
// Update the main handleQRScan function
const handleQRScan = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  try {
    setLoading(true);
    setQrScanError('');

    let qrData;

    if (file.type.startsWith('image/')) {
      try {
        // Use client-side QR decoding
        qrData = await processQRImage(file);
      } catch (qrError) {
        // If QR decoding fails, suggest using JSON file
        throw new Error(`${qrError.message} Alternatively, you can upload a JSON file with the crop data.`);
      }
    } else if (file.type === 'application/json') {
      // Process JSON file directly
      qrData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target.result);
            if (!data.cropId) {
              reject(new Error('JSON file must contain cropId'));
            }
            resolve(data);
          } catch (error) {
            reject(new Error('Invalid JSON format: ' + error.message));
          }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
      });
    } else {
      throw new Error('Please upload an image (PNG, JPEG) containing a QR code, or a JSON file with crop data');
    }

    // Fetch complete crop details using cropId from QR
    if (qrData && qrData.cropId) {
      await fetchCompleteCropDetails(qrData.cropId);
      setMessage('QR code scanned successfully! Product information loaded.');
    } else {
      throw new Error('QR code does not contain valid crop information');
    }

  } catch (error) {
    console.error('QR processing error:', error);
    setQrScanError(error.message);
    setScannedQRData(null);
    setQrImageData(null);
  } finally {
    setLoading(false);
    // Reset file input
    if (event.target) {
      event.target.value = '';
    }
  }
};

  // Fetch crop image by cropId
  const fetchCropImage = async (cropId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/crops/${cropId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const cropData = await response.json();
        setQrImageData(cropData.imageUrl);
      } else {
        console.warn('Could not fetch crop image data');
        setQrImageData(null);
      }
    } catch (err) {
      console.error('Error fetching crop image:', err);
      setQrImageData(null);
    }
  };

  const clearScannedQR = () => {
    setScannedQRData(null);
    setQrScanError('');
    setQrImageData(null);
  };

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          setCurrentUser(user);
        }
      } catch (error) {
        console.error('❌ User initialization failed:', error);
        setError('Failed to load user data. Please login again.');
      }
    };
    initializeUser();
  }, []);

  // Fetch available batches from retailers
  const fetchAvailableBatches = async () => {
    try {
      setLoading(true);
      setError('');
      const token = getAuthToken();

      const endpoints = [
        `${BASE_URL}/batches/available/role/RETAILER`
      ];

      let data = [];
      let lastError = '';

      for (const endpoint of endpoints) {
        try {
          const response = await fetch(endpoint, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            }
          });

          if (response.ok) {
            data = await response.json();
            break;
          } else {
            const errorText = await response.text();
            lastError = `Endpoint ${endpoint}: ${response.status} - ${errorText}`;
          }
        } catch (err) {
          lastError = `Endpoint ${endpoint}: ${err.message}`;
        }
      }

      if (data.length === 0 && lastError) {
        throw new Error(lastError);
      }

      const availableBatches = data.filter(batch => 
        batch.status === 'AVAILABLE' && 
        batch.createdByRole === 'RETAILER'
      );

      setAvailableBatches(availableBatches);

    } catch (err) {
      console.error('❌ Error fetching available products:', err);
      
      if (err.message.includes('403')) {
        setError('Access forbidden. Your user role may not have permission to view products. Please contact administrator.');
      } else if (err.message.includes('401')) {
        setError('Authentication failed. Please login again.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Network error. Please check your connection and CORS settings.');
      } else {
        setError(`Failed to load products: ${err.message}`);
      }
      
      setAvailableBatches([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch customer's transactions
  const fetchMyTransactions = async () => {
    try {
      setLoading(true);
      const customerId = getCurrentUserId();
      const token = getAuthToken();

      const response = await fetch(`${BASE_URL}/transactions/to/${customerId}`, {
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

  // Fetch reviews for a crop
  const fetchCropReviews = async (cropId) => {
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/reviews/crop/${cropId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return await response.json();
      }
      return [];
    } catch (err) {
      console.error('Error fetching reviews:', err);
      return [];
    }
  };

  // Fetch data when tab changes
  useEffect(() => {
    if (!currentUser) return;

    if (activeTab === 'available-products') {
      fetchAvailableBatches();
    } else if (activeTab === 'my-transactions') {
      fetchMyTransactions();
      fetchUserReviews();
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
        description: `Purchase from ${selectedBatch.user?.name || 'Retailer'} - ${purchaseQuantity}kg ${selectedBatch.crop?.name || 'Product'}`,
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
                fromUserId: toUserId,
                toUserId: currentUserId,
                quantity: parseFloat(purchaseQuantity),
                pricePerUnit: selectedBatch.pricePerUnit,
                unit: selectedBatch.unit || 'kg',
                remarks: `Purchase from retailer - ${selectedBatch.crop?.name}`,
                transactionType: 'RETAILER_TO_CUSTOMER',
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
          name: currentUser?.name || 'Customer',
          email: currentUser?.email || 'customer@example.com',
          contact: currentUser?.phone || '9999999999'
        },
        theme: {
          color: '#7c3aed'
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

  // Handle review submission using transaction-based approach
// Enhanced handleSubmitReview with better error handling
const handleSubmitReview = async (e) => {
  e.preventDefault();
  if (!selectedTransactionForReview) return;

  try {
    setIsSubmittingReview(true);
    setError('');
    
    const token = getAuthToken();
    const transactionId = selectedTransactionForReview.transactionId;
    const cropId = selectedTransactionForReview.batch?.crop?.cropId;

    console.log('Submitting review for transaction:', transactionId);

    const reviewData = {
      rating: parseInt(reviewFormData.rating),
      comment: reviewFormData.comment.trim(),
      reviewerName: currentUser?.name || 'Customer'
    };

    // Try the transaction-based endpoint
    let response = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reviewData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Transaction endpoint failed, trying crop endpoint...');
      
      // Fallback to crop-based endpoint
      if (cropId) {
        const userId = getCurrentUserId();
        response = await fetch(`${BASE_URL}/reviews/crop/${cropId}/user/${userId}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(reviewData)
        });
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to submit review: ${errorText}`);
    }

    const savedReview = await response.json();
    console.log('Review submitted successfully:', savedReview);

    setMessage('✅ Review submitted successfully!');
    setShowReviewModal(false);
    setSelectedTransactionForReview(null);
    setReviewFormData({ rating: 5, comment: '' });
    
    // Refresh the data
    await fetchMyTransactions();

  } catch (err) {
    console.error('Error submitting review:', err);
    setError(err.message || 'Failed to submit review. Please try again.');
  } finally {
    setIsSubmittingReview(false);
  }
};
  // Open review modal
  // const handleOpenReview = (transaction) => {
  //   if (!canUserReviewTransaction(transaction)) {
  //     if (transaction.deliveryStatus !== 'DELIVERED') {
  //       setError('You can only review delivered products');
  //     } else {
  //       setError('You have already reviewed this product');
  //     }
  //     return;
  //   }

  //   setSelectedTransactionForReview(transaction);
  //   setReviewFormData({
  //     rating: 5,
  //     comment: ''
  //   });
  //   setShowReviewModal(true);
  // };
 // Enhanced handleOpenReview with transaction-based checks
    // Open review modal
// Enhanced handleOpenReview with detailed debugging
const handleOpenReview = async (transaction) => {
  try {
    console.log('🔍 Opening review for transaction:', transaction.transactionId);
    console.log('📦 Transaction details:', {
      id: transaction.transactionId,
      product: transaction.batch?.crop?.name,
      deliveryStatus: transaction.deliveryStatus,
      cropId: transaction.batch?.crop?.cropId
    });

    // Basic frontend checks first
    if (transaction.deliveryStatus !== 'DELIVERED') {
      setError(`You can only review delivered products. Current status: ${transaction.deliveryStatus || 'Unknown'}`);
      return;
    }

    const token = getAuthToken();
    const transactionId = transaction.transactionId;

    // Debug: Check what the backend returns for review status
    console.log('🔍 Checking if review exists for transaction:', transactionId);
    
    const reviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Review check response status:', reviewResponse.status);
    
    if (reviewResponse.ok) {
      const reviewData = await reviewResponse.json();
      console.log('📊 Review data from backend:', reviewData);
      
      // Check if we actually got a valid review
      if (reviewData && Object.keys(reviewData).length > 0) {
        console.log('❌ Review already exists:', reviewData);
        setError('You have already reviewed this transaction.');
        return;
      } else {
        console.log('✅ No review exists - proceeding with review');
      }
    } else if (reviewResponse.status === 404) {
      console.log('✅ No review found (404) - proceeding with review');
    } else {
      console.log('⚠️ Unexpected response:', reviewResponse.status);
      const errorText = await reviewResponse.text();
      console.log('⚠️ Error details:', errorText);
    }

    // Now check the can-review endpoint
    console.log('🔍 Checking can-review endpoint');
    const canReviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}/can-review`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Can-review response status:', canReviewResponse.status);
    
    if (canReviewResponse.ok) {
      const canReview = await canReviewResponse.json();
      console.log('📊 Can-review result:', canReview);
      
      if (!canReview) {
        // If canReview is false, let's investigate why
        console.log('❌ Backend says cannot review, investigating...');
        
        // Additional debug: Check transaction details
        const transactionDetails = await fetch(`${BASE_URL}/transactions/${transactionId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (transactionDetails.ok) {
          const txData = await transactionDetails.json();
          console.log('📊 Transaction details from backend:', txData);
        }
        
        setError('This transaction cannot be reviewed. Please contact support.');
        return;
      }
    } else {
      console.log('⚠️ Can-review endpoint failed:', canReviewResponse.status);
      const errorText = await canReviewResponse.text();
      console.log('⚠️ Error details:', errorText);
    }

    // If we get here, we can proceed with the review
    console.log('✅ All checks passed - opening review modal');
    setSelectedTransactionForReview(transaction);
    setReviewFormData({
      rating: 5,
      comment: ''
    });
    setShowReviewModal(true);
    
  } catch (err) {
    console.error('❌ Error opening review modal:', err);
    setError('Unable to open review. Please try again.');
  }
};

  // Open product details
  const handleViewProductDetails = async (batch) => {
    setSelectedProduct(batch);
    
    if (batch.crop?.cropId) {
      const reviews = await fetchCropReviews(batch.crop.cropId);
      setSelectedProduct(prev => ({ ...prev, reviews }));
    }
    
    setShowProductDetails(true);
  };

  // Filter functions
  const filterProducts = (batches) => {
    return batches.filter(batch => {
      const cropName = (batch.crop?.name || '').toLowerCase();
      const retailerName = (batch.user?.name || '').toLowerCase();
      const quality = (batch.storageConditions || '').toLowerCase();
      const price = batch.pricePerUnit;

      const matchesSearch = !productFilters.search || 
        cropName.includes(productFilters.search.toLowerCase()) ||
        retailerName.includes(productFilters.search.toLowerCase());

      const matchesCropType = !productFilters.cropType || 
        cropName.includes(productFilters.cropType.toLowerCase());

      const matchesRetailer = !productFilters.retailer ||
        retailerName.includes(productFilters.retailer.toLowerCase());

      const matchesQuality = !productFilters.quality ||
        quality.includes(productFilters.quality.toLowerCase());

      const matchesPrice = !productFilters.priceRange || (
        productFilters.priceRange === 'low' && price < 50 ||
        productFilters.priceRange === 'medium' && price >= 50 && price <= 100 ||
        productFilters.priceRange === 'high' && price > 100
      );

      return matchesSearch && matchesCropType && matchesRetailer && matchesQuality && matchesPrice;
    });
  };

  const filterTransactions = (transactions) => {
    return transactions.filter(transaction => {
      const productName = (transaction.batch?.crop?.name || '').toLowerCase();
      const retailerName = (transaction.fromUser?.name || '').toLowerCase();

      const matchesSearch = !transactionFilters.search || 
        productName.includes(transactionFilters.search.toLowerCase()) ||
        retailerName.includes(transactionFilters.search.toLowerCase());

      const matchesStatus = transactionFilters.status === 'all' ||
        transaction.deliveryStatus === transactionFilters.status;

      const matchesPaymentStatus = transactionFilters.paymentStatus === 'all' ||
        transaction.paymentStatus === transactionFilters.paymentStatus;

      return matchesSearch && matchesStatus && matchesPaymentStatus;
    });
  };

  // Reset filter functions
  const resetProductFilters = () => {
    setProductFilters({
      search: '',
      cropType: '',
      priceRange: '',
      retailer: '',
      quality: ''
    });
  };

  const resetTransactionFilters = () => {
    setTransactionFilters({
      search: '',
      status: 'all',
      paymentStatus: 'all'
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
      'AVAILABLE': { color: '#7c3aed', bgColor: '#faf5ff', label: 'Available' },
      'RESERVED': { color: '#f59e0b', bgColor: '#fffbeb', label: 'Reserved' },
      'SOLD': { color: '#6b7280', bgColor: '#f9fafb', label: 'Sold' }
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


const getReviewStatusBadge = async (transaction) => {
  try {
    const token = getAuthToken();
    const transactionId = transaction.transactionId;

    // Check if review already exists for this transaction
    const reviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (reviewResponse.ok) {
      const existingReview = await reviewResponse.json();
      if (existingReview) {
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0a8a3a',
            backgroundColor: '#f0fdf4',
            border: '1px solid #0a8a3a33'
          }}>
            Reviewed
          </span>
        );
      }
    }

    // Check if transaction can be reviewed
    if (transaction.deliveryStatus === 'DELIVERED') {
      return (
        <span style={{
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: '600',
          color: '#f59e0b',
          backgroundColor: '#fffbeb',
          border: '1px solid #f59e0b33'
        }}>
          Can Review
        </span>
      );
    }

    return (
      <span style={{
        padding: '4px 8px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        border: '1px solid #d1d5db'
      }}>
        Awaiting Delivery
      </span>
    );

  } catch (err) {
    console.error('Error fetching review status:', err);
    return null;
  }
};
// In the MyTransactionsTab component, update the transaction card
const TransactionCard = ({ transaction }) => {
  const [reviewStatus, setReviewStatus] = useState(null);

  useEffect(() => {
    const fetchReviewStatus = async () => {
      const status = await getReviewStatusBadge(transaction);
      setReviewStatus(status);
    };
    fetchReviewStatus();
  }, [transaction]);

  return (
    <div style={styles.transactionCard}>
      {/* ... existing transaction card content ... */}
      
      <div style={styles.statusBadges}>
        {getStatusBadge(transaction.paymentStatus, 'payment')}
        {getStatusBadge(transaction.deliveryStatus, 'delivery')}
        {reviewStatus}
      </div>

      <div style={styles.transactionActions}>
        {transaction.deliveryStatus === 'DELIVERED' && reviewStatus?.props?.children !== 'Reviewed' && (
          <button 
            onClick={() => handleOpenReview(transaction)}
            style={styles.reviewButton}
          >
            <Star size={14} style={{marginRight: 4}} />
            Write Review
          </button>
        )}
        
        {reviewStatus?.props?.children === 'Reviewed' && (
          <span style={styles.reviewedBadge}>
            <Star size={14} style={{marginRight: 4}} />
            Already Reviewed
          </span>
        )}
      </div>
    </div>
  );
};

  // Render star rating
  const renderStars = (rating, size = 16) => {
    return (
      <div style={{ display: 'flex', gap: '2px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={size}
            style={{
              color: star <= rating ? '#f59e0b' : '#d1d5db',
              fill: star <= rating ? '#f59e0b' : 'transparent'
            }}
          />
        ))}
      </div>
    );
  };

  // Calculate average rating
  const calculateAverageRating = (reviews) => {
    if (!reviews || reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
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
    availableProducts: availableBatches.length,
    totalTransactions: myTransactions.length,
    pendingDeliveries: myTransactions.filter(t => t.deliveryStatus !== 'DELIVERED').length,
    totalSpent: myTransactions
      .filter(t => t.paymentStatus === 'PAID')
      .reduce((sum, transaction) => sum + (transaction.totalAmount || 0), 0)
  };

  // Tab Components
  const AvailableProductsTab = () => {
    const filteredProducts = filterProducts(availableBatches);
    
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
                placeholder="Search products by name, retailer..."
                value={productFilters.search}
                onChange={(e) => setProductFilters({...productFilters, search: e.target.value})}
                style={styles.searchInput}
              />
            </div>
            
            <div style={styles.filterButtons}>
              <button 
                onClick={() => setShowProductFilters(!showProductFilters)}
                style={{
                  ...styles.filterButton,
                  ...(showProductFilters && styles.filterButtonActive)
                }}
              >
                <Filter size={16} style={{marginRight: 6}} />
                Filters
                {showProductFilters && <span style={styles.activeDot}></span>}
              </button>
              
              <button 
                onClick={resetProductFilters}
                style={styles.resetButton}
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showProductFilters && (
            <div style={styles.advancedFilters}>
              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Product Type</h4>
                <input
                  type="text"
                  placeholder="e.g., Tomato, Potato"
                  value={productFilters.cropType}
                  onChange={(e) => setProductFilters({...productFilters, cropType: e.target.value})}
                  style={styles.filterInput}
                />
              </div>

              <div style={styles.filterSection}>
                <h4 style={styles.filterTitle}>Price Range</h4>
                <select
                  value={productFilters.priceRange}
                  onChange={(e) => setProductFilters({...productFilters, priceRange: e.target.value})}
                  style={styles.filterSelect}
                >
                  <option value="">All Prices</option>
                  <option value="low">Low (&lt; ₹50/kg)</option>
                  <option value="medium">Medium (₹50-100/kg)</option>
                  <option value="high">High (&gt; ₹100/kg)</option>
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
                    <option value="price">Price</option>
                    <option value="harvestDate">Harvest Date</option>
                    <option value="name">Product Name</option>
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
              Showing {filteredProducts.length} of {availableBatches.length} products
            </span>
          </div>
        </div>

        {/* Products Grid */}
        {loading ? (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Loading available products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>
              <ShoppingBag size={48} style={{color: '#7c3aed'}} />
            </div>
            <h3 style={styles.emptyTitle}>
              {productFilters.search ? 'No matching products found' : 'No products available'}
            </h3>
            <p style={styles.emptyText}>
              {productFilters.search ? 'Try adjusting your search or filters' : 'Products from retailers will appear here when available'}
            </p>
            {productFilters.search && (
              <button onClick={resetProductFilters} style={styles.clearFiltersButton}>
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div style={styles.productsGrid}>
            {filteredProducts.map((batch) => (
              <div key={batch.batchId} style={styles.productCard}>
                {/* Product Image */}
                <div style={styles.productImageContainer}>
                  {batch.crop?.imageUrl ? (
                    <img 
                      src={batch.crop.imageUrl} 
                      alt={batch.crop?.name}
                      style={styles.productImage}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div style={{
                    ...styles.productImagePlaceholder,
                    display: !batch.crop?.imageUrl ? 'flex' : 'none'
                  }}>
                    <Package size={32} style={{color: '#9ca3af'}} />
                  </div>
                  
                  <div style={styles.productOverlay}>
                    {getBatchStatusBadge(batch.status || 'AVAILABLE')}
                    <button 
                      onClick={() => handleViewProductDetails(batch)}
                      style={styles.viewDetailsButton}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
                
                <div style={styles.productContent}>
                  <div style={styles.productHeader}>
                    <h3 style={styles.productName}>{batch.crop?.name || 'Product'}</h3>
                    <span style={styles.productPrice}>₹{batch.pricePerUnit}/{batch.unit || 'kg'}</span>
                  </div>
                  
                  <div style={styles.productDetails}>
                    <div style={styles.productDetail}>
                      <Store size={14} style={{color: '#6b7280', marginRight: 8}} />
                      <span style={styles.detailLabel}>Retailer:</span>
                      <span style={styles.detailValue}>{batch.user?.name || 'Retailer'}</span>
                    </div>
                    <div style={styles.productDetail}>
                      <Package size={14} style={{color: '#6b7280', marginRight: 8}} />
                      <span style={styles.detailLabel}>Available:</span>
                      <span style={styles.detailValue}>{batch.availableQuantity || batch.quantity} {batch.unit || 'kg'}</span>
                    </div>
                    <div style={styles.productDetail}>
                      <Calendar size={14} style={{color: '#6b7280', marginRight: 8}} />
                      <span style={styles.detailLabel}>Harvest:</span>
                      <span style={styles.detailValue}>
                        {batch.harvestDate ? new Date(batch.harvestDate).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    {batch.storageConditions && (
                      <div style={styles.productDetail}>
                        <span style={styles.detailLabel}>Storage:</span>
                        <span style={styles.detailValue}>{batch.storageConditions}</span>
                      </div>
                    )}
                  </div>

                  <div style={styles.productActions}>
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
                          <ShoppingCart size={16} style={{marginRight: 8}} />
                          Buy Now
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

//   const MyTransactionsTab = () => {
//   const filteredTransactions = filterTransactions(myTransactions);
//   const [reviewStatusMap, setReviewStatusMap] = useState({});

//   // Fetch review status for all transactions
//   useEffect(() => {
//     const fetchReviewStatuses = async () => {
//       const statusMap = {};
//       for (const transaction of filteredTransactions) {
//         const status = await getReviewStatusBadge(transaction);
//         statusMap[transaction.transactionId] = status;
//       }
//       setReviewStatusMap(statusMap);
//     };

//     if (filteredTransactions.length > 0) {
//       fetchReviewStatuses();
//     }
//   }, [filteredTransactions]);
//     return (
//       <div style={styles.tabContentInner}>
//         {/* Action Bar with Search and Filters */}
//         <div style={styles.actionBar}>
//           <div style={styles.searchFilterContainer}>
//             <div style={styles.searchBox}>
//               <Search size={20} style={{color: '#6b7280', marginRight: 8}} />
//               <input
//                 type="text"
//                 placeholder="Search transactions by product, retailer..."
//                 value={transactionFilters.search}
//                 onChange={(e) => setTransactionFilters({...transactionFilters, search: e.target.value})}
//                 style={styles.searchInput}
//               />
//             </div>
            
//             <div style={styles.filterButtons}>
//               <button 
//                 onClick={() => setShowTransactionFilters(!showTransactionFilters)}
//                 style={{
//                   ...styles.filterButton,
//                   ...(showTransactionFilters && styles.filterButtonActive)
//                 }}
//               >
//                 <Filter size={16} style={{marginRight: 6}} />
//                 Filters
//                 {showTransactionFilters && <span style={styles.activeDot}></span>}
//               </button>
              
//               <button 
//                 onClick={resetTransactionFilters}
//                 style={styles.resetButton}
//               >
//                 Clear Filters
//               </button>
//             </div>
//           </div>

//           {/* Advanced Filters */}
//           {showTransactionFilters && (
//             <div style={styles.advancedFilters}>
//               <div style={styles.filterSection}>
//                 <h4 style={styles.filterTitle}>Delivery Status</h4>
//                 <select
//                   value={transactionFilters.status}
//                   onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
//                   style={styles.filterSelect}
//                 >
//                   <option value="all">All Status</option>
//                   <option value="PENDING">Pending</option>
//                   <option value="IN_TRANSIT">In Transit</option>
//                   <option value="DELIVERED">Delivered</option>
//                 </select>
//               </div>

//               <div style={styles.filterSection}>
//                 <h4 style={styles.filterTitle}>Payment Status</h4>
//                 <select
//                   value={transactionFilters.paymentStatus}
//                   onChange={(e) => setTransactionFilters({...transactionFilters, paymentStatus: e.target.value})}
//                   style={styles.filterSelect}
//                 >
//                   <option value="all">All Payments</option>
//                   <option value="PAID">Paid</option>
//                   <option value="PENDING">Pending</option>
//                 </select>
//               </div>
//             </div>
//           )}

//           {/* Results Count */}
//           <div style={styles.resultsInfo}>
//             <span style={styles.resultsText}>
//               Showing {filteredTransactions.length} of {myTransactions.length} transactions
//             </span>
//           </div>
//         </div>

//         {loading ? (
//           <div style={styles.loadingState}>
//             <div style={styles.spinner}></div>
//             <p style={styles.loadingText}>Loading your transactions...</p>
//           </div>
//         ) : filteredTransactions.length === 0 ? (
//           <div style={styles.emptyState}>
//             <div style={styles.emptyIcon}>
//               <History size={48} style={{color: '#7c3aed'}} />
//             </div>
//             <h3 style={styles.emptyTitle}>
//               {transactionFilters.search ? 'No matching transactions found' : 'No transactions yet'}
//             </h3>
//             <p style={styles.emptyText}>
//               {transactionFilters.search ? 'Try adjusting your search or filters' : 'Your purchases will appear here after you buy products'}
//             </p>
//             {transactionFilters.search && (
//               <button onClick={resetTransactionFilters} style={styles.clearFiltersButton}>
//                 Clear All Filters
//               </button>
//             )}
//           </div>
//         ) : (
//           <div style={styles.transactionsList}>
//             {filteredTransactions.map((transaction) => (
//               <div key={transaction.transactionId} style={styles.transactionCard}>
//                 <div style={styles.transactionIcon}>
//                   <ShoppingBag size={20} style={{color: 'white'}} />
//                 </div>
                
//                 <div style={styles.transactionInfo}>
//                   <h4 style={styles.transactionName}>
//                     {transaction.batch?.crop?.name || 'Product'} - {transaction.quantity}kg
//                   </h4>
//                   <p style={styles.transactionDate}>
//                     {new Date(transaction.transactionDate).toLocaleDateString()} • 
//                     From: {transaction.fromUser?.name || 'Retailer'}
//                   </p>
//                   <div style={styles.statusBadges}>
//                     {getStatusBadge(transaction.paymentStatus, 'payment')}
//                     {getStatusBadge(transaction.deliveryStatus, 'delivery')}
//                     {getReviewStatusBadge(transaction)}
//                   </div>
//                 </div>
                
// <div style={styles.transactionActions}>
//   {/* Show Review button only for delivered transactions that haven't been reviewed */}
//   {canUserReviewTransaction(transaction) && (
//     <button 
//       onClick={() => handleOpenReview(transaction)}
//       style={styles.reviewButton}
//     >
//       <Star size={14} style={{marginRight: 4}} />
//       Write Review
//     </button>
//   )}
  
//   {/* Show Reviewed badge if already reviewed */}
//   {transaction.deliveryStatus === 'DELIVERED' && hasUserReviewedProduct(transaction.batch?.crop?.cropId) && (
//     <span style={styles.reviewedBadge}>
//       <Star size={14} style={{marginRight: 4}} />
//       Already Reviewed
//     </span>
//   )}
  
//   {/* Show message if not delivered yet */}
//   {transaction.deliveryStatus !== 'DELIVERED' && (
//     <span style={styles.pendingReviewBadge}>
//       Review available after delivery
//     </span>
//   )}
// </div>

//                 <div style={styles.transactionActions}>
//                   {/* Show Review button only for delivered transactions that haven't been reviewed */}
//                   {canUserReviewTransaction(transaction) && (
//                     <button 
//                       onClick={() => handleOpenReview(transaction)}
//                       style={styles.reviewButton}
//                     >
//                       <Star size={14} style={{marginRight: 4}} />
//                       Write Review
//                     </button>
//                   )}
                  
//                   {/* Show Reviewed badge if already reviewed */}
//                   {transaction.deliveryStatus === 'DELIVERED' && hasUserReviewedProduct(transaction.batch?.crop?.cropId) && (
//                     <span style={styles.reviewedBadge}>
//                       <Star size={14} style={{marginRight: 4}} />
//                       Reviewed
//                     </span>
//                   )}
                  
//                   {/* Show message if not delivered yet */}
//                   {transaction.deliveryStatus !== 'DELIVERED' && (
//                     <span style={styles.pendingReviewBadge}>
//                       Review available after delivery
//                     </span>
//                   )}
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   const MyTransactionsTab = () => {
//   const filteredTransactions = filterTransactions(myTransactions);
//   const [reviewStatusMap, setReviewStatusMap] = useState({});
//   const [loadingReviews, setLoadingReviews] = useState(false);

//   // Fetch review status for all transactions
//   useEffect(() => {
//     const fetchReviewStatuses = async () => {
//       setLoadingReviews(true);
//       try {
//         const statusMap = {};
//         for (const transaction of filteredTransactions) {
//           try {
//             const status = await getReviewStatusBadge(transaction);
//             statusMap[transaction.transactionId] = status;
//           } catch (err) {
//             console.error(`Error fetching review status for transaction ${transaction.transactionId}:`, err);
//             statusMap[transaction.transactionId] = null;
//           }
//         }
//         setReviewStatusMap(statusMap);
//       } catch (err) {
//         console.error('Error fetching review statuses:', err);
//       } finally {
//         setLoadingReviews(false);
//       }
//     };

//     if (filteredTransactions.length > 0) {
//       fetchReviewStatuses();
//     } else {
//       setReviewStatusMap({});
//     }
//   }, [filteredTransactions]);

//   // Check if user can review a transaction
//   const canUserReviewTransaction = async (transaction) => {
//     try {
//       // Basic frontend checks first
//       if (transaction.deliveryStatus !== 'DELIVERED') {
//         return false;
//       }

//       const token = getAuthToken();
//       const transactionId = transaction.transactionId;

//       // Check backend if review already exists for this transaction
//       const reviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       // If review exists, cannot review again
//       if (reviewResponse.ok) {
//         const existingReview = await reviewResponse.json();
//         if (existingReview && Object.keys(existingReview).length > 0) {
//           return false; // Review already exists
//         }
//       }

//       // If no review exists and transaction is delivered, can review
//       return true;

//     } catch (err) {
//       console.error('Error checking review eligibility:', err);
//       return false;
//     }
//   };

//   // Get review status badge
//   const getReviewStatusBadge = async (transaction) => {
//     try {
//       const token = getAuthToken();
//       const transactionId = transaction.transactionId;

//       // Check if review already exists for this transaction
//       const reviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
//         headers: {
//           'Authorization': `Bearer ${token}`,
//           'Content-Type': 'application/json'
//         }
//       });

//       if (reviewResponse.ok) {
//         const existingReview = await reviewResponse.json();
//         if (existingReview && Object.keys(existingReview).length > 0) {
//           return (
//             <span style={{
//               padding: '4px 8px',
//               borderRadius: '12px',
//               fontSize: '11px',
//               fontWeight: '600',
//               color: '#0a8a3a',
//               backgroundColor: '#f0fdf4',
//               border: '1px solid #0a8a3a33'
//             }}>
//               ✅ Reviewed
//             </span>
//           );
//         }
//       }

//       // Check if transaction can be reviewed
//       if (transaction.deliveryStatus === 'DELIVERED') {
//         return (
//           <span style={{
//             padding: '4px 8px',
//             borderRadius: '12px',
//             fontSize: '11px',
//             fontWeight: '600',
//             color: '#f59e0b',
//             backgroundColor: '#fffbeb',
//             border: '1px solid #f59e0b33'
//           }}>
//             ⭐ Can Review
//           </span>
//         );
//       }

//       return (
//         <span style={{
//           padding: '4px 8px',
//           borderRadius: '12px',
//           fontSize: '11px',
//           fontWeight: '600',
//           color: '#6b7280',
//           backgroundColor: '#f9fafb',
//           border: '1px solid #d1d5db'
//         }}>
//           📦 Awaiting Delivery
//         </span>
//       );

//     } catch (err) {
//       console.error('Error fetching review status:', err);
//       return null;
//     }
//   };

//   // Open review modal
//   const handleOpenReview = async (transaction) => {
//     try {
//       // Check if transaction can be reviewed
//       const canReview = await canUserReviewTransaction(transaction);
      
//       if (!canReview) {
//         if (transaction.deliveryStatus !== 'DELIVERED') {
//           setError('You can only review delivered products. This product is still ' + transaction.deliveryStatus.toLowerCase() + '.');
//         } else {
//           setError('You have already reviewed this transaction.');
//         }
//         return;
//       }

//       setSelectedTransactionForReview(transaction);
//       setReviewFormData({
//         rating: 5,
//         comment: ''
//       });
//       setShowReviewModal(true);
//     } catch (err) {
//       console.error('Error opening review modal:', err);
//       setError('Unable to open review. Please try again.');
//     }
//   };

//   // Refresh review status for a specific transaction
//   const refreshTransactionReviewStatus = async (transactionId) => {
//     try {
//       const transaction = filteredTransactions.find(t => t.transactionId === transactionId);
//       if (transaction) {
//         const status = await getReviewStatusBadge(transaction);
//         setReviewStatusMap(prev => ({
//           ...prev,
//           [transactionId]: status
//         }));
//       }
//     } catch (err) {
//       console.error('Error refreshing review status:', err);
//     }
//   };

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
//               placeholder="Search transactions by product, retailer..."
//               value={transactionFilters.search}
//               onChange={(e) => setTransactionFilters({...transactionFilters, search: e.target.value})}
//               style={styles.searchInput}
//             />
//           </div>
          
//           <div style={styles.filterButtons}>
//             <button 
//               onClick={() => setShowTransactionFilters(!showTransactionFilters)}
//               style={{
//                 ...styles.filterButton,
//                 ...(showTransactionFilters && styles.filterButtonActive)
//               }}
//             >
//               <Filter size={16} style={{marginRight: 6}} />
//               Filters
//               {showTransactionFilters && <span style={styles.activeDot}></span>}
//             </button>
            
//             <button 
//               onClick={resetTransactionFilters}
//               style={styles.resetButton}
//             >
//               Clear Filters
//             </button>
//           </div>
//         </div>

//         {/* Advanced Filters */}
//         {showTransactionFilters && (
//           <div style={styles.advancedFilters}>
//             <div style={styles.filterSection}>
//               <h4 style={styles.filterTitle}>Delivery Status</h4>
//               <select
//                 value={transactionFilters.status}
//                 onChange={(e) => setTransactionFilters({...transactionFilters, status: e.target.value})}
//                 style={styles.filterSelect}
//               >
//                 <option value="all">All Status</option>
//                 <option value="PENDING">Pending</option>
//                 <option value="IN_TRANSIT">In Transit</option>
//                 <option value="DELIVERED">Delivered</option>
//               </select>
//             </div>

//             <div style={styles.filterSection}>
//               <h4 style={styles.filterTitle}>Payment Status</h4>
//               <select
//                 value={transactionFilters.paymentStatus}
//                 onChange={(e) => setTransactionFilters({...transactionFilters, paymentStatus: e.target.value})}
//                 style={styles.filterSelect}
//               >
//                 <option value="all">All Payments</option>
//                 <option value="PAID">Paid</option>
//                 <option value="PENDING">Pending</option>
//               </select>
//             </div>
//           </div>
//         )}

//         {/* Results Count */}
//         <div style={styles.resultsInfo}>
//           <span style={styles.resultsText}>
//             Showing {filteredTransactions.length} of {myTransactions.length} transactions
//             {loadingReviews && ' • Loading review status...'}
//           </span>
//         </div>
//       </div>

//       {loading ? (
//         <div style={styles.loadingState}>
//           <div style={styles.spinner}></div>
//           <p style={styles.loadingText}>Loading your transactions...</p>
//         </div>
//       ) : filteredTransactions.length === 0 ? (
//         <div style={styles.emptyState}>
//           <div style={styles.emptyIcon}>
//             <History size={48} style={{color: '#7c3aed'}} />
//           </div>
//           <h3 style={styles.emptyTitle}>
//             {transactionFilters.search ? 'No matching transactions found' : 'No transactions yet'}
//           </h3>
//           <p style={styles.emptyText}>
//             {transactionFilters.search ? 'Try adjusting your search or filters' : 'Your purchases will appear here after you buy products'}
//           </p>
//           {transactionFilters.search && (
//             <button onClick={resetTransactionFilters} style={styles.clearFiltersButton}>
//               Clear All Filters
//             </button>
//           )}
//         </div>
//       ) : (
//         <div style={styles.transactionsList}>
//           {filteredTransactions.map((transaction) => (
//             <div key={transaction.transactionId} style={styles.transactionCard}>
//               <div style={styles.transactionIcon}>
//                 <ShoppingBag size={20} style={{color: 'white'}} />
//               </div>
              
//               <div style={styles.transactionInfo}>
//                 <h4 style={styles.transactionName}>
//                   {transaction.batch?.crop?.name || 'Product'} - {transaction.quantity}kg
//                 </h4>
//                 <p style={styles.transactionDate}>
//                   {new Date(transaction.transactionDate).toLocaleDateString()} • 
//                   From: {transaction.fromUser?.name || 'Retailer'}
//                 </p>
//                 <div style={styles.statusBadges}>
//                   {getStatusBadge(transaction.paymentStatus, 'payment')}
//                   {getStatusBadge(transaction.deliveryStatus, 'delivery')}
//                   {reviewStatusMap[transaction.transactionId]}
//                 </div>
//               </div>
              
//               <div style={styles.transactionAmount}>
//                 <div style={styles.amount}>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</div>
//                 <div style={styles.quantity}>{transaction.quantity} kg</div>
//               </div>

//               <div style={styles.transactionActions}>
//                 {/* Show Review button only for delivered transactions that haven't been reviewed */}
//                 {transaction.deliveryStatus === 'DELIVERED' && 
//                  reviewStatusMap[transaction.transactionId]?.props?.children === '⭐ Can Review' && (
//                   <button 
//                     onClick={() => handleOpenReview(transaction)}
//                     style={styles.reviewButton}
//                   >
//                     <Star size={14} style={{marginRight: 4}} />
//                     Write Review
//                   </button>
//                 )}
                
//                 {/* Show Reviewed badge if already reviewed */}
//                 {reviewStatusMap[transaction.transactionId]?.props?.children === '✅ Reviewed' && (
//                   <span style={styles.reviewedBadge}>
//                     <Star size={14} style={{marginRight: 4}} />
//                     Already Reviewed
//                   </span>
//                 )}
                
//                 {/* Show message if not delivered yet */}
//                 {transaction.deliveryStatus !== 'DELIVERED' && (
//                   <span style={styles.pendingReviewBadge}>
//                     Review available after delivery
//                   </span>
//                 )}
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Review Modal */}
//       {showReviewModal && selectedTransactionForReview && (
//         <div style={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
//           <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
//             <div style={styles.modalHeader}>
//               <h2 style={styles.modalTitle}>Write a Review</h2>
//               <button onClick={() => setShowReviewModal(false)} style={styles.closeButton}>
//                 <X size={24} />
//               </button>
//             </div>

//             <form onSubmit={handleSubmitReview} style={styles.modalContent}>
//               <div style={styles.reviewProductInfo}>
//                 <h4 style={styles.reviewProductName}>
//                   {selectedTransactionForReview.batch?.crop?.name || 'Product'}
//                 </h4>
//                 <p style={styles.reviewRetailer}>
//                   Purchased from: {selectedTransactionForReview.fromUser?.name || 'Retailer'}
//                 </p>
//               </div>

//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Rating *</label>
//                 <div style={styles.ratingInput}>
//                   {[1, 2, 3, 4, 5].map((star) => (
//                     <button
//                       key={star}
//                       type="button"
//                       onClick={() => setReviewFormData({...reviewFormData, rating: star})}
//                       style={styles.starButton}
//                     >
//                       <Star
//                         size={32}
//                         style={{
//                           color: star <= reviewFormData.rating ? '#f59e0b' : '#d1d5db',
//                           fill: star <= reviewFormData.rating ? '#f59e0b' : 'transparent',
//                           cursor: 'pointer'
//                         }}
//                       />
//                     </button>
//                   ))}
//                 </div>
//               </div>

//               <div style={styles.formGroup}>
//                 <label style={styles.label}>Your Review</label>
//                 <textarea
//                   value={reviewFormData.comment}
//                   onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})}
//                   style={styles.textarea}
//                   rows={4}
//                   placeholder="Share your experience with this product..."
//                 />
//               </div>

//               <div style={styles.modalActions}>
//                 <button 
//                   type="button"
//                   onClick={() => setShowReviewModal(false)}
//                   style={styles.cancelButton}
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   type="submit"
//                   disabled={isSubmittingReview}
//                   style={{
//                     ...styles.submitButton,
//                     ...(isSubmittingReview && styles.submitButtonDisabled)
//                   }}
//                 >
//                   {isSubmittingReview ? (
//                     <>
//                       <div style={styles.buttonSpinner}></div>
//                       Submitting...
//                     </>
//                   ) : (
//                     <>
//                       <Star size={16} style={{marginRight: 6}} />
//                       Submit Review
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };
  const MyTransactionsTab = () => {
  const filteredTransactions = filterTransactions(myTransactions);
  const [reviewStatusMap, setReviewStatusMap] = useState({});
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Fixed: Memoize the function without dependencies that cause re-renders
  const fetchReviewStatuses = useCallback(async (transactions) => {
    if (!transactions || transactions.length === 0) {
      setReviewStatusMap({});
      return;
    }

    setLoadingReviews(true);
    try {
      const statusMap = {};
      
      const reviewPromises = transactions.map(async (transaction) => {
        try {
          const token = getAuthToken();
          const transactionId = transaction.transactionId;

          const reviewResponse = await fetch(`${BASE_URL}/reviews/transaction/${transactionId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          let status = null;
          if (reviewResponse.ok) {
            const existingReview = await reviewResponse.json();
            if (existingReview && Object.keys(existingReview).length > 0) {
              status = 'reviewed';
            } else if (transaction.deliveryStatus === 'DELIVERED') {
              status = 'can_review';
            } else {
              status = 'pending_delivery';
            }
          }
          
          return { transactionId, status };
        } catch (err) {
          console.error(`Error fetching review status for transaction ${transaction.transactionId}:`, err);
          return { transactionId: transaction.transactionId, status: null };
        }
      });

      const results = await Promise.all(reviewPromises);
      
      const newStatusMap = {};
      results.forEach(result => {
        newStatusMap[result.transactionId] = result.status;
      });
      
      setReviewStatusMap(newStatusMap);
    } catch (err) {
      console.error('Error fetching review statuses:', err);
    } finally {
      setLoadingReviews(false);
    }
  }, []); // Empty dependency array - function never changes

  // Fixed: Use a ref to track if we've already fetched
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Only fetch if we have transactions and haven't fetched yet
    if (filteredTransactions.length > 0 && !hasFetchedRef.current) {
      fetchReviewStatuses(filteredTransactions);
      hasFetchedRef.current = true;
    }
    
    // Reset the ref when transactions change significantly
    return () => {
      hasFetchedRef.current = false;
    };
  }, [filteredTransactions.length, fetchReviewStatuses]); // Only depend on length

  // Helper function to render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'reviewed':
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#0a8a3a',
            backgroundColor: '#f0fdf4',
            border: '1px solid #0a8a3a33'
          }}>
            Reviewed
          </span>
        );
      case 'can_review':
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#f59e0b',
            backgroundColor: '#fffbeb',
            border: '1px solid #f59e0b33'
          }}>
            Can Review
          </span>
        );
      case 'pending_delivery':
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            border: '1px solid #d1d5db'
          }}>
             Awaiting Delivery
          </span>
        );
      default:
        return (
          <span style={{
            padding: '4px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: '600',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            border: '1px solid #d1d5db'
          }}>
            ⏳ Checking...
          </span>
        );
    }
  };

  // Simplified review opening - bypass complex checks for now
  const handleOpenReview = async (transaction) => {
    try {
      console.log('Opening review for transaction:', transaction.transactionId);
      
      // Basic frontend check only
      if (transaction.deliveryStatus !== 'DELIVERED') {
        setError(`You can only review delivered products. Current status: ${transaction.deliveryStatus}`);
        return;
      }

      // Check if we think it's already reviewed
      const status = reviewStatusMap[transaction.transactionId];
      if (status === 'reviewed') {
        setError('You have already reviewed this transaction.');
        return;
      }

      // For now, let's try to open the review modal directly
      // We'll handle any backend errors during submission
      setSelectedTransactionForReview(transaction);
      setReviewFormData({
        rating: 5,
        comment: ''
      });
      setShowReviewModal(true);
      
    } catch (err) {
      console.error('Error opening review modal:', err);
      setError('Unable to open review. Please try again.');
    }
  };

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
              placeholder="Search transactions by product, retailer..."
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
          </div>
        )}

        {/* Results Count */}
        <div style={styles.resultsInfo}>
          <span style={styles.resultsText}>
            Showing {filteredTransactions.length} of {myTransactions.length} transactions
            {loadingReviews && ' • Loading review status...'}
          </span>
        </div>
      </div>

      {loading ? (
        <div style={styles.loadingState}>
          <div style={styles.spinner}></div>
          <p style={styles.loadingText}>Loading your transactions...</p>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <History size={48} style={{color: '#7c3aed'}} />
          </div>
          <h3 style={styles.emptyTitle}>
            {transactionFilters.search ? 'No matching transactions found' : 'No transactions yet'}
          </h3>
          <p style={styles.emptyText}>
            {transactionFilters.search ? 'Try adjusting your search or filters' : 'Your purchases will appear here after you buy products'}
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
                <ShoppingBag size={20} style={{color: 'white'}} />
              </div>
              
              <div style={styles.transactionInfo}>
                <h4 style={styles.transactionName}>
                  {transaction.batch?.crop?.name || 'Product'} - {transaction.quantity}kg
                </h4>
                <p style={styles.transactionDate}>
                  {new Date(transaction.transactionDate).toLocaleDateString()} • 
                  From: {transaction.fromUser?.name || 'Retailer'}
                </p>
                <div style={styles.statusBadges}>
                  {getStatusBadge(transaction.paymentStatus, 'payment')}
                  {getStatusBadge(transaction.deliveryStatus, 'delivery')}
                  {renderStatusBadge(reviewStatusMap[transaction.transactionId])}
                </div>
              </div>
              
              <div style={styles.transactionAmount}>
                <div style={styles.amount}>₹{transaction.totalAmount?.toFixed(2) || '0.00'}</div>
                <div style={styles.quantity}>{transaction.quantity} kg</div>
              </div>

              <div style={styles.transactionActions}>
                {/* Show Review button only for delivered transactions that haven't been reviewed */}
                {transaction.deliveryStatus === 'DELIVERED' && 
                 reviewStatusMap[transaction.transactionId] === 'can_review' && (
                  <button 
                    onClick={() => handleOpenReview(transaction)}
                    style={styles.reviewButton}
                  >
                    <Star size={14} style={{marginRight: 4}} />
                    Write Review
                  </button>
                )}
                
                {/* Show Reviewed badge if already reviewed */}
                {reviewStatusMap[transaction.transactionId] === 'reviewed' && (
                  <span style={styles.reviewedBadge}>
                    <Star size={14} style={{marginRight: 4}} />
                    Already Reviewed
                  </span>
                )}
                
                {/* Show message if not delivered yet */}
                {transaction.deliveryStatus !== 'DELIVERED' && (
                  <span style={styles.pendingReviewBadge}>
                    Review available after delivery
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

const QRScannerTab = () => {
  return (
    <div style={styles.tabContentInner}>
      <div style={styles.qrScannerContainer}>
        <div style={styles.qrScannerHeader}>
          <div style={styles.qrScannerIcon}>
            <QrCode size={32} style={{color: '#7c3aed'}} />
          </div>
          <div>
            <h2 style={styles.qrScannerTitle}>QR Code Scanner</h2>
            <p style={styles.qrScannerSubtitle}>
              Scan product QR codes to view detailed product information from our database
            </p>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div style={styles.loadingState}>
            <div style={styles.spinner}></div>
            <p style={styles.loadingText}>Processing QR code...</p>
          </div>
        )}

        {/* QR Upload Section */}
        <div style={styles.qrUploadSection}>
          <div style={styles.uploadArea}>
            <Camera size={48} style={{color: '#9ca3af', marginBottom: 16}} />
            <h3 style={styles.uploadTitle}>Upload QR Code</h3>
            <p style={styles.uploadDescription}>
              Take a picture of the product QR code or select an image file
            </p>
            <input
              type="file"
              accept="image/*,.json"
              onChange={handleQRScan}
              style={styles.fileInput}
              id="qr-upload"
              disabled={loading}
            />
            <label 
              htmlFor="qr-upload" 
              style={{
                ...styles.uploadButton,
                ...(loading && styles.buttonDisabled)
              }}
            >
              <Camera size={16} style={{marginRight: 8}} />
              {loading ? 'Processing...' : 'Choose QR Image'}
            </label>
            <p style={styles.uploadHint}>
              Supported formats: JPEG, PNG images containing QR codes
            </p>
          </div>
        </div>

        {/* Error Message */}
        {qrScanError && (
          <div style={styles.errorMessage}>
            <AlertCircle size={20} style={{marginRight: 8}} />
            <span>{qrScanError}</span>
          </div>
        )}

        {/* Scanned QR Data Display */}
        {scannedQRData && (
          <div style={styles.scannedDataSection}>
            <div style={styles.scannedDataHeader}>
              <h3 style={styles.scannedDataTitle}>Product Information</h3>
              <button 
                onClick={clearScannedQR} 
                style={styles.clearButton}
                disabled={loading}
              >
                <X size={16} />
                Clear
              </button>
            </div>
            
            <div style={styles.scannedDataCard}>
              {/* Product Image */}
              {qrImageData && (
                <div style={styles.imageSection}>
                  <span style={styles.scannedDataLabel}>Product Image:</span>
                  <img 
                    src={qrImageData} 
                    alt={scannedQRData.name}
                    style={styles.scannedImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div style={{
                    ...styles.scannedImagePlaceholder,
                    display: 'none'
                  }}>
                    <Package size={32} style={{color: '#9ca3af'}} />
                  </div>
                </div>
              )}
              
              <div style={styles.scannedDataGrid}>
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Product Name:</span>
                  <span style={styles.scannedDataValue}>{scannedQRData.name}</span>
                </div>
                {/* <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Crop ID:</span>
                  <span style={styles.scannedDataValue}>{scannedQRData.cropId}</span>
                </div> */}
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Variety:</span>
                  <span style={styles.scannedDataValue}>{scannedQRData.variety || 'N/A'}</span>
                </div>
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Season:</span>
                  <span style={styles.scannedDataValue}>{scannedQRData.season || 'N/A'}</span>
                </div>
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Growing Period:</span>
                  <span style={styles.scannedDataValue}>{scannedQRData.growingPeriod || 'N/A'}</span>
                </div>
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Price per Kg:</span>
                  <span style={styles.scannedDataValue}>₹{scannedQRData.pricePerKg || 'N/A'}</span>
                </div>
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Quantity Available:</span>
                  <span style={styles.scannedDataValue}>{scannedQRData.quantityAvailable || 'N/A'} kg</span>
                </div>
                <div style={styles.scannedDataItem}>
                  <span style={styles.scannedDataLabel}>Harvest Date:</span>
                  <span style={styles.scannedDataValue}>
                    {scannedQRData.harvestDate ? new Date(scannedQRData.harvestDate).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                {/* {scannedQRData.farmer && (
                  <div style={styles.scannedDataItem}>
                    <span style={styles.scannedDataLabel}>Farmer:</span>
                    <span style={styles.scannedDataValue}>{scannedQRData.farmer.name || 'N/A'}</span>
                  </div>
                )} */}
              </div>
              
              {scannedQRData.description && (
                <div style={styles.descriptionSection}>
                  <span style={styles.scannedDataLabel}>Description:</span>
                  <p style={styles.descriptionText}>{scannedQRData.description}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        {/* Header */}
        <div style={styles.headerCard}>
          <div style={styles.headerBackground}>
            <div style={styles.headerContent}>
              <div style={styles.headerLeft}>
                <div style={styles.headerIcon}>
                  <ShoppingBag size={24} style={{color: 'white'}} />
                </div>
                <div>
                  <h1 style={styles.headerTitle}>Customer Dashboard</h1>
                  <p style={styles.headerSubtitle}>Browse fresh products from retailers and manage your purchases</p>
                </div>
              </div>
              <div style={styles.headerRight}>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{currentUser?.name || 'Customer'}</p>
                  <p style={styles.userRole}>Customer Account</p>
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
                <ShoppingBag size={24} style={{color: '#7c3aed'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Available Products</p>
                <p style={styles.statValue}>{stats.availableProducts}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <History size={24} style={{color: '#7c3aed'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>My Transactions</p>
                <p style={styles.statValue}>{stats.totalTransactions}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Truck size={24} style={{color: '#7c3aed'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Pending Delivery</p>
                <p style={styles.statValue}>{stats.pendingDeliveries}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <CreditCard size={24} style={{color: '#7c3aed'}} />
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
                { id: 'available-products', label: 'Available Products', icon: ShoppingBag },
                { id: 'my-transactions', label: 'My Transactions', icon: History },
                { id: 'qr-scanner', label: 'QR Scanner', icon: QrCode }
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
          {activeTab === 'available-products' && <AvailableProductsTab />}
          {activeTab === 'my-transactions' && <MyTransactionsTab />}
          {activeTab === 'qr-scanner' && <QRScannerTab />}
        </div>

        {/* Quantity Selection Modal */}
        {showQuantityModal && selectedBatch && (
          <div style={styles.modalOverlay}>
            <div style={styles.modal}>
              <div style={styles.modalHeader}>
                <h3 style={styles.modalTitle}>Purchase {selectedBatch.crop?.name}</h3>
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
                    <span style={styles.purchaseValue}>₹{selectedBatch.pricePerUnit}</span>
                  </div>
                  <div style={styles.purchaseDetail}>
                    <span style={styles.purchaseLabel}>Retailer:</span>
                    <span style={styles.purchaseValue}>{selectedBatch.user?.name || 'Retailer'}</span>
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
                    style={styles.quantityInput}
                    placeholder="Enter quantity"
                  />
                </div>

                {purchaseQuantity && (
                  <div style={styles.amountSummary}>
                    <div style={styles.amountRow}>
                      <span>Subtotal:</span>
                      <span>₹{(selectedBatch.pricePerUnit * purchaseQuantity).toFixed(2)}</span>
                    </div>
                    <div style={styles.amountTotal}>
                      <span>Total Amount:</span>
                      <span>₹{(selectedBatch.pricePerUnit * purchaseQuantity).toFixed(2)}</span>
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

        {/* Product Details Modal */}
        {showProductDetails && selectedProduct && (
          <div style={styles.modalOverlay} onClick={() => setShowProductDetails(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Product Details</h2>
                <button onClick={() => setShowProductDetails(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <div style={styles.modalContent}>
                <div style={styles.productDetailGrid}>
                  <div style={styles.productImageSection}>
                    {selectedProduct.crop?.imageUrl ? (
                      <img 
                        src={selectedProduct.crop.imageUrl} 
                        alt={selectedProduct.crop?.name}
                        style={styles.detailProductImage}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div style={{
                      ...styles.detailImagePlaceholder,
                      display: !selectedProduct.crop?.imageUrl ? 'flex' : 'none'
                    }}>
                      <Package size={48} style={{color: '#9ca3af'}} />
                    </div>
                  </div>

                  <div style={styles.productInfoSection}>
                    <h3 style={styles.detailProductName}>{selectedProduct.crop?.name}</h3>
                    {getBatchStatusBadge(selectedProduct.status || 'AVAILABLE')}
                    
                    <div style={styles.detailPrice}>₹{selectedProduct.pricePerUnit}/{selectedProduct.unit || 'kg'}</div>
                    
                    <div style={styles.detailList}>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Retailer : </span>
                        <span style={styles.detailValue}>{selectedProduct.user?.name || 'Retailer'}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Available Quantity : </span>
                        <span style={styles.detailValue}>{selectedProduct.availableQuantity || selectedProduct.quantity} {selectedProduct.unit || 'kg'}</span>
                      </div>
                      <div style={styles.detailItem}>
                        <span style={styles.detailLabel}>Harvest Date : </span>
                        <span style={styles.detailValue}>
                          {selectedProduct.harvestDate ? new Date(selectedProduct.harvestDate).toLocaleDateString() : 'N/A'}
                        </span>
                      </div>
                      {selectedProduct.storageConditions && (
                        <div style={styles.detailItem}>
                          <span style={styles.detailLabel}>Storage Conditions:</span>
                          <span style={styles.detailValue}>{selectedProduct.storageConditions}</span>
                        </div>
                      )}
                    </div>

                    {/* Reviews Section */}
                    {selectedProduct.reviews && selectedProduct.reviews.length > 0 && (
                      <div style={styles.reviewsSection}>
                        <h4 style={styles.reviewsTitle}>
                          Customer Reviews ({selectedProduct.reviews.length})
                        </h4>
                        <div style={styles.averageRating}>
                          {renderStars(calculateAverageRating(selectedProduct.reviews))}
                          <span style={styles.ratingText}>
                            {calculateAverageRating(selectedProduct.reviews)} out of 5
                          </span>
                        </div>
                        <div style={styles.reviewsList}>
                          {selectedProduct.reviews.slice(0, 3).map((review) => (
                            <div key={review.reviewId} style={styles.reviewItem}>
                              <div style={styles.reviewHeader}>
                                <span style={styles.reviewerName}>{review.reviewerName || 'Customer'}</span>
                                {renderStars(review.rating, 14)}
                              </div>
                              {review.comment && (
                                <p style={styles.reviewComment}>{review.comment}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div style={styles.detailActions}>
                      <button 
                        onClick={() => handlePurchaseInitiate(selectedProduct)}
                        disabled={processingPayment && processingPurchaseId === selectedProduct.batchId || (selectedProduct.status && selectedProduct.status !== 'AVAILABLE')}
                        style={{
                          ...styles.purchaseButton,
                          ...((processingPayment && processingPurchaseId === selectedProduct.batchId) && styles.buttonDisabled),
                          ...((selectedProduct.status && selectedProduct.status !== 'AVAILABLE') && styles.buttonDisabled)
                        }}
                      >
                        {processingPayment && processingPurchaseId === selectedProduct.batchId ? (
                          <>
                            <div style={styles.buttonSpinner}></div>
                            Processing...
                          </>
                        ) : (selectedProduct.status && selectedProduct.status !== 'AVAILABLE') ? (
                          'Not Available'
                        ) : (
                          <>
                            <ShoppingCart size={16} style={{marginRight: 8}} />
                            Buy Now
                          </>
                        )}
                      </button>
                      
                      {/* Download QR Button */}
                      <button 
                        onClick={() => downloadQRCode(selectedProduct)}
                        style={styles.purchaseButton}
                      >
                        <Download size={16} style={{marginRight: 8}} />
                        Download QR
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Review Modal */}
        {showReviewModal && selectedTransactionForReview && (
          <div style={styles.modalOverlay} onClick={() => setShowReviewModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Write a Review</h2>
                <button onClick={() => setShowReviewModal(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmitReview} style={styles.modalContent}>
                <div style={styles.reviewProductInfo}>
                  <h4 style={styles.reviewProductName}>
                    {selectedTransactionForReview.batch?.crop?.name || 'Product'}
                  </h4>
                  <p style={styles.reviewRetailer}>
                    Purchased from: {selectedTransactionForReview.fromUser?.name || 'Retailer'}
                  </p>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Rating *</label>
                  <div style={styles.ratingInput}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewFormData({...reviewFormData, rating: star})}
                        style={styles.starButton}
                      >
                        <Star
                          size={32}
                          style={{
                            color: star <= reviewFormData.rating ? '#f59e0b' : '#d1d5db',
                            fill: star <= reviewFormData.rating ? '#f59e0b' : 'transparent',
                            cursor: 'pointer'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Your Review</label>
                  <textarea
                    value={reviewFormData.comment}
                    onChange={(e) => setReviewFormData({...reviewFormData, comment: e.target.value})}
                    style={styles.textarea}
                    rows={4}
                    placeholder="Share your experience with this product..."
                  />
                </div>

                <div style={styles.modalActions}>
                  <button 
                    type="button"
                    onClick={() => setShowReviewModal(false)}
                    style={styles.cancelButton}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isSubmittingReview}
                    style={{
                      ...styles.submitButton,
                      ...(isSubmittingReview && styles.submitButtonDisabled)
                    }}
                  >
                    {isSubmittingReview ? (
                      <>
                        <div style={styles.buttonSpinner}></div>
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Star size={16} style={{marginRight: 6}} />
                        Submit Review
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// CSS Styles with Purple Color Scheme
const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(90deg, #fbf8ff 0%, #f3ecff 100%)',
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
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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
    background: '#faf5ff',
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
    color: '#7c3aed',
    margin: 0,
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
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 4px rgba(124, 58, 237, 0.2)'
  },

  // Tab Content
  tabContent: {
    background: 'white',
    minHeight: '500px'
  },
  tabContentInner: {
    padding: '24px'
  },

  // Action Bar Styles
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
    background: '#7c3aed',
    color: 'white',
    borderColor: '#7c3aed'
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
    background: '#ef4444',
    borderRadius: '50%'
  },

  // Advanced Filters
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
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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

  // Products Grid
  productsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  productCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  productImageContainer: {
    position: 'relative',
    height: '200px',
    overflow: 'hidden'
  },
  productImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productOverlay: {
    position: 'absolute',
    top: '12px',
    left: '12px',
    right: '12px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  viewDetailsButton: {
    background: 'rgba(255, 255, 255, 0.9)',
    border: 'none',
    borderRadius: '6px',
    padding: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease',
    color: 'purple'
  },
  productContent: {
    padding: '16px'
  },
  productHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '12px'
  },
  productName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0,
    flex: 1
  },
  productPrice: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#7c3aed',
    marginLeft: '12px'
  },
  productDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px'
  },
  productDetail: {
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  },
  detailLabel: {
    color: '#6b7280',
    marginRight: '8px',
    minWidth: '80px'
  },
  detailValue: {
    color: '#374151',
    fontWeight: '500'
  },
  productActions: {
    display: 'flex',
    gap: '8px'
  },
  purchaseButton: {
    padding: '12px 16px',
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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
    color: '#7c3aed',
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
  transactionActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  reviewButton: {
    padding: '8px 12px',
    background: '#fef3c7',
    border: '1px solid #f59e0b',
    borderRadius: '6px',
    color: '#92400e',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },
  reviewedBadge: {
    padding: '8px 12px',
    background: '#f0fdf4',
    border: '1px solid #0a8a3a',
    borderRadius: '6px',
    color: '#0a8a3a',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.7
  },
  pendingReviewBadge: {
    padding: '8px 12px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#6b7280',
    fontSize: '12px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    opacity: 0.7
  },

  // QR Scanner Styles
  qrScannerContainer: {
    maxWidth: '800px',
    margin: '0 auto'
  },
  qrScannerHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '32px',
    padding: '20px',
    background: 'linear-gradient(90deg, #faf5ff 0%, #f3ecff 100%)',
    borderRadius: '12px'
  },
  qrScannerIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.1)'
  },
  qrScannerTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#7c3aed',
    margin: 0
  },
  qrScannerSubtitle: {
    fontSize: '15px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  qrUploadSection: {
    marginBottom: '32px'
  },
  uploadArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    padding: '40px',
    textAlign: 'center',
    transition: 'border-color 0.2s ease',
    background: '#f9fafb'
  },
  uploadTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 8px 0'
  },
  uploadDescription: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 20px 0'
  },
  fileInput: {
    display: 'none'
  },
  uploadButton: {
    padding: '12px 24px',
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'inline-flex',
    alignItems: 'center',
    transition: 'all 0.2s ease'
  },
  uploadHint: {
    fontSize: '12px',
    color: '#9ca3af',
    margin: '12px 0 0 0'
  },
  scannedDataSection: {
    marginTop: '32px'
  },
  scannedDataHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  scannedDataTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  clearButton: {
    padding: '8px 12px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    borderRadius: '6px',
    color: '#dc2626',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  scannedDataCard: {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '24px'
  },
  scannedDataGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '16px',
    marginBottom: '20px'
  },
  scannedDataItem: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  scannedDataLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500'
  },
  scannedDataValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600'
  },
  descriptionSection: {
    marginBottom: '20px'
  },
  descriptionText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.5',
    margin: '8px 0 0 0'
  },
  imageSection: {
    marginTop: '20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: '12px',
    gap: '8px'
  },
  scannedImage: {
    width: '200px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
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

  // Quantity Modal Styles
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
    color: '#7c3aed'
  },

  // Product Details Modal
  productDetailGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '32px'
  },
  productImageSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  detailProductImage: {
    width: '100%',
    height: '300px',
    objectFit: 'cover',
    borderRadius: '8px'
  },
  detailImagePlaceholder: {
    width: '100%',
    height: '300px',
    background: '#f9fafb',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  productInfoSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  detailProductName: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },
  detailPrice: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#7c3aed'
  },
  detailList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  detailItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0'
  },
  detailLabel: {
    marginRight: '10px',
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '14px',
    color: '#374151',
    fontWeight: '600'
  },
  reviewsSection: {
    marginTop: '20px',
    paddingTop: '20px',
    borderTop: '1px solid #e5e7eb'
  },
  reviewsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 12px 0'
  },
  averageRating: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  ratingText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  reviewsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  reviewItem: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
  },
  reviewerName: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151'
  },
  reviewComment: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0,
    lineHeight: '1.5'
  },
  detailActions: {
    marginTop: '20px',
    display: 'flex',
    gap: '12px'
  },
  downloadQRButton: {
    padding: '12px 16px',
    background: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#374151',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    flex: 1,
    justifyContent: 'center'
  },

  // Review Modal Styles
  reviewProductInfo: {
    background: '#f8fafc',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  reviewProductName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  reviewRetailer: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  formGroup: {
    marginBottom: '20px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '8px',
    display: 'block'
  },
  ratingInput: {
    display: 'flex',
    gap: '4px'
  },
  starButton: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px'
  },
  textarea: {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    fontFamily: 'inherit',
    resize: 'vertical',
    minHeight: '100px',
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
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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
    borderTop: '3px solid #7c3aed',
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
    background: '#faf5ff',
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
  clearFiltersButton: {
    padding: '10px 20px',
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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
  },

  // Refresh Button
  refreshButton: {
    padding: '10px 16px',
    background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    marginLeft: 'auto'
  },
  refreshButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    background: '#f3f4f6'
  },
  quantityInput: {
  width: '100%',
  padding: '12px 16px',
  paddingRight: '10px', // Space for unit display
  borderRadius: '8px',
  border: '2px solid #d1d5db',
  fontSize: '16px',
  fontWeight: '500',
  outline: 'none',
  transition: 'all 0.2s ease',
  boxSizing: 'border-box',
  '&:focus': {
    borderColor: '#7c3aed',
    boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.1)'
  },
  '&:hover': {
    borderColor: '#9ca3af'
  },
  // Add these to your styles object
reviewedBadge: {
  padding: '8px 12px',
  background: '#f0fdf4',
  border: '1px solid #0a8a3a',
  borderRadius: '6px',
  color: '#0a8a3a',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  opacity: 0.7
},
pendingReviewBadge: {
  padding: '8px 12px',
  background: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  opacity: 0.7
},
// Add to your styles object:
reviewedBadge: {
  padding: '8px 12px',
  background: '#f0fdf4',
  border: '1px solid #0a8a3a',
  borderRadius: '6px',
  color: '#0a8a3a',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  opacity: 0.7
},
pendingReviewBadge: {
  padding: '8px 12px',
  background: '#f3f4f6',
  border: '1px solid #d1d5db',
  borderRadius: '6px',
  color: '#6b7280',
  fontSize: '12px',
  fontWeight: '500',
  display: 'flex',
  alignItems: 'center',
  opacity: 0.7
},
// Add to your styles object
scannedImagePlaceholder: {
  width: '200px',
  height: '200px',
  background: '#f9fafb',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  marginTop: '8px'
}
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

export default CustomerDashboard;