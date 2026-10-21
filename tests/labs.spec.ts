import {test, expect} from "@playwright/test"
import { login } from "../utils/auth"
import { standardUser } from "../utils/users"


test.describe('Labs', ()=>{

    test.beforeEach(async({page})=>{
        await login(page, standardUser)
        await expect(page).toHaveURL(/dashboard/)
        await page.goto('http://localhost:3000/lab')
    })

    test('test loading report', async({page})=>{
        await page.getByRole('button', {name: 'Load report'}).click()
        const reportStatus = page.getByRole('status')
        await expect(reportStatus).toHaveText(/^Loading report.*/)

        await expect(reportStatus).toHaveText('Report ready')
    })

     test('test loading report wrong way', async({page})=>{
        await page.getByRole('button', {name: 'Load report'}).click() //clicks button
        const reportStatus = await page.getByRole('status').textContent() // saved the instant content 
        expect(reportStatus).toMatch(/^Loading report.*/) //takes the instant content and move to the next line does wait for it to load

        await expect(reportStatus).toBe('Report ready') //this wait for ready but only have stale data
    })

    test('test click starts the job', async ({page})=>{
        const startButton = page.getByRole('button', {name: 'Start job'})
        await startButton.click()
        await expect(startButton).toBeDisabled()

        const status = page.getByTestId('job-status')
        await expect(status).toHaveText('Queued')
        await expect(status).toHaveText('Running')
        await expect(status).toHaveText('Complete')

        await expect(startButton).toBeEnabled()

    })

})