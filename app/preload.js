const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadGlossary: ()              => ipcRenderer.invoke('load-glossary'),
  saveGlossary: (data, force)   => ipcRenderer.invoke('save-glossary', data, force),
  revealFile:   ()              => ipcRenderer.invoke('reveal-file'),
  openBackups:  ()              => ipcRenderer.invoke('open-backups'),
});
