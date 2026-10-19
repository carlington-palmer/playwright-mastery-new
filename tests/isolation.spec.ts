import {test, expect} from '@playwright/test'
import { standardUser } from '../utils/users'
import { login } from '../utils/auth'


test('test that user logs in and dashboard is present', async ({page})=>{
    await login(page, standardUser)
    await expect(page).toHaveURL(/dashboard/)
})

test('test that user unable to access to task page', async ({page})=>{
    await page.goto('http://localhost:3000/tasks')
    await expect(page).toHaveURL(/login/)
})


test('test adding a task buying milk', async({page})=>{
    await login(page, standardUser)
    await expect(page).toHaveURL(/dashboard/)
    await page.getByRole('link', {name: 'Tasks', exact: true}).click()
    await expect(page).toHaveURL(/\/tasks$/)
    await page.getByRole('link', {name: 'New task', exact: true}).click()
    await expect(page).toHaveURL(/\/tasks\/new/)
    await page.getByLabel('Title').fill('Buy milk.')
    await page.getByLabel('Description').fill('milk for coffee')
    await page.getByRole('button', {name: 'Create task'}).click()
    await expect(page).toHaveURL(/\/tasks$/)
    await expect(page.getByRole('row').filter({hasText: "Buy milk."})).toBeVisible()
})

test('test counting all task and expects 12', async({page})=>{
    await login(page, standardUser)
    await expect(page).toHaveURL(/dashboard/)
    // await expect(page.locator("[data-testid='stat-total']").filter({has: page.locator('.stat-label')})).toContainText("12")
    await expect(page.getByTestId('stat-total')).toContainText("12")

})