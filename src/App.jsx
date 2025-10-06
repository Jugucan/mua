import React, { useState, useEffect, useCallback, useMemo } from 'react';
// ICONES
// ⭐⭐⭐ FIX: Afegim Grid3X3 i List a la importació de lucide-react ⭐⭐⭐
import { ShoppingBag, Plus, Search, FileDown, RotateCcw, ArrowUpDown, Grid3X3, List } from 'lucide-react'; 
import * as XLSX from 'xlsx';

// Components
import BottomNavBar from './components/BottomNavBar'; 
import ConfirmationModal from './components/ConfirmationModal'; 
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import ImageModal from './components/ImageModal';
import ProductCard from './components/ProductCard';
import AddProductModal from './components/AddProductModal';
import DraggableSection from './components/DraggableSection';
import ListManagerModal from './components/ListManagerModal';
import SectionOrderModal from './components/SectionOrderModal'; 

// Hook personalitzat
import { useSupabase } from './useSupabase';

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
    // ESTAT MANTINGUT
    const [displayMode, setDisplayMode] = useState('grid'); 
    const [searchTerm, setSearchTerm] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState('info');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showListManagerModal, setShowListManagerModal] = useState(false);
    const [showSectionOrderModal, setShowSectionOrderModal] = useState(false);
    const [showClearConfirmModal, setShowClearConfirmModal] = useState(false);
    const [shoppingListSort, setShoppingListSort] = useState('default');
    const [isReorderMode, setIsReorderMode] = useState(false);
    
    // Hook de Firebase
    const {
        userId,
        userEmail,
        items,
        sectionOrder,
        isAuthReady,
        lists,
        activeListId,
        setActiveListId,
        addList,
        updateListName,
        deleteList,
        addItem,
        updateItem,
        deleteItem,
        toggleItemInShoppingList,
        toggleBought,
        clearCompletedItems,
        uploadFromExcel,
        updateItemOrder,
        updateSectionOrder,
        updateAllSectionsOrder,
        handleLogin,
        handleRegister,
        handlePasswordReset,
        handleLogout,
        cleanImageUrl
    } = useSupabase();

    // Funció per canviar vista (Passada a BottomNavBar)
    const toggleDisplayMode = useCallback(() => {
        setDisplayMode(prev => prev === 'grid' ? 'list' : 'grid');
    }, []);

    // Seccions disponibles (Usades a modals)
    const availableSections = useMemo(() => {
        const sections = new Set(DEFAULT_SECTION_ORDER.filter(s => s !== ''));
        items.forEach(item => {
            if (item.section) {
                sections.add(item.section);
            }
        });
        return Array.from(sections).sort();
    }, [items]);
    
    // Calcula el nom de la llista activa
    const currentListName = useMemo(() => {
        const activeList = lists.find(l => l.id === activeListId);
        return activeList ? activeList.name : 'Carregant...';
    }, [lists, activeListId]);
    
    // Funció unificada per al feedback
    const setFeedback = useCallback((message, type) => {
        setFeedbackMessage(message);
        setFeedbackType(type);
    }, []);

    // Feedback temporal
    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => {
                setFeedbackMessage("");
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    // Funció per afegir un element
    const handleAddItem = async (itemData) => {
        try {
            await addItem(itemData);
            setFeedback("Element afegit correctament!", 'success');
            return true;
        } catch (error) {
            setFeedback(error.message, 'error');
            return false;
        }
    };
    
    // Funció per pujar arxiu
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                const result = await uploadFromExcel(json);
                setFeedback(`S'han pujat ${result.successfulUploads} productes des de l'Excel! ${result.skippedItems > 0 ? `(${result.skippedItems} files buides saltades)` : ''}`, 'success');
            } catch (error) {
                setFeedback(error.message, 'error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Funció per exportar a Excel
    const handleExportToExcel = () => {
        try {
            const exportData = items.map(item => ({
                'Nom': item.name,
                'Quantitat': item.quantity || '',
                'Secció': item.section || '',
                'Icona Principal': item.icon || '',
                'Icona Secundària': item.secondIcon || '',
                'A la llista': item.isInShoppingList ? 'Sí' : 'No',
                'Comprat': item.isBought ? 'Sí' : 'No'
            }));

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Llista de la compra");
            
            const fileName = `${currentListName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            setFeedback("Llista exportada correctament!", 'success');
        } catch (error) {
            setFeedback("Error exportant la llista: " + error.message, 'error');
        }
    };

    const afegirDeDespensaALlista = useCallback(async (item) => {
        try {
            const result = await toggleItemInShoppingList(item);
            setFeedback(`'${item.name}' ${result ? 'afegit a la llista de la compra' : 'tret de la llista de la compra'}!`, 'success');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    }, [toggleItemInShoppingList, setFeedback]);

    const handleUpdateItem = useCallback(async (id, updatedData) => {
        try {
            await updateItem(id, updatedData);
            setFeedback("Element actualitzat correctament!", 'success');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    }, [updateItem, setFeedback]);

    const handleDeleteItem = useCallback(async (item) => {
        const confirmDelete = window.confirm(`Estàs segur que vols eliminar permanentment "${item.name}"?`);
        if (!confirmDelete) return;

        try {
            await deleteItem(item);
            setFeedback("Element eliminat permanentment correctament!", 'success');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    }, [deleteItem, setFeedback]);

    const handleToggleBought = useCallback(async (item, isBought) => {
        try {
            const newStatus = !isBought; 
            const result = await toggleBought(item, newStatus);
            
            setFeedback(`Element ${result ? 'marcat com a comprat' : 'marcat com a pendent'}!`, 'success');
        } catch (error) {
            setFeedback(error.message, 'error');
        }
    }, [toggleBought, setFeedback]);

    // Funció per obrir el modal de confirmació de neteja
    const handleClearCompletedItems = useCallback(async () => {
        setShowClearConfirmModal(true);
    }, []); 

    // Funció que s'executa quan es confirma l'acció al modal
    const executeClearCompletedItems = useCallback(async () => {
        setShowClearConfirmModal(false); 
        try {
            const count = await clearCompletedItems(); 
            setFeedback(`S'han netejat i arxivat ${count} productes a la Despensa!`, 'success');
        } catch (error) {
            setFeedback("Error netejant productes comprats: " + error.message, 'error');
        }
    }, [clearCompletedItems, setFeedback]);


    // Funcions d'autenticació amb feedback
    const onLogin = useCallback(async (email, password) => {
        setAuthErrorMessage("");
        try {
            await handleLogin(email, password);
            setShowAuthModal(false);
            setFeedback("Sessió iniciada correctament!", 'success');
        } catch (error) {
            setAuthErrorMessage("Error iniciant sessió: " + error.message);
        }
    }, [handleLogin, setFeedback]);

    const onRegister = useCallback(async (email, password) => {
        setAuthErrorMessage("");
        try {
            await handleRegister(email, password);
            setShowAuthModal(false);
            setFeedback("Registre completat i sessió iniciada!", 'success');
        } catch (error) {
            setAuthErrorMessage("Error registrant: " + error.message);
        }
    }, [handleRegister, setFeedback]);

    const onPasswordReset = useCallback(async (email) => {
        setAuthErrorMessage("");
        try {
            await handlePasswordReset(email);
            setFeedback("S'ha enviat un correu de recuperació de contrasenya.", 'success');
        } catch (error) {
            setAuthErrorMessage("Error enviant correu de recuperació: " + error.message);
        }
    }, [handlePasswordReset, setFeedback]);

    const onLogout = useCallback(async () => {
        try {
            await handleLogout();
            setShowAuthModal(false);
            setFeedback("Sessió tancada correctament!", 'info');
        } catch (error) {
            setFeedback("Error tancant sessió: " + error.message, 'error');
        }
    }, [handleLogout, setFeedback]);

    // Funció per ordenar productes alfabèticament
    const sortItemsAlphabetically = (itemsList) => {
        return [...itemsList].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    };
    
    // Funció per agrupar per secció i ordenar
    const groupItemsBySection = (itemsList) => {
        const groups = {};

        // 1. Agrupem els elements per la seva secció
        itemsList.forEach(item => {
            const sectionName = item.section || ''; 
            if (!groups[sectionName]) {
                groups[sectionName] = [];
            }
            groups[sectionName].push(item);
        });

        // 2. Ordenem els grups/seccions segons l'ordre personalitzat
        const sortedSections = Object.keys(groups).sort((a, b) => {
            const customOrderA = sectionOrder[a];
            const customOrderB = sectionOrder[b];
            
            if (customOrderA !== undefined && customOrderB !== undefined) {
                return customOrderA - customOrderB;
            }
            if (customOrderA !== undefined) return -1;
            if (customOrderB !== undefined) return 1;
            
            const indexA = DEFAULT_SECTION_MAP.has(a) ? DEFAULT_SECTION_MAP.get(a) : DEFAULT_SECTION_ORDER.length;
            const indexB = DEFAULT_SECTION_MAP.has(b) ? DEFAULT_SECTION_MAP.get(b) : DEFAULT_SECTION_ORDER.length;
            return indexA - indexB;
        });

        // 3. Dins de cada grup, ordenem els elements per orderIndex o alfabèticament
        const sortedGroups = sortedSections.map(section => ({
            section: section,
            items: groups[section].sort((a, b) => {
                if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                    return a.orderIndex - b.orderIndex;
                }
                if (a.orderIndex !== undefined) return -1;
                if (b.orderIndex !== undefined) return 1;
                return a.name.localeCompare(b.name);
            })
        }));

        return sortedGroups;
    };

    // Filtres per als elements amb cerca
    const filterItems = (itemsList) => {
        if (!searchTerm) return itemsList;
        return itemsList.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.section && item.section.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const pantryItems = sortItemsAlphabetically(filterItems(items.filter(item => !item.isInShoppingList || item.isBought)));
    const unboughtItems = filterItems(items.filter(item => item.isInShoppingList && !item.isBought));
    const boughtItems = filterItems(items.filter(item => item.isInShoppingList && item.isBought));
    
    const groupedUnboughtItems = groupItemsBySection(unboughtItems);
    const groupedBoughtItems = groupItemsBySection(boughtItems);

    const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

    // Funció per renderitzar elements en format llista (Sense canvis)
    const renderListItems = (itemsList, isRed = false, requireDoubleClick = false) => {
        return itemsList.map(item => (
            <div 
                key={item.id} 
                className={`list-item ${isRed ? 'box-shadow-neomorphic-element-red' : 'box-shadow-neomorphic-element'} transition-all-smooth`}
                onClick={(e) => { 
                    if (!requireDoubleClick) handleToggleBought(item, item.isBought);
                }}
                onDoubleClick={(e) => { 
                    e.stopPropagation();
                    handleToggleBought(item, item.isBought); 
                }}
                title={`Doble clic per ${item.isBought ? 'desmarcar' : 'marcar com comprat'} ${item.name}`}
            >
                <div className="list-item-icon">
                    {item.icon && (item.icon.startsWith('http://') || item.icon.startsWith('https://')) ? (
                        <img
                            src={item.icon}
                            alt="icona"
                            className="w-12 h-12 product-image rounded"
                            onError={(e) => {
                                e.target.src = 'https://placehold.co/48x48/cccccc/000000?text=Error';
                            }}
                        />
                    ) : (
                        <ShoppingBag className="w-12 h-12 text-gray-600" />
                    )}
                </div>
                <div className="list-item-content">
                    <div className={`font-semibold ${isRed ? 'product-name-pending' : 'text-gray-800'}`}>{item.name}</div>
                    {item.quantity && <div className="text-sm text-gray-500">{item.quantity}</div>}
                    {item.section && <div className="text-xs text-gray-400">{item.section}</div>}
                </div>
            </div>
        ));
    };
    
    // Activar/desactivar mode reordenació
    const toggleReorderMode = () => {
        setIsReorderMode(!isReorderMode);
        setFeedback(
            !isReorderMode 
                ? "Mode reordenació activat! Ara pots arrossegar seccions i productes."
                : "Mode reordenació desactivat.", 
            'info'
        );
    };

    // Funcions per obrir modals (Necessàries per passar al BottomNavBar)
    const openSectionOrderModal = () => {
        setShowSectionOrderModal(true);
    };
    const openAddModal = () => {
        setShowAddModal(true);
    };
    const openAuthModal = () => {
        setShowAuthModal(true);
    };
    const openListManagerModal = () => {
        setShowListManagerModal(true);
    };

    // Funció per gestionar drag & drop (Sense canvis)
    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === 'SECTION') {
            try {
                const sections = currentView === 'shoppingList' 
                    ? [...groupedUnboughtItems.map(g => g.section)]
                    : [];
                
                const [movedSection] = sections.splice(source.index, 1);
                sections.splice(destination.index, 0, movedSection);
                
                const updatePromises = sections.map((section, index) => 
                    updateSectionOrder(section, index)
                );
                
                await Promise.all(updatePromises);
                
                setFeedback("Ordre de seccions actualitzat!", 'success');
                
            } catch (error) {
                setFeedback("Error reordenant seccions: " + error.message, 'error');
            }
        } else if (type === 'ITEM') {
            if (source.droppableId === destination.droppableId) {
                try {
                    const sectionName = source.droppableId.replace('section-items-', '');
                    const sectionItems = currentView === 'shoppingList'
                        ? groupedUnboughtItems.find(g => g.section === sectionName)?.items || []
                        : [];
                    
                    const itemsCopy = [...sectionItems];
                    const [movedItem] = itemsCopy.splice(source.index, 1);
                    itemsCopy.splice(destination.index, 0, movedItem);
                    
                    const updatePromises = itemsCopy.map((item, index) => 
                        updateItemOrder(item.id, index)
                    );
                    
                    await Promise.all(updatePromises);
                    
                    setFeedback("Ordre de productes actualitzat!", 'success');
                } catch (error) {
                    setFeedback("Error reordenant productes: " + error.message, 'error');
                }
            }
        }
    };

    return (
        // ⭐ CANVI AL PADDING INFERIOR: Afegim 'pb-20' per fer espai a la barra inferior fixa
        <div className="min-h-screen bg-[#f0f3f5] text-gray-700 flex flex-col p-4 sm:p-6 pb-20"> 
            <header className="w-full mb-6 text-center relative">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{currentListName}</h1> 
            </header>

            {/* Feedback Message (Sense canvis) */}
            {feedbackMessage && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 
                    rounded-md shadow-lg z-50 transition-opacity duration-300 opacity-100 flex items-center 
                    ${feedbackType === 'info' ? 'bg-blue-500' : feedbackType === 'success' ? 'bg-green-500' : 'bg-red-500'} `}>
                    {feedbackMessage}
                </div>
            )}

            {/* Botons de navegació principal (Despensa <-> Llista) (Sense canvis) */}
            <div className="w-full max-w-full flex flex-col gap-4 mb-6 mx-auto">
                <div className="flex justify-center gap-4">
                    <button 
                        onClick={() => setCurrentView('pantry')} 
                        className={`px-6 py-3 rounded-md font-bold transition-all-smooth ${
                            currentView === 'pantry' 
                                ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                        }`}
                    >
                        Despensa ({pantryItems.length})
                    </button>
                    <button 
                        onClick={() => setCurrentView('shoppingList')} 
                        className={`px-6 py-3 rounded-md font-bold transition-all-smooth ${
                            currentView === 'shoppingList' 
                                ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                        }`}
                    >
                        Llista ({unboughtItems.length + boughtItems.length})
                    </button>
                </div>

                {/* CONTENIDOR DE FUNCIONALITATS SUPERIORS: BARRRA DE CERCA/ORDENACIÓ */}
                {/* Fem que la barra de cerca ocupe tota l'amplada i quedi centrada, com a la captura */}
                <div className="flex justify-between items-center w-full">
                    
                    {/* 1. SECCIÓ ESQUERRA: Cerca i Exportació (Només Despensa) */}
                    {currentView === 'pantry' && (
                        // Contenidor per a la barra de cerca i exportació
                        <div className="flex gap-2 items-center w-full max-w-md mx-auto">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Cerca productes..."
                                    className="pl-10 pr-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none w-full"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleExportToExcel}
                                // ⭐ AJUST: Amagat en mòbil, només visible en 'md' (PC) i superiors
                                className="hidden md:block p-2 rounded-md box-shadow-neomorphic-button text-gray-700 transition-all-smooth hover:scale-105 flex-shrink-0"
                                aria-label="Exportar a Excel"
                            >
                                <FileDown className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    {/* 2. SECCIÓ DRETA: Botons d'Ordenació (Només Llista) */}
                    {currentView === 'shoppingList' && (
                        // Contenidor per als botons d'ordenació, justificat a la dreta (sense ocupar tot l'ample)
                        <div className={`flex gap-2 items-center w-full justify-end sm:w-auto`}>
                            {/* Botó de Vista (Grid/List) - MANTENIM A LA BARRA SUPERIOR PER LA COMPATIBILITAT DEL FLIP-CARD */}
                            <button 
                                onClick={toggleDisplayMode} 
                                className={`p-2 rounded-md transition-all-smooth ${
                                    displayMode === 'list' 
                                        ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                        : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                                }`}
                                aria-label={displayMode === 'list' ? "Vista quadrícula" : "Vista llista"}
                            >
                                {/* ✅ FIX Aplicat: List i Grid3X3 ara estan importats al capdamunt */}
                                {displayMode === 'list' ? <Grid3X3 className="w-5 h-5" /> : <List className="w-5 h-5" />}
                            </button>

                            {/* Botó de Mode Reordenació de Productes */}
                            <button
                                onClick={toggleReorderMode}
                                className={`p-2 rounded-md transition-all-smooth ${isReorderMode ? 'box-shadow-neomorphic-button-inset text-blue-600' : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'}`}
                                aria-label={isReorderMode ? "Desactivar reordenació" : "Activar reordenació de productes"}
                                title="Reordenar Productes (Drag & Drop)"
                            >
                                <RotateCcw className="w-5 h-5" />
                            </button>
                            
                            {/* Botó de Reordenar Seccions (Obre Modal) */}
                            <button
                                onClick={openSectionOrderModal}
                                className="p-2 rounded-md box-shadow-neomorphic-button text-gray-700 transition-all-smooth hover:scale-105"
                                aria-label="Reordenar Seccions"
                                title="Reordenar Seccions"
                            >
                                <ArrowUpDown className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>
            </div>
            {/* FI CONTENIDOR SUPERIOR */}

            {/* Vistes principals (Sense canvis, només canvi de prop) */}
            {currentView === 'pantry' && (
                <div className="space-y-6">
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">Elements a la despensa ({pantryItems.length})</h2>
                        {pantryItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">{searchTerm ? 'No s\'han trobat elements amb aquest criteri de cerca.' : 'No hi ha elements. Afegeix-ne alguns per començar!'}</p>
                        ) : displayMode === 'grid' ? (
                            <div className={`${gridClasses} gap-4`}>
                                {pantryItems.map(item => (
                                    <ProductCard
                                        key={item.id}
                                        item={item}
                                        onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                        onAction={() => afegirDeDespensaALlista(item)}
                                        actionLabel={`Clica per afegir ${item.name} a la llista`}
                                        additionalClasses="box-shadow-neomorphic-element cursor-pointer hover:box-shadow-neomorphic-element-hover"
                                        showEditButton={true}
                                        requireDoubleClick={false}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">{renderListItems(pantryItems, false, false)}</div>
                        )}
                    </div>

                    {items.filter(item => item.isInShoppingList && !item.isBought).length > 0 && (
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-700">Elements pendents de compra ({items.filter(item => item.isInShoppingList && !item.isBought).length})</h2>
                            {displayMode === 'grid' ? (
                                <div className={`${gridClasses} gap-4`}>
                                    {items.filter(item => item.isInShoppingList && !item.isBought).map(item => (
                                        <ProductCard
                                            key={item.id}
                                            item={item}
                                            onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                            onAction={() => afegirDeDespensaALlista(item)}
                                            actionLabel={`Clica per treure ${item.name} de la llista`}
                                           additionalClasses="box-shadow-neomorphic-element-red cursor-pointer"
                                            showEditButton={true}
                                            requireDoubleClick={false}
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">{renderListItems(items.filter(item => item.isInShoppingList && !item.isBought), false, false)}</div>
                            )}
                        </div>
                    )}
                </div>
            )}
            
            {currentView === 'shoppingList' && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-6">
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-700">Productes per comprar ({unboughtItems.length})</h2>
                                {isReorderMode && (<span className="text-sm text-blue-600 font-medium">Mode reordenació actiu</span>)}
                            </div>
                            
                            {unboughtItems.length === 0 ? (
                                <p className="text-gray-600 text-center py-4">No hi ha productes pendents a la teva llista de la compra.</p>
                            ) : (
                                <Droppable droppableId="unbought-sections" type="SECTION">
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                                            {groupedUnboughtItems.map((group, index) => (
                                                <DraggableSection
                                                    key={group.section}
                                                    section={group.section}
                                                    items={group.items}
                                                    sectionIndex={index}
                                                    displayMode={displayMode} 
                                                    gridClasses={gridClasses}
                                                    handleToggleBought={handleToggleBought}
                                                    renderListItems={renderListItems}
                                                    isReorderMode={isReorderMode}
                                                />
                                            ))}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            )}
                        </div>
                        
                        {boughtItems.length > 0 && (
                            <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                                <button
                                    onClick={() => setShowClearConfirmModal(true)} 
                                    className="w-full px-4 py-3 rounded-md font-bold text-green-500 clear-bought-button-inset transition-all-smooth flex items-center justify-center"
                                    aria-label={`Netejar i arxivar ${boughtItems.length} productes comprats`}
                                >
                                    Neteja elements comprats
                                </button>
                            </div>
                        )}

                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full space-y-4">
                            <h2 className="text-xl font-bold text-gray-700">Productes comprats ({boughtItems.length})</h2>
                            {boughtItems.length === 0 ? (
                                <p className="text-gray-600 text-center py-4">Encara no hi ha productes comprats.</p>
                            ) : groupedBoughtItems.map((group) => (
                                <div key={group.section} className="border-t border-gray-300 pt-4">
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">{group.section || 'Sense Secció'} ({group.items.length})</h3>
                                    {displayMode === 'grid' ? ( 
                                        <div className={`${gridClasses} gap-4`}>
                                            {group.items.map(item => (
                                                <ProductCard
                                                    key={item.id}
                                                    item={item}
                                                    onEdit={null}
                                                    onAction={() => handleToggleBought(item, item.isBought)}
                                                    actionLabel={`Doble clic per desmarcar ${item.name} com comprat i netejar quantitat`}
                                                    additionalClasses="box-shadow-neomorphic-element-bought"
                                                    showEditButton={false}
                                                    requireDoubleClick={true}
                                                    opacity={0.75}
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="space-y-2">{renderListItems(group.items, false, true)}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </DragDropContext>
            )}

            {/* ⭐ BOTÓ FLOTANT REUBICAT I CONDICIONAL (Només a la Despensa) */}
            {currentView === 'pantry' && (
                <button
                    onClick={openAddModal}
                    // ⭐ AJUST: El padding inferior 'pb-20' a l'App.jsx fa l'espai
                    className="fixed bottom-20 right-6 p-4 rounded-full bg-green-500 text-white 
                        box-shadow-neomorphic-fab hover:bg-green-600 transition-all-smooth z-40 
                        shadow-xl flex items-center justify-center transform hover:scale-105"
                    aria-label="Afegir nou producte"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}
            {/* FI BOTÓ FLOTANT */}

            {/* Modals (Sense canvis) */}
            {showEditModal && editingItem && (
                <EditItemModal 
                    item={editingItem} 
                    onClose={() => { setShowEditModal(false); setEditingItem(null); }} 
                    onSave={handleUpdateItem} 
                    onDelete={handleDeleteItem} 
                    availableSections={availableSections} 
                />
            )}

            {showAuthModal && (
                <AuthModal
                    onLogin={onLogin}
                    onRegister={onRegister}
                    onLogout={onLogout}
                    userEmail={userEmail}
                    errorMessage={authErrorMessage}
                    onClose={() => setShowAuthModal(false)}
                    onForgotPassword={onPasswordReset}
                />
            )}
            
            {showListManagerModal && (
                <ListManagerModal
                    lists={lists}
                    activeListId={activeListId}
                    setActiveListId={setActiveListId}
                    onAddList={addList}
                    onUpdateListName={updateListName}
                    onDeleteList={deleteList}
                    setFeedback={setFeedback}
                    onClose={() => setShowListManagerModal(false)}
                />
            )}

            {showSectionOrderModal && (
                <SectionOrderModal
                    items={items}
                    sectionOrder={sectionOrder}
                    activeListId={activeListId}
                    onSave={updateAllSectionsOrder}
                    onClose={() => setShowSectionOrderModal(false)}
                />
            )}

            {expandedImage && (
                <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />
            )}
            
            {showAddModal && (
                <AddProductModal 
                    onClose={() => setShowAddModal(false)}
                    availableSections={availableSections}
                    onAddItem={handleAddItem}
                    onFileUpload={handleFileUpload}
                    cleanImageUrl={cleanImageUrl}
                />
            )}

            {showClearConfirmModal && (
                <ConfirmationModal
                    title="" 
                    message="Estàs segur que vols eliminar tots els elements comprats de la llista de la compra?"
                    confirmLabel="Confirma"
                    onConfirm={executeClearCompletedItems}
                    onCancel={() => setShowClearConfirmModal(false)}
                    isDestructive={false} 
                />
            )}
            
            {/* ⭐ INTEGRACIÓ DE LA BARRA DE NAVEGACIÓ INFERIOR AMB ELS TRES BOTONS COMUNS */}
            <BottomNavBar
                displayMode={displayMode} // Utilitzem displayMode actual
                onToggleView={toggleDisplayMode} // Funció per canviar mode
                onOpenAuthModal={openAuthModal} // Funció per obrir modal d'usuari
                onOpenListManagerModal={openListManagerModal} // Funció per obrir gestor de llistes
            />
            {/* FI INTEGRACIÓ */}

        </div>
    );
}

export default App;
