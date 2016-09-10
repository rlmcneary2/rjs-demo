"use strict";


module.exports = {

    types: Object.freeze({
        LocaleChanged: "locale-changed"
    }),

    localeChanged(locale) {
        return { tag: locale, type: this.types.LocaleChanged };
    }

};
