
import React, { useState, useMemo, useRef } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';
import ShuffleIcon from './icons/ShuffleIcon';
import TrianglePlayIcon from './icons/TrianglePlayIcon';
import type { Song, Release, GameDate } from '../types';
import SpotifyDiscographyView from './SpotifyDiscographyView';
import SpotifyReleaseDetailView from './SpotifyReleaseDetailView';

const PopularSongItem: React.FC<{ song: Song; index: number }> = ({ song, index }) => {
    return (
        <div className="flex items-center gap-4 group cursor-pointer p-2 -mx-2 rounded-md hover:bg-white/10">
            <div className="text-zinc-400 font-semibold w-5 text-right">{index + 1}</div>
            <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded-sm object-cover" />
            <div className="flex-grow">
                <p className="font-semibold text-white">{song.title}</p>
                <div className="flex items-center gap-2">
                    {song.explicit && <span className="text-xs w-4 h-4 bg-zinc-600/80 text-zinc-300 font-bold rounded-sm flex items-center justify-center">E</span>}
                    <p className="text-sm text-zinc-400">{song.streams.toLocaleString()}</p>
                </div>
            </div>
            <DotsHorizontalIcon className="w-5 h-5 text-zinc-300 invisible group-hover:visible" />
        </div>
    );
};

const PopularReleaseItem: React.FC<{ release: Release; isLatest: boolean; onClick: () => void; }> = ({ release, isLatest, onClick }) => {
    return (
        <button onClick={onClick} className="flex w-full text-left items-center gap-4 group cursor-pointer">
            <img src={release.coverArt} alt={release.title} className="w-16 h-16 rounded object-cover" />
            <div className="flex-grow">
                <p className="font-semibold text-white text-lg">{release.title}</p>
                <p className="text-sm text-zinc-400">
                    {isLatest ? 'Latest release' : release.releaseDate.year} • {release.type}
                </p>
            </div>
        </button>
    );
};

const UpcomingReleaseItem: React.FC<{ release: Release; releaseDate: GameDate; onClick: () => void; }> = ({ release, releaseDate, onClick }) => {
    return (
        <button onClick={onClick} className="flex w-full text-left items-center gap-4 group cursor-pointer">
            <img src={release.coverArt} alt={release.title} className="w-16 h-16 rounded object-cover" />
            <div className="flex-grow">
                <p className="font-semibold text-white text-lg">{release.title}</p>
                <p className="text-sm text-zinc-400">
                    Coming Soon • Releasing W{releaseDate.week}, {releaseDate.year}
                </p>
            </div>
        </button>
    );
};


const SpotifyView: React.FC = () => {
    const { gameState, dispatch, activeArtist, activeArtistData } = useGame();
    const [view, setView] = useState<'profile' | 'discography' | 'releaseDetail'>('profile');
    const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
    const [history, setHistory] = useState<Array<'profile' | 'discography'>>(['profile']);
    const [isPopularExpanded, setIsPopularExpanded] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!activeArtist || !activeArtistData) return null;
    const { monthlyListeners, songs, releases, artistPick, labelSubmissions } = activeArtistData;
    const { date } = gameState;

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0] && activeArtist) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newImage = reader.result as string;
                dispatch({ type: 'UPDATE_ARTIST_IMAGE', payload: { artistId: activeArtist.id, newImage } });
            };
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const topSongs = songs
        .filter(s => s.isReleased && !s.isTakenDown)
        .sort((a, b) => (b.lastWeekStreams || 0) - (a.lastWeekStreams || 0))
        .slice(0, 10);
        
    const popularSongsToShow = isPopularExpanded ? topSongs : topSongs.slice(0, 5);

    const popularReleases = (() => {
        const availableReleases = releases.filter(r => !r.isTakenDown && !r.soundtrackInfo);

        if (availableReleases.length === 0) {
            return [];
        }

        const releasesWithStreams = availableReleases.map(release => {
            const totalStreams = release.songIds.reduce((sum, songId) => {
                const song = songs.find(s => s.id === songId);
                return sum + (song?.streams || 0);
            }, 0);
            return { ...release, totalStreams };
        });

        const latestRelease = releasesWithStreams.reduce((latest, current) => {
            const latestDate = latest.releaseDate.year * 52 + latest.releaseDate.week;
            const currentDate = current.releaseDate.year * 52 + current.releaseDate.week;
            return currentDate > latestDate ? current : latest;
        });

        const otherReleases = releasesWithStreams
            .filter(r => r.id !== latestRelease.id)
            .sort((a, b) => b.totalStreams - a.totalStreams);
        
        const sortedPopularReleases = [latestRelease, ...otherReleases].slice(0, 4);

        return sortedPopularReleases.map(r => ({ ...r, isLatest: r.id === latestRelease.id }));
    })();

    const artistPickItem = useMemo(() => {
        if (!artistPick) return null;
        if (artistPick.itemType === 'song') {
            return songs.find(s => s.id === artistPick.itemId);
        }
        if (artistPick.itemType === 'release') {
            return releases.find(r => r.id === artistPick.itemId);
        }
        return null;
    }, [artistPick, songs, releases]);

    const upcomingReleases = useMemo(() => {
        if (!labelSubmissions) return [];
        
        const toTotalWeeks = (d: GameDate) => d.year * 52 + d.week;
        const nowTotalWeeks = toTotalWeeks(date);
    
        return labelSubmissions
            .filter(sub => 
                sub.status === 'scheduled' && 
                sub.hasCountdownPage &&
                sub.projectReleaseDate &&
                toTotalWeeks(sub.projectReleaseDate) > nowTotalWeeks
            )
            .map(sub => ({
                release: sub.release,
                releaseDate: sub.projectReleaseDate!
            }))
            .sort((a, b) => toTotalWeeks(a.releaseDate) - toTotalWeeks(b.releaseDate));
    }, [labelSubmissions, date]);

    const navigateTo = (newView: 'profile' | 'discography' | 'releaseDetail') => {
        if (newView !== view) {
            if (view !== 'releaseDetail') {
                setHistory(prev => [...prev, view]);
            }
        }
        setView(newView);
    };

    const handleBack = () => {
        const previousView = history[history.length - 1] || 'profile';
        setHistory(prev => prev.slice(0, -1));
        setView(previousView);
    };

    const handleShowDiscography = () => {
        navigateTo('discography');
    };

    const handleShowReleaseDetail = (releaseId: string) => {
        setSelectedReleaseId(releaseId);
        navigateTo('releaseDetail');
    };

    const handleShowCompilationDetail = (compilationId: string) => {
        dispatch({ type: 'SELECT_SOUNDTRACK', payload: compilationId });
    }

    if (view === 'discography') {
        return <SpotifyDiscographyView onBack={handleBack} onSelectRelease={handleShowReleaseDetail} onSelectCompilation={handleShowCompilationDetail} />;
    }

    if (view === 'releaseDetail' && selectedReleaseId) {
        return <SpotifyReleaseDetailView releaseId={selectedReleaseId} onBack={handleBack} />;
    }


    return (
        <div className="bg-[#121212] text-white min-h-screen">
            {/* Header with Background Image */}
            <div className="relative h-[40vh] min-h-[340px] w-full group cursor-pointer" onClick={triggerFileInput}>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                <img src={activeArtist.image} alt={activeArtist.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-[#121212] pointer-events-none"></div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="text-white font-bold text-lg bg-black/50 px-4 py-2 rounded-full">Change Photo</span>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); dispatch({ type: 'CHANGE_VIEW', payload: 'game' }); }} 
                    className="absolute top-12 left-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                    aria-label="Go back"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="absolute bottom-8 left-4 right-4 z-10 pointer-events-none">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.7)' }}>
                        {activeArtist.name}
                    </h1>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-4 space-y-8 pb-20">
                {/* Listeners and Actions */}
                <div>
                    <p className="text-zinc-400 text-sm">{monthlyListeners.toLocaleString()} monthly listeners</p>
                    <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <button className="px-4 py-1 border border-zinc-400 rounded-full text-sm font-semibold hover:border-white">
                                Following
                            </button>
                            <button>
                                <DotsHorizontalIcon className="w-6 h-6 text-zinc-400" />
                            </button>
                        </div>
                        <div className="flex items-center gap-4">
                             <button>
                                <ShuffleIcon className="w-6 h-6 text-green-500" />
                            </button>
                            <button className="bg-green-500 rounded-full w-14 h-14 flex items-center justify-center shadow-lg shadow-green-500/30">
                               <TrianglePlayIcon className="w-7 h-7 text-black" />
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Placeholder for Music/Clips/Events/Merch tabs */}
                <div className="border-b border-zinc-800">
                    <div className="flex gap-6">
                        <button className="py-2 text-sm font-semibold border-b-2 border-green-500">Music</button>
                        <button className="py-2 text-sm font-semibold text-zinc-400 hover:text-white">Clips</button>
                        <button className="py-2 text-sm font-semibold text-zinc-400 hover:text-white">Events</button>
                        <button className="py-2 text-sm font-semibold text-zinc-400 hover:text-white">Merch</button>
                    </div>
                </div>

                {/* Artist Pick */}
                {artistPickItem && (
                    <div className="space-y-3">
                        <h2 className="text-xl font-bold">Artist Pick</h2>
                        <button onClick={() => handleShowReleaseDetail(artistPick.itemType === 'release' ? artistPick.itemId : (songs.find(s=>s.id === artistPick.itemId)?.releaseId || ''))} className="w-full text-left flex items-center gap-4 p-3 -m-3 rounded-lg hover:bg-white/10">
                            <img src={artistPickItem.coverArt} alt={artistPickItem.title} className="w-20 h-20 rounded object-cover" />
                            <div>
                                <p className="font-semibold text-white">{artistPickItem.title}</p>
                                <p className="text-sm text-zinc-400">
                                    {'songIds' in artistPickItem ? artistPickItem.type : 'Single'} • New Release
                                </p>
                            </div>
                        </button>
                    </div>
                )}

                {/* Popular Songs */}
                {topSongs.length > 0 && (
                    <div className="space-y-4">
                        <h2 className="text-2xl font-bold">Popular</h2>
                        <div className="space-y-2">
                            {popularSongsToShow.map((song, index) => (
                                <PopularSongItem key={song.id} song={song} index={index} />
                            ))}
                        </div>
                        {topSongs.length > 5 && (
                             <div className="pt-2">
                                <button 
                                    onClick={() => setIsPopularExpanded(!isPopularExpanded)} 
                                    className="px-6 py-2 border border-zinc-400 rounded-full text-sm font-semibold hover:border-white hover:scale-105 transition-transform"
                                >
                                    {isPopularExpanded ? 'Show less' : 'See more'}
                                </button>
                            </div>
                        )}
                    </div>
                )}


                {/* Popular Releases */}
                {popularReleases.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Popular releases</h2>
                            <button onClick={handleShowDiscography} className="text-xs font-semibold text-zinc-400 hover:text-white">Show all</button>
                        </div>
                        <div className="space-y-4">
                            {popularReleases.map(release => (
                                <PopularReleaseItem key={release.id} release={release} isLatest={release.isLatest} onClick={() => handleShowReleaseDetail(release.id)}/>
                            ))}
                        </div>
                        <div className="text-center pt-4">
                            <button onClick={handleShowDiscography} className="px-6 py-2 border border-zinc-400 rounded-full text-sm font-semibold hover:border-white hover:scale-105 transition-transform">
                                See discography
                            </button>
                        </div>
                    </div>
                )}

                {/* Upcoming Releases */}
                {upcomingReleases.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Upcoming</h2>
                        </div>
                        <div className="space-y-4">
                            {upcomingReleases.map(({ release, releaseDate }) => (
                                <UpcomingReleaseItem 
                                    key={release.id} 
                                    release={release} 
                                    releaseDate={releaseDate} 
                                    onClick={() => {
                                        dispatch({ type: 'SELECT_RELEASE', payload: release.id });
                                        dispatch({ type: 'CHANGE_VIEW', payload: 'spotifyAlbumCountdown' });
                                    }}
                                />
                            ))}
                        </div>
                    </div>
                )}
                
            </div>
        </div>
    );
};

export default SpotifyView;
