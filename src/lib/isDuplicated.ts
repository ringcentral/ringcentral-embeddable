function getStorageKey(groupName: string, id: string): string {
  return `${groupName}-${id}`;
}

function clearExpiredKeys(groupName: string, maxKeys: number): void {
  const groupKeys = Object.keys(localStorage).filter((key) =>
    key.startsWith(groupName)
  );
  if (groupKeys.length <= maxKeys) {
    return;
  }
  const [oldestKey] = groupKeys.sort(
    (first, second) =>
      Number(localStorage.getItem(first)) - Number(localStorage.getItem(second))
  );
  if (oldestKey) {
    localStorage.removeItem(oldestKey);
  }
}

export function isDuplicated(
  groupName: string,
  id: string,
  maxKeys = 20
): boolean {
  if (typeof localStorage === 'undefined') {
    return false;
  }
  const key = getStorageKey(groupName, id);
  if (localStorage.getItem(key)) {
    return true;
  }
  try {
    localStorage.setItem(key, `${Date.now()}`);
    clearExpiredKeys(groupName, maxKeys);
  } catch (error: unknown) {
    console.error(error);
  }
  return false;
}
