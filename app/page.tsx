'use client';

import { useState, useCallback } from 'react';
import InputForm from './components/input-form';
import ResultPanel from './components/result-panel';
import LandingPageRenderer from '@/components/preview/landing-page-renderer';
import { useInView } from 'react-intersection-observer';

// Convert spec to HTML for copying
function generateHtmlFromSpec(spec: any, brand?: string): string {
  const pageBrand = brand || spec?.brand || 'Brand';
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageBrand}</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <!-- Hero -->
  <section style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 80px 20px; text-align: center;">
    <h1 style="font-size: clamp(32px, 5vw, 48px); font-weight: bold; margin-bottom: 16px;">${spec.hero?.headline || pageBrand}</h1>
    <p style="font-size: 18px; margin-bottom: 32px;">${spec.hero?.subheadline || ''}</p>
    <a href="${spec.hero?.primaryCTA?.href || '#'}" style="background: white; color: #1e3a8a; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin-right: 12px;">${spec.hero?.primaryCTA?.label || 'Get Started'}</a>
    <a href="${spec.hero?.secondaryCTA?.href || '#'}" style="border: 2px solid white; color: white; padding: 12px 26px; border-radius: 8px; font-weight: 600;">${spec.hero?.secondaryCTA?.label || 'Learn More'}</a>
  </section>
  
  <!-- Stats -->
  <section style="padding: 60px 20px; background: #f8fafc; text-align: center;">
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 40px; max-width: 1000px; margin: 0 auto;">
      ${(spec.stats || []).map((stat: any) => `
      <div>
        <div style="font-size: 36px; font-weight: bold; color: #1e3a8a;">${stat.value}</div>
        <div style="font-size: 16px; color: #64748b;">${stat.label}</div>
      </div>`).join('')}
    </div>
  </section>
  
  <!-- Sections -->
  ${(spec.sections || []).map((section: any, i: number) => `
  <section style="padding: 60px 20px; background: ${i % 2 === 0 ? '#fff' : '#f8fafc'};">
    <h2 style="font-size: 32px; font-weight: bold; text-align: center; margin-bottom: 40px;">${section.title}</h2>
    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 32px; max-width: 1000px; margin: 0 auto;">
      ${(section.items || []).map((item: any) => `
      <div style="text-align: center; padding: 24px; background: white; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <h3 style="font-size: 20px; font-weight: 600; margin-bottom: 12px;">${item.title}</h3>
        <p style="color: #64748b;">${item.body}</p>
      </div>`).join('')}
    </div>
  </section>`).join('')}
  
  <!-- Closing CTA -->
  <section style="background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 60px 20px; text-align: center;">
    <h2 style="font-size: 32px; font-weight: bold; margin-bottom: 16px;">${spec.closingCTA?.headline || 'Ready?'}</h2>
    <p style="font-size: 18px; margin-bottom: 32px;">${spec.closingCTA?.body || ''}</p>
    <a href="${spec.closingCTA?.primaryCTA?.href || '#'}" style="background: white; color: #1e3a8a; padding: 14px 28px; border-radius: 8px; font-weight: 600;">${spec.closingCTA?.primaryCTA?.label || 'Get Started'}</a>
  </section>
  
  <!-- Footer -->
  <footer style="background: #1e293b; color: white; padding: 40px 20px; text-align: center;">
    <p style="font-size: 18px; font-weight: 600;">${pageBrand}</p>
    <p style="color: #94a3b8; font-size: 14px;">© 2024 ${pageBrand}. All rights reserved.</p>
  </footer>
</body>
</html>`;
}

export default function Home() {
  const [result, setResult] = useState<{
    success: boolean;
    previewId?: string;
    spec?: any;
    report?: any;
    qualityScore?: number;
    debug?: any;
    config?: any;
    html?: string;
  } | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [step, setStep] = useState<'idle' | 'analyzing' | 'planning' | 'rendering'>('idle');
  const { ref, inView } = useInView({ threshold: 0.1 });

  const handleGenerate = useCallback(async (data: { adInputType: 'image_url' | 'copy'; adInputValue: string; targetUrl: string }) => {
    if (!data.adInputType || !data.adInputValue?.trim() || !data.targetUrl?.trim()) return;

    setIsGenerating(true);
    setStep('analyzing');
    setResult(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const data_response = await res.json();

      if (data_response.success) {
        console.log('✅ API Success:', data_response);
        console.log('Spec exists:', !!data_response.spec);
        console.log('Spec keys:', data_response.spec ? Object.keys(data_response.spec) : 'no spec');
        setResult(data_response);
        setStep('rendering');
      } else {
        console.error('❌ API Error:', data_response);
        alert(data_response.error || 'Generation failed');
      }
    } catch (error) {
      console.error('Generation error:', error);
      alert('Failed to generate webpage');
    } finally {
      setIsGenerating(false);
      setStep('idle');
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#fafafa',
      fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", sans-serif',
    }}>
      {/* Header */}
      <header style={{
        padding: '80px 24px 60px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'linear-gradient(180deg, rgba(20,20,20,0.8) 0%, transparent 100%)',
      }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          color: '#a78bfa',
          marginBottom: '16px',
          opacity: 0.9,
        }}>
          AI-Powered Landing Pages
        </div>
        <h1 style={{
          fontSize: 'clamp(40px, 8vw, 72px)',
          fontWeight: 700,
          letterSpacing: '-0.03em',
          lineHeight: 1.05,
          marginBottom: '20px',
          background: 'linear-gradient(135deg, #fff 0%, #a1a1aa 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          Transform Ads Into<br />High-Converting Pages
        </h1>
        <p style={{
          fontSize: '18px',
          color: '#71717a',
          maxWidth: '540px',
          margin: '0 auto',
          lineHeight: 1.6,
        }}>
          Upload any ad creative—image or copy—and our AI agents instantly generate a tailored landing page that matches your brand voice and target audience.
        </p>
      </header>

      <main ref={ref} style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '60px 24px 80px',
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}>
          {/* Input Section */}
          <div style={{ position: 'sticky', top: '24px' }}>
            <InputForm
              onGenerate={handleGenerate}
              loading={isGenerating}
              currentStep={step}
            />
          </div>

          {/* Output Section */}
<ResultPanel
              result={result}
              loading={isGenerating}
            />
        </div>

        {/* Live Preview */}
        {(() => {
          console.log('🔍 Render check - result:', !!result);
          console.log('🔍 Render check - result.spec:', !!result?.spec);
          console.log('🔍 Render check - result.success:', result?.success);
          return result?.spec;
        })() && (
          <div style={{
            marginTop: '48px',
            border: '1px solid #27272a',
            borderRadius: '16px',
            overflow: 'hidden',
            background: '#ffffff',
          }}>
            <div style={{
              padding: '20px',
              background: '#18181b',
              borderBottom: '1px solid #27272a',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <div>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#fafafa',
                  margin: '0',
                }}>
                  📺 Live Webpage Preview
                </h3>
                <p style={{
                  fontSize: '14px',
                  color: '#71717a',
                  margin: '4px 0 0 0',
                }}>
                  This is your generated landing page
                </p>
              </div>
              <button
                onClick={() => {
                  const html = generateHtmlFromSpec(result.spec, result.debug?.brand);
                  navigator.clipboard.writeText(html);
                  alert('HTML code copied to clipboard!');
                }}
                style={{
                  background: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                📋 Copy Code
              </button>
            </div>
            <div style={{
              height: '600px',
              overflow: 'auto',
              background: '#ffffff',
            }}>
              <LandingPageRenderer spec={result.spec} brand={result.debug?.brand} />
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '32px 24px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        color: '#52525b',
        fontSize: '14px',
      }}>
        <p>Powered by Groq + Google Gemini • Built with Next.js 16</p>
      </footer>
    </div>
  );
}