/* eslint-disable */
export default {
  provisionUpdate: '抱歉，系統發生錯誤。我們很快就會自動嘗試重新連線。',
  serverConnecting: '抱歉，連線至電話伺服器時發生問題。',
  browserNotSupported: '抱歉，不支援使用此瀏覽器撥打電話。',
  noOutboundCallWithoutDL:
    '您的分機目前不支援使用瀏覽器向外撥出電話。請聯絡您的客戶代表進行升級。',
  checkDLError:
    '無法撥出電話。如果此錯誤持續發生，請聯絡 {brandName} 尋求支援。',
  failWithoutStatusCode:
    '抱歉，系統發生錯誤。如果錯誤仍然存在，請向 {brandName} 支援人員回報此錯誤。',
  muteError: '目前無法靜音。',
  holdError: '目前無法保留通話。',
  recordDisabled:
    '抱歉，您的帳戶並不具進行通話錄音的功能。請聯絡您的帳戶管理員。',
  recordError: '目前無法對通話進行錄音。錯誤代碼：{errorCode}',
  parked: '您通話的寄存位置為：{parkedNumber}',
  transferError: '無法轉接通話。請稍後再試。',
  flipError: '無法轉接通話。請稍後再試。',
  toVoiceMailError: '因為發生內部錯誤，無法將來電轉至語音信箱',
  webphoneCountOverLimit: '可註冊最多 5 支網路電話。',
  failWithStatusCode:
    '抱歉，我們遇到了錯誤：{errorCode}。如果問題仍然存在，請向 {brandName} 支援人員回報此錯誤。',
  registeringWithStatusCode:
    '抱歉，發生錯誤。我們正在嘗試重新連線。如果問題仍然存在，請向 {brandName} 支援人員回報此錯誤。錯誤代碼：{errorCode}。',
  registeringWithoutStatusCode:
    '抱歉，發生錯誤。我們正在嘗試重新連線。如果問題仍然存在，請向 {brandName} 支援人員回報此錯誤。',
  connectFailed: '抱歉，電話功能目前不可用。請稍後再試一次。',
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
