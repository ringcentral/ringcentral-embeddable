import BaseCallsListPanel from '@ringcentral-integration/widgets/components/CallsListPanel';

export default class CallsListPanel extends BaseCallsListPanel {
  UNSAFE_componentWillReceiveProps(nextProps: any) {
    super.UNSAFE_componentWillReceiveProps(nextProps);
    if (!nextProps.showSpinner && this.props.showSpinner) {
      if (this._mounted) {
        setTimeout(() => {
          this._calculateContentSize();
        }, 0);
      }
    }
  }
}
