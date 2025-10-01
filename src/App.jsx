import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Hem eliminat RotateCcw que no s'utilitzava i afegit Menu i Trash2
import { ShoppingBag, Plus, User, Search, Grid3x3 as Grid3X3, List, FileDown, Menu, Trash2 } from 'lucide-react'; 
import * as XLSX from 'xlsx';

// ⭐ IMPORTACIÓ NOVA: Afegim els components de react-beautiful-dnd
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Components
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import ImageModal from './components/ImageModal';
import ProductCard from './components/ProductCard';
import AddProductModal from './components/AddProductModal';
import DraggableSection from './components/DraggableSection';
import ListManagerModal from './components/ListManagerModal'; // Assegura't que estigui importat

// Hook personalitzat
import { useFirebase } from './hooks/useFirebase';

// NOU: Llista de seccions per defecte, amb un ordre predefinit
const DEFAULT_SECTION_ORDER = [
    'Fruita i Verdura', 
    'Carn i Peix',
    'Làctics', 
    'Pa i Pastisseria',
    'Begudes', 
    'Neteja', 
    'Higiene Personal', 
    'Altres',
    '' // Secció sense nom al final
];
const DEFAULT_SECTION_MAP = new Map(DEFAULT_SECTION_ORDER.map((section, index) => [section, index]));


function App() {
    // Estats locals
    const [currentView, setCurrentView] = useState('pantry');
    const [displayMode, setDisplayMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState('');
    const [expandedImage, setExpandedImage] = useState(null);
    const [displayAuthMode, setDisplayAuthMode] = useState('login'); // login, register, reset
    const [showListManagerModal, setShowListManagerModal] = useState(false);
    const [feedback, setFeedback] = useState({ message: '', type: '' });


    // Hook personalitzat
    const { 
        userId, 
        userEmail, 
        items, 
        sectionOrder, 
        isAuthReady, 
        addItem, 
        updateItem, 
        deleteItem, 
        toggleItemInShoppingList, 
        toggleBought, 
        updateItemOrder, 
        updateSectionOrder, 
        uploadFromExcel,
        handleLogin, 
        handleRegister, 
        handlePasswordReset, 
        handleLogout, 
        cleanImageUrl,
        // LLISTES I NOVES FUNCIONS
        lists,
        activeListId,
        setActiveListId,
        addList,
        updateListName,
        deleteList,
        deleteBoughtItems // Funció per esborrat massiu
    } = useFirebase();
    
    // ⭐ Càlcul del nom de la llista activa (sense canvis, correcte)
    const activeListName = useMemo(() => {
        const activeList = lists.find(l => l.id === activeListId);
        // Utilitzem un nom per defecte mentre carrega
        return activeList ? activeList.name : 'Carregant Llista...'; 
    }, [lists, activeListId]);


    // Filtrar els ítems per la vista actual i terme de cerca
    const filteredItems = useMemo(() => {
        let filtered = items.filter(item => {
            if (currentView === 'shopping') {
                return item.isInShoppingList;
            } else { // 'pantry'
                return !item.isInShoppingList;
            }
        });

        if (searchTerm) {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter(item => 
                item.name?.toLowerCase().includes(lowerCaseSearchTerm) ||
                item.section?.toLowerCase().includes(lowerCaseSearchTerm)
            );
        }

        return filtered;
    }, [items, currentView, searchTerm]);

    const itemsInShoppingList = useMemo(() => filteredItems.filter(item => !item.isBought), [filteredItems]);
    const boughtItems = useMemo(() => filteredItems.filter(item => item.isBought), [filteredItems]);
    
    const availableSections = useMemo(() => {
        const sections = new Set(items.map(item => item.section).filter(Boolean));
        return Array.from(sections);
    }, [items]);

    // Calcular l'ordre de les seccions, prioritzant l'ordre definit per l'usuari
    const sortedSections = useMemo(() => {
        const sections = Array.from(new Set(itemsInShoppingList.map(item => item.section || '')));
        
        return sections.sort((a, b) => {
            const orderA = sectionOrder[a] !== undefined ? sectionOrder[a] : DEFAULT_SECTION_MAP.get(a) !== undefined ? DEFAULT_SECTION_MAP.get(a) : 999;
            const orderB = sectionOrder[b] !== undefined ? sectionOrder[b] : DEFAULT_SECTION_MAP.get(b) !== undefined ? DEFAULT_SECTION_MAP.get(b) : 999;
            return orderA - orderB;
        });
    }, [itemsInShoppingList, sectionOrder]);


    // =================================================================
    // GESTIÓ D'ESTATS
    // =================================================================

    const handleUpdateItem = useCallback(async (itemId, updatedData) => {
        try {
            await updateItem(itemId, updatedData);
            setShowEditModal(false);
            setFeedback("Producte actualitzat correctament.", 'success');
        } catch (error) {
            setFeedback(error.message || "Error al actualitzar producte.", 'error');
        }
    }, [updateItem]);

    const handleDeleteItem = useCallback(async (item) => {
        const confirmDelete = window.confirm(`Estàs segur que vols eliminar permanentment ${item.name}?`);
        if (!confirmDelete) return;

        try {
            await deleteItem(item);
            setShowEditModal(false);
            setFeedback("Producte eliminat correctament.", 'success');
        } catch (error) {
            setFeedback(error.message || "Error al eliminar producte.", 'error');
        }
    }, [deleteItem]);

    const handleAddItem = useCallback(async (itemData) => {
        try {
            await addItem(itemData);
            setShowAddModal(false);
            setFeedback("Producte afegit correctament.", 'success');
        } catch (error) {
            setFeedback(error.message || "Error al afegir producte.", 'error');
        }
    }, [addItem]);

    // Funció per eliminar productes comprats massivament (sense canvis, correcte)
    const handleDeleteBoughtItems = useCallback(async () => {
        const confirmDelete = window.confirm("Estàs segur que vols eliminar permanentment tots els productes marcats com comprats (a la secció inferior)?");
        if (!confirmDelete) return;

        try {
            const count = await deleteBoughtItems();
            if (count > 0) {
                setFeedback(`S'han eliminat ${count} productes comprats.`, 'success');
            } else {
                setFeedback("No hi ha productes marcats com comprats per eliminar.", 'info');
            }
        } catch (error) {
            setFeedback(error.message || "Error al eliminar productes comprats.", 'error');
        }
    }, [deleteBoughtItems, setFeedback]);


    // =================================================================
    // GESTIÓ D'ARXIUS I EXCEL
    // =================================================================

    const handleFileUpload = useCallback((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                uploadFromExcel(json)
                    .then(({ successfulUploads, skippedItems }) => {
                        setFeedback(`Importació finalitzada. Productes pujats: ${successfulUploads}. Saltats: ${skippedItems}.`, 'success');
                        setShowAddModal(false);
                    })
                    .catch(error => {
                        setFeedback(error.message || "Error durant la pujada de l'Excel.", 'error');
                    });

            } catch (error) {
                setFeedback("Error llegint el fitxer. Assegura't que és un Excel vàlid.", 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    }, [uploadFromExcel]);
    
    // =================================================================
    // GESTIÓ DRAG & DROP
    // =================================================================
    // (Sense canvis, es manté la lògica de darrera versió)

    const onDragEnd = useCallback((result) => {
        const { source, destination, type } = result;

        if (!destination) {
            return;
        }

        if (source.droppableId === destination.droppableId && source.index === destination.index) {
            return;
        }

        if (type === 'SECTION') {
            // Lògica per reordenar seccions
            const reorderedSections = Array.from(sortedSections);
            const [removed] = reorderedSections.splice(source.index, 1);
            reorderedSections.splice(destination.index, 0, removed);

            const newOrderMap = {};
            reorderedSections.forEach((section, index) => {
                newOrderMap[section] = index;
            });
            updateSectionOrder(newOrderMap);

        } else if (type === 'ITEM') {
            // Lògica per reordenar ítems dins una secció
            const itemId = result.draggableId;
            const item = itemsInShoppingList.find(i => i.id === itemId);

            if (!item) return;
            
            // Simular un nou índex d'ordre basat en els ítems que l'envolten
            const targetItems = itemsInShoppingList.filter(i => (i.section || '') === destination.droppableId);
            const newTargetItems = Array.from(targetItems);
            
            // Trobar la posició de l'element arrossegat a la llista d'elements de la secció
            const currentItemIndex = newTargetItems.findIndex(i => i.id === itemId);
            if (currentItemIndex !== -1) {
                 newTargetItems.splice(currentItemIndex, 1);
            }
            
            newTargetItems.splice(destination.index, 0, item);

            // Calcular el nou orderIndex
            let newOrderIndex;
            if (destination.index === 0) {
                // Posició inicial: Agència l'ordre del següent
                newOrderIndex = (newTargetItems[1]?.orderIndex || 0) - 1;
            } else if (destination.index === newTargetItems.length - 1) {
                // Posició final: Agència l'ordre de l'anterior
                newOrderIndex = (newTargetItems[newTargetItems.length - 2]?.orderIndex || Date.now() + 1000) + 1;
            } else {
                // Posició intermèdia: Mitjana entre l'anterior i el següent
                const prevIndex = newTargetItems[destination.index - 1]?.orderIndex || 0;
                const nextIndex = newTargetItems[destination.index + 1]?.orderIndex || prevIndex + 2;
                newOrderIndex = (prevIndex + nextIndex) / 2;
            }
            
            // Actualitzar la secció si l'hem mogut a un altre Droppable (una altra secció)
            const newSection = destination.droppableId;
            const updateData = { orderIndex: newOrderIndex };
            
            if (item.section !== newSection) {
                updateData.section = newSection === '' ? null : newSection;
            }
            
            updateItem(itemId, updateData);
        }
    }, [sortedSections, itemsInShoppingList, updateSectionOrder, updateItem, items]);

    // =================================================================
    // GESTIÓ D'AUTENTICACIÓ
    // =================================================================
    // (Sense canvis)

    const onLogin = useCallback(async (email, password) => {
        try {
            await handleLogin(email, password);
            setShowAuthModal(false);
            setAuthErrorMessage('');
            setFeedback("Sessió iniciada correctament!", 'success');
        } catch (error) {
            setAuthErrorMessage(error.message);
        }
    }, [handleLogin]);

    const onRegister = useCallback(async (email, password) => {
        try {
            await handleRegister(email, password);
            setShowAuthModal(false);
            setAuthErrorMessage('');
            setFeedback("Registre completat. Sessió iniciada!", 'success');
        } catch (error) {
            setAuthErrorMessage(error.message);
        }
    }, [handleRegister]);

    const onPasswordReset = useCallback(async (email) => {
        try {
            await handlePasswordReset(email);
            setAuthErrorMessage('Correu electrònic de recuperació de contrasenya enviat!');
            setDisplayAuthMode('login');
        } catch (error) {
            setAuthErrorMessage(error.message);
        }
    }, [handlePasswordReset]);
    
    const onLogout = useCallback(async () => {
        try {
            await handleLogout();
            setShowAuthModal(false);
            setFeedback("Sessió tancada.", 'info');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    }, [handleLogout]);


    if (!isAuthReady) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#e0e3e5]">
                <p className="text-gray-700">Carregant...</p>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${currentView === 'pantry' ? 'bg-[#f0f3f5]' : 'bg-[#e0e3e5]'}`}>
            <div className="container mx-auto p-4">

                {/* Títol principal de l'aplicació */}
                <h1 className="text-3xl font-bold text-center mb-6 text-gray-800">
                    {/* ⭐ Títol Dinàmic (SENSE CANVIS, CORRECTE) */}
                    {activeListName}
                </h1>

                {/* Barra d'Eines Superior (RESTAURADA) */}
                <div className="flex justify-between items-center mb-6 p-3 rounded-xl box-shadow-neomorphic-container">
                    
                    {/* Botó de Vistes (Pantry/Shopping) */}
                    <div className="flex space-x-2">
                        <button
                            onClick={() => setCurrentView('pantry')}
                            className={`p-2 rounded-lg text-sm transition-colors ${currentView === 'pantry' ? 'bg-[#f0f3f5] text-blue-600 font-semibold shadow-inner' : 'bg-[#e0e3e5] text-gray-600 box-shadow-neomorphic-button hover:bg-[#f0f3f5]'}`}
                        >
                            <List className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setCurrentView('shopping')}
                            className={`p-2 rounded-lg text-sm transition-colors ${currentView === 'shopping' ? 'bg-[#f0f3f5] text-green-600 font-semibold shadow-inner' : 'bg-[#e0e3e5] text-gray-600 box-shadow-neomorphic-button hover:bg-[#f0f3f5]'}`}
                        >
                            <ShoppingBag className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Botons dreta (List Manager / Add / Auth) */}
                    <div className="flex space-x-2">
                        {/* ⭐ NOU: Botó de Gestió de Llistes (Menu) - restaurat a la dreta */}
                        <button 
                            onClick={() => setShowListManagerModal(true)}
                            className="p-2 rounded-lg bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button hover:bg-[#e0e3e5]"
                            aria-label="Gestió de Llistes"
                        >
                            <Menu className="w-5 h-5" />
                        </button>
                         <button
                            onClick={() => setShowAddModal(true)}
                            className="p-2 rounded-lg bg-green-500 text-white box-shadow-neomorphic-button hover:bg-green-600"
                            aria-label="Afegir producte/excel"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => {
                                setAuthErrorMessage('');
                                setShowAuthModal(true);
                                setDisplayAuthMode(userEmail ? 'logout' : 'login');
                            }}
                            className="p-2 rounded-lg bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button hover:bg-[#e0e3e5]"
                            aria-label="Usuari/Autenticació"
                        >
                            <User className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                
                {/* Missatges de Feedback */}
                {feedback.message && (
                    <div className={`p-3 rounded-lg text-sm font-medium mb-4 shadow-md ${feedback.type === 'success' ? 'bg-green-100 text-green-700' : feedback.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`} onClick={() => setFeedback({ message: '', type: '' })}>
                        {feedback.message}
                    </div>
                )}
                
                {/* Barra de Recerca i Mode de Visualització */}
                {currentView === 'pantry' && (
                    <div className="flex gap-4 mb-6">
                        <div className="flex-grow relative">
                            <input
                                type="text"
                                placeholder="Cerca productes..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-5 py-3 pl-12 rounded-xl box-shadow-neomorphic-input text-gray-700 focus:outline-none"
                            />
                            <Search className="w-5 h-5 absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                        </div>
                        <div className="flex space-x-2 p-1 rounded-xl bg-[#e0e3e5] shadow-inner">
                            <button
                                onClick={() => setDisplayMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${displayMode === 'grid' ? 'bg-[#f0f3f5] text-blue-600 shadow-md' : 'text-gray-600 hover:bg-[#f0f3f5]'}`}
                                aria-label="Mode reixeta"
                            >
                                <Grid3X3 className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setDisplayMode('list')}
                                className={`p-2 rounded-lg transition-colors ${displayMode === 'list' ? 'bg-[#f0f3f5] text-blue-600 shadow-md' : 'text-gray-600 hover:bg-[#f0f3f5]'}`}
                                aria-label="Mode llista"
                            >
                                <List className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                )}


                {/* Contenidor Principal (Llista / Rebost) */}
                <DragDropContext onDragEnd={onDragEnd}>
                    {/* Vista Rebost (Pantry) */}
                    {currentView === 'pantry' && (
                        <div className={`grid gap-4 ${displayMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                            <Droppable droppableId="pantry-items" type="ITEM">
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.droppableProps} className={`grid gap-4 w-full ${displayMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 col-span-full' : 'grid-cols-1'}`}>
                                        {filteredItems.map((item, index) => (
                                            <ProductCard 
                                                key={item.id}
                                                item={item} 
                                                onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                                onAction={toggleItemInShoppingList} 
                                                actionLabel="Afegir a llista"
                                                requireDoubleClick={true}
                                                additionalClasses="box-shadow-neomorphic-element"
                                            />
                                        ))}
                                        {provided.placeholder}
                                        {filteredItems.length === 0 && <p className="text-gray-500 col-span-full text-center mt-8">No hi ha productes al rebost amb el filtre actual.</p>}
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    )}


                    {/* Vista Llista de la Compra (Shopping) */}
                    {currentView === 'shopping' && (
                        <>
                            {/* Productes per Comprar (Seccions Draggables) */}
                            <h2 className="text-2xl font-semibold text-gray-700 mb-4">Productes per comprar</h2>
                            <Droppable droppableId="sections" type="SECTION" direction="vertical">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-6">
                                        {sortedSections.map((section, index) => (
                                            <DraggableSection
                                                key={section || 'no-section'}
                                                section={section}
                                                index={index}
                                                items={itemsInShoppingList.filter(item => (item.section || '') === section).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))}
                                                onItemAction={toggleBought}
                                                onEditItem={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                                onUpdateItemOrder={updateItemOrder}
                                            />
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>

                            {/* ⭐ Botó: ELIMINAR COMPRATS */}
                            {boughtItems.length > 0 && (
                                <div className="mt-8 mb-6 p-4 bg-white rounded-xl shadow-md flex justify-center box-shadow-neomorphic-container">
                                    <button
                                        onClick={handleDeleteBoughtItems}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500 text-white font-semibold box-shadow-neomorphic-button hover:bg-red-600 transition-all-smooth"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                        Eliminar ({boughtItems.length}) productes comprats
                                    </button>
                                </div>
                            )}

                            {/* Productes Comprats */}
                            <div className="mt-8">
                                <h2 className="text-2xl font-semibold text-gray-700 mb-4">Productes comprats</h2>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                    {boughtItems.map(item => (
                                        <ProductCard 
                                            key={item.id}
                                            item={item} 
                                            onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                            onAction={toggleBought} 
                                            actionLabel="Desfer comprat"
                                            requireDoubleClick={true}
                                            additionalClasses="box-shadow-neomorphic-element-green"
                                        />
                                    ))}
                                    {boughtItems.length === 0 && <p className="text-gray-500 col-span-full text-center mt-4">No hi ha productes marcats com comprats.</p>}
                                </div>
                            </div>
                        </>
                    )}
                </DragDropContext>
            </div>
            
            {/* ================================================================= */}
            {/* MODALS */}
            {/* ================================================================= */}
            
            {/* Modal d'Edició de Producte */}
            {showEditModal && editingItem && (
                <EditItemModal 
                    item={editingItem} 
                    onClose={() => { setShowEditModal(false); setEditingItem(null); }} 
                    onSave={handleUpdateItem} 
                    onDelete={handleDeleteItem} 
                    availableSections={availableSections} 
                />
            )}
            
            {/* Modal de Gestió de Llistes */}
            {showListManagerModal && (
                <ListManagerModal
                    lists={lists}
                    activeListId={activeListId}
                    setActiveListId={setActiveListId}
                    onClose={() => setShowListManagerModal(false)}
                    onAddList={addList}
                    onUpdateListName={updateListName}
                    onDeleteList={deleteList}
                    setFeedback={setFeedback}
                />
            )}


            {/* Modal d'Autenticació */}
            {showAuthModal && (
                <AuthModal 
                    onLogin={onLogin} 
                    onRegister={onRegister} 
                    onLogout={onLogout} 
                    userEmail={userEmail} 
                    errorMessage={authErrorMessage} 
                    onClose={() => setShowAuthModal(false)} 
                    onForgotPassword={onPasswordReset} 
                    displayMode={displayAuthMode} 
                    setDisplayMode={setDisplayAuthMode} 
                />
            )}

            {/* Modal d'Afegir Producte/Excel */}
            {showAddModal && (
                <AddProductModal 
                    onClose={() => setShowAddModal(false)}
                    availableSections={availableSections}
                    onAddItem={handleAddItem}
                    onFileUpload={handleFileUpload}
                    cleanImageUrl={cleanImageUrl}
                />
            )}
            
            {/* Modal d'Imatge (Expansió) */}
            {expandedImage && (
                <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />
            )}
            
        </div>
    );
}

export default App;
