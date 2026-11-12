// Generated from: bdd/features/tasks.feature
import { test } from "../../../bdd/steps/fixtures.ts";

test.describe('Tasks', () => {

  test.beforeEach('Background', async ({ Given, loginPage, page }, testInfo) => { if (testInfo.error) return;
    await Given('I am logged in as a standard user', null, { loginPage, page }); 
  });
  
  test('Create a new Task', async ({ When, Then, taskPage }) => { 
    await When('I create a task called "Buy Milk"', null, { taskPage }); 
    await Then('I should see "Buy Milk" in the tasks list', null, { taskPage }); 
  });

  test('New task start as todo', async ({ When, Then, taskPage }) => { 
    await When('I create a task called "Coding Practice"', null, { taskPage }); 
    await Then('the task "Coding Practice" should have status "To do"', null, { taskPage }); 
  });

});

// == technical section ==

test.use({
  $test: [({}, use) => use(test), { scope: 'test', box: true }],
  $uri: [({}, use) => use('bdd/features/tasks.feature'), { scope: 'test', box: true }],
  $bddFileData: [({}, use) => use(bddFileData), { scope: "test", box: true }],
});

const bddFileData = [ // bdd-data-start
  {"pwTestLine":10,"pickleLine":6,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am logged in as a standard user","isBg":true,"stepMatchArguments":[]},{"pwStepLine":11,"gherkinStepLine":7,"keywordType":"Action","textWithKeyword":"When I create a task called \"Buy Milk\"","stepMatchArguments":[{"group":{"start":23,"value":"\"Buy Milk\"","children":[{"start":24,"value":"Buy Milk","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":12,"gherkinStepLine":8,"keywordType":"Outcome","textWithKeyword":"Then I should see \"Buy Milk\" in the tasks list","stepMatchArguments":[{"group":{"start":13,"value":"\"Buy Milk\"","children":[{"start":14,"value":"Buy Milk","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
  {"pwTestLine":15,"pickleLine":11,"tags":[],"steps":[{"pwStepLine":7,"gherkinStepLine":4,"keywordType":"Context","textWithKeyword":"Given I am logged in as a standard user","isBg":true,"stepMatchArguments":[]},{"pwStepLine":16,"gherkinStepLine":12,"keywordType":"Action","textWithKeyword":"When I create a task called \"Coding Practice\"","stepMatchArguments":[{"group":{"start":23,"value":"\"Coding Practice\"","children":[{"start":24,"value":"Coding Practice","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]},{"pwStepLine":17,"gherkinStepLine":13,"keywordType":"Outcome","textWithKeyword":"Then the task \"Coding Practice\" should have status \"To do\"","stepMatchArguments":[{"group":{"start":9,"value":"\"Coding Practice\"","children":[{"start":10,"value":"Coding Practice","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"},{"group":{"start":46,"value":"\"To do\"","children":[{"start":47,"value":"To do","children":[{}]},{"children":[{}]}]},"parameterTypeName":"string"}]}]},
]; // bdd-data-end