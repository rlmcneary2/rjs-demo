"use strict";


const ipc = require("../electron/renderer/ipc");
const React = require("react");
const ReactContent = require("./view/reactContent.jsx");
const ReactDOM = require("react-dom");
const reducers = require("./reducer/reducers");
const redux = require("redux");


const startupDelayMs = 1000; // Set this to allow the Electron application to load so the debugger can attach.


setTimeout(() => {
    ipc.log("index.js - started.", "iii");

    const props = {
        content: React.createElement("h1", null, "Hello React world content!"),
        store: redux.createStore(reducers)
    };

    const reactContent = React.createElement(ReactContent, props);
    ReactDOM.render(reactContent, document.getElementById("react-content"));

    // ipc.readTextFile("C:\\Users\\rich\\temp\\ftp_client.log", chunk => {
    //     if (!chunk) {
    //         console.log("All chunks read");
    //     } else {
    //         console.log(chunk);
    //     }
    // });
}, startupDelayMs);
