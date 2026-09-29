export const sortByName = <T, K extends keyof T>(sourceArr: T[], key: K) => {
  return sourceArr.sort((a, b) => {
    const aName = a[key].toString().toLowerCase();
    const bName = b[key].toString().toLowerCase();
    if (aName < bName) {
      return -1;
    }
    if (aName > bName) {
      return 1;
    }
    return 0;
  });
};
