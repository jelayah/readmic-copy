import React, { useEffect, useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import type { Release, Song, GameDate } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import DownloadIcon from './icons/DownloadIcon';
import DotsHorizontalIcon from './icons/DotsHorizontalIcon';
import CameraIcon from './icons/CameraIcon';
import TrianglePlayIcon from './icons/TrianglePlayIcon';
import SpotifySnapshotView from './SpotifySnapshotView';
import SpotifyNowPlayingView from './SpotifyNowPlayingView';

const getDominantColor = (imageUrl: string, onColorReady: (color: string) => void) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;
    img.onload = () => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) {
            onColorReady('#121212');
            return;
        }
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        let data;
        try {
            data = context.getImageData(0, 0, img.width, img.height).data;
        } catch (e) {
            console.error("Can't get image data for color extraction", e);
            onColorReady('#121212');
            return;
        }

        const sampleRate = 10;
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4 * sampleRate) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        onColorReady(`rgb(${r},${g},${b})`);
    };
    img.onerror = () => {
        onColorReady('#121212'); // Fallback color
    };
};

const formatGameDate = (gameDate: GameDate) => {
    const date = new Date(gameDate.year, 0, (gameDate.week - 1) * 7 + 1);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
};

const formatTotalDuration = (totalSeconds: number) => {
    const minutes = Math.round(totalSeconds / 60);
    return `${minutes}min`;
};


const SpotifyReleaseDetailView: React.FC<{ releaseId: string; onBack: () => void; }> = ({ releaseId, onBack }) => {
    const { activeArtist, activeArtistData } = useGame();
    const [bgColor, setBgColor] = useState('#121212');
    const [showSnapshot, setShowSnapshot] = useState(false);
    const [showStatsModalForSong, setShowStatsModalForSong] = useState<Song | null>(null);
    const [nowPlayingSong, setNowPlayingSong] = useState<Song | null>(null);

    const { releases, songs } = activeArtistData!;

    const release = useMemo(() => releases.find(r => r.id === releaseId), [releases, releaseId]);
    const releaseSongs = useMemo(() => {
        if (!release) return [];
        return release.songIds.map(id => songs.find(s => s.id === id)).filter(Boolean) as Song[];
    }, [release, songs]);

    useEffect(() => {
        if (release) {
            getDominantColor(release.coverArt, setBgColor);
        } else {
            setBgColor('#121212');
        }
    }, [release]);
    
    const totalDuration = useMemo(() => {
        return releaseSongs.reduce((sum, song) => sum + song.duration, 0);
    }, [releaseSongs]);

    if (nowPlayingSong) {
        return <SpotifyNowPlayingView song={nowPlayingSong} onBack={() => setNowPlayingSong(null)} />;
    }

    if (!release || !activeArtist) {
        return (
            <div className="bg-black text-white min-h-screen flex items-center justify-center">
                <p>Release not found.</p>
                <button onClick={onBack} className="absolute top-4 left-4">Back</button>
            </div>
        );
    }
    
    let labelText: string;
    if (release.releasingLabel) {
        labelText = release.releasingLabel.name;
        if (release.releasingLabel.dealWithMajor) {
            labelText += `, a division of ${release.releasingLabel.dealWithMajor}`;
        }
    } else {
        labelText = 'Independent';
    }
    const copyrightText = `© ${release.releaseDate.year} ${labelText}`;
    const phonogramText = `℗ ${release.releaseDate.year} ${labelText}`;

    return (
        <>
            {showSnapshot && <SpotifySnapshotView release={release} onBack={() => setShowSnapshot(false)} />}
            {showStatsModalForSong && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowStatsModalForSong(null)}>
                    <div className="bg-zinc-800 rounded-lg p-4 w-full max-w-md" onClick={e => e.stopPropagation()}>
                    <h2 className="font-bold text-lg mb-2">Daily Streams: "{showStatsModalForSong.title}"</h2>
                    <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                        {showStatsModalForSong.dailyStreams?.map((streams, index) => (
                        <div key={index} className="flex justify-between text-sm">
                            <span className="text-zinc-400">Day {index + 1}</span>
                            <span className="font-semibold">{formatNumber(streams)}</span>
                        </div>
                        ))}
                        {(!showStatsModalForSong.dailyStreams || showStatsModalForSong.dailyStreams.length === 0) && (
                        <p className="text-zinc-500">No daily stream data available yet.</p>
                        )}
                    </div>
                    </div>
                </div>
            )}
            <div className="min-h-screen text-white transition-colors duration-500" style={{ background: `linear-gradient(to bottom, ${bgColor} 0%, #121212 40%)` }}>
                <button 
                    onClick={onBack} 
                    className="absolute top-12 left-4 bg-black/50 rounded-full p-2 hover:bg-black/70 transition-colors z-10"
                    aria-label="Go back"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <div className="pt-28 p-4">
                    <div className="flex flex-col items-center space-y-4">
                        <img src={release.coverArt} alt={release.title} className="w-48 h-48 md:w-56 md:h-56 shadow-2xl shadow-black/50" />
                        <div className="text-center">
                            <h1 className="text-2xl font-bold">{release.title}</h1>
                            <div className="flex items-center gap-2 mt-1">
                                <img src={activeArtist.image} alt={activeArtist.name} className="w-6 h-6 rounded-full object-cover" />
                                <span className="font-semibold">{activeArtist.name}</span>
                            </div>
                            <p className="text-sm text-zinc-400 mt-1">{release.type} • {release.releaseDate.year}</p>
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-zinc-400">
                             <button onClick={() => !release.isTakenDown && releaseSongs.length > 0 && setNowPlayingSong(releaseSongs[0])} disabled={release.isTakenDown}>
                                <img src={release.coverArt} alt={release.title} className="w-6 h-6 rounded-sm" />
                             </button>
                             <PlusCircleIcon className={`w-7 h-7 ${!release.isTakenDown && 'hover:text-white'}`}/>
                             <DownloadIcon className={`w-7 h-7 ${!release.isTakenDown && 'hover:text-white'}`} />
                             <DotsHorizontalIcon className={`w-7 h-7 ${!release.isTakenDown && 'hover:text-white'}`} />
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => !release.isTakenDown && setShowSnapshot(true)} disabled={release.isTakenDown} className="p-1">
                                <CameraIcon className={`w-7 h-7 text-zinc-400 ${!release.isTakenDown && 'hover:text-white'}`} />
                            </button>
                            <button 
                                className={`rounded-full w-14 h-14 flex items-center justify-center shadow-lg ${release.isTakenDown ? 'bg-zinc-700' : 'bg-green-500 shadow-green-500/30'}`}
                                disabled={release.isTakenDown}
                            >
                               <TrianglePlayIcon className={`w-7 h-7 ${release.isTakenDown ? 'text-zinc-500' : 'text-black'}`} />
                            </button>
                        </div>
                    </div>
                    
                    {release.isTakenDown ? (
                        <div className="mt-6 text-center py-8">
                            <p className="text-zinc-400">The tracks on this release are not available.</p>
                        </div>
                    ) : (
                        <div className="mt-6 space-y-4">
                            {releaseSongs.map(song => (
                                <div key={song.id} className="flex items-center">
                                    <div className="flex-grow">
                                        <p className="font-semibold">{song.title}</p>
                                        <div className="flex items-center gap-2">
                                            {song.explicit && <span className="text-xs w-4 h-4 bg-zinc-600/80 text-zinc-300 font-bold rounded-sm flex items-center justify-center">E</span>}
                                            <p className="text-sm text-zinc-400">{activeArtist.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setShowStatsModalForSong(song); }} className="p-2 -m-2">
                                     <DotsHorizontalIcon className="w-5 h-5 text-zinc-400" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="mt-6 text-sm text-zinc-400 space-y-4">
                        <p>{formatGameDate(release.releaseDate)}</p>
                        <p>{releaseSongs.length} song{releaseSongs.length > 1 ? 's' : ''} • {formatTotalDuration(totalDuration)}</p>
                        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                            <img src={activeArtist.image} alt={activeArtist.name} className="w-10 h-10 rounded-full object-cover"/>
                            <p className="font-semibold text-white">{activeArtist.name}</p>
                        </div>
                    </div>
                    <div className="mt-8 py-4 text-center text-zinc-400 text-xs">
                        <p>{copyrightText}</p>
                        <p>{phonogramText}</p>
                    </div>

                </div>
            </div>
        </>
    );
};

export default SpotifyReleaseDetailView;