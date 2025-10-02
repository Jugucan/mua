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
  where, 
  getDocs 
} from 'firebase/firestore';
import * as XLSX from 'xlsx';

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
  // Funció per netejar la URL, potser per eliminar paràmetres de seguiment o ajustar la mida de la imatge
  // De moment retornem la URL tal qual
  return url;
};

// Ordre de seccions per defecte
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

export const useFirebase = () => {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [items, setItems] = useState([]);
  const [sectionOrder, setSectionOrder] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);


  // ----------------------------------------------------
  // 1. AUTENTICACIÓ I ESTATS D'USUARI
  // ----------------------------------------------------

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);
        
        // Assegurar-se que l'usuari té una llista de la compra per defecte
        const listDocRef = doc(db, 'userLists', user.uid);
        const listDocSnap = await getDoc(listDocRef);

        if (!listDocSnap.exists()) {
            // Si no hi ha document de llistes, creem la llista per defecte
            const defaultListId = doc(collection(db, 'lists')).id;
            await setDoc(listDocRef, {
                lists: [{ id: defaultListId, name: "La Meva Llista" }],
                activeListId: defaultListId
            });
            // Creem l'element de la llista per defecte
            await setDoc(doc(db, 'lists', defaultListId), { name: "La Meva Llista", userId: user.uid, createdAt: serverTimestamp() });
            setActiveListId(defaultListId);

        } else {
            // Si hi ha document, carregar l'estat
            const data = listDocSnap.data();
            setLists(data.lists || []);
            setActiveListId(data.activeListId || (data.lists && data.lists[0] ? data.lists[0].id : null));
        }

      } else {
        setUserId(null);
        setUserEmail(null);
        setLists([]);
        setActiveListId(null);
      }
      setIsAuthReady(true);
    });
    return unsub;
  }, []);
  
  // Sincronitza la informació de llistes (si l'usuari existeix)
  useEffect(() => {
    if (!userId) {
        setLists([]);
        setActiveListId(null);
        return;
    }
    
    const listDocRef = doc(db, 'userLists', userId);
    
    const unsub = onSnapshot(listDocRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            setLists(data.lists || []);
            setActiveListId(data.activeListId || (data.lists && data.lists[0] ? data.lists[0].id : null));
        }
    }, (error) => {
        console.error("Error carregar llistes:", error);
    });
    
    return unsub;
  }, [userId]);
  
  // Sincronitza l'ordre de les seccions (si l'usuari existeix)
  useEffect(() => {
    if (!userId) return;

    const sectionsRef = doc(db, 'sectionOrder', userId);
    
    const unsub = onSnapshot(sectionsRef, (docSnap) => {
        if (docSnap.exists()) {
            setSectionOrder(docSnap.data().order || {});
        } else {
            // Si no hi ha un ordre personalitzat, utilitzem el per defecte
            const defaultOrder = DEFAULT_SECTION_ORDER.reduce((acc, section, index) => {
                acc[section] = index;
                return acc;
            }, {});
            setSectionOrder(defaultOrder);
        }
    }, (error) => {
        console.error("Error carregar ordre de seccions:", error);
    });
    
    return unsub;
  }, [userId]);

  // Sincronitza els elements de la llista (si la llista activa existeix)
  useEffect(() => {
    if (!userId || !activeListId) {
      setItems([]);
      return;
    }
    
    // Ordre: Primer pel flag isInShoppingList, després per orderIndex, després alfabèticament
    const q = query(
      collection(db, 'items'),
      where('userId', '==', userId),
      where('listId', '==', activeListId),
      orderBy('isInShoppingList', 'desc'),
      orderBy('orderIndex', 'asc'),
      orderBy('name', 'asc') 
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setItems(fetchedItems);
    }, (error) => {
        console.error("Error carregar items:", error);
    });

    return unsub;
  }, [userId, activeListId]);
  
  // ----------------------------------------------------
  // 2. GESTIÓ DE LLISTES
  // ----------------------------------------------------
  
  const updateListsInFirestore = useCallback(async (newLists, newActiveListId) => {
      if (!userId) return;
      const listDocRef = doc(db, 'userLists', userId);
      await updateDoc(listDocRef, {
          lists: newLists,
          activeListId: newActiveListId,
          updatedAt: serverTimestamp()
      });
  }, [userId]);
  
  const addList = useCallback(async (name) => {
      if (!userId) throw new Error("Usuari no autenticat.");
      
      const newListRef = doc(collection(db, 'lists'));
      const newListId = newListRef.id;
      
      // 1. Crear l'entrada de la llista
      await setDoc(newListRef, {
          name: name,
          userId: userId,
          createdAt: serverTimestamp()
      });
      
      // 2. Actualitzar la llista de llistes de l'usuari
      const newLists = [...lists, { id: newListId, name: name }];
      await updateListsInFirestore(newLists, newListId);
      
  }, [userId, lists, updateListsInFirestore]);

  const updateListName = useCallback(async (listId, newName) => {
      if (!userId) throw new Error("Usuari no autenticat.");
      
      // 1. Actualitzar el document principal de la llista
      await updateDoc(doc(db, 'lists', listId), { name: newName });
      
      // 2. Actualitzar la llista de llistes de l'usuari
      const newLists = lists.map(l => l.id === listId ? { ...l, name: newName } : l);
      await updateListsInFirestore(newLists, activeListId);

  }, [userId, lists, activeListId, updateListsInFirestore]);
  
  const deleteList = useCallback(async (listId) => {
      if (!userId) throw new Error("Usuari no autenticat.");
      if (lists.length <= 1) throw new Error("No pots eliminar l'última llista.");
      
      // 1. Seleccionar la nova llista activa
      const remainingLists = lists.filter(l => l.id !== listId);
      const newActiveListId = remainingLists[0].id;

      // 2. Eliminar la referència de la llista (però no els items encara)
      // Mantenim l'entrada 'lists/listId' fins que es decideixi el destí dels items.
      
      // 3. Moure tots els items d'aquesta llista a la nova llista activa
      const q = query(
        collection(db, 'items'),
        where('userId', '==', userId),
        where('listId', '==', listId)
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      
      snapshot.docs.forEach(docSnap => {
          batch.update(docSnap.ref, { listId: newActiveListId });
      });
      
      // 4. Eliminar el document de la llista i actualitzar l'estat de l'usuari
      batch.delete(doc(db, 'lists', listId));
      batch.update(doc(db, 'userLists', userId), {
          lists: remainingLists,
          activeListId: newActiveListId,
          updatedAt: serverTimestamp()
      });

      await batch.commit();

  }, [userId, lists]);
  
  const setActiveListIdAndSave = useCallback(async (listId) => {
      if (!userId) return;
      
      // Canviar l'estat local i guardar a Firestore
      setActiveListId(listId);
      await updateDoc(doc(db, 'userLists', userId), {
          activeListId: listId,
          updatedAt: serverTimestamp()
      });
      
  }, [userId]);
  

  // ----------------------------------------------------
  // 3. GESTIÓ D'ELEMENTS
  // ----------------------------------------------------

  const addItem = useCallback(async (itemData) => {
    if (!userId || !activeListId) throw new Error("Usuari o llista no seleccionada.");
    
    // Calcula el següent orderIndex per a la secció
    const sectionItems = items.filter(i => 
        (i.section || '') === (itemData.section || '') && 
        i.listId === activeListId &&
        i.isInShoppingList === true
    );
    const maxOrderIndex = sectionItems.reduce((max, item) => 
        (item.orderIndex !== undefined && item.orderIndex > max ? item.orderIndex : max), -1
    );
    const newOrderIndex = maxOrderIndex + 1;

    try {
      await addDoc(collection(db, 'items'), {
        userId: userId,
        listId: activeListId,
        name: itemData.name,
        quantity: itemData.quantity || '',
        section: itemData.section || '',
        icon: itemData.icon || '',
        secondIcon: itemData.secondIcon || '',
        isInShoppingList: itemData.isInShoppingList ?? false, // Per defecte fora de la llista
        isBought: false,
        orderIndex: newOrderIndex, // Assignem un orderIndex
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error afegint element:", error);
      throw new Error("No s'ha pogut afegir l'element a Firebase.");
    }
  }, [userId, activeListId, items]);

  // FUNCIÓ updateItem: Actualitzada en l'apartat anterior
  const updateItem = useCallback(async (id, updatedData) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    
    // 1. Cercar l'element actual a la llista local
    const currentItem = items.find(i => i.id === id);
    if (!currentItem) {
        console.error("Ítem no trobat a l'estat local:", id);
        throw new Error("Ítem no trobat per actualitzar.");
    }

    // 2. Comprovar si s'ha d'activar la lògica de "moure a la llista de la compra"
    let finalUpdatedData = { ...updatedData };
    
    const isAddingQuantity = (
        currentItem.isInShoppingList === false &&
        'quantity' in updatedData && 
        String(updatedData.quantity || '').trim() !== ''
    );

    if (isAddingQuantity) {
        // Càlcul del nou orderIndex, només si el movem a la llista de la compra
        const sectionItems = items.filter(i => 
            (i.section || '') === (currentItem.section || '') && 
            i.listId === activeListId &&
            i.isInShoppingList === true
        );
        const maxOrderIndex = sectionItems.reduce((max, i) => 
            (i.orderIndex !== undefined && i.orderIndex > max ? i.orderIndex : max), -1
        );
        const newOrderIndex = maxOrderIndex + 1;
        
        // Moure l'ítem a la llista de la compra
        finalUpdatedData.isInShoppingList = true;
        finalUpdatedData.isBought = false; // Assegurem-nos que no està marcat com a comprat
        finalUpdatedData.orderIndex = newOrderIndex;
    }
    
    // 3. Executar l'actualització a Firebase
    try {
      await updateDoc(doc(db, 'items', id), {
        ...finalUpdatedData,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error actualitzant element:", error);
      throw new Error("No s'ha pogut actualitzar l'element.");
    }
  }, [userId, activeListId, items]); 

  const deleteItem = useCallback(async (item) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    try {
      await deleteDoc(doc(db, 'items', item.id));
    } catch (error) {
      console.error("Error eliminant element:", error);
      throw new Error("No s'ha pogut eliminar l'element.");
    }
  }, [userId]);

  // ⭐ FUNCIÓ MODIFICADA: Si es mou de la despensa a la llista de compra, netegem 'isBought'
  const toggleItemInShoppingList = useCallback(async (item) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    const newStatus = !item.isInShoppingList;
    const newQuantity = newStatus ? (item.quantity || '') : ''; 
    
    let newOrderIndex = item.orderIndex;

    // Si l'afegim a la llista (Element de la Despensa --> Llista de Compra)
    if (newStatus) {
        const sectionItems = items.filter(i => 
            (i.section || '') === (item.section || '') && 
            i.listId === activeListId &&
            i.isInShoppingList === true
        );
        const maxOrderIndex = sectionItems.reduce((max, i) => 
            (i.orderIndex !== undefined && i.orderIndex > max ? i.orderIndex : max), -1
        );
        newOrderIndex = maxOrderIndex + 1;

        try {
          await updateDoc(doc(db, 'items', item.id), {
            isInShoppingList: newStatus,
            isBought: false, // ⭐ CANVI CLAU: Netejar l'estat de comprat
            quantity: newQuantity,
            orderIndex: newOrderIndex, 
            updatedAt: serverTimestamp()
          });
          return newStatus;
        } catch (error) {
          console.error("Error canviant estat de la llista:", error);
          throw new Error("No s'ha pogut canviar l'estat de la llista.");
        }

    } else {
        // Si el traiem de la llista (Llista de Compra --> Despensa)
         try {
            await updateDoc(doc(db, 'items', item.id), {
                isInShoppingList: newStatus,
                isBought: false, // Per defecte a la despensa sense marcar com a comprat
                quantity: newQuantity,
                orderIndex: -1, 
                updatedAt: serverTimestamp()
            });
            return newStatus;
        } catch (error) {
            console.error("Error canviant estat de la llista:", error);
            throw new Error("No s'ha pogut canviar l'estat de la llista.");
        }
    }
  }, [userId, items, activeListId]);
  
  // ⭐ FUNCIÓ CLAU MODIFICADA
  const toggleBought = useCallback(async (item, newStatus) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    
    const updatedData = {
        isBought: newStatus,
        updatedAt: serverTimestamp()
    };
    
    if (newStatus) {
        // A. Producte COMPRAT: Va a Despensa I Historial
        // ----------------------------------------------------
        updatedData.quantity = ''; 
        
        // 1. Va a la Despensa: Surt de la Llista de la Compra
        updatedData.isInShoppingList = false; 
        
        // 2. Va a l'Historial: Es manté marcat com a comprat (newStatus = true)
        
        updatedData.orderIndex = -1; 
    } else {
        // B. Producte DES-COMPRAT (o recuperat de l'historial): Va a Llista de Compra
        // ----------------------------------------------------
        
        // 1. Va a la Llista de Compra
        updatedData.isInShoppingList = true;
        
        // 2. Surt de l'Historial: isBought = false (newStatus = false)
        
        // 3. Calculem nou orderIndex
        const sectionItems = items.filter(i => 
            (i.section || '') === (item.section || '') && 
            i.listId === activeListId &&
            i.isInShoppingList === true
        );
        const maxOrderIndex = sectionItems.reduce((max, i) => 
            (i.orderIndex !== undefined && i.orderIndex > max ? i.orderIndex : max), -1
        );
        updatedData.orderIndex = maxOrderIndex + 1;
        
        // Opcional: Si l'usuari el des-compra, normalment voldrà posar-li quantitat. 
        // Si l'ítem estava a l'historial, no tenia quantitat. Li posem un 1 per defecte
        // si no té quantitat i així apareix a la llista de la compra visible.
        if (!item.quantity) {
             updatedData.quantity = '1'; 
        }
    }
    
    try {
      await updateDoc(doc(db, 'items', item.id), updatedData);
      return newStatus;
    } catch (error) {
      console.error("Error canviant estat de comprat:", error);
      throw new Error("No s'ha pogut canviar l'estat de comprat.");
    }
  }, [userId, items, activeListId]); 

  
  // ----------------------------------------------------
  // 4. ORDENACIÓ I GESTIÓ MASSIVA
  // ----------------------------------------------------

  const updateItemOrder = useCallback(async (itemId, newOrderIndex) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    try {
      await updateDoc(doc(db, 'items', itemId), {
        orderIndex: newOrderIndex,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error actualitzant ordre de producte:", error);
      throw new Error("No s'ha pogut actualitzar l'ordre del producte.");
    }
  }, [userId]);

  const updateSectionOrder = useCallback(async (sectionName, newIndex) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    const newSectionOrder = { ...sectionOrder, [sectionName]: newIndex };

    try {
      // S'utilitza setDoc amb merge: true per crear si no existeix o actualitzar si existeix
      await setDoc(doc(db, 'sectionOrder', userId), { 
          order: newSectionOrder,
          updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      console.error("Error actualitzant ordre de secció:", error);
      throw new Error("No s'ha pogut actualitzar l'ordre de la secció.");
    }
  }, [userId, sectionOrder]);


  // ⭐ FUNCIÓ CLAU MODIFICADA
  const clearCompletedItems = useCallback(async () => {
    if (!userId || !activeListId) return 0;
    
    // 1. Cerquem TOTS els elements de l'USUARI que estan marcats com a comprats (isBought: true).
    const q = query(
        collection(db, 'items'),
        where('userId', '==', userId),
        where('isBought', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
        return 0; 
    }

    const batch = writeBatch(db);
    let count = 0;

    // 2. Iterem sobre els documents i els actualitzem
    snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
            // TORNEN DE NOU A LA DESPENSA (si ja hi eren, no canvia)
            isBought: false, // Surten de l'historial
            isInShoppingList: false, // Per si algun s'havia quedat marcat a la llista
            orderIndex: -1, // Netejar ordre
            quantity: '', // Netejar quantitat
            updatedAt: serverTimestamp()
        });
        count++;
    });

    // 3. Executem l'operació massiva
    await batch.commit();
    return count;
  }, [userId]);
  
  // ----------------------------------------------------
  // 5. IMPORTACIÓ DES D'EXCEL
  // ----------------------------------------------------
  
  const uploadFromExcel = useCallback(async (data) => {
    if (!userId || !activeListId) throw new Error("Usuari o llista no seleccionada.");

    if (data.length < 2) {
      throw new Error("El fitxer Excel no té dades vàlides.");
    }

    const header = data[0].map(h => h ? h.trim() : null);
    const validRows = data.slice(1);

    const NAME_INDEX = header.indexOf('Nom');
    const QUANTITY_INDEX = header.indexOf('Quantitat');
    const SECTION_INDEX = header.indexOf('Secció');
    const ICON_INDEX = header.indexOf('Icona Principal');
    const SECOND_ICON_INDEX = header.indexOf('Icona Secundària');

    if (NAME_INDEX === -1) {
        throw new Error("La columna 'Nom' és obligatòria i no s'ha trobat a la primera fila.");
    }

    const batch = writeBatch(db);
    let successfulUploads = 0;
    let skippedItems = 0;

    const itemsCollection = collection(db, 'items');

    for (const row of validRows) {
        const name = row[NAME_INDEX] ? String(row[NAME_INDEX]).trim() : '';

        if (!name) {
            skippedItems++;
            continue;
        }

        const quantity = QUANTITY_INDEX !== -1 && row[QUANTITY_INDEX] ? String(row[QUANTITY_INDEX]).trim() : '';
        const section = SECTION_INDEX !== -1 && row[SECTION_INDEX] ? String(row[SECTION_INDEX]).trim() : '';
        const icon = ICON_INDEX !== -1 && row[ICON_INDEX] ? String(row[ICON_INDEX]).trim() : '';
        const secondIcon = SECOND_ICON_INDEX !== -1 && row[SECOND_ICON_INDEX] ? String(row[SECOND_ICON_INDEX]).trim() : '';

        // Cerca si l'element ja existeix (limitat al nom i a l'usuari/llista)
        const existingQuery = query(
            itemsCollection,
            where('userId', '==', userId),
            where('listId', '==', activeListId),
            where('name', '==', name)
        );
        const existingSnapshot = await getDocs(existingQuery);

        const itemData = {
            userId: userId,
            listId: activeListId,
            name: name,
            quantity: quantity,
            section: section,
            icon: icon,
            secondIcon: secondIcon,
            isInShoppingList: false, // Quan es puja des d'Excel, van directes a la despensa
            isBought: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (!existingSnapshot.empty) {
            // Actualitzar l'element existent
            const docRef = existingSnapshot.docs[0].ref;
            batch.update(docRef, itemData);
        } else {
            // Afegir com a nou element
            const newDocRef = doc(itemsCollection);
            batch.set(newDocRef, { ...itemData, orderIndex: -1 }); // Amb orderIndex inicial a -1
        }
        successfulUploads++;
    }

    await batch.commit();

    return { successfulUploads, skippedItems };

  }, [userId, activeListId]);


  // ----------------------------------------------------
  // 6. AUTENTICACIÓ
  // ----------------------------------------------------

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
    // LLISTES
    lists,
    activeListId,
    setActiveListId: setActiveListIdAndSave,
    addList,
    updateListName,
    deleteList,
    // ELEMENTS
    addItem,
    updateItem,
    deleteItem,
    toggleItemInShoppingList,
    toggleBought,
    // NETA I ORDENACIÓ
    clearCompletedItems, 
    uploadFromExcel,
    updateItemOrder,
    updateSectionOrder,
    // AUTH
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout
  };
};
