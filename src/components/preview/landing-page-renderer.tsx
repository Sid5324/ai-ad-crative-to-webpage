'use client';

import { BrandSpec } from '@/lib/brand-engine';

interface RendererProps {
  spec: any;
}

export default function BrandRenderer({ spec }: RendererProps) {
  const primary = spec.designTokens?.colorPrimary || '#3B82F6';
  const gradient = spec.designTokens?.gradient || `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`;
  const accent = spec.designTokens?.accent || primary;

  return (
    <div className="brand-page antialiased" style={{
      '--primary': primary,
      '--gradient': gradient,
      '--accent': accent,
      '--radius': '16px',
    } as React.CSSProperties}>
      
      {/* HERO */}
      <section className="hero py-16 md:py-24 lg:py-32 px-6 text-white text-center overflow-hidden relative" style={{ background: gradient }}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10 max-w-5xl mx-auto">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
            {spec.hero?.headline || 'Professional Service'}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl mb-10 opacity-95 max-w-3xl mx-auto leading-relaxed">
            {spec.hero?.subheadline || 'Reliable solutions for your business'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto">
            {spec.hero?.primaryCTA && (
              <a 
                href={spec.hero.primaryCTA.href || '#book'}
                className="btn-primary text-base md:text-lg px-8 py-4 inline-block font-semibold tracking-wide uppercase rounded-xl"
                style={{ backgroundColor: 'white', color: primary }}
              >
                {spec.hero.primaryCTA.label}
              </a>
            )}
            {spec.hero?.secondaryCTA && (
              <a 
                href={spec.hero.secondaryCTA.href || '#fleet'}
                className="border-2 border-white px-8 py-4 rounded-xl font-semibold hover:bg-white hover:text-[var(--primary)] transition-all duration-300 text-base md:text-lg"
              >
                {spec.hero.secondaryCTA.label}
              </a>
            )}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="stats py-16 md:py-20 px-6 bg-gradient-to-br from-slate-50 to-white">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
          {spec.stats?.map((stat: any, i: number) => (
            <div key={i} className="group p-6">
              <div className="stat mb-3 font-black text-4xl md:text-5xl lg:text-6xl tracking-tight" style={{ color: primary }}>
                {stat.value}
              </div>
              <div className="text-base md:text-lg font-semibold text-slate-800 tracking-wide">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BENEFITS */}
      <section className="benefits py-16 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 text-slate-900 leading-tight">
            Why Choose {spec.brand || 'Us'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {spec.sections?.find((s: any) => s.type === 'benefits')?.items?.map((item: any, i: number) => (
              <div 
                key={i} 
                className="group p-8 rounded-2xl bg-white shadow-xl hover:shadow-2xl border border-slate-100 hover:-translate-y-2 transition-all duration-300 hover:bg-slate-50"
              >
                <h3 className="text-xl md:text-2xl font-bold mb-4 text-slate-900 group-hover:text-[var(--primary)] transition-colors">
                  {item.title}
                </h3>
                <p className="text-base text-slate-600 leading-relaxed">
                  {item.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      {spec.sections?.find((s: any) => s.type === 'testimonials') && (
        <section className="testimonials py-16 md:py-24 px-6 bg-slate-50">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 text-slate-900">
              What Our Clients Say
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {spec.sections?.find((s: any) => s.type === 'testimonials')?.items?.map((item: any, i: number) => (
                <div key={i} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 hover:shadow-2xl transition-all duration-300">
                  <div className="flex items-start mb-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold text-white mr-4 flex-shrink-0" style={{ backgroundColor: primary }}>
                      {item.title?.split(' ').map((n: string) => n[0]).join('').substring(0,2) || 'CS'}
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-900 mb-1">
                        {item.title}
                      </div>
                      {item.rating && (
                        <div className="flex text-sm" style={{ color: primary }}>
                          {'★'.repeat(item.rating)}
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-base text-slate-700 leading-relaxed italic">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      {spec.closingCTA && (
        <section className="final-cta py-16 md:py-20 px-6 text-white text-center relative overflow-hidden" style={{ background: gradient }}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight">
              {spec.closingCTA.headline}
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-95">
              {spec.closingCTA.body}
            </p>
            {spec.closingCTA.primaryCTA && (
              <a 
                href={spec.closingCTA.primaryCTA.href || '#book'}
                className="inline-block text-xl px-12 py-5 font-bold tracking-wide uppercase shadow-xl rounded-xl"
                style={{ backgroundColor: 'white', color: primary }}
              >
                {spec.closingCTA.primaryCTA.label}
              </a>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-slate-900 text-white py-12 md:py-16 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-black mb-6">{spec.brand || 'Your Company'}</h3>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Professional service for discerning clients
          </p>
          <div className="border-t border-slate-800 pt-6">
            <p className="text-sm opacity-70">&copy; 2026 {spec.brand || 'Company'}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}