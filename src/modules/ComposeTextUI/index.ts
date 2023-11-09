import { Module } from '@ringcentral-integration/commons/lib/di';
import {
  ComposeTextUI as ComposeTextUIBase,
} from '@ringcentral-integration/widgets/modules/ComposeTextUI';

@Module({
  name: 'ComposeTextUI',
})
export class ComposeTextUI extends ComposeTextUIBase {

}
