import { renderMermaidSVG } from 'beautiful-mermaid';
import { Marked } from 'marked';
import sanitizeHtml from 'sanitize-html';
import { createHighlighter } from 'shiki';

/**
 * Escapes HTML special characters to prevent XSS attacks
 */
function escapeHtml(text: string): string {
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  };
  return text.replace(/[&<>"']/g, (char) => htmlEscapes[char]);
}

// Pre-initialize the Shiki highlighter at module level
const highlighterPromise = createHighlighter({
  themes: ['github-light', 'github-dark'],
  langs: [
    'python',
    'javascript',
    'typescript',
    'bash',
    'json',
    'yaml',
    'html',
    'css',
  ],
});

/**
 * Sanitization configuration for markdown HTML output
 * Allows common markdown elements while preventing XSS attacks
 */
const sanitizeOptions: sanitizeHtml.IOptions = {
  allowedTags: [
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'code',
    'pre',
    'ul',
    'ol',
    'li',
    'blockquote',
    'a',
    'img',
    'hr',
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    'div',
    'span',
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'loading', 'decoding', 'width', 'height'],
    h1: ['id'],
    h2: ['id'],
    h3: ['id'],
    h4: ['id'],
    h5: ['id'],
    h6: ['id'],
    code: ['class'],
    pre: ['class'],
    '*': ['class'], // Allow class on any element for styling
  },
  allowedSchemes: ['http', 'https', 'mailto', 'tel'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data'],
  },
  // Ensure href and src are valid URLs
  allowedSchemesAppliedToAttributes: ['href', 'src'],
};

/**
 * Parse markdown to HTML with sanitization
 * Wraps marked output to ensure XSS protection
 */
async function marked(content: string): Promise<string> {
  const highlighter = await highlighterPromise;
  const placeholders = new Map<string, string>();

  const parser = new Marked({
    renderer: {
      heading({ tokens, depth }) {
        const text = this.parser.parseInline(tokens);
        const id = text
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^\w-]/g, '');
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      },
      link({ href, title, tokens }) {
        const text = this.parser.parseInline(tokens);
        const escapedHref = escapeHtml(href || '');
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        if (href?.startsWith('http://') || href?.startsWith('https://')) {
          return `<a href="${escapedHref}"${titleAttr} target="_blank" rel="noopener noreferrer">${text}</a>`;
        }
        return `<a href="${escapedHref}"${titleAttr}>${text}</a>`;
      },
      image({ href, title, text }) {
        const escapedAlt = escapeHtml(text || 'Image');
        const escapedHref = escapeHtml(href || '');
        const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
        return `<img src="${escapedHref}" alt="${escapedAlt}"${titleAttr} loading="lazy" decoding="async" />`;
      },
      code({ text, lang }) {
        // 1. Mermaid rendering
        if (lang === 'mermaid') {
          try {
            const svg = renderMermaidSVG(text);
            const wrappedSvg = `<div class="mermaid-diagram">${svg}</div>`;
            const placeholderId = `mermaid-${Math.random().toString(36).substring(2, 11)}`;
            placeholders.set(placeholderId, wrappedSvg);
            return `@@@MERMAID_PLACEHOLDER_${placeholderId}@@@`;
          } catch (err) {
            console.error('Error rendering mermaid diagram:', err);
            return `<pre class="mermaid-error"><code>${escapeHtml(text)}</code></pre>`;
          }
        }

        // 2. Syntax highlighting for supported languages (or all if we want, fallback to default)
        const supportedLangs = [
          'python',
          'javascript',
          'typescript',
          'bash',
          'json',
          'yaml',
          'html',
          'css',
          'py',
          'js',
          'ts',
          'sh',
        ];
        const normalizedLang = lang ? lang.toLowerCase() : '';

        let shikiLang = normalizedLang;
        if (shikiLang === 'py') shikiLang = 'python';
        if (shikiLang === 'js') shikiLang = 'javascript';
        if (shikiLang === 'ts') shikiLang = 'typescript';
        if (shikiLang === 'sh') shikiLang = 'bash';

        if (shikiLang && supportedLangs.includes(shikiLang)) {
          try {
            const html = highlighter.codeToHtml(text, {
              lang: shikiLang,
              themes: {
                light: 'github-light',
                dark: 'github-dark',
              },
            });
            const placeholderId = `code-${Math.random().toString(36).substring(2, 11)}`;
            placeholders.set(placeholderId, html);
            return `@@@CODE_PLACEHOLDER_${placeholderId}@@@`;
          } catch (err) {
            console.error(`Error highlighting code for language ${lang}:`, err);
          }
        }

        // Fallback for plain/unsupported code blocks
        const escapedText = escapeHtml(text);
        const classAttr = lang ? ` class="language-${escapeHtml(lang)}"` : '';
        return `<pre><code${classAttr}>${escapedText}</code></pre>`;
      },
    },
  });

  const parsedHtml = await parser.parse(content);
  let sanitizedHtml = sanitizeHtml(parsedHtml, sanitizeOptions);

  // Restore placeholders
  for (const [placeholderId, originalContent] of placeholders.entries()) {
    if (placeholderId.startsWith('mermaid-')) {
      sanitizedHtml = sanitizedHtml.replace(
        `@@@MERMAID_PLACEHOLDER_${placeholderId}@@@`,
        originalContent,
      );
    } else if (placeholderId.startsWith('code-')) {
      sanitizedHtml = sanitizedHtml.replace(
        `@@@CODE_PLACEHOLDER_${placeholderId}@@@`,
        originalContent,
      );
    }
  }

  return sanitizedHtml;
}

export { marked };
