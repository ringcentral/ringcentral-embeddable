const fs = require('fs');
const path = require('path');

fs.rmSync(path.resolve(__dirname, '..', 'coverage'), {
  force: true,
  recursive: true,
});
