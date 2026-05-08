import { app, BrowserWindow, ipcMain, nativeImage } from 'electron'
import path from 'path'
import fs from 'fs'
import { promises as fsp } from 'fs'
import { sshSessionPool } from './ssh-manager'

let mainWindow: BrowserWindow | null = null

function getIconPath(): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'icon.ico')
    : path.resolve(__dirname, '../build/icon.ico')
}

function createWindow() {
  const iconPath = getIconPath()
  const iconNative = nativeImage.createFromPath(iconPath)

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    titleBarStyle: 'hidden',
    titleBarOverlay: false,
    frame: false,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  mainWindow?.setIcon(iconNative)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
    sshSessionPool.setMainWindow(null)
  })

  sshSessionPool.setMainWindow(mainWindow)

  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized-change', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized-change', false)
  })
}

app.whenReady().then(() => {
  initStoreDir()
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

ipcMain.on('window-minimize', () => {
  mainWindow?.minimize()
})

ipcMain.on('window-maximize', () => {
  if (mainWindow?.isMaximized()) {
    mainWindow?.unmaximize()
  } else {
    mainWindow?.maximize()
  }
})

ipcMain.on('window-close', () => {
  mainWindow?.close()
})

ipcMain.handle('window-is-maximized', () => {
  return mainWindow?.isMaximized() ?? false
})

const storeDir = path.join(
  app.isPackaged ? path.dirname(app.getPath('exe')) : app.getAppPath(),
  'data'
)

function initStoreDir() {
  try {
    if (!fs.existsSync(storeDir)) {
      fs.mkdirSync(storeDir, { recursive: true })
    }
  } catch (err) {
    console.warn(`Failed to create store directory: ${storeDir}`, err)
  }
}

function sanitizeStoreName(name: string): string {
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid store name')
  }
  if (name.includes('..') || name.includes('/') || name.includes('\\') || name.includes(path.sep)) {
    throw new Error('Invalid store name')
  }
  return name
}

const storeCache = new Map<string, unknown>()

ipcMain.handle('store:get', async (_event, name: string) => {
  const safeName = sanitizeStoreName(name)
  if (storeCache.has(safeName)) return storeCache.get(safeName)
  const filePath = path.join(storeDir, `${safeName}.json`)
  try {
    const data = JSON.parse(await fsp.readFile(filePath, 'utf-8'))
    storeCache.set(safeName, data)
    return data
  } catch {
    return null
  }
})

ipcMain.handle('store:set', async (_event, name: string, value: unknown) => {
  const safeName = sanitizeStoreName(name)
  storeCache.set(safeName, value)
  const filePath = path.join(storeDir, `${safeName}.json`)
  try {
    await fsp.writeFile(filePath, JSON.stringify(value), 'utf-8')
    return true
  } catch {
    return false
  }
})

ipcMain.handle('ssh:connect', async (_event, sessionId: string, config: import('../src/types/electron').SshConfig) => {
  return sshSessionPool.connect(sessionId, config)
})

ipcMain.handle('ssh:exec', async (_event, sessionId: string, command: string) => {
  return sshSessionPool.exec(sessionId, command)
})

ipcMain.handle('ssh:disconnect', async (_event, sessionId: string) => {
  sshSessionPool.disconnect(sessionId)
})

ipcMain.handle('ssh:get-state', async (_event, sessionId: string) => {
  return sshSessionPool.getState(sessionId)
})

ipcMain.handle('ssh:list-sessions', async () => {
  return sshSessionPool.listSessions()
})

ipcMain.handle('ssh:destroy-session', async (_event, sessionId: string) => {
  sshSessionPool.destroySession(sessionId)
})
