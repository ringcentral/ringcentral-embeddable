import { createMessageThreadOptions } from '../../src/app/services/AppFeatures/createMessageThreadOptions';
import { SmsTemplateView } from '../../src/app/views/SmsTemplateView';

jest.mock('@ringcentral-integration/micro-core/src/app/views', () => ({
  ModalView: class ModalView {},
}));

jest.mock(
  '@ringcentral-integration/micro-message/src/app/views/SmsTemplateView',
  () => ({
    SmsTemplateView: class SmsTemplateView {
      component(props) {
        return { type: 'templateButton', props };
      }
    },
  }),
);

describe('createMessageThreadOptions', () => {
  test('enables message threads from the SharedMessages flag on each read', () => {
    const appFeatures = { config: { SharedMessages: false } };
    const options = createMessageThreadOptions(appFeatures);

    expect(options.enable).toBe(false);
    appFeatures.config = { SharedMessages: true };
    expect(options.enable).toBe(true);
    appFeatures.config = {};
    expect(options.enable).toBe(false);
  });
});

describe('SmsTemplateView', () => {
  function createView(showSmsTemplate) {
    const view = Object.create(SmsTemplateView.prototype);
    view._appFeatures = { showSmsTemplate };
    return view;
  }

  test('shows the template button when SMS templates are on', () => {
    const props = { targetInputRef: { current: null } };

    expect(createView(true).component(props)).toEqual({
      type: 'templateButton',
      props,
    });
  });

  test('hides the template button when SMS templates are off', () => {
    expect(
      createView(false).component({ targetInputRef: { current: null } }),
    ).toBeNull();
  });
});
