
import { useAuth } from './context/AuthContext.tsx';
import { AuthScreen } from "./components/auth/AuthScreen";
import { Gallery } from './components/Gallery/Gallery.tsx';
import { logout } from './api/auth.ts';

function App() {
  const {user, loading, setUser} = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <AuthScreen />;

  async function handleLogout() {
    await logout();
    setUser(null);
  }


  return (
    <main className="main-container">
      <button onClick={handleLogout}>Logout</button>
      <h1>PixelVault</h1>
      <Gallery />
    </main>
  );
}

export default App;
