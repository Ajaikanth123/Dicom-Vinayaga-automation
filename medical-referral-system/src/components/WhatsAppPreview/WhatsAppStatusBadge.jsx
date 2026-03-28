import './WhatsAppPreview.css';

// Case State Badge Component - System-driven workflow status
export const CaseStateBadge = ({ caseState, channelStatus = {} }) => {
  const getStateConfig = () => {
    switch (caseState) {
      case 'CASE_COMPLETE':
        return {
          icon: '✅',
          label: 'Complete',
          className: 'case-state-complete',
          tooltip: 'All steps completed: DICOM, Report, Notification'
        };
      case 'NOTIFICATION_SENT':
        return {
          icon: '📨',
          label: 'Notified',
          className: 'case-state-notified',
          tooltip: 'Doctor has been notified'
        };
      case 'REPORT_UPLOADED':
        return {
          icon: '📄',
          label: 'Report Ready',
          className: 'case-state-report',
          tooltip: 'Report uploaded - Send notification to complete'
        };
      case 'DICOM_UPLOADED':
        return {
          icon: '📁',
          label: 'DICOM Ready',
          className: 'case-state-dicom',
          tooltip: 'DICOM uploaded - Upload report to continue'
        };
      case 'CREATED':
      default:
        return {
          icon: '📋',
          label: 'Created',
          className: 'case-state-created',
          tooltip: 'Upload DICOM to start workflow'
        };
    }
  };

  const config = getStateConfig();

  return (
    <div className={`case-state-badge ${config.className}`} title={config.tooltip}>
      <span className="case-state-badge-icon">{config.icon}</span>
      <span className="case-state-badge-label">{config.label}</span>
    </div>
  );
};

// WhatsApp Notification Status Badge
const WhatsAppStatusBadge = ({ 
  notificationStatus,
  caseState
}) => {
  // Determine status based on notification status
  const getStatusConfig = () => {
    const hasReport = caseState === 'CASE_COMPLETED' || caseState === 'REPORT_UPLOADED';
    
    switch (notificationStatus) {
      case 'REPORT_SENT':
        return { 
          status: 'complete', 
          label: 'Report Sent', 
          icon: '✅', 
          color: 'green',
          tooltip: 'Initial + Report notifications sent'
        };
      case 'INITIAL_SENT':
        if (hasReport) {
          return { 
            status: 'report-ready', 
            label: 'Send Report', 
            icon: '📄', 
            color: 'orange',
            tooltip: 'Report ready - click to notify doctor'
          };
        }
        return { 
          status: 'initial-sent', 
          label: 'Sent', 
          icon: '✓', 
          color: 'blue',
          tooltip: 'Initial notification sent to patient & doctor'
        };
      default:
        return { 
          status: 'not-sent', 
          label: 'Not Sent', 
          icon: '—', 
          color: 'gray',
          tooltip: 'Click WhatsApp icon to send notifications'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <div 
      className={`wa-status-badge wa-status-${config.color}`}
      title={config.tooltip}
    >
      <span className="wa-status-icon">{config.icon}</span>
      <span className="wa-status-label">{config.label}</span>
    </div>
  );
};

export default WhatsAppStatusBadge;
