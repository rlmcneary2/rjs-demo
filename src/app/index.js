"use strict";


const addLocaleData = require("react-intl").addLocaleData;
const ipc = require("../electron/renderer/ipc");
const React = require("react");
const ReactContent = require("./view/reactContent.jsx");
const ReactDOM = require("react-dom");
const reducers = require("./reducer/reducers");
const redux = require("redux");
const url = require("url");


const _content = require("./view/example.jsx");
const _enUsMessages = require("../locale/en-US.json");
const _startupDelayMs = 1000; // Set this to allow the Electron application to load so the debugger can attach.


setTimeout(() => {
    ipc.log("index.js - started.", "iii");

    const query = url.parse(window.location.href, true).query;

    // Loading language information early is a good idea. Use the query to
    // configure the application after updateLocale resolves.
    updateLocale(query)
        .then(({locale, messages}) => {


            // Add functions to configure the application here.

            const content = createContent();

            const props = createReactContentProps(content, locale, messages);


            // Include the application's root React component in the props as
            // the content property.


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
    const reactContent = React.createElement(ReactContent, props);
    ReactDOM.render(reactContent, document.getElementById("react-content"));
}

function createContent(props) {
    return React.createElement(_content, props);
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
        const locale = query["locale"];


        // Three things to do here:
        // - Require the locale-data modules your application requires (see: "Locale Data as Modules" https://github.com/yahoo/react-intl/issues/162)
        // - Get an object that contains the localized strings. That could be done by requiring the JSON files, downloading them from a server, or reading them from a file using IPC.
        // - Return the object (messages) from the JSON file that matches the requested locale.


        let language;
        if (locale) {
            language = locale.split(/(-|_)/)[0];
        }

        const localeData = {
            en: require("react-intl/locale-data/en")
            // Require the locale-data modules your application requires (see: "Locale Data as Modules" https://github.com/yahoo/react-intl/issues/162)
        };

        if (language) {
            addLocaleData(localeData[language]);
        }

        let messages = {};
        if (_enUsMessages) {
            messages["en-US"] = _enUsMessages;
        }

        // Get an object that contains the localized strings. That could be done by requiring the JSON files, downloading them from a server, or reading them from a file using IPC.
        // Return the object (messages) from the JSON file that matches the requested locale.

        resolve({ locale, messages: messages[locale] });
    });
}
