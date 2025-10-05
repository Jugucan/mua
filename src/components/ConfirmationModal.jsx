import React from 'react';
import { X } from 'lucide-react';

const ConfirmationModal = ({
    title,
    message,
    confirmLabel = "Confirmar",
    cancelLabel = "Cancel·lar",
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
                className="bg-[#f0f3f5] rounded-xl p-6 w-full max-w-md shadow-2xl box-shadow-neomorphic-container transform scale-100 transition-transform duration-300"
                onClick={(e) => e.stopPropagation()} // Evitar tancar clicant a dins
            >
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

                <p className="mb-6 text-gray-700 font-medium">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    {/* Botó de cancel·lació amb estil Neomòrfic normal */}
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-md font-bold text-gray-700 box-shadow-neomorphic-button hover:scale-[1.03] transition-all-smooth"
                    >
                        {cancelLabel}
                    </button>

                    {/* Botó de Confirmació: Utilitza l'estil vermell si isDestructive és true */}
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-md font-bold text-white transition-all-smooth hover:scale-[1.03] ${
                            isDestructive 
                                ? 'bg-red-500 hover:bg-red-600 clear-bought-button-confirm-red' 
                                : 'bg-green-500 hover:bg-green-600 box-shadow-neomorphic-button'
                        }`}
                    >
                        {confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
