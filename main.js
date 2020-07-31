// Modules to control application life and create native browser window
const {app, BrowserWindow} = require('electron');
const path = require('path');
const fs = require('fs');

const HOSTS_PATH = "C:/Windows/System32/drivers/etc/hosts";
const BACKUP_HOSTS_PATH = "C:/Windows/System32/drivers/etc/hosts.old";

function createWindow () {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1270,
    height: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: true
    }
  })

  // and load the index.html of the app.
  mainWindow.loadFile('index.html')

  // Open the DevTools.
  //mainWindow.webContents.openDevTools()
  var exec = require('child_process').exec;
  exec('NET SESSION', function(err,so,se) {
    console.log(se.length === 0 ? "admin" : "not admin");
  });
  

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow()
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', function () {
  fs.copyFile(BACKUP_HOSTS_PATH, HOSTS_PATH, (err) => {});
  if (process.platform !== 'darwin') app.quit()
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
