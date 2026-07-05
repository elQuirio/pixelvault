
import { useAuth } from './context/useAuth.tsx';
import { AuthScreen } from "./components/auth/AuthScreen";
import { Layout } from './components/Layout/Layout.tsx';

function App() {
  const {user, loading} = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <AuthScreen />;

  return (
    <main className="main-container">
      <h1>PixelVault</h1>
      <Layout/>
    </main>
  );
}

export default App;
