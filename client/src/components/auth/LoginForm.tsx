import { useState } from "react";
import { login } from "../../api/auth";
import { useAuth } from "../../context/useAuth";
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
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.loginFormLabel}>Login</div>
      {error &&<p className={styles.errorToast}>{error}</p>}
      <div className={styles.inputWrapper}>
        <label htmlFor="login-username">Username</label>
        <input id="login-username" type="text" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} />
      </div>
      <div className={styles.inputWrapper}>
        <label htmlFor="login-password">Password</label>
        <input id="login-password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)}/>
      </div>
      <div>
        <button className={styles.formButton} type='submit' >Confirm</button>
        <button className={styles.formButton} type='button' onClick={() => setIsRegistration(true)}>Register</button>
      </div>
    </form>
  );
}
