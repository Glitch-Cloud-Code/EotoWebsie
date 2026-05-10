import React, { type ReactNode } from 'react'

type ErrorBoundaryProps = {
  children: ReactNode
  fallback: ReactNode
  onError: () => void
}

type ErrorBoundaryState = {
  hasError: boolean
}

export class SceneErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false }

  public static getDerivedStateFromError() {
    return { hasError: true }
  }

  public componentDidCatch() {
    this.props.onError()
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
