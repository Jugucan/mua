import React, { useState, useEffect } from 'react';
// IMPORTACIÓ: Afegim les icones necessàries per als botons de la captura
import { X, Plus, Edit, Trash2, Check, Share2, FileDown, RotateCcw, ArrowUpDown, List, Grid3X3, User } from 'lucide-react'; 

const ListManagerModal = ({ 
    lists, 
    activeListId, 
    setActiveListId, 
    onClose, 
    onAddList, 
    onUpdateListName,
    onDeleteList,
    setFeedback,
    // ⭐ NOVES PROPS AFEDITES PER AL MENÚ DEL COMPTE
    userEmail,
    currentListName,
    currentDisplayMode,
    onSetDisplayMode,
    isReorderMode,
    onToggleReorderMode,
    onOpenSectionOrderModal,
    onExportToExcel,
    // FI NOVES PROPS
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
        // Logica per a l'última llista vs. altres llistes
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

            // No tanquem el modal, ja que la gestió de llistes es fa dins del menú
            // onClose(); // Comentem: Tancar modal després de l'operació
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
        // onClose(); // Podem deixar-lo obert si volem que l'usuari continuï gestionant llistes
    };

    const handleReorderMode = () => {
        onToggleReorderMode(); // Activa/desactiva el mode reordenació
        onClose(); // Tanquem el modal per tornar a la vista de la llista i veure els canvis
    };

    // Funció per canviar el mode de vista des del selector (mantenint l'estil de la captura)
    const handleDisplayModeChange = (e) => {
        const mode = e.target.value;
        onSetDisplayMode(mode);
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
                
                {/* ⭐ NOU: EL MEU COMPTE I INFORMACIÓ DE L'USUARI */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3 flex items-center gap-2">
                    <User className="w-6 h-6 text-green-500" />
                    El meu compte
                </h2>
                
                <div className="mb-4">
                    <p className="text-gray-600">Usuari: <span className="font-semibold text-gray-800">{userEmail}</span></p>
                </div>

                {/* ⭐ NOU: SELECTOR DE LLISTA ACTIVA (SIMULANT LA CAPTURA) */}
                <div className="mb-6">
                    <label htmlFor="activeList" className="block text-sm font-medium text-gray-700 mb-1">Les meves llistes</label>
                    <div className="relative">
                        <select
                            id="activeList"
                            value={activeListId}
                            onChange={(e) => handleListClick(e.target.value)}
                            className="w-full px-4 py-2 rounded-md appearance-none box-shadow-neomorphic-input focus:outline-none text-gray-700 font-medium cursor-pointer"
                        >
                            {lists.map(list => (
                                <option key={list.id} value={list.id}>
                                    {list.name} ({list.id === activeListId ? 'Propietari' : 'Altres'})
                                </option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* ⭐ NOU: SELECTOR DE MODE DE VISUALITZACIÓ */}
                <div className="mb-6">
                    <label htmlFor="displayMode" className="block text-sm font-medium text-gray-700 mb-1">Mode de visualització</label>
                    <div className="relative">
                        <select
                            id="displayMode"
                            value={currentDisplayMode}
                            onChange={handleDisplayModeChange}
                            className="w-full px-4 py-2 rounded-md appearance-none box-shadow-neomorphic-input focus:outline-none text-gray-700 font-medium cursor-pointer"
                        >
                            <option value="list">Llista (1 columna)</option>
                            <option value="grid">Quadrícula (2 columnes)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>

                {/* ⭐ NOU: COLOR PRINCIPAL DE L'APP (Simulació del botó de la captura) */}
                <div className="mb-6">
                    <p className="block text-sm font-medium text-gray-700 mb-1">Color principal de l'app (per defecte)</p>
                    <div className="h-10 w-full rounded-md bg-cyan-400"></div> {/* Color Verd Llima de la captura */}
                </div>

                {/* ⭐ NOUS BOTONS DE GESTIÓ: Basats en la teva captura */}
                <div className="space-y-3">
                    {/* Botó Nova Llista (Utilitza el modal d'afegir de més avall com a funció) */}
                    <button 
                        onClick={() => { /* Implementació amb modal/input si cal */ alert('Utilitza la secció "Afegir Nova Llista" per crear una llista.'); }}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-green-600 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <Plus className="w-5 h-5 mr-2" /> Nova Llista
                    </button>
                    
                    {/* Botó Edita Llista (Només per a la llista activa - obre la secció d'edició) */}
                    <button 
                         onClick={() => { 
                            setEditingListId(activeListId);
                            setNewName(currentListName);
                        }}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-blue-600 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <Edit className="w-5 h-5 mr-2" /> Edita Llista (Nom)
                    </button>

                    {/* Botó Comparteix (Placeholder) */}
                    <button 
                        onClick={() => { alert('Funcionalitat de compartir llista no implementada. Pròximament! 😉'); }}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-indigo-600 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <Share2 className="w-5 h-5 mr-2" /> Comparteix
                    </button>
                    
                    {/* Botó per ordenar seccions (La funcionalitat que volies moure) */}
                    <button 
                        onClick={handleSectionOrder}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-yellow-600 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                        title="Canvia l'ordre de les seccions a la llista de la compra"
                    >
                        <ArrowUpDown className="w-5 h-5 mr-2" /> Gestiona Seccions
                    </button>
                    
                    {/* Botó per activar el mode reordenació de productes (La funcionalitat que volies moure) */}
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

                    {/* Botó Exporta a Excel (La funcionalitat que volies moure) */}
                    <button 
                        onClick={handleExport}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-gray-700 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <FileDown className="w-5 h-5 mr-2" /> Exporta a Excel
                    </button>

                    {/* Botó Gestiona les meves llistes (Obrirà la llista detallada de baix) */}
                    <button 
                         onClick={() => { /* Simplement tanca la llista activa i mostra la resta si cal */ alert('Aquesta opció obriria una vista de gestió de totes les llistes (esborrar, duplicar, etc.). A continuació es mostra la gestió de totes les llistes.'); }}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-[#f0f3f5] text-gray-700 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth"
                    >
                        <List className="w-5 h-5 mr-2" /> Gestiona les meves llistes
                    </button>
                    
                </div>
                {/* FI NOUS BOTONS */}

                <h3 className="text-xl font-bold text-gray-800 my-6 border-b pb-3">Gestió Avançada de Llistes</h3>
                
                {/* Llista Activa i Canvi de Nom (Mantinc la teva lògica de la llista activa a sota) */}
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
                            {/* ⭐ CANVI D'ICONA: Utilitzem Check per a Guardar */}
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
                            <span className="font-medium text-xl text-green-600">{activeList.name}</span>
                            <div className="flex gap-2">
                                {/* ⭐ CANVI D'UBICACIÓ: Botó d'eliminació de la llista activa */}
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
                                        setNewName(activeList.name); // Assegura que el camp d'input tingui el nom actual
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

                {/* Selecció d'altres llistes (Mantinc la teva lògica per si l'usuari vol canviar ràpidament de llista) */}
                <div className="p-4 rounded-lg box-shadow-neomorphic-element max-h-48 overflow-y-auto">
                    <h3 className="text-lg font-semibold mb-3 text-gray-700">Canviar Llista:</h3>
                    <div className="space-y-2">
                        {lists.filter(l => l.id !== activeListId).map(list => (
                            <div 
                                key={list.id} 
                                onClick={() => handleListClick(list.id)}
                                className="flex justify-between items-center p-3 rounded-md bg-[#f0f3f5] box-shadow-neomorphic-element-small cursor-pointer transition-shadow hover:shadow-inner"
                            >
                                <span className="font-medium text-gray-700">
                                    {list.name}
                                </span>
                                <div className="flex gap-2">
                                    {/* Botó per editar la llista NO activa */}
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation(); // Evitar canvi de llista
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
                                            e.stopPropagation(); // Evitar que el clic es propagui al canvi de llista
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
                        {lists.length <= 1 && (
                            <p className="text-sm text-gray-500 text-center">No hi ha altres llistes disponibles.</p>
                        )}
                    </div>
                </div>

                {/* Mode Edició per llistes NO actives */}
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
                                {/* ⭐ CANVI D'ICONES: Utilitzem Check per a Guardar */}
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
