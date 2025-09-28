import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Shopping Bag, Plus, User, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';

// Components
import AuthModal from './components/AuthModal';
import EditItemModal from './components/EditItemModal';
import ImageModal from './components/ImageModal';
import ProductCard from './components/ProductCard';
// NOU: Importem el modal per afegir productes
import AddProductModal from './components/AddProductModal'; 

// Hook personalitzat
import { useFirebase } from './hooks/useFirebase';

function App() {
    // Estats locals
    // ESTEM ELIMINANT: newItemName, newItemQuantity, newItemIcon, newItemSection de l'estat local d'App.jsx
    const [currentView, setCurrentView] = useState('pantry');
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState('info');
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState("");
    const [editingItem, setEditingItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [displayMode, setDisplayMode] = useState('grid');
    const [expandedImage, setExpandedImage] = useState(null);
    // NOU ESTAT: Per controlar el modal d'afegir producte
    const [showAddModal, setShowAddModal] = useState(false); 

    // Hook de Firebase
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
        handleLogin,
        handleRegister,
        handlePasswordReset,
        handleLogout,
        cleanImageUrl
    } = useFirebase();

    // Seccions disponibles
    const availableSections = useMemo(() => {
        const sections = new Set([
            'Fruita i Verdura', 'Làctics', 'Carn i Peix', 'Pa i Pastisseria',
            'Begudes', 'Neteja', 'Higiene Personal', 'Altres'
        ]);
        items.forEach(item => {
            if (item.section) {
                sections.add(item.section);
            }
        });
        return Array.from(sections).sort();
    }, [items]);

    // Funció per alternar el flip d'un element
    const toggleFlip = useCallback((itemId) => {
        // Aquesta funció actualitza l'estat local dels items per fer el flip
        // No necessita Firebase ja que és només visual
        const updatedItems = items.map(item =>
            item.id === itemId ? { ...item, isFlipped: !item.isFlipped } : item
        );
        // Nota: Si no teniu una funció per actualitzar l'estat local dels items, 
        // aquesta lògica no funcionarà. Si el flip només és visual al component ProductCard, 
        // podeu eliminar aquesta funció i la crida a `onToggleFlip` de ProductCard. 
        // Si cal, ens ho pots preguntar i t'ajudo a netejar-ho.
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

    // Funció per afegir un element (MODIFICADA: rep itemData com a argument)
    const handleAddItem = async (itemData) => {
        try {
            await addItem(itemData);
            // set FeedbackMessage i Type es mantenen aquí, ja que són estats d'App.jsx
            setFeedbackMessage("Element afegit correctament!");
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    };
    
    // Funció per pujar arxiu (MANTINGUDA: gestió del fitxer a App.jsx)
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

    const handleToggleBought = useCallback(async (id, currentStatus) => {
        try {
            const result = await toggleBought(id, currentStatus);
            setFeedbackMessage(`Element ${result ? 'marcat com a comprat' : 'marcat com a pendent'}!`);
            setFeedbackType('success');
        } catch (error) {
            setFeedbackMessage(error.message);
            setFeedbackType('error');
        }
    }, [toggleBought]);

    // Funcions d'autenticació amb feedback
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

    // Filtres per als elements
    const pantryItems = items.filter(item => !item.isInShoppingList || item.isBought);
    const shoppingListItems = items.filter(item => item.isInShoppingList);
    const itemsFromPantryInShoppingList = items.filter(item => item.isInShoppingList &&
        !item.isBought);
    const unboughtItems = shoppingListItems.filter(item => !item.isBought);
    const boughtItems = shoppingListItems.filter(item => item.isBought);

    const gridClasses = 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

    return (
        <div className="min-h-screen bg-[#f0f3f5] text-gray-700 flex flex-col p-4 sm:p-6">
            <header className="w-full mb-6 text-center relative">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">Llista de la compra</h1>
                {userId && (
                    <button onClick={() => setShowAuthModal(true)} className="absolute top-0 right-0
                        p-2 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button" aria-label="Menú d'usuari">
                        <User className="w-6 h-6 text-gray-700" />
                    </button>
                )}
                <p className="text-gray-700 text-lg font-semibold mt-2">{userEmail ? `Usuari: ${userEmail}` : 'Mode anònim'}</p>
            </header>

            {feedbackMessage && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 
                    rounded-md shadow-lg z-50 transition-opacity duration-300 opacity-100 flex items-center 
                    ${feedbackType === 'info' ? 'bg-blue-500' : feedbackType === 'success' ? 'bg-green-500' : 'bg-red-500'} `}>
                    {feedbackMessage}
                </div>
            )}

            <div className="w-full max-w-full flex flex-col sm:flex-row justify-center gap-4 mb-6 mx-auto">
                <div className="flex justify-center gap-4">
                    <button onClick={() => setCurrentView('pantry')} className={`px-6 py-3 rounded-md 
                        font-bold transition-all box-shadow-neomorphic-button ${currentView === 'pantry' ? 'box-shadow-neomorphic-button-inset text-green-500' : 'text-gray-700'} `}>
                        Despensa ({pantryItems.length})
                    </button>
                    <button onClick={() => setCurrentView('shoppingList')} className={`px-6 py-3 
                        rounded-md font-bold transition-all box-shadow-neomorphic-button ${currentView === 'shoppingList' ? 'box-shadow-neomorphic-button-inset text-green-500' : 'text-gray-700'}`}>
                        Llista ({shoppingListItems.length})
                    </button>
                </div>
            </div>

            {/* AQUESTA SECCIÓ HA ESTAT ELIMINADA: EL FORMULARI D'AFEGIR ELEMENTS */}
            {/* Vistes principals (resta del codi de les targetes) */}
            {currentView === 'pantry' && (
                <div className="space-y-6">
                    {/* Elements a la despensa */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container 
                        mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">Elements a la despensa 
                            ({pantryItems.length})</h2>
                        {pantryItems.length === 0 ?
                            (
                                <p className="text-gray-600 text-center py-4">No hi ha elements. Afegeix-ne 
                                    alguns per començar!</p>
                            ) : (
                                <div className={`${gridClasses} gap-4`}>
                                    {pantryItems.map(item => (
                                        <ProductCard
                                            key={item.id}
                                            item={item}
                                            onToggleFlip={toggleFlip}
                                            onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                            onAction={() => afegirDeDespensaALlista(item)}
                                            actionLabel={`Clica per afegir ${item.name} a la llista`}
                                            additionalClasses="box-shadow-neomorphic-element cursor-pointer hover:box-shadow-neomorphic-element-hover"
                                        />

                                    ))}
                                </div>
                            )}
                    </div>

                    {/* NOVA SECCIÓ: Elements a la llista de la compra des de la despensa */}
                    {itemsFromPantryInShoppingList.length > 0 && (
                        <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container 
                            mx-auto w-full">
                            <h2 className="text-xl font-bold mb-4 text-gray-700">Elements a la llista de la 
                                compra des de la despensa ({itemsFromPantryInShoppingList.length})</h2>

                            <div className={`${gridClasses} gap-4`}>
                                {itemsFromPantryInShoppingList.map(item => (
                                    <ProductCard
                                        key={item.id}
                                        item={item}
                                        onToggleFlip={toggleFlip}
                                        onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                        onAction={() => afegirDeDespensaALlista(item)}
                                        actionLabel={`Clica per treure ${item.name} de la llista`}
                                        additionalClasses="box-shadow-neomorphic-element-green cursor-pointer"

                                    />

                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {currentView === 'shoppingList' && (
                <div className="space-y-6">
                    {/* Elements per comprar */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container 
                        mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">Productes per comprar 
                            ({unboughtItems.length})</h2>
                        {unboughtItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">No hi 
                                ha productes pendents a la 
                                teva llista de la compra.</p>
                        ) : (
                            <div className={`${gridClasses} gap-4`}>
                                {unboughtItems.map(item => (
                                    <ProductCard
                                        key={item.id}
                                        item={item}
                                        onToggleFlip={toggleFlip}
                                        onEdit={(item) => { setEditingItem(item); setShowEditModal(true);
                                        }}
                                        onAction={() => handleToggleBought(item.id, item.isBought)}
                                        actionLabel={`Doble clic per marcar ${item.name} com comprat`}
                                        additionalClasses="box-shadow-neomorphic-element-green"

                                    />

                                ))}
                            </div>
                        )}
                    </div>

                    {/* Elements comprats */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container 
                        mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">Productes comprats 
                            ({boughtItems.length})</h2>
                        {boughtItems.length === 0 ?
                            (
                                <p className="text-gray-600 text-center py-4">Encara no hi ha productes 
                                    comprats.</p>
                            ) : (
                                <div className={`${gridClasses} gap-4`}>
                                    {boughtItems.map(item => (
                                        <ProductCard
                                            key={item.id}
                                            item={item}
                                            onToggleFlip={toggleFlip}
                                            onEdit={(item) => { setEditingItem(item); setShowEditModal(true); }}
                                            onAction={() => handleToggleBought(item.id, item.isBought)}
                                            actionLabel={`Doble clic per desmarcar ${item.name} com comprat`}
                                            additionalClasses="box-shadow-neomorphic-element-bought"
                                            opacity={0.75}

                                        />

                                    ))}
                                </div>
                            )}
                    </div>
                </div>
            )}

            {/* BOTÓ FLOTANT PER AFEGIR PRODUCTES (FAB) */}
            <button
                onClick={() => setShowAddModal(true)}
                className="fixed bottom-6 right-6 p-4 rounded-full bg-green-500 text-white 
                    box-shadow-neomorphic-fab hover:bg-green-600 transition-all z-40 
                    shadow-xl flex items-center justify-center transform hover:scale-105"
                aria-label="Afegir nou producte"
            >
                <Plus className="w-8 h-8" />
            </button>


            {/* Modals existents */}
            {showEditModal && editingItem && (
                <EditItemModal item={editingItem} onClose={() => { setShowEditModal(false); 
                    setEditingItem(null); }} onSave={handleUpdateItem} onDelete={handleDeleteItem} 
                    availableSections={availableSections} />
            )}

            {showAuthModal && (
                <AuthModal onLogin={onLogin} onRegister={onRegister} onLogout={onLogout} 
                    userEmail={userEmail} errorMessage={authErrorMessage} onClose={() => 
                    setShowAuthModal(false)} onForgotPassword={onPasswordReset} 
                    displayMode={displayMode} setDisplayMode={setDisplayMode} />
            )}

            {expandedImage && (
                <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />
            )}
            
            {/* NOU MODAL INTEGRAT */}
            {showAddModal && (
                <AddProductModal 
                    onClose={() => setShowAddModal(false)}
                    availableSections={availableSections}
                    onAddItem={handleAddItem} // Passem la funció d'afegir element
                    onFileUpload={handleFileUpload} // Passem la funció de pujar Excel
                    cleanImageUrl={cleanImageUrl}
                />
            )}
        </div>
    );
}

export default App;
