import { useState, useMemo } from 'react'
import { X, Copy, Check } from 'lucide-react'
import { useRequestStore } from '@/stores/useRequestStore'
import { useUIStore } from '@/stores/useUIStore'
import Tooltip from '@/components/common/Tooltip'
import { generateCode, CODEGEN_LANGS, type LangType } from '@/utils/codegen'
import './dialog.css'

export default function CodeGenDialog() {
  const request = useRequestStore((state) => state.activeRequest)
  const setCodeGenOpen = useUIStore((state) => state.setCodeGenOpen)
  const [lang, setLang] = useState<LangType>('curl')
  const [copied, setCopied] = useState(false)

  const code = useMemo(() => generateCode(request, lang), [request, lang])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="modal-overlay" onClick={() => setCodeGenOpen(false)}>
      <div className="modal modal-lg" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Generate Code</h3>
          <button className="modal-close" onClick={() => setCodeGenOpen(false)}>
            <X size={16} />
          </button>
        </div>
        <div className="modal-body">
          <div className="codegen-langs">
            {CODEGEN_LANGS.map((l) => (
              <button
                key={l.value}
                className={`codegen-lang ${lang === l.value ? 'active' : ''}`}
                onClick={() => setLang(l.value)}
              >
                {l.label}
              </button>
            ))}
          </div>
          <div className="codegen-code-wrapper">
            <pre className="codegen-code">{code}</pre>
            <Tooltip content="Copy">
              <button className="codegen-copy" onClick={handleCopy}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  )
}
