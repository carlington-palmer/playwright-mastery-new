import {test, expect} from '@playwright/test'
import { standardUser, lockedUser } from '../utils/users'
import { login } from '../utils/auth'
import { LoginPage } from './pages/loginPage'



test.describe('Log in page',()=>{

    test('test standard user login', async({page})=>{
        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login(standardUser)
        await expect(page).toHaveURL(/dashboard/)
    })

    test('test locked out user and check error message', async({page})=>{

        const loginPage = new LoginPage(page)
        await loginPage.goto()
        await loginPage.login(lockedUser)

        if(!lockedUser.errorMessage) throw new Error('This field is required')
        await expect(loginPage.errorMessage).toHaveText(lockedUser.errorMessage)
    })
})
