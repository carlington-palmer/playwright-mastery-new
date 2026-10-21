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

    test('test "Add storageState setup" is "in progress"', async({page})=>{
        const row = page.getByRole('row', {name: 'Add storageState setup'})
        await expect(row).toContainText('In progress')
    })
    test('test clicking "Add storageState setup" edit button opens a form with said title', async({page})=>{
        const row = page.getByRole('row', {name: 'Add storageState setup'})
        await row.getByRole('link', {name: 'Edit'}).click()

        await expect(page).toHaveURL(/\/tasks\/\d+\/edit/)

        const titleField = page.getByLabel('Title') //page.getByRole('textbox', {name: 'title'})
        await expect(titleField).toHaveValue('Add storageState setup')
    })

    test('test in-progress tasks', async({page})=>{
        await page.getByLabel('Status').selectOption('in_progress')

        const tableRow = page.getByTestId('task-row')
        await expect(tableRow).toHaveCount(3)

        await expect(tableRow.filter({hasText: 'Urgent'})).toHaveCount(2)
        await expect(tableRow.filter({hasNotText: 'Urgent'})).toContainText('Add storageState setup')
    })

    test('test adding a task', async ({page})=>{
        await page.getByRole('link', {name: 'New task'}).click()
        await page.getByLabel('Title').fill('Release checklist')
        await page.getByLabel('Status').selectOption('Done')
        await page.getByLabel('High').check()
        await page.getByLabel('Due date').fill('2026-12-15')
        await page.getByLabel('Mark as urgent').check()
        await page.getByRole('button', {name: 'Create task', exact: true}).click()

        await expect(page).toHaveURL(/\/tasks$/)

        const taskRow = page.getByRole('row', {name: 'Release checklist'})
        await expect(taskRow).toBeVisible()
        await expect(taskRow).toContainText('Done')
        await expect(taskRow).toContainText('High')
        await expect(taskRow).toContainText('2026-12-15')
        await expect(taskRow).toContainText('Urgent')
        
    })

    test('add a task and check toast to be visible and then disappear', async ({page})=>{
        await page.getByRole('link', {name: 'New task'}).click()
        await page.getByLabel('Title', {exact: true}).fill('Toast check')
        await page.getByRole('button', {name: 'Create task'}).click()
        
        const toast = page.getByRole('status').filter({hasText: 'Task created'})
        await expect(toast).toBeVisible()
        await expect(toast).toHaveText('Task created')
        await expect(toast).toBeHidden()

        await expect(page.getByRole('row', {name: 'Toast check'})).toBeVisible()
    })
   
})

test('clicking task link from dashboard', async({page})=>{
    await login(page, standardUser)
    await expect(page).toHaveURL(/dashboard/)
    await page.getByRole("link",{name:'Tasks', exact: true}).click()
    await expect(page).toHaveURL(/\/tasks$/)
})