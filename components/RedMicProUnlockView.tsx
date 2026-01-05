
import React, { useState } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import StarIcon from './icons/StarIcon';

const RedMicProUnlockView: React.FC = () => {
    const { dispatch, activeArtistData } = useGame();
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [showConfirmation, setShowConfirmation] = useState(false);
    
    if (!activeArtistData) return null;
    
    const handleCodeUnlock = () => {
        setError('');
        if (code.toLowerCase() === 'chanel') {
            setShowConfirmation(true);
        } else {
            setError('Invalid secret code.');
        }
    };
    
    const confirmCodeAndNavigate = () => {
        dispatch({ type: 'UNLOCK_RED_MIC_PRO', payload: { type: 'code', cost: 0 }});
        dispatch({ type: 'CHANGE_VIEW', payload: 'redMicProDashboard' });
    };

    return (
        <>
            {showConfirmation && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-lg p-8 border border-yellow-500/50 text-center">
                        <StarIcon className="w-16 h-16 text-yellow-400 mx-auto animate-pulse" />
                        <h2 className="text-2xl font-bold text-yellow-400 mt-4">Success!</h2>
                        <p className="text-zinc-300 mt-2">
                            You have successfully unlocked Red Mic Pro! You now have access to all the exclusive features.
                        </p>
                        <div className="mt-8">
                            <button
                                onClick={confirmCodeAndNavigate}
                                className="w-full h-12 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-lg transition-colors"
                            >
                                Go to Pro Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
                <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <h1 className="text-2xl font-bold">Red Mic Pro</h1>
                </header>
                <main className="p-4 space-y-6">
                    <div className="text-center">
                        <StarIcon className="w-16 h-16 text-yellow-400 mx-auto" />
                        <h2 className="text-3xl font-bold mt-2">Unlock Your Potential</h2>
                        <p className="text-zinc-400 mt-1">Gain ultimate control over your career by entering the secret code.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="bg-zinc-800 p-4 rounded-lg">
                            <h3 className="text-xl font-bold">Secret Code</h3>
                            <div className="flex gap-2 mt-3">
                                <input type="text" value={code} onChange={e => { setCode(e.target.value); setError(''); }} placeholder="Enter code..." className="flex-grow bg-zinc-700 p-2 rounded-md" />
                                <button onClick={handleCodeUnlock} className="bg-zinc-600 font-bold px-4 rounded-md">Unlock</button>
                            </div>
                        </div>
                    </div>
                    {error && <p className="text-red-400 text-center">{error}</p>}
                </main>
            </div>
        </>
    );
};

export default RedMicProUnlockView;