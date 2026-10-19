# playwright-mastery-new

# Block 1
## ./ vs ../ - the single ./ means the same dir and the double ../ means a dir above
## missing await for a async function - it can be dangerous because a test can pass based on time. Async function always returns a promise, so when calling an async always use an await to have it wait until the operation is complete then it moves on.

# Block 2
## Runner anatomy - Proven 2026-10-19
### worker:- launches a node processer which then launches a → browser:- e.g chromium browser → context: each test gets its own isolated context its like its own incognito → page:- is just a tab in the session; <- is considered to be isolated browser state versus and shared app data is when you use same data source across different test such as database. and if thats the case a test should clean itself up after its finished; and why 2 workers can be slower:- this can be slower because two node instance will have to load that brings up two browsers.