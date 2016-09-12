"use strict";


const actions = require("../action/actions");
const redux = require("redux");


module.exports = redux.combineReducers({
    locale
    // Add additional reducers here.
});


function locale(state = { tag: "en-US" }, action) {

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
}
