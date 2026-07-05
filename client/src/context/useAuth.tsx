import { useContext } from "react";
import { AuthContext } from "./AuthContext";

export function useAuth() {
    const ctx = useContext(AuthContext);
    if(!ctx) throw new Error('UseAuth must be inside AuthProvider');
    return ctx;
}