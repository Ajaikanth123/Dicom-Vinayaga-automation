import { useState, useEffect, useMemo } from 'react';
import { getFormsFromFirebase } from '../services/firebaseService';
import { BRANCHES } from '../config/branchConfig';
import './Pages.css';
import './Analytics.css';

const ANALYTICS_STORAGE_KEY = 'anbu_analytics';

const DEFAULT_BRANCHES = [
  { id: 'salem-gugai', branchName: 'ANBU – Salem (Gugai)', city: 'Salem' },
  { id: 'salem-lic', branchName: 'ANBU – Salem (LIC Colony)', city: 'Salem' },
  { id: 'ramanathapuram', branchName: 'ANBU – Ramanathapuram', city: 'Ramanathapuram' },
  { id: 'hosur', branchName: 'ANBU – Hosur', city: 'Hosur' },
];

// Date filter options
const DATE_FILTERS = {
  TODAY: 'today',
  LAST_7_DAYS: 'last7days',
  LAST_30_DAYS: 'last30days',
  CUSTOM: 'custom'
};

const getBranches = () => {
  return DEFAULT_BRANCHES;
};

const getPatientsByBranch = async (branchId) => {
  try {
    const forms = await getFormsFromFirebase(branchId);
    return forms;
  } catch (error) {
    console.error('[Analytics] Error loading patients:', error);
    return [];
  }
};

const getAnalyticsData = () => {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : { dicomViews: {} };
  } catch {
    return { dicomViews: {} };
  }
};

// Check if file data exists
const hasFileData = (fileData) => {
  if (!fileData) return false;
  if (fileData.hasFile) return true;
  if (fileData.name) return true;
  if (fileData.dataURL) return true;
  return false;
};

// Check if date is within range
const isDateInRange = (dateStr, startDate, endDate) => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  date.setHours(0, 0, 0, 0);
  return date >= startDate && date <= endDate;
};

// Get date range based on filter
const getDateRange = (filter, customStart, customEnd) => {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  switch (filter) {
    case DATE_FILTERS.TODAY:
      return { start: startOfToday, end: today };
    case DATE_FILTERS.LAST_7_DAYS:
      const last7 = new Date(startOfToday);
      last7.setDate(last7.getDate() - 6);
      return { start: last7, end: today };
    case DATE_FILTERS.LAST_30_DAYS:
      const last30 = new Date(startOfToday);
      last30.setDate(last30.getDate() - 29);
      return { start: last30, end: today };
    case DATE_FILTERS.CUSTOM:
      return {
        start: customStart ? new Date(customStart) : startOfToday,
        end: customEnd ? new Date(customEnd + 'T23:59:59') : today
      };
    default:
      return { start: new Date(0), end: today };
  }
};


const Analytics = () => {
  const [branches, setBranches] = useState([]);
  const [allPatients, setAllPatients] = useState([]);
  const [analyticsData, setAnalyticsData] = useState({ dicomViews: {} });
  const [dateFilter, setDateFilter] = useState(DATE_FILTERS.LAST_30_DAYS);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Load all data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const branchList = getBranches();
      setBranches(branchList);

      // Load all patients from all branches from Firebase
      const patients = [];
      for (const branch of branchList) {
        const branchPatients = await getPatientsByBranch(branch.id);
        branchPatients.forEach(p => {
          patients.push({ ...p, branchId: branch.id, branchName: branch.branchName });
        });
      }
      
      setAllPatients(patients);
      setAnalyticsData(getAnalyticsData());
      setIsLoading(false);
    };

    loadData();
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const dateRange = getDateRange(dateFilter, customStartDate, customEndDate);
    
    // Filter patients by branch if selected
    let filteredPatients = selectedBranch === 'all' 
      ? allPatients 
      : allPatients.filter(p => p.branchId === selectedBranch);

    // Filter out archived
    const activePatients = filteredPatients.filter(p => !p.isArchived);

    // Total patients
    const totalPatients = activePatients.length;

    // Patients per branch
    const patientsByBranch = {};
    branches.forEach(branch => {
      patientsByBranch[branch.id] = {
        name: branch.branchName,
        city: branch.city,
        count: 0,
        reportsToday: 0,
        dicomUploaded: 0,
        whatsappSent: 0,
        emailSent: 0
      };
    });

    activePatients.forEach(patient => {
      if (patientsByBranch[patient.branchId]) {
        patientsByBranch[patient.branchId].count++;
        
        // Check DICOM uploads
        if (hasFileData(patient.patient?.dicomFile)) {
          patientsByBranch[patient.branchId].dicomUploaded++;
        }
      }
    });

    // Reports uploaded in date range
    let reportsInRange = 0;
    let dicomInRange = 0;
    
    activePatients.forEach(patient => {
      const reportData = patient.patient?.diagnosticReport;
      const dicomData = patient.patient?.dicomFile;
      
      // Check report upload date
      if (hasFileData(reportData)) {
        const uploadDate = reportData.uploadedAt || patient.updatedAt || patient.createdAt;
        if (isDateInRange(uploadDate, dateRange.start, dateRange.end)) {
          reportsInRange++;
          if (patientsByBranch[patient.branchId]) {
            patientsByBranch[patient.branchId].reportsToday++;
          }
        }
      }

      // Check DICOM upload date
      if (hasFileData(dicomData)) {
        const uploadDate = dicomData.uploadedAt || patient.updatedAt || patient.createdAt;
        if (isDateInRange(uploadDate, dateRange.start, dateRange.end)) {
          dicomInRange++;
        }
      }
    });

    // DICOM views count
    let totalDicomViews = 0;
    Object.values(analyticsData.dicomViews || {}).forEach(views => {
      totalDicomViews += views.count || 0;
    });

    // Sort branches by patient count
    const sortedBranches = Object.entries(patientsByBranch)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.count - a.count);

    // WhatsApp and Email notifications sent (from channelStatus timestamps)
    let whatsappSent = 0;
    let emailSent = 0;
    let whatsappSentInRange = 0;
    let emailSentInRange = 0;
    
    activePatients.forEach(patient => {
      const channelStatus = patient.channelStatus || {};
      
      // Check WhatsApp sent status
      if (channelStatus.whatsapp === 'SENT') {
        whatsappSent++;
        // Check if sent within date range
        if (channelStatus.whatsappSentAt && isDateInRange(channelStatus.whatsappSentAt, dateRange.start, dateRange.end)) {
          whatsappSentInRange++;
        }
      }
      
      // Check Email sent status
      if (channelStatus.email === 'SENT') {
        emailSent++;
        // Check if sent within date range
        if (channelStatus.emailSentAt && isDateInRange(channelStatus.emailSentAt, dateRange.start, dateRange.end)) {
          emailSentInRange++;
        }
      }
    });

    // Update branch data with notification counts
    activePatients.forEach(patient => {
      if (patientsByBranch[patient.branchId]) {
        const channelStatus = patient.channelStatus || {};
        if (channelStatus.whatsapp === 'SENT') {
          patientsByBranch[patient.branchId].whatsappSent = (patientsByBranch[patient.branchId].whatsappSent || 0) + 1;
        }
        if (channelStatus.email === 'SENT') {
          patientsByBranch[patient.branchId].emailSent = (patientsByBranch[patient.branchId].emailSent || 0) + 1;
        }
      }
    });

    return {
      totalPatients,
      reportsInRange,
      dicomInRange,
      totalDicomViews,
      whatsappSent,
      emailSent,
      whatsappSentInRange,
      emailSentInRange,
      sortedBranches,
      dateRange
    };
  }, [allPatients, branches, analyticsData, dateFilter, customStartDate, customEndDate, selectedBranch]);

  const getDateFilterLabel = () => {
    switch (dateFilter) {
      case DATE_FILTERS.TODAY: return 'Today';
      case DATE_FILTERS.LAST_7_DAYS: return 'Last 7 Days';
      case DATE_FILTERS.LAST_30_DAYS: return 'Last 30 Days';
      case DATE_FILTERS.CUSTOM: return 'Custom Range';
      default: return 'All Time';
    }
  };

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="analytics-loading">
          <div className="loading-spinner"></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }


  return (
    <div className="page-container analytics-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">📊 Analytics Dashboard</h1>
          <p className="page-subtitle">Real-time operational metrics</p>
        </div>
      </div>

      {/* Filters Section */}
      <div className="analytics-filters">
        <div className="filter-group">
          <label>Date Range:</label>
          <select 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            className="filter-select"
          >
            <option value={DATE_FILTERS.TODAY}>Today</option>
            <option value={DATE_FILTERS.LAST_7_DAYS}>Last 7 Days</option>
            <option value={DATE_FILTERS.LAST_30_DAYS}>Last 30 Days</option>
            <option value={DATE_FILTERS.CUSTOM}>Custom Range</option>
          </select>
        </div>

        {dateFilter === DATE_FILTERS.CUSTOM && (
          <div className="filter-group custom-dates">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="date-input"
            />
            <span>to</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="date-input"
            />
          </div>
        )}

        <div className="filter-group">
          <label>Branch:</label>
          <select 
            value={selectedBranch} 
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="filter-select"
          >
            <option value="all">All Branches</option>
            {branches.map(branch => (
              <option key={branch.id} value={branch.id}>{branch.branchName}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="analytics-cards">
        <div className="analytics-card total-patients">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="currentColor" d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/>
            </svg>
          </div>
          <div className="card-content">
            <span className="card-number">{metrics.totalPatients}</span>
            <span className="card-label">Total Patients</span>
          </div>
        </div>

        <div className="analytics-card reports-uploaded">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="currentColor" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/>
            </svg>
          </div>
          <div className="card-content">
            <span className="card-number">{metrics.reportsInRange}</span>
            <span className="card-label">Reports ({getDateFilterLabel()})</span>
          </div>
        </div>

        <div className="analytics-card dicom-uploads">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="currentColor" d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14zM9 8h2v8H9zm4 0h2v8h-2z"/>
            </svg>
          </div>
          <div className="card-content">
            <span className="card-number">{metrics.dicomInRange}</span>
            <span className="card-label">DICOM Uploads ({getDateFilterLabel()})</span>
          </div>
        </div>

        <div className="analytics-card whatsapp-sent">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
          </div>
          <div className="card-content">
            <span className="card-number">{metrics.whatsappSent}</span>
            <span className="card-label">WhatsApp Sent</span>
          </div>
        </div>

        <div className="analytics-card email-sent">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" width="32" height="32">
              <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
            </svg>
          </div>
          <div className="card-content">
            <span className="card-number">{metrics.emailSent}</span>
            <span className="card-label">Email Sent</span>
          </div>
        </div>
      </div>

      {/* Branch Performance Table */}
      <div className="analytics-section">
        <h2 className="section-title">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          Patients by Branch
        </h2>
        
        <div className="branch-table-wrapper">
          <table className="branch-table">
            <thead>
              <tr>
                <th className="col-branch">Branch</th>
                <th className="col-city">City</th>
                <th className="col-numeric">Patients</th>
                <th className="col-numeric">DICOM</th>
                <th className="col-numeric">Reports</th>
                <th className="col-notification col-whatsapp">
                  <span className="header-icon whatsapp">
                    <svg viewBox="0 0 24 24" width="12" height="12">
                      <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
                    </svg>
                  </span>
                  WhatsApp
                </th>
                <th className="col-notification col-email">
                  <span className="header-icon email">
                    <svg viewBox="0 0 24 24" width="12" height="12">
                      <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  </span>
                  Email
                </th>
                <th className="col-progress">Progress</th>
              </tr>
            </thead>
            <tbody>
              {metrics.sortedBranches.map((branch, index) => {
                const totalNotifications = (branch.whatsappSent || 0) + (branch.emailSent || 0);
                const maxNotifications = branch.count * 2;
                const progress = maxNotifications > 0 
                  ? Math.round((totalNotifications / maxNotifications) * 100) 
                  : 0;
                return (
                  <tr key={branch.id} className={index === 0 && branch.count > 0 ? 'top-branch' : ''}>
                    <td className="col-branch">
                      {index === 0 && branch.count > 0 && <span className="top-badge">🏆</span>}
                      <span className="branch-name-text">{branch.name}</span>
                    </td>
                    <td className="col-city">{branch.city}</td>
                    <td className="col-numeric">{branch.count}</td>
                    <td className="col-numeric">{branch.dicomUploaded}</td>
                    <td className="col-numeric">{branch.reportsToday}</td>
                    <td className="col-notification col-whatsapp">
                      <span className="count-badge whatsapp">{branch.whatsappSent || 0}</span>
                    </td>
                    <td className="col-notification col-email">
                      <span className="count-badge email">{branch.emailSent || 0}</span>
                    </td>
                    <td className="col-progress">
                      <div className="progress-wrapper">
                        <div className="progress-track">
                          <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <span className="progress-label">{progress}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="analytics-section">
        <h2 className="section-title">
          <svg viewBox="0 0 24 24" width="24" height="24">
            <path fill="currentColor" d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
          </svg>
          Quick Stats
        </h2>
        
        <div className="quick-stats-grid">
          <div className="quick-stat">
            <span className="stat-value">{branches.length}</span>
            <span className="stat-label">Active Branches</span>
          </div>
          <div className="quick-stat">
            <span className="stat-value">
              {metrics.totalPatients > 0 
                ? Math.round(metrics.totalPatients / branches.length) 
                : 0}
            </span>
            <span className="stat-label">Avg Patients/Branch</span>
          </div>
          <div className="quick-stat whatsapp-stat">
            <span className="stat-value">
              {metrics.totalPatients > 0 
                ? Math.round((metrics.whatsappSent / metrics.totalPatients) * 100) 
                : 0}%
            </span>
            <span className="stat-label">WhatsApp Rate</span>
          </div>
          <div className="quick-stat email-stat">
            <span className="stat-value">
              {metrics.totalPatients > 0 
                ? Math.round((metrics.emailSent / metrics.totalPatients) * 100) 
                : 0}%
            </span>
            <span className="stat-label">Email Rate</span>
          </div>
          <div className="quick-stat notification-stat">
            <span className="stat-value">
              {metrics.totalPatients > 0 
                ? Math.round(((metrics.whatsappSent + metrics.emailSent) / (metrics.totalPatients * 2)) * 100) 
                : 0}%
            </span>
            <span className="stat-label">Overall Notification Rate</span>
          </div>
          <div className="quick-stat">
            <span className="stat-value">
              {allPatients.filter(p => p.isArchived).length}
            </span>
            <span className="stat-label">Archived Cases</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
