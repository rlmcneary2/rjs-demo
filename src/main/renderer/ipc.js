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

/*-----------------------------------------------------------------------------------------------*/
/// #20
// In renderer - register a callback handler for messages FROM the main process. The application
// can define multiple "channels" and attach a separate handler for each channel.
/*-----------------------------------------------------------------------------------------------*/
        ipcRenderer.on(ipcShared.asyncResponseChannelName, onAsyncResponse);
    }

/*-----------------------------------------------------------------------------------------------*/
/// #22
// Send a request TO the main process. The first parameter is the channel name, subsequent
// parameters will be serialized to JSON (functions and prototype will be discarded) and
// transferred. #21
/*-----------------------------------------------------------------------------------------------*/
    ipcRenderer.send(ipcShared.asyncRequestChannelName, request);
}
