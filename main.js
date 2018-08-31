const {app, BrowserWindow, globalShortcut} = require('electron')
const functions = require('./app/js/botPath')
let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({width: 800, height: 600})
    mainWindow.setMenu(null)
    mainWindow.setMenuBarVisibility(false)
    mainWindow.loadFile('app/index.html')
    
    mainWindow.on('closed', function () {
        mainWindow = null
    })
}

app.on('ready', function() {
    let botPath = process.argv[process.argv.length - 1].replace(/"/g, '')
    if (!functions.validatePath(botPath)) {
        botPath = functions.getBotPath()
    }

    if (botPath === null) {
        app.quit()
        return
    }

    global.botPath = botPath
    globalShortcut.register('CommandOrControl+Shift+I', () => {
        mainWindow.webContents.openDevTools()
    })
    createWindow()
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
