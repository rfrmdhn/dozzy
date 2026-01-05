import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
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
        <div className="login-page">
            {/* Left Panel - Branding */}
            <div className="login-branding">
                <div className="branding-header">
                    <div className="brand-logo">
                        <span className="brand-icon">📋</span>
                        <span className="brand-name">Dozzy</span>
                    </div>
                </div>

                <div className="branding-content">
                    <h1 className="branding-title">
                        Organize your work, one task at a time.
                    </h1>
                    <p className="branding-description">
                        Track tasks from organization to project level, log your time accurately,
                        and generate insightful reports with Dozzy.
                    </p>

                    {/* Illustration */}
                    <div className="branding-illustration">
                        <div className="illustration-card">
                            <div className="illustration-line long"></div>
                            <div className="illustration-line medium"></div>
                            <div className="illustration-line short"></div>
                            <div className="illustration-check">
                                <span className="check-icon">✓</span>
                                <div className="illustration-line task"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="branding-footer">
                    <span>© 2024 Dozzy Inc.</span>
                </div>
            </div>

            {/* Right Panel - Login Form */}
            <div className="login-form-panel">
                <div className="login-form-container">
                    <div className="login-header">
                        <h2 className="login-title">
                            {isSignUp ? 'Create your account' : 'Welcome back'}
                        </h2>
                        <p className="login-subtitle">
                            {isSignUp
                                ? 'Start your productivity journey today.'
                                : 'Please enter your details to log in.'}
                        </p>
                    </div>

                    {/* OAuth buttons - placeholder */}
                    <div className="oauth-buttons">
                        <button type="button" className="btn btn-secondary oauth-btn" disabled>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                            </svg>
                            Google
                        </button>
                        <button type="button" className="btn btn-secondary oauth-btn" disabled>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                            </svg>
                            GitHub
                        </button>
                    </div>

                    <div className="divider">
                        <span>Or continue with</span>
                    </div>

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="email" className="input-label">
                                Email address
                            </label>
                            <div className="input-with-icon">
                                <span className="input-icon">✉️</span>
                                <input
                                    id="email"
                                    type="email"
                                    className="input"
                                    placeholder="name@company.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password" className="input-label">
                                Password
                            </label>
                            <div className="input-with-icon">
                                <span className="input-icon">🔒</span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                    tabIndex={-1}
                                >
                                    {showPassword ? '🙈' : '👁️'}
                                </button>
                            </div>
                        </div>

                        {!isSignUp && (
                            <div className="form-options">
                                <label className="checkbox-label">
                                    <input type="checkbox" className="checkbox" />
                                    <span>Remember me</span>
                                </label>
                                <a href="#" className="forgot-link" onClick={(e) => e.preventDefault()}>
                                    Forgot password?
                                </a>
                            </div>
                        )}

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
                                'Log In'
                            )}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                            <button
                                type="button"
                                className="toggle-link"
                                onClick={() => {
                                    setIsSignUp(!isSignUp);
                                    setError(null);
                                }}
                            >
                                {isSignUp ? 'Log In' : 'Sign up'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>

            <style>{`
        .login-page {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }

        /* Left Branding Panel */
        .login-branding {
          background: linear-gradient(180deg, #f0f7ff 0%, #e0efff 100%);
          padding: var(--space-8);
          display: flex;
          flex-direction: column;
        }

        .branding-header {
          margin-bottom: var(--space-16);
        }

        .brand-logo {
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .brand-icon {
          width: 36px;
          height: 36px;
          background: var(--color-primary-500);
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
        }

        .brand-name {
          font-size: var(--font-size-xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
        }

        .branding-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 480px;
        }

        .branding-title {
          font-size: 2.5rem;
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          line-height: 1.2;
          margin-bottom: var(--space-4);
        }

        .branding-description {
          font-size: var(--font-size-lg);
          color: var(--color-gray-600);
          line-height: 1.6;
          margin-bottom: var(--space-10);
        }

        .branding-illustration {
          padding: var(--space-8);
        }

        .illustration-card {
          background: var(--color-white);
          border-radius: var(--radius-xl);
          padding: var(--space-6);
          box-shadow: var(--shadow-lg);
          max-width: 400px;
        }

        .illustration-line {
          height: 12px;
          background: var(--color-primary-200);
          border-radius: var(--radius-full);
          margin-bottom: var(--space-3);
        }

        .illustration-line.long { width: 80%; }
        .illustration-line.medium { width: 60%; }
        .illustration-line.short { width: 40%; }
        .illustration-line.task { width: 70%; background: var(--color-gray-200); }

        .illustration-check {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          margin-top: var(--space-6);
        }

        .check-icon {
          width: 24px;
          height: 24px;
          background: var(--color-primary-100);
          color: var(--color-primary-500);
          border-radius: var(--radius-full);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--font-size-sm);
        }

        .branding-footer {
          color: var(--color-gray-500);
          font-size: var(--font-size-sm);
        }

        /* Right Form Panel */
        .login-form-panel {
          background: var(--color-white);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-8);
        }

        .login-form-container {
          width: 100%;
          max-width: 400px;
        }

        .login-header {
          margin-bottom: var(--space-8);
        }

        .login-title {
          font-size: var(--font-size-2xl);
          font-weight: var(--font-weight-bold);
          color: var(--color-gray-900);
          margin-bottom: var(--space-2);
        }

        .login-subtitle {
          color: var(--color-gray-500);
        }

        .oauth-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-3);
          margin-bottom: var(--space-6);
        }

        .oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3);
        }

        .divider {
          display: flex;
          align-items: center;
          margin-bottom: var(--space-6);
          color: var(--color-gray-400);
          font-size: var(--font-size-sm);
        }

        .divider::before,
        .divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--color-gray-200);
        }

        .divider span {
          padding: 0 var(--space-4);
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-5);
        }

        .login-error {
          padding: var(--space-3) var(--space-4);
          background: var(--color-error-light);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-radius: var(--radius-lg);
          color: var(--color-error);
          font-size: var(--font-size-sm);
        }

        .input-with-icon {
          position: relative;
        }

        .input-with-icon .input {
          padding-left: 44px;
          padding-right: 44px;
        }

        .input-with-icon .input-icon {
          position: absolute;
          left: var(--space-4);
          top: 50%;
          transform: translateY(-50%);
          font-size: 1rem;
        }

        .password-toggle {
          position: absolute;
          right: var(--space-3);
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--space-2);
          font-size: 1rem;
        }

        .form-options {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--font-size-sm);
          color: var(--color-gray-600);
          cursor: pointer;
        }

        .checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--color-primary-500);
        }

        .forgot-link {
          font-size: var(--font-size-sm);
          color: var(--color-primary-500);
        }

        .forgot-link:hover {
          color: var(--color-primary-600);
        }

        .login-footer {
          margin-top: var(--space-8);
          text-align: center;
          color: var(--color-gray-500);
          font-size: var(--font-size-sm);
        }

        .toggle-link {
          background: none;
          border: none;
          color: var(--color-primary-500);
          font-size: inherit;
          cursor: pointer;
          margin-left: var(--space-1);
          font-weight: var(--font-weight-medium);
        }

        .toggle-link:hover {
          color: var(--color-primary-600);
          text-decoration: underline;
        }

        /* Responsive */
        @media (max-width: 1024px) {
          .login-page {
            grid-template-columns: 1fr;
          }

          .login-branding {
            display: none;
          }
        }

        @media (max-width: 480px) {
          .oauth-buttons {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
}
