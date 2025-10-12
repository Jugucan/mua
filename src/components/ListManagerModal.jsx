import React, { useState, useEffect } from 'react';
// ICONES actualitzades per reflectir les funcions
import { X, Plus, Edit, Trash2, Check, Share2, FileDown, ArrowUpDown, LogOut, User, UserMinus } from 'lucide-react'; 
import ShareListModal from './ShareListModal';

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
    onLogout,
    onShareList,
    onRemoveListAccess,
    getListSharedWith,
    isListOwner // ⭐ NOVA PROP per saber si ets propietari
}) => {
    const [isAddingNewList, setIsAddingNewList] = useState(false);
    const [isEditingName, setIsEditingName] = useState(false); 
    const [showShareModal, setShowShareModal] = useState(false);
    
    const [tempListName, setTempListName] = useState('');
    const [newListNameInput, setNewListNameInput] = useState('');
    
    const activeList = lists.find(l => l.id === activeListId) || { name: 'Carregant...' };

    // ⭐ NOU: Comprovar si l'usuari és propietari de la llista activa
    const isOwner = isListOwner ? isListOwner(activeListId) : true;

    useEffect(() => {
        if (isEditingName) {
            setTempListName(activeList.name);
        }
    }, [isEditingName, activeList.name]);
    
    const handleListChange = (e) => {
        setActiveListId(e.target.value);
        setIsEditingName(false);
    };
    
    const handleDisplayModeChange = (e) => {
        onSetDisplayMode(e.target.value);
    };

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

    const handleToggleAddList = () => {
        setIsAddingNewList(prev => !prev);
        setIsEditingName(false);
        setNewListNameInput('');
    };

    const handleAddNewList = async () => {
        if (newListNameInput.trim() === '') {
            setFeedback("El nom de la nova llista no pot ser buit.", 'error');
            return;
        }
        try {
            await onAddList(newListNameInput.trim());
            setFeedback(`Llista '${newListNameInput.trim()}' afegida i seleccionada!`, 'success');
            setNewListNameInput('');
            setIsAddingNewList(false);
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };
    
    const handleToggleEditList = () => {
        setIsEditingName(prev => !prev); 
        setIsAddingNewList(false);
    };

    // ⭐ FUNCIÓ MODIFICADA: Ara diferencia entre eliminar i sortir
    const handleDeleteActiveList = async () => {
        if (lists.length === 1) {
            setFeedback("No pots eliminar l'única llista que tens.", 'error');
            return;
        }

        let confirmMsg;
        let successMsg;

        if (isOwner) {
            // PROPIETARI: Elimina per a tothom
            confirmMsg = `Estàs segur que vols eliminar la llista "${activeList.name}"? Aquesta acció esborrarà la llista per a tots els usuaris amb qui l'has compartida!`;
            successMsg = `Llista '${activeList.name}' eliminada per a tots els usuaris.`;
        } else {
            // USUARI COMPARTIT: Només surt de la llista
            confirmMsg = `Estàs segur que vols sortir de la llista compartida "${activeList.name}"? Ja no tindràs accés als seus productes.`;
            successMsg = `Has sortit de la llista '${activeList.name}'.`;
        }
            
        const confirmDelete = window.confirm(confirmMsg);
        if (!confirmDelete) return;

        try {
            await onDeleteList(activeListId);
            setFeedback(successMsg, 'success');
            setIsEditingName(false);
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    };

    const handleLogoutClick = () => {
        onLogout();
        onClose();
    };

    const handleOpenShareModal = () => {
        setShowShareModal(true);
    };

    const appColor = 'text-green-500'; 
    const buttonClass = `w-full flex items-center p-3 rounded-lg bg-[#f0f3f5] ${appColor} font-bold box-shadow-neomorphic-button hover:shadow-inner hover:bg-gray-100 transition-all-smooth`;
    const iconClass = "w-5 h-5 mr-3";
    const inputContainerClass = "mb-4 p-4 rounded-lg box-shadow-neomorphic-element";

    return (
        <>
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-6">
                <div className="bg-[#f0f3f5] rounded-xl box-shadow-neomorphic-container p-6 w-full max-w-lg relative my-8">
                    
                    <button 
                        onClick={onClose} 
                        className="absolute top-3 right-3 p-2 rounded-full bg-[#f0f3f5] text-gray-700 box-shadow-neomorphic-button transition-all-smooth hover:scale-110"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">El meu compte</h2>
                    
                    <div className="mb-4 text-lg text-gray-700">
                        Usuari: <span className="font-semibold text-gray-800 break-words">{userEmail}</span>
                    </div>

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
                                        {list.name}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>
                    </div>

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
                    
                    <div className="space-y-3 mb-6">
                        
                        <button 
                            onClick={handleToggleAddList}
                            className={buttonClass}
                            title="Clica per afegir una nova llista"
                        >
                            <Plus className={iconClass} /> Nova Llista
                        </button>
                        
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
                                    onClick={handleToggleAddList}
                                    className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                                    title="Cancel·la"
                                >
                                    <X className="w-5 h-5" /> 
                                </button>
                            </div>
                        )}
                        
                        <button 
                            onClick={handleToggleEditList}
                            className={buttonClass}
                            title="Canvia el nom o elimina la llista activa"
                        >
                            <Edit className={iconClass} /> Edita Llista
                        </button>

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
                                        onClick={handleToggleEditList}
                                        className="p-2 rounded-md bg-red-500 text-white box-shadow-neomorphic-button hover:bg-red-600"
                                        title="Cancel·la"
                                    >
                                        <X className="w-5 h-5" /> 
                                    </button>
                                </div>
                                
                                {/* ⭐ BOTÓ MODIFICAT: Canvia segons si ets propietari o no */}
                                <button
                                    onClick={handleDeleteActiveList}
                                    className="w-full flex items-center justify-center p-2 rounded-md bg-red-500 text-white font-bold mt-2 hover:bg-red-600 transition-all-smooth"
                                    title={isOwner ? "Eliminar llista per a tots els usuaris" : "Sortir d'aquesta llista compartida"}
                                >
                                    {isOwner ? (
                                        <>
                                            <Trash2 className="w-4 h-4 mr-2" /> Elimina Llista
                                        </>
                                    ) : (
                                        <>
                                            <UserMinus className="w-4 h-4 mr-2" /> Surt de Llista Compartida
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                        
                        <button 
                            onClick={handleOpenShareModal}
                            className={buttonClass}
                            title="Comparteix aquesta llista amb altres usuaris"
                        >
                            <Share2 className={iconClass} /> Comparteix
                        </button>
                        
                        <button 
                            onClick={() => {
                                onOpenSectionOrderModal();
                                onClose();
                            }}
                            className={buttonClass}
                        >
                            <ArrowUpDown className={iconClass} /> Gestiona Seccions
                        </button>
                        
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

            {showShareModal && (
                <ShareListModal
                    listId={activeListId}
                    listName={activeList.name}
                    currentUserEmail={userEmail}
                    sharedWith={getListSharedWith(activeListId)}
                    onShare={onShareList}
                    onRemoveAccess={onRemoveListAccess}
                    onClose={() => setShowShareModal(false)}
                />
            )}
        </>
    );
};

export default ListManagerModal;
