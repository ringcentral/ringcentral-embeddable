import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';

import { RingtoneSettingsPanel } from '../../components/RingtoneSettingsPanel';

function mapToProps(_, {
  phone,
}) {
  const {
    webphone,
    locale,
  } = phone;
  if (!webphone) {
    return {};
  }
  return {
    currentLocale: locale.currentLocale,
    incomingAudioFile: webphone.incomingAudioFile,
    incomingAudio: webphone.incomingAudio,
    defaultIncomingAudioFile: webphone.defaultIncomingAudioFile,
    defaultIncomingAudio: webphone.defaultIncomingAudio,
  };
}

function mapToFunctions(_, {
  phone,
}) {
  const {
    webphone,
    routerInteraction,
  } = phone;
  return {
    onSave: ({
      incomingAudio,
      incomingAudioFile,
    }) => {
      if (webphone) {
        webphone.setRingtone({
          incomingAudio,
          incomingAudioFile,
          outgoingAudio: webphone.defaultOutgoingAudio,
          outgoingAudioFile: webphone.defaultOutgoingAudioFile,
        });
      }
    },
    onBackButtonClick: () => routerInteraction.goBack(),
  };
}

const RingtoneSettingsPage = withPhone(connect(
  mapToProps,
  mapToFunctions,
)(RingtoneSettingsPanel));

export default RingtoneSettingsPage;
