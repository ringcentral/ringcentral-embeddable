import { connect } from 'react-redux';
import {
  mapToFunctions,
  mapToProps,
  propTypes,
} from 'ringcentral-widget/containers/WelcomePage';

import LoginPanel from '../../components/LoginPanel';

const WelcomePage = connect(
  mapToProps,
  mapToFunctions,
)(LoginPanel);

WelcomePage.propTypes = propTypes;

export default WelcomePage;
