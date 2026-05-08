import { memo } from 'react'
import { FileCheck, X } from 'lucide-react'
import type { TestResult } from '@/types'

const TestsPanel = memo(({ testResults, consoleLogs }: { testResults?: TestResult[]; consoleLogs?: string[] }) => {
  const hasContent = (testResults && testResults.length > 0) || (consoleLogs && consoleLogs.length > 0)

  if (!hasContent) {
    return (
      <div className="tests-panel">
        <div className="empty-tests">
          <FileCheck size={32} className="empty-icon" />
          <p>No tests executed</p>
          <p className="empty-hint">Write test scripts in the Tests tab</p>
        </div>
      </div>
    )
  }

  const passedCount = testResults?.filter((t) => t.passed).length ?? 0
  const total = testResults?.length ?? 0
  const allPassed = total > 0 && testResults?.every((t) => t.passed)

  return (
    <div className="tests-panel">
      <div className="tests-list">
        {total > 0 && (
          <div className="tests-summary">
            <span className={`tests-count ${allPassed ? 'success' : 'error'}`}>
              {passedCount} / {total} passed
            </span>
          </div>
        )}
        {testResults?.map((result, i) => (
          <div key={i} className={`test-result ${result.passed ? 'passed' : 'failed'}`}>
            <div className="test-result-header">
              {result.passed ? (
                <FileCheck size={14} className="test-icon pass" />
              ) : (
                <X size={14} className="test-icon fail" />
              )}
              <span className="test-name">{result.name}</span>
            </div>
            {!result.passed && result.error && (
              <div className="test-error">{result.error}</div>
            )}
          </div>
        ))}
        {consoleLogs && consoleLogs.length > 0 && (
          <div className="script-logs-section">
            <div className="script-logs-header">Console Output</div>
            <div className="script-logs-list">
              {consoleLogs.map((log, i) => (
                <div
                  key={i}
                  className={`script-log ${log.startsWith('[ERROR]') || log.startsWith('[SCRIPT ERROR]') ? 'error' : log.startsWith('✓') ? 'success' : ''}`}
                >
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
})

TestsPanel.displayName = 'TestsPanel'

export default TestsPanel
