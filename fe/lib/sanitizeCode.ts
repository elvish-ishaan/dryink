const BLOCKED_PATTERNS = [
  'document.cookie',
  'localStorage',
  'sessionStorage',
  'eval(',
  'new Function(',
  'import(',
  'fetch(',
  'XMLHttpRequest',
  'WebSocket',
  'window.location=',
  'window.open(',
];

const BLOCKED_TAGS = [
  /<meta[^>]+http-equiv\s*=\s*["']refresh["'][^>]*>/gi,
  /<form[\s>]/gi,
];

const ALLOWED_SCRIPT_SRC = /src=["']https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/p5\.js\//;

export function sanitizeAnimationCode(html: string): string {
  // Block dangerous patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (html.includes(pattern)) {
      return `<html><body><p style="color:red;font-family:sans-serif;padding:20px;">
        Animation blocked: contains disallowed pattern "${pattern}"
      </p></body></html>`;
    }
  }

  // Strip blocked tags
  let sanitized = html;
  for (const tag of BLOCKED_TAGS) {
    sanitized = sanitized.replace(tag, '');
  }

  // Check external script sources — only p5.js CDN allowed
  const scriptSrcMatches = sanitized.match(/<script[^>]+src=["'][^"']+["'][^>]*>/g) || [];
  for (const scriptTag of scriptSrcMatches) {
    if (!ALLOWED_SCRIPT_SRC.test(scriptTag)) {
      return `<html><body><p style="color:red;font-family:sans-serif;padding:20px;">
        Animation blocked: external script source not allowed
      </p></body></html>`;
    }
  }

  // Inject CSS to remove scrollbars and fill the iframe viewport
  const styleTag = '<style>html,body{margin:0;padding:0;overflow:hidden;width:100%;height:100%;}</style>';
  if (sanitized.includes('</head>')) {
    sanitized = sanitized.replace('</head>', styleTag + '</head>');
  } else {
    sanitized = styleTag + sanitized;
  }

  // Inject play/pause message listener (parent sends 'pause' / 'play' via postMessage)
  const controlScript = '<scr' + 'ipt>window.addEventListener("message",function(e){if(e.data==="pause"){if(typeof noLoop==="function")noLoop();}else if(e.data==="play"){if(typeof loop==="function")loop();}});</scr' + 'ipt>';
  const lastBody = sanitized.lastIndexOf('</body>');
  if (lastBody !== -1) {
    sanitized = sanitized.slice(0, lastBody) + controlScript + sanitized.slice(lastBody);
  } else {
    sanitized += controlScript;
  }

  return sanitized;
}
