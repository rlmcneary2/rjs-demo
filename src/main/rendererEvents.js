"use strict";


const fs = require("fs");
const ipc = require("electron").ipcMain;
const ipcShared = require("./ipcShared");
const request = require("request");
const tmp = require("tmp");

module.exports = {

    asyncRequestChannelName: "async-renderer-event",

    connect: () => {
        ipc.on(ipcShared.asyncRequestChannelName, (evt, args) => {
            switch (args.type) {
                // DEMO
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


// DEMO
function getFlickrImage(evt, args) {
    getInterestingPhoto()
        .then(info => {
            return getPhotoSizes(info.id)
                .then(sizes => {
                    // Download the thumbnail image.
                    downloadImage(sizes[0].source, (chunk, fileSize) => {
                        // TODO: return image data to renderer for display.
                    });

                    // Download the large image to a file.
                    return downloadImage(sizes[1].source);
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

function downloadImage(url, callback) {
    return new Promise(resolve => {
        let p = {};
        if (!callback) {
            p = createTempFile();
        }

        Promise.resolve(p)
            .then(({fd, path}) => {
                let total = 0;
                let fileSize;
                let response;
                const req = request.get(url);
                req
                    .on("response", r => {
                        response = r;
                        if (response.headers.hasOwnProperty("content-length")) {
                            fileSize = response.headers["content-length"];
                        }
                    })
                    .on("data", chunk => {
                        total += chunk.byteLength;
                        console.log(`Ddownloaded: ${total} / ${fileSize}`);

                        if (callback) {
                            callback(chunk, fileSize);
                        }
                    })
                    .on("end", () => {
                        if (path) {
                            console.log(`File downloaded to '${path}'.`);
                        }

                        resolve({ path, response });
                    });

                if (!callback) {
                    req.pipe(fs.createWriteStream(null, { fd }));
                }
            });
    });
}

function getInterestingPhoto() {
    return new Promise(resolve => {
        request.get("https://api.flickr.com/services/rest/?method=flickr.interestingness.getList&api_key=f17639e3d18eca2dea2f321aaf3e2e84&format=json&nojsoncallback=1", (err, response, body) => {
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
        request.get(`https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&api_key=f17639e3d18eca2dea2f321aaf3e2e84&photo_id=${id}&format=json&nojsoncallback=1`, (err, response, body) => {
            const obj = JSON.parse(body);
            let label;
            let thumb;
            let large;
            for (let i = 0; i < obj.sizes.size.length; i++) {
                label = obj.sizes.size[i].label;
                if (label === "Small 320") {
                    thumb = obj.sizes.size[i];
                } else if (i + 1 === obj.sizes.size.length) {
                    large = obj.sizes.size[i];
                }
            }

            resolve([thumb, large]);
        });
    });
}
