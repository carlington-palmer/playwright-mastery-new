import {Page} from '@playwright/test'
import { User } from './users'

export async function login(page: Page, user: User): Promise<void>{

    await page.goto('http://localhost:3000/login')
    await page.getByLabel('Username').fill(user.username)
    await page.getByLabel('Password').fill(user.password)

    await page.getByRole('button',{name: 'Log in'}).click()
}