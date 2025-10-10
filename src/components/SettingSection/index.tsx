import React, { useEffect, useState } from 'react';

import { styled, palette2 } from '@ringcentral/juno';

import { BackHeaderView } from '../BackHeaderView';
import { SettingParamInput } from './SettingParamInput';
import { SaveButton } from '../SaveButton';

const StyledPanel = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 20px 16px;
  overflow-y: auto;
`;

const StyledParamInput = styled(SettingParamInput)`
  margin-bottom: 15px;

  &.RcSwitch-formControlLabel {
    width: 100%;
    .MuiFormControlLabel-label {
      font-size: 0.875rem;
      flex: 1;
    }
  }

  .RcTextFieldInputLabel-root {
    color: ${palette2('neutral', 'f05')};
  }
`;

const StyledButton = styled(SaveButton)`
  margin-top: 20px;
`;

function allRequiredFilled(items) {
  let allFilled = true;
  items.forEach((item) => {
    if (
      item.required && (
        item.value === '' ||
        item.value === null ||
        item.value === undefined ||
        (item.multiple && item.value.length === 0)
      )
    ) {
      allFilled = false;
    }
  });
  return allFilled;
}

function shouldShow(item, newSection) {
  if (!item.showWhen) {
    return true;
  }
  return Object.keys(item.showWhen).every((key) => {
    const input = newSection.items.find((item) => item.id === key);
    const condition = item.showWhen[key];
    if (condition.operator === 'equal') {
      return input?.value === condition.value;
    }
    if (condition.operator === 'notEqual') {
      return input?.value !== condition.value;
    }
    if (condition.operator === 'contains') {
      return input?.value.includes(condition.value);
    }
    if (condition.operator === 'notContains') {
      return !input?.value.includes(condition.value);
    }
    if (condition.operator === 'startsWith') {
      return input?.value.startsWith(condition.value);
    }
    if (condition.operator === 'endsWith') {
      return input?.value.endsWith(condition.value);
    }
    if (condition.operator === 'greaterThan') {
      return input?.value > condition.value;
    }
    if (condition.operator === 'lessThan') {
      return input?.value < condition.value;
    }
    if (condition.operator === 'greaterThanOrEqual') {
      return input?.value >= condition.value;
    }
    if (condition.operator === 'lessThanOrEqual') {
      return input?.value <= condition.value;
    }
    return false;
  });
}
export function SettingSection({
  onSave,
  section,
  onBackButtonClick,
}) {
  const [newSection, setNewSection] = useState(section ? JSON.parse(JSON.stringify(section)) : null);
  const [valueChanged, setValueChanged] = useState(false);

  useEffect(() => {
    if (!section || !section.items) {
      return;
    }
    let changed = false;
    section.items.forEach((item, index) => {
      if (newSection.items[index] && item.value !== newSection.items[index].value) {
        changed = true;
      }
    });
    setValueChanged(changed);
  }, [section, newSection]);

  useEffect(() => {
    setNewSection(section ? JSON.parse(JSON.stringify(section)) : null);
  }, [section]);

  if (!newSection || !newSection.items) {
    return null;
  }

  return (
    <BackHeaderView
      onBack={onBackButtonClick}
      title={section.name}
    >
      <StyledPanel>
        {
          newSection.items.map((setting) => {
            if (!shouldShow(setting, newSection)) {
              return null;
            }
            return (
              <StyledParamInput
                setting={setting}
                key={setting.id}
                onChange={(value) => {
                  const newItems = newSection.items.map((item) => {
                    if (item.id === setting.id) {
                      return {
                        ...item,
                        value,
                      };
                    }
                    return item;
                  });
                  setNewSection({
                    ...newSection,
                    items: newItems,
                  });
                }}
              />
            );
          })
        }
        <StyledButton
          onClick={() => {
            onSave(newSection);
          }}
          disabled={!valueChanged || !allRequiredFilled(newSection.items)}
        />
      </StyledPanel>
    </BackHeaderView>
  );
}
