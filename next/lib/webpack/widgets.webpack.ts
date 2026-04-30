import autoprefixer from 'autoprefixer';
import crypto from 'crypto';
import path from 'path';
import { warmup } from 'thread-loader';
import type {
  Configuration,
  RuleSetRule,
  RuleSetUseItem,
  WebpackPluginInstance,
} from 'webpack';
import { DefinePlugin, ProvidePlugin } from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

function hash(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex').slice(0, 20);
}

export interface BaseWebpackConfigOptions {
  analyzeBundle?: boolean;
  hashPrefix?: string;

  /**
   * by default font will be assets mode, if set to true, font will be inline as base64 data url
   *
   * that may be useful when your meet cors issue when load font from cdn
   *
   * ### if use inline mode, that will increase bundle size when you import font in multiple files, should consider to use it
   */
  inlineFont?: boolean;
  enableHash?: boolean;
  mode?: Configuration['mode'];
  prefixSvgId?: boolean;
  supportedLocales?: string[];
  themeFolder: string;
  threadLoaderOptions?: Record<string, any>;
  useThreadLoader?: boolean;
  preferredDevtool?: Configuration['devtool'];
  useDevtool?: boolean;
  sourceMapLoaderExcludes?: RuleSetRule['exclude'];
  babelLoaderExcludes?: RuleSetRule['exclude'];
  /**
   * enable chunk mode, also can use function when you need custom chunk with different language
   *
   * @default true
   */
  chunkLocale?: boolean | ((locale: string) => boolean);
  /**
   * enable style transform for shared worker mode
   */
  useStyleTransform?: boolean;
  /**
   * build environment, used for define process.env.BUILD_ENVIRONMENT
   */
  env?: string;
}

export const getBaseWebpackConfig = ({
  analyzeBundle = false,
  inlineFont = false,
  enableHash = true,
  hashPrefix = '',
  mode = 'production',
  prefixSvgId = false,
  supportedLocales = [],
  themeFolder,
  threadLoaderOptions = {},
  useThreadLoader = false,
  preferredDevtool = 'eval-source-map',
  useDevtool = mode === 'development',
  sourceMapLoaderExcludes = /node_modules/,
  babelLoaderExcludes = /node_modules/,
  chunkLocale = true,
  useStyleTransform = false,
  env,
}: BaseWebpackConfigOptions): Configuration => {
  const devtool = useDevtool ? preferredDevtool : false;
  const threadLoader: RuleSetUseItem[] = [];
  // set process.env.NODE_ENV to mode to make sure the same as webpack mode
  process.env.NODE_ENV = mode;

  const enablePseudo =
    process.argv.includes('--pseudo') || mode === 'production';

  if (useThreadLoader) {
    warmup(threadLoaderOptions, [
      'postcss-loader',
      'sass-loader',
      'source-map-loader',
      'babel-loader',
      'style-loader',
      'css-loader',
      '@svgr/webpack',
      // TODO: locale-loader not able to use thread-loader
      // '@ringcentral-integration/locale-loader',
    ]);
    threadLoader.push({
      loader: 'thread-loader',
      options: threadLoaderOptions,
    });
  }
  const plugins: WebpackPluginInstance[] = [
    new ProvidePlugin({
      process: 'process/browser.js',
      Buffer: ['buffer', 'Buffer'],
      setImmediate: ['setimmediate', 'setImmedate'],
      clearImmediate: ['setimmediate', 'clearImmedate'],
    }),
    new DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.BUILD_ENVIRONMENT': JSON.stringify(env),
    }),
  ];

  if (analyzeBundle) {
    // eslint-disable-next-line no-console
    console.log('Analyze bundle will be open after completed...');
    plugins.push(
      new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        openAnalyzer: true,
      }),
    );
  }

  const rules: RuleSetRule[] = [
    {
      test: /\.m?js/,
      resolve: {
        fullySpecified: false,
      },
    },
    // material-ui v4.0 issue:
    // Multiple modules with names that only differ in casing in Popper module.
    // https://github.com/mui-org/material-ui/issues/14711
    {
      test: /node_modules\/@material-ui\/core\/esm\/Popper\/Popper\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: "import PopperJS from 'popper.js';",
          replace:
            'import PopperJS from "../../../../popper.js/dist/esm/popper";',
        },
      },
    },
    {
      test: /node_modules\/file-saver\/dist\/FileSaver\.min\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: '"download"in HTMLAnchorElement.prototype',
          replace:
            'globalThis.HTMLAnchorElement&&"download"in globalThis.HTMLAnchorElement.prototype',
        },
      },
    },
    // some setImmediate ployfill issue
    // https://github.com/Stuk/jszip/issues/909
    {
      test: /node_modules\/jszip\/dist\/jszip\.min\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: '{setImmediate(',
          replace: '{window.setImmediate(',
        },
      },
    },
    // Some setTimeout issue in SIP.js v0.13.5:
    // https://github.com/onsip/SIP.js/issues/1071
    {
      test: /node_modules\/sip.js\/lib\/RegisterContext\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: '_this.registrationTimer = setTimeout',
          replace:
            '_this.registrationTimer = (globalThis.externalSetTimeout || setTimeout)',
        },
      },
    },
    {
      test: /node_modules\/sip.js\/lib\/RegisterContext\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: 'clearTimeout(_this.registrationTimer)',
          replace:
            '(globalThis.externalClearTimeout || clearTimeout)(_this.registrationTimer)',
        },
      },
    },
    {
      test: /node_modules\/sip.js\/lib\/RegisterContext\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: '_this.registrationExpiredTimer = setTimeout',
          replace:
            '_this.registrationExpiredTimer = (globalThis.externalSetTimeout || setTimeout)',
        },
      },
    },
    {
      test: /node_modules\/sip.js\/lib\/RegisterContext\.js$/,
      use: {
        loader: 'string-replace-loader',
        options: {
          search: 'clearTimeout(_this.registrationExpiredTimer)',
          replace:
            '(globalThis.externalClearTimeout || clearTimeout)(_this.registrationExpiredTimer)',
        },
      },
    },
  ];

  // source-map-loader
  if (useDevtool) {
    rules.push({
      enforce: 'pre',
      test: /\.(js|jsx|ts|tsx)$/,
      exclude: sourceMapLoaderExcludes,
      use: [
        // ! https://github.com/webpack-contrib/thread-loader?tab=readme-ov-file#examples
        // thread-loader must be the first loader in the loaders array
        // Put this loader in front of other loaders. The following loaders run in a worker pool.
        ...threadLoader,
        'source-map-loader',
      ],
    });
  }
  // babel-loader
  rules.push({
    test: /\.(cjs|mjs|js|jsx|ts|tsx)$/,
    use: [
      {
        loader: 'babel-loader',
        options: {
          // in production mode, not use cache
          cacheDirectory: mode !== 'production',
        },
      },
      {
        loader: '@ringcentral-integration/locale-loader',
        options: {
          supportedLocales,
          chunk: chunkLocale,
          pseudo: enablePseudo,
        },
      },
      // TODO: we put at last for still be use thread-loader with babel-loader, but it's not work, we should make can support locale-loader
      // Put at last for make thread-loader warmup can be end
      ...threadLoader,
    ],
    exclude: babelLoaderExcludes,
  });

  const styleLoaderOptions = useStyleTransform
    ? {
        injectType: 'styleTag',
        insert: (element: HTMLElement) => {
          if (!globalThis.window) return;

          document.head.appendChild(element);
        },
      }
    : {};

  // css
  // thread-loader is not used for CSS/SCSS rules because style-loader and
  // css-loader require loaderContext.utils.contextify which is unavailable in workers
  rules.push({
    test: /\.css$/i,
    use: [
      {
        loader: 'style-loader',
        options: styleLoaderOptions,
      },
      'css-loader',
    ],
  });

  // sass & scss
  rules.push({
    test: /\.sass|\.scss/,
    exclude: /(\.global|\.inline)\.(sass|scss)/,
    use: [
      {
        loader: 'style-loader',
        options: styleLoaderOptions,
      },
      {
        loader: 'css-loader',
        options: {
          modules: {
            // Keep legacy CSS module interoperability for RingCentral widget packages.
            // They import SCSS modules via `import styles from './styles.scss'`
            // and also rely on both dashed and camelCased local names.
            localIdentName: `${hashPrefix}_[path]_[name]_[local]_[hash:base64:5]`,
            namedExport: false,
            exportLocalsConvention: 'camel-case',
          },
        },
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: () => [autoprefixer],
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          api: 'modern',
          sassOptions: {
            loadPaths: [
              themeFolder,
              // Include brand config folders for theme variables
              path.resolve(process.cwd(), 'config/rc'),
              path.resolve(process.cwd(), 'src/brands/rc'),
              path.resolve(process.cwd(), 'next'),
              path.resolve(process.cwd(), 'node_modules'),
              path.resolve(process.cwd(), '../../node_modules'),
            ],
            silenceDeprecations: ['import', 'global-builtin'],
            style: 'expanded',
          },
        },
      },
    ],
  });

  // use global should not have any css module with localIdentName
  // global sass & scss
  rules.push({
    test: /(\.global)\.(sass|scss)/,
    use: [
      {
        loader: 'style-loader',
        options: styleLoaderOptions,
      },
      {
        loader: 'css-loader',
      },
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: () => [autoprefixer],
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          api: 'modern',
          sassOptions: {
            loadPaths: [
              themeFolder,
              // Include brand config folders for theme variables
              path.resolve(process.cwd(), 'config/rc'),
              path.resolve(process.cwd(), 'src/brands/rc'),
              path.resolve(process.cwd(), 'next'),
              path.resolve(process.cwd(), 'node_modules'),
              path.resolve(process.cwd(), '../../node_modules'),
            ],
            silenceDeprecations: ['import', 'global-builtin'],
            style: 'expanded',
          },
        },
      },
    ],
  });

  // inline scss only transform to css string
  rules.push({
    test: /(\.inline)\.(sass|scss)/,
    use: [
      {
        loader: 'postcss-loader',
        options: {
          postcssOptions: {
            plugins: () => [autoprefixer],
          },
        },
      },
      {
        loader: 'sass-loader',
        options: {
          api: 'modern',
          sassOptions: {
            loadPaths: [
              themeFolder,
              // Include brand config folders for theme variables
              path.resolve(process.cwd(), 'config/rc'),
              path.resolve(process.cwd(), 'src/brands/rc'),
              path.resolve(process.cwd(), 'next'),
              path.resolve(process.cwd(), 'node_modules'),
              path.resolve(process.cwd(), '../../node_modules'),
            ],
            silenceDeprecations: ['import', 'global-builtin'],
            style: 'expanded',
          },
        },
      },
    ],
  });

  // audio
  rules.push({
    test: /\.ogg$|\.wav$|\.mp3$/,
    resourceQuery: { not: [/url|raw/] },
    type: 'asset/resource',
    generator: {
      filename: `audio/[name]${enableHash ? '_[hash]' : ''}[ext]`,
    },
  });

  // images and svg font
  rules.push({
    test: /\.png|\.jpg|\.gif|fonts(\/|\\).*\.svg/,
    resourceQuery: { not: [/url|raw/] },
    type: 'asset/resource',
    generator: {
      filename: `images/[name]${enableHash ? '_[hash]' : ''}[ext]`,
    },
  });

  // svg
  rules.push({
    test: /\.svg$/,
    resourceQuery: { not: [/url|raw/] },
    exclude: /fonts/,
    use: ({ resource }: { resource: string }) => [
      ...threadLoader,
      {
        loader: '@svgr/webpack',
        options: {
          svgoConfig: {
            plugins: [
              {
                name: 'preset-default',
                params: {
                  overrides: {
                    removeViewBox: false,
                  },
                },
              },
              ...(prefixSvgId
                ? [
                    {
                      name: 'prefixIds',
                      params: {
                        prefix: hash(path.basename(resource, '.svg')),
                      },
                    },
                  ]
                : []),
            ],
          },
        },
      },
    ],
  });

  if (inlineFont) {
    // font
    rules.push({
      test: /\.woff|\.woff2|.eot|\.ttf/,
      type: 'asset/inline',
    });
  } else {
    // font
    rules.push({
      test: /\.woff|\.woff2|.eot|\.ttf/,
      resourceQuery: { not: [/url|raw/] },
      type: 'asset/resource',
      generator: {
        filename: `fonts/[name]${enableHash ? '_[hash]' : ''}[ext]`,
      },
    });
  }

  rules.push(
    // https://webpack.js.org/guides/asset-modules/#replacing-inline-loader-syntax
    {
      resourceQuery: /raw|inline/,
      type: 'asset/source',
    },
    {
      resourceQuery: /url/,
      type: 'asset/inline',
    },
  );

  return {
    mode,
    devtool,
    plugins,
    resolve: {
      // webpack < 5 used to include polyfills for node.js core modules by default.
      // This is no longer the case. Verify if you need this module and configure a polyfill for it.
      //
      // more doc: https://webpack.js.org/configuration/resolve/#resolvefallback
      //
      fallback: {
        // * ringcentral sdk need
        vm: require.resolve('vm-browserify'),
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        events: require.resolve('events'),
        // * react-markdown need that polyfill, can be remove after we not need
        path: require.resolve('path-browserify'),
      },
      // Prefer .js over .ts so webpack loads pre-compiled files from node_modules
      extensions: ['.js', '.jsx', '.ts', '.tsx'],
    },
    module: {
      rules,
    },
  };
};
