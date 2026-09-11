jest.mock('@ringcentral/juno/foundation/styled-components.js', () =>
  jest.requireActual(
    '../../node_modules/@ringcentral/juno/foundation/styled-components.js',
  ),
);
jest.mock(
  '@ringcentral/juno/es6/foundation/styled-components.js',
  () => require('../../next/shims/juno-styled-components'),
  { virtual: true },
);
jest.mock('@ringcentral/spring-ui', () => ({
  ...jest.requireActual('./mocks/springUiMock.js'),
  useEventListener: jest.fn(),
  useForkRef:
    (...refs) =>
    (value) =>
      refs.forEach((ref) => {
        if (typeof ref === 'function') {
          ref(value);
        } else if (ref) {
          ref.current = value;
        }
      }),
}));

const React = require('react');
const { render } = require('@testing-library/react');
const junoStyledComponents = require('../../next/shims/juno-styled-components');
const {
  EmojiMenu,
} = require('@ringcentral-integration/next-widgets/components/MessageInput/EmojiMenu');

describe('Juno styled-components compatibility', () => {
  test('exports the release-time RcUseTheme alias', () => {
    expect(junoStyledComponents.RcUseTheme).toBe(
      junoStyledComponents.useTheme,
    );
    expect(junoStyledComponents.default).toBeDefined();
  });

  test('renders the released EmojiMenu with the compatibility alias', () => {
    const { getByTestId } = render(
      React.createElement(EmojiMenu, {
        onSelect: jest.fn(),
      }),
    );

    expect(getByTestId('emojiButton')).toBeInTheDocument();
  });
});
