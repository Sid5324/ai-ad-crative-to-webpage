// src/lib/skills/skill-brand-prompts.ts - Expanded Brand-Specific Prompts
// Comprehensive brand handling to prevent generic copy generation

interface BrandPrompt {
  brandVoice: string;
  forbiddenPhrases: string[];
  requiredTone: string;
  primaryCta: string;
  secondaryCta: string;
  instructions: string;
  examples: string[];
  categoryInstructions?: Record<string, string>;
}

// Brand prompts by brand name (normalized)
const BRAND_PROMPTS: Record<string, BrandPrompt> = {
  // ===== FINTECH =====
  'cred': {
    brandVoice: 'Premium, exclusive, sophisticated',
    forbiddenPhrases: ['get started', 'sign up', 'join now', 'learn more'],
    requiredTone: 'Exclusive and premium',
    primaryCta: 'Apply Now',
    secondaryCta: 'Explore Benefits',
    instructions: 'Use premium language. Never use "Get Started" - use "Apply Now" or "Request Access". Emphasize exclusivity, wealth building, and financial sophistication.',
    examples: ['Wealth Building, Simplified.', 'Your Financial Future, Secured.', 'For the Financially Ambitious.']
  },
  'stripe': {
    brandVoice: 'Technical, precise, developer-focused',
    forbiddenPhrases: ['get started', 'sign up', 'join now'],
    requiredTone: 'Technical and reliable',
    primaryCta: 'Start Building',
    secondaryCta: 'View Documentation',
    instructions: 'Use technical language. Emphasize ease of integration, reliability, and developer experience.',
    examples: ['Payments for developers.', 'Build faster with Stripe.']
  },
  'paypal': {
    brandVoice: 'Trustworthy, simple, global',
    forbiddenPhrases: ['get started'],
    requiredTone: 'Friendly and trustworthy',
    primaryCta: 'Sign Up',
    secondaryCta: 'How It Works',
    instructions: 'Use friendly, accessible language. Emphasize trust, security, and global reach.',
    examples: ['Pay globally. Trade locally.', 'The safer way to pay.']
  },
  'coinbase': {
    brandVoice: 'Innovative, trustworthy, future-focused',
    forbiddenPhrases: ['get started', 'sign up'],
    requiredTone: 'Professional and forward-thinking',
    primaryCta: 'Start Trading',
    secondaryCta: 'Learn More',
    instructions: 'Use professional language. Emphasize security, innovation, and future of finance.',
    examples: ['Crypto made simple.', 'The future of money.']
  },

  // ===== FOOD DELIVERY =====
  'doordash': {
    brandVoice: 'Appetizing, convenient, local-focused',
    forbiddenPhrases: ['apply now', 'sign up', 'request access'],
    requiredTone: 'Appetizing and convenient',
    primaryCta: 'Order Now',
    secondaryCta: 'Browse Restaurants',
    instructions: 'Use appetizing, convenience-focused language. Never use corporate language like "Apply Now".',
    examples: ['What you crave, delivered.', 'Food at your doorstep.']
  },
  'ubereats': {
    brandVoice: 'Quick, convenient, global',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Quick and convenient',
    primaryCta: 'Order Now',
    secondaryCta: 'See Restaurants',
    instructions: 'Use quick, convenient language. Emphasize speed and variety.',
    examples: ['Good food, delivered fast.', 'Your favorites, delivered.']
  },

  // ===== TRANSPORTATION =====
  'uber': {
    brandVoice: 'Modern, reliable, global',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Modern and reliable',
    primaryCta: 'Get a Ride',
    secondaryCta: 'How It Works',
    instructions: 'Use modern, reliable language. Emphasize convenience and reliability.',
    examples: ['Go anywhere. Get anything.', 'Your ride, on demand.']
  },
  'lyft': {
    brandVoice: 'Friendly, social, community-focused',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Friendly and welcoming',
    primaryCta: 'Ride with Lyft',
    secondaryCta: 'Learn More',
    instructions: 'Use friendly, community-focused language. Emphasize friendliness and social impact.',
    examples: ['We’re helping each other get there.', 'Rides that lift you up.']
  },

  // ===== E-COMMERCE =====
  'amazon': {
    brandVoice: 'Convenient, value-focused, vast selection',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Value and convenience',
    primaryCta: 'Shop Now',
    secondaryCta: 'Learn More',
    instructions: 'Use convenience and value-focused language. Emphasize selection and speed.',
    examples: ['Much more than shopping.', 'Delivered in minutes.']
  },
  'shopify': {
    brandVoice: 'Empowering, entrepreneurial, accessible',
    forbiddenPhrases: ['get started'],
    requiredTone: 'Empowering and entrepreneurial',
    primaryCta: 'Start Free Trial',
    secondaryCta: 'Learn More',
    instructions: 'Use empowering language. Emphasize ease of building a business.',
    examples: ['Commerce for anyone, anywhere.', 'Build your business online.']
  },

  // ===== SAAS =====
  'slack': {
    brandVoice: 'Collaborative, friendly, productive',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Friendly and productive',
    primaryCta: 'Try Free',
    secondaryCta: 'See How It Works',
    instructions: 'Use collaborative, friendly language. Emphasize teamwork and productivity.',
    examples: ['Where work happens.', 'Slack is the collaboration hub.']
  },
  'zoom': {
    brandVoice: 'Reliable, simple, connected',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Simple and reliable',
    primaryCta: 'Sign Up Free',
    secondaryCta: 'Learn More',
    instructions: 'Use simple, reliable language. Emphasize video communication ease.',
    examples: ['A meetings that just work.', 'Connect anywhere.']
  },
  'notion': {
    brandVoice: 'Flexible, creative, all-in-one',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Flexible and creative',
    primaryCta: 'Try Notion Free',
    secondaryCta: 'Explore',
    instructions: 'Use flexible, all-in-one language. Emphasize workspace customization.',
    examples: ['All-in-one workspace.', 'Your second brain.']
  },
  'figma': {
    brandVoice: 'Creative, collaborative, intuitive',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Creative and intuitive',
    primaryCta: 'Try Figma for Free',
    secondaryCta: 'See Features',
    instructions: 'Use creative, intuitive language. Emphasize design collaboration.',
    examples: ['Design and build together.', 'The collaborative interface design tool.']
  },
  'canva': {
    brandVoice: 'Creative, accessible, empowering',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Creative and accessible',
    primaryCta: 'Design for Free',
    secondaryCta: 'Explore Templates',
    instructions: 'Use creative, accessible language. Emphasize design for everyone.',
    examples: ['Design anything. Publish anywhere.', 'Create beautiful designs with ease.']
  },

  // ===== TRAVEL =====
  'airbnb': {
    brandVoice: 'Belonging, unique, experiential',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Warm and experiential',
    primaryCta: 'Explore Homes',
    secondaryCta: 'Become a Host',
    instructions: 'Use warm, experiential language. Emphasize belonging and unique experiences.',
    examples: ['Belong anywhere.', 'Feel at home, anywhere you go.']
  },
  'booking': {
    brandVoice: 'Convenient, reliable, best value',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Convenient and value-focused',
    primaryCta: 'Find Places',
    secondaryCta: 'Learn More',
    instructions: 'Use convenient language. Emphasize variety and value.',
    examples: ['Your trip starts here.', 'Book with confidence.']
  },

  // ===== ENTERTAINMENT =====
  'netflix': {
    brandVoice: 'Entertaining, immersive, unlimited',
    forbiddenPhrases: ['apply now', 'sign up', 'start trial'],
    requiredTone: 'Entertaining and immersive',
    primaryCta: 'Watch Now',
    secondaryCta: 'Learn More',
    instructions: 'Use entertaining language. Emphasize unlimited content and quality.',
    examples: ['Unlimited entertainment.', 'Watch anywhere. Cancel anytime.']
  },
  'spotify': {
    brandVoice: 'Musical, personal, unlimited',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Musical and personal',
    primaryCta: 'Play Now',
    secondaryCta: 'Learn More',
    instructions: 'Use musical language. Emphasize personalization and variety.',
    examples: ['Music for everyone.', 'Soundtrack your life.']
  },

  // ===== HEALTH =====
  'headspace': {
    brandVoice: 'Calm, mindful, accessible',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Calm and mindful',
    primaryCta: 'Start Free Trial',
    secondaryCta: 'Learn More',
    instructions: 'Use calm, mindful language. Emphasize mental wellness and accessibility.',
    examples: ['Take a deep breath.', 'Your mind is your sanctuary.']
  },
  'peloton': {
    brandVoice: 'Motivating, premium, results-focused',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Motivating and premium',
    primaryCta: 'Start Free Trial',
    secondaryCta: 'Explore Classes',
    instructions: 'Use motivating language. Emphasize premium experience and results.',
    examples: ['If you\'re not out of breath, you\'re not doing it right.', 'Fitness that moves you.']
  },

  // ===== EDUCATION =====
  'udemy': {
    brandVoice: 'Learning-focused, accessible, practical',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Practical and accessible',
    primaryCta: 'Start Learning',
    secondaryCta: 'Browse Courses',
    instructions: 'Use practical language. Emphasize skill-building and variety.',
    examples: ['Learn anything.', 'Unlock your potential.']
  },
  'coursera': {
    brandVoice: 'Academic, credible, career-focused',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Academic and professional',
    primaryCta: 'Enroll Free',
    secondaryCta: 'Explore Degrees',
    instructions: 'Use academic language. Emphasize credibility and career advancement.',
    examples: ['Learn without limits.', 'Degrees that set you apart.']
  },

  // ===== SOCIAL =====
  'linkedin': {
    brandVoice: 'Professional, career-focused, network-oriented',
    forbiddenPhrases: ['get started'],
    requiredTone: 'Professional and career-focused',
    primaryCta: 'Join Now',
    secondaryCta: 'Learn More',
    instructions: 'Use professional language. Emphasize career growth and networking.',
    examples: ['Welcome to your professional community.', 'Connect with opportunity.']
  },
  'instagram': {
    brandVoice: 'Visual, creative, community-focused',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Visual and creative',
    primaryCta: 'Sign Up',
    secondaryCta: 'Learn More',
    instructions: 'Use visual language. Emphasize creativity and community.',
    examples: ['Create. Share. Inspire.', 'What will you share?']
  },
  'tiktok': {
    brandVoice: 'Fun, creative, youthful',
    forbiddenPhrases: ['apply now', 'sign up', 'start trial'],
    requiredTone: 'Fun and creative',
    primaryCta: 'Join Now',
    secondaryCta: 'Learn More',
    instructions: 'Use fun, trending language. Emphasize creativity and entertainment.',
    examples: ['Make your day.', 'Discover your creativity.']
  },

  // ===== REAL ESTATE =====
  'zillow': {
    brandVoice: 'Helpful, data-driven, intuitive',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Helpful and data-driven',
    primaryCta: 'Browse Homes',
    secondaryCta: 'Learn More',
    instructions: 'Use helpful language. Emphasize data and search ease.',
    examples: ['Find your place.', 'Your home search starts here.']
  },
  'redfin': {
    brandVoice: 'Tech-forward, efficient, transparent',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Tech-forward and efficient',
    primaryCta: 'Find Your Home',
    secondaryCta: 'How It Works',
    instructions: 'Use tech-forward language. Emphasize efficiency and transparency.',
    examples: ['Sell smarter.', 'Real estate, reimagined.']
  },

  // ===== AUTOMOTIVE =====
  'tesla': {
    brandVoice: 'Innovative, sustainable, premium',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Innovative and premium',
    primaryCta: 'Order Now',
    secondaryCta: 'Explore',
    instructions: 'Use innovative language. Emphasize sustainability and technology.',
    examples: ['Accelerating the world\'s transition to sustainable energy.', 'The future is electric.']
  },
  'carvana': {
    brandVoice: 'Convenient, modern, transparent',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Convenient and modern',
    primaryCta: 'Shop Cars',
    secondaryCta: 'Learn More',
    instructions: 'Use convenient language. Emphasize easy buying experience.',
    examples: ['Car buying made easy.', 'Drive happy.']
  }
};

// Category prompts for brands not in the specific list
const CATEGORY_PROMPTS: Record<string, BrandPrompt> = {
  'fintech': {
    brandVoice: 'Premium, trustworthy',
    forbiddenPhrases: ['get started', 'sign up', 'join now'],
    requiredTone: 'Premium',
    primaryCta: 'Apply Now',
    secondaryCta: 'Learn More',
    instructions: 'Use premium, trustworthy language. Emphasize security and returns.',
    examples: ['Your financial future, secured.', 'Wealth made simple.']
  },
  'food_delivery': {
    brandVoice: 'Appetizing, convenient',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Appetizing',
    primaryCta: 'Order Now',
    secondaryCta: 'Browse',
    instructions: 'Use appetizing language. Never use corporate language.',
    examples: ['What you crave, delivered.', 'Food at your door.']
  },
  'saas': {
    brandVoice: 'Technical, productive',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Technical',
    primaryCta: 'Start Free Trial',
    secondaryCta: 'View Demo',
    instructions: 'Use technical, productive language. Emphasize value.',
    examples: ['Work smarter.', 'Build better.']
  },
  'ecommerce': {
    brandVoice: 'Value-focused, exciting',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Value',
    primaryCta: 'Shop Now',
    secondaryCta: 'Browse',
    instructions: 'Use value-focused language. Emphasize deals and variety.',
    examples: ['Shop the best.', 'Discover deals.']
  },
  'travel': {
    brandVoice: 'Experiential, warm',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Experiential',
    primaryCta: 'Book Now',
    secondaryCta: 'Explore',
    instructions: 'Use experiential language. Emphasize adventure and comfort.',
    examples: ['Your adventure awaits.', 'Make memories.']
  },
  'healthcare': {
    brandVoice: 'Caring, professional',
    forbiddenPhrases: ['apply now', 'sign up'],
    requiredTone: 'Caring',
    primaryCta: 'Book Appointment',
    secondaryCta: 'Learn More',
    instructions: 'Use caring language. Emphasize health and wellness.',
    examples: ['Your health, our priority.', 'Care you can trust.']
  },
  'luxury_transportation': {
    brandVoice: 'Premium, exclusive',
    forbiddenPhrases: ['get started'],
    requiredTone: 'Luxurious',
    primaryCta: 'Book Your Ride',
    secondaryCta: 'View Fleet',
    instructions: 'Use premium language. Emphasize luxury and exclusivity.',
    examples: ['Travel in style.', 'Experience true luxury.']
  },
  'dental': {
    brandVoice: 'Caring, professional',
    forbiddenPhrases: ['get started'],
    requiredTone: 'Caring',
    primaryCta: 'Book Appointment',
    secondaryCta: 'Explore Services',
    instructions: 'Use caring language. Emphasize smiles and comfort.',
    examples: ['Your smile, our priority.', ' dentistry with a smile.']
  },
  'legal': {
    brandVoice: 'Professional, trusted',
    forbiddenPhrases: ['get started'],
    requiredTone: 'Professional',
    primaryCta: 'Consultation',
    secondaryCta: 'Learn More',
    instructions: 'Use professional language. Emphasize trust and results.',
    examples: ['Justice served.', 'Legal help when you need it.']
  },
  'education': {
    brandVoice: 'Empowering, accessible',
    forbiddenPhrases: ['apply now'],
    requiredTone: 'Empowering',
    primaryCta: 'Enroll Now',
    secondaryCta: 'Browse Courses',
    instructions: 'Use empowering language. Emphasize growth.',
    examples: ['Learn and grow.', 'Unlock your potential.']
  }
};

// Get brand-specific prompt instructions
export const getBrandPrompt = (brandName: string, category?: string): BrandPrompt => {
  if (!brandName) {
    return CATEGORY_PROMPTS[category || 'other'] || getDefaultPrompt();
  }
  
  const brandLower = brandName.toLowerCase();
  
  // Check exact brand matches first
  for (const [brand, prompt] of Object.entries(BRAND_PROMPTS)) {
    if (brandLower.includes(brand)) {
      return prompt;
    }
  }
  
  // Fall back to category
  if (category && CATEGORY_PROMPTS[category]) {
    return CATEGORY_PROMPTS[category];
  }
  
  return getDefaultPrompt();
};

// Get default prompt for unknown brands
export const getDefaultPrompt = (): BrandPrompt => ({
  brandVoice: 'Professional, modern',
  forbiddenPhrases: ['get started', 'learn more'], // Minimal forbidden
  requiredTone: 'Professional',
  primaryCta: 'Get Started',
  secondaryCta: 'Learn More',
  instructions: 'Use professional, modern language. Be specific, not generic.',
  examples: ['Welcome.', 'Discover what we offer.']
});

// Generate prompt additions for LLM
export const generateBrandInstructions = (brandName: string, category: string): string => {
  const prompt = getBrandPrompt(brandName, category);
  let instructions = `\n\nBRAND REQUIREMENTS:\n`;
  instructions += `- Brand voice: ${prompt.brandVoice}\n`;
  instructions += `- Tone: ${prompt.requiredTone}\n`;
  instructions += `- Primary CTA: "${prompt.primaryCta}" (NEVER use: ${prompt.forbiddenPhrases.join(', ')})\n`;
  instructions += `- Secondary CTA: "${prompt.secondaryCta}"\n`;
  instructions += `- Instructions: ${prompt.instructions}\n`;
  
  if (prompt.examples?.length) {
    instructions += `\nExample headlines: ${prompt.examples.join(' | ')}`;
  }
  
  return instructions;
};

// Check if CTA is brand-appropriate
export const isValidCta = (cta: string, brandName: string, category: string): boolean => {
  const prompt = getBrandPrompt(brandName, category);
  const ctaLower = cta.toLowerCase();
  
  // Check forbidden phrases
  for (const forbidden of prompt.forbiddenPhrases) {
    if (ctaLower.includes(forbidden.toLowerCase())) {
      return false;
    }
  }
  
  return true;
};

export default {
  BRAND_PROMPTS,
  CATEGORY_PROMPTS,
  getBrandPrompt,
  getDefaultPrompt,
  generateBrandInstructions,
  isValidCta
};