import React from 'react';

const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slideInLeft {
    from { opacity: 0; transform: translateX(-30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes slideInRight {
    from { opacity: 0; transform: translateX(30px); }
    to { opacity: 1; transform: translateX(0); }
  }
  .fade-in-up { animation: fadeInUp 0.6s ease-out forwards; }
  .fade-in { animation: fadeIn 0.4s ease-out forwards; }
  .scale-in { animation: scaleIn 0.5s ease-out forwards; }
  .slide-left { animation: slideInLeft 0.5s ease-out forwards; }
  .slide-right { animation: slideInRight 0.5s ease-out forwards; }
  .stagger-1 { animation-delay: 0.1s; opacity: 0; }
  .stagger-2 { animation-delay: 0.2s; opacity: 0; }
  .stagger-3 { animation-delay: 0.3s; opacity: 0; }
  .stagger-4 { animation-delay: 0.4s; opacity: 0; }
  .card-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .card-hover:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.15); }
  .btn-hover { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
  .btn-hover:hover { transform: translateY(-2px); }
`;

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
  // Inject styles
  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleId = 'renderer-animations';
      if (!document.getElementById(styleId)) {
        const styleEl = document.createElement('style');
        styleEl.id = styleId;
        styleEl.textContent = styles;
        document.head.appendChild(styleEl);
      }
    }
  }, []);

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
      fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
      lineHeight: 1.6,
    }}>
      {/* Hero Section - Dynamic Colors */}
      <section style={{
        background: gradient,
        color: 'white',
        padding: 'clamp(60px, 8vw, 120px) 20px',
        textAlign: 'center',
        minHeight: '70vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }} className="fade-in-up">
          <h1 style={{
            fontSize: 'clamp(36px, 6vw, 56px)',
            fontWeight: '800',
            marginBottom: '20px',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
          }}>
            {spec.hero?.headline || `${pageBrand} - Premium Service`}
          </h1>
          <p style={{
            fontSize: 'clamp(18px, 2.5vw, 22px)',
            marginBottom: '36px',
            opacity: 0.92,
            lineHeight: 1.5,
            maxWidth: '700px',
            margin: '0 auto 36px',
          }}>
            {spec.hero?.subheadline || 'Discover premium services tailored for you'}
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {spec.hero?.primaryCTA && (
              <button className="btn-hover" style={{
                backgroundColor: 'white',
                color: primary,
                border: 'none',
                padding: '16px 36px',
                borderRadius: '10px',
                fontSize: '17px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)',
              }}>
                {spec.hero.primaryCTA.label || 'Get Started'}
              </button>
            )}
            {spec.hero?.secondaryCTA && (
              <button className="btn-hover" style={{
                backgroundColor: 'transparent',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.7)',
                padding: '14px 34px',
                borderRadius: '10px',
                fontSize: '17px',
                fontWeight: '600',
                cursor: 'pointer',
              }}>
                {spec.hero.secondaryCTA.label || 'Learn More'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      {spec.stats && spec.stats.length > 0 && (
        <section style={{
          padding: 'clamp(50px, 6vw, 80px) 20px',
          backgroundColor: '#f8fafc',
          textAlign: 'center',
        }}>
          <div style={{
            maxWidth: '1100px',
            margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '48px',
          }}>
            {spec.stats.map((stat: any, index: number) => (
              <div key={index} className={`fade-in scale-in stagger-${index + 1}`}>
                <div style={{
                  fontSize: 'clamp(32px, 4vw, 44px)',
                  fontWeight: '800',
                  color: primary,
                  marginBottom: '8px',
                }}>
                  {stat.value || '0'}
                </div>
                <div style={{
                  fontSize: '15px',
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  fontWeight: '600',
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
          padding: 'clamp(50px, 6vw, 80px) 20px',
          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
        }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 38px)',
              fontWeight: '700',
              color: '#1e293b',
              textAlign: 'center',
              marginBottom: '48px',
            }}>
              {section.title || 'Features'}
            </h2>

            {section.items && section.items.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
              }}>
                {section.items.map((item: any, itemIndex: number) => (
                  <div key={itemIndex} className="card-hover" style={{
                    textAlign: 'center',
                    padding: '32px 28px',
                    backgroundColor: 'white',
                    borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
                    border: '1px solid #e2e8f0',
                  }}>
                    <div style={{
                      width: '56px',
                      height: '56px',
                      backgroundColor: `${primary}15`,
                      borderRadius: '12px',
                      margin: '0 auto 20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: primary,
                      fontSize: '24px',
                      fontWeight: 'bold',
                    }}>
                      {String.fromCharCode(65 + itemIndex)}
                    </div>
                    <h3 style={{
                      fontSize: '20px',
                      fontWeight: '700',
                      color: '#1e293b',
                      marginBottom: '12px',
                    }}>
                      {item.title || 'Feature'}
                    </h3>
                    <p style={{
                      color: '#64748b',
                      lineHeight: 1.7,
                      fontSize: '15px',
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
          padding: 'clamp(60px, 8vw, 100px) 20px',
          textAlign: 'center',
        }} className="fade-in-up">
          <div style={{ maxWidth: '700px', margin: '0 auto' }}>
            <h2 style={{
              fontSize: 'clamp(28px, 4vw, 40px)',
              fontWeight: '800',
              marginBottom: '16px',
              letterSpacing: '-0.01em',
            }}>
              {spec.closingCTA.headline || 'Ready to Get Started?'}
            </h2>
            <p style={{
              fontSize: 'clamp(16px, 2vw, 20px)',
              marginBottom: '36px',
              opacity: 0.92,
            }}>
              {spec.closingCTA.body || 'Join thousands of satisfied customers today.'}
            </p>
            {spec.closingCTA.primaryCTA && (
              <button className="btn-hover" style={{
                backgroundColor: 'white',
                color: primary,
                border: 'none',
                padding: '18px 42px',
                borderRadius: '10px',
                fontSize: '18px',
                fontWeight: '700',
                cursor: 'pointer',
                boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
              }}>
                {spec.closingCTA.primaryCTA.label || 'Get Started'}
              </button>
            )}
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{
        backgroundColor: '#0f172a',
        color: 'white',
        padding: 'clamp(40px, 5vw, 60px) 20px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ marginBottom: '20px', fontSize: '20px', fontWeight: '700' }}>
            {pageBrand}
          </p>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            © 2024 {pageBrand}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}