"use strict";


module.exports = {
    module: {
        loaders: [
            {
                loader: "babel-loader",
                query: {
                    presets: ["react", "stage-2"],
                    retainLines: true,
                },
                test: /.jsx$/
            },
            {
                loader: "babel-loader",
                query: {
                    presets: ["stage-2"],
                    retainLines: true,
                },
                test: /.js$/
            }
        ]
    }
};
