import { useId, useState, type SubmitEvent } from 'react';
import { useAuth } from '../auth/useAuth';
import { Logo } from '../components/Logo';
import { describeError } from '../lib/errors';

type Mode = 'login' | 'register';

export function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const hintId = useId();

  const isLogin = mode === 'login';

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (isLogin) await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError(describeError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="auth">
      <div className="auth__card">
        <Logo />
        <h1 className="auth__title">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
        <p className="auth__subtitle">
          {isLogin ? 'Sign in to see your tasks.' : 'Start organising your work in seconds.'}
        </p>

        <form className="form" onSubmit={(e) => void handleSubmit(e)} noValidate>
          {!isLogin && (
            <label className="field">
              <span className="field__label">Name</span>
              <input
                className="input"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                }}
                autoComplete="name"
                required
              />
            </label>
          )}
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
              }}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span className="field__label">Password</span>
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
              }}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              minLength={isLogin ? undefined : 8}
              aria-describedby={isLogin ? undefined : hintId}
              required
            />
          </label>
          {!isLogin && (
            <span id={hintId} className="field__hint field__hint--below">
              At least 8 characters.
            </span>
          )}

          {error && (
            <p className="form__error" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="button button--primary button--block"
            disabled={submitting}
          >
            {submitting ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="auth__switch">
          {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
          <button
            type="button"
            className="link-button"
            onClick={() => {
              setMode(isLogin ? 'register' : 'login');
              setError(null);
            }}
          >
            {isLogin ? 'Create one' : 'Sign in'}
          </button>
        </p>
      </div>
    </div>
  );
}
