import React, { Component, type ReactNode } from 'react';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-8">
                    <div className="max-w-md text-center space-y-6">
                        <div className="w-20 h-20 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                            <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
                        <p className="text-muted-foreground">
                            We encountered an unexpected error. Please try refreshing the page.
                        </p>
                        {this.state.error && (
                            <details className="text-left bg-white/5 rounded-lg p-4 text-sm">
                                <summary className="cursor-pointer text-muted-foreground hover:text-white">
                                    Error details
                                </summary>
                                <pre className="mt-2 text-red-400 overflow-auto max-h-32 text-xs">
                                    {this.state.error.message}
                                </pre>
                            </details>
                        )}
                        <div className="flex gap-4 justify-center">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-2 bg-brand-purple text-white rounded-full hover:opacity-90 transition-opacity"
                            >
                                Refresh Page
                            </button>
                            <a
                                href="/"
                                onClick={() => this.setState({ hasError: false, error: null })}
                                className="px-6 py-2 bg-white/10 text-white rounded-full hover:bg-white/20 transition-colors"
                            >
                                Go Home
                            </a>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
