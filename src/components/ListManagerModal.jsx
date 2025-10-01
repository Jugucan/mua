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
        const confirmMsg = (listId === activeListId && lists.length === 1) 
            ? `ATENCIÓ: És la teva única llista. Si continues, es buidarà i es canviarà el nom a "Llista Principal". Estàs segur?`
            : `Estàs segur que vols eliminar la llista "${listName}"? Aquesta acció esborrarà tots els seus productes!`;
            
        const confirmDelete = window.confirm(confirmMsg);
        if (!confirmDelete) return;

        try {
            const result = await onDeleteList(listId);

            if (result.action === 'deleted') {
                setFeedback(`Llista '${listName}' eliminada.`, 'success');
            } else if (result.action === 'renamed') {
                setFeedback(`Última llista buidada i reanomenada a '${result.newName}'.`, 'info');
            }

            onClose(); // Tancar modal després de l'operació
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    const handleListClick = (listId) => {
        setActiveListId(listId);
        onClose();
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
                            {/* Botó per editar la llista activa */}
                            <button 
                                onClick={() => setEditingListId(activeListId)}
                                className="p-2 rounded-full bg-[#f0f3f5] text-blue-500 box-shadow-neomorphic-button hover:scale-105"
                                aria-label="Editar nom de llista"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                    {/* Botó d'eliminació de la llista activa (ara sempre visible) */}
                    <button 
                        onClick={() => handleDeleteList(activeListId, activeList.name)}
                        className="mt-3 w-full py-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                    >
                        {lists.length === 1 ? 'Buidar Llista Principal' : 'Eliminar aquesta Llista'}
                    </button>
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

                {/* Selecció d'altres llistes (AMB CLIC AL CONTENIDOR) */}
                <div className="p-4 rounded-lg box-shadow-neomorphic-element max-h-48 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Altres Llistes:</h3>
                    <div className="space-y-2">
                        {lists.filter(l => l.id !== activeListId).map(list => (
                            <div 
                                key={list.id} 
                                // ⭐ Canvi 1: Afegim un wrapper clicable 
                                onClick={() => handleListClick(list.id)}
                                className="flex justify-between items-center p-3 rounded-md bg-[#f0f3f5] box-shadow-neomorphic-element-small cursor-pointer transition-shadow hover:shadow-inner"
                            >
                                <span className="font-medium text-gray-700">
                                    {list.name}
                                </span>
                                {/* ⭐ Canvi 2: Ara el botó d'eliminar és l'únic element interactiu intern */}
                                <button 
                                    onClick={(e) => { 
                                        e.stopPropagation(); // Evitar que el clic es propagui al canvi de llista
                                        handleDeleteList(list.id, list.name);
                                    }}
                                    className="p-1 rounded-full bg-red-500 text-white box-shadow-neomorphic-button hover:scale-105"
                                    aria-label={`Eliminar llista ${list.name}`}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
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
