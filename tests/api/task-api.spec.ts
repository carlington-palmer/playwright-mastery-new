import {expect, test} from "@playwright/test"

test("API: no token is rejected 401", async({request})=>{

    const userRes = await request.get("http://localhost:3000/api/tasks", 
        {headers: {"Authorization": "Bearer "}}
        
    )
    expect(userRes.status()).toBe(401)

})


test("API: login user to see task", async({request})=>{

    const userResposne = await request.post("http://localhost:3000/api/auth/login", 
        {data: {username: "standard_user", password: "Password123!"}
    })

    expect(userResposne.status()).toBe(200)

    const {token} = await userResposne.json()

    const taskResponse = await request.get("http://localhost:3000/api/tasks?limit=50", {headers: {"Authorization": `Bearer ${token}`}})

    expect(taskResponse.status()).toBe(200)
    

    const {total} = await taskResponse.json()
    expect(total).toBe(12)


})

test("API: creating a task and verify it was created", async ({request})=>{
    const loginRespone = await request.post('http://localhost:3000/api/auth/login', {data: {username: 'standard_user', password: 'Password123!'}})
    expect(loginRespone.status()).toBe(200)

    const {token} = await loginRespone.json()

    const addTaskResponse = await request.post('http://localhost:3000/api/tasks', {data: { "title": "API created task" }})
    expect(addTaskResponse.status()).toBe(201)

    const {id} = await addTaskResponse.json()

    const getTaskResponse = await request.get(`http://localhost:3000/api/tasks/${id}`, {headers: {"Authorization": `Bearer ${token}`}})

    expect(getTaskResponse.status()).toBe(200)

    const {title, status, priority} = await getTaskResponse.json()
    expect(title).toBe("API created task")
    expect(status).toBe("todo")
    expect(priority).toBe("medium")

})