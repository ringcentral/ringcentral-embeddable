import callCtrlLayouts from '@ringcentral-integration/widgets/enums/callCtrlLayouts';
import CallCtrlContainerBase from '@ringcentral-integration/widgets/containers/CallCtrlPage/CallCtrlContainer';

export default class CallCtrlContainer extends CallCtrlContainerBase {
  // TODO: override to fix page no re-render after warm transfer host call ended
  UNSAFE_componentWillReceiveProps(nextProps, nextState) {
    this._updateMergingPairToSessionId(nextProps, nextState);

    let layout = this.state.layout;
    if (
      nextProps.session.id !== this.props.session.id ||
      nextProps.session.warmTransferSessionId !== this.props.session.warmTransferSessionId
    ) {
      layout = this.getLayout(this.props, nextProps);
      this.setState({
        layout,
      });

      if (layout === callCtrlLayouts.normalCtrl) {
        this._updateAvatarAndMatchIndex(nextProps);
      }
    } else if (
      layout === callCtrlLayouts.mergeCtrl &&
      CallCtrlContainerBase.isLastCallEnded(this.props) === false &&
      CallCtrlContainerBase.isLastCallEnded(nextProps) === true
    ) {
      this.onLastMergingCallEnded();
    } else if (
      layout === callCtrlLayouts.conferenceCtrl &&
      this.props.conferenceCallParties !== nextProps.conferenceCallParties
    ) {
      this._updateCurrentConferenceCall(nextProps);
    }
    this._updateMergeAddButtonDisabled(nextProps, layout);
  }
}
