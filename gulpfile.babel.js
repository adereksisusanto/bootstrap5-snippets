import gulp from "gulp";
import autoprefixer from "autoprefixer";
import concat from "gulp-concat";
import uglify from "gulp-uglify";
import rename from "gulp-rename";
import cleanCSS from "gulp-clean-css";
import header from "gulp-header";
import sass from "gulp-sass";
import postcss from "gulp-postcss";
import connectphp from "gulp-connect-php";
import browserSync from "browser-sync";
import del from "del";
import webpack from "webpack";
import gulpWebpack from "webpack-stream";
import strip from "gulp-strip-comments";
import named from "vinyl-named";
import changed from "gulp-changed";
import npmDist from "gulp-npm-dist";
import nunjucksRender from "gulp-nunjucks-render";
import htmlmin from "gulp-htmlmin";

////////////////////////////////////////////////////////////////////////////////////////////////
//
// SETTING UP
//
////////////////////////////////////////////////////////////////////////////////////////////////

// webpack Options
const webpackOptions = {
  development: {
    mode: "development",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: "babel-loader?cacheDirectory=true",
          },
        },
      ],
    },
  },
  production: {
    mode: "production",
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /(node_modules)/,
          use: {
            loader: "babel-loader?cacheDirectory=true",
          },
        },
      ],
    },
  },
};

// Get info from package.json
const pkg = require("./package.json");
const pkgName = pkg.name.toLowerCase();
const pkgNameJSCore = pkgName + ".core";
const pkgNameJSMain = pkgName + ".app";

// Banner to be added at the top of the files
const banner = [
  "/*!",
  ` * ${pkg.name} - v${pkg.version}`,
  ` * @author ${pkg.author} - ${pkg.homepage}`,
  ` * Copyright (c) ${new Date().getFullYear()}`,
  " */",
  "",
].join("\n");

const bannerHTML = [
  "<!--",
  ` * ${pkg.name} - v${pkg.version}`,
  ` * @author ${pkg.author} - ${pkg.homepage}`,
  ` * Copyright (c) ${new Date().getFullYear()}`,
  " -->",
  "",
].join("\n");

// Directories and paths
const dir = {
  src: "src/",
  assets: "assets/",
  build: "docs/",
};

const path = {
  dir: {
    src: dir.src,
    build: dir.build,
  },
  src: {
    assets: dir.src + dir.assets,
    es6: dir.src + dir.assets + "_es6/",
    extralibs: dir.src + dir.assets + "_extra-libs/",
    libs: dir.src + dir.assets + "_libs/",
    scss: dir.src + dir.assets + "_scss/",
    templates: dir.src + dir.assets + "_templates/",
    css: dir.src + dir.assets + "css/",
    fonts: dir.src + dir.assets + "fonts/",
    images: dir.src + dir.assets + "images/",
    js: dir.src + dir.assets + "js/",
    jscore: dir.src + dir.assets + "js/core/",
    plugins: dir.src + dir.assets + "plugins/",
  },
  build: {
    assets: dir.build + dir.assets,
    css: dir.build + dir.assets + "css/",
    fonts: dir.build + dir.assets + "fonts/",
    images: dir.build + dir.assets + "images/",
    js: dir.build + dir.assets + "js/",
    plugins: dir.build + dir.assets + "plugins/",
  },
};

// Various file sources used in tasks
const files = {
  watch: {
    // When the following files are changed the server will reload
    server: [
      path.src.css + pkgName + ".min.css",
      path.src.js + pkgNameJSMain + ".min.js",
      path.dir.src + "**/*.html",
    ],
    // SASS files to watch
    scss: path.src.scss + "**/*.scss",
    es6: {
      // JS main files to watch (ES6)
      main: path.src.es6 + "**/*.js",
    },
    templates: path.src.templates + "**/*.njk",
  },
  src: {
    scss: {
      main: path.src.scss + "main.scss",
    },
    css: {
      main: path.src.css + pkgName + ".css",
    },
    es6: {
      main: path.src.es6 + "main.js",
    },
    js: {
      main: path.src.js + pkgNameJSMain + "*.min.js",
    },
    templates: path.src.templates + "[^_]*.njk",
  },
  build: {
    // Files to be copied over on build task
    copy: [
      path.src.css + "**/*.min.css",
      path.src.js + "*.min.js",
      path.src.plugins + "**/*.*",
      path.src.fonts + "**/*.*",
      path.src.images + "**/*.*",
      path.dir.src + "**/*.html",
    ],
  },
};

// Dependencies to be copied over from node_modules
const dependencies = {
  scss: {
    bootstrap: {
      base: path.src.scss + "vendor/bootstrap/",
      src: "node_modules/bootstrap/scss/**/*",
      dest: path.src.scss + "vendor/bootstrap/",
    },
    adereksisusantoicons: {
      base: path.src.scss + "vendor/adereksisusanto/icons/",
      src: "node_modules/@adereksisusanto/icons/src/scss/**/*",
      dest: path.src.scss + "vendor/adereksisusanto/icons/",
    },
    highlightjs: {
      base: path.src.scss + "vendor/highlight.js/",
      src: "node_modules/highlight.js/scss/**/*",
      dest: path.src.scss + "vendor/highlight.js/",
    },
  },
  fonts: {
    adereksisusantoicons: {
      base: path.src.fonts + "adereksisusanto/icons/",
      src: "node_modules/@adereksisusanto/icons/src/fonts/**/*",
      dest: path.src.fonts + "adereksisusanto/icons/",
    },
  },
  js: {},
};

////////////////////////////////////////////////////////////////////////////////////////////////
//
// SERVER Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// Static Web Server with browserSync
gulp.task("serve-html", () => {
  browserSync.init({
    server: {
      baseDir: path.dir.src,
    },
    injectChanges: true,
    notify: false,
  });

  gulp.watch(files.watch.server).on("change", () => {
    browserSync.reload();
  });
});

////////////////////////////////////////////////////////////////////////////////////////////////
//
// Dependencies Copy Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// Delete original dependency and copy over new files (Minify or clean source map comments if is set)
function depUpdate(depName, depData) {
  del(depData.base).then(() => {
    if (depData.min) {
      return gulp
        .src(depData.src)
        .pipe(uglify({ output: { comments: "/^!/" } }))
        .pipe(rename({ suffix: ".min" }))
        .pipe(gulp.dest(depData.dest));
    } else if (depData.minclean) {
      return gulp
        .src(depData.src)
        .pipe(strip({ safe: true }))
        .pipe(gulp.dest(depData.dest));
    } else {
      return gulp.src(depData.src).pipe(gulp.dest(depData.dest));
    }
  });
}

// Update SCSS dependencies
gulp.task("dep-scss", (done) => {
  for (const [key, value] of Object.entries(dependencies.scss)) {
    depUpdate(key, value);
  }

  done();
});

// Update Fonts dependencies
gulp.task("dep-fonts", (done) => {
  for (const [key, value] of Object.entries(dependencies.fonts)) {
    depUpdate(key, value);
  }

  done();
});

////////////////////////////////////////////////////////////////////////////////////////////////
//
// SASS to CSS Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// SASS to CSS task for main styles
gulp.task("css-scss-main", () => {
  return gulp
    .src(files.src.scss.main)
    .pipe(
      sass({ outputStyle: "expanded", precision: 6 }).on("error", sass.logError)
    )
    .pipe(postcss([autoprefixer()]))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(rename({ basename: pkgName }))
    .pipe(gulp.dest(path.src.css));
});

// Minify main CSS
gulp.task("css-min-main", () => {
  return gulp
    .src(files.src.css.main)
    .pipe(cleanCSS({ level: { 1: { specialComments: 0 } } }))
    .pipe(rename({ suffix: ".min" }))
    .pipe(gulp.dest(path.src.css));
});

////////////////////////////////////////////////////////////////////////////////////////////////
//
// ES6 to ES5 Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// ES6 to ES5 main JS (development friendly)
gulp.task("js-es6-main-dev", () => {
  return gulp
    .src(files.src.es6.main)
    .pipe(named())
    .pipe(gulpWebpack(webpackOptions.development, webpack))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(rename({ basename: pkgNameJSMain }))
    .pipe(gulp.dest(path.src.js));
});

// ES6 to ES5 main JS (production ready)
gulp.task("js-es6-main", () => {
  return gulp
    .src(files.src.es6.main)
    .pipe(named())
    .pipe(gulpWebpack(webpackOptions.production, webpack))
    .pipe(header(banner, { pkg: pkg }))
    .pipe(rename({ basename: pkgNameJSMain, suffix: ".min" }))
    .pipe(gulp.dest(path.src.js));
});

////////////////////////////////////////////////////////////////////////////////////////////////
//
// NUNJUCKS to HTML Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////
// dev
gulp.task("njk-html-dev", () => {
  return gulp
    .src(files.src.templates)
    .pipe(
      nunjucksRender({
        path: path.src.templates,
      })
    )
    .pipe(gulp.dest(path.dir.src));
});

// prod
gulp.task("njk-html", () => {
  return gulp
    .src(files.src.templates)
    .pipe(
      nunjucksRender({
        path: path.src.templates,
      })
    )
    .pipe(htmlmin({ collapseWhitespace: true }))
    .pipe(gulp.dest(path.dir.src));
});

////////////////////////////////////////////////////////////////////////////////////////////////
//
// Build Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// Clean build directory and alias
gulp.task("build-clean", () => {
  return del(path.dir.build);
});
gulp.task("clean", gulp.series("build-clean"));

// Copy folders and files to build folder
gulp.task("build-copy", () => {
  return gulp
    .src(files.build.copy, { base: path.dir.src })
    .pipe(gulp.dest(path.dir.build));
});

////////////////////////////////////////////////////////////////////////////////////////////////
//
// Creating Main Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// Update Dependencies
gulp.task("dep-update", gulp.series("dep-scss", "dep-fonts"));

// SASS to CSS
gulp.task(
  "css",
  gulp.series(gulp.parallel("css-scss-main"), gulp.parallel("css-min-main"))
);

// ES6 to ES5
gulp.task(
  "js-dev",
  gulp.series(gulp.parallel("js-es6-main-dev"), gulp.parallel("js-es6-main"))
);
gulp.task("js", gulp.series(gulp.parallel("js-es6-main")));

// NUNJUCKS to HTML
gulp.task("html-dev", gulp.series(gulp.parallel("njk-html-dev")));
gulp.task("html", gulp.series(gulp.parallel("njk-html")));

// Build task
gulp.task(
  "build",
  gulp.series("css", "js", "html", "build-clean", "build-copy")
);

////////////////////////////////////////////////////////////////////////////////////////////////
//
// Watch Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// Watch task for SASS files
gulp.task("watch-scss", () => {
  return gulp.watch(files.watch.scss, gulp.series("css"));
});

// Watch tasks for Main JS files
gulp.task("watch-es6-main-dev", () => {
  return gulp.watch(
    files.watch.es6.main,
    gulp.series("js-es6-main-dev", "js-es6-main")
  );
});
gulp.task("watch-es6-main", () => {
  return gulp.watch(files.watch.es6.main, gulp.series("js-es6-main"));
});

// Watch tasks for HTML files
gulp.task("watch-njk-html-dev", () => {
  return gulp.watch(files.watch.templates, gulp.series("html-dev"));
});
gulp.task("watch-njk-html", () => {
  return gulp.watch(files.watch.templates, gulp.series("html"));
});

// Watch task for all files
gulp.task(
  "watch-dev",
  gulp.parallel("watch-scss", "watch-es6-main-dev", "watch-njk-html-dev")
);
gulp.task(
  "watch",
  gulp.parallel("watch-scss", "watch-es6-main", "watch-njk-html")
);

////////////////////////////////////////////////////////////////////////////////////////////////
//
// Run Related Tasks
//
////////////////////////////////////////////////////////////////////////////////////////////////

// HTML Server and Watch files (-dev also produces unminimized development friendly JS files from ES6)
gulp.task("run-html-dev", gulp.parallel("serve-html", "watch-dev"));
gulp.task("run-html", gulp.parallel("serve-html", "watch"));

// Default task
gulp.task("default", gulp.series("run-html"));
