'use client';

export default function ResultPanel({
  result,
  loading,
}: {
  result: any;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '28px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          border: '3px solid #27272a',
          borderTopColor: '#3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />
        <div style={{ marginTop: '16px', fontSize: '15px', color: '#a1a1aa' }}>
          Generating your landing page...
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div style={{
        background: '#18181b',
        border: '1px solid #27272a',
        borderRadius: '16px',
        padding: '28px',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🎯</div>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#fafafa', marginBottom: '8px' }}>
          Your Generated Page
        </div>
        <div style={{ fontSize: '14px', color: '#71717a' }}>
          Fill in your ad details and click generate
        </div>
      </div>
    );
  }

  if (!result.success) {
    return (
      <div style={{
        background: '#18181b',
        border: '1px solid #ef4444',
        borderRadius: '16px',
        padding: '28px',
      }}>
        <div style={{ fontSize: '18px', fontWeight: 600, color: '#fca5a5', marginBottom: '12px' }}>
          ⚠️ Generation Issue
        </div>
        <div style={{ fontSize: '14px', color: '#fecaca' }}>{result.error}</div>
      </div>
    );
  }

  // Success - Show analysis info with blue button
  return (
    <div style={{
      background: '#18181b',
      border: '1px solid #27272a',
      borderRadius: '16px',
      padding: '24px',
    }}>
      {/* Header */}
      <div style={{ fontSize: '20px', fontWeight: 600, color: '#fafafa', marginBottom: '16px' }}>
        ✅ Your Page is Ready!
      </div>

      {/* Page Details */}
      {result.spec && (
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontSize: '14px', fontWeight: 600, color: '#a1a1aa', marginBottom: '12px' }}>
            📄 Generated Page Details
          </div>

          {/* Support both old and new spec formats */}
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Brand:</span>
              <span style={{ color: '#fafafa' }}>{result.spec?.brand?.name || result.spec?.brand || 'Brand'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Category:</span>
              <span style={{ color: '#fafafa' }}>{result.spec?.brand?.category || 'Business'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Hero Headline:</span>
              <span style={{ color: '#fafafa', fontSize: '13px', maxWidth: '60%' }}>
                {result.spec?.copy?.hero?.headline?.substring(0, 50) || result.spec?.hero?.headline?.substring(0, 50) || 'Not available'}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Primary CTA:</span>
              <span style={{ color: '#fafafa' }}>{result.spec?.copy?.hero?.primaryCta || result.spec?.hero?.primary_cta?.label || 'Get Started'}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#71717a' }}>Sections:</span>
              <span style={{ color: '#fafafa' }}>{result.spec.sections?.length || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Preview Link */}
      {result.previewId && (
        <div style={{ marginTop: '16px' }}>
          <a
            href={`/api/preview?id=${result.previewId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#3b82f6',
              color: 'white',
              padding: '12px 20px',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '14px',
              textDecoration: 'none',
            }}
          >
            🌐 Open Live Preview
          </a>
        </div>
      )}

      {/* Quality Score */}
      <div style={{ fontSize: '13px', color: '#71717a', marginBottom: '16px' }}>
        Quality: {result.qualityScore}/100 • {result.conversionPotential}
      </div>

      {/* Audience Resolution */}
      {result.audienceResolution && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '12px', 
          background: '#1e3a5f', 
          borderRadius: '8px',
          border: '1px solid #3b82f6'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#93c5fd', marginBottom: '4px' }}>
            🎯 Audience Resolution
          </div>
          <div style={{ fontSize: '14px', color: '#fafafa' }}>
            {result.audienceResolution.resolved || 'consumer'}
          </div>
        </div>
      )}

      {/* Validation Status */}
      {result.validation && (
        <div style={{ 
          marginBottom: '12px', 
          padding: '12px', 
          background: '#14532d', 
          borderRadius: '8px',
          border: '1px solid #22c55e'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#86efac', marginBottom: '8px' }}>
            🔍 Validation: {result.validation.valid ? 'PASSED' : 'FAILED'}
          </div>
          <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {result.validation.audienceMatch && (
              <div style={{ color: '#4ade80' }}>✅ Audience match</div>
            )}
            {result.validation.claimSafety && (
              <div style={{ color: '#4ade80' }}>✅ Claim safety</div>
            )}
            {result.validation.brandFit && (
              <div style={{ color: '#4ade80' }}>✅ Brand fit</div>
            )}
          </div>
        </div>
      )}

      {/* Page Spec */}
      {result.spec && (
        <div style={{ 
          padding: '12px', 
          background: '#27272a', 
          borderRadius: '8px'
        }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#a1a1aa', marginBottom: '8px' }}>
            📄 Generated Page Spec
          </div>
          <div style={{ fontSize: '12px', color: '#71717a', display: 'grid', gap: '4px' }}>
            {/* Support both old spec format and new orchestrator format */}
            <div><span style={{ color: '#52525b' }}>Brand:</span> {result.spec?.brand?.name || result.spec?.brand || 'Unknown'}</div>
            <div><span style={{ color: '#52525b' }}>Category:</span> {result.spec?.brand?.category || result.spec?.audience || 'Business'}</div>
            <div><span style={{ color: '#52525b' }}>Quality:</span> {result.qualityScore || 0}/100</div>
          </div>
        </div>
      )}
    </div>
  );
}