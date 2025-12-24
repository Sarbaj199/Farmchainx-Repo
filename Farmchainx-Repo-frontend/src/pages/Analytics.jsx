import React, { useState, useEffect } from 'react';
import { 
  Users, Package, Truck, Store, UserCheck, UserX, Clock, 
  TrendingUp, BarChart3, PieChart, Filter, Download, RefreshCw,
  Calendar
} from 'lucide-react';

// Chart.js components
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('all');
  const [activeChart, setActiveChart] = useState('overview');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch data from backend
  const API_BASE_URL = 'http://localhost:8080';
  // Fetch data from backend
// Fetch data from backend
    // Fetch data from backend
const fetchAnalyticsData = async () => {
  setLoading(true);
  try {
    console.log('Fetching fresh data from database...');
    
    // Get the JWT token from localStorage
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') ||
                  localStorage.getItem('jwtToken') ||
                  localStorage.getItem('accessToken') ||
                  sessionStorage.getItem('authToken') ||
                  sessionStorage.getItem('token');
    
    console.log('Auth token available:', !!token);
    if (token) {
      console.log('Token length:', token.length);
    }
    
    const headers = {
      'Content-Type': 'application/json'
    };
    
    // Add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    console.log('Making request to: http://localhost:8080/admin/stats');
    console.log('Headers:', headers);
    
    const response = await fetch('http://localhost:8080/admin/stats', {
      method: 'GET',
      headers: headers
    });
    
    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Access forbidden - check if user has ADMIN role and valid token');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ Backend API Response:', data);
    
    // Map backend response to frontend structure
    const totalUsers = data.totalUsers || 0;
    const farmers = data.farmerCount || 0;
    const distributors = data.distributorCount || 0;
    const retailers = data.retailerCount || 0;
    const consumers = data.customerCount || 0;
    const approved = data.approvedUsers || 0;
    const pending = data.pendingUsers || 0;
    const rejected = totalUsers - approved - pending;

    console.log('Processed data:', {
      totalUsers, farmers, distributors, retailers, consumers, 
      approved, pending, rejected
    });

    // Calculate percentages dynamically
    const calculatePercentage = (count, total) => {
      if (total === 0) return 0;
      return Math.round((count / total) * 100);
    };

    // For status by role - distribute proportionally
    const totalBusinessUsers = farmers + distributors + retailers + consumers;
    
    const calculateStatusDistribution = (roleCount, totalCount, statusCount) => {
      if (totalCount === 0) return 0;
      return Math.max(0, Math.round((roleCount / totalCount) * statusCount));
    };

    const farmersApproved = calculateStatusDistribution(farmers, totalBusinessUsers, approved);
    const distributorsApproved = calculateStatusDistribution(distributors, totalBusinessUsers, approved);
    const retailersApproved = calculateStatusDistribution(retailers, totalBusinessUsers, approved);
    const consumersApproved = Math.max(0, approved - farmersApproved - distributorsApproved - retailersApproved);

    const farmersPending = calculateStatusDistribution(farmers, totalBusinessUsers, pending);
    const distributorsPending = calculateStatusDistribution(distributors, totalBusinessUsers, pending);
    const retailersPending = calculateStatusDistribution(retailers, totalBusinessUsers, pending);
    const consumersPending = Math.max(0, pending - farmersPending - distributorsPending - retailersPending);

    const farmersRejected = calculateStatusDistribution(farmers, totalBusinessUsers, rejected);
    const distributorsRejected = calculateStatusDistribution(distributors, totalBusinessUsers, rejected);
    const retailersRejected = calculateStatusDistribution(retailers, totalBusinessUsers, rejected);
    const consumersRejected = Math.max(0, rejected - farmersRejected - distributorsRejected - retailersRejected);

    // Transform backend data to match frontend structure
    const transformedData = {
      summary: {
        totalUsers: totalUsers,
        farmers: farmers,
        distributors: distributors,
        retailers: retailers,
        consumers: consumers,
        approved: approved,
        pending: pending,
        rejected: rejected,
        farmersPercentage: calculatePercentage(farmers, totalUsers),
        distributorsPercentage: calculatePercentage(distributors, totalUsers),
        retailersPercentage: calculatePercentage(retailers, totalUsers),
        consumersPercentage: calculatePercentage(consumers, totalUsers),
        approvedPercentage: calculatePercentage(approved, totalUsers),
        pendingPercentage: calculatePercentage(pending, totalUsers),
        rejectedPercentage: calculatePercentage(rejected, totalUsers)
      },
      roleDistribution: {
        farmers: farmers,
        distributors: distributors,
        retailers: retailers,
        consumers: consumers
      },
      approvalStatus: {
        approved: approved,
        pending: pending,
        rejected: rejected
      },
      statusByRole: {
        farmers: { 
          approved: farmersApproved,
          pending: farmersPending,
          rejected: farmersRejected
        },
        distributors: { 
          approved: distributorsApproved,
          pending: distributorsPending,
          rejected: distributorsRejected
        },
        retailers: { 
          approved: retailersApproved,
          pending: retailersPending,
          rejected: retailersRejected
        },
        consumers: { 
          approved: consumersApproved,
          pending: consumersPending,
          rejected: consumersRejected
        }
      }
    };
    
    console.log('✅ Transformed Data for Frontend:', transformedData);
    setAnalyticsData(transformedData);
    setLastUpdated(new Date());
    
  } catch (error) {
    console.error('❌ Error fetching analytics data:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    
    // Fallback to dummy data if API fails
    const dummyData = generateDummyData();
    console.log('🔄 Using fallback dummy data');
    setAnalyticsData(dummyData);
    setLastUpdated(new Date());
  } finally {
    setLoading(false);
  }
};
  // Dummy Data Fallback
  const generateDummyData = () => {
    const totalUsers = 9;
    const farmers = 5;
    const distributors = 1;
    const retailers = 2;
    const consumers = 1;
    const approved = 4;
    const pending = 0;
    const rejected = totalUsers - approved - pending;

    const calculatePercentage = (count, total) => {
      if (total === 0) return 0;
      return Math.round((count / total) * 100);
    };

    // Dynamic status distribution for dummy data
    const totalBusinessUsers = farmers + distributors + retailers + consumers;
    const calculateStatusDistribution = (roleCount, totalCount, statusCount) => {
      if (totalCount === 0) return 0;
      return Math.max(0, Math.round((roleCount / totalCount) * statusCount));
    };

    const farmersApproved = calculateStatusDistribution(farmers, totalBusinessUsers, approved);
    const distributorsApproved = calculateStatusDistribution(distributors, totalBusinessUsers, approved);
    const retailersApproved = calculateStatusDistribution(retailers, totalBusinessUsers, approved);
    const consumersApproved = Math.max(0, approved - farmersApproved - distributorsApproved - retailersApproved);

    const farmersPending = calculateStatusDistribution(farmers, totalBusinessUsers, pending);
    const distributorsPending = calculateStatusDistribution(distributors, totalBusinessUsers, pending);
    const retailersPending = calculateStatusDistribution(retailers, totalBusinessUsers, pending);
    const consumersPending = Math.max(0, pending - farmersPending - distributorsPending - retailersPending);

    const farmersRejected = calculateStatusDistribution(farmers, totalBusinessUsers, rejected);
    const distributorsRejected = calculateStatusDistribution(distributors, totalBusinessUsers, rejected);
    const retailersRejected = calculateStatusDistribution(retailers, totalBusinessUsers, rejected);
    const consumersRejected = Math.max(0, rejected - farmersRejected - distributorsRejected - retailersRejected);

    return {
      summary: {
        totalUsers: totalUsers,
        farmers: farmers,
        distributors: distributors,
        retailers: retailers,
        consumers: consumers,
        approved: approved,
        pending: pending,
        rejected: rejected,
        farmersPercentage: calculatePercentage(farmers, totalUsers),
        distributorsPercentage: calculatePercentage(distributors, totalUsers),
        retailersPercentage: calculatePercentage(retailers, totalUsers),
        consumersPercentage: calculatePercentage(consumers, totalUsers),
        approvedPercentage: calculatePercentage(approved, totalUsers),
        pendingPercentage: calculatePercentage(pending, totalUsers),
        rejectedPercentage: calculatePercentage(rejected, totalUsers)
      },
      roleDistribution: {
        farmers: farmers,
        distributors: distributors,
        retailers: retailers,
        consumers: consumers
      },
      approvalStatus: {
        approved: approved,
        pending: pending,
        rejected: rejected
      },
      statusByRole: {
        farmers: { 
          approved: farmersApproved,
          pending: farmersPending,
          rejected: farmersRejected
        },
        distributors: { 
          approved: distributorsApproved,
          pending: distributorsPending,
          rejected: distributorsRejected
        },
        retailers: { 
          approved: retailersApproved,
          pending: retailersPending,
          rejected: retailersRejected
        },
        consumers: { 
          approved: consumersApproved,
          pending: consumersPending,
          rejected: consumersRejected
        }
      }
    };
  };

  // Initialize with API data and refetch when refreshTrigger changes
  useEffect(() => {
    console.log('useEffect triggered, fetching data...');
    fetchAnalyticsData();
  }, [refreshTrigger]);

  // Refresh data - trigger useEffect
  const refreshData = () => {
    console.log('Refresh button clicked, triggering refetch...');
    setRefreshTrigger(prev => prev + 1);
  };

  // Chart Options - Remove grid lines
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  // Role Distribution Chart Data
  const roleDistributionChart = {
    labels: ['Farmers', 'Distributors', 'Retailers', 'Consumers'],
    datasets: [
      {
        label: 'User Count',
        data: [
          analyticsData?.roleDistribution.farmers || 0,
          analyticsData?.roleDistribution.distributors || 0,
          analyticsData?.roleDistribution.retailers || 0,
          analyticsData?.roleDistribution.consumers || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // Green
          'rgba(59, 130, 246, 0.8)', // Blue
          'rgba(168, 85, 247, 0.8)', // Purple
          'rgba(249, 115, 22, 0.8)'  // Orange
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(249, 115, 22)'
        ],
        borderWidth: 2,
      },
    ],
  };

  const pieChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'bottom',
    },
    tooltip: {
      callbacks: {
        label: function(context) {
          const label = context.label || '';
          const value = context.raw || 0;
          const total = context.dataset.data.reduce((a, b) => a + b, 0);
          const percentage = Math.round((value / total) * 100);
          return `${label}: ${value} (${percentage}%)`;
        }
      }
    },
  },
  cutout: '50%', // Makes it a doughnut chart, remove for regular pie
};
  // Approval Status Chart Data
  const approvalStatusChart = {
    labels: ['Approved', 'Pending', 'Rejected'],
    datasets: [
      {
        data: [
          analyticsData?.approvalStatus.approved || 0,
          analyticsData?.approvalStatus.pending || 0,
          analyticsData?.approvalStatus.rejected || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',  // Green
          'rgba(245, 158, 11, 0.8)', // Amber
          'rgba(239, 68, 68, 0.8)'   // Red
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(245, 158, 11)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2,
      },
    ],
  };

  // Simple Bar Chart - User Distribution by Role
  const userDistributionChart = {
    labels: ['Farmers', 'Distributors', 'Retailers', 'Consumers'],
    datasets: [
      {
        label: 'User Count',
        data: [
          analyticsData?.roleDistribution.farmers || 0,
          analyticsData?.roleDistribution.distributors || 0,
          analyticsData?.roleDistribution.retailers || 0,
          analyticsData?.roleDistribution.consumers || 0
        ],
        backgroundColor: 'rgba(59, 130, 246, 0.8)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 2,
      },
    ],
  };

  // Status by Role Chart Data
 // Farmer Pie Chart
const farmerPieChart = {
  labels: ['Approved', 'Pending', 'Rejected'],
  datasets: [
    {
      data: [
        analyticsData?.statusByRole?.farmers?.approved || 0,
        analyticsData?.statusByRole?.farmers?.pending || 0,
        analyticsData?.statusByRole?.farmers?.rejected || 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2,
    },
  ],
};

// Distributor Pie Chart
const distributorPieChart = {
  labels: ['Approved', 'Pending', 'Rejected'],
  datasets: [
    {
      data: [
        analyticsData?.statusByRole?.distributors?.approved || 0,
        analyticsData?.statusByRole?.distributors?.pending || 0,
        analyticsData?.statusByRole?.distributors?.rejected || 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2,
    },
  ],
};

// Retailer Pie Chart
const retailerPieChart = {
  labels: ['Approved', 'Pending', 'Rejected'],
  datasets: [
    {
      data: [
        analyticsData?.statusByRole?.retailers?.approved || 0,
        analyticsData?.statusByRole?.retailers?.pending || 0,
        analyticsData?.statusByRole?.retailers?.rejected || 0
      ],
      backgroundColor: [
        'rgba(34, 197, 94, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(239, 68, 68, 0.8)'
      ],
      borderColor: [
        'rgb(34, 197, 94)',
        'rgb(245, 158, 11)',
        'rgb(239, 68, 68)'
      ],
      borderWidth: 2,
    },
  ],
};

  if (!analyticsData) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner}></div>
        <h3>Loading Analytics...</h3>
      </div>
    );
  }


  const stackedChartOptions = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
    tooltip: {
      mode: 'index',
      intersect: false,
    },
  },
  scales: {
    y: {
      beginAtZero: true,
      grid: {
        display: false
      },
      stacked: true
    },
    x: {
      grid: {
        display: false
      },
      stacked: true
    }
  }
};
  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>Analytics Dashboard</h1>
            <p style={styles.subtitle}>User registration and approval insights</p>
            {lastUpdated && (
              <p style={styles.lastUpdated}>
                Last updated: {lastUpdated.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div style={styles.headerActions}>
            <button 
              onClick={refreshData} 
              style={{
                ...styles.refreshButton,
                ...(loading ? styles.refreshButtonDisabled : {})
              }} 
              disabled={loading}
            >
              <RefreshCw size={16} style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
              {loading ? 'Refreshing...' : 'Refresh Data'}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="total-users">
            <Users size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.totalUsers}</h3>
            <p style={styles.cardLabel}>Total Users</p>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="farmers">
            <Package size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.farmers}</h3>
            <p style={styles.cardLabel}>Farmers</p>
            <div style={styles.roleStats}>
              <span style={styles.rolePercentage}>
                {analyticsData.summary.farmersPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="distributors">
            <Truck size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.distributors}</h3>
            <p style={styles.cardLabel}>Distributors</p>
            <div style={styles.roleStats}>
              <span style={styles.rolePercentage}>
                {analyticsData.summary.distributorsPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="retailers">
            <Store size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.retailers}</h3>
            <p style={styles.cardLabel}>Retailers</p>
            <div style={styles.roleStats}>
              <span style={styles.rolePercentage}>
                {analyticsData.summary.retailersPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="consumers">
            <Users size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.consumers}</h3>
            <p style={styles.cardLabel}>Consumers</p>
            <div style={styles.roleStats}>
              <span style={styles.rolePercentage}>
                {analyticsData.summary.consumersPercentage}%
              </span>
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="approved">
            <UserCheck size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.approved}</h3>
            <p style={styles.cardLabel}>Approved</p>
            <div style={styles.statusPercentage}>
              {analyticsData.summary.approvedPercentage}% approval rate
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="pending">
            <Clock size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.pending}</h3>
            <p style={styles.cardLabel}>Pending</p>
            <div style={styles.statusPercentage}>
              {analyticsData.summary.pendingPercentage}% pending
            </div>
          </div>
        </div>

        <div style={styles.summaryCard}>
          <div style={styles.cardIcon} className="rejected">
            <UserX size={24} />
          </div>
          <div style={styles.cardContent}>
            <h3 style={styles.cardValue}>{analyticsData.summary.rejected}</h3>
            <p style={styles.cardLabel}>Rejected</p>
            <div style={styles.statusPercentage}>
              {analyticsData.summary.rejectedPercentage}% rejected
            </div>
          </div>
        </div>
      </div>

      {/* Chart Navigation */}
      <div style={styles.chartNav}>
        <button 
          onClick={() => setActiveChart('overview')}
          style={{
            ...styles.chartNavButton,
            ...(activeChart === 'overview' ? styles.chartNavButtonActive : {})
          }}
        >
          <PieChart size={16} />
          Overview
        </button>
        <button 
          onClick={() => setActiveChart('distribution')}
          style={{
            ...styles.chartNavButton,
            ...(activeChart === 'distribution' ? styles.chartNavButtonActive : {})
          }}
        >
          <BarChart3 size={16} />
          User Distribution
        </button>
        {/* <button 
          onClick={() => setActiveChart('status')}
          style={{
            ...styles.chartNavButton,
            ...(activeChart === 'status' ? styles.chartNavButtonActive : {})
          }}
        >
          <BarChart3 size={16} />
          Status Analysis
        </button> */}
      </div>

      {/* Charts Grid */}
      <div style={styles.chartsGrid}>
        {activeChart === 'overview' && (
          <>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>User Role Distribution</h3>
              <div style={styles.chartContainer}>
                <Doughnut data={roleDistributionChart} options={chartOptions} />
              </div>
            </div>

            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>Approval Status</h3>
              <div style={styles.chartContainer}>
                <Doughnut data={approvalStatusChart} options={chartOptions} />
              </div>
            </div>
          </>
        )}

        {activeChart === 'distribution' && (
          <div style={styles.fullWidthChart}>
            <div style={styles.chartCard}>
              <h3 style={styles.chartTitle}>User Distribution by Role</h3>
              <div style={styles.chartContainer}>
                <Bar data={userDistributionChart} options={chartOptions} />
              </div>
            </div>
          </div>
        )}

        {activeChart === 'status' && (
  <div style={styles.fullWidthChart}>
    <div style={styles.chartCard}>
      <h3 style={styles.chartTitle}>Approval Status by Role</h3>
      <div style={styles.pieChartsContainer}>
        {/* Farmer Pie Chart */}
        <div style={styles.pieChartWrapper}>
          <h4 style={styles.pieChartTitle}>Farmers</h4>
          <div style={styles.pieChartContainer}>
            <Doughnut data={farmerPieChart} options={chartOptions} />
          </div>
          <div style={styles.pieChartStats}>
            <div>Total: {analyticsData?.roleDistribution?.farmers || 0}</div>
            <div>Approved: {analyticsData?.statusByRole?.farmers?.approved || 0}</div>
            <div>Pending: {analyticsData?.statusByRole?.farmers?.pending || 0}</div>
            <div>Rejected: {analyticsData?.statusByRole?.farmers?.rejected || 0}</div>
          </div>
        </div>

        {/* Distributor Pie Chart */}
        <div style={styles.pieChartWrapper}>
          <h4 style={styles.pieChartTitle}>Distributors</h4>
          <div style={styles.pieChartContainer}>
            <Doughnut data={distributorPieChart} options={chartOptions} />
          </div>
          <div style={styles.pieChartStats}>
            <div>Total: {analyticsData?.roleDistribution?.distributors || 0}</div>
            <div>Approved: {analyticsData?.statusByRole?.distributors?.approved || 0}</div>
            <div>Pending: {analyticsData?.statusByRole?.distributors?.pending || 0}</div>
            <div>Rejected: {analyticsData?.statusByRole?.distributors?.rejected || 0}</div>
          </div>
        </div>

        {/* Retailer Pie Chart */}
        <div style={styles.pieChartWrapper}>
          <h4 style={styles.pieChartTitle}>Retailers</h4>
          <div style={styles.pieChartContainer}>
            <Doughnut data={retailerPieChart} options={chartOptions} />
          </div>
          <div style={styles.pieChartStats}>
            <div>Total: {analyticsData?.roleDistribution?.retailers || 0}</div>
            <div>Approved: {analyticsData?.statusByRole?.retailers?.approved || 0}</div>
            <div>Pending: {analyticsData?.statusByRole?.retailers?.pending || 0}</div>
            <div>Rejected: {analyticsData?.statusByRole?.retailers?.rejected || 0}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>

      {/* Quick Stats */}
      <div style={styles.quickStats}>
        <div style={styles.quickStat}>
          <div style={styles.quickStatIcon}>
            <UserCheck size={20} />
          </div>
          <div>
            <div style={styles.quickStatValue}>
              {analyticsData.summary.approvedPercentage}%
            </div>
            <div style={styles.quickStatLabel}>Overall Approval Rate</div>
          </div>
        </div>

        <div style={styles.quickStat}>
          <div style={styles.quickStatIcon}>
            <Clock size={20} />
          </div>
          <div>
            <div style={styles.quickStatValue}>{analyticsData.summary.pending}</div>
            <div style={styles.quickStatLabel}>Pending Approvals</div>
          </div>
        </div>

        <div style={styles.quickStat}>
          <div style={styles.quickStatIcon}>
            <Package size={20} />
          </div>
          <div>
            <div style={styles.quickStatValue}>{analyticsData.summary.farmers}</div>
            <div style={styles.quickStatLabel}>Total Farmers</div>
          </div>
        </div>

        <div style={styles.quickStat}>
          <div style={styles.quickStatIcon}>
            <Users size={20} />
          </div>
          <div>
            <div style={styles.quickStatValue}>{analyticsData.summary.consumers}</div>
            <div style={styles.quickStatLabel}>Total Consumers</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styles
const styles = {
  container: {
    padding: '20px',
    background: '#f8fafc',
    minHeight: '100vh'
  },
  header: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  headerContent: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  subtitle: {
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  lastUpdated: {
    color: '#6b7280',
    fontSize: '12px',
    margin: '2px 0 0 0',
    fontStyle: 'italic'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  timeFilter: {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    background: 'white'
  },
  refreshButton: {
    padding: '8px 16px',
    background: 'red',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '500'
  },
  refreshButtonDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed'
  },
  exportButton: {
    padding: '8px 16px',
    background: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    marginBottom: '24px'
  },
  summaryCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px'
  },
  cardIcon: {
    width: '60px',
    height: '60px',
    borderRadius: '12px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  },
  cardContent: {
    flex: 1
  },
  cardValue: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  cardLabel: {
    color: '#6b7280',
    margin: '4px 0',
    fontSize: '14px'
  },
  growthBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    background: '#dcfce7',
    color: '#166534',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    width: 'fit-content'
  },
  roleStats: {
    marginTop: '8px'
  },
  rolePercentage: {
    background: '#f3f4f6',
    color: '#374151',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '500'
  },
  statusPercentage: {
    color: '#6b7280',
    fontSize: '12px',
    marginTop: '4px'
  },
  chartNav: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    background: 'white',
    padding: '8px',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  chartNavButton: {
    padding: '10px 16px',
    background: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    color: '#6b7280',
    fontSize: '14px',
    fontWeight: '500'
  },
  chartNavButtonActive: {
    background: '#dc2626',
    color: 'white'
  },
  chartsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
    marginBottom: '24px'
  },
  fullWidthChart: {
    gridColumn: '1 / -1'
  },
  chartCard: {
    background: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  chartTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#1f2937',
    margin: '0 0 20px 0'
  },
  chartContainer: {
    height: '300px',
    position: 'relative'
  },
  quickStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  quickStat: {
    background: 'white',
    borderRadius: '8px',
    padding: '16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
  },
  quickStatIcon: {
    width: '40px',
    height: '40px',
    borderRadius: '8px',
    background: '#fef2f2',
    color: '#dc2626',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  quickStatValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937'
  },
  quickStatLabel: {
    color: '#6b7280',
    fontSize: '12px'
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '400px',
    gap: '16px'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f4f6',
    borderTop: '4px solid #dc2626',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite'
  },
  // Add to your styles object
pieChartsContainer: {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  marginTop: '20px'
},
pieChartWrapper: {
  background: '#f8fafc',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center',
  border: '1px solid #e2e8f0'
},
pieChartTitle: {
  fontSize: '16px',
  fontWeight: '600',
  color: '#1f2937',
  margin: '0 0 16px 0'
},
pieChartContainer: {
  height: '200px',
  position: 'relative',
  marginBottom: '16px'
},
pieChartStats: {
  fontSize: '14px',
  color: '#6b7280',
  display: 'flex',
  flexDirection: 'column',
  gap: '4px'
}
};

// Add CSS for card icons
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  .total-users { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }
  .farmers { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
  .distributors { background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); }
  .retailers { background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); }
  .consumers { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
  .approved { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
  .pending { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
  .rejected { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
`;
document.head.appendChild(style);

export default Analytics;