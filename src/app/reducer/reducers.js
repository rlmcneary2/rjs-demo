"use strict";


const redux = require("redux");


module.exports = redux.combineReducers({
    locale
});


function locale(state = { region: "US", tag: "en-US" }, action) {
    return state;
}
