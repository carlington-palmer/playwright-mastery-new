import {Page, Locator} from "@playwright/test"


export class TaskPage{
    readonly page: Page
    readonly newTaskLink: Locator
   private readonly row: (title: string) => Locator

    constructor(page: Page){
        this.page = page
        this.newTaskLink = this.page.getByRole('link', {name: 'New task'})
        this.row = (title) => this.page.getByTestId('task-row').filter({hasText: title})   
     }

    async goto(){
        await this.page.goto('http://localhost:3000/tasks')
    }
    forRow(title: string): Locator{
        return this.row(title)
    }

    async filterByStatus(status: string){
        await this.page.getByLabel('Status').selectOption(status)
        
    }

    async createTask(title: string){
        await this.newTaskLink.click()
        await this.page.getByLabel('Title').fill(title)
        await this.page.getByRole('button', {name: 'Create task'}).click()
    }

}