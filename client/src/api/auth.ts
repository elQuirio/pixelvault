import { API_BASE } from "../config/api";

type RegisterBodyType = {
    name: string, 
    email: string, 
    password: string
};

type LoginBodyType = {
    name: string, 
    password: string
}

export async function register(bodyContent: RegisterBodyType) {

    const resp = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyContent)
    })

    if (!resp.ok) {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`)
    }

    return resp;
}



export async function login(bodyContent: LoginBodyType) {
    
    const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyContent)
    })

    if (!resp.ok) {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`)
    }

    return resp;

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