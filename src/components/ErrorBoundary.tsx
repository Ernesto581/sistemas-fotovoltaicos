import { Component, type ReactNode } from 'react'

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-full items-center justify-center bg-slate-900 p-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
            <h1 className="text-lg font-bold text-red-600">Ocurrió un error</h1>
            <p className="mt-2 break-words rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {String(this.state.error.message || this.state.error)}
            </p>
            <button
              className="btn-primary mt-4 w-full"
              onClick={() => {
                localStorage.clear()
                location.reload()
              }}
            >
              Recargar
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
