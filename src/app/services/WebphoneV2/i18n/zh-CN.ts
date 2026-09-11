/* eslint-disable */
export default {
  provisionUpdate: '抱歉，系统出现问题。稍后我们将自动尝试重新连接。',
  serverConnecting: '抱歉，连接到电话服务器时出错。',
  browserNotSupported: '抱歉，不支持使用此浏览器拨打电话。',
  noOutboundCallWithoutDL:
    '当前您的分机不能通过浏览器向外拨打电话，请联系客户代表进行升级。',
  checkDLError:
    '无法拨出电话。如果重复出现此错误，请联系 {brandName} 寻求帮助。',
  failWithoutStatusCode:
    '抱歉，系统出现问题。如果错误仍然存在，请向 {brandName} 支持部门报告此错误。',
  muteError: '暂时无法静音。',
  holdError: '暂时无法将通话置于保持状态。',
  recordDisabled: '抱歉，您的帐户没有通话录音功能。请联系您的帐户管理员。',
  recordError: '当前无法录音通话。错误代码：{errorCode}。',
  parked: '您的通话寄存在以下号码：{parkedNumber}',
  transferError: '无法转移通话。请稍后重试。',
  flipError: '无法切换通话。请稍后重试。',
  toVoiceMailError: '由于内部错误，无法将来电转至语音信箱',
  webphoneCountOverLimit: '最多可注册 5 个网络电话。',
  failWithStatusCode:
    '抱歉，出错了：{errorCode}。如果问题仍然存在，请向 {brandName} 支持部门报告此错误。',
  registeringWithStatusCode:
    '抱歉，发生问题。我们正在尝试重新连接。如果问题仍然存在，请向 {brandName} 支持部门报告此错误。错误代码：{errorCode}。',
  registeringWithoutStatusCode:
    '抱歉，发生问题。我们正在尝试重新连接。如果问题仍然存在，请向 {brandName} 支持部门报告此错误。',
  connectFailed: '抱歉，电话功能当前不可用。请稍后再试。',
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
