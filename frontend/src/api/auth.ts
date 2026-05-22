import client from './client';
import type { AuthResponse } from './types';

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
  return data;
}

export async function register(
  email: string,
  password: string,
  firstName: string,
  lastName: string,
  role: string,
): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('/auth/register', {
    email,
    password,
    firstName,
    lastName,
    role,
  });
  return data;
}
