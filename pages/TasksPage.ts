import {Page, Locator} from "@playwright/test"


export class TaskPage{
    readonly page: Page
    readonly newTaskLink: Locator
    readonly tableRow: Locator

    constructor(page: Page){
        this.page = page
        this.newTaskLink = this.page.getByRole('link', {name: 'New task'})
        this.tableRow = this.page.getByTestId('task-row')    }

    async goto(){
        await this.page.goto('http://localhost:3000/tasks')
    }
    forRow(title: string): Locator{
        return this.tableRow.filter({hasText: title})
    }

    async filterByStatus(status: string){
        await this.page.getByLabel('Status').selectOption(status)
        
    }

}