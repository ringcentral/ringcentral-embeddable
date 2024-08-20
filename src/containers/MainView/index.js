import { connectModule } from '@ringcentral-integration/widgets/lib/phoneContext';

import { MainViewPanel } from '../../components/MainViewPanel';

const MainView = connectModule((phone) => phone.mainViewUI)(
  MainViewPanel,
);

export default MainView;
