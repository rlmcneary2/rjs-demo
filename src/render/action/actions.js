"use strict";


const image = require("./image");
const locale = require("./locale");


// Combine types and actions properties of modules to compose the complete actions module.
module.exports = Object.assign({

    types: Object.freeze(Object.assign({},
        image.types,
        locale.types
        // Add additional action type definitions here.
    )),

},
    image.actions,
    locale.actions
    // Add additional actions here.
);
