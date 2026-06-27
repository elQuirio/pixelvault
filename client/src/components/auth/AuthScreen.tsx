import { LoginForm } from "./LoginForm";
import { RegistrationForm } from "./RegistrationForm";
import { useState } from "react";

export function AuthScreen() {
    const [isRegistration, setIsRegistration] = useState(false);

    if (isRegistration) return <RegistrationForm setIsRegistration={setIsRegistration} />


    return <div><LoginForm setIsRegistration={setIsRegistration} /> </div>
}