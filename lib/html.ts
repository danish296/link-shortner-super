import "server-only";
import { escapeHtml } from "./utils";

const LOGO = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
<rect width="32" height="32" rx="8" fill="#2f55f0"/>
<path d="M13.2 18.8a4.2 4.2 0 0 1 0-5.9l2.4-2.4a4.2 4.2 0 0 1 5.9 5.9l-1.2 1.2" stroke="white" stroke-width="2.1" stroke-linecap="round"/>
<path d="M18.8 13.2a4.2 4.2 0 0 1 0 5.9l-2.4 2.4a4.2 4.2 0 0 1-5.9-5.9l1.2-1.2" stroke="white" stroke-width="2.1" stroke-linecap="round"/>
<circle cx="24.5" cy="7.5" r="2.5" fill="#c9f94e"/>
</svg>`;

const BASE_CSS = `
:root{--bg:#050608;--card:#16181c;--line:rgba(170,176,189,.14);--ink:#eef0f4;--muted:#9aa1ae;
--input:#101216;--brand:#2f55f0;--brand-hover:#4064ff;--accent:#c9f94e;--bad:#ff6b81;color-scheme:dark}
@media (prefers-color-scheme: light){:root{--bg:#f6f7f9;--card:#eef0f3;--line:rgba(18,22,31,.12);--ink:#0a0e16;
--muted:#5b6679;--input:#fff;--brand:#2444d8;--brand-hover:#1b36b8;--accent:#4f6b00;--bad:#cf2f4d;color-scheme:light}}
*{box-sizing:border-box}
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;
font-family:Geist,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg);}
.card{width:100%;max-width:460px;background:var(--card);border:1px solid var(--line);
border-radius:16px;padding:32px;text-align:center}
.brand{display:flex;align-items:center;justify-content:center;gap:12px;font-weight:600;font-size:20px;letter-spacing:-.02em;margin-bottom:24px}
.brand span{color:var(--ink)}
h1{font-size:24px;letter-spacing:-.02em;margin:0 0 8px;font-weight:600;text-wrap:balance}
p{color:var(--muted);line-height:1.5;font-size:14px;margin:0 0 24px;text-wrap:pretty}
.badge{display:inline-flex;align-items:center;gap:8px;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;
letter-spacing:.08em;text-transform:uppercase;background:color-mix(in srgb,var(--accent) 14%,transparent);
border:1px solid color-mix(in srgb,var(--accent) 30%,transparent);color:var(--accent);margin-bottom:16px}
input{width:100%;padding:8px 12px;border-radius:12px;border:1px solid var(--line);background:var(--input);
color:var(--ink);font-size:14px;outline:none;margin-bottom:12px;font-family:inherit}
input:focus{border-color:var(--brand);box-shadow:0 0 0 3px color-mix(in srgb,var(--brand) 28%,transparent)}
button{width:100%;padding:8px 12px;border:none;border-radius:12px;font-size:14px;font-weight:600;cursor:pointer;color:#fff;
background:var(--brand);font-family:inherit}
button:hover{background:var(--brand-hover)}
.err{color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,transparent);
border:1px solid color-mix(in srgb,var(--bad) 30%,transparent);padding:12px;border-radius:12px;font-size:13px;margin-bottom:12px}
.foot{margin-top:24px;font-size:12px;color:var(--muted)}
.foot a{color:var(--muted);text-decoration:none}
.foot a:hover{color:var(--ink)}
.wrap{text-align:center}
.pulse{width:48px;height:48px;border-radius:50%;margin:0 auto 24px;border:3px solid color-mix(in srgb,var(--brand) 25%,transparent);
border-top-color:var(--brand);animation:spin 0.9s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
`;

function shell(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>${escapeHtml(title)} · LinkShort</title>
<meta name="robots" content="noindex"/>
<style>${BASE_CSS}</style></head>
<body><div class="card"><div class="brand">${LOGO}<span>LinkShort</span></div>${body}
<div class="foot">Protected by <a href="/">LinkShort</a></div></div></body></html>`;
}

export function renderErrorPage(options: {
  title: string;
  message: string;
  badge?: string;
}): string {
  return shell(
    options.title,
    `<div class="badge">${escapeHtml(options.badge ?? "Unavailable")}</div>
     <h1>${escapeHtml(options.title)}</h1>
     <p>${escapeHtml(options.message)}</p>
     <a href="/pricing" style="display:inline-block;padding:8px 12px;border-radius:12px;text-decoration:none;color:#fff;
        font-size:14px;font-weight:600;background:var(--brand)">Create your own short links</a>`
  );
}

export function renderPasswordPage(code: string, title: string, hasError: boolean): string {
  return shell(
    "Password required",
    `<div class="badge">Protected link</div>
     <h1>Password required</h1>
     <p>“${escapeHtml(title)}” is password protected. Enter the password to continue.</p>
     ${hasError ? '<div class="err">Incorrect password. Try again.</div>' : ""}
     <form method="POST" action="/api/unlock">
       <input type="hidden" name="code" value="${escapeHtml(code)}"/>
       <input type="password" name="password" placeholder="Enter password" autofocus required/>
       <button type="submit">Unlock link</button>
     </form>`
  );
}

export function renderRedirectPage(destination: string, pixels: { meta?: string | null; google?: string | null; tiktok?: string | null }): string {
  const destJson = JSON.stringify(destination).replace(/</g, "\\u003c");
  const meta = pixels.meta
    ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${escapeHtml(pixels.meta)}');fbq('track','PageView');</script>
<noscript><img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${escapeHtml(pixels.meta)}&ev=PageView&noscript=1"/></noscript>`
    : "";
  const google = pixels.google
    ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${escapeHtml(pixels.google)}"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${escapeHtml(pixels.google)}');</script>`
    : "";
  const tiktok = pixels.tiktok
    ? `<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=r;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript";o.async=!0;o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${escapeHtml(pixels.tiktok)}');ttq.page();}(window,document,'ttq');</script>`
    : "";

  return shell(
    "Redirecting",
    `<div class="pulse"></div>
     <h1>Opening your link…</h1>
     <p>Applying retargeting pixels, then redirecting you to the destination.</p>
     <a href="${escapeHtml(destination)}" style="color:#8fa6ff;font-size:13px">Continue manually</a>
     ${meta}${google}${tiktok}
     <script>setTimeout(function(){window.location.replace(${destJson})},1200)</script>`
  );
}
