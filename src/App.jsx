import React, { useState, useEffect, useCallback, useMemo } from 'react';
// Hem canviat SortAlphaAsc per SortAsc (ja arreglat de l'error anterior)
import { ShoppingBag, Plus, User, Search, Grid3x3 as Grid3X3, List, FileDown, Import as SortAsc } from 'lucide-react'; 
import * as XLSX from 'xlsx';

// Components
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import ImageModal from './components/ImageModal';
import ProductCard from './components/ProductCard';
import AddProductModal from './components/AddProductModal'; 

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
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState('info');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [expandedImage, setExpandedImage] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [currentListName, setCurrentListName] = useState('Llista Principal');
    // Estats per controlar l'ordenació
    const [shoppingListSort, setShoppingListSort] = useState('default');
    const [isReorderMode, setIsReorderMode] = useState(false);
    
    // Hook de Firebase
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
        uploadFromExcel,
        updateItemOrder,
        updateSectionOrder,
        handleLogin,
        handleRegister,
        handlePasswordReset,
        handleLogout,
        cleanImageUrl
    } = useFirebase();

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
            setFeedbackMessage("Element afegit correctament!");
            setFeedbackType('success');
            return true;
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
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
                setFeedbackMessage(`S'han pujat ${result.successfulUploads} productes des de l'Excel! ${result.skippedItems > 0 ? `(${result.skippedItems} files buides saltades)` : ''}`);
                setFeedbackType('success');
            } catch (error) {
                setFeedbackMessage(error.message);
                setFeedbackType('error');
            }
        };
        reader.readAsArrayBuffer(file);
    };

    // Funció per exportar a Excel (SENSE CANVIS)
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
            
            const fileName = `${currentListName}_${new Date().toISOString().split('T')[0]}.xlsx`;
            XLSX.writeFile(wb, fileName);
            
            setFeedbackMessage("Llista exportada correctament!");
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage("Error exportant la llista: " + error.message);
            setFeedbackType('error');
        }
    };

    const afegirDeDespensaALlista = useCallback(async (item) => {
        try {
            const result = await toggleItemInShoppingList(item);
            setFeedbackMessage(`'${item.name}' ${result ? 'afegit a la llista de la compra' : 'tret de la llista de la compra'}!`);
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    }, [toggleItemInShoppingList]);

    const handleUpdateItem = useCallback(async (id, updatedData) => {
        try {
            await updateItem(id, updatedData);
            setFeedbackMessage("Element actualitzat correctament!");
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    }, [updateItem]);

    const handleDeleteItem = useCallback(async (item) => {
        const confirmDelete = window.confirm(`Estàs segur que vols eliminar "${item.name}"?`);
        if (!confirmDelete) return;

        try {
            await deleteItem(item);
            setFeedbackMessage("Element eliminat correctament!");
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    }, [deleteItem]);

    // MODIFICAT: Ara la lògica de netejar quantitat és a useFirebase.js
    const handleToggleBought = useCallback(async (item, isBought) => {
        try {
            // Passem l'estat oposat
            const newStatus = !isBought; 
            const result = await toggleBought(item, newStatus);
            
            // La lògica de netejar quantitat si es desmarca (newStatus=false) es fa dins de useFirebase.js
            
            setFeedbackMessage(`Element ${result ? 'marcat com a comprat' : 'marcat com a pendent'}!`);
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    }, [toggleBought]);

    // Funcions d'autenticació amb feedback (SENSE CANVIS)
    const onLogin = useCallback(async (email, password) => {
        setAuthErrorMessage("");
        try {
            await handleLogin(email, password);
            setShowAuthModal(false);
            setFeedbackMessage("Sessió iniciada correctament!");
            setFeedbackType('success');
        } catch (error) {
            setAuthErrorMessage("Error iniciant sessió: " + error.message);
        }
    }, [handleLogin]);

    const onRegister = useCallback(async (email, password) => {
        setAuthErrorMessage("");
        try {
            await handleRegister(email, password);
            setShowAuthModal(false);
            setFeedbackMessage("Registre completat i sessió iniciada!");
            setFeedbackType('success');
        } catch (error) {
            setAuthErrorMessage("Error registrant: " + error.message);
        }
    }, [handleRegister]);

    const onPasswordReset = useCallback(async (email) => {
        setAuthErrorMessage("");
        try {
            await handlePasswordReset(email);
            setFeedbackMessage("S'ha enviat un correu de recuperació de contrasenya.");
            setFeedbackType('success');
        } catch (error) {
            setAuthErrorMessage("Error enviant correu de recuperació: " + error.message);
        }
    }, [handlePasswordReset]);

    const onLogout = useCallback(async () => {
        try {
            await handleLogout();
            setShowAuthModal(false);
            setFeedbackMessage("Sessió tancada correctament!");
            setFeedbackType('info');
        } catch (error) {
            setFeedbackMessage("Error tancant sessió: " + error.message);
            setFeedbackType('error');
        }
    }, [handleLogout]);

    // NOU: Funció per ordenar productes alfabèticament
    const sortItemsAlphabetically = (itemsList) => {
        return [...itemsList].sort((a, b) => {
            return a.name.localeCompare(b.name);
        });
    };
    
    // NOU: Funció per agrupar per secció i ordenar.
    // L'ordenació és: 1. Segons l'ordre personalitzat guardat. 2. Segons DEFAULT_SECTION_ORDER. 3. Alfabèticament.
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

        // 2. Ordenem els grups/seccions segons l'ordre personalitzat, després DEFAULT_SECTION_ORDER
        const sortedSections = Object.keys(groups).sort((a, b) => {
            // Primer mirem si tenen ordre personalitzat
            const customOrderA = sectionOrder[a];
            const customOrderB = sectionOrder[b];
            
            if (customOrderA !== undefined && customOrderB !== undefined) {
                return customOrderA - customOrderB;
            }
            if (customOrderA !== undefined) return -1;
            if (customOrderB !== undefined) return 1;
            
            // Si no tenen ordre personalitzat, usem l'ordre per defecte
            const indexA = DEFAULT_SECTION_MAP.has(a) ? DEFAULT_SECTION_MAP.get(a) : DEFAULT_SECTION_ORDER.length;
            const indexB = DEFAULT_SECTION_MAP.has(b) ? DEFAULT_SECTION_MAP.get(b) : DEFAULT_SECTION_ORDER.length;
            return indexA - indexB;
        });

        // 3. Dins de cada grup, ordenem els elements per orderIndex o alfabèticament
        const sortedGroups = sortedSections.map(section => ({
            section: section,
            items: groups[section].sort((a, b) => {
                // Si tenen orderIndex, ordenem per això
                if (a.orderIndex !== undefined && b.orderIndex !== undefined) {
                    return a.orderIndex - b.orderIndex;
                }
                if (a.orderIndex !== undefined) return -1;
                if (b.orderIndex !== undefined) return 1;
                // Si no, ordenem alfabèticament
                return a.name.localeCompare(b.name);
            })
        }));

        return sortedGroups;
    };

    // Filtres per als elements amb cerca (SENSE CANVIS)
    const filterItems = (itemsList) => {
        if (!searchTerm) return itemsList;
        return itemsList.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.section && item.section.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    // A la Despensa, els items es mostren ordenats alfabèticament
    const pantryItems = sortItemsAlphabetically(filterItems(items.filter(item => !item.isInShoppingList || item.isBought)));
    // La Llista de Compra ara utilitza la nova lògica d'agrupació i ordenació
    const itemsFromPantryInShoppingList = filterItems(items.filter(item => item.isInShoppingList && !item.isBought));
    const unboughtItems = filterItems(items.filter(item => item.isInShoppingList && !item.isBought));
    const boughtItems = filterItems(items.filter(item => item.isInShoppingList && item.isBought));
    
    // NOU: Agrupació de la llista de la compra per seccions
    const groupedUnboughtItems = groupItemsBySection(unboughtItems);
    const groupedBoughtItems = groupItemsBySection(boughtItems);

    const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

    // Funció per renderitzar elements en format llista (Ajustada per utilitzar DOBLE CLIC)
    const renderListItems = (itemsList, isRed = false, requireDoubleClick = false) => {
        return itemsList.map(item => (
            <div 
                key={item.id} 
                className={`list-item ${isRed ? 'box-shadow-neomorphic-element-red' : 'box-shadow-neomorphic-element'} transition-all-smooth`}
                // NOU: Ús de onDoubleClick en ambdós casos. requireDoubleClick només controla el missatge.
                onClick={(e) => { 
                    if (!requireDoubleClick) handleToggleBought(item, item.isBought);
                    // Si requereix doble clic, el clic simple no fa res
                }}
                onDoubleClick={(e) => { 
                    e.stopPropagation(); // Evitar clics parentals
                    handleToggleBought(item, item.isBought); 
                }}
                title={`Doble clic per ${item.isBought ? 'desmarcar i netejar quantitat' : 'marcar com comprat'} ${item.name}`}
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
    
    // Funció per a un hipotètic "mantenir premut" per a la reordenació
    const handleItemPressAndHold = (item) => {
        setFeedbackMessage(`Mantén premut i arrossega '${item.name}' per reordenar-lo dins la seva secció.`);
        setFeedbackType('info');
        setIsReorderMode(true);
    };
    
    const handleSectionPressAndHold = (sectionName) => {
        setFeedbackMessage(`Mantén premut i arrossega la secció '${sectionName || 'Sense Secció'}' per reordenar-la.`);
        setFeedbackType('info');
        setIsReorderMode(true);
    };
    
    // Funció per reordenar elements dins d'una secció
    const handleItemReorder = async (itemId, newIndex, sectionItems) => {
        try {
            // Actualitzem l'orderIndex de l'element arrossegat
            await updateItemOrder(itemId, newIndex);
            
            // Actualitzem els orderIndex dels altres elements de la secció
            const promises = sectionItems.map((item, index) => {
                if (item.id !== itemId) {
                    const adjustedIndex = index >= newIndex ? index + 1 : index;
                    return updateItemOrder(item.id, adjustedIndex);
                }
                return Promise.resolve();
            });
            
            await Promise.all(promises);
            setFeedbackMessage("Ordre actualitzat correctament!");
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage("Error actualitzant l'ordre: " + error.message);
            setFeedbackType('error');
        }
        setIsReorderMode(false);
    };
    
    // Funció per reordenar seccions
    const handleSectionReorder = async (sectionName, newIndex, allSections) => {
        try {
            // Actualitzem l'orderIndex de la secció arrossegada
            await updateSectionOrder(sectionName, newIndex);
            
            // Actualitzem els orderIndex de les altres seccions
            const promises = allSections.map((section, index) => {
                if (section !== sectionName) {
                    const adjustedIndex = index >= newIndex ? index + 1 : index;
                    return updateSectionOrder(section, adjustedIndex);
                }
                return Promise.resolve();
            });
            
            await Promise.all(promises);
            setFeedbackMessage("Ordre de seccions actualitzat correctament!");
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage("Error actualitzant l'ordre de seccions: " + error.message);
            setFeedbackType('error');
        }
        setIsReorderMode(false);
    };

    return (
        <div className="min-h-screen bg-[#f0f3f5] text-gray-700 flex flex-col p-4 sm:p-6">
            <header className="w-full mb-6 text-center relative">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Llista de la compra</h1>
                {userId && (
                    <button 
                        onClick={() => setShowAuthModal(true)} 
                        className="absolute top-0 right-0 p-2 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button transition-all-smooth hover:scale-110" 
                        aria-label="Menú d'usuari"
                    >
                        <User className="w-6 h-6 text-gray-700" />
                    </button>
                )}
                <p className="text-gray-700 text-lg font-semibold mt-2">{currentListName}</p>
            </header>

            {feedbackMessage && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 
                    rounded-md shadow-lg z-50 transition-opacity duration-300 opacity-100 flex items-center 
                    ${feedbackType === 'info' ? 'bg-blue-500' : feedbackType === 'success' ? 'bg-green-500' : 'bg-red-500'} `}>
                    {feedbackMessage}
                </div>
            )}

            {/* Botons de navegació */}
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

                {/* Botons de vista i cerca */}
                <div className="flex justify-center items-center gap-4 flex-wrap">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setDisplayMode('grid')} 
                            className={`p-2 rounded-md transition-all-smooth ${
                                displayMode === 'grid' 
                                    ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                    : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                            }`}
                            aria-label="Vista quadrícula"
                        >
                            <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button 
                            onClick={() => setDisplayMode('list')} 
                            className={`p-2 rounded-md transition-all-smooth ${
                                displayMode === 'list' 
                                    ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                    : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                            }`}
                            aria-label="Vista llista"
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Barra de cerca només a la despensa */}
                    {currentView === 'pantry' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cerca productes..."
                                className="pl-10 pr-4 py-2 rounded-md box-shadow-neomorphic-input focus:outline-none"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    )}
                    
                    {/* Botó d'exportació */}
                    {/* Botó d'exportació només a la despensa */}
                    {currentView === 'pantry' && (
                        <button 
                            onClick={handleExportToExcel}
                            className="p-2 rounded-md box-shadow-neomorphic-button text-gray-700 transition-all-smooth hover:scale-105"
                            aria-label="Exportar a Excel"
                        >
                            <FileDown className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Vistes principals */}
            {currentView === 'pantry' && (
                <div className="space-y-6">
                    {/* Elements a la despensa (ja venen ordenats alfabèticament a 'pantryItems') */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            Elements a la despensa ({pantryItems.length})
                        </h2>
                        {pantryItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">
                                {searchTerm ? 'No s\'han trobat elements amb aquest criteri de cerca.' : 'No hi ha elements. Afegeix-ne alguns per començar!'}
                            </p>
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
                                        requireDoubleClick={false} // Clic simple per afegir a llista
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
                    {itemsFromPantryInShoppingList.length > 0 && (
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-700">
                                Elements a la llista de la compra des de la despensa ({itemsFromPantryInShoppingList.length})
                            </h2>
                            {displayMode === 'grid' ? (
                                <div className={`${gridClasses} gap-4`}>
                                    {itemsFromPantryInShoppingList.map(item => (
                                        <ProductCard
                                            key={item.id}
                                            item={item}
                                            onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                            onAction={() => afegirDeDespensaALlista(item)}
                                            actionLabel={`Clica per treure ${item.name} de la llista`}
                                           additionalClasses="box-shadow-neomorphic-element-red cursor-pointer"
                                            showEditButton={true}
                                            requireDoubleClick={false} // Clic simple per treure de llista
                                        />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {renderListItems(itemsFromPantryInShoppingList, false, false)}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {currentView === 'shoppingList' && (
                <div className="space-y-6">
                    {/* NOU: Seccions per comprar (Agrupats i Ordenats) */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full space-y-4">
                        <h2 className="text-xl font-bold text-gray-700">
                            Productes per comprar ({unboughtItems.length})
                        </h2>
                        {unboughtItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">
                                No hi ha productes pendents a la teva llista de la compra.
                            </p>
                        ) : groupedUnboughtItems.map((group) => (
                            <div 
                                key={group.section} 
                                className="border-t border-gray-300 pt-4"
                                onTouchStart={() => handleSectionPressAndHold(group.section)}
                                onMouseDown={() => handleSectionPressAndHold(group.section)}
                            >
                                <h3 className="text-lg font-semibold mb-3 text-red-500">
                                    {group.section || 'Sense Secció'} ({group.items.length})
                                </h3>
                                {displayMode === 'grid' ? (
                                    <div className={`${gridClasses} gap-4`}>
                                        {group.items.map(item => (
                                            <ProductCard
                                                key={item.id}
                                                item={item}
                                                onEdit={null}
                                                onAction={() => handleToggleBought(item, item.isBought)}
                                                actionLabel={`Doble clic per marcar ${item.name} com comprat`}
                                                additionalClasses="box-shadow-neomorphic-element-red"
                                                showEditButton={false}
                                                requireDoubleClick={true}
                                                onPressAndHold={() => handleItemPressAndHold(item)}
                                                isDraggable={isReorderMode}
                                            />
                                        ))}
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {renderListItems(group.items, true, true)} 
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* NOU: Seccions per comprats (Agrupats i Ordenats) AMB DOBLE CLIC PER DESMARCAR */}
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
                                onTouchStart={() => handleSectionPressAndHold(group.section)}
                                onMouseDown={() => handleSectionPressAndHold(group.section)}
                            >
                                <h3 className="text-lg font-semibold mb-3 text-gray-700">
                                    {group.section || 'Sense Secció'} ({group.items.length})
                                </h3>
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
                                                onPressAndHold={() => handleItemPressAndHold(item)}
                                                isDraggable={isReorderMode}
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
            )}

            {/* Botó flotant per afegir productes (només a la despensa) (SENSE CANVIS) */}
            {currentView === 'pantry' && (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="fixed bottom-6 right-6 p-4 rounded-full bg-green-500 text-white 
                        box-shadow-neomorphic-fab hover:bg-green-600 transition-all-smooth z-40 
                        shadow-xl flex items-center justify-center transform hover:scale-105"
                    aria-label="Afegir nou producte"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}

            {/* Modals (SENSE CANVIS) */}
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
                    displayMode={displayMode} 
                    setDisplayMode={setDisplayMode} 
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
        </div>
    );
}

export default App;
