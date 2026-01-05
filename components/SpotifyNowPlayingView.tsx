import React from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import type { Song } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import VolumeUpIcon from './icons/VolumeUpIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';

const SpotifyNowPlayingView: React.FC<{ song: Song; onBack: () => void; }> = ({ song, onBack }) => {
    const { activeArtist, activeArtistData } = useGame();

    if (!activeArtist || !activeArtistData) {
        onBack();
        return null;
    }

    const genres = song.genre.split(/[/,]/).map(g => g.trim());

    return (
        <div className="fixed inset-0 bg-black text-white z-50">
            {/* Background */}
            <div className="absolute inset-0">
                <img src={song.coverArt} alt="" className="w-full h-full object-cover filter blur-2xl scale-110" />
                <div className="absolute inset-0 bg-black/50"></div>
            </div>

            {/* Content */}
            <div className="relative h-full flex flex-col p-4">
                <header className="flex justify-between items-center flex-shrink-0">
                    <button onClick={onBack} className="p-2 -m-2">
                        <ArrowLeftIcon className="w-6 h-6" />
                    </button>
                    <button className="p-2 -m-2">
                        <VolumeUpIcon className="w-6 h-6" />
                    </button>
                </header>

                <main className="flex-grow flex flex-col items-center justify-center space-y-8 py-8 overflow-hidden">
                    <div className="relative w-64 h-64 sm:w-80 sm:h-80 flex-shrink-0">
                         {/* Animated Bars */}
                        <div className="absolute inset-0 flex items-center justify-center gap-1.5 opacity-40">
                            {[...Array(30)].map((_, i) => (
                                <span
                                    key={i}
                                    className="bar w-1.5 bg-white/70 rounded-full"
                                    style={{
                                        height: `${Math.random() * 40 + 20}%`,
                                        animationName: 'wave',
                                        animationDuration: `${Math.random() * 1 + 0.8}s`,
                                        animationTimingFunction: 'ease-in-out',
                                        animationIterationCount: 'infinite',
                                        animationDirection: 'alternate',
                                        animationDelay: `${i * 0.03}s`
                                    }}
                                />
                            ))}
                        </div>
                        <img src={song.coverArt} alt={song.title} className="relative w-full h-full object-cover rounded-lg shadow-2xl shadow-black/50" />
                    </div>
                </main>

                <footer className="flex-shrink-0 space-y-6">
                    <div className="flex items-center gap-3">
                        <img src={activeArtist.image} alt={activeArtist.name} className="w-12 h-12 rounded-full object-cover" />
                        <div className="flex-grow">
                            <p className="font-bold">{activeArtist.name}</p>
                            <p className="text-sm text-zinc-300">{formatNumber(activeArtistData.followers)} followers</p>
                        </div>
                        <button className="border border-white/50 rounded-full px-4 py-1.5 text-sm font-semibold hover:border-white hover:scale-105 transition-transform">
                            Follow
                        </button>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        {genres.map(g => (
                            <div key={g} className="bg-white/10 rounded-full px-3 py-1 text-sm font-semibold">
                                #{g.toLowerCase().replace(/\s/g, '')}
                            </div>
                        ))}
                    </div>

                    <div className="bg-white/10 p-2 rounded-lg flex items-center gap-3">
                        <img src={song.coverArt} alt={song.title} className="w-12 h-12 rounded-md" />
                        <div className="flex-grow min-w-0">
                            <p className="font-bold truncate">{song.title}</p>
                            <div className="flex items-center gap-2">
                                {song.explicit && <span className="text-xs w-4 h-4 bg-zinc-600/80 text-zinc-300 font-bold rounded-sm flex items-center justify-center">E</span>}
                                <p className="text-sm text-zinc-300 truncate">{activeArtist.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button><PlusCircleIcon className="w-7 h-7 text-zinc-300 hover:text-white" /></button>
                            <button><DotsHorizontalIcon className="w-7 h-7 text-zinc-300 hover:text-white" /></button>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};

export default SpotifyNowPlayingView;