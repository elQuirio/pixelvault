import { createContext, useEffect, useState, type ReactNode } from "react";
import { me } from "../api/auth";

type User = { id: number };

type AuthContextValue = { 
    user: User | null,
    loading: boolean,
};



const AuthContext = createContext<AuthContextValue | null> (null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            const user = await me();
            setUser(user);
            setLoading(false);
        };
        load();
    }, []);

    return (
        <AuthContext.Provider value={{user, loading}}>
        {children}
        </AuthContext.Provider>
    )
}