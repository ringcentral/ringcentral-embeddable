const useLocale = jest.fn(() => ({
  t: (key) => key,
}));

module.exports = {
  useLocale,
};
