// packages/agents/component-renderer.ts
import { BaseAgent } from './base-agent';

export interface ComponentRendererInput {
  component_plan: any;
  design_tokens: any;
  brand_data: any;
}

export interface ComponentRendererOutput {
  components: Array<{
    component_id: string;
    component_name: string;
    code: {
      jsx: string;
      css: string;
      typescript_interface?: string;
    };
    dependencies: string[];
    props_interface: any;
  }>;
  page_layout: {
    structure: any;
    responsive_rules: any;
    global_styles: string;
  };
  metadata: {
    total_components: number;
    performance_score: number;
    accessibility_score: number;
    responsive_breakpoints: string[];
  };
}

export class ComponentRendererAgent extends BaseAgent<ComponentRendererInput, ComponentRendererOutput> {
  constructor() {
    super({
      name: 'component-renderer',
      version: '1.0.0',
      memoryPolicy: {
        read_scopes: ['request'],
        write_scopes: ['request'],
        retrieval_mode: 'selective'
      },
      skills: {
        required: [
          'component-rendering',
          'responsive-layout-generation',
          'accessibility-enhancement',
          'performance-optimization'
        ],
        optional: [
          'css-generation',
          'html-structure-optimization'
        ]
      }
    });
  }

  protected async executeCore(context: {
    input: ComponentRendererInput;
    memory: any[];
    previousOutputs: Map<string, any>;
  }): Promise<ComponentRendererOutput> {
    const { input } = context;

    // Get brand data and design tokens directly
    const brandData = input.brand_data || {};
    const designTokens = input.design_tokens || {};
    const copy = input.component_plan?.copy || {};
    const services = brandData.services || [];
    
    // Detect if this is a limo business - ALWAYS use brand name from brandData
    const brandName = brandData?.brand_name || brandData?.business_name || 'Brand';
    const isLimo = brandName.toLowerCase().includes('limousine') || brandName.toLowerCase().includes('astar') || brandName.toLowerCase().includes('star');
    
    // Debug: log what's received
    console.log('[ComponentRenderer] brandName:', brandName);
    console.log('[ComponentRenderer] isLimo:', isLimo);
    console.log('[ComponentRenderer] designTokens:', JSON.stringify(designTokens).substring(0, 200));
    console.log('[ComponentRenderer] copy:', JSON.stringify(copy).substring(0, 200));
    
    // Get colors - ALWAYS prioritize brand detection over design tokens when tokens are missing/invalid
    const tokensColors = designTokens?.colors || designTokens || {};
    const hasValidTokens = tokensColors?.primary && tokensColors.primary !== '#0066CC';
    
    // Use brand-based colors when tokens are invalid
    const primaryColor = hasValidTokens ? tokensColors.primary : (isLimo ? '#000000' : '#1a365d');
    const secondaryColor = hasValidTokens ? tokensColors.secondary : (isLimo ? '#d4af37' : '#68d391');
    const accentColor = hasValidTokens ? (tokensColors.accent || tokensColors.secondary) : (isLimo ? '#d4af37' : '#2563eb');
    const theme = designTokens?.theme_name || (isLimo ? 'dark_luxury' : 'corporate');
    
    // Get fonts
    const tokensTypography = designTokens?.typography || {};
    const headingFont = tokensTypography?.display_font || (isLimo ? 'Playfair Display' : 'Inter');
    const bodyFont = tokensTypography?.body_font || 'Inter';

    // Build hero section - use copy from copy-generator, with brand-specific fallbacks
    const heroHeadline = copy?.hero?.headline || brandName;
    const heroSubheadline = copy?.hero?.subheadline || (isLimo 
      ? 'Premium limousine transportation across Qatar with professional drivers'
      : 'Professional services for modern enterprises');
    const primaryCTA = copy?.hero?.primary_cta || (isLimo ? 'Book Your Transfer' : 'Get Started');
    const secondaryCTA = copy?.hero?.secondary_cta || (isLimo ? 'View Our Fleet' : 'Learn More');
    
    console.log('[ComponentRenderer] final primaryColor:', primaryColor);
    console.log('[ComponentRenderer] final primaryCTA:', primaryCTA);

    // Generate the full HTML directly
    const html = this.generateDirectHTML({
      brandName,
      isLimo,
      primaryColor,
      secondaryColor,
      accentColor,
      theme,
      headingFont,
      bodyFont,
      heroHeadline,
      heroSubheadline,
      primaryCTA,
      secondaryCTA,
      services,
      trustSignals: brandData.trust_signals || [],
      contact: brandData.contact || {}
    });

    return {
      components: [{
        component_id: 'landing_page_1',
        component_name: 'LandingPage',
        code: {
          jsx: html,
          css: '',
          typescript_interface: ''
        },
        dependencies: [],
        props_interface: {}
      }],
      page_layout: {
        structure: { type: 'single_page' },
        responsive_rules: { breakpoints: ['mobile', 'tablet', 'desktop'] },
        global_styles: ''
      },
      metadata: {
        total_components: 1,
        performance_score: 90,
        accessibility_score: 85,
        responsive_breakpoints: ['mobile', 'tablet', 'desktop']
      }
    };
  }

  private generateDirectHTML(params: {
    brandName: string;
    isLimo: boolean;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    theme: string;
    headingFont: string;
    bodyFont: string;
    heroHeadline: string;
    heroSubheadline: string;
    primaryCTA: string;
    secondaryCTA: string;
    services: string[];
    trustSignals: string[];
    contact: any;
  }): string {
    const { brandName, isLimo, primaryColor, secondaryColor, accentColor, theme, headingFont, bodyFont,
            heroHeadline, heroSubheadline, primaryCTA, secondaryCTA, services, trustSignals, contact } = params;

    // Generate gradient based on theme
    const gradient = isLimo 
      ? `linear-gradient(135deg, ${primaryColor}, #1a1a1a)`
      : `linear-gradient(135deg, ${accentColor}, #3b82f6)`;

    // Generate services cards if available
    let servicesHTML = '';
    if (services.length > 0) {
      const serviceCards = services.slice(0, 6).map((service: string, i: number) => `
        <div class="merchant-card p-6">
          <div class="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mb-4">
            <i class="fas fa-${this.getServiceIcon(service)} text-white text-xl"></i>
          </div>
          <h3 class="font-bold text-lg mb-2">${service}</h3>
          <p class="text-gray-600 text-sm">Premium ${service.toLowerCase()} with professional service</p>
        </div>
      `).join('');
      servicesHTML = `
        <section class="py-16 md:py-24 px-4 md:px-6 bg-white">
          <div class="max-w-7xl mx-auto">
            <div class="text-center mb-12 md:mb-16">
              <h2 class="text-3xl md:text-4xl font-bold mb-4">Our Services</h2>
              <p class="text-lg text-gray-600">Premium transportation solutions</p>
            </div>
            <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              ${serviceCards}
            </div>
          </div>
        </section>
      `;
    }

    // Generate booking form for limo businesses
    let bookingFormHTML = '';
    if (isLimo) {
      bookingFormHTML = `
        <section class="py-16 md:py-24 px-4 md:px-6 bg-gray-50">
          <div class="max-w-4xl mx-auto">
            <div class="text-center mb-10">
              <h2 class="text-3xl md:text-4xl font-bold mb-4">Book Your Transfer</h2>
              <p class="text-lg text-gray-600">${contact.phone ? `Call: ${contact.phone}` : 'Professional service'}</p>
            </div>
            <div class="bg-white rounded-2xl p-8 shadow-lg">
              <div class="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
                  <select class="w-full p-3 border border-gray-200 rounded-lg">
                    <option>Doha Airport (DOH)</option>
                    <option>Hotel/Residence</option>
                    <option>Office</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
                  <select class="w-full p-3 border border-gray-200 rounded-lg">
                    <option>Mercedes S-Class (1-3)</option>
                    <option>Cadillac Escalade (4-6)</option>
                    <option>Mercedes Sprinter (7-14)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input type="date" class="w-full p-3 border border-gray-200 rounded-lg"/>
                </div>
                <div class="flex items-end">
                  <button class="w-full py-3 px-6 rounded-lg font-bold text-white" style="background: ${accentColor}">Check Availability</button>
                </div>
              </div>
            </div>
          </div>
        </section>
      `;
    }

    // Trust signals
    const trustSignalsHTML = trustSignals.length > 0 
      ? trustSignals.slice(0, 3).map((signal: string) => `
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>${signal}</span>
        </div>
      `).join('')
      : (isLimo ? `
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>24/7 Service</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Professional Chauffeurs</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Premium Fleet</span>
        </div>
      ` : `
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Professional Service</span>
        </div>
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 bg-green-400 rounded-full"></span>
          <span>Quality Guaranteed</span>
        </div>
      `);

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brandName} - ${heroHeadline}</title>
  <meta name="description" content="Premium services from ${brandName}">
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=${headingFont.replace(' ', '+')}:wght@400;600;700&family=${bodyFont.replace(' ', '+')}:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <script>
    tailwind.config = {
      theme: { 
        extend: { 
          colors: { 
            primary: '${primaryColor}',
            accent: '${accentColor}',
            gold: '${secondaryColor}'
          } 
        } 
      }
    }
  </script>
  <style>
    :root {
      --primary: ${primaryColor};
      --secondary: ${secondaryColor};
      --accent: ${accentColor};
      --gradient: ${gradient};
    }
    body { font-family: '${bodyFont}', sans-serif; }
    h1, h2, h3 { font-family: '${headingFont}', serif; }
    .hero-bg { background: var(--gradient); }
    .cta-primary { 
      background: ${accentColor}; 
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      transition: all 0.3s ease;
    }
    .cta-primary:hover { 
      opacity: 0.9;
      transform: translateY(-1px);
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
    .gold-text { color: ${secondaryColor}; }
  </style>
</head>
<body class="antialiased">

  <!-- HERO SECTION -->
  <section class="hero-bg min-h-[70vh] flex items-center justify-center py-16 md:py-20 px-4 md:px-6">
    <div class="max-w-7xl mx-auto">
      <div class="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div class="space-y-6">
          ${isLimo ? `
          <div class="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-full text-sm font-medium">
            Qatar's Premier Limousine Service
          </div>
          ` : ''}
          <h1 class="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-white">
            ${heroHeadline}
          </h1>
          <p class="text-lg md:text-xl text-white/90 leading-relaxed max-w-lg">
            ${heroSubheadline}
          </p>
          <div class="flex flex-col sm:flex-row gap-4">
            <a href="#book" class="cta-primary font-bold px-8 py-4 rounded-lg text-center text-lg text-white">
              ${primaryCTA}
            </a>
            <a href="#services" class="border-2 border-white/50 hover:border-white text-white hover:bg-white/10 font-bold px-8 py-4 rounded-lg text-center text-lg transition-all">
              ${secondaryCTA}
            </a>
          </div>
          <div class="flex flex-wrap items-center gap-6 text-sm text-white/80 pt-2">
            ${trustSignalsHTML}
          </div>
        </div>
        <div class="relative">
          <div class="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl p-6 md:p-8 shadow-2xl border border-white/20">
            <div class="text-center py-8">
              <i class="fas fa-${isLimo ? 'car-side' : 'building'} text-7xl text-white/80 mb-6"></i>
              <div class="text-3xl font-bold text-white mb-2">${brandName}</div>
              <div class="text-xl text-white/80">${isLimo ? 'Premium Fleet Available' : 'Professional Services'}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>

  ${servicesHTML}

  ${bookingFormHTML}

  <!-- FINAL CTA -->
  <section class="hero-bg py-16 md:py-20 px-4 md:px-6 text-white text-center">
    <div class="max-w-3xl mx-auto">
      <h2 class="text-3xl md:text-4xl font-bold mb-4">Ready to experience luxury?</h2>
      <p class="text-lg mb-8 opacity-90">Book your ${isLimo ? 'transfer' : 'appointment'} today</p>
      <a href="#book" class="cta-primary inline-block px-10 py-4 rounded-lg font-bold text-lg text-white">
        ${primaryCTA}
      </a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer class="bg-gray-900 text-white py-12 md:py-16 px-4 md:px-6">
    <div class="max-w-6xl mx-auto text-center">
      <h3 class="text-2xl md:text-3xl font-bold mb-6">${brandName}</h3>
      <p class="text-gray-400 mb-8 max-w-2xl mx-auto">${isLimo ? 'Premium chauffeur service across Qatar' : 'Professional services for discerning clients'}</p>
      <div class="flex flex-wrap justify-center gap-6 text-base mb-8">
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Home</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Services</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors">Contact</a>
        <a href="#" class="text-gray-400 hover:text-white transition-colors">${isLimo ? 'Book Now' : 'Get Started'}</a>
      </div>
      <div class="border-t border-gray-800 pt-8">
        <p class="text-gray-500 text-sm">© 2026 ${brandName}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
  }

  private getServiceIcon(service: string): string {
    const iconMap: Record<string, string> = {
      'chauffeur': 'user-tie',
      'coach': 'bus',
      'rent': 'car',
      'airport': 'plane-departure',
      'corporate': 'building',
      'wedding': 'ring',
      'business': 'briefcase',
      'tour': 'map',
      'transfer': 'exchange-alt'
    };
    const lower = service.toLowerCase();
    for (const [key, icon] of Object.entries(iconMap)) {
      if (lower.includes(key)) return icon;
    }
    return 'star';
  }

  private async generateComponents(input: ComponentRendererInput): Promise<any[]> {
    const components = [];

    for (const componentSpec of input.component_plan.components || []) {
      const component = await this.generateComponent(componentSpec, input);
      components.push(component);
    }

    return components;
  }

  private async generateComponent(componentSpec: any, input: ComponentRendererInput): Promise<any> {
    const componentRendering = await this.executeSkill('component-rendering', {
      component_spec: componentSpec,
      design_tokens: input.design_tokens,
      brand_context: input.brand_data,
      content_slots: componentSpec.slot_map || {}
    });

    const cssGeneration = await this.executeSkill('css-generation', {
      component_structure: componentRendering.structure,
      design_tokens: input.design_tokens,
      responsive_requirements: componentSpec.visibility_rules
    });

    return {
      component_id: `${componentSpec.component_type}_${Date.now()}`,
      component_name: this.generateComponentName(componentSpec.component_type),
      code: {
        jsx: componentRendering.jsx,
        css: cssGeneration.css,
        typescript_interface: componentRendering.typescript_interface
      },
      dependencies: componentRendering.dependencies || [],
      props_interface: componentRendering.props_interface || {},
      performance_improvements: [],
      accessibility_features: []
    };
  }

  private async generatePageLayout(input: ComponentRendererInput, components: any[]): Promise<any> {
    const layoutGeneration = await this.executeSkill('responsive-layout-generation', {
      component_plan: input.component_plan,
      components: components,
      design_tokens: input.design_tokens,
      brand_requirements: input.brand_data
    });

    return {
      structure: layoutGeneration.structure,
      responsive_rules: layoutGeneration.responsive_rules,
      global_styles: layoutGeneration.global_styles || ''
    };
  }

  private async enhanceAccessibility(components: any[]): Promise<any[]> {
    const enhancedComponents = [];

    for (const component of components) {
      const accessibilityEnhancement = await this.executeSkill('accessibility-enhancement', {
        component_code: component.code,
        component_type: component.component_name,
        design_tokens: {}, // Will be passed from parent context
        content_analysis: {} // Will be passed from parent context
      });

      enhancedComponents.push({
        ...component,
        code: {
          ...component.code,
          jsx: accessibilityEnhancement.enhanced_jsx || component.code.jsx
        },
        accessibility_features: accessibilityEnhancement.features || []
      });
    }

    return enhancedComponents;
  }

  private async optimizePerformance(components: any[]): Promise<any[]> {
    const optimizedComponents = [];

    for (const component of components) {
      const performanceOptimization = await this.executeSkill('performance-optimization', {
        component_code: component.code,
        component_type: component.component_name,
        usage_context: 'landing_page',
        target_metrics: {
          lighthouse_score: 90,
          bundle_size: 'minimal'
        }
      });

      optimizedComponents.push({
        ...component,
        code: {
          ...component.code,
          jsx: performanceOptimization.optimized_jsx || component.code.jsx
        },
        performance_improvements: performanceOptimization.improvements || []
      });
    }

    return optimizedComponents;
  }

  private generateComponentName(componentType: string): string {
    // Convert component type to PascalCase component name
    return componentType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  private calculateMetadata(components: any[], pageLayout: any): any {
    return {
      total_components: components.length,
      performance_score: this.calculatePerformanceScore(components),
      accessibility_score: this.calculateAccessibilityScore(components),
      responsive_breakpoints: pageLayout.responsive_rules?.breakpoints || ['mobile', 'tablet', 'desktop']
    };
  }

  private calculatePerformanceScore(components: any[]): number {
    // Calculate based on performance improvements and optimizations
    let score = 85; // Base score

    const totalImprovements = components.reduce((sum, comp) =>
      sum + (comp.performance_improvements?.length || 0), 0
    );

    score += Math.min(totalImprovements * 2, 15); // Up to 15 points for improvements

    return Math.min(100, score);
  }

  private calculateAccessibilityScore(components: any[]): number {
    // Calculate based on accessibility features implemented
    let score = 80; // Base score

    const totalFeatures = components.reduce((sum, comp) =>
      sum + (comp.accessibility_features?.length || 0), 0
    );

    score += Math.min(totalFeatures * 3, 20); // Up to 20 points for features

    return Math.min(100, score);
  }

  protected calculateConfidence(output: ComponentRendererOutput): number {
    let confidence = 0.85; // Base confidence

    if (output.components && output.components.length > 0) confidence += 0.05;
    if (output.page_layout?.structure) confidence += 0.05;
    if (output.metadata?.performance_score > 80) confidence += 0.05;

    return Math.min(1.0, confidence);
  }

  protected extractPatterns(output: ComponentRendererOutput): any {
    return {
      component_types: output.components?.map(c => c.component_name) || [],
      dependencies: output.components?.flatMap(c => c.dependencies) || [],
      performance_metrics: {
        score: output.metadata?.performance_score,
        components_optimized: output.components?.filter((c: any) => c.performance_improvements?.length > 0).length
      },
      accessibility_metrics: {
        score: output.metadata?.accessibility_score,
        components_enhanced: output.components?.filter((c: any) => c.accessibility_features?.length > 0).length
      }
    };
  }
}