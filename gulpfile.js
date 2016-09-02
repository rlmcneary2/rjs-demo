"use strict";


const gulp = require("gulp");
const gutil = require("gulp-util");
const packager = require("electron-packager");
const rimraf = require("rimraf");
const webpack = require("webpack");
// const webpackConfig = require("./webpack.config.js");
const webpackElectronConfig = require("./webpack-electron.config.js");


const _APP_JS_ENTRY_FILE = "index.js";
const _APP_JS_OUTPUT_FILE = "app.js";
//const _ELECTRON_JS_ENTRY_FILE = "main.js";
//const _ELECTRON_JS_OUTPUT_FILE = "main.js";
const _SRC_APP = "src/app";
const _SRC_ELECTRON = "src/electron";
const _DIST_APP_DIR = "app";
const _DIST_DIR = "dist";
const _DIST_PACKAGE_DIR = "package";


gulp.task("build-application", gulp.parallel(buildAppJavascript, () => copyHtml(_SRC_APP, _DIST_APP_DIR)));

gulp.task("build-electron", gulp.parallel(
    () => copyFiles(_SRC_ELECTRON, _DIST_APP_DIR, "js"),
    () => copyFiles(_SRC_ELECTRON, _DIST_APP_DIR, "json")
));

gulp.task("clean", () => {
    return new Promise((resolve, reject) => {
        rimraf(_DIST_DIR, err => {
            if (err) {
                gutil.log("[rimraf]", `error - ${err}`);
                reject(gutil.PluginError("rimraf", err));
                return;
            }

            resolve();
        });
    });
});

gulp.task("set-debug", callback => {
    process.env.NODE_ENV = "debug";
    callback();
});

// All the tasks required by this task must be defined above it.
gulp.task("debug", gulp.series("set-debug", gulp.parallel("build-application", "build-electron")), callback => {
    callback();
});

gulp.task("set-release", callback => {
    process.env.NODE_ENV = "production";
    callback();
});

// All the tasks required by this task must be defined above it.
gulp.task("release", gulp.series("set-release", "clean", gulp.parallel("build-application", "build-electron")), callback => {
    callback();
});

gulp.task("package-task", () => {
    return electronPackager({ platform: "win32" });
});

gulp.task("package-debug", gulp.series("set-debug", "package-task"), callback => {
    callback();
});

gulp.task("package-release", gulp.series("set-release", "package-task"), callback => {
    callback();
});


function buildAppJavascript() {
    return new Promise((resolve, reject) => {
        const config = Object.create(/*webpackConfig*/webpackElectronConfig);
        config.entry = `./${_SRC_APP}/${_APP_JS_ENTRY_FILE}`;
        config.output = { filename: _APP_JS_OUTPUT_FILE, path: `${_DIST_DIR}/${_DIST_APP_DIR}` };
        config.plugins = config.plugins || [];
        config.plugins.push(new webpack.DefinePlugin({ "process.env": { NODE_ENV: process.env.NODE_ENV } }));

        if (process.env.NODE_ENV === "debug") {
            config.debug = true;
            config.devtool = "source-maps";
        }

        webpack(config, (err, stats) => {
            if (err) {
                gutil.log("[webpack]", `error - ${err}`);
                reject(gutil.PluginError("webpack", err));
                return;
            }

            gutil.log("[webpack]", stats.toString());
            resolve();
        });
    });
}

// function buildElectronJavascript() {
//     return new Promise((resolve, reject) => {
//         const config = Object.create(webpackElectronConfig);
//         config.entry = `./${_SRC_ELECTRON}/${_ELECTRON_JS_ENTRY_FILE}`;
//         config.output = { filename: _ELECTRON_JS_OUTPUT_FILE, path: `${_DIST_DIR}/${_DIST_APP_DIR}` };
//         config.plugins = config.plugins || [];
//         config.plugins.push(new webpack.DefinePlugin({ "process.env": { NODE_ENV: process.env.NODE_ENV } }));

//         if (process.env.NODE_ENV === "debug") {
//             config.debug = true;
//             config.devtool = "source-maps";
//         }

//         webpack(config, (err, stats) => {
//             if (err) {
//                 gutil.log("[webpack]", `error - ${err}`);
//                 reject(gutil.PluginError("webpack", err));
//                 return;
//             }

//             gutil.log("[webpack]", stats.toString());
//             resolve();
//         });
//     });
// }

function copyFiles(sourceDir, destinationDir, ext) {
    return gulp.src([`${sourceDir}/*.${ext}`, `${sourceDir}/**/*.${ext}`])
        .pipe(gulp.dest(`${_DIST_DIR}/${destinationDir}/`));
}

function copyHtml(sourceDir, destinationDir) {
    return gulp.src([`${sourceDir}/*.html`, `${sourceDir}/**/*.html`])
        .pipe(gulp.dest(`${_DIST_DIR}/${destinationDir}/`));
}

function electronPackager(options) {
    return new Promise((resolve, reject) => {
        const packagerOptions = Object.assign({
            asar: process.env.NODE_ENV !== "debug",
            dir: `./${_DIST_DIR}/${_DIST_APP_DIR}`,
            name: "electron-app",
            arch: "x64",
            out: `./${_DIST_DIR}/${_DIST_PACKAGE_DIR}/`,
            overwrite: true
        }, options);

        packager(packagerOptions, err => {
            if (!err) {
                resolve();
            } else {
                reject(gutil.PluginError("electron-packager", err));
            }
        });
    });
}
