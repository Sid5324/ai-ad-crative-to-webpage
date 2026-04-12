'use client';

import { useState, useCallback } from 'react';
import InputForm from './components/input-form';
import ResultPanel from './components/result-panel';
import LandingPageRenderer from '@/components/preview/landing-page-renderer';
import { useInView } from 'react-intersection-observer';

// Convert spec to HTML - DOORDASH REFERENCE QUALITY
function generateHtmlFromSpec(spec: any, brand?: string): string {
  const pageBrand = brand || spec?.brand || 'Brand';
  const design = spec?.designTokens || {};
  const primary = design.colorPrimary || '#2563eb';
  const gradient = design.gradient || `linear-gradient(135deg, ${primary}, #3b82f6)`;
  
  // Detect brand type
  const isLimo = pageBrand.toLowerCase().includes('limousine') || pageBrand.toLowerCase().includes('astar');
  const isFood = pageBrand.toLowerCase().includes('uber') || pageBrand.toLowerCase().includes('doordash') || pageBrand.toLowerCase().includes('dash');
  const isMerchant = pageBrand.toLowerCase().includes('merchant') || pageBrand.toLowerCase().includes('restaurant');
  
  // Choose eyebrow based on brand type
  const eyebrowText = isLimo ? 'Qatar\'s #1 Airport Transfer' : 
                      isFood ? 'Fast Delivery, Great Food' :
                      isMerchant ? 'Restaurant Growth Partner' :
                      'Premium Service';
  
  const stats = spec.stats || [];
  const benefits = spec.sections?.find((s: any) => s.type === 'benefits')?.items || [];
  const testimonials = spec.sections?.find((s: any) => s.type === 'testimonials')?.items || [];
  
  // Icons mapping based on brand type
  const getIcon = (i: number) => {
    if (isLimo) return ['fa-car-side', 'fa-user-tie', 'fa-plane'][i] || 'fa-star';
    if (isFood) return ['fa-bolt', 'fa-store', 'fa-location-dot'][i] || 'fa-star';
    return ['fa-chart-line', 'fa-gear', 'fa-hand-holding-dollar'][i] || 'fa-star';
  };
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageBrand} - ${spec.hero?.headline || 'Professional Service'}</title>
  <meta name="description" content="Join ${stats[0]?.value || 'thousands'} ${stats[0]?.label?.toLowerCase() || 'customers'} growing with ${pageBrand}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      theme: { extend: { colors: { primary: '${primary}', accent: '${primary}' } } }
    }
  </script>
  <style>
    :root {
      --primary: ${primary};
      --gradient: ${gradient};
    }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .hero-bg { background: var(--gradient); }
    .cta-primary { 
      background: #1e293b; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    }
    .cta-primary:hover { 
      background: #334155;
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }
    .merchant-card {
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }
    .merchant-card:hover {
      box-shadow: 0 10px 25px rgba(0,0,0,0.1);
      transform: translateY(-2px);
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .fade-in-up { animation: fadeInUp 0.6s ease-out; }
    .stat-value { color: var(--primary); }
  </style>
</head>
<body class="antialiased">

  <!-- HERO SECTION - Split Layout with Eyebrow -->
  <section class="hero-bg min-h-[70vh] flex items-center justify-center py-16 md:py-20 px-4 md:px-6">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <!-- Left: Copy -->
        <div class="space-y-6">
          <div class="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
            ${eyebrowText}
          </div>

          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
            ${spec.hero?.headline || 'Professional Service'}
          </h1>

          <p class="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg">
            ${spec.hero?.subheadline || 'Reliable solutions for your business'}
          </p>

          <div class="flex flex-col sm:flex-row gap-4">
            <a href="${spec.hero?.primaryCTA?.href || '#'}" class="cta-primary font-bold px-8 py-4 rounded-lg text-center text-lg text-white">
              ${spec.hero?.primaryCTA?.label || 'Get Started'}
            </a>
            <a href="${spec.hero?.secondaryCTA?.href || '#'}" class="border-2 border-white/50 hover:border-white text-white hover:bg-white/10 font-bold px-8 py-4 rounded-lg text-center text-lg transition-all">
              ${spec.hero?.secondaryCTA?.label || 'Learn More'}
            </a>
          </div>

          <!-- Trust signals inline -->
          <div class="flex flex-wrap items-center gap-6 text-sm text-white/80 pt-2">
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>${isLimo ? '100% On-Time' : isFood ? 'No Minimum Order' : 'No Setup Fees'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>${isLimo ? '24/7 Service' : isFood ? 'Live Tracking' : '24/7 Support'}</span>
            </div>
            <div class="flex items-center gap-2">
              <span class="w-2 h-2 bg-green-400 rounded-full"></span>
              <span>${isLimo ? '500+ Events' : isFood ? 'Fast Delivery' : 'Proven Results'}</span>
            </div>
          </div>
        </div>

        <!-- Right: Visual Mockup -->
        <div class="relative">
          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
            ${isLimo ? `
            <div class="text-center py-8">
              <i class="fas fa-car-side text-7xl text-white/80 mb-6"></i>
              <div class="text-3xl font-bold text-white mb-2">Premium Fleet</div>
              <div class="text-xl text-white/80">Mercedes S-Class • Escalade</div>
            </div>
            ` : isFood ? `
            <div class="space-y-4">
              <div class="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
                <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <i class="fas fa-bolt text-white text-xl"></i>
                </div>
                <div>
                  <div class="font-semibold text-white">Fast Delivery</div>
                  <div class="text-sm text-white/70">In 30 mins or less</div>
                </div>
              </div>
              <div class="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
                <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <i class="fas fa-store text-white text-xl"></i>
                </div>
                <div>
                  <div class="font-semibold text-white">500K+ Restaurants</div>
                  <div class="text-sm text-white/70">Your favorites, delivered</div>
                </div>
              </div>
              <div class="flex items-center gap-4 bg-white/10 p-4 rounded-xl">
                <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <i class="fas fa-location-dot text-white text-xl"></i>
                </div>
                <div>
                  <div class="font-semibold text-white">Track Live</div>
                  <div class="text-sm text-white/70">See your order arrive</div>
                </div>
              </div>
            </div>
            ` : `
            <div class="space-y-6">
              <div class="flex items-center gap-4">
                <div class="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <span class="text-white font-bold text-xl">${pageBrand.charAt(0)}</span>
                </div>
                <div>
                  <div class="font-semibold text-white">Dashboard</div>
                  <div class="text-sm text-white/70">Analytics & Insights</div>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-white/10 rounded-lg p-4">
                  <div class="text-sm text-white/70 mb-1">Total Orders</div>
                  <div class="text-2xl font-bold text-white">1,247</div>
                  <div class="text-sm text-green-400">+23%</div>
                </div>
                <div class="bg-white/10 rounded-lg p-4">
                  <div class="text-sm text-white/70 mb-1">Revenue</div>
                  <div class="text-2xl font-bold text-white">$8,547</div>
                  <div class="text-sm text-green-400">+18%</div>
                </div>
              </div>
            </div>
            `}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS SECTION -->
  <section class="py-12 md:py-16 px-4 md:px-6 bg-gray-50">
    <div class="max-w-6xl mx-auto">
      <div class="grid grid-cols-3 gap-6 md:gap-8">
        ${stats.map((stat: any) => `
        <div class="text-center">
          <div class="text-3xl md:text-4xl font-bold stat-value mb-2">${stat.value}</div>
          <div class="text-gray-600 text-sm md:text-base">${stat.label}</div>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- BENEFITS SECTION -->
  <section class="py-16 md:py-24 px-4 md:px-6 bg-white">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-12 md:mb-16">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
          ${isLimo ? 'Luxury Redefined' : isFood ? 'Why Choose Us' : 'Grow Your Business'}
        </h2>
        <p class="text-lg text-gray-600 max-w-2xl mx-auto">
          ${isLimo ? 'Premium transportation for discerning clients' : 
            isFood ? 'The best food delivery experience' : 
            'Comprehensive solutions for your needs'}
        </p>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
        ${benefits.map((benefit: any, i: number) => `
        <div class="merchant-card bg-white p-6 md:p-8 rounded-xl fade-in-up" style="animation-delay: ${i * 0.1}s">
          <div class="w-12 h-12 rounded-lg flex items-center justify-center mb-6" style="background-color: ${primary}15">
            <i class="fas fa-${getIcon(i)} text-2xl" style="color: ${primary}"></i>
          </div>
          <h3 class="text-xl font-bold mb-3 text-gray-900">${benefit.title}</h3>
          <p class="text-gray-600 leading-relaxed">${benefit.body}</p>
        </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- TESTIMONIALS SECTION -->
  ${testimonials.length > 0 ? `
  <section class="py-16 md:py-24 px-4 md:px-6 bg-gray-50">
    <div class="max-w-5xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold text-center mb-12 text-gray-900">
        What Our Clients Say
      </h2>
      <div class="grid md:grid-cols-2 gap-6 md:gap-8">
        ${testimonials.slice(0, 2).map((item: any, i: number) => `
        <div class="bg-white p-8 rounded-xl shadow-lg">
          <div class="flex items-start mb-4">
            <div class="w-12 h-12 rounded-lg flex items-center justify-center text-xl font-bold text-white mr-4" style="background-color: ${primary}">
              ${item.title?.split(' ').map((n: string) => n[0]).join('').substring(0,2) || 'CS'}
            </div>
            <div>
              <div class="font-bold text-lg text-gray-900">${item.title}</div>
              ${item.rating ? `<div class="flex text-sm mt-1" style="color: ${primary}">${'★'.repeat(item.rating)}</div>` : ''}
            </div>
          </div>
          <p class="text-gray-600 leading-relaxed italic">"${item.body?.replace(/"/g, '') || 'Great service!'}"</p>
        </div>`).join('')}
      </div>
    </div>
  </section>` : ''}

  ${isLimo ? `
  <!-- BOOKING FORM FOR LIMO -->
  <section class="py-16 md:py-24 px-4 md:px-6 bg-white">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-10">
        <h2 class="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Book Your Transfer</h2>
        <p class="text-lg text-gray-600">Starting at $89. 20% off first booking.</p>
      </div>
      <div class="bg-gray-50 rounded-2xl p-8 shadow-lg">
        <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Pickup</label>
            <select class="w-full p-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Doha Airport (DOH)</option>
              <option>Hotel</option>
              <option>Office</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Passengers</label>
            <select class="w-full p-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>1-3 (Sedan)</option>
              <option>4-6 (SUV)</option>
              <option>7+ (Minibus)</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input type="date" class="w-full p-3 border border-gray-200 rounded-lg text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent"/>
          </div>
          <div class="flex items-end">
            <a href="#book" class="cta-primary w-full py-3 px-6 rounded-lg font-bold text-white text-center block">Check</a>
          </div>
        </div>
      </div>
    </div>
  </section>` : ''}

  <!-- FINAL CTA -->
  <section class="hero-bg py-16 md:py-20 px-4 md:px-6 text-white text-center">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">${spec.closingCTA?.headline || 'Ready to get started?'}</h2>
      <p class="text-lg mb-8 opacity-90">${spec.closingCTA?.body || `Join ${stats[0]?.value || 'thousands'} ${stats[0]?.label?.toLowerCase() || 'customers'} today.`}</p>
      ${spec.closingCTA?.primaryCTA ? `<a href="${spec.closingCTA.primaryCTA.href || '#'}" class="inline-block bg-white text-gray-900 px-10 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-colors">${spec.closingCTA.primaryCTA.label}</a>` : ''}
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gray-900 text-white py-12 md:py-16 px-4 md:px-6">
    <div class="max-w-6xl mx-auto text-center">
      <h3 class="text-2xl md:text-3xl font-bold mb-6">${pageBrand}</h3>
      <p class="text-gray-400 mb-8 max-w-2xl mx-auto">Professional service for discerning clients</p>
      <div class="flex flex-wrap justify-center gap-6 text-base mb-8">
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Home</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Services</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Contact</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Book Now</a>
      </div>
      <div class="border-t border-gray-800 pt-8">
        <p class="text-gray-500 text-sm">© 2026 ${pageBrand}. All rights reserved.</p>
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