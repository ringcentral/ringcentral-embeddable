import GlipPosts from 'ringcentral-integration/modules/GlipPosts';
import { Module } from 'ringcentral-integration/lib/di';

const glipGroupRegExp = /glip\/groups$/;
const glipPostsRegExp = /glip\/posts$/;

@Module({
  deps: [],
})
export default class NewGlipPosts extends GlipPosts {
  _processSubscription() {
    const { message } = this._subscription;
    this._lastMessage = message;
    if (
      message &&
      (
        glipPostsRegExp.test(message.event) ||
        glipGroupRegExp.test(message.event)
      ) &&
      message.body &&
      message.body.eventType
    ) {
      const {
        eventType,
        ...post
      } = message.body;
      if (eventType.indexOf('Post') !== 0) {
        return;
      }
      this.store.dispatch({
        type: this.actionTypes.createSuccess,
        groupId: post.groupId,
        record: post,
        oldRecordId: post.id,
        isSendByMe: (post.creatorId === this._auth.ownerId && eventType === 'PostAdded')
      });
      if (eventType === 'PostAdded' && post.creatorId !== this._auth.ownerId) {
        this._newPostListeners.forEach((listen) => {
          listen(post);
        });
      }
    }
  }
}
