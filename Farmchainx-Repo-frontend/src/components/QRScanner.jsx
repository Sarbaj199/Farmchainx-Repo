import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { 
  QrCode, X, CheckCircle, AlertCircle, Package, 
  Download, Copy, Scan, Calendar, DollarSign, 
  Scale, User, CalendarDays, Sprout
} from 'lucide-react';

const QRScanner = ({ onClose, onScanSuccess }) => {
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(true);
  const scannerRef = useRef(null);

  useEffect(() => {
    if (isScanning) {
      // Initialize scanner
      const scanner = new Html5QrcodeScanner(
        'qr-reader', 
        {
          qrbox: {
            width: 250,
            height: 250,
          },
          fps: 10,
          supportedScanTypes: [
            Html5QrcodeScanType.SCAN_TYPE_QR_CODE
          ]
        },
        false
      );

      const onScanSuccess = (decodedText, decodedResult) => {
        console.log('QR Scan result:', decodedText);
        try {
          const jsonData = JSON.parse(decodedText);
          setScanResult(jsonData);
          setError('');
          setIsScanning(false);
          scanner.clear();
          
          if (onScanSuccess) {
            onScanSuccess(jsonData);
          }
        } catch (err) {
          setError('Invalid QR code format. Expected JSON data.');
          console.error('JSON parse error:', err);
        }
      };

      const onScanFailure = (error) => {
        // Ignore scanning errors - they're normal during scanning
        if (error && !error.includes('NotFoundException')) {
          console.log('Scan error (normal):', error);
        }
      };

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(error => {
            console.log('Scanner cleanup error:', error);
          });
        }
      };
    }
  }, [isScanning, onScanSuccess]);

  const resetScanner = () => {
    setScanResult(null);
    setError('');
    setIsScanning(true);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(scanResult, null, 2));
    alert('Crop data copied to clipboard!');
  };

  const downloadData = () => {
    const dataStr = JSON.stringify(scanResult, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crop-${scanResult.cropId}-data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerLeft}>
            <QrCode size={24} style={{color: 'white', marginRight: 12}} />
            <div>
              <h2 style={styles.title}>Crop QR Scanner</h2>
              <p style={styles.subtitle}>Scan crop QR codes to view complete details</p>
            </div>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} style={{color: 'white'}} />
          </button>
        </div>

        <div style={styles.content}>
          {/* Scanner Section */}
          {isScanning && (
            <div style={styles.scannerSection}>
              <div style={styles.scannerContainer}>
                <div id="qr-reader" style={{ width: '100%' }}></div>
              </div>
              <div style={styles.scanningGuide}>
                <p style={styles.scanningText}>📱 Point camera at crop QR code</p>
                <div style={styles.scanningTips}>
                  <p style={styles.tip}>• Ensure good lighting</p>
                  <p style={styles.tip}>• Hold steady 6-12 inches away</p>
                  <p style={styles.tip}>• Keep QR code within frame</p>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div style={styles.errorSection}>
              <AlertCircle size={32} style={{color: '#dc2626', marginRight: 16}} />
              <div style={styles.errorContent}>
                <p style={styles.errorTitle}>Scanning Failed</p>
                <p style={styles.errorText}>{error}</p>
              </div>
              <button onClick={resetScanner} style={styles.retryButton}>
                Try Again
              </button>
            </div>
          )}

          {/* Scan Result */}
          {scanResult && !isScanning && (
            <div style={styles.resultSection}>
              {/* Success Header */}
              <div style={styles.successHeader}>
                <CheckCircle size={32} style={{color: '#16a34a', marginRight: 16}} />
                <div>
                  <h3 style={styles.successTitle}>Crop Data Loaded Successfully!</h3>
                  <p style={styles.successSubtitle}>Scanned crop information is displayed below</p>
                </div>
              </div>

              {/* Crop Image */}
              {scanResult.imageUrl && (
                <div style={styles.imageSection}>
                  <img 
                    src={scanResult.imageUrl} 
                    alt={scanResult.name}
                    style={styles.cropImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                    }}
                  />
                </div>
              )}

              {/* Main Crop Information */}
              <div style={styles.mainInfoCard}>
                <div style={styles.cropTitleSection}>
                  <Package size={24} style={{color: '#147a48', marginRight: 12}} />
                  <div>
                    <h2 style={styles.cropName}>{scanResult.name}</h2>
                    <p style={styles.cropVariety}>{scanResult.variety}</p>
                  </div>
                  <div style={styles.cropIdBadge}>
                    ID: {scanResult.cropId}
                  </div>
                </div>

                {/* Key Metrics Grid */}
                <div style={styles.metricsGrid}>
                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                      <DollarSign size={20} style={{color: '#059669'}} />
                    </div>
                    <div style={styles.metricContent}>
                      <p style={styles.metricLabel}>Price per kg</p>
                      <p style={styles.metricValue}>₹{scanResult.pricePerKg}</p>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                      <Scale size={20} style={{color: '#dc2626'}} />
                    </div>
                    <div style={styles.metricContent}>
                      <p style={styles.metricLabel}>Quantity Available</p>
                      <p style={styles.metricValue}>{scanResult.quantityAvailable} kg</p>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                      <Calendar size={20} style={{color: '#7c3aed'}} />
                    </div>
                    <div style={styles.metricContent}>
                      <p style={styles.metricLabel}>Harvest Date</p>
                      <p style={styles.metricValue}>{formatDate(scanResult.harvestDate)}</p>
                    </div>
                  </div>

                  <div style={styles.metricCard}>
                    <div style={styles.metricIcon}>
                      <Sprout size={20} style={{color: '#0d9488'}} />
                    </div>
                    <div style={styles.metricContent}>
                      <p style={styles.metricLabel}>Season</p>
                      <p style={styles.metricValue}>{scanResult.season}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Information */}
              <div style={styles.detailsGrid}>
                {/* Growing Information */}
                <div style={styles.detailCard}>
                  <h4 style={styles.detailTitle}>
                    <Sprout size={18} style={{marginRight: 8}} />
                    Growing Information
                  </h4>
                  <div style={styles.detailList}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Growing Period:</span>
                      <span style={styles.detailValue}>{scanResult.growingPeriod || 'Not specified'}</span>
                    </div>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Season:</span>
                      <span style={styles.detailValue}>{scanResult.season}</span>
                    </div>
                  </div>
                </div>

                {/* Farmer Information */}
                <div style={styles.detailCard}>
                  <h4 style={styles.detailTitle}>
                    <User size={18} style={{marginRight: 8}} />
                    Farmer Information
                  </h4>
                  <div style={styles.detailList}>
                    <div style={styles.detailItem}>
                      <span style={styles.detailLabel}>Farmer ID:</span>
                      <span style={styles.detailValue}>{scanResult.farmerId}</span>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {scanResult.description && (
                  <div style={styles.descriptionCard}>
                    <h4 style={styles.detailTitle}>
                      <CalendarDays size={18} style={{marginRight: 8}} />
                      Description
                    </h4>
                    <p style={styles.descriptionText}>{scanResult.description}</p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={styles.actionSection}>
                <h4 style={styles.actionTitle}>Data Actions</h4>
                <div style={styles.actionButtons}>
                  <button onClick={copyToClipboard} style={styles.actionButton}>
                    <Copy size={18} style={{marginRight: 8}} />
                    Copy JSON Data
                  </button>
                  <button onClick={downloadData} style={styles.actionButton}>
                    <Download size={18} style={{marginRight: 8}} />
                    Download Data
                  </button>
                  <button onClick={resetScanner} style={styles.scanAgainButton}>
                    <Scan size={18} style={{marginRight: 8}} />
                    Scan Another QR
                  </button>
                </div>
              </div>

              {/* Raw JSON Display */}
              <div style={styles.jsonSection}>
                <details style={styles.jsonDetails}>
                  <summary style={styles.jsonSummary}>
                    📋 View Raw JSON Data
                  </summary>
                  <div style={styles.jsonDisplay}>
                    <pre style={styles.jsonPre}>
                      {JSON.stringify(scanResult, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Add this constant for scan types
const Html5QrcodeScanType = {
  SCAN_TYPE_QR_CODE: 0,
  SCAN_TYPE_BARCODE: 1
};

// Your styles object (keep all your existing styles)
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
    padding: '16px'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '600px',
    maxHeight: '95vh',
    overflow: 'auto',
    boxShadow: '0 32px 64px rgba(0, 0, 0, 0.4)'
  },
  header: {
    background: 'linear-gradient(135deg, #147a48 0%, #0a8a3a 100%)',
    padding: '24px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: '20px 20px 0 0',
    color: 'white',
    position: 'sticky',
    top: 0,
    zIndex: 10
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    flex: 1
  },
  title: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    color: 'white'
  },
  subtitle: {
    fontSize: '14px',
    margin: '4px 0 0 0',
    opacity: 0.9,
    color: 'white'
  },
  closeButton: {
    background: 'rgba(255, 255, 255, 0.2)',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease'
  },
  content: {
    padding: '0'
  },
  scannerSection: {
    padding: '32px 24px',
    textAlign: 'center'
  },
  scannerContainer: {
    marginBottom: '24px',
    position: 'relative'
  },
  scanningGuide: {
    marginTop: '24px'
  },
  scanningText: {
    color: '#374151',
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px'
  },
  scanningTips: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    display: 'inline-block'
  },
  tip: {
    color: '#6b7280',
    fontSize: '14px',
    margin: '4px 0',
    textAlign: 'left'
  },
  errorSection: {
    backgroundColor: '#fef2f2',
    border: '2px solid #fecaca',
    borderRadius: '16px',
    padding: '24px',
    display: 'flex',
    alignItems: 'center',
    margin: '24px',
    textAlign: 'left'
  },
  errorContent: {
    flex: 1,
    marginRight: '20px'
  },
  errorTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#dc2626',
    margin: '0 0 8px 0'
  },
  errorText: {
    fontSize: '14px',
    color: '#991b1b',
    margin: 0,
    lineHeight: '1.5'
  },
  retryButton: {
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s ease'
  },
  resultSection: {
    padding: '24px'
  },
  successHeader: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '20px',
    backgroundColor: '#f0fdf4',
    borderRadius: '16px',
    border: '2px solid #bbf7d0'
  },
  successTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#166534',
    margin: 0
  },
  successSubtitle: {
    fontSize: '14px',
    color: '#15803d',
    margin: '4px 0 0 0'
  },
  imageSection: {
    marginBottom: '24px',
    textAlign: 'center'
  },
  cropImage: {
    width: '100%',
    maxWidth: '300px',
    height: '200px',
    objectFit: 'cover',
    borderRadius: '12px',
    border: '3px solid #e5e7eb'
  },
  mainInfoCard: {
    backgroundColor: 'white',
    border: '2px solid #f1f5f9',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)'
  },
  cropTitleSection: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  cropName: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  cropVariety: {
    fontSize: '16px',
    color: '#6b7280',
    margin: '4px 0 0 0'
  },
  cropIdBadge: {
    fontSize: '12px',
    color: '#6b7280',
    backgroundColor: '#f3f4f6',
    padding: '6px 12px',
    borderRadius: '20px',
    fontWeight: '500',
    marginLeft: 'auto'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '16px',
    marginTop: '20px'
  },
  metricCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '16px',
    textAlign: 'center',
    border: '1px solid #e5e7eb'
  },
  metricIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    backgroundColor: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
  },
  metricLabel: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '500',
    margin: '0 0 4px 0'
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: 0
  },
  detailsGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px'
  },
  detailCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px'
  },
  descriptionCard: {
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    gridColumn: '1 / -1'
  },
  detailTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0',
    display: 'flex',
    alignItems: 'center'
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
    padding: '12px 0',
    borderBottom: '1px solid #f3f4f6'
  },
  detailLabel: {
    fontSize: '14px',
    color: '#6b7280',
    fontWeight: '500'
  },
  detailValue: {
    fontSize: '14px',
    color: '#1f2937',
    fontWeight: '600',
    textAlign: 'right'
  },
  descriptionText: {
    fontSize: '14px',
    color: '#4b5563',
    lineHeight: '1.6',
    margin: 0
  },
  actionSection: {
    backgroundColor: '#f8fafc',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px'
  },
  actionTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0',
    textAlign: 'center'
  },
  actionButtons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  actionButton: {
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    minWidth: '160px',
    justifyContent: 'center'
  },
  scanAgainButton: {
    backgroundColor: '#f59e0b',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '14px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.2s ease',
    minWidth: '160px',
    justifyContent: 'center'
  },
  jsonSection: {
    borderTop: '2px solid #f1f5f9',
    paddingTop: '24px'
  },
  jsonDetails: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    overflow: 'hidden'
  },
  jsonSummary: {
    backgroundColor: '#f8fafc',
    padding: '16px 20px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
    border: 'none',
    outline: 'none'
  },
  jsonDisplay: {
    backgroundColor: '#1f2937',
    padding: '20px',
    overflow: 'auto',
    maxHeight: '300px'
  },
  jsonPre: {
    color: '#e5e7eb',
    fontSize: '12px',
    margin: 0,
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all'
  }
};

export default QRScanner;