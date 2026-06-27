import { API_BASE } from "../config/api";
import type { Result } from "./result";

type RegisterBodyType = {
    name: string, 
    email: string, 
    password: string
};

type LoginBodyType = {
    name: string,
    password: string
}

type RegisterError = 'name_taken' | 'invalid_input';

type LoginError = 'wrong_credentials' | 'invalid_input';

export async function register(bodyContent: RegisterBodyType): Promise<Result<void, RegisterError>> {

    const resp = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyContent)
    })
    if (resp.ok) {
        return {ok: true, data: undefined};
    }
    if (resp.status === 400) {
        return {ok: false, error: 'invalid_input'};
    }
    if (resp.status === 409) {
        return {ok: false, error: 'name_taken'};
    }
    throw new Error(`Unexpected error: ${resp.status} ${resp.statusText}`);
}



export async function login(bodyContent: LoginBodyType): Promise<Result<void, LoginError>> {
    
    const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyContent)
    })

    if (resp.ok) {
        return {ok: true, data: undefined};
    }
    if (resp.status === 400) {
        return {ok: false, error: 'invalid_input'};
    }
    if (resp.status === 401) {
        return {ok: false, error: 'wrong_credentials'};
    }

    throw new Error(`Unexpected error: ${resp.status} ${resp.statusText}`)
}


export async function me() {

    const resp = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include'
    })

    if (resp.status === 200) return await resp.json() as {id: number};

    else if (resp.status === 401) return null;

    else {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`);
    }
}
