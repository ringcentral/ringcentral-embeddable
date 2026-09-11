/* eslint-disable */
export default {
  provisionUpdate:
    '申し訳ありません。こちら側で問題が発生しました。まもなく自動的に再接続を試みます。',
  serverConnecting:
    '申し訳ございませんが、電話サーバーへの接続に問題があります。',
  browserNotSupported:
    '申し訳ございません。このブラウザーを使用して通話することはできません。',
  noOutboundCallWithoutDL:
    'お使いの内線では現在、ブラウザーを使用した通話発信が許可されていません。アップグレードについてアカウント担当者にお問い合わせください。',
  checkDLError:
    '外線通話ができません。このエラーが表示され続ける場合は、{brandName} サポートにお問い合わせください。',
  failWithoutStatusCode:
    '申し訳ありません。こちら側で問題が発生しました。エラーが解決しない場合は、このエラーを{brandName}サポートに報告してください。',
  muteError: '現在、通話をミュートできません。',
  holdError: '現在、通話を保留できません。',
  recordDisabled:
    '申し訳ありません。お使いのアカウントでは、通話を録音する機能はサポートされていません。アカウント管理者にお問い合わせください。',
  recordError: '現在、通話を録音できません。エラーコード：{errorCode}',
  parked: '通話は{parkedNumber}でパークされました',
  transferError: '通話を転送できません。後でもう一度やり直してください。',
  flipError: '通話をフリップできません。後でもう一度やり直してください。',
  toVoiceMailError: '内部エラーにより、通話をボイスメールへ送信できません',
  webphoneCountOverLimit: '登録できるウェブ電話は最大5台です。',
  failWithStatusCode:
    '申し訳ございません。エラー{errorCode}が発生しました。問題が解決しない場合は、このエラーを{brandName}サポートに報告してください。',
  registeringWithStatusCode:
    '申し訳ありませんが、問題が発生しました。再接続しようとしています。問題が解決しない場合は、このエラーを{brandName}サポートに報告してください。エラーコード：{errorCode}',
  registeringWithoutStatusCode:
    '申し訳ありませんが、問題が発生しました。再接続しようとしています。問題が解決しない場合は、このエラーを{brandName}サポートに報告してください。',
  connectFailed:
    '申し訳ございません。現在、電話機能は使用できません。後でやり直してください。',
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
