"use strict";


const ipc = require("../electron/renderer/ipc");


setTimeout(() => {
    ipc.log("index.js - started.", "iii");

    ipc.readTextFile("C:\\Users\\rich\\temp\\ftp_client.log", chunk => {
        if (!chunk) {
            console.log("All chunks read");
        } else {
            console.log(chunk);
        }
    });
}, 1000);
