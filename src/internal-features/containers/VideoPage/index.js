import { connectModule } from 'ringcentral-widgets/lib/phoneContext';

import { VideoPanel } from '../../components/VideoPanel';

const VideoPage = connectModule((phone) => phone.videoUI)(VideoPanel);
export default VideoPage;
