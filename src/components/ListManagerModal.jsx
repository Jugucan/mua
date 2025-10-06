import React, { useState, useEffect } from 'react';
// ICONES actualitzades per reflectir les funcions
import { X, Plus, Edit, Trash2, Check, Share2, FileDown, ArrowUpDown, LogOut, User } from 'lucide-react'; 

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
    onOpenSectionOrderModal,
    onExportToExcel,
    onLogout
}) => {
    // Estat per gestionar si el quadre de Nova Llista està obert
    const [isAddingNewList, setIsAddingNewList] = useState(false);
    // Estat per gestionar si el quadre d'Edició de Llista està obert
    const [isEditingName, setIsEditingName] = useState(false); 
    
    const [tempListName, setTempListName] = useState('');
    const [newListNameInput, setNewListNameInput] = useState(''); // Per al camp "Nova Llista"
    
    const activeList = lists.find(l => l.id === activeListId) || { name: 'Carregant...' };

    useEffect(() => {
        if (isEditingName) {
            setTempListName(activeList.name);
        }
    }, [isEditingName, activeList.name]);
    
    // Funció per seleccionar una llista del desplegable
    const handleListChange = (e) => {
        setActiveListId(e.target.value);
        setIsEditingName(false); // Sempre desactivem l'edició si canviem de llista
    };
    
    // Funció per canviar el mode de visualització
    const handleDisplayModeChange = (e) => {
        onSetDisplayMode(e.target.value);
    };

    // FUNCIÓ: Guardar el nom de la llista activa
    const handleSaveListName = async () => {
        if (tempListName.trim() === '') {
            setFeedback("El nom no pot ser buit.", 'error');
            return;
        }
        try {
            await onUpdateListName(activeListId, tempListName.trim());
            setFeedback("Nom de la llista actualitzat!", 'success');
            setIsEditingName(false);
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    // FUNCIÓ: Botó "Nova Llista" - MOSTRAR INPUT
    const handleToggleAddList = () => {
        setIsAddingNewList(prev => !prev);
        setIsEditingName(false); // Assegurem que l'edició estigui tancada
        setNewListNameInput(''); // Netejem l'input al tancar
    };

    // FUNCIÓ: Afegir Nova Llista (Botó Check)
    const handleAddNewList = async () => {
        if (newListNameInput.trim() === '') {
            setFeedback("El nom de la nova llista no pot ser buit.", 'error');
            return;
        }
        try {
            await onAddList(newListNameInput.trim());
            setFeedback(`Llista '${newListNameInput.trim()}' afegida i seleccionada!`, 'success');
            setNewListNameInput('');
            setIsAddingNewList(false); // Tanca l'input després de l'èxit
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };
    
    // FUNCIÓ: Botó "Edita Llista" (TOGGLE)
    const handleToggleEditList = () => {
        // ⭐ CANVI: Si ja està obert, el tanquem; si està tancat, l'obrim
        setIsEditingName(prev => !prev); 
        setIsAddingNewList(false); // Assegurem que la creació estigui tancada
    };

    // FUNCIÓ: Eliminar llista
    const handleDeleteActiveList = async () => {
        const isLastList = lists.length === 1 && activeListId === lists[0].id;

        const confirmMsg = isLastList
            ? `ATENCIÓ: És la teva única llista. Si continues, es buidarà i es canviarà el nom a "Llista Principal". Estàs segur?`
            : `Estàs segur que vols eliminar la llista "${activeList.name}"? Aquesta acció esborrarà tots els seus productes!`;
            
        const confirmDelete = window.confirm(confirmMsg);
        if (!confirmDelete) return;

        try {
            const result = await onDeleteList(activeListId);

            if (result.action === 'deleted') {
                setFeedback(`Llista '${activeList.name}' eliminada.`, 'success');
            } else if (result.action === 'renamed') {
                setFeedback(`Última llista buidada i reanomenada a '${result.newName}'.`, 'info');
            }
            setIsEditingName(false); // Tancar mode edició
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    // FUNCIÓ: Tancar sessió
    const handleLogoutClick = () => {
        onLogout();
        onClose();
    };

    // ⭐ CANVI DE COLOR: Utilitzem el verd principal (green-500) per a les funcions secundàries
    const appColor = 'text-green-500'; 
    const buttonClass = `w-full flex items-center p-3 rounded-lg bg-[#f0f3f5] ${appColor} font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth`;
    const iconClass = "w-5 h-5 mr-3";
    const inputContainerClass = "mb-4 p-4 rounded-lg box-shadow-neomorphic-element";

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
            <div className="bg-[#f0f3f5] rounded-xl box-shadow-neomorphic-container p-6 w-full max-w-lg relative my-8">
                
                <button 
                    onClick={onClose} 
                    className="absolute top-3 right-3 p-2 rounded-full bg-[#f0f3f5] text-gray-700 box-shadow-neomorphic-button transition-all-smooth hover:scale-110"
                >
                    <X className="w-5 h-5" />
                </button>
                
                {/* 1. EL MEU COMPTE I INFORMACIÓ DE L'USUARI */}
                <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">El meu compte</h2>
                
                {/* Usuari */}
                <div className="mb-4 text-lg text-gray-700">
                    Usuari: <span className="font-semibold text-gray-800 break-words">{userEmail}</span>
                </div>

                {/* Les meves Llistes (Selector) */}
                <div className={inputContainerClass}>
                    <label htmlFor="activeList" className="block text-sm font-medium text-gray-700 mb-1">Les meves llistes</label>
                    <div className="relative">
                        <select
                            id="activeList"
                            value={activeListId}
                            onChange={handleListChange}
                            className="w-full px-4 py-2 rounded-md appearance-none box-shadow-neomorphic-input focus:outline-none text-gray-700 font-medium cursor-pointer"
                        >
                            {/* ⭐ CANVI: Eliminem l'etiqueta "(Propietari)" */}
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

                {/* Mode de visualització (Selector) */}
                <div className={inputContainerClass}>
                    <label htmlFor="displayMode" className="block text-sm font-medium text-gray-700 mb-1">Mode de visualització</label>
                    <div className="relative">
                        <select
                            id="displayMode"
                            value={currentDisplayMode}
                            onChange={handleDisplayModeChange}
                            className="w-full px-4 py-2 rounded-md appearance-none box-shadow-neomorphic-input focus:outline-none text-gray-700 font-medium cursor-pointer"
                        >
                            <option value="grid">Quadrícula (2 columnes)</option>
                            <option value="list">Llista (1 columna)</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
                
                {/* 2. ACCIONS CLAU AMB BOTONS */}
                <div className="space-y-3 mb-6">
                    
                    {/* Botó: Nova Llista */}
                    <button 
                        onClick={handleToggleAddList}
                        className={buttonClass}
                        title="Clica per afegir una nova llista"
                    >
                        <Plus className={iconClass} /> Nova Llista
                    </button>
                    
                    {/* ⭐ NOVA FUNCIONALITAT: Input de Nova Llista (Si està actiu) */}
                    {isAddingNewList && (
                        <div className="p-4 rounded-lg box-shadow-neomorphic-element-inset flex gap-2 items-center">
                            <input
                                type="text"
                                placeholder="Nom de la nova llista"
                                value={newListNameInput}
                                onChange={(e) => setNewListNameInput(e.target.value)}
                                className="flex-grow px-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none text-gray-700"
                            />
                            <button 
                                onClick={handleAddNewList}
                                className="p-2 rounded-md bg-green-500 text-white box-shadow-neomorphic-button hover:bg-green-600"
                                title="Crear nova llista"
                            >
                                <Check className="w-5 h-5" /> 
                            </button>
                            <button 
                                onClick={handleToggleAddList} // Tanca l'input
                                className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                                title="Cancel·la"
                            >
                                <X className="w-5 h-5" /> 
                            </button>
                        </div>
                    )}
                    
                    {/* Botó: Edita Llista (TOGGLE) */}
                    <button 
                        onClick={handleToggleEditList}
                        className={buttonClass}
                        title="Canvia el nom o elimina la llista activa"
                    >
                        <Edit className={iconClass} /> Edita Llista
                    </button>

                    {/* Input/Controls d'Edició de Llista Activa (Si està actiu) */}
                    {isEditingName && (
                        <div className="p-4 rounded-lg box-shadow-neomorphic-element-inset space-y-2">
                            <div className="flex gap-2 items-center">
                                <input
                                    type="text"
                                    value={tempListName}
                                    onChange={(e) => setTempListName(e.target.value)}
                                    className="flex-grow px-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none text-gray-700"
                                />
                                <button 
                                    onClick={handleSaveListName}
                                    className="p-2 rounded-md bg-green-500 text-white box-shadow-neomorphic-button hover:bg-green-600"
                                    title="Guardar nom"
                                >
                                    <Check className="w-5 h-5" /> 
                                </button>
                                <button 
                                    onClick={handleToggleEditList} // Tanca el quadre d'edició
                                    className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                                    title="Cancel·la"
                                >
                                    <X className="w-5 h-5" /> 
                                </button>
                            </div>
                            {/* Botó per eliminar quan s'està editant */}
                            <button
                                onClick={handleDeleteActiveList}
                                className="w-full flex items-center justify-center p-2 rounded-md bg-red-500 text-white font-bold mt-2 hover:bg-red-600 transition-all-smooth"
                                title="Eliminar llista activa"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Elimina Llista
                            </button>
                        </div>
                    )}
                    
                    {/* Botó: Comparteix */}
                    <button 
                        onClick={() => { setFeedback('Funcionalitat de compartir llista no implementada. Pròximament! 😉', 'info'); }}
                        className={buttonClass}
                    >
                        <Share2 className={iconClass} /> Comparteix
                    </button>
                    
                    {/* Botó: Gestiona Seccions */}
                    <button 
                        onClick={() => {
                            onOpenSectionOrderModal();
                            onClose();
                        }}
                        className={buttonClass}
                    >
                        <ArrowUpDown className={iconClass} /> Gestiona Seccions
                    </button>
                    
                    {/* Botó: Exporta a Excel */}
                    <button 
                        onClick={() => {
                            onExportToExcel();
                            onClose();
                        }}
                        className={buttonClass}
                    >
                        <FileDown className={iconClass} /> Exporta a Excel
                    </button>
                    
                </div>
                
                {/* 3. TANCAR SESSIÓ */}
                <div className="mt-6 pt-4 border-t border-gray-300">
                    <button 
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center p-3 rounded-md bg-red-500 text-white font-bold box-shadow-neomorphic-button hover:bg-red-600 transition-all-smooth"
                    >
                        <LogOut className="w-5 h-5 mr-2" /> Tancar Sessió
                    </button>
                </div>

            </div>
        </div>
    );
};

export default ListManagerModal;
