"use strict";


const actions = require("../action/actions");
const FormattedMessage = require("react-intl").FormattedMessage;
const React = require("react"); // Invoked after being transpiled to javascript. 
const redux = require("react-redux");


module.exports = redux.connect(mapStateToProps, mapDispatchToProps)(props => {
    const name = props.fileName || null;
    const progress = props.progress ? (<p>{Math.trunc((props.progress / props.total) * 100) + "%"}</p>) : null;
    const image = props.url ? (<img src={props.url} />) : null;

    return (
        <div>
            <button onClick={() => props.getFlickrImage()}>Get Image</button>
            {name}
            {progress}
            {image}
        </div>
    );
});


function mapDispatchToProps(dispatch) {
    return {

        changeLocale(locale) {
            dispatch(actions.localeChanged(locale));
        },

        getFlickrImage() {
            dispatch(actions.getFlickrImage());
        }

    };
}

function mapStateToProps(state) {
    return state.image;
}