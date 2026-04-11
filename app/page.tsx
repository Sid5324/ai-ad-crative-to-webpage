'use client';

import { useState, useCallback } from 'react';
import InputForm from './components/input-form';
import ResultPanel from './components/result-panel';
import LandingPageRenderer from '@/components/preview/landing-page-renderer';
import { useInView } from 'react-intersection-observer';

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
            }}>
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
                This is your generated landing page - scroll down to see the full webpage
              </p>
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