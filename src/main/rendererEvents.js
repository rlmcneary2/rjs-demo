"use strict";


const fs = require("fs");
const ipc = require("electron").ipcMain;
const ipcShared = require("./ipcShared");
const request = require("request");


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
            return getPhotoSizes(info.id);
        })
        .then(size => {
            // Download the image to a file.
        })
        .then(() => {
            evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({ photo: result }, args));
        });
}

// function readTextFile(evt, args) {
//     // args = { data:{ name:"file.name" }, id:1, type:"read-file" }

//     return new Promise((resolve, reject) => {
//         if (!args || !args.data || !args.data.name) {
//             throw "No file name to read.";
//         }

//         const name = args.data.name;
//         fs.createReadStream(name, { encoding: "utf-8" })
//             .on("data", (chunk) => {
//                 evt.sender.send(ipcShared.asyncResponseChannelName, { id: args.id, chunk });
//             })
//             .on("end", () => {
//                 resolve();
//             })
//             .on("error", (err) => {
//                 reject(err);
//             });
//     })
//         .then(() => {
//             evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({}, args));
//         })
//         .catch(err => {
//             evt.sender.send(ipcShared.asyncResponseChannelName, Object.assign({ error: err }, args));
//         });
// }

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
            resolve(obj.sizes.size[obj.sizes.size.length - 1]);
        });
    });
}
