import { memo } from 'react'
import JsonHighlighter from '../JsonHighlighter'
import ErrorBanner from './ErrorBanner'
import CookiesTable from './CookiesTable'
import TestsPanel from './TestsPanel'
import type { ResponseData } from '@/types'

const LARGE_RESPONSE_THRESHOLD = 5 * 1024 * 1024

const ResponseBody = memo(({
  response,
  responseTab,
  bodyFormat,
}: {
  response: ResponseData
  responseTab: string
  bodyFormat: 'pretty' | 'raw'
}) => {
  const isLargeResponse = response.size > LARGE_RESPONSE_THRESHOLD
  const effectiveFormat = isLargeResponse && bodyFormat === 'pretty' ? 'raw' : bodyFormat

  return (
    <div className="response-body">
      {response.errorType && response.status === 0 && (
        <ErrorBanner errorType={response.errorType} />
      )}
      {responseTab === 'body' && (
        <>
          {typeof response.body === 'object' ? (
            <JsonHighlighter data={response.body} rawMode={effectiveFormat === 'raw'} />
          ) : (
            <pre className="text-body">{response.body}</pre>
          )}
        </>
      )}
      {responseTab === 'headers' && (
        <div className="headers-table">
          {Object.entries(response.headers).map(([key, value]) => (
            <div key={key} className="header-row">
              <span className="header-key">{key}</span>
              <span className="header-value">{value}</span>
            </div>
          ))}
        </div>
      )}
      {responseTab === 'cookies' && (
        <CookiesTable headers={response.headers} />
      )}
      {responseTab === 'tests' && (
        <TestsPanel testResults={response.testResults} consoleLogs={response.consoleLogs} />
      )}
    </div>
  )
})

ResponseBody.displayName = 'ResponseBody'

export default ResponseBody
