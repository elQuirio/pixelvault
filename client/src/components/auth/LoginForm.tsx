type LoginFormProps = {
  setIsRegistration: (v: boolean) => void;
};

export function LoginForm({ setIsRegistration }: LoginFormProps) {


    
  return (
    <form>
      <p>Login</p>
      <label htmlFor="login-username">Username</label>
      <input id="login-username" type="text" />
      <label htmlFor="login-password">Password</label>
      <input id="login-password" type="password" />
      <button type='submit'>Confirm</button>

      <button type='button' onClick={() => setIsRegistration(true)}>Register</button>
    </form>
  );
}
