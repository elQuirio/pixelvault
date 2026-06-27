
import { useAuth } from './context/AuthContext.tsx';
import { AuthScreen } from "./components/auth/AuthScreen";
import { Gallery } from './components/Gallery/Gallery.tsx';

function App() {
  const {user, loading} = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <AuthScreen />;


  return (
    <main className="main-container">
      <h1>PixelVault</h1>
      <Gallery />
    </main>
  );
}

export default App;
