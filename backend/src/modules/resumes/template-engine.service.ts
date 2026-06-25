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
    const html = this.interpolate(htmlTemplate, data);
    
    // Add edit mode styles and script
    const editStyles = `
      <style>
        [data-field]:hover { outline: 2px dashed #3b82f6; outline-offset: 2px; cursor: text; }
        [data-field]:focus { outline: 2px solid #3b82f6 !important; background: #eff6ff !important; outline-offset: 2px; }
        [data-field] { position: relative; transition: all 0.2s ease-in-out; min-height: 1em; display: inline-block; min-width: 20px; }
        [data-field]:empty::before {
            content: "Nhập " attr(data-field) "...";
            color: #9ca3af;
            font-style: italic;
            pointer-events: none;
        }
        /* Highlight sections */
        [data-repeat] { position: relative; border: 1px dashed transparent; }
        [data-repeat]:hover { border-color: #cbd5e1; }
      </style>
    `;

    const editScript = `
      <script>
        function initEditor() {
          // Make all data-field elements contenteditable
          document.querySelectorAll('[data-field]').forEach(function(el) {
            if (el.dataset.editorInitialized) return;
            el.dataset.editorInitialized = "true";
            el.setAttribute('contenteditable', 'true');
            el.setAttribute('spellcheck', 'false');
            
            // Listen to input events for live syncing back to React
            let timeout = null;
            el.addEventListener('input', function(e) {
              clearTimeout(timeout);
              timeout = setTimeout(() => {
                window.parent.postMessage({
                  type: 'cv-update-field',
                  field: el.dataset.field,
                  value: el.innerText
                }, '*');
              }, 300); // debounce 300ms
            });

            // Focus event to tell React which field is active
            el.addEventListener('focus', function(e) {
              window.parent.postMessage({
                type: 'cv-focus-field',
                field: el.dataset.field
              }, '*');
            });
          });

          // Listen for messages from React parent to update iframe DOM
          window.addEventListener('message', function(event) {
            if (event.data?.type === 'cv-sync-data') {
               const { field, value } = event.data;
               const el = document.querySelector('[data-field="' + field + '"]');
               if (el && el.innerText !== value) {
                   if (document.activeElement !== el) {
                      el.innerText = value || '';
                   }
               }
            }
          });
        }

        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', initEditor);
        } else {
          initEditor();
        }
        // Fallback for doc.write() in iframes which might swallow the event
        setTimeout(initEditor, 100);
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
  private wrapInDocument(html: string, css: string, extraTags: string = ''): string {
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
</head>
<body>
  ${html}
  ${extraTags}
</body>
</html>`;
  }
}
