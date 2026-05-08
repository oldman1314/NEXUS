import { useCallback } from 'react'
import { Plug, Unplug, Eraser } from 'lucide-react'
import type { SshConnectionState } from '@/stores/useRemoteToolsStore'
import { useRemoteToolsStore } from '@/stores/useRemoteToolsStore'
import { toast } from '@/stores/useToastStore'
import Tooltip from '@/components/common/Tooltip'

function SshToolbarControls({ sessionId }: { sessionId: string }) {
  const sshState = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.state ?? 'idle' as SshConnectionState, [sessionId])
  )
  const sshConfig = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.config ?? { host: '', port: 22, username: '', authType: 'password' as const, password: '', privateKey: '', passphrase: '' }, [sessionId])
  )
  const setSshState = useRemoteToolsStore((state) => state.setSshState)
  const addTerminalLine = useRemoteToolsStore((state) => state.addTerminalLine)
  const clearTerminal = useRemoteToolsStore((state) => state.clearTerminal)
  const clearSshCredentials = useRemoteToolsStore((state) => state.clearSshCredentials)

  const handleConnect = useCallback(async () => {
    if (sshState === 'shell_ready') {
      toast('info', 'Already connected')
      return
    }
    if (sshState === 'connecting') {
      toast('info', 'Connection in progress, please wait')
      return
    }
    if (!sshConfig.host || !sshConfig.username) {
      toast('warning', 'Please configure Host and Username in SSH Settings first')
      return
    }
    if (sshConfig.authType === 'password' && !sshConfig.password) {
      toast('warning', 'Please enter a password in SSH Settings')
      return
    }
    if (sshConfig.authType === 'privateKey' && !sshConfig.privateKey) {
      toast('warning', 'Please provide a private key in SSH Settings')
      return
    }

    setSshState(sessionId, 'connecting')
    clearTerminal(sessionId)
    addTerminalLine(sessionId, { text: `Connecting to ${sshConfig.host}:${sshConfig.port}...`, type: 'info' })

    try {
      const result = await window.electronAPI?.sshConnect(sessionId, sshConfig)
      if (result?.success) {
        setSshState(sessionId, 'shell_ready')
        addTerminalLine(sessionId, { text: 'Connected successfully. Shell ready.', type: 'info' })
        clearSshCredentials(sessionId)
      } else {
        setSshState(sessionId, 'error')
        addTerminalLine(sessionId, { text: result?.error || 'Connection failed', type: 'error' })
        toast('error', `Connection failed: ${result?.error || 'Unknown error'}`)
      }
    } catch (error) {
      setSshState(sessionId, 'error')
      const message = error instanceof Error ? error.message : 'Connection failed'
      addTerminalLine(sessionId, { text: message, type: 'error' })
      toast('error', `Connection error: ${message}`)
    }
  }, [sessionId, sshState, sshConfig, setSshState, clearTerminal, addTerminalLine, clearSshCredentials])

  const handleDisconnect = useCallback(async () => {
    try {
      await window.electronAPI?.sshDisconnect(sessionId)
      setSshState(sessionId, 'disconnected')
      addTerminalLine(sessionId, { text: 'Disconnected.', type: 'info' })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Disconnect failed'
      addTerminalLine(sessionId, { text: message, type: 'error' })
      toast('error', message)
    }
  }, [sessionId, setSshState, addTerminalLine])

  return (
    <div className="ssh-toolbar-controls">
      <Tooltip content="Clear Terminal">
        <button className="panel-header-btn" onClick={() => clearTerminal(sessionId)}>
          <Eraser size={12} />
        </button>
      </Tooltip>
      {sshState === 'shell_ready' ? (
        <Tooltip content="Disconnect">
          <button className="panel-header-btn panel-header-btn-danger" onClick={handleDisconnect}>
            <Unplug size={12} />
          </button>
        </Tooltip>
      ) : (
        <Tooltip content="Connect">
          <button
            className="panel-header-btn panel-header-btn-connect"
            onClick={handleConnect}
            disabled={sshState === 'connecting'}
          >
            <Plug size={12} />
          </button>
        </Tooltip>
      )}
    </div>
  )
}

export default SshToolbarControls
