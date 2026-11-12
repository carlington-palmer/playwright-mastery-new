import { requireEnv } from "./env";

export type User = {
    username: string;
    password: string;
    errorMessage?: string;
}

export const standardUser: User = {
    username: requireEnv('STANDARD_USERNAME'),
    password: requireEnv('STANDARD_PASSWORD')
}

export const lockedUser: User = {
    username: requireEnv('LOCKED_USERNAME'),
    password: requireEnv('LOCKED_PASSWORD'),
    errorMessage: 'This account has been locked. Contact support.'
}

export const adminUser = {
    username: requireEnv('ADMIN_USERNAME'),
    password: requireEnv('ADMIN_PASSWORD')
}