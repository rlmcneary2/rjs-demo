"use strict";


const addLocaleData = require("react-intl").addLocaleData;
const ipc = require("../electron/renderer/ipc");
const React = require("react");
const ReactContent = require("./view/ReactContent.jsx");
const ReactDOM = require("react-dom");
const reducers = require("./reducer/reducers");
const redux = require("redux");
const url = require("url");


const _query = url.parse(window.location.href, true).query;
const _startupDelayMs = _query["appStartupDelay"] ? _query["appStartupDelay"] : 0;


setTimeout(() => {
    ipc.log("index.js - started.", "iii");

    // Loading language information early is a good idea. Use the query to
    // configure the application after updateLocale resolves.
    updateLocale(_query)
        .then(({locale, messages}) => {

            // TODO: optional. Add functions to configure the application here.

            const content = createContent();

            const props = createReactContentProps(content, locale, messages);

            renderReactContent(props);

            // ipc.readTextFile("C:\\Users\\rich\\temp\\ftp_client.log", chunk => {
            //     if (!chunk) {
            //         console.log("All chunks read");
            //     } else {
            //         console.log(chunk);
            //     }
            // });
        });

}, _startupDelayMs);


function renderReactContent(props) {
    const content = React.createElement(ReactContent, props);
    ReactDOM.render(content, document.getElementById("react-content"));
}

function createContent(props) {
    const content = require("./view/App.jsx"); // Change to the location of your application's root component.
    return React.createElement(content, props);
}

function createReactContentProps(content, locale, messages) {
    return {
        content,
        locale,
        messages,
        store: redux.createStore(reducers)
    };
}

function updateLocale(query = url.parse(window.location.href, true).query) {
    return new Promise(resolve => {
        const locale = query["current-locale"];


        // Three things to do here:
        // - Require the locale-data modules your application requires (see: "Locale Data as Modules" https://github.com/yahoo/react-intl/issues/162)
        // - Get an object that contains the localized strings. That could be done by requiring the JSON files, downloading them from a server, or reading them from a file using IPC.
        // - Return the object (messages) from the JSON file that matches the requested locale.


        let language;
        if (locale) {
            language = locale.split(/(-|_)/)[0];
        }

        const localeData = {
            en: require("react-intl/locale-data/en"),
            es: require("react-intl/locale-data/es")
            // Require the locale-data modules the application needs (see: "Locale Data as Modules" https://github.com/yahoo/react-intl/issues/162)
        };

        if (language) {
            addLocaleData(localeData[language]);
        }

        let messages = {
            "en-US": require("../locale/en-US.json"),
            "es-ES": require("../locale/es-ES.json")
            // Require other localized strings the application needs.
        };

        // Get an object that contains the localized strings. That could be done by requiring the JSON files, downloading them from a server, or reading them from a file using IPC.
        // Return the object (messages) from the JSON file that matches the requested locale.

        resolve({ locale, messages: messages[locale] });
    });
}
