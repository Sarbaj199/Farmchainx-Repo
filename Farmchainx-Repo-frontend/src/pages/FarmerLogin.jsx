// src/pages/FarmerLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Mail, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  Home, 
  Ruler,
  Eye,
  EyeOff,
  ArrowLeft
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

      // First, get the response text to see what's actually coming
      const responseText = await response.text();
      console.log('Raw response text:', responseText);
      
      let responseData;
      try {
        // Try to parse as JSON
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        // If not JSON, use the raw text
        console.log('Response is not JSON, using raw text');
        responseData = { error: responseText };
      }

      console.log('Login API parsed response:', { 
        status: response.status, 
        ok: response.ok,
        data: responseData 
      });

      if (!response.ok) {
        // Extract the actual error message from backend
        // Your backend returns: {"error": "Error at login: Invalid email or password"}
        const errorMessage = responseData.error || responseData.message || `Login failed: ${response.status}`;
        console.log('Extracted error message:', errorMessage);
        throw new Error(errorMessage);
      }

      return responseData;
      
    } catch (error) {
      console.error('Login API error:', error);
      
      // Handle network errors
      if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
        throw new Error('Cannot connect to server. Please check if the backend is running on http://localhost:8080');
      }
      
      // Re-throw the backend error message
      throw error;
    }
  },

  async farmerRegister(farmerData) {
    try {
      console.log('Sending registration to:', `${API_BASE_URL}/auth/register/farmer`);
      const response = await fetch(`${API_BASE_URL}/auth/register/farmer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(farmerData),
      });

      // Get raw response text first
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

const setAuthToken = (token, role, userId, email, username, isApproved,id) => {
  localStorage.setItem('token', token);
  localStorage.setItem('userRole', role);
  localStorage.setItem('userId', userId);
  localStorage.setItem('userEmail', email);
  localStorage.setItem('username', username);
  localStorage.setItem('isApproved', isApproved);
  localStorage.setItem('id',id);
  console.log('Auth data stored for user:', username);
};

export default function FarmerLogin() {
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

  const [farmerSignupData, setFarmerSignupData] = useState({
    farmName: '',
    farmLocation: '',
    farmSize: ''
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
    
    if (name in farmerSignupData) {
      setFarmerSignupData(prev => ({
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
    
    // Farmer-specific validations
    if (!farmerSignupData.farmName.trim()) {
      newErrors.farmName = 'Farm name is required';
    }
    
    if (!farmerSignupData.farmLocation.trim()) {
      newErrors.farmLocation = 'Farm location is required';
    }
    
    if (!farmerSignupData.farmSize.trim()) {
      newErrors.farmSize = 'Farm size is required';
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
      const id = response.id;
      
      // Handle approval status - default to true if not provided
      const isApproved = response.isApproved !== undefined ? response.isApproved : true;
      
      if (userRole === 'FARMER' && !isApproved) {
        setErrors({ general: 'Your account is pending admin approval. Please wait for approval.' });
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
        isApproved,
        id
      );
      
      setSuccessMessage('Login successful! Redirecting...');
      setLoginData({ email: '', password: '' });
      
      // Redirect based on role
      setTimeout(() => {
        if (userRole === 'FARMER') {
          navigate("/farmer-dashboard");
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
      const farmerData = {
        username: signupData.username,
        password: signupData.password,
        name: signupData.name,
        email: signupData.email,
        phone: signupData.phoneNumber, // Map to 'phone' for API
        address: signupData.address,
        farmName: farmerSignupData.farmName,
        farmLocation: farmerSignupData.farmLocation,
        farmSize: farmerSignupData.farmSize,
        role: "FARMER" // REQUIRED FIELD
      };
      
      console.log('Sending registration data:', farmerData);
      const response = await authAPI.farmerRegister(farmerData);
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
      
      setFarmerSignupData({
        farmName: '',
        farmLocation: '',
        farmSize: ''
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
    setFarmerSignupData({
      farmName: '',
      farmLocation: '',
      farmSize: ''
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

  // Inline styles
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 50%, #ccfbf1 100%)'
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
      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
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
      color: '#059669',
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
      fontSize: '16px',
      boxSizing: 'border-box',
      outline: 'none',
      transition: 'all 0.2s',
      resize: 'vertical',
      minHeight: '80px'
    },
    inputFocus: {
      borderColor: '#10b981',
      boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
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
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    errorText: {
      color: '#ef4444',
      fontSize: '14px',
      marginTop: '4px'
    },
    button: {
      width: '100%',
      background: 'linear-gradient(90deg, #10b981 0%, #059669 100%)',
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
      background: 'linear-gradient(90deg, #0da271 0%, #047857 100%)'
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
      marginBottom: '16px'
    },
    errorMessage: {
      backgroundColor: '#fef2f2',
      color: '#991b1b',
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid #fecaca',
      marginBottom: '16px'
    },
    footerText: {
      marginTop: '32px',
      textAlign: 'center',
      fontSize: '14px',
      color: '#4b5563'
    },
    footerLink: {
      color: '#059669',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
    },
    farmSection: {
      borderTop: '1px solid #e5e7eb',
      paddingTop: '16px',
      marginTop: '16px'
    },
    farmTitle: {
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
      animation: 'spin 1s linear infinite',
      marginRight: '8px'
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
            <User size={32} color="#059669" />
          </div>
          <h2 style={styles.headerTitle}>Farmer Portal</h2>
          <p style={styles.headerSubtitle}>Connect directly with buyers</p>
        </div>
        
        <div style={styles.content}>
          {/* Success and Error Messages */}
          {successMessage && (
            <div style={styles.successMessage}>
              {successMessage}
            </div>
          )}
          {errors.general && (
            <div style={styles.errorMessage}>
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
              >
                {isLoading ? (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={styles.loadingSpinner}></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign In as Farmer'
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
                    <Phone size={18} />
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

              {/* Farm Information */}
              <div style={styles.farmSection}>
                <h3 style={styles.farmTitle}>
                  <Home size={20} />
                  Farm Information
                </h3>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Farm Name</label>
                  <div style={styles.inputWrapper}>
                    <div style={styles.inputIcon}>
                      <Home size={18} />
                    </div>
                    <input
                      type="text"
                      name="farmName"
                      value={farmerSignupData.farmName}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.input,
                        errors.farmName && styles.inputError
                      )}
                      placeholder="Enter your farm name"
                    />
                  </div>
                  {errors.farmName && <div style={styles.errorText}>{errors.farmName}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Farm Location</label>
                  <div style={styles.inputWrapper}>
                    <div style={styles.inputIcon}>
                      <MapPin size={18} />
                    </div>
                    <input
                      type="text"
                      name="farmLocation"
                      value={farmerSignupData.farmLocation}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.input,
                        errors.farmLocation && styles.inputError
                      )}
                      placeholder="Enter farm location"
                    />
                  </div>
                  {errors.farmLocation && <div style={styles.errorText}>{errors.farmLocation}</div>}
                </div>

                <div style={styles.formGroup}>
                  <label style={styles.label}>Farm Size</label>
                  <div style={styles.inputWrapper}>
                    <div style={styles.inputIcon}>
                      <Ruler size={18} />
                    </div>
                    <input
                      type="text"
                      name="farmSize"
                      value={farmerSignupData.farmSize}
                      onChange={handleSignupChange}
                      style={mergeStyles(
                        styles.input,
                        errors.farmSize && styles.inputError
                      )}
                      placeholder="Enter farm size (e.g., 10 acres)"
                    />
                  </div>
                  {errors.farmSize && <div style={styles.errorText}>{errors.farmSize}</div>}
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
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={styles.loadingSpinner}></div>
                    Creating Account...
                  </div>
                ) : (
                  'Create Farmer Account'
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