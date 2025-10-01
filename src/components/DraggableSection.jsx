import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';
import ProductCard from './ProductCard';

const DraggableSection = ({ 
  section, 
  items, 
  sectionIndex, 
  displayMode, 
  gridClasses, 
  handleToggleBought, 
  renderListItems,
  isReorderMode 
}) => {
  return (
    <Draggable 
      draggableId={`section-${section}`} 
      index={sectionIndex}
      isDragDisabled={!isReorderMode}
    >
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`border-t border-gray-300 pt-4 ${snapshot.isDragging ? 'opacity-75 bg-blue-50 rounded-lg p-2' : ''}`}
        >
          <div
            {...provided.dragHandleProps}
            className={`text-lg font-semibold mb-3 text-red-500 ${
              isReorderMode ? 'bg-blue-100 p-2 rounded cursor-grab active:cursor-grabbing' : ''
            }`}
          >
            {section || 'Sense Secció'} ({items.length})
            {isReorderMode && <span className="text-xs ml-2 text-blue-600">(Arrossega per reordenar)</span>}
          </div>
          
          <Droppable droppableId={`section-items-${section}`} type="ITEM">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={displayMode === 'grid' ? `${gridClasses} gap-4` : 'space-y-2'}
              >
                {items.map((item, itemIndex) => (
                  <Draggable 
                    key={item.id} 
                    draggableId={item.id} 
                    index={itemIndex}
                    isDragDisabled={!isReorderMode}
                  >
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={snapshot.isDragging ? 'opacity-75 scale-105' : ''}
                      >
                        {displayMode === 'grid' ? (
                          <ProductCard
                            item={item}
                            onEdit={null}
                            onAction={() => handleToggleBought(item, item.isBought)}
                            actionLabel={`Doble clic per marcar ${item.name} com comprat`}
                            additionalClasses={`box-shadow-neomorphic-element-red ${
                              isReorderMode ? 'ring-2 ring-blue-300 cursor-grab active:cursor-grabbing' : ''
                            }`}
                            showEditButton={false}
                            requireDoubleClick={!isReorderMode}
                            isDraggable={isReorderMode}
                          />
                        ) : (
                          renderListItems([item], true, !isReorderMode)[0]
                        )}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      )}
    </Draggable>
  );
};

export default DraggableSection;
