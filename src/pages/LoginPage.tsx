import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, CheckIcon } from '../components/icons';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
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
                ? await signUp(email, password, username)
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
                        <span className="brand-icon">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="2" width="20" height="20" rx="4" fill="#3b82f6" />
                                <path d="M7 8h10M7 12h10M7 16h6" stroke="white" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                        </span>
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
                                <span className="check-icon"><CheckIcon size={16} /></span>
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

                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error">
                                {error}
                            </div>
                        )}

                        {isSignUp && (
                            <div className="input-group">
                                <label htmlFor="username" className="input-label">
                                    Username
                                </label>
                                <div className="input-with-icon">
                                    <span className="input-icon"><UserIcon size={18} /></span>
                                    <input
                                        id="username"
                                        type="text"
                                        className="input"
                                        placeholder="johndoe"
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        required={isSignUp}
                                        autoComplete="username"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="input-group">
                            <label htmlFor="email" className="input-label">
                                {isSignUp ? 'Email address' : 'Username or Email'}
                            </label>
                            <div className="input-with-icon">
                                <span className="input-icon"><MailIcon size={18} /></span>
                                <input
                                    id="email"
                                    type={isSignUp ? "email" : "text"}
                                    className="input"
                                    placeholder={isSignUp ? "name@company.com" : "name@company.com or username"}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoComplete="username"
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label htmlFor="password" className="input-label">
                                Password
                            </label>
                            <div className="input-with-icon">
                                <span className="input-icon"><LockIcon size={18} /></span>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    className="input"
                                    placeholder="Enter your password"
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
                                    {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
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
