import type { PreviewRecord } from '@/lib/schemas/preview';

function safeString(val: any, fallback: string): string {
  return typeof val === 'string' && val.length > 0 ? val : fallback;
}

function safeArray(val: any): any[] {
  return Array.isArray(val) ? val : [];
}

export function renderPersonalizedPage(config: PreviewRecord): string {
  const spec = config?.spec || {};
  
  const brand = safeString(spec.brand, 'Your Business');
  const hero = spec?.hero || {};
  const headline = safeString(hero.headline, 'Welcome to Our Service');
  const subheadline = safeString(hero.subheadline, 'Discover premium services tailored just for you');
  const primaryCTA = hero?.primaryCTA || { label: 'Get Started', href: '#' };
  const secondaryCTA = hero?.secondaryCTA || { label: 'Learn More', href: '#' };
  const ctaLabel = safeString(primaryCTA?.label, 'Get Started');
  const ctaHref = safeString(primaryCTA?.href, '#');
  const secCtaLabel = safeString(secondaryCTA?.label, 'Learn More');
  const secCtaHref = safeString(secondaryCTA?.href, '#');
  
  const stats = safeArray(spec?.stats);
  const sections = safeArray(spec?.sections);
  const faq = safeArray(spec?.faq);
  const closingCTA = spec?.closingCTA || {};
  
  // Build stats HTML with actual data
  const statsHtml = stats.length > 0 ? stats.map((s: any) => `
    <div class="text-center">
      <div class="text-4xl font-bold text-blue-600">${s.value || '0'}</div>
      <div class="text-sm text-gray-500 mt-1">${s.label || ''}</div>
    </div>
  `).join('') : `
    <div class="text-center">
      <div class="text-4xl font-bold text-blue-600">500+</div>
      <div class="text-sm text-gray-500 mt-1">Happy Customers</div>
    </div>
    <div class="text-center">
      <div class="text-4xl font-bold text-blue-600">98%</div>
      <div class="text-sm text-gray-500 mt-1">Satisfaction</div>
    </div>
    <div class="text-center">
      <div class="text-4xl font-bold text-blue-600">24/7</div>
      <div class="text-sm text-gray-500 mt-1">Support</div>
    </div>
  `;
  
  // Build sections HTML
  const sectionsHtml = sections.length > 0 ? sections.map((s: any) => `
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">${s.title || ''}</h2>
        <div class="grid md:grid-cols-3 gap-8">
          ${(s.items || []).map((item: any) => `
            <div class="text-center">
              <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 class="text-xl font-semibold text-gray-900 mb-2">${item.title || ''}</h3>
              <p class="text-gray-600">${item.body || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  `).join('') : `
    <section class="py-20 bg-white">
      <div class="max-w-6xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Why Choose Us</h2>
        <div class="grid md:grid-cols-3 gap-8">
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Professional Service</h3>
            <p class="text-gray-600">We deliver exceptional quality in everything we do.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">Quick Response</h3>
            <p class="text-gray-600">We value your time and respond promptly.</p>
          </div>
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.172l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path>
              </svg>
            </div>
            <h3 class="text-xl font-semibold text-gray-900 mb-2">24/7 Support</h3>
            <p class="text-gray-600">We are here for you anytime, day or night.</p>
          </div>
        </div>
      </div>
    </section>
  `;
  
  // Build FAQ HTML
  const faqHtml = faq.length > 0 ? `
    <section class="py-20 bg-gray-50">
      <div class="max-w-3xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
        <div class="space-y-4">
          ${faq.map((f: any) => `
            <div class="bg-white p-6 rounded-lg shadow-sm">
              <h3 class="font-semibold text-gray-900 mb-2">${f.question || ''}</h3>
              <p class="text-gray-600">${f.answer || ''}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </section>
  ` : `
    <section class="py-20 bg-gray-50">
      <div class="max-w-3xl mx-auto px-6">
        <h2 class="text-3xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
        <div class="space-y-4">
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="font-semibold text-gray-900 mb-2">How do I get started?</h3>
            <p class="text-gray-600">Simply click the button above and follow the prompts. It only takes a few minutes.</p>
          </div>
          <div class="bg-white p-6 rounded-lg shadow-sm">
            <h3 class="font-semibold text-gray-900 mb-2">What if I have questions?</h3>
            <p class="text-gray-600">Our support team is available 24/7 to help you with any inquiries.</p>
          </div>
        </div>
      </div>
    </section>
  `;

  // Closing CTA
  const closingHeadline = safeString(closingCTA.headline, 'Ready to Get Started?');
  const closingBody = safeString(closingCTA.body, 'Join thousands of satisfied customers today.');
  const closingPrimary = closingCTA.primaryCTA || { label: 'Start Now', href: '#' };
  const closingSecondary = closingCTA.secondaryCTA || { label: 'Contact Us', href: '#' };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Inter', sans-serif; }
    .hero-gradient { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); }
  </style>
</head>
<body class="bg-white">
  <!-- Hero Section -->
  <header class="hero-gradient text-white py-24">
    <div class="max-w-6xl mx-auto px-6 text-center">
      <h1 class="text-5xl font-bold mb-6">${headline}</h1>
      <p class="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">${subheadline}</p>
      <div class="flex justify-center gap-4">
        <a href="${ctaHref}" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition">
          ${ctaLabel}
        </a>
        <a href="${secCtaHref}" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition">
          ${secCtaLabel}
        </a>
      </div>
    </div>
  </header>

  <!-- Stats Section -->
  <section class="py-16 bg-gray-50">
    <div class="max-w-6xl mx-auto px-6">
      <div class="grid md:grid-cols-3 gap-8">
        ${statsHtml}
      </div>
    </div>
  </section>

  <!-- Content Sections -->
  ${sectionsHtml}

  <!-- FAQ Section -->
  ${faqHtml}

  <!-- Closing CTA -->
  <section class="hero-gradient text-white py-20">
    <div class="max-w-4xl mx-auto px-6 text-center">
      <h2 class="text-4xl font-bold mb-4">${closingHeadline}</h2>
      <p class="text-xl text-blue-100 mb-8">${closingBody}</p>
      <div class="flex justify-center gap-4">
        <a href="${closingPrimary.href || '#'}" class="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transition">
          ${closingPrimary.label || 'Get Started'}
        </a>
        <a href="${closingSecondary.href || '#'}" class="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold text-lg hover:bg-white/10 transition">
          ${closingSecondary.label || 'Learn More'}
        </a>
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-12">
    <div class="max-w-6xl mx-auto px-6 text-center">
      <p class="text-gray-400">© 2024 ${brand}. All rights reserved.</p>
    </div>
  </footer>
</body>
</html>`;
}