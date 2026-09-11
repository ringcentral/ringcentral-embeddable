/* eslint-disable */
export default {
  provisionUpdate:
    'Jokin meni vikaan palvelimellamme. Yritämme muodostaa yhteyden automaattisesti hetken kuluttua.',
  serverConnecting: 'Puhelinpalvelinyhteydessä on ongelmia.',
  browserNotSupported: 'Puhelujen soittamista tällä selaimella ei tueta.',
  noOutboundCallWithoutDL:
    'Alanumerostasi ei voi tällä hetkellä soittaa puheluita selaimella. Pyydä päivitystä tilisi järjestelmänvalvojalta.',
  checkDLError:
    'Puhelun soittaminen epäonnistui. Ota yhteyttä tukeen ({brandName}), jos näet tämän virheilmoituksen uudelleen.',
  failWithoutStatusCode:
    'Jokin meni vikaan palvelimellamme. Jos virhe ei korjaannu, ilmoita virheestä palvelun {brandName} tukeen.',
  muteError: 'Puhelua ei voi mykistää tällä hetkellä.',
  holdError: 'Puhelua ei voi asettaa pitoon tällä hetkellä.',
  recordDisabled:
    'Puheluiden tallennus ei ole käytössä tililläsi. Ota yhteyttä tilisi järjestelmänvalvojaan.',
  recordError:
    'Puhelua ei voi tallentaa tällä hetkellä. Virhekoodi: {errorCode}',
  parked: 'Puhelusi on siirretty säilytykseen tänne: {parkedNumber}',
  transferError: 'Soitonsiirto epäonnistui. Yritä myöhemmin uudelleen.',
  flipError: 'Puhelua ei voi kääntää. Yritä myöhemmin uudelleen.',
  toVoiceMailError:
    'Puhelun lähettäminen vastaajaan epäonnistui sisäisen virheen vuoksi',
  webphoneCountOverLimit: 'Voin rekisteröidä enintään 5 verkkopuhelinta.',
  failWithStatusCode:
    'Tapahtui virhe: {errorCode}. Jos ongelma ei ratkea, ilmoita virheestä palvelun {brandName} tukeen.',
  registeringWithStatusCode:
    'Jokin meni vikaan. Yritetään yhdistää uudelleen. Jos ongelma ei ratkea, ilmoita virheestä palvelun {brandName} tukeen. Virhekoodi: {errorCode}.',
  registeringWithoutStatusCode:
    'Jokin meni vikaan. Yritetään yhdistää uudelleen. Jos ongelma ei ratkea, ilmoita virheestä palvelun {brandName} tukeen.',
  connectFailed:
    'Puhelimen ominaisuudet eivät ole tällä hetkellä käytettävissä. Yritä myöhemmin uudelleen.',
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
