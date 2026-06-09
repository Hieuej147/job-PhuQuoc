import { Injectable } from '@nestjs/common';

export interface ResumeData {
  name?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  degree?: string;
  summary?: string;
  skills?: string;
  languages?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  education?: Array<{
    school: string;
    degree: string;
    field: string;
    startYear: string;
    endYear: string;
    GPA?: string;
    description?: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    startYear: string;
    endYear: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    position?: string;
    link?: string;
    description?: string;
  }>;
}

@Injectable()
export class TemplateEngineService {
  /**
   * Render template với data cho view mode (không có edit)
   */
  renderForView(htmlTemplate: string, cssTemplate: string, data: ResumeData): string {
    const rendered = this.interpolate(htmlTemplate, data);
    return this.wrapInDocument(rendered, cssTemplate);
  }

  /**
   * Render template với data cho edit mode (có inline edit)
   */
  renderForEdit(htmlTemplate: string, cssTemplate: string, data: ResumeData): string {
    // Inject editable markers
    let html = this.interpolate(htmlTemplate, data);
    
    // Add edit mode styles and script
    const editStyles = `
      <style>
        [data-field]:hover { outline: 2px solid #3b82f6; outline-offset: 2px; cursor: pointer; }
        [data-field]:hover::after { 
          content: '✏️'; 
          position: absolute; 
          top: -20px; 
          right: 0; 
          font-size: 12px;
        }
        [data-field] { position: relative; }
        .editing { outline: 2px solid #3b82f6 !important; background: #eff6ff !important; }
      </style>
    `;

    const editScript = `
      <script>
        document.addEventListener('click', function(e) {
          var field = e.target.closest('[data-field]');
          if (field) {
            e.preventDefault();
            e.stopPropagation();
            window.parent.postMessage({
              type: 'cv-edit-field',
              field: field.dataset.field,
              value: field.textContent.trim(),
              rect: field.getBoundingClientRect()
            }, '*');
          }
        });
        
        // Highlight editable fields on hover
        document.querySelectorAll('[data-field]').forEach(function(el) {
          el.title = 'Click để chỉnh sửa';
        });
      </script>
    `;

    return this.wrapInDocument(html, cssTemplate, editStyles + editScript);
  }

  /**
   * Replace {{field}} với data values
   */
  private interpolate(html: string, data: ResumeData): string {
    // Handle simple fields first
    let result = html.replace(/\{\{name\}\}/g, data.name || '');
    result = result.replace(/\{\{email\}\}/g, data.email || '');
    result = result.replace(/\{\{phone\}\}/g, data.phone || '');
    result = result.replace(/\{\{avatar\}\}/g, data.avatar || '');
    result = result.replace(/\{\{address\}\}/g, data.address || '');
    result = result.replace(/\{\{degree\}\}/g, data.degree || '');
    result = result.replace(/\{\{summary\}\}/g, data.summary || '');
    result = result.replace(/\{\{skills\}\}/g, data.skills || '');
    result = result.replace(/\{\{languages\}\}/g, data.languages || '');

    // Handle repeat sections (education, experience, projects)
    result = this.handleRepeatSection(result, 'education', data.education || []);
    result = this.handleRepeatSection(result, 'experience', data.experience || []);
    result = this.handleRepeatSection(result, 'projects', data.projects || []);

    return result;
  }

  /**
   * Xử lý data-repeat sections
   */
  private handleRepeatSection(html: string, sectionName: string, items: any[]): string {
    // Find the start of the repeat section
    const startMarker = `data-repeat="${sectionName}"`;
    const startIndex = html.indexOf(startMarker);
    
    if (startIndex === -1) {
      return html;
    }

    // Find the opening div
    let divStart = html.lastIndexOf('<div', startIndex);
    if (divStart === -1) return html;

    // Find the matching closing div by counting open/close tags
    let depth = 0;
    let divEnd = -1;
    let pos = divStart;
    
    while (pos < html.length) {
      const nextOpen = html.indexOf('<div', pos);
      const nextClose = html.indexOf('</div>', pos);
      
      if (nextClose === -1) break;
      
      if (nextOpen !== -1 && nextOpen < nextClose) {
        depth++;
        pos = nextOpen + 4;
      } else {
        depth--;
        if (depth === 0) {
          divEnd = nextClose + 6;
          break;
        }
        pos = nextClose + 6;
      }
    }

    if (divEnd === -1) return html;

    // Extract the template content (between opening and closing div)
    const fullMatch = html.substring(divStart, divEnd);
    const contentStart = fullMatch.indexOf('>') + 1;
    const contentEnd = fullMatch.lastIndexOf('</div>');
    const templateContent = fullMatch.substring(contentStart, contentEnd);

    if (!items || items.length === 0) {
      const emptyHtml = `<div data-repeat="${sectionName}"><p class="text-gray-400 text-sm italic">Chưa có thông tin</p></div>`;
      return html.substring(0, divStart) + emptyHtml + html.substring(divEnd);
    }

    // Render each item
    const renderedItems = items.map(item => {
      let itemHtml = templateContent;
      // Replace {{field}} trong item
      for (const [key, value] of Object.entries(item)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        itemHtml = itemHtml.replace(regex, String(value || ''));
      }
      // Replace remaining {{field}} với empty
      itemHtml = itemHtml.replace(/\{\{\w+\}\}/g, '');
      return itemHtml;
    }).join('');

    const result = `<div data-repeat="${sectionName}">${renderedItems}</div>`;
    return html.substring(0, divStart) + result + html.substring(divEnd);
  }

  /**
   * Wrap HTML trong full document với Tailwind CDN
   */
  private wrapInDocument(html: string, css: string, extraHead: string = ''): string {
    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; background: #f8fafc; }
    @media print {
      body { background: white; }
      .no-print { display: none !important; }
    }
    ${css}
  </style>
  ${extraHead}
</head>
<body>
  ${html}
</body>
</html>`;
  }
}
