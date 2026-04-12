'use client';

interface RendererProps {
  spec: any;
}

const ICONS = {
  star: '★',
  car: '🚗',
  user: '👤',
  plane: '✈️',
  clock: '⏰',
  shield: '🛡️',
  check: '✓',
};

export default function BrandRenderer({ spec }: RendererProps) {
  const primary = spec.designTokens?.colorPrimary || '#3B82F6';
  const gradient = spec.designTokens?.gradient || `linear-gradient(135deg, ${primary} 0%, ${primary}cc 100%)`;
  const brandName = spec.brand || 'Your Brand';
  const isLimo = brandName.toLowerCase().includes('limousine') || brandName.toLowerCase().includes('astar');
  
  // Get benefits from spec
  const benefits = spec.sections?.find((s: any) => s.type === 'benefits')?.items || [];
  const testimonials = spec.sections?.find((s: any) => s.type === 'testimonials')?.items || [];
  const stats = spec.stats || [];

  return (
    <div className="min-h-screen font-sans antialiased" style={{ '--primary': primary, '--gradient': gradient } as React.CSSProperties}>
      <style jsx global>{`
        :root {
          --primary: ${primary};
          --gradient: ${gradient};
        }
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
        .stat-number { 
          font-size: clamp(2.5rem, 8vw, 4rem); 
          font-weight: 900;
          background: linear-gradient(${primary}, ${primary}cc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
      `}</style>

      {/* TRUST BADGES - DoorDash Style */}
      <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/50 border border-emerald-200/50 rounded-lg">
              <span className="text-emerald-600">✓</span>
              <span className="font-semibold text-slate-900 text-xs md:text-sm">{isLimo ? '100% On-Time' : 'No Setup Fees'}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100/50 border border-blue-200/50 rounded-lg">
              <span className="text-blue-600">✓</span>
              <span className="font-semibold text-slate-900 text-xs md:text-sm">{isLimo ? '24/7 Service' : '24/7 Support'}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-100/50 border border-amber-200/50 rounded-lg">
              <span className="text-amber-600">★</span>
              <span className="font-semibold text-slate-900 text-xs md:text-sm">{stats[0]?.value || '500+'} {stats[0]?.label?.split(' ')[0] || 'Customers'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* SPLIT HERO - Luxury Style */}
      <section className="hero-gradient relative overflow-hidden py-16 md:py-24">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 md:gap-16 items-center">
          
          {/* Hero Text */}
          <div className="text-white z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-6 leading-tight tracking-tight">
              {spec.hero?.headline || 'Professional Service'}
            </h1>
            <p className="text-lg md:text-xl lg:text-2xl mb-8 opacity-95 max-w-lg leading-relaxed">
              {spec.hero?.subheadline || 'Reliable solutions for your business'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              {spec.hero?.primaryCTA && (
                <a href={spec.hero.primaryCTA.href || '#book'} className="btn-primary text-base md:text-lg px-8 py-4 font-bold uppercase tracking-wide inline-block rounded-xl text-center">
                  {spec.hero.primaryCTA.label}
                </a>
              )}
              {spec.hero?.secondaryCTA && (
                <a href={spec.hero.secondaryCTA.href || '#fleet'} className="border-2 border-white/80 px-8 py-4 rounded-xl font-semibold text-base md:text-lg hover:bg-white hover:text-[var(--primary)] transition-all duration-300 text-center">
                  {spec.hero.secondaryCTA.label}
                </a>
              )}
            </div>
          </div>

          {/* Hero Visual - Gradient Card */}
          <div className="relative z-10 hidden md:block">
            <div className="w-full aspect-[4/3] bg-gradient-to-br from-white/20 to-white/5 rounded-3xl backdrop-blur-xl border-4 border-white/20 shadow-2xl flex items-center justify-center">
              <div className="w-48 h-32 bg-gradient-to-br from-white/30 to-transparent rounded-2xl backdrop-blur-xl border-2 border-white/30 flex items-center justify-center">
                <span className="text-6xl text-white/80">{isLimo ? '🚗' : '★'}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      {stats.length > 0 && (
        <section className="py-12 md:py-16 px-4 md:px-6 bg-white/50 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto grid grid-cols-3 gap-4 md:gap-12 text-center">
            {stats.map((stat: any, i: number) => (
              <div key={i} className="group p-4 md:p-6">
                <div className="stat-number font-black mb-2" style={{ color: primary }}>
                  {stat.value}
                </div>
                <div className="text-sm md:text-base font-semibold text-slate-800 tracking-tight">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* BENEFITS - Icon Cards */}
      {benefits.length > 0 && (
        <section className="py-16 md:py-24 px-4 md:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 text-slate-900 leading-tight">
              Why {brandName.split(' ')[0]}
            </h2>
            <div className="grid md:grid-cols-3 gap-6 md:gap-8">
              {benefits.map((benefit: any, i: number) => (
                <div 
                  key={i}
                  className="card-hover group p-8 rounded-3xl bg-white/80 backdrop-blur-xl shadow-2xl border border-slate-100/50 hover:border-[var(--primary)]/20"
                >
                  <div className="icon-circle mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl text-white">{ICONS.car}</span>
                  </div>
                  <h3 className="text-xl md:text-2xl font-bold mb-4 text-slate-900 group-hover:text-[var(--primary)] transition-colors text-center">
                    {benefit.title}
                  </h3>
                  <p className="text-base text-slate-600 leading-relaxed text-center">
                    {benefit.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-center mb-12 md:mb-16 text-slate-900">
              What Our Clients Say
            </h2>
            <div className="grid md:grid-cols-2 gap-6 md:gap-8">
              {testimonials.slice(0, 2).map((item: any, i: number) => (
                <div key={i} className="bg-white/70 p-8 rounded-3xl shadow-2xl border border-slate-100/50 backdrop-blur-xl hover:shadow-3xl hover:-translate-y-2 transition-all duration-500">
                  <div className="flex items-start mb-4">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold text-white mr-4 flex-shrink-0" style={{ backgroundColor: primary }}>
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
                    "{item.body?.replace(/"/g, '') || 'Great service!'}"
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* BOOKING FORM - For Limo Brands */}
      {isLimo && (
        <section className="py-16 md:py-24 px-4 md:px-6 bg-gradient-to-b from-white to-slate-50">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
              Book Your Transfer
            </h2>
            <p className="text-lg md:text-xl mb-10 opacity-90 max-w-2xl mx-auto">
              Starting at $89. 20% off first booking.
            </p>
            
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-slate-200/50">
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Pickup Location</label>
                  <select className="w-full p-4 border-2 border-slate-200/50 rounded-xl text-base font-semibold focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20">
                    <option>Airport</option>
                    <option>Hotel</option>
                    <option>Office</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Passengers</label>
                  <select className="w-full p-4 border-2 border-slate-200/50 rounded-xl text-base font-semibold focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20">
                    <option>1-3 (Sedan)</option>
                    <option>4-6 (SUV)</option>
                    <option>7+ (Minibus)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
                  <input type="date" className="w-full p-4 border-2 border-slate-200/50 rounded-xl text-base font-semibold focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/20"/>
                </div>
                <div className="flex items-end">
                  <a href="#book" className="w-full btn-primary text-base py-4 px-6 font-bold uppercase tracking-wide rounded-xl flex items-center justify-center">
                    Check Availability
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* FINAL CTA */}
      {spec.closingCTA && (
        <section className="hero-gradient py-16 md:py-20 px-4 md:px-6 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10 backdrop-blur-md" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-6 leading-tight">
              {spec.closingCTA.headline}
            </h2>
            <p className="text-lg md:text-xl mb-8 opacity-95">
              {spec.closingCTA.body}
            </p>
            {spec.closingCTA.primaryCTA && (
              <a href={spec.closingCTA.primaryCTA.href || '#book'} className="btn-primary text-lg md:text-xl px-12 py-5 font-bold uppercase tracking-wide inline-block shadow-2xl rounded-xl">
                {spec.closingCTA.primaryCTA.label}
              </a>
            )}
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white py-12 md:py-16 px-4 md:px-6">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl md:text-3xl font-black mb-6 bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
            {brandName}
          </h3>
          <p className="text-lg opacity-80 mb-8 max-w-2xl mx-auto leading-relaxed">
            Professional service for discerning clients
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-base mb-8">
            <a href="#" className="font-semibold hover:opacity-80 transition-opacity">Home</a>
            <a href="#" className="font-semibold hover:opacity-80 transition-opacity">Services</a>
            <a href="#" className="font-semibold hover:opacity-80 transition-opacity">Contact</a>
            <a href="#" className="font-semibold hover:opacity-80 transition-opacity">Book Now</a>
          </div>
          <div className="border-t border-slate-700 pt-6 opacity-70">
            <p className="text-sm">© 2026 {brandName}. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}