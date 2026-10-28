import { BeforeAll, AfterAll, Before, After, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { CustomWorld } from './world';

setDefaultTimeout(30 * 1000);
let browser: Browser;

BeforeAll(async function () { browser = await chromium.launch(); });
Before(async function (this: CustomWorld) {
  this.context = await browser.newContext();
  this.page = await this.context.newPage();
});
After(async function (this: CustomWorld) { await this.context.close(); });
AfterAll(async function () { await browser.close(); });