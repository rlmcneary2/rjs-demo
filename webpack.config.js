"use strict";


const constants = require("./buildConstants");
const path = require("path");
const webpack = require("webpack");


module.exports = {
    devtool: "source-maps",
    entry: `.${path.sep}${path.join(constants.srcRender, constants.appEntryFile)}`,
    module: {
        loaders: [
            {
                include: [
                    path.resolve(__dirname, constants.srcRender)
                ],
                loader: "babel-loader",
                query: {
                    plugins: ["transform-async-to-generator"], // Only necessary until Electron + Chrome supports async / await (any day now).
                    presets: ["react"],
                    retainLines: true,
                },
                test: /\.jsx?$/
            },
            {
                include: [
                    path.resolve(__dirname, constants.srcLocale),
                    path.resolve(__dirname, constants.srcRender)
                ],
                loader: "json-loader",
                test: /\.json$/
            }
        ]
    },
    output: {
        filename: constants.appOutputFile,
        path: path.join(constants.dist, constants.distApp),
    },
    plugins: [
        new webpack.DefinePlugin({ "process.env": { NODE_ENV: process.env.NODE_ENV } })
    ],
    target: "electron-renderer"
};
