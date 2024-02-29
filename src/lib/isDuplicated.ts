const getStorageKey = (groupName: string, id) => `${groupName}-${id}`;

function clearExpiredKeys(groupName: string, maxKeys = 20) {
  const keys = Object.keys(localStorage);
  const groupKeys = keys.filter((key) => key.startsWith(groupName));
  if (groupKeys.length > maxKeys) {
    const sortedKeys = groupKeys.sort((a, b) => {
      return Number(localStorage.getItem(a)) - Number(localStorage.getItem(b));
    });
    localStorage.removeItem(sortedKeys[0]);
  }
}

export function isDuplicated(groupName: string, id, maxKeys = 20) {
  const key = getStorageKey(groupName, id);
  if (localStorage.getItem(key)) {
    return true;
  }
  try {
    localStorage.setItem(key, `${Date.now()}`);
    clearExpiredKeys(groupName, maxKeys);
  } catch (e) {
    console.error(e);
  }
  return false;
}
