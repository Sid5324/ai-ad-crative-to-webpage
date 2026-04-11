import React from 'react';

// Helper to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return `#${(0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1)}`;
}

interface LandingPageRendererProps {
  spec: any;
  brand?: string;
}

export default function LandingPageRenderer({ spec, brand }: LandingPageRendererProps) {
  if (!spec) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: '#666' }}>
        No page spec available
      </div>
    );
  }

  const pageBrand = brand || spec.brand || 'Your Business';
  const design = spec.designTokens || {};
  const primary = design.colorPrimary || '#2563eb';
  const gradient = design.gradient || `linear-gradient(135deg, ${primary}, ${adjustColor(primary, 20)})`;

  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      color: '#000000',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
    }}>
      {/* Hero Section - Dynamic Colors */}
      <section style={{
        background: gradient,
        color: 'white',
        padding: '80px 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 'bold',
            marginBottom: '16px',
            lineHeight: 1.2,
          }}>
            {spec.hero?.headline || `${pageBrand} - Premium Service`}
          </h1>
          <p style={{
            fontSize: '18px',
            marginBottom: '32px',
            opacity: 0.9,
          }}>
            {spec.hero?.subheadline || 'Discover premium services tailored for you'}
          </p>
          {spec.hero?.primaryCTA && (
            <button style={{
              backgroundColor: 'white',
              color: '#1e3a8a',
              border: 'none',
              padding: '14px 28px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              marginRight: '12px',
            }}>
              {spec.hero.primaryCTA.label || 'Get Started'}
            </button>
          )}
          {spec.hero?.secondaryCTA && (
            <button style={{
              backgroundColor: 'transparent',
              color: 'white',
              border: '2px solid white',
              padding: '12px 26px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
            }}>
              {spec.hero.secondaryCTA.label || 'Learn More'}
            </button>
          )}
        </div>
      </section>

      {/* Stats Section */}
      {spec.stats && spec.stats.length > 0 && (
        <section style={{
          padding: '60px 20px',
          backgroundColor: '#f8fafc',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '1000px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '40px',
          }}>
            {spec.stats.map((stat: any, index: number) => (
              <div key={index}>
                <div style={{
                  fontSize: '36px',
                  fontWeight: 'bold',
                  color: '#1e3a8a',
                  marginBottom: '8px',
                }}>
                  {stat.value || '0'}
                </div>
                <div style={{
                  fontSize: '16px',
                  color: primary,
                }}>
                  {stat.label || ''}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Sections */}
      {spec.sections && spec.sections.map((section: any, index: number) => (
        <section key={index} style={{
          padding: '60px 20px',
          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
        }}>
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: '40px',
            }}>
              {section.title || 'Features'}
            </h2>

            {section.items && section.items.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '32px',
              }}>
                {section.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} style={{
                    textAlign: 'center',
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}>
                    <div style={{
                      width: '48px',
                      height: '48px',
                      backgroundColor: '#3b82f6',
                      borderRadius: '50%',
                      margin: '0 auto 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '24px',
                    }}>
                      ✓
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '600',
                      color: '#1e293b',
                      marginBottom: '12px',
                    }}>
                      {item.title || 'Feature'}
                    </h3>
                    <p style={{
                      color: '#64748b',
                      lineHeight: 1.6,
                    }}>
                      {item.body || 'Description'}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#64748b' }}>
                Section content will be displayed here
              </div>
            )}
          </div>
        </section>
      ))}

      {/* Closing CTA */}
      {spec.closingCTA && (
        <section style={{
          background: gradient,
          color: 'white',
          padding: '60px 20px',
          textAlign: 'center',
        }}>
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: '32px',
              fontWeight: 'bold',
              marginBottom: '16px',
            }}>
              {spec.closingCTA.headline || 'Ready to Get Started?'}
            </h2>
            <p style={{
              fontSize: '18px',
              marginBottom: '32px',
              opacity: 0.9,
            }}>
              {spec.closingCTA.body || 'Join thousands of satisfied customers today.'}
            </p>
            {spec.closingCTA.primaryCTA && (
              <button style={{
                backgroundColor: 'white',
                color: '#1e3a8a',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer',
                marginRight: '12px',
              }}>
                {spec.closingCTA.primaryCTA.label || 'Get Started'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        backgroundColor: '#1e293b',
        color: 'white',
        padding: '40px 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '600' }}>
            {pageBrand}
          </p>
          <p style={{ color: '#94a3b8', fontSize: '14px' }}>
            © 2024 {pageBrand}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}