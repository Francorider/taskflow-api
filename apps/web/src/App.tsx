import { useAuth } from './auth/useAuth';
import { Logo } from './components/Logo';
import { AuthPage } from './pages/AuthPage';
import { TasksPage } from './pages/TasksPage';

export function App() {
  const auth = useAuth();

  if (auth.status === 'loading') {
    return (
      <div className="center-screen" role="status">
        <span className="spinner" aria-hidden="true" />
        <span className="visually-hidden">Loading</span>
      </div>
    );
  }

  if (auth.status === 'anonymous') return <AuthPage />;

  return (
    <div className="app">
      <header className="app-header">
        <div className="app-header__inner">
          <Logo />
          <div className="app-header__user">
            <span className="app-header__name" title={auth.user.email}>
              {auth.user.name}
            </span>
            <button type="button" className="button button--ghost" onClick={auth.logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="app-main">
        <TasksPage />
      </main>
    </div>
  );
}
