

import React from 'react';
import { useGame } from '../context/GameContext';
import HomeTab from './HomeTab';
import AppsTab from './AppsTab';
import ChartsTab from './ChartsTab';
import MiscTab from './MiscTab';
import BusinessTab from './BusinessTab';
import BottomNav from './BottomNav';

const GameUI: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { activeTab } = gameState;

    const renderActiveTab = () => {
        switch (activeTab) {
            case 'Home':
                return <HomeTab />;
            case 'Apps':
                return <AppsTab />;
            case 'Charts':
                return <ChartsTab />;
            case 'Business':
                return <BusinessTab />;
            case 'Misc':
                return <MiscTab />;
            default:
                return <HomeTab />;
        }
    };

    const handleProgressWeek = () => {
        dispatch({ type: 'PROGRESS_WEEK' });
    };

    return (
        <div className="h-screen w-full flex flex-col bg-zinc-900 text-white">
            <main className="flex-grow overflow-y-auto pb-24">
                {renderActiveTab()}
            </main>
            <button 
              onClick={handleProgressWeek}
              className="fixed z-20 bottom-24 right-4 bg-red-600 text-white w-16 h-16 rounded-full shadow-lg flex items-center justify-center hover:bg-red-700 transition-all transform hover:scale-105 shadow-red-600/30">
              <span className="font-bold text-sm text-center leading-tight">Next Week</span>
            </button>
            <BottomNav />
        </div>
    );
};

export default GameUI;
