'use client';

import { useState } from 'react';

export type InputFormProps = {
  onGenerate?: (payload: {
    adInputType: 'image_url' | 'copy';
    adInputValue: string;
    targetUrl: string;
    audienceOverride?: string;
    toneOverride?: string;
  }) => Promise<void>;
  loading?: boolean;
  currentStep?: string;
};

export default function InputForm({ onGenerate, loading, currentStep }: InputFormProps) {
  const [adInputType, setAdInputType] = useState<'image_url' | 'copy'>('copy');
  const [adInputValue, setAdInputValue] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [audienceOverride, setAudienceOverride] = useState('');
  const [toneOverride, setToneOverride] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function handleImageUpload(file: File): Promise<string | null> {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        return data.url;
      } else {
        throw new Error(data.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
      return null;
    } finally {
      setIsUploading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      const url = await handleImageUpload(file);
      if (url) {
        setAdInputValue(url);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adInputValue.trim() || !targetUrl.trim()) return;

    await onGenerate({
      adInputType: adInputType,
      adInputValue: adInputValue.trim(),
      targetUrl: targetUrl.trim(),
      audienceOverride: audienceOverride || undefined,
      toneOverride: toneOverride || undefined,
    });
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    background: '#18181b',
    border: '1px solid #27272a',
    borderRadius: '8px',
    color: '#fafafa',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: '13px',
    fontWeight: 600,
    color: '#a1a1aa',
    marginBottom: '8px',
    marginTop: '20px',
  };

  const isDisabled = loading || isUploading || !adInputValue.trim() || !targetUrl.trim();

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '16px',
      padding: '28px',
    }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '4px' }}>
          Create Your Landing Page
        </div>
        <div style={{ fontSize: '14px', color: '#71717a' }}>
          Enter your ad details below
        </div>
      </div>

      {/* Tab Selection */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '24px',
        background: '#0f0f10',
        padding: '4px',
        borderRadius: '10px',
      }}>
        <button
          type="button"
          onClick={() => setAdInputType('copy')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            background: adInputType === 'copy' ? '#27272a' : 'transparent',
            color: adInputType === 'copy' ? '#fafafa' : '#71717a',
            transition: 'all 0.2s',
          }}
        >
          📝 Ad Copy
        </button>
        <button
          type="button"
          onClick={() => setAdInputType('image_url')}
          style={{
            flex: 1,
            padding: '12px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            background: adInputType === 'image_url' ? '#27272a' : 'transparent',
            color: adInputType === 'image_url' ? '#fafafa' : '#71717a',
            transition: 'all 0.2s',
          }}
        >
          🖼️ Ad Image
        </button>
      </div>

      {adInputType === 'copy' ? (
        <>
          <label style={labelStyle}>Your Ad Copy</label>
          <textarea
            value={adInputValue}
            onChange={(e) => setAdInputValue(e.target.value)}
            rows={6}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '140px' }}
            placeholder="Paste your ad copy, headlines, or marketing message..."
            disabled={loading}
          />
        </>
      ) : (
        <>
          <label style={labelStyle}>Upload Ad Image</label>
          <div style={{
            border: '2px dashed #3f3f46',
            borderRadius: '12px',
            padding: '32px',
            textAlign: 'center',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'border-color 0.2s, background 0.2s',
          }}>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={loading || isUploading}
              id="image-upload"
              style={{ display: 'none' }}
            />
            <label htmlFor="image-upload" style={{ cursor: 'pointer' }}>
              {isUploading ? (
                <div style={{ color: '#a78bfa' }}>Uploading...</div>
              ) : adInputValue ? (
                <img src={adInputValue} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '8px' }} />
              ) : (
                <div>
                  <div style={{ fontSize: '32px', marginBottom: '8px' }}>🖼️</div>
                  <div style={{ color: '#a1a1aa', fontSize: '14px' }}>Click to upload image</div>
                  <div style={{ color: '#52525b', fontSize: '12px', marginTop: '4px' }}>PNG, JPG up to 10MB</div>
                </div>
              )}
            </label>
          </div>
        </>
      )}

      <label style={labelStyle}>Target Website URL</label>
      <input
        type="url"
        value={targetUrl}
        onChange={(e) => setTargetUrl(e.target.value)}
        style={inputStyle}
        placeholder="https://yourwebsite.com"
        disabled={loading}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={labelStyle}>Target Audience</label>
          <select
            value={audienceOverride}
            onChange={(e) => setAudienceOverride(e.target.value)}
            style={inputStyle}
            disabled={loading}
          >
            <option value="">Auto-detect</option>
            <option value="merchant">Business/Merchant</option>
            <option value="consumer">Consumer</option>
            <option value="b2b">B2B Professional</option>
            <option value="saas">SaaS Users</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Design Style</label>
          <select
            value={toneOverride}
            onChange={(e) => setToneOverride(e.target.value)}
            style={inputStyle}
            disabled={loading}
          >
            <option value="">Auto-detect</option>
            <option value="clean-b2b">Clean B2B</option>
            <option value="editorial">Editorial</option>
            <option value="performance-landing">Performance</option>
          </select>
        </div>
      </div>

      <button
        type="submit"
        disabled={isDisabled}
        style={{
          width: '100%',
          marginTop: '28px',
          padding: '16px',
          background: isDisabled ? '#27272a' : '#fff',
          color: isDisabled ? '#52525b' : '#000',
          border: 'none',
          borderRadius: '10px',
          fontSize: '15px',
          fontWeight: 600,
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s',
        }}
      >
        {loading ? 'Generating...' : '🚀 Generate Landing Page'}
      </button>
      
      {loading && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            fontSize: '13px', 
            color: '#a78bfa',
            marginBottom: '8px'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#a78bfa',
              animation: 'pulse 1.5s infinite',
            }} />
            {currentStep === 'analyzing' ? 'AI is analyzing your ad...' : 
             currentStep === 'planning' ? 'Creating personalized strategy...' :
             currentStep === 'rendering' ? 'Building your page...' : 'Processing...'}
          </div>
          <div style={{ 
            height: '4px', 
            background: '#27272a', 
            borderRadius: '2px',
            overflow: 'hidden'
          }}>
            <div style={{
              height: '100%',
              width: '60%',
              background: 'linear-gradient(90deg, #a78bfa, #8b5cf6)',
              borderRadius: '2px',
              animation: 'loading 1.5s ease-in-out infinite',
            }} />
          </div>
        </div>
      )}
    </form>
  );
}