// src/lib/skills/skill-repair-editor.ts - Repair Editor Skill
import { Repair, QA, Brand, VoiceCopy, DesignDirection } from '../schemas/skill-schemas';

// Fix issues identified by QA
export function runRepairSkill(
  brand: Brand,
  copy: VoiceCopy,
  design: DesignDirection,
  qa: QA
): { brand: Brand; copy: VoiceCopy; design: DesignDirection; repair: Repair } {
  console.log('[Repair] Running repairs...');
  
  const actions: Repair['actions'] = [];
  let newBrand = { ...brand };
  let newCopy = { ...copy };
  let newDesign = { ...design };
  
  for (const issue of qa.issues) {
    if (issue.severity === 'low') continue;
    
    switch (issue.code) {
      case 'BRAND_POLLUTION':
        if (issue.修复 === 'normalize-brand') {
          const original = newBrand.name;
          newBrand = repairBrandName(newBrand);
          actions.push({
            target: 'brand',
            action: 'normalize-brand',
            original,
            replacement: newBrand.name,
            reason: 'Removed slogan from brand name'
          });
        }
        break;
        
      case 'BANNED_PHRASE':
        if (issue.修复 === 'tighten-copy') {
          const originalCopy = { ...newCopy };
          newCopy = repairGenericCopy(newCopy, issue.message);
          actions.push({
            target: 'copy',
            action: 'tighten-copy',
            original: issue.message,
            replacement: 'Rewritten',
            reason: 'Removed generic phrase'
          });
        }
        break;
        
      case 'GENERIC_CTA':
        if (issue.修复 === 'rewrite-cta') {
          const original = newCopy.hero.primaryCta;
          newCopy = repairCTA(newCopy, newBrand.category);
          actions.push({
            target: 'cta',
            action: 'rewrite-cta',
            original: original || '',
            replacement: newCopy.hero.primaryCta,
            reason: 'CTA too generic'
          });
        }
        break;
        
      case 'MISSING_HEADLINE':
        if (issue.修复 === 'rewrite-hero') {
          newCopy = repairHeadline(newCopy, newBrand);
          actions.push({
            target: 'hero',
            action: 'rewrite-hero',
            original: 'Missing',
            replacement: newCopy.hero.headline,
            reason: 'Headline was missing'
          });
        }
        break;
    }
  }
  
  const finalScore = qa.score + (actions.length * 10);
  
  return {
    brand: newBrand,
    copy: newCopy,
    design: newDesign,
    repair: {
      actions,
      success: actions.length > 0,
      finalScore: Math.min(100, finalScore),
      regeneratedFields: actions.map(a => a.target)
    }
  };
}

function repairBrandName(brand: Brand): Brand {
  let name = brand.name;
  
  // Remove common slogans
  const slogans = [
    'not everyone gets it',
    'not just',
    'the best',
    'world\'s ',
    'only '
  ];
  
  for (const slogan of slogans) {
    if (name.toLowerCase().includes(slogan)) {
      name = name.replace(new RegExp(slogan, 'gi'), '').trim();
    }
  }
  
  // Clean up separators
  name = name.split(/[|~-]/)[0].trim();
  name = name.replace(/^(the|my|our|a|an)\s+/i, '').trim();
  
  // If too short, use domain-based name
  if (name.length < 2) {
    name = brand.category;
  }
  
  return { ...brand, name };
}

function repairGenericCopy(copy: VoiceCopy, issueMessage: string): VoiceCopy {
  // Simple replacements for specific banned phrases
  let newCopy = { ...copy };
  const copyStr = JSON.stringify(copy).toLowerCase();
  
  // Replace specific phrases
  if (copyStr.includes('premium service')) {
    if (newCopy.benefits) {
      newCopy.benefits = newCopy.benefits.map(b => ({
        title: b.title,
        description: b.description.replace('Premium service', 'Premium quality')
      }));
    }
  }
  
  if (copyStr.includes('learn more')) {
    newCopy.hero = {
      ...newCopy.hero,
      secondaryCta: 'Explore'
    };
  }
  
  if (copyStr.includes('get started')) {
    // Keep if no better option
  }
  
  return newCopy;
}

function repairCTA(copy: VoiceCopy, category: string): VoiceCopy {
  const ctaMap: Record<string, string> = {
    'Finance': 'Apply Now',
    'Food & Dining': 'Order Now',
    'E-commerce': 'Shop Now',
    'SaaS': 'Start Free',
    'Healthcare': 'Book Appointment',
    'Travel': 'Book Now',
    'Education': 'Enroll Now',
    'Real Estate': 'Schedule Visit'
  };
  
  const newCta = ctaMap[category] || copy.hero.primaryCta;
  
  return {
    ...copy,
    hero: {
      ...copy.hero,
      primaryCta: newCta
    },
    finalCta: {
      ...copy.finalCta,
      button: newCta
    }
  };
}

function repairHeadline(copy: VoiceCopy, brand: Brand): VoiceCopy {
  // Generate headline based on category
  const headlines: Record<string, string> = {
    'Finance': 'Your Financial Future Starts Here',
    'Food & Dining': 'Experience the Best',
    'E-commerce': 'Shop with Confidence',
    'SaaS': 'Build Better, Faster',
    'Healthcare': 'Your Health, Our Priority',
    'Travel': 'Explore the World',
    'Education': 'Learn Without Limits',
    'Real Estate': 'Find Your Perfect Space'
  };
  
  const headline = headlines[brand.category] || `${brand.name} - Better by Design`;
  
  return {
    ...copy,
    hero: {
      ...copy.hero,
      headline,
      subheadline: copy.hero.subheadline || brand.description
    }
  };
}