import React, { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Check, Share2, FileDown, RotateCcw, ArrowUpDown, User, LogOut } from 'lucide-react'; 

const ListManagerModal = ({ 
    lists, 
    activeListId, 
    setActiveListId, 
    onClose, 
    onAddList, 
    onUpdateListName,
    onDeleteList,
    setFeedback,
    userEmail,
    currentDisplayMode,
    onSetDisplayMode,
    isReorderMode,
    onToggleReorderMode,
    onOpenSectionOrderModal,
    onExportToExcel,
    onLogout // Nova prop per a la funció de tancar sessió
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
        const isLastList = lists.length === 1 && listId === activeListId;

        const confirmMsg = isLastList
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

        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    const handleListClick = (listId) => {
        setActiveListId(listId);
        onClose();
    };

    const handleExport = () => {
        if (onExportToExcel()) {
            onClose(); // Tancar modal si l'exportació s'ha fet
        }
    };

    const handleSectionOrder = () => {
        onOpenSectionOrderModal(); // Obre el modal d'ordenació de seccions
    };

    const handleReorderMode = () => {
        onToggleReorderMode(); // Activa/desactiva el mode reordenació
        onClose(); // Tanquem el modal per tornar a la vista de la llista
    };

    const handleDisplayModeChange = (e) => {
        const mode = e.target.value;
        onSetDisplayMode(mode);
    };
    
    // Funció per tancar sessió
    const handleLogoutClick = () => {
        onLogout();
        onClose();
    };


    return (
        // Corregim el scroll per fer-lo més fiable
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
            {/* Afegim un max-w-lg i un max-h-[90vh] per controlar l'alçada i l'amplada i que no es desbordi */}
            <div className="bg-[#f0f3f5] rounded-xl box-shadow-neomorphic-container p-6 w-full max-w-lg relative my-8 overflow-y-auto max-h-[90vh]">
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-2 rounded-full bg-[#f0f3f5] text-gray-700 box-shadow-neomorphic-button transition-all-smooth hover:scale-110"
                >
                    <X className="w-5 h-5" />
                </button>
                
                {/* 1. EL MEU COMPTE I INFORMACIÓ DE L'USUARI */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-500" />
                    El meu compte
                </h2>
                
                <div className="mb-6 p-4 rounded-lg box-shadow-neomorphic-element">
                    <p className="text-gray-600">Usuari: <span className="font-semibold text-gray-800 break-words">{userEmail}</span></p>
                </div>

                {/* 2. CONFIGURACIÓ RÀPIDA I ACCIONS CLAU */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Configuració i Eines</h3>
                
                {/* SELECTOR DE MODE DE VISUALITZACIÓ */}
                <div className="mb-4">
                    <label htmlFor="displayMode" className="block text-sm font-medium text-gray-700 mb-1">Mode de visualització</label>
                    <div className="relative">
                        <select
                            id="displayMode"
                            value={currentDisplayMode}
                            onChange={handleDisplayModeChange}
                            className="w-full px-4 py-2 rounded-md appearance-none box-shadow-neomorphic-input focus:outline-none text-gray-700 font-medium cursor-pointer"
                        >
                            <option value="list">Llista (1 columna)</option>
                            <option value="grid">Quadrícula (Múltiples columnes)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* BOTONS D'ACCIÓ RÀPIDA */}
                <div className="space-y-3 mb-6">
                    
                    {/* Botó per ordenar seccions */}
                    <button 
                        onClick={handleSectionOrder}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-yellow-600 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                        title="Canvia l'ordre de les seccions a la llista de la compra"
                    >
                        <ArrowUpDown className="w-5 h-5 mr-2" /> Gestiona Ordre de Seccions
                    </button>
                    
                    {/* Botó per activar el mode reordenació de productes */}
                    <button 
                        onClick={handleReorderMode}
                        className={`w-full flex items-center justify-center p-3 rounded-md font-bold transition-all-smooth ${
                            isReorderMode
                                ? 'box-shadow-neomorphic-button-inset text-red-600'
                                : 'bg-[#f0f3f5] text-gray-700 box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100'
                        }`}
                        title="Activa o desactiva l'arrossega i deixa anar productes"
                    >
                        <RotateCcw className="w-5 h-5 mr-2" /> 
                        {isReorderMode ? 'Desactiva Reordenació Productes' : 'Activa Reordenació Productes'}
                    </button>

                    {/* Botó Exporta a Excel */}
                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-gray-700 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <FileDown className="w-5 h-5 mr-2" /> Exporta la llista a Excel
                    </button>
                    
                    {/* Botó Comparteix (Placeholder) */}
                    <button 
                        onClick={() => { alert('Funcionalitat de compartir llista no implementada. Pròximament! 😉'); }}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-indigo-600 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <Share2 className="w-5 h-5 mr-2" /> Comparteix llista (enllaç)
                    </button>

                </div>


                {/* 3. GESTIÓ AVANÇADA DE LLISTES */}
                <h3 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">Gestió de Llistes</h3>
                
                {/* SELECTOR DE LLISTA ACTIVA */}
                <div className="mb-6">
                    <label htmlFor="activeList" className="block text-sm font-medium text-gray-700 mb-1">Llista de la compra activa</label>
                    <div className="relative">
                        <select
                            id="activeList"
                            value={activeListId}
                            onChange={(e) => handleListClick(e.target.value)}
                            className="w-full px-4 py-2 rounded-md appearance-none box-shadow-neomorphic-input focus:outline-none text-gray-700 font-medium cursor-pointer"
                        >
                            {/* ELIMINEM ETIQUETES DE PROPIETARI/ALTRES */}
                            {lists.map(list => (
                                <option key={list.id} value={list.id}>
                                    {list.name}
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* EDITA LLISTA ACTIVA */}
                <div className="mb-6 p-4 rounded-lg box-shadow-neomorphic-element">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Edita Llista Activa ({activeList.name}):</h3>
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
                                <Check className="w-5 h-5" /> 
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
                            <span className="font-medium text-gray-700">Edita el nom o elimina:</span>
                            <div className="flex gap-2">
                                {/* Botó per eliminar la llista activa */}
                                <button 
                                    onClick={() => handleDeleteList(activeListId, activeList.name)}
                                    className="p-2 rounded-full bg-[#f0f3f5] text-red-500 box-shadow-neomorphic-button hover:scale-105"
                                    aria-label={lists.length === 1 ? 'Buidar llista principal' : 'Eliminar aquesta llista'}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                {/* Botó per editar la llista activa */}
                                <button 
                                    onClick={() => {
                                        setEditingListId(activeListId);
                                        setNewName(activeList.name);
                                    }}
                                    className="p-2 rounded-full bg-[#f0f3f5] text-blue-500 box-shadow-neomorphic-button hover:scale-105"
                                    aria-label="Editar nom de llista"
                                >
                                    <Edit className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    )}
                    
                </div>


                {/* AFEGIR NOVA LLISTA */}
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

                {/* GESTIÓ D'ALTRES LLISTES (PER ELIMINAR O EDITAR) */}
                <div className="p-4 rounded-lg box-shadow-neomorphic-element max-h-48 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Edita / Elimina Altres Llistes:</h3>
                    <div className="space-y-2">
                        {lists.filter(l => l.id !== activeListId).map(list => (
                            <div 
                                key={list.id} 
                                // ELIMINEM EL CLIC QUE CANVIA LA LLISTA AQUÍ, L'USUARI HO HA DE FER AMB EL SELECTOR
                                className="flex justify-between items-center p-3 rounded-md bg-[#f0f3f5] box-shadow-neomorphic-element-small cursor-default transition-shadow"
                            >
                                <span className="font-medium text-gray-700">
                                    {list.name}
                                </span>
                                <div className="flex gap-2">
                                    {/* Botó per canviar a la llista (Acció ràpida) */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            handleListClick(list.id);
                                        }}
                                        className="p-1 rounded-full bg-[#f0f3f5] text-green-500 box-shadow-neomorphic-button-small hover:scale-105"
                                        aria-label="Seleccionar aquesta llista"
                                        title="Seleccionar com a llista activa"
                                    >
                                        <Check className="w-4 h-4" />
                                    </button>
                                    
                                    {/* Botó per editar la llista NO activa */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); 
                                            setEditingListId(list.id);
                                            setNewName(list.name);
                                        }}
                                        className="p-1 rounded-full bg-[#f0f3f5] text-blue-500 box-shadow-neomorphic-button-small hover:scale-105"
                                        aria-label="Editar nom de llista"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    {/* Botó d'eliminar de la llista NO activa */}
                                    <button 
                                        onClick={(e) => { 
                                            e.stopPropagation(); 
                                            handleDeleteList(list.id, list.name);
                                        }}
                                        className="p-1 rounded-full bg-red-500 text-white box-shadow-neomorphic-button-small hover:scale-105"
                                        aria-label={`Eliminar llista ${list.name}`}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {lists.filter(l => l.id !== activeListId).length === 0 && (
                            <p className="text-sm text-gray-500 text-center">No hi ha altres llistes per gestionar.</p>
                        )}
                    </div>
                </div>

                {/* 4. TANCAR SESSIÓ */}
                <div className="mt-6 pt-4 border-t">
                    <button 
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-red-500 text-white font-bold box-shadow-neomorphic-button hover:bg-red-600 transition-all-smooth"
                    >
                        <LogOut className="w-5 h-5 mr-2" /> Tancar Sessió
                    </button>
                </div>


                {/* Mode Edició per llistes NO actives (Manté la lògica) */}
                {editingListId && editingListId !== activeListId && (
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center p-4">
                        <div className="bg-[#f0f3f5] rounded-xl p-6 shadow-2xl w-full max-w-sm">
                            <h3 className="text-lg font-semibold mb-4">Edita '{lists.find(l => l.id === editingListId)?.name}'</h3>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="flex-grow px-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none text-gray-700"
                                />
                                <button 
                                    onClick={() => handleUpdateName(editingListId)}
                                    className="p-2 rounded-md bg-green-500 text-white box-shadow-neomorphic-button hover:bg-green-600"
                                >
                                    <Check className="w-5 h-5" /> 
                                </button>
                                <button 
                                    onClick={() => setEditingListId(null)}
                                    className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                                >
                                    <X className="w-5 h-5" /> 
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default ListManagerModal;
