const electron = require("electron");
const {
  default: installExtension,
  REACT_DEVELOPER_TOOLS,
} = require("electron-devtools-installer");
const session = electron.session;
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const path = require("path");
const { ipcMain } = require("electron");
const appRoot = require("electron-root-path").rootPath;
const isDev = require("electron-is-dev");
const appPath = isDev ? path.resolve(appRoot, "./public") : appRoot;
let tools = require(isDev
  ? path.join(appRoot, "public", "assets/shared_tools.js")
  : "./assets/shared_tools.js");
let ws;
let mainWindow = null;
const taskkill = require("taskkill");
const find = require("find-process");

const gotTheLock = app.requestSingleInstanceLock();
let isSecondIndtance = false;

console.log("appRoot:", appRoot);
console.log("appPath:", appPath);
const curPath = path.join(appRoot, "config.json");
console.log("config Path:", curPath);

let appVer = "";
let appName = "optionFilter";

if (process.env.NODE_ENV === "development") {
  appVer = require("./package.json").version;
  appName = require("./package.json").name;
} else {
  appVer = require("electron").app.getVersion();
  appName = require("electron").app.name;
}
console.log("appVer:", appVer);
console.log("appName:", appName);

/*************************************************************
 * React dev tool process
 *************************************************************/
const reactDevToolsPath =
  "C:\\Users\\shawn\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Extensions\\fmkadmapgofadopljbjfkapdkoienihi\\4.10.1_0";

/*************************************************************
 * Websocket
 *************************************************************/
function connect() {
  try {
    const WebSocket = require("ws");
    ws = new WebSocket("ws://127.0.0.1:6849");
  } catch (e) {
    console.log(
      "Socket init error. Reconnect will be attempted in 1 second.",
      e.reason
    );
  }

  ws.on("open", () => {
    console.log("websocket in main connected");
    init_server();
  });

  ws.on("ping", () => {
    ws.send(tools.parseCmd("pong", "from main"));
  });

  ws.on("message", (message) => {
    try {
      let msg = "";
      msg = tools.parseServerMessage(message);
      // console.log(msg)
      let cmd = msg.cmd;
      let data = msg.data;
      switch (cmd) {
        case "ping":
          ws.send(tools.parseCmd("pong", data));
          break;
        case "reply_init_ok":
          createWindow();
          ws.send(tools.parseCmd("set_approot", appRoot));
          break;
        case "reply_closed_all":
          app.quit();
          break;
        case "reply_server_error":
          mainWindow.webContents.send("showMessage", data.error);
          break;
        default:
          // default reply to the same cmd
          try {
            mainWindow.webContents.send(cmd, data);
          } catch (err) {
            console.log("Not found this cmd " + cmd + " on client");
          }
          break;
      }
    } catch (e) {
      console.error(e);
    }
  });

  ws.onclose = function (e) {
    console.log(
      "Socket is closed. Reconnect will be attempted in 1 second.",
      e.reason
    );
    setTimeout(function () {
      connect();
    }, 5000);
  };

  ws.onerror = function (err) {
    console.error("Socket encountered error: ", err.message, "Closing socket");
    ws.close();
  };
}

connect();

/*************************************************************
 * py process
 *************************************************************/

const PY_DIST_FOLDER = "pyserver_dist";
const PY_FOLDER = "server";
const PY_MODULE = "api"; // without .py suffix

let pyProc = null;
let pyPort = null;

//
const guessPackaged = () => {
  const fullPath = path.join(appRoot, PY_DIST_FOLDER);
  console.log("full server Path:");
  console.log(fullPath);
  console.log("does server existed:");
  console.log(require("fs").existsSync(fullPath));
  return require("fs").existsSync(fullPath);
};

const getScriptPath = () => {
  if (!guessPackaged()) {
    return path.join(appRoot, PY_FOLDER, PY_MODULE + ".py");
  }
  if (process.platform === "win32") {
    return path.join(appRoot, PY_DIST_FOLDER, PY_MODULE, PY_MODULE + ".exe");
  }
  return path.join(appRoot, PY_DIST_FOLDER, PY_MODULE, PY_MODULE);
};

const selectPort = () => {
  pyPort = 4242;
  return pyPort;
};

const createPyProc = () => {
  let script = getScriptPath();
  let port = "" + selectPort();

  if (guessPackaged()) {
    pyProc = require("child_process").execFile(script, [port]);
    console.log("Found server exe:");
    console.log(script);
  } else {
    pyProc = require("child_process").spawn("python", [script, port], {
      stdio: "ignore",
    });
  }

  if (pyProc != null) {
    //console.log(pyProc)
    console.log("child process success on port " + port);
  }
};

const exitPyProc = (e) => {
  e.preventDefault();
  if (!isSecondIndtance) {
    find("name", "api.exe", true).then(function (list) {
      console.log("there are %s api.exe process(es)", list.length);
      const apiPids = list.map((elm) => elm.pid);
      console.log("api.exe pid:", apiPids);
      try {
        (async () => {
          try {
            await taskkill(apiPids, { force: true, tree: true });
            ws.close();
            ws = null;
            app.exit(0);
          } catch (e) {
            app.exit(0);
          }
        })();
      } catch (err) {
        app.exit(0);
      }
    });
  } else {
    try {
      ws.close();
      ws = null;
      app.exit(0);
    } catch (e) {
      app.exit(0);
    }

    ipcMain.removeAllListeners();
  }
};

// init config and database
var init_server = function () {
  ws.send(tools.parseCmd("isInited"));
  ws.send(tools.parseCmd("load_sys_config", curPath));
};

app.whenReady().then(async () => {
  createPyProc();
  try {
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log("An error occurred: ", err));
    await session.defaultSession.loadExtension(reactDevToolsPath);
  } catch (error) {}
});

app.on("before-quit", exitPyProc);

/*************************************************************
 * window management
 *************************************************************/
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 600,
    icon: `file://${path.join(__dirname, "favicon.ico")}`,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
  });
  mainWindow.loadURL(
    //  'http://localhost:3000'
    isDev
      ? "http://localhost:3000"
      : `file://${path.join(__dirname, "../build/index.html")}`
  );

  mainWindow.maximize();

  if (isDev) {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.removeMenu();
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.webContents.send("showMessage", "Hello React-Electron App");
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
};

app.on("window-all-closed", (e) => {
  app.quit();
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

/*************************************************************
 * iPC handler
 *************************************************************/
ipcMain.on("to_server", (event, msg) => {
  ws.send(tools.parseCmd(msg.cmd, msg.data));
});
