import {expect, test} from "@playwright/test"
import { login } from "../utils/auth"
import { standardUser } from "../utils/users"


test.describe('Tasks Page', ()=>{
    test.beforeEach(async ({page})=>{
        await login(page, standardUser)
        await expect(page).toHaveURL(/dashboard/)
        await page.goto('http://localhost:3000/tasks')

    })
    test('checking task heading is visible', async ({page})=>{
        await expect(page.getByRole('heading', {name: 'Tasks'})).toBeVisible()
    })

    test('show new task link', async ({page})=>{
        await expect(page.getByRole('link', {name: 'New task'})).toBeVisible()
    })

    test('new task link opens a form', async ({page})=>{
        await page.getByRole('link', {name: 'New task'}).click()
        await expect(page.getByRole('heading', {name: 'New Task'})).toBeVisible()
        await expect(page).toHaveURL(/\/tasks\/new/)
    })

   
})

test('clicking task link from dashboard', async({page})=>{
    await login(page, standardUser)
    await expect(page).toHaveURL(/dashboard/)
    await page.getByRole("link",{name:'Tasks', exact: true}).click()
    await expect(page).toHaveURL(/\/tasks$/)
})