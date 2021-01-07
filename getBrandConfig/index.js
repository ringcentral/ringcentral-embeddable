const fs = require('fs');
const path = require('path');

const configs = {};
const configFolders = fs.readdirSync(__dirname);
const brandConfigs = {};
configFolders.forEach((folderName) => {
  const fullPath = path.resolve(__dirname, folderName);
  if (!fs.statSync(fullPath).isDirectory()) {
    return;
  }
  // disable-eslint
  const config = require(path.join(__dirname, folderName));
  configs[folderName] = config;
  brandConfigs[folderName] = config.brandConfig;
});

const getBrandConfig = (brand) => {
  return configs[brand];
};

exports.getBrandConfig = getBrandConfig;
exports.brandConfigs = brandConfigs;
exports.supportedBrands = Object.keys(brandConfigs);
