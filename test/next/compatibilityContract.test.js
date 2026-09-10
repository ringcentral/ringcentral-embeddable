const fs = require('fs');
const path = require('path');

const {
  srcNextCompatibilityContract,
} = require('../../next/app/contracts/src-next-compatibility.contract');
const legacyAdapterMessageTypesModule = require('../../src/lib/Adapter/messageTypes');

const repositoryRoot = path.resolve(__dirname, '../..');
const legacyAdapterMessageTypes =
  legacyAdapterMessageTypesModule.default || legacyAdapterMessageTypesModule;

function readFile(relativePath) {
  return fs.readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function readFilesRecursively(relativeDirectory, extensions) {
  const directory = path.join(repositoryRoot, relativeDirectory);
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const relativePath = path.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      return readFilesRecursively(relativePath, extensions);
    }
    return extensions.includes(path.extname(entry.name))
      ? [{ relativePath, content: readFile(relativePath) }]
      : [];
  });
}

function getContractNames(surface) {
  return srcNextCompatibilityContract.entries
    .filter((entry) => entry.surface === surface)
    .flatMap((entry) => entry.legacyNames)
    .sort();
}

function getMatches(content, pattern) {
  return [...content.matchAll(pattern)].map((match) => match[1]);
}

function getUniqueSorted(values) {
  return [...new Set(values)].sort();
}

describe('src-to-next compatibility contract', () => {
  test('uses valid status metadata and explicit follow-up policy', () => {
    const { entries, statuses } = srcNextCompatibilityContract;
    const entryIds = entries.map((entry) => entry.id);
    const surfaces = [...new Set(entries.map((entry) => entry.surface))];
    expect(srcNextCompatibilityContract.policyVersion).toBe(1);
    expect(new Set(entryIds).size).toBe(entryIds.length);
    surfaces.forEach((surface) => {
      const names = entries
        .filter((entry) => entry.surface === surface)
        .flatMap((entry) => entry.legacyNames);
      expect(new Set(names).size).toBe(names.length);
    });
    entries.forEach((entry) => {
      expect(statuses[entry.status]).toBeDefined();
      expect(entry.legacyNames.length).toBeGreaterThan(0);
      expect(new Set(entry.legacyNames).size).toBe(entry.legacyNames.length);
      if (entry.status === 'verified') {
        expect(entry.verification.length).toBeGreaterThan(0);
      } else if (entry.status === 'removed') {
        expect(entry.decision).toEqual(expect.any(String));
      } else {
        expect(entry.nextAction).toEqual(expect.any(String));
      }
    });
  });

  test('classifies every documented runtime option', () => {
    const configIndex = readFile('docs/config/index.md');
    const tableOptions = getMatches(
      configIndex,
      /^\|\s*`([A-Za-z][A-Za-z0-9]*)`\s*\|/gm
    );
    const markdownFiles = readFilesRecursively('docs', ['.md']);
    const exampleOptions = markdownFiles.flatMap(({ content }) =>
      content
        .split('\n')
        .filter((line) => /(?:adapter[^\s"']*\.js|app\.html)\?/.test(line))
        .flatMap((line) => getMatches(line, /[?&]([A-Za-z][A-Za-z0-9]*)=/g))
    );
    const documentedOptions = getUniqueSorted(
      tableOptions
        .concat(exampleOptions)
        .filter((name) => name !== 'parameterName')
    );
    const contractOptions = getContractNames('runtime-option');
    expect(
      documentedOptions.filter((name) => !contractOptions.includes(name))
    ).toEqual([]);
  });

  test('classifies every legacy or documented adapter message', () => {
    const legacyFiles = [
      ...readFilesRecursively('src/modules', ['.js', '.ts', '.tsx']),
      ...readFilesRecursively('src/lib', ['.js', '.ts', '.tsx']),
    ];
    const legacyMessages = legacyFiles.flatMap(({ content }) =>
      getMatches(content, /['"](rc-adapter-[A-Za-z0-9_-]+)['"]/g)
    );
    const documentedMessages = readFilesRecursively('docs/integration', ['.md'])
      .filter(({ relativePath }) => !relativePath.endsWith('events.md'))
      .flatMap(({ content }) =>
        getMatches(content, /['"](rc-adapter-[A-Za-z0-9_-]+)['"]/g)
      );
    const expectedMessages = getUniqueSorted(
      legacyMessages.concat(documentedMessages)
    );
    const contractMessages = getContractNames('adapter-message');
    expect(
      expectedMessages.filter((name) => !contractMessages.includes(name))
    ).toEqual([]);
  });

  test('classifies every legacy transport message and documented event', () => {
    const legacyFiles = [
      ...readFilesRecursively('src/modules', ['.js', '.ts', '.tsx']),
      ...readFilesRecursively('src/lib', ['.js', '.ts', '.tsx']),
    ];
    const excludedLegacyValues = new Set([
      'rc-adapter',
      'rc-widget',
      'rc-widget-demo-warning-dismissed',
      'rc-widget-webphone',
    ]);
    const legacyTransportNames = legacyFiles
      .flatMap(({ content }) =>
        getMatches(content, /['"](rc-[A-Za-z0-9_-]+)['"]/g)
      )
      .filter((name) => !excludedLegacyValues.has(name));
    const generatedLegacyAdapterNames = Object.keys(
      legacyAdapterMessageTypes
    ).map((key) => legacyAdapterMessageTypes[key]);
    const eventsDocumentation = readFile('docs/integration/events.md');
    const documentedEvents = getUniqueSorted(
      getMatches(eventsDocumentation, /['"](rc-[A-Za-z0-9_-]+)['"]/g).filter(
        (name) =>
          name.endsWith('-notify') ||
          name === 'rc-adapter-syncPresence' ||
          name === 'rc-webphone-sessions-sync'
      )
    );
    const contractMessages = getContractNames('adapter-message');
    const contractEvents = getContractNames('adapter-event');
    const classifiedTransportNames = contractMessages.concat(contractEvents);
    expect(
      getUniqueSorted(
        legacyTransportNames.concat(generatedLegacyAdapterNames)
      ).filter((name) => !classifiedTransportNames.includes(name))
    ).toEqual([]);
    expect(
      documentedEvents.filter((name) => !contractEvents.includes(name))
    ).toEqual([]);
  });

  test('classifies every legacy adapter request endpoint', () => {
    const legacyAdapter = readFile('src/modules/Adapter/index.js');
    const legacyRequests = getUniqueSorted(
      getMatches(legacyAdapter, /case ['"](\/[A-Za-z0-9_/-]+)['"]:/g)
    );
    const contractRequests = getContractNames('adapter-request');
    expect(
      legacyRequests.filter((name) => !contractRequests.includes(name))
    ).toEqual([]);
  });

  test('classifies every legacy application route', () => {
    const legacyApp = readFile('src/containers/App/index.js');
    const legacyRoutes = getUniqueSorted(
      getMatches(legacyApp, /path="([^"]+)"/g)
    );
    const contractRoutes = getContractNames('route');
    expect(
      legacyRoutes.filter((name) => !contractRoutes.includes(name))
    ).toEqual([]);
  });

  test('registers direct dependencies consumed by Adapter', () => {
    const appConfig = readFile('next/app/getAppConfig.ts');

    expect(appConfig).toMatch(
      /type AvailabilityMonitorOptions,\s+Client,\s+ConnectivityMonitor/
    );
    expect(appConfig).toMatch(
      /useClass: EmbeddableAnalytics,\s+},\s+Client,\s+{\s+provide: Auth/
    );
    expect(appConfig).toMatch(/ModalView,\s+MessageStore,\s+Conversations,/);
  });
});
