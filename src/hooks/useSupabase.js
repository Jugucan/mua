import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const cleanImageUrl = (url) => {
  if (!url || typeof url !== 'string') return "";
  return url;
};

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

export const useSupabase = () => {
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
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
        initializeUserLists(session.user.id);
      }
      setIsAuthReady(true);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setUserEmail(session.user.email);
        initializeUserLists(session.user.id);
      } else {
        setUserId(null);
        setUserEmail(null);
        setLists([]);
        setActiveListId(null);
      }
      setIsAuthReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const initializeUserLists = async (uid) => {
    const { data: userLists, error } = await supabase
      .from('lists')
      .select('*')
      .eq('user_id', uid)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error carregant llistes:', error);
      return;
    }

    if (userLists.length === 0) {
      const { data: newList, error: createError } = await supabase
        .from('lists')
        .insert([{ user_id: uid, name: 'La Meva Llista' }])
        .select()
        .single();

      if (createError) {
        console.error('Error creant llista per defecte:', createError);
        return;
      }

      setLists([newList]);
      setActiveListId(newList.id);
    } else {
      setLists(userLists);
      setActiveListId(userLists[0].id);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLists([]);
      setActiveListId(null);
      return;
    }

    const channel = supabase
      .channel('lists-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lists', filter: `user_id=eq.${userId}` },
        async () => {
          const { data } = await supabase
            .from('lists')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true });

          if (data) {
            setLists(data);
            if (!activeListId && data.length > 0) {
              setActiveListId(data[0].id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, activeListId]);

  useEffect(() => {
    if (!userId || !activeListId) {
      setItems([]);
      return;
    }

    const fetchItems = async () => {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('list_id', activeListId)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error carregant items:', error);
        return;
      }

      setItems(data || []);
    };

    fetchItems();

    const channel = supabase
      .channel('items-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'items', filter: `list_id=eq.${activeListId}` },
        fetchItems
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, activeListId]);

  // ----------------------------------------------------
  // 2. GESTIÓ DE LLISTES
  // ----------------------------------------------------

  const addList = useCallback(async (name) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const { data, error } = await supabase
      .from('lists')
      .insert([{ user_id: userId, name }])
      .select()
      .single();

    if (error) throw error;

    setActiveListId(data.id);
  }, [userId]);

  const updateListName = useCallback(async (listId, newName) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const { error } = await supabase
      .from('lists')
      .update({ name: newName })
      .eq('id', listId)
      .eq('user_id', userId);

    if (error) throw error;
  }, [userId]);

  const deleteList = useCallback(async (listId) => {
    if (!userId) throw new Error("Usuari no autenticat.");
    if (lists.length <= 1) throw new Error("No pots eliminar l'última llista.");

    const remainingLists = lists.filter(l => l.id !== listId);
    const newActiveListId = remainingLists[0].id;

    const { error: updateError } = await supabase
      .from('items')
      .update({ list_id: newActiveListId })
      .eq('list_id', listId);

    if (updateError) throw updateError;

    const { error: deleteError } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId)
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    setActiveListId(newActiveListId);
  }, [userId, lists]);

  const setActiveListIdAndSave = useCallback((listId) => {
    setActiveListId(listId);
  }, []);

  // ----------------------------------------------------
  // 3. GESTIÓ D'ELEMENTS
  // ----------------------------------------------------

  const addItem = useCallback(async (itemData) => {
    if (!userId || !activeListId) throw new Error("Usuari o llista no seleccionada.");

    const { error } = await supabase
      .from('items')
      .insert([{
        list_id: activeListId,
        text: itemData.name,
        completed: false
      }]);

    if (error) throw error;
  }, [userId, activeListId]);

  const updateItem = useCallback(async (id, updatedData) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const updatePayload = {};
    if ('name' in updatedData) updatePayload.text = updatedData.name;
    if ('completed' in updatedData) updatePayload.completed = updatedData.completed;

    const { error } = await supabase
      .from('items')
      .update(updatePayload)
      .eq('id', id);

    if (error) throw error;
  }, [userId]);

  const deleteItem = useCallback(async (item) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', item.id);

    if (error) throw error;
  }, [userId]);

  const toggleItemInShoppingList = useCallback(async (item) => {
    return true;
  }, []);

  const toggleBought = useCallback(async (item, newStatus) => {
    if (!userId) throw new Error("Usuari no autenticat.");

    const { error } = await supabase
      .from('items')
      .update({ completed: newStatus })
      .eq('id', item.id);

    if (error) throw error;
    return newStatus;
  }, [userId]);

  // ----------------------------------------------------
  // 4. ORDENACIÓ I GESTIÓ MASSIVA
  // ----------------------------------------------------

  const updateItemOrder = useCallback(async (itemId, newOrderIndex) => {
    return;
  }, []);

  const updateAllSectionsOrder = useCallback(async (sectionsArray) => {
    return;
  }, []);

  const updateSectionOrder = useCallback(async (sectionName, newIndex) => {
    return;
  }, []);

  const clearCompletedItems = useCallback(async () => {
    if (!userId || !activeListId) return 0;

    const { data: completedItems } = await supabase
      .from('items')
      .select('id')
      .eq('list_id', activeListId)
      .eq('completed', true);

    if (!completedItems || completedItems.length === 0) return 0;

    const { error } = await supabase
      .from('items')
      .delete()
      .eq('list_id', activeListId)
      .eq('completed', true);

    if (error) throw error;

    return completedItems.length;
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

    if (NAME_INDEX === -1) {
        throw new Error("La columna 'Nom' és obligatòria i no s'ha trobat a la primera fila.");
    }

    let successfulUploads = 0;
    let skippedItems = 0;

    for (const row of validRows) {
        const name = row[NAME_INDEX] ? String(row[NAME_INDEX]).trim() : '';

        if (!name) {
            skippedItems++;
            continue;
        }

        const { error } = await supabase
          .from('items')
          .insert([{
            list_id: activeListId,
            text: name,
            completed: false
          }]);

        if (error) {
          console.error('Error afegint item:', error);
          skippedItems++;
        } else {
          successfulUploads++;
        }
    }

    return { successfulUploads, skippedItems };
  }, [userId, activeListId]);

  // ----------------------------------------------------
  // 6. AUTENTICACIÓ
  // ----------------------------------------------------

  const handleLogin = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return true;
  }, []);

  const handleRegister = useCallback(async (email, password) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) throw error;
    return true;
  }, []);

  const handlePasswordReset = useCallback(async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) throw error;
    return true;
  }, []);

  const handleLogout = useCallback(async () => {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    setUserEmail(null);
    return true;
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
    toggleBought,
    clearCompletedItems,
    uploadFromExcel,
    updateItemOrder,
    updateSectionOrder,
    updateAllSectionsOrder,
    handleLogin,
    handleRegister,
    handlePasswordReset,
    handleLogout,
    cleanImageUrl
  };
};
