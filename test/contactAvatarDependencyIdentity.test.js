const React = require('react');
const { render, screen } = require('@testing-library/react');
const nextCore = require('@ringcentral-integration/next-core');
const {
  EmbeddableAnalytics,
} = require('../src/app/services/Analytics');
const {
  EmbeddableAuth,
  EmbeddableOAuth,
} = require('../src/app/services/Authentication');
const {
  EmbeddableCallLogger,
} = require('../src/app/services/CallLogger');
const {
  useContactAvatar,
} = require('@ringcentral-integration/micro-contacts/src/app/components/ContactAvatar/useContactAvatar');

describe('replacement module identities', () => {
  test.each([
    ['Auth', EmbeddableAuth],
    ['Analytics', EmbeddableAnalytics],
    ['OAuth', EmbeddableOAuth],
    ['CallLogger', EmbeddableCallLogger],
  ])('preserves the public %s module key', (moduleKey, implementation) => {
    expect(implementation.name).toBe(moduleKey);
    expect(implementation.prototype[nextCore.nameKey]).toBe(moduleKey);
  });

  test('resolves Auth when ContactAvatar reads the access token', () => {
    const contacts = {
      allContactsMap: new Map(),
      getProfileImageSync: jest.fn(() => '/avatar.png'),
    };
    const modules = {
      [EmbeddableAuth.prototype[nextCore.nameKey]]: {
        accessToken: 'access-token',
      },
      Contacts: contacts,
    };
    nextCore.useContainer.mockImplementation((moduleKey) => modules[moduleKey]);

    function AvatarUrlProbe() {
      const avatarUrl = useContactAvatar({
        id: 'contact-id',
        name: 'Ada Lovelace',
      });
      return React.createElement(
        'span',
        { 'data-sign': 'avatar-url' },
        avatarUrl,
      );
    }

    render(React.createElement(AvatarUrlProbe));

    expect(screen.getByTestId('avatar-url')).toHaveTextContent('/avatar.png');
    expect(nextCore.useContainer).toHaveBeenCalledWith('Auth');
    expect(nextCore.useContainer).toHaveBeenCalledWith('Contacts');
    expect(contacts.getProfileImageSync).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'contact-id' }),
      'xsmall',
    );
  });
});
