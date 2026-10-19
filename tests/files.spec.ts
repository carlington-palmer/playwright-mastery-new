import {test, expect} from "@playwright/test"
import { login } from "../utils/auth"
import { standardUser } from "../utils/users"


test.describe("Files page test", ()=>{

    test.beforeEach(async({page})=>{
        await login(page, standardUser)
        await expect(page).toHaveURL(/dashboard/)
        await page.goto('http://localhost:3000/files')
    })
    test('test that file heading is visible', async({page})=>{
        await expect(page.getByRole('heading', {name: 'Files', exact: true})).toBeVisible()
    })
    test('test upload button is visible', async({page})=>{
        await expect(page.getByRole('button', {name: 'Upload'})).toBeVisible()
    })
})