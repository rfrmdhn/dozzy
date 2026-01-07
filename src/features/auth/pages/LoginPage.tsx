import { useState } from 'react';
import type { FormEvent } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MailIcon, LockIcon, UserIcon, EyeIcon, EyeOffIcon, CheckIcon } from '../../../components/atoms/icons';
import { Input } from '../../../components/molecules/Input';
import { Button } from '../../../components/atoms/Button';
import '../styles/LoginPage.css';

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
              <Input
                id="username"
                label="Username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required={isSignUp}
                autoComplete="username"
                icon={<UserIcon size={18} />}
              />
            )}

            <Input
              id="email"
              label={isSignUp ? 'Email address' : 'Username or Email'}
              type={isSignUp ? "email" : "text"}
              placeholder={isSignUp ? "name@company.com" : "name@company.com or username"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              icon={<MailIcon size={18} />}
              containerClassName="mt-4"
            />

            <Input
              id="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              icon={<LockIcon size={18} />}
              containerClassName="mt-4"
              rightElement={
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
                </button>
              }
            />

            {!isSignUp && (
              <div className="form-options">
                <label className="checkbox-label">
                  <input type="checkbox" className="checkbox" />
                  <span>Remember me</span>
                </label>
                <Button variant="link" className="forgot-link" onClick={() => { }}>
                  Forgot password?
                </Button>
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="loading-spinner" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Log In'
              )}
            </Button>
          </form>

          <div className="login-footer">
            <p>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              <Button
                variant="link"
                className="toggle-link ml-1"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
              >
                {isSignUp ? 'Log In' : 'Sign up'}
              </Button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
