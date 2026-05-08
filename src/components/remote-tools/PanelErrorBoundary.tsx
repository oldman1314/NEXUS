import { Component, type ReactNode, type ErrorInfo } from 'react'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface Props {
  children: ReactNode
  panelId?: string
  panelTitle?: string
  onRetry?: () => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class PanelErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[PanelErrorBoundary] Error in panel "${this.props.panelTitle || this.props.panelId || 'unknown'}":`, error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
    this.props.onRetry?.()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="panel-error-boundary">
          <AlertCircle size={24} className="panel-error-boundary-icon" />
          <p className="panel-error-boundary-title">
            {this.props.panelTitle ? `"${this.props.panelTitle}" crashed` : 'Panel crashed'}
          </p>
          <p className="panel-error-boundary-message">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button className="panel-error-boundary-retry" onClick={this.handleRetry}>
            <RotateCcw size={14} />
            <span>Retry</span>
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
