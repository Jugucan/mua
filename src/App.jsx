import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ShoppingBag, Plus, User, Search, Grid3x3 as Grid3X3, List, FileDown, SortAsc } from 'lucide-react'; 
import * as XLSX from 'xlsx';

// Components
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import ImageModal from './components/ImageModal';
import ProductCard from './components/ProductCard';
import AddProductModal from './components/AddProductModal'; 
import ProductList from './components/ProductList'; // 🔥 Nou component amb drag & drop

// Hook personalitzat
import { useFirebase } from './hooks/useFirebase';

// Seccions per defecte
const DEFAULT_SECTION_ORDER = [
    'Fruita i Verdura', 
    'Carn i Peix',
    'Làctics', 
    'Pa i Pastisseria',
    'Begudes', 
    'Neteja', 
    'Higiene Personal', 
    'Altres',
    '' 
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
    const [shoppingListSort, setShoppingListSort] = useState('default'); // 'default' o 'manual'
    
    // Hook Firebase
    const {
        userId,
        userEmail,
        items,
        isAuthReady,
        addItem,
        updateItem,
        deleteItem,
        toggleItemInShoppingList,
        toggleBought,
        uploadFromExcel,
        updateItemOrder, // 🔥 Ara sí que el fem servir
        handleLogin,
        handleRegister,
        handlePasswordReset,
        handleLogout,
        cleanImageUrl
    } = useFirebase();

    // Seccions disponibles
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

    // Afegir element
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
    
    // Importar Excel
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

    // Exportar Excel
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

    // Afegir de la despensa a la llista
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

    // Update, delete i toggle
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

    const handleToggleBought = useCallback(async (item, isBought) => {
        try {
            const newStatus = !isBought; 
            const result = await toggleBought(item, newStatus);
            setFeedbackMessage(`Element ${result ? 'marcat com a comprat' : 'marcat com a pendent'}!`);
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    }, [toggleBought]);

    // Autenticació
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

    // Ordenació
    const sortItemsAlphabetically = (itemsList) => {
        return [...itemsList].sort((a, b) => a.name.localeCompare(b.name));
    };

    const groupItemsBySection = (itemsList) => {
        const groups = {};
        itemsList.forEach(item => {
            const sectionName = item.section || ''; 
            if (!groups[sectionName]) groups[sectionName] = [];
            groups[sectionName].push(item);
        });

        const sortedSections = Object.keys(groups).sort((a, b) => {
            const indexA = DEFAULT_SECTION_MAP.has(a) ? DEFAULT_SECTION_MAP.get(a) : DEFAULT_SECTION_ORDER.length;
            const indexB = DEFAULT_SECTION_MAP.has(b) ? DEFAULT_SECTION_MAP.get(b) : DEFAULT_SECTION_ORDER.length;
            return indexA - indexB;
        });

        return sortedSections.map(section => ({
            section,
            items: sortItemsAlphabetically(groups[section])
        }));
    };

    const filterItems = (itemsList) => {
        if (!searchTerm) return itemsList;
        return itemsList.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (item.section && item.section.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    };

    const pantryItems = sortItemsAlphabetically(filterItems(items.filter(item => !item.isInShoppingList || item.isBought)));
    const itemsFromPantryInShoppingList = filterItems(items.filter(item => item.isInShoppingList && !item.isBought));
    const unboughtItems = filterItems(items.filter(item => item.isInShoppingList && !item.isBought));
    const boughtItems = filterItems(items.filter(item => item.isInShoppingList && item.isBought));

    const groupedUnboughtItems = groupItemsBySection(unboughtItems);
    const groupedBoughtItems = groupItemsBySection(boughtItems);

    const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

    // Quan reordenem un producte
    const handleReorder = async (id, newIndex) => {
        try {
            await updateItemOrder(id, newIndex);
        } catch (error) {
            console.error("Error reordenant producte:", error);
        }
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

                {/* Controls de vista */}
                <div className="flex justify-center items-center gap-4 flex-wrap">
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setDisplayMode('grid')} 
                            className={`p-2 rounded-md transition-all-smooth ${
                                displayMode === 'grid' 
                                    ? 'box-shadow-neomorphic-button-inset text-green-500' 
                                    : 'box-shadow-neomorphic-button text-gray-700 hover:scale-105'
                            }`}
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
                        >
                            <List className="w-5 h-5" />
                        </button>
                    </div>

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

                    {/* 🔥 Botó per alternar ordre de la llista */}
                    {currentView === 'shoppingList' && (
                        <button 
                            onClick={() => setShoppingListSort(prev => prev === 'default' ? 'manual' : 'default')}
                            className={`p-2 rounded-md transition-all-smooth ${
                                shoppingListSort === 'default' 
                                    ? 'box-shadow-neomorphic-button text-gray-700 hover:scale-105' 
                                    : 'box-shadow-neomorphic-button-inset text-green-500'
                            }`}
                            title={shoppingListSort === 'default' ? "Ordenació per secció/alfabètica" : "Ordenació manual (drag & drop)"}
                        >
                            <SortAsc className="w-5 h-5" /> 
                        </button>
                    )}

                    <button 
                        onClick={handleExportToExcel}
                        className="p-2 rounded-md box-shadow-neomorphic-button text-gray-700 transition-all-smooth hover:scale-105"
                    >
                        <FileDown className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Vista Despensa */}
            {currentView === 'pantry' && (
                <div className="space-y-6">
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            Elements a la despensa ({pantryItems.length})
                        </h2>
                        {pantryItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">
                                {searchTerm ? 'No s\'han trobat elements.' : 'No hi ha elements.'}
                            </p>
                        ) : displayMode === 'grid' ? (
                            <div className={`${gridClasses} gap-4`}>
                                {pantryItems.map(item => (
                                    <ProductCard
                                        key={item.id}
                                        item={item}
                                        onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                        onAction={() => afegirDeDespensaALlista(item)}
                                        actionLabel={`Afegir ${item.name} a la llista`}
                                        additionalClasses="box-shadow-neomorphic-element cursor-pointer hover:box-shadow-neomorphic-element-hover"
                                        showEditButton={true}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {pantryItems.map(item => (
                                    <div key={item.id}>{item.name}</div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Vista Llista de la compra */}
            {currentView === 'shoppingList' && (
                shoppingListSort === 'manual' ? (
                    <ProductList items={unboughtItems} onReorder={handleReorder} />
                ) : (
                    <div className="space-y-6">
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full space-y-4">
                            <h2 className="text-xl font-bold text-gray-700">
                                Productes per comprar ({unboughtItems.length})
                            </h2>
                            {groupedUnboughtItems.map(group => (
                                <div key={group.section}>
                                    <h3 className="text-lg font-semibold mb-3 text-red-500">
                                        {group.section || 'Sense Secció'}
                                    </h3>
                                    <div className={`${gridClasses} gap-4`}>
                                        {group.items.map(item => (
                                            <ProductCard
                                                key={item.id}
                                                item={item}
                                                onAction={() => handleToggleBought(item, item.isBought)}
                                                requireDoubleClick={true}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}

            {currentView === 'pantry' && (
                <button
                    onClick={() => setShowAddModal(true)}
                    className="fixed bottom-6 right-6 p-4 rounded-full bg-green-500 text-white"
                >
                    <Plus className="w-8 h-8" />
                </button>
            )}

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
