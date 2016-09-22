"use strict";


const constants = require("./buildConstants");
const fs = require("fs");
const gulp = require("gulp");
const gutil = require("gulp-util");
const mkdirp = require("mkdirp");
const packager = require("electron-packager");
const path = require("path");
const rimraf = require("rimraf");
const webpack = require("webpack");
const webpackElectronConfig = require("./webpack-electron.config.js");


const _MAIN_CONFIG_REQUIRE_FILE = "mainConfig.js";
const _MAIN_CONFIG_OUTPUT_FILE = "mainConfig.json";
const _RENDER_CONFIG_REQUIRE_FILE = "renderConfig.js";
const _RENDER_CONFIG_OUTPUT_FILE = "renderConfig.json";


let _isProduction = false;
let _defaultFilesCopied = [];


gulp.task("build-application", gulp.parallel(buildAppJavascript, () => copyHtml(constants.srcRender, constants.distApp)));

gulp.task("build-electron", gulp.parallel(
    () => copyFiles(constants.srcMain, constants.distApp, "js"),
    () => copyFiles(constants.srcMain, constants.distApp, "json")
));

gulp.task("clean", () => {
    return new Promise((resolve, reject) => {
        rimraf(constants.dist, err => {
            if (err) {
                gutil.log("[rimraf]", `error - ${err}`);
                reject(gutil.PluginError("rimraf", err));
                return;
            }

            resolve();
        });
    });
});

// Delete the files that are generated by default. Be careful this will delete the replacement files you might have created!
gulp.task("clean-default-files", () => {
    return deleteDefaultFiles(true);
});

gulp.task("create-config", () => {
    return Promise.all([
        createConfig(`./${_MAIN_CONFIG_REQUIRE_FILE}`, _MAIN_CONFIG_OUTPUT_FILE),
        createConfig(`./${_RENDER_CONFIG_REQUIRE_FILE}`, _RENDER_CONFIG_OUTPUT_FILE),
    ]);
});

gulp.task("create-default-files", () => {
    return createDefaultFiles();
});

gulp.task("set-debug", callback => {
    process.env.NODE_ENV = "\"debug\""; // Yes, this must be defined as a string with quotes.
    callback();
});

// All the tasks required by this task must be defined above it.
gulp.task("debug", gulp.series("set-debug", "create-default-files", "create-config", gulp.parallel("build-application", "build-electron"), () => { return deleteDefaultFiles(); }), callback => {
    callback();
});

gulp.task("set-release", callback => {
    _isProduction = true;
    process.env.NODE_ENV = "\"production\""; // Yes, this must be defined as a string with quotes.
    callback();
});

// All the tasks required by this task must be defined above it.
gulp.task("release", gulp.series("set-release", "clean", "create-default-files", "create-config", gulp.parallel("build-application", "build-electron"), () => { return deleteDefaultFiles(); }), callback => {
    callback();
});

gulp.task("package-task", () => {
    return electronPackager({ platform: "win32" });
});

gulp.task("package-only-debug", gulp.series("set-debug", "package-task"), callback => {
    callback();
});

gulp.task("package-debug", gulp.series("clean", "debug", "package-task"), callback => {
    callback();
});

gulp.task("package-only-release", gulp.series("set-release", "package-task"), callback => {
    callback();
});

gulp.task("package-release", gulp.series("clean", "release", "package-task"), callback => {
    callback();
});


function buildAppJavascript() {
    return new Promise((resolve, reject) => {
        const config = webpackElectronConfig;
        // config.entry = `./${constants.srcRender}/${constants.appEntryFile}`;
        // config.output = { filename: constants.appOutputFile, path: `${constants.dist}/${constants.distApp}` };
        config.plugins = config.plugins || [];
        // config.plugins.splice(0, 0, new webpack.DefinePlugin({ "process.env": { NODE_ENV: process.env.NODE_ENV } }));

        if (_isProduction) {
            if (config.debug) {
                delete config.debug;
            }

            config.devtool = "cheap-module-source-maps";
            config.plugins.push(new webpack.optimize.UglifyJsPlugin({ minimize: true }));
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

function copyFile(sourceFilePath, destinationDir) {
    return new Promise(resolve => {
        const destinationFilePath = path.join(destinationDir, path.basename(sourceFilePath));
        const outStream = fs.createWriteStream(destinationFilePath);
        outStream.on("close", () => {
            resolve(true);
        });
        outStream.on("error", err => {
            console.log(`copyFile - error writing from '${sourceFilePath}' to '${destinationFilePath}': ${err.message || JSON.stringify(err)}`);
        });

        fs.createReadStream(sourceFilePath)
            .pipe(outStream);
    });
}

function copyFiles(sourceDir, destinationDir, ext) {
    return gulp.src([`${sourceDir}/*.${ext}`, `${sourceDir}/**/*.${ext}`])
        .pipe(gulp.dest(`${constants.dist}/${destinationDir}/`));
}

function copyHtml(sourceDir, destinationDir) {
    return gulp.src([`${sourceDir}/*.html`, `${sourceDir}/**/*.html`])
        .pipe(gulp.dest(`${constants.dist}/${destinationDir}/`));
}

function createConfig(sourceJsFilePath, destinationJsonFileName) {
    return new Promise(resolve => {
        let config = {};
        try {
            // The URL params javascript file is a module that exports a
            // function. The exported function takes a single boolean argument,
            // if true a production build is being compiled, if false it is not
            // a production build. The exported function returns an object
            // whose keys and values will become URL parameters. 
            const configFunc = require(sourceJsFilePath);

            config = configFunc(_isProduction);

            const destinationDirectory = `${constants.dist}/${constants.distApp}`;
            createDirectory(destinationDirectory)
                .then(errDir => {
                    if (errDir) {
                        console.log(`createConfig - error creating directory: ${errDir.message || JSON.stringify(errDir)}`);
                    }

                    fs.writeFile(`${destinationDirectory}/${destinationJsonFileName}`, JSON.stringify(config, null, _isProduction ? 0 : 4), errWrite => {
                        if (errWrite) {
                            console.log(`createConfig - error writing file: ${errWrite.message || JSON.stringify(errWrite)}`);
                        }

                        resolve();
                    });
                });
        } catch (err) {
            console.log(`createConfig - error: ${err.message || JSON.stringify(err)}`);
            resolve();
        }
    });
}

function createDefaultFiles() {
    // Here default files are created if the application developer hasn't
    // already created them. If default files are used - rather than developer
    // overrides - delete the default files after the build is finished.
    _defaultFilesCopied = [];

    let promises = [

        // Config data.
        fileExists("mainConfig.js")
            .then(exists => {
                if (!exists) {
                    _defaultFilesCopied.push("mainConfig.js");
                    return copyFile("./src/example/mainConfig.js", "./");
                }
            }),

        fileExists("renderConfig.js")
            .then(exists => {
                if (!exists) {
                    _defaultFilesCopied.push("renderConfig.js");
                    return copyFile("./src/example/renderConfig.js", "./");
                }
            }),

        // Locale data.
        fileExists("./src/locale/en-US.json")
            .then(exists => {
                if (!exists) {
                    _defaultFilesCopied.push("en-US.json");
                    return copyFile("./src/example/en-US.json", "./src/locale/");
                }
            }),

        fileExists("./src/locale/es-ES.json")
            .then(exists => {
                if (!exists) {
                    _defaultFilesCopied.push("es-ES.json");
                    return copyFile("./src/example/es-ES.json", "./src/locale/");
                }
            }),

        // App.jsx
        fileExists("./src/render/view/App.jsx")
            .then(exists => {
                if (!exists) {
                    _defaultFilesCopied.push("App.jsx");
                    return copyFile("./src/example/App.jsx", "./src/render/view/");
                }
            })
    ];

    return Promise.all(promises);
}

function createDirectory(directoryPath) {
    return new Promise(resolve => {
        mkdirp(directoryPath, null, err => {
            resolve(err);
        });
    });
}

function deleteDefaultFiles(force = false) {
    // Warning: force will delete everything even files that weren't copied (i.e. created by an application developer).

    const promises = [];
    if (force || _defaultFilesCopied.includes("mainConfig.js")) {
        promises.push(deleteFile("mainConfig.js"));
    }

    if (force || _defaultFilesCopied.includes("renderConfig.js")) {
        promises.push(deleteFile("renderConfig.js"));
    }

    if (force || _defaultFilesCopied.includes("en-US.json")) {
        promises.push(deleteFile("./src/locale/en-US.json"));
    }

    if (force || _defaultFilesCopied.includes("es-ES.json")) {
        promises.push(deleteFile("./src/locale/es-ES.json"));
    }

    if (force || _defaultFilesCopied.includes("App.jsx")) {
        promises.push(deleteFile("./src/render/view/App.jsx"));
    }

    return Promise.all(promises);
}

function deleteFile(fileName) {
    return new Promise(resolve => {
        fileExists(fileName)
            .then(exists => {
                if (!exists) {
                    resolve(true);
                    return;
                }

                fs.unlink(fileName, err => {
                    if (err) {
                        console.log(`deleteFile - error deleting file '${fileName}': ${err.message || JSON.stringify(err)}`);
                    }

                    resolve(err ? false : true);
                });
            });
    });
}

function electronPackager(options) {
    return new Promise((resolve, reject) => {
        const packagerOptions = Object.assign({
            asar: _isProduction,
            dir: `./${constants.dist}/${constants.distApp}`,
            name: "electron-app",
            arch: "x64",
            out: `./${constants.dist}/${constants.distPackage}/`,
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

function fileExists(file) {
    return new Promise(resolve => {
        fs.stat(file, err => {
            resolve(!err);
        });
    });
}
