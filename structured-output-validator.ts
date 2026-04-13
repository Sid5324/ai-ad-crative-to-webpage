// structured-output-validator.ts - FAILFAST BAD OUTPUT
export interface ValidPageSpec {
  brand: string;
  hero: {
    headline: string;
    subheadline: string;
    primary_cta: string;
  };
  sections?: Array<{
    type: string;
    title: string;
    content: string;
  }>;
}

export function validatePageSpec(raw: any): { valid: boolean; data?: ValidPageSpec; errors: string[] } {
  const errors: string[] = [];

  // Handle raw JSON string (your failure case)
  let parsed: any;
  if (typeof raw === 'string') {
    if (raw.includes('```json')) {
      errors.push('Raw markdown JSON detected');
      return { valid: false, errors };
    }
    try {
      parsed = JSON.parse(raw);
    } catch {
      errors.push('Cannot parse JSON string');
      return { valid: false, errors };
    }
  } else {
    parsed = raw;
  }

  // Required fields check
  if (!parsed?.brand || typeof parsed.brand !== 'string' || parsed.brand === 'Brand') {
    errors.push('Invalid/missing brand name');
  }

  if (!parsed?.hero?.headline || parsed.hero.headline.includes('```')) {
    errors.push('Invalid/missing hero headline');
  }

  if (!parsed?.hero?.subheadline) {
    errors.push('Missing hero subheadline');
  }

  if (!parsed?.hero?.primary_cta) {
    errors.push('Missing primary CTA');
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: parsed as ValidPageSpec,
    errors: []
  };
}