

import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="bg-slate-800/50 backdrop-blur-sm shadow-md sticky top-0 z-10">
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center gap-4">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-cyan-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    <div>
                        <h1 className="text-2xl font-bold text-white">OCR Text Extractor & Verifier</h1>
                    </div>
                </div>
            </div>
        </header>
    );
};