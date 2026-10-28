import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../support/world';
import { LoginPage } from '../../';
import { standardUser } from '../../utils/users';

Given('I am on the login page', async function (this: CustomWorld) {
  await new LoginPage(this.page).goto();
});

When('I log in as the standard user', async function (this: CustomWorld) {
  await new LoginPage(this.page).login(standardUser);
});

Then('I should see the dashboard', async function (this: CustomWorld) {
  await expect(this.page).toHaveURL(/dashboard/);
});