export type User = {
    username: string;
    password: string;
    errorMessage?: string;
}

export const standardUser: User = {
    username: 'standard_user',
    password: 'Password123!'
}

export const lockedUser: User = {
    username: 'locked_user',
    password: 'Password123!',
    errorMessage: 'This account has been locked. Contact support.'
}