const { app, BrowserWindow, ipcMain, ipcRenderer, remote, dialog, os } = require('electron');
const path = require('path');

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    icon: './images/Desktop-Icon-Circle.icns',
    minWidth: 1000,
    minHeight: 600,
    frame: false,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  // platform specific code for mac
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// SOURCE PATH
ipcMain.on('open-file-source', async event => {
  const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (dir) {
    event.sender.send("selected-dir-source", dir.filePaths[0]);
  }
});
// OUTPUT PATH
ipcMain.on('open-file-output', async event => {
  const dir = await dialog.showOpenDialog({ properties: ["openDirectory"] });
  if (dir) {
    event.sender.send("selected-dir-output", dir.filePaths[0]);
  }
});