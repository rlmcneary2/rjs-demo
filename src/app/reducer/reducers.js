"use strict";


const actions = require("../action/actions");
const redux = require("redux");


module.exports = redux.combineReducers({
    locale
});


function locale(state = { tag: "en-US" }, action) {

    let nextState = state;
    switch (action.type) {

        case actions.types.LocaleChanged: {
            nextState = Object.assign({}, state);
            nextState.tag = action.tag;
            break;
        }

    }

    return nextState;
}
