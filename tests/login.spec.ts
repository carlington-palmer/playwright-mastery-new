import {test, expect} from '@playwright/test'
import { standardUser, lockedUser } from '../utils/users'
import { login } from '../utils/auth'


test('test standard user login', async({page})=>{
    await login(page, standardUser)
    await expect(page).toHaveURL(/dashboard/)
})

test('test locked out user and check error message', async({page})=>{
    await login(page, lockedUser)

    if(!lockedUser.errorMessage) throw new Error('This field is required')
    await expect(page.getByRole('alert')).toHaveText(lockedUser.errorMessage)
})