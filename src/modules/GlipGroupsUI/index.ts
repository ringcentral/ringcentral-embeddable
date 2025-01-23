import { Module } from '@ringcentral-integration/commons/lib/di';
import { RcUIModuleV2 } from '@ringcentral-integration/core';

@Module({
  name: 'GlipGroupsUI',
  deps: [
    'ContactListUI',
    'GlipGroups',
    'DateTimeFormat',
    'SideDrawerUI',
  ],
})
export class GlipGroupsUI extends RcUIModuleV2 {
  constructor(deps) {
    super({ deps });
  }

  getUIProps({
    hiddenCurrentGroup = false,
  }) {
    const { glipGroups, contactListUI } = this._deps;
    return {
      groups: glipGroups.groupsWithUnread,
      currentGroupId: hiddenCurrentGroup ? null : glipGroups.currentGroupId,
      searchFilter: glipGroups.searchFilter,
      currentPage: glipGroups.pageNumber,
      filteredContacts: contactListUI.filteredContacts,
      contactSearchFilter: contactListUI.searchFilter,
    };
  }

  getUIFunctions() {
    const { glipGroups, contactListUI, dateTimeFormat, sideDrawerUI } = this._deps;
    return {
      onSelectGroup(groupId) {
        sideDrawerUI.gotoGlipChat(groupId);
      },
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
        sideDrawerUI.gotoGlipChat(groupId);
      },
      dateTimeFormatter: (time) =>
        dateTimeFormat.formatDateTime({ utcTimestamp: time }),
    };
  }
}