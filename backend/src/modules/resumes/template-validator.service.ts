import { Injectable } from '@nestjs/common';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  sanitizedHtml: string;
  sanitizedCss: string;
}

@Injectable()
export class TemplateValidatorService {
  private readonly BLOCKED_HTML_PATTERNS = [
    /<script[\s>]/i,
    /<\/script/i,
    /javascript\s*:/i,
    /on\w+\s*=/i, // onclick, onerror, etc.
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /<form/i,
    /<input/i,
    /<button/i,
    /<select/i,
    /<textarea/i,
    /data\s*:/i, // data: URIs
    /vbscript\s*:/i,
  ];

  private readonly BLOCKED_CSS_PATTERNS = [
    /expression\s*\(/i,
    /@import/i,
    /url\s*\(/i,
    /behavior\s*:/i,
    /-moz-binding/i,
    /position\s*:\s*fixed/i, // Prevent overlay attacks
  ];

  private readonly MAX_HTML_SIZE = 100 * 1024; // 100KB
  private readonly MAX_CSS_SIZE = 50 * 1024; // 50KB

  validate(html: string, css: string): ValidationResult {
    const errors: string[] = [];

    // Check size
    if (html.length > this.MAX_HTML_SIZE) {
      errors.push(`HTML quá lớn (${Math.round(html.length / 1024)}KB, tối đa ${this.MAX_HTML_SIZE / 1024}KB)`);
    }
    if (css.length > this.MAX_CSS_SIZE) {
      errors.push(`CSS quá lớn (${Math.round(css.length / 1024)}KB, tối đa ${this.MAX_CSS_SIZE / 1024}KB)`);
    }

    // Check blocked HTML patterns
    for (const pattern of this.BLOCKED_HTML_PATTERNS) {
      if (pattern.test(html)) {
        errors.push(`HTML chứa pattern không an toàn: ${pattern.source}`);
      }
    }

    // Check blocked CSS patterns
    for (const pattern of this.BLOCKED_CSS_PATTERNS) {
      if (pattern.test(css)) {
        errors.push(`CSS chứa pattern không an toàn: ${pattern.source}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      sanitizedHtml: this.sanitizeHtml(html),
      sanitizedCss: this.sanitizeCss(css),
    };
  }

  private sanitizeHtml(html: string): string {
    // Remove any script tags that might have slipped through
    let sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, '');
    // Remove event handlers
    sanitized = sanitized.replace(/\son\w+\s*=\s*["'][^"']*["']/gi, '');
    // Remove javascript: URIs
    sanitized = sanitized.replace(/javascript\s*:/gi, '');
    return sanitized;
  }

  private sanitizeCss(css: string): string {
    // Remove @import
    let sanitized = css.replace(/@import[^;]+;/gi, '');
    // Remove url()
    sanitized = sanitized.replace(/url\s*\([^)]*\)/gi, '');
    // Remove expression()
    sanitized = sanitized.replace(/expression\s*\([^)]*\)/gi, '');
    return sanitized;
  }
}
