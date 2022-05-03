const {app, BrowserWindow, Menu} = require('electron');
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
        },
        icon:  path.join(__dirname, "build", "icon.png")
    });

    mainWindow.loadFile('index.html');

    const templateMenu = [
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exportar marcadores',
                    click(){
                        mainWindow.webContents.send('actions:export-bookmarks');
                    }
                },
               {
                   label: 'Eliminar marcadores',
                   click(){
                       mainWindow.webContents.send('actions:delete-bookmarks');
                   }
               },
               {
                   label: 'Salir',
                   accelerator: process.platform === 'darwin' ? 'command+Q' : 'Ctrl+Q',
                   click(){
                       app.quit();
                   }
               }
            ]
       }
    ];

    if(!app.isPackaged){
        templateMenu.push({
            label: 'DevTools',
            submenu: [
                {
                    label: 'Show/Hide Dev Tools',
                    accelerator: 'Ctrl+D',
                    click(item, focusedWindow){
                        focusedWindow.toggleDevTools();
                    }
                },
                {
                    role: 'reload'
                }
            ]
        });
    }

    const mainMenu = Menu.buildFromTemplate(templateMenu);

    Menu.setApplicationMenu(mainMenu);

    mainWindow.webContents.on('new-window', function(e, url) {
        e.preventDefault();
        require('electron').shell.openExternal(url);
    });
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

// if(process.platform === 'darwin'){
//     templateMenu.unshift({
//         label: app.getName()
//     });
// }
