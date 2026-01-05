
import React, { useMemo, useState, ChangeEvent } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import type { Release, Song, ArtistData } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import InformationCircleIcon from './icons/InformationCircleIcon';
import WikipediaIcon from './icons/WikipediaIcon';
import GrammyAwardIcon from './icons/GrammyAwardIcon';
import ChartBarIcon from './icons/ChartBarIcon';

const AlbumCertificationBadge: React.FC<{ streams: number }> = ({ streams }) => {
    const units = Math.floor(streams / 1500);
    const DIAMOND = 10_000_000;
    const PLATINUM = 1_000_000;
    const GOLD = 500_000;

    let cert = null;
    if (units >= DIAMOND) {
        const multiplier = Math.floor(units / DIAMOND);
        cert = { text: `${multiplier}x Diamond`, color: 'bg-cyan-400 text-black' };
    } else if (units >= PLATINUM) {
        const multiplier = Math.floor(units / PLATINUM);
        cert = { text: `${multiplier}x Platinum`, color: 'bg-slate-300 text-black' };
    } else if (units >= GOLD) {
        cert = { text: 'Gold', color: 'bg-yellow-400 text-black' };
    }

    if (!cert) return null;

    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${cert.color}`}>
            {cert.text}
        </span>
    );
};

const SongCertificationBadge: React.FC<{ streams: number }> = ({ streams }) => {
    const DIAMOND = 1_200_000_000;
    const PLATINUM = 100_000_000;
    const GOLD = 60_000_000;

    let cert = null;
    if (streams >= DIAMOND) {
        cert = { text: 'Diamond', color: 'bg-cyan-400 text-black' };
    } else if (streams >= PLATINUM) {
        const multiplier = Math.floor(streams / PLATINUM);
        cert = { text: `${multiplier}x Platinum`, color: 'bg-slate-300 text-black' };
    } else if (streams >= GOLD) {
        cert = { text: 'Gold', color: 'bg-yellow-400 text-black' };
    }

    if (!cert) return null;

    return (
        <span className={`px-2 py-1 text-xs font-bold rounded-full ${cert.color}`}>
            {cert.text}
        </span>
    );
};

const StatPill: React.FC<{ label: string; value: string | number | null }> = ({ label, value }) => {
    if (value === null || value === undefined) return null;
    return (
        <div className="text-center bg-zinc-700 p-2 rounded-md">
            <p className="text-xs text-zinc-400 font-semibold uppercase">{label}</p>
            <p className="text-lg font-bold">#{value}</p>
        </div>
    );
};

interface TrackItemProps {
    song: Song;
    chartInfo: { peak: number | null; current: number | null };
    isExpanded: boolean;
    onToggleExpand: () => void;
    grammyWin?: string;
}

const TrackItem: React.FC<TrackItemProps> = ({ song, chartInfo, isExpanded, onToggleExpand, grammyWin }) => {
    return (
        <div className={`bg-zinc-800/50 p-2 rounded-lg ${song.isTakenDown ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-3">
                <img src={song.coverArt} alt={song.title} className="w-10 h-10 rounded-sm object-cover" />
                <div className="flex-grow">
                    <div className="flex items-center gap-2">
                         <p className="font-semibold">{song.title}</p>
                         {grammyWin && <GrammyAwardIcon className="w-4 h-4 text-yellow-400" title={`GRAMMY Winner: ${grammyWin}`} />}
                    </div>
                    <p className="text-sm text-zinc-400">{formatNumber(song.streams)} streams</p>
                </div>
                <div className="flex items-center gap-2">
                    <SongCertificationBadge streams={song.streams} />
                    <button onClick={onToggleExpand} className="p-1 text-zinc-400 hover:text-white">
                        <InformationCircleIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            {isExpanded && (
                <div className="mt-2 pt-2 border-t border-zinc-700/50 text-sm text-zinc-300 grid grid-cols-2 gap-x-4 gap-y-1 px-1">
                     <p className="font-semibold text-zinc-400">Current Position:</p>
                     <p className="font-bold text-right">#{chartInfo.current ?? 'N/A'}</p>
                     <p className="font-semibold text-zinc-400">Peak Position:</p>
                     <p className="font-bold text-right">#{chartInfo.peak ?? 'N/A'}</p>
                </div>
            )}
        </div>
    );
};


const CatalogView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist } = useGame();
    const { billboardHot100, chartHistory, billboardTopAlbums, albumChartHistory } = gameState;
    const [expandedProjectIds, setExpandedProjectIds] = useState<Set<string>>(new Set());
    const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

    if (!activeArtistData || !activeArtist) return null;

    const { grammyHistory } = activeArtistData;

    // Fix: Added type cast to ArtistData[] to avoid unknown property errors
    const allSongs = (Object.values(gameState.artistsData) as ArtistData[]).flatMap(d => d.songs);
    const allReleases = (Object.values(gameState.artistsData) as ArtistData[]).flatMap(d => d.releases);

    const songsForArtist = useMemo(() => {
        return allSongs.filter(s => s.artistId === activeArtist.id || s.collaboration?.artistName === activeArtist.name);
    }, [allSongs, activeArtist]);

    const handleCoverArtChange = (e: React.ChangeEvent<HTMLInputElement>, releaseId: string) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                const newCoverArt = reader.result as string;
                dispatch({ type: 'UPDATE_RELEASE_COVER_ART', payload: { releaseId, newCoverArt } });
            };
            reader.readAsDataURL(file);
        }
    };

    const releasedSingles = useMemo(() => {
        return songsForArtist
            .filter(s => {
                const release = allReleases.find(r => r.id === s.releaseId);
                return s.isReleased && release?.type === 'Single';
            })
            .sort((a, b) => b.streams - a.streams);
    }, [songsForArtist, allReleases]);
    
    const releasedProjects = useMemo(() => {
        return activeArtistData.releases
            .filter(r => (r.type === 'EP' || r.type === 'Album' || r.type === 'Album (Deluxe)') && !r.soundtrackInfo)
            .map(release => {
                const releaseStreams = release.songIds.reduce((total, songId) => {
                    const song = activeArtistData.songs.find(s => s.id === songId);
                    return total + (song?.streams || 0);
                }, 0);
                return { ...release, streams: releaseStreams };
            })
            .sort((a, b) => b.streams - a.streams);
    }, [activeArtistData.releases, activeArtistData.songs]);
    
    const handleToggleExpand = (projectId: string) => {
        setExpandedProjectIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(projectId)) {
                newSet.delete(projectId);
            } else {
                newSet.add(projectId);
            }
            return newSet;
        });
    };

    const handleToggleTrackInfo = (songId: string) => {
        setExpandedTrackId(prevId => (prevId === songId ? null : songId));
    };
    
    const findGrammyWin = (itemId: string, itemType: 'song' | 'album') => {
        const win = grammyHistory.find(g => g.itemId === itemId && g.isWinner);
        return win?.category;
    }

    return (
        <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-2xl font-bold">Your Catalog</h1>
            </header>
            <div className="p-4 space-y-8">
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">Projects (EPs & Albums)</h2>
                        <button
                            onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'albumSalesChart' })}
                            className="flex items-center gap-2 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold p-2 rounded-md transition-colors"
                        >
                            <ChartBarIcon className="w-5 h-5" />
                            Sales Chart
                        </button>
                    </div>
                    {releasedProjects.length > 0 ? (
                        <div className="space-y-3">
                            {releasedProjects.map(project => {
                                const isExpanded = expandedProjectIds.has(project.id);
                                const totalUnits = Math.floor(project.streams / 1500);
                                const albumChartEntry = billboardTopAlbums.find(e => e.albumId === project.id);
                                const albumHistory = albumChartHistory[project.id];
                                const albumChartInfo = {
                                    peak: albumHistory?.peak ?? null,
                                    current: albumChartEntry?.rank ?? null,
                                };
                                const grammyWin = findGrammyWin(project.id, 'album');
                                const isTakenDown = project.isTakenDown;
                                return (
                                    <div key={project.id} className={`bg-zinc-800 p-3 rounded-lg relative ${isTakenDown ? 'opacity-50' : ''}`}>
                                        {isTakenDown && <div className="absolute top-2 right-2 text-xs font-bold bg-red-900/80 text-red-400 px-2 py-1 rounded-full z-10">TAKEN DOWN</div>}
                                        <div className="flex items-center gap-4">
                                            <label htmlFor={`cover-upload-${project.id}`} className="cursor-pointer group relative flex-shrink-0">
                                                <img src={project.coverArt} alt={project.title} className="w-20 h-20 rounded-md object-cover"/>
                                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                    <span className="text-white text-xs font-bold">Change</span>
                                                </div>
                                                <input
                                                    type="file"
                                                    id={`cover-upload-${project.id}`}
                                                    className="hidden"
                                                    accept="image/*"
                                                    onChange={(e) => handleCoverArtChange(e, project.id)}
                                                />
                                            </label>
                                            <div className="flex-grow">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <p className="font-bold text-lg">{project.title}</p>
                                                    {grammyWin && <GrammyAwardIcon className="w-5 h-5 text-yellow-400" title={`GRAMMY Winner: ${grammyWin}`} />}
                                                    <AlbumCertificationBadge streams={project.streams} />
                                                </div>
                                                <p className="text-sm text-zinc-400">{formatNumber(totalUnits)} total units</p>
                                                <div className="mt-2 grid grid-cols-2 gap-2 max-w-xs">
                                                    <StatPill label="Album Chart" value={albumChartInfo.current} />
                                                    <StatPill label="Peak" value={albumChartInfo.peak} />
                                                </div>
                                            </div>
                                            <button onClick={() => handleToggleExpand(project.id)} className="p-2 self-start">
                                                <ChevronDownIcon className={`w-6 h-6 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                            </button>
                                        </div>
                                        {isExpanded && (
                                            <div className="mt-3 pt-3 border-t border-zinc-700 space-y-2">
                                                <h4 className="font-semibold text-zinc-300">Tracklist</h4>
                                                {project.songIds.map(songId => {
                                                    const song = activeArtistData.songs.find(s => s.id === songId);
                                                    if (!song) return null;
                                                    const trackChartInfo = {
                                                        peak: chartHistory[song.id]?.peak ?? null,
                                                        current: billboardHot100.find(e => e.songId === song.id)?.rank ?? null
                                                    };
                                                    return (
                                                        <TrackItem
                                                            key={song.id}
                                                            song={song}
                                                            chartInfo={trackChartInfo}
                                                            isExpanded={expandedTrackId === song.id}
                                                            onToggleExpand={() => handleToggleTrackInfo(song.id)}
                                                            grammyWin={findGrammyWin(song.id, 'song')}
                                                        />
                                                    );
                                                })}
                                                <button
                                                    onClick={() => {
                                                        dispatch({ type: 'SELECT_RELEASE', payload: project.id });
                                                        dispatch({ type: 'CHANGE_VIEW', payload: 'wikipedia' });
                                                    }}
                                                    className="w-full mt-2 flex items-center justify-center gap-2 bg-zinc-700/50 hover:bg-zinc-700 text-zinc-300 text-sm font-semibold p-2 rounded-md transition-colors"
                                                >
                                                    <WikipediaIcon className="w-5 h-5" />
                                                    View Wikipedia Article
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">No EPs or Albums released yet.</p>
                    )}
                </div>

                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Singles</h2>
                    {releasedSingles.length > 0 ? (
                        <div className="space-y-3">
                            {releasedSingles.map(song => {
                                const chartInfo = {
                                    peak: chartHistory[song.id]?.peak ?? null,
                                    current: billboardHot100.find(e => e.songId === song.id)?.rank ?? null
                                };
                                const grammyWin = findGrammyWin(song.id, 'song');
                                const isTakenDown = song.isTakenDown;
                                return (
                                    <div key={song.id} className={`bg-zinc-800 p-3 rounded-lg flex items-center gap-4 relative ${isTakenDown ? 'opacity-50' : ''}`}>
                                        {isTakenDown && <div className="absolute top-2 right-2 text-xs font-bold bg-red-900/80 text-red-400 px-2 py-1 rounded-full z-10">TAKEN DOWN</div>}
                                        <label htmlFor={`cover-upload-${song.releaseId}`} className="cursor-pointer group relative flex-shrink-0">
                                            <img src={song.coverArt} alt={song.title} className="w-20 h-20 rounded-md object-cover"/>
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-md">
                                                <span className="text-white text-xs font-bold">Change</span>
                                            </div>
                                            <input
                                                type="file"
                                                id={`cover-upload-${song.releaseId}`}
                                                className="hidden"
                                                accept="image/*"
                                                onChange={(e) => handleCoverArtChange(e, song.releaseId!)}
                                            />
                                        </label>
                                        <div className="flex-grow">
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="font-bold text-lg">{song.title}</p>
                                                {grammyWin && <GrammyAwardIcon className="w-5 h-5 text-yellow-400" title={`GRAMMY Winner: ${grammyWin}`} />}
                                                <SongCertificationBadge streams={song.streams} />
                                            </div>
                                            <p className="text-sm text-zinc-400">{formatNumber(song.streams)} streams</p>
                                            <div className="mt-2 grid grid-cols-2 gap-2 max-w-xs">
                                                <StatPill label="Current" value={chartInfo.current} />
                                                <StatPill label="Peak" value={chartInfo.peak} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <p className="text-zinc-500 text-sm">No Singles released yet.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CatalogView;
