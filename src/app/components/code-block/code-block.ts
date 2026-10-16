// COMPONENT TYPE: Presentational
// SECTION: Shared UI Components
//
// ROLE:
// - Display code snippets with syntax highlighting
// - Support multiple languages (TypeScript, JavaScript, HTML, CSS, JSON)
// - Provide copy-to-clipboard functionality
//
// PATTERNS USED:
// - Pure presentational component with @Input() only
// - Custom syntax highlighting implementation (token-based)
// - DomSanitizer for safe HTML rendering
// - Signal for copy feedback state
//
// NOTES FOR CONTRIBUTORS:
// - Syntax highlighting is custom-built, not library-based
// - Add new languages by extending getPatterns() method
// - Keep token patterns in order (most specific to least specific)
// - Sanitize all HTML to prevent XSS attacks

import { Component, Input, signal, inject, ChangeDetectionStrategy } from '@angular/core';

import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Icon } from '../icon/icon';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [Icon],
  templateUrl: './code-block.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./code-block.scss'],
})
export class CodeBlock {
  @Input() code = '';
  @Input() language: 'typescript' | 'javascript' | 'html' | 'css' | 'json' = 'typescript';

  private sanitizer = inject(DomSanitizer);
  copied = signal(false);

  get highlightedCode(): SafeHtml {
    const highlighted = this.highlightCode(this.code, this.language);
    return this.sanitizer.bypassSecurityTrustHtml(highlighted);
  }

  async copyCode(): Promise<void> {
    await navigator.clipboard.writeText(this.code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  private highlightCode(code: string, language: string): string {
    // Escape HTML first
    let escaped = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Get patterns for the language
    const patterns = this.getPatterns(language);

    // Create tokens with positions
    const tokens: Array<{ start: number; end: number; className: string; text: string }> = [];

    patterns.forEach(({ regex, className }) => {
      const matches = escaped.matchAll(new RegExp(regex.source, regex.flags));
      for (const match of matches) {
        if (match.index !== undefined) {
          // Check if this position is already covered by a token
          const overlaps = tokens.some(
            (token) =>
              (match.index! >= token.start && match.index! < token.end) ||
              (match.index! + match[0].length > token.start && match.index! < token.end),
          );

          if (!overlaps) {
            tokens.push({
              start: match.index,
              end: match.index + match[0].length,
              className,
              text: match[0],
            });
          }
        }
      }
    });

    // Sort tokens by start position
    tokens.sort((a, b) => a.start - b.start);

    // Build highlighted string
    let result = '';
    let lastIndex = 0;

    tokens.forEach((token) => {
      // Add text before token
      result += escaped.substring(lastIndex, token.start);
      // Add highlighted token
      result += `<span class="${token.className}">${token.text}</span>`;
      lastIndex = token.end;
    });

    // Add remaining text
    result += escaped.substring(lastIndex);

    return result;
  }

  private getPatterns(language: string) {
    const typescript = [
      // Comments (highest priority)
      {
        regex: /\/\/.*$/gm,
        className: 'code-comment',
      },
      {
        regex: /\/\*[\s\S]*?\*\//g,
        className: 'code-comment',
      },
      // Strings
      {
        regex: /"(?:\\.|[^"\\])*"/g,
        className: 'code-string',
      },
      {
        regex: /'(?:\\.|[^'\\])*'/g,
        className: 'code-string',
      },
      {
        regex: /`(?:\\.|[^`\\])*`/g,
        className: 'code-string',
      },
      // Decorators
      {
        regex: /@\w+/g,
        className: 'code-decorator',
      },
      // Keywords
      {
        regex:
          /\b(?:class|interface|type|enum|extends|implements|constructor|public|private|protected|readonly|static|async|await|return|const|let|var|function|if|else|for|while|switch|case|break|continue|new|this|super|export|import|from|default|as)\b/g,
        className: 'code-keyword',
      },
      // Types
      {
        regex:
          /\b(?:string|number|boolean|any|void|null|undefined|never|unknown|object|Array|Promise|Observable|Subject|BehaviorSubject)\b/g,
        className: 'code-type',
      },
      // Functions (before classes to take precedence)
      {
        regex: /\b[a-z_]\w*(?=\s*\()/g,
        className: 'code-function',
      },
      // Classes
      {
        regex: /\b[A-Z]\w*/g,
        className: 'code-class',
      },
      // Numbers
      {
        regex: /\b\d+\.?\d*\b/g,
        className: 'code-number',
      },
    ];

    const html = [
      // Comments
      {
        regex: /&lt;!--[\s\S]*?--&gt;/g,
        className: 'code-comment',
      },
      // Strings
      {
        regex: /"(?:\\.|[^"\\])*"/g,
        className: 'code-string',
      },
      {
        regex: /'(?:\\.|[^'\\])*'/g,
        className: 'code-string',
      },
      // Angular control flow
      {
        regex: /@(?:if|for|switch|case|else)\b/g,
        className: 'code-angular-control',
      },
      // Angular bindings
      {
        regex: /\[[^\]]+\]/g,
        className: 'code-angular-binding',
      },
      // Angular events
      {
        regex: /\([^)]+\)/g,
        className: 'code-angular-event',
      },
      // Tags
      {
        regex: /&lt;\/?[\w-]+/g,
        className: 'code-tag',
      },
      {
        regex: /\/?&gt;/g,
        className: 'code-tag',
      },
      // Attributes
      {
        regex: /\s[\w-]+(?==)/g,
        className: 'code-attr-name',
      },
    ];

    const css = [
      // Comments
      {
        regex: /\/\*[\s\S]*?\*\//g,
        className: 'code-comment',
      },
      // Strings
      {
        regex: /"(?:\\.|[^"\\])*"/g,
        className: 'code-string',
      },
      {
        regex: /'(?:\\.|[^'\\])*'/g,
        className: 'code-string',
      },
      // Selectors (before braces)
      {
        regex: /[.#]?[\w-]+(?=\s*\{)/g,
        className: 'code-selector',
      },
      // Properties
      {
        regex: /[\w-]+(?=\s*:)/g,
        className: 'code-property',
      },
      // Values with units
      {
        regex: /\b\d+\.?\d*(?:px|em|rem|%|vh|vw|fr|deg|s|ms)?\b/g,
        className: 'code-number',
      },
      // Color values
      {
        regex: /#[0-9a-fA-F]{3,6}\b/g,
        className: 'code-value',
      },
    ];

    const json = [
      // Property keys
      {
        regex: /"[^"]+"\s*(?=:)/g,
        className: 'code-property',
      },
      // String values
      {
        regex: /:\s*"[^"]*"/g,
        className: 'code-string',
      },
      // Boolean and null
      {
        regex: /\b(?:true|false|null)\b/g,
        className: 'code-keyword',
      },
      // Numbers
      {
        regex: /:\s*-?\d+\.?\d*/g,
        className: 'code-number',
      },
    ];

    const patterns: Record<string, any[]> = {
      typescript,
      javascript: typescript,
      html,
      css,
      json,
    };

    return patterns[language] || typescript;
  }
}
