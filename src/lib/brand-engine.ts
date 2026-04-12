export interface BrandSpec {
  name: string;
  colors: { primary: string; gradient: string; accent: string };
  typography: string;
  voice: 'casual' | 'professional' | 'luxury' | 'urgent' | 'merchant_focused';
  hero: { headline: string; subheadline: string; cta: string };
  stats: Array<{ value: string; label: string }>;
  benefits: Array<{ title: string; body: string }>;
  testimonials: Array<{ name: string; title: string; quote: string; rating: number }>;
}

const BRAND_ENGINE: Record<string, BrandSpec> = {
  uber: {
    name: "Uber Eats",
    colors: { primary: "#FF6B35", gradient: "linear-gradient(135deg, #FF6B35 0%, #FDBA74 100%)", accent: "#F97316" },
    typography: "Inter, system-ui, sans-serif",
    voice: "casual",
    hero: { headline: "Food Delivered in Minutes", subheadline: "From your favorite restaurants near you", cta: "Order Now" },
    stats: [
      { value: "10M+", label: "Daily Orders" },
      { value: "30min", label: "Avg Delivery" },
      { value: "4.9★", label: "App Rating" }
    ],
    benefits: [
      { title: "Lightning Fast", body: "Hot food delivered in 30 minutes or less from local restaurants" },
      { title: "Huge Selection", body: "Thousands of restaurants and cuisines available instantly" },
      { title: "Live Tracking", body: "Watch your order from kitchen to your front door" }
    ],
    testimonials: [
      { name: "Sarah K.", title: "Foodie", quote: "Uber Eats has every restaurant I love. Delivery is always fast and hot!", rating: 5 },
      { name: "Mike T.", title: "Busy Dad", quote: "Dinner for the kids in 25 minutes. Life saver during soccer season.", rating: 5 }
    ]
  },

  doordash: {
    name: "DoorDash",
    colors: { primary: "#FF3008", gradient: "linear-gradient(135deg, #FF3008 0%, #FF8A80 100%)", accent: "#FF5722" },
    typography: "Inter, system-ui, sans-serif",
    voice: "merchant_focused",
    hero: { headline: "Grow Your Restaurant", subheadline: "Reach more customers with DoorDash delivery", cta: "Partner Now" },
    stats: [
      { value: "500K+", label: "Restaurants" },
      { value: "2M+", label: "Daily Orders" },
      { value: "$5B+", label: "Payouts" }
    ],
    benefits: [
      { title: "More Customers", body: "Access millions of hungry customers instantly" },
      { title: "Easy Setup", body: "Get started with delivery in under 24 hours" },
      { title: "Real Analytics", body: "Track orders, revenue, and customer trends" }
    ],
    testimonials: [
      { name: "Maria R.", title: "Pizza Owner", quote: "DoorDash tripled our revenue overnight. Easy setup!", rating: 5 },
      { name: "Raj P.", title: "Curry House", quote: "Best delivery partner. Great support and analytics.", rating: 5 }
    ]
  },

  astar: {
    name: "A-Star Limousine",
    colors: { primary: "#1E3A8A", gradient: "linear-gradient(135deg, #1E3A8A 0%, #60A5FA 100%)", accent: "#2563EB" },
    typography: "'Satoshi Variable', Inter, system-ui, sans-serif",
    voice: "luxury",
    hero: { headline: "VIP Airport Transfers", subheadline: "Arrive in style with professional luxury service", cta: "Book Now" },
    stats: [
      { value: "500+", label: "5★ Events" },
      { value: "24/7", label: "Service" },
      { value: "100%", label: "On-Time" }
    ],
    benefits: [
      { title: "Luxury Fleet", body: "Mercedes S-Class, Cadillac Escalade, premium SUVs" },
      { title: "Professional Chauffeurs", body: "Licensed drivers with 10+ years experience" },
      { title: "Real-Time Flight Tracking", body: "We adjust for delays automatically" }
    ],
    testimonials: [
      { name: "John D.", title: "CEO TechCorp", quote: "Flawless service for our 500-person conference. Highly recommend.", rating: 5 },
      { name: "Sarah M.", title: "Wedding Planner", quote: "Stunning fleet and impeccable drivers. Clients raved.", rating: 5 }
    ]
  },

  generic: {
    name: "Your Company",
    colors: { primary: "#3B82F6", gradient: "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)", accent: "#1D4ED8" },
    typography: "Inter, system-ui, sans-serif",
    voice: "professional",
    hero: { headline: "Professional Service", subheadline: "Reliable solutions for your business", cta: "Get Started" },
    stats: [
      { value: "10K+", label: "Happy Customers" },
      { value: "24/7", label: "Support" },
      { value: "4.9★", label: "Rating" }
    ],
    benefits: [
      { title: "Expert Team", body: "10+ years industry experience" },
      { title: "Fast Results", body: "See improvements in days, not months" },
      { title: "Full Support", body: "Dedicated account manager included" }
    ],
    testimonials: [
      { name: "Mike S.", title: "Founder", quote: "Transformed our business. Professional team.", rating: 5 },
      { name: "Lisa R.", title: "Manager", quote: "Outstanding results and support.", rating: 5 }
    ]
  }
};

export function getBrandSpec(url: string, adInput?: string): BrandSpec {
  const hostname = new URL(url).hostname.toLowerCase();
  
  if (hostname.includes('uber') || hostname.includes('ubereats')) return BRAND_ENGINE.uber;
  if (hostname.includes('doordash')) return BRAND_ENGINE.doordash;
  if (hostname.includes('astar') || hostname.includes('limousine')) return BRAND_ENGINE.astar;
  
  // Customize generic based on ad keywords
  let spec = { ...BRAND_ENGINE.generic };
  if (adInput) {
    const lowerAd = adInput.toLowerCase();
    if (lowerAd.includes('food') || lowerAd.includes('delivery')) {
      spec = { ...BRAND_ENGINE.uber, name: "Food Delivery" };
    } else if (lowerAd.includes('luxury') || lowerAd.includes('vip')) {
      spec = { ...BRAND_ENGINE.astar, name: "Premium Service" };
    }
  }
  
  return spec;
}