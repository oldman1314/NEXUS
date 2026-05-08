export interface SshConfig {
  host: string
  port: number
  username: string
  authType: 'password' | 'privateKey'
  password: string
  privateKey: string
  passphrase: string
}

export interface ElectronAPI {
  platform: string
  windowMinimize: () => void
  windowMaximize: () => void
  windowClose: () => void
  windowIsMaximized: () => Promise<boolean>
  onWindowMaximizedChange: (callback: (isMaximized: boolean) => void) => () => void
  storeGet: (name: string) => Promise<Record<string, unknown> | null>
  storeSet: (name: string, value: unknown) => Promise<boolean>

  sshConnect: (sessionId: string, config: SshConfig) => Promise<{ success: boolean; error?: string }>
  sshExec: (sessionId: string, command: string) => Promise<{ success: boolean; error?: string }>
  sshDisconnect: (sessionId: string) => Promise<void>
  sshGetState: (sessionId: string) => Promise<string>
  sshListSessions: () => Promise<string[]>
  sshDestroySession: (sessionId: string) => Promise<void>
  onSshData: (callback: (payload: { sessionId: string; data: string }) => void) => () => void
  onSshStderr: (callback: (payload: { sessionId: string; data: string }) => void) => () => void
  onSshError: (callback: (payload: { sessionId: string; error: string }) => void) => () => void
  onSshClose: (callback: (payload: { sessionId: string; code: number | null }) => void) => () => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
  }
}
