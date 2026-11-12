import {expect, test } from "@playwright/test"


test("login and test profile", async ({request})=>{

    const loginResponse = await request.post("http://localhost:3000/api/auth/login/", {data: {username: 'standard_user', password: 'Password123!'}})

    expect(loginResponse.status()).toBe(200)

    const {token} = await loginResponse.json()

    const tokenResponse = await request.get("http://localhost:3000/api/me", {headers: {"Authorization": `Bearer ${token}`}})

    expect(tokenResponse.status()).toBe(200)

    const {username} = await tokenResponse.json()

    expect(username).toBe('standard_user')


    // console.log(token)
})
