export async function visitThirdPartyPage() {
  await page.goto(__THIRD_PARTY_URI__, {
    waituntil: 'networkidle0',
    timeout: 120000,
  });
}
