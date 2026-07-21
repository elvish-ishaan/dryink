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

  // Inject CSS to remove scrollbars and keep the whole sketch inside the iframe.
  // Sketches size their canvas independently (often larger than the preview pane),
  // so we center the body and scale the canvas down to fit while preserving its
  // aspect ratio — the full animation stays visible instead of being clipped.
  const styleTag =
    '<style>' +
    'html,body{margin:0;padding:0;overflow:hidden;width:100%;height:100%;}' +
    'body{display:flex;align-items:center;justify-content:center;}' +
    'canvas{max-width:100%!important;max-height:100%!important;width:auto!important;height:auto!important;object-fit:contain;display:block;}' +
    '</style>';
  if (sanitized.includes('</head>')) {
    sanitized = sanitized.replace('</head>', styleTag + '</head>');
  } else {
    sanitized = styleTag + sanitized;
  }

  // Inject the playback driver. Generated sketches call noLoop() and expose
  // window.setFrame(n) / window.getTotalFrames(); they do NOT self-animate.
  // This driver advances setFrame() in a requestAnimationFrame loop at the same
  // fps used for export (24) so the live preview actually plays, and wires the
  // parent's 'pause' / 'play' postMessages to stop/resume the loop.
  const driver = [
    '(function(){',
    '  var FPS = 24, interval = 1000 / FPS;',
    '  var frame = 0, rafId = null, playing = true, lastTime = 0;',
    '  function tick(now){',
    '    if(!playing){ rafId = null; return; }',
    '    rafId = requestAnimationFrame(tick);',
    '    if(now - lastTime < interval) return;',
    '    lastTime = now;',
    '    if(typeof window.setFrame === "function"){',
    '      var total = (typeof window.getTotalFrames === "function") ? window.getTotalFrames() : 240;',
    '      if(!total || total < 1) total = 240;',
    '      window.setFrame(frame % total);',
    '      frame++;',
    '    }',
    '  }',
    '  function start(){ if(rafId) return; playing = true; lastTime = 0; rafId = requestAnimationFrame(tick); }',
    '  function stop(){ playing = false; if(rafId){ cancelAnimationFrame(rafId); rafId = null; } }',
    '  window.addEventListener("message", function(e){',
    '    if(e.data === "pause") stop();',
    '    else if(e.data === "play") start();',
    '  });',
    '  var tries = 0;',
    '  function waitAndStart(){',
    '    if(typeof window.setFrame === "function"){ start(); return; }',
    '    if(tries++ < 100) setTimeout(waitAndStart, 50);', // give up after ~5s (self-animating sketch)
    '  }',
    '  if(document.readyState === "complete") waitAndStart();',
    '  else window.addEventListener("load", waitAndStart);',
    '})();',
  ].join('');
  const controlScript = '<scr' + 'ipt>' + driver + '</scr' + 'ipt>';
  const lastBody = sanitized.lastIndexOf('</body>');
  if (lastBody !== -1) {
    sanitized = sanitized.slice(0, lastBody) + controlScript + sanitized.slice(lastBody);
  } else {
    sanitized += controlScript;
  }

  return sanitized;
}
