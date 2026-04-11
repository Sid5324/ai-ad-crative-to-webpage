export function resolveTheme(mode: string, brand?: string) {
  if (mode === 'brand-grounded' && brand) {
    return {
      bg: '#f6f4ef',
      text: '#171412',
      accent: '#1d4ed8',
      surface: '#ffffff',
    };
  }

  if (mode === 'clean-b2b') {
    return {
      bg: '#f8fafc',
      text: '#0f172a',
      accent: '#2563eb',
      surface: '#ffffff',
    };
  }

  if (mode === 'editorial') {
    return {
      bg: '#faf7f2',
      text: '#1f1b16',
      accent: '#8b5e3c',
      surface: '#fffdf9',
    };
  }

  return {
    bg: '#ffffff',
    text: '#111111',
    accent: '#2563eb',
    surface: '#f7f7f7',
  };
}