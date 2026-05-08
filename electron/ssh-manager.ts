import { Client, type ClientChannel, type ConnectConfig } from 'ssh2'
import type { BrowserWindow } from 'electron'
import type { SshConfig } from '../src/types/electron'

enum ParseState {
  Normal,
  Esc,
  Csi,
  Osc,
}

class AnsiFilter {
  private state = ParseState.Normal
  private buffer = ''

  feed(input: string): string {
    let result = ''
    for (let i = 0; i < input.length; i++) {
      const ch = input[i]
      const code = input.charCodeAt(i)
      switch (this.state) {
        case ParseState.Normal:
          if (code === 0x1b) {
            this.state = ParseState.Esc
            this.buffer = '\x1b'
          } else if (code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f) {
            // strip control characters
          } else {
            result += ch
          }
          break
        case ParseState.Esc:
          this.buffer += ch
          if (ch === '[') {
            this.state = ParseState.Csi
          } else if (ch === ']') {
            this.state = ParseState.Osc
          } else if (code >= 0x40 && code <= 0x7e) {
            this.state = ParseState.Normal
            this.buffer = ''
          } else {
            this.state = ParseState.Normal
            this.buffer = ''
          }
          break
        case ParseState.Csi:
          this.buffer += ch
          if (code >= 0x40 && code <= 0x7e && ch !== '[' && ch !== ']') {
            this.state = ParseState.Normal
            this.buffer = ''
          }
          break
        case ParseState.Osc:
          this.buffer += ch
          if (ch === '\x07' || ch === '\x1b') {
            this.state = ParseState.Normal
            this.buffer = ''
          }
          break
      }
    }
    return result
  }

  flush(): string {
    this.state = ParseState.Normal
    this.buffer = ''
    return ''
  }

  reset() {
    this.state = ParseState.Normal
    this.buffer = ''
  }
}

export type SshConnectionState = 'idle' | 'connecting' | 'shell_ready' | 'error' | 'disconnected'

class SshSession {
  readonly id: string
  private client: Client
  private stream: ClientChannel | null = null
  private mainWindow: BrowserWindow | null = null
  private state: SshConnectionState = 'idle'
  private connectResolve: ((value: { success: boolean; error?: string }) => void) | null = null
  private connectTimeout: NodeJS.Timeout | null = null
  private dataFilter = new AnsiFilter()
  private stderrFilter = new AnsiFilter()

  constructor(id: string, mainWindow: BrowserWindow | null) {
    this.id = id
    this.mainWindow = mainWindow
    this.client = new Client()
    this.setupEventHandlers()
  }

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window
  }

  private setupEventHandlers() {
    this.client.on('ready', () => {
      this.client.shell(
        { term: 'dumb', cols: 200, rows: 50 },
        (err, stream) => {
          if (err) {
            this.setState('error')
            this.sendError(err.message)
            this.connectResolve?.({ success: false, error: err.message })
            this.connectResolve = null
            this.clearConnectTimeout()
            return
          }
          this.stream = stream
          this.setState('shell_ready')
          stream.on('data', (data: Buffer) => {
            const cleaned = this.dataFilter.feed(data.toString('utf-8'))
            if (cleaned) this.sendData(cleaned)
          })
          stream.stderr.on('data', (data: Buffer) => {
            const cleaned = this.stderrFilter.feed(data.toString('utf-8'))
            if (cleaned) this.sendStderr(cleaned)
          })
          stream.on('close', () => {
            this.dataFilter.flush()
            this.stderrFilter.flush()
            this.sendClose(null)
            this.stream = null
            this.setState('disconnected')
          })
          this.connectResolve?.({ success: true })
          this.connectResolve = null
          this.clearConnectTimeout()
        }
      )
    })
    this.client.on('error', (err) => {
      this.sendError(err.message)
      this.connectResolve?.({ success: false, error: err.message })
      this.connectResolve = null
      this.clearConnectTimeout()
      this.setState('error')
    })
    this.client.on('end', () => {
      this.dataFilter.flush()
      this.stderrFilter.flush()
      this.sendClose(null)
      this.stream = null
      this.setState('disconnected')
    })
  }

  private setState(newState: SshConnectionState) {
    this.state = newState
  }

  private clearConnectTimeout() {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout)
      this.connectTimeout = null
    }
  }

  private sendData(data: string) {
    this.mainWindow?.webContents.send('ssh:data', { sessionId: this.id, data })
  }

  private sendStderr(data: string) {
    this.mainWindow?.webContents.send('ssh:stderr', { sessionId: this.id, data })
  }

  private sendError(error: string) {
    this.mainWindow?.webContents.send('ssh:error', { sessionId: this.id, error })
  }

  private sendClose(code: number | null) {
    this.mainWindow?.webContents.send('ssh:close', { sessionId: this.id, code })
  }

  async connect(config: SshConfig): Promise<{ success: boolean; error?: string }> {
    if (this.state === 'connecting' || this.state === 'shell_ready') {
      return { success: false, error: 'SSH connection already in progress or established' }
    }
    this.setState('connecting')
    return new Promise((resolve) => {
      this.connectResolve = resolve
      this.connectTimeout = setTimeout(() => {
        this.connectResolve = null
        this.setState('error')
        resolve({ success: false, error: 'Connection timeout (10s)' })
      }, 10000)
      const connConfig: ConnectConfig = {
        host: config.host,
        port: config.port,
        username: config.username,
      }
      if (config.authType === 'password') {
        connConfig.password = config.password
      } else {
        connConfig.privateKey = config.privateKey
        if (config.passphrase) connConfig.passphrase = config.passphrase
      }
      try {
        this.client.connect(connConfig)
      } catch (error) {
        this.clearConnectTimeout()
        this.connectResolve = null
        this.setState('error')
        const message = error instanceof Error ? error.message : 'Unknown error'
        resolve({ success: false, error: message })
      }
    })
  }

  exec(command: string): { success: boolean; error?: string } {
    if (!this.stream) return { success: false, error: 'SSH shell not ready' }
    try {
      this.stream.write(command + '\n')
      return { success: true }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { success: false, error: message }
    }
  }

  disconnect(): void {
    this.clearConnectTimeout()
    this.connectResolve = null
    this.dataFilter.reset()
    this.stderrFilter.reset()
    if (this.stream) {
      this.stream.close()
      this.stream = null
    }
    this.client.end()
    this.client.removeAllListeners()
    this.client = new Client()
    this.setupEventHandlers()
    this.setState('disconnected')
  }

  getState(): SshConnectionState {
    return this.state
  }

  destroy(): void {
    this.disconnect()
    this.client.removeAllListeners()
  }
}

export class SshSessionPool {
  private sessions = new Map<string, SshSession>()
  private mainWindow: BrowserWindow | null = null

  setMainWindow(window: BrowserWindow | null) {
    this.mainWindow = window
    for (const session of this.sessions.values()) {
      session.setMainWindow(window)
    }
  }

  connect(sessionId: string, config: SshConfig): Promise<{ success: boolean; error?: string }> {
    let session = this.sessions.get(sessionId)
    if (!session) {
      session = new SshSession(sessionId, this.mainWindow)
      this.sessions.set(sessionId, session)
    }
    return session.connect(config)
  }

  exec(sessionId: string, command: string): { success: boolean; error?: string } {
    const session = this.sessions.get(sessionId)
    if (!session) return { success: false, error: 'Session not found' }
    return session.exec(command)
  }

  disconnect(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) session.disconnect()
  }

  getState(sessionId: string): SshConnectionState {
    const session = this.sessions.get(sessionId)
    return session ? session.getState() : 'idle'
  }

  listSessions(): string[] {
    return Array.from(this.sessions.keys())
  }

  destroySession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.destroy()
      this.sessions.delete(sessionId)
    }
  }

  destroyAll(): void {
    for (const session of this.sessions.values()) {
      session.destroy()
    }
    this.sessions.clear()
  }
}

export const sshSessionPool = new SshSessionPool()
