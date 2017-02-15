"use strict";


/**
 * This module runs in renderer (browser).
 */


const ipcRenderer = require("electron").ipcRenderer;
const ipcShared = require("../ipcShared");


let _asyncResponseConnected = false;
const _requests = new Map();
let _requestId = 0;


module.exports = {

    getFlickrImage(callback) {
        return new Promise((resolve, reject) => {
            let totalChunkSize = 0;
            const requestCallback = args => {
                if (callback) {
                    callback(args);
                }

                if (args.chunkSize) {
                    totalChunkSize += args.chunkSize;
                }

                return totalChunkSize === args.fileSize;
            };

            const resolver = args => {
                console.log(`getFlickrImage resolved: ${args}`);
                resolve();
            };

            const request = createRequest("getFlickrImage");
            _requests.set(request.id, { resolve: resolver, reject, callback: requestCallback });
            sendRequest(request);
        });
    }
};


function createRequest(type, data) {
    const request = { id: _requestId++, type };
    if (data) {
        request.data = data;
    }

    return request;
}

function onAsyncResponse(evt, args) {
    if (!_requests.has(args.id)) {
        return;
    }

    // Requests that have an async response must provide "resolve" and "reject"
    // properties each with a function value that will be invoked when the
    // request is finished. The event args will be passed to the function and
    // if rejecting an error property with the error.
    const request = _requests.get(args.id);

    // If there is a request callback and it returns false the request is not
    // finished yet. This might happen in a case where the request reads data
    // in chunks.
    if (request.callback && !request.callback(args)) {
        return;
    }

    _requests.delete(args.requestId);

    if (args.error) {
        request.reject({ args, error: args.error, message: args.error.message });
    } else {
        request.resolve(args);
    }
}

function sendRequest(request) {
    if (!_asyncResponseConnected) {
        _asyncResponseConnected = true;

///////////////////////////////////////////////////////////////////////////////////////////////////
// Set a handler for responses from main. The handler has two parameters - evt and args.
// args is a copy of the object sent from main.
///////////////////////////////////////////////////////////////////////////////////////////////////
        ipcRenderer.on("async-event-response", onAsyncResponse);
    }

///////////////////////////////////////////////////////////////////////////////////////////////////
// The request is sent to main.
///////////////////////////////////////////////////////////////////////////////////////////////////
    ipcRenderer.send(ipcShared.asyncRequestChannelName, request);
}
