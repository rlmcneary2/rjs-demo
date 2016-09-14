# electron-app
A starter project to create a basic [Electron](http://electron.atom.io/) application using [React](https://facebook.github.io/react/), [redux](http://redux.js.org/), and [webpack](https://webpack.github.io/). Electron applications are cross platform applications that run on Windows, OSX, and Linux.

## Prerequisites
- [Node.js](https://nodejs.org) version 6 or later.

## Get the source code
Clone this repository using git. The source files will be copied into a subdirectory named **electron-app** of the current working directory.
```
git clone -b master --single-branch -o electron-app https://github.com/rlmcneary2/electron-app.git
```
## Installing requied packages
A variety of packages are required to build, debug, and run the application. The required packages are installed using npm.
```
npm install
```
## Run and debug
Launch the application from the command line using the **prebuilt** script in the **package.json** file.
```
npm run prebuilt
```
If you are using [Visual Studio Code](https://code.visualstudio.com/) the application can be launched from the debug panel using the launch configuration named **Electron**. One advantage of debugging in VS Code is that breakpoints can be set in the application's main process which runs in a Node.js environment. *Note that Electron will actually be executing the code located in the dist/app directory, breakpoints must be set in files in that location. It might be simpler to add a `debugger;` statement in the code to stop execution.*

## Adding code
There are several points that can be used to begin adding code for a new application.

### Configuration
There are two optional configuration files that can be used to control how the application operates at run time. The configuration files are defined at build time by javascript code files. These code files contain a module that exports a single function which takes one parameter. If the parameter is true a production release is being built, otherwise it is not a production release.

The configuration of the main process is defined by creating a file in the root directory of this project named `mainConfig.js`. For example:
```
"use strict";

module.exports = isProduction => {
    return {
        "devTools": !isProduction
    };
};
```

The configruation of the renderer process is defined by creating a file in the root directory of this project named `renderConfig.js`. For example:
```
"use strict";

module.exports = isProduction => {
    return {
        "current-locale": "en-US",
        "app-startup-delay": 1000
    };
};
```

Command line parameters can also be used to control the behavior of the application. The Dev Tools for debugging the render proces in Chromium can be displayed by including `-dev-tools` in the command line.

### Localization
### Application code
Replace the existing **App.jsx** in src/app/view/ with your own code.

Add actions and reducers as needed. The [redux thunk](https://github.com/gaearon/redux-thunk) middleware is already included so it's possible to create both synchronous and asynchronous actions.

## Build
To build the application