import { LoginForm } from "./LoginForm";
import { RegistrationForm } from "./RegistrationForm";
import { useState } from "react";
import styles from './AuthScreen.module.css'

export function AuthScreen() {
    const [isRegistration, setIsRegistration] = useState(false);

    if (isRegistration) return <div className={styles.authScreenContainer}><RegistrationForm setIsRegistration={setIsRegistration} /></div>


    return <div className={styles.authScreenContainer}><LoginForm setIsRegistration={setIsRegistration} /> </div>
}