"use strict";


const app = require("electron").app;
const BrowserWindow = require("electron").BrowserWindow;
const path = require("path");
const rendererEvents = require("./rendererEvents");


const _URL_PARAMS_JSON_FILE = "urlparams.json";


process.env.ELECTRON_HIDE_INTERNAL_MODULES = "true";


let window;
app
    .on("ready", () => {
        let query;
        try {
            query = require(`./${_URL_PARAMS_JSON_FILE}`);
        } catch (err) {
            console.log(`W-- URL params file: ${err.message || JSON.stringify(err)}`);
        }

        createMainWindow(query);
        rendererEvents.connect();
    })
    .on("window-all-closed", () => {
        app.quit();
    });


function createMainWindow(query) {
    const options = {
        autoHideMenuBar: true,
        fullscreenable: true,
        useContentSize: true,
        webPreferences: {
            textAreasAreResizable: true
        }
    };

    window = new BrowserWindow(options);
    window.on("closed", () => {
        window = null;
    });

    window.toggleDevTools();

    let queryString = "";
    const queryKeys = query ? Object.keys(query) : [];
    if (0 < queryKeys.length) {
        queryString = "?" + queryKeys
            .map(key => {
                return `${key}=${query[key]}`;
            })
            .join("&");
    }

    const url = `file://${path.join(__dirname, "index.html")}${queryString}`;
    console.log(`d-- loading URL: ${url}`);
    window.loadURL(url);
}
