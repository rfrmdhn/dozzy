import { Component, ErrorInfo, type ReactNode } from 'react';
import { Button } from './atoms';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
        // Here you would typically report to Sentry or other error tracking service
    }

    private handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="error-boundary-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100vh',
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--color-gray-50)',
                }}>
                    <div style={{ marginBottom: '16px', color: 'var(--color-error)' }}>
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '24px', marginBottom: '8px', fontWeight: 600 }}>Something went wrong</h1>
                    <p style={{ color: 'var(--color-gray-600)', marginBottom: '24px', maxWidth: '400px' }}>
                        We apologize for the inconvenience. An unexpected error occurred.
                    </p>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <Button variant="secondary" onClick={() => window.history.back()}>
                            Go Back
                        </Button>
                        <Button variant="primary" onClick={this.handleReset}>
                            Reload Application
                        </Button>
                    </div>
                    {import.meta.env.DEV && this.state.error && (
                        <pre style={{
                            marginTop: '32px',
                            padding: '16px',
                            background: '#f1f1f1',
                            borderRadius: '8px',
                            fontSize: '12px',
                            overflow: 'auto',
                            maxWidth: '100%',
                            textAlign: 'left'
                        }}>
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
