# playwright-mastery-new
## ./ vs ../ - the single ./ means the same dir and the double ../ means a dir above
## missing await for a async function - it can be dangerous because a test can pass based on time. Async function always returns a promise, so when calling an async always use an await to have it wait until the operation is complete then it moves on.