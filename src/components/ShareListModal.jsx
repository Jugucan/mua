import React, { useState, useEffect } from 'react';
import { X, Share2, Mail, Trash2, UserCheck } from 'lucide-react';

const ShareListModal = ({ 
    listId, 
    listName,
    currentUserEmail,
    sharedWith = [],
    onShare, 
    onRemoveAccess,
    onClose 
}) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Netejar missatges després de 3 segons
    useEffect(() => {
        if (errorMessage || successMessage) {
            const timer = setTimeout(() => {
                setErrorMessage('');
                setSuccessMessage('');
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [errorMessage, successMessage]);

    const handleShare = async (e) => {
        e.preventDefault();
        
        // Validacions
        if (!email.trim()) {
            setErrorMessage('Si us plau, introdueix un email.');
            return;
        }

        if (email.toLowerCase() === currentUserEmail.toLowerCase()) {
            setErrorMessage('No pots compartir la llista amb tu mateix/a!');
            return;
        }

        if (sharedWith.some(user => user.email.toLowerCase() === email.toLowerCase())) {
            setErrorMessage('Aquesta llista ja està compartida amb aquest usuari.');
            return;
        }

        setIsLoading(true);
        setErrorMessage('');
        setSuccessMessage('');

        try {
            await onShare(listId, email);
            setSuccessMessage(`Llista compartida amb ${email}!`);
            setEmail('');
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveAccess = async (userEmail) => {
        if (!window.confirm(`Estàs segur que vols deixar de compartir aquesta llista amb ${userEmail}?`)) {
            return;
        }

        setIsLoading(true);
        try {
            await onRemoveAccess(listId, userEmail);
            setSuccessMessage(`Accés eliminat per a ${userEmail}`);
        } catch (error) {
            setErrorMessage(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#f0f3f5] rounded-lg box-shadow-neomorphic-container max-w-md w-full max-h-[90vh] overflow-y-auto p-6">
                {/* Capçalera */}
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                            <Share2 className="w-6 h-6 text-green-500" />
                            Compartir Llista
                        </h2>
                        <p className="text-sm text-gray-600 mt-1">{listName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 transition-all-smooth"
                        aria-label="Tancar"
                    >
                        <X className="w-6 h-6 text-gray-600" />
                    </button>
                </div>

                {/* Missatges de feedback */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                        {errorMessage}
                    </div>
                )}
                {successMessage && (
                    <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md text-sm">
                        {successMessage}
                    </div>
                )}

                {/* Formulari per compartir */}
                <form onSubmit={handleShare} className="mb-6">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Introdueix l'email de l'usuari:
                    </label>
                    <div className="flex gap-2">
                        <div className="relative flex-grow">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="usuari@exemple.com"
                                className="pl-10 pr-4 py-3 rounded-md box-shadow-neomorphic-input focus:outline-none w-full"
                                disabled={isLoading}
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-3 rounded-md font-bold text-white bg-green-500 hover:bg-green-600 
                                disabled:bg-gray-400 disabled:cursor-not-allowed transition-all-smooth
                                box-shadow-neomorphic-button"
                        >
                            {isLoading ? 'Compartint...' : 'Compartir'}
                        </button>
                    </div>
                </form>

                {/* Llista d'usuaris amb accés */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <UserCheck className="w-5 h-5 text-green-500" />
                        Usuaris amb accés ({sharedWith.length})
                    </h3>
                    
                    {sharedWith.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-4">
                            Encara no has compartit aquesta llista amb ningú.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {sharedWith.map((user) => (
                                <div
                                    key={user.email}
                                    className="flex items-center justify-between p-3 rounded-md 
                                        box-shadow-neomorphic-element bg-[#f0f3f5]"
                                >
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">
                                            {user.email}
                                        </span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveAccess(user.email)}
                                        className="p-2 rounded-full hover:bg-red-100 transition-all-smooth"
                                        aria-label={`Eliminar accés per a ${user.email}`}
                                        disabled={isLoading}
                                    >
                                        <Trash2 className="w-4 h-4 text-red-500" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Informació addicional */}
                <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-xs text-blue-800">
                        <strong>ℹ️ Nota:</strong> Els usuaris amb qui comparteixes aquesta llista podran 
                        veure i editar tots els productes. Els canvis es sincronitzaran automàticament.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ShareListModal;
