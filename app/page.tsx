'use client';

import { useState, useCallback } from 'react';
import InputForm from './components/input-form';
import ResultPanel from './components/result-panel';
import LandingPageRenderer from '@/components/preview/landing-page-renderer';
import { useInView } from 'react-intersection-observer';

// Convert spec to HTML - DoorDash Quality
function generateHtmlFromSpec(spec: any, brand?: string): string {
  const pageBrand = brand || spec?.brand || 'Brand';
  const design = spec?.designTokens || {};
  const primary = design.colorPrimary || '#2563eb';
  const gradient = design.gradient || `linear-gradient(135deg, ${primary}, #3b82f6)`;
  const isLimo = pageBrand.toLowerCase().includes('limousine') || pageBrand.toLowerCase().includes('astar');
  
  const stats = spec.stats || [];
  const benefits = spec.sections?.find((s: any) => s.type === 'benefits')?.items || [];
  const testimonials = spec.sections?.find((s: any) => s.type === 'testimonials')?.items || [];
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageBrand} - ${spec.hero?.headline || 'Professional Service'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <style>
    :root {
      --primary: ${primary};
      --gradient: ${gradient};
    }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .hero-gradient { background: var(--gradient); }
    .btn-primary { 
      background: var(--primary); 
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
      transition: all 0.3s ease;
    }
    .btn-primary:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 20px 50px rgba(0,0,0,0.3);
    }
    .icon-circle {
      width: 4rem;
      height: 4rem;
      background: linear-gradient(135deg, var(--primary), ${primary}cc);
      border-radius: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.15);
    }
    .card-hover {
      transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .card-hover:hover {
      transform: translateY(-8px);
      box-shadow: 0 35px 60px -15px rgba(0,0,0,0.25);
    }
  </style>
</head>
<body class="antialiased">

  <!-- TRUST BADGES -->
  <div class="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto px-4 md:px-6 py-3">
      <div class="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm">
        <div class="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/50 border border-emerald-200/50 rounded-lg">
          <i class="fas fa-check-circle text-emerald-600"></i>
          <span class="font-semibold text-slate-900 text-xs md:text-sm">${isLimo ? '100% On-Time' : 'No Setup Fees'}</span>
        </div>
        <div class="flex items-center gap-2 px-3 py-1.5 bg-blue-100/50 border border-blue-200/50 rounded-lg">
          <i class="fas fa-clock text-blue-600"></i>
          <span class="font-semibold text-slate-900 text-xs md:text-sm">${isLimo ? '24/7 Service' : '24/7 Support'}</span>
        </div>
        <div class="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 border border-amber-200/50 rounded-lg">
          <i class="fas fa-star text-amber-600"></i>
          <span class="font-semibold text-slate-900 text-xs md:text-sm">${stats[0]?.value || '500+'} ${stats[0]?.label?.split(' ')[0] || 'Customers'}</span>
        </div>
      </div>
    </div>
  </div>

  <!-- SPLIT HERO -->
  <section class="hero-gradient relative overflow-hidden py-16 md:py-24">
    <div class="absolute inset-0 bg-black/10"></div>
    <div class="relative max-w-7xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 md:gap-16 items-center">
      <div class="text-white z-10">
        <h1 class="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
          ${spec.hero?.headline || 'Professional Service'}
        </h1>
        <p class="text-lg md:text-xl lg:text-2xl mb-8 opacity-95 max-w-lg leading-relaxed">
          ${spec.hero?.subheadline || 'Reliable solutions for your business'}
        </p>
        <div class="flex flex-col sm:flex-row gap-4">
          <a href="${spec.hero?.primaryCTA?.href || '#book'}" class="btn-primary text-base md:text-lg px-8 py-4 font-bold uppercase tracking-wide inline-block rounded-xl text-center">
            ${spec.hero?.primaryCTA?.label || 'Get Started'}
          </a>
          <a href="${spec.hero?.secondaryCTA?.href || '#fleet'}" class="border-2 border-white/80 px-8 py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-white hover:text-[var(--primary)] transition-all duration-300 text-center">
            ${spec.hero?.secondaryCTA?.label || 'Learn More'}
          </a>
        </div>
      </div>
      <div class="relative z-10 hidden md:block">
        <div class="w-full aspect-[4/3] bg-gradient-to-br from-white/20 to-white/5 rounded-3xl backdrop-blur-xl border-4 border-white/20 shadow-2xl flex items-center justify-center">
          <div class="w-48 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-2xl backdrop-blur-xl border-2 border-white/30 flex items-center justify-center">
            <i class="fas fa-${isLimo ? 'car-side' : 'star'} text-6xl text-white/80"></i>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS -->
  <section class="py-12 md:py-16 px-4 md:px-6 bg-white/50 backdrop-blur-xl">
    <div class="max-w-6xl mx-auto grid grid-cols-3 gap-4 md:gap-12 text-center">
      ${stats.map((stat: any) => `
      <div class="group p-4 md:p-6">
        <div class="text-4xl md:text-5xl lg:text-6xl font-black mb-2" style="color: ${primary}">${stat.value}</div>
        <div class="text-sm md:text-base font-semibold text-slate-800 tracking-tight">${stat.label}</div>
      </div>`).join('')}
    </div>
  </section>

  <!-- BENEFITS -->
  <section class="py-16 md:py-24 px-4 md:px-6">
    <div class="max-w-6xl mx-auto">
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 text-slate-900 leading-tight">
        Why ${pageBrand.split(' ')[0]}?
      </h2>
      <div class="grid md:grid-cols-3 gap-6 md:gap-8">
        ${benefits.map((benefit: any, i: number) => `
        <div class="card-hover group p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-slate-100/50 hover:border-[var(--primary)]/20">
          <div class="icon-circle mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
            <i class="fas fa-${['star', 'car', 'user'][i] || 'star'} text-2xl text-white"></i>
          </div>
          <h3 class="text-xl md:text-2xl font-bold mb-4 text-slate-900 group-hover:text-[var(--primary)] transition-colors text-center">
            ${benefit.title}
          </h3>
          <p class="text-base text-slate-600 leading-relaxed text-center">
            ${benefit.body}
          </p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS -->
  <section class="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 text-slate-900">
        What Our Clients Say
      </h2>
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        ${testimonials.slice(0, 2).map((item: any, i: number) => `
        <div class="bg-white/70 p-8 rounded-3xl shadow-2xl border border-slate-100/50 backdrop-blur-xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
          <div class="flex items-start mb-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mr-4 flex-shrink-0" style="background-color: ${primary}">
              ${item.title?.split(' ').map((n: string) => n[0]).join('').substring(0,2) || 'CS'}
            </div>
            <div>
              <div class="font-bold text-lg text-slate-900 mb-1">${item.title}</div>
              ${item.rating ? `<div class="flex text-sm" style="color: ${primary}">${'★'.repeat(item.rating)}</div>` : ''}
            </div>
          </div>
          <p class="text-base text-slate-700 leading-relaxed italic">"${item.body?.replace(/"/g, '') || 'Great service!'}"</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  ${isLimo ? `
  <!-- BOOKING FORM -->
  <section class="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
        Book Your Transfer
      </h2>
      <p class="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto">Starting at $89. 20% off first booking.</p>
      <div class="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/50">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Pickup</label>
            <select class="w-full p-4 border-2 border-slate-200/50 rounded-xl text-base font-semibold focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20">
              <option>Airport</option>
              <option>Hotel</option>
              <option>Office</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Passengers</label>
            <select class="w-full p-4 border-2 border-slate-200/50 rounded-xl text-base font-semibold focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20">
              <option>1-3 (Sedan)</option>
              <option>4-6 (SUV)</option>
              <option>7+ (Minibus)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-semibold text-slate-700 mb-2">Date</label>
            <input type="date" class="w-full p-4 border-2 border-slate-200/50 rounded-xl text-base font-semibold focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20"/>
          </div>
          <div class="flex items-end">
            <a href="#book" class="w-full btn-primary text-base py-4 px-6 font-bold uppercase tracking-wide rounded-xl flex items-center justify-center">Check</a>
          </div>
        </div>
      </div>
    </div>
  </section>` : ''}

  <!-- FINAL CTA -->
  <section class="hero-gradient py-16 md:py-20 px-4 md:px-6 text-white text-center relative overflow-hidden">
    <div class="absolute inset-0 bg-black/10 backdrop-blur-md" />
    <div class="relative z-10 max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight">${spec.closingCTA?.headline || 'Ready to get started?'}</h2>
      <p class="text-lg md:text-xl mb-8 opacity-95">${spec.closingCTA?.body || ''}</p>
      ${spec.closingCTA?.primaryCTA ? `<a href="${spec.closingCTA.primaryCTA.href || '#book'}" class="btn-primary text-lg md:text-xl px-12 py-5 font-bold uppercase tracking-wide inline-block shadow-2xl rounded-xl">${spec.closingCTA.primaryCTA.label}</a>` : ''}
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-16 px-4 md:px-6">
    <div class="max-w-6xl mx-auto text-center">
      <h3 class="text-2xl md:text-3xl font-black mb-6">${pageBrand}</h3>
      <p class="text-lg opacity-80 mb-8 max-w-2xl mx-auto leading-relaxed">Professional service for discerning clients</p>
      <div class="flex flex-wrap justify-center gap-6 text-base mb-8">
        <a href="#" class="font-semibold hover:opacity-80 transition-opacity">Home</a>
        <a href="#" class="font-semibold hover:opacity-80 transition-opacity">Services</a>
        <a href="#" class="font-semibold hover:opacity-80 transition-opacity">Contact</a>
        <a href="#" class="font-semibold hover:opacity-80 transition-opacity">Book Now</a>
      </div>
      <div class="border-t border-slate-700 pt-6 opacity-70">
        <p class="text-sm">© 2026 ${pageBrand}. All rights reserved.</p>
      </div>
    </div>
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
              <LandingPageRenderer spec={result.spec} />
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