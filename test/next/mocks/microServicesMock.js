const directDecorator = (_target, _key, descriptor) => descriptor;

module.exports = {
  ActivityMatcher: class ActivityMatcher {},
  AppFeatures: class AppFeatures {},
  Auth: class Auth {},
  CallLog: class CallLog {},
  CallMonitor: class CallMonitor {},
  Client: class Client {},
  ContactMatcher: class ContactMatcher {},
  ContactSearch: class ContactSearch {},
  Contacts: class Contacts {},
  ConversationMatcher: class ConversationMatcher {},
  GenericMeeting: class GenericMeeting {},
  MessageStore: class MessageStore {},
  Theme: class Theme {},
  Toast: class Toast {},
  Webphone: class Webphone {},
  track: () => directDecorator,
};
