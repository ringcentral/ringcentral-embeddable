const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');

const walk = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const next = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['i18n', 'audio', 'assets'].includes(entry.name)) walk(next, out);
      continue;
    }
    if (/\.tsx?$/.test(entry.name)) out.push(next);
  }
  return out;
};

/** Names this file imports as types only, so babel erases them at runtime. */
const typeOnlyImports = (source) => {
  const names = new Set();
  // `import type { A as B }` erases the *local* binding `B`, not `A`.
  const localName = (item) => {
    const parts = item.replace(/^type\s+/, '').split(/\s+as\s+/);
    return parts[parts.length - 1].trim();
  };
  for (const [, group] of source.matchAll(/import\s+type\s*\{([^}]*)\}/g)) {
    group
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
      .forEach((item) => names.add(localName(item)));
  }
  // `import { type Foo, Bar }` — only `Foo` is erased.
  for (const [, group] of source.matchAll(/import\s*\{([^}]*)\}/g)) {
    group
      .split(',')
      .map((item) => item.trim())
      .filter((item) => /^type\s+/.test(item))
      .forEach((item) => names.add(localName(item)));
  }
  return names;
};

/** Constructor parameters of each `@injectable` class that declares one. */
const injectableConstructorParams = (source) => {
  if (!/@injectable\s*\(/.test(source)) return [];
  const start = source.indexOf('\n  constructor(');
  if (start === -1) return [];
  // Read up to the matching `)`: a one-line constructor has no `\n  ) {` of
  // its own, and a lazy match would run on into the next method signature.
  const open = start + '\n  constructor('.length;
  let close = open;
  for (let depth = 1; close < source.length && depth > 0; close += 1) {
    if (source[close] === '(') depth += 1;
    if (source[close] === ')') depth -= 1;
  }
  // Split on commas that are not inside <>, (), {} or [].
  const raw = source.slice(open, close - 1);
  const params = [];
  let depth = 0;
  let current = '';
  for (const char of raw) {
    if ('<({['.includes(char)) depth += 1;
    if ('>)}]'.includes(char)) depth -= 1;
    if (char === ',' && depth === 0) {
      params.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current.trim()) params.push(current);
  return params.map((param) => param.trim()).filter(Boolean);
};

/**
 * Decorators that supply the token themselves, so `design:paramtypes` is never
 * consulted: `@inject(X)`, `@dynamic('X')`, and `@optional(X)` / `@optional('X')`
 * with any argument. A bare `@optional()` still falls back to metadata.
 */
const TOKEN_DECORATORS = [
  /@inject\s*\(\s*[^)\s]/,
  /@dynamic\s*\(\s*[^)\s]/,
  /@optional\s*\(\s*[^)\s]/,
];

/**
 * Reactant resolves a constructor dependency from `design:paramtypes` metadata
 * unless the parameter carries an explicit token. A type-only import is erased
 * by babel, so the metadata is empty and the container fails at runtime with
 * "Missing required @inject or @multiInject annotation in: argument N" — which
 * neither `npm test` nor `npm run build` catches.
 */
it('resolves every metadata-based DI dependency from a value import', () => {
  const offenders = [];

  for (const file of walk(SRC)) {
    const source = fs.readFileSync(file, 'utf8');
    const params = injectableConstructorParams(source);
    if (!params.length) continue;
    const erased = typeOnlyImports(source);

    params.forEach((param, index) => {
      if (TOKEN_DECORATORS.some((pattern) => pattern.test(param))) return;
      const typeMatch = /:\s*([A-Za-z_][A-Za-z0-9_]*)/.exec(
        param.replace(/@[A-Za-z]+\s*\([^)]*\)/g, ''),
      );
      if (!typeMatch) return;
      const typeName = typeMatch[1];
      if (!erased.has(typeName)) return;
      offenders.push(
        `${path.relative(SRC, file)} argument ${index} (${typeName}) is imported as a type only`,
      );
    });
  }

  expect(offenders).toEqual([]);
});
