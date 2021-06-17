const {app, BrowserWindow} = require('electron');
const path = require('path');

if(!app.isPackaged){
    require('electron-reload')(__dirname,{
        electron: path.join(process.cwd(),'../node_modules', '.bin', 'electron')
    });
}

function createMainWindow(){
    let mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', function(){
    if(process.platform !== 'darwin'){
        app.quit();
    }
});

app.on('activate', function(){
    if(BrowserWindow.getAllWindows().length === 0){
        createMainWindow();
    }
});