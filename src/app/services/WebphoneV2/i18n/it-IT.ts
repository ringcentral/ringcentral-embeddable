/* eslint-disable */
export default {
  provisionUpdate:
    'Si è verificato un problema nei nostri sistemi. Tenteremo la riconnessione automatica a breve.',
  serverConnecting:
    'Si è verificato un problema durante la connessione al server telefonico.',
  browserNotSupported:
    'Le chiamate mediante questo browser non sono supportate.',
  noOutboundCallWithoutDL:
    "Con questo interno non è attualmente consentito effettuare chiamate in uscita con il browser. Contatta il rappresentante dell'account per un upgrade.",
  checkDLError:
    "Impossibile effettuare una chiamata in uscita. Se l'errore persiste, contatta {brandName} per assistenza.",
  failWithoutStatusCode:
    "Si è verificato un problema nei nostri sistemi. Se l'errore persiste, segnala il problema all'assistenza {brandName}.",
  muteError:
    "Impossibile disattivare l'audio della chiamata in questo momento.",
  holdError: 'Impossibile mettere in attesa la chiamata in questo momento.',
  recordDisabled:
    "La funzione di registrazione chiamata non è disponibile nel tuo account. Contatta l'amministratore del tuo account.",
  recordError:
    'Non è possibile registrare la chiamata in questo momento. Codice errore: {errorCode}',
  parked: 'La tua chiamata è parcheggiata nella posizione: {parkedNumber}',
  transferError: 'Impossibile trasferire la chiamata. Riprova più tardi.',
  flipError: 'Impossibile commutare la chiamata. Riprova più tardi.',
  toVoiceMailError:
    'Errore interno: impossibile inviare la chiamata alla segreteria telefonica',
  webphoneCountOverLimit: 'È possibile registrare fino a 5 telefoni web.',
  failWithStatusCode:
    "Abbiamo riscontrato un errore: {errorCode}. Se il problema persiste, segnala l'errore all'assistenza {brandName}.",
  registeringWithStatusCode:
    "Si è verificato un problema. Tentativo di riconnessione. Se il problema persiste, segnala l'errore all'assistenza {brandName}. Codice errore: {errorCode}.",
  registeringWithoutStatusCode:
    "Si è verificato un problema. Tentativo di riconnessione. Se il problema persiste, segnala l'errore all'assistenza {brandName}.",
  connectFailed:
    'Le funzioni telefoniche non sono attualmente disponibili. Riprova più tardi.',
} as const;

// @key: @#@"provisionUpdate"@#@ @source: @#@"Sorry, something went wrong on our end. We will automatically try to reconnect shortly."@#@
// @key: @#@"serverConnecting"@#@ @source: @#@"Sorry, we are having an issue connecting to the phone server."@#@
// @key: @#@"browserNotSupported"@#@ @source: @#@"Sorry, making calls using this browser is not supported."@#@
// @key: @#@"noOutboundCallWithoutDL"@#@ @source: @#@"Your extension is not allowed to make outbound calls with browser currently, please contact your account representative for an upgrade."@#@
// @key: @#@"checkDLError"@#@ @source: @#@"Unable to make outgoing call. Contact {brandName} for support if this error keeps showing."@#@
// @key: @#@"failWithoutStatusCode"@#@ @source: @#@"Sorry, something went wrong on our end. If the error persists, report this error to {brandName} support."@#@
// @key: @#@"muteError"@#@ @source: @#@"Call cannot be muted at the moment."@#@
// @key: @#@"holdError"@#@ @source: @#@"Call cannot be hold at the moment."@#@
// @key: @#@"recordDisabled"@#@ @source: @#@"Sorry, your account does not have the feature to record a call. Please contact your account administrator."@#@
// @key: @#@"recordError"@#@ @source: @#@"You cannot record the call at the moment. Error code: {errorCode}"@#@
// @key: @#@"parked"@#@ @source: @#@"Your call is parked at location: {parkedNumber}"@#@
// @key: @#@"transferError"@#@ @source: @#@"Cannot transfer the call. Please try again later."@#@
// @key: @#@"flipError"@#@ @source: @#@"Cannot flip the call. Please try again later."@#@
// @key: @#@"toVoiceMailError"@#@ @source: @#@"Cannot send call to voicemail due to internal error"@#@
// @key: @#@"webphoneCountOverLimit"@#@ @source: @#@"A maximum of 5 web phones could be registered."@#@
// @key: @#@"failWithStatusCode"@#@ @source: @#@"Sorry, we've encountered an error: {errorCode}. If the problem persists, report this error to {brandName} support."@#@
// @key: @#@"registeringWithStatusCode"@#@ @source: @#@"Sorry, something went wrong. We are trying to reconnect. If the problem persists, please report this error to {brandName} support. Error code: {errorCode}."@#@
// @key: @#@"registeringWithoutStatusCode"@#@ @source: @#@"Sorry, something went wrong. We are trying to reconnect. If the problem persists, please report this error to {brandName} support."@#@
// @key: @#@"connectFailed"@#@ @source: @#@"Sorry, phone features are currently unavailable. Please retry later."@#@
