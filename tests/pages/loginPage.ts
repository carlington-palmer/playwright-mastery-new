import {Page, Locator} from '@playwright/test'
import { User } from '../../utils/users';


export class LoginPage{

    readonly page: Page;
    readonly username: Locator;
    readonly password: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;


    constructor(page: Page){
        this.page = page
        this.username = page.getByLabel('Username')
        this.password = page.getByLabel('Password')
        this.loginButton = page.getByRole('button', {name: 'Log in'})
        this.errorMessage = page.getByRole('alert')
    }

    async goto(url: string = '/'){
        await this.page.goto('http://localhost:3000/login')
    }

    async login(user: User){
        await this.username.fill(user.username)
        await this.password.fill(user.password)
        await this.loginButton.click()
    }
}