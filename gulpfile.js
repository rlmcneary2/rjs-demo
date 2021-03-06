"use strict";


const constants = require("./buildConstants");
const fs = require("fs");
const gulp = require("gulp");
const gutil = require("gulp-util");
const mkdirp = require("mkdirp");
const packager = require("electron-packager");
const path = require("path");
const rimraf = require("rimraf");
const uglify = require("uglify-js");
const webpack = require("webpack");
const webpackConfig = require("./webpack.config.js");


const _MAIN_CONFIG_REQUIRE_FILE = "mainConfig.js";
const _MAIN_CONFIG_OUTPUT_FILE = "mainConfig.json";
const _RENDER_CONFIG_REQUIRE_FILE = "renderConfig.js";
const _RENDER_CONFIG_OUTPUT_FILE = "renderConfig.json";


let _electronPackagerOptions;
let _isProduction = false;


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
    const options = Object.assign({
        arch: "x64"
    }, _electronPackagerOptions);

    return electronPackager(options);
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

gulp.task("package-release", gulp.series("clean", "release", callback => { _electronPackagerOptions = { platform: gutil.env.platform }; callback(); }, "package-task"), callback => {
    callback();
});


function buildAppJavascript() {
    return new Promise((resolve, reject) => {
        const config = webpackConfig;
        config.plugins = config.plugins || [];

        if (_isProduction) {
            config.devtool = "cheap-module-source-maps";
        } else {
            config.plugins.push(new webpack.LoaderOptionsPlugin({ debug: true }));
        }

        webpack(config, (err, stats) => {
            if (err) {
                gutil.log("[webpack]", `error - ${err}`);
                reject(gutil.PluginError("webpack", err));
                return;
            }

            gutil.log("[webpack]", stats.toString());

            let uglifyPromise = null;
            if (_isProduction) {
                // uglify
                const appPath = path.join(constants.dist, constants.distApp, constants.appOutputFile);
                const appMapPath = path.join(constants.dist, constants.distApp, constants.appOutputMapFile);
                const output = uglify.minify(appPath, {
                    inSourceMap: appMapPath,
                    outFileName: constants.appOutputFile,
                    outSourceMap: constants.appOutputMapFile
                });

                uglifyPromise = Promise.all([writeFile(appPath, output.code), writeFile(appMapPath, output.map)]);
            }

            Promise.resolve(uglifyPromise)
                .then(() => {
                    resolve();
                });
        });
    });
}

function copyFile(sourceFilePath, destinationDir) {
    // Create the destination directory if it doesn't exist.
    return createDirectory(destinationDir)
        .then(() => {
            return new Promise((resolve, reject) => {
                const destinationFilePath = path.join(destinationDir, path.basename(sourceFilePath));
                const outStream = fs.createWriteStream(destinationFilePath);
                outStream.on("close", () => {
                    // Copy file times.
                    fs.stat(sourceFilePath, (err, stats) => {
                        fs.utimes(destinationFilePath, stats.atime, stats.mtime, err => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            resolve(true);
                        });
                    });
                });
                outStream.on("error", err => {
                    console.log(`copyFile - error writing from '${sourceFilePath}' to '${destinationFilePath}': ${err.message || JSON.stringify(err)}`); // eslint-disable-line no-console
                });

                fs.createReadStream(sourceFilePath)
                    .pipe(outStream);
            });
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
    return new Promise((resolve, reject) => {
        let config = {};
        try {
            // The URL params javascript file is a module that exports a
            // function. The exported function takes a single boolean argument,
            // if true a production build is being compiled, if false it is not
            // a production build. The exported function returns an object
            // whose keys and values will become URL parameters. 
            const configFunc = require(sourceJsFilePath);

            config = typeof configFunc === "function" ? configFunc(_isProduction) : configFunc;

            writeFile(`${constants.dist}/${constants.distApp}/${destinationJsonFileName}`, JSON.stringify(config, null, _isProduction ? 0 : 4))
                .then(() => {
                    resolve();
                })
                .catch(err => {
                    reject(err);
                });
        } catch (err) {
            console.log(`createConfig - error: ${err.message || JSON.stringify(err)}`); // eslint-disable-line no-console
            resolve();
        }
    });
}

function createDefaultFiles() {
    // Check for default files and replace them if they are a default.
    const creator = name => {
        return isDefaultFile(name)
            .then(isDefault => {
                if (!isDefault) {
                    return;
                }

                const sourceName = `./src/example/${path.basename(name)}`;
                return createFileHash(sourceName)
                    .then(hash => {
                        return writeFile(`${sourceName}.hash`, hash);
                    })
                    .then(() => {
                        const dir = path.dirname(name);
                        return copyFile(sourceName, dir);
                    });
            });
    };

    const promises = [
        creator("./mainConfig.js"),
        creator("./renderConfig.js"),
        creator("./src/locale/en-US.json"),
        creator("./src/locale/es-ES.json"),
        creator("./src/render/view/App.jsx"),
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

function createFileHash(file) {
    return new Promise((resolve, reject) => {
        fs.stat(file, (err, stats) => {
            if (err) {
                reject({ message: `File '${file}' does not exist.` });
            }

            const name = path.basename(file);
            const data = `'${name}' '${stats.mtime}' '${stats.size}'`;
            resolve(new Buffer(data, "utf8").toString("base64"));
        });
    });
}

function deleteDefaultFiles() {
    const deleter = (name) => {
        isDefaultFile(name)
            .then(isDefault => {
                if (!isDefault) {
                    return;
                }

                return deleteFile(name);
            });
    };

    const promises = [
        deleter("./mainConfig.js"),
        deleter("./renderConfig.js"),
        deleter("./src/locale/en-US.json"),
        deleter("./src/locale/es-ES.json"),
        deleter("./src/render/view/App.jsx"),
    ];

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
                        console.log(`deleteFile - error deleting file '${fileName}': ${err.message || JSON.stringify(err)}`); // eslint-disable-line no-console
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
            name: "rjs-demo",
            arch: "x64",
            out: `./${constants.dist}/${constants.distPackage}/`,
            overwrite: true
        }, options);

        packager(packagerOptions, err => {
            if (!err) {
                resolve();
            } else {
                reject(new gutil.PluginError("electron-packager", err));
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

function isDefaultFile(name) {
    return fileExists(name)
        .then(exists => {
            // If the target file doesn't exist then it is considered to be a default file.
            if (!exists) {
                return true;
            }

            const sourceName = path.basename(name);
            const sourceHashName = `./src/example/${sourceName}.hash`;
            let sourceHash;
            return fileExists(sourceHashName)
                .then(sourceHashExists => {
                    if (!sourceHashExists) {
                        return createFileHash(name);
                    } else {
                        return readFile(sourceHashName);
                    }
                })
                .then(hash => {
                    sourceHash = hash;
                    return createFileHash(name);
                })
                .then(targetHash => {
                    return sourceHash === targetHash;
                });
        });
}

function readFile(name) {
    return new Promise((resolve, reject) => {
        fs.readFile(name, (err, contents) => {
            if (err) {
                console.log(`readFile - error reading file '${name}': ${err.message || JSON.stringify(err)}`); // eslint-disable-line no-console
                reject(`error reading file ${name}: ${err.message || JSON.stringify(err)}`);
                return;
            }

            const text = String.fromCharCode.apply(null, contents);
            resolve(text);
        });
    });
}

function writeFile(name, contents) {
    return new Promise((resolve, reject) => {
        const dir = path.dirname(name);
        createDirectory(dir)
            .then(errDir => {
                if (errDir) {
                    console.log(`writeFile - error creating directory: ${errDir.message || JSON.stringify(errDir)}`); // eslint-disable-line no-console
                    reject(`error creating directory: ${errDir.message || JSON.stringify(errDir)}`);
                    return;
                }

                fs.writeFile(name, contents, errWrite => {
                    if (errWrite) {
                        console.log(`writeFile - error writing file: ${errWrite.message || JSON.stringify(errWrite)}`); // eslint-disable-line no-console
                        reject(`error writing file: ${errDir.message || JSON.stringify(errDir)}`);
                        return;
                    }

                    resolve();
                });
            });
    });
}
