"use strict";


// This file will be executed in the main process (the Node.js environment). It
// constructs the UI portion of the application that will be displayed using
// Chromium (the renderer process).


const app = require("electron").app;
const BrowserWindow = require("electron").BrowserWindow;
const path = require("path");
const rendererEvents = require("./rendererEvents");


const _MAIN_CONFIG_OUTPUT_FILE = "mainConfig.json";
const _RENDER_CONFIG_OUTPUT_FILE = "renderConfig.json";


process.env.ELECTRON_HIDE_INTERNAL_MODULES = "true";


const _args = {};
process.argv.forEach(arg => {
    if (arg[0] !== "-" || arg.startsWith("--")) {
        return;
    }

    const equalsIndex = arg.indexOf("=");
    if (1 < equalsIndex) {
        _args[arg.substring(1, equalsIndex)] = arg.substring(equalsIndex + 1);
    } else if (equalsIndex < 0) {
        _args[arg.substring(1)] = undefined;
    }
});


/*-----------------------------------------------------------------------------------------------*/
/// #01
// At startup connect to the app events.
/*-----------------------------------------------------------------------------------------------*/
app
    .on("ready", () => {
        let mainConfig;
        try {
            mainConfig = require(`./${_MAIN_CONFIG_OUTPUT_FILE}`);
        } catch (err) {
            console.log(`W-- main config file: ${err.message || JSON.stringify(err)}`);
            mainConfig = {};
        }

/*-----------------------------------------------------------------------------------------------*/
/// #02
// Once the app is ready it's time to create the first window.
/*-----------------------------------------------------------------------------------------------*/
        const w = createMainWindow(mainConfig);

        rendererEvents.connect();
        rendererEvents.setClickCallback(count => {
/*-----------------------------------------------------------------------------------------------*/
/// #31
// The click count can be displayed on the application's task button "badge" in OSX and Unity.
/*-----------------------------------------------------------------------------------------------*/
            app.setBadgeCount(count);
        });
        rendererEvents.setProgressCallback((progress, total) => {
            if (progress === total) {
                setTimeout(() => {
                    w.setProgressBar(-1);
                }, 200);
            }

/*-----------------------------------------------------------------------------------------------*/
/// #32
// The file download progress can be displayed on the application's task button in Windows and
// Unity.
/*-----------------------------------------------------------------------------------------------*/
            w.setProgressBar(progress / total);
        });
    })
    .on("window-all-closed", () => {
/*-----------------------------------------------------------------------------------------------*/
/// #08
// When all the windows are closed the application will exit. This is a case where allowances are
// being made for how OSX manages its application lifecycle.
/*-----------------------------------------------------------------------------------------------*/
        app.quit();
    });


function createMainWindow(mainConfig) {
/*-----------------------------------------------------------------------------------------------*/
/// #03
// Configure options to be passed to a window such as full-screening, "frameless," "kiosk," etc.
// There can be multiple windows.
/*-----------------------------------------------------------------------------------------------*/
    const options = {
        autoHideMenuBar: true,
        fullscreenable: true,
        useContentSize: true,
        show: false,
        webPreferences: {
            textAreasAreResizable: true
        }
    };

    let window = new BrowserWindow(options);
    window.once("ready-to-show", () => {
        window.show();
    });
    window.on("closed", () => {
/*-----------------------------------------------------------------------------------------------*/
/// #06
// Must release the reference to the window after it closes.
/*-----------------------------------------------------------------------------------------------*/
        window = null;
    });

    initDevTools(window, mainConfig);

    const query = createRenderQuery();
/*-----------------------------------------------------------------------------------------------*/
/// #04
// The window uses the renderer process to display a web app (or page). Pass a URL to the page to
// display; in most cases this will use the file protocol to get HTML from the ASAR file but it
// could be a URL to a page retrieved over a network.
/*-----------------------------------------------------------------------------------------------*/
    const url = `file://${path.join(__dirname, "index.html")}${query}`;
    console.log(`d-- loading URL: ${url}`);
    window.loadURL(url);

    return window;
}

function createRenderQuery() {
    let renderConfig;
    try {
        renderConfig = require(`./${_RENDER_CONFIG_OUTPUT_FILE}`);
    } catch (err) {
        console.log(`W-- render config file: ${err.message || JSON.stringify(err)}`);
        renderConfig = {};
    }

    let query = "";
    const rconfigKeys = Object.keys(renderConfig);
    if (0 < rconfigKeys.length) {
        query = "?" + rconfigKeys
            .map(key => {
                return `${fixedEncodeURIComponent(key)}=${fixedEncodeURIComponent(renderConfig[key])}`;
            })
            .join("&");
    }

    return query;
}

function fixedEncodeURIComponent(value) {
    return encodeURIComponent(value).replace(/[!'()*]/g, c => {
        return "%" + c.charCodeAt(0).toString(16);
    });
}

function initDevTools(window, mainConfig) {
    if (!_args.hasOwnProperty("dev-tools")) {
        return;
    }

    let showDevTools = true;
    if (mainConfig.hasOwnProperty("devTools") && !mainConfig.devTools) {
        showDevTools = false;
    }

    if (showDevTools) {
/*-----------------------------------------------------------------------------------------------*/
/// #05
// The Chrome Dev Tools can be toggled on and off for each window.
/*-----------------------------------------------------------------------------------------------*/
        window.toggleDevTools();
    }
}
