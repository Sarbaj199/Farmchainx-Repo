// src/pages/ConsumerLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  ShoppingBag,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  UserCheck,
  ArrowLeft,
  MapPin
} from 'lucide-react';

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

  async customerRegister(customerData) {
    try {
      console.log('Sending registration to:', `${API_BASE_URL}/auth/register/customer`);
      const response = await fetch(`${API_BASE_URL}/auth/register/customer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
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

export default function ConsumerLogin() {
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

  const [customerSignupData, setCustomerSignupData] = useState({
    deliveryAddress: ''
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
    
    if (name in customerSignupData) {
      setCustomerSignupData(prev => ({
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
    
    // Customer-specific validations
    if (!customerSignupData.deliveryAddress.trim()) {
      newErrors.deliveryAddress = 'Delivery address is required';
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
      console.log('Attempting customer login with:', { email: loginData.email });
      const response = await authAPI.login(loginData.email, loginData.password);
      console.log('Consumer login response:', response);
      
      const userRole = response.role;
      const userId = response.userId;
      const userEmail = response.email;
      const username = response.username;
      const isApproved = response.isApproved;
      
      // Check if user is actually a customer
      if (userRole !== 'CONSUMER') {
        setErrors({ general: 'Access denied. Customer account required.' });
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
      
      // Redirect customer directly to dashboard (no approval needed)
      setTimeout(() => {
        navigate("/consumer-dashboard");
      }, 1500);
      
    } catch (error) {
      console.error('Customer login error:', error);
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
      // Flat structure with ROLE field matching backend DTO
      const customerData = {
        username: signupData.username,
        password: signupData.password,
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phoneNumber,
        address: signupData.address,
        deliveryAddress: customerSignupData.deliveryAddress,
        role: "CONSUMER" // REQUIRED FIELD
      };
      
      console.log('Sending registration data:', customerData);
      const response = await authAPI.customerRegister(customerData);
      console.log('Registration response:', response);
      
      setSuccessMessage('Customer account created successfully! You can now login.');
      
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
      
      setCustomerSignupData({
        deliveryAddress: ''
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
    setCustomerSignupData({
      deliveryAddress: ''
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

  // Purple color scheme styles
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(90deg, #f8f3ff 0%, #e8dcff 100%)'
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
      background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
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
      transition: 'all 0.2s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    activeTab: {
      backgroundColor: 'white',
      color: '#7c3aed',
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
      color: '#9ca3af',
      zIndex: 1
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
      fontSize: '16px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s',
      resize: 'vertical',
      minHeight: '80px'
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
      cursor: 'pointer',
      zIndex: 1
    },
    errorText: {
      color: '#ef4444',
      fontSize: '14px',
      marginTop: '4px'
    },
    button: {
      width: '100%',
      background: 'linear-gradient(90deg, #7c3aed 0%, #6d28d9 100%)',
      color: 'white',
      padding: '12px 16px',
      border: 'none',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px'
    },
    buttonHover: {
      background: 'linear-gradient(90deg, #6d28d9 0%, #5b21b6 100%)'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    successMessage: {
      backgroundColor: '#dcfce7',
      color: '#166534',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #bbf7d0',
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
      color: '#7c3aed',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    customerSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '16px',
      marginTop: '16px'
    },
    customerTitle: {
      fontSize: '18px',
      fontWeight: '500',
      color: '#1f2937',
      marginBottom: '16px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    },
    loadingSpinner: {
      width: '20px',
      height: '20px',
      border: '2px solid transparent',
      borderTop: '2px solid white',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
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
            <ShoppingBag size={28} color="#7c3aed" />
          </div>
          <h2 style={styles.headerTitle}>Customer Portal</h2>
          <p style={styles.headerSubtitle}>Shop fresh farm products</p>
        </div>
        
        <div style={styles.content}>
          {/* Success and Error Messages */}
          {successMessage && (
            <div style={styles.successMessage}>
              <UserCheck size={16} />
              {successMessage}
            </div>
          )}
          {errors.general && (
            <div style={styles.errorMessage}>
              <UserCheck size={16} />
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
              <LogIn size={16} />
              Sign In
            </button>
            <button
              onClick={() => switchTab('signup')}
              style={mergeStyles(
                styles.tabButton,
                activeTab === 'signup' ? styles.activeTab : styles.inactiveTab
              )}
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>

          {/* Login Form */}
          {activeTab === 'login' && (
            <div>
              <div style={styles.formGroup}>
                <label style={styles.label}>Email</label>
                <div style={styles.inputWrapper}>
                  <div style={styles.inputIcon}>
                    <Mail size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <Lock size={18} />
                  </div>
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
                onMouseOver={(e) => !isLoading && (e.target.style.background = styles.buttonHover.background)}
                onMouseOut={(e) => !isLoading && (e.target.style.background = styles.button.background)}
              >
                {isLoading ? (
                  <>
                    <div style={styles.loadingSpinner}></div>
                    Signing in...
                  </>
                ) : (
                  <>
                    <LogIn size={18} />
                    Sign In as Customer
                  </>
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
                  <div style={styles.inputIcon}>
                    <User size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <User size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <Mail size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <User size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <MapPin size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <Lock size={18} />
                  </div>
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
                  <div style={styles.inputIcon}>
                    <Lock size={18} />
                  </div>
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

              {/* Customer Information */}
              <div style={styles.customerSection}>
                <h3 style={styles.customerTitle}>
                  <MapPin size={18} />
                  Delivery Information
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Delivery Address</label>
                  <div style={styles.inputWrapper}>
                    <div style={styles.inputIcon}>
                      <MapPin size={18} />
                    </div>
                    <textarea
                      name="deliveryAddress"
                      value={customerSignupData.deliveryAddress}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.textarea,
                        errors.deliveryAddress && styles.inputError
                      )}
                      placeholder="Enter preferred delivery address (if different from main address)"
                      rows="2"
                    />
                  </div>
                  {errors.deliveryAddress && <div style={styles.errorText}>{errors.deliveryAddress}</div>}
                </div>
              </div>

              <button
                onClick={handleSignup}
                disabled={isLoading}
                style={mergeStyles(
                  styles.button,
                  isLoading && styles.buttonDisabled
                )}
                onMouseOver={(e) => !isLoading && (e.target.style.background = styles.buttonHover.background)}
                onMouseOut={(e) => !isLoading && (e.target.style.background = styles.button.background)}
              >
                {isLoading ? (
                  <>
                    <div style={styles.loadingSpinner}></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <UserPlus size={18} />
                    Create Customer Account
                  </>
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
          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              onClick={() => navigate("/")}
              style={{
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
                margin: '0 auto'
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = '#f3f4f6';
                e.target.style.color = '#374151';
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.color = '#6b7280';
              }}
            >
              <ArrowLeft size={16} />
              Back to Home
            </button>
          </div>
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