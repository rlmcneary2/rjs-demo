"use strict";


const gulp = require("gulp");
const gutil = require("gulp-util");
const rimraf = require("rimraf");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config.js");


const _SRC_APP = "src/app";
const _DIST_APP_DIR = "app";
const _DIST_DIR = "dist";


gulp.task("build-application", gulp.parallel(buildAppJavascript, () => copyHtml(_SRC_APP, _DIST_APP_DIR)));

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

gulp.task("set-debug", () => {
    process.env.NODE_ENV = "debug";
});

// All the tasks required by this task must be defined above this one.
gulp.task("debug", gulp.series("set-debug", "build-application"), callback => {
    callback();
});

gulp.task("set-release", callback => {
    process.env.NODE_ENV = "production";
    callback();
});

// All the tasks required by this task must be defined above this one.
gulp.task("release", gulp.series("set-release", "clean", "build-application"), callback => {
    callback();
});


function buildAppJavascript() {
    return new Promise((resolve, reject) => {
        const config = Object.create(webpackConfig);
        config.entry = `./${_SRC_APP}/index.js`;
        config.output = { filename: "app.js", path: `${_DIST_DIR}/app` };
        config.plugins = config.plugins || [];
        config.plugins.push(new webpack.DefinePlugin({ "process.env": { NODE_ENV: process.env.NODE_ENV } }));

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

function copyHtml(sourceDir, destinationDir) {
    return gulp.src([`${sourceDir}/*.html`, `${sourceDir}/**/*.html`])
        .pipe(gulp.dest(`${_DIST_DIR}/${destinationDir}/`));
}
