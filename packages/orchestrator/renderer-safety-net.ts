import * as DOMPurify from 'isomorphic-dompurify';

export interface RenderSafetyResult {
  safeHtml: string;
  warnings: string[];
  sanitized: boolean;
  securityScore: number;
}

export class RendererSafetyNet {
  sanitizeHtml(html: string): RenderSafetyResult {
    const warnings: string[] = [];
    let securityScore = 100;

    const dangerousPatterns = [
      { pattern: /<script[^>]*>.*?<\/script>/gi, type: 'script_tags', severity: 'high' },
      { pattern: /javascript:/gi, type: 'javascript_urls', severity: 'high' },
      { pattern: /on\w+\s*=/gi, type: 'event_handlers', severity: 'medium' },
      { pattern: /<iframe[^>]*>/gi, type: 'iframes', severity: 'medium' },
      { pattern: /<object[^>]*>/gi, type: 'object_tags', severity: 'high' },
      { pattern: /<embed[^>]*>/gi, type: 'embed_tags', severity: 'medium' }
    ];

    for (const { pattern, type, severity } of dangerousPatterns) {
      const matches = html.match(pattern);
      if (matches) {
        warnings.push(`${severity}: Found ${matches.length} ${type.replace(/_/g, ' ')}`);
        securityScore -= severity === 'high' ? 20 : 10;
      }
    }

    const safeHtml = DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'p', 'br', 'strong', 'em', 'u', 'strike',
        'ul', 'ol', 'li',
        'a', 'img', 'div', 'span',
        'button', 'input', 'form', 'label',
        'section', 'article', 'header', 'footer', 'nav',
        'table', 'thead', 'tbody', 'tr', 'th', 'td'
      ],
      ALLOWED_ATTR: [
        'href', 'src', 'alt', 'title', 'class', 'id',
        'type', 'value', 'name', 'placeholder',
        'style', 'data-*'
      ],
      ALLOW_DATA_ATTR: true
    });

    const sanitized = safeHtml !== html;

    return {
      safeHtml,
      warnings,
      sanitized,
      securityScore: Math.max(0, securityScore)
    };
  }

  validateComponentStructure(components: any[]): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    for (const component of components) {
      if (!component.type) {
        issues.push(`Component missing type: ${JSON.stringify(component)}`);
      }

      if (!component.content && !component.children) {
        issues.push(`Component missing content: ${component.type}`);
      }

      if (component.children) {
        const childValidation = this.validateComponentStructure(component.children);
        issues.push(...childValidation.issues);
      }
    }

    return {
      valid: issues.length === 0,
      issues
    };
  }

  async safeRender(components: any[]): Promise<RenderSafetyResult> {
    const structureValidation = this.validateComponentStructure(components);
    if (!structureValidation.valid) {
      return {
        safeHtml: '',
        warnings: ['Component structure validation failed', ...structureValidation.issues],
        sanitized: true,
        securityScore: 0
      };
    }

    let html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>Landing Page</title></head><body>';

    for (const component of components) {
      switch (component.type) {
        case 'hero':
          html += `<section class="hero"><h1>${component.content?.title || ''}</h1><p>${component.content?.subtitle || ''}</p></section>`;
          break;
        case 'features':
          html += `<section class="features"><h2>${component.content?.title || ''}</h2><ul>`;
          if (component.content?.items) {
            for (const item of component.content.items) {
              html += `<li>${item}</li>`;
            }
          }
          html += '</ul></section>';
          break;
        default:
          html += `<div class="component">${component.content || ''}</div>`;
      }
    }

    html += '</body></html>';

    return this.sanitizeHtml(html);
  }
}