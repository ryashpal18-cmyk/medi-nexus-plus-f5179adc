const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onNewBill: (callback) => ipcRenderer.on('new-bill', callback),
  platform: process.platform,
  isElectron: true
})
