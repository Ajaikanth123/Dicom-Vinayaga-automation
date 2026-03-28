import React, { useState, useEffect } from 'react';
import { 
  getEmailSettings, 
  updateEmailSettings, 
  testEmail, 
  getEmailTemplates,
  updateEmailTemplate,
  uploadLogo 
} from '../../services/api';
import './Settings.css';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('smtp');
  const [settings, setSettings] = useState(null);
  const [templates, setTemplates] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [smtpSettings, setSmtpSettings] = useState({});
  const [orgSettings, setOrgSettings] = useState({});
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('DOCTOR_DICOM_READY');
  const [templateData, setTemplateData] = useState({});
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState('');

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  useEffect(() => {
    if (templates[selectedTemplate]) {
      setTemplateData(templates[selectedTemplate]);
    }
  }, [templates, selectedTemplate]);

  const loadSettings = async () => {
    try {
      const data = await getEmailSettings();
      setSettings(data);
      setSmtpSettings(data.smtp || {});
      setOrgSettings(data.organization || {});
      setLogoPreview(data.organization?.logoUrl || '');
      setLoading(false);
    } catch (error) {
      showMessage('error', 'Failed to load settings: ' + error.message);
      setLoading(false);
    }
  };

  const loadTemplates = async () => {
    try {
      const data = await getEmailTemplates();
      setTemplates(data);
    } catch (error) {
      showMessage('error', 'Failed to load templates: ' + error.message);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleSaveSmtp = async () => {
    // Basic validation
    if (!smtpSettings.host || !smtpSettings.port || !smtpSettings.auth?.user || !smtpSettings.auth?.pass) {
      showMessage('error', 'Please fill in all SMTP fields');
      return;
    }

    setSaving(true);
    try {
      await updateEmailSettings({ smtp: smtpSettings });
      showMessage('success', 'SMTP settings saved successfully!');
      
      // Don't reload settings to avoid password masking issue
      // Just update the local state to show the password as masked
      const updatedSmtpSettings = {
        ...smtpSettings,
        auth: {
          ...smtpSettings.auth,
          pass: '***' // Show masked password after successful save
        }
      };
      setSmtpSettings(updatedSmtpSettings);
      
      // Update the main settings state as well
      setSettings(prevSettings => ({
        ...prevSettings,
        smtp: updatedSmtpSettings
      }));
      
    } catch (error) {
      showMessage('error', 'Failed to save SMTP settings: ' + error.message);
    }
    setSaving(false);
  };

  const handleSaveOrganization = async () => {
    // Basic validation
    if (!orgSettings.name || !orgSettings.email) {
      showMessage('error', 'Please fill in organization name and email');
      return;
    }

    setSaving(true);
    try {
      await updateEmailSettings({ organization: orgSettings });
      showMessage('success', 'Organization settings saved successfully!');
      await loadSettings();
    } catch (error) {
      showMessage('error', 'Failed to save organization settings: ' + error.message);
    }
    setSaving(false);
  };

  const handleTestEmail = async () => {
    if (!testEmailAddress) {
      showMessage('error', 'Please enter an email address to test');
      return;
    }

    setTesting(true);
    try {
      const result = await testEmail(testEmailAddress);
      if (result.success) {
        showMessage('success', 'Test email sent successfully! Check your inbox.');
      } else {
        showMessage('error', 'Test email failed: ' + result.error);
      }
    } catch (error) {
      showMessage('error', 'Test email failed: ' + error.message);
    }
    setTesting(false);
  };

  const handleSaveTemplate = async () => {
    setSaving(true);
    try {
      // Auto-generate HTML from plain text for non-technical users
      const htmlTemplate = generateHtmlFromText(templateData.text || '');
      const updatedTemplateData = {
        ...templateData,
        html: htmlTemplate
      };
      
      await updateEmailTemplate(selectedTemplate, updatedTemplateData);
      showMessage('success', 'Template saved successfully!');
      await loadTemplates();
    } catch (error) {
      showMessage('error', 'Failed to save template: ' + error.message);
    }
    setSaving(false);
  };

  const insertPlaceholder = (placeholder) => {
    const textarea = document.querySelector('.simple-textarea');
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = templateData.text || '';
      const newText = currentText.substring(0, start) + placeholder + currentText.substring(end);
      
      setTemplateData({...templateData, text: newText});
      
      // Restore cursor position
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + placeholder.length, start + placeholder.length);
      }, 0);
    }
  };

  const generateHtmlFromText = (text) => {
    // Convert plain text to HTML with basic formatting
    const htmlContent = text
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>')
      .replace(/\{\{(\w+)\}\}/g, '<strong>{{$1}}</strong>');
    
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{organizationName}} - Notification</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #2e7d6f; }
        .logo { max-width: 200px; height: auto; margin-bottom: 15px; }
        .content { margin: 20px 0; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2e7d6f; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0; }
        strong { color: #2e7d6f; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            {{#if logoUrl}}<img src="{{logoUrl}}" alt="{{organizationName}}" class="logo">{{/if}}
            <h1 style="color: #2e7d6f; margin: 0;">{{organizationName}}</h1>
        </div>
        <div class="content">
            <p>${htmlContent}</p>
            {{#if viewerLink}}<a href="{{viewerLink}}" class="button">View Scan Results</a>{{/if}}
        </div>
        <div class="footer">
            <p>{{organizationName}}<br>
            {{#if organizationAddress}}{{organizationAddress}}<br>{{/if}}
            {{#if organizationPhone}}Phone: {{organizationPhone}}<br>{{/if}}
            {{#if organizationEmail}}Email: {{organizationEmail}}{{/if}}</p>
        </div>
    </div>
</body>
</html>`;
  };

  const handleLogoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please select an image file');
      return;
    }

    setLogoFile(file);
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => setLogoPreview(e.target.result);
    reader.readAsDataURL(file);

    // Upload immediately
    try {
      const result = await uploadLogo(file);
      if (result.success) {
        const newOrgSettings = { ...orgSettings, logoUrl: result.logoUrl };
        setOrgSettings(newOrgSettings);
        await updateEmailSettings({ organization: newOrgSettings });
        showMessage('success', 'Logo uploaded successfully!');
      }
    } catch (error) {
      showMessage('error', 'Logo upload failed: ' + error.message);
    }
  };

  const handleTemplateChange = (templateType) => {
    setSelectedTemplate(templateType);
    if (templates[templateType]) {
      setTemplateData(templates[templateType]);
    }
  };

  if (loading) {
    return (
      <div className="settings-loading">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">⚙️ Email Settings</h1>
          <p className="page-subtitle">Configure email notifications, templates, and organization branding</p>
        </div>
      </div>

      {message.text && (
        <div className={`settings-message ${message.type}`}>
          {message.type === 'success' ? '✅' : '❌'} {message.text}
        </div>
      )}

      <div className="settings-tabs">
        <button 
          className={`tab-button ${activeTab === 'smtp' ? 'active' : ''}`}
          onClick={() => setActiveTab('smtp')}
        >
          📧 SMTP Configuration
        </button>
        <button 
          className={`tab-button ${activeTab === 'organization' ? 'active' : ''}`}
          onClick={() => setActiveTab('organization')}
        >
          🏥 Organization Details
        </button>
        <button 
          className={`tab-button ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          📝 Email Templates
        </button>
        <button 
          className={`tab-button ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          🧪 Test Email
        </button>
      </div>

      <div className="settings-content">
        {/* SMTP Configuration Tab */}
        {activeTab === 'smtp' && (
          <div className="settings-section">
            <h2>📧 SMTP Configuration</h2>
            <p>Configure your email server settings for sending notifications</p>
            
            <div className="form-grid">
              <div className="form-group">
                <label>SMTP Host</label>
                <input
                  type="text"
                  value={smtpSettings.host || ''}
                  onChange={(e) => setSmtpSettings({...smtpSettings, host: e.target.value})}
                  placeholder="smtp.gmail.com"
                />
                <small>Your email provider's SMTP server</small>
              </div>

              <div className="form-group">
                <label>SMTP Port</label>
                <input
                  type="number"
                  value={smtpSettings.port || ''}
                  onChange={(e) => setSmtpSettings({...smtpSettings, port: parseInt(e.target.value)})}
                  placeholder="587"
                />
                <small>Usually 587 for TLS or 465 for SSL</small>
              </div>

              <div className="form-group">
                <label>Security</label>
                <select
                  value={smtpSettings.secure ? 'true' : 'false'}
                  onChange={(e) => setSmtpSettings({...smtpSettings, secure: e.target.value === 'true'})}
                >
                  <option value="false">TLS (Port 587)</option>
                  <option value="true">SSL (Port 465)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={smtpSettings.auth?.user || ''}
                  onChange={(e) => setSmtpSettings({
                    ...smtpSettings, 
                    auth: {...smtpSettings.auth, user: e.target.value}
                  })}
                  placeholder="your-email@gmail.com"
                />
                <small>The email address to send from</small>
              </div>

              <div className="form-group">
                <label>Password / App Password</label>
                <input
                  type="password"
                  value={smtpSettings.auth?.pass || ''}
                  onChange={(e) => setSmtpSettings({
                    ...smtpSettings, 
                    auth: {...smtpSettings.auth, pass: e.target.value}
                  })}
                  placeholder={smtpSettings.auth?.pass === '***' ? 'Password saved (enter new password to change)' : 'your-app-password'}
                />
                <small>For Gmail, use App Password (not regular password). {smtpSettings.auth?.pass === '***' ? 'Password is saved and hidden for security.' : ''}</small>
              </div>
            </div>

            <div className="smtp-help">
              <h3>📚 Setup Instructions</h3>
              <div className="help-section">
                <h4>Gmail Setup:</h4>
                <ol>
                  <li>Enable 2-Factor Authentication on your Google account</li>
                  <li>Go to Google Account Settings → Security → App Passwords</li>
                  <li>Generate an App Password for "Mail"</li>
                  <li>Use the generated password (not your regular password)</li>
                </ol>
              </div>
            </div>

            <button 
              className="save-button"
              onClick={handleSaveSmtp}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save SMTP Settings'}
            </button>
          </div>
        )}

        {/* Organization Details Tab */}
        {activeTab === 'organization' && (
          <div className="settings-section">
            <h2>🏥 Organization Details</h2>
            <p>Configure your organization information for email templates</p>
            
            <div className="form-grid">
              <div className="form-group logo-upload">
                <label>Organization Logo</label>
                <div className="logo-upload-area">
                  {logoPreview && (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Logo preview" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    id="logo-upload"
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="logo-upload" className="upload-button">
                    📷 {logoPreview ? 'Change Logo' : 'Upload Logo'}
                  </label>
                </div>
                <small>Recommended: 200x80px, PNG or JPG</small>
              </div>

              <div className="form-group">
                <label>Organization Name</label>
                <input
                  type="text"
                  value={orgSettings.name || ''}
                  onChange={(e) => setOrgSettings({...orgSettings, name: e.target.value})}
                  placeholder="CloudDICOM Medical Center"
                />
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={orgSettings.email || ''}
                  onChange={(e) => setOrgSettings({...orgSettings, email: e.target.value})}
                  placeholder="info@yourorganization.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  value={orgSettings.phone || ''}
                  onChange={(e) => setOrgSettings({...orgSettings, phone: e.target.value})}
                  placeholder="+91-9876543210"
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <textarea
                  value={orgSettings.address || ''}
                  onChange={(e) => setOrgSettings({...orgSettings, address: e.target.value})}
                  placeholder="123 Medical Street, Healthcare City"
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label>Support Email</label>
                <input
                  type="email"
                  value={orgSettings.supportEmail || ''}
                  onChange={(e) => setOrgSettings({...orgSettings, supportEmail: e.target.value})}
                  placeholder="support@yourorganization.com"
                />
              </div>

              <div className="form-group">
                <label>Support Phone</label>
                <input
                  type="tel"
                  value={orgSettings.supportPhone || ''}
                  onChange={(e) => setOrgSettings({...orgSettings, supportPhone: e.target.value})}
                  placeholder="+91-9876543210"
                />
              </div>
            </div>

            <button 
              className="save-button"
              onClick={handleSaveOrganization}
              disabled={saving}
            >
              {saving ? '💾 Saving...' : '💾 Save Organization Details'}
            </button>
          </div>
        )}

        {/* Email Templates Tab */}
        {activeTab === 'templates' && (
          <div className="settings-section">
            <h2>📝 Email Templates</h2>
            <p>Customize the messages sent to doctors and patients when scans are ready</p>
            
            <div className="simple-template-selector">
              <div className="template-cards">
                <div 
                  className={`template-card ${selectedTemplate === 'DOCTOR_DICOM_READY' ? 'active' : ''}`}
                  onClick={() => handleTemplateChange('DOCTOR_DICOM_READY')}
                >
                  <div className="template-icon">👨‍⚕️</div>
                  <h3>Doctor Notification</h3>
                  <p>Email sent to doctors when patient scans are ready for review</p>
                </div>
                
                <div 
                  className={`template-card ${selectedTemplate === 'PATIENT_SCAN_COMPLETE' ? 'active' : ''}`}
                  onClick={() => handleTemplateChange('PATIENT_SCAN_COMPLETE')}
                >
                  <div className="template-icon">🏥</div>
                  <h3>Patient Notification</h3>
                  <p>Email sent to patients when their scan is complete</p>
                </div>
              </div>
            </div>

            {templateData && Object.keys(templateData).length > 0 ? (
              <div className="simple-template-editor">
                <div className="template-preview-section">
                  <h3>✏️ Edit Email Content</h3>
                  
                  <div className="simple-form-group">
                    <label>📧 Email Subject Line</label>
                    <input
                      type="text"
                      value={templateData.subject || ''}
                      onChange={(e) => setTemplateData({...templateData, subject: e.target.value})}
                      placeholder="Enter the email subject"
                      className="simple-input"
                    />
                    <div className="help-text">
                      💡 This appears in the recipient's inbox. Keep it clear and professional.
                    </div>
                  </div>

                  <div className="simple-form-group">
                    <label>📝 Email Message</label>
                    <textarea
                      value={templateData.text || ''}
                      onChange={(e) => setTemplateData({...templateData, text: e.target.value})}
                      rows="12"
                      placeholder="Write your email message here..."
                      className="simple-textarea"
                    />
                    <div className="help-text">
                      💡 Write a friendly, professional message. You can use the placeholders below to automatically insert patient/doctor information.
                    </div>
                  </div>

                  <div className="placeholders-section">
                    <h4>🏷️ Available Placeholders</h4>
                    <p className="placeholders-help">Click any placeholder below to add it to your message:</p>
                    <div className="placeholders-grid">
                      <button 
                        type="button"
                        className="placeholder-btn"
                        onClick={() => insertPlaceholder('{{patientName}}')}
                      >
                        👤 Patient Name
                      </button>
                      <button 
                        type="button"
                        className="placeholder-btn"
                        onClick={() => insertPlaceholder('{{patientId}}')}
                      >
                        🆔 Patient ID
                      </button>
                      <button 
                        type="button"
                        className="placeholder-btn"
                        onClick={() => insertPlaceholder('{{doctorName}}')}
                      >
                        👨‍⚕️ Doctor Name
                      </button>
                      <button 
                        type="button"
                        className="placeholder-btn"
                        onClick={() => insertPlaceholder('{{organizationName}}')}
                      >
                        🏥 Hospital Name
                      </button>
                      <button 
                        type="button"
                        className="placeholder-btn"
                        onClick={() => insertPlaceholder('{{scanDate}}')}
                      >
                        📅 Scan Date
                      </button>
                      <button 
                        type="button"
                        className="placeholder-btn"
                        onClick={() => insertPlaceholder('{{viewerLink}}')}
                      >
                        🔗 View Scan Link
                      </button>
                    </div>
                  </div>

                  <div className="template-example">
                    <h4>📋 Preview Example</h4>
                    <div className="example-box">
                      <div className="example-subject">
                        <strong>Subject:</strong> {templateData.subject?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                          const examples = {
                            patientName: 'John Doe',
                            patientId: 'P12345',
                            doctorName: 'Dr. Smith',
                            organizationName: 'CloudDICOM Medical Center',
                            scanDate: new Date().toLocaleDateString()
                          };
                          return examples[key] || match;
                        }) || 'Your email subject will appear here'}
                      </div>
                      <div className="example-message">
                        {templateData.text?.replace(/\{\{(\w+)\}\}/g, (match, key) => {
                          const examples = {
                            patientName: 'John Doe',
                            patientId: 'P12345',
                            doctorName: 'Dr. Smith',
                            organizationName: 'CloudDICOM Medical Center',
                            scanDate: new Date().toLocaleDateString(),
                            viewerLink: 'https://your-site.com/viewer/abc123'
                          };
                          return examples[key] || match;
                        }) || 'Your email message will appear here with sample data filled in'}
                      </div>
                    </div>
                  </div>

                  <button 
                    className="save-template-button"
                    onClick={handleSaveTemplate}
                    disabled={saving}
                  >
                    {saving ? '💾 Saving Changes...' : '💾 Save Email Template'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="template-loading">
                <div className="loading-spinner"></div>
                <p>Loading template data...</p>
              </div>
            )}
          </div>
        )}

        {/* Test Email Tab */}
        {activeTab === 'test' && (
          <div className="settings-section">
            <h2>🧪 Test Email Configuration</h2>
            <p>Send a test email to verify your SMTP settings are working correctly</p>
            
            <div className="test-email-form">
              <div className="form-group">
                <label>Test Email Address</label>
                <input
                  type="email"
                  value={testEmailAddress}
                  onChange={(e) => setTestEmailAddress(e.target.value)}
                  placeholder="test@example.com"
                />
                <small>Enter an email address to receive the test message</small>
              </div>

              <button 
                className="test-button"
                onClick={handleTestEmail}
                disabled={testing || !testEmailAddress}
              >
                {testing ? '📧 Sending...' : '📧 Send Test Email'}
              </button>
            </div>

            <div className="test-info">
              <h3>📋 What gets tested:</h3>
              <ul>
                <li>✅ SMTP connection and authentication</li>
                <li>✅ Email template rendering</li>
                <li>✅ Organization branding and logo</li>
                <li>✅ Variable substitution</li>
                <li>✅ HTML and plain text versions</li>
              </ul>
            </div>

            {settings && (
              <div className="current-config">
                <h3>📊 Current Configuration:</h3>
                <div className="config-grid">
                  <div className="config-item">
                    <strong>SMTP Host:</strong> {settings.smtp?.host || 'Not configured'}
                  </div>
                  <div className="config-item">
                    <strong>SMTP Port:</strong> {settings.smtp?.port || 'Not configured'}
                  </div>
                  <div className="config-item">
                    <strong>Email:</strong> {settings.smtp?.auth?.user || 'Not configured'}
                  </div>
                  <div className="config-item">
                    <strong>Organization:</strong> {settings.organization?.name || 'Not configured'}
                  </div>
                  <div className="config-item">
                    <strong>Status:</strong> 
                    <span style={{ 
                      color: (settings.smtp?.auth?.user && settings.smtp?.auth?.pass && settings.smtp?.auth?.pass !== '***') ? '#28a745' : '#dc3545',
                      fontWeight: 'bold',
                      marginLeft: '8px'
                    }}>
                      {(settings.smtp?.auth?.user && settings.smtp?.auth?.pass && settings.smtp?.auth?.pass !== '***') ? '✅ Ready' : '❌ Not Configured'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;