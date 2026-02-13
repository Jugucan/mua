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
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        // Obtenim totes les seccions que tenen productes
        const sectionsInUse = new Set();
        items.forEach(item => {
            // ✅ Convertim null/undefined a string buit
            const section = item.section === null || item.section === undefined ? '' : item.section;
            sectionsInUse.add(section);
        });

        const sectionsArray = Array.from(sectionsInUse);

        // Ordenem segons l'ordre actual guardat
        const sortedSections = sectionsArray.sort((a, b) => {
            // ✅ Assegurem que a i b són sempre strings
            const sectionA = a === null || a === undefined ? '' : String(a);
            const sectionB = b === null || b === undefined ? '' : String(b);
            
            const orderA = sectionOrder[sectionA];
            const orderB = sectionOrder[sectionB];

            if (orderA !== undefined && orderB !== undefined) {
                return orderA - orderB;
            }
            if (orderA !== undefined) return -1;
            if (orderB !== undefined) return 1;

            // ✅ Ara ja podem usar localeCompare sense risc
            return sectionA.localeCompare(sectionB);
        });

        setLocalSections(sortedSections);
    }, [items, sectionOrder]);

    const handleDragEnd = (result) => {
        // Si no hi ha destinació vàlida, no fem res
        if (!result.destination) return;

        // Si la secció es deixa al mateix lloc, no fem res
        if (result.source.index === result.destination.index) return;

        // Creem una NOVA còpia de l'array
        const reorderedSections = [...localSections];
        
        // Eliminem l'element de la posició original
        const [movedSection] = reorderedSections.splice(result.source.index, 1);
        
        // L'afegim a la nova posició
        reorderedSections.splice(result.destination.index, 0, movedSection);

        // Actualitzem l'estat local IMMEDIATAMENT
        setLocalSections(reorderedSections);
    };

    const handleSave = async () => {
        if (localSections.length === 0) {
            return;
        }

        setIsSaving(true);
        try {
            await onSave(localSections);
            onClose();
        } catch (error) {
            console.error('Error guardant ordre de seccions:', error);
            alert('Error guardant l\'ordre de les seccions. Torna-ho a intentar.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#f0f3f5] rounded-lg box-shadow-neomorphic-container w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
                
                {/* CAPÇALERA */}
                <div className="flex justify-between items-center p-6 border-b border-gray-300">
                    <h2 className="text-2xl font-bold text-gray-800">Ordena les Seccions</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full box-shadow-neomorphic-button hover:scale-110 transition-all-smooth"
                        aria-label="Tancar"
                        disabled={isSaving}
                    >
                        <X className="w-5 h-5 text-gray-700" />
                    </button>
                </div>

                {/* CONTINGUT */}
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
                                <Droppable droppableId="sections-reorder-list">
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="space-y-3"
                                        >
                                            {localSections.map((section, index) => {
                                                // ✅ Assegurem que section sempre és un string vàlid
                                                const sectionKey = section === null || section === undefined || section === '' 
                                                    ? '__EMPTY__' 
                                                    : String(section);
                                                
                                                const displayName = section === null || section === undefined || section === '' 
                                                    ? 'Sense Secció' 
                                                    : String(section);

                                                return (
                                                    <Draggable
                                                        key={sectionKey}
                                                        draggableId={sectionKey}
                                                        index={index}
                                                    >
                                                        {(provided, snapshot) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                {...provided.dragHandleProps}
                                                                className={`
                                                                    flex items-center gap-3 p-4 rounded-lg
                                                                    transition-all duration-200 ease-in-out
                                                                    cursor-grab active:cursor-grabbing
                                                                    ${snapshot.isDragging
                                                                        ? 'bg-blue-50 shadow-lg scale-105 z-50'
                                                                        : 'bg-[#f0f3f5] box-shadow-neomorphic-element'
                                                                    }
                                                                `}
                                                                style={{
                                                                    ...provided.draggableProps.style,
                                                                }}
                                                            >
                                                                <GripVertical className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                                <div className="flex-1">
                                                                    <span className="font-semibold text-gray-800">
                                                                        {displayName}
                                                                    </span>
                                                                    <div className="text-xs text-gray-500 mt-1">
                                                                        {items.filter(item => {
                                                                            const itemSection = item.section === null || item.section === undefined ? '' : item.section;
                                                                            const currentSection = section === null || section === undefined ? '' : section;
                                                                            return itemSection === currentSection;
                                                                        }).length} productes
                                                                    </div>
                                                                </div>
                                                                <div className="text-sm font-medium text-gray-500">
                                                                    #{index + 1}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                );
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        </>
                    )}
                </div>

                {/* BOTONS D'ACCIÓ */}
                <div className="p-6 border-t border-gray-300 flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isSaving}
                        className="flex-1 px-4 py-3 rounded-md font-semibold text-gray-700
                            box-shadow-neomorphic-button hover:scale-105 transition-all-smooth
                            disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Cancel·lar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={localSections.length === 0 || isSaving}
                        className="flex-1 px-4 py-3 rounded-md font-semibold text-white bg-green-500
                            hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed
                            transition-all-smooth hover:scale-105 flex items-center justify-center gap-2
                            shadow-lg"
                    >
                        {isSaving ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Guardant...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                Guardar Ordre
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SectionOrderModal;
