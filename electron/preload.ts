import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  windowMinimize: () => ipcRenderer.send('window-minimize'),
  windowMaximize: () => ipcRenderer.send('window-maximize'),
  windowClose: () => ipcRenderer.send('window-close'),
  windowIsMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => {
    const handler = (_: unknown, isMaximized: boolean) => callback(isMaximized)
    ipcRenderer.on('window-maximized-change', handler)
    return () => ipcRenderer.removeListener('window-maximized-change', handler)
  },
  storeGet: (name: string) => ipcRenderer.invoke('store:get', name),
  storeSet: (name: string, value: unknown) => ipcRenderer.invoke('store:set', name, value),

  sshConnect: (sessionId: string, config: import('../src/types/electron').SshConfig) =>
    ipcRenderer.invoke('ssh:connect', sessionId, config),
  sshExec: (sessionId: string, command: string) =>
    ipcRenderer.invoke('ssh:exec', sessionId, command),
  sshDisconnect: (sessionId: string) =>
    ipcRenderer.invoke('ssh:disconnect', sessionId),
  sshGetState: (sessionId: string) =>
    ipcRenderer.invoke('ssh:get-state', sessionId),
  sshListSessions: () =>
    ipcRenderer.invoke('ssh:list-sessions'),
  sshDestroySession: (sessionId: string) =>
    ipcRenderer.invoke('ssh:destroy-session', sessionId),
  onSshData: (callback: (payload: { sessionId: string; data: string }) => void) => {
    const handler = (_: unknown, payload: { sessionId: string; data: string }) => callback(payload)
    ipcRenderer.on('ssh:data', handler)
    return () => ipcRenderer.removeListener('ssh:data', handler)
  },
  onSshStderr: (callback: (payload: { sessionId: string; data: string }) => void) => {
    const handler = (_: unknown, payload: { sessionId: string; data: string }) => callback(payload)
    ipcRenderer.on('ssh:stderr', handler)
    return () => ipcRenderer.removeListener('ssh:stderr', handler)
  },
  onSshError: (callback: (payload: { sessionId: string; error: string }) => void) => {
    const handler = (_: unknown, payload: { sessionId: string; error: string }) => callback(payload)
    ipcRenderer.on('ssh:error', handler)
    return () => ipcRenderer.removeListener('ssh:error', handler)
  },
  onSshClose: (callback: (payload: { sessionId: string; code: number | null }) => void) => {
    const handler = (_: unknown, payload: { sessionId: string; code: number | null }) => callback(payload)
    ipcRenderer.on('ssh:close', handler)
    return () => ipcRenderer.removeListener('ssh:close', handler)
  },
})
