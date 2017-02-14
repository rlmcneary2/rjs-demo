"use strict";


const image = require("./image");
const locale = require("./locale");
const redux = require("redux");


module.exports = redux.combineReducers({
    image,
    locale
    // Add additional reducers here.
});
