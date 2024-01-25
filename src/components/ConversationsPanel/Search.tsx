import React from 'react';

import { styled, palette2 } from '@ringcentral/juno/foundation';
import { RcIcon, RcTextField } from '@ringcentral/juno';
import { Search as SearchIcon } from '@ringcentral/juno-icon';
import i18n from '@ringcentral-integration/widgets/components/ConversationsPanel/i18n';

type SearchProps = {
  onSearchInputChange?: (...args: any[]) => any;
  searchInput?: string;
  currentLocale: string;
  disableLinks?: boolean;
};

const Container = styled.div`
  padding: 0 16px;
`;

const StyledTextField = styled(RcTextField)`
  .RcTextFieldInput-input {
    font-size: 0.75rem;
    line-height: 16px;
  }

  .RcTextFieldInput-root {
    padding: 5px 0;
  }

  .MuiInput-underline:hover:not(.Mui-disabled):before {
    border-bottom-width: 1px;
    border-bottom-color: ${palette2('neutral', 'l03')};
  }

  .MuiInput-underline:after {
    border-bottom-width: 1px;
  }

  .RcTextFieldInput-underline:before {
    border-bottom-color: ${palette2('neutral', 'l02')};
  }
`;

const StyledSearchIcon = styled(RcIcon)`
  margin-right: 6px;
`;
export const Search: React.FC<SearchProps> = ({
  onSearchInputChange,
  searchInput,
  currentLocale,
  disableLinks,
}) => {
  if (!onSearchInputChange) {
    return null;
  }
  return (
    <Container>
      <StyledTextField
        fullWidth
        value={searchInput}
        onChange={(e) => {
          if (!e.currentTarget) {
            e.currentTarget = e.target;
          }
          onSearchInputChange(e);
        }}
        InputProps={{
          startAdornment: <StyledSearchIcon symbol={SearchIcon} size="small" />,
        }}
        disabled={disableLinks}
        placeholder={i18n.getString('search', currentLocale)}
        clearBtn
      />
    </Container>
  );
};
Search.defaultProps = {
  onSearchInputChange: undefined,
  searchInput: '',
  disableLinks: false,
};
