import { useState, useCallback } from 'react'
import { Server, User, Hash, Lock, KeyRound, Eye, EyeOff } from 'lucide-react'
import { useRemoteToolsStore } from '@/stores/useRemoteToolsStore'

function SshConfigForm({ sessionId }: { sessionId: string }) {
  const session = useRemoteToolsStore((state) => state.sshSessions[sessionId])
  const updateSshConfig = useRemoteToolsStore((state) => state.updateSshConfig)
  const [showKeyContent, setShowKeyContent] = useState(false)

  const sshConfig = session?.config ?? { host: '', port: 22, username: '', authType: 'password' as const, password: '', privateKey: '', passphrase: '' }
  const isPortInvalid = sshConfig.port < 1 || sshConfig.port > 65535

  const handlePortChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const parsed = parseInt(value, 10)
    if (value === '') {
      updateSshConfig(sessionId, { port: 22 })
    } else if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) {
      updateSshConfig(sessionId, { port: parsed })
    }
  }, [sessionId, updateSshConfig])

  return (
    <div className="ssh-config-popover">
      <div className="ssh-config-popover-row">
        <div className="ssh-config-popover-field" style={{ flex: 1 }}>
          <label><Server size={11} /> Host</label>
          <input
            type="text"
            placeholder="192.168.1.1"
            value={sshConfig.host}
            onChange={(e) => updateSshConfig(sessionId, { host: e.target.value })}
            autoFocus
          />
        </div>
        <div className={`ssh-config-popover-field ${isPortInvalid ? 'ssh-config-popover-field-error' : ''}`} style={{ flex: '0 0 70px' }}>
          <label><Hash size={11} /> Port</label>
          <input
            type="number"
            min={1}
            max={65535}
            value={sshConfig.port}
            onChange={handlePortChange}
          />
          {isPortInvalid && <span className="ssh-config-popover-hint">1-65535</span>}
        </div>
      </div>
      <div className="ssh-config-popover-row">
        <div className="ssh-config-popover-field" style={{ flex: '0 0 110px' }}>
          <label><User size={11} /> User</label>
          <input
            type="text"
            placeholder="root"
            value={sshConfig.username}
            onChange={(e) => updateSshConfig(sessionId, { username: e.target.value })}
          />
        </div>
        <div className="ssh-config-popover-field" style={{ flex: '0 0 90px' }}>
          <label>Auth</label>
          <select
            value={sshConfig.authType}
            onChange={(e) => updateSshConfig(sessionId, { authType: e.target.value as 'password' | 'privateKey' })}
          >
            <option value="password">Password</option>
            <option value="privateKey">Key</option>
          </select>
        </div>
      </div>
      <div className="ssh-config-popover-row">
        {sshConfig.authType === 'password' ? (
          <div className="ssh-config-popover-field" style={{ flex: 1 }}>
            <label><Lock size={11} /> Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={sshConfig.password}
              onChange={(e) => updateSshConfig(sessionId, { password: e.target.value })}
            />
          </div>
        ) : (
          <div className="ssh-config-popover-field" style={{ flex: 1 }}>
            <label><KeyRound size={11} /> Key</label>
            <div className="ssh-config-popover-field-toggle">
              <input
                type={showKeyContent ? 'text' : 'password'}
                placeholder="Private key path or content"
                value={sshConfig.privateKey}
                onChange={(e) => updateSshConfig(sessionId, { privateKey: e.target.value })}
              />
              <button
                type="button"
                className="ssh-key-toggle-btn"
                onClick={() => setShowKeyContent(!showKeyContent)}
                tabIndex={-1}
              >
                {showKeyContent ? <EyeOff size={12} /> : <Eye size={12} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SshConfigForm
