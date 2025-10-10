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
    ''
];

export const useFirebase = () => {
  const [userId, setUserId] = useState(null);
  const [userEmail, setUserEmail] = useState(null);
  const [items, setItems] = useState([]);
  const [sectionOrder, setSectionOrder] = useState({});
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [lists, setLists] = useState([]);
  const [activeListId, setActiveListId] = useState(null);
  // ⭐ NOU: Estat per guardar les llistes compartides
  const [sharedLists, setSharedLists] = useState({});


  // ----------------------------------------------------
  // 1. AUTENTICACIÓ I ESTATS D'USUARI
  // ----------------------------------------------------

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUserId(user.uid);
        setUserEmail(user.email);

        const listDocRef = doc(db, 'userLists', user.uid);
        const listDocSnap = await getDoc(listDocRef);

        if (!listDocSnap.exists()) {
            const defaultListId = doc(collection(db, 'lists')).id;
            await setDoc(listDocRef, {
                lists: [{ id: defaultListId, name: "La Meva Llista" }],
                activeListId: defaultListId
            });
            await setDoc(doc(db, 'lists', defaultListId), { 
                name: "La Meva Llista", 
                userId: user.uid, 
                createdAt: serverTimestamp(),
                sharedWith: [] // ⭐ NOU: Array d'usuaris amb accés
            });
            setActiveListId(defaultListId);

        } else {
            const data = listDocSnap.data();
            setLists(data.lists || []);
            setActiveListId(data.activeListId || (data.lists && data.lists[0] ? data.lists[0].id : null));
        }

      } else {
        setUserId(null);
        setUserEmail(null);
        setLists([]);
        setActiveListId(null);
        setSharedLists({});
      }
      setIsAuthReady(true);
    });
    return unsub;
  }, []);

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

  // ⭐ NOU: Escoltar canvis a les llistes per saber amb qui estan compartides
  useEffect(() => {
    if (!lists || lists.length === 0) {
        setSharedLists({});
        return;
    }

    const unsubscribes = lists.map(list => {
        const listRef = doc(db, 'lists', list.id);
        
        return onSnapshot(listRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setSharedLists(prev => ({
                    ...prev,
                    [list.id]: {
                        ownerId: data.userId,
                        sharedWith: data.sharedWith || []
                    }
                }));
            }
        }, (error) => {
            console.error(`Error escoltant llista ${list.id}:`, error);
        });
    });

    return () => {
        unsubscribes.forEach(unsub => unsub());
    };
  }, [lists]);

  useEffect(() => {
    if (!userId || !activeListId) return;

    const sectionsRef = doc(db, 'sectionOrder', `${userId}_${activeListId}`);

    const unsub = onSnapshot(sectionsRef, (docSnap) => {
        if (docSnap.exists()) {
            const rawOrder = docSnap.data().order || {};
            console.log('📥 RAW ORDER des de Firebase:', rawOrder);

            const normalizedOrder = {};

            Object.keys(rawOrder).forEach(key => {
                const normalizedKey = (key === 'SENSE_SECCIO' || key === '__EMPTY_SECTION__') ? '' : key;
                normalizedOrder[normalizedKey] = rawOrder[key];
            });

            console.log('✅ NORMALIZED ORDER aplicat:', normalizedOrder);
            setSectionOrder(normalizedOrder);
        } else {
            const defaultOrder = DEFAULT_SECTION_ORDER.reduce((acc, section, index) => {
                acc[section] = index;
                return acc;
            }, {});
            console.log('🔄 Usant ordre per defecte:', defaultOrder);
            setSectionOrder(defaultOrder);
        }
    }, (error) => {
        console.error("Error carregar ordre de seccions:", error);
    });

    return unsub;
  }, [userId, activeListId]);

  useEffect(() => {
    if (!userId || !activeListId) {
      setItems([]);
      return;
    }

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

      await setDoc(newListRef, {
          name: name,
          userId: userId,
          createdAt: serverTimestamp(),
          sharedWith: [] // ⭐ NOU: Array buit per usuaris compartits
      });

      const newLists = [...lists, { id: newListId, name: name }];
      await updateListsInFirestore(newLists, newListId);

  }, [userId, lists, updateListsInFirestore]);

  const updateListName = useCallback(async (listId, newName) => {
      if (!userId) throw new Error("Usuari no autenticat.");

      await updateDoc(doc(db, 'lists', listId), { name: newName });

      const newLists = lists.map(l => l.id === listId ? { ...l, name: newName } : l);
      await updateListsInFirestore(newLists, activeListId);

  }, [userId, lists, activeListId, updateListsInFirestore]);

  const deleteList = useCallback(async (listId) => {
      if (!userId) throw new Error("Usuari no autenticat.");
      if (lists.length <= 1) throw new Error("No pots eliminar l'última llista.");

      const remainingLists = lists.filter(l => l.id !== listId);
      const newActiveListId = remainingLists[0].id;

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

      setActiveListId(listId);
      await updateDoc(doc(db, 'userLists', userId), {
          activeListId: listId,
          updatedAt: serverTimestamp()
      });

  }, [userId]);


  // ----------------------------------------------------
  // 2B. ⭐ NOVES FUNCIONS PER COMPARTIR LLISTES
  // ----------------------------------------------------

  // Funció per buscar un usuari per email
  const findUserByEmail = useCallback(async (email) => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email.toLowerCase()));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
          return null;
      }
      
      return {
          uid: snapshot.docs[0].id,
          email: snapshot.docs[0].data().email
      };
  }, []);

  // Funció per compartir una llista amb un altre usuari
  const shareList = useCallback(async (listId, targetEmail) => {
      if (!userId || !userEmail) throw new Error("Usuari no autenticat.");
      
      // Normalitzem l'email
      const normalizedEmail = targetEmail.toLowerCase().trim();
      
      // Busquem l'usuari amb aquest email
      const targetUser = await findUserByEmail(normalizedEmail);
      
      if (!targetUser) {
          throw new Error("Aquest usuari no està registrat a l'aplicació.");
      }
      
      if (targetUser.uid === userId) {
          throw new Error("No pots compartir una llista amb tu mateix/a.");
      }
      
      // Obtenim la informació de la llista
      const listRef = doc(db, 'lists', listId);
      const listSnap = await getDoc(listRef);
      
      if (!listSnap.exists()) {
          throw new Error("La llista no existeix.");
      }
      
      const listData = listSnap.data();
      
      // Comprovem si ja està compartida amb aquest usuari
      const currentSharedWith = listData.sharedWith || [];
      if (currentSharedWith.some(user => user.email === normalizedEmail)) {
          throw new Error("Aquesta llista ja està compartida amb aquest usuari.");
      }
      
      // Afegim l'usuari a la llista compartida
      const updatedSharedWith = [
          ...currentSharedWith,
          {
              uid: targetUser.uid,
              email: normalizedEmail,
              addedAt: new Date().toISOString()
          }
      ];
      
      // Actualitzem la llista a Firebase
      await updateDoc(listRef, {
          sharedWith: updatedSharedWith,
          updatedAt: serverTimestamp()
      });
      
      // Afegim la llista al document userLists de l'usuari objectiu
      const targetUserListsRef = doc(db, 'userLists', targetUser.uid);
      const targetUserListsSnap = await getDoc(targetUserListsRef);
      
      if (targetUserListsSnap.exists()) {
          const targetUserData = targetUserListsSnap.data();
          const targetUserLists = targetUserData.lists || [];
          
          // Comprovem si ja té aquesta llista
          if (!targetUserLists.some(l => l.id === listId)) {
              targetUserLists.push({
                  id: listId,
                  name: listData.name
              });
              
              await updateDoc(targetUserListsRef, {
                  lists: targetUserLists,
                  updatedAt: serverTimestamp()
              });
          }
      }
      
      return true;
  }, [userId, userEmail, findUserByEmail]);

  // Funció per eliminar l'accés d'un usuari a una llista
  const removeListAccess = useCallback(async (listId, targetEmail) => {
      if (!userId) throw new Error("Usuari no autenticat.");
      
      const normalizedEmail = targetEmail.toLowerCase().trim();
      
      // Obtenim la informació de la llista
      const listRef = doc(db, 'lists', listId);
      const listSnap = await getDoc(listRef);
      
      if (!listSnap.exists()) {
          throw new Error("La llista no existeix.");
      }
      
      const listData = listSnap.data();
      const currentSharedWith = listData.sharedWith || [];
      
      // Trobem l'usuari a eliminar
      const userToRemove = currentSharedWith.find(user => user.email === normalizedEmail);
      
      if (!userToRemove) {
          throw new Error("Aquest usuari no té accés a la llista.");
      }
      
      // Eliminem l'usuari de la llista compartida
      const updatedSharedWith = currentSharedWith.filter(user => user.email !== normalizedEmail);
      
      await updateDoc(listRef, {
          sharedWith: updatedSharedWith,
          updatedAt: serverTimestamp()
      });
      
      // Eliminem la llista del document userLists de l'usuari objectiu
      const targetUserListsRef = doc(db, 'userLists', userToRemove.uid);
      const targetUserListsSnap = await getDoc(targetUserListsRef);
      
      if (targetUserListsSnap.exists()) {
          const targetUserData = targetUserListsSnap.data();
          const targetUserLists = targetUserData.lists || [];
          
          const updatedTargetLists = targetUserLists.filter(l => l.id !== listId);
          
          await updateDoc(targetUserListsRef, {
              lists: updatedTargetLists,
              updatedAt: serverTimestamp()
          });
      }
      
      return true;
  }, [userId]);

  // Funció per obtenir amb qui està compartida una llista
  const getListSharedWith = useCallback((listId) => {
      if (!sharedLists[listId]) return [];
      return sharedLists[listId].sharedWith || [];
  }, [sharedLists]);


  // ----------------------------------------------------
  // 3. GESTIÓ D'ELEMENTS
  // ----------------------------------------------------

  const addItem = useCallback(async (itemData) => {
    if (!userId || !activeListId) throw new Error("Usuari o llista no seleccionada.");

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
        isInShoppingList: itemData.isInShoppingList ?? false,
        isBought: false,
        orderIndex: newOrderIndex,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error afegint element:", error);
      throw new Error("No s'ha pogut afegir l'element a Firebase.");
    }
  }, [userId, activeListId, items]);

  const updateItem = useCallback(async (id, updatedData) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const currentItem = items.find(i => i.id === id);
    if (!currentItem) {
        console.error("Ítem no trobat a l'estat local:", id);
        throw new Error("Ítem no trobat per actualitzar.");
    }

    let finalUpdatedData = { ...updatedData };

    const isAddingQuantity = (
        currentItem.isInShoppingList === false &&
        'quantity' in updatedData &&
        String(updatedData.quantity || '').trim() !== ''
    );

    if (isAddingQuantity) {
        const sectionItems = items.filter(i =>
            (i.section || '') === (currentItem.section || '') &&
            i.listId === activeListId &&
            i.isInShoppingList === true
        );
        const maxOrderIndex = sectionItems.reduce((max, i) =>
            (i.orderIndex !== undefined && i.orderIndex > max ? i.orderIndex : max), -1
        );
        const newOrderIndex = maxOrderIndex + 1;

        finalUpdatedData.isInShoppingList = true;
        finalUpdatedData.isBought = false;
        finalUpdatedData.orderIndex = newOrderIndex;
    }

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

  const toggleItemInShoppingList = useCallback(async (item) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    const newStatus = !item.isInShoppingList;
    const newQuantity = newStatus ? (item.quantity || '') : '';

    let newOrderIndex = item.orderIndex;

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
            isBought: false,
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
         try {
            await updateDoc(doc(db, 'items', item.id), {
                isInShoppingList: newStatus,
                isBought: false,
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

  // ------------------------------------------------------------------
  // ⭐ FUNCIÓ MODIFICADA PER PERMETRE EL SOL CLIC (De Despensa a Per Comprar)
  // ------------------------------------------------------------------
  const toggleBought = useCallback(async (item, newStatus) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const updatedData = {
        isBought: newStatus,
        updatedAt: serverTimestamp()
    };

    // SI L'ELEMENT ES MARCA COM A COMPRAT (Va a la Despensa)
    if (newStatus) {
        updatedData.quantity = ''; // Treiem la quantitat (ja està a la despensa)
        // L'ítem es manté a isInShoppingList: true per defecte.
    } else {
        // SI L'ELEMENT ES DESMARCA COM A COMPRAT (Torna a 'Per Comprar')
        
        // 1. Assegurem que es mantingui a la llista de la compra per complir l'objectiu del sol clic.
        updatedData.isInShoppingList = true; 

        // 2. Recalculem l'ordre perquè es mostri al final de la seva secció a 'Per Comprar'
        const sectionItems = items.filter(i =>
            (i.section || '') === (item.section || '') &&
            i.listId === activeListId &&
            i.isInShoppingList === true &&
            i.id !== item.id // <--- IMPORTANT: Excloem l'ítem actual del càlcul
        );
        const maxOrderIndex = sectionItems.reduce((max, i) =>
            (i.orderIndex !== undefined && i.orderIndex > max ? i.orderIndex : max), -1
        );
        updatedData.orderIndex = maxOrderIndex + 1;
        // La quantitat es manté si existia, o s'hauria de restablir al valor que tenia abans de comprar.
        // Aquí no la toquem per mantenir la lògica original, ja que l'objectiu és l'estat.
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

  const updateAllSectionsOrder = useCallback(async (sectionsArray) => {
    if (!userId || !activeListId) throw new Error("Usuari no autenticat o llista no seleccionada.");

    console.log('🔄 Actualitzant TOTES les seccions per llista:', activeListId, sectionsArray);

    const newSectionOrder = {};
    sectionsArray.forEach((sectionName, index) => {
      const key = sectionName === '' ? 'SENSE_SECCIO' : sectionName;
      newSectionOrder[key] = index;
    });

    console.log('💾 Guardant a Firebase:', newSectionOrder);

    try {
      await setDoc(doc(db, 'sectionOrder', `${userId}_${activeListId}`), {
          order: newSectionOrder,
          updatedAt: serverTimestamp()
      });
      console.log('✅ Guardat correctament a Firebase');
    } catch (error) {
      console.error("❌ Error actualitzant ordre de seccions:", error);
      throw new Error("No s'ha pogut actualitzar l'ordre de les seccions.");
    }
  }, [userId, activeListId]);
  
  const updateSectionOrder = useCallback(async (sectionName, newIndex) => {
    if (!userId || !activeListId) throw new Error("Usuari no autenticat o llista no seleccionada.");

    console.log(`🔄 Actualitzant secció "${sectionName}" a índex ${newIndex}`);

    const sectionKey = sectionName === '' ? 'SENSE_SECCIO' : sectionName;

    const newSectionOrder = {};

    Object.keys(sectionOrder).forEach(key => {
      if (key !== '' && key !== '__EMPTY_SECTION__' && key !== sectionName) {
        const firebaseKey = key === '' ? 'SENSE_SECCIO' : key;
        newSectionOrder[firebaseKey] = sectionOrder[key];
      } else if (key === '' || key === '__EMPTY_SECTION__') {
        if (sectionName !== '') {
          newSectionOrder['SENSE_SECCIO'] = sectionOrder[key];
        }
      }
    });

    newSectionOrder[sectionKey] = newIndex;

    console.log('💾 Guardant a Firebase:', newSectionOrder);

    try {
      await setDoc(doc(db, 'sectionOrder', `${userId}_${activeListId}`), {
          order: newSectionOrder,
          updatedAt: serverTimestamp()
      });
      console.log('✅ Guardat correctament a Firebase');
    } catch (error) {
      console.error("❌ Error actualitzant ordre de secció:", error);
      throw new Error("No s'ha pogut actualitzar l'ordre de la secció.");
    }
  }, [userId, activeListId, sectionOrder]);


  const clearCompletedItems = useCallback(async () => {
    if (!userId || !activeListId) return 0;

    const q = query(
        collection(db, 'items'),
        where('userId', '==', userId),
        where('listId', '==', activeListId),
        where('isBought', '==', true)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        return 0;
    }

    const batch = writeBatch(db);
    let count = 0;

    snapshot.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, {
            isBought: false,
            isInShoppingList: false,
            quantity: '',
            orderIndex: -1,
            updatedAt: serverTimestamp()
        });
        count++;
    });

    await batch.commit();
    return count;
  }, [userId, activeListId]);

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
            isInShoppingList: false,
            isBought: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        if (!existingSnapshot.empty) {
            const docRef = existingSnapshot.docs[0].ref;
            batch.update(docRef, itemData);
        } else {
            const newDocRef = doc(itemsCollection);
            batch.set(newDocRef, { ...itemData, orderIndex: -1 });
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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ⭐ NOU: Guardem l'email a la col·lecció 'users' per poder buscar usuaris
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
          email: email.toLowerCase(),
          updatedAt: serverTimestamp()
      }, { merge: true });
      
      return true;
    } catch (error) {
      console.error("Error iniciant sessió:", error);
      throw error;
    }
  }, []);

  const handleRegister = useCallback(async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // ⭐ NOU: Guardem l'email a la col·lecció 'users' per poder buscar usuaris
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
          email: email.toLowerCase(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
      });
      
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
    lists,
    activeListId,
    setActiveListId: setActiveListIdAndSave,
    addList,
    updateListName,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    toggleItemInShoppingList,
    toggleBought, // Aquesta és la funció que hem modificat!
    clearCompletedItems,
    uploadFromExcel,
    updateItemOrder,
    updateSectionOrder,
    updateAllSectionsOrder,
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout,
    cleanImageUrl,
    // ⭐ NOVES FUNCIONS EXPORTADES
    shareList,
    removeListAccess,
    getListSharedWith
  };
};
