import React, { useState } from 'react';
import { useGHLContext } from '../hooks/useGHLContext';
import { Card, Button, Input, message, Upload } from 'antd';
import { QuestionCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

export default function SupportTab() {
  const { context } = useGHLContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [fileList, setFileList] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!formData.email || !formData.subject || !formData.message) {
      message.error('Please fill in all required fields');
      return;
    }

    if (!validateEmail(formData.email)) {
      setEmailError('Please enter a valid email address');
      message.error('Invalid email address');
      return;
    }

    try {
      setSubmitting(true);
      setResult(null);

      // TODO: Implement support API endpoint
      // const formDataToSend = new FormData();
      // formDataToSend.append('name', formData.name);
      // formDataToSend.append('email', formData.email);
      // formDataToSend.append('subject', formData.subject);
      // formDataToSend.append('message', formData.message);
      // formDataToSend.append('locationId', context?.locationId || '');
      // await axios.post('/api/support/ticket', formDataToSend);
      
      // Mock success for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setResult({
        success: true,
        message: 'Your support ticket has been submitted successfully! Our team will respond within 24 hours.'
      });

      // Reset form
      setFormData({ name: '', email: '', subject: '', message: '' });
      setFileList([]);
      message.success('Support ticket submitted!');

    } catch (error) {
      console.error('Support ticket error:', error);
      setResult({
        success: false,
        message: error.response?.data?.error || 'Failed to submit support ticket'
      });
      message.error('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{
          width: '48px',
          height: '48px',
          background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
          borderRadius: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px'
        }}>
          🆘
        </div>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0, color: '#333' }}>Support & Feedback</h2>
          <p style={{ fontSize: '14px', color: '#666', margin: 0 }}>
            Need help? Send us a message and we'll get back to you
          </p>
        </div>
      </div>

      {/* Support Form */}
      <Card style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Name */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Your Name <span style={{ color: '#999' }}>(Optional)</span>
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              size="large"
            />
          </div>

          {/* Email */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Email Address <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                setEmailError('');
              }}
              onBlur={() => {
                if (formData.email && !validateEmail(formData.email)) {
                  setEmailError('Please enter a valid email address');
                }
              }}
              placeholder="your@email.com"
              size="large"
              status={emailError ? 'error' : ''}
            />
            {emailError && (
              <div style={{ color: '#ff4d4f', fontSize: '12px', marginTop: '4px' }}>
                ⚠️ {emailError}
              </div>
            )}
          </div>

          {/* Subject */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Subject <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <Input
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              placeholder="What do you need help with?"
              size="large"
            />
          </div>

          {/* Message */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Message <span style={{ color: '#ff4d4f' }}>*</span>
            </label>
            <TextArea
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              placeholder="Describe your issue or question in detail..."
              rows={6}
              size="large"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#333', marginBottom: '8px' }}>
              Screenshots <span style={{ color: '#999' }}>(Optional - Max 5 images)</span>
            </label>
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={({ fileList: newFileList }) => setFileList(newFileList)}
              beforeUpload={() => false}
              accept="image/*"
              maxCount={5}
            >
              {fileList.length < 5 && (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '24px', marginBottom: '4px' }}>📷</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>Upload</div>
                </div>
              )}
            </Upload>
            <p style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
              💡 Tip: Screenshots help us understand and resolve your issue faster
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="primary"
            size="large"
            onClick={handleSubmit}
            loading={submitting}
            disabled={!formData.email || !formData.subject || !formData.message || emailError}
            style={{ width: '100%', height: '48px', fontSize: '16px', fontWeight: '600' }}
          >
            {submitting ? 'Sending...' : 'Submit Support Ticket'}
          </Button>
        </div>
      </Card>

      {/* Result */}
      {result && (
        <Card style={{
          marginBottom: '24px',
          background: result.success ? '#f6ffed' : '#fff2f0',
          border: result.success ? '1px solid #b7eb8f' : '1px solid #ffccc7'
        }}>
          <div style={{
            fontSize: '18px',
            fontWeight: '600',
            color: result.success ? '#52c41a' : '#ff4d4f',
            marginBottom: '8px'
          }}>
            {result.success ? '✅ Ticket Submitted!' : '❌ Submission Failed'}
          </div>
          <div style={{ fontSize: '14px', color: result.success ? '#52c41a' : '#ff4d4f' }}>
            {result.message}
          </div>
        </Card>
      )}

      {/* Premium Support Info */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'start', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#1890ff',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            fontSize: '20px'
          }}>
            💎
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1890ff', marginBottom: '12px' }}>
              Premium Support - 24 Hour Response
            </h3>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#666', fontSize: '14px', lineHeight: '2' }}>
              <li>✅ Technical issues with the app</li>
              <li>✅ Questions about features or functionality</li>
              <li>✅ Feature requests or suggestions</li>
              <li>✅ Bug reports with screenshots</li>
            </ul>
            <div style={{
              marginTop: '16px',
              fontSize: '13px',
              color: '#1890ff',
              background: '#e6f7ff',
              padding: '12px 16px',
              borderRadius: '8px',
              fontWeight: '500'
            }}>
              ⏱️ <strong>Response Time:</strong> We typically respond within 24 hours
            </div>
          </div>
        </div>
      </Card>

      {/* FAQs */}
      <Card 
        title={<><QuestionCircleOutlined /> Frequently Asked Questions</>}
        style={{ marginTop: '24px' }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Q: Why am I not receiving notifications?
            </h4>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              A: Make sure you've enabled browser push notifications and clicked "Allow" when prompted. 
              Also verify your browser/OS notification settings allow notifications from this site.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Q: How do business hours work?
            </h4>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              A: Notifications will only be sent during your specified hours and days. 
              Priority keywords bypass this filter for urgent messages.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Q: What are priority keywords?
            </h4>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              A: Keywords like "urgent", "asap", "emergency" ensure you always get notified, 
              even outside business hours. Messages with these keywords bypass all time filters.
            </p>
          </div>

          <div>
            <h4 style={{ fontWeight: '600', marginBottom: '8px', color: '#333' }}>
              Q: Do notifications work when browser is closed?
            </h4>
            <p style={{ color: '#666', fontSize: '14px', lineHeight: '1.6' }}>
              A: Browser push works when minimized, but not when fully closed. 
              Use Slack integration for 24/7 notifications.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
