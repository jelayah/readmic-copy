
import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { Release, Song, Artist, Group, GameDate } from '../types';
import { PLAYLIST_PITCH_COST } from '../constants';
import HomeIcon from './icons/HomeIcon';
import MusicNoteIcon from './icons/MusicNoteIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';

type S4ATab = 'Home' | 'Music' | 'Audience' | 'Profile';

// --- NEW UPCOMING RELEASE DETAIL VIEW ---
const S4AUpcomingReleaseDetailView: React.FC<{ submissionId: string; onBack: () => void; }> = ({ submissionId, onBack }) => {
    const { dispatch, activeArtistData } = useGame();
    if (!activeArtistData) return null;

    const { labelSubmissions, money } = activeArtistData;
    const submission = labelSubmissions.find(s => s.id === submissionId);

    if (!submission) {
        onBack();
        return null;
    }

    const release = submission.release;
    const cost = 100000;
    const canAfford = money >= cost;
    const isLaunched = submission.hasCountdownPage;

    const handleLaunch = () => {
        if (canAfford && !isLaunched) {
            dispatch({ type: 'LAUNCH_COUNTDOWN_PAGE', payload: { submissionId: submission.id, cost: cost } });
        }
    };

    return (
        <div className="bg-gradient-to-b from-blue-800 via-stone-900 to-black text-white min-h-full p-4 flex flex-col">
            <header className="flex justify-between items-center flex-shrink-0">
                <button onClick={onBack} className="p-2 -m-2">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                 <button className="p-2 -m-2">
                    <DotsHorizontalIcon className="w-6 h-6" />
                </button>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                <img src={release.coverArt} alt={release.title} className="w-64 h-64 rounded-lg shadow-2xl shadow-black/50" />
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{release.title}</h1>
                    <p className="text-zinc-400 mt-1">Releasing: W{submission.projectReleaseDate!.week}, {submission.projectReleaseDate!.year}</p>
                </div>
                <div className="pt-8 w-full max-w-sm">
                    <button 
                        onClick={handleLaunch}
                        disabled={isLaunched || !canAfford}
                        className="w-full bg-blue-500 text-white font-bold p-4 rounded-lg disabled:bg-zinc-600 disabled:opacity-70 flex flex-col items-center"
                    >
                        <span>{isLaunched ? 'Countdown Page Launched' : `Launch Countdown Page`}</span>
                        {!isLaunched && <span className="text-sm font-normal opacity-80">(-${formatNumber(cost)})</span>}
                    </button>
                    {!canAfford && !isLaunched && <p className="text-red-400 text-xs mt-2">Insufficient funds</p>}
                </div>
            </main>
        </div>
    );
};

// --- SONG DETAIL VIEW ---
const S4ASongDetailView: React.FC<{ song: Song; onBack: () => void }> = ({ song, onBack }) => {
    const { activeArtistData } = useGame();
    if (!activeArtistData) return null;
    const { releases } = activeArtistData;
    const release = releases.find(r => r.id === song.releaseId);
    
    const releaseDateString = release ? new Date(release.releaseDate.year, 0, (release.releaseDate.week - 1) * 7 + 1).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Unknown';

    return (
        <div className="bg-gradient-to-b from-amber-800 via-stone-900 to-black text-white min-h-full p-4 flex flex-col">
            <header className="flex justify-between items-center flex-shrink-0">
                <button onClick={onBack} className="p-2 -m-2">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                 <button className="p-2 -m-2">
                    <DotsHorizontalIcon className="w-6 h-6" />
                </button>
            </header>
            <main className="flex-grow flex flex-col items-center justify-center text-center space-y-4">
                <img src={song.coverArt} alt={song.title} className="w-64 h-64 rounded-lg shadow-2xl shadow-black/50" />
                <div>
                    <h1 className="text-3xl font-black tracking-tight">{song.title}</h1>
                    <p className="text-zinc-400 mt-1">Released: {releaseDateString}</p>
                </div>
                <div className="pt-4">
                    <div className="flex items-center gap-2 justify-center">
                        <MusicNoteIcon className="w-5 h-5 text-zinc-400" />
                        <p className="text-4xl font-bold">{formatNumber(song.streams)}</p>
                    </div>
                    <p className="text-sm text-zinc-400">All-time streams</p>
                </div>
            </main>
        </div>
    );
};


// --- HOME TAB ---
const S4AHome: React.FC = () => {
    const { activeArtistData, gameState, dispatch } = useGame();
    if (!activeArtistData) return null;

    const { releases, songs, listeningNow, monthlyListeners, followers } = activeArtistData;
    const showWrapped = gameState.date.week >= 50;


    const latestRelease = useMemo(() => {
        return [...releases].sort((a, b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week))[0];
    }, [releases]);

    const latestReleaseStreams = useMemo(() => {
        if (!latestRelease) return 0;
        return latestRelease.songIds.reduce((sum, id) => {
            const song = songs.find(s => s.id === id);
            return sum + (song?.streams || 0);
        }, 0);
    }, [latestRelease, songs]);
    
    const last7DaysStreams = activeArtistData.lastFourWeeksStreams[0] || 0;

    const topSongs = useMemo(() => {
        return [...songs]
            .filter(s => s.isReleased)
            .sort((a,b) => b.streams - a.streams)
            .slice(0, 5);
    }, [songs]);

    return (
        <div className="bg-[#402000] text-white min-h-full">
            <div className="p-4 space-y-6">
                {latestRelease && (
                     <div className="flex items-center gap-4">
                        <img src={latestRelease.coverArt} alt={latestRelease.title} className="w-24 h-24 object-cover" />
                        <div>
                            <p className="text-xs font-bold tracking-widest opacity-80">LATEST RELEASE • {latestRelease.type.toUpperCase()}</p>
                            <p className="text-2xl font-bold">{latestRelease.title}</p>
                        </div>
                    </div>
                )}

                <div>
                    <h2 className="text-5xl font-bold">{formatNumber(latestReleaseStreams)}</h2>
                    <p className="opacity-80">all-time streams for this release</p>
                    <hr className="my-3 border-white/20" />
                </div>
                
                <div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
                        <p className="text-lg font-bold">{formatNumber(listeningNow)} people listening now</p>
                    </div>

                    <div className="mt-6">
                        <p className="font-bold text-sm tracking-widest opacity-80 mb-2">LAST 7 DAYS</p>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold">{formatNumber(Math.floor(monthlyListeners * 0.25))}</p>
                                <p className="text-xs opacity-80">listeners</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{formatNumber(last7DaysStreams)}</p>
                                <p className="text-xs opacity-80">streams</p>
                            </div>
                             <div>
                                <p className="text-2xl font-bold">{formatNumber(followers)}</p>
                                <p className="text-xs opacity-80">followers</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    <p className="font-bold text-sm tracking-widest opacity-80 mb-2">YOUR TOP SONGS</p>
                    <div className="space-y-2">
                        {topSongs.map(song => (
                             <div key={song.id} className="flex items-center gap-3 p-2 rounded-md bg-white/10">
                                <img src={song.coverArt} alt={song.title} className="w-10 h-10 object-cover" />
                                <p className="font-semibold flex-grow">{song.title}</p>
                                <p className="font-bold text-lg">{formatNumber(song.streams)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {showWrapped && (
                    <div className="pt-4">
                        <button 
                            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'spotifyWrapped' })}
                            className="w-full text-left bg-zinc-800/50 p-4 rounded-lg"
                        >
                            <p className="text-sm font-bold tracking-widest opacity-80">YOUR YEAR IN MUSIC</p>
                            <h2 className="text-2xl font-bold mt-2">Your {gameState.date.year} Wrapped for Artists is here</h2>
                            <p className="mt-2 text-zinc-300">Unwrap the highlights from your year in music and celebrate with your fans.</p>
                            <div className="mt-4 font-bold text-zinc-200 flex items-center">
                                GET YOURS <ChevronRightIcon className="w-5 h-5 ml-1" />
                            </div>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- MUSIC TAB ---
const S4AMusic: React.FC<{ onSelectSong: (song: Song) => void; onSelectUpcomingRelease: (submissionId: string) => void; }> = ({ onSelectSong, onSelectUpcomingRelease }) => {
    const { activeArtistData, gameState } = useGame();
    const [musicTab, setMusicTab] = useState<'Songs' | 'Releases' | 'Playlists' | 'Upcoming'>('Upcoming');

    if (!activeArtistData) return null;
    const { songs, streamsHistory } = activeArtistData;

    type SortPeriod = 'all' | '12m' | '7d' | '24h';
    const [sortPeriod, setSortPeriod] = useState<SortPeriod>('12m');

    const sortedSongs = useMemo(() => {
        const releasedSongs = songs.filter(s => s.isReleased);
        const totalStreamsAllSongs = songs.reduce((s, song) => s + (song.streams || 0), 0) || 1;

        switch (sortPeriod) {
            case 'all':
                return [...releasedSongs]
                    .map(s => ({...s, calculatedStreams: s.streams }))
                    .sort((a, b) => b.streams - a.streams);
            case '12m':
                return [...releasedSongs]
                    .map(song => {
                        const streamsLast12Months = streamsHistory
                            .slice(-52)
                            .reduce((sum, week) => {
                                const songShare = (song.streams || 0) / totalStreamsAllSongs;
                                return sum + (week.streams * songShare);
                            }, 0);
                        return { ...song, calculatedStreams: streamsLast12Months };
                    })
                    .sort((a, b) => b.calculatedStreams - a.calculatedStreams);
            case '7d':
                return [...releasedSongs]
                    .map(song => ({ ...song, calculatedStreams: song.lastWeekStreams || 0 }))
                    .sort((a, b) => b.calculatedStreams - a.calculatedStreams);
            case '24h':
                 return [...releasedSongs]
                    .map(song => {
                        const lastDayStreams = song.dailyStreams ? song.dailyStreams[song.dailyStreams.length - 1] || 0 : 0;
                        return { ...song, calculatedStreams: lastDayStreams };
                    })
                    .sort((a, b) => b.calculatedStreams - a.calculatedStreams);
            default:
                return [];
        }
    }, [songs, streamsHistory, sortPeriod]);

    const upcomingReleases = useMemo(() => {
        if (!activeArtistData) return [];
        
        const upcoming: {
            id: string;
            submissionId?: string;
            title: string;
            type: Release['type'];
            coverArt: string;
            releaseDate: GameDate;
        }[] = [];
    
        for (const sub of activeArtistData.labelSubmissions) {
            if (sub.status === 'scheduled') {
                if (sub.projectReleaseDate && (sub.projectReleaseDate.year * 52 + sub.projectReleaseDate.week > gameState.date.year * 52 + gameState.date.week)) {
                    upcoming.push({
                        id: sub.release.id,
                        submissionId: sub.id,
                        title: sub.release.title,
                        type: sub.release.type,
                        coverArt: sub.release.coverArt,
                        releaseDate: sub.projectReleaseDate,
                    });
                }
                if (sub.singlesToRelease) {
                    for (const single of sub.singlesToRelease) {
                        if (single.releaseDate.year * 52 + single.releaseDate.week > gameState.date.year * 52 + gameState.date.week) {
                            const song = activeArtistData.songs.find(s => s.id === single.songId);
                            if (song) {
                                upcoming.push({
                                    id: song.id,
                                    title: song.title,
                                    type: 'Single',
                                    coverArt: song.coverArt,
                                    releaseDate: single.releaseDate,
                                });
                            }
                        }
                    }
                }
            }
        }
        return upcoming.sort((a, b) => (a.releaseDate.year * 52 + a.releaseDate.week) - (b.releaseDate.year * 52 + b.releaseDate.week));
    }, [activeArtistData, gameState.date]);

    const sortOptions: {id: SortPeriod, label: string}[] = [
        { id: '12m', label: 'Last 12 months' },
        { id: 'all', label: 'All time' },
        { id: '7d', label: 'Last 7 days' },
        { id: '24h', label: 'Last 24 hours' },
    ];
    
    return (
         <div className="bg-white text-black min-h-full">
            <header className="p-4 border-b">
                <h1 className="text-3xl font-bold">Music</h1>
                <div className="flex gap-6 mt-4 text-sm font-semibold text-zinc-600 border-b">
                    <button onClick={() => setMusicTab('Songs')} className={`py-2 ${musicTab === 'Songs' ? 'text-black border-b-2 border-black' : ''}`}>Songs</button>
                    <button onClick={() => setMusicTab('Releases')} className={`py-2 ${musicTab === 'Releases' ? 'text-black border-b-2 border-black' : ''}`}>Releases</button>
                    <button onClick={() => setMusicTab('Playlists')} className={`py-2 ${musicTab === 'Playlists' ? 'text-black border-b-2 border-black' : ''}`}>Playlists</button>
                    <button onClick={() => setMusicTab('Upcoming')} className={`py-2 ${musicTab === 'Upcoming' ? 'text-black border-b-2 border-black' : ''}`}>Upcoming</button>
                </div>
            </header>
            
            {musicTab === 'Songs' && (
                <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                         <div className="flex gap-2 overflow-x-auto">
                            {sortOptions.map(option => (
                                <button
                                    key={option.id}
                                    onClick={() => setSortPeriod(option.id)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors whitespace-nowrap ${sortPeriod === option.id ? 'bg-black text-white' : 'bg-zinc-200 text-black'}`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs font-bold text-zinc-500 flex-shrink-0 ml-2">STREAMS</p>
                    </div>
                    <div className="space-y-3">
                        {sortedSongs.map(song => (
                             <button key={song.id} onClick={() => onSelectSong(song)} className="w-full text-left flex items-center gap-3 hover:bg-zinc-100 p-1 -m-1 rounded-md">
                                <img src={song.coverArt} alt={song.title} className="w-12 h-12 object-cover" />
                                <p className="font-semibold flex-grow truncate">{song.title}</p>
                                <p className="font-bold">{formatNumber(song.calculatedStreams)}</p>
                                <ChevronRightIcon className="w-5 h-5 text-zinc-400" />
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {musicTab === 'Releases' && <div className="p-8 text-center text-zinc-500">Feature coming soon.</div>}
            {musicTab === 'Playlists' && <div className="p-8 text-center text-zinc-500">Feature coming soon.</div>}

            {musicTab === 'Upcoming' && (
                <div className="p-4">
                    <div className="flex justify-between items-center text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
                        <span>Releases</span>
                        <span>Release date</span>
                    </div>
                    {upcomingReleases.length > 0 ? (
                        <div className="space-y-4">
                            {upcomingReleases.map(release => {
                                const isAlbumOrEP = release.type !== 'Single';
                                const Wrapper = isAlbumOrEP ? 'button' : 'div';
                                const props = isAlbumOrEP ? { onClick: () => onSelectUpcomingRelease(release.submissionId!) } : {};
                                
                                return (
                                    <Wrapper key={release.id} {...props} className={`w-full flex justify-between items-center text-left ${isAlbumOrEP ? 'hover:bg-zinc-100 p-2 -m-2 rounded-lg' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <img src={release.coverArt} className="w-12 h-12 object-cover rounded-md" />
                                            <div>
                                                <p className="font-bold text-black">{release.title}</p>
                                                <p className="text-sm text-zinc-500">{release.type}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold text-lg text-black">{release.releaseDate.year}</p>
                                    </Wrapper>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-zinc-500">
                            <p>No upcoming releases scheduled.</p>
                            <p className="text-sm mt-1">Plan a release with your label to see it here.</p>
                        </div>
                    )}
                </div>
            )}
         </div>
    );
};


// --- AUDIENCE TAB ---
const S4AAudience: React.FC = () => {
    const { activeArtistData } = useGame();
    if (!activeArtistData) return null;

    const { streamsHistory, monthlyListeners, saves } = activeArtistData;
    const last12MonthsStreams = streamsHistory.slice(-52).reduce((sum, h) => sum + h.streams, 0);

    const Chart = () => {
        const data = streamsHistory.slice(-12).map(h => h.streams); // Last 12 weeks
        if (data.length < 2) return <div className="h-40 bg-zinc-100 rounded-md flex items-center justify-center text-zinc-400">Not enough data for chart.</div>;

        const max = Math.max(...data);
        const points = data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d / max) * 90; // 90 to leave some top padding
            return `${x},${y}`;
        }).join(' ');

        return (
            <svg viewBox="0 0 100 100" className="w-full h-40" preserveAspectRatio="none">
                <polyline fill="none" stroke="#2563eb" strokeWidth="2" points={points} />
            </svg>
        );
    };

    return (
        <div className="bg-white text-black min-h-full">
            <header className="p-4 border-b">
                <h1 className="text-3xl font-bold">Audience</h1>
            </header>
            <div className="p-4 space-y-6">
                <h2 className="font-bold">Streams</h2>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-blue-500 text-white p-3 rounded-md">
                        <p className="text-sm">Streams</p>
                        <p className="text-2xl font-bold">{formatNumber(last12MonthsStreams)}</p>
                    </div>
                     <div className="bg-zinc-100 p-3 rounded-md">
                        <p className="text-sm">Listeners</p>
                        <p className="text-2xl font-bold">{formatNumber(monthlyListeners)}</p>
                    </div>
                     <div className="bg-zinc-100 p-3 rounded-md">
                        <p className="text-sm">Saves</p>
                        <p className="text-2xl font-bold">{formatNumber(saves)}</p>
                    </div>
                </div>
                <div className="border rounded-md p-2">
                    <Chart />
                </div>
            </div>
        </div>
    );
};

// --- PROFILE TAB ---
const S4AProfile: React.FC = () => {
    // FIX: Get gameState from useGame hook to access the current date
    const { dispatch, activeArtistData, gameState } = useGame();
    const [showArtistPickModal, setShowArtistPickModal] = useState(false);
    const [showPitchModal, setShowPitchModal] = useState<Song | null>(null);

    if (!activeArtistData) return null;
    // FIX: Remove 'date' from activeArtistData destructuring
    const { songs, releases, artistPick, money, promotions } = activeArtistData;
    // FIX: Destructure 'date' from gameState
    const { date } = gameState;


    const handleSetArtistPick = (itemId: string, itemType: 'song' | 'release') => {
        // FIX: Add a default message to the payload to satisfy the type requirement.
        dispatch({ type: 'SET_ARTIST_PICK', payload: { itemId, itemType, message: "Check this out!" } });
        setShowArtistPickModal(false);
    };

    const handlePitchSong = (songId: string) => {
        dispatch({ type: 'PITCH_TO_PLAYLIST', payload: { songId } });
        setShowPitchModal(null);
    }
    
    const pitchedSongIds = useMemo(() => new Set(promotions.filter(p => p.promoType === 'Spotify Editorial Playlist').map(p => p.itemId)), [promotions]);

    const pitchableSongs = useMemo(() => {
        return songs.filter(s => {
            const release = releases.find(r => r.id === s.releaseId);
            if (!release || pitchedSongIds.has(s.id)) return false;
            const weeksSinceRelease = (date.year * 52 + date.week) - (release.releaseDate.year * 52 + release.releaseDate.week);
            return weeksSinceRelease <= 4; // Can pitch songs released in the last 4 weeks
        });
    }, [songs, releases, date, pitchedSongIds]);

    return (
         <div className="bg-white text-black min-h-full p-4 space-y-6">
            <h1 className="text-3xl font-bold">Profile</h1>

            <div className="bg-zinc-100 p-4 rounded-lg space-y-3">
                <h2 className="font-bold">Artist Pick</h2>
                {artistPick ? (
                    <p className="text-sm">Current Pick: {songs.find(s=>s.id === artistPick.itemId)?.title || releases.find(r=>r.id === artistPick.itemId)?.title}</p>
                ) : (
                    <p className="text-sm text-zinc-500">No artist pick selected.</p>
                )}
                <button onClick={() => setShowArtistPickModal(true)} className="bg-black text-white text-sm font-semibold px-4 py-2 rounded-full">Change Pick</button>
            </div>
            
            <div className="bg-zinc-100 p-4 rounded-lg space-y-3">
                <h2 className="font-bold">Pitch a song to playlists</h2>
                <p className="text-sm text-zinc-600">Pitch a song from an upcoming or recent release to our playlist editors.</p>
                {pitchableSongs.length > 0 ? (
                    <div className="space-y-2">
                        {pitchableSongs.map(song => (
                            <button key={song.id} onClick={() => setShowPitchModal(song)} className="w-full text-left flex items-center gap-3 p-2 bg-white rounded-md hover:bg-zinc-200">
                                <img src={song.coverArt} className="w-10 h-10" alt={song.title} />
                                <p className="font-semibold">{song.title}</p>
                            </button>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-zinc-500">No songs eligible for pitching right now.</p>
                )}
            </div>

            {/* Modals */}
            {showArtistPickModal && (
                 <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowArtistPickModal(false)}>
                    <div className="bg-white rounded-lg w-full max-w-md p-4 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold mb-4">Select Artist Pick</h2>
                        <div className="overflow-y-auto space-y-2">
                            {releases.map(item => (
                                <button key={item.id} onClick={() => handleSetArtistPick(item.id, 'release')} className="w-full flex gap-3 items-center p-2 hover:bg-zinc-100 rounded-md">
                                    <img src={item.coverArt} className="w-12 h-12" />
                                    <div className="text-left">
                                        <p className="font-bold">{item.title}</p>
                                        <p className="text-xs text-zinc-500">{item.type}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
            {showPitchModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowPitchModal(null)}>
                     <div className="bg-white rounded-lg w-full max-w-md p-6 text-center" onClick={e => e.stopPropagation()}>
                        <h2 className="text-xl font-bold">Pitch "{showPitchModal.title}"?</h2>
                        <p className="text-zinc-600 my-4">This will cost <span className="font-bold">${formatNumber(PLAYLIST_PITCH_COST)}</span>. Success is not guaranteed, but a successful pitch can significantly boost streams.</p>
                        <div className="flex gap-4">
                            <button onClick={() => setShowPitchModal(null)} className="w-full bg-zinc-200 py-2 rounded-full font-semibold">Cancel</button>
                            <button onClick={() => handlePitchSong(showPitchModal.id)} disabled={money < PLAYLIST_PITCH_COST} className="w-full bg-black text-white py-2 rounded-full font-semibold disabled:bg-zinc-400">Confirm Pitch</button>
                        </div>
                    </div>
                </div>
            )}
         </div>
    );
};

// --- MAIN WRAPPER COMPONENT ---
const SpotifyForArtistsView: React.FC = () => {
    const { dispatch, activeArtist } = useGame();
    const [activeTab, setActiveTab] = useState<S4ATab>('Home');
    const [view, setView] = useState<'tabs' | 'songDetail' | 'upcomingReleaseDetail'>('tabs');
    const [selectedSong, setSelectedSong] = useState<Song | null>(null);
    const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

    if (!activeArtist) return null;

    const handleSelectSong = (song: Song) => {
        setSelectedSong(song);
        setView('songDetail');
    };

    const handleBackFromDetail = () => {
        setSelectedSong(null);
        setView('tabs');
    };

    const handleSelectUpcomingRelease = (submissionId: string) => {
        setSelectedSubmissionId(submissionId);
        setView('upcomingReleaseDetail');
    };

    const handleBackFromUpcoming = () => {
        setSelectedSubmissionId(null);
        setView('tabs');
    };

    if (view === 'songDetail' && selectedSong) {
        return <S4ASongDetailView song={selectedSong} onBack={handleBackFromDetail} />;
    }

    if (view === 'upcomingReleaseDetail' && selectedSubmissionId) {
        return <S4AUpcomingReleaseDetailView submissionId={selectedSubmissionId} onBack={handleBackFromUpcoming} />;
    }

    const renderContent = () => {
        switch (activeTab) {
            case 'Home': return <S4AHome />;
            case 'Music': return <S4AMusic onSelectSong={handleSelectSong} onSelectUpcomingRelease={handleSelectUpcomingRelease} />;
            case 'Audience': return <S4AAudience />;
            case 'Profile': return <S4AProfile />;
            default: return <S4AHome />;
        }
    };

    return (
        <div className="h-screen w-full flex flex-col">
            <header className="p-2 flex justify-between items-center bg-black text-white sticky top-0 z-20">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="font-bold text-lg text-red-400">
                    &lt; EXIT
                </button>
                <div className="flex items-center gap-2">
                    <span className="font-semibold">{activeArtist.name}</span>
                    <img src={activeArtist.image} alt={activeArtist.name} className="w-8 h-8 rounded-full object-cover" />
                </div>
            </header>
            <main className="flex-grow overflow-y-auto">
                {renderContent()}
            </main>
            <footer className="h-20 bg-black border-t border-zinc-700 flex justify-around items-center sticky bottom-0 z-20">
                {(['Home', 'Music', 'Audience', 'Profile'] as S4ATab[]).map(tab => {
                    const isActive = activeTab === tab;
                    const icon = {
                        Home: <HomeIcon className="w-6 h-6" />,
                        Music: <MusicNoteIcon className="w-6 h-6" />,
                        Audience: <UserGroupIcon className="w-6 h-6" />,
                        Profile: <UserCircleIcon className="w-6 h-6" />,
                    }[tab];
                    return (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex flex-col items-center gap-1 ${isActive ? 'text-white' : 'text-zinc-500'}`}>
                            {icon}
                            <span className="text-xs font-bold">{tab}</span>
                        </button>
                    )
                })}
            </footer>
        </div>
    );
};

export default SpotifyForArtistsView;
