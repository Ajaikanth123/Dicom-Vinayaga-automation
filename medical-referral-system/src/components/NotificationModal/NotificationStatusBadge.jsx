import './NotificationModal.css';

// Channel Status Types
export const CHANNEL_STATUS = {
  NOT_SENT: 'NOT_SENT',
  PENDING: 'PENDING',
  SENT: 'SENT',
  FAILED: 'FAILED'
};

const NotificationStatusBadge = ({ 
  whatsappStatus = CHANNEL_STATUS.NOT_SENT, 
  emailStatus = CHANNEL_STATUS.NOT_SENT,
  whatsappError = null,
  emailError = null,
  onRetryWhatsApp = null,
  onRetryEmail = null,
  compact = false 
}) => {
  const getStatusColor = (status) => {
    switch (status) {
      case CHANNEL_STATUS.SENT: return '#4caf50';
      case CHANNEL_STATUS.FAILED: return '#f44336';
      case CHANNEL_STATUS.PENDING: return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case CHANNEL_STATUS.SENT: return 'Sent';
      case CHANNEL_STATUS.FAILED: return 'Failed';
      case CHANNEL_STATUS.PENDING: return 'Pending';
      default: return 'Not Sent';
    }
  };

  const handleRetryClick = (e, retryFn) => {
    e.stopPropagation();
    if (retryFn) retryFn();
  };

  if (compact) {
    return (
      <div className="notification-status-compact">
        <span 
          className="status-dot" 
          style={{ backgroundColor: getStatusColor(whatsappStatus) }}
          title={`WhatsApp: ${getStatusLabel(whatsappStatus)}${whatsappError ? ` - ${whatsappError}` : ''}`}
        >
          <svg viewBox="0 0 24 24" width="10" height="10">
            <path fill="white" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
          </svg>
        </span>
        <span 
          className="status-dot" 
          style={{ backgroundColor: getStatusColor(emailStatus) }}
          title={`Email: ${getStatusLabel(emailStatus)}${emailError ? ` - ${emailError}` : ''}`}
        >
          <svg viewBox="0 0 24 24" width="10" height="10">
            <path fill="white" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
          </svg>
        </span>
      </div>
    );
  }

  return (
    <div className="notification-status-badge">
      <div 
        className={`channel-status whatsapp ${whatsappStatus.toLowerCase()}`}
        title={`WhatsApp: ${getStatusLabel(whatsappStatus)}${whatsappError ? ` - ${whatsappError}` : ''}`}
      >
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347"/>
        </svg>
        <span>{getStatusLabel(whatsappStatus)}</span>
        {whatsappStatus === CHANNEL_STATUS.FAILED && onRetryWhatsApp && (
          <button 
            className="retry-btn" 
            onClick={(e) => handleRetryClick(e, onRetryWhatsApp)}
            title={whatsappError || 'Retry WhatsApp'}
          >
            ↻
          </button>
        )}
      </div>
      <div 
        className={`channel-status email ${emailStatus.toLowerCase()}`}
        title={`Email: ${getStatusLabel(emailStatus)}${emailError ? ` - ${emailError}` : ''}`}
      >
        <svg viewBox="0 0 24 24" width="14" height="14">
          <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
        </svg>
        <span>{getStatusLabel(emailStatus)}</span>
        {emailStatus === CHANNEL_STATUS.FAILED && onRetryEmail && (
          <button 
            className="retry-btn" 
            onClick={(e) => handleRetryClick(e, onRetryEmail)}
            title={emailError || 'Retry Email'}
          >
            ↻
          </button>
        )}
      </div>
    </div>
  );
};

export default NotificationStatusBadge;
