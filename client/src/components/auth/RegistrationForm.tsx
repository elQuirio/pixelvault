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
    <form className={styles.formContainer} onSubmit={handleSubmit}>
      <div className={styles.registrationFormLabel}>Registration</div>
      {error && <p className={styles.errorToast}>{error}</p>}
      <div className={styles.inputWrapper}>
        <label htmlFor="registration-username">Username</label>
        <input id="registration-username" type="text" className={styles.input} value={username} onChange={(e) => setUsername(e.target.value)}/>
      </div>
      <div className={styles.inputWrapper}>
        <label htmlFor="registration-email">Email</label>
        <input id="registration-email" type="email" className={styles.input} value={email} onChange={(e) => setEmail(e.target.value)}/>
      </div>
      <div className={styles.inputWrapper}>
        <label htmlFor="registration-password">Password</label>
        <input id="registration-password" type="password" className={styles.input} value={password} onChange={(e) => setPassword(e.target.value)}/>
      </div>
      <div>
        <button className={styles.formButton} type='submit'>Confirm</button>
        <button className={styles.formButton} type='button' onClick={() => setIsRegistration(false)}>Login</button>
      </div>
    </form>
  );
}
