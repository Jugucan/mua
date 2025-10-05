import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { GripVertical, X, Save } from 'lucide-react';

const SectionOrderModal = ({
    items,
    sectionOrder,
    activeListId,
    onSave,
    onClose
}) => {
    const [localSections, setLocalSections] = useState([]);

    useEffect(() => {
        const sectionsInUse = new Set();
        items.forEach(item => {
            if (item.section !== undefined) {
                sectionsInUse.add(item.section);
            }
        });

        const sectionsArray = Array.from(sectionsInUse);

        const sortedSections = sectionsArray.sort((a, b) => {
            const orderA = sectionOrder[a];
            const orderB = sectionOrder[b];

            if (orderA !== undefined && orderB !== undefined) {
                return orderA - orderB;
            }
            if (orderA !== undefined) return -1;
            if (orderB !== undefined) return 1;

            return a.localeCompare(b);
        });

        setLocalSections(sortedSections);
    }, [items, sectionOrder]);

    const handleDragEnd = (result) => {
        if (!result.destination) return;

        const reorderedSections = Array.from(localSections);
        const [movedSection] = reorderedSections.splice(result.source.index, 1);
        reorderedSections.splice(result.destination.index, 0, movedSection);

        setLocalSections(reorderedSections);
    };

    const handleSave = async () => {
        try {
            await onSave(localSections);
            onClose();
        } catch (error) {
            console.error('Error guardant ordre de seccions:', error);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#f0f3f5] rounded-lg box-shadow-neomorphic-container w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                <div className="flex justify-between items-center p-6 border-b border-gray-300">
                    <h2 className="text-2xl font-bold text-gray-800">Ordenar Seccions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full box-shadow-neomorphic-button hover:scale-110 transition-all-smooth"
                        aria-label="Tancar"
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {localSections.length === 0 ? (
                        <p className="text-gray-600 text-center py-8">
                            No hi ha seccions disponibles. Afegeix productes amb seccions per poder ordenar-les.
                        </p>
                    ) : (
                        <>
                            <p className="text-sm text-gray-600 mb-4">
                                Arrossega les seccions per canviar el seu ordre a la llista de la compra.
                            </p>

                            <DragDropContext onDragEnd={handleDragEnd}>
                                <Droppable droppableId="sections-list">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="space-y-3"
                                        >
                                            {localSections.map((section, index) => (
                                                <Draggable
                                                    key={section}
                                                    draggableId={section || '__EMPTY__'}
                                                    index={index}
                                                >
                                                    {(provided, snapshot) => (
                                                        <div
                                                            ref={provided.innerRef}
                                                            {...provided.draggableProps}
                                                            {...provided.dragHandleProps}
                                                            className={`
                                                                flex items-center gap-3 p-4 rounded-lg
                                                                transition-all-smooth cursor-grab active:cursor-grabbing
                                                                ${snapshot.isDragging
                                                                    ? 'bg-blue-50 box-shadow-neomorphic-element scale-105'
                                                                    : 'bg-[#f0f3f5] box-shadow-neomorphic-element'
                                                                }
                                                            `}
                                                        >
                                                            <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                            <div className="flex-1">
                                                                <span className="font-semibold text-gray-800">
                                                                    {section || 'Sense Secció'}
                                                                </span>
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {items.filter(item => (item.section || '') === section).length} productes
                                                                </div>
                                                            </div>
                                                            <div className="text-sm font-medium text-gray-500">
                                                                #{index + 1}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Draggable>
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-gray-300 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 rounded-md font-semibold text-gray-700
                            box-shadow-neomorphic-button hover:scale-105 transition-all-smooth"
                    >
                        Cancel·lar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={localSections.length === 0}
                        className="flex-1 px-4 py-3 rounded-md font-semibold text-white bg-green-500
                            hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                            transition-all-smooth hover:scale-105 flex items-center justify-center gap-2
                            shadow-lg"
                    >
                        <Save className="w-5 h-5" />
                        Guardar Ordre
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SectionOrderModal;
