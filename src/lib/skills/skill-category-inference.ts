// src/lib/skills/skill-category-inference.ts - Enhanced Category Inference
// Sophisticated category detection from URLs based on patterns

// Category patterns organized by industry
const CATEGORY_PATTERNS: Record<string, { patterns: string[]; keywords: string[]; evidence: string }> = {
  // ===== FINANCE & FINTECH =====
  'fintech': {
    patterns: [
      'stripe', 'paypal', 'cred', 'razorpay', 'cashfree', 'paytm', 'phonepe',
      'upi', 'gpay', 'paytm', 'mobikwik', 'freecharge', 'ache',
      'chime', 'current', 'varom', 'revolut', 'monzo', 'wise',
      'coinbase', 'binance', 'kraken', 'crypto', 'nexo', 'blockfi'
    ],
    keywords: ['payment', 'lend', 'credit', 'loan', 'invest', 'crypto', 'wallet', 'bank', 'finance'],
    evidence: 'Financial services, payments, lending, investing'
  },
  'banking': {
    patterns: ['chase', 'bankofamerica', 'wellsfargo', 'citi', 'capitalone', 'discover'],
    keywords: ['bank', 'checking', 'savings', 'account', 'deposit'],
    evidence: 'Traditional banking'
  },
  'insurance': {
    patterns: ['policy', 'cover', 'insure', 'geico', 'progressive', 'allstate', 'statefarm'],
    keywords: ['insurance', 'cover', 'policy', 'premium', 'claim'],
    evidence: 'Insurance products'
  },

  // ===== FOOD & DELIVERY =====
  'food_delivery': {
    patterns: ['doordash', 'ubereats', 'grubhub', 'postmates', 'deliveroo', 'just-eat', 'zomato', 'swiggy'],
    keywords: ['food', 'delivery', 'eat', 'restaurant', 'order', 'meal', 'cuisine'],
    evidence: 'Food delivery platforms'
  },
  'grocery': {
    patterns: ['instacart', 'gopuff', 'getir', 'jokr', 'gorillas'],
    keywords: ['grocery', 'supermarket', 'food', 'fresh', 'produce'],
    evidence: 'Grocery delivery'
  },

  // ===== TRANSPORTATION =====
  'transportation': {
    patterns: ['uber', 'lyft', 'taxi', 'bolt', 'careem', 'ola'],
    keywords: ['ride', 'taxi', 'cab', 'transport', 'driver', 'trip'],
    evidence: 'Ride-hailing services'
  },
  'luxury_transportation': {
    patterns: ['limousine', 'limo', 'chauffeur', 'premium-car', 'executive-car', 'black-car', 'aston', 'royal-car'],
    keywords: ['limousine', 'luxury', 'chauffeur', 'premium', 'executive', 'VIP', 'airport'],
    evidence: 'Luxury transportation services'
  },
  'automotive': {
    patterns: ['cars', 'auto', 'vehicle', 'dealer', 'carvana', 'vroom', 'carmax'],
    keywords: ['car', 'auto', 'vehicle', 'buy', 'sell', 'lease'],
    evidence: 'Automotive sales'
  },

  // ===== E-COMMERCE =====
  'ecommerce': {
    patterns: ['shop', 'store', 'amazon', 'ebay', 'etsy', 'walmart', 'target', 'bestbuy'],
    keywords: ['shop', 'buy', 'product', 'sale', 'discount', 'offer'],
    evidence: 'E-commerce platforms'
  },
  'fashion': {
    patterns: ['fashion', 'clothing', 'apparel', 'zara', 'hm', 'nike', 'adidas', 'uniqlo'],
    keywords: ['fashion', 'clothing', 'wear', 'apparel', 'shoes', 'style'],
    evidence: 'Fashion retail'
  },
  'beauty': {
    patterns: ['sephora', 'ulta', '丝芙兰', 'beauty'],
    keywords: ['beauty', 'cosmetics', 'makeup', 'skincare', 'beauty'],
    evidence: 'Beauty products'
  },

  // ===== SAAS & TECH =====
  'saas': {
    patterns: ['app', 'cloud', 'saas', 'software', 'platform', 'hubspot', 'salesforce', 'slack', 'zoom', 'notion', 'figma', 'canva'],
    keywords: ['software', 'platform', 'tool', 'solution', 'enterprise', 'team'],
    evidence: 'SaaS/Software platforms'
  },
  'developer_tools': {
    patterns: ['github', 'gitlab', 'bitbucket', 'vercel', 'netlify', 'heroku', 'digitalocean'],
    keywords: ['developer', 'code', 'git', 'deploy', 'cloud'],
    evidence: 'Developer tools'
  },

  // ===== HEALTHCARE =====
  'healthcare': {
    patterns: ['health', 'care', 'clinic', 'doctor', 'medical', 'cvs', 'walgreens'],
    keywords: ['health', 'medical', 'doctor', 'care', 'clinic', 'hospital'],
    evidence: 'Healthcare services'
  },
  'dental': {
    patterns: ['dental', 'dentist', 'tooth', 'orthodont', 'smilecare', 'braces'],
    keywords: ['dental', 'dentist', 'tooth', 'braces', 'invisalign', 'cleaning'],
    evidence: 'Dental services'
  },
  'fitness': {
    patterns: ['fitness', 'gym', 'peloton', 'crossfit', 'yoga'],
    keywords: ['fitness', 'gym', 'workout', 'exercise', 'train'],
    evidence: 'Fitness & wellness'
  },
  'teletherapy': {
    patterns: ['therapy', 'mental', 'headspace', 'calm', 'betterhelp'],
    keywords: ['therapy', 'mental', 'health', 'counseling', 'wellness'],
    evidence: 'Mental health services'
  },

  // ===== EDUCATION =====
  'education': {
    patterns: ['course', 'learn', 'udemy', 'coursera', 'edx', 'skillshare'],
    keywords: ['course', 'learn', 'education', 'tutorial', 'class'],
    evidence: 'Online education'
  },

  // ===== REAL ESTATE =====
  'real_estate': {
    patterns: ['zillow', 'realtor', 'redfin', 'trulia', 'apartment', 'rent'],
    keywords: ['real estate', 'property', 'home', 'rent', 'buy', 'apartment'],
    evidence: 'Real estate platforms'
  },

  // ===== LEGAL =====
  'legal': {
    patterns: ['law', 'legal', 'attorney', 'lawyer', 'avvo', 'justia'],
    keywords: ['legal', 'lawyer', 'attorney', 'court', ' lawsuit', 'divorce'],
    evidence: 'Legal services'
  },

  // ===== TRAVEL =====
  'travel': {
    patterns: ['airbnb', 'booking', 'expedia', 'hotels', 'tripadvisor', 'vrbo'],
    keywords: ['travel', 'hotel', 'booking', 'vacation', 'rent', 'stay'],
    evidence: 'Travel & hospitality'
  },

  // ===== ENTERTAINMENT =====
  'streaming': {
    patterns: ['netflix', 'spotify', 'hulu', 'disney', 'hbo', 'youtube'],
    keywords: ['stream', 'watch', 'movie', 'show', 'music', 'video'],
    evidence: 'Streaming entertainment'
  },
  'gaming': {
    patterns: ['steam', 'epicgames', 'roblox', 'xbox', 'playstation', 'nintendo'],
    keywords: ['game', 'gaming', 'play', 'gamer', 'video game'],
    evidence: 'Gaming platforms'
  },

  // ===== SOCIAL =====
  'social': {
    patterns: ['facebook', 'instagram', 'twitter', 'tiktok', 'linkedin', 'snapchat', 'pinterest'],
    keywords: ['social', 'connect', 'share', 'post', 'follow'],
    evidence: 'Social media'
  },

  // ===== FOOD & BEVERAGE =====
  'food_brand': {
    patterns: ['starbucks', 'dunkin', 'mcdonalds', 'subway', 'chipotle', 'pizza'],
    keywords: ['coffee', 'food', 'drink', 'restaurant', 'cafe'],
    evidence: 'Food & beverage brands'
  }
};

// Infer category from URL with sophisticated pattern matching
export const inferCategory = (url: string): {
  category: string;
  subcategory: string;
  evidence: string[];
  confidence: number;
} => {
  try {
    const hostname = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    const path = url.toLowerCase();
    const full = hostname + path;
    
    let bestMatch = { category: 'other', subcategory: '', evidence: [] as string[], score: 0 };
    
    // Check each category
    for (const [catName, catData] of Object.entries(CATEGORY_PATTERNS)) {
      let matches: string[] = [];
      
      // Check hostname patterns
      const patterns = (catData as any).patterns || (catData as any).policies || [];
      for (const pattern of patterns) {
        if (hostname.includes(pattern.toLowerCase())) {
          matches.push(`hostname:${pattern}`);
        }
      }
      
      // Check keywords
      const keywords = catData.keywords || [];
      for (const keyword of keywords) {
        if (full.includes(keyword.toLowerCase())) {
          matches.push(`keyword:${keyword}`);
        }
      }
      
      // Score this category
      const score = matches.length;
      if (score > bestMatch.score) {
        bestMatch = {
          category: catName,
          subcategory: catData.evidence || '',
          evidence: matches,
          score
        };
      }
    }
    
    // Calculate confidence
    let confidence = 0.3;
    if (bestMatch.score >= 3) confidence = 0.9;
    else if (bestMatch.score >= 2) confidence = 0.7;
    else if (bestMatch.score >= 1) confidence = 0.5;
    
    return {
      category: bestMatch.category,
      subcategory: bestMatch.subcategory,
      evidence: bestMatch.evidence,
      confidence
    };
  } catch {
    return {
      category: 'other',
      subcategory: 'unknown',
      evidence: ['parse_error'],
      confidence: 0.2
    };
  }
};

// Get category-specific narrative style
export const getCategoryNarrative = (category: string): {
  narrativeStyle: string;
  layoutMode: string;
  conversionPath: { primary: string; secondary: string };
} => {
  const narratives: Record<string, any> = {
    'fintech': {
      narrativeStyle: 'trust-heavy-fintech',
      layoutMode: 'split-hero',
      conversionPath: { primary: 'Apply Now', secondary: 'Learn More' }
    },
    'banking': {
      narrativeStyle: 'trust-heavy-fintech',
      layoutMode: 'split-hero',
      conversionPath: { primary: 'Open Account', secondary: 'Explore' }
    },
    'food_delivery': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'hero-centered',
      conversionPath: { primary: 'Order Now', secondary: 'View Menu' }
    },
    'transportation': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'hero-centered',
      conversionPath: { primary: 'Get a Ride', secondary: 'Learn More' }
    },
    'ecommerce': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'hero-centered',
      conversionPath: { primary: 'Shop Now', secondary: 'Browse' }
    },
    'fashion': {
      narrativeStyle: 'luxury-experience',
      layoutMode: 'centered-hero',
      conversionPath: { primary: 'Shop Now', secondary: 'Explore' }
    },
    'saas': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'split-hero',
      conversionPath: { primary: 'Start Free Trial', secondary: 'Learn More' }
    },
    'developer_tools': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'split-hero',
      conversionPath: { primary: 'Get Started Free', secondary: 'View Docs' }
    },
    'healthcare': {
      narrativeStyle: 'trust-heavy-fintech',
      layoutMode: 'split-hero',
      conversionPath: { primary: 'Book Appointment', secondary: 'Learn More' }
    },
    'fitness': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'centered-hero',
      conversionPath: { primary: 'Start Free Trial', secondary: 'Learn More' }
    },
    'education': {
      narrativeStyle: 'editorial-premium',
      layoutMode: 'centered-hero',
      conversionPath: { primary: 'Enroll Now', secondary: 'Browse Courses' }
    },
    'real_estate': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'split-hero',
      conversionPath: { primary: 'Find Your Home', secondary: 'Browse' }
    },
    'travel': {
      narrativeStyle: 'luxury-experience',
      layoutMode: 'dark-premium',
      conversionPath: { primary: 'Book Now', secondary: 'Explore' }
    },
    'streaming': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'dark-premium',
      conversionPath: { primary: 'Start Watching', secondary: 'Learn More' }
    },
    'gaming': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'dark-premium',
      conversionPath: { primary: 'Play Now', secondary: 'Learn More' }
    },
    'social': {
      narrativeStyle: 'product-benefit',
      layoutMode: 'hero-centered',
      conversionPath: { primary: 'Join Now', secondary: 'Learn More' }
    }
  };
  
  return narratives[category] || {
    narrativeStyle: 'product-benefit',
    layoutMode: 'centered-hero',
    conversionPath: { primary: 'Get Started', secondary: 'Learn More' }
  };
};

// Get brand-specific color theme
export const getCategoryColors = (category: string, brandName?: string): {
  primary: string;
  secondary: string;
  accent: string;
  light: string;
  dark: string;
} => {
  const colorSchemes: Record<string, any> = {
    'fintech': { primary: '#1E3A5F', accent: '#00D4AA', secondary: '#FFFFFF', light: '#F0F9FF', dark: '#0A2540' },
    'banking': { primary: '#CC0000', accent: '#FFD700', secondary: '#FFFFFF', light: '#FFF5F5', dark: '#8B0000' },
    'food_delivery': { primary: '#FF3008', accent: '#FF4D4D', secondary: '#FFFFFF', light: '#FFF5F5', dark: '#CC2600' },
    'transportation': { primary: '#000000', accent: '#00C2C2', secondary: '#FFFFFF', light: '#F5F5F5', dark: '#1A1A1A' },
    'luxury_transportation': { primary: '#1A1A1A', accent: '#D4AF37', secondary: '#FFFFFF', light: '#F5F5F5', dark: '#0D0D0D' },
    'ecommerce': { primary: '#FF9900', accent: '#FF6600', secondary: '#FFFFFF', light: '#FFF8F0', dark: '#CC7A00' },
    'fashion': { primary: '#000000', accent: '#FF4040', secondary: '#FFFFFF', light: '#FAFAFA', dark: '#1A1A1A' },
    'saas': { primary: '#635BFF', accent: '#00D4AA', secondary: '#FFFFFF', light: '#F5F5FF', dark: '#0A2540' },
    'developer_tools': { primary: '#0D0D0D', accent: '#00D4AA', secondary: '#1A1A1A', light: '#F5F5F5', dark: '#000000' },
    'healthcare': { primary: '#0088CC', accent: '#00CC88', secondary: '#FFFFFF', light: '#F0F9FF', dark: '#006699' },
    'dental': { primary: '#00A3CC', accent: '#00E5CC', secondary: '#FFFFFF', light: '#F0FCFC', dark: '#007799' },
    'fitness': { primary: '#FF4500', accent: '#FFD700', secondary: '#1A1A1A', light: '#FFF5F0', dark: '#1A1A1A' },
    'education': { primary: '#6B46C1', accent: '#F6AD55', secondary: '#FFFFFF', light: '#FAF5FF', dark: '#553C9A' },
    'real_estate': { primary: '#2D3748', accent: '#38B2AC', secondary: '#FFFFFF', light: '#F7FAFC', dark: '#1A202C' },
    'legal': { primary: '#1A365D', accent: '#D69E2E', secondary: '#FFFFFF', light: '#F7FAFC', dark: '#0D2340' },
    'travel': { primary: '#E53E3E', accent: '#38B2AC', secondary: '#FFFFFF', light: '#FFF5F5', dark: '#C53030' },
    'streaming': { primary: '#E50914', accent: '#8312F5', secondary: '#141414', light: '#F5F5F5', dark: '#000000' },
    'gaming': { primary: '#1A1A2E', accent: '#FF0080', secondary: '#16213E', light: '#F0F0F5', dark: '#0F0F1A' },
    'beauty': { primary: '#F5F5F5', accent: '#E91E63', secondary: '#FFFFFF', light: '#FCE4EC', dark: '#C2185B' }
  };
  
  // Check for brand-specific colors first
  if (brandName) {
    const brandLower = brandName.toLowerCase();
    const brandColors: Record<string, any> = {
      'cred': { primary: '#0D0D0D', accent: '#8B5CF6', secondary: '#FFFFFF', light: '#F5F5F5', dark: '#000000' },
      'stripe': { primary: '#635BFF', accent: '#0A2540', secondary: '#FFFFFF', light: '#F5F5FF', dark: '#0A2540' },
      'doordash': { primary: '#FF3008', accent: '#FF4D4D', secondary: '#FFFFFF', light: '#FFF5F5', dark: '#CC2600' },
      'uber': { primary: '#000000', accent: '#00C2C2', secondary: '#FFFFFF', light: '#F5F5F5', dark: '#1A1A1A' },
      'airbnb': { primary: '#FF5A5F', accent: '#FFFFFF', secondary: '#FFFFFF', light: '#FFF5F5', dark: '#CC4A50' },
      'netflix': { primary: '#E50914', accent: '#8312F5', secondary: '#141414', light: '#F5F5F5', dark: '#000000' },
      'spotify': { primary: '#1DB954', accent: '#FFFFFF', secondary: '#191414', light: '#F5F5F5', dark: '#121212' }
    };
    
    for (const [brand, colors] of Object.entries(brandColors)) {
      if (brandLower.includes(brand)) {
        return colors;
      }
    }
  }
  
  return colorSchemes[category] || { primary: '#1E293B', accent: '#3B82F6', secondary: '#FFFFFF', light: '#F8FAFC', dark: '#0F172A' };
};

export default { inferCategory, getCategoryNarrative, getCategoryColors };