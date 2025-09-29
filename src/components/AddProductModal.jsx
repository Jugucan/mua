import React, { useState, useCallback } from 'react';
import { Plus, X, FileUp } from 'lucide-react';
import * as XLSX from 'xlsx';

// Aquest component rep les funcions i estats que necessita del component App.jsx
// per gestionar el formulari i la càrrega d'Excel.
function AddProductModal({
    onClose,
    availableSections,
    onAddItem, 
    onFileUpload, 
    cleanImageUrl 
}) {
    // Estats locals per al formulari
    const [newItemName, setNewItemName] = useState("");
    const [newItemQuantity, setNewItemQuantity] = useState("");
    const [newItemIcon, setNewItemIcon] = useState("");
    // NOU: Estat per la imatge secundària
    const [newItemSecondIcon, setNewItemSecondIcon] = useState(""); 
    const [newItemSection, setNewItemSection] = useState("");

    // Funció que es crida en enviar el formulari
    const handleFormSubmit = async () => {
        // Preparem les dades com feia App.jsx
        const itemData = {
            name: newItemName.trim(),
            quantity: newItemQuantity.trim(),
            // Utilitzem la funció cleanImageUrl que ens arriba per props
            icon: cleanImageUrl(newItemIcon) || 'ShoppingBag', 
            // NOU: Afegim la segona icona
            secondIcon: cleanImageUrl(newItemSecondIcon) || '', 
            section: newItemSection.trim() === "" ? null : newItemSection.trim(),
        };

        try {
            await onAddItem(itemData);
            
            // Si l'afegit és correcte, netegem els camps i tanquem el modal
            setNewItemName("");
            setNewItemQuantity("");
            setNewItemIcon("");
            // NOU: Neteja de la segona icona
            setNewItemSecondIcon(""); 
            setNewItemSection("");
            onClose(); // Tanquem el modal
        } catch (error) {
            console.error("Error afegint element:", error);
        }
    };
    
    // Funció per a la pujada d'Excel (la deixem aquí, ja que té l'input de fitxer)
    const handleExcelUpload = (event) => {
        // Cridem la funció que ve de App.jsx per gestionar la pujada
        onFileUpload(event);
        // Després de pujar, tanquem el modal
        onClose();
    };


    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" onClick={onClose}>
            {/* Contenidor del Modal - important aturar la propagació del clic */}
            <div className="bg-[#f0f3f5] p-6 rounded-xl box-shadow-neomorphic-container w-full max-w-lg relative" onClick={(e) => e.stopPropagation()}>
                
                {/* Botó per tancar */}
                <button 
                    onClick={onClose} 
                    className="absolute top-4 right-4 p-2 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button hover:bg-[#e6e6e9] transition-colors"
                    aria-label="Tancar modal"
                >
                    <X className="w-5 h-5 text-gray-700" />
                </button>

                <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">Afegeix Nou Producte</h2>

                {/* Formulari */}
                <div className="flex flex-col gap-3">
                    <input type="text" placeholder="Nom de l'element" className="w-full p-3 rounded-md focus:outline-none box-shadow-neomorphic-input" 
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter') handleFormSubmit(); }} 
                    />
                    <input type="text" placeholder="Quantitat (opcional)" className="w-full p-3 rounded-md focus:outline-none box-shadow-neomorphic-input"
                        value={newItemQuantity} 
                        onChange={(e) => setNewItemQuantity(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleFormSubmit(); }}
                    />
                    <input type="text" placeholder="URL de la imatge principal (opcional)" className="w-full p-3 rounded-md focus:outline-none box-shadow-neomorphic-input" 
                        value={newItemIcon}
                        onChange={(e) => setNewItemIcon(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter') handleFormSubmit(); }} 
                    />
                    
                    {/* NOU: Input per la imatge secundària */}
                    <input type="text" placeholder="URL de la imatge secundària (opcional)" className="w-full p-3 rounded-md focus:outline-none box-shadow-neomorphic-input" 
                        value={newItemSecondIcon}
                        onChange={(e) => setNewItemSecondIcon(e.target.value)} 
                        onKeyPress={(e) => { if (e.key === 'Enter') handleFormSubmit(); }} 
                    />
                    
                    <input type="text" list="sections-datalist" placeholder="Secció (opcional)" className="w-full p-3 rounded-md focus:outline-none box-shadow-neomorphic-input"
                        value={newItemSection} 
                        onChange={(e) => setNewItemSection(e.target.value)}
                        onKeyPress={(e) => { if (e.key === 'Enter') handleFormSubmit(); }}
                    />
                    
                    <datalist id="sections-datalist">
                        {availableSections.map((section, index) => (<option key={index} value={section} />))}
                    </datalist>

                    <button onClick={handleFormSubmit} className="mt-4 bg-[#f0f3f5] text-green-500 font-bold py-3 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] transition-colors flex items-center justify-center gap-2">
                        <Plus className="w-5 h-5" /> Afegeix element
                    </button>
                    
                    <label htmlFor="file-upload" className="w-full text-center bg-[#f0f3f5] text-gray-700 font-bold py-3 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] transition-colors flex items-center justify-center gap-2 cursor-pointer">
                        <FileUp className="w-5 h-5" /> Puja des d'Excel
                    </label>
                    
                    {/* Utilitzem la funció local handleExcelUpload, que crida onFileUpload */}
                    <input id="file-upload" type="file" accept=".xlsx, .xls" onChange={handleExcelUpload} className="hidden" />
                </div>
            </div>
        </div>
    );
}

export default AddProductModal;
