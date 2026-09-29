import { JSONSchemaPage } from '@ringcentral-integration/jsonschema-spring-page';
import {
  AppsMd,
  ArrowLeftMd,
  OverflowVerticalMd,
  PushPinFilledMd,
  PushPinMd,
  RefreshMd,
  Xmd,
} from '@ringcentral/spring-icon';
import {
  Avatar,
  CircularProgressIndicator,
  EmptyState,
  IconButton,
  Menu,
  MenuItem,
  MenuItemText,
  PageHeader,
  PageHeaderCenter,
  PageHeaderLeft,
  PageHeaderRight,
  PageHeaderTitle,
  Text,
} from '@ringcentral/spring-ui';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import type {
  LoadAppPageParams,
  ThirdPartyApp,
  ThirdPartyWidgetContact,
  UnknownRecord,
} from '../../services/ThirdParty';

import { getSideWidgetPageInfo } from './SideWidget.helper';
import { t } from './i18n';
import type { SideWidgetPageInfo } from './SideWidget.view.interface';

const EMPTY_PAGE_INFO: SideWidgetPageInfo = {
  page: null,
  actions: [],
};

function normalizeFormData(value: unknown): UnknownRecord {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return value as UnknownRecord;
}

function getActionTextClass(color?: string): string | undefined {
  const semanticColor = color?.split('.')[0];
  switch (semanticColor) {
    case 'danger':
      return 'text-danger-f';
    case 'warning':
      return 'text-warning-f';
    case 'success':
      return 'text-success-f';
    case 'primary':
      return 'text-primary-f';
    default:
      return undefined;
  }
}

export function SideWidgetAppPanel({
  app,
  contact,
  isPinned,
  showBack,
  showCloseButton,
  onBack,
  onClose,
  onTogglePin,
  onLoadApp,
}: {
  app: ThirdPartyApp;
  contact: ThirdPartyWidgetContact | null;
  isPinned: boolean;
  showBack: boolean;
  showCloseButton: boolean;
  onBack: () => void;
  onClose: () => void;
  onTogglePin: () => void;
  onLoadApp: (params: LoadAppPageParams) => Promise<unknown | null>;
}) {
  const [pageInfo, setPageInfo] = useState(EMPTY_PAGE_INFO);
  const [formData, setFormData] = useState<UnknownRecord>({});
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef<HTMLButtonElement>(null);
  const mountedRef = useRef(false);
  const requestIdRef = useRef(0);

  const applyResponse = useCallback((data: unknown): boolean => {
    const nextPageInfo = getSideWidgetPageInfo(data);
    if (!nextPageInfo.page) {
      return false;
    }
    setPageInfo(nextPageInfo);
    setFormData(nextPageInfo.page.formData ?? {});
    return true;
  }, []);

  const requestPage = useCallback(
    async (params: LoadAppPageParams): Promise<boolean> => {
      const requestId = ++requestIdRef.current;
      const data = await onLoadApp(params);
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return false;
      }
      return applyResponse(data);
    },
    [applyResponse, onLoadApp],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setPageInfo(EMPTY_PAGE_INFO);
    setFormData({});
    setLoading(true);
    setLoadFailed(false);
    void onLoadApp({
      app,
      contact: contact ?? undefined,
      type: 'init',
    }).then((data) => {
      if (!mountedRef.current || requestId !== requestIdRef.current) {
        return;
      }
      setLoadFailed(!applyResponse(data));
      setLoading(false);
    });
  }, [app, applyResponse, contact, onLoadApp]);

  const runPageAction = async (actionId: string): Promise<void> => {
    await requestPage({
      app,
      contact: contact ?? undefined,
      formData,
      type: 'buttonClick',
      button: { id: actionId },
    });
  };

  const appName = app.name || app.id;
  const page = pageInfo.page;
  const showSubmitButton = Boolean(
    app.submitPath && page?.uiSchema?.submitButtonOptions,
  );

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <PageHeader
        variant="detached"
        className="flex-none border-b border-neutral-b4"
        style={{ paddingRight: 'var(--sui-spacing-24)' }}
        data-sign="sideWidgetAppHeader"
      >
        <PageHeaderLeft>
          {showBack ? (
            <IconButton
              variant="icon"
              color="secondary"
              size="medium"
              symbol={ArrowLeftMd}
              data-sign="sideWidgetBack"
              TooltipProps={{ title: t('backToApps') }}
              onClick={onBack}
            />
          ) : null}
        </PageHeaderLeft>
        <PageHeaderCenter
          className="min-w-0"
          data-sign="sideWidgetAppHeaderCenter"
        >
          <PageHeaderTitle className="flex min-w-0 items-center justify-center gap-2">
            <Avatar
              alt={appName}
              src={app.iconUri}
              size="xsmall"
              variant="squircle"
            >
              {appName.slice(0, 1)}
            </Avatar>
            <Text
              component="span"
              className="typography-subtitleMiniSemiBold min-w-0 truncate text-neutral-b0"
              title={appName}
              titleWhenOverflow={500}
              noWrap
            >
              {appName}
            </Text>
          </PageHeaderTitle>
        </PageHeaderCenter>
        <PageHeaderRight>
          <div className="flex items-center gap-1">
            <IconButton
              variant="icon"
              color="secondary"
              size="small"
              symbol={RefreshMd}
              disabled={refreshing}
              data-sign="sideWidgetRefresh"
              TooltipProps={{ title: t('reloadApp') }}
              onClick={async () => {
                setRefreshing(true);
                await requestPage({
                  app,
                  contact: contact ?? undefined,
                  formData,
                  type: 'refresh',
                });
                if (mountedRef.current) {
                  setRefreshing(false);
                }
              }}
            />
            <IconButton
              variant="icon"
              color={isPinned ? 'primary' : 'secondary'}
              size="small"
              symbol={isPinned ? PushPinFilledMd : PushPinMd}
              data-sign="sideWidgetPin"
              TooltipProps={{
                title: isPinned
                  ? t('unpinApp')
                  : t('pinApp'),
              }}
              onClick={onTogglePin}
            />
            {pageInfo.actions.length > 0 ? (
              <>
                <IconButton
                  ref={menuAnchorRef}
                  variant="icon"
                  color="secondary"
                  size="small"
                  symbol={OverflowVerticalMd}
                  data-sign="sideWidgetMore"
                  TooltipProps={{ title: t('moreActions') }}
                  onClick={() => setMenuOpen(true)}
                />
                <Menu
                  open={menuOpen}
                  anchorEl={menuAnchorRef.current}
                  onClose={() => setMenuOpen(false)}
                >
                  {showCloseButton ? (
                    <MenuItem
                      onClick={() => {
                        setMenuOpen(false);
                        onClose();
                      }}
                    >
                      <MenuItemText primary={t('close')} />
                    </MenuItem>
                  ) : null}
                  {pageInfo.actions.map((action) => (
                    <MenuItem
                      key={action.id}
                      onClick={() => {
                        setMenuOpen(false);
                        void runPageAction(action.id);
                      }}
                    >
                      <MenuItemText
                        primary={action.label}
                        classes={{
                          primaryText: getActionTextClass(action.color),
                        }}
                      />
                    </MenuItem>
                  ))}
                </Menu>
              </>
            ) : showCloseButton ? (
              <IconButton
                variant="icon"
                color="secondary"
                size="small"
                symbol={Xmd}
                data-sign="sideWidgetCloseApp"
                TooltipProps={{ title: t('closeAppTab') }}
                onClick={onClose}
              />
            ) : null}
          </div>
        </PageHeaderRight>
      </PageHeader>
      <div
        className="flex-auto overflow-y-auto px-4 py-3"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.stopPropagation();
          }
        }}
      >
        {loading ? (
          <div
            className="flex h-full flex-col items-center justify-center gap-3"
            role="status"
          >
            <CircularProgressIndicator
              size="medium"
              progressBarProps={{ 'aria-label': t('loadingApp') }}
            />
            <Text
              component="span"
              className="typography-mainText text-neutral-b2"
            >
              {t('loading')}
            </Text>
          </div>
        ) : loadFailed || !page ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={AppsMd}
              title={t('loadAppFailed')}
              description={t('unsupportedAppPage')}
            />
          </div>
        ) : (
          <JSONSchemaPage
            schema={page.schema}
            uiSchema={page.uiSchema}
            formData={formData}
            hiddenSubmitButton={!showSubmitButton}
            onFormDataChange={(value: unknown) => {
              const nextFormData = normalizeFormData(value);
              const changedKeys = Object.keys(nextFormData).filter(
                (key) => nextFormData[key] !== formData[key],
              );
              setFormData(nextFormData);
              void requestPage({
                app,
                contact: contact ?? undefined,
                formData: nextFormData,
                changedKeys,
                type: 'inputChanged',
              });
            }}
            onButtonClick={(buttonId) => {
              void runPageAction(buttonId);
            }}
            onSubmit={() => {
              void requestPage({
                app,
                contact: contact ?? undefined,
                formData,
                type: 'submit',
              });
            }}
          />
        )}
      </div>
    </div>
  );
}
