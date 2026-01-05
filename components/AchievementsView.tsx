
import React, { useState, useMemo } from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { Song, Release, Video } from '../types';
import ChevronDownIcon from './icons/ChevronDownIcon';

const AchievementCard: React.FC<{ title: string; children: React.ReactNode; accentColorClass?: string }> = ({ title, children, accentColorClass = 'text-zinc-400 border-zinc-700' }) => (
    <div className={`bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 rounded-xl border ${accentColorClass.replace('text-', 'border-')}/30 shadow-lg`}>
        <h2 className="text-xl font-bold mb-4">{title}</h2>
        <div className="space-y-1">{children}</div>
    </div>
);

const ItemRow: React.FC<{ item: Song | Release | Video; value: number; rank: number; isFaded?: boolean }> = ({ item, value, rank, isFaded }) => {
    // Narrowing the image source based on item type
    const imageUrl = 'coverArt' in item ? (item as any).coverArt : (item as any).thumbnail;
    
    return (
        <div className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${isFaded ? 'opacity-50' : ''}`}>
            <div className="flex items-center justify-center font-bold w-6 text-center text-zinc-400">
                {rank}
            </div>
            <img src={imageUrl} alt={item.title} className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <p className="font-semibold truncate">{item.title}</p>
                <p className="text-sm text-zinc-400 font-mono">{formatNumber(value)}</p>
            </div>
        </div>
    );
};

const ExpandableList: React.FC<{ 
    items: Array<Song | Release | Video>; 
    getValue: (item: any) => number;
    emptyMessage: string;
}> = ({ items, getValue, emptyMessage }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    
    if (items.length === 0) {
        return <p className="text-zinc-500 text-sm">{emptyMessage}</p>;
    }

    const displayedItems = isExpanded ? items.slice(0, 10) : items.slice(0, 3);
    const rowHeight = 64; 
    const listHeight = displayedItems.length * rowHeight;
    const expandedHeight = Math.min(10, items.length) * rowHeight;

    return (
        <div>
            <div className="overflow-hidden transition-all duration-300 ease-in-out" style={{ maxHeight: isExpanded ? `${expandedHeight}px` : `${listHeight}px` }}>
                <div className="space-y-1">
                    {displayedItems.map((item, i) => (
                        <ItemRow 
                            key={item.id} 
                            item={item} 
                            value={getValue(item)} 
                            rank={i + 1} 
                            isFaded={'isTakenDown' in item ? (item as any).isTakenDown : false} 
                        />
                    ))}
                </div>
            </div>
            {items.length > 3 && (
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full pt-2 text-sm text-zinc-400 hover:text-white flex items-center justify-center gap-1 mt-2"
                >
                    {isExpanded ? 'Show Less' : `Show All ${Math.min(10, items.length)}`}
                    <ChevronDownIcon className={`w-4 h-4 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
            )}
        </div>
    );
};


const AchievementsView: React.FC = () => {
    const { gameState, dispatch, activeArtistData, activeArtist } = useGame();

    if (!activeArtistData || !activeArtist) {
        return <div className="p-4">Loading achievements...</div>;
    }

    const { songs, releases, videos, firstChartEntry } = activeArtistData;
    
    const mostStreamedSong = useMemo(() => {
        return [...songs].filter(s => s.isReleased).sort((a,b) => b.streams - a.streams)[0];
    }, [songs]);

    const topSongsFirstWeek = useMemo(() => songs
        .filter(s => typeof s.firstWeekStreams === 'number')
        .sort((a, b) => (b.firstWeekStreams ?? 0) - (a.firstWeekStreams ?? 0)), [songs]);

    const topAlbumsFirstWeek = useMemo(() => releases
        .filter(r => (r.type === 'Album' || r.type === 'EP') && typeof r.firstWeekStreams === 'number')
        .sort((a, b) => (b.firstWeekStreams ?? 0) - (a.firstWeekStreams ?? 0)), [releases]);
        
    const topVideosFirstWeek = useMemo(() => videos
        .filter(v => typeof v.firstWeekViews === 'number')
        .sort((a, b) => (b.firstWeekViews ?? 0) - (a.firstWeekViews ?? 0)), [videos]);

    const topFraudulentSongs = useMemo(() => songs
        .filter(s => (s.removedStreams ?? 0) > 0)
        .sort((a, b) => (b.removedStreams ?? 0) - (a.removedStreams ?? 0)), [songs]);

    return (
        <div className="h-screen w-full bg-zinc-900 overflow-y-auto">
            <header className="p-4 flex items-center gap-4 sticky top-0 bg-zinc-900/80 backdrop-blur-sm z-10 border-b border-zinc-700/50">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="p-2 rounded-full hover:bg-white/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold">Achievements</h1>
                    <p className="text-sm text-zinc-400">Your Career Milestones</p>
                </div>
            </header>
            <main className="p-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                {mostStreamedSong && (
                    <div className={`md:col-span-2 bg-gradient-to-tr from-red-500/20 via-zinc-800 to-zinc-900 border border-red-500/30 p-4 rounded-xl flex flex-col md:flex-row items-center gap-6 ${mostStreamedSong.isTakenDown ? 'opacity-50' : ''}`}>
                        <img src={mostStreamedSong.coverArt} alt={mostStreamedSong.title} className="w-32 h-32 md:w-40 md:h-40 rounded-lg object-cover shadow-2xl shadow-red-900/50" />
                        <div className="text-center md:text-left">
                            <p className="text-sm font-bold text-red-400 uppercase tracking-widest">Your Biggest Hit</p>
                            <h2 className="text-3xl md:text-4xl font-bold">{mostStreamedSong.title}</h2>
                            <p className="text-5xl md:text-6xl font-black text-white/80 mt-2">{formatNumber(mostStreamedSong.streams)}</p>
                            <p className="font-semibold text-zinc-400">Total Streams</p>
                        </div>
                    </div>
                )}

                {firstChartEntry && (
                    <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-4 rounded-xl border border-zinc-700/50">
                        <h2 className="text-xl font-bold mb-4">First Billboard Hot 100 Entry</h2>
                         <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-red-600/20 border-2 border-red-500 rounded-lg flex flex-col items-center justify-center text-white">
                                <p className="text-xs font-bold">DEBUT</p>
                                <p className="text-4xl font-black">#{firstChartEntry.rank}</p>
                            </div>
                            <div className="min-w-0">
                                <p className="font-semibold text-lg truncate">{firstChartEntry.songTitle}</p>
                                <p className="text-zinc-400 text-sm">Week {firstChartEntry.date.week}, {firstChartEntry.date.year}</p>
                            </div>
                        </div>
                    </div>
                )}

                <AchievementCard title="Top First Week Streams" accentColorClass="text-green-400">
                    <ExpandableList 
                        items={topSongsFirstWeek} 
                        getValue={(item) => (item as any).firstWeekStreams} 
                        emptyMessage="No songs with first week data yet." 
                    />
                </AchievementCard>

                <AchievementCard title="Top First Week Album/EP Streams" accentColorClass="text-green-400">
                    <ExpandableList 
                        items={topAlbumsFirstWeek} 
                        getValue={(item) => (item as any).firstWeekStreams} 
                        emptyMessage="No projects with first week data yet." 
                    />
                </AchievementCard>
                
                <AchievementCard title="Top First Week Video Views" accentColorClass="text-red-400">
                    <ExpandableList 
                        items={topVideosFirstWeek} 
                        getValue={(item) => (item as any).firstWeekViews} 
                        emptyMessage="No videos with first week data yet." 
                    />
                </AchievementCard>

                <AchievementCard title="Most Fraudulent Songs" accentColorClass="text-yellow-400">
                    <ExpandableList 
                        items={topFraudulentSongs} 
                        getValue={(item) => (item as any).removedStreams} 
                        emptyMessage="No songs have had artificial streams removed yet." 
                    />
                </AchievementCard>
            </main>
        </div>
    );
};

export default AchievementsView;
