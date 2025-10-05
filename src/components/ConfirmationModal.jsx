import React from 'react';
import { X } from 'lucide-react';

const ConfirmationModal = ({
    title, // El deixarem buit per l'estil que vols
    message,
    confirmLabel = "Confirma",
    cancelLabel = "Cancel·la",
    onConfirm,
    onCancel,
    isDestructive = false, // Controla si l'acció és vermella (esborrar)
}) => {
    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 transition-opacity duration-300"
            onClick={onCancel} // Tancar clicant fora
        >
            <div 
                // ⭐ ESTIL DEL CONTENIDOR: Més arrodonit i estret per imitar la captura
                className="bg-[#f0f3f5] rounded-xl p-8 w-full max-w-sm shadow-2xl box-shadow-neomorphic-container transform scale-100 transition-transform duration-300"
                onClick={(e) => e.stopPropagation()} // Evitar tancar clicant a dins
            >
                
                {/* ⭐ TÍTOL OBRAT (Només el missatge és visible) */}
                {title && (
                    <div className="flex justify-between items-start mb-4">
                        <h2 className="text-2xl font-bold text-gray-800 uppercase">{title}</h2>
                        <button 
                            onClick={onCancel} 
                            className="p-1 rounded-full box-shadow-neomorphic-button-small transition-all-smooth hover:scale-110"
                            aria-label="Tancar"
                        >
                            <X className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                )}

                {/* ⭐ MISSATGE CENTRAL: Text centrat, amb mida i gruix adients */}
                <p className="mb-8 text-lg font-medium text-center text-gray-700">
                    {message}
                </p>

                {/* ⭐ BOTONS: Justificats al final, amb els estils neomòrfics normals */}
                <div className="flex justify-center gap-4">
                    
                    {/* Botó de cancel·lació: Neomòrfic normal (suau/gris) */}
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 rounded-xl font-semibold text-gray-600 box-shadow-neomorphic-button hover:scale-[1.03] transition-all-smooth"
                    >
                        {cancelLabel}
                    </button>

                    {/* Botó de Confirmació: Estil neomòrfic de "premi" (inset) amb text verd */}
                    <button
                        onClick={onConfirm}
                        className="px-6 py-3 rounded-xl font-semibold text-green-500 box-shadow-neomorphic-button-inset hover:scale-[1.03] transition-all-smooth"
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
