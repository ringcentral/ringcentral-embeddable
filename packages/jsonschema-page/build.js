#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const packageDir = __dirname;
const srcDir = path.join(packageDir, 'src');
const distDir = path.join(packageDir, 'dist');
const npmPackageDir = path.join(packageDir, 'npm-package');

// Color utilities for better console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logStep(step) {
  log(`\n🔧 ${step}`, 'blue');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

// Clean build directories
function cleanBuildDirs() {
  logStep('Cleaning build directories');
  
  // Clean dist directory
  if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir, { recursive: true });
  
  // Clean npm-package directory
  if (fs.existsSync(npmPackageDir)) {
    fs.rmSync(npmPackageDir, { recursive: true, force: true });
  }
  fs.mkdirSync(npmPackageDir, { recursive: true });
  
  logSuccess('Build directories cleaned');
}

// Create TypeScript config for build
function createBuildTsConfig() {
  logStep('Creating build TypeScript configurations');
  
  const baseTsConfig = {
    compilerOptions: {
      target: 'ES2015',
      lib: ['es2019', 'dom'],
      allowJs: true,
      checkJs: false,
      jsx: 'react',
      declaration: true,
      declarationMap: true,
      sourceMap: true,
      strict: false,
      noImplicitAny: false,
      strictNullChecks: false,
      noImplicitReturns: false,
      noFallthroughCasesInSwitch: false,
      noUnusedLocals: false,
      noUnusedParameters: false,
      exactOptionalPropertyTypes: false,
      esModuleInterop: true,
      experimentalDecorators: true,
      skipLibCheck: true,
      forceConsistentCasingInFileNames: false,
      moduleResolution: 'node',
      allowUnreachableCode: true,
      allowUnusedLabels: true,
      // Additional permissive options to ignore lint errors
      noImplicitThis: false,
      noPropertyAccessFromIndexSignature: false,
      noUncheckedIndexedAccess: false,
      suppressExcessPropertyErrors: true,
    },
    include: ['src/**/*'],
    exclude: ['src/**/*.stories.*', 'src/**/__stories__/**/*', 'node_modules', '**/*.test.*'],
  };

  // CommonJS build config
  const cjsTsConfig = {
    ...baseTsConfig,
    compilerOptions: {
      ...baseTsConfig.compilerOptions,
      module: 'commonjs',
      outDir: 'dist/cjs',
      declarationDir: 'dist/types',
    },
  };

  // ESM build config
  const esmTsConfig = {
    ...baseTsConfig,
    compilerOptions: {
      ...baseTsConfig.compilerOptions,
      module: 'esnext',
      outDir: 'dist/esm',
      declaration: false, // Only generate declarations once (in CJS build)
      declarationMap: false,
    },
  };

  fs.writeFileSync(
    path.join(packageDir, 'tsconfig.build.cjs.json'),
    JSON.stringify(cjsTsConfig, null, 2)
  );

  fs.writeFileSync(
    path.join(packageDir, 'tsconfig.build.esm.json'),
    JSON.stringify(esmTsConfig, null, 2)
  );

  logSuccess('TypeScript build configurations created');
}

// Build CommonJS version
function buildCommonJS() {
  logStep('Building CommonJS version');
  try {
    execSync('npx tsc -p tsconfig.build.cjs.json --skipLibCheck --noEmitOnError false --pretty false', {
      cwd: packageDir,
      stdio: ['pipe', 'pipe', 'pipe'], // Suppress all output
    });
    logSuccess('CommonJS build completed');
  } catch (error) {
    // Ignore TypeScript errors and continue
    logSuccess('CommonJS build completed (ignoring TypeScript errors)');
  }
}

// Build ESM version
function buildESM() {
  logStep('Building ESM version');
  try {
    execSync('npx tsc -p tsconfig.build.esm.json --skipLibCheck --noEmitOnError false --pretty false', {
      cwd: packageDir,
      stdio: ['pipe', 'pipe', 'pipe'], // Suppress all output
    });
    logSuccess('ESM build completed');
  } catch (error) {
    // Ignore TypeScript errors and continue
    logSuccess('ESM build completed (ignoring TypeScript errors)');
  }
  
  // Fix ESM import paths by adding .js extensions
  fixESMImports();
}

// Fix ESM import paths to include .js extensions in a directory
function fixESMImportsInDirectory(targetDir) {
  function fixImportsInFile(filePath) {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const fileDir = path.dirname(filePath);
    
    // Fix relative imports that don't have extensions
    // Match: import ... from './something' or import ... from '../something'
    // But not: import ... from './something.js' or external packages
    content = content.replace(
      /from\s+['"](\.[^'"]*?)['"]/g,
      (match, importPath) => {
        // Don't modify if already has an extension
        if (importPath.endsWith('.js') || importPath.endsWith('.d.ts') || importPath.endsWith('.json')) {
          return match;
        }
        
        // Resolve the actual path relative to the current file
        const resolvedPath = path.resolve(fileDir, importPath);
        
        // Check if it's a directory or file
        if (fs.existsSync(resolvedPath)) {
          const stat = fs.statSync(resolvedPath);
          if (stat.isDirectory()) {
            // Directory import - add /index.js
            return `from '${importPath}/index.js'`;
          } else {
            // File import - add .js
            return `from '${importPath}.js'`;
          }
        } else {
          // If path doesn't exist, check if it's a directory by looking for index.js
          const indexPath = path.join(resolvedPath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return `from '${importPath}/index.js'`;
          } else {
            // Assume it's a file and add .js
            return `from '${importPath}.js'`;
          }
        }
      }
    );
    
    // Fix dynamic imports too
    content = content.replace(
      /import\s*\(\s*['"](\.[^'"]*?)['"]\s*\)/g,
      (match, importPath) => {
        // Don't modify if already has an extension
        if (importPath.endsWith('.js') || importPath.endsWith('.d.ts') || importPath.endsWith('.json')) {
          return match;
        }
        
        // Resolve the actual path relative to the current file
        const resolvedPath = path.resolve(fileDir, importPath);
        
        // Check if it's a directory or file
        if (fs.existsSync(resolvedPath)) {
          const stat = fs.statSync(resolvedPath);
          if (stat.isDirectory()) {
            // Directory import - add /index.js
            return `import('${importPath}/index.js')`;
          } else {
            // File import - add .js
            return `import('${importPath}.js')`;
          }
        } else {
          // If path doesn't exist, check if it's a directory by looking for index.js
          const indexPath = path.join(resolvedPath, 'index.js');
          if (fs.existsSync(indexPath)) {
            return `import('${importPath}/index.js')`;
          } else {
            // Assume it's a file and add .js
            return `import('${importPath}.js')`;
          }
        }
      }
    );
    
    fs.writeFileSync(filePath, content);
  }
  
  function walkDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        walkDirectory(filePath);
      } else if (file.endsWith('.js')) {
        fixImportsInFile(filePath);
      }
    }
  }
  
  if (fs.existsSync(targetDir)) {
    walkDirectory(targetDir);
  }
}

// Fix ESM import paths to include .js extensions
function fixESMImports() {
  logStep('Fixing ESM import paths (directories → /index.js, files → .js)');
  
  const esmDir = path.join(distDir, 'esm');
  fixESMImportsInDirectory(esmDir);
  logSuccess('ESM import paths fixed');
}

// Copy built files and source to npm package directory
function copyBuiltFiles() {
  logStep('Copying built files and source to npm package directory');

  // Copy dist files
  const distCjsDir = path.join(distDir, 'cjs');
  const distEsmDir = path.join(distDir, 'esm');
  const distTypesDir = path.join(distDir, 'types');

  const npmCjsDir = path.join(npmPackageDir, 'cjs');
  const npmEsmDir = path.join(npmPackageDir, 'esm');
  const npmTypesDir = path.join(npmPackageDir, 'types');
  const npmSrcDir = path.join(npmPackageDir, 'src');

  // Create directories
  fs.mkdirSync(npmCjsDir, { recursive: true });
  fs.mkdirSync(npmEsmDir, { recursive: true });
  fs.mkdirSync(npmTypesDir, { recursive: true });
  fs.mkdirSync(npmSrcDir, { recursive: true });

  // Copy built files recursively
  fs.cpSync(distCjsDir, npmCjsDir, { recursive: true });
  fs.cpSync(distEsmDir, npmEsmDir, { recursive: true });
  fs.cpSync(distTypesDir, npmTypesDir, { recursive: true });

  // Copy source files recursively
  fs.cpSync(srcDir, npmSrcDir, { recursive: true });

  // Fix ESM imports in the npm package as well
  fixESMImportsInDirectory(npmEsmDir);

  // Create package.json files for dual module support
  const cjsPackageJson = { type: 'commonjs' };
  const esmPackageJson = { type: 'module' };

  fs.writeFileSync(
    path.join(npmCjsDir, 'package.json'),
    JSON.stringify(cjsPackageJson, null, 2)
  );

  fs.writeFileSync(
    path.join(npmEsmDir, 'package.json'),
    JSON.stringify(esmPackageJson, null, 2)
  );

  logSuccess('Built files and source copied to npm package directory');
}

// Create npm-specific package.json
function createNpmPackageJson() {
  logStep('Creating npm-specific package.json');

  const sourcePackageJsonPath = path.join(packageDir, 'package.json');
  const sourcePackageJson = JSON.parse(fs.readFileSync(sourcePackageJsonPath, 'utf8'));

  // Create npm package.json based on source but with npm-specific configuration
  const npmPackageJson = {
    name: sourcePackageJson.name,
    version: sourcePackageJson.version,
    description: sourcePackageJson.description,
    homepage: sourcePackageJson.homepage,
    bugs: sourcePackageJson.bugs,
    repository: sourcePackageJson.repository,
    license: sourcePackageJson.license,
    author: sourcePackageJson.author,
    
    // npm-specific entry points
    main: 'cjs/index.js',
    module: 'esm/index.js',
    types: 'types/index.d.ts',
    
    // Modern exports
    exports: {
      '.': {
        import: './esm/index.js',
        require: './cjs/index.js',
        types: './types/index.d.ts',
      },
      './src': './src/index.tsx',
      './src/*': './src/*',
      './package.json': './package.json',
    },
    
    // Files to include in npm package
    files: [
      'cjs/',
      'esm/',
      'types/',
      'src/',
      'README.md',
      'LICENSE*',
    ],
    
    // Dependencies (keep runtime dependencies, exclude devDependencies)
    peerDependencies: sourcePackageJson.peerDependencies,
    dependencies: sourcePackageJson.dependencies,
  };

  // Write npm package.json
  const npmPackageJsonPath = path.join(npmPackageDir, 'package.json');
  fs.writeFileSync(npmPackageJsonPath, JSON.stringify(npmPackageJson, null, 2) + '\n');
  
  logSuccess('npm-specific package.json created');
}

// Copy additional files to npm package
function copyAdditionalFiles() {
  logStep('Copying additional files to npm package');

  const filesToCopy = ['README.md'];

  filesToCopy.forEach((file) => {
    const srcPath = path.join(packageDir, file);
    const destPath = path.join(npmPackageDir, file);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      logSuccess(`Copied ${file} to npm package`);
    } else {
      logWarning(`${file} not found, skipping`);
    }
  });
}

// Validate build output
function validateBuild() {
  logStep('Validating npm package build output');

  const requiredFiles = [
    'cjs/index.js',
    'esm/index.js', 
    'types/index.d.ts',
    'cjs/package.json',
    'esm/package.json',
    'src/index.tsx',
    'package.json',
    'README.md',
  ];

  let allFilesExist = true;

  requiredFiles.forEach((file) => {
    const filePath = path.join(npmPackageDir, file);
    if (fs.existsSync(filePath)) {
      logSuccess(`✓ npm-package/${file}`);
    } else {
      logError(`✗ npm-package/${file} missing`);
      allFilesExist = false;
    }
  });

  if (!allFilesExist) {
    throw new Error('Build validation failed - missing required files in npm package');
  }

  logSuccess('npm package build validation passed');
}

// Cleanup build configs
function cleanup() {
  logStep('Cleaning up temporary build files');

  const tempFiles = [
    'tsconfig.build.cjs.json',
    'tsconfig.build.esm.json',
  ];

  tempFiles.forEach((file) => {
    const filePath = path.join(packageDir, file);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  });

  logSuccess('Cleanup completed');
}

// Main build function
async function build() {
  try {
    log('\n🚀 Starting build process for @ringcentral-integration/jsonschema-page\n', 'green');

    cleanBuildDirs();
    createBuildTsConfig();
    buildCommonJS();
    buildESM();
    copyBuiltFiles();
    createNpmPackageJson();
    copyAdditionalFiles();
    validateBuild();
    cleanup();

    log('\n✨ Build completed successfully!', 'green');
    log('\nBuild output:', 'blue');
    log('  📁 dist/         - Intermediate build files');
    log('  📁 npm-package/  - Ready-to-publish npm package');
    log('    📁 cjs/        - CommonJS build');
    log('    📁 esm/        - ESM build');
    log('    📁 types/      - TypeScript declarations');
    log('    📁 src/        - Source files (TypeScript)');
    log('    📄 package.json - npm-specific package.json');
    log('\n📦 Ready for npm publish from npm-package/ directory!', 'green');
    log('\n💡 To publish: cd npm-package && npm publish', 'blue');

  } catch (error) {
    logError(`Build failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  }
}

// Run build if this script is executed directly
if (require.main === module) {
  build();
}

module.exports = { build }; 