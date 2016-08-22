"use strict";


const config = require("./webpack.config.js");
const webpackTargetElectronRenderer = require("webpack-target-electron-renderer");


const c = Object.create(config);
c.target = webpackTargetElectronRenderer(c);
module.exports = c;
