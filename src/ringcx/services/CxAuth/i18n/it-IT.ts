/* eslint-disable */
import { messageTypes } from '../../../enums';

export default {
  default: 'Predefinito',
  us: 'Nord America Nazionale',
  [messageTypes.NO_AGENT]: 'A questo account RC non è stato assegnato alcun account agente EV. Contatta il tuo amministratore.',
  [messageTypes.CONNECT_ERROR]: 'Errore di autenticazione. Per favore riprova più tardi.',
  [messageTypes.UNEXPECTED_AGENT]: 'A questo account RC è stato assegnato un account agente EV imprevisto. Contatta il tuo amministratore.',
  [messageTypes.INVALID_BROWSER]: 'WebSocket non è supportato dal tuo browser.',
  [messageTypes.CONNECT_TIMEOUT]: 'Timeout autorizzazione. Per favore riprova più tardi.',
  [messageTypes.OPEN_SOCKET_ERROR]: 'Errore di connessione socket. Per favore riprova più tardi.',
  [messageTypes.FORCE_LOGOUT]: 'La tua sessione di accesso è stata terminata.',
  [messageTypes.LOGOUT_FAIL_WITH_CALL_CONNECTED]: 'Impossibile disconnettersi mentre è connessa una chiamata.',
} as const;
