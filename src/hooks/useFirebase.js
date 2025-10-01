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
  setDoc, // Nou import
  getDoc, // Nou import
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

const cleanImageUrl = (url) => {
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

export const useFirebase = () => {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [items, setItems] = useState([]);
  const [sectionOrder, setSectionOrder] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  // NOU ESTAT PER A LLISTES
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState('mainShoppingList'); // ID de llista activa per defecte

  // Configuració autenticació
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      let currentUserId = null;
      if (user) {
        currentUserId = user.uid;
        if (!user.isAnonymous) {
          setUserId(user.uid);
          setUserEmail(user.email);
        } else {
          setUserId(user.uid);
          setUserEmail(null);
        }
      } else {
        try {
          const anonUserCredential = await signInAnonymously(auth);
          currentUserId = anonUserCredential.user.uid;
          setUserId(currentUserId);
          setUserEmail(null);
        } catch (error) {
          console.error("Error durant l'inici de sessió anònim:", error);
          // Utilitzem una ID anònima local en cas d'error
          currentUserId = crypto.randomUUID(); 
          setUserId(currentUserId);
          setUserEmail(null);
        }
      }
      setIsAuthReady(true);
      
      // Intentar llegir l'ID de la llista activa guardada localment per aquest usuari
      if (currentUserId) {
        const savedListId = localStorage.getItem(`activeListId_${currentUserId}`);
        if (savedListId) {
          setActiveListId(savedListId);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // Guarda l'ID de la llista activa a l'emmagatzematge local quan canvia
  useEffect(() => {
    if (userId && activeListId) {
      localStorage.setItem(`activeListId_${userId}`, activeListId);
    }
  }, [userId, activeListId]);


  // Carrega Llistes de la compra (NOU useEffect)
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const listsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists`;
      const listsCollectionRef = collection(db, listsPath);

      // Crear la llista per defecte si no existeix (Només una vegada)
      const ensureDefaultList = async () => {
        const defaultListRef = doc(db, listsPath, 'mainShoppingList');
        const defaultListSnap = await getDoc(defaultListRef);
        if (!defaultListSnap.exists()) {
          await setDoc(defaultListRef, {
            name: "Llista Principal",
            createdAt: serverTimestamp(),
            default: true,
          });
        }
      };
      
      ensureDefaultList();

      const q = query(listsCollectionRef, orderBy('createdAt', 'asc')); 
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const listsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLists(listsData);

        // Si la llista activa no existeix (per exemple, si s'ha eliminat), tornem a la principal
        if (activeListId && !listsData.some(l => l.id === activeListId)) {
            setActiveListId('mainShoppingList');
        }

      }, (error) => {
        console.error("Error carregant llistes:", error);
        setLists([]);
      });

      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady, activeListId]); // activeListId afegit per comprovar si l'actual existeix

  // Carrega elements (MODIFICAT per dependre de activeListId)
  useEffect(() => {
    if (db && userId && isAuthReady && activeListId) {
      // ATENCIÓ: ARA LA RUTA ES CONSTRUEIX AMB activeListId
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/${activeListId}/items`;
      const itemsCollectionRef = collection(db, itemsPath);
      const q = query(itemsCollectionRef, orderBy('name', 'asc')); 

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const processedItems = itemsData.map(item => ({
          ...item,
          isInShoppingList: !!item.isInShoppingList,
          isBought: !!item.isBought,
          section: item.section || '', 
          isFlipped: false
        }));

        setItems(processedItems);
      }, (error) => {
        console.error("Error carregant elements:", error);
        setItems([]);
      });

      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady, activeListId]); // activeListId afegit com a dependència

  // Carregar ordre de seccions
  useEffect(() => {
    // Mantenim la mateixa lògica per ara, ja que no depèn de la llista
    if (db && userId && isAuthReady) {
      setSectionOrder({});
    }
  }, [db, userId, isAuthReady]);

  // Afegir Llista (NOVA FUNCIÓ)
  const addList = useCallback(async (listName) => {
    if (listName.trim() === '' || !db || !userId) {
      throw new Error("No es pot afegir: Falta el nom de la llista.");
    }
    try {
      const listsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists`;
      const listsCollectionRef = collection(db, listsPath);
      const docRef = await addDoc(listsCollectionRef, {
        name: listName,
        createdAt: serverTimestamp(),
      });
      setActiveListId(docRef.id); // Activem la nova llista
      return docRef.id;
    } catch (error) {
      console.error("Error afegint llista:", error);
      throw error;
    }
  }, [db, userId]);

  // Actualitzar nom de Llista (NOVA FUNCIÓ)
  const updateListName = useCallback(async (listId, newName) => {
    if (newName.trim() === '' || !db || !userId) {
      throw new Error("No es pot actualitzar: Falta el nom de la llista.");
    }
    try {
      const listDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/shoppingLists`, listId);
      await updateDoc(listDocRef, { name: newName });
      return true;
    } catch (error) {
      console.error("Error actualitzant nom de llista:", error);
      throw error;
    }
  }, [db, userId]);
  
  // Eliminar Llista (NOVA FUNCIÓ)
  const deleteList = useCallback(async (listId) => {
    if (!db || !userId || listId === 'mainShoppingList') {
      throw new Error("No es pot eliminar la llista principal.");
    }
    try {
      const listDocRef = doc(db, `artifacts/${APP_ID}/users/${userId}/shoppingLists`, listId);
      await deleteDoc(listDocRef);
      // Després d'eliminar, tornem a la llista principal.
      setActiveListId('mainShoppingList');
      return true;
    } catch (error) {
      console.error("Error eliminant llista:", error);
      throw error;
    }
  }, [db, userId]);


  // Funcions d'elements (TOTS ELS PATHS MODIFICATS per usar activeListId)

  // Funció auxiliar per obtenir la ruta de la col·lecció d'ítems de la llista activa
  const getItemsPath = (listId) => `artifacts/${APP_ID}/users/${userId}/shoppingLists/${listId}/items`;

  // Afegir element
  const addItem = useCallback(async (itemData) => {
    if (itemData.name.trim() === '' || !db || !userId || !activeListId) {
      throw new Error("No es pot afegir: Falten dades essencials.");
    }
    try {
      const itemsCollectionRef = collection(db, getItemsPath(activeListId));
      await addDoc(itemsCollectionRef, {
        ...itemData,
        isBought: false,
        isInShoppingList: false,
        createdAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error("Error afegint element:", error);
      throw error;
    }
  }, [db, userId, activeListId]);

  // Actualitzar element
  const updateItem = useCallback(async (id, updatedData) => {
    if (!db || !userId || !activeListId) return;
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), id);
      if (updatedData.icon) { updatedData.icon = cleanImageUrl(updatedData.icon); }
      if (updatedData.secondIcon) { updatedData.secondIcon = cleanImageUrl(updatedData.secondIcon); }
      await updateDoc(itemDocRef, updatedData);
      return true;
    } catch (error) {
      console.error("Error actualitzant element:", error);
      throw error;
    }
  }, [db, userId, activeListId]);

  // Reordenar manual
  const updateItemOrder = useCallback(async (id, newOrderIndex) => {
    if (!db || !userId || !activeListId) return;
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), id);
      await updateDoc(itemDocRef, { orderIndex: newOrderIndex });
      return true;
    } catch (error) {
      console.error("Error actualitzant l'ordre de l'element:", error);
      throw error;
    }
  }, [db, userId, activeListId]);

  // Actualitzar ordre de secció (es manté igual, no depèn de la llista)
  const updateSectionOrder = useCallback(async (sectionName, newOrderIndex) => {
    setSectionOrder(prev => ({
      ...prev,
      [sectionName]: newOrderIndex
    }));
    return true;
  }, []);

  // Eliminar element
  const deleteItem = useCallback(async (item) => {
    if (!db || !userId || !activeListId) return;
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), item.id);
      await deleteDoc(itemDocRef);
      return true;
    } catch (error) {
      console.error("Error eliminant element:", error);
      throw error;
    }
  }, [db, userId, activeListId]);

  // Afegir/treure de la llista
  const toggleItemInShoppingList = useCallback(async (item) => {
    if (!db || !userId || !activeListId) return;
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), item.id);
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
      return newIsInShoppingList;
    } catch (error) {
      console.error("Error canviant element:", error);
      throw error;
    }
  }, [db, userId, activeListId]);

  // Marcar/desmarcar com a comprat (amb neteja de quantitat)
  const toggleBought = useCallback(async (item, newStatus) => {
    if (!db || !userId || !activeListId) return;
    try {
      const itemDocRef = doc(db, getItemsPath(activeListId), item.id);
      
      const updatePayload = { isBought: newStatus };
      
      if (newStatus && item.quantity && item.quantity.trim() !== '') {
        updatePayload.quantity = '';
      }
      
      await updateDoc(itemDocRef, updatePayload);
      return newStatus;
    } catch (error) {
      console.error("Error alternant estat:", error);
      throw error;
    }
  }, [db, userId, activeListId]);

  // Importar des d'Excel
  const uploadFromExcel = useCallback(async (jsonData) => {
    if (!db || !userId || !activeListId) return;
    if (jsonData.length < 2) {
      throw new Error("El fitxer Excel no té dades o el format és incorrecte.");
    }
    const header = jsonData[0].map(h => String(h).trim().toLowerCase());
    const rows = jsonData.slice(1);
    const nameIndex = header.findIndex(h => h.includes('nom'));
    const quantityIndex = header.findIndex(h => h.includes('quantitat'));
    const sectionIndex = header.findIndex(h => h.includes('secció') || h.includes('seccio'));
    const iconIndex = header.findIndex(h => h.includes('icona') && h.includes('principal'));
    const secondIconIndex = header.findIndex(h => h.includes('icona') && (h.includes('secundària') || h.includes('secundaria')));
    
    if (nameIndex === -1) {
      throw new Error("El fitxer Excel ha de contenir una columna amb 'Nom'.");
    }
    
    let successfulUploads = 0;
    let skippedItems = 0;
    const batch = writeBatch(db);
    const itemsCollectionRef = collection(db, getItemsPath(activeListId));
    
    for (const row of rows) {
      const itemName = row[nameIndex] ? String(row[nameIndex]).trim() : '';
      if (itemName === '') {
        skippedItems++;
        continue;
      }
      const itemQuantity = quantityIndex !== -1 && row[quantityIndex] ? String(row[quantityIndex]).trim() : ''; 
      let itemIcon = iconIndex !== -1 && row[iconIndex] ? cleanImageUrl(String(row[iconIndex])) : '';
      let itemSecondIcon = secondIconIndex !== -1 && row[secondIconIndex] ? cleanImageUrl(String(row[secondIconIndex])) : '';
      const itemData = {
        name: itemName,
        quantity: itemQuantity,
        section: sectionIndex !== -1 && row[sectionIndex] ? String(row[sectionIndex]).trim() : '',
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
      await batch.commit();
      return { successfulUploads, skippedItems };
    } else {
      throw new Error("No s'ha pogut pujar cap producte des de l'Excel. Comprova que el format sigui correcte.");
    }
  }, [db, userId, activeListId]);

  // Autenticació (sense canvis)
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
    lists,             // NOU
    activeListId,      // NOU
    setActiveListId,   // NOU
    addList,           // NOU
    updateListName,    // NOU
    deleteList,        // NOU
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
    cleanImageUrl
  };
};
