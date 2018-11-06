import GlipGroups from 'ringcentral-integration/modules/GlipGroups';
import { Module } from 'ringcentral-integration/lib/di';

const glipGroupRegExp = /glip\/groups$/;

@Module({
  deps: [],
})
export default class NewGlipGroups extends GlipGroups {
  async _subscriptionHandleFn(message) {
    if (
      message &&
      glipGroupRegExp.test(message.event) &&
      message.body &&
      message.body.eventType
    ) {
      const {
        eventType,
        ...group
      } = message.body;
      if (eventType.indexOf('Group') !== 0) {
        return;
      }
      if (eventType === 'GroupLeft') {
        this.store.dispatch({
          type: this.actionTypes.removeGroup,
          group,
        });
        return;
      }
      this.store.dispatch({
        type: this.actionTypes.updateGroup,
        group,
      });
      if (this._glipPersons) {
        this._glipPersons.loadPersons(group.members);
      }
      this._glipPosts.loadPosts(group.id);
    }
  }
}
