import {test, expect} from "@playwright/test"


test('saucedemo login page loads', async({page})=>{

    await page.goto('https://www.saucedemo.com/')
    await expect(page).toHaveTitle("Swag Labs")
})

test("check if login button is visible", async({page})=>{

    await page.goto('https://www.saucedemo.com/')
    await expect(page.getByRole("button", {name: "Login"})).toBeVisible()
})