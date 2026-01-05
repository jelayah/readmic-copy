



import React from 'react';
import { useGame } from '../context/GameContext';
import type { Song, LabelSubmission } from '../types';
import ChevronRightIcon from './icons/ChevronRightIcon';
import YouTubeIcon from './icons/YouTubeIcon';
import DollarIcon from './icons/DollarIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import FireIcon from './icons/FireIcon';
import MicrophoneIcon from './icons/MicrophoneIcon';

const QualityBadge: React.FC<{ quality: number }> = ({ quality }) => {
    const getQualityColor = () => {
        if (quality < 50) return 'bg-red-500 text-white';
        if (quality < 70) return 'bg-yellow-500 text-black';
        if (quality < 96) return 'bg-green-400 text-black';
        return 'bg-green-600 text-white';
    };
    return (
        <div className={`w-12 h-12 flex items-center justify-center rounded-lg font-bold text-lg ${getQualityColor()}`}>
            {quality}
        </div>
    );
};

const UnreleasedSongItem: React.FC<{ song: Song }> = ({ song }) => (
    <div className="bg-zinc-800 p-3 rounded-lg flex items-center gap-4">
        <img src={song.coverArt} alt={song.title} className="w-16 h-16 rounded-md object-cover"/>
        <div className="flex-grow">
            <p className="font-bold">{song.title}</p>
            <p className="text-sm text-zinc-400">{song.genre}</p>
        </div>
        <QualityBadge quality={song.quality} />
    </div>
);

const SubmissionStatusBadge: React.FC<{ status: LabelSubmission['status'] }> = ({ status }) => {
    switch (status) {
        case 'pending':
            return <span className="text-xs font-bold text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded-full">Pending</span>;
        case 'awaiting_player_input':
            return <span className="text-xs font-bold text-blue-400 bg-blue-900/50 px-2 py-1 rounded-full">Action Required</span>;
        case 'scheduled':
            return <span className="text-xs font-bold text-purple-400 bg-purple-900/50 px-2 py-1 rounded-full">Scheduled</span>;
        case 'rejected':
            return <span className="text-xs font-bold text-red-400 bg-red-900/50 px-2 py-1 rounded-full">Rejected</span>;
    }
}

const SubmissionItem: React.FC<{ submission: LabelSubmission }> = ({ submission }) => {
    const { dispatch } = useGame();

    const handlePlanRelease = () => {
        dispatch({ type: 'GO_TO_LABEL_PLAN', payload: { submissionId: submission.id } });
    };

    return (
        <div className="bg-zinc-800 p-3 rounded-lg flex items-center gap-4">
            <img src={submission.release.coverArt} alt={submission.release.title} className="w-16 h-16 rounded-md object-cover"/>
            <div className="flex-grow">
                <p className="font-bold">{submission.release.title}</p>
                <p className="text-sm text-zinc-400">{submission.release.type}</p>
                {submission.status === 'scheduled' && submission.projectReleaseDate && (
                    <p className="text-xs text-green-300">Releasing W{submission.projectReleaseDate.week}, {submission.projectReleaseDate.year}</p>
                )}
            </div>
            <div className="flex flex-col items-end gap-2">
                <SubmissionStatusBadge status={submission.status} />
                {submission.status === 'awaiting_player_input' && (
                    <button onClick={handlePlanRelease} className="text-sm bg-blue-500 text-white font-semibold px-3 py-1 rounded-md hover:bg-blue-600">
                        Plan Release
                    </button>
                )}
            </div>
        </div>
    );
};


const MusicTab: React.FC = () => {
    const { dispatch, activeArtistData } = useGame();
    
    if (!activeArtistData) return null;

    const { songs, hype, labelSubmissions, contract } = activeArtistData;

    const unreleasedSongs = songs.filter(s => !s.isReleased && !s.releaseId);
    
    const hasUnreleased = unreleasedSongs.length > 0;

    const widthPercentage = `${hype}%`;

    return (
        <div className="space-y-8">
            <div className="mb-2">
                <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                        <FireIcon className="w-5 h-5 text-red-500" />
                        <h2 className="text-xl font-bold">Hype</h2>
                    </div>
                    <span className="font-bold text-lg">{Math.round(hype)}/100</span>
                </div>
                <div className="w-full bg-zinc-700 rounded-full h-4 overflow-hidden">
                    <div 
                        className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-600 h-4 rounded-full transition-all duration-500 ease-out" 
                        style={{ width: widthPercentage }}
                    ></div>
                </div>
                <p className="text-xs text-zinc-400 mt-1 text-center">Higher hype leads to more streams for all your songs.</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'spotify'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify" className="w-1/3"/>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Spotify</h3>
                        <p className="text-sm text-zinc-400">View your profile</p>
                    </div>
                </button>
                 <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'studio'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <div className="w-10 h-10 bg-red-500 rounded-full"></div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Studio</h3>
                        <p className="text-sm text-zinc-400">Record a new song</p>
                    </div>
                </button>
                 <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'pitchfork'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-1/4 h-auto fill-current"><title>Pitchfork</title><path d="M19.505 15.867v-3.32c0-1.74-1.29-2.31-2.07-2.31-.69 0-1.12.3-1.12.72 0 .54.495.69 1.125.84l2.19.495c2.31.525 3.51 1.74 3.51 4.155v3.375c0 3.315-2.73 4.155-5.61 4.155-2.715 0-5.415-.81-5.415-4.155v-3.375c0-1.74-1.29-2.31-2.07-2.31-.69 0-1.12.3-1.12.72 0 .54.495.69 1.125.84l2.19.495c2.31.525 3.51 1.74 3.51 4.155v3.32c0 2.22-1.26 3.75-4.59 3.75-2.925 0-4.2-1.2-4.2-3.75V.012h4.59v12.42c0 1.74 1.29 2.31 2.07 2.31.69 0 1.12-.3 1.12-.72 0-.54-.495-.69-1.125-.84l-2.19-.495c-2.31-.525-3.51-1.74-3.51-4.155V.012h4.59v12.42c0 1.74 1.29 2.31 2.07 2.31.69 0 1.12-.3 1.12-.72 0-.54-.495-.69-1.125-.84l-2.19-.495c-2.31-.525-3.51-1.74-3.51-4.155V.012h4.59v12.42c0 2.22 1.26 3.75 4.59 3.75 2.925 0 4.2-1.2 4.2-3.75V.012h-4.59v12.51c0 1.74-1.29 2.31-2.07 2.31-.69 0-1.12.3-1.12.72 0 .54.495.69 1.125.84l2.19.495c2.31.525 3.51 1.74 3.51 4.155z"></path></svg>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Pitchfork</h3>
                        <p className="text-sm text-zinc-400">Get a review</p>
                    </div>
                </button>
                 <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'youtube'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <YouTubeIcon className="w-12 h-12"/>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">YouTube</h3>
                        <p className="text-sm text-zinc-400">Manage channel</p>
                    </div>
                </button>
                 <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'catalog'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <DollarIcon className="w-10 h-10 text-green-400"/>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Catalog</h3>
                        <p className="text-sm text-zinc-400">View & sell assets</p>
                    </div>
                </button>
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'promote'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <MegaphoneIcon className="w-10 h-10 text-blue-400"/>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Promote</h3>
                        <p className="text-sm text-zinc-400">Boost your music</p>
                    </div>
                </button>
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'gigs'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <MicrophoneIcon className="w-10 h-10 text-purple-400"/>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Perform Live</h3>
                        <p className="text-sm text-zinc-400">Earn cash & hype</p>
                    </div>
                </button>
                <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'spotifyForArtists'})} className="aspect-square bg-zinc-800 rounded-lg p-4 flex flex-col justify-between items-start hover:bg-zinc-700 transition-colors">
                    <img src="https://storage.googleapis.com/pr-newsroom-wp/1/2018/11/Spotify_Logo_RGB_Green.png" alt="Spotify" className="w-1/3 opacity-70"/>
                    <div className="text-left">
                        <h3 className="font-bold text-lg">Manage on Spotify</h3>
                        <p className="text-sm text-zinc-400">View stats & edit profile</p>
                    </div>
                </button>
            </div>

            {contract && labelSubmissions.length > 0 && (
                 <div className="space-y-4">
                    <h2 className="text-2xl font-bold">Submitted to Label</h2>
                    <div className="space-y-3">
                        {labelSubmissions.map(sub => <SubmissionItem key={sub.id} submission={sub} />)}
                    </div>
                </div>
            )}
            
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold">Unreleased Songs</h2>
                    {hasUnreleased && (
                        <button onClick={() => dispatch({type: 'CHANGE_VIEW', payload: 'release'})} className="flex items-center gap-1 text-red-500 hover:text-red-400">
                           {contract ? 'Submit to Label' : 'Release Music'} <ChevronRightIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                {hasUnreleased ? (
                    <div className="space-y-3">
                        {unreleasedSongs.map(song => <UnreleasedSongItem key={song.id} song={song} />)}
                    </div>
                ) : (
                    <div className="text-center py-8 bg-zinc-800 rounded-lg">
                        <p className="text-zinc-400">No unreleased songs.</p>
                        <p className="text-zinc-500 text-sm">Go to the studio to record something new!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicTab;