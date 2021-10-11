export async function visitThirdPartyPage() {
  await page.goto(_THIRD_PARTY_URI, {
    waituntil: 'networkidle0',
    timeout: 120000,
  });
}
