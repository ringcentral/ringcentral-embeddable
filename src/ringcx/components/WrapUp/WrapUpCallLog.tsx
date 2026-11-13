import {
  Announcement,
  CircularProgressIndicator,
  Icon,
} from '@ringcentral/spring-ui';
import { InfoMd } from '@ringcentral/spring-icon';
import clsx from 'clsx';
import type { FunctionComponent } from 'react';
import React from 'react';

import { CallLogForm } from '../../../app/views/LogCallView/CallLogForm';
import type { WrapUpCallLogProps } from './WrapUp.interface';

const SKELETON_LINES = 3;

/**
 * The host's call log form on a wrap-up page: a skeleton while the host
 * builds it, the reason when it has none, and the form.
 */
export const WrapUpCallLog: FunctionComponent<WrapUpCallLogProps> = ({
  status,
  loadingText,
  noFormText,
  page,
  formData,
  onChange,
  onButtonClick,
  onSubmit,
  errorText,
  locked = false,
}) => {
  if (status === 'none') {
    return (
      <div
        className="flex gap-2 rounded-lg bg-neutral-b4 p-3 typography-descriptor text-neutral-b1"
        data-sign="wrapUpNoLogForm"
      >
        <Icon symbol={InfoMd} size="small" />
        <span className="min-w-0 break-words">{noFormText}</span>
      </div>
    );
  }
  if (status === 'loading' || !page) {
    return (
      <div
        className="flex flex-col gap-3"
        aria-busy="true"
        data-sign="wrapUpLogFormLoading"
      >
        <span className="flex items-center gap-2 typography-descriptor text-neutral-b1">
          <CircularProgressIndicator size="xsmall" />
          <span className="truncate">{loadingText}</span>
        </span>
        {Array.from({ length: SKELETON_LINES }, (_, index) => (
          <div key={index} className="h-10 rounded-lg bg-neutral-b4" />
        ))}
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3" data-sign="wrapUpCallLog">
      {errorText ? (
        <Announcement severity="error" data-sign="wrapUpCallLogError">
          {errorText}
        </Announcement>
      ) : null}
      <div
        className={clsx(locked && 'pointer-events-none opacity-60')}
        aria-busy={locked || undefined}
      >
        <CallLogForm
          page={page}
          formData={formData}
          onChange={onChange}
          onButtonClick={onButtonClick}
          onSubmit={onSubmit}
        />
      </div>
    </div>
  );
};
