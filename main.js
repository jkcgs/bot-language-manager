const {app, BrowserWindow} = require('electron')
const functions = require('./app/js/botPath')
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({width: 800, height: 600})
    mainWindow.setMenu(null)
    mainWindow.setMenuBarVisibility(false)
    mainWindow.loadFile('app/index.html')
    
    //mainWindow.webContents.openDevTools()
    
    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on('ready', function() {
    let botPath = functions.getBotPath()
    if (botPath === null) {
        app.quit()
    } else {
        global.botPath = botPath
        createWindow()
    }
})
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow()
    }
})
