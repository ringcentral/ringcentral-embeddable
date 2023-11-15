import React, {
  useEffect,
  useState,
} from 'react';

import BackHeader from '@ringcentral-integration/widgets/components/BackHeader';
import Panel from '@ringcentral-integration/widgets/components/Panel';
import { RcButton } from '@ringcentral/juno';
import { styled } from '@ringcentral/juno/foundation';

import { SettingParamInput } from './SettingParamInput';

const Container = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
`;

const StyledPanel = styled(Panel)`
  padding: 20px;
`;

const StyledParamInput = styled(SettingParamInput)`
  margin-bottom: 15px;
`;

const StyledButton = styled(RcButton)`
  margin-top: 20px;
`;

function allRequiredFilled(items) {
  let allFilled = true;
  items.forEach((item) => {
    if (
      item.required && (
        item.value === '' ||
        item.value === null ||
        item.value === undefined
      )
    ) {
      allFilled = false;
    }
  });
  return allFilled;
}

export function ThirdPartySettingSection({
  onSave,
  section,
  onBackButtonClick,
}) {
  const [newSection, setNewSection] = useState(section);
  const [valueChanged, setValueChanged] = useState(false);

  useEffect(() => {
    if (!section || !section.items) {
      return;
    }
    let changed = false;
    section.items.forEach((item, index) => {
      if (item.value !== newSection.items[index].value) {
        changed = true;
      }
    });
    setValueChanged(changed);
  }, [section, newSection]);

  if (!newSection || !newSection.items) {
    return null;
  }

  return (
    <Container>
      <BackHeader onBackClick={onBackButtonClick}>
        {section.name}
      </BackHeader>
      <StyledPanel>
        {
          newSection.items.map((setting) => {
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
          fullWidth
          variant="contained"
          radius="round"
          onClick={() => {
            onSave(newSection);
          }}
          color="action.primary"
          disabled={!valueChanged || !allRequiredFilled(newSection.items)}
        >
          Save
        </StyledButton>
      </StyledPanel>
    </Container>
  );
}
