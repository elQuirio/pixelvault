import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { me } from "../api/auth";

type User = { id: number };

type AuthContextValue = { 
    user: User | null,
    loading: boolean,
    setUser: (u: User|null) => void,
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
        <AuthContext.Provider value={{user, loading, setUser}}>
        {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error('UseAuth must be inside AuthProvider');
    return ctx;
}