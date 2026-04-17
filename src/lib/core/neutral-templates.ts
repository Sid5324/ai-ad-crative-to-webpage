// src/lib/core/neutral-templates.ts - Template Neutrality System
import { BrandPersonality } from './config-manager';

export interface TemplateSlots {
  // Header/Meta
  page_title: string;
  meta_description: string;

  // Hero Section
  hero_title: string;
  hero_subtitle: string;
  hero_cta_primary: string;
  hero_cta_secondary: string;

  // Trust Indicators
  trust_items: Array<{
    emoji: string;
    title: string;
    subtitle: string;
  }>;

  // Benefits Section
  benefits_title: string;
  benefits_subtitle: string;
  benefits_items: Array<{
    emoji: string;
    title: string;
    description: string;
  }>;

  // How It Works
  how_it_works_title: string;
  how_it_works_steps: Array<{
    number: string;
    title: string;
    description: string;
  }>;

  // Testimonials
  testimonials_title: string;
  testimonials_items: Array<{
    name: string;
    role: string;
    quote: string;
    rating: number;
  }>;

  // Stats
  stats_items: Array<{
    value: string;
    label: string;
    description: string;
  }>;

  // FAQ
  faq_title: string;
  faq_items: Array<{
    question: string;
    answer: string;
  }>;

  // Footer
  footer_brand_description: string;
  footer_links: Array<{
    section: string;
    links: Array<{
      text: string;
      url: string;
    }>;
  }>;

  // Global
  brand_name: string;
  brand_colors: {
    primary: string;
    accent: string;
    light: string;
    dark: string;
  };
}

export class NeutralTemplateEngine {
  private templates: Map<string, string> = new Map();

  constructor() {
    this.initializeTemplates();
  }

  // Generate content for slots based on personality and context
  generateSlots(
    personality: BrandPersonality,
    brandName: string,
    context: any = {}
  ): TemplateSlots {
    const industry = context.industry || 'generic';
    const proofPoints = context.proofPoints || [];

    return {
      // Header/Meta
      page_title: this.generateTitle(brandName, personality),
      meta_description: this.generateMetaDescription(brandName, personality),

      // Hero Section
      hero_title: this.generateHeroTitle(brandName, personality, industry),
      hero_subtitle: this.generateHeroSubtitle(personality, proofPoints),
      hero_cta_primary: personality.cta.primary,
      hero_cta_secondary: personality.cta.secondary,

      // Trust Indicators
      trust_items: this.generateTrustIndicators(personality, industry),

      // Benefits
      benefits_title: `Why Choose ${brandName}`,
      benefits_subtitle: this.generateBenefitsSubtitle(personality),
      benefits_items: this.generateBenefits(personality, industry),

      // How It Works
      how_it_works_title: 'How It Works',
      how_it_works_steps: this.generateHowItWorksSteps(personality, industry),

      // Testimonials
      testimonials_title: 'What Our Customers Say',
      testimonials_items: this.generateTestimonials(personality),

      // Stats
      stats_items: this.generateStats(industry, proofPoints),

      // FAQ
      faq_title: 'Frequently Asked Questions',
      faq_items: this.generateFAQ(personality, industry),

      // Footer
      footer_brand_description: this.generateBrandDescription(personality),
      footer_links: this.generateFooterLinks(),

      // Global
      brand_name: brandName,
      brand_colors: {
        primary: personality.visual?.colors?.primary || '#1E293B',
        accent: personality.visual?.colors?.accent || '#3B82F6',
        light: '#FFFFFF',
        dark: '#000000'
      }
    };
  }

  // Render template with filled slots
  render(templateName: string, slots: TemplateSlots): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let rendered = template;

    // Replace simple slots
    Object.entries(slots).forEach(([key, value]) => {
      if (typeof value === 'string') {
        const placeholder = `{{${key}}}`;
        rendered = rendered.replace(new RegExp(placeholder, 'g'), value);
      }
    });

    // Handle complex slots (arrays/objects)
    rendered = this.renderComplexSlots(rendered, slots);

    return rendered;
  }

  private renderComplexSlots(template: string, slots: TemplateSlots): string {
    let result = template;

    // Trust indicators
    if (slots.trust_items) {
      const trustHtml = slots.trust_items.map(item => `
        <div class="flex flex-col items-center">
          <div class="text-3xl mb-2">${item.emoji}</div>
          <div class="text-lg font-semibold text-gray-900">${item.title}</div>
          <div class="text-sm text-gray-500">${item.subtitle}</div>
        </div>
      `).join('');
      result = result.replace('{{trust_indicators}}', trustHtml);
    }

    // Benefits
    if (slots.benefits_items) {
      const benefitsHtml = slots.benefits_items.map(item => `
        <div class="p-8 rounded-2xl bg-white shadow-lg">
          <div class="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mb-6 mx-auto">
            <span class="text-3xl">${item.emoji}</span>
          </div>
          <h3 class="text-xl font-bold mb-4 text-center text-gray-900">${item.title}</h3>
          <p class="text-gray-600 text-center leading-relaxed">${item.description}</p>
        </div>
      `).join('');
      result = result.replace('{{benefits_grid}}', benefitsHtml);
    }

    // How it works steps
    if (slots.how_it_works_steps) {
      const stepsHtml = slots.how_it_works_steps.map(step => `
        <div class="text-center">
          <div class="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-white">
            ${step.number}
          </div>
          <h3 class="text-xl font-bold mb-4 text-gray-900">${step.title}</h3>
          <p class="text-gray-600">${step.description}</p>
        </div>
      `).join('');
      result = result.replace('{{how_it_works_steps}}', stepsHtml);
    }

    // Testimonials
    if (slots.testimonials_items) {
      const testimonialsHtml = slots.testimonials_items.map(testimonial => `
        <div class="bg-white p-8 rounded-2xl shadow-lg text-left">
          <div class="flex items-center mb-6">
            <div class="flex text-yellow-400">
              ${'★'.repeat(testimonial.rating)}
            </div>
            <span class="ml-2 text-gray-500">${testimonial.rating}.0</span>
          </div>
          <p class="text-lg mb-6 italic text-gray-700">"${testimonial.quote}"</p>
          <div class="flex items-center">
            <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
              <span class="text-white font-bold">${testimonial.name.charAt(0)}</span>
            </div>
            <div>
              <div class="font-semibold text-gray-900">${testimonial.name}</div>
              <div class="text-sm text-gray-500">${testimonial.role}</div>
            </div>
          </div>
        </div>
      `).join('');
      result = result.replace('{{testimonials_grid}}', testimonialsHtml);
    }

    // Stats
    if (slots.stats_items) {
      const statsHtml = slots.stats_items.map(stat => `
        <div class="text-center">
          <div class="text-5xl font-black text-gray-900 mb-4">${stat.value}</div>
          <div class="text-xl font-semibold mb-2 text-gray-900">${stat.label}</div>
          <div class="text-gray-600">${stat.description}</div>
        </div>
      `).join('');
      result = result.replace('{{stats_grid}}', statsHtml);
    }

    // FAQ
    if (slots.faq_items) {
      const faqHtml = slots.faq_items.map(faq => `
        <div class="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 class="text-lg font-semibold mb-3 text-gray-900">${faq.question}</h3>
          <p class="text-gray-600">${faq.answer}</p>
        </div>
      `).join('');
      result = result.replace('{{faq_items}}', faqHtml);
    }

    return result;
  }

  private initializeTemplates(): void {
    // Main landing page template
    this.templates.set('landing-page', `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="{{meta_description}}">
  <title>{{page_title}}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: 'Inter', sans-serif; }
    .hero-gradient { background: linear-gradient(135deg, {{brand_colors.primary}}, {{brand_colors.accent}}); }
    .cta-primary { background: {{brand_colors.primary}}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; }
    .cta-secondary { background: transparent; color: {{brand_colors.primary}}; border: 2px solid {{brand_colors.primary}}; padding: 10px 22px; border-radius: 8px; text-decoration: none; display: inline-block; margin-left: 12px; }
  </style>
</head>
<body class="bg-gray-50">
  <!-- Navigation -->
  <nav class="bg-white/90 backdrop-blur-lg border-b border-gray-100 py-4 px-6 sticky top-0 z-50">
    <div class="max-w-7xl mx-auto flex justify-between items-center">
      <div class="text-2xl font-bold text-gray-900">{{brand_name}}</div>
      <div class="hidden md:flex space-x-8">
        <a href="#features" class="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
        <a href="#how-it-works" class="text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
        <a href="#testimonials" class="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
      </div>
      <a href="#" class="cta-primary font-semibold">{{hero_cta_primary}}</a>
    </div>
  </nav>

  <!-- Hero Section -->
  <section class="hero-gradient min-h-screen flex items-center justify-center py-20 px-6 relative overflow-hidden">
    <div class="max-w-6xl mx-auto text-center relative z-10">
      <h1 class="text-5xl md:text-7xl font-black mb-8 leading-tight text-white">{{hero_title}}</h1>
      <p class="text-xl md:text-2xl mb-12 max-w-4xl mx-auto text-white/90 leading-relaxed">{{hero_subtitle}}</p>

      <!-- Trust Indicators -->
      <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto mb-16 text-center">
        {{trust_indicators}}
      </div>

      <!-- Hero CTAs -->
      <div class="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
        <a href="#" class="cta-primary text-xl font-bold px-12 py-6 rounded-2xl shadow-2xl">{{hero_cta_primary}}</a>
        <a href="#" class="cta-secondary text-xl font-bold px-12 py-6 rounded-2xl">{{hero_cta_secondary}}</a>
      </div>
    </div>
  </section>

  <!-- Benefits Section -->
  <section class="py-24 px-6">
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-20">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{{benefits_title}}</h2>
        <p class="text-xl text-gray-600 max-w-3xl mx-auto">{{benefits_subtitle}}</p>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {{benefits_grid}}
      </div>
    </div>
  </section>

  <!-- How It Works Section -->
  <section class="bg-gray-50 py-24 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="text-center mb-20">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{{how_it_works_title}}</h2>
      </div>
      <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {{how_it_works_steps}}
      </div>
    </div>
  </section>

  <!-- Testimonials Section -->
  <section class="py-24 px-6">
    <div class="max-w-6xl mx-auto text-center">
      <h2 class="text-4xl md:text-5xl font-bold mb-16 text-gray-900">{{testimonials_title}}</h2>
      <div class="grid md:grid-cols-2 gap-8">
        {{testimonials_grid}}
      </div>
    </div>
  </section>

  <!-- Stats Section -->
  <section class="bg-gray-900 text-white py-16 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-3 gap-12 text-center">
        {{stats_grid}}
      </div>
    </div>
  </section>

  <!-- FAQ Section -->
  <section class="py-24 px-6">
    <div class="max-w-4xl mx-auto">
      <div class="text-center mb-16">
        <h2 class="text-4xl md:text-5xl font-bold mb-6 text-gray-900">{{faq_title}}</h2>
      </div>
      <div class="space-y-6">
        {{faq_items}}
      </div>
    </div>
  </section>

  <!-- Footer -->
  <footer class="bg-gray-900 text-white py-16 px-6">
    <div class="max-w-6xl mx-auto">
      <div class="grid md:grid-cols-4 gap-8 mb-12">
        <div>
          <div class="text-2xl font-bold mb-4">{{brand_name}}</div>
          <p class="text-gray-400">{{footer_brand_description}}</p>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Product</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white">Features</a></li>
            <li><a href="#" class="hover:text-white">Pricing</a></li>
            <li><a href="#" class="hover:text-white">Security</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Company</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white">About</a></li>
            <li><a href="#" class="hover:text-white">Blog</a></li>
            <li><a href="#" class="hover:text-white">Careers</a></li>
          </ul>
        </div>
        <div>
          <h4 class="font-semibold mb-4">Support</h4>
          <ul class="space-y-2 text-gray-400">
            <li><a href="#" class="hover:text-white">Help Center</a></li>
            <li><a href="#" class="hover:text-white">Contact</a></li>
            <li><a href="#" class="hover:text-white">Status</a></li>
          </ul>
        </div>
      </div>
      <div class="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
        <div class="text-sm text-gray-400 mb-4 md:mb-0">
          © 2024 {{brand_name}}. All rights reserved.
        </div>
      </div>
    </div>
  </footer>
</body>
</html>`.trim());
  }

  // Content generation methods
  private generateTitle(brandName: string, personality: BrandPersonality): string {
    const templates = {
      'fast': `${brandName} - Fast, Reliable Service`,
      'premium': `${brandName} - Premium Quality Solutions`,
      'reliable': `${brandName} - Trusted Service Provider`,
      'technical': `${brandName} - Advanced Technology Solutions`
    };
    return templates[personality.tone] || `${brandName} - Quality Services`;
  }

  private generateMetaDescription(brandName: string, personality: BrandPersonality): string {
    const templates = {
      'fast': `Experience fast, reliable service with ${brandName}. Quick solutions for your needs.`,
      'premium': `Discover premium quality solutions with ${brandName}. Exceptional service and results.`,
      'reliable': `Trust ${brandName} for reliable, dependable service. Proven solutions you can count on.`,
      'technical': `Advanced technical solutions from ${brandName}. Cutting-edge technology and expertise.`
    };
    return templates[personality.tone] || `Experience quality services with ${brandName}. Professional, reliable, and tailored to your needs.`;
  }

  private generateHeroTitle(brandName: string, personality: BrandPersonality, industry: string): string {
    const industryTitles = {
      'food_delivery': 'Fresh Food, Fast Delivery',
      'fintech': 'Your Financial Future Starts Here',
      'transportation': 'Reliable Transportation Solutions'
    };

    if (industryTitles[industry]) return industryTitles[industry];

    const toneTitles = {
      'fast': 'Fast, Reliable Solutions',
      'premium': 'Premium Quality Service',
      'reliable': 'Trusted Solutions You Can Depend On'
    };

    return toneTitles[personality.tone] || `${brandName} - Excellence in Service`;
  }

  private generateHeroSubtitle(personality: BrandPersonality, proofPoints: string[]): string {
    const proof = proofPoints.length > 0 ? proofPoints[0] : '';

    const templates = {
      'fast': proof ? `${proof} served quickly and efficiently` : 'Get what you need fast with our streamlined service',
      'premium': proof ? `Join ${proof} satisfied premium customers` : 'Experience premium quality and exceptional service',
      'reliable': proof ? `Trusted by ${proof} customers worldwide` : 'Dependable service you can trust for all your needs'
    };

    return templates[personality.tone] || 'Professional services tailored to your needs';
  }

  private generateTrustIndicators(personality: BrandPersonality, industry: string): Array<{emoji: string, title: string, subtitle: string}> {
    const indicators = {
      'food_delivery': [
        { emoji: '⚡', title: 'Fast Delivery', subtitle: 'Hot food in under 30 minutes' },
        { emoji: '🍽️', title: 'Wide Selection', subtitle: 'Thousands of restaurants' },
        { emoji: '📍', title: 'Live Tracking', subtitle: 'Track your order in real-time' }
      ],
      'fintech': [
        { emoji: '🔒', title: 'Bank-Level Security', subtitle: 'Your data is fully protected' },
        { emoji: '⚡', title: 'Instant Processing', subtitle: 'Fast and efficient transactions' },
        { emoji: '📱', title: 'Mobile Banking', subtitle: 'Manage your finances anywhere' }
      ],
      'default': [
        { emoji: '✓', title: 'Quality Service', subtitle: 'Professional and reliable' },
        { emoji: '⭐', title: 'Top Rated', subtitle: 'Highly rated by customers' },
        { emoji: '📞', title: '24/7 Support', subtitle: 'Always here to help' }
      ]
    };

    return indicators[industry] || indicators['default'];
  }

  private generateBenefitsSubtitle(personality: BrandPersonality): string {
    const subtitles = {
      'fast': 'Experience the speed and efficiency you deserve',
      'premium': 'Discover why premium quality matters',
      'reliable': 'See why customers choose us for dependable service'
    };

    return subtitles[personality.tone] || 'Experience the difference with our professional services';
  }

  private generateBenefits(personality: BrandPersonality, industry: string): Array<{emoji: string, title: string, description: string}> {
    const industryBenefits = {
      'food_delivery': [
        { emoji: '⚡', title: 'Lightning-Fast Delivery', description: 'Hot, fresh food delivered in under 30 minutes' },
        { emoji: '🍽️', title: 'Diverse Selection', description: 'Thousands of restaurants and cuisines to choose from' },
        { emoji: '📍', title: 'Live Tracking', description: 'Track your order from restaurant to doorstep' },
        { emoji: '🛡️', title: 'Contactless Delivery', description: 'Safe, hygienic delivery options available' }
      ],
      'fintech': [
        { emoji: '🔒', title: 'Advanced Security', description: 'Bank-level encryption and fraud protection' },
        { emoji: '⚡', title: 'Instant Transactions', description: 'Fast, secure money transfers and payments' },
        { emoji: '📊', title: 'Financial Insights', description: 'Track spending and manage your finances better' },
        { emoji: '🎯', title: 'Personalized Offers', description: 'Tailored financial products for your needs' }
      ]
    };

    if (industryBenefits[industry]) return industryBenefits[industry];

    // Default benefits based on personality
    return [
      { emoji: '✓', title: 'Quality Service', description: 'Professional service you can depend on' },
      { emoji: '🚀', title: 'Fast Results', description: 'Quick and efficient solutions' },
      { emoji: '💎', title: 'Premium Experience', description: 'Exceptional quality and attention to detail' },
      { emoji: '🤝', title: 'Expert Support', description: 'Dedicated team ready to help' }
    ];
  }

  private generateHowItWorksSteps(personality: BrandPersonality, industry: string): Array<{number: string, title: string, description: string}> {
    const industrySteps = {
      'food_delivery': [
        { number: '1', title: 'Browse Restaurants', description: 'Explore local restaurants and menus near you' },
        { number: '2', title: 'Place Your Order', description: 'Add items to cart and customize your order' },
        { number: '3', title: 'Track Delivery', description: 'Watch your order arrive in real-time' },
        { number: '4', title: 'Enjoy Your Meal', description: 'Hot, fresh food delivered to your door' }
      ]
    };

    if (industrySteps[industry]) return industrySteps[industry];

    // Default steps
    return [
      { number: '1', title: 'Get Started', description: 'Sign up or download the app to begin' },
      { number: '2', title: 'Choose Service', description: 'Select the service that fits your needs' },
      { number: '3', title: 'Set Details', description: 'Enter your requirements and preferences' },
      { number: '4', title: 'Get Results', description: 'Experience quality service and results' }
    ];
  }

  private generateTestimonials(personality: BrandPersonality): Array<{name: string, role: string, quote: string, rating: number}> {
    return [
      {
        name: 'Sarah Johnson',
        role: 'Regular Customer',
        quote: 'Excellent service that exceeded my expectations. Highly recommend!',
        rating: 5
      },
      {
        name: 'Michael Chen',
        role: 'Business Owner',
        quote: 'Professional, reliable, and great value. Our go-to service provider.',
        rating: 5
      }
    ];
  }

  private generateStats(industry: string, proofPoints: string[]): Array<{value: string, label: string, description: string}> {
    const industryStats = {
      'food_delivery': [
        { value: '100K+', label: 'Daily Orders', description: 'Delivered fresh daily' },
        { value: '10,000+', label: 'Partner Restaurants', description: 'Wide selection available' },
        { value: '25 min', label: 'Average Delivery', description: 'Fast and reliable' }
      ]
    };

    if (industryStats[industry]) return industryStats[industry];

    return [
      { value: '10K+', label: 'Happy Customers', description: 'Growing community' },
      { value: '15+', label: 'Years Experience', description: 'Industry expertise' },
      { value: '50+', label: 'Cities Served', description: 'Nationwide coverage' }
    ];
  }

  private generateFAQ(personality: BrandPersonality, industry: string): Array<{question: string, answer: string}> {
    const industryFAQ = {
      'food_delivery': [
        { question: 'How long does delivery take?', answer: 'Typically 25-40 minutes depending on distance and restaurant.' },
        { question: 'Is there a delivery fee?', answer: 'Fees vary by restaurant and distance. Check the app for details.' },
        { question: 'Can I tip my driver?', answer: 'Yes, you can add a tip in the app after delivery.' }
      ]
    };

    if (industryFAQ[industry]) return industryFAQ[industry];

    return [
      { question: 'How do I get started?', answer: 'Sign up online in minutes and start using our services immediately.' },
      { question: 'What are the costs?', answer: 'Transparent pricing with no hidden fees. Check our pricing page for details.' },
      { question: 'What support is available?', answer: '24/7 customer support through chat, email, and phone.' }
    ];
  }

  private generateBrandDescription(personality: BrandPersonality): string {
    const descriptions = {
      'fast': 'Fast, reliable service you can depend on',
      'premium': 'Premium quality solutions for discerning customers',
      'reliable': 'Trusted service provider with proven results'
    };

    return descriptions[personality.tone] || 'Quality services you can trust';
  }

  private generateFooterLinks(): Array<{section: string, links: Array<{text: string, url: string}>}> {
    return [
      {
        section: 'Product',
        links: [
          { text: 'Features', url: '#features' },
          { text: 'Pricing', url: '#pricing' },
          { text: 'Security', url: '#security' }
        ]
      },
      {
        section: 'Company',
        links: [
          { text: 'About', url: '#about' },
          { text: 'Blog', url: '#blog' },
          { text: 'Careers', url: '#careers' }
        ]
      },
      {
        section: 'Support',
        links: [
          { text: 'Help Center', url: '#help' },
          { text: 'Contact', url: '#contact' },
          { text: 'Status', url: '#status' }
        ]
      }
    ];
  }
}

// Global template engine instance
export const neutralTemplateEngine = new NeutralTemplateEngine();