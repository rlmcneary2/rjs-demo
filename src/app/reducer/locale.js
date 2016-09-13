"use strict";


const actions = require("../action/actions");


module.exports = (state = { tag: "en-US" }, action) => {

    let nextState = state;
    switch (action.type) {

        case actions.types.LocaleChangedEnd: {
            nextState = Object.assign({}, state);
            nextState.tag = action.tag;
            nextState.messages = action.messages;
            break;
        }

    }

    return nextState;
};
