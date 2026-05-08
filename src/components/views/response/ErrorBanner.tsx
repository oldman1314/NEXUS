import { memo } from 'react'
import { OctagonX, AlertTriangle, WifiOff, ShieldAlert, AlertCircle } from 'lucide-react'

const errorConfig = {
  timeout: { Icon: AlertTriangle, title: 'Request Timed Out', desc: 'The request exceeded the timeout. Check your network connection or increase the timeout in settings.' },
  abort: { Icon: OctagonX, title: 'Request Cancelled', desc: 'The request was cancelled by the user.' },
  network: { Icon: WifiOff, title: 'Network Error', desc: 'Could not reach the server. Check the URL and your network connection.' },
  cors: { Icon: ShieldAlert, title: 'CORS Error', desc: 'Blocked by CORS policy. The server may not allow cross-origin requests from this domain.' },
  parse: { Icon: AlertCircle, title: 'Response Parse Error', desc: 'Failed to parse the response body. The raw content is shown below.' },
  unknown: { Icon: AlertCircle, title: 'Request Error', desc: 'An unknown error occurred.' },
}

const ErrorBanner = memo(({ errorType }: { errorType: string }) => {
  const config = errorConfig[errorType as keyof typeof errorConfig] || errorConfig.unknown
  const Icon = config.Icon

  return (
    <div className={`error-banner ${errorType}`}>
      <Icon size={16} />
      <div>
        <strong>{config.title}</strong>
        <p>{config.desc}</p>
      </div>
    </div>
  )
})

ErrorBanner.displayName = 'ErrorBanner'

export default ErrorBanner
