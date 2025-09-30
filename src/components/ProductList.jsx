import React from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import ProductCard from "./ProductCard";

const ProductList = ({ items, onReorder }) => {
  // Quan acaba el drag & drop
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const { source, destination, draggableId } = result;

    // Només reordenem dins la mateixa secció
    if (source.droppableId === destination.droppableId) {
      onReorder(draggableId, destination.index);
    }
  };

  // Agrupem productes per secció
  const groupedItems = items.reduce((acc, item) => {
    const section = item.section || "Sense secció";
    if (!acc[section]) acc[section] = [];
    acc[section].push(item);
    return acc;
  }, {});

  const sectionNames = Object.keys(groupedItems);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      {sectionNames.map((section) => {
        const sectionItems = groupedItems[section].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        );

        return (
          <div key={section} className="mb-6">
            <h2 className="font-bold text-lg mb-2">{section}</h2>
            <Droppable droppableId={section}>
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                >
                  {sectionItems.map((item, index) => (
                    <Draggable
                      key={item.id}
                      draggableId={item.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                        >
                          <ProductCard
                            item={item}
                            onAction={() => {}}
                            requireDoubleClick={true}
                          />
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        );
      })}
    </DragDropContext>
  );
};

export default ProductList;
