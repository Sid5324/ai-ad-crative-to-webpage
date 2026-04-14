// ⚠️ REBUILD TRIGGER 2026-04-14 - Full Section Renderer 
// Includes ALL sections: Hero, Stats, Benefits, How It Works, Safety/Commitment, Testimonials, FAQ, Final CTA, Footer
// src/lib/skills/skill-professional-renderer.ts - Professional HTML Renderer V2

export const generateProfessionalHTMLv2 = (spec: {
  brandName: string;
  brandColors: { primary: string; accent: string; light: string; dark: string };
  copy: any;
  category: string;
}): string => {
  // DEBUG: Log to verify this function is being executed
  console.log('[V2 Renderer] generateProfessionalHTMLv2 called, category:', spec.category);
  
  const { brandName, brandColors, copy, category } = spec;

  // Category-specific configurations
  const categoryConfig: Record<string, any> = {
    'luxury_transportation': {
      headerTag: 'Premium Transportation',
      heroEmoji: '🚗',
      sectionTheme: 'dark',
      navLinks: ['Services', 'Fleet', 'Safety', 'Testimonials', 'FAQ'],
      trustIndicators: [
        { emoji: '🛡️', title: 'Verified Drivers', subtitle: 'Background checked & rated 4.8+' },
        { emoji: '🚗', title: 'Luxury Vehicles', subtitle: 'Premium sedans & SUVs' },
        { emoji: '📍', title: 'Real-Time Tracking', subtitle: 'Share your ride with loved ones' }
      ],
      howItWorks: [
        { step: '1', title: 'Download the App', desc: 'Get the app for iOS or Android to access premium services.' },
        { step: '2', title: 'Set Your Location', desc: 'Enter your pickup location and destination.' },
        { step: '3', title: 'Choose Premium', desc: 'Select premium service from vehicle options.' },
        { step: '4', title: 'Enjoy the Ride', desc: 'Sit back and enjoy professional service.' }
      ],
      safetyFeatures: [
        { title: 'Verified Drivers', desc: 'All drivers undergo rigorous background checks.' },
        { title: 'Real-Time Tracking', desc: 'Share your trip with loved ones.' },
        { title: '24/7 Support', desc: 'Round-the-clock support for any situation.' }
      ],
      testimonials: [
        { name: 'Sarah Johnson', role: 'Business Executive', quote: 'The service was flawless. Worth every penny.' },
        { name: 'Michael Chen', role: 'CEO', quote: 'Consistency and quality of service is outstanding.' }
      ],
      faqs: [
        { q: 'How much does premium service cost?', a: 'Prices vary by location and demand. Use the app to see current rates.' },
        { q: 'How do I book?', a: 'Open the app, select your destination, and choose premium service.' },
        { q: 'Are drivers background checked?', a: 'Yes, all drivers undergo comprehensive background checks.' }
      ]
    },
    'food_delivery': {
      headerTag: 'Fast Delivery',
      heroEmoji: '🍕',
      sectionTheme: 'light',
      navLinks: ['Restaurants', 'Delivery', 'About', 'Careers', 'Contact'],
      trustIndicators: [
        { emoji: '⚡', title: 'Fast Delivery', subtitle: 'Hot food in under 30 minutes' },
        { emoji: '🍽️', title: 'Thousands of Restaurants', subtitle: 'Local favorites & national chains' },
        { emoji: '📍', title: 'Live Tracking', subtitle: 'Track your order in real-time' }
      ],
      howItWorks: [
        { step: '1', title: 'Browse Restaurants', desc: 'Explore local restaurants near you.' },
        { step: '2', title: 'Place Your Order', desc: 'Add items to cart and checkout.' },
        { step: '3', title: 'Track Delivery', desc: 'Watch your order arrive in real-time.' },
        { step: '4', title: 'Enjoy Your Meal', desc: 'Hot, fresh food delivered to your door.' }
      ],
      safetyFeatures: [
        { title: 'Contactless Delivery', desc: 'Safe delivery with no contact required.' },
        { title: 'Hygienic Packaging', desc: 'Restaurants follow safety protocols.' },
        { title: 'Driver Health Checks', desc: 'Regular health monitoring for drivers.' }
      ],
      testimonials: [
        { name: 'John D.', role: 'Regular Customer', quote: 'Fastest delivery in town. Food is always hot!' },
        { name: 'Lisa M.', role: 'Food Lover', quote: 'Best selection of restaurants. Love it!' }
      ],
      faqs: [
        { q: 'How long is delivery?', a: 'Typically 25-40 minutes depending on distance.' },
        { q: 'Is there a delivery fee?', a: 'Fees vary by restaurant and distance.' },
        { q: 'Can I tip my driver?', a: 'Yes, you can tip in the app.' }
      ]
    },
    'default': {
      headerTag: 'Premium Service',
      heroEmoji: '⭐',
      sectionTheme: 'light',
      navLinks: ['Features', 'Benefits', 'About', 'Contact'],
      trustIndicators: [
        { emoji: '✓', title: 'Trusted by Thousands', subtitle: 'Satisfied customers worldwide' },
        { emoji: '⭐', title: '5-Star Rating', subtitle: 'Top-rated service' },
        { emoji: '📞', title: '24/7 Support', subtitle: 'Always here to help' }
      ],
      howItWorks: [
        { step: '1', title: 'Get Started', desc: 'Sign up or download the app.' },
        { step: '2', title: 'Choose Service', desc: 'Select the service that fits your needs.' },
        { step: '3', title: 'Set Details', desc: 'Enter your requirements.' },
        { step: '4', title: 'Enjoy', desc: 'Experience premium service.' }
      ],
      safetyFeatures: [
        { title: 'Secure Platform', desc: 'Your data is protected.' },
        { title: 'Verified Providers', desc: 'All providers are vetted.' },
        { title: 'Support Available', desc: 'Help whenever you need it.' }
      ],
      testimonials: [
        { name: 'Customer', role: 'Satisfied Client', quote: 'Excellent service! Highly recommended.' },
        { name: 'User', role: 'Happy Customer', quote: 'Best experience I have had.' }
      ],
      faqs: [
        { q: 'How do I get started?', a: 'Sign up online in minutes.' },
        { q: 'What are the costs?', a: 'Transparent pricing with no hidden fees.' },
        { q: 'What support is available?', a: '24/7 customer support.' }
      ]
    }
  };

  const config = categoryConfig[category] || categoryConfig['default'];
  const isDark = config.sectionTheme === 'dark';
  
  // Generate stats based on category
  const generateStats = () => {
    const statsMap: Record<string, any> = {
      luxury_transportation: [
        { value: '5★', label: 'Average Rating', desc: 'Top-rated drivers' },
        { value: '50M+', label: 'Rides Completed', desc: 'Satisfied customers' },
        { value: '65+', label: 'Countries', desc: 'Available worldwide' }
      ],
      food_delivery: [
        { value: '100K+', label: 'Daily Orders', desc: 'Delivered fresh' },
        { value: '10,000+', label: 'Partner Restaurants', desc: 'Wide selection' },
        { value: '500+', label: 'Cities Served', desc: 'Near you' }
      ],
      default: [
        { value: '10K+', label: 'Happy Customers', desc: 'Growing community' },
        { value: '15+', label: 'Years of Service', desc: 'Industry experience' },
        { value: '50+', label: 'Cities', desc: 'Service coverage' }
      ]
    };
    return statsMap[category] || statsMap['default'];
  };

  const stats = generateStats();

  // Generate benefits based on category
  const generateBenefits = () => {
    const benefitsMap: Record<string, any[]> = {
      luxury_transportation: [
        { emoji: '⭐', title: 'Top-Rated Drivers', desc: 'Every driver maintains 4.8+ star rating for exceptional service.' },
        { emoji: '🚗', title: 'Luxury Vehicles', desc: 'Travel in premium sedans, SUVs for maximum comfort.' },
        { emoji: '🤵', title: 'Professional Service', desc: 'White-glove service from uniformed drivers.' },
        { emoji: '🛡️', title: 'Safety First', desc: 'Real-time tracking and 24/7 support.' }
      ],
      food_delivery: [
        { emoji: '⚡', title: 'Lightning-Fast Delivery', desc: 'Hot, fresh food delivered in under 30 minutes.' },
        { emoji: '🍽️', title: 'Diverse Selection', desc: 'Thousands of restaurants and cuisines.' },
        { emoji: '📍', title: 'Live Tracking', desc: 'Track your order from restaurant to door.' },
        { emoji: '🛟', title: 'Contactless Delivery', desc: 'Safe, hygienic delivery options.' }
      ],
      default: [
        { emoji: '✓', title: 'Premium Quality', desc: 'Experience excellence in every interaction.' },
        { emoji: '🚀', title: 'Personalized Solutions', desc: 'Services tailored to your needs.' },
        { emoji: '💎', title: 'Reliable & Trustworthy', desc: 'Dependable service you can count on.' },
        { emoji: '📈', title: 'Innovation & Excellence', desc: 'Cutting-edge solutions.' }
      ]
    };
    return benefitsMap[category] || benefitsMap['default'];
  };

  const benefits = generateBenefits();

  // Generate the HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${copy.subheadline || `Experience ${brandName} - Premium Services`}">
  <title>${copy.headline ? copy.headline.replace(/\|brandName\|/g, brandName) : brandName}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script>
    tailwind.config = {
      theme: {
        extend: {
          colors: {
            primary: '${brandColors.primary}',
            accent: '${brandColors.accent}',
            brand: {
              light: '${brandColors.light}',
              dark: '${brandColors.dark}'
            }
          },
          fontFamily: {
            sans: ['Inter', 'system-ui', 'sans-serif'],
            display: ['Inter', 'system-ui', 'sans-serif']
          }
        }
      }
    }
  </script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
    
    body {
      font-family: 'Inter', sans-serif;
      ${isDark ? 'background: linear-gradient(135deg, #000000, #1a1a1a); color: #ffffff;' : 'background: #ffffff; color: #1e293b;'}
    }
    
    .section-bg {
      ${isDark ? 'background: #0a0a0a;' : 'background: #ffffff;'}
    }
    
    .hero-gradient {
      ${isDark 
        ? 'background: linear-gradient(135deg, #000000, #1a1a1a);' 
        : 'background: linear-gradient(135deg, ' + brandColors.primary + ' 0%, ' + brandColors.accent + ' 100%);'}
    }
    
    ${isDark ? `
    .luxury-gold { color: #d4af37; }
    .luxury-card { background: rgba(255,255,255,0.05); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); }
    .premium-cta { background: linear-gradient(135deg, #000, #333); color: white; border: 2px solid #fff; }
    .premium-cta:hover { background: linear-gradient(135deg, #333, #555); }
    ` : `
    .cta-primary { background: ${brandColors.primary}; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .cta-primary:hover { opacity: 0.9; transform: translateY(-1px); }
    .merchant-card { border: 1px solid #e2e8f0; transition: all 0.3s ease; }
    `}
    
    .brand-shadow { box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .stat-glow { ${isDark ? 'text-shadow: 0 0 20px rgba(212,175,55,0.5);' : ''} }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .fade-in-up {
      animation: fadeInUp 0.6s ease-out;
      opacity: 0;
    }
    
    @keyframes luxuryFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
    
    .float-animation {
      animation: luxuryFloat 4s ease-in-out infinite;
    }
    
    @keyframes spin-slow {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  </style>
</head>
<body class="antialiased">
  <!-- Navigation -->
  <nav class="${isDark ? 'bg-black/80' : 'bg-white/90'}/80 backdrop-blur-lg border-b ${isDark ? 'border-white/10' : 'border-gray-100'} py-4 px-6 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}">${brandName}</div>
      <div class="hidden md:flex space-x-8">
        ${config.navLinks.map(link => `<a href="#${link.toLowerCase()}" class="${isDark ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors">${link}</a>`).join('')}
      </div>
      <button class="${isDark ? 'premium-cta' : 'cta-primary'} px-6 py-2 rounded-lg font-semibold">
        ${copy.primaryCta || 'Get Started'}
      </button>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero-gradient min-h-screen flex items-center justify-center py-20 px-6 relative overflow-hidden">
    ${isDark ? `
    <div class="absolute inset-0 opacity-20">
      <div class="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-400 rounded-full blur-3xl"></div>
      <div class="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white rounded-full blur-3xl"></div>
    </div>
    ` : ''}
    
    <div class="max-w-6xl mx-auto text-center relative z-10">
      <div class="mb-8">
        <div class="inline-block px-6 py-3 ${isDark ? 'bg-black/30' : 'bg-blue-50'} backdrop-blur-lg rounded-full text-sm font-medium mb-6 border ${isDark ? 'border-white/20' : 'border-blue-100'}">
          <span class="${isDark ? 'luxury-gold' : 'text-blue-600'}">${config.headerTag}</span>
        </div>
        
        <h1 class="text-5xl md:text-7xl font-black mb-8 leading-tight ${isDark ? 'text-white' : 'text-gray-900'}">
          ${copy.headline || brandName}
          ${isDark ? '<br><span class="luxury-gold">Premium</span>' : ''}
        </h1>
        
        <p class="text-xl md:text-2xl mb-12 max-w-4xl mx-auto ${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed">
          ${copy.subheadline || `Experience premium services with ${brandName}. Professional, reliable, and tailored to your needs.`}
        </p>
      </div>
      
      <!-- Trust Indicators -->
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16 text-center">
        ${config.trustIndicators.map(t => `
        <div class="flex flex-col items-center">
          <div class="text-3xl mb-2">${t.emoji}</div>
          <div class="text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}">${t.title}</div>
          <div class="text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}">${t.subtitle}</div>
        </div>
        `).join('')}
      </div>
      
      <!-- Hero CTAs -->
      <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
        <button class="${isDark ? 'premium-cta' : 'cta-primary'} text-xl font-bold px-12 py-6 rounded-2xl shadow-2xl">
          ${copy.primaryCta || 'Get Started'}
        </button>
        <button class="${isDark ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-100 hover:bg-gray-200'} ${isDark ? 'text-white' : 'text-gray-900'} font-bold px-12 py-6 rounded-2xl text-xl backdrop-blur-sm border ${isDark ? 'border-white/20' : 'border-gray-200'} transition-all">
          ${copy.secondaryCta || 'Learn More'}
        </button>
      </div>
      
      <!-- Hero Visual Placeholder -->
      <div class="relative mt-8">
        <div class="${isDark ? 'bg-black/30' : 'bg-white/50'} backdrop-blur-sm rounded-2xl p-8 brand-shadow inline-block">
          <div class="text-8xl mb-4">${config.heroEmoji}</div>
          <div class="text-white font-semibold">${config.headerTag}</div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-16 px-6 ${isDark ? 'bg-gradient-to-r from-gray-900 to-black' : 'bg-gray-50'}">
    <div class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-3 gap-12 text-center">
        ${stats.map(s => `
        <div>
          <div class="text-5xl font-black ${isDark ? 'luxury-gold stat-glow' : 'text-gray-900'} mb-4">${s.value}</div>
          <div class="text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}">${s.label}</div>
          <div class="${isDark ? 'text-gray-400' : 'text-gray-600'}">${s.desc}</div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="section-bg py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-20">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}">
          Why Choose <span class="${isDark ? 'luxury-gold' : 'text-blue-600'}">${brandName}</span>
        </h2>
        <p class="text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto">
          Experience the difference with our premium services
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        ${benefits.map((b, i) => `
        <div class="${isDark ? 'luxury-card' : 'merchant-card bg-white'} p-8 rounded-2xl fade-in-up" style="animation-delay: ${i * 0.1}s">
          <div class="w-16 h-16 ${isDark ? 'bg-yellow-500/20' : 'bg-blue-100'} rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <span class="text-3xl">${b.emoji}</span>
          </div>
          <h3 class="text-xl font-bold mb-4 text-center ${isDark ? 'text-white' : 'text-gray-900'}">${b.title}</h3>
          <p class="${isDark ? 'text-gray-300' : 'text-gray-600'} text-center leading-relaxed">
            ${b.desc}
          </p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="${isDark ? 'section-bg' : 'bg-gray-50'} py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-20">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}">
          How It <span class="${isDark ? 'luxury-gold' : 'text-blue-600'}">Works</span>
        </h2>
        <p class="text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}">
          Four simple steps to get started
        </p>
      </div>
      
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        ${config.howItWorks.map(h => `
        <div class="text-center">
          <div class="w-16 h-16 ${isDark ? 'bg-yellow-500' : 'bg-blue-600'} rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold ${isDark ? 'text-black' : 'text-white'}">
            ${h.step}
          </div>
          <h3 class="text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}">${h.title}</h3>
          <p class="${isDark ? 'text-gray-300' : 'text-gray-600'}">${h.desc}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Safety/Feature Section -->
  <section class="py-24 px-6 ${isDark ? 'bg-gradient-to-r from-gray-800 to-gray-900' : 'bg-white'}">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}">
          Our <span class="${isDark ? 'luxury-gold' : 'text-blue-600'}">Commitment</span> to You
        </h2>
        <p class="text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'} max-w-3xl mx-auto">
          Your safety and satisfaction are our top priorities
        </p>
      </div>
      
      <div class="grid md:grid-cols-3 gap-12">
        ${config.safetyFeatures.map(s => `
        <div class="text-center">
          <div class="w-20 h-20 ${isDark ? 'bg-yellow-500/20' : 'bg-green-100'} rounded-full flex items-center justify-center mx-auto mb-6">
            <span class="text-3xl">✓</span>
          </div>
          <h3 class="text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}">${s.title}</h3>
          <p class="${isDark ? 'text-gray-300' : 'text-gray-600'} leading-relaxed">${s.desc}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section class="py-24 px-6 ${isDark ? 'bg-gradient-to-r from-black to-gray-900' : 'bg-gray-50'}">
    <div class="max-w-6xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-16 ${isDark ? 'text-white' : 'text-gray-900'}">
        What Our <span class="${isDark ? 'luxury-gold' : 'text-blue-600'}">Customers</span> Say
      </h2>
      
      <div class="grid md:grid-cols-2 gap-8">
        ${config.testimonials.map(t => `
        <div class="${isDark ? 'luxury-card' : 'bg-white'} p-8 rounded-2xl text-left">
          <div class="flex items-center mb-6">
            <div class="flex ${isDark ? 'text-yellow-400' : 'text-yellow-500'}">
              ★★★★★
            </div>
            <span class="ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}">5.0</span>
          </div>
          <p class="text-lg mb-6 italic ${isDark ? 'text-gray-300' : 'text-gray-700'}">
            "${t.quote}"
          </p>
          <div class="flex items-center">
            <div class="w-10 h-10 ${isDark ? 'bg-yellow-500' : 'bg-blue-600'} rounded-full flex items-center justify-center mr-3">
              <span class="${isDark ? 'text-black' : 'text-white'} font-bold">${t.name.charAt(0)}</span>
            </div>
            <div>
              <div class="font-semibold ${isDark ? 'text-white' : 'text-gray-900'}">${t.name}</div>
              <div class="text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}">${t.role}</div>
            </div>
          </div>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="section-bg py-24 px-6">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}">
          Frequently <span class="${isDark ? 'luxury-gold' : 'text-blue-600'}">Asked</span> Questions
        </h2>
        <p class="text-xl ${isDark ? 'text-gray-300' : 'text-gray-600'}">
          Everything you need to know
        </p>
      </div>
      
      <div class="space-y-6">
        ${config.faqs.map(f => `
        <div class="${isDark ? 'luxury-card' : 'bg-white border border-gray-200'} p-6 rounded-xl">
          <h3 class="text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}">${f.q}</h3>
          <p class="${isDark ? 'text-gray-300' : 'text-gray-600'}">${f.a}</p>
        </div>
        `).join('')}
      </div>
    </div>
  </section>

  <!-- Final CTA Section -->
  <section class="hero-gradient py-24 px-6">
    <div class="max-w-4xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-6 text-white">
        Ready to Get <span class="luxury-gold">Started</span>?
      </h2>
      <p class="text-xl text-white/90 mb-12 max-w-2xl mx-auto">
        Join thousands of satisfied customers and experience the difference with ${brandName}.
        Premium service, proven results, and dedicated support.
      </p>
      
      <div class="flex flex-col sm:flex-row gap-6 justify-center">
        <button class="bg-white text-gray-900 font-bold px-12 py-6 rounded-2xl text-xl shadow-2xl hover:bg-gray-100 transition-all">
          ${copy.primaryCta || 'Get Started'}
        </button>
        <button class="border-2 border-white/30 text-white font-bold px-12 py-6 rounded-2xl text-xl hover:bg-white/10 transition-all">
          ${copy.secondaryCta || 'Learn More'}
        </button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="${isDark ? 'bg-black' : 'bg-gray-900'} text-white py-16 px-6 border-t ${isDark ? 'border-white/10' : 'border-gray-800'}">
    <div class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div class="text-2xl font-bold mb-4">${brandName}</div>
          <p class="${isDark ? 'text-gray-400' : 'text-gray-400'}">Premium services you can trust.</p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Services</h4>
          <ul class="space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}">
            ${config.navLinks.slice(0, 3).map(link => `<li><a href="#" class="hover:text-white">${link}</a></li>`).join('')}
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Company</h4>
          <ul class="space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}">
            <li><a href="#" class="hover:text-white">About</a></li>
            <li><a href="#" class="hover:text-white">Careers</a></li>
            <li><a href="#" class="hover:text-white">Contact</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Support</h4>
          <ul class="space-y-2 ${isDark ? 'text-gray-400' : 'text-gray-400'}">
            <li><a href="#" class="hover:text-white">Help Center</a></li>
            <li><a href="#" class="hover:text-white">Privacy</a></li>
            <li><a href="#" class="hover:text-white">Terms</a></li>
          </ul>
        </div>
      </div>
      
      <div class="border-t ${isDark ? 'border-gray-800' : 'border-gray-800'} pt-8 flex flex-col md:flex-row justify-between items-center">
        <div class="text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'} mb-4 md:mb-0">
          © 2024 ${brandName}. All rights reserved.
        </div>
        <div class="flex gap-6 text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}">
          <a href="#" class="hover:text-white">Privacy</a>
          <a href="#" class="hover:text-white">Terms</a>
          <a href="#" class="hover:text-white">Accessibility</a>
        </div>
      </div>
    </div>
  </footer>

  <script>
    // Smooth animations and interactions
    document.addEventListener('DOMContentLoaded', function() {
      // Smooth scrolling for navigation
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
          e.preventDefault();
          const target = document.querySelector(this.getAttribute('href'));
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });
      
      // Intersection Observer for fade-in animations
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }
        });
      }, { threshold: 0.1 });
      
      // Observe all animated elements
      document.querySelectorAll('.fade-in-up').forEach(el => {
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
      });
      
      // CTA tracking
      document.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', function(e) {
          console.log('CTA clicked:', this.textContent.trim());
        });
      });
    });
  </script>
</body>
</html>`;
};// rebuilt at Tue Apr 14 09:30:56 IST 2026
