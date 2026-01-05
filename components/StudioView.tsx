

import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { GENRES, STUDIOS, NPC_ARTIST_NAMES } from '../constants';
import type { Song } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';

const StudioView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData, group } = useGame();
    
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState(GENRES[0]);
    const [studioIndex, setStudioIndex] = useState(0);
    const [isExplicit, setIsExplicit] = useState(false);
    const [isDeluxeTrack, setIsDeluxeTrack] = useState(false);
    const [coverArt, setCoverArt] = useState<string | null>(null);
    const [collaboration, setCollaboration] = useState<{ artistName: string; cost: number } | null>(null);
    const [error, setError] = useState('');

    if (!activeArtistData || !activeArtist) return null;
    const { money, releases } = activeArtistData;
    const { careerMode } = gameState;
    const selectedStudio = STUDIOS[studioIndex];

    const hasReleasedAlbum = useMemo(() => {
        return releases.some(r => r.type === 'Album' || r.type === 'Album (Deluxe)');
    }, [releases]);

    const potentialCollaborators = useMemo(() => {
        const npcs = NPC_ARTIST_NAMES;
        let groupMembers: string[] = [];
        if (careerMode === 'group' && group) {
            groupMembers = group.members
                .filter(m => m.id !== activeArtist.id)
                .map(m => m.name);
        }
        return [...npcs, ...groupMembers].sort();
    }, [careerMode, group, activeArtist]);

    const handleCoverArtUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setCoverArt(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleCollaborationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const artistName = e.target.value;
        if (artistName) {
            const cost = Math.floor(Math.random() * (7000000 - 25000 + 1)) + 25000;
            setCollaboration({ artistName, cost });
        } else {
            setCollaboration(null);
        }
    };

    const handleRecord = () => {
        setError('');
        if (!title.trim() || !coverArt) {
            setError('Song title and cover art are required.');
            return;
        }
        const totalCost = selectedStudio.cost + (collaboration ? collaboration.cost : 0);
        if (money < totalCost) {
            setError("You don't have enough money for this session.");
            return;
        }
        
        const [min, max] = selectedStudio.qualityRange;
        const qualityBoost = collaboration ? Math.floor(Math.random() * 10) + 1 : 0;
        const quality = (Math.floor(Math.random() * (max - min + 1)) + min) + qualityBoost;
        const finalQuality = Math.min(100, quality);
        
        const songTitle = collaboration ? `${title.trim()} (feat. ${collaboration.artistName})` : title.trim();

        const newSong: Song = {
            id: crypto.randomUUID(),
            title: songTitle,
            genre,
            quality: finalQuality,
            coverArt,
            isReleased: false,
            streams: 0,
            lastWeekStreams: 0,
            prevWeekStreams: 0,
            duration: Math.floor(Math.random() * (240 - 120 + 1)) + 120, // 2 to 4 minutes
            explicit: isExplicit,
            artistId: activeArtist.id,
            isDeluxeTrack,
            removedStreams: 0,
            collaboration: collaboration ? { ...collaboration, qualityBoost } : undefined,
            dailyStreams: [],
        };

        dispatch({ type: 'RECORD_SONG', payload: { song: newSong, cost: totalCost } });
        dispatch({ type: 'CHANGE_VIEW', payload: 'game' });
    };

    const totalCost = selectedStudio.cost + (collaboration ? collaboration.cost : 0);

    return (
         <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Studio Session</h1>
            </header>
            <div className="p-4 space-y-6">
                <div className="flex justify-center">
                    <label htmlFor="cover-art" className="cursor-pointer">
                        <div className="w-48 h-48 rounded-lg bg-zinc-800 border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-red-500 transition-colors">
                            {coverArt ? (
                                <img src={coverArt} alt="Cover Art" className="w-full h-full rounded-lg object-cover" />
                            ) : (
                                <span className="text-zinc-400 text-sm text-center">Upload Cover Art</span>
                            )}
                        </div>
                    </label>
                    <input id="cover-art" type="file" accept="image/*" className="hidden" onChange={handleCoverArtUpload} />
                </div>
                
                <div>
                    <label htmlFor="song-title" className="block text-sm font-medium text-zinc-300">Song Title</label>
                    <input type="text" id="song-title" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                </div>

                 <div>
                    <label htmlFor="collaboration" className="block text-sm font-medium text-zinc-300">Collaboration (Optional)</label>
                    <select id="collaboration" onChange={handleCollaborationChange} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                        <option value="">None</option>
                        {potentialCollaborators.map(name => <option key={name} value={name}>{name}</option>)}
                    </select>
                    {collaboration && (
                        <p className="text-sm text-yellow-400 mt-2">Feature Cost: ${formatNumber(collaboration.cost)}</p>
                    )}
                </div>

                <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-zinc-300">Genre</label>
                    <select id="genre" value={genre} onChange={e => setGenre(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                        {GENRES.map(g => <option key={g}>{g}</option>)}
                    </select>
                </div>
                
                <div className="flex items-center">
                    <input
                        id="explicit-checkbox"
                        type="checkbox"
                        checked={isExplicit}
                        onChange={(e) => setIsExplicit(e.target.checked)}
                        className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-red-600 focus:ring-red-500"
                    />
                    <label htmlFor="explicit-checkbox" className="ml-2 block text-sm text-zinc-300">
                        Explicit Content <span className="text-xs text-zinc-400">(more hype on release)</span>
                    </label>
                </div>

                <div className="flex items-center">
                    <input
                        id="deluxe-checkbox"
                        type="checkbox"
                        checked={isDeluxeTrack}
                        onChange={(e) => setIsDeluxeTrack(e.target.checked)}
                        disabled={!hasReleasedAlbum}
                        className="h-4 w-4 rounded border-zinc-500 bg-zinc-700 text-red-600 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label htmlFor="deluxe-checkbox" className="ml-2 block text-sm text-zinc-300">
                        Deluxe Track <span className="text-xs text-zinc-400">(for deluxe albums)</span>
                    </label>
                </div>

                <div>
                    <h3 className="block text-sm font-medium text-zinc-300 mb-2">Select Studio</h3>
                    <div className="grid grid-cols-2 gap-4">
                        {STUDIOS.map((studio, index) => (
                            <button key={studio.name} onClick={() => setStudioIndex(index)} className={`p-4 rounded-lg text-left transition-all border-2 ${studioIndex === index ? 'border-red-500 bg-red-500/10' : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'}`}>
                                <p className="font-bold">{studio.name}</p>
                                <p className="text-sm text-green-400">-${studio.cost.toLocaleString()}</p>
                                <p className="text-xs text-zinc-400 mt-1">Est. Quality: ???</p>
                            </button>
                        ))}
                    </div>
                </div>

                {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                
                <button onClick={handleRecord} className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20 disabled:bg-zinc-600 disabled:shadow-none" disabled={money < totalCost}>
                    Record Song (-${totalCost.toLocaleString()})
                </button>
            </div>
        </div>
    );
};

export default StudioView;
