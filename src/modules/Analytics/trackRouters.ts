import {
  trackRouters as trackRoutersBase,
} from '@ringcentral-integration/commons/modules/AnalyticsV2';

export const trackRouters = trackRoutersBase
  .filter(r => r.router !== '/conferenceCall')
  .concat([
    {
      eventPostfix: 'Glip',
      router: '/glip', 
    },
    {
      eventPostfix: 'Glip Conversation',
      router: '/glip/groups', 
    },
    {
      eventPostfix: 'Meeting Home',
      router: '/meeting/home', 
    },
    {
      eventPostfix: 'Meeting History',
      router: '/meeting/history',
    },
    {
      eventPostfix: 'Meeting Schedule',
      router: '/meeting/schedule',
    },
    {
      eventPostfix: 'Calling Settings',
      router: '/settings/calling',
    },
    {
      eventPostfix: 'Region Settings',
      router: '/settings/region',
    },
    {
      eventPostfix: 'Audio Settings',
      router: '/settings/audio',
    },
    {
      eventPostfix: 'Ringtone Settings',
      router: '/settings/ringtone',
    },
    {
      eventPostfix: 'Conference Dialer',
      router: '/conferenceCall/dialer',
    },
    {
      eventPostfix: 'Conference Participants',
      router: '/conferenceCall/participants',
    },
    {
      eventPostfix: 'Conference OnHold',
      router: '/conferenceCall/onHold',
    },
    {
      eventPostfix: 'Contact Details',
      router: '/contacts/details',
    },
    {
      eventPostfix: 'Log Call',
      router: '/log/call',
    },
    {
      eventPostfix: 'Log Messages',
      router: '/log/messages',
    },
    {
      eventPostfix: 'Recordings',
      router: '/history/recordings',
    },
    {
      eventPostfix: 'Customized Page',
      router: '/customized',
    },
  ]);
