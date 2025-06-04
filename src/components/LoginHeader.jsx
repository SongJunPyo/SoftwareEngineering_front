import React from 'react';
import logo from './planora.png';

function LoginHeader({ onNavigateHome }) {
  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-10 p-5">
      <div className="flex justify-between items-center w-full">
        <img 
          src={logo} 
          alt="Planora Logo" 
          className="h-8 cursor-pointer" 
          onClick={onNavigateHome} 
        />
        <button className="text-black text-base border border-black rounded px-4 py-2 hover:bg-black hover:text-white">
          도움말
        </button>
      </div>
    </header>
  );
}

export default LoginHeader; 