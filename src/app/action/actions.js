"use strict";


const locale = require("./locale");


module.exports = Object.assign({

    types: Object.freeze(Object.assign({},
        locale.types
        // Add additional action type definitions here.
    )),

},
    locale.actions
    // Add additional actions here.
);
