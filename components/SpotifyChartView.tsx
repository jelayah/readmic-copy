
import React, { useState, useEffect, useMemo } from 'react';
import { useGame } from '../context/GameContext';
import SpotifyIcon from './icons/SpotifyIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import { ChartEntry, AlbumChartEntry, ChartHistory } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

const SpotifyChartView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { spotifyGlobal50, billboardTopAlbums, chartHistory, albumChartHistory, date } = gameState;
    const [activeSlide, setActiveSlide] = useState(0);

    const slides = useMemo(() => {
        const facts = [];

        // Fact 1: Longest Charting Album
        // Fix: Cast Object.entries to include proper typing for history object to avoid unknown property errors
        const longestAlbum = (Object.entries(albumChartHistory) as [string, ChartHistory[string]][]).reduce((longest, [id, history]) => {
            if (!longest || history.weeksOnChart > longest.history.weeksOnChart) {
                const album = billboardTopAlbums.find(a => a.uniqueId === id) || gameState.npcAlbums.find(a => a.uniqueId === id);
                if (album) return { album, history };
            }
            return longest;
        }, null as { album: AlbumChartEntry | { artist: string, title: string, coverArt: string }, history: any } | null);
        
        if (longestAlbum) {
            facts.push({
                bgColor: 'bg-emerald-800',
                text: `“${longestAlbum.album.title}” by ${longestAlbum.album.artist} has been on Top Albums Global the longest, at ${longestAlbum.history.weeksOnChart} weeks straight.`,
                image: longestAlbum.album.coverArt,
                subText: `Top Albums Global · ${date.year}`
            });
        }
        
        // Fact 2: Highest New Song Entry
        const highestNewEntry = spotifyGlobal50.find(s => s.lastWeek === null && s.weeksOnChart === 1);
        if (highestNewEntry) {
            facts.push({
                bgColor: 'bg-rose-800',
                text: `“${highestNewEntry.title}” by ${highestNewEntry.artist} is the highest new entry on Top Songs Global at #${highestNewEntry.rank}.`,
                image: highestNewEntry.coverArt,
                subText: `Top Songs Global · Week of ${date.week}`
            });
        }

        // Fact 3: Generic fact if others fail
        if (facts.length === 0 && spotifyGlobal50.length > 0) {
            const topArtist = spotifyGlobal50[0].artist;
            facts.push({
                bgColor: 'bg-indigo-800',
                text: `${topArtist} is dominating the charts this week.`,
                image: spotifyGlobal50[0].coverArt,
                subText: `Top Artists Global · Week of ${date.week}`
            });
        }
        
        return facts;
    }, [spotifyGlobal50, billboardTopAlbums, albumChartHistory, date, gameState.npcAlbums]);

    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setActiveSlide(prev => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [slides.length]);

    const topSong: ChartEntry | undefined = spotifyGlobal50[0];
    const topAlbum: AlbumChartEntry | undefined = billboardTopAlbums[0];

    return (
        <div className="bg-[#121212] min-h-screen text-white">
            <header className="p-4 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })} className="p-1 -ml-1 rounded-full hover:bg-white/10" aria-label="Go back">
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <SpotifyIcon className="w-7 h-7" />
                    <h1 className="text-2xl font-bold">Charts</h1>
                </div>
                <button className="flex items-center gap-1 border border-zinc-600 rounded-full px-3 py-1 text-sm font-semibold">
                    Global <ChevronDownIcon className="w-4 h-4" />
                </button>
            </header>

            <main className="p-4 space-y-4">
                {/* Hero Section */}
                {slides.length > 0 && (
                     <div className={`relative w-full h-56 rounded-lg p-4 flex justify-between items-end ${slides[activeSlide]?.bgColor || 'bg-zinc-800'}`}>
                        <div className="w-2/3">
                            <p className="text-2xl font-bold leading-tight">{slides[activeSlide].text}</p>
                            <p className="text-sm opacity-80 mt-2">{slides[activeSlide].subText}</p>
                        </div>
                        <img src={slides[activeSlide].image} alt="Chart highlight" className="w-32 h-32 rounded-lg object-cover shadow-lg" />
                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {slides.map((_, index) => (
                                <button key={index} onClick={() => setActiveSlide(index)} className={`h-1.5 rounded-full transition-all ${activeSlide === index ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
                            ))}
                        </div>
                    </div>
                )}
                
                {/* Chart Links */}
                {topSong && (
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'spotifyTopSongs'})} className="w-full bg-[#a03fec] p-4 rounded-lg text-left">
                        <p className="font-bold text-lg">Weekly Top Songs</p>
                        <p>Global</p>
                        <div className="mt-4 flex items-center gap-3">
                            <img src={topSong.coverArt} className="w-16 h-16 rounded-md" />
                            <div>
                                <p className="font-bold text-sm">#1 THIS WEEK</p>
                                <p className="text-lg">{topSong.title}</p>
                                <p className="text-sm opacity-80">{topSong.artist}</p>
                            </div>
                        </div>
                    </button>
                )}

                 {topAlbum && (
                    <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'spotifyTopAlbums'})} className="w-full bg-emerald-800 p-4 rounded-lg text-left">
                        <p className="font-bold text-lg">Weekly Top Albums</p>
                        <p>Global</p>
                        <div className="mt-4 flex items-center gap-3">
                            <img src={topAlbum.coverArt} className="w-16 h-16 rounded-md" />
                            <div>
                                <p className="font-bold text-sm">#1 THIS WEEK</p>
                                <p className="text-lg">{topAlbum.title}</p>
                                <p className="text-sm opacity-80">{topAlbum.artist}</p>
                            </div>
                        </div>
                    </button>
                )}
            </main>
        </div>
    );
};

export default SpotifyChartView;
