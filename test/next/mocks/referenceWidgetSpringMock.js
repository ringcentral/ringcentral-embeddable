const React = require('react');

/**
 * Stands in for the framework's grouped match list. The real barrel reaches
 * `next-widgets/components/Box`, which jest cannot resolve.
 *
 * Only the contract `MatchedContactsTag` relies on is reproduced: a group
 * label, one row per match, and a click that toggles selection.
 */
function ReferenceMenuList({ label, list, selectedMap, onItemClick }) {
  return React.createElement(
    'ul',
    { 'data-sign': 'referenceMenuList', 'data-label': label },
    list.map((item) =>
      React.createElement(
        'li',
        { key: item.id },
        React.createElement(
          'button',
          {
            type: 'button',
            'data-sign': `match-${item.id}`,
            'data-selected': Boolean(selectedMap[item.id]),
            onClick: () => onItemClick(item, !selectedMap[item.id]),
          },
          item.name,
        ),
      ),
    ),
  );
}

module.exports = {
  ReferenceMenuList,
  ReferenceList: ReferenceMenuList,
  ReferenceWidget: () => null,
};
