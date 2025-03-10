import { styled, palette2 } from '@ringcentral/juno';

export const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  flex: 1;
  height: 100%;
  width: 100%;
  background: ${palette2('neutral', 'b01')};
  color: ${palette2('neutral', 'f06')};
`;

export const PageHeader = styled.div`
  padding: 0 16px;
  padding-right: 8px;
  display: flex;
  flex-direction: row;
  align-items: center;
  border-bottom: 1px solid ${palette2('neutral', 'l02')};
  width: 100%;
  height: 56px;
  box-sizing: border-box;
  align-items: center;
`;

export const Content = styled.div`
  flex: 1;
  width: 100%;
  padding: 16px;
  box-sizing: border-box;
  overflow-y: auto;
`;

export const AppIcon = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
`;
