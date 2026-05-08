import { useState, useMemo } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { AUTH_TYPES } from '@/constants/http'
import type { AuthType } from '@/types'
import Tooltip from '@/components/common/Tooltip'
import './auth-tab.css'

export default function AuthTab() {
  const request = useRequestStore((state) => state.activeRequest)
  const updateActiveRequest = useRequestStore((state) => state.updateActiveRequest)
  const [showToken, setShowToken] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  if (!request) return null

  const preview = useMemo(() => {
    if (request.authType === 'bearer' && request.authConfig.token) {
      return `Authorization: Bearer ${request.authConfig.token.substring(0, 20)}${request.authConfig.token.length > 20 ? '...' : ''}`
    }
    if (request.authType === 'basic' && request.authConfig.username) {
      try {
        const creds = btoa(
          new TextEncoder().encode(`${request.authConfig.username}:${request.authConfig.password || ''}`)
            .reduce((s, b) => s + String.fromCharCode(b), '')
        )
        return `Authorization: Basic ${creds.substring(0, 30)}...`
      } catch {
        return 'Authorization: Basic [encoding error]'
      }
    }
    if (request.authType === 'apikey' && request.authConfig.apiKey && request.authConfig.apiValue) {
      if (request.authConfig.apiIn === 'query') {
        return `Query: ${request.authConfig.apiKey}=${request.authConfig.apiValue.substring(0, 20)}...`
      }
      return `Header: ${request.authConfig.apiKey}: ${request.authConfig.apiValue.substring(0, 20)}...`
    }
    return null
  }, [request.authType, request.authConfig])

  return (
    <div className="auth-editor">
      <select
        className="auth-type-select"
        value={request.authType}
        onChange={(e) => updateActiveRequest({ authType: e.target.value as AuthType })}
      >
        {AUTH_TYPES.map((at) => (
          <option key={at.value} value={at.value}>
            {at.label}
          </option>
        ))}
      </select>

      {request.authType === 'bearer' && (
        <div className="auth-field">
          <label>Token</label>
          <div className="auth-input-with-toggle">
            <input
              type={showToken ? 'text' : 'password'}
              placeholder="Bearer token"
              value={request.authConfig.token || ''}
              onChange={(e) =>
                updateActiveRequest({
                  authConfig: { ...request.authConfig, token: e.target.value },
                })
              }
            />
            <Tooltip content={showToken ? 'Hide token' : 'Show token'}>
              <button
                className="visibility-toggle"
                onClick={() => setShowToken(!showToken)}
              >
                {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </Tooltip>
          </div>
        </div>
      )}

      {request.authType === 'basic' && (
        <>
          <div className="auth-field">
            <label>Username</label>
            <input
              type="text"
              placeholder="Username"
              value={request.authConfig.username || ''}
              onChange={(e) =>
                updateActiveRequest({
                  authConfig: { ...request.authConfig, username: e.target.value },
                })
              }
            />
          </div>
          <div className="auth-field">
            <label>Password</label>
            <div className="auth-input-with-toggle">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={request.authConfig.password || ''}
                onChange={(e) =>
                  updateActiveRequest({
                    authConfig: { ...request.authConfig, password: e.target.value },
                  })
                }
              />
              <Tooltip content={showPassword ? 'Hide password' : 'Show password'}>
                <button
                  className="visibility-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </Tooltip>
            </div>
          </div>
        </>
      )}

      {request.authType === 'apikey' && (
        <>
          <div className="auth-field">
            <label>Key</label>
            <input
              type="text"
              placeholder="Header name"
              value={request.authConfig.apiKey || ''}
              onChange={(e) =>
                updateActiveRequest({
                  authConfig: { ...request.authConfig, apiKey: e.target.value },
                })
              }
            />
          </div>
          <div className="auth-field">
            <label>Value</label>
            <input
              type="text"
              placeholder="API key value"
              value={request.authConfig.apiValue || ''}
              onChange={(e) =>
                updateActiveRequest({
                  authConfig: { ...request.authConfig, apiValue: e.target.value },
                })
              }
            />
          </div>
          <div className="auth-field">
            <label>Add to</label>
            <select
              value={request.authConfig.apiIn || 'header'}
              onChange={(e) =>
                updateActiveRequest({
                  authConfig: {
                    ...request.authConfig,
                    apiIn: e.target.value as 'header' | 'query',
                  },
                })
              }
            >
              <option value="header">Header</option>
              <option value="query">Query Params</option>
            </select>
          </div>
        </>
      )}

      {preview && (
        <div className="auth-preview">
          <div className="auth-preview-label">Preview</div>
          <code className="auth-preview-code">{preview}</code>
        </div>
      )}
    </div>
  )
}
