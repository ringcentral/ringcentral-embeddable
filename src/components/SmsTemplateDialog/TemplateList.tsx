import React from 'react';
import {
  RcList,
  RcDragDropContext,
  RcDraggable,
  RcDroppable,
  RcDragHandle,
  styled,
} from '@ringcentral/juno';

import { TemplateItem } from './TemplateItem';

const StyledDragHandle = styled(RcDragHandle)`
  padding-right: 10px;
  padding-top: 5px;
  padding-bottom: 5px;
`;

export function TemplateList({
  templates,
  onApply,
  onEditItem,
  onDeleteItem,
  showTemplateManagement,
  sortTemplates,
}) {
  return (
    <RcDragDropContext onDragEnd={({destination, source}) => {
      if (!destination) {
        return;
      }
      if (
        destination.index === source.index
      ) {
        return;
      }
      const newTemplates = Array.from(templates);
      const [removed] = newTemplates.splice(source.index, 1);
      newTemplates.splice(destination.index, 0, removed);
      sortTemplates(newTemplates.map((template) => template.id));
    }}>
      <RcDroppable
        droppableId="sms-template"
        direction="vertical"
        type="items"
      >
        {(provided) => (
          <RcList
            innerRef={provided.innerRef}
            {...provided.droppableProps}
            style={{
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {
              templates.map((template, index) => (
                <RcDraggable
                  key={template.id}
                  index={index}
                  draggableId={template.id}
                >
                  {(provided) => {
                    return (
                      <TemplateItem
                        innerRef={provided.innerRef}
                        key={template.id}
                        template={template}
                        onApply={onApply}
                        onEdit={() => onEditItem(template)}
                        showTemplateManagement={showTemplateManagement}
                        onDelete={() => onDeleteItem(template)}
                        icon={<StyledDragHandle {...provided.dragHandleProps} />}
                        {...provided.draggableProps}
                      />
                    )
                  }}
                </RcDraggable>
              ))
            }
            {provided.placeholder}
          </RcList>
        )}
      </RcDroppable>
    </RcDragDropContext>
  );
}
