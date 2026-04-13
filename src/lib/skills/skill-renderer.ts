// src/lib/skills/skill-renderer.ts - HTML Renderer (No Tailwind CDN, Valid CSS)
import { Brand, VoiceCopy, DesignDirection } from '../schemas/skill-schemas';

// Render landing page from spec with VALID CSS
export function renderLandingPage(
  brand: Brand,
  copy: VoiceCopy,
  design: DesignDirection
): string {
  console.log('[Renderer] Generating HTML with valid CSS...');
  
  const p = design.palette;
  const gradient = `linear-gradient(135deg, ${p.primary}, ${p.accent})`;
  
  // Build full HTML with PROPER CSS (no Tailwind garbage)
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${brand.name} - ${brand.tagline || ''}</title>
  <meta name="description" content="${copy.hero?.subheadline || brand.description}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --black: ${p.primary};
      --gold: ${p.accent};
      --dark: ${p.surface};
      --surface: ${p.surface};
      --white: ${p.text};
      --muted: #9ca3af;
      --font-display: Inter, sans-serif;
      --font-body: Inter, sans-serif;
    }
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-font-smoothing: antialiased; }
    body { 
      font-family: var(--font-body);
      line-height: 1.6; 
      color: var(--white); 
      background: var(--black);
    }
    h1, h2, h3 { line-height: 1.2; font-family: var(--font-display); }
    
    /* Layout */
    .container {
      max-width: 72rem;
      margin: 0 auto;
      width: 100%;
      padding: 0 1.5rem;
    }
    @media (min-width: 768px) {
      .container { padding: 0 2rem; }
    }
    
    /* Grid system - PROPER CSS, not Tailwind */
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 3rem;
    }
    @media (min-width: 768px) {
      .grid-2 { grid-template-columns: repeat(2, 1fr); }
    }
    
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr;
      gap: 2rem;
    }
    @media (min-width: 768px) {
      .grid-3 { grid-template-columns: repeat(3, 1fr); }
    }
    
    /* Sections */
    .section {
      padding: 4rem 1.5rem;
    }
    @media (min-width: 768px) {
      .section { padding: 5rem 2rem; }
    }
    
    /* Hero */
    .hero {
      background: ${gradient};
      min-height: 70vh;
      display: flex;
      align-items: center;
    }
    
    /* Cards */
    .card {
      background: var(--dark);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 1rem;
      padding: 2rem;
    }
    .card-glass {
      background: rgba(255,255,255,0.1);
      backdrop-filter: blur(1rem);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 1rem;
      padding: 2rem;
    }
    
    /* CTA Buttons */
    .btn {
      display: inline-block;
      padding: 1rem 2rem;
      border-radius: 0.5rem;
      font-weight: 600;
      text-decoration: none;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
    
    .btn-primary {
      background: var(--gold);
      color: white;
    }
    .btn-outline {
      border: 2px solid rgba(255,255,255,0.5);
      color: white;
    }
    
    /* Text */
    .text-gold { color: var(--gold); }
    .text-center { text-align: center; }
    .text-sm { font-size: 0.875rem; }
    .text-lg { font-size: 1.125rem; }
    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }
    
    /* Spacing */
    .mb-1 { margin-bottom: 0.5rem; }
    .mb-2 { margin-bottom: 1rem; }
    .mb-4 { margin-bottom: 2rem; }
    .mb-6 { margin-bottom: 3rem; }
    .mt-4 { margin-top: 2rem; }
    .gap-1 { gap: 0.5rem; }
    .gap-2 { gap: 1rem; }
    .gap-4 { gap: 2rem; }
    
    /* Flex */
    .flex { display: flex; }
    .flex-col { flex-direction: column; }
    .flex-wrap { flex-wrap: wrap; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    
    /* Inline */
    .inline-block { display: inline-block; }
    .opacity-80 { opacity: 0.8; }
    .opacity-90 { opacity: 0.9; }
    
    /* Pill badge */
    .badge {
      display: inline-block;
      padding: 0.5rem 1rem;
      background: rgba(255,255,255,0.2);
      border-radius: 9999px;
      font-size: 0.875rem;
      font-weight: 500;
    }
  </style>
</head>
<body>
  <!-- HERO -->
  <section class="hero">
    <div class="container">
      <div class="grid-2">
        <div class="flex flex-col gap-2">
          ${copy.hero?.eyebrow ? `<div class="badge mb-2">${copy.hero.eyebrow}</div>` : ''}
          <h1 style="font-size: clamp(2rem, 5vw, 3rem); font-weight: 800;">${copy.hero?.headline || brand.name}</h1>
          <p class="text-lg opacity-90" style="max-width: 32rem;">${copy.hero?.subheadline || brand.description}</p>
          <div class="flex flex-wrap gap-2 mt-4">
            <a href="#apply" class="btn btn-primary">${copy.hero?.primaryCta || 'Apply Now'}</a>
            ${copy.hero?.secondaryCta ? `<a href="#learn" class="btn btn-outline">${copy.hero.secondaryCta}</a>` : ''}
          </div>
        </div>
        <div class="flex items-center justify-center" style="display: none;">
        </div>
        <style>
        @media (min-width: 768px) {
          .grid-2 > div:last-child { display: block; }
        }
        </style>
      </div>
    </div>
  </section>

  <!-- STATS -->
  ${copy.proofBar?.length ? `
  <section class="section" style="background: var(--dark);">
    <div class="container">
      <div class="grid-3 text-center">
        ${copy.proofBar.map(s => `
          <div>
            <div class="text-gold" style="font-size: clamp(1.5rem, 4vw, 2rem); font-weight: 800;">${s}</div>
          </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- TRUST -->
  ${copy.trustSection ? `
  <section class="section" style="background: var(--surface);">
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
  <section class="section" style="background: var(--dark);">
    <div class="container">
      <h2 class="text-center mb-6">Why Choose ${brand.name}</h2>
      <div class="grid-3">
        ${copy.benefits.map(b => `
          <div class="card">
            <h3 class="mb-1">${b.title}</h3>
            <p class="text-sm opacity-80">${b.description}</p>
          </div>
        `).join('')}
      </div>
    </div>
  </section>
  ` : ''}

  <!-- CTA -->
  <section class="section" style="background: ${gradient};">
    <div class="container text-center">
      <h2 class="mb-2">${copy.finalCta?.headline || 'Ready to get started?'}</h2>
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