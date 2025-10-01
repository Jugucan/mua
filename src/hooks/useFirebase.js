// Reordenar manual
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

  // NOU: Actualitzar ordre de secció
  const updateSectionOrder = useCallback(async (sectionName, newOrderIndex) => {
    if (!db || !userId) return;
    try {
      const sectionsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/sectionOrder`;
      const sectionDocRef = doc(db, sectionsPath, sectionName.replace(/[^a-zA-Z0-9]/g, '_') || 'empty_section');
      await updateDoc(sectionDocRef, { 
        sectionName: sectionName,
        orderIndex: newOrderIndex 
      });
      return true;
    } catch (error) {
      // Si el document no existeix, el creem
      try {
        await addDoc(collection(db, sectionsPath), {
          sectionName: sectionName,
          orderIndex: newOrderIndex
        });
        return true;
      } catch (createError) {
        console.error("Error creant ordre de secció:", createError);
        throw createError;
      }
    }
  }, [db, userId]);

  // NOU: Carregar ordre de seccions
  const [sectionOrder, setSectionOrder] = useState({});
  
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const sectionsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/sectionOrder`;
      const sectionsCollectionRef = collection(db, sectionsPath);
      
      const unsubscribe = onSnapshot(sectionsCollectionRef, (snapshot) => {
        const sectionOrderData = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.sectionName !== undefined) {
            sectionOrderData[data.sectionName] = data.orderIndex || 0;
          }
        });
        setSectionOrder(sectionOrderData);
      }, (error) => {
        console.error("Error carregant ordre de seccions:", error);
      });

      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady]);

  // NOU: Carregar ordre de seccions
  const [sectionOrder, setSectionOrder] = useState({});
  
  useEffect(() => {
    if (db && userId && isAuthReady) {
      const sectionsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/sectionOrder`;
      const sectionsCollectionRef = collection(db, sectionsPath);
      
      const unsubscribe = onSnapshot(sectionsCollectionRef, (snapshot) => {
        const sectionOrderData = {};
        snapshot.docs.forEach(doc => {
          const data = doc.data();
          if (data.sectionName !== undefined) {
            sectionOrderData[data.sectionName] = data.orderIndex || 0;
          }
        });
        setSectionOrder(sectionOrderData);
      }, (error) => {
        console.error("Error carregant ordre de seccions:", error);
      });

      return () => unsubscribe();
    }
  }, [db, userId, isAuthReady]);

  // NOU: Actualitzar ordre de secció
  const updateSectionOrder = useCallback(async (sectionName, newOrderIndex) => {
    if (!db || !userId) return;
    try {
      const sectionsPath = `artifacts/${APP_ID}/users/${userId}/shoppingLists/mainShoppingList/sectionOrder`;
      const sectionDocRef = doc(db, sectionsPath, sectionName.replace(/[^a-zA-Z0-9]/g, '_') || 'empty_section');
      await updateDoc(sectionDocRef, { 
        sectionName: sectionName,
        orderIndex: newOrderIndex 
      });
      return true;
    } catch (error) {
      // Si el document no existeix, el creem
      try {
        await addDoc(collection(db, sectionsPath), {
          sectionName: sectionName,
          orderIndex: newOrderIndex
        });
        return true;
      } catch (createError) {
        console.error("Error creant ordre de secció:", createError);
        throw createError;
      }
    }
  }, [db, userId]);

  return {
    userId,
    userEmail,
    items,
    sectionOrder,
    sectionOrder,
    isAuthReady,
    addItem,
    updateItem,
    deleteItem,
    toggleItemInShoppingList,
    toggleBought,
    updateItemOrder,
    updateSectionOrder,
    updateSectionOrder,
    uploadFromExcel,
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout,
    cleanImageUrl
  };
