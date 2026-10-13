import { createQueueConversationsOptions } from '../../src/app/services/AppFeatures/createQueueConversationsOptions';
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

describe('createQueueConversationsOptions', () => {
  test('enables call queue SMS from the call queue SMS recipient permission on each read', () => {
    const appFeatures = { hasCallQueueSmsRecipientPermission: false };
    const options = createQueueConversationsOptions(appFeatures);

    expect(options.enable).toBe(false);
    appFeatures.hasCallQueueSmsRecipientPermission = true;
    expect(options.enable).toBe(true);
    appFeatures.hasCallQueueSmsRecipientPermission = undefined;
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
