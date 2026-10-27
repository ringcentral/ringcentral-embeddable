/**
 * Keep registry tarball URLs in package-lock.json pointing at the public npm registry.
 *
 * When the local npm registry is a private mirror, `npm install` writes the mirror's
 * tarball URLs into the lockfile for newly added or updated packages. npm's default
 * `replace-registry-host=npmjs` already fetches public URLs through the configured
 * registry, so rewriting them back keeps installs working for everyone.
 *
 * Usage:
 *   node scripts/normalize-lockfile.js          Rewrite mirror URLs to registry.npmjs.org
 *   node scripts/normalize-lockfile.js --check  Exit 1 if any non-public registry URL is found
 */
const fs = require('fs');
const path = require('path');

const PUBLIC_REGISTRY = 'https://registry.npmjs.org/';
const LOCKFILE_PATH = path.resolve(__dirname, '..', 'package-lock.json');

// Matches an http(s) `resolved` value and captures the registry-relative tarball path:
// `<name>/-/<file>.tgz` or `@scope/<name>/-/<file>.tgz`.
const RESOLVED_PATTERN =
  /"resolved": "(https?:\/\/[^"]*?)\/((?:@[^/"]+\/)?[^/"@]+\/-\/[^/"]+\.tgz)"/g;
const HTTP_RESOLVED_PATTERN = /"resolved": "(https?:\/\/[^"]+)"/g;

function isPublic(url) {
  return url.startsWith(PUBLIC_REGISTRY);
}

function findNonPublicUrls(content) {
  return [...content.matchAll(HTTP_RESOLVED_PATTERN)]
    .map(([, url]) => url)
    .filter((url) => !isPublic(url));
}

function normalize(content) {
  return content.replace(RESOLVED_PATTERN, (match, prefix, tarballPath) => {
    const url = `${prefix}/${tarballPath}`;
    return isPublic(url) ? match : `"resolved": "${PUBLIC_REGISTRY}${tarballPath}"`;
  });
}

function reportNonPublic(urls) {
  console.error(
    `package-lock.json has ${urls.length} resolved URL(s) outside ${PUBLIC_REGISTRY}:`,
  );
  urls.slice(0, 20).forEach((url) => console.error(`  ${url}`));
  if (urls.length > 20) {
    console.error(`  ...and ${urls.length - 20} more`);
  }
}

function main() {
  const checkOnly = process.argv.includes('--check');
  const content = fs.readFileSync(LOCKFILE_PATH, 'utf8');

  if (checkOnly) {
    const urls = findNonPublicUrls(content);
    if (urls.length > 0) {
      reportNonPublic(urls);
      console.error('Run `npm run lockfile:normalize` and commit the result.');
      process.exit(1);
    }
    console.log('package-lock.json only uses the public npm registry.');
    return;
  }

  const normalized = normalize(content);
  const changed = normalized !== content;
  if (changed) {
    fs.writeFileSync(LOCKFILE_PATH, normalized);
  }

  const remaining = findNonPublicUrls(normalized);
  if (remaining.length > 0) {
    reportNonPublic(remaining);
    console.error('These URLs could not be rewritten automatically.');
    process.exit(1);
  }
  console.log(
    changed
      ? 'Rewrote package-lock.json resolved URLs to the public npm registry.'
      : 'package-lock.json already uses the public npm registry.',
  );
}

main();
