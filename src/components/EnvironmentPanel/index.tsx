import type { ChangeEventHandler, FC } from 'react';
import React, { useEffect, useState } from 'react';

import classnames from 'classnames';

import { useChange, useRefState } from '@ringcentral/juno';

import BackHeader from '@ringcentral-integration/widgets/components/BackHeader';
import { Button } from '@ringcentral-integration/widgets/components/Button';
import IconLine from '@ringcentral-integration/widgets/components/IconLine';
import Line from '@ringcentral-integration/widgets/components/Line';
import Panel from '@ringcentral-integration/widgets/components/Panel';
import Switch from '@ringcentral-integration/widgets/components/Switch';
import TextInput from '@ringcentral-integration/widgets/components/TextInput';
import styles from '@ringcentral-integration/widgets/components/EnvironmentPanel/styles.scss';

type EnvironmentData = {
  server: string;
  recordingHost: string;
  enabled: boolean;
  clientId?: string;
  clientSecret?: string;
};

export type EnvironmentPanelProps = {
  onSetData: (data: EnvironmentData) => any;
  defaultHidden?: boolean;
  clientId?: string;
  clientSecret?: string;
  redirectUri?: string;
} & EnvironmentData;

export const EnvironmentPanel: FC<EnvironmentPanelProps> = (props) => {
  const {
    recordingHost,
    defaultHidden = true,
    onSetData,
    enabled,
    server,
    clientId,
    clientSecret,
    redirectUri,
  } = props;

  const [serverValueRef, setServerValue] = useRefState(server);
  const [recordingHostValueRef, setRecordingHostValue] =
    useRefState(recordingHost);
  const [enabledValueRef, setEnabledValue] = useRefState(enabled);
  const [hidden, setHidden] = useState(defaultHidden);
  const [clientIdValueRef, setClientIdValue] = useRefState(clientId);
  const [clientSecretValueRef, setClientSecretValue] = useRefState(clientSecret);

  useChange(
    () => {
      // when open panel, reset value again
      if (!hidden) {
        setServerValue(server, false);
        setRecordingHostValue(recordingHost, false);
        setEnabledValue(enabled, false);
        setClientIdValue(clientId, false);
        setClientSecretValue(clientSecret, false);
      }
    },
    () => hidden,
  );

  const onServerChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setServerValue(e.currentTarget.value);
  };

  const onClientIdChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setClientIdValue(e.currentTarget.value);
  };

  const onClientSecretChange: ChangeEventHandler<HTMLInputElement> = (e) => {
    setClientSecretValue(e.currentTarget.value);
  };

  const onToggleEnabled = () => {
    setEnabledValue(!enabledValueRef.current);
  };

  const toggleEnv = () => {
    setHidden(!hidden);
  };

  const onOk = () => {
    onSetData({
      server: serverValueRef.current,
      recordingHost: recordingHostValueRef.current,
      enabled: enabledValueRef.current,
      clientId: clientIdValueRef.current,
      clientSecret: clientSecretValueRef.current,
    });

    toggleEnv();
  };

  const onCancel = () => {
    setServerValue(server);
    setRecordingHostValue(recordingHost);
    setEnabledValue(enabled);
    toggleEnv();
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).toggleEnv = toggleEnv;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const serverValue = serverValueRef.current;
  const clientIdValue = clientIdValueRef.current;
  const clientSecretValue = clientSecretValueRef.current;
  const enabledValue = enabledValueRef.current;
  const recordingHostValue = recordingHostValueRef.current;

  if (hidden) {
    return null;
  }

  const hasChanges = !(
    serverValue === server &&
    clientIdValue === clientId &&
    clientSecretValue === clientSecret &&
    enabledValue === enabled &&
    recordingHostValue === recordingHost
  );

  return (
    <div className={styles.root}>
      <BackHeader onBackClick={onCancel} buttons={[]}>
        Environment
      </BackHeader>
      <Panel>
        <Line>
          Server
          <TextInput
            dataSign="envServerUrl"
            value={serverValue}
            onChange={onServerChange}
          />
        </Line>
        <Line>
          Client ID
          <TextInput
            value={clientIdValue}
            onChange={onClientIdChange}
            placeholder="Optional"
          />
        </Line>
        <Line>
          Client Secret
          <TextInput
            value={clientSecretValue}
            onChange={onClientSecretChange}
            placeholder="Optional"
          />
        </Line>
        <IconLine
          icon={
            <Switch
              dataSign="envToggle"
              checked={enabledValue}
              onChange={onToggleEnabled}
            />
          }
        >
          Enable
        </IconLine>
        <Line>
          Redirect Url
          <TextInput
            value={redirectUri}
            disabled
          />
        </Line>
        <Line>
          <Button
            dataSign="envSave"
            className={classnames(
              styles.saveButton,
              !hasChanges ? styles.disabled : null,
            )}
            onClick={onOk}
            disabled={!hasChanges}
          >
            Save
          </Button>
        </Line>
      </Panel>
    </div>
  );
};
