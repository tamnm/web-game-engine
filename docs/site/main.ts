// Minimal docs loader with tiny markdown conversion
type Page = { id: string; title: string; file: string };

const PAGES: Page[] = [
  { id: 'getting-started', title: 'Getting Started', file: '/pages/getting-started.md' },
  { id: 'engine-overview', title: 'Engine Overview', file: '/pages/engine-overview.md' },
  { id: 'rendering', title: 'Rendering', file: '/pages/rendering.md' },
  { id: 'scenes', title: 'Scenes & ECS', file: '/pages/scenes.md' },
  { id: 'input', title: 'Input', file: '/pages/input.md' },
];

const $ = (sel: string) => document.querySelector(sel) as HTMLElement;
const sidebar = $('#sidebar');
const content = $('#content');
const version = $('#version');

function getVersion(): string {
  try {
    // Filled at build/runtime by reading package.json if served via Vite
    // Fallback to env or unknown
    // @ts-expect-error injected by tooling when available
    return (import.meta.env?.VITE_APP_VERSION as string) || '__DEV__';
  } catch {
    return '__DEV__';
  }
}

version.textContent = `v${getVersion()}`;

function tinyMarkdown(md: string): string {
  // very tiny subset: headings, code blocks, inline code, bold/italic, lists, links
  // escape
  let html = md.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // code fence
  html = html.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code}</code></pre>`);
  // headings
  html = html.replace(/^###\s+(.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^##\s+(.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^#\s+(.+)$/gm, '<h1>$1</h1>');
  // lists
  html = html.replace(/^\s*[-*]\s+(.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>[^<]+<\/li>\s*)+/g, (m) => `<ul>${m}</ul>`);
  // bold/italic
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
  // inline code
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
  // links [text](url)
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer">$1</a>'
  );
  // paragraphs
  html = html.replace(/^(?!<h\d|<ul|<pre|<li|<\/li|<\/ul)(.+)$/gm, '<p>$1</p>');
  return html;
}

function renderSidebar(active: string) {
  sidebar.innerHTML = PAGES.map((p) => {
    const cls = p.id === active ? ' class="active"' : '';
    return `<li><a href="#${p.id}"${cls}>${p.title}</a></li>`;
  }).join('');
}

async function loadPage(id: string) {
  const page = PAGES.find((p) => p.id === id) ?? PAGES[0];
  const res = await fetch(page.file);
  const md = await res.text();
  content.innerHTML = tinyMarkdown(md);
  renderSidebar(page.id);
  document.title = `${page.title} — Web Game Engine Docs`;
}

window.addEventListener('hashchange', () => loadPage(location.hash.replace('#', '')));
loadPage(location.hash.replace('#', '') || PAGES[0].id);
