import {expect, test} from "@playwright/test"


test('open taskly login page and check for title', async({page})=>{

    await page.goto('http://localhost:3000/login')
    await expect(page).toHaveTitle('Log in | Taskly')
})