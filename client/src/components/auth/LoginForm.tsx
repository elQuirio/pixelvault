import { useState } from "react";
import { login } from "../../api/auth";
import { useAuth } from "../../context/AuthContext";

type LoginFormProps = {
  setIsRegistration: (v: boolean) => void;
};

export function LoginForm({ setIsRegistration }: LoginFormProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const {setUser} = useAuth();


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resp = await login({name: username, password });
    if (resp.ok) {
      const user = resp.data;
      setUser(user);
    } else {
      console.log('error')
    }
  }

    
  return (
    <form onSubmit={handleSubmit}>
      <p>Login</p>
      <label htmlFor="login-username">Username</label>
      <input id="login-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
      <label htmlFor="login-password">Password</label>
      <input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <button type='submit' >Confirm</button>

      <button type='button' onClick={() => setIsRegistration(true)}>Register</button>
    </form>
  );
}
