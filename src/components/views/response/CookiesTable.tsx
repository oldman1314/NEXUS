import { memo } from 'react'

const CookiesTable = memo(({ headers }: { headers: Record<string, string> }) => {
  if (!headers['set-cookie']) {
    return <div className="empty-cookies">No cookies in response</div>
  }

  const raw = headers['set-cookie']
  const cookieStrings: string[] = []
  let current = ''
  let inDate = false
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (ch === ',' && !inDate) {
      if (current.trim()) cookieStrings.push(current.trim())
      current = ''
      continue
    }
    if (ch === 'E' && raw.substring(i, i + 8) === 'Expires=') {
      inDate = true
    }
    if (inDate && ch === ',') {
      current += ch
      continue
    }
    if (inDate && ch === ';') {
      inDate = false
    }
    current += ch
  }
  if (current.trim()) cookieStrings.push(current.trim())

  return (
    <div className="cookies-table">
      {cookieStrings.map((cookie, i) => {
        const parts = cookie.split(';')
        const nameValue = parts[0] || ''
        const eqIdx = nameValue.indexOf('=')
        const name = eqIdx > 0 ? nameValue.slice(0, eqIdx).trim() : nameValue.trim()
        const value = eqIdx > 0 ? nameValue.slice(eqIdx + 1).trim() : ''
        const attrs = parts.slice(1).map((p) => p.trim()).filter(Boolean)
        return (
          <div key={i} className="cookie-row">
            <span className="cookie-name">{name}</span>
            <span className="cookie-value">{value}</span>
            {attrs.length > 0 && (
              <span className="cookie-attrs">{attrs.join('; ')}</span>
            )}
          </div>
        )
      })}
    </div>
  )
})

CookiesTable.displayName = 'CookiesTable'

export default CookiesTable
