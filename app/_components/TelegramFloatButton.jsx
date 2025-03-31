"use client";

import React, { useState } from 'react';
import { Send, X } from 'lucide-react';

const TelegramFloatButton = () => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Nombre de usuario de tu bot sin el símbolo @
  const telegramBotUsername = "Dhren_bot";
  const telegramLink = `https://t.me/${telegramBotUsername}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end space-y-2">
      {/* Tooltip que aparece al hacer clic */}
      {isOpen && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-2 transform transition-all duration-200 max-w-xs">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-2 -right-2 bg-gray-200 dark:bg-gray-700 rounded-full p-1"
          >
            <X size={16} />
          </button>
          <p className="text-sm mb-3">Habla con nuestro asistente en Telegram</p>
          <a 
            href={telegramLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg py-2 px-4 text-sm flex items-center justify-center transition-colors duration-200"
          >
            <Send size={16} className="mr-2" />
            Abrir chat
          </a>
        </div>
      )}

      {/* Botón flotante principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg flex items-center justify-center transition-colors duration-200 telegram-float-button"
        aria-label="Chat con Telegram"
      >
        {!isOpen ? (
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor"
            className="telegram-icon"
          >
            <path d="M21.5 12a9.5 9.5 0 1 1-9.5-9.5 9.5 9.5 0 0 1 9.5 9.5Z" fill="white" stroke="none"/>
            <path d="m9.2 16 .7-3.3 5.5-5c.3-.3-.1-.4-.4-.2l-6.9 4.3L5 10.6c-.5-.2-.5-.5.1-.7l14.1-5.4c.4-.2.8.1.6.6L16.5 18c-.2.5-.5.6-.8.3l-3.3-2.8-2 1.9c-.1.2-.2.1-.2-.4Z" fill="#0088cc"/>
          </svg>
        ) : (
          <X size={24} />
        )}
      </button>
    </div>
  );
};

export default TelegramFloatButton;