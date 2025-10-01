import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2 } from 'lucide-react';

const ListManagerModal = ({ 
    lists, 
    activeListId, 
    setActiveListId, 
    onClose, 
    onAddList, 
    onUpdateListName,
    onDeleteList,
    setFeedback 
}) => {
    const [newName, setNewName] = useState('');
    const [newListName, setNewListName] = useState('');
    const [editingListId, setEditingListId] = useState(null);
    const activeList = lists.find(l => l.id === activeListId) || { name: 'Carregant...' };

    useEffect(() => {
        // Inicialitzar el camp d'edició amb el nom de la llista activa al muntar-se.
        if (activeList.name) {
            setNewName(activeList.name);
        }
    }, [activeList.name]);

    const handleAddList = async () => {
        if (newListName.trim() === '') {
            setFeedback("El nom de la nova llista no pot ser buit.", 'error');
            return;
        }
        try {
            await onAddList(newListName.trim());
            setFeedback(`Llista '${newListName.trim()}' afegida i seleccionada!`, 'success');
            setNewListName('');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    const handleUpdateName = async (listId) => {
        if (newName.trim() === '') {
            setFeedback("El nom no pot ser buit.", 'error');
            return;
        }
        try {
            await onUpdateListName(listId, newName.trim());
            setFeedback("Nom de la llista actualitzat!", 'success');
            setEditingListId(null);
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    const handleDeleteList = async (listId, listName) => {
        if (listId === 'mainShoppingList') {
            setFeedback("La Llista Principal no es pot eliminar.", 'error');
            return;
        }
        const confirmDelete = window.confirm(`Estàs segur que vols eliminar la llista "${listName}"? Aquesta acció esborrarà tots els seus productes!`);
        if (!confirmDelete) return;

        try {
            await onDeleteList(listId);
            setFeedback(`Llista '${listName}' eliminada.`, 'success');
            onClose(); // Tancar modal després d'eliminar
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-[#f0f3f5] rounded-xl box-shadow-neomorphic-container p-6 w-full max-w-lg relative">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-2 rounded-full bg-[#f0f3f5] text-gray-700 box-shadow-neomorphic-button transition-all-smooth hover:scale-110"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <h2 className="text-2xl font-bold text-gray-800 mb-6">Gestió de Llistes</h2>
                
                {/* Llista Activa i Canvi de Nom */}
                <div className="mb-6 p-4 rounded-lg box-shadow-neomorphic-element">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Llista Activa:</h3>
                    {editingListId === activeListId ? (
                        <div className="flex gap-2 items-center">
                            <input
                                type="text"
                                value={newName}
                                onChange={(e) => setNewName(e.target.value)}
                                className="flex-grow px-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none text-gray-700"
                            />
                            <button 
                                onClick={() => handleUpdateName(activeListId)}
                                className="p-2 rounded-md bg-green-500 text-white box-shadow-neomorphic-button hover:bg-green-600"
                            >
                                <Plus className="w-5 h-5 transform rotate-45" /> 
                            </button>
                            <button 
                                onClick={() => setEditingListId(null)}
                                className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                            >
                                <X className="w-5 h-5" /> 
                            </button>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center">
                            <span className="font-medium text-xl text-green-600">{activeList.name}</span>
                            <button 
                                onClick={() => setEditingListId(activeListId)}
                                className="p-2 rounded-full bg-[#f0f3f5] text-blue-500 box-shadow-neomorphic-button hover:scale-105"
                                aria-label="Editar nom de llista"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Afegir nova llista */}
                <div className="mb-6 p-4 rounded-lg box-shadow-neomorphic-element">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Afegir Nova Llista:</h3>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Nom de la nova llista"
                            value={newListName}
                            onChange={(e) => setNewListName(e.target.value)}
                            className="flex-grow px-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none text-gray-700"
                        />
                        <button 
                            onClick={handleAddList}
                            className="p-2 rounded-md bg-green-500 text-white box-shadow-neomorphic-button hover:bg-green-600"
                            aria-label="Crear llista"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Selecció d'altres llistes */}
                <div className="p-4 rounded-lg box-shadow-neomorphic-element max-h-48 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Altres Llistes:</h3>
                    <div className="space-y-2">
                        {lists.filter(l => l.id !== activeListId).map(list => (
                            <div key={list.id} className="flex justify-between items-center p-2 rounded-md bg-[#f0f3f5] box-shadow-neomorphic-element-small">
                                <span 
                                    className="font-medium cursor-pointer text-gray-700 hover:text-blue-500 transition-colors"
                                    onClick={() => { setActiveListId(list.id); onClose(); }}
                                >
                                    {list.name}
                                </span>
                                {list.id !== 'mainShoppingList' && (
                                    <button 
                                        onClick={() => handleDeleteList(list.id, list.name)}
                                        className="p-1 rounded-full bg-red-500 text-white box-shadow-neomorphic-button hover:scale-105"
                                        aria-label={`Eliminar llista ${list.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                        {lists.length <= 1 && (
                            <p className="text-sm text-gray-500 text-center">No hi ha altres llistes disponibles.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ListManagerModal;
