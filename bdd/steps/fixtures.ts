import {test as base, createBdd} from "playwright-bdd"
import { LoginPage } from "../../pages/LoginPage"
import { TaskPage } from "../../pages/TasksPage"


type Fixtures ={
    loginPage: LoginPage;
    taskPage: TaskPage;
}

export const test = base.extend<Fixtures>({

    loginPage: async({page}, use)=>{
        await use(new LoginPage(page))
    },

    taskPage: async ({page}, use)=>{
        await use(new TaskPage(page))
    }

})

export const {Given, When, Then} = createBdd(test)