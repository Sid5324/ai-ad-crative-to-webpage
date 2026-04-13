// src/lib/skills/skill-renderer-fix.ts - Better rendering with brand colors
import { Brand, VoiceCopy, DesignDirection, QA } from '../schemas/skill-schemas';

// Renderer rejection for poor quality - STRICT GATE
export function canRender(brand: Brand, qa?: QA): { ok: boolean; error?: string } {
  // Reject placeholder brands
  if (!brand.name || brand.name.includes('Business') || brand.name === 'Website at') {
    return { ok: false, error: 'Brand not validated - cannot render' };
  }
  
  // Reject low confidence
  if (brand.confidence < 0.7) {
    return { ok: false, error: `Brand confidence too low: ${brand.confidence}` };
  }
  
  // REJECT if QA failed - this is the hard gate
  if (qa && !qa.passed) {
    const fatalCodes = qa.fatalIssues.join(', ') || 'multiple issues';
    return { ok: false, error: `QA_FAILED: ${fatalCodes} - cannot render` };
  }
  
  // Reject low QA score
  if (qa && qa.score < 80) {
    return { ok: false, error: `QA Score too low: ${qa.score} - cannot render` };
  }
  
  return { ok: true };
}

export function renderLandingPageFix(
  brand: Brand,
  copy: VoiceCopy,
  design: DesignDirection,
  qa?: QA
): string {
  // STRICT GATE: cannot render poor quality - must pass QA
  const check = canRender(brand, qa);
  if (!check.ok) {
    throw new Error(`RENDER_REJECTED: ${check.error}`);
  }
  
  const p = design.palette as { bg: string; surface: string; text: string; primary: string; accent: string; light?: string };
  const isDark = p.bg === '#0a0a0a' || p.bg === '#000000';
  
  // Use brand colors for gradient
  let gradient: string;
  let ctaGradient: string;
  
  // Get light color or use default
  const lightColor = p.light || '#f8fafc';
  
  // Dark themes use surface to bg gradient
  if (isDark && design.artDirection !== 'cred-bold') {
    gradient = `linear-gradient(180deg, ${p.surface}, ${p.bg})`;
    ctaGradient = `linear-gradient(135deg, ${p.accent}, ${p.primary})`;
  } 
  // CRED uses orange-red gradient
  else if (design.artDirection === 'cred-bold') {
    gradient = `linear-gradient(180deg, ${p.surface}, ${p.bg})`;
    ctaGradient = `linear-gradient(135deg, ${p.primary}, ${p.accent})`;
  } 
  // Light themes
  else {
    gradient = `linear-gradient(180deg, ${p.surface}, ${lightColor})`;
    ctaGradient = `linear-gradient(135deg, ${p.primary}, ${p.accent})`;
  }
  
  console.log('[RendererFix] Using design:', design.artDirection, 'accent:', p.accent);
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name}${brand.tagline ? ' - ' + brand.tagline : ''}</title>
  <meta name="description" content="${copy.hero?.subheadline || brand.description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${p.bg};
      --surface: ${p.surface};
      --text: ${p.text};
      --primary: ${p.primary};
      --accent: ${p.accent};
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-font-smoothing: antialiased; }
    body { font-family: 'Inter', sans-serif; line-height: 1.6; color: var(--text); background: var(--bg); }
    h1, h2, h3 { line-height: 1.2; }
    
    .container { max-width: 72rem; margin: 0 auto; padding: 0 1.5rem; }
    @media (min-width: 768px) { .container { padding: 0 2rem; } }
    
    .grid-2 { display: grid; grid-template-columns: 1fr; gap: 3rem; }
    @media (min-width: 768px) { .grid-2 { grid-template-columns: repeat(2, 1fr); } }
    
    .grid-3 { display: grid; grid-template-columns: 1fr; gap: 2rem; }
    @media (min-width: 768px) { .grid-3 { grid-template-columns: repeat(3, 1fr); } }
    
    .section { padding: 4rem 1.5rem; }
    @media (min-width: 768px) { .section { padding: 5rem 2rem; } }
    
    .hero { background: ${gradient}; min-height: 70vh; display: flex; align-items: center; }
    
    .card { background: var(--surface); border: 1px solid rgba(255,255,255,0.1); border-radius: 1rem; padding: 2rem; }
    
    .btn { display: inline-block; padding: 1rem 2.5rem; border-radius: 0.5rem; font-weight: 600; text-decoration: none; transition: all 0.3s ease; cursor: pointer; border: none; font-size: 1rem; }
    .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .btn-primary { background: var(--accent); color: white; }
    .btn-outline { border: 2px solid rgba(255,255,255,0.5); color: white; background: transparent; }
    
    .text-center { text-align: center; }
    .text-accent { color: var(--accent); }
    .text-muted { opacity: 0.7; }
    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .font-bold { font-weight: 700; }
    
    .mb-1 { margin-bottom: 0.5rem; }
    .mb-2 { margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 2rem; }
    .mb-6 { margin-bottom: 3rem; }
    .mt-4 { margin-top: 2rem; }
    
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .gap-2 { gap: 1rem; }
    .gap-4 { gap: 2rem; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    
    .badge { display: inline-block; padding: 0.5rem 1rem; background: rgba(255,255,255,0.2); border-radius: 9999px; font-size: 0.875rem; font-weight: 500; }
    .opacity-80 { opacity: 0.8; }
    .opacity-90 { opacity: 0.9; }
  </style>
</head>
<body>
  <!-- HERO -->
  <section class="hero">
    <div class="container">
      <div class="grid-2">
        <div class="flex flex-col gap-2">
          ${copy.hero?.eyebrow ? `<div class="badge">${copy.hero.eyebrow}</div>` : ''}
          <h1 style="font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;">${copy.hero?.headline || brand.name}</h1>
          <p class="text-lg opacity-90" style="max-width: 32rem;">${copy.hero?.subheadline || brand.description}</p>
          <div class="flex flex-wrap gap-2 mt-4">
            <a href="#apply" class="btn btn-primary">${copy.hero?.primaryCta || 'Apply Now'}</a>
            ${copy.hero?.secondaryCta ? `<a href="#learn" class="btn btn-outline">${copy.hero.secondaryCta}</a>` : ''}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS -->
  ${copy.proofBar?.length ? `
  <section class="section" style="background: var(--surface);">
    <div class="container">
      <div class="grid-3 text-center">
        ${copy.proofBar.map(s => `<div><div class="text-accent" style="font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800;">${s}</div></div>`).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- TRUST -->
  ${copy.trustSection ? `
  <section class="section" style="background: var(--bg);">
    <div class="container text-center">
      <h2 class="mb-4">${copy.trustSection.headline}</h2>
      <div class="flex flex-wrap justify-center gap-4">
        ${copy.trustSection.points.map(pt => `
          <div class="flex items-center gap-1">
            <span style="width: 0.5rem; height: 0.5rem; background: #22c55e; border-radius: 50%;"></span>
            <span class="text-sm opacity-80">${pt}</span>
          </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- BENEFITS -->
  ${copy.benefits?.length ? `
  <section class="section" style="background: var(--surface);">
    <div class="container">
      <h2 class="text-center mb-6" style="font-size: clamp(1.5rem, 3vw, 2rem);">Why Choose ${brand.name}</h2>
      <div class="grid-3">
        ${copy.benefits.map(b => `
          <div class="card">
            <div class="text-accent" style="font-size: 1.5rem; margin-bottom: 0.5rem;">◆</div>
            <h3 class="mb-1" style="font-size: 1.25rem;">${b.title}</h3>
            <p class="text-muted">${b.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- CTA -->
  <section class="section" style="background: ${ctaGradient};">
    <div class="container text-center">
      <h2 class="mb-2">${copy.finalCta?.headline || 'Get Started'}</h2>
      <p class="text-lg mb-4 opacity-90">${copy.finalCta?.subheadline || 'Join us today'}</p>
      <a href="#apply" class="btn btn-primary">${copy.finalCta?.button || copy.hero?.primaryCta || 'Apply Now'}</a>
    </div>
  </section>

  <!-- FOOTER -->
  <footer style="background: #111827; padding: 4rem 1.5rem; text-align: center;">
    <div class="container">
      <h3 class="mb-2">${brand.name}</h3>
      <p class="text-sm opacity-80 mb-4">${brand.description}</p>
      <div style="border-top: 1px solid #374151; padding-top: 2rem;">
        <p class="text-sm opacity-80">© 2026 ${brand.name}. All rights reserved.</p>
      </div>
    </div>
  </footer>
</body>
</html>`;
}