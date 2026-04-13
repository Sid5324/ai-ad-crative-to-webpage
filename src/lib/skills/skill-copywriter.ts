// src/lib/skills/skill-copywriter.ts - Voice Copywriter Skill
import { VoiceCopy, Brand, AdVision, PageStrategy } from '../schemas/skill-schemas';

// Write brand-specific, section-aware copy
export function runCopySkill(
  brand: Brand, 
  ad: AdVision, 
  strategy: PageStrategy
): VoiceCopy {
  console.log('[Copy] Writing brand-specific copy...', { brand: brand.name, category: brand.category });
  
  const category = brand.category;
  const audience = brand.audience;
  const tone = brand.tone || [];
  const cta = strategy.conversionPath.primary;
  const secondaryCta = strategy.conversionPath.secondary;
  const offer = ad.offerSignals?.[0];
  const brandName = brand.name;
  
  // Use actual brand tagline if available
  const brandTagline = brand.tagline || '';
  const brandDescription = brand.description || '';
  
  // Check for CRED - must use actual CRED brand voice
  if (brandName.toLowerCase().includes('cred')) {
    return writeCredCopy(brand, ad, cta, secondaryCta);
  }
  
  // Check for other known finance brands
  if (category === 'Finance' || tone.includes('Premium') || tone.includes('Professional')) {
    return writeFinanceCopy(brand, ad, cta, secondaryCta);
  }
  
  // Merchant/B2B → professional business
  if (audience === 'merchant' || audience === 'b2b') {
    return writeMerchantCopy(brand, ad, cta, secondaryCta);
  }
  
  // Food/restaurant → appetizing, friendly
  if (category === 'Food & Dining') {
    return writeFoodCopy(brand, ad, cta, secondaryCta);
  }
  
  // Transportation/Luxury services
  if (category === 'Transportation' || category === 'Luxury') {
    return writeLuxuryTransportCopy(brand, ad, cta, secondaryCta);
  }
  
  // Travel services
  if (category === 'Travel') {
    return writeTravelCopy(brand, ad, cta, secondaryCta);
  }
  
  // Default → clean consumer
  return writeDefaultCopy(brand, ad, cta, secondaryCta);
}

function writeLuxuryTransportCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  const offers = ad.offerSignals || [];
  const brandDesc = brand.description || '';
  
  return {
    hero: {
      eyebrow: 'Premium Service',
      headline: brand.tagline || 'Experience Luxury Travel',
      subheadline: brandDesc || `Travel in comfort with ${brand.name}. Professional drivers, premium vehicles.`,
      primaryCta: cta || 'Book Now',
      secondaryCta: secondaryCta || 'View Fleet'
    },
    proofBar: [
      '500+ Vehicles',
      '24/7 Service',
      '4.9★ Rating'
    ],
    benefits: [
      {
        title: 'Professional Chauffeurs',
        description: 'Experienced, uniformed drivers dedicated to your comfort.'
      },
      {
        title: 'Premium Fleet',
        description: 'Luxury vehicles from Mercedes to Rolls. Choose your ride.'
      },
      {
        title: 'Door-to-Door Service',
        description: 'We pick you up and drop you off. No hassle.'
      }
    ],
    trustSection: {
      headline: `Why Choose ${brand.name}`,
      points: [
        ' licenced & insured',
        ' verified drivers',
        ' 24/7 support'
      ]
    },
    finalCta: {
      headline: 'Book Your Transfer',
      subheadline: 'Available now. Call or book online.',
      button: cta || 'Book Now'
    },
    voice: 'luxury-service',
    locale: 'en-US'
  };
}

function writeTravelCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  return {
    hero: {
      eyebrow: 'Travel Made Easy',
      headline: brand.tagline || 'Your Next Adventure Awaits',
      subheadline: brand.description || `Book your travel with ${brand.name}. Best deals guaranteed.`,
      primaryCta: cta || 'Book Now',
      secondaryCta: secondaryCta || 'Explore'
    },
    proofBar: [
      '10K+ Destinations',
      'Best Price Guarantee',
      '4.8★ Rating'
    ],
    benefits: [
      { title: 'Best Prices', description: 'We match any lower price you find.' },
      { title: 'Free Cancellation', description: 'Cancel up to 24h before, no charge.' },
      { title: '24/7 Support', description: 'Help anytime, anywhere.' }
    ],
    trustSection: {
      headline: `Why ${brand.name}?`,
      points: ['Verified reviews', 'Secure booking', 'Best deals']
    },
    finalCta: {
      headline: 'Start Your Journey',
      subheadline: 'Book now and get exclusive discounts.',
      button: cta || 'Book Now'
    },
    voice: 'travel-friendly',
    locale: 'en-US'
  };
}

function writeCredCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  // Use offers from ad if available
  const offers = ad.offerSignals || [];
  const adCta = ad.ctaSignals?.[0] || cta || 'Get Started';
  
  // Build benefit titles dynamically based on offers
  const benefits = [];
  if (offers.includes('cashback')) {
    benefits.push({ title: 'Unlimited Cashback', description: 'Get flat 5% cashback on all transactions, every single time.' });
  }
  if (offers.includes('rewards')) {
    benefits.push({ title: '4X Rewards', description: 'Earn 4X points on every spend. Redeem for premium brands.' });
  }
  benefits.push({ title: 'Instant Access', description: 'Get credit approved in minutes. Money in your account immediately.' });
  benefits.push({ title: 'Zero Hidden Fees', description: 'No annual charges. No surprise costs. Ever.' });
  
  return {
    hero: {
      eyebrow: 'Exclusive',
      headline: 'not everyone gets it.',
      subheadline: offers.length > 0 
        ? `Unlock ${offers.join(', ')} and more with India's most prestigious credit card.`
        : 'Experience financial freedom with exclusive rewards and privileges.',
      primaryCta: adCta,
      secondaryCta: secondaryCta || 'Explore'
    },
    proofBar: [
      '9M+ Members',
      '₹80,000Cr+ Credit',
      '4.8★ Play Store'
    ],
    benefits,
    trustSection: {
      headline: '9 Million+ Members Trust CRED',
      points: [
        'RBI Licensed',
        '256-bit Security',
        '4.8★ Rating'
      ]
    },
    finalCta: {
      headline: 'Ready to Upgrade?',
      subheadline: 'Apply in 2 minutes. Get approved instantly.',
      button: adCta
    },
    voice: 'cred-bold',
    locale: 'en-IN'
  };
}

function writeFinanceCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  // Use vision CTA first, then category defaults
  const visionCTA = ad.ctaSignals?.[0] || (ad as any).primaryCta;
  const ctaToUse = visionCTA || cta || 'Get Started';
  
  const offers = ad.offerSignals || [];
  const isCashback = offers.includes('cashback');
  const isRewards = offers.includes('rewards');
  const isFreeTrial = offers.includes('free trial');
  
  // Build dynamic benefits based on offers
  const benefits = [];
  if (isCashback) {
    benefits.push({ title: 'Instant Cashback', description: 'Get money back on every transaction. No waiting, no limits.' });
  }
  if (isRewards) {
    benefits.push({ title: 'Exclusive Rewards', description: 'Earn points on everything. Redeem for travel, shopping, and more.' });
  }
  if (isFreeTrial) {
    benefits.push({ title: 'Start Free', description: 'Try risk-free. No credit card required to begin.' });
  }
  if (benefits.length === 0) {
    benefits.push(
      { title: 'Secure & Fast', description: 'Bank-grade security with instant approvals.' },
      { title: '24/7 Support', description: 'Round-the-clock assistance whenever you need it.' },
      { title: 'Best Rates', description: 'Competitive rates tailored to your needs.' }
    );
  }
  
  return {
    hero: {
      eyebrow: isRewards ? 'Exclusive Rewards' : isCashback ? 'Get Cashback' : 'Premium Banking',
      headline: brand.tagline || (isCashback || isRewards ? 'Your Money, Rewarded' : 'Banking That Works For You'),
      subheadline: offers.length > 0 
        ? `Get ${offers.join(', ')} and more. Join ${brand.name} today.`
        : (brand.description || `Experience the best financial services with ${brand.name}.`),
      primaryCta: ctaToUse,
      secondaryCta: secondaryCta || 'Learn More'
    },
    proofBar: [
      '1M+ Users',
      '₹10,000Cr+ Processed',
      '4.8★ Rating'
    ],
    benefits: benefits.slice(0, 3),
    trustSection: {
      headline: `Why ${brand.name}?`,
      points: [
        ' RBI-licensed and regulated',
        ' Industry-leading security',
        ' Zero compromise on privacy'
      ]
    },
    finalCta: {
      headline: 'Ready to Apply?',
      subheadline: `Join ${brand.name || 'thousands'} of satisfied members today.`,
      button: cta || 'Apply Now'
    },
    voice: 'premium-fintech',
    locale: 'en-IN'
  };
}

function writeMerchantCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  return {
    hero: {
      eyebrow: 'Business Growth Partner',
      headline: `Grow Your Business with ${brand.name}`,
      subheadline: 'Industry-leading tools to increase revenue, reach more customers, and streamline operations.',
      primaryCta: cta || 'Start Free',
      secondaryCta: secondaryCta || 'Schedule Demo'
    },
    proofBar: [
      '500K+ Businesses',
      '300% Avg. Growth',
      '99.9% Uptime'
    ],
    benefits: [
      {
        title: 'Increase Revenue',
        description: 'Proven strategies to boost your bottom line with measurable results.'
      },
      {
        title: 'Save Time',
        description: 'Automate repetitive tasks so your team can focus on growth.'
      },
      {
        title: 'Scale Faster',
        description: 'Built to grow with your business from startup to enterprise.'
      }
    ],
    trustSection: {
      headline: 'Trusted by Industry Leaders',
      points: [
        ' Used by 500,000+ businesses',
        ' $2B+ processed monthly',
        ' 4.8★ App Store rating'
      ]
    },
    finalCta: {
      headline: 'Ready to Scale?',
      subheadline: 'Start your free trial today. No credit card required.',
      button: cta || 'Start Free Trial'
    },
    voice: 'b2b-professional',
    locale: 'en-IN'
  };
}

function writeFoodCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  const hasDiscount = ad.offerSignals?.includes('discount');
  const hasDelivery = ad.offerSignals?.includes('delivery');
  
  return {
    hero: {
      eyebrow: hasDiscount ? 'Special Offer' : 'Fresh & Delicious',
      headline: hasDiscount 
        ? 'Great Food, Amazing Prices' 
        : `Delicious Meals from ${brand.name}`,
      subheadline: hasDelivery
        ? 'Free delivery on all orders. Fresh ingredients, chef-prepared.'
        : 'Fresh ingredients, chef-prepared meals delivered to your door.',
      primaryCta: cta || 'Order Now',
      secondaryCta: secondaryCta || 'View Menu'
    },
    proofBar: [
      '50K+ Orders',
      '4.8★ Rating',
      '30 min Delivery'
    ],
    benefits: [
      {
        title: 'Fresh Ingredients',
        description: 'We source the freshest ingredients from local suppliers.'
      },
      {
        title: 'Chef Prepared',
        description: 'Every meal is crafted by our expert chefs.'
      },
      {
        title: 'Fast Delivery',
        description: 'Hot meals delivered to your door in 30 minutes.'
      }
    ],
    finalCta: {
      headline: 'Hungry? Order Now',
      subheadline: 'Free delivery on your first order.',
      button: cta || 'Order Now'
    },
    voice: 'friendly-food',
    locale: 'en-IN'
  };
}

function writeDefaultCopy(
  brand: Brand, 
  ad: AdVision, 
  cta: string, 
  secondaryCta?: string
): VoiceCopy {
  // EVIDENCE-BASED: Use actual brand tagline/description, not placeholder
  const brandDesc = brand.description && !brand.description.includes('Website at') 
    ? brand.description 
    : `Discover ${brand.name} - Your trusted ${brand.category.toLowerCase()} service`;
  
  const category = brand.category || 'Service';
  const brandName = brand.name;
  
  return {
    hero: {
      eyebrow: category,
      headline: brand.tagline || `Welcome to ${brandName}`,
      subheadline: brandDesc,
      primaryCta: cta || 'Get Started',
      secondaryCta: secondaryCta || 'Explore'
    },
    proofBar: [
      'Trusted by Customers',
      '4.8★ Rating',
      '24/7 Available'
    ],
    benefits: [
      {
        title: 'Quality Service',
        description: `Experience the best ${category.toLowerCase()} services with ${brandName}.`
      },
      {
        title: 'Easy to Use',
        description: 'Simple, intuitive experience designed for you.'
      },
      {
        title: 'Dedicated Support',
        description: 'We are here to help anytime.'
      }
    ],
    finalCta: {
      headline: `Get Started with ${brandName}`,
      subheadline: 'Join us today. It takes only a moment.',
      button: cta || 'Get Started'
    },
    voice: 'modern-consumer',
    locale: 'en-US'
  };
}