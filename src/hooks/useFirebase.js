import { useState, useEffect, useCallback } from 'react';
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
  serverTimestamp,
  writeBatch,
  orderBy,
  getDoc,
  setDoc,
  where
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAxE2UATyzOYGgvqkApPPzu1rSnrAGrfkI",
  authDomain: "mua-app-eed40.firebaseapp.com",
  projectId: "mua-app-eed40",
  storageBucket: "mua-app-eed40.firebasestorage.app",
  messagingSenderId: "792715069043",
  appId: "1:792715069043:web:76d7596c5f3615312d0c06"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const APP_ID = 'mua-app-da319';

export const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string') return "";
  const cleanedUrl = url.trim();
  if (cleanedUrl.startsWith('http://') || cleanedUrl.startsWith('https://')) {
    return cleanedUrl;
  }
  if (cleanedUrl.includes('.') && !cleanedUrl.includes(' ')) {
    return 'https://' + cleanedUrl;
  }
  return "";
};

// =========================================================================
// HOOK PRINCIPAL
// =========================================================================

export const useFirebase = () => {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [items, setItems] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [sectionOrder, setSectionOrder] = useState({});

  // NOUS ESTATS PER A LLISTES
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(() => localStorage.getItem('activeListId') || null);

  // Funcions utilitàries per generar rutes
  const getItemsPath = useCallback((listId) => {
    if (!userId || !listId) return null;
    return `artifacts/${APP_ID}/users/${userId}/shoppingLists/${listId}/items`;
  }, [userId]);

  const getSectionOrderPath = useCallback(() => {
    if (!userId) return null;
    return `artifacts/${APP_ID}/users/${userId}/sectionOrder/config`;
  }, [userId]);
  
  const getListsPath = useCallback(() => {
    if (!userId) return null;
    return `artifacts/${APP_ID}/users/${userId}/shoppingLists`;
  }, [userId]);

  // Sincronitzar l'activeListId a localStorage
  useEffect(() => {
    if (activeListId) {
      localStorage.setItem('activeListId', activeListId);
    }
  }, [activeListId]);

  // =========================================================================
  // 1. AUTENTICACIÓ I INICIALITZACIÓ
  // =========================================================================

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
      } else {
        // Intentar iniciar sessió de forma anònima si no hi ha usuari
        try {
          const anonUserCredential = await signInAnonymously(auth);
          setUserId(anonUserCredential.user.uid);
          setUserEmail(null);
        } catch (error) {
          console.error("Error iniciant sessió anònima:", error);
          setUserId(null);
        }
      }
      setIsAuthReady(true);
    });

    return () => unsubscribeAuth();
  }, []);

  // =========================================================================
  // 2. GESTIÓ DE LLISTES (NOU)
  // =========================================================================
  
  // Funció per assegurar l'existència d'una llista per defecte
  const ensureDefaultList = useCallback(async (uid) => {
    const listPath = `artifacts/${APP_ID}/users/${uid}/shoppingLists`;
    const defaultListRef = doc(db, listPath, 'mainShoppingList');

    try {
      const docSnap = await getDoc(defaultListRef);
      if (!docSnap.exists()) {
        await setDoc(defaultListRef, {
          name: "Llista Principal",
          createdAt: serverTimestamp()
        });
      }
      return 'mainShoppingList';
    } catch (error) {
      console.error("Error assegurant llista per defecte:", error);
      throw error;
    }
  }, []);

  // Carregar Llistes disponibles i gestionar l'activa
  useEffect(() => {
    if (!userId) return;

    const loadAndSetLists = async () => {
      try {
        const defaultListId = await ensureDefaultList(userId);
        
        const listsCollectionRef = collection(db, getListsPath());
        const q = query(listsCollectionRef, orderBy('createdAt', 'asc'));

        const unsubscribeLists = onSnapshot(q, (snapshot) => {
          const loadedLists = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setLists(loadedLists);

          // Si no hi ha cap llista activa o l'activa ha estat esborrada
          if (!activeListId || !loadedLists.some(l => l.id === activeListId)) {
             // Prioritzem la llista principal, si existeix
            const mainList = loadedLists.find(l => l.id === 'mainShoppingList');
            if (mainList) {
                setActiveListId('mainShoppingList');
            } else if (loadedLists.length > 0) {
              setActiveListId(loadedLists[0].id);
            } else {
                // Aquest cas no hauria de passar gràcies a ensureDefaultList
                setActiveListId(defaultListId);
            }
          }
        }, (error) => {
          console.error("Error carregant llistes:", error.message);
        });

        return () => unsubscribeLists();
      } catch (error) {
        console.error("Error durant la inicialització de llistes:", error);
      }
    };

    loadAndSetLists();
  }, [userId, db, activeListId, ensureDefaultList, getListsPath]);


  // Afegir Nova Llista
  const addList = useCallback(async (listName) => {
    if (!db || !userId) {
      throw new Error("No es pot crear la llista: Falten dades d'usuari.");
    }

    try {
      const listsCollectionRef = collection(db, getListsPath());
      const newDocRef = await addDoc(listsCollectionRef, {
        name: listName,
        createdAt: serverTimestamp()
      });
      setActiveListId(newDocRef.id);
    } catch (error) {
      console.error("Error afegint llista:", error);
      throw error;
    }
  }, [db, userId, getListsPath]);

  // Actualitzar Nom de Llista
  const updateListName = useCallback(async (listId, newName) => {
    if (!db || !userId) {
      throw new Error("No es pot actualitzar: Falten dades d'usuari.");
    }
    
    try {
      const listDocRef = doc(db, getListsPath(), listId);
      await updateDoc(listDocRef, { name: newName });
    } catch (error) {
      console.error("Error actualitzant nom de llista:", error);
      throw error;
    }
  }, [db, userId, getListsPath]);

  // Eliminar Llista (MODIFICADA per permetre eliminar la principal si no en queden d'altres)
  const deleteList = useCallback(async (listId) => {
    if (!db || !userId) {
      throw new Error("No es pot eliminar: Falten dades d'usuari.");
    }

    try {
        const listsPath = getListsPath();
        const currentLists = lists.filter(l => l.id !== listId);
        
        // Si és l'última llista, la buidem i la renombren a "Llista Principal"
        if (currentLists.length === 0) {
            const listDocRef = doc(db, listsPath, listId);
            
            // 1. Renombrar la llista
            await updateDoc(listDocRef, { name: "Llista Principal" });
            
            // 2. Buidar els seus ítems (eliminem tota la subcol·lecció)
            const itemsCollectionRef = collection(db, getItemsPath(listId));
            const itemsSnapshot = await getDocs(query(itemsCollectionRef));
            
            const batch = writeBatch(db);

            itemsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            setActiveListId(listId); // Mantenim-nos-hi
            return { action: 'renamed', newName: 'Llista Principal' };
        } 
        
        // Si no és l'última, l'eliminem
        else {
            // 1. Eliminem els ítems de la llista (no cal buidar la subcol·lecció)
            const itemsCollectionRef = collection(db, getItemsPath(listId));
            const itemsSnapshot = await getDocs(query(itemsCollectionRef));
            
            const batch = writeBatch(db);
            itemsSnapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
            await batch.commit();

            // 2. Eliminem el document de la llista
            const listDocRef = doc(db, listsPath, listId);
            await deleteDoc(listDocRef);
            
            // 3. Seleccionem la primera llista que queda.
            setActiveListId(currentLists[0].id);
            return { action: 'deleted' };
        }
    } catch (error) {
        console.error("Error eliminant/netejanr llista:", error);
        throw error;
    }
    // IMPORTANT: Actualitzem les dependències per a la nova lògica
  }, [db, userId, lists, getListsPath, getItemsPath, setActiveListId]); 

  // =========================================================================
  // 3. CARREGA DE DADES DE LA LLISTA ACTIVA
  // =========================================================================

  // Carregar Elements i Ordre de Seccions de la Llista Activa
  useEffect(() => {
    if (!userId || !activeListId) {
      setItems([]);
      setSectionOrder({});
      return;
    }

    // A. Carregar ítems
    const itemsCollectionRef = collection(db, getItemsPath(activeListId));
    const itemsQuery = query(itemsCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribeItems = onSnapshot(itemsQuery, (snapshot) => {
      const loadedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(loadedItems);
    }, (error) => {
      console.error("Error carregant ítems:", error);
    });

    // B. Carregar ordre de seccions
    const sectionDocRef = doc(db, getSectionOrderPath());
    const unsubscribeSectionOrder = onSnapshot(sectionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setSectionOrder(docSnap.data().orderMap || {});
      } else {
        setSectionOrder({});
      }
    }, (error) => {
      console.error("Error carregant ordre de seccions:", error);
    });

    return () => {
      unsubscribeItems();
      unsubscribeSectionOrder();
    };
  }, [userId, db, activeListId, getItemsPath, getSectionOrderPath]);


  // =========================================================================
  // 4. GESTIÓ D'ELEMENTS
  // =========================================================================

  // Afegir element
  const addItem = useCallback(async (itemData) => {
    if (!db || !userId || !activeListId) {
      throw new Error("No es pot afegir l'element: Falten dades d'usuari o llista activa.");
    }

    try {
      const itemsCollectionRef = collection(db, getItemsPath(activeListId));
      await addDoc(itemsCollectionRef, {
        ...itemData,
        createdAt: serverTimestamp(),
        orderIndex: Date.now() // Per ordre inicial quan s'afegeix
      });
    } catch (error) {
      console.error("Error afegint element:", error);
      throw error;
    }
  }, [db, userId, activeListId, getItemsPath]);

  // Actualitzar element
  const updateItem = useCallback(async (itemId, updatedData) => {
    if (!db || !userId || !activeListId) {
      throw new Error("No es pot actualitzar l'element: Falten dades.");
    }

    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), itemId);
      await updateDoc(itemDocRef, updatedData);
    } catch (error) {
      console.error("Error actualitzant element:", error);
      throw error;
    }
  }, [db, userId, activeListId, getItemsPath]);

  // Eliminar element
  const deleteItem = useCallback(async (item) => {
    if (!db || !userId || !activeListId) {
      throw new Error("No es pot eliminar l'element: Falten dades.");
    }
    
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), item.id);
      await deleteDoc(itemDocRef);
    } catch (error) {
      console.error("Error eliminant element:", error);
      throw error;
    }
  }, [db, userId, activeListId, getItemsPath]);

  // Moure element a/de Llista de la compra
  const toggleItemInShoppingList = useCallback(async (item) => {
    if (!db || !userId || !activeListId) {
      throw new Error("No es pot moure l'element: Falten dades.");
    }

    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), item.id);
      const isInShoppingList = !item.isInShoppingList;
      
      await updateDoc(itemDocRef, { 
        isInShoppingList: isInShoppingList,
        isBought: false, // Sempre resetegem l'estat de comprat
        orderIndex: isInShoppingList ? Date.now() : null // Reiniciem l'ordre si l'afegim
      });
      return isInShoppingList;
    } catch (error) {
      console.error("Error movent element:", error);
      throw error;
    }
  }, [db, userId, activeListId, getItemsPath]);

  // Marcar com comprat/descomprat
  const toggleBought = useCallback(async (item, newStatus) => {
    if (!db || !userId || !activeListId) {
      throw new Error("No es pot actualitzar l'estat de comprat: Falten dades.");
    }
    
    // Si l'estat és true (marcat com a comprat), netegem la quantitat.
    const updateData = { 
        isBought: newStatus,
        quantity: newStatus ? '' : item.quantity // Netejar quantitat si es marca com comprat
    };

    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), item.id);
      await updateDoc(itemDocRef, updateData);
      return newStatus;
    } catch (error) {
      console.error("Error actualitzant estat de comprat:", error);
      throw error;
    }
  }, [db, userId, activeListId, getItemsPath]);
  
  // =========================================================================
  // 5. GESTIÓ D'ORDRE I EXCEL
  // =========================================================================

  // Actualitzar l'ordre d'un ítem
  const updateItemOrder = useCallback(async (itemId, newIndex) => {
    if (!db || !userId || !activeListId) {
      throw new Error("No es pot actualitzar l'ordre: Falten dades.");
    }
    
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), itemId);
      await updateDoc(itemDocRef, { orderIndex: newIndex });
    } catch (error) {
      console.error("Error actualitzant ordre de l'element:", error);
      throw error;
    }
  }, [db, userId, activeListId, getItemsPath]);
  
  // Actualitzar l'ordre de les seccions
  const updateSectionOrder = useCallback(async (sectionName, newIndex) => {
    if (!db || !userId) {
      throw new Error("No es pot actualitzar l'ordre de seccions: Falten dades.");
    }
    
    try {
        const sectionDocRef = doc(db, getSectionOrderPath());
        
        // Obtenir el document actual per preservar l'ordre d'altres seccions
        const docSnap = await getDoc(sectionDocRef);
        const currentOrderMap = docSnap.exists() ? docSnap.data().orderMap || {} : {};
        
        const newOrderMap = { 
            ...currentOrderMap, 
            [sectionName]: newIndex 
        };
        
        await setDoc(sectionDocRef, { orderMap: newOrderMap }, { merge: true });
        
    } catch (error) {
        console.error("Error actualitzant ordre de seccions:", error);
        throw error;
    }
  }, [db, userId, getSectionOrderPath]);


  // Importació de dades des d'Excel
  const uploadFromExcel = useCallback(async (jsonData) => {
    if (!db || !userId || !activeListId) {
        throw new Error("No es pot importar: Falten dades d'usuari o llista activa.");
    }

    // La primera fila és la capçalera
    if (!jsonData || jsonData.length < 2) {
        return { successfulUploads: 0, skippedItems: 0 };
    }

    // Mapeig de capçaleres de columna a camps de Firebase
    const headers = jsonData[0].map(h => h ? h.trim() : null);
    const itemData = jsonData.slice(1);
    
    const validHeaders = {
        'Nom': 'name',
        'Quantitat': 'quantity',
        'Secció': 'section',
        'Icona Principal': 'icon',
        'Icona Secundària': 'secondIcon'
    };

    let successfulUploads = 0;
    let skippedItems = 0;
    const itemsCollectionRef = collection(db, getItemsPath(activeListId));
    const batch = writeBatch(db);

    itemData.forEach((row, index) => {
        // Ignorar files amb la primera cel·la buida (presumiblement el nom)
        if (!row[0] || row[0].trim() === '') {
            skippedItems++;
            return;
        }

        const item = {
            isInShoppingList: false,
            isBought: false,
            createdAt: serverTimestamp(),
            orderIndex: Date.now() + index // Per mantenir l'ordre de l'Excel si no hi ha dades a Firestore
        };

        headers.forEach((header, i) => {
            const fieldName = validHeaders[header];
            if (fieldName && row[i] !== undefined) {
                item[fieldName] = String(row[i]).trim();
                
                // Conversió específica per a camps booleans de l'excel si es volen incloure (opcional)
                if (header === 'A la llista') {
                    item.isInShoppingList = ['sí', 'si', 'true', '1'].includes(item[fieldName].toLowerCase());
                } else if (header === 'Comprat') {
                    item.isBought = ['sí', 'si', 'true', '1'].includes(item[fieldName].toLowerCase());
                }
            }
        });
        
        // Nom és obligatori
        if (item.name) {
            const newDocRef = doc(itemsCollectionRef);
            batch.set(newDocRef, item);
            successfulUploads++;
        } else {
            skippedItems++;
        }
    });

    if (successfulUploads > 0) {
        await batch.commit();
        return { successfulUploads, skippedItems };
    } else {
        throw new Error("No s'ha pogut pujar cap producte vàlid de l'Excel. Comprova que el format sigui correcte.");
    }
  }, [db, userId, activeListId, getItemsPath]);


  // =========================================================================
  // 6. FUNCIONS D'AUTENTICACIÓ
  // =========================================================================

  const handleLogin = useCallback(async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Error iniciant sessió:", error);
      throw error;
    }
  }, []);

  const handleRegister = useCallback(async (email, password) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Error registrant usuari:", error);
      throw error;
    }
  }, []);

  const handlePasswordReset = useCallback(async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error) {
      console.error("Error enviant correu de recuperació:", error);
      throw error;
    }
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);
      setUserEmail(null);
      return true;
    } catch (error) {
      console.error("Error tancant sessió:", error);
      throw error;
    }
  }, []);

  return {
    userId,
    userEmail,
    items,
    sectionOrder,
    isAuthReady,
    // LLISTES NOVES
    lists,
    activeListId,
    setActiveListId,
    addList,
    updateListName,
    deleteList,
    // FUNCIONS D'ELEMENTS
    addItem,
    updateItem,
    deleteItem,
    toggleItemInShoppingList,
    toggleBought,
    updateItemOrder,
    updateSectionOrder,
    uploadFromExcel,
    // FUNCIONS D'AUTENTICACIÓ
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout,
    cleanImageUrl
  };
};
