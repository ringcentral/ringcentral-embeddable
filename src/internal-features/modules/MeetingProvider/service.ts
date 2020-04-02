export async function getMeetingProvider(client) {
  const res = await client.service
    .platform()
    .get('/account/~/extension/~/video-configuration');
  return res.json();
}
