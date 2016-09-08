"use strict";


const IntlProvider = require("react-intl").IntlProvider;
const React = require("react");
const Provider = require("react-redux").Provider;


const reactContent = props => {
    return (
        <IntlProvider locale={props.locale || "en-US"} messages={props.messages || {}}>
            <Provider children={props.content} store={props.store} />
        </IntlProvider>
    );
};

reactContent.propTypes = {
    content: React.PropTypes.element.isRequired, // The application content.
    locale: React.PropTypes.string, // The locale of messages and numbers to display. Defaults to en-US.
    messages: React.PropTypes.object, // The ICU messages for display. Defaults to an empty object.
    store: React.PropTypes.object.isRequired // The redux store.
};


module.exports = reactContent;
