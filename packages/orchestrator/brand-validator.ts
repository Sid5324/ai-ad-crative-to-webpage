// packages/orchestrator/brand-validator.ts - Validate brand data before copy generation
export function validateBrandOrThrow(brand: any): { valid: boolean; name?: string; errors: string[] } {
  const errors: string[] = [];

  if (!brand || typeof brand !== 'object') {
    return { valid: false, errors: ['Brand data is missing or invalid'] };
  }

  const name = String(brand.name || brand.brand_name || brand.business_name || '').trim();
  const summary = String(brand.summary || '').trim();
  const category = String(brand.category || '').trim();

  // Blocked placeholder brand names
  const blocked = [
    'business name',
    'brand name',
    'company name',
    'your business',
    'the company',
    ''
  ];

  if (!name || blocked.includes(name.toLowerCase())) {
    errors.push(`Brand name is template placeholder: "${name || '(empty)'}"`);
  }

  if (!summary || summary.length < 10) {
    errors.push('Brand summary missing or too short');
  }

  if (!category) {
    errors.push('Brand category missing');
  }

  if (errors.length) {
    return { valid: false, errors };
  }

  return { valid: true, name, errors: [] };
}