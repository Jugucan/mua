import React, { useState, useEffect, useCallback, useMemo } from 'react';
// ⭐ ATENCIÓ: Eliminem RotateCcw i ArrowUpDown de l'import d'App.jsx, ja que s'usen al nou component.
import { ShoppingBag, Plus, User, Search, Grid3x3 as Grid3X3, List, FileDown, ListChecks, Trash2 } from 'lucide-react'; 
import * as XLSX from 'xlsx';

// ⭐ NOU IMPORT: Importem el nou menú de navegació inferior
import BottomNavBar from './components/BottomNavBar'; // <--- AFEGIT

// Components
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import ImageModal from './components/ImageModal';
import ProductCard from './components/ProductCard';
import AddProductModal from './components/AddProductModal';
import DraggableSection from './components/DraggableSection';
import ListManagerModal from './components/ListManagerModal';
import SectionOrderModal from './components/SectionOrderModal'; 
import ConfirmationModal from './components/ConfirmationModal'; 
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

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
    // ⭐ ESTAT DE VISTA MANTINGUT
    const [isGridView, setIsGridView] = useState(true); 
    const [searchTerm, setSearchTerm] = useState('');
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState('info');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false); // <--- MANTINGUT
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
    } = useFirebase();
    
    // ⭐ FUNCIÓ PER CANVIAR VISTA (Passada a BottomNavBar)
    const toggleDisplayMode = useCallback(() => {
        setIsGridView(prev => !prev);
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
    
    // Calcula el nom de la llista activa (MILLORA DEL TÍTOL)
    const currentListName = useMemo(() => {
        const activeList = lists.find(l => l.id === activeListId);
        return activeList ? activeList.name : 'Carregant...';
    }, [lists, activeListId]);
    
    // Funció unificada per al feedback (passada al modal)
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

    // ⭐ FUNCIÓ MODIFICADA: Només obre el modal, ja no confirma directament
    const handleClearCompletedItems = useCallback(async () => {
        setShowClearConfirmModal(true);
    }, []); 

    // ⭐ NOU: Funció que s'executa quan es confirma l'acció al modal
    const executeClearCompletedItems = useCallback(async () => {
        setShowClearConfirmModal(false); // Tanquem el modal
        try {
            // Cridem la funció actualitzada de useFirebase
            const count = await clearCompletedItems(); 
            // Missatge de feedback actualitzat
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
            // ⭐ IMPORTANT: Primer mirem si tenim ordre personalitzat directe
            // Recordem que sectionOrder ja té les claus normalitzades (cadenes buides com '')
            const customOrderA = sectionOrder[a];
            const customOrderB = sectionOrder[b];
            
            // Si ambdues tenen ordre personalitzat, les ordenem per aquest ordre
            if (customOrderA !== undefined && customOrderB !== undefined) {
                return customOrderA - customOrderB;
            }
            // Si només A té ordre personalitzat, va primer
            if (customOrderA !== undefined) return -1;
            // Si només B té ordre personalitzat, va primer
            if (customOrderB !== undefined) return 1;
            
            // Si cap té ordre personalitzat, usem l'ordre per defecte
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

    // A la Despensa, els items es mostren ordenats alfabèticament
    // Incloem productes que no estan a la llista O que estan comprats
    const pantryItems = sortItemsAlphabetically(filterItems(items.filter(item => !item.isInShoppingList || item.isBought)));
    const unboughtItems = filterItems(items.filter(item => item.isInShoppingList && !item.isBought));
    const boughtItems = filterItems(items.filter(item => item.isInShoppingList && item.isBought));
    
    // Agrupació de la llista de la compra per seccions
    const groupedUnboughtItems = groupItemsBySection(unboughtItems);
    const groupedBoughtItems = groupItemsBySection(boughtItems);

    // ⭐ MANTINGUT
    const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

    // Funció per renderitzar elements en format llista
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
    
    // Activar/desactivar mode reordenació (Passada a BottomNavBar)
    const toggleReorderMode = () => {
        setIsReorderMode(!isReorderMode);
        setFeedback(
            !isReorderMode 
                ? "Mode reordenació activat! Ara pots arrossegar seccions i productes."
                : "Mode reordenació desactivat.", 
            'info'
        );
    };

    // ⭐ Funció per obrir el modal d'ordenació de seccions (Passada a BottomNavBar)
    const openSectionOrderModal = () => {
        setShowSectionOrderModal(true);
    };

    // ⭐ Funció per obrir el modal d'afegir producte (Passada a BottomNavBar)
    const openAddModal = () => {
        setShowAddModal(true);
    };
    
    // ⭐ FUNCIÓ CORREGIDA: Gestionar drag & drop (Sense canvis aquí, mantinc el teu codi)
    const handleDragEnd = async (result) => {
        if (!result.destination) return;

        const { source, destination, type } = result;

        if (type === 'SECTION') {
            // Reordenar seccions
            try {
                const sections = currentView === 'shoppingList' 
                    ? [...groupedUnboughtItems.map(g => g.section)]
                    : [];
                
                const [movedSection] = sections.splice(source.index, 1);
                sections.splice(destination.index, 0, movedSection);
                
                // ⭐ MILLORA: Actualitzem totes les seccions d'un cop
                console.log('🔄 Nou ordre de seccions:', sections);
                
                // Cridem updateSectionOrder per CADA secció amb el seu nou índex
                // Això sobreescriurà completament l'ordre a Firebase
                const updatePromises = sections.map((section, index) => 
                    updateSectionOrder(section, index)
                );
                
                await Promise.all(updatePromises);
                
                setFeedback("Ordre de seccions actualitzat!", 'success');
                
            } catch (error) {
                setFeedback("Error reordenant seccions: " + error.message, 'error');
                console.error('❌ Error:', error);
            }
        } else if (type === 'ITEM') {
            // Reordenar productes dins d'una secció
            if (source.droppableId === destination.droppableId) {
                try {
                    const sectionName = source.droppableId.replace('section-items-', '');
                    const sectionItems = currentView === 'shoppingList'
                        ? groupedUnboughtItems.find(g => g.section === sectionName)?.items || []
                        : [];
                    
                    const itemsCopy = [...sectionItems];
                    const [movedItem] = itemsCopy.splice(source.index, 1);
                    itemsCopy.splice(destination.index, 0, movedItem);
                    
                    // Actualitzar orderIndex dels productes
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
        // ⭐ CANVI AL PADDING INFERIOR: Afegim 'pb-24' per fer espai a la barra inferior fixa
        <div className="min-h-screen bg-[#f0f3f5] text-gray-700 flex flex-col p-4 sm:p-6 pb-24"> 
            <header className="w-full mb-6 text-center relative">
                {/* 1. Títol de la llista activa */}
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">{currentListName}</h1> 
                
                {/* BOTÓ DRETA: Menú Usuari (Sense canvis) */}
                <button 
                    onClick={() => setShowAuthModal(true)} 
                    className="absolute top-0 right-0 p-2 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button transition-all-smooth hover:scale-110" 
                    aria-label="Menú d'usuari"
                >
                    <User className="w-6 h-6 text-gray-700" />
                </button>
                
                {/* BOTÓ ESQUERRA: Gestor de Llistes (Sense canvis) */}
                <button 
                    onClick={() => setShowListManagerModal(true)} 
                    className="absolute top-0 left-0 p-2 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button transition-all-smooth hover:scale-110" 
                    aria-label="Gestionar llistes"
                >
                    <ListChecks className="w-6 h-6 text-gray-700" />
                </button>
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

                {/* ⭐ CANVIS PRINCIPALS: Contenidor de Cerca/Opcions */}
                {/* Aquesta secció ara conté només la cerca, l'exportació i els botons de vista de la Despensa */}
                <div className="flex justify-between items-center flex-wrap gap-2">
                    
                    {/* 1. SECCIÓ ESQUERRA (Només a la Despensa): Cerca i Exportació */}
                    {currentView === 'pantry' && (
                        <div className="flex gap-2 items-center w-full sm:w-auto">
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
                                className="p-2 rounded-md box-shadow-neomorphic-button text-gray-700 transition-all-smooth hover:scale-105 flex-shrink-0"
                                aria-label="Exportar a Excel"
                            >
                                <FileDown className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                    
                    {/* 2. SECCIÓ DRETA: Botons de Vista (Només a la Despensa) */}
                    {/* Aquests són els únics botons de funcionalitat que queden a dalt */}
                    {currentView === 'pantry' && (
                        <div className={`flex gap-2 items-center ${currentView === 'pantry' ? 'ml-auto' : 'mx-auto'}`}>
                            
                            {/* BOTONS DE VISTA (Només a la Despensa) */}
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => setIsGridView(true)} 
                                    className={`p-2 rounded-md transition-all-smooth ${
                                        isGridView 
                                            ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                            : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                                    }`}
                                    aria-label="Vista quadrícula"
                                >
                                    <Grid3X3 className="w-5 h-5" />
                                </button>
                                <button 
                                    onClick={() => setIsGridView(false)} 
                                    className={`p-2 rounded-md transition-all-smooth ${
                                        !isGridView
                                            ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                            : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                                    }`}
                                    aria-label="Vista llista"
                                >
                                    <List className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* ⭐ ELIMINAT OptionsMenu: La seva funcionalitat passa a BottomNavBar */}
                </div>
            </div>

            {/* Vistes principals (Sense canvis, isGridView ja està ajustat) */}
            {currentView === 'pantry' && (
                <div className="space-y-6">
                    {/* Elements a la despensa */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            Elements a la despensa ({pantryItems.length})
                        </h2>
                        {pantryItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">
                                {searchTerm ? 'No s\'han trobat elements amb aquest criteri de cerca.' : 'No hi ha elements. Afegeix-ne alguns per començar!'}
                            </p>
                        ) : isGridView ? ( 
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
                            <div className="space-y-2">
                                {renderListItems(pantryItems, false, false)}
                            </div>
                        )}
                    </div>

                    {/* Elements a la llista de la compra des de la despensa */}
                    {items.filter(item => item.isInShoppingList && !item.isBought).length > 0 && (
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-700">
                                Elements pendents de compra ({items.filter(item => item.isInShoppingList && !item.isBought).length})
                            </h2>
                            {isGridView ? ( 
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
                                <div className="space-y-2">
                                    {renderListItems(items.filter(item => item.isInShoppingList && !item.isBought), false, false)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {currentView === 'shoppingList' && (
                <DragDropContext onDragEnd={handleDragEnd}>
                    <div className="space-y-6">
                        {/* Seccions per comprar */}
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full space-y-4">
                            <div className="flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-700">
                                    Productes per comprar ({unboughtItems.length})
                                </h2>
                                {isReorderMode && (
                                    <span className="text-sm text-blue-600 font-medium">
                                        Mode reordenació actiu
                                    </span>
                                )}
                            </div>
                            
                            {unboughtItems.length === 0 ? (
                                <p className="text-gray-600 text-center py-4">
                                    No hi ha productes pendents a la teva llista de la compra.
                                </p>
                            ) : (
                                <Droppable droppableId="unbought-sections" type="SECTION">
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.droppableProps}
                                            className="space-y-4"
                                        >
                                            {groupedUnboughtItems.map((group, index) => (
                                                <DraggableSection
                                                    key={group.section}
                                                    section={group.section}
                                                    items={group.items}
                                                    sectionIndex={index}
                                                    displayMode={isGridView ? 'grid' : 'list'} 
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
                        
                        {/* BOTÓ DE NETEJA/ARXIVATGE MODIFICAT amb la nova classe CSS */}
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

                        {/* Seccions per comprats (Sense canvis, només canvi de displayMode) */}
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full space-y-4">
                            <h2 className="text-xl font-bold text-gray-700">
                                Productes comprats ({boughtItems.length})
                            </h2>
                            {boughtItems.length === 0 ? (
                                <p className="text-gray-600 text-center py-4">
                                    Encara no hi ha productes comprats.
                                </p>
                            ) : groupedBoughtItems.map((group) => (
                                <div 
                                    key={group.section} 
                                    className="border-t border-gray-300 pt-4"
                                >
                                    <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                        {group.section || 'Sense Secció'} ({group.items.length})
                                    </h3>
                                    {isGridView ? ( 
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
                                        <div className="space-y-2">
                                            {renderListItems(group.items, false, true)}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </DragDropContext>
            )}

            {/* ⭐ ELIMINAT: Botó flotant per afegir productes (la funció passa a BottomNavBar) */}
            {/* {currentView === 'pantry' && ( ... botó flotant ... )} */}

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
                // L'obertura d'aquest modal ara es gestiona des de BottomNavBar
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
            
            {/* ⭐ INTEGRACIÓ DE LA BARRA DE NAVEGACIÓ INFERIOR */}
            <BottomNavBar
                currentView={currentView}
                isGridView={isGridView}
                isReorderMode={isReorderMode}
                onToggleView={toggleDisplayMode}
                onOpenAddModal={openAddModal}
                onOpenSectionOrderModal={openSectionOrderModal}
                onToggleReorderMode={toggleReorderMode}
            />
            {/* FI INTEGRACIÓ */}

        </div>
    );
}

export default App;
