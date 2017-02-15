"use strict";


const actions = require("../action/actions");


const _DEFAULT_STATE = {
    image: [],
    status: {}
};


/**
 * Handles (reduces) image actions to state.
 * @module
 */
module.exports = handler;


/**
 * A function that handles (reduces) image actions to state.
 * @param {object} state The current image state. Defaults to an object with a status property. 
 * @param {object} action The action with information to process.
 */
function handler(state = _DEFAULT_STATE, action) {

    let nextState = state;
    switch (action.type) {

        case actions.types.getFlickrImageEnd: {
            nextState = Object.assign({}, state);
            delete nextState.status;
            break;
        }

        case actions.types.getFlickrImageProgress: {
            const {fileName, progress, total} = action;
            nextState = Object.assign({}, state, { fileName, progress, total });
            break;
        }

        case actions.types.getFlickrImageStart: {
            nextState = Object.assign({}, _DEFAULT_STATE);
            nextState.status = "in-progress";
            break;
        }

        case actions.types.getFlickrImageThumbnailArrived: {
            const {fileName, url} = action;
            nextState = Object.assign({}, state, { fileName, url });
            break;
        }



    }

    return nextState;
}
