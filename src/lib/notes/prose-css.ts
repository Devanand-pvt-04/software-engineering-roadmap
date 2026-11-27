// Styles for rendered notes, shared by the app and by exported HTML / PDF / Word files.
// In the app the colours come from the theme variables; exports set light values for them.

export const PROSE_CSS = `
.nb-prose{font-size:15.5px;line-height:1.7;color:var(--text);overflow-wrap:anywhere}
.nb-prose>*:first-child{margin-top:0}
.nb-prose h1,.nb-prose h2,.nb-prose h3,.nb-prose h4{font-weight:700;line-height:1.3;margin:1.6em 0 .5em;letter-spacing:-.01em}
.nb-prose h1{font-size:1.6em}.nb-prose h2{font-size:1.3em;padding-bottom:.25em;border-bottom:1px solid var(--border)}.nb-prose h3{font-size:1.1em}.nb-prose h4{font-size:1em;color:var(--muted)}
.nb-prose p,.nb-prose ul,.nb-prose ol,.nb-prose blockquote,.nb-prose table,.nb-prose .nb-code,.nb-prose figure,.nb-prose details{margin:.7em 0}
.nb-prose ul,.nb-prose ol{padding-left:1.5em}.nb-prose ul{list-style:disc}.nb-prose ol{list-style:decimal}
.nb-prose li{margin:.2em 0}.nb-prose li>ul,.nb-prose li>ol{margin:.2em 0}
.nb-prose li.task-list-item{list-style:none;margin-left:-1.3em}
.nb-prose li.task-list-item input{margin-right:.5em;width:15px;height:15px;vertical-align:-2px;accent-color:var(--accent);cursor:pointer}
.nb-prose a{color:var(--accent);text-decoration:underline;text-underline-offset:2px}
.nb-prose a.nb-wiki{text-decoration:none;background:var(--accent-soft);padding:0 4px;border-radius:4px}
.nb-prose a.nb-tag{text-decoration:none;color:var(--accent);font-size:.9em}
.nb-prose hr{border:0;border-top:1px solid var(--border);margin:1.5em 0}
.nb-prose strong{font-weight:650}
.nb-prose mark{background:var(--warn-soft);color:inherit;padding:0 2px;border-radius:3px}
.nb-prose blockquote{border-left:3px solid var(--border);padding:.2em 0 .2em 1em;color:var(--muted)}
.nb-prose img.nb-img{max-width:100%;height:auto;border-radius:8px;border:1px solid var(--border);display:block;margin:.6em 0}
.nb-prose .nb-missing{color:var(--muted);font-size:.85em}
.nb-prose figure.nb-fig{margin:.8em 0}
.nb-prose figcaption{font-size:.85em;color:var(--muted);text-align:center;margin-top:.3em}
.nb-prose .nb-sketch{display:block;border:1px solid var(--border);border-radius:10px;background:var(--panel);color:var(--text);overflow:hidden;cursor:pointer}
.nb-prose .nb-sketch svg{display:block;width:100%;height:auto}
.nb-prose table{border-collapse:collapse;display:block;overflow-x:auto;max-width:100%;font-size:.94em}
.nb-prose th,.nb-prose td{border:1px solid var(--border);padding:6px 10px;text-align:left;vertical-align:top}
.nb-prose th{background:var(--panel-2);font-weight:600}
.nb-prose code{font-family:var(--font-mono),ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.88em;background:var(--panel-2);padding:1px 5px;border-radius:5px}
.nb-prose .nb-code{border:1px solid var(--border);border-radius:10px;overflow:hidden;background:var(--panel-2)}
.nb-prose .nb-code-head{display:flex;justify-content:space-between;align-items:center;padding:4px 10px;font-size:11px;color:var(--muted);border-bottom:1px solid var(--border);font-family:var(--font-mono),ui-monospace,monospace;text-transform:lowercase}
.nb-prose .nb-code-head button{font-size:11px;padding:1px 6px;border-radius:5px;border:1px solid var(--border);background:var(--panel);color:var(--muted);cursor:pointer}
.nb-prose .nb-code-head button:hover{color:var(--text)}
.nb-prose pre{margin:0;padding:12px 14px;overflow-x:auto;font-size:13px;line-height:1.55}
.nb-prose pre code{background:none;padding:0;font-size:inherit;white-space:pre}
.nb-prose .nb-mermaid{border:1px solid var(--border);border-radius:10px;padding:12px;background:var(--panel);overflow-x:auto;text-align:center}
.nb-prose .nb-mermaid svg{max-width:100%;height:auto}
.nb-prose .nb-pending{color:var(--muted);text-align:left;font-size:12px}
.nb-prose .nb-error{color:var(--danger);font-size:12px;white-space:pre-wrap;text-align:left}
.nb-prose .katex-display{overflow-x:auto;overflow-y:hidden;padding:.2em 0}
.nb-prose blockquote.nb-callout{border:1px solid var(--border);border-left:4px solid var(--accent);background:var(--accent-soft);color:var(--text);border-radius:8px;padding:.6em 1em}
.nb-prose blockquote.nb-callout>*:last-child{margin-bottom:0}
.nb-prose .nb-callout-title{font-weight:650;font-size:.82em;text-transform:uppercase;letter-spacing:.05em;color:var(--accent);margin-bottom:.2em}
.nb-prose .nb-callout-tip,.nb-prose .nb-callout-summary,.nb-prose .nb-callout-example{border-left-color:var(--ok);background:var(--ok-soft)}
.nb-prose .nb-callout-tip .nb-callout-title,.nb-prose .nb-callout-summary .nb-callout-title,.nb-prose .nb-callout-example .nb-callout-title{color:var(--ok)}
.nb-prose .nb-callout-warning,.nb-prose .nb-callout-important,.nb-prose .nb-callout-question{border-left-color:var(--warn);background:var(--warn-soft)}
.nb-prose .nb-callout-warning .nb-callout-title,.nb-prose .nb-callout-important .nb-callout-title,.nb-prose .nb-callout-question .nb-callout-title{color:var(--warn)}
.nb-prose .nb-callout-caution{border-left-color:var(--danger)}.nb-prose .nb-callout-caution .nb-callout-title{color:var(--danger)}
.nb-prose .nb-callout-interview{border-left-color:var(--java);background:var(--java-soft)}.nb-prose .nb-callout-interview .nb-callout-title{color:var(--java)}
.nb-prose details.nb-card{border:1px solid var(--border);border-radius:10px;background:var(--panel);overflow:hidden}
.nb-prose details.nb-card>summary{list-style:none;cursor:pointer;padding:.6em 1em;display:flex;gap:1em;justify-content:space-between;align-items:baseline}
.nb-prose details.nb-card>summary::-webkit-details-marker{display:none}
.nb-prose .nb-card-q{font-weight:600}.nb-prose .nb-card-q>p{margin:0}
.nb-prose .nb-card-q::before{content:"Q";display:inline-block;font-size:10px;font-weight:700;color:var(--accent);background:var(--accent-soft);border-radius:4px;padding:1px 5px;margin-right:.5em;vertical-align:2px}
.nb-prose .nb-card-hint{font-size:12px;color:var(--muted);white-space:nowrap}
.nb-prose details[open].nb-card .nb-card-hint{visibility:hidden}
.nb-prose .nb-card-a{border-top:1px dashed var(--border);padding:.4em 1em .5em;background:var(--panel-2)}
.nb-prose .nb-card-a>*:first-child{margin-top:.3em}
.nb-prose .footnotes{font-size:.88em;color:var(--muted)}
.nb-prose .hljs-keyword,.nb-prose .hljs-selector-tag,.nb-prose .hljs-built_in,.nb-prose .hljs-type{color:var(--hl-kw,#cf222e)}
.nb-prose .hljs-string,.nb-prose .hljs-attr,.nb-prose .hljs-template-string,.nb-prose .hljs-regexp{color:var(--hl-str,#0a3069)}
.nb-prose .hljs-number,.nb-prose .hljs-literal,.nb-prose .hljs-symbol{color:var(--hl-num,#0550ae)}
.nb-prose .hljs-comment,.nb-prose .hljs-quote{color:var(--hl-com,#6e7781);font-style:italic}
.nb-prose .hljs-title,.nb-prose .hljs-title.function_,.nb-prose .hljs-section{color:var(--hl-fn,#8250df)}
.nb-prose .hljs-meta,.nb-prose .hljs-variable,.nb-prose .hljs-params,.nb-prose .hljs-property{color:var(--hl-var,#953800)}
.nb-prose .hljs-addition{color:var(--ok)}.nb-prose .hljs-deletion{color:var(--danger)}
`;

/** Light theme values for exported files. */
export const EXPORT_VARS = `:root{--bg:#fff;--panel:#fff;--panel-2:#f4f4f1;--border:#e2e2dc;--text:#1b1b18;--muted:#62625a;--accent:#2f6fed;--accent-soft:#eef3fe;--ok:#2b8a3e;--ok-soft:#eaf6ed;--warn:#9a6700;--warn-soft:#fdf6e3;--danger:#c92a2a;--java:#d9480f;--java-soft:#fdf0e8}`;

export const EXPORT_PAGE_CSS = `
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font-family:ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.nb-doc{max-width:820px;margin:0 auto;padding:40px 28px 80px}
.nb-doc-head{border-bottom:1px solid var(--border);margin-bottom:28px;padding-bottom:12px}
.nb-doc-head h1{margin:0;font-size:28px;letter-spacing:-.02em}
.nb-doc-head p{margin:.4em 0 0;color:var(--muted);font-size:13px}
.nb-toc{font-size:14px;margin:0 0 32px;padding:14px 18px;border:1px solid var(--border);border-radius:10px;background:var(--panel-2)}
.nb-toc ol{margin:.3em 0 0;padding-left:1.3em}
.nb-note{margin-bottom:48px}
.nb-note+.nb-note{border-top:2px solid var(--border);padding-top:32px}
.nb-note-title{font-size:24px;margin:0 0 .2em;letter-spacing:-.015em}
.nb-meta{font-size:12.5px;color:var(--muted);margin:0 0 1.2em;display:flex;flex-wrap:wrap;gap:6px 12px}
.nb-meta span.tag{background:var(--panel-2);border:1px solid var(--border);border-radius:99px;padding:0 8px}
.nb-prose details.nb-card .nb-card-hint{display:none}
@media print{
  .nb-doc{padding:0;max-width:none}
  .nb-note{break-before:page;border:0!important;padding-top:0!important}
  .nb-note:first-of-type{break-before:auto}
  .nb-prose pre,.nb-prose .nb-code,.nb-prose figure,.nb-prose img,.nb-prose details,.nb-prose table,.nb-prose .nb-mermaid{break-inside:avoid}
  .nb-prose h1,.nb-prose h2,.nb-prose h3{break-after:avoid}
  .nb-prose pre code{white-space:pre-wrap}
  a{color:inherit}
}
@page{margin:16mm 14mm}
`;
