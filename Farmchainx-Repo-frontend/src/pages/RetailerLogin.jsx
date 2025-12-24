// src/pages/RetailerLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  Phone, 
  MapPin, 
  Building, 
  ShoppingCart,
  ArrowLeft,
  Loader2
} from "lucide-react";

// Simple API functions without external dependencies
const API_BASE_URL = 'http://localhost:8080';
const authAPI = {
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { error: responseText };
      }

      console.log('Login API parsed response:', { 
        status: response.status, 
        ok: response.ok,
        data: responseData 
      });

      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `Login failed: ${response.status}`;
        console.log('Extracted error message:', errorMessage);
        throw new Error(errorMessage);
      }

      return responseData;
      
    } catch (error) {
      console.error('Login API error:', error);
      
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running on http://localhost:8080');
      }
      
      throw error;
    }
  },

  async retailerRegister(retailerData) {
    try {
      console.log('Sending registration to:', `${API_BASE_URL}/auth/register/retailer`);
      const response = await fetch(`${API_BASE_URL}/auth/register/retailer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(retailerData),
      });

      const responseText = await response.text();
      console.log('Registration raw response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        responseData = { error: responseText };
      }

      console.log('Registration response:', { 
        status: response.status, 
        data: responseData 
      });
      
      if (!response.ok) {
        const errorMessage = responseData.error || responseData.message || `Registration failed: ${response.status}`;
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error('Registration API error:', error);
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please make sure the backend is running and CORS is configured.');
      }
      throw error;
    }
  }
};

const setAuthToken = (token, role, userId, email, username, isApproved) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', role);
  localStorage.setItem('userId', userId);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('username', username);
  localStorage.setItem('isApproved', isApproved);
  console.log('Auth data stored for user:', username);
};

export default function RetailerLogin() {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [signupData, setSignupData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phoneNumber: '',
    name: '',
    address: ''
  });

  const [retailerSignupData, setRetailerSignupData] = useState({
    storeName: '',
    storeType: '',
    businessLicense: ''
  });

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    
    if (name in retailerSignupData) {
      setRetailerSignupData(prev => ({
        ...prev,
        [name]: value
      }));
    } else {
      setSignupData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateLogin = () => {
    const newErrors = {};
    
    if (!loginData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(loginData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!loginData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateSignup = () => {
    const newErrors = {};
    
    if (!signupData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (signupData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }
    
    if (!signupData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(signupData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!signupData.password) {
      newErrors.password = 'Password is required';
    } else if (signupData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (!signupData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (signupData.password !== signupData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!signupData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }
    
    if (!signupData.name.trim()) {
      newErrors.name = 'Full name is required';
    }
    
    if (!signupData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    // Retailer-specific validations
    if (!retailerSignupData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    }
    
    if (!retailerSignupData.storeType.trim()) {
      newErrors.storeType = 'Store type is required';
    }
    
    if (!retailerSignupData.businessLicense.trim()) {
      newErrors.businessLicense = 'Business license is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      console.log('Attempting login with:', { email: loginData.email });
      const response = await authAPI.login(loginData.email, loginData.password);
      console.log('Login response:', response);
      
      // Handle different response structures
      const userRole = response.role || response.userRole;
      const userId = response.userId || response.id;
      const userEmail = response.email;
      const username = response.username;
      
      // Handle approval status - default to true if not provided
      const isApproved = response.isApproved !== undefined ? response.isApproved : true;
      
      // ADD APPROVAL CHECK FOR RETAILER
      if (userRole === 'RETAILER' && !isApproved) {
        setErrors({ 
          general: 'Please wait for approval before logging in.' 
        });
        return;
      }
      
      if (!response.token) {
        throw new Error('No authentication token received');
      }
      
      setAuthToken(
        response.token,
        userRole,
        userId,
        userEmail,
        username,
        isApproved
      );
      
      setSuccessMessage('Login successful! Redirecting...');
      setLoginData({ email: '', password: '' });
      
      // Redirect based on role
      setTimeout(() => {
        if (userRole === 'RETAILER') {
          navigate("/retailer-dashboard");
        } else if (userRole === 'ADMIN') {
          navigate("/admin-dashboard");
        } else {
          navigate("/");
        }
      }, 1500);
      
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ 
        general: error.message || 'Login failed. Please check your credentials and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async () => {
    if (!validateSignup()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      // CORRECTED: Flat structure with ROLE field matching backend DTO
      const retailerData = {
        username: signupData.username,
        password: signupData.password,
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phoneNumber, // Map to 'phone' for API
        address: signupData.address,
        storeName: retailerSignupData.storeName,
        storeType: retailerSignupData.storeType,
        businessLicense: retailerSignupData.businessLicense,
        role: "RETAILER" // REQUIRED FIELD
      };
      
      console.log('Sending registration data:', retailerData);
      const response = await authAPI.retailerRegister(retailerData);
      console.log('Registration response:', response);
      
      setSuccessMessage('Please wait for admin approval before logging in.');
      
      // Reset forms
      setSignupData({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        phoneNumber: '',
        name: '',
        address: ''
      });
      
      setRetailerSignupData({
        storeName: '',
        storeType: '',
        businessLicense: ''
      });
      
      // Switch to login tab after delay
      setTimeout(() => setActiveTab('login'), 3000);
      
    } catch (error) {
      console.error('Signup error:', error);
      setErrors({ 
        general: error.message || 'Registration failed. Please try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ email: '', password: '' });
    setSignupData({
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      phoneNumber: '',
      name: '',
      address: ''
    });
    setRetailerSignupData({
      storeName: '',
      storeType: '',
      businessLicense: ''
    });
    setErrors({});
    setSuccessMessage('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  // Inline styles with orange color scheme
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background:'linear-gradient(90deg, #fff7ed 0%, #ffedd5 100%)'
    },
    card: {
      backgroundColor: 'white',
      borderRadius: '16px',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      overflow: 'hidden',
      width: '100%',
      maxWidth: '448px'
    },
    header: {
      background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
      padding: '24px',
      textAlign: 'center',
      color: 'white'
    },
    headerIcon: {
      width: '64px',
      height: '64px',
      backgroundColor: 'white',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 16px auto'
    },
    headerTitle: {
      fontSize: '24px',
      fontWeight: 'bold',
      margin: 0,
      marginBottom: '4px'
    },
    headerSubtitle: {
      color: 'rgba(255, 255, 255, 0.9)',
      margin: 0
    },
    content: {
      padding: '32px'
    },
    tabContainer: {
      display: 'flex',
      backgroundColor: '#f3f4f6',
      borderRadius: '8px',
      padding: '4px',
      marginBottom: '32px'
    },
    tabButton: {
      flex: 1,
      padding: '8px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    },
    activeTab: {
      backgroundColor: 'white',
      color: '#f97316',
      boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
    },
    inactiveTab: {
      backgroundColor: 'transparent',
      color: '#4b5563'
    },
    formGroup: {
      marginBottom: '24px'
    },
    label: {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px',
      textAlign: 'left'
    },
    inputWrapper: {
      position: 'relative',
      width: '100%',
      display: 'flex',
      alignItems: 'center'
    },
    inputIcon: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9ca3af'
    },
    input: {
      width: '100%',
      padding: '12px 16px 12px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '15px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s',
      minHeight: '44px',
      flex: '1',
      fontFamily: 'inherit'
    },
    textarea: {
      width: '100%',
      padding: '12px 16px 12px 40px',
      border: '1px solid #d1d5db',
      borderRadius: '8px',
      fontSize: '15px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s',
      resize: 'vertical',
      minHeight: '80px',
      fontFamily: 'inherit'
    },
    inputError: {
      borderColor: '#ef4444'
    },
    passwordToggle: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#9ca3af',
      cursor: 'pointer'
    },
    errorText: {
      color: '#ef4444',
      fontSize: '14px',
      marginTop: '4px'
    },
    button: {
      width: '100%',
      background: 'linear-gradient(90deg, #f97316 0%, #ea580c 100%)',
      color: 'white',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    },
    buttonHover: {
      background: 'linear-gradient(90deg, #e96a10 0%, #d4530b 100%)'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    successMessage: {
      backgroundColor: '#ffedd5',
      color: '#9a3412',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #fdba74',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    footerText: {
      marginTop: '32px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#4b5563'
    },
    footerLink: {
      color: '#f97316',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    storeSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '16px',
      marginTop: '16px'
    },
    storeTitle: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    loadingSpinner: {
      animation: 'spin 1s linear infinite'
    },
    backButton: {
      background: 'none',
      border: '1px solid #d1d5db',
      color: '#6b7280',
      padding: '8px 16px',
      borderRadius: '6px',
      fontSize: '14px',
      cursor: 'pointer',
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      margin: '20px auto 0 auto'
    }
  };

  // Helper function to merge styles
  const mergeStyles = (...styleObjects) => Object.assign({}, ...styleObjects);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerIcon}>
            <ShoppingCart size={32} color="#f97316" />
          </div>
          <h2 style={styles.headerTitle}>Retailer Portal</h2>
          <p style={styles.headerSubtitle}>Connect with distributors and farmers</p>
        </div>
        
        <div style={styles.content}>
          {/* Success and Error Messages */}
          {successMessage && (
            <div style={styles.successMessage}>
              <div style={{width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#9a3412'}}></div>
              {successMessage}
            </div>
          )}
          {errors.general && (
            <div style={styles.errorMessage}>
              <div style={{width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#dc2626'}}></div>
              {errors.general}
            </div>
          )}

          {/* Tab Navigation */}
          <div style={styles.tabContainer}>
            <button
              onClick={() => switchTab('login')}
              style={mergeStyles(
                styles.tabButton,
                activeTab === 'login' ? styles.activeTab : styles.inactiveTab
              )}
            >
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              style={mergeStyles(
                styles.tabButton,
                activeTab === 'signup' ? styles.activeTab : styles.inactiveTab
              )}
            >
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={loginData.email}
                    onChange={handleLoginChange}
                    style={mergeStyles(
                      styles.input,
                      errors.email && styles.inputError
                    )}
                    placeholder="Enter your email"
                  />
                </div>
                {errors.email && <div style={styles.errorText}>{errors.email}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={loginData.password}
                    onChange={handleLoginChange}
                    style={mergeStyles(
                      styles.input,
                      errors.password && styles.inputError
                    )}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div style={styles.errorText}>{errors.password}</div>}
              </div>

              <button
                onClick={handleLogin}
                disabled={isLoading}
                style={mergeStyles(
                  styles.button,
                  isLoading && styles.buttonDisabled
                )}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={20} style={styles.loadingSpinner} />
                    Signing in...
                  </div>
                ) : (
                  'Sign In as Retailer'
                )}
              </button>
            </div>
          )}

          {/* Signup Form */}
          {activeTab === 'signup' && (
            <div>
              {/* Personal Information */}
              <div style={styles.formGroup}>
                <label style={styles.label}>Username</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    name="username"
                    value={signupData.username}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.input,
                      errors.username && styles.inputError
                    )}
                    placeholder="Choose a username"
                  />
                </div>
                {errors.username && <div style={styles.errorText}>{errors.username}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Full Name</label>
                <div style={styles.inputWrapper}>
                  <User size={18} style={styles.inputIcon} />
                  <input
                    type="text"
                    name="name"
                    value={signupData.name}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.input,
                      errors.name && styles.inputError
                    )}
                    placeholder="Enter your full name"
                  />
                </div>
                {errors.name && <div style={styles.errorText}>{errors.name}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Email Address</label>
                <div style={styles.inputWrapper}>
                  <Mail size={18} style={styles.inputIcon} />
                  <input
                    type="email"
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.input,
                      errors.email && styles.inputError
                    )}
                    placeholder="Enter your email address"
                  />
                </div>
                {errors.email && <div style={styles.errorText}>{errors.email}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Phone Number</label>
                <div style={styles.inputWrapper}>
                  <Phone size={18} style={styles.inputIcon} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={signupData.phoneNumber}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.input,
                      errors.phoneNumber && styles.inputError
                    )}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phoneNumber && <div style={styles.errorText}>{errors.phoneNumber}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Address</label>
                <div style={styles.inputWrapper}>
                  <MapPin size={18} style={styles.inputIcon} />
                  <textarea
                    name="address"
                    value={signupData.address}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.textarea,
                      errors.address && styles.inputError
                    )}
                    placeholder="Enter your address"
                    rows="3"
                  />
                </div>
                {errors.address && <div style={styles.errorText}>{errors.address}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.input,
                      errors.password && styles.inputError
                    )}
                    placeholder="Create a password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <div style={styles.errorText}>{errors.password}</div>}
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>Confirm Password</label>
                <div style={styles.inputWrapper}>
                  <Lock size={18} style={styles.inputIcon} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={signupData.confirmPassword}
                    onChange={handleSignupChange}
                    style={mergeStyles(
                      styles.input,
                      errors.confirmPassword && styles.inputError
                    )}
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && <div style={styles.errorText}>{errors.confirmPassword}</div>}
              </div>

              {/* Store Information */}
              <div style={styles.storeSection}>
                <h3 style={styles.storeTitle}>
                  <Building size={20} />
                  Store Information
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Store Name</label>
                  <div style={styles.inputWrapper}>
                    <Building size={18} style={styles.inputIcon} />
                    <input
                      type="text"
                      name="storeName"
                      value={retailerSignupData.storeName}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.input,
                        errors.storeName && styles.inputError
                      )}
                      placeholder="Enter your store name"
                    />
                  </div>
                  {errors.storeName && <div style={styles.errorText}>{errors.storeName}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Store Type</label>
                  <div style={styles.inputWrapper}>
                    <ShoppingCart size={18} style={styles.inputIcon} />
                    <input
                      type="text"
                      name="storeType"
                      value={retailerSignupData.storeType}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.input,
                        errors.storeType && styles.inputError
                      )}
                      placeholder="e.g., Grocery, Supermarket, Local Store"
                    />
                  </div>
                  {errors.storeType && <div style={styles.errorText}>{errors.storeType}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Business License</label>
                  <div style={styles.inputWrapper}>
                    <MapPin size={18} style={styles.inputIcon} />
                    <input
                      type="text"
                      name="businessLicense"
                      value={retailerSignupData.businessLicense}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.input,
                        errors.businessLicense && styles.inputError
                      )}
                      placeholder="Enter business license number"
                    />
                  </div>
                  {errors.businessLicense && <div style={styles.errorText}>{errors.businessLicense}</div>}
                </div>
              </div>

              <button
                onClick={handleSignup}
                disabled={isLoading}
                style={mergeStyles(
                  styles.button,
                  isLoading && styles.buttonDisabled
                )}
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Loader2 size={20} style={styles.loadingSpinner} />
                    Creating Account...
                  </div>
                ) : (
                  'Create Retailer Account'
                )}
              </button>
            </div>
          )}

          {/* Footer Text */}
          <div style={styles.footerText}>
            {activeTab === 'login' ? (
              <>
                Don't have an account?{' '}
                <button 
                  onClick={() => switchTab('signup')}
                  style={styles.footerLink}
                >
                  Sign up here
                </button>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <button 
                  onClick={() => switchTab('login')}
                  style={styles.footerLink}
                >
                  Sign in here
                </button>
              </>
            )}
          </div>

          {/* Back to Home Button */}
          <button
            onClick={() => navigate("/")}
            style={styles.backButton}
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </div>

      {/* Add CSS animation for spinner */}
      <style>
        {`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
}