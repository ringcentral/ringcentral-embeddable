const fs = require('fs');
const path = require('path');
const { createCoverageMap } = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const coverageRoot = path.resolve(__dirname, '..', 'coverage');
const unitCoveragePath = path.join(coverageRoot, 'unit', 'coverage-final.json');
const e2eCoverageDirectory = path.join(coverageRoot, 'e2e');
const fullCoverageDirectory = path.join(coverageRoot, 'full');
const coverageThresholds = {
  statements: 80,
  branches: 80,
  functions: 80,
  lines: 80,
};
const generatedCoveragePatterns = [
  /[/\\]src[/\\]noise-reduction[/\\].*\.es5\.js$/,
  /[/\\]src[/\\]worklets[/\\].*\.worklet\.js$/,
  /[/\\]src[/\\].*[/\\]i18n[/\\]loadLocale\.(js|ts)$/,
];

function readCoverageJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function mergeCoverageFile(coverageMap, filePath) {
  if (fs.existsSync(filePath)) {
    coverageMap.merge(readCoverageJson(filePath));
  }
}

function mergeCoverageDirectory(coverageMap, directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    return;
  }
  fs.readdirSync(directoryPath)
    .filter((fileName) => fileName.endsWith('.json'))
    .forEach((fileName) => {
      mergeCoverageFile(coverageMap, path.join(directoryPath, fileName));
    });
}

function writeReports(coverageMap) {
  fs.mkdirSync(fullCoverageDirectory, { recursive: true });
  fs.writeFileSync(
    path.join(fullCoverageDirectory, 'coverage-final.json'),
    JSON.stringify(coverageMap.toJSON()),
  );
  const context = libReport.createContext({
    coverageMap,
    dir: fullCoverageDirectory,
  });
  reports.create('text-summary').execute(context);
  reports.create('json-summary').execute(context);
  reports.create('json').execute(context);
}

function excludeGeneratedFiles(coverageMap) {
  coverageMap.filter((filePath) => (
    !generatedCoveragePatterns.some((pattern) => pattern.test(filePath))
  ));
}

function assertThresholds(coverageMap) {
  const summary = coverageMap.getCoverageSummary();
  const failures = Object.entries(coverageThresholds)
    .filter(([metric, threshold]) => summary[metric].pct < threshold)
    .map(([metric, threshold]) => (
      `${metric}: ${summary[metric].pct}% is below ${threshold}%`
    ));
  if (failures.length > 0) {
    failures.forEach((failure) => {
      console.error(`Coverage threshold failed for ${failure}`);
    });
    process.exitCode = 1;
  }
}

const coverageMap = createCoverageMap({});
mergeCoverageFile(coverageMap, unitCoveragePath);
mergeCoverageDirectory(coverageMap, e2eCoverageDirectory);
excludeGeneratedFiles(coverageMap);
writeReports(coverageMap);
assertThresholds(coverageMap);
