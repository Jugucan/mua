import React, { useState, useEffect, useCallback, useMemo } from 'react';

import { initializeApp } from 'firebase/app';

import {
    getAuth,
    signInAnonymously,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    sendPasswordResetEmail
} from 'firebase/auth';

import {
    getFirestore,
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';

import { ShoppingBag, Plus, Minus, User, X, Trash2, RotateCw, Edit, Grid, List, Share2,
    LogOut, ListPlus, FileUp } from 'lucide-react';

// Importa la llibreria per a Excel
import * as XLSX from 'xlsx';

// Configuració de Firebase (MANTENINT LA TEVA CONFIGURACIÓ ORIGINAL)
const firebaseConfig = {
    apiKey: "AlzaSyAxE2UATyzOYGgvqkApPPzu1rSnrAGrfkl",
    authDomain: "mua-app-eed40.firebaseapp.com",
    projectId: "mua-app-eed40",
    storageBucket: "mua-app-eed40.firebasestorage.app",
    messagingSenderId: "792715069043",
    appId: "1:792715069043:web:76d7596c5f3615312d0c06"
};

// Inicialitza Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'mua-app-da319'; // Mantinc el teu APP_ID

// Funció per validar i netejar URLs
const cleanImageUrl = (url) => {
    if (!url || typeof url !== 'string') return "";
    const cleanedUrl = url.trim();
    // Si ja té protocol, retorna-la tal com està
    if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
        return cleanedUrl;
    }
    // Si sembla una URL vàlida sense protocol, afegeix https://
    if (cleanedUrl.includes('.') && !cleanedUrl.includes(' ')) {
        return 'https://' + cleanedUrl;
    }
    // Si no és una URL vàlida, retorna buit
    return "";
};

// Modal per editar elements
const EditItemModal = ({ item, onClose, onSave, onDelete, availableSections }) => {
    const [editedName, setEditedName] = useState(item.name);
    const [editedQuantity, setEditedQuantity] = useState(item.quantity || "");
    const [editedIcon, setEditedIcon] = useState(item.icon || 'Shopping Bag');
    const [editedSecondIcon, setEditedSecondIcon] = useState(item.secondIcon || "");
    const [editedSection, setEditedSection] = useState(item.section || "");

    const handleSave = () => {
        onSave(item.id, {
            name: editedName,
            quantity: editedQuantity === "" ? null : editedQuantity.trim(),
            icon: cleanImageUrl(editedIcon),
            secondIcon: cleanImageUrl(editedSecondIcon),
            section: editedSection === "" ? null : editedSection.trim()
        });
        onClose();
    };

    const renderIcon = (iconString) => {
        if (iconString && (iconString.startsWith('http://') || iconString.startsWith('https://'))) {
            return (
                <img
                    src={iconString}
                    alt="icona"
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                        e.target.src = 'https://placehold.co/48x48/cccccc/000000?text=Error';
                    }}
                />
            );
        }
        return <ShoppingBag className="w-12 h-12 text-gray-600" />;
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-[#f0f3f5] p-6 rounded-lg w-full max-w-md relative box-shadow-neomorphic-container">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button"
                >
                    <X className="w-5 h-5" />
                </button>
                <h3 className="text-xl font-bold mb-4 text-gray-700">Edita l'element</h3>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'element</label>
                    <input
                        type="text"
                        className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantitat</label>
                    <input
                        type="text"
                        className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                        value={editedQuantity}
                        onChange={(e) => setEditedQuantity(e.target.value)}
                        placeholder="Ex: 1 kg, 2 litres..."
                    />
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icona Principal (URL)</label>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden box-shadow-neomorphic-element">
                            {renderIcon(editedIcon)}
                        </div>
                        <input
                            type="text"
                            placeholder="URL de la imatge (opcional)"
                            className="flex-grow p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                            value={editedIcon}
                            onChange={(e) => setEditedIcon(e.target.value)}
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Icona Secundària (URL - Opcional)</label>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 flex-shrink-0 rounded-md flex items-center justify-center overflow-hidden box-shadow-neomorphic-element">
                            {renderIcon(editedSecondIcon)}
                        </div>
                        <input
                            type="text"
                            placeholder="URL de la imatge secundària (opcional)"
                            className="flex-grow p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                            value={editedSecondIcon}
                            onChange={(e) => setEditedSecondIcon(e.target.value)}
                        />
                    </div>
                </div>
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secció / Passadís</label>
                    <input
                        type="text"
                        list="sections-datalist"
                        className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                        value={editedSection}
                        onChange={(e) => setEditedSection(e.target.value)}
                        placeholder="Ex: Làctics, Fruita i Verdura"
                    />
                    <datalist id="sections-datalist">
                        {availableSections.map((section, index) => (
                            <option key={index} value={section} />
                        ))}
                    </datalist>
                </div>
                <div className="flex justify-end space-x-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-[#f0f3f5] text-gray-700 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] font-semibold"
                    >
                        Cancella
                    </button>
                    <button
                        onClick={() => { onDelete(item); onClose(); }}
                        className="px-4 py-2 bg-[#f0f3f5] text-red-500 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] font-semibold"
                    >
                        Elimina
                    </button>
                    <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-[#f0f3f5] text-green-500 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] font-semibold"
                    >
                        Desa
                    </button>
                </div>
            </div>
        </div>
    );
};

// Modal per a la imatge expandida
const ImageModal = ({ src, onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center p-4 z-50"
            onClick={onClose}
        >
            <div className="relative" onClick={e => e.stopPropagation()}>
                <img
                    src={src}
                    alt="Expanded"
                    className="max-w-full max-h-[90vh] rounded-lg shadow-lg"
                />
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
        </div>
    );
};

// Modal d'autenticació
const AuthModal = ({ onClose, onLogin, onRegister, onLogout, userEmail, errorMessage, onForgotPassword, displayMode, setDisplayMode }) => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isRegistering, setIsRegistering] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isRegistering) {
            onRegister(email, password);
        } else {
            onLogin(email, password);
        }
    };

    const handleForgotPasswordClick = () => {
        const userEmail = prompt("Introdueix el teu correu electrònic per restablir la contrasenya:");
        if (userEmail) {
            onForgotPassword(userEmail);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-[#f0f3f5] p-6 rounded-lg w-full max-w-sm relative box-shadow-neomorphic-container">
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 p-1 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button"
                >
                    <X className="w-5 h-5" />
                </button>
                {userEmail ? (
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-700">El meu compte</h3>
                        <p className="text-gray-700 mb-4">Sessió iniciada com a <br /><span
                            className="font-semibold">{userEmail}</span></p>
                        <div className="mb-4">
                            <h4 className="text-lg font-bold mb-2">Preferències de visualització</h4>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={() => setDisplayMode('list')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg box-shadow-neomorphic-button-inset transition-all ${
                                        displayMode === 'list'
                                            ? 'bg-[#f0f3f5] text-green-500'
                                            : 'bg-[#f0f3f5] text-gray-700'
                                    }`}
                                >
                                    <List className="w-5 h-5" /> Vista llista
                                </button>
                                <button
                                    onClick={() => setDisplayMode('grid')}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg box-shadow-neomorphic-button-inset transition-all ${
                                        displayMode === 'grid'
                                            ? 'bg-[#f0f3f5] text-green-500'
                                            : 'bg-[#f0f3f5] text-gray-700'
                                    }`}
                                >
                                    <Grid className="w-5 h-5" /> Vista quadrícula
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={onLogout}
                            className="w-full bg-[#f0f3f5] text-red-500 font-bold py-2 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] mt-4"
                        >
                            <LogOut className="inline-block w-5 h-5 mr-2" /> Tanca sessió
                        </button>
                    </div>
                ) : (
                    <div>
                        <h3 className="text-xl font-bold mb-4 text-gray-700">
                            {isRegistering ? 'Registra\'t' : 'Inicia sessió'}
                        </h3>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Correu electrònic</label>
                                <input
                                    type="email"
                                    className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Contrasenya</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                            {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
                            <div className="flex flex-col gap-3">
                                <button
                                    type="submit"
                                    className="w-full bg-[#f0f3f5] text-green-500 font-bold py-2 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9]"
                                >
                                    {isRegistering ? 'Registra\'t' : 'Inicia sessió'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setIsRegistering(!isRegistering)}
                                    className="w-full bg-[#f0f3f5] text-gray-700 font-bold py-2 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9]"
                                >
                                    {isRegistering ? 'Ja tinc un compte' : 'No tinc un compte'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleForgotPasswordClick}
                                    className="text-sm text-blue-600 hover:underline"
                                >
                                    Has oblidat la contrasenya?
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};


function App() {
    const [userId, setUserId] = useState(null);
    const [userEmail, setUserEmail] = useState(null);
    const [items, setItems] = useState([]);
    const [newItemName, setNewItemName] = useState("");
    const [newItemQuantity, setNewItemQuantity] = useState("");
    const [newItemIcon, setNewItemIcon] = useState("");
    const [newItemSection, setNewItemSection] = useState("");
    const [currentView, setCurrentView] = useState('pantry');
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [feedbackType, setFeedbackType] = useState('info');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState('');
    const [editingItem, setEditingItem] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [displayMode, setDisplayMode] = useState('grid');
    const [numColumns, setNumColumns] = useState(2);
    const [expandedImage, setExpandedImage] = useState(null);

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

    // -------------------------------------------------------------------------
    // GESTIÓ D'AUTENTICACIÓ (NO CAL CANVIAR AQUÍ)
    // -------------------------------------------------------------------------
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                if (!user.isAnonymous) {
                    setUserId(user.uid);
                    setUserEmail(user.email);
                    console.log("Usuari registrat autenticat:", user.uid);
                } else {
                    setUserId(user.uid);
                    setUserEmail(null);
                    console.log("Usuari anònim recuperat:", user.uid);
                }
            } else {
                try {
                    const anonUserCredential = await signInAnonymously(auth);
                    setUserId(anonUserCredential.user.uid);
                    setUserEmail(null);
                    console.log("Sessió anònima iniciada:", anonUserCredential.user.uid);
                } catch (error) {
                    console.error("Error durant l'inici de sessió anònim:", error);
                    setUserId(crypto.randomUUID());
                    setUserEmail(null);
                    setFeedbackMessage("Error: No s'ha pogut connectar a la base de dades.");
                    setFeedbackType('error');
                }
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    // -------------------------------------------------------------------------
    // LECTURA DE DADES (🔴 CANVI 1: RUTA CORREGIDA)
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (db && userId && isAuthReady) {
            // 🟢 NOU CAMÍ CURT I CORRECTE: users/UID/items
            const itemsPath = `users/${userId}/items`;
            const itemsCollectionRef = collection(db, itemsPath);

            const q = query(itemsCollectionRef);
            const unsubscribe = onSnapshot(q, (snapshot) => {
                const itemsData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                const processedItems = itemsData.map(item => ({
                    ...item,
                    isInShoppingList: !!item.isInShoppingList,
                    isBought: !!item.isBought,
                    section: item.section || ''
                }));
                setItems(processedItems);
            }, (error) => {
                console.error("Error carregant elements:", error);
                setFeedbackMessage("Error carregant elements: " + error.message);
                setFeedbackType('error');
                setItems([]);
            });

            return () => unsubscribe();
        }
    }, [db, userId, isAuthReady]); // La dependència 'db' es manté, però no és estrictament necessària ja que 'db' és constant

    // Gestió de missatges
    useEffect(() => {
        if (feedbackMessage) {
            const timer = setTimeout(() => {
                setFeedbackMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [feedbackMessage]);

    // Renderitzat d'icones (No cal canviar aquí)
    const renderItemIcon = useCallback((item, className = "w-16 h-16") => {
        const iconSrc = item.isHovered && item.secondIcon ? item.secondIcon : item.icon;
        if (iconSrc && (iconSrc.startsWith('http://') || iconSrc.startsWith('https://'))) {
            return (
                <img
                    src={iconSrc}
                    alt="icona personalitzada"
                    className={`${className} object-cover rounded`}
                    onError={(e) => {
                        e.target.src = 'https://placehold.co/64x64/cccccc/000000?text=Error';
                    }}
                />
            );
        }
        return <ShoppingBag className={`${className} text-gray-600`} />;
    }, []);
    
    // -------------------------------------------------------------------------
    // ADDICCIÓ MANUAL D'ELEMENT (🔴 CANVI 2: RUTA CORREGIDA)
    // -------------------------------------------------------------------------
    const handleAddItem = useCallback(async (itemData) => {
        if (itemData.name.trim() === '' || !db || !userId) {
            setFeedbackMessage("No es pot afegir: Falta el nom de l'element.");
            setFeedbackType('error');
            return false;
        }

        try {
            // 🟢 NOU CAMÍ CURT I CORRECTE: users/UID/items
            const itemsPath = `users/${userId}/items`;
            const itemsCollectionRef = collection(db, itemsPath);

            await addDoc(itemsCollectionRef, {
                ...itemData,
                isBought: false,
                isInShoppingList: false,
                createdAt: serverTimestamp(),
                orderIndex: null
            });
            return true;
        } catch (error) {
            console.error("Error afegint element:", error);
            setFeedbackMessage("Error afegint element: " + error.message);
            setFeedbackType('error');
            return false;
        }
    }, [db, userId]);

    const handleNewItemFormSubmit = async () => {
        const itemData = {
            name: newItemName.trim(),
            quantity: newItemQuantity.trim(),
            icon: cleanImageUrl(newItemIcon) || 'ShoppingBag',
            secondIcon: cleanImageUrl(newItemIcon) || '',
            section: newItemSection.trim() === '' ? null : newItemSection.trim(),
        };
        const success = await handleAddItem(itemData);
        if (success) {
            setNewItemName('');
            setNewItemQuantity('');
            setNewItemIcon('');
            setNewItemSection('');
            setFeedbackMessage("Element afegit correctament!");
            setFeedbackType('success');
        }
    };
    
    // -------------------------------------------------------------------------
    // CÀRREGA EXCEL (🔴 CANVI 3: RUTA CORREGIDA)
    // -------------------------------------------------------------------------
    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) {
            return;
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (json.length < 2) {
                    setFeedbackMessage("El fitxer Excel no té dades o el format és incorrecte.");
                    setFeedbackType('error');
                    return;
                }

                const header = json[0].map(h => String(h).trim().toLowerCase());
                const rows = json.slice(1);
                
                // Busca les columnes amb més flexibilitat
                const nameIndex = header.findIndex(h => h.includes('nom'));
                const sectionIndex = header.findIndex(h => h.includes('secció') ||
                    h.includes('seccio'));
                const iconIndex = header.findIndex(h => h.includes('icona') &&
                    h.includes('principal'));
                const secondIconIndex = header.findIndex(h => h.includes('icona') &&
                    (h.includes('secundària') || h.includes('secundaria')));
                
                // Manca la columna de Quantitat, la busquem
                const quantityIndex = header.findIndex(h => h.includes('quantitat') || 
                    h.includes('qty') || h.includes('qnt'));


                if (nameIndex === -1) {
                    setFeedbackMessage("El fitxer Excel ha de contenir una columna amb 'Nom'.");
                    setFeedbackType('error');
                    return;
                }

                let successfulUploads = 0;
                let skippedItems = 0;
                const batch = writeBatch(db);
                
                // 🟢 NOU CAMÍ CURT I CORRECTE: users/UID/items
                const itemsPath = `users/${userId}/items`;
                const itemsCollectionRef = collection(db, itemsPath);

                for (const row of rows) {
                    const itemName = row[nameIndex] ? String(row[nameIndex]).trim() : '';

                    if (itemName === '') {
                        skippedItems++;
                        continue;
                    }

                    // Processa les imatges amb la nova funció de neteja
                    let itemIcon = iconIndex !== -1 && row[iconIndex] ?
                        cleanImageUrl(String(row[iconIndex])) : '';
                    let itemSecondIcon = secondIconIndex !== -1 && row[secondIconIndex] ?
                        cleanImageUrl(String(row[secondIconIndex])) : '';

                    const itemData = {
                        name: itemName,
                        quantity: quantityIndex !== -1 && row[quantityIndex] ?
                            String(row[quantityIndex]).trim() : '',
                        section: sectionIndex !== -1 && row[sectionIndex] ?
                            String(row[sectionIndex]).trim() : '',
                        icon: itemIcon,
                        secondIcon: itemSecondIcon,
                        isBought: false,
                        isInShoppingList: false,
                        createdAt: serverTimestamp(),
                        orderIndex: null
                    };

                    const newDocRef = doc(itemsCollectionRef);
                    batch.set(newDocRef, itemData);
                    successfulUploads++;
                }

                if (successfulUploads > 0) {
                    await batch.commit(); // ✅ Commit del batch
                    setFeedbackMessage(`S'han pujat ${successfulUploads} productes des de l'Excel! ${skippedItems > 0 ? `(${skippedItems} files buides saltades)` : ''}`);
                    setFeedbackType('success');
                } else {
                    setFeedbackMessage("No s'ha pogut pujar cap producte des de l'Excel. Comprova que el format sigui correcte.");
                    setFeedbackType('error');
                }
            } catch (error) {
                console.error("Error processant el fitxer:", error);
                setFeedbackMessage("Error processant el fitxer: " + error.message);
                setFeedbackType('error');
            }
        };
        reader.readAsArrayBuffer(file);

        // Reinicia el valor del input per permetre pujar el mateix fitxer novament
        event.target.value = '';
    };

    // Funcions de Toggle i CRUD (Cal modificar la ruta interna a cada una)
    const toggleItemInShoppingList = useCallback(async (item) => {
        if (!db || !userId) return;
        try {
            const itemsPath = `users/${userId}/items`; // RUTA CORREGIDA
            const itemDocRef = doc(collection(db, itemsPath), item.id); // Ajust de la funció doc/collection
            
            let newIsInShoppingList;
            let newIsBought;
            if (item.isInShoppingList && !item.isBought) {
                newIsInShoppingList = false;
                newIsBought = false;
            } else {
                newIsInShoppingList = true;
                newIsBought = false;
            }
            await updateDoc(itemDocRef, {
                isInShoppingList: newIsInShoppingList,
                isBought: newIsBought,
                orderIndex: null
            });
            setFeedbackMessage(`Element ${newIsInShoppingList ? 'afegit a la llista de la compra' : 'tret de la llista de la compra'}!`);
            setFeedbackType('success');
        } catch (error) {
            console.error("Error canviant element:", error);
            setFeedbackMessage("Error: " + error.message);
            setFeedbackType('error');
        }
    }, [db, userId]);

    const toggleBought = useCallback(async (id, currentStatus) => {
        if (!db || !userId) return;
        try {
            const itemsPath = `users/${userId}/items`; // RUTA CORREGIDA
            const itemDocRef = doc(collection(db, itemsPath), id); // Ajust de la funció doc/collection
            
            await updateDoc(itemDocRef, {
                isBought: !currentStatus
            });
            setFeedbackMessage(`Element ${!currentStatus ? 'marcat com a comprat' : 'marcat com a pendent'}!`);
            setFeedbackType('success');
        } catch (error) {
            console.error("Error alternant estat:", error);
            setFeedbackMessage("Error: " + error.message);
            setFeedbackType('error');
        }
    }, [db, userId]);

    const handleUpdateItem = useCallback(async (id, updatedData) => {
        if (!db || !userId) return;
        try {
            const itemsPath = `users/${userId}/items`; // RUTA CORREGIDA
            const itemDocRef = doc(collection(db, itemsPath), id); // Ajust de la funció doc/collection

            // Neteja les URLs de les imatges
            if (updatedData.icon) {
                updatedData.icon = cleanImageUrl(updatedData.icon);
            }
            if (updatedData.secondIcon) {
                updatedData.secondIcon = cleanImageUrl(updatedData.secondIcon);
            }

            await updateDoc(itemDocRef, updatedData);
            setFeedbackMessage("Element actualitzat correctament!");
            setFeedbackType('success');
        } catch (error) {
            console.error("Error actualitzant element:", error);
            setFeedbackMessage("Error actualitzant element: " + error.message);
            setFeedbackType('error');
        }
    }, [db, userId]);

    const handleDeleteItem = useCallback(async (item) => {
        if (!db || !userId) return;
        const confirmDelete = window.confirm(`Estàs segur que vols eliminar "${item.name}"?`);
        if (!confirmDelete) return;
        try {
            const itemsPath = `users/${userId}/items`; // RUTA CORREGIDA
            const itemDocRef = doc(collection(db, itemsPath), item.id); // Ajust de la funció doc/collection
            await deleteDoc(itemDocRef);
            setFeedbackMessage("Element eliminat correctament!");
            setFeedbackType('success');
        } catch (error) {
            console.error("Error eliminant element:", error);
            setFeedbackMessage("Error eliminant element: " + error.message);
            setFeedbackType('error');
        }
    }, [db, userId]);

    const afegirDeDespensaALlista = useCallback(async (item) => {
        if (!db || !userId) return;
        try {
            const itemsPath = `users/${userId}/items`; // RUTA CORREGIDA
            const itemDocRef = doc(collection(db, itemsPath), item.id); // Ajust de la funció doc/collection

            // L'actualitzem per posar-lo a la llista i com a NO comprat
            await updateDoc(itemDocRef, {
                isInShoppingList: true,
                isBought: false,
                orderIndex: null
            });

            setFeedbackMessage(`'${item.name}' afegit a la llista de la compra.`);
            setFeedbackType('success');
        } catch (error) {
            console.error("Error afegint de la despensa a la llista:", error);
            setFeedbackMessage("Error afegint de la despensa a la llista: " + error.message);
            setFeedbackType('error');
        }
    }, [db, userId]);
    
    // Funcions d'autenticació (No cal canviar aquí)
    const handleLogin = useCallback(async (email, password) => {
        setAuthErrorMessage('');
        try {
            await signInWithEmailAndPassword(auth, email, password);
            setShowAuthModal(false);
            setFeedbackMessage("Sessió iniciada correctament!");
            setFeedbackType('success');
        } catch (error) {
            console.error("Error iniciant sessió:", error);
            setAuthErrorMessage("Error iniciant sessió: " + error.message);
        }
    }, []);

    const handleRegister = useCallback(async (email, password) => {
        setAuthErrorMessage('');
        try {
            await createUserWithEmailAndPassword(auth, email, password);
            setShowAuthModal(false);
            setFeedbackMessage("Registre completat i sessió iniciada!");
            setFeedbackType('success');
        } catch (error) {
            console.error("Error registrant usuari:", error);
            setAuthErrorMessage("Error registrant: " + error.message);
        }
    }, []);

    const handlePasswordReset = useCallback(async (email) => {
        setAuthErrorMessage('');
        try {
            await sendPasswordResetEmail(auth, email);
            setFeedbackMessage("S'ha enviat un correu de recuperació de contrasenya.");
            setFeedbackType('success');
        } catch (error) {
            console.error("Error enviant correu de recuperació:", error);
            setAuthErrorMessage("Error enviant correu de recuperació: " + error.message);
        }
    }, []);

    const handleLogout = useCallback(async () => {
        try {
            await signOut(auth);
            setUserEmail(null);
            setShowAuthModal(false);
            setFeedbackMessage("Sessió tancada correctament!");
            setFeedbackType('info');
        } catch (error) {
            console.error("Error tancant sessió:", error);
            setFeedbackMessage("Error tancant sessió: " + error.message);
            setFeedbackType('error');
        }
    }, []);

    // -------------------------------------------------------------------------
    // VISTES
    // -------------------------------------------------------------------------
    const pantryItems = items.filter(item => !item.isInShoppingList || item.isBought);
    const shoppingListItems = items.filter(item => item.isInShoppingList);
    const unboughtItems = shoppingListItems.filter(item => !item.isBought);
    const boughtItems = shoppingListItems.filter(item => item.isBought);
    const gridClasses = numColumns === 3 ?
        'grid-cols-3 md:grid-cols-5 lg:grid-cols-7' :
        'grid-cols-2 md:grid-cols-4 lg:grid-cols-6';

    return (
        <div className="min-h-screen bg-[#f0f3f5] text-gray-700 flex flex-col p-4 sm:p-6">
            <header className="w-full mb-6 text-center relative">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
                    Llista de la compra
                </h1>

                {userId && (
                    <button
                        onClick={() => setShowAuthModal(true)}
                        className="absolute top-0 right-0 p-2 rounded-full bg-[#f0f3f5] box-shadow neomorphic-button"
                        aria-label="Menú d'usuari"
                    >
                        <User className="w-6 h-6 text-gray-700" />
                    </button>
                )}
                <p className="text-gray-700 text-lg font-semibold mt-2">
                    {userEmail ? `Usuari: ${userEmail}` : 'Mode anònim'}
                </p>
            </header>
            
            {/* Missatges de Feedback */}
            {feedbackMessage && (
                <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 text-white px-4 py-2 rounded-md shadow-lg z-50 transition-opacity duration-300 opacity-100 flex items-center
                ${feedbackType === 'info' ? 'bg-blue-500' :
                        feedbackType === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
                >
                    {feedbackMessage}
                </div>
            )}
            
            <div className="w-full max-w-full flex flex-col sm:flex-row justify-center gap-4 mb-6 mx-auto">
                <div className="flex justify-center gap-4">
                    <button
                        onClick={() => setCurrentView('pantry')}
                        className={`px-6 py-3 rounded-md font-bold transition-all box-shadow neomorphic-button ${
                            currentView === 'pantry'
                                ? 'box-shadow-neomorphic-button-inset text-green-500'
                                : 'text-gray-700'
                        }`}
                    >
                        Despensa ({pantryItems.length})
                    </button>
                    <button
                        onClick={() => setCurrentView('shoppingList')}
                        className={`px-6 py-3 rounded-md font-bold transition-all box-shadow neomorphic-button ${
                            currentView === 'shoppingList'
                                ? 'box-shadow-neomorphic-button-inset text-green-500'
                                : 'text-gray-700'
                        }`}
                    >
                        Llista ({shoppingListItems.length})
                    </button>
                </div>
            </div>

            {/* Formulari per afegir elements */}
            <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mb-6 mx-auto w-full max-w-xl">
                <div className="flex flex-col gap-3">
                    <input
                        type="text"
                        placeholder="Nom de l'element"
                        className="w-full p-3 rounded-md focus:outline-none box-shadow neomorphic-input"
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleNewItemFormSubmit();
                        }}
                    />
                    <input
                        type="text"
                        placeholder="Quantitat (opcional)"
                        className="w-full p-3 rounded-md focus:outline-none box-shadow neomorphic-input"
                        value={newItemQuantity}
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleNewItemFormSubmit();
                        }}
                    />
                    <input
                        type="text"
                        placeholder="URL de la imatge (opcional)"
                        className="w-full p-3 rounded-md focus:outline-none box-shadow neomorphic-input"
                        value={newItemIcon}
                        onChange={(e) => setNewItemIcon(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleNewItemFormSubmit();
                        }}
                    />
                    <input
                        type="text"
                        list="sections-datalist"
                        placeholder="Secció (opcional)"
                        className="w-full p-3 rounded-md focus:outline-none box-shadow neomorphic-input"
                        value={newItemSection}
                        onChange={(e) => setNewItemSection(e.target.value)}
                        onKeyPress={(e) => {
                            if (e.key === 'Enter') handleNewItemFormSubmit();
                        }}
                    />
                    <datalist id="sections-datalist">
                        {availableSections.map((section, index) => (
                            <option key={index} value={section} />
                        ))}
                    </datalist>
                    <button
                        onClick={handleNewItemFormSubmit}
                        className="bg-[#f0f3f5] text-green-500 font-bold py-3 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="w-5 h-5" />
                        Afegeix element
                    </button>
                    {/* Botó per pujar Excel */}
                    <label htmlFor="file-upload" className="w-full text-center bg-[#f0f3f5] text-gray-700 font-bold py-3 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                        <FileUp className="w-5 h-5" />
                        Puja des d'Excel
                    </label>
                    <input id="file-upload" type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileUpload} className="hidden" />
                </div>
            </div>
            
            {/* Vistes principals */}
            {currentView === 'pantry' && (
                <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                    <h2 className="text-xl font-bold mb-4 text-gray-700">
                        Elements a la despensa ({pantryItems.length})
                    </h2>

                    {pantryItems.length === 0 ?
                        (
                            <p className="text-gray-600 text-center py-4">
                                No hi ha elements. Afegeix-ne alguns per començar!
                            </p>
                        ) : (
                            <div className={displayMode === 'list' ? 'flex flex-col gap-3' : `grid ${gridClasses} gap-4`}>
                                {pantryItems.map(item => (
                                    <div key={item.id} className="relative">
                                        {/* NOU BLOC PER A LA DESPENSA: CONTENIDOR AMB DOS BOTONS D'ACCIÓ */}
                                        <div className="relative flex items-center bg-[#f0f3f5] p-3 rounded-lg box-shadow-neomorphic-container w-full">
                                            {/* CONTENIDOR DE LA INFORMACIÓ DE L'ELEMENT */}
                                            <div
                                                className="flex-shrink-0 mr-3 cursor-pointer"
                                                onMouseEnter={() => setItems(prev => prev.map(i => i.id === item.id ?
                                                    { ...i, isHovered: true } : i))}
                                                onMouseLeave={() => setItems(prev => prev.map(i => i.id === item.id
                                                    ? { ...i, isHovered: false } : i))}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.secondIcon) {
                                                        const newItems = items.map(i => {
                                                            if (i.id === item.id) {
                                                                return { ...i, icon: i.secondIcon, secondIcon: i.icon };
                                                            }
                                                            return i;
                                                        });
                                                        setItems(newItems);
                                                    }
                                                }}
                                            >
                                                {renderItemIcon(item, 'w-10 h-10')}
                                            </div>

                                            {/* TEXT DE L'ELEMENT */}
                                            <div className="flex-grow text-left overflow-hidden">
                                                <span className="font-semibold text-sm block truncate">{item.name}</span>
                                                {item.quantity && (
                                                    <span className="text-xs text-gray-500 block truncate">{item.quantity}</span>
                                                )}
                                                {item.section && (
                                                    <span className="text-xs text-gray-400 block truncate">{item.section}</span>
                                                )}
                                            </div>

                                            {/* CONTENIDOR DELS BOTONS D'ACCIÓ */}
                                            <div className="flex flex-shrink-0 ml-3 gap-2">
                                                {/* BOTÓ D'AFEGIR A LA LLISTA (Noves Funcions) */}
                                                <button
                                                    onClick={() => afegirDeDespensaALlista(item)}
                                                    className="p-2 rounded-full bg-[#f0f3f5] text-green-500 box-shadow-neomorphic-button-small"
                                                    aria-label={`Afegir ${item.name} a la llista`}
                                                >
                                                    <ListPlus className="w-5 h-5" />
                                                </button>

                                                {/* BOTÓ D'EDICIÓ */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingItem(item);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="p-2 rounded-full bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button-small"
                                                    aria-label={`Edita ${item.name}`}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                </div>
            )}
            {currentView === 'shoppingList' && (
                <div className="space-y-6">
                    {/* Elements per comprar */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            Productes per comprar ({unboughtItems.length})
                        </h2>

                        {unboughtItems.length === 0 ? (
                            <p className="text-gray-600 text-center py-4">
                                No hi ha productes pendents a la teva llista de la compra.
                            </p>
                        ) : (
                            <div className={displayMode === 'list' ? 'flex flex-col gap-3' : `grid ${gridClasses} gap-4`}>
                                {unboughtItems.map(item => (
                                    <div key={item.id} className="relative">
                                        <button
                                            onDoubleClick={() => toggleBought(item.id, item.isBought)}
                                            className={`${displayMode === 'list'
                                                ? 'flex flex-row items-center justify-start p-3'
                                                : 'flex flex-col items-center justify-center p-4'
                                                } bg-white rounded-lg box-shadow-neomorphic-element-green
                                                hover:bg-gray-50 transition-all w-full text-center`}
                                        >
                                            <div
                                                className={`${displayMode === 'list' ?
                                                    'w-8 h-8 flex-shrink-0' : 'w-12 h-12'}`}
                                                onMouseEnter={() => setItems(prev => prev.map(i => i.id ===
                                                    item.id ? { ...i, isHovered: true } : i))}

                                                onMouseLeave={() => setItems(prev => prev.map(i => i.id ===
                                                    item.id ? { ...i, isHovered: false } : i))}
                                                onDoubleClick={(e) => {
                                                    e.preventDefault();
                                                    if (item.secondIcon) {
                                                        setExpandedImage(item.icon);
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (item.secondIcon) {
                                                        const newItems = items.map(i => {
                                                            if (i.id === item.id) {
                                                                return { ...i, icon: i.secondIcon, secondIcon: i.icon };
                                                            }
                                                            return i;
                                                        });
                                                        setItems(newItems);
                                                    }
                                                }}
                                            >
                                                {renderItemIcon(item, displayMode === 'list' ? 'w-8 h-8' : 'w-12 h-12')}
                                            </div>
                                            <div className={`${displayMode === 'list' ?
                                                'ml-4 flex-grow text-left'
                                                : 'mt-2'}`}>
                                                <span className="font-semibold text-sm">{item.name}</span>
                                                {item.quantity && (
                                                    <span className="text-xs text-gray-500 block mt-1">{item.quantity}</span>
                                                )}
                                                {item.section && (
                                                    <span className="text-xs text-gray-400 block mt-1">{item.section}</span>
                                                )}
                                            </div>
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setEditingItem(item);
                                                setShowEditModal(true);
                                            }}
                                            className="absolute top-1 right-1 p-1 rounded-full bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button-small hover:bg-[#e6e6e9]"
                                            aria-label={`Edita ${item.name}`}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    {/* Elements comprats */}
                    <div className="bg-[#f0f3f5] p-4 rounded-lg box-shadow-neomorphic-container mx-auto w-full">
                        <h2 className="text-xl font-bold mb-4 text-gray-700">
                            Productes comprats ({boughtItems.length})
                        </h2>

                        {boughtItems.length === 0 ?
                            (
                                <p className="text-gray-600 text-center py-4">
                                    Encara no hi ha productes comprats.
                                </p>
                            ) : (
                                <div className={displayMode === 'list' ? 'flex flex-col gap-3' : `grid ${gridClasses} gap-4`}>
                                    {boughtItems.map(item => (
                                        <div key={item.id} className="relative">
                                            <button
                                                onDoubleClick={() => toggleBought(item.id, item.isBought)}
                                                className={`${displayMode === 'list'
                                                    ? 'flex flex-row items-center justify-start p-3'
                                                    : 'flex flex-col items-center justify-center p-4'
                                                    } bg-white rounded-lg box-shadow-neomorphic-element-bought
                                                    hover:bg-gray-50 transition-all w-full text-center opacity-75`}
                                            >
                                                <div
                                                    className={`${displayMode === 'list' ? 'w-8 h-8 flex-shrink-0' :
                                                        'w-12 h-12'}`}
                                                    onMouseEnter={() => setItems(prev => prev.map(i => i.id ===
                                                        item.id ? { ...i, isHovered: true }
                                                        : i))}
                                                    onMouseLeave={() => setItems(prev => prev.map(i => i.id ===
                                                        item.id ? { ...i, isHovered: false } : i))}
                                                    onDoubleClick={(e) => {
                                                        e.preventDefault();
                                                        if (item.secondIcon) {
                                                            setExpandedImage(item.icon);
                                                        }
                                                    }}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (item.secondIcon) {
                                                            const newItems = items.map(i => {
                                                                if (i.id === item.id) {
                                                                    return { ...i, icon: i.secondIcon, secondIcon: i.icon };
                                                                }
                                                                return i;
                                                            });
                                                            setItems(newItems);
                                                        }
                                                    }}
                                                >
                                                    {renderItemIcon(item, displayMode === 'list' ? 'w-8 h-8' : 'w-12 h-12')}
                                                </div>
                                                <div className={`${displayMode === 'list' ?
                                                    'ml-4 flex-grow text-left'
                                                    : 'mt-2'}`}>
                                                    <span className="font-semibold text-sm line-through">{item.name}</span>
                                                    {item.quantity && (
                                                        <span className="text-xs text-gray-400 block mt-1 line-through">{item.quantity}</span>
                                                    )}
                                                    {item.section && (
                                                        <span className="text-xs text-gray-400 block mt-1 line-through">{item.section}</span>
                                                    )}
                                                </div>
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItem(item);
                                                    setShowEditModal(true);
                                                }}
                                                className="absolute top-1 right-1 p-1 rounded-full bg-[#f0f3f5] text-gray-600 box-shadow-neomorphic-button-small hover:bg-[#e6e6e9]"
                                                aria-label={`Edita ${item.name}`}
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                    </div>
                </div>
            )}
            {/* Modal d'edició */}
            {showEditModal && editingItem && (
                <EditItemModal
                    item={editingItem}
                    onClose={() => { setShowEditModal(false); setEditingItem(null); }}
                    onSave={handleUpdateItem}
                    onDelete={handleDeleteItem}
                    availableSections={availableSections}
                />
            )}
            {/* Modal d'autenticació */}
            {showAuthModal && (
                <AuthModal
                    onLogin={handleLogin}
                    onRegister={handleRegister}
                    onLogout={handleLogout}
                    userEmail={userEmail}
                    errorMessage={authErrorMessage}
                    onClose={() => setShowAuthModal(false)}
                    onForgotPassword={handlePasswordReset}
                    displayMode={displayMode}
                    setDisplayMode={setDisplayMode}
                />
            )}
            {/* Modal per a la imatge expandida */}
            {expandedImage && (
                <ImageModal src={expandedImage} onClose={() => setExpandedImage(null)} />
            )}
        </div>
    );
}

export default App;
