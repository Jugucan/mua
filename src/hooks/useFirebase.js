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
  writeBatch
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
const APP_ID = 'mua-app-da319'; // Pot ser que aquest ID no es necessiti aquí, però el mantenim

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

const useFirebase = () => {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [items, setItems] = useState([]);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Autenticació
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
      } else {
        setUserId(null);
        setUserEmail(null);
      }
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  // Anar a buscar dades (onSnapshot)
  useEffect(() => {
    let unsubscribe = () => {};

    if (userId) {
      const itemsColRef = collection(db, `users/${userId}/items`);
      const q = query(itemsColRef);

      unsubscribe = onSnapshot(q, (snapshot) => {
        const itemsList = snapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        setItems(itemsList);
      }, (error) => {
        console.error("Error escoltant els items:", error);
      });
    } else {
        setItems([]);
    }

    return () => unsubscribe();
  }, [db, userId]);

  // CRUD OPERATIONS
  
  const addItem = useCallback(async (itemData) => {
    if (!userId) {
      throw new Error("No estàs autenticat.");
    }
    
    // Assegura que isInShoppingList és false per defecte quan s'afegeix des de la despensa
    const newItem = {
        ...itemData,
        isInShoppingList: false, 
        isBought: false, 
        createdAt: serverTimestamp()
    };
    
    // Netejar icones si són buides
    if (newItem.icon === 'ShoppingBag') {
        newItem.icon = null;
    }
    if (newItem.secondIcon === '') {
        newItem.secondIcon = null;
    }

    try {
      await addDoc(collection(db, `users/${userId}/items`), newItem);
    } catch (error) {
      console.error("Error afegint element:", error);
      throw new Error("Error afegint l'element a la base de dades.");
    }
  }, [db, userId]);

  const updateItem = useCallback(async (id, updatedData) => {
    if (!userId) {
      throw new Error("No estàs autenticat.");
    }
    try {
      const itemDocRef = doc(db, `users/${userId}/items`, id);
      await updateDoc(itemDocRef, updatedData);
    } catch (error) {
      console.error("Error actualitzant element:", error);
      throw new Error("Error actualitzant l'element a la base de dades.");
    }
  }, [db, userId]);

  const deleteItem = useCallback(async (item) => {
    if (!userId) {
      throw new Error("No estàs autenticat.");
    }
    try {
      const itemDocRef = doc(db, `users/${userId}/items`, item.id);
      await deleteDoc(itemDocRef);
    } catch (error) {
      console.error("Error eliminant element:", error);
      throw new Error("Error eliminant l'element de la base de dades.");
    }
  }, [db, userId]);

  const toggleItemInShoppingList = useCallback(async (item) => {
    if (!userId) {
      throw new Error("No estàs autenticat.");
    }

    const itemDocRef = doc(db, `users/${userId}/items`, item.id);
    const newStatus = !item.isInShoppingList;

    const updatePayload = { 
        isInShoppingList: newStatus,
        isBought: false // Si el treiem o l'afegim, sempre passa a no comprat
    };

    try {
      await updateDoc(itemDocRef, updatePayload);
      return newStatus;
    } catch (error) {
      console.error("Error al toggleItemInShoppingList:", error);
      throw new Error("Error actualitzant l'estat de la llista de la compra.");
    }
  }, [db, userId]);
  
  
  // MODIFICACIÓ CLAU AQUÍ
  const toggleBought = useCallback(async (item, newStatus) => {
    if (!userId) {
      throw new Error("No estàs autenticat.");
    }

    const itemDocRef = doc(db, `users/${userId}/items`, item.id);

    const updatePayload = { isBought: newStatus };
    
    // LÒGICA CLAU: Si el producte es MARCA com a comprat (newStatus=true), 
    // netegem la quantitat, ja que ja no en queden per comprar.
    if (newStatus === true) {
        updatePayload.quantity = ''; 
    }
    
    // Neteja de la llista (la lògica de toggleItemInShoppingList ho faria)
    // Deixem l'estat isBought i isInShoppingList perquè funcionin junts.
    // L'usuari ha de tenir isInShoppingList = true per estar a la llista.

    try {
      await updateDoc(itemDocRef, updatePayload);
      return newStatus;
    } catch (error) {
      console.error("Error al toggleBought:", error);
      throw new Error("Error actualitzant l'estat de compra de l'element.");
    }
  }, [db, userId]);
  
  // Funció per pujar productes des d'un Excel
  const uploadFromExcel = useCallback(async (json) => {
    if (!userId) {
        throw new Error("No estàs autenticat per pujar dades.");
    }
    
    if (!Array.isArray(json) || json.length < 2) {
        throw new Error("El fitxer Excel està buit o té un format incorrecte.");
    }

    const batch = writeBatch(db);
    const itemsColRef = collection(db, `users/${userId}/items`);
    const headerRow = json[0];
    let successfulUploads = 0;
    let skippedItems = 0;

    // Mapping per ser tolerant a minúscules/majúscules i accents
    const getHeaderIndex = (name) => {
        const normalizedName = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
        const mapping = {
            'nom': 0,
            'quantitat': 1,
            'seccio': 2,
            'icona principal': 3,
            'icona secundaria': 4,
            'a la llista': 5,
            'comprat': 6
        };
        // Busca al mapping
        for (const [key, index] of Object.entries(mapping)) {
            if (headerRow[index] && headerRow[index].toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim() === key) {
                return {
                    nameIndex: mapping['nom'],
                    quantityIndex: mapping['quantitat'],
                    sectionIndex: mapping['seccio'],
                    iconIndex: mapping['icona principal'],
                    secondIconIndex: mapping['icona secundaria'],
                    isInListIndex: mapping['a la llista'],
                    isBoughtIndex: mapping['comprat'],
                };
            }
        }
        // Si no es troben capçaleres, intentem per posició predeterminada
        return {
            nameIndex: 0,
            quantityIndex: 1,
            sectionIndex: 2,
            iconIndex: 3,
            secondIconIndex: 4,
            isInListIndex: 5,
            isBoughtIndex: 6,
        };
    };

    const indices = getHeaderIndex('Nom'); // Cerca amb el nom "Nom" per inicialitzar els índexs

    // Iterem sobre les files de dades (saltant la capçalera)
    for (let i = 1; i < json.length; i++) {
        const row = json[i];
        const name = (row[indices.nameIndex] || '').toString().trim();

        if (!name) {
            skippedItems++;
            continue; // Saltar files sense nom de producte
        }
        
        const rawIsInList = (row[indices.isInListIndex] || '').toString().toLowerCase().trim();
        const rawIsBought = (row[indices.isBoughtIndex] || '').toString().toLowerCase().trim();

        const newItem = {
            name: name,
            quantity: (row[indices.quantityIndex] || '').toString().trim(),
            section: (row[indices.sectionIndex] || '').toString().trim() || null,
            icon: cleanImageUrl((row[indices.iconIndex] || '').toString()) || null,
            secondIcon: cleanImageUrl((row[indices.secondIconIndex] || '').toString()) || null,
            isInShoppingList: rawIsInList === 'si' || rawIsInList === 'sí' || rawIsInList === 'true',
            isBought: rawIsBought === 'si' || rawIsBought === 'sí' || rawIsBought === 'true',
            createdAt: serverTimestamp()
        };
        
        // Assegurar que un producte a la llista però marcat com comprat no tingui quantitat
        if (newItem.isBought) {
            newItem.quantity = '';
        }

        const newDocRef = doc(itemsColRef);
        batch.set(newDocRef, newItem);
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
    uploadFromExcel,
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout,
    cleanImageUrl
  };
};

export default useFirebase;
