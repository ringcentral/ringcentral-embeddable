import { connect } from 'react-redux';
import withPhone from '@ringcentral-integration/widgets/lib/withPhone';

import { GlipGroupsPanel } from '../../components/GlipGroupsPanel';

function mapToProps(
  _,
  { phone: { glipGroups, contactListUI }, hiddenCurrentGroup = false },
) {
  return {
    groups: glipGroups.groupsWithUnread,
    currentGroupId: hiddenCurrentGroup ? null : glipGroups.currentGroupId,
    searchFilter: glipGroups.searchFilter,
    currentPage: glipGroups.pageNumber,
    filteredContacts: contactListUI.filteredContacts,
    contactSearchFilter: contactListUI.searchFilter,
  };
}

function mapToFunctions(
  _,
  { phone: { glipGroups, contactListUI, dateTimeFormat }, onSelectGroup },
) {
  return {
    onSelectGroup,
    updateSearchFilter(searchFilter) {
      glipGroups.updateFilter({ searchFilter });
    },
    onNextPage(pageNumber) {
      glipGroups.updateFilter({ pageNumber });
    },
    updateContactSearchFilter(searchFilter) {
      contactListUI.applyFilters({ searchFilter });
    },
    async createTeam({ teamName, selectedContacts }) {
      const groupId = await glipGroups.createTeam(
        teamName,
        selectedContacts.map((sc) => sc.email),
      );
      onSelectGroup(groupId);
    },
    dateTimeFormatter: (time) =>
      dateTimeFormat.formatDateTime({ utcTimestamp: time }),
  };
}

const GlipGroupsPage = withPhone(
  connect(mapToProps, mapToFunctions)(GlipGroupsPanel),
);

export default GlipGroupsPage;
