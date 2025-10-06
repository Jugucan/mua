import React, { useState, useEffect } from 'react';
// ICONES actualitzades per reflectir les funcions
import { X, Plus, Edit, Trash2, Check, Share2, FileDown, ArrowUpDown, LogOut, User, List, Grid3X3 } from 'lucide-react'; 

const ListManagerModal = ({ 
    lists, 
    activeListId, 
    setActiveListId, 
    onClose, 
    onAddList, 
    onUpdateListName,
    onDeleteList,
    setFeedback,
    userEmail, // Nova prop per mostrar l'usuari
    currentDisplayMode, // Per mostrar el mode actual
    onSetDisplayMode, // Per canviar el mode des del desplegable
    onOpenSectionOrderModal, // Per obrir el modal de seccions
    onExportToExcel, // Per exportar
    onLogout // Per tancar sessió
}) => {
    // Estat local per gestionar l'input de canvi de nom de la llista activa (si es prem "Edita Llista")
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
        // No tanquem el modal
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

    // FUNCIÓ: Botó "Nova Llista"
    const handleAddNewList = async () => {
        if (newListNameInput.trim() === '') {
            setFeedback("El nom de la nova llista no pot ser buit.", 'error');
            return;
        }
        try {
            await onAddList(newListNameInput.trim());
            setFeedback(`Llista '${newListNameInput.trim()}' afegida i seleccionada!`, 'success');
            setNewListNameInput('');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };
    
    // FUNCIÓ: Botó "Edita Llista" (Canvia el nom O elimina)
    const handleEditListClick = () => {
        // Obra l'input de canvi de nom. Si es vol eliminar, es fa amb un botó addicional.
        setIsEditingName(true); 
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

    // Estil per als botons clàssics
    const buttonClass = "w-full flex items-center p-3 rounded-lg bg-[#f0f3f5] text-gray-700 font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth";
    const iconClass = "w-5 h-5 mr-3";
    const inputContainerClass = "mb-4 p-4 rounded-lg box-shadow-neomorphic-element";

    return (
        // Ajustem el modal per a semblar més a la captura (sense elements d'overflow si és possible)
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
                            {lists.map(list => (
                                <option key={list.id} value={list.id}>
                                    {list.name} (Propietari)
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
                
                {/* 2. ACCIONS CLAU AMB BOTONS (ESTIL CAPTURA) */}
                <div className="space-y-3 mb-6">
                    
                    {/* Botó: Nova Llista */}
                    <button 
                        onClick={() => { /* Obra l'input d'afegir nova llista o un modal */ 
                            setFeedback("Aquesta opció obrirà l'input d'afegir llista, no implementat com a botó simple.", 'info'); 
                        }}
                        className={buttonClass}
                        title="Clica per afegir una nova llista (caldrà afegir un input)"
                    >
                        <Plus className={iconClass} /> Nova Llista
                    </button>
                    
                    {/* Botó: Edita Llista (Activa l'edició de nom i l'opció d'eliminar la llista activa) */}
                    <button 
                        onClick={handleEditListClick}
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
                                >
                                    <Check className="w-5 h-5" /> 
                                </button>
                                <button 
                                    onClick={() => setIsEditingName(false)}
                                    className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
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
                    
                    {/* El botó de "Gestiona les meves llistes" de la captura es substitueix pels botons superiors, ja que és redundant */}
                    
                </div>
                
                {/* 3. TANCAR SESSIÓ (A baix de tot, separat i en vermell) */}
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
