import React, { useState } from 'react';
import { styled, palette2, RcIconButton, RcLoading, Virtuoso } from '@ringcentral/juno';
import { NewAction } from '@ringcentral/juno-icon';
import GlipTeamCreationModal from './CreationModal';
import { GlipGroupItem } from './GlipGroupItem';
import { SearchLine } from '../SearchLine';

const Root = styled.div`
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: ${palette2('neutral', 'b01')};
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  position: relative;
`;

const AddButton = styled(RcIconButton)`
  position: absolute;
  top: 50%;
  right: 6px;
  transform: translateY(-50%);
`;

const Content = styled.div`
  flex: 1;
  overflow-y: hidden;
`;

const GlipGroupList = ({
  className,
  groups,
  currentGroupId,
  onSelectGroup,
}: {
  className?: string;
  groups: any;
  currentGroupId: string;
  onSelectGroup: (...args: any[]) => any;
}) => {
  return (
    <Virtuoso
      className={className}
      style={{
        height: '100%',
        width: '100%',
      }}
      totalCount={groups.length}
      data={groups}
      itemContent={(index, group) => {
        return (
          <GlipGroupItem
            group={group}
            active={group.id === currentGroupId}
            onSelectGroup={() => {
              onSelectGroup(group.id);
            }}
          />
        );
      }}
    />
  );
};

export const GlipGroupsPanel = ({
  groups = [],
  className = undefined,
  currentGroupId,
  showSpinner,
  currentPage = 1,
  onNextPage = () => null,
  onSelectGroup,
  filteredContacts = [],
  updateContactSearchFilter,
  contactSearchFilter = '',
  searchFilter = '',
  updateSearchFilter,
  createTeam,
}: {
  groups: any;
  className?: string;
  currentGroupId: string;
  showSpinner: boolean;
  currentPage: number;
  onNextPage: (...args: any[]) => any;
  onSelectGroup: (...args: any[]) => any;
  filteredContacts: any;
  updateContactSearchFilter: (...args: any[]) => any;
  contactSearchFilter: string;
  searchFilter: string;
  updateSearchFilter: (...args: any[]) => any;
  createTeam: (...args: any[]) => any;
}) => {
  const [showTeamCreationModal, setShowTeamCreationModal] = useState(false);

  return (
    <Root className={className}>
      <RcLoading loading={showSpinner}>
        <Header>
          <SearchLine
            searchInput={searchFilter}
            onSearchInputChange={(e) => {
              updateSearchFilter(e.target.value);
            }}
            placeholder="Searching"
            clearBtn={false}
          />
          <AddButton
            symbol={NewAction}
            onClick={() => setShowTeamCreationModal(true)}
            size="small"
            title="Create Team"
          />
        </Header>
        <Content>
          <GlipGroupList
            groups={groups}
            onSelectGroup={onSelectGroup}
            currentGroupId={currentGroupId}
          />
        </Content>
        <GlipTeamCreationModal
          filteredContacts={filteredContacts}
          updateFilter={updateContactSearchFilter}
          searchFilter={contactSearchFilter}
          closeModal={() => {
            setShowTeamCreationModal(false);
          }}
          createTeam={createTeam}
          show={showTeamCreationModal}
        />
      </RcLoading>
    </Root>
  );
}

