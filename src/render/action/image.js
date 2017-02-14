"use strict";


const ipc = require("../../main/renderer/ipc");



module.exports = {

    types: Object.freeze({
        getFlickrImageEnd: "get-flickr-image-end",
        getFlickrImageStart: "get-flickr-image-start",
    }),

    actions: {

        getFlickrImage () {
            const self = this;
            return dispatch => {
                dispatch(self.getFlickrImageStart());

                ipc.getFlickrImage()
                    .then(result => {
                        debugger;
                        dispatch(self.getFlickrImageEnd(result));
                    });
            };
        },

        getFlickrImageEnd() {
            return {
                type: this.types.getFlickrImageStart
            };
        },

        getFlickrImageStart(result) {
            return {
                result,
                type: this.types.getFlickrImageStart
            };
        }

    }
};
