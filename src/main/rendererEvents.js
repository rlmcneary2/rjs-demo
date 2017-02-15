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


module.exports = {

    asyncRequestChannelName: "async-renderer-event",

    connect: () => {
///////////////////////////////////////////////////////////////////////////////////////////////////
// Set a handler for requests from renderer.
// args is a copy of the request object sent by renderer. 
///////////////////////////////////////////////////////////////////////////////////////////////////
        ipcMain.on(ipcShared.asyncRequestChannelName, (evt, args) => {
            switch (args.type) {
                case "getFlickrImage": {
                    getFlickrImage(evt, args);
                    break;
                }

                default:
                    console.log(`rendererEvents - no handler for type '${args.type}'.`);
                    break;
            }
        });
    }

};

///////////////////////////////////////////////////////////////////////////////////////////////////
// Image data is downloaded. The thumbnail image is transferred back to the renderer process.
// The large image is saved to a temporary file.
///////////////////////////////////////////////////////////////////////////////////////////////////
function getFlickrImage(evt, args) {
    getInterestingPhoto()
        .then(info => {
            return getPhotoSizes(info.id)
                .then(sizes => {
                    // Download the thumbnail image.
                    downloadImage(sizes[0].source, (data) => {

///////////////////////////////////////////////////////////////////////////////////////////////////
// Send the thumbnail image data to renderer.
///////////////////////////////////////////////////////////////////////////////////////////////////
                        evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({ id: args.id }, data));

                    }, false);

                    // Download the large image to a file.
                    return downloadImage(sizes[1].source, (data) => {
                        const d = {
                            chunkSize: data.chunk.byteLength,
                            fileSize: data.fileSize,
                            id: args.id,
                            path: data.path
                        };

///////////////////////////////////////////////////////////////////////////////////////////////////
// Send download progress to renderer.
///////////////////////////////////////////////////////////////////////////////////////////////////
                        evt.sender.send(ipcShared.asyncResponseChannelName, d);

                    });
                })
                .then(({path}) => {
                    evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({ path, photo: info }, args));
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
                if (label === "Small 320") {
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
