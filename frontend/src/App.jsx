import AuthForm from './components/AuthForm';
import Dashboard from './pages/Dashboard';
import { useAuth } from './context/AuthContext';

function App() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
        <div className="pointer-events-none absolute -left-20 -top-28 h-80 w-80 rounded-full bg-sky-300/25 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 -bottom-28 h-96 w-96 rounded-full bg-cyan-300/30 blur-3xl" />
        <AuthForm />
      </div>
    );
  }

  return <Dashboard />;
}

export default App;
