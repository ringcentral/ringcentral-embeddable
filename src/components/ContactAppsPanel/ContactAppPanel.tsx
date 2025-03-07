import React, { useEffect } from 'react';
import {
  styled,
  RcIconButton,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcListItemAvatar,
} from '@ringcentral/juno';
import { ArrowLeft2, Refresh } from '@ringcentral/juno-icon';
import { Container, PageHeader, Content, AppIcon } from './styled';

const AppIconInHeader = styled(AppIcon)`
  width: 24px;
  height: 24px;
`;

const BackButton = styled(RcIconButton)`
  margin-left: -10px;
`;

const ContactAppHeader = styled(RcListItem)`
  flex: 1;

  &.RcListItem-gutters {
    padding-left: 0;
    padding-right: 0;
  }

  .RcListItemText-primary {
    font-weight: 700;
  }
`;

type App = {
  id: string;
  name: string;
  description?: string;
  iconUri: string;
}

export function ContactAppPanel({
  app,
  onLoadApp = () => {},
  onBack,
}: {
  app: App;
  onLoadApp?: (app: App) => void;
  onBack: () => void;
}) {
  useEffect(() => {
    onLoadApp(app);
  }, []);

  return (
    <Container>
      <PageHeader>
        <BackButton
          symbol={ArrowLeft2}
          onClick={onBack}
          variant="plain"
          size="xlarge"
        />
        <ContactAppHeader
          disableRipple
          canHover={false}
        >
          <RcListItemAvatar>
            <AppIconInHeader src={app.iconUri} />
          </RcListItemAvatar>
          <RcListItemText
            primary={app.name}
            secondary={app.description}
          />
          <RcListItemSecondaryAction>
            <RcIconButton
              symbol={Refresh}
              onClick={() => onLoadApp(app)}
            />
          </RcListItemSecondaryAction>
        </ContactAppHeader>
      </PageHeader>
      <Content>
        app
      </Content>
    </Container>
  );
}
