# electron-app
A starter project to create a basic [Electron](http://electron.atom.io/) application using [React](https://facebook.github.io/react/), [Redux](http://redux.js.org/), and [Webpack](https://webpack.github.io/). Electron applications are cross platform applications that run on Windows, OSX, and Linux.

## Prerequisites
- Node.js version 6 or later.

## Getting started
Begin by getting the source code and then before making any changes build and run the application.

### Install
Clone this repository.
```
git clone -b master --single-branch -o electron-app https://github.com/rlmcneary2/electron-app.git
```
Install the required packages using npm.
```
npm install
```
### Run and debug
If you are using [Visual Studio Code](https://code.visualstudio.com/) the application can be launched from the debug panel using the launch configuration named **Electron**. One advantage of debugging in VS Code is that breakpoints can be set in the application's main process. *Note that Electron will actually be running the code in the dist/app directory, breakpoints must be set in files in that location. It might be simpler to add a `debugger;` statement in the code to stop execution.*

The application can also be launched from the command line using the **prebuilt** script in the **package.json** file but it isn't possible to debug the main process this way.
```
npm run prebuilt
```

## Adding code
There are several points that can be used to begin adding code for a new application.

### Configuration
The configruation of the renderer process is defined by creating a file in the root directory of this project named `rendererConfig.js`. This file should contain a module that exports a single function which takes one parameter. If the parameter is true a production release is being built, otherwise it is not a production release. For example:
```
"use strict";

module.exports = isProduction => {
    return {
        "current-locale": "en-US",
        "appStartupDelay": 1000
    };
};
```

### Localization
### Application code
Replace the existing **App.jsx** in src/app/view/ with your own code.

Add actions and reducers as needed. The [redux thunk](https://github.com/gaearon/redux-thunk) middleware is already included so it's possible to create both synchronous and asynchronous actions.

## Build
To build the application