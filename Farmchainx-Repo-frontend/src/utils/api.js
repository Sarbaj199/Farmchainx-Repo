// src/utils/api.js
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('role');
      localStorage.removeItem('userId');
      localStorage.removeItem('email');
      localStorage.removeItem('username');
      localStorage.removeItem('isApproved');
      localStorage.removeItem('id');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// Utility function to set authentication data
export const setAuthToken = (token, role, userId, email, username, isApproved,id) => {
  localStorage.setItem('token', token);
  localStorage.setItem('role', role);
  localStorage.setItem('userId', userId);
  localStorage.setItem('email', email);
  localStorage.setItem('username', username);
  localStorage.setItem('isApproved', isApproved);
  localStorage.setItem('id', id);
};

// Utility function to get current user info
export const getCurrentUser = () => {
  return {
    token: localStorage.getItem('token'),
    role: localStorage.getItem('role'),
    userId: localStorage.getItem('userId'),
    email: localStorage.getItem('email'),
    username: localStorage.getItem('username'),
    isApproved: localStorage.getItem('isApproved') === 'true',
    id: localStorage.getItem('id'),
  };
};

// Utility function to check if user is authenticated
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const userId = localStorage.getItem('userId');
  
  return !!(token && role && userId);
};

// Utility function to check if farmer is approved
export const isFarmerApproved = () => {
  const role = localStorage.getItem('role');
  const isApproved = localStorage.getItem('isApproved');
  
  if (role !== 'FARMER') return true;
  return isApproved === 'true';
};

// Auth API functions
export const authAPI = {
  // Farmer Registration
  farmerRegister: async (farmerData) => {
    try {
      const response = await api.post('/auth/register/farmer', farmerData);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.error || 'Farmer registration failed');
    }
  },

  // Login
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      const errorMessage = error.response?.data?.error || 'Login failed';
      
      // Handle approval-related errors
      if (errorMessage.includes('pending admin approval')) {
        throw new Error('Your account is pending admin approval. Please wait for approval.');
      }
      
      throw new Error(errorMessage);
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userId');
    localStorage.removeItem('email');
    localStorage.removeItem('username');
    localStorage.removeItem('isApproved');
    localStorage.removeItem('id');
  }
};

export default api;