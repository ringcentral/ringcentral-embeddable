import React, { useEffect, useState, useRef } from 'react';
import {
  styled,
  RcIconButton,
  RcListItem,
  RcListItemText,
  RcListItemSecondaryAction,
  RcListItemAvatar,
  RcTypography,
  RcMenuItem,
  RcMenu,
} from '@ringcentral/juno';
import { ArrowLeft2, Reset, MoreVert, Unpin, Pin } from '@ringcentral/juno-icon';
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

const IconButton = styled(RcIconButton)`
  margin-left: 0;
`;

type App = {
  id: string;
  name: string;
  description?: string;
  iconUri: string;
  submitPath?: string;
};

type AppAction = {
  id: string;
  label: string;
  color?: string;
}
type AppData = {
  page: Page;
  actions: AppAction[];
}

type Page = {
  schema: any;
  uiSchema: any;
  formData: any;
  type: string;
};

function getPageInfo(data: AppData | Page) {
  let page;
  let actions = [];
  if (data) {
    if ((data as Page).schema && (data as Page).type === 'json-schema') {
      page = data;
    } else if ((data as AppData).page && (data as AppData).page.schema && (data as AppData).page.type === 'json-schema') {
      page = (data as AppData).page;
      actions = (data as AppData).actions;
    }
  }
  return { page, actions };
}

function PageActions({
  actions,
  onActionClick,
}: {
  actions: AppAction[];
  onActionClick: (id: string) => void;
}) {
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreButtonRef = useRef<HTMLDivElement>(null);
  return (
    <>
      <IconButton
        symbol={MoreVert}
        size="small"
        onClick={() => {
          setMoreMenuOpen(!moreMenuOpen);
        }}
        innerRef={moreButtonRef}
        color="action.grayDark"
      />
      <RcMenu
        open={moreMenuOpen}
        anchorEl={moreButtonRef.current}
        onClose={() => {
          setMoreMenuOpen(false);
        }}
      >
        {
          actions.map((action) => (
            <RcMenuItem
              key={action.id}
              onClick={() => {
                onActionClick(action.id);
                setMoreMenuOpen(false);
              }}
              color={action.color}
            >
              <RcListItemText
                primary={action.label}
                primaryTypographyProps={{
                  color: action.color || 'action.grayDark',
                }}
              />
            </RcMenuItem>
          ))
        }
      </RcMenu>
    </>
  )
}

export function WidgetAppPanel({
  app,
  onLoadApp = async () => null,
  onBack,
  showBack,
  contact,
  isPinned,
  onPinChanged,
  showPin,
}: {
  app: App;
  onLoadApp?: (data: any) => Promise<AppData | Page | null>;
  onBack: () => void;
  showBack?: boolean;
  contact: any;
  isPinned: boolean;
  onPinChanged: () => void;
  showPin: boolean;
}) {
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState<Page | null>(null);
  const [formDataState, setFormDataState] = useState({});
  const [actions, setActions] = useState<{ id: string; label: string }[]>([]);

  useEffect(() => {
    const init = async () => {
      const data = await onLoadApp({
        app,
        contact,
        type: 'init',
      });
      const { page, actions } = getPageInfo(data);
      if (page) {
        setPage(page);
        setFormDataState(page.formData || {});
        setActions(actions || []);
      } else {
        setPage(null);
        setFormDataState({});
        setActions([]);
      }
    };
    init();
  }, []);

  return (
    <Container>
      <PageHeader>
        {
          showBack && (
            <BackButton
              symbol={ArrowLeft2}
              onClick={onBack}
              variant="plain"
              size="xlarge"
            />
          )
        }
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
            <IconButton
              symbol={Reset}
              size="small"
              color="action.grayDark"
              loading={refreshing}
              title="Reload the app"
              onClick={async () => {
                setRefreshing(true);
                const data = await onLoadApp({
                  app,
                  contact,
                  formDataState,
                  type: 'refresh',
                });
                setRefreshing(false);
                const { page, actions } = getPageInfo(data);
                if (page) {
                  setPage(page);
                  setFormDataState(page.formData || {});
                  setActions(actions || []);
                }
              }}
            />
            {
              showPin && (
                <IconButton
                  symbol={isPinned ? Pin : Unpin}
                  size="small"
                  color="action.grayDark"
                  title={isPinned ? 'Do not open this app as new tab' : 'Open this app as new tab'}
                  onClick={onPinChanged}
                />
              )
            }
            {
              actions && actions.length > 0 ? (
                <PageActions
                  actions={actions}
                  onActionClick={async (id) => {
                    const data = await onLoadApp({
                      app,
                      contact,
                      formData: formDataState,
                      type: 'buttonClick',
                      button: {
                        id,
                      }
                    });
                    const { page, actions } = getPageInfo(data);
                    if (page) {
                      setPage(page);
                      setFormDataState(page.formData || {});
                      setActions(actions || []);
                    }
                  }}
                />
              ) : null
            }
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
                  const data = await onLoadApp({
                    app,
                    contact,
                    formData: newFormData,
                    changedKeys,
                    type: 'inputChanged',
                  });
                  const { page, actions } = getPageInfo(data);
                  if (page) {
                    setPage(page);
                    setFormDataState(page.formData || {});
                    setActions(actions || []);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              formData={formDataState}
              uiSchema={page.uiSchema}
              onButtonClick={async (id) => {
                try {
                  const data = await onLoadApp({
                    app,
                    contact,
                    formData: formDataState,
                    type: 'buttonClick',
                    button: {
                      id,
                    }
                  });
                  const { page, actions } = getPageInfo(data);
                  if (page) {
                    setPage(page);
                    setFormDataState(page.formData || {});
                    setActions(actions || []);
                  }
                } catch (e) {
                  console.error(e);
                }
              }}
              hiddenSubmitButton={!app.submitPath || !(page.uiSchema && page.uiSchema.submitButtonOptions)}
              onSubmit={async () => {
                const data = await onLoadApp({
                  app,
                  contact,
                  formData: formDataState,
                  type: 'submit',
                });
                const { page, actions } = getPageInfo(data);
                if (page) {
                  setPage(page);
                  setFormDataState(page.formData || {});
                  setActions(actions || []);
                }
              }}
            />
          ) : (<LoadingText>Loading...</LoadingText>)
        }
      </StyledContent>
    </Container>
  );
}
