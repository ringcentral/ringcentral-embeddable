import React from 'react';

import classnames from 'classnames';
import { RcPresence } from '@ringcentral/juno';
import { phoneSources } from '@ringcentral-integration/widgets/enums/phoneSources';
import phoneSourceNames from '@ringcentral-integration/widgets/lib/phoneSourceNames';
import { splitter } from '@ringcentral-integration/widgets/components/ContactDropdownList/splitter';
import styles from '@ringcentral-integration/widgets/components/ContactDropdownList/styles.scss';

type ContactInfoProps = {
  name: string;
  entityType: string;
  titleEnabled?: boolean;
  phoneSourceNameRenderer?: (...args: any[]) => any;
  doNotCall?: boolean;
};

export const SearchContactInfo: React.FC<ContactInfoProps> = ({
  name,
  entityType,
  titleEnabled,
  phoneSourceNameRenderer,
  doNotCall,
}) => {
  // align the type in contact search result so far temporarily,
  // need pass brand info here if need to use phoneSources.rcContact.
  // see also ringcentral-js-widgets/ringcentral-widgets/components/RecipientsInputV2/RecipientInfo.tsx
  const type =
    entityType === phoneSources.rcContact ? phoneSources.contact : entityType;
  const phoneSourceName = phoneSourceNameRenderer
    ? phoneSourceNameRenderer(type)
    : phoneSourceNames.getString(type);
  const nameTitle = `${name} ${splitter} ${phoneSourceName}`;
  return (
    <div
      className={classnames(styles.nameSection, {
        [styles.dncNameSection]: doNotCall,
      })}
      // @ts-expect-error TS(2322): Type 'string | false | undefined' is not assignabl... Remove this comment to see the full error message
      title={titleEnabled && nameTitle}
      data-sign="contactNameSection"
    >
      <span className={styles.name}>{name}</span>
      <span className={styles.splitter}>{splitter}</span>
      <span className={styles.label}>{phoneSourceName}</span>
      {
        entityType === phoneSources.rcContact ? (
          <RcPresence
            type
          />
        ) : null
      }
    </div>
  );
};

SearchContactInfo.defaultProps = {
  titleEnabled: undefined,
  phoneSourceNameRenderer: undefined,
  doNotCall: false,
};
