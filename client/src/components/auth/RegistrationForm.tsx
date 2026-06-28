import React, { useState } from "react";
import { register } from "../../api/auth";

type RegistrationFormProps = {
  setIsRegistration: (v: boolean) => void;
};

export function RegistrationForm({ setIsRegistration }: RegistrationFormProps) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const resp = await register({name: username, email, password });
    if (resp.ok) {
      setIsRegistration(false);
    } else {
      console.log('error')
    }
  }


  return (
    <form onSubmit={handleSubmit}>
      <p>Registration</p>
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
