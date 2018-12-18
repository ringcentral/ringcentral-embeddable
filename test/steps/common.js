export async function setBrowserPermission(permissions = ['notifications', 'microphone']) {
  const context = browser.defaultBrowserContext();
  await context.overridePermissions(__HOST_URI__, permissions);
}

export async function visitIndexPage() {
  await page.goto(__HOST_URI__, {
    waituntil: 'networkidle0',
    timeout: 120000,
  });
}
