/* ============================================================
   playground.js — editable HTML/CSS/JS snippets that run in a
   sandboxed iframe. console.log output is relayed to the parent.
   ============================================================ */
window.Playground = (function () {
  'use strict';

  const SHIM = [
    '<script>(function(){',
    'function send(level,args){try{parent.postMessage({__pg:1,id:ID,level:level,',
    'text:Array.prototype.map.call(args,fmt).join(" ")},"*")}catch(e){}}',
    'function fmt(v){',
    ' if(typeof v==="string")return v;',
    ' if(v instanceof Error)return v.name+": "+v.message;',
    ' if(typeof v==="function")return v.toString().split("\\n")[0];',
    ' try{return JSON.stringify(v,function(k,val){return val===undefined?"undefined":val},1)',
    '   .replace(/\\n\\s*/g," ")}catch(e){return String(v)}}',
    'var raw=console.log,rw=console.warn,re=console.error;',
    'console.log=function(){send("log",arguments);raw.apply(console,arguments)};',
    'console.info=console.log;',
    'console.warn=function(){send("warn",arguments);rw.apply(console,arguments)};',
    'console.error=function(){send("err",arguments);re.apply(console,arguments)};',
    'window.onerror=function(m,s,l){send("err",[m+" (line "+(l-LINEOFF)+")"]);return false};',
    'window.addEventListener("unhandledrejection",function(e){send("err",["Unhandled promise rejection: "+e.reason])});',
    '})()<\/script>'
  ].join('');

  const BASE_CSS = '<style>html{color-scheme:light}body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;' +
                   'margin:14px;color:#14181f;line-height:1.55}' +
                   'body>*:first-child{margin-top:0}</style>';

  let seq = 0;
  const consoles = new Map();

  window.addEventListener('message', function (e) {
    const d = e.data;
    if (!d || !d.__pg) return;
    const el = consoles.get(d.id);
    if (!el) return;
    const ln = document.createElement('div');
    ln.className = 'ln' + (d.level === 'err' ? ' err' : d.level === 'warn' ? ' warn' : '');
    ln.textContent = d.text;
    el.appendChild(ln);
    el.scrollTop = el.scrollHeight;
  });

  /** Wrap raw snippet source into a full document for the iframe. */
  function buildDoc(code, lang, frameId) {
    let head = BASE_CSS;
    let body;
    if (lang === 'css') {
      // A CSS-only snippet gets a tiny demo body to style.
      body = '<style>' + code + '</style>' +
             '<div class="demo"><h3>Heading</h3><p>A paragraph of demo text. ' +
             '<a href="#">A link</a>.</p><button>A button</button></div>';
    } else if (lang === 'js') {
      body = '<pre id="out" style="font:13px/1.6 ui-monospace,Menlo,Consolas,monospace;white-space:pre-wrap"></pre>' +
             '<script>' + code + '<\/script>';
    } else {
      body = code;
    }
    const shim = SHIM.replace('ID', JSON.stringify(frameId)).replace('LINEOFF', '0');
    return '<!DOCTYPE html><html><head><meta charset="utf-8">' + head + shim + '</head><body>' + body + '</body></html>';
  }

  function create(host, opts) {
    const frameId = 'pg' + (++seq);
    const lang = opts.lang === 'javascript' ? 'js' : (opts.lang || 'html');
    const original = opts.code;

    host.className = 'pg';
    host.innerHTML =
      '<div class="pg-head"><span class="dot"></span><span class="pg-title">' +
        MD.esc(opts.title || (lang === 'js' ? 'JavaScript — editable' : lang === 'css' ? 'CSS — editable' : 'Live editor')) +
      '</span><div class="pg-actions">' +
        '<button class="pg-btn" type="button" data-reset>Reset</button>' +
        '<button class="pg-btn pg-btn-run" type="button" data-run>▶ Run</button>' +
      '</div></div>' +
      '<div class="pg-body">' +
        '<textarea class="pg-editor" spellcheck="false" aria-label="Editable code"></textarea>' +
        '<div class="pg-preview-wrap"><iframe class="pg-preview" title="Live preview" ' +
          // allow-same-origin is needed for the localStorage and cookie lessons to
          // run at all. Combined with allow-scripts it drops the origin barrier, so
          // snippets can reach this page — acceptable here because every snippet is
          // either first-party lesson content or code the learner typed themselves,
          // exactly like using the browser console.
          'sandbox="allow-scripts allow-same-origin allow-modals allow-forms allow-popups"></iframe></div>' +
      '</div>' +
      '<div class="pg-console" aria-live="polite" aria-label="Console output"></div>';

    const ta = host.querySelector('.pg-editor');
    const frame = host.querySelector('.pg-preview');
    const cons = host.querySelector('.pg-console');
    ta.value = original;
    consoles.set(frameId, cons);

    // Auto-size the editor to its content (within limits).
    function autosize() {
      ta.style.height = 'auto';
      ta.style.height = Math.min(460, Math.max(190, ta.scrollHeight + 4)) + 'px';
    }

    function run() {
      cons.innerHTML = '';
      frame.srcdoc = buildDoc(ta.value, lang, frameId);
    }

    host.querySelector('[data-run]').addEventListener('click', run);
    host.querySelector('[data-reset]').addEventListener('click', function () {
      ta.value = original; autosize(); run();
    });

    // Tab inserts two spaces instead of moving focus; Ctrl/Cmd+Enter runs.
    ta.addEventListener('keydown', function (e) {
      if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const s = ta.selectionStart, en = ta.selectionEnd;
        ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
        ta.selectionStart = ta.selectionEnd = s + 2;
      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault(); run();
      }
    });
    ta.addEventListener('input', autosize);

    autosize();
    run();
  }

  function destroyAll() { consoles.clear(); }

  return { create: create, destroyAll: destroyAll };
})();
