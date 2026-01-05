import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { signIn, signUp } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        try {
            const { error } = isSignUp
                ? await signUp(email, password)
                : await signIn(email, password);

            if (error) {
                setError(error.message);
            } else {
                navigate('/');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card card-glass">
                <div className="login-header">
                    <h1 className="login-logo">Dozzy</h1>
                    <p className="login-subtitle">
                        {isSignUp ? 'Create your account' : 'Welcome back'}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <div className="input-group">
                        <label htmlFor="email" className="input-label">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            className="input"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password" className="input-label">
                            Password
                        </label>
                        <input
                            id="password"
                            type="password"
                            className="input"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                        />
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-lg w-full"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <span className="loading-spinner" />
                        ) : isSignUp ? (
                            'Create Account'
                        ) : (
                            'Sign In'
                        )}
                    </button>
                </form>

                <div className="login-footer">
                    <p>
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        <button
                            type="button"
                            className="login-toggle"
                            onClick={() => {
                                setIsSignUp(!isSignUp);
                                setError(null);
                            }}
                        >
                            {isSignUp ? 'Sign In' : 'Sign Up'}
                        </button>
                    </p>
                </div>
            </div>

            <style>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-4);
        }

        .login-card {
          width: 100%;
          max-width: 420px;
          padding: var(--space-10);
        }

        .login-header {
          text-align: center;
          margin-bottom: var(--space-8);
        }

        .login-logo {
          font-size: var(--font-size-4xl);
          font-weight: var(--font-weight-bold);
          background: linear-gradient(135deg, var(--color-primary-400), var(--color-secondary-400));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: var(--space-2);
        }

        .login-subtitle {
          color: var(--color-gray-400);
          font-size: var(--font-size-lg);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .login-error {
          padding: var(--space-3) var(--space-4);
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: var(--radius-lg);
          color: var(--color-error);
          font-size: var(--font-size-sm);
          text-align: center;
        }

        .login-footer {
          margin-top: var(--space-6);
          text-align: center;
          color: var(--color-gray-400);
          font-size: var(--font-size-sm);
        }

        .login-toggle {
          background: none;
          border: none;
          color: var(--color-primary-400);
          font-size: inherit;
          cursor: pointer;
          margin-left: var(--space-2);
          text-decoration: underline;
          transition: color var(--transition-fast);
        }

        .login-toggle:hover {
          color: var(--color-primary-300);
        }
      `}</style>
        </div>
    );
}
