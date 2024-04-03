/**
 * VuePress config file: `docs/.vuepress/config.js`.
 * Documentation: https://vuepress.vuejs.org/config/.
 * https://github.com/ycmjason/ycmjason.com/blob/master/.vuepress/config.js
 */

const fs = require('fs')
const path = require('path')
const util = require('util')
// https://www.npmjs.com/package/debug
const debug = require('debug')
const debug_config = require('debug')('config')
const debug_vuepress = require('debug')('config:vuepress')
const debug_copy = require('debug')('config:copy')
const inspect_options = {
  compact: true,
  depth: 5,
  breakLength: Infinity /* 80 */,
  showHidden: false,
  colors: true,
  sorted: true,
  getters: true,
}

console.log('config.js: debug.enabled=%o', debug.enabled)
// generate_projects
// // https://github.com/visionmedia/debug/issues/582#issuecomment-418185850
// // https://github.com/visionmedia/debug/issues/582
const log_original = debug.log
function log_new(args) {
  const STACK_INDEX = 3

  const stack = new Error().stack.split('\n')
  // get text between two parentheses
  // '    at copyAllStaticFiles (/home/mbana/dev/bana-io/www.bana.io-vue-js/docs/.vuepress/config.js:134:13)'
  // ->
  //
  // Match 1
  // Full match	26-102	(/home/mbana/dev/bana-io/www.bana.io-vue-js/docs/.vuepress/config.js:134:13)
  // Group 1.	27-101	/home/mbana/dev/bana-io/www.bana.io-vue-js/docs/.vuepress/config.js:134:13
  const line = stack[STACK_INDEX].match(/\(([^)]+)\)/)[1]
  const func_name = stack[STACK_INDEX].match(/at (.*?) /)[1]

  // args = [args, debug.colors[5] + '(' + func_name + ':' + line + ')' + debug.colors[5]].join(' ');
  args = [
    args,
    '\u001b[38;5;201;1m(' + func_name + ':' + line + ')\u001b[0m',
  ].join(' ')
  log_original(args)
}
debug.log = log_new
debug_config.log = log_new
debug_vuepress.log = log_new
debug_copy.log = log_new

// https://gist.github.com/kethinov/6658166
// List all files in a directory in Node.js recursively in a synchronous fashion
const allFilesSync = (dir, fileList = []) => {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file)
    fileList.push(
      fs.statSync(filePath).isDirectory()
        ? { [file]: allFilesSync(filePath) }
        : file
    )
  })
  return fileList
}

const copyStaticFilesToPublic = () => {
  // const doNotCopyFilenames = [
  //     // new RegExp("^.*\\.md$"),
  //     new RegExp(/^.*\.(md)(\?.*)?$/),
  // ];
  // const copyFileNames = [
  //   // new RegExp("^.*\\.pdf$"),
  //   // new RegExp(/^.*\.(pdf)(\?.*)?$/),
  //   // /^.*(?<!\.md)$/gi,

  //   // NB:
  //   // Negative Lookbehind (?<!\.(md|png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))
  //   // Assert that the Regex below does not match
  //   // new RegExp(/^.*(?<!\.(md|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))$/iug),
  //   new RegExp(
  //     /^.*(?<!\.(md|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf|Makefile|json|ya?ml|mkiv))$/iu
  //   ),
  //   new RegExp(
  //     /^.*(?<!\.(Makefile|json|ya?ml|mkiv))$/iu
  //   ),
  //   new RegExp(
  //     /^.*(?<!\.(Makefile|json|yml|ya?ml|mkiv))$/i
  //   ),
  //   // new RegExp(/^.*(?<!\.(md|png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))$/i),
  // ]
    // NB:
    // Negative Lookbehind (?<!\.(md|png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))
    // Assert that the Regex below does not match
    // new RegExp(/^.*(?<!\.(md|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))$/iug),
  const copyFileNames = [
    new RegExp(
      /^.*(?<!\.(md|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))$/iu
    ),
    new RegExp(
      /^.*\.(Makefile|json|yml|ya?ml|mkiv)$/iu
    ),
    new RegExp(
      /^.*\.(Makefile|json|yml|ya?ml|mkiv)$/i
    ),
    new RegExp(
      /^.*\.(Makefile|json|yml|yaml|mkiv)$/iu
    ),
    new RegExp(
      /^.*\.(Makefile|json|yml|yaml|mkiv)$/i
    ),
    // new RegExp(/^.*(?<!\.(md|png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|flac|aac|woff2?|eot|ttf|otf))$/i),
  ]
  const doNotCopyFolderNames = [
    new RegExp(/^.*\.vuepress$/giu),
    new RegExp(/^.*\.cache$/giu),
    new RegExp(/^.*\.temp$/giu),
    new RegExp(/^.*dist$/giu),
  ]
  debug_copy('copyFileNames=%o', copyFileNames);
  // debug_copy('doNotCopyFolderNames=%o', doNotCopyFolderNames);

  const pathToPublicFolder = path.resolve(__dirname, 'public')
  const pathToSrcFolder = path.resolve(__dirname, '../')
  // debug_copy('pathToPublicFolder=%o', pathToPublicFolder);
  // debug_copy('pathToSrcFolder=%o', pathToSrcFolder);

  // if (fs.existsSync(pathToPublicFolder)) {
  //     fs.rmdirSync(pathToPublicFolder, { recursive: true }); // Requires latest version of node.
  // }

  const copyAllStaticFiles = (pathToSourceFolder, pathToDestinationFolder) => {
    // debug_copy('pathToSourceFolder=%O', pathToSrcFolder);
    // debug_copy('pathToDestinationFolder=%O', pathToDestinationFolder);

    if (!fs.existsSync(pathToDestinationFolder)) {
      debug_copy(
        '!fs.existsSync(pathToDestinationFolder) - CREATING pathToDestinationFolder=%o',
        pathToDestinationFolder
      )
      fs.mkdirSync(pathToDestinationFolder)
    } else {
      debug_copy(
        'fs.existsSync(pathToDestinationFolder) - SKIPPING pathToDestinationFolder=%o',
        pathToDestinationFolder
      )
    }

    const names = fs.readdirSync(pathToSourceFolder)
    // debug_copy('readdirSync names=%O', names);

    for (const name of names) {
      const pathToSource = path.resolve(pathToSourceFolder, name)
      const pathToDestination = path.resolve(pathToDestinationFolder, name)
      debug_copy('resolve name=%o', name)
      debug_copy('resolve pathToSource=%o', pathToSource)
      debug_copy('resolve pathToDestination=%o', pathToDestination)

      if (fs.lstatSync(pathToSource).isDirectory()) {
        if (doNotCopyFolderNames.some((regexp) => regexp.test(name))) {
          debug_copy(
            'fs.lstatSync(pathToSource).isDirectory() - SKIPPING doNotCopyFolderNames name=%o',
            name
          )
        } else {
          const isEmptyDir = fs.readdirSync(pathToSource).length === 0
          if (!isEmptyDir) {
            debug_copy(
              'fs.lstatSync(pathToSource).isDirectory() - !isEmptyDir - RECURSE doNotCopyFolderNames name=%o',
              name
            )
            copyAllStaticFiles(pathToSource, pathToDestination)
          } else {
            debug_copy(
              'fs.lstatSync(pathToSource).isDirectory() - isEmptyDir - RECURSE doNotCopyFolderNames name=%o',
              name
            )
          }
        }
      } else {
          debug_copy(
            'copyFileNames.some(regexp => regexp.test(name)) - CREATE copyFileNames name=%o, copy=%o',
            name, copyFileNames.some((regexp) => regexp.test(name)),
          )
        if (copyFileNames.some((regexp) => regexp.test(name))) {
          debug_copy(
            'copyFileNames.some(regexp => regexp.test(name)) - CREATE copyFileNames name=%o',
            name
          )
          fs.copyFileSync(pathToSource, pathToDestination)
        } else {
          debug_copy(
            'copyFileNames.some(regexp => regexp.test(name)) - SKIPPING copyFileNames name=%o',
            name
          )
        }

        // old
        // if (!doNotCopyFilenames.some(regexp => regexp.test(name))) {
        //     fs.copyFileSync(pathToSource, pathToDestination);
        // }
      }
    }
  }

  copyAllStaticFiles(pathToSrcFolder, pathToPublicFolder)
  allFilesSync(pathToPublicFolder)
  // const publicTree = allFilesSync(pathToPublicFolder);
  // debug_copy('----------------------------------------');
  // debug_copy(util.formatWithOptions({
  //     getters: true,
  //     showHidden: true,
  //     depth: Infinity,
  //     colors: true,
  //     customInspect: true,
  //     showProxy: true,
  //     maxArrayLength: Infinity,
  //     maxStringLength: null,
  //     breakLength: Infinity,
  //     compact: false,
  //     sorted: false,
  // }, 'copyAllStaticFiles - FINISHED publicTree=%o', publicTree));
  // debug_copy('----------------------------------------');
}

// module.exports = (async () => {
//     // console.log('config.js: generate_projects=%o', generate_projects);
//     // console.log('config.js: generate_projects=%O', generate_projects);
//     const projects = await generate_projects;
//     // console.log('config.js: projects=%o', projects);
//     // console.log('config.js: projects=%O', projects);

// <!-- Global site tag (gtag.js) - Google Analytics -->
// <script async src="https://www.googletagmanager.com/gtag/js?id=UA-213150018-1">
// </script>
// <script>
//   window.dataLayer = window.dataLayer || [];
//   function gtag(){dataLayer.push(arguments);}
//   gtag('js', new Date());

//   gtag('config', 'UA-213150018-1');
// </script>

module.exports = {
  // https://vuepress.vuejs.org/config/#basic-config
  title: 'BanaIO',
  description: 'The Builder',
  // description: 'Mohamed Bana—The Builder',
  // https://vuepress.vuejs.org/config/#head
  head: [
    // ['link', { rel: 'icon', href: '/favicon.webp' }],
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    // ['link', { rel: 'icon', href: 'favicon.png' }],
    ['link', { rel: 'manifest', href: '/manifest.json' }],
    // https://stackoverflow.com/a/56423507
    // https://stackoverflow.com/questions/12316501/including-google-web-fonts-link-or-import
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.gstatic.com/' /*, crossorigin: true */,
      },
    ],
    [
      'link',
      {
        rel: 'preconnect',
        href: 'https://fonts.googleapis.com/' /*, crossorigin: true */,
      },
    ],
    // https://3perf.com/blog/link-rels/
    ['link', { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com/' }],
    ['link', { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com/' }],
    [
      'link',
      {
        rel: 'preload',
        href:
          'https://fonts.googleapis.com/css2?family=Alegreya+SC:ital,wght@0,400;0,500;0,700;0,800;0,900;1,400;1,500;1,700;1,800;1,900&family=Alegreya+Sans+SC:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900&family=Alegreya+Sans:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900&family=Alegreya:ital,wght@0,400;0,500;0,700;0,800;0,900;1,400;1,500;1,700;1,800;1,900&display=swap',
        as: 'style',
        onload: "this.rel='stylesheet'",
      },
    ],
    // [
    //     'link',
    //     {
    //         rel: 'stylesheet',
    //         href: 'https://fonts.googleapis.com/css2?family=Alegreya+SC:ital,wght@0,400;0,500;0,700;0,800;0,900;1,400;1,500;1,700;1,800;1,900&family=Alegreya+Sans+SC:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900&family=Alegreya+Sans:ital,wght@0,100;0,300;0,400;0,500;0,700;0,800;0,900;1,100;1,300;1,400;1,500;1,700;1,800;1,900&family=Alegreya:ital,wght@0,400;0,500;0,700;0,800;0,900;1,400;1,500;1,700;1,800;1,900&display=swap',
    //     }
    // ],
    // [
    //     'link',
    //     {
    //         rel: 'stylesheet',
    //         href: 'https://fonts.googleapis.com/css?family=Raleway:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i&amp;subset=latin-ext',
    //     }
    // ],
    // [
    //     'link',
    //     {
    //         rel: 'stylesheet',
    //         href: 'https://fonts.googleapis.com/css?family=Roboto+Condensed:300,300i,400,400i,700,700i|Roboto+Mono:100,100i,300,300i,400,400i,500,500i,700,700i|Roboto+Slab:100,300,400,700|Roboto:100,100i,300,300i,400,400i,500,500i,700,700i,900,900i&amp;subset=cyrillic,cyrillic-ext,greek,greek-ext,latin-ext,vietnamese',
    //     }
    // ],
    // [
    //     'link',
    //     {
    //         rel: 'stylesheet',
    //         href: 'https://fonts.googleapis.com/css?family=Merriweather:300,300i,400,400i,700,700i,900,900i|Montserrat:100,100i,200,200i,300,300i,400,400i,500,500i,600,600i,700,700i,800,800i,900,900i|Open+Sans:300,300i,400,400i,600,600i,700,700i,800,800i|Reem+Kufi&amp;subset=arabic,cyrillic,cyrillic-ext,greek,greek-ext,latin-ext,vietnamese',
    //     }
    // ],
  ],
  // https://vuepress.vuejs.org/theme/default-theme-config.html
  // External links: `rel="noopener"` or `rel="noreferrer"`
  themeConfig: {
    // logo: 'logo/logo.webp',
    // logo: 'favicon.webp',
    // logo: 'favicon.svg',
    logo: '/favicon.svg',
    nav: [
      {
        text: 'jobs@bana.io',
        link: 'mailto:jobs@bana.io',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
      {
        text: 'Open Source',
        items: [
          {
            text: 'GitHub - mbana',
            link: 'https://github.com/mbana',
          },
          {
            text: 'GitHub - BanaIO',
            link: 'https://github.com/bana-io',
          },
          {
            text: 'GitHub - bana.rs',
            link: 'https://github.com/bana-rs',
          },
          {
            text: 'GitHub - m_bana',
            link: 'https://gitlab.com/m_bana',
          },
        //   {
        //     text: 'Twitter - BanaIO',
        //     link: 'https://twitter.com/banaio_ltd/',
        //   },
        ],
      },
      {
        text: 'Resume',
        link: '/resume/',
        items: [
          {
            text: 'CV',
            link: '/resume/cv',
          },
          {
            text: 'Cover Letter',
            link: '/resume/cover-letter',
          },
          {
            text: 'CV Download',
            link: '/resume/cv-download',
          },
          {
            text: 'LinkedIn',
            link: 'https://linkedin.com/in/mbana',
          },
        ],
      },
      {
        text: 'Socials',
        items: [
          {
            text: 'Twitter',
            link: 'https://twitter.com/m_bana/',
          },
          {
            text: 'Stack Overflow',
            link: 'https://stackoverflow.com/users/241993/mohamed-bana',
          },
          {
            text: 'Reddit',
            link: 'https://www.reddit.com/user/mohamed-bana',
          },
        ],
      },
      {
        text: 'CV Download',
        link: '/resume/cv-download',
      },
      {
        text: 'Blog',
        link: '/blog/',
      },
    ],
    sidebar: 'auto',
    sidebarDepth: 10,
    displayAllHeaders: true,
    // // https://vuepress.vuejs.org/theme/default-theme-config.html#search-box
    // searchMaxSuggestions: 20,
    // https://vuepress.vuejs.org/theme/default-theme-config.html#smooth-scrolling
    smoothScroll: true,
    // https://vuepress.vuejs.org/theme/default-theme-config.html#last-updated
    // lastUpdated: true,
    lastUpdated: 'Last Updated',
    // serviceWorker: {
    //     updatePopup: {
    //         message: "New content is available.",
    //         buttonText: "Refresh"
    //     }
    // },
  },
  // serviceWorker: true,
  // permalink: ':slug',
  plugins: [
    // https://vuepress.vuejs.org/plugin/official/plugin-back-to-top.html
    '@vuepress/back-to-top',
    // https://vuepress.vuejs.org/plugin/official/plugin-nprogress.html
    '@vuepress/nprogress',
    // '@vuepress/blog': {
    //     postsDir: 'blog',
    //     permalink: ':regular',
    // },
    // '@vuepress/pagination': {},
    '@vuepress/google-analytics',
    {
      'ga': 'UA-213150018-1' // UA-00000000-0
    },
  ],
  markdown: {
    // https://vuepress.vuejs.org/config/#markdown-externallinks
    externalLinks: {
        target: '_self',
        rel: ''
    },
    // https://vuepress.vuejs.org/config/#markdown-linenumbers
    lineNumbers: true,
    // options for markdown-it-anchor
    anchor: {
      permalinkBefore: true,
      permalink: true,
      level: [
        // We don't want to include the top-level header, so remove level 1.
        // 1,
        2,
        3,
        4,
        5,
        6,
      ],
      // callback: (args) => {
      //     debug('markdown:anchor:callback args=', args);
      // },
      // format: (args) => {
      //     debug('markdown:anchor:format args=', args);
      // },
    },
    // options for markdown-it-toc
    toc: {
      includeLevel: [
        // We don't want to include the top-level header, so remove level 1.
        // 1,
        2,
        3,
        4,
        5,
        6,
      ],
      // If you want to debug this, e.g., to compare it again Confluence, uncomment line below
      // and the table of contents will be numbered (ol=ordered list) instead of being
      // un-numbered (ul=unordered list).
      // 'listType': 'ol',

      // callback: (args) => {
      //     debug('markdown:toc:callback args=', args);
      // },
      // format: (args) => {
      //     debug('markdown:toc:formatormat args=', args);
      // },
    },
    extendMarkdown: (md) => {
      debug_vuepress(
        'markdown:extendMarkdown - md=',
        util.inspect(md, inspect_options)
      )
      // use more markdown-it plugins!
      // Converts '\n' in paragraphs into <br>
      // md.set({ breaks: true });
      md.use(require('markdown-it-katex'))
      md.use(require('markdown-it-footnote'))
      return md
    },
    // https://vuepress.vuejs.org/plugin/option-api.html#chainmarkdown
    chainMarkdown: (config) => {
      debug_vuepress(
        'markdown:extendMarkdown - config=',
        util.inspect(config, inspect_options)
      )
      return config
    },
  },
  // https://vuepress.vuejs.org/config/#cache
  cache: false,
  // https://vuepress.vuejs.org/config/#extrawatchfiles
  // extraWatchFiles: [
  //     '.vuepress/config.js',
  //     // '.vuepress/enhanceApp.js',
  //     // './docs/.vuepress/enhanceApp.js',
  //     // 'docs/.vuepress/enhanceApp.js',
  //     '.vuepress/config/**',
  //     'docs/.vuepress/config/*.js',
  //     './docs/.vuepress/config/*.js',
  //     // '**/*.pdf',
  //     // './resume/*.pdf',
  //     // './resume/**.pdf',
  //     // './resume/Mohamed_Bana-CV-LinkedIn.pdf',
  //     // './resume/Mohamed_Bana-CV-LinkedIn_Profile.pdf',
  // ],
  // https://cli.vuejs.org/config/#devserver
  // https://webpack.js.org/configuration/dev-server/
  //
  // These settings control the server that is started when you do `yarn serve`.
  devServer: {
    // string = 'info': 'silent' | 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'none' | 'warning'
    clientLogLevel: 'info',
    // compress: true,
    // compress: false,
    // https://webpack.js.org/configuration/dev-server/#devserveroverlay
    overlay: {
      warnings: true,
      errors: true,
    },
    // quiet: true,
    // open: 'Google Chrome',// Mac
    open: 'google-chrome', // Linux
    // https://webpack.js.org/configuration/dev-server/#devserveropenpage
    // openPage: [
    //     // 'the-quran',
    //     // 'resume/about-me',
    //     // 'resume/cv',
    //     'resume',
    //     // '',
    // ],
    // https://webpack.js.org/configuration/dev-server/#devserverhistoryapifallback
    // historyApiFallback: true,
    // // https://webpack.js.org/configuration/dev-server/#devserverserveindex
    // serveIndex: true,
    // // https://webpack.js.org/configuration/dev-server/#devserverstats-
    // // string: 'none' | 'errors-only' | 'minimal' | 'normal' | 'verbose' object
    // stats: 'errors-only',
    // // https://webpack.js.org/configuration/dev-server/#devserverwatchcontentbase
    // watchContentBase: true,
    // // https://webpack.js.org/configuration/dev-server/#devserverwritetodisk-
    // writeToDisk: true,

    // https://webpack.js.org/configuration/output/#outputpath
    // doesn't work
    // pathinfo: true,
  },
  // https://cli.vuejs.org/config/#configurewebpack
  // https://vuepress.vuejs.org/config/#configurewebpack
  // https://cli.vuejs.org/guide/webpack.html#modifying-options-of-a-loader
  chainWebpack: (config, isServer) => {
    // config.module
    //     .rule('pdfs')
    //     .test(/\.(pdf)(\?.*)?$/)
    //     .use('file-loader')
    //     .loader('file-loader')
    //     .options({
    //         // debug('pdf - options=%O', options);
    //         // const optionsDefault = {
    //         //     name: `assets/pdf/[path][name].[ext]`,
    //         // };
    //         // const opts = { ...options, ...optionsDefault };
    //         // debug('pdf - opts=%O', opts);
    //         // return opts;
    //         name: `[path][name].[ext]`,
    //     })
    //     .end();

    copyStaticFilesToPublic()
    // debug('pdf - options=%s', config.toString());
  },
  // https://vuepress.vuejs.org/config/#evergreen
  // evergreen: true,
  // https://cli.vuejs.org/config/#chainwebpack
  // https://vuepress.vuejs.org/config/#chainwebpack
  configureWebpack: (config, isServer) => {
    // debug('configureWebpack - options=%s', config.toString());
    // debug('configureWebpack - isServer=%s, config.module=', isServer, config.module);
    // Inline fonts and images so we don't do another fetch for them.
    // If we set `limit` to zero, all the fonts and images are inlined.
    // Explanation can be found in:
    // * https://cli.vuejs.org/guide/webpack.html#replacing-loaders-of-a-rule
    // * https://github.com/vuejs/vue-cli/issues/3215
    // config.module.rule('fonts').use('url-loader').tap((opts) => {
    //     const options = Object.assign(opts, { limit: 0 });
    //     return options;
    // });
    // config.module.rule('images').use('url-loader').tap((opts) => {
    //     const options = Object.assign(opts, { limit: 0 });
    //     return options;
    // });
    // // https://github.com/vuejs/vuepress/issues/700#issuecomment-460550225
    // config.module
    //     .rule('pdfs')
    //     .test(/\.pdf$/)
    //     .use('file-loader')
    //     .loader('file-loader')
    //     .options({
    //         name: `[path][name].[ext]`
    //     });
  },
  // // https://cli.vuejs.org/config/#runtimecompiler
  // runtimeCompiler: true,
  // https://cli.vuejs.org/config/#productionsourcemap
  productionSourceMap: true,
  // https://cli.vuejs.org/config/#parallel
  parallel: 32,
  // https://cli.vuejs.org/config/#css-sourcemap
  css: {
    sourceMap: true,
  },
  // https://vuepress.vuejs.org/config/#evergreen
  // This will disable ES5 transpilation and polyfills for IE, and result in faster builds and smaller files.
  // Set to true, if we want to support IE.
  evergreen: true,
}

// console.log('module.exports=%O', module.exports);
// console.log('module.exports=%o', module.exports);
// console.log('module.exports=%o', util.inspect(module.exports, inspect_options));
// console.log('module.exports=%O', util.inspect(module.exports, inspect_options));
// })();
