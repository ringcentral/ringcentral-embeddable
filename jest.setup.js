require('expect-puppeteer');

jest.setTimeout(400000);

if (process.env.BROWSER_COVERAGE === 'true') {
  const fs = require('fs');
  const path = require('path');
  const { createCoverageMap } = require('istanbul-lib-coverage');

  const coverageDirectory = path.resolve(__dirname, 'coverage/e2e');
  let coverageIndex = 0;

  async function collectFrameCoverage(frame, coverageMap) {
    try {
      const coverage = await frame.evaluate(() => window.__coverage__ || null);
      if (coverage) {
        coverageMap.merge(coverage);
      }
    } catch (_error) {
      // Cross-origin or already-detached frames should not fail test cleanup.
    }
  }

  async function collectPageCoverage() {
    if (typeof browser === 'undefined') {
      return;
    }
    const coverageMap = createCoverageMap({});
    const pages = await browser.pages();
    await Promise.all(
      pages.flatMap((targetPage) => (
        targetPage.frames().map((frame) => collectFrameCoverage(frame, coverageMap))
      )),
    );
    const files = coverageMap.files();
    if (files.length === 0) {
      return;
    }
    fs.mkdirSync(coverageDirectory, { recursive: true });
    coverageIndex += 1;
    fs.writeFileSync(
      path.join(coverageDirectory, `coverage-${process.pid}-${coverageIndex}.json`),
      JSON.stringify(coverageMap.toJSON()),
    );
  }

  afterEach(async () => {
    await collectPageCoverage();
  });

  afterAll(async () => {
    await collectPageCoverage();
  });
}
