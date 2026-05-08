import { useCallback } from 'react'
import type { SshConnectionState } from '@/stores/useRemoteToolsStore'
import { useRemoteToolsStore } from '@/stores/useRemoteToolsStore'

function getSshStatusLabel(state: SshConnectionState): string {
  switch (state) {
    case 'shell_ready': return 'Connected'
    case 'connecting': return 'Connecting'
    case 'error': return 'Error'
    case 'disconnected': return 'Disconnected'
    default: return 'Idle'
  }
}

function getSshStatusClass(state: SshConnectionState): string {
  switch (state) {
    case 'shell_ready': return 'ssh-status-connected'
    case 'connecting': return 'ssh-status-connecting'
    case 'error': return 'ssh-status-error'
    default: return 'ssh-status-disconnected'
  }
}

function SshStatusBadge({ sessionId }: { sessionId: string }) {
  const sshState = useRemoteToolsStore(
    useCallback((state) => state.sshSessions[sessionId]?.state ?? 'idle' as SshConnectionState, [sessionId])
  )

  return (
    <span className={getSshStatusClass(sshState)}>{getSshStatusLabel(sshState)}</span>
  )
}

export default SshStatusBadge
