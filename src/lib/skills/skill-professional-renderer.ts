// src/lib/skills/skill-professional-renderer.ts - Professional HTML Renderer
// Generates high-quality, branded, visually appealing landing pages

export const generateProfessionalHTML = (spec: {
  brandName: string;
  brandColors: { primary: string; accent: string; light: string; dark: string };
  copy: any;
  category: string;
}): string => {
  const { brandName, brandColors, copy, category } = spec;

  // Generate beautiful, branded HTML
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${copy.subheadline || `Experience ${brandName}`}">
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
    body {
      background: linear-gradient(135deg, ${brandColors.light} 0%, #f8fafc 100%);
    }
    .hero-gradient {
      background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%);
    }
    .brand-shadow {
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    }
    .btn-brand {
      background: linear-gradient(135deg, ${brandColors.primary}, ${brandColors.accent});
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      transition: transform 0.2s ease;
    }
    .btn-brand:hover {
      transform: translateY(-2px);
    }
  </style>
</head>
<body class="min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white/80 backdrop-blur-sm border-b border-gray-100 sticky top-0 z-50">
    <div class="max-w-6xl mx-auto px-6 py-4">
      <div class="flex justify-between items-center">
        <div class="text-2xl font-bold text-gray-900">${brandName}</div>
        <div class="hidden md:flex space-x-8">
          <a href="#features" class="text-gray-600 hover:text-red-500 transition-colors">Features</a>
          <a href="#about" class="text-gray-600 hover:text-red-500 transition-colors">About</a>
          <a href="#contact" class="text-gray-600 hover:text-red-500 transition-colors">Contact</a>
        </div>
        <button class="btn-brand">${copy.primaryCta || 'Get Started'}</button>
      </div>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero-gradient text-white py-20" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%);">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div class="text-sm font-semibold text-white/80 uppercase tracking-wide mb-4">
            ${copy.eyebrow || 'Welcome to the Future'}
          </div>
          <h1 class="text-4xl lg:text-6xl font-bold leading-tight mb-6">
            ${copy.headline || `Experience ${brandName}`}
          </h1>
          <p class="text-xl text-white/90 mb-8 leading-relaxed">
            ${copy.subheadline || 'Professional services tailored to your needs.'}
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <button class="btn-brand text-lg">${copy.primaryCta || 'Get Started'}</button>
            <button class="border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
              ${copy.secondaryCta || 'Learn More'}
            </button>
          </div>
        </div>
        <div class="lg:text-right">
          <div class="bg-white/10 backdrop-blur-sm rounded-2xl p-8 brand-shadow">
            <div class="space-y-6">
              <div class="w-full h-64 bg-gradient-to-br from-white/20 to-white/10 rounded-lg flex items-center justify-center border border-white/20">
                <div class="text-center">
                  <div class="text-6xl mb-4">${category === 'food_delivery' ? '🍕' : category === 'transportation' ? '🚗' : category === 'travel' ? '✈️' : '⭐'}</div>
                  <div class="text-white font-semibold">${category === 'transportation' ? 'Luxury Transportation' : category === 'travel' ? 'Premium Travel' : 'Premium Experience'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="py-20 bg-white">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Trusted by Thousands</h2>
        <p class="text-xl text-gray-600">Join our growing community of satisfied customers</p>
      </div>
      <div class="grid md:grid-cols-3 gap-8">
        ${copy.stats?.map((stat: any, index: number) => `
        <div class="text-center">
          <div class="text-4xl font-bold text-red-500 mb-2">${stat.value || ['10K+', '500+', '4.9★'][index]}</div>
          <div class="text-lg text-gray-600">${stat.label || ['Happy Customers', 'Projects Completed', 'Average Rating'][index]}</div>
        </div>
        `).join('') || `
        <div class="text-center">
          <div class="text-4xl font-bold text-red-500 mb-2">10K+</div>
          <div class="text-lg text-gray-600">Happy Customers</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-red-500 mb-2">500+</div>
          <div class="text-lg text-gray-600">Projects Completed</div>
        </div>
        <div class="text-center">
          <div class="text-4xl font-bold text-red-500 mb-2">4.9★</div>
          <div class="text-lg text-gray-600">Average Rating</div>
        </div>
        `}
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="py-20 bg-gray-50">
    <div class="max-w-6xl mx-auto px-6">
      <div class="text-center mb-16">
        <h2 class="text-3xl font-bold text-gray-900 mb-4">Why Choose ${brandName}?</h2>
        <p class="text-xl text-gray-600">Experience the difference that sets us apart</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        ${copy.benefits?.map((benefit: any, index: number) => `
        <div class="bg-white rounded-xl p-8 brand-shadow">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-6">
            <span class="text-white text-xl">${['✓', '🚀', '💎'][index % 3]}</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">${benefit.title || ['Premium Quality', 'Expert Team', 'Customer First'][index]}</h3>
          <p class="text-gray-600 leading-relaxed">${benefit.description || ['We deliver exceptional quality in everything we do.', 'Our experienced professionals are here to help.', 'Your satisfaction is our top priority.'][index]}</p>
        </div>
        `).join('') || `
        <div class="bg-white rounded-xl p-8 brand-shadow">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-6">
            <span class="text-white text-xl">✓</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Premium Quality</h3>
          <p class="text-gray-600 leading-relaxed">We deliver exceptional quality in everything we do.</p>
        </div>
        <div class="bg-white rounded-xl p-8 brand-shadow">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-6">
            <span class="text-white text-xl">🚀</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Expert Team</h3>
          <p class="text-gray-600 leading-relaxed">Our experienced professionals are here to help.</p>
        </div>
        <div class="bg-white rounded-xl p-8 brand-shadow">
          <div class="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-lg flex items-center justify-center mb-6">
            <span class="text-white text-xl">💎</span>
          </div>
          <h3 class="text-xl font-semibold text-gray-900 mb-4">Customer First</h3>
          <p class="text-gray-600 leading-relaxed">Your satisfaction is our top priority.</p>
        </div>
        `}
      </div>
    </div>
  </section>

  <!-- CTA Section -->
  <section class="py-20 text-white" style="background: linear-gradient(135deg, ${brandColors.primary} 0%, ${brandColors.accent} 100%);">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-3xl font-bold mb-6">Ready to Get Started?</h2>
      <p class="text-xl mb-8 text-white/90">Join thousands of satisfied customers today</p>
      <div class="flex flex-col sm:flex-row gap-4 justify-center">
        <button class="btn-brand text-lg">${copy.primaryCta || 'Get Started'}</button>
        <button class="border-2 border-white/30 text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition-colors">
          ${copy.secondaryCta || 'Learn More'}
        </button>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <div class="text-2xl font-bold mb-4">${brandName}</div>
          <p class="text-gray-400">Professional services you can trust.</p>
        </div>
        <div>
          <h3 class="font-semibold mb-4">Services</h3>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">Premium Service</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Expert Support</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Quality Guarantee</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-4">Company</h3>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">About Us</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Careers</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Contact</a></li>
          </ul>
        </div>
        <div>
          <h3 class="font-semibold mb-4">Connect</h3>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white transition-colors">LinkedIn</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Twitter</a></li>
            <li><a href="#" class="hover:text-white transition-colors">Facebook</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 text-center text-gray-400">
        <p>&copy; 2024 ${brandName}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
};