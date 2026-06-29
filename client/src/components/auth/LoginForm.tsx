import { useState } from "react";
import { login } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";
import styles from './LoginForm.module.css';
import { useErrorToast } from "../../hooks/useErrorToast";


type LoginFormProps = {
  setIsRegistration: (v: boolean) => void;
};

export function LoginForm({ setIsRegistration }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useErrorToast();
  const {setUser} = useAuth();


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const resp = await login({name: username, password });
    if (resp.ok) {
      const user = resp.data;
      setUser(user);
    } else {
      switch(resp.error) {
        case 'wrong_credentials':
          setError('Wrong credentials');
          break;
        case 'invalid_input':
          setError('Invalid input');
          break;
      }
    }
  }

    
  return (
    <form onSubmit={handleSubmit}>
      <p>Login</p>
      {error &&<p className={styles.errorToast}>{error}</p>}
      <label htmlFor="login-username">Username</label>
      <input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      <label htmlFor="login-password">Password</label>
      <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <button type='submit' >Confirm</button>

      <button type='button' onClick={() => setIsRegistration(true)}>Register</button>
    </form>
  );
}
