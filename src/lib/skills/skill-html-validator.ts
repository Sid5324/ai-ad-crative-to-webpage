// src/lib/skills/skill-html-validator.ts - HTML Structure Validator & Fixer
// Skills: validate_structure, fix_images, ensure_meta, enforce_layout

// Validate and fix HTML structure
export const validateAndFixHtml = (html: string, brandName: string): string => {
  let fixed = html;
  
  // 1. AGGRESSIVELY remove ALL broken image references (ANY non-URL src)
  // Match img tags with .jpg, .png, .jpeg that don't start with http
  fixed = fixed.replace(/<img[^>]*src="(?!http)[^"]*\.(jpg|png|jpeg|gif|webp)"[^>]*>/gi, '');
  
  // Also remove img tags with relative paths
  fixed = fixed.replace(/<img[^>]*src="[^"]*image[^"]*"[^>]*>/gi, '');
  fixed = fixed.replace(/<img[^>]*src="\/[^"]*"[^>]*>/gi, '');
  
  // 2. Ensure proper head section with meta tags
  if (!fixed.includes('<meta name="description"')) {
    fixed = fixed.replace('<head>', `<head>
    <meta name="description" content="Official ${brandName} landing page">`);
  }
  
  // 3. Ensure proper section structure
  if (!fixed.includes('id="hero"') && fixed.includes('<section')) {
    fixed = fixed.replace(/<section[^>]*>/, '<section id="hero" class="hero">');
  }
  
  // 4. Add missing footer if not present
  if (!fixed.includes('<footer')) {
    fixed = fixed.replace('</body>', `
    <footer class="bg-gray-900 text-white py-8 text-center">
      <p>&copy; 2024 ${brandName}. All rights reserved.</p>
    </footer>
  </body>`);
  }
  
  // 5. AGGRESSIVELY fix body background - NEVER use brand color for entire body
  // Replace ANY bg-[#XXXXXX] on body with neutral light background
  fixed = fixed.replace(/body class="[^"]*bg-\[#([0-9A-Fa-f]{6})\[^"]*"/, 'body class="bg-gray-50 text-gray-900"');
  fixed = fixed.replace(/<body[^>]*class="[^"]*bg-\[#([0-9A-Fa-f]{6})[^"]*"[^>]*>/, '<body class="bg-gray-50 text-gray-900">');
  
  // 6. Ensure proper container max-width
  if (!fixed.includes('max-w-') && fixed.includes('container')) {
    fixed = fixed.replace('container mx-auto', 'container mx-auto max-w-6xl');
  }
  
  // 7. Add responsive padding
  fixed = fixed.replace(/class="container mx-auto p-4"/, 'class="container mx-auto px-4 py-8 md:py-12"');
  
  // 8. Fix stats section - should always be white background
  // Replace stats section background with white if it's a brand color
  fixed = fixed.replace(/<section[^>]*>\s*<div[^>]*>\s*<h2[^>]*>Trusted by Thousands<\/h2>/gi, 
    '<section class="py-20 bg-white">\n    <div class="max-w-6xl mx-auto px-6">\n      <div class="text-center mb-16">\n        <h2 class="text-3xl font-bold text-gray-900 mb-4">Trusted by Thousands</h2>');
  
  // 9. Fix brand name duplicated in title
  const brandNameLower = brandName.toLowerCase();
  const duplicatePattern = new RegExp(`(${brandNameLower})\\s*[-:]\\s*\\1`, 'gi');
  fixed = fixed.replace(duplicatePattern, brandName);
  
  return fixed;
};

// Check for specific issues
export const checkHtmlIssues = (html: string): string[] => {
  const issues: string[] = [];
  
  // Check for broken images
  if (html.match(/image\d+\.(jpg|png)/i)) {
    issues.push('broken_image_references');
  }
  
  // Check for missing meta description
  if (!html.includes('<meta name="description"')) {
    issues.push('missing_meta_description');
  }
  
  // Check for missing footer
  if (!html.includes('<footer')) {
    issues.push('missing_footer');
  }
  
  // Check for poor body background (entire page is brand color)
  const bodyMatch = html.match(/body class="bg-\[#([0-9A-Fa-f]+)"]/);
  if (bodyMatch && bodyMatch[1].length === 6) {
    issues.push('poor_body_background');
  }
  
  // Check for missing sections
  if (!html.includes('id="hero"') && !html.includes('class="hero"')) {
    issues.push('missing_hero_section_id');
  }
  
  return issues;
};

// Ensure proper layout with correct colors
export const enforceProperLayout = (html: string, brandColors: {
  primary: string;
  accent: string;
  light: string;
  dark: string;
}): string => {
  let fixed = html;
  
  // AGGRESSIVE: Use light background for body - NEVER brand color
  fixed = fixed.replace(/body class="h-screen bg-\[#([0-9A-Fa-f]+)"]/, 'body class="bg-gray-50 text-gray-900"');
  fixed = fixed.replace(/<body[^>]*>/, '<body class="bg-gray-50 text-gray-900">');
  
  // Header should be white or primary color (not brand brand color on brand color)
  fixed = fixed.replace(/<header class="[^"]*bg-\[#([0-9A-Fa-f]+)[^"]*">/, `<header class="bg-white shadow-sm">`);
  
  // Hero section should have proper contrast - use white cards on brand color backgrounds
  // But first fix that body was set to brand color
  if (fixed.includes('bg-[#FF3008]')) {
    // Replace hero background brand color with white
    fixed = fixed.replace(/class="hero[^"]*bg-\[#FF3008\][^"]*"/, 'class="bg-white p-8 md:p-12"');
    fixed = fixed.replace(/section class="hero[^"]*bg-\[#FF3008\][^"]*"/, 'section class="bg-white p-8 md:p-12"');
  }
  
  // Use accent for CTA buttons (on white background)
  fixed = fixed.replace(/<a[^>]*class="primary-cta[^"]*bg-\[#FFFFFF\][^"]*"[^>]*>/, `<a class="primary-cta bg-[${brandColors.accent}] text-white"`);
  fixed = fixed.replace(/<button[^>]*class="bg-\[#FFFFFF\][^"]*"[^>]*>/, `<button class="bg-[${brandColors.accent}] text-white"`);
  
  return fixed;
};

// FINAL CLEANUP - Ultra aggressive post-processing
export const finalCleanup = (html: string, brandName: string = 'Brand'): string => {
  let fixed = html;
  
  // Remove ALL img tags that don't have https:// src
  fixed = fixed.replace(/<img[^>]*src="(?!https:\/\/)[^"]*"[^>]*\/?>/gi, '');
  
  // Force body to be light gray with dark text
  fixed = fixed.replace(/<body[^>]*>/, '<body class="bg-gray-50 text-gray-900">');
  
  // Fix any remaining brand color backgrounds on body to be light
  fixed = fixed.replace(/body class="[^"]*bg-\[#/, 'body class="bg-gray-50 text-gray-900');
  
  // ALWAYS add footer if missing
  if (!fixed.toLowerCase().includes('<footer')) {
    fixed = fixed.replace('</body>', `
    <footer class="bg-gray-900 text-white py-8">
      <div class="container mx-auto px-4 text-center">
        <p class="text-sm">&copy; 2024 ${brandName}. All rights reserved.</p>
      </div>
    </footer>
  </body>`);
  }
  
  return fixed;
};

export default {
  validateAndFixHtml,
  checkHtmlIssues,
  enforceProperLayout,
  finalCleanup
};