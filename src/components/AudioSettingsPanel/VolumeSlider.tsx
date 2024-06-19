import React, { FC } from 'react';
import {
  RcIcon,
  RcSlider,
  styled,
  typography,
  palette2,
  RcFormLabel,
} from '@ringcentral/juno';
import { SpeakerDown, SpeakerUp } from '@ringcentral/juno-icon';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
`;

const SlideContainer = styled.div`
  display: flex;
  flex-direction: row;
`;
const VolumeIconContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
`;
const PaddedSlider = styled(RcSlider)`
  margin: 0 16px;
`;
function toPercentValue(value: number) {
  return Math.floor(value * 100);
}
function toValue(percent: number) {
  return percent / 100;
}

const InputLabel = styled(RcFormLabel)`
  ${typography('caption2')};
  margin-bottom: 5px;
  display: inline-block;
  color: ${palette2('neutral', 'f04')};
`;

export const VolumeSlider: FC<{
  className?: string;
  volume: number;
  minVolume?: number;
  maxVolume?: number;
  onChange: (volume: number) => void;
  label?: string;
}> = ({ className, volume, minVolume = 0, maxVolume = 1, onChange, label }) => {
  return (
    <Container>
      { label ? (<InputLabel>{label}</InputLabel>) : null }
      <SlideContainer className={className}>
        <VolumeIconContainer>
          <RcIcon
            symbol={SpeakerDown}
            color="neutral.b05"
            size="medium"
          />
        </VolumeIconContainer>
        <PaddedSlider
          min={toPercentValue(minVolume)}
          max={toPercentValue(maxVolume)}
          value={toPercentValue(volume)}
          step={10}
          // cast value to number as we are not using ranged slider
          onChange={(_, value) => onChange(toValue(value as number))}
        />
        <VolumeIconContainer>
          <RcIcon
            symbol={SpeakerUp}
            color="neutral.b05"
            size="medium"
          />
        </VolumeIconContainer>
      </SlideContainer>
    </Container>
  );
};
