import React from 'react';

const ITunesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className={className}>
        <circle cx="12" cy="12" r="12" fill="url(#gradient)" />
        <path fill="#FFF" d="M12.688 6.44a3.13 3.13 0 0 0-3.12 3.122v4.875a3.13 3.13 0 0 0 3.12 3.123 3.13 3.13 0 0 0 3.12-3.123V9.562a3.13 3.13 0 0 0-3.12-3.122zm-4.32-.001a3.12 3.12 0 1 0 0 6.24 3.12 3.12 0 0 0 0-6.24z" />
        <defs>
            <radialGradient id="gradient" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(19.332 -17.352 14.331 16.095 3.328 18.23)">
                <stop offset="0" stopColor="#fa5267" />
                <stop offset=".5" stopColor="#f72e8f" />
                <stop offset="1" stopColor="#a336f3" />
            </radialGradient>
        </defs>
    </svg>
);

export default ITunesIcon;
