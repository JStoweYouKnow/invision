import React from 'react';
import { Link } from 'react-router-dom';

interface HomeButtonProps {
    className?: string;
}

export const HomeButton: React.FC<HomeButtonProps> = ({ className = "" }) => {
    return (
        <Link
            to="/"
            className={`flex items-center gap-3 group transition-all duration-300 hover:opacity-80 z-50 ${className}`}
            style={{ textDecoration: 'none' }}
        >
            <div className="relative flex items-center justify-center">
                <img
                    src="/images/galaxy-bubble-v2.png"
                    alt="InVision logo"
                    className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]"
                    style={{ width: '40px', height: '40px' }}
                />
            </div>
            <span
                className="font-display tracking-tight leading-[0.9] italic whitespace-nowrap"
                style={{ color: '#ffffff', fontSize: '24px', fontWeight: 900 }}
            >
                InVision
            </span>
        </Link>
    );
};
