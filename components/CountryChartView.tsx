import React from 'react';
import { useGame } from '../context/GameContext';
import { ChartEntry, GameDate } from '../types';
import ArrowUpIcon from './icons/ArrowUpIcon';
import ArrowDownIcon from './icons/ArrowDownIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import PlusIcon from './icons/PlusIcon';
import ArrowRightIcon from './icons/ArrowRightIcon';

const ChartEntryItem: React.FC<{ entry: ChartEntry }> = ({ entry }) => {
    const { rank, lastWeek, peak, weeksOnChart, title, artist, coverArt, isPlayerSong } = entry;

    const renderStatus = () => {
        const isNewEntry = lastWeek === null && weeksOnChart === 1;

        if (isNewEntry) {
            return (
                <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase">
                    New
                </div>
            );
        }

        if (lastWeek === null) {
            return <div className="h-5"></div>;
        }
        if (rank < lastWeek) {
            return <ArrowUpIcon className="w-5 h-5 text-green-500" />;
        }
        if (rank > lastWeek) {
            return <ArrowDownIcon className="w-5 h-5 text-red-500" />;
        }
        return <ArrowRightIcon className="w-4 h-4 text-zinc-400" />;
    };

    return (
        <div className="flex w-full items-center gap-4 py-4 px-2">
            <div className="w-12 text-center flex-shrink-0">
                <p className="text-3xl font-black text-black">{rank}</p>
                <div className="mt-1 h-5 flex items-center justify-center">
                    {renderStatus()}
                </div>
            </div>
            <img src={coverArt} alt={title} className="w-16 h-16 object-cover flex-shrink-0" />
            <div className="flex-grow min-w-0">
                <p className={`font-bold text-xl truncate ${isPlayerSong ? 'text-red-600' : 'text-black'}`}>{title}</p>
                <p className="text-zinc-600 text-base truncate">{artist}</p>
                <p className="text-zinc-400 text-xs font-semibold mt-1 uppercase tracking-wider">
                    LW {lastWeek ?? '-'} - PEAK {peak} - WEEKS {weeksOnChart}
                </p>
            </div>
            <button className="flex-shrink-0 p-2 border-2 border-zinc-300 rounded-full text-zinc-400 hover:border-black hover:text-black transition-colors">
                <PlusIcon className="w-5 h-5" />
            </button>
        </div>
    );
};


const CountryChartView: React.FC = () => {
    const { gameState, dispatch } = useGame();
    const { countryChart, date } = gameState;

    const getWeekDate = (d: GameDate) => {
        const date = new Date(d.year, 0, (d.week - 1) * 7 + 1);
        const month = date.toLocaleString('en-US', { month: 'long' });
        const day = date.getDate();
        return `${month} ${day}, ${d.year}`;
    }

    return (
        <div className="bg-white text-black min-h-screen">
             <header className="p-4 text-center sticky top-0 bg-white/80 backdrop-blur-sm z-10 border-b border-zinc-200">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'game'})} className="absolute top-1/2 left-4 -translate-y-1/2 p-2 rounded-full hover:bg-black/10">
                    <ArrowLeftIcon className="w-6 h-6" />
                </button>
                <h1 className="text-3xl font-black tracking-tighter font-anton">HOT COUNTRY SONGS</h1>
                <p className="text-xs font-bold tracking-widest text-zinc-600 mt-1">WEEK OF {getWeekDate(date).toUpperCase()}</p>
            </header>
            
            <main className="max-w-5xl mx-auto">
                <div className="divide-y divide-gray-200">
                    {countryChart.slice(0, 50).map(entry => (
                        <ChartEntryItem key={entry.uniqueId} entry={entry} />
                    ))}
                     {countryChart.length === 0 && (
                        <div className="text-center py-20 text-zinc-500">
                            <p>The chart is empty.</p>
                            <p className="text-sm">Release country music and wait a week for the chart to update.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default CountryChartView;