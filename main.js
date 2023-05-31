const { app, BrowserWindow } = require('electron')



const createWindow = () => {
    const win = new BrowserWindow({
      //width: 800,
      //height: 900,
    //  alwaysOnTop:true,
      webPreferences: {
         nodeIntegration : true,
         contextIsolation: false,
      }
    })
    
  
    win.loadFile('index.html')
  }

  app.whenReady().then(() => {
    createWindow()
  
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

  })