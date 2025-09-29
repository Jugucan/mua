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
  orderBy // <-- NOU: Importem orderBy
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
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Configuració de l'autenticació
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
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
          setUserId(anonUserCredential.user.uid);
          setUserEmail(null);
        } catch (error) {
          console.error("Error durant l'inici de sessió anònim:", error);
          // Si falla l'anonim, generem un ID local per poder seguir usant l'app
          setUserId(crypto.randomUUID()); 
          setUserEmail(null);
        }
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Carrega els elements de la base de dades
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
      const itemsCollectionRef = collection(db, itemsPath);
      
      // ORDENACIÓ: Per defecte ordenem per 'name' de forma ascendent.
      // Dins App.jsx farem l'ordenació més complexa (per llista/despensa i secció)
      const q = query(itemsCollectionRef, orderBy('name', 'asc')); 

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        const processedItems = itemsData.map(item => ({
          ...item,
          // S'assegura que els booleans existeixen
          isInShoppingList: !!item.isInShoppingList,
          isBought: !!item.isBought,
          // S'assegura que la secció existeix
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
  }, [db, userId, isAuthReady]);

  // Funcions de base de dades
  const addItem = useCallback(async (itemData) => {
    if (itemData.name.trim() === '' || !db || !userId) {
      throw new Error("No es pot afegir: Falta el nom de l'element.");
    }
    try {
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
      const itemsCollectionRef = collection(db, itemsPath);
      await addDoc(itemsCollectionRef, {
        ...itemData,
        isBought: false,
        isInShoppingList: false,
        createdAt: serverTimestamp(),
        // orderIndex: null // Ja no el necessitem si ordenem per 'name'
      });
      return true;
    } catch (error) {
      console.error("Error afegint element:", error);
      throw error;
    }
  }, [db, userId]);

  const updateItem = useCallback(async (id, updatedData) => {
    if (!db || !userId) return;
    try {
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
      const itemDocRef = doc(db, itemsPath, id);
      if (updatedData.icon) { updatedData.icon = cleanImageUrl(updatedData.icon); }
      if (updatedData.secondIcon) { updatedData.secondIcon = cleanImageUrl(updatedData.secondIcon); }
      await updateDoc(itemDocRef, updatedData);
      return true;
    } catch (error) {
      console.error("Error actualitzant element:", error);
      throw error;
    }
  }, [db, userId]);

  // NOVA FUNCIÓ: Per gestionar la reordenació manual (si cal)
  const updateItemOrder = useCallback(async (id, newOrderIndex) => {
      if (!db || !userId) return;
      try {
          const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
          const itemDocRef = doc(db, itemsPath, id);
          await updateDoc(itemDocRef, { orderIndex: newOrderIndex });
          return true;
      } catch (error) {
          console.error("Error actualitzant l'ordre de l'element:", error);
          throw error;
      }
  }, [db, userId]);


  const deleteItem = useCallback(async (item) => {
    if (!db || !userId) return;
    try {
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
      const itemDocRef = doc(db, itemsPath, item.id);
      await deleteDoc(itemDocRef);
      return true;
    } catch (error) {
      console.error("Error eliminant element:", error);
      throw error;
    }
  }, [db, userId]);

  const toggleItemInShoppingList = useCallback(async (item) => {
    if (!db || !userId) return;
    try {
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
      const itemDocRef = doc(db, itemsPath, item.id);
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
  }, [db, userId]);

  // MODIFICAT: Ara rep l'item complet i gestiona la neteja de quantitat
  const toggleBought = useCallback(async (item, newStatus) => {
    if (!db || !userId) return;
    try {
      const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
      const itemDocRef = doc(db, itemsPath, item.id);
      
      const updatePayload = { isBought: newStatus };
      
      // Si es desmarca com a comprat (newStatus és false), i té quantitat, la netegem.
      // D'aquesta manera, el doble clic a 'comprats' desmarca i neteja quantitat.
      if (!newStatus && item.quantity && item.quantity.trim() !== '') {
          updatePayload.quantity = '';
      }
      
      await updateDoc(itemDocRef, updatePayload);
      return newStatus;
    } catch (error) {
      console.error("Error alternant estat:", error);
      throw error;
    }
  }, [db, userId]);

  const uploadFromExcel = useCallback(async (jsonData) => {
    if (!db || !userId) return;
    
    if (jsonData.length < 2) {
      throw new Error("El fitxer Excel no té dades o el format és incorrecte.");
    }
    
    const header = jsonData[0].map(h => String(h).trim().toLowerCase());
    const rows = jsonData.slice(1);
    const nameIndex = header.findIndex(h => h.includes('nom'));
    const quantityIndex = header.findIndex(h => h.includes('quantitat')); // NOU: Index de quantitat
    const sectionIndex = header.findIndex(h => h.includes('secció') || h.includes('seccio'));
    const iconIndex = header.findIndex(h => h.includes('icona') && h.includes('principal'));
    const secondIconIndex = header.findIndex(h => h.includes('icona') && (h.includes('secundària') || h.includes('secundaria')));
    
    if (nameIndex === -1) {
      throw new Error("El fitxer Excel ha de contenir una columna amb 'Nom'.");
    }
    
    let successfulUploads = 0;
    let skippedItems = 0;
    const batch = writeBatch(db);
    const itemsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/items`;
    const itemsCollectionRef = collection(db, itemsPath);
    
    for (const row of rows) {
      const itemName = row[nameIndex] ? String(row[nameIndex]).trim() : '';
      if (itemName === '') {
        skippedItems++;
        continue;
      }
      // NOU: Llegeix la quantitat si existeix
      const itemQuantity = quantityIndex !== -1 && row[quantityIndex] ? String(row[quantityIndex]).trim() : ''; 
      let itemIcon = iconIndex !== -1 && row[iconIndex] ? cleanImageUrl(String(row[iconIndex])) : '';
      let itemSecondIcon = secondIconIndex !== -1 && row[secondIconIndex] ? cleanImageUrl(String(row[secondIconIndex])) : '';
      const itemData = {
        name: itemName,
        quantity: itemQuantity, // NOU: Guarda la quantitat
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
  }, [db, userId]);

  // Funcions d'autenticació
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
    isAuthReady,
    addItem,
    updateItem,
    deleteItem,
    toggleItemInShoppingList,
    toggleBought,
    updateItemOrder, // <-- NOVA FUNCIÓ
    uploadFromExcel,
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout,
    cleanImageUrl
  };
};
