'use client'

import React from 'react'

interface Props {
  children: React.ReactNode
  fallback?: React.ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('ErrorBoundary caught:', error, info)
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex flex-col items-center justify-center min-h-64 text-center p-8">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Something went wrong</h2>
            <p className="text-gray-600 text-sm">{this.state.error?.message}</p>
            <button
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded text-sm hover:bg-primary/90"
              onClick={() => this.setState({ hasError: false, error: null })}
              aria-label="Retry"
            >
              Retry
            </button>
          </div>
        )
      )
    }
    return this.props.children
  }
}
