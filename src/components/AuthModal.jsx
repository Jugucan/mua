import React, { useState } from 'react';
import { X, LogOut, List, Grid2x2 as Grid } from 'lucide-react';

const AuthModal = ({ 
  onClose, 
  onLogin, 
  onRegister, 
  onLogout, 
  userEmail, 
  errorMessage, 
  onForgotPassword, 
  displayMode, 
  setDisplayMode 
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegistering) {
      onRegister(email, password);
    } else {
      onLogin(email, password);
    }
  };

  const handleForgotPasswordClick = () => {
    const userEmail = prompt("Introdueix el teu correu electrònic per restablir la contrasenya:");
    if (userEmail) {
      onForgotPassword(userEmail);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
      <div className="bg-[#f0f3f5] p-6 rounded-lg w-full max-w-sm relative box-shadow-neomorphic-container">
        <button onClick={onClose} className="absolute top-3 right-3 p-1 rounded-full bg-[#f0f3f5] box-shadow-neomorphic-button">
          <X className="w-5 h-5" />
        </button>
        {userEmail ? (
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">El meu compte</h3>
            <p className="text-gray-700 mb-4">Sessió iniciada com a <br /><span className="font-semibold">{userEmail}</span></p>
            <div className="mb-4">
              <h4 className="text-lg font-bold mb-2">Preferències de visualització</h4>
              <div className="flex justify-center gap-4">
                <button onClick={() => setDisplayMode('list')} className={`flex items-center gap-2 px-4 py-2 rounded-lg box-shadow-neomorphic-button-inset transition-all ${displayMode === 'list' ? 'bg-[#f0f3f5] text-green-500' : 'bg-[#f0f3f5] text-gray-700'}`}>
                  <List className="w-5 h-5" /> Vista llista
                </button>
                <button onClick={() => setDisplayMode('grid')} className={`flex items-center gap-2 px-4 py-2 rounded-lg box-shadow-neomorphic-button-inset transition-all ${displayMode === 'grid' ? 'bg-[#f0f3f5] text-green-500' : 'bg-[#f0f3f5] text-gray-700'}`}>
                  <Grid className="w-5 h-5" /> Vista quadrícula
                </button>
              </div>
            </div>
            <button onClick={onLogout} className="w-full bg-[#f0f3f5] text-red-500 font-bold py-2 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9] mt-4">
              <LogOut className="inline-block w-5 h-5 mr-2" /> Tanca sessió
            </button>
          </div>
        ) : (
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-700">{isRegistering ? 'Registra\'t' : 'Inicia sessió'}</h3>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Correu electrònic</label>
                <input type="email" className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrasenya</label>
                <input type="password" className="w-full p-2 border-none rounded-md focus:outline-none box-shadow-neomorphic-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
              {errorMessage && <p className="text-red-500 text-sm mb-4">{errorMessage}</p>}
              <div className="flex flex-col gap-3">
                <button type="submit" className="w-full bg-[#f0f3f5] text-green-500 font-bold py-2 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9]">
                  {isRegistering ? 'Registra\'t' : 'Inicia sessió'}
                </button>
                <button type="button" onClick={() => setIsRegistering(!isRegistering)} className="w-full bg-[#f0f3f5] text-gray-700 font-bold py-2 px-4 rounded-md box-shadow-neomorphic-button hover:bg-[#e6e6e9]">
                  {isRegistering ? 'Ja tinc un compte' : 'No tinc un compte'}
                </button>
                <button type="button" onClick={handleForgotPasswordClick} className="text-sm text-blue-600 hover:underline">Has oblidat la contrasenya?</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthModal;
