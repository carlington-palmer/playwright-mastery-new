# playwright-mastery-new

# Block 1
## ./ vs ../ - the single ./ means the same dir and the double ../ means a dir above
## missing await for a async function - it can be dangerous because a test can pass based on time. Async function always returns a promise, so when calling an async always use an await to have it wait until the operation is complete then it moves on.

# Block 2
## Runner anatomy - Proven 2026-10-19
### worker:- launches a node processer which then launches a → browser:- e.g chromium browser → context: each test gets its own isolated context its like its own incognito → page:- is just a tab in the session; <- is considered to be isolated browser state versus and shared app data is when you use same data source across different test such as database. and if thats the case a test should clean itself up after its finished; and why 2 workers can be slower:- this can be slower because two node instance will have to load that brings up two browsers.

# Block 3
## Block 3 Locators - Proven 2026-10-20
### Locators: are ways to find elements on a page
### strict mode: playwright uses a rule call strict mode for when multiple elements are the same if doesn't assume it throws an error. The dev would then have to narrow down the element they want to find. e.g filter, scoping the container or use {exact: true}
