import React, { useEffect, useState } from 'react';
import {
  styled,
  RcIconButton,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcListItemAvatar,
  RcTypography,
} from '@ringcentral/juno';
import { ArrowLeft2, Refresh } from '@ringcentral/juno-icon';
import { Container, PageHeader, Content, AppIcon } from './styled';
import { CustomizedForm } from '../CustomizedPanel/CustomizedForm';

const AppIconInHeader = styled(AppIcon)`
  width: 24px;
  height: 24px;
`;

const BackButton = styled(RcIconButton)`
  margin-left: -10px;
`;

const AppHeader = styled(RcListItem)`
  flex: 1;

  &.RcListItem-gutters {
    padding: 0;
  }

  .RcListItemText-primary {
    font-weight: 700;
  }
`;

const StyledContent = styled(Content)`
  padding-top: 0;
`;

const LoadingText = styled(RcTypography)`
  padding-top: 16px;
`;

type App = {
  id: string;
  name: string;
  description?: string;
  iconUri: string;
  submitPath?: string;
};

type Page = {
  schema: any;
  uiSchema: any;
  formData: any;
  type: string;
};

export function WidgetAppPanel({
  app,
  onLoadApp = async () => null,
  onBack,
  contact,
}: {
  app: App;
  onLoadApp?: (data: any) => Promise<Page | null>;
  onBack: () => void;
  contact: any;
}) {
  const [page, setPage] = useState<Page | null>(null);
  const [formDataState, setFormDataState] = useState({});

  useEffect(() => {
    const init = async () => {
      const page = await onLoadApp({
        app,
        contact,
        type: 'init',
      });
      if (page && page.schema && page.type === 'json-schema') {
        setPage(page);
        setFormDataState(page.formData || {});
      } else {
        setPage(null);
        setFormDataState({});
      }
    };
    init();
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
        <AppHeader
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
              onClick={async () => {
                const page = await onLoadApp({
                  app,
                  contact,
                  formDataState,
                  type: 'refresh',
                });
                if (page && page.schema) {
                  setPage(page);
                  setFormDataState(page.formData || {});
                }
              }}
            />
          </RcListItemSecondaryAction>
        </AppHeader>
      </PageHeader>
      <StyledContent>
        {
          page && page.schema ? (
            <CustomizedForm
              schema={page.schema}
              onFormDataChange={async (newFormData) => {
                const changedKeys = Object.keys(newFormData).filter(
                  (key) => newFormData[key] !== formDataState[key],
                );
                setFormDataState(newFormData);
                try {
                  const newPage = await onLoadApp({
                    app,
                    contact,
                    formData: newFormData,
                    changedKeys,
                    type: 'inputChanged',
                  });
                  if (newPage && newPage.schema) {
                    setPage(newPage);
                    setFormDataState(newPage.formData || {});
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              formData={formDataState}
              uiSchema={page.uiSchema}
              onButtonClick={async (id) => {
                try {
                  const newPage = await onLoadApp({
                    app,
                    contact,
                    formData: formDataState,
                    type: 'buttonClick',
                    button: {
                      id,
                    }
                  });
                  if (newPage && newPage.schema) {
                    setPage(newPage);
                    setFormDataState(newPage.formData || {});
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              hiddenSubmitButton={!app.submitPath || !(page.uiSchema && page.uiSchema.submitButtonOptions)}
              onSubmit={async () => {
                const newPage = await onLoadApp({
                  app,
                  contact,
                  formData: formDataState,
                  type: 'submit',
                });
                if (newPage && newPage.schema) {
                  setPage(newPage);
                  if (newPage.formData) {
                    setFormDataState(newPage.formData);
                  }
                }
              }}
            />
          ) : (<LoadingText>Loading...</LoadingText>)
        }
      </StyledContent>
    </Container>
  );
}
