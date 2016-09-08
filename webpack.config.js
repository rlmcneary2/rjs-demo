"use strict";


module.exports = {
    module: {
        loaders: [
            {
                exclude: /(node_modules|bower_components)/,
                loader: "babel",
                query: {
                    presets: ["react", "stage-2"],
                    retainLines: true,
                },
                test: /\.jsx$/
            },
            {
                exclude: /(node_modules|bower_components)/,
                loader: "babel",
                query: {
                    presets: ["stage-2"],
                    retainLines: true,
                },
                test: /\.js$/
            },
            {
                exclude: /(node_modules|bower_components)/,
                loader: "json-loader",
                test: /\.json$/
            }
        ]
    }
};
