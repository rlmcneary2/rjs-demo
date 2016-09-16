"use strict";


const path = require("path");
const webpack = require("webpack");


module.exports = {
    module: {
        loaders: [
            {
                include: [
                    path.resolve(__dirname, "src/render"),
                    path.resolve(__dirname, "src/main/renderer/ipc.js")
                ],
                loader: "babel",
                query: {
                    plugins: ["transform-runtime"],
                    presets: ["es2015", "stage-0", "react"],
                    retainLines: true,
                },
                test: /\.jsx?$/
            },
            {
                include: [
                    path.resolve(__dirname, "src/locale"),
                    path.resolve(__dirname, "src/render")
                ],
                loader: "json-loader",
                test: /\.json$/
            }
        ]
    },
    plugins: [
        new webpack.optimize.DedupePlugin()
    ]
};
