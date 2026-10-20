import {test, expect} from '@playwright/test'
import { login } from '../utils/auth'
import { adminUser } from '../utils/users'


test.describe('Testing admin login', ()=>{

    test.beforeEach(async ({page})=>{
        await login(page, adminUser)
        await expect(page).toHaveURL(/dashboard/)

        await page.goto('http://localhost:3000/admin')
        await expect(page.getByRole('heading',{name: 'Admin', exact: true})).toBeVisible()
        await expect(page).toHaveURL(/\/admin$/)

    })

    test('test admin users table', async({page})=>{

        const userRows = page.getByTestId('user-row')
        await expect(userRows).toHaveCount(3)

        const lockedUser =  userRows.filter({hasText: 'locked_user'})
        await expect(lockedUser.getByRole('cell', {name: 'Locked', exact: true})).toBeVisible()

        const activeUser = userRows.filter({hasText: 'standard_user'})
        await expect(activeUser).toContainText('Active')

        await expect(activeUser.getByRole('button', {name: 'Lock standard_user', exact: true})).toBeVisible()
        await expect(userRows.filter({hasText: 'admin_user'}).getByRole('button')).toHaveCount(0)
    })
})