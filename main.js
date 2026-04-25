const { app, BrowserWindow, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');

const dataFolder = 'C:\\ai-data';

function createWindow() {
    const win = new BrowserWindow({
        width: 1280,
        height: 720,
        title: "Medi Nexus Plus - Balaji Ortho Care",
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    win.loadURL('https://balaji-health-hub.lovable.app');

    if (!fs.existsSync(dataFolder)) {
        try {
            fs.mkdirSync(dataFolder, { recursive: true });
        } catch (e) { console.log("Folder error:", e); }
    }
}

ipcMain.on('save-offline-data', (event, data) => {
    const filePath = path.join(dataFolder, 'patient_records.json');
    let records = [];
    if (fs.existsSync(filePath)) {
        try {
            records = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (e) { records = []; }
    }
    records.push({ ...data, timestamp: new Date().toISOString() });
    fs.writeFileSync(filePath, JSON.stringify(records, null, 2));
    event.reply('save-reply', 'Data Saved in C:\\ai-data');
});

app.whenReady().then(createWindow);
