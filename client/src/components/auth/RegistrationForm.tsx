import React, { useState } from "react";
import { register } from "../../api/auth";
import styles from './RegistrationForm.module.css';
import { useErrorToast } from "../../hooks/useErrorToast";


type RegistrationFormProps = {
  setIsRegistration: (v: boolean) => void;
};

export function RegistrationForm({ setIsRegistration }: RegistrationFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useErrorToast();


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const resp = await register({name: username, email, password });
    if (resp.ok) {
      setIsRegistration(false);
    } else {
      switch(resp.error) {
        case 'invalid_input':
          setError('Invalid input');
          break;
        case 'name_taken':
          setError('Name already taken');
          break;
      }
    }
  }


  return (
    <form onSubmit={handleSubmit}>
      <p>Registration</p>
      {error && <p className={styles.errorToast}>{error}</p>}
      <label htmlFor="registration-username">Username</label>
      <input id="registration-username" type="text" value={username} onChange={(e) => setUsername(e.target.value)}/>
      <label htmlFor="registration-email">Email</label>
      <input id="registration-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}/>
      <label htmlFor="registration-password">Password</label>
      <input id="registration-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}/>
      <button type='submit'>Confirm</button>

      <button type='button' onClick={() => setIsRegistration(false)}>Login</button>
    </form>
  );
}
