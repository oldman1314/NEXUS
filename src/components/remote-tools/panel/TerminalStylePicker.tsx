import { useRemoteToolsStore } from '@/stores/useRemoteToolsStore'
import type { TerminalStyle } from '@/stores/useRemoteToolsStore'

const TERMINAL_STYLES: { value: TerminalStyle; label: string; preview: string }[] = [
  { value: 'classic', label: 'Classic', preview: '#0d0d0d' },
  { value: 'light', label: 'Light', preview: '#f0f0f4' },
  { value: 'sepia', label: 'Sepia', preview: '#f5f0e8' },
  { value: 'ocean', label: 'Ocean', preview: '#0a1628' },
]

function TerminalStylePicker({ sessionId }: { sessionId: string }) {
  const session = useRemoteToolsStore((state) => state.sshSessions[sessionId])
  const setTerminalStyle = useRemoteToolsStore((state) => state.setTerminalStyle)
  const terminalStyle = session?.terminalStyle ?? 'classic'

  return (
    <div className="ssh-terminal-style-picker-popup">
      <div className="ssh-terminal-style-picker-title">Terminal Style</div>
      <div className="ssh-terminal-style-picker-grid">
        {TERMINAL_STYLES.map((s) => (
          <button
            key={s.value}
            className={`ssh-terminal-style-card ${terminalStyle === s.value ? 'ssh-terminal-style-card-active' : ''}`}
            onClick={() => setTerminalStyle(sessionId, s.value)}
          >
            <span className="ssh-terminal-style-card-swatch" style={{ background: s.preview }} />
            <span className="ssh-terminal-style-card-label">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

export default TerminalStylePicker
