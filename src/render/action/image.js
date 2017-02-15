"use strict";


const ipc = require("../../main/renderer/ipc");



module.exports = {

    types: Object.freeze({
        getFlickrImageEnd: "get-flickr-image-end",
        getFlickrImageProgress: "get-flickr-image-progress",
        getFlickrImageStart: "get-flickr-image-start",
        getFlickrImageThumbnailArrived: "get-flickr-image-thumbnail-arrived"
    }),

    actions: {

        getFlickrImage() {

            const self = this;
            const chunks = [];
            let totalChunkSize = 0;

            return dispatch => {

                dispatch(self.getFlickrImageStart());

                let progress = 0;
                ipc
                    .getFlickrImage(args => {
///////////////////////////////////////////////////////////////////////////////////////////////////
// Ultimately file information from main is used here as properties of actions.
///////////////////////////////////////////////////////////////////////////////////////////////////
                        if (args.chunk) {
                            chunks.push(args.chunk);
                            totalChunkSize += args.chunk.byteLength;
                            if (args.fileSize === totalChunkSize) {
                                const blob = new Blob(chunks, { type: args.mimeType });
                                blobToDataUrl(blob)
                                    .then(url => {
                                        dispatch(self.getFlickrImageThumbnailArrived(args.path, url));
                                    });
                            }
                        }

                        if (args.chunkSize) {
                            progress += args.chunkSize;
                            dispatch(self.getFlickrImageProgress(args.path, progress, args.fileSize));
                        }
                    })
                    .then(result => {
                        dispatch(self.getFlickrImageEnd(result));
                    });
            };
        },

        getFlickrImageEnd() {
            return {
                type: this.types.getFlickrImageEnd
            };
        },

        getFlickrImageProgress(fileName, progress, total) {
            return {
                fileName,
                progress,
                total,
                type: this.types.getFlickrImageProgress
            };
        },

        getFlickrImageStart() {
            return {
                type: this.types.getFlickrImageStart
            };
        },

        getFlickrImageThumbnailArrived(fileName, url) {
            return {
                fileName,
                type: this.types.getFlickrImageThumbnailArrived,
                url
            };
        }

    }
};


function blobToDataUrl(blob) {
    return new Promise(resolve => {
        const reader = new FileReader();

        reader.addEventListener("load", () => {
            resolve(reader.result);
        }, false);

        reader.readAsDataURL(blob);
    });
}
