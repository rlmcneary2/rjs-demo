"use strict";


const app = require("electron").app;
const BrowserWindow = require("electron").BrowserWindow;


process.env.ELECTRON_HIDE_INTERNAL_MODULES = "true";


let window;
app
    .on("ready", () => {
        createMainWindow();
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

    let queryString = "";
    if (query && 0 < query.length) {
        queryString = "?" + query
            .map(item => {
                return `{item.name}={item.value}`;
            })
            .join("&");
    }

    window.loadURL(`file://${__dirname}/index.html${queryString}`);
}
