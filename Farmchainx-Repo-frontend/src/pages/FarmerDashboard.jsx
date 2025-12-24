import React, { useState, useEffect } from 'react';
import { 
  Package, LogOut, Plus, Eye, Trash2, Download, QrCode, 
  TrendingUp, AlertCircle, CheckCircle, Truck, X, 
  BarChart3, Users, CreditCard, Receipt, Settings, Shield, Calendar,
  User, Star, RefreshCw, Upload
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import CreateBatches from './CreateBatches';
import FarmerTransactions from './FarmerTransactions';

const FarmerDashboard = () => {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [activeTab, setActiveTab] = useState('crops');
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewingCrop, setViewingCrop] = useState(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedCropReviews, setSelectedCropReviews] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const [formData, setFormData] = useState({
    name: '',
    variety: '',
    season: 'Year-round',
    growingPeriod: '',
    description: '',
    pricePerKg: '',
    quantityAvailable: '',
    imageUrl: '', // This will store base64 string
    imagePreview: '',
    harvestDate: ''
  });

  const [formErrors, setFormErrors] = useState({});

  const BASE_URL = 'http://localhost:8080';

  // Get today's date in YYYY-MM-DD format for min date attribute
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get tomorrow's date in YYYY-MM-DD format for default value
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const convertToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

 
const handleFileSelect = async (e) => {
  const file = e.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP)');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    try {
      console.log('Original file size:', (file.size / 1024).toFixed(2), 'KB');
      const resizedBase64 = await resizeImage(file, 600); // Even smaller - 600px max width
      
      setFormData(prev => ({
        ...prev,
        imageUrl: resizedBase64,
        imagePreview: resizedBase64
      }));
      
      setMessage('Image resized and added successfully!');
    } catch (err) {
      console.error('Error resizing image:', err);
      // Fallback to original base64 if resizing fails
      const fallbackBase64 = await convertToBase64(file);
      setFormData(prev => ({
        ...prev,
        imageUrl: fallbackBase64,
        imagePreview: fallbackBase64
      }));
      setMessage('Image added (fallback mode)!');
    }
  }
};

  const handlePaste = async (e) => {
  const items = e.clipboardData?.items;
  if (items) {
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) {
          // Validate file size
          if (file.size > 2 * 1024 * 1024) {
            setError('Image size should be less than 2MB');
            return;
          }

          try {
            const base64String = await convertToBase64(file);
            setFormData(prev => ({
              ...prev,
              imageFile: file,
              imageUrl: base64String,
              imagePreview: base64String
            }));
            setMessage('Image pasted successfully!');
            break;
          } catch (err) {
            console.error('Error processing pasted image:', err);
            setError('Failed to process pasted image');
          }
        }
      }
    }
  }
};

  // Get auth token
  const getAuthToken = () => {
    return localStorage.getItem('token') || 
           localStorage.getItem('authToken') || 
           localStorage.getItem('accessToken');
  };

  // Get user role with normalization
  const getUserRole = () => {
    const role = localStorage.getItem('userRole') || 
                  localStorage.getItem('role') || 
                  currentUser?.role ||
                  currentUser?.userRole;
    
    // Normalize role names
    if (role?.includes('FARMER') || role?.includes('ROLE_FARMER') || role === 'farmer') {
      return 'FARMER';
    }
    if (role?.includes('DISTRIBUTOR') || role?.includes('ROLE_DISTRIBUTOR') || role === 'distributor') {
      return 'DISTRIBUTOR';
    }
    if (role?.includes('RETAILER') || role?.includes('ROLE_RETAILER') || role === 'retailer') {
      return 'RETAILER';
    }
    return role;
  };

  // Get current user
  const getCurrentUser = async () => {
    try {
      const userId = localStorage.getItem('userId');
      
      if (!userId) {
        console.error('No user ID found in localStorage');
        return null;
      }

      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        return null;
      }

      console.log('Fetching user data for ID:', userId);
      
      // Try primary endpoint
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
        
        // Store user role in localStorage for consistency
        if (userData.role) {
          localStorage.setItem('userRole', userData.role);
        }
        if (userData.id && !localStorage.getItem('id')) {
          localStorage.setItem('id', userData.id);
        }
        
        return userData;
      }

      // If primary endpoint fails, try alternatives
      return await tryAlternativeUserEndpoints(userId, token);
      
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  };


  // Alternative user endpoints fallback
  const tryAlternativeUserEndpoints = async (userId, token) => {
    const endpoints = [
      `${BASE_URL}/users/${userId}`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const userData = await response.json();
          console.log('User data fetched from alternative endpoint:', userData);
          
          if (userData.role) {
            localStorage.setItem('userRole', userData.role);
          }
          if (userData.id && !localStorage.getItem('id')) {
            localStorage.setItem('id', userData.id);
          }
          
          return userData;
        }
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
      }
    }
    return null;
  };

  const fetchCropReviews = async (cropId) => {
    try {
      setReviewsLoading(true);
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/reviews/crop/${cropId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const reviewsData = await response.json();
      setReviews(reviewsData || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to fetch reviews');
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  };

  // Add this function to handle viewing reviews
  const handleViewReviews = async (crop) => {
    setSelectedCropReviews(crop);
    setShowReviewsModal(true);
    await fetchCropReviews(crop.cropId);
  };

  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('');
  const [isFarmer, setIsFarmer] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const getUserId = () => {
    return localStorage.getItem('id') || 
           localStorage.getItem('userId') || 
           localStorage.getItem('farmerId') || 
           currentUser?.id;
  };

  // Initialize user data
  useEffect(() => {
    const initializeUser = async () => {
      const token = getAuthToken();
      if (!token) {
        console.error('No authentication token found');
        setIsAuthenticated(false);
        return;
      }

      setIsAuthenticated(true);
      const user = await getCurrentUser();
      setCurrentUser(user);
      
      const role = getUserRole();
      setUserRole(role);
      setIsFarmer(role === 'FARMER');
      
      console.log('User initialized:', { user, role, isFarmer: role === 'FARMER' });
    };
    
    initializeUser();
  }, []);
    useEffect(() => {
  if (showQRModal && selectedCrop) {
    const loadQRCode = async () => {
      try {
        const url = await fetchQRCode(selectedCrop.cropId);
        setQrCodeUrl(url);
      } catch (err) {
        console.error('Failed to load QR code:', err);
        setError('Failed to load QR code');
      }
    };
    loadQRCode();
  }
}, [showQRModal, selectedCrop]);

  // Validate form data
  const validateForm = () => {
    const errors = {};

    // Required fields validation
    if (!formData.name.trim()) errors.name = 'Crop name is required';
    if (!formData.variety.trim()) errors.variety = 'Variety is required';
    if (!formData.quantityAvailable || formData.quantityAvailable <= 0) 
      errors.quantityAvailable = 'Valid quantity is required';
    if (!formData.pricePerKg || formData.pricePerKg <= 0) 
      errors.pricePerKg = 'Valid price is required';

    // Harvest date validation - must be in future
    if (formData.harvestDate) {
      const harvestDate = new Date(formData.harvestDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time part for accurate comparison
      
      if (harvestDate <= today) {
        errors.harvestDate = 'Harvest date must be in the future';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Clear messages and errors
  useEffect(() => {
    if (message || error) {
      const timer = setTimeout(() => {
        setMessage('');
        setError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message, error]);

  // Clear form errors when modal closes
  useEffect(() => {
    if (!showAddModal) {
      setFormErrors({});
    }
  }, [showAddModal]);

  // Fetch crops from backend
  const fetchCrops = async () => {
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

      // Try different endpoints based on user role
      const endpoints = [
        `${BASE_URL}/crop/farmer/${userId}`
      ];

      let cropsData = [];
      let lastError = '';

      for (const endpoint of endpoints) {
        try {
          console.log('Trying endpoint:', endpoint);
          const response = await fetch(endpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            cropsData = await response.json();
            console.log('Crops fetched successfully:', cropsData);
            break;
          } else {
            lastError = `HTTP ${response.status}: ${response.statusText}`;
          }
        } catch (err) {
          lastError = err.message;
          console.error(`Error with endpoint ${endpoint}:`, err);
        }
      }

      if (cropsData.length === 0 && lastError) {
        throw new Error(`Failed to fetch crops: ${lastError}`);
      }
      
      setCrops(cropsData || []);
    } catch (err) {
      console.error('Error fetching crops:', err);
      setError(err.message || 'Failed to fetch crops');
      setCrops([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch crops on mount when authenticated and farmer
  useEffect(() => {
    if (isAuthenticated && isFarmer) {
      fetchCrops();
    }
  }, [isAuthenticated, isFarmer]);

  // Refresh function
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      switch(activeTab) {
        case 'crops':
          await fetchCrops();
          break;
        case 'batches':
          setRefreshTrigger(prev => prev + 1);
          break;
        case 'transactions':
          setRefreshTrigger(prev => prev + 1);
          break;
        default:
          await fetchCrops();
      }
    } catch (err) {
      setError('Failed to refresh data');
    } finally {
      setRefreshing(false);
    }
  };

const resizeImage = (file, maxWidth = 800) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = function(e) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Calculate new dimensions
        let width = img.width;
        let height = img.height;
        
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw and resize image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to base64 with JPEG compression (70% quality)
        try {
          const resizedBase64 = canvas.toDataURL('image/jpeg', 0.7);
          console.log('Original dimensions:', img.width, 'x', img.height);
          console.log('Resized dimensions:', width, 'x', height);
          console.log('Resized base64 size:', resizedBase64.length, 'characters');
          resolve(resizedBase64);
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = e.target.result;
    };
    
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};
const handleAddCrop = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    setError('Please fix the form errors before submitting.');
    return;
  }

  setIsSubmitting(true);
  
  try {
    const userId = getUserId();
    const token = getAuthToken();

    if (!userId || !token) {
      throw new Error('Authentication required. Please login again.');
    }

    // Prepare crop data with base64 image - use formData.imageUrl directly
    const cropData = {
      name: formData.name,
      variety: formData.variety,
      season: formData.season,
      growingPeriod: formData.growingPeriod || '',
      description: formData.description || '',
      pricePerKg: parseFloat(formData.pricePerKg),
      quantityAvailable: parseFloat(formData.quantityAvailable),
      harvestDate: formData.harvestDate,
      imageUrl: formData.imageUrl || '' // Use the resized base64 from formData
    };

    console.log('Adding crop with base64 image...');
    console.log('Image URL length:', cropData.imageUrl.length);
    console.log('Crop Data:', { ...cropData, imageUrl: cropData.imageUrl ? `base64_length: ${cropData.imageUrl.length}` : 'empty' });

    // Use your existing endpoint that expects JSON
    const response = await fetch(`${BASE_URL}/crop?farmerId=${localStorage.getItem("id")}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(cropData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to add crop: ${response.status} - ${errorText}`);
    }

    const savedCrop = await response.json();
    console.log('Crop added successfully:', savedCrop);
    
    setMessage('Crop added successfully!');
    setShowAddModal(false);
    resetFormData();
    fetchCrops();
  } catch (err) {
    console.error('Error adding crop:', err);
    setError(err.message || 'Failed to add crop. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      variety: '',
      season: 'Year-round',
      growingPeriod: '',
      description: '',
      pricePerKg: '',
      quantityAvailable: '',
      imageUrl: '',
      imagePreview: '',
      harvestDate: getTomorrowDate()
    });
    setFormErrors({});
  };

  // Handle input change with validation
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear field-specific error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Reset form when opening modal
  const handleOpenAddModal = () => {
    if (!isFarmer) {
      setError('Only farmers can add crops. Your role: ' + userRole);
      return;
    }

    setFormData({
      name: '',
      variety: '',
      season: 'Year-round',
      growingPeriod: '',
      description: '',
      pricePerKg: '',
      quantityAvailable: '',
      imageUrl: '',
      imagePreview: '',
      harvestDate: getTomorrowDate()
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  // Delete crop
  const handleDeleteCrop = async (cropId) => {
    // if (!window.confirm('Are you sure you want to delete this crop?')) return;
    
    try {
      const token = getAuthToken();
      const response = await fetch(`${BASE_URL}/crop/${cropId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete crop');
      setMessage('Crop deleted successfully!');
      fetchCrops();
    } catch (err) {
      console.error('Error deleting crop:', err);
      setError(err.message || 'Failed to delete crop');
    }
  };

  // Calculate statistics
  const stats = {
    totalCrops: crops.length,
    totalQuantity: crops.reduce((sum, crop) => sum + (crop.quantityAvailable || 0), 0),
    totalValue: crops.reduce((sum, crop) => sum + ((crop.pricePerKg || 0) * (crop.quantityAvailable || 0)), 0),
    avgPrice: crops.length > 0 ? crops.reduce((sum, crop) => sum + (crop.pricePerKg || 0), 0) / crops.length : 0
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('role');
    localStorage.removeItem('user');
    localStorage.removeItem('id');
    localStorage.removeItem('userId');
    localStorage.removeItem('farmerId');
    window.location.href = '/';
  };

  // Download QR Code
 // Fetch QR code from backend
const fetchQRCode = async (cropId) => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${BASE_URL}/crop/${cropId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch QRkdvvcode');
    }

    // Assuming backend returns base64 image or image URL
    const qrData = await response.json();
    return qrData.qrCodeBase64;
  } catch (err) {
    console.error('Error fetching QR code:', err);
    throw err;
  }
};

// Download QR code from backend
const handleDownloadQR = async (crop) => {
  try {
    const qrCodeUrl = await fetchQRCode(crop.cropId);
    
    // If it's a base64 string
    if (qrCodeUrl.startsWith('data:image')) {
      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `crop-${crop.cropId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } 
    // If it's a URL
    else {
      const a = document.createElement('a');
      a.href = qrCodeUrl;
      a.download = `crop-${crop.cropId}-qr.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    
    setMessage('QR code downloaded successfully!');
  } catch (err) {
    console.error('Error downloading QR code:', err);
    setError('Failed to download QR code');
  }
};

  // Authentication Check Component
  const AuthCheck = () => (
    <div style={styles.authContainer}>
      <div style={styles.authCard}>
        <div style={styles.authIcon}>
          <Shield size={32} style={{color: '#147a48'}} />
        </div>
        <h2 style={styles.authTitle}>Authentication Required</h2>
        <p style={styles.authText}>
          {!isAuthenticated 
            ? 'Please log in to access the farmer dashboard.'
            : `Access denied. Your role (${userRole || 'Unknown'}) does not have permission to access this dashboard.`
          }
        </p>
        <button 
          onClick={() => window.location.href = '/'}
          style={styles.authButton}
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  // Loading Component
  const LoadingComponent = () => (
    <div style={styles.loadingContainer}>
      <div style={styles.loadingCard}>
        <div style={styles.spinnerContainer}>
          <div style={styles.spinner}></div>
        </div>
        <p style={styles.loadingText}>Loading Dashboard...</p>
      </div>
    </div>
  );

  // Check authentication and permissions
  if (!isAuthenticated) {
    return <AuthCheck />;
  }

  if (loading) {
    return <LoadingComponent />;
  }

  if (!isFarmer) {
    return <AuthCheck />;
  }

  // Tab Components
  const CropsTab = () => (
    <div style={styles.tabContentInner}>
      <div style={styles.actionBar}>
        <button onClick={handleOpenAddModal} style={styles.addButton}>
          <Plus size={20} style={{marginRight: 8}} />
          Add New Crop
        </button>
      </div>

      {crops.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>
            <Package size={48} style={{color: '#147a48'}} />
          </div>
          <h3 style={styles.emptyTitle}>No crops yet</h3>
          <p style={styles.emptyText}>Start by adding your first crop to the system</p>
          <button onClick={handleOpenAddModal} style={styles.emptyButton}>
            <Plus size={20} style={{marginRight: 8}} />
            Add Your First Crop
          </button>
        </div>
      ) : (
        <div style={styles.cropsGrid}>
          {crops.map((crop) => (
            <div key={crop.cropId} style={styles.cropCard}>
              {crop.imageUrl && (
                <div style={styles.cropImage}>
                  <img src={crop.imageUrl} alt={crop.name} style={styles.cropImg} />
                </div>
              )}
              <div style={styles.cropContent}>
                <h3 style={styles.cropName}>{crop.name}</h3>
                <p style={styles.cropVariety}>{crop.variety}</p>
                
                <div style={styles.cropDetails}>
                  <div style={styles.cropDetail}>
                    <span style={styles.detailLabel}>Season:</span>
                    <span style={styles.detailValue}>{crop.season}</span>
                  </div>
                  {crop.harvestDate && (
                    <div style={styles.cropDetail}>
                      <span style={styles.detailLabel}>Harvest Date:</span>
                      <span style={styles.detailValue}>
                        {new Date(crop.harvestDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div style={styles.cropDetail}>
                    <span style={styles.detailLabel}>Quantity:</span>
                    <span style={styles.detailValue}>{crop.quantityAvailable} kg</span>
                  </div>
                  <div style={styles.cropDetail}>
                    <span style={styles.detailLabel}>Price:</span>
                    <span style={styles.detailValue}>₹{crop.pricePerKg}/kg</span>
                  </div>
                  {crop.growingPeriod && (
                    <div style={styles.cropDetail}>
                      <span style={styles.detailLabel}>Growing Period:</span>
                      <span style={styles.detailValue}>{crop.growingPeriod}</span>
                    </div>
                  )}
                </div>

                {crop.description && (
                  <p style={styles.cropDescription}>{crop.description}</p>
                )}

                <div style={styles.cropActions}>
                  <button 
                    onClick={() => setViewingCrop(crop)}
                    style={styles.viewButton}
                  >
                    <Eye size={14} style={{marginRight: 4}} />
                    View
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedCrop(crop);
                      setShowQRModal(true);
                    }}
                    style={styles.qrButton}
                  >
                    <QrCode size={14} style={{marginRight: 4}} />
                    QR Code
                  </button>
                  <button 
                    onClick={() => handleViewReviews(crop)}
                    style={styles.reviewsButton}
                  >
                    <Star size={14} style={{marginRight: 4}} />
                    Reviews
                  </button>
                  <button 
                    onClick={() => handleDeleteCrop(crop.cropId)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={14} style={{marginRight: 4}} />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const SettingsTab = () => (
    <div style={styles.tabContentInner}>
      <div style={styles.settingsGrid}>
        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>Account Information</h3>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>User ID</label>
            <input
              type="text"
              value={getUserId() || 'Not available'}
              style={{...styles.settingsInput, background: '#f9fafb'}}
              disabled
            />
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>User Role</label>
            <input
              type="text"
              value={userRole || 'Not available'}
              style={{...styles.settingsInput, background: '#f9fafb'}}
              disabled
            />
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Name</label>
            <input
              type="text"
              value={currentUser?.name || 'Not available'}
              style={{...styles.settingsInput, background: '#f9fafb'}}
              disabled
            />
          </div>
        </div>

        <div style={styles.settingsCard}>
          <h3 style={styles.settingsTitle}>System Information</h3>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Total Crops</label>
            <input
              type="text"
              value={stats.totalCrops}
              style={{...styles.settingsInput, background: '#f9fafb'}}
              disabled
            />
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Total Inventory</label>
            <input
              type="text"
              value={`${stats.totalQuantity.toFixed(2)} kg`}
              style={{...styles.settingsInput, background: '#f9fafb'}}
              disabled
            />
          </div>
          <div style={styles.settingsItem}>
            <label style={styles.settingsLabel}>Total Value</label>
            <input
              type="text"
              value={`₹${stats.totalValue.toFixed(2)}`}
              style={{...styles.settingsInput, background: '#f9fafb'}}
              disabled
            />
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
                  <Package size={24} style={{color: 'white'}} />
                </div>
                <div>
                  <h1 style={styles.headerTitle}>Farmer Dashboard</h1>
                  <p style={styles.headerSubtitle}>Manage your crops, track production and sales</p>
                </div>
              </div>
              <div style={styles.headerRight}>
                <div style={styles.userInfo}>
                  <p style={styles.userName}>{currentUser?.name || 'Farmer'}</p>
                  <p style={styles.userRole}>{userRole} Account</p>
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
                <Package size={24} style={{color: '#147a48'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Crops</p>
                <p style={styles.statValue}>{stats.totalCrops}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <TrendingUp size={24} style={{color: '#0a8a3a'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Quantity</p>
                <p style={styles.statValue}>{stats.totalQuantity.toFixed(2)} kg</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <CheckCircle size={24} style={{color: '#17a461'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Total Value</p>
                <p style={styles.statValue}>₹{stats.totalValue.toFixed(2)}</p>
              </div>
            </div>

            <div style={styles.statCard}>
              <div style={styles.statIcon}>
                <Truck size={24} style={{color: '#0d9488'}} />
              </div>
              <div style={styles.statContent}>
                <p style={styles.statLabel}>Avg Price/kg</p>
                <p style={styles.statValue}>₹{stats.avgPrice.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Main Tabs */}
          <div style={styles.tabsContainer}>
            <div style={styles.tabs}>
              {[
                { id: 'crops', label: 'My Crops', icon: Package },
                { id: 'batches', label: 'Create Batches', icon: TrendingUp },
                { id: 'transactions', label: 'Delivery Management', icon: Receipt },
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
              {/* Add refresh button */}
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
          </div>
        )}

        {/* Tab Content */}
        <div style={styles.tabContent}>
            {activeTab === 'crops' && <CropsTab />}
            {activeTab === 'batches' && <CreateBatches crops={crops} key={refreshTrigger} />}
            {activeTab === 'transactions' && <FarmerTransactions key={refreshTrigger} />}
            {activeTab === 'settings' && <SettingsTab />}
        </div>

        {/* Reviews Modal */}
        {showReviewsModal && selectedCropReviews && (
          <div style={styles.modalOverlay} onClick={() => setShowReviewsModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>
                  Reviews - {selectedCropReviews.name}
                </h2>
                <button 
                  onClick={() => setShowReviewsModal(false)} 
                  style={styles.closeButton}
                >
                  <X size={24} />
                </button>
              </div>

              <div style={styles.modalContent}>
                {reviewsLoading ? (
                  <div style={styles.loadingState}>
                    <div style={styles.reviewsSpinner}></div>
                    <p>Loading reviews...</p>
                  </div>
                ) : reviews.length === 0 ? (
                  <div style={styles.emptyReviewsState}>
                    <Star size={48} style={{color: '#d1d5db', marginBottom: 16}} />
                    <h3 style={styles.emptyReviewsTitle}>No Reviews Yet</h3>
                    <p style={styles.emptyReviewsText}>
                      This crop hasn't received any reviews yet.
                    </p>
                  </div>
                ) : (
                  <div style={styles.reviewsList}>
                    <div style={styles.reviewsSummary}>
                      <div style={styles.averageRating}>
                        <span style={styles.averageRatingValue}>
                          {(
                            reviews.reduce((sum, review) => sum + review.rating, 0) / 
                            reviews.length
                          ).toFixed(1)}
                        </span>
                        <span style={styles.averageRatingTotal}>/5</span>
                      </div>
                      <div style={styles.reviewsCount}>
                        {reviews.length} review{reviews.length !== 1 ? 's' : ''}
                      </div>
                    </div>

                    {reviews.map((review) => (
                      <div key={review.reviewId} style={styles.reviewItem}>
                        <div style={styles.reviewHeader}>
                          <div style={styles.reviewerInfo}>
                            <strong style={styles.reviewerName}>
                              {review.reviewerName || 'Anonymous'}
                            </strong>
                            <div style={styles.ratingStars}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  style={{
                                    color: star <= review.rating ? '#f59e0b' : '#d1d5db',
                                    fill: star <= review.rating ? '#f59e0b' : 'transparent'
                                  }}
                                />
                              ))}
                            </div>
                          </div>
                          <span style={styles.reviewDate}>
                            {new Date(review.createdAt || review.reviewDate).toLocaleDateString()}
                          </span>
                        </div>
                        
                        {review.comment && (
                          <p style={styles.reviewComment}>{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Add Crop Modal */}
        {showAddModal && (
          <div style={styles.modalOverlay} onClick={() => setShowAddModal(false)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>Add New Crop</h2>
                <button onClick={() => setShowAddModal(false)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddCrop} style={styles.modalContent}>
                <div style={styles.formGrid}>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>Crop Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.name && styles.inputError)
                      }}
                      required
                      placeholder="e.g., Wheat"
                    />
                    {formErrors.name && <span style={styles.errorText}>{formErrors.name}</span>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Variety *</label>
                    <input
                      type="text"
                      value={formData.variety}
                      onChange={(e) => handleInputChange('variety', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.variety && styles.inputError)
                      }}
                      required
                      placeholder="e.g., HD-2967"
                    />
                    {formErrors.variety && <span style={styles.errorText}>{formErrors.variety}</span>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Season *</label>
                    <select
                      value={formData.season}
                      onChange={(e) => handleInputChange('season', e.target.value)}
                      style={styles.input}
                      required
                    >
                      <option value="Year-round">Year-Round</option>
                      <option value="Summer">Summer</option>
                      <option value="Rainy">Rainy</option>
                      <option value="Winter">Winter</option>
                    </select>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Harvest Date *</label>
                    <input
                      type="date"
                      value={formData.harvestDate}
                      onChange={(e) => handleInputChange('harvestDate', e.target.value)}
                      min={getTodayDate()}
                      style={{
                        ...styles.input,
                        ...(formErrors.harvestDate && styles.inputError)
                      }}
                      required
                    />
                    {formErrors.harvestDate && <span style={styles.errorText}>{formErrors.harvestDate}</span>}
                    <small style={styles.helpText}>Must be a future date</small>
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Growing Period</label>
                    <input
                      type="text"
                      value={formData.growingPeriod}
                      onChange={(e) => handleInputChange('growingPeriod', e.target.value)}
                      style={styles.input}
                      placeholder="e.g., 120 days"
                    />
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Quantity Available (kg) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.quantityAvailable}
                      onChange={(e) => handleInputChange('quantityAvailable', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.quantityAvailable && styles.inputError)
                      }}
                      required
                      placeholder="100"
                    />
                    {formErrors.quantityAvailable && <span style={styles.errorText}>{formErrors.quantityAvailable}</span>}
                  </div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>Price per kg (₹) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.pricePerKg}
                      onChange={(e) => handleInputChange('pricePerKg', e.target.value)}
                      style={{
                        ...styles.input,
                        ...(formErrors.pricePerKg && styles.inputError)
                      }}
                      required
                      placeholder="25.00"
                    />
                    {formErrors.pricePerKg && <span style={styles.errorText}>{formErrors.pricePerKg}</span>}
                  </div>
                </div>

                {/* Image Upload Section */}
                <div style={styles.formGroup}>
                  <label style={styles.label}>Crop Image</label>
                  
                  {/* Image Preview */}
                  {formData.imagePreview && (
                    <div style={styles.imagePreviewContainer}>
                      <img 
                        src={formData.imagePreview} 
                        alt="Preview" 
                        style={styles.imagePreview}
                      />
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          imageUrl: '',
                          imagePreview: ''
                        }))}
                        style={styles.removeImageButton}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  )}
                  
                  {/* File Input */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    style={styles.fileInput}
                    id="crop-image-upload"
                  />
                  
                  {/* Paste Area */}
                  <div
                    style={styles.pasteArea}
                    onPaste={handlePaste}
                    onClick={() => document.getElementById('crop-image-upload').click()}
                  >
                    <div style={styles.pasteContent}>
                      <Upload size={24} style={{color: '#6b7280', marginBottom: 8}} />
                      <p style={styles.pasteText}>
                        Click to browse 
                      </p>
                        {/* or paste image here */}
                      <p style={styles.pasteSubtext}>
                        Supports JPEG, PNG, WebP (Max 2MB)
                      </p>
                    </div>
                  </div>
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    style={styles.textarea}
                    rows={3}
                    placeholder="Brief description of the crop..."
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
                    style={styles.submitButton}
                  >
                    {isSubmitting ? (
                      <>
                        <div style={styles.buttonSpinner}></div>
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={16} style={{marginRight: 6}} />
                        Add Crop
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* View Crop Modal */}
        {viewingCrop && (
          <div style={styles.modalOverlay} onClick={() => setViewingCrop(null)}>
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 style={styles.modalTitle}>{viewingCrop.name}</h2>
                <button onClick={() => setViewingCrop(null)} style={styles.closeButton}>
                  <X size={24} />
                </button>
              </div>

              <div style={styles.modalContent}>
                {viewingCrop.imageUrl && (
                  <div style={styles.viewImage}>
                    <img src={viewingCrop.imageUrl} alt={viewingCrop.name} style={styles.viewImg} />
                  </div>
                )}

                <div style={styles.viewGrid}>
                  <div style={styles.viewItem}>
                    <span style={styles.viewLabel}>Variety:</span>
                    <span style={styles.viewValue}>{viewingCrop.variety}</span>
                  </div>
                  <div style={styles.viewItem}>
                    <span style={styles.viewLabel}>Season:</span>
                    <span style={styles.viewValue}>{viewingCrop.season}</span>
                  </div>
                  {viewingCrop.harvestDate && (
                    <div style={styles.viewItem}>
                      <span style={styles.viewLabel}>Harvest Date:</span>
                      <span style={styles.viewValue}>
                        {new Date(viewingCrop.harvestDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div style={styles.viewItem}>
                    <span style={styles.viewLabel}>Quantity:</span>
                    <span style={styles.viewValue}>{viewingCrop.quantityAvailable} kg</span>
                  </div>
                  <div style={styles.viewItem}>
                    <span style={styles.viewLabel}>Price/kg:</span>
                    <span style={styles.viewValue}>₹{viewingCrop.pricePerKg}</span>
                  </div>
                  {viewingCrop.growingPeriod && (
                    <div style={styles.viewItem}>
                      <span style={styles.viewLabel}>Growing Period:</span>
                      <span style={styles.viewValue}>{viewingCrop.growingPeriod}</span>
                    </div>
                  )}
                  <div style={styles.viewItem}>
                    <span style={styles.viewLabel}>Total Value:</span>
                    <span style={styles.viewValue}>
                      ₹{(viewingCrop.pricePerKg * viewingCrop.quantityAvailable).toFixed(2)}
                    </span>
                  </div>
                </div>

                {viewingCrop.description && (
                  <div style={styles.viewDescription}>
                    <h4 style={styles.viewDescTitle}>Description</h4>
                    <p style={styles.viewDescText}>{viewingCrop.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
{showQRModal && selectedCrop && (
  <div style={styles.modalOverlay} onClick={() => setShowQRModal(false)}>
    <div style={styles.qrModal} onClick={(e) => e.stopPropagation()}>
      <div style={styles.modalHeader}>
        <h2 style={styles.modalTitle}>QR Code - {selectedCrop.name}</h2>
        <button onClick={() => setShowQRModal(false)} style={styles.closeButton}>
          <X size={24} />
        </button>
      </div>

      <div style={styles.qrContent}>
        {/* Display QR code from backend */}
        <img 
          src={qrCodeUrl}
          alt={`QR Code for ${selectedCrop.name}`}
          style={styles.qrImage}
          onError={(e) => {
            console.error('Failed to load QRcode'+qrCodeUrl);
            e.target.style.display = 'none';
          }}
        />
        
        <button 
          onClick={() => handleDownloadQR(selectedCrop)} 
          style={styles.downloadButton}
        >
          <Download size={16} style={{marginRight: 6}} />
          Download QR Code
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
};

// CSS Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8fafc',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif",
    paddingTop:'5px'
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
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
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
  inputError: {
    borderColor: '#dc2626',
    borderWidth: '2px'
  },
  errorText: {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block'
  },
  helpText: {
    color: '#6b7280',
    fontSize: '12px',
    marginTop: '4px',
    display: 'block',
    fontStyle: 'italic'
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
    background: '#f0fdf4',
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
    color: '#147a48',
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
  tabActive: {
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    color: 'white',
    border: 'none',
    boxShadow: '0 2px 4px rgba(20, 122, 72, 0.2)'
  },

  // Tab Content
  tabContent: {
    background: 'white',
    minHeight: '500px'
  },
  tabContentInner: {
    padding: '24px'
  },

  // Action Bar
  actionBar: {
    marginBottom: '24px',
    display: 'flex',
    justifyContent: 'flex-end'
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

  // Messages
  successMessage: {
    padding: '16px 24px',
    background: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  },
  errorMessage: {
    padding: '16px 24px',
    background: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
    display: 'flex',
    alignItems: 'center',
    fontSize: '14px'
  },

  // Crops Grid
  cropsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '24px'
  },
  cropCard: {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden',
    transition: 'all 0.2s ease',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  cropImage: {
    width: '100%',
    height: '180px',
    overflow: 'hidden',
    background: '#f3f4f6'
  },
  cropImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  cropContent: {
    padding: '20px'
  },
  cropName: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 4px 0'
  },
  cropVariety: {
    fontSize: '14px',
    color: '#6b7280',
    margin: '0 0 16px 0'
  },
  cropDetails: {
    marginBottom: '16px'
  },
  cropDetail: {
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
  cropDescription: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    marginBottom: '16px'
  },
  cropActions: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridTemplateRows: '1fr 1fr',
    gap: '8px'
  },
  viewButton: {
    padding: '8px 12px',
    background: '#f9fafb',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    color: '#374151',
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
  reviewsButton: {
    padding: '8px 12px',
    background: '#fff7ed',
    border: '1px solid #fed7aa',
    borderRadius: '6px',
    color: '#ea580c',
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

  // Settings Styles
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
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto'
  },
  qrModal: {
    background: 'white',
    borderRadius: '12px ',
    boxShadow: '0 20px 25px rgba(0, 0, 0, 0.1)',
    maxWidth: '400px',
    width: '100%'
  },
  modalHeader: {
    borderRadius:'12px 12px 0px 0px',
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
    justifyContent: 'center'
  },
  modalContent: {
    padding: '24px'
  },
  
  // Form Styles
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
  qrImage: {
  width: '250px',
  height: '250px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px'
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
    transition: 'all 0.2s ease'
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

  // Image Upload Styles
  imagePreviewContainer: {
    position: 'relative',
    width: '100%',
    marginBottom: '12px'
  },
  imagePreview: {
    width: '100%',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '8px',
    border: '2px dashed #d1d5db'
  },
  removeImageButton: {
    position: 'absolute',
    top: '8px',
    right: '8px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    border: 'none',
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    fontSize: '14px'
  },
  fileInput: {
    display: 'none'
  },
  pasteArea: {
    border: '2px dashed #d1d5db',
    borderRadius: '8px',
    padding: '32px 16px',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    background: '#f9fafb'
  },
  pasteContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  pasteText: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    margin: '0 0 4px 0'
  },
  pasteSubtext: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0
  },

  // View Details Styles
  viewImage: {
    width: '100%',
    height: '200px',
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '20px',
    background: '#f3f4f6'
  },
  viewImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  viewGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '16px',
    marginBottom: '20px'
  },
  viewItem: {
    padding: '12px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  viewLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#6b7280',
    marginBottom: '4px',
    fontWeight: '500'
  },
  viewValue: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937'
  },
  viewDescription: {
    padding: '16px',
    background: '#f9fafb',
    borderRadius: '8px'
  },
  viewDescTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  viewDescText: {
    fontSize: '14px',
    color: '#6b7280',
    lineHeight: '1.5',
    margin: 0
  },

  // QR Content
  qrContent: {
    borderRadius: '12px',
    padding: '40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px'
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
    transition: 'all 0.2s ease'
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
    padding: '40px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '100%'
  },
  authIcon: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  authTitle: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 12px 0'
  },
  authText: {
    color: '#6b7280',
    margin: '0 0 24px 0',
    fontSize: '14px'
  },
  authButton: {
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    width: '100%',
    transition: 'all 0.2s ease'
  },

  // Loading Styles
  loadingContainer: {
    minHeight: '100vh',
    background: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingCard: {
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 10px 15px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    textAlign: 'center'
  },
  spinnerContainer: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    background: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 20px'
  },
  spinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #147a48',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  loadingText: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: 0
  },

  // Reviews Modal Styles
  loadingState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  reviewsSpinner: {
    width: '32px',
    height: '32px',
    border: '3px solid #f3f4f6',
    borderTop: '3px solid #147a48',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '16px'
  },
  emptyReviewsState: {
    textAlign: 'center',
    padding: '40px',
    color: '#6b7280'
  },
  emptyReviewsTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 8px 0'
  },
  emptyReviewsText: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  reviewsList: {
    maxHeight: '400px',
    overflowY: 'auto'
  },
  reviewsSummary: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px',
    background: '#f8fafc',
    borderRadius: '8px',
    marginBottom: '20px'
  },
  averageRating: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '4px'
  },
  averageRatingValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  averageRatingTotal: {
    fontSize: '16px',
    color: '#6b7280'
  },
  reviewsCount: {
    fontSize: '14px',
    color: '#6b7280'
  },
  reviewItem: {
    padding: '16px',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    marginBottom: '12px',
    background: 'white'
  },
  reviewHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '8px'
  },
  reviewerInfo: {
    flex: 1
  },
  reviewerName: {
    fontSize: '14px',
    color: '#1f2937',
    marginBottom: '4px',
    display: 'block'
  },
  ratingStars: {
    display: 'flex',
    gap: '2px'
  },
  reviewDate: {
    fontSize: '12px',
    color: '#6b7280',
    whiteSpace: 'nowrap'
  },
  reviewComment: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.5',
    margin: 0,
    fontStyle: 'italic'
  },

  // Refresh Button
  refreshButton: {
    padding: '10px 16px',
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
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
    cursor: 'not-allowed'
  }
};

export default FarmerDashboard;