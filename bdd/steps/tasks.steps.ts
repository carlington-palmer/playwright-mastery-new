import {expect} from "@playwright/test"
import { Given, When, Then } from "./fixtures"
import { standardUser } from "../../utils/users"


Given('I am logged in as a standard user', async({loginPage, page})=>{
    await loginPage.goto()
    await loginPage.login(standardUser)
    await expect(page).toHaveURL(/dashboard/)
})

When('I create a task called {string}', async ({taskPage}, title: string)=>{
    await taskPage.goto()
    await taskPage.createTask(title)

})

Then('I should see {string} in the tasks list', async({taskPage}, title: string)=>{
    await expect(taskPage.forRow(title)).toBeVisible()
})


Then('the task {string} should have status {string}', async ({taskPage}, title: string, status: string) => {
  // Step: Then the task "Coding Practice" should have status "To do"
  // From: bdd/features/tasks.feature:13:5
  await expect(taskPage.forRow(title)).toContainText(status)
});