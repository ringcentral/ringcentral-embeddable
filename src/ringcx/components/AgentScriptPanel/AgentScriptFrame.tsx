import { useLocale } from '@ringcentral-integration/micro-core/src/app/hooks';
import React, { useEffect, useMemo, useRef, useState } from 'react';

import {
  AGENT_SCRIPT_CONNECT_MESSAGE_TYPE,
  AGENT_SCRIPT_PROTOCOL_VERSION,
  type AgentScriptConnectMessage,
  type AgentScriptHostMessage,
  type AgentScriptRendererMessage,
} from '../../services/CxAgentScript';
import type { AgentScriptPanelProps } from './AgentScriptPanel.interface';
import i18n from './i18n';

const resultDebounceTime = 250;

type AgentScriptFrameProps = Omit<AgentScriptPanelProps, 'loading' | 'error'>;

/**
 * Hosts the separately released Agent Script renderer page.
 *
 * The page may live on another origin, so the host hands it a `MessageChannel`
 * port through a `postMessage` that targets exactly that origin; everything
 * after the handshake flows over the port. Only the script, a whitelisted
 * interpolation model, and the hold/recording flags are sent: the live call
 * object and any token stay on this side.
 */
export function AgentScriptFrame({
  callId,
  call,
  pageUrl,
  script,
  flags,
  onResultChange,
  onDisposition,
  getKnowledgeBaseArticles,
  getScriptModel,
}: AgentScriptFrameProps) {
  const { t } = useLocale(i18n);
  const frameRef = useRef<HTMLIFrameElement>(null);
  const portRef = useRef<MessagePort | null>(null);
  const resultTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingResultRef = useRef<
    Extract<AgentScriptRendererMessage, { type: 'scriptResult' }> | undefined
  >(undefined);
  const [rendererReady, setRendererReady] = useState(false);
  const targetOrigin = useMemo(
    () => new URL(pageUrl, window.location.href).origin,
    [pageUrl],
  );

  const send = (message: AgentScriptHostMessage) => {
    portRef.current?.postMessage(message);
  };

  useEffect(() => {
    if (!rendererReady || !script) return;
    send({
      type: 'initialize',
      payload: {
        callId,
        config: script,
        model: getScriptModel(call),
        flags,
      },
    });
    // `call` changes on every call data update; the renderer only needs a new
    // `initialize` for another call, another script or new flags.
  }, [rendererReady, callId, script, flags.isOnHold, flags.isRecording]);

  useEffect(
    () => () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      const pendingResult = pendingResultRef.current;
      if (pendingResult?.callId === callId) {
        void onResultChange(callId, pendingResult.value);
      }
      portRef.current?.close();
      portRef.current = null;
    },
    [callId, onResultChange],
  );

  const handleRendererMessage = async (
    event: MessageEvent<AgentScriptRendererMessage>,
  ) => {
    const message = event.data;
    if (message?.type === 'ready') {
      setRendererReady(true);
      return;
    }
    if (!message || ('callId' in message && message.callId !== callId)) return;

    switch (message.type) {
      case 'scriptResult':
        pendingResultRef.current = message;
        if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
        resultTimerRef.current = setTimeout(() => {
          pendingResultRef.current = undefined;
          void onResultChange(callId, message.value);
        }, resultDebounceTime);
        break;
      case 'updateDisposition':
        await onDisposition(callId, message.value);
        break;
      case 'getKnowledgeBaseArticles':
        try {
          const value = await getKnowledgeBaseArticles(
            callId,
            message.groupIds,
          );
          send({
            type: 'knowledgeBaseResult',
            requestId: message.requestId,
            value,
          });
        } catch (error) {
          send({
            type: 'knowledgeBaseResult',
            requestId: message.requestId,
            value: null,
            error:
              error instanceof Error
                ? error.message
                : t('unableToLoadKnowledgeBaseArticles'),
          });
        }
        break;
      default:
        break;
    }
  };

  const handleLoad = () => {
    portRef.current?.close();
    setRendererReady(false);
    const channel = new MessageChannel();
    portRef.current = channel.port1;
    channel.port1.onmessage = handleRendererMessage;
    channel.port1.start();
    const connectMessage: AgentScriptConnectMessage = {
      type: AGENT_SCRIPT_CONNECT_MESSAGE_TYPE,
      protocolVersion: AGENT_SCRIPT_PROTOCOL_VERSION,
    };
    frameRef.current?.contentWindow?.postMessage(connectMessage, targetOrigin, [
      channel.port2,
    ]);
  };

  return (
    <iframe
      ref={frameRef}
      src={pageUrl}
      title={t('agentScript')}
      data-sign="agentScriptFrame"
      className="block h-full min-h-0 w-full min-w-0 flex-1 border-0 bg-neutral-base"
      referrerPolicy="no-referrer"
      onLoad={handleLoad}
    />
  );
}
