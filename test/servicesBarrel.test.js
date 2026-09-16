const fs = require('fs');
const path = require('path');

const SERVICES_DIR = path.join(__dirname, '..', 'src', 'app', 'services');

const barrelSource = fs.readFileSync(path.join(SERVICES_DIR, 'index.ts'), 'utf8');

const reExportedDirs = [
  ...barrelSource.matchAll(/export \* from '\.\/([^']+)'/g),
].map(([, name]) => name);

const hasIndex = (name) =>
  ['index.ts', 'index.tsx'].some((file) =>
    fs.existsSync(path.join(SERVICES_DIR, name, file)),
  );

/** Every exported identifier under a re-exported service directory. */
const collectExportedNames = () => {
  const names = new Set();
  const walk = (current) => {
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const next = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'i18n') walk(next);
        continue;
      }
      if (!/\.tsx?$/.test(entry.name)) continue;
      const source = fs.readFileSync(next, 'utf8');
      for (const [, name] of source.matchAll(
        /export\s+(?:declare\s+)?(?:abstract\s+)?(?:class|const|let|var|function|enum|type|interface)\s+([A-Za-z0-9_$]+)/g,
      )) {
        names.add(name);
      }
      for (const [, group] of source.matchAll(/export\s*\{([^}]*)\}/g)) {
        group
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
          .forEach((item) => {
            const parts = item.replace(/^type\s+/, '').split(/\s+as\s+/);
            names.add((parts[1] ?? parts[0]).trim());
          });
      }
    }
  };
  reExportedDirs.forEach((dir) => walk(path.join(SERVICES_DIR, dir)));
  return names;
};

it('only re-exports service directories that exist and have an index', () => {
  const broken = reExportedDirs.filter((name) => !hasIndex(name));
  expect(broken).toEqual([]);
});

/**
 * `getAppConfig` pulls its modules from the `./services` barrel, and a name the
 * barrel does not export resolves to `undefined` at runtime. Webpack only emits
 * a warning for that, and DI then fails with an opaque "undefined option
 * error" — so the link is checked statically here.
 *
 * Service directories omitted from the barrel on purpose (ComposeText,
 * DoNotContact, ...) are imported by direct path and are unaffected.
 */
it('exports every name getAppConfig imports from the barrel', () => {
  const appConfig = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'app', 'getAppConfig.ts'),
    'utf8',
  );
  // getAppConfig has more than one `from './services'` block; all of them count.
  const barrelImports = [
    ...appConfig.matchAll(/import\s*\{([^}]+)\}\s*from '\.\/services';/g),
  ];
  expect(barrelImports.length).toBeGreaterThan(0);

  // `Foo as Bar` and `type Foo` both resolve to the left-hand exported name.
  const imported = barrelImports.flatMap(([, group]) =>
    group
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean)
      .map((entry) =>
        entry.replace(/^type\s+/, '').split(/\s+as\s+/)[0].trim(),
      ),
  );

  expect(imported.length).toBeGreaterThan(0);
  expect(imported).toContain('WebphoneMedia');

  const exportedNames = collectExportedNames();
  const unresolved = imported.filter((name) => !exportedNames.has(name));
  expect(unresolved).toEqual([]);
});

it('detects a name that the barrel does not provide', () => {
  // Guards the guard: the check above must actually fail on a missing export.
  const exportedNames = collectExportedNames();
  expect(exportedNames.has('WebphoneMedia')).toBe(true);
  expect(exportedNames.has('NotARealServiceExport')).toBe(false);
});
