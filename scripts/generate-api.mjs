// Simple API reference generator using TypeScript compiler API.
// Produces Markdown files under docs/site/pages/api/ from engine exports.
import fs from 'fs';
import path from 'path';
import url from 'url';
import ts from 'typescript';

const root = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const entry = path.join(root, 'packages/engine/src/index.ts');
const outDir = path.join(root, 'docs/site/pages/api');

/** @param {string} p */
function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

/** @param {string} f @param {string} c */
function writeFile(f, c) {
  ensureDir(path.dirname(f));
  fs.writeFileSync(f, c, 'utf8');
}

/** @param {ts.Symbol} symbol */
function symbolKind(symbol) {
  const flags = symbol.getFlags();
  if (flags & ts.SymbolFlags.Class) return 'class';
  if (flags & ts.SymbolFlags.Interface) return 'interface';
  if (flags & ts.SymbolFlags.Function) return 'function';
  if (flags & ts.SymbolFlags.Enum) return 'enum';
  if (flags & ts.SymbolFlags.TypeAlias) return 'type';
  if (flags & ts.SymbolFlags.Variable) return 'variable';
  return 'symbol';
}

/** @param {ts.TypeChecker} checker @param {ts.Signature} sig */
function signatureToString(checker, sig) {
  return checker.signatureToString(sig, undefined, ts.TypeFormatFlags.NoTruncation);
}

/**
 * @param {ts.TypeChecker} checker
 * @param {ts.Symbol} symbol
 */
function renderSymbolMarkdown(checker, symbol) {
  const name = symbol.getName();
  const kind = symbolKind(symbol);
  const lines = [`# ${name}`, '', `Kind: ${kind}`, ''];
  const decls = symbol.getDeclarations?.() ?? [];

  // Try aliased symbol for re-exports
  let target = symbol;
  if (symbol.flags & ts.SymbolFlags.Alias) {
    try { target = checker.getAliasedSymbol(symbol); } catch {}
  }

  // Render based on declaration kind
  for (const d of target.getDeclarations?.() ?? decls) {
    if (ts.isClassDeclaration(d) || ts.isInterfaceDeclaration(d)) {
      const members = d.members ?? [];
      if (members.length) {
        lines.push('## Members', '');
        for (const m of members) {
          const n = m.name && ts.isIdentifier(m.name) ? m.name.getText() : '(anonymous)';
          let sigs = [];
          // Try to get call signatures for methods
          if (checker && m.symbol) {
            const t = checker.getTypeOfSymbolAtLocation(m.symbol, m);
            sigs = checker.getSignaturesOfType?.(t, ts.SignatureKind.Call) ?? [];
          }
          const sigText = sigs.length ? ` — ${signatureToString(checker, sigs[0])}` : '';
          lines.push(`- ${n}${sigText}`);
        }
        lines.push('');
      }
    } else if (ts.isFunctionDeclaration(d)) {
      const s = checker.getSignatureFromDeclaration(d);
      if (s) lines.push('## Signature', '', '```ts', signatureToString(checker, s), '```', '');
    } else if (ts.isTypeAliasDeclaration(d)) {
      lines.push('## Definition', '', '```ts', d.getText(), '```', '');
    } else if (ts.isEnumDeclaration(d)) {
      lines.push('## Members', '');
      for (const m of d.members) {
        lines.push(`- ${m.name.getText()}`);
      }
      lines.push('');
    }
  }
  return lines.join('\n');
}

function main() {
  ensureDir(outDir);
  const program = ts.createProgram([entry], {
    skipLibCheck: true,
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2020,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    esModuleInterop: true,
  });
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entry);
  if (!source) throw new Error('Entry source not found');
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error('Module symbol not found');
  const exports = checker.getExportsOfModule(moduleSymbol);
  const pages = [];
  for (const sym of exports) {
    const name = sym.getName();
    // filter internal/private-looking names
    if (name.startsWith('_')) continue;
    const md = renderSymbolMarkdown(checker, sym);
    const fileName = `${name}.md`;
    writeFile(path.join(outDir, fileName), md);
    pages.push({ name, file: `./${fileName}` });
  }
  // Index page
  const indexMd = ['# API Reference', '', ...pages.map((p) => `- [${p.name}](${p.file})`)].join('\n');
  writeFile(path.join(outDir, 'index.md'), indexMd);
  console.log(`Wrote ${pages.length} API pages to ${path.relative(root, outDir)}`);
}

main();

