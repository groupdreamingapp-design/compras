'use client';
import React, { useState } from 'react';

export default function Tooltip({ content, children, placement = 'top' }) {
    const [isVisible, setIsVisible] = useState(false);

    const positionClasses = placement === 'top'
        ? "bottom-full left-1/2 transform -translate-x-1/2 mb-2"
        : "top-full left-1/2 transform -translate-x-1/2 mt-2";

    const arrowClasses = placement === 'top'
        ? "top-full left-1/2 transform -translate-x-1/2 border-t-slate-900"
        : "bottom-full left-1/2 transform -translate-x-1/2 border-b-slate-900";

    return (
        <div
            className="relative inline-block"
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div className={`absolute z-[100] ${positionClasses} px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-xl border border-slate-700 w-56 text-center pointer-events-none animate-in fade-in zoom-in-95 duration-200`}>
                    {content}
                    <div className={`absolute border-8 border-transparent ${arrowClasses}`}></div>
                </div>
            )}
        </div>
    );
}
