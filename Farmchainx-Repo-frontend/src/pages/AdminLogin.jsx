// src/pages/AdminLogin.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  User, 
  Mail, 
  Lock, 
  Shield,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  UserCheck,
  ArrowLeft
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

export default function AdminLogin() {
  const [activeTab, setActiveTab] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const navigate = useNavigate();

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
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

  const handleLogin = async () => {
    if (!validateLogin()) return;
    
    setIsLoading(true);
    setErrors({});
    setSuccessMessage('');
    
    try {
      console.log('Attempting admin login with:', { email: loginData.email });
      const response = await authAPI.login(loginData.email, loginData.password);
      console.log('Admin login response:', response);
      
      const userRole = response.role;
      const userId = response.userId;
      const userEmail = response.email;
      const username = response.username;
      const isApproved = response.isApproved;
      
      // Check if user is actually an admin
      if (userRole !== 'ADMIN') {
        setErrors({ general: 'Access denied. Admin privileges required.' });
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
      
      setSuccessMessage('Admin login successful! Redirecting...');
      setLoginData({ email: '', password: '' });
      
      setTimeout(() => {
        navigate("/admin-dashboard");
      }, 1500);
      
    } catch (error) {
      console.error('Admin login error:', error);
      setErrors({ 
        general: error.message || 'Login failed. Please check your credentials and try again.' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setLoginData({ email: '', password: '' });
    setErrors({});
    setSuccessMessage('');
    setShowPassword(false);
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    resetForm();
  };

  // Red color scheme styles
  const styles = {
    container: {
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(90deg, #fef2f2 0%, #fecaca 100%)'
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
      background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
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
      color: '#dc2626',
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
    inputError: {
      borderColor: '#dc2626'
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
      color: '#dc2626',
      fontSize: '14px',
      marginTop: '4px'
    },
    button: {
      width: '100%',
      background: 'linear-gradient(90deg, #dc2626 0%, #b91c1c 100%)',
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
      background: 'linear-gradient(90deg, #b91c1c 0%, #991b1b 100%)'
    },
    buttonDisabled: {
      opacity: 0.5,
      cursor: 'not-allowed'
    },
    successMessage: {
  backgroundColor: '#dcfce7', // Change from #fef2f2 to green background
  color: '#166534', // Change from #991b1b to green text
  padding: '12px',
  borderRadius: '8px',
  border: '1px solid #bbf7d0', // Change from #fecaca to green border
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
      color: '#dc2626',
      fontWeight: '500',
      background: 'none',
      border: 'none',
      cursor: 'pointer'
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
            <Shield size={28} color="#dc2626" />
          </div>
          <h2 style={styles.headerTitle}>Admin Portal</h2>
          <p style={styles.headerSubtitle}>System Administration</p>
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

          {/* Login Form */}
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
                  placeholder="Enter admin email"
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
                  placeholder="Enter admin password"
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
                  Sign In as Admin
                </>
              )}
            </button>
          </div>

          {/* Footer Text */}
          <div style={styles.footerText}>
            Need administrator access?{' '}
            <button 
              onClick={() => navigate("/")}
              style={styles.footerLink}
            >
              Contact system administrator
            </button>
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