"use strict";


const actions = require("../action/actions");


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
function handler(state = { status: {} }, action) {

    let nextState = state;
    switch (action.type) {

        case actions.types.getFlickrImageEnd: {
            nextState = Object.assign({}, state);
            delete nextState.status;
            break;
        }

        case actions.types.getFlickrImageStart: {
            nextState = Object.assign({}, state);
            nextState.status = "in-progress";
            break;
        }

    }

    return nextState;
}
