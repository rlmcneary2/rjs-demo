"use strict";


/**
 * This module runs in main (node).
 */


const fs = require("fs");
const ipcMain = require("electron").ipcMain;
const ipcShared = require("./ipcShared");
const request = require("request");
const tmp = require("tmp");


const _API_KEY = "38e86e7b27983abbd2d41ddf5f47b9c6";
let _clickCallback;
let _clickCount = 0;
let _progressCallback;


module.exports = {

    asyncRequestChannelName: "async-renderer-event",

    connect () {
/*-----------------------------------------------------------------------------------------------*/
/// #21
// In main - register a callback handler for messages FROM the renderer process. The application
// can define multiple "channels" and attach a separate handler for each channel.
// request is a copy of the object sent by renderer. #22
/*-----------------------------------------------------------------------------------------------*/
        ipcMain.on(ipcShared.asyncRequestChannelName, (evt, request) => {
            switch (request.type) {
                case "getFlickrImage": {
                    getFlickrImage(evt, request);
                    break;
                }

                default:
                    console.log(`rendererEvents - no handler for type '${request.type}'.`);
                    break;
            }
        });
    },

    setClickCallback(callback){
        _clickCallback = callback;
    },

    setProgressCallback(callback) {
        _progressCallback = callback;
    }

};

function getFlickrImage(evt, request) {
    getInterestingPhoto()
        .then(info => {
            return getPhotoSizes(info.id)
                .then(sizes => {
                    // We're getting another image.
                    _clickCount++;
                    _clickCallback(_clickCount);

                    // Download the thumbnail image.
                    downloadImage(sizes[0].source, (data) => {

/*-----------------------------------------------------------------------------------------------*/
/// #23a
// Use the event object to send a request TO the renderer process. The first parameter is the
// channel name, subsequent parameters will be serialized to JSON (functions and prototype will be
// discarded) and transferred. #20
/*-----------------------------------------------------------------------------------------------*/
                        // The image data is downloaded from Flickr in chunks.
                        // This is the thumbnail download, each chunk is a
                        // Uint8Array which can be serialized and passed to the
                        // renderer process.  
                        evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({ id: request.id }, data));

                    }, false);

                    // Download the large image to a file.
                    let chunkSizeTotal = 0;
                    return downloadImage(sizes[1].source, (data) => {
                        const d = {
                            chunkSize: data.chunk.byteLength,
                            fileSize: data.fileSize,
                            id: request.id,
                            path: data.path
                        };

                        if (_progressCallback) {
                            chunkSizeTotal += d.chunkSize;
                            _progressCallback(chunkSizeTotal, d.fileSize);
                        }

/*-----------------------------------------------------------------------------------------------*/
/// #23b
/*-----------------------------------------------------------------------------------------------*/
                        // The image data is downloaded from Flickr in chunks.
                        // This is the high resolution download. The
                        // accumulated total size of all the chunks, along with
                        // the file size, are passed back to the renderer for
                        // download progress.  
                        evt.sender.send(ipcShared.asyncResponseChannelName, d);

                    });
                })
                .then(({path}) => {
                    evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({ path, photo: info }, request));
                });
        });
}

function createTempFile() {
    return new Promise(resolve => {
        tmp.file({ mode: 0o666, postfix: ".jpg", prefix: "RJS-" }, (err, path, fd) => {
            resolve({ fd, path });
        });
    });
}

function downloadImage(url, callback, saveToFile = true) {
    return new Promise(resolve => {
        let p = {};
        if (saveToFile) {
            p = createTempFile();
        }

        Promise.resolve(p)
            .then(({fd, path}) => {
                let fileSize;
                let mimeType;
                let response;
                const req = request.get(url);
                req
                    .on("response", r => {
                        response = r;
                        if (response.headers.hasOwnProperty("content-length")) {
                            fileSize = parseInt(response.headers["content-length"]);
                        }

                        if (response.headers.hasOwnProperty("content-type")) {
                            mimeType = parseInt(response.headers["content-type"]);
                        }
                    })
                    .on("data", chunk => {
                        if (callback) {
                            callback({chunk, fileSize, mimeType, path});
                        }
                    })
                    .on("end", () => {
                        if (path) {
                            console.log(`File downloaded to '${path}'.`);
                        }

                        resolve({ path, response });
                    });

                if (saveToFile) {
                    req.pipe(fs.createWriteStream(null, { fd }));
                }
            });
    });
}

function getInterestingPhoto() {
    return new Promise(resolve => {
        request.get(`https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=${_API_KEY}&format=json&nojsoncallback=1`, (err, response, body) => {
            const obj = JSON.parse(body);
            const min = Math.ceil(0);
            const max = Math.floor(obj.photos.perpage);
            const index = Math.floor(Math.random() * (max - min + 1)) + min;

            resolve(obj.photos.photo[index]);
        });
    });
}

function getPhotoSizes(id) {
    return new Promise(resolve => {
        request.get(`https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=${_API_KEY}&photo_id=${id}&format=json&nojsoncallback=1`, (err, response, body) => {
            const obj = JSON.parse(body);
            let label;
            let thumb;
            let large;
            for (let i = 0; i < obj.sizes.size.length; i++) {
                label = obj.sizes.size[i].label;
                if (label === /*"Small 320"*/ "Medium 640") {
                    thumb = obj.sizes.size[i];
                } else if (i + 1 === obj.sizes.size.length) {
                    const largeIndex = obj.sizes.size[i].label === "Original" ? i - 1 : i;
                    large = obj.sizes.size[largeIndex];
                }
            }

            resolve([thumb, large]);
        });
    });
}
