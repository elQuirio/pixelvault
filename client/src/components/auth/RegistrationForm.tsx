type RegistrationFormProps = {
  setIsRegistration: (v: boolean) => void;
};

export function RegistrationForm({ setIsRegistration }: RegistrationFormProps) {


  return (
    <form>
      <p>Registration</p>
      <label htmlFor="registration-username">Username</label>
      <input id="registration-username" type="text" />
      <label htmlFor="registration-email">Email</label>
      <input id="registration-email" type="email" />
      <label htmlFor="registration-password">Password</label>
      <input id="registration-password" type="password" />
      <button type='submit'>Confirm</button>

      <button type='button' onClick={() => setIsRegistration(false)}>Login</button>
    </form>
  );
}
