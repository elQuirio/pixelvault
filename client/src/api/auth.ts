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

type RegisterBody = {id: number};

type LoginBody = {id: number};

type MeBody = {id: number};

export async function register(bodyContent: RegisterBodyType): Promise<Result<RegisterBody, RegisterError>> {

    const resp = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyContent)
    })
    if (resp.ok) {
        const body = await resp.json() as {data: {id: number}};
        return {ok: true, data: body.data};
    }
    if (resp.status === 400) {
        return {ok: false, error: 'invalid_input'};
    }
    if (resp.status === 409) {
        return {ok: false, error: 'name_taken'};
    }
    throw new Error(`Unexpected error: ${resp.status} ${resp.statusText}`);
}



export async function login(bodyContent: LoginBodyType): Promise<Result<LoginBody, LoginError>> {
    
    const resp = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        credentials: 'include',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify(bodyContent)
    })

    if (resp.ok) {
        const body = await resp.json() as {data: {id: number}};
        return {ok: true, data: body.data};
    }
    if (resp.status === 400) {
        return {ok: false, error: 'invalid_input'};
    }
    if (resp.status === 401) {
        return {ok: false, error: 'wrong_credentials'};
    }

    throw new Error(`Unexpected error: ${resp.status} ${resp.statusText}`)
}


export async function me(): Promise<null|MeBody> {

    const resp = await fetch(`${API_BASE}/auth/me`, {
        method: 'GET',
        credentials: 'include'
    })

    if (resp.status === 200) {
        const body = await resp.json() as {data: {id: number}};
        return body.data;
    }


    else if (resp.status === 401) return null;

    else {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`);
    }
}


export async function logout(): Promise<void> {
    const resp = await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
    });

    if(!resp.ok) {
        throw new Error(`Error: ${resp.status} ${resp.statusText}`);
    }
}