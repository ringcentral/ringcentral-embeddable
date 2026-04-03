/* eslint-disable */
export default {
  provisionUpdate:
    '죄송합니다. 시스템에서 문제가 발생했습니다. 곧 자동으로 다시 연결하려고 시도합니다.',
  serverConnecting: '죄송합니다. 전화 서버에 연결하는 데 문제가 있습니다.',
  browserNotSupported:
    '죄송합니다. 이 브라우저를 사용하여 전화를 거는 것은 지원되지 않습니다.',
  noOutboundCallWithoutDL:
    '현재 내선에서 브라우저를 사용하여 발신 전화를 걸 수 없습니다. 계정 담당자에게 문의하여 업그레이드하세요.',
  checkDLError:
    '발신 전화를 걸 수 없습니다. 이 오류가 계속 표시되면 {brandName}에 문의하여 지원을 받으세요.',
  failWithoutStatusCode:
    '죄송합니다. 시스템에서 문제가 발생했습니다. 문제가 지속되면 {brandName} 지원팀에 이 오류를 보고하세요.',
  muteError: '현재 통화를 음소거할 수 없습니다.',
  holdError: '현재 통화를 대기할 수 없습니다.',
  recordDisabled:
    '죄송합니다. 계정에 통화를 녹음하는 기능이 없습니다. 계정 관리자에게 문의하세요.',
  recordError: '현재 통화를 녹음할 수 없습니다. 오류 코드: {errorCode}',
  parked: '위치 {parkedNumber}에서 통화가 대기되었습니다.',
  transferError: '통화를 전달할 수 없습니다. 나중에 다시 시도하세요.',
  flipError: '통화를 전환할 수 없습니다. 나중에 다시 시도하세요.',
  toVoiceMailError: '내부 오류로 인해 통화를 음성 사서함으로 보낼 수 없습니다.',
  webphoneCountOverLimit: '최대 5개의 WebPhone을 등록할 수 있습니다.',
  failWithStatusCode:
    '죄송합니다. 오류({errorCode})가 발생했습니다. 문제가 지속되면 {brandName} 지원팀에 이 오류를 보고하세요.',
  registeringWithStatusCode:
    '죄송합니다. 문제가 발생했습니다. 문제가 발생하여 다시 연결하고 있습니다. 문제가 지속되면 {brandName} 지원팀에 이 오류를 보고하세요. 오류 코드: {errorCode}.',
  registeringWithoutStatusCode:
    '죄송합니다. 문제가 발생했습니다. 문제가 발생하여 다시 연결하고 있습니다. 문제가 지속되면 {brandName} 지원팀에 이 오류를 보고하세요.',
  connectFailed:
    '죄송합니다. 현재 전화 기능을 사용할 수 없습니다. 나중에 다시 시도하세요.',
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
