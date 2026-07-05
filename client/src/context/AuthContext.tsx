import { createContext } from "react";

type User = { id: number };

type AuthContextValue = { 
    user: User | null,
    loading: boolean,
    setUser: (u: User|null) => void,
};



export const AuthContext = createContext<AuthContextValue | null> (null);
