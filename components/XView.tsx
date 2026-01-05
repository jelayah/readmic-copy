import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import XIcon from './icons/XIcon';
import HomeIcon from './icons/HomeIcon';
import SearchIcon from './icons/SearchIcon';
import BellIcon from './icons/BellIcon';
import EnvelopeIcon from './icons/EnvelopeIcon';
import PlusIcon from './icons/PlusIcon';
import { XPost, XUser, XTrend, XChat } from '../types';
import { formatNumber } from '../context/GameContext';
import CommentIcon from './icons/CommentIcon';
import RetweetIcon from './icons/RetweetIcon';
import HeartIcon from './icons/HeartIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import UserGroupIcon from './icons/UserGroupIcon';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import ImageIcon from './icons/ImageIcon';
import ConfirmationModal from './ConfirmationModal';

// Sub-component for the Year End Chart visualization
const YearEndChart: React.FC<{ dataString: string }> = ({ dataString }) => {
    try {
        const data = JSON.parse(dataString.replace('chart:', ''));
        const { year, items } = data as { year: number, items: { title: string, artist: string, cover: string, units: string }[] };
        
        // Find max units for scaling (parse '4.2M' or '500K' back to rough numbers if possible, or just linear scale since it's sorted)
        // Since items are sorted, index 0 is max. We'll just use relative height.
        
        return (
            <div className="w-full bg-white text-black rounded-xl overflow-hidden border border-zinc-300 mt-2 font-sans">
                <div className="p-4 bg-gradient-to-b from-blue-50 to-white relative min-h-[350px] flex flex-col">
                    {/* Header */}
                    <div className="text-center mb-6 z-10">
                        <h2 className="text-2xl font-black uppercase tracking-tighter">Best Selling Albums</h2>
                        <div className="bg-black text-white px-3 py-0.5 text-sm font-bold inline-block transform -skew-x-12">
                            <span className="block transform skew-x-12">OF {year}</span>
                        </div>
                    </div>

                    {/* Chart Area */}
                    <div className="flex-grow flex items-end justify-center gap-1 sm:gap-2 px-2 pb-8 relative z-10">
                        {items.map((item, index) => {
                            // Calculate height: logarithmic decay for visual appeal or linear based on index
                            // Visual reference has #1 very tall, others stepping down.
                            // Let's fake a nice curve.
                            const heightPercentage = 100 - (index * 10); // 100, 90, 80...
                            const minHeight = 30;
                            const finalHeight = Math.max(minHeight, heightPercentage);
                            const zIndex = 10 - index;

                            return (
                                <div 
                                    key={index} 
                                    className="flex flex-col items-center group relative"
                                    style={{ width: '12%', zIndex }}
                                >
                                    {/* Units Label (Floating) */}
                                    <div className="absolute -top-6 text-[10px] sm:text-xs font-bold text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1 rounded shadow-sm">
                                        {item.units}
                                    </div>

                                    {/* Bar */}
                                    <div 
                                        className="w-full bg-gradient-to-b from-zinc-100 to-zinc-200 shadow-lg border border-zinc-300 rounded-t-lg relative overflow-hidden transition-all duration-500 ease-out hover:scale-105 origin-bottom"
                                        style={{ height: `${finalHeight * 2.5}px` }}
                                    >
                                        {/* Rank Number */}
                                        <div className="absolute bottom-1 w-full text-center text-2xl sm:text-4xl font-black text-zinc-300/50 select-none">
                                            {index + 1}
                                        </div>
                                        
                                        {/* Image */}
                                        <div className="p-1">
                                            <img 
                                                src={item.cover} 
                                                alt={item.title} 
                                                className="w-full aspect-square object-cover rounded-md shadow-sm border border-zinc-200"
                                            />
                                        </div>
                                    </div>

                                    {/* Metadata below bar */}
                                    <div className="mt-2 text-center w-full">
                                        <p className="font-bold text-[9px] sm:text-[10px] leading-tight truncate px-0.5 text-black">{item.artist}</p>
                                        <p className="text-[8px] sm:text-[9px] text-zinc-500 truncate px-0.5">{item.title}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Footer Watermark */}
                    <div className="absolute bottom-2 right-3 flex items-center gap-1 opacity-50">
                        <span className="text-[10px] font-bold tracking-widest text-zinc-400">@Red Mic</span>
                    </div>
                </div>
            </div>
        );
    } catch (e) {
        return <div className="bg-red-100 text-red-500 p-2 rounded text-xs">Error loading chart data.</div>;
    }
};


const Post: React.FC<{ post: XPost; author: XUser | undefined }> = ({ post, author }) => {
    const { dispatch, activeArtistData } = useGame();
    if (!author) return null;

    const isSuspended = activeArtistData!.xSuspensionStatus?.isSuspended;

    const timeAgo = (postDate: { week: number, year: number }) => {
        // Simplified time ago logic for demonstration
        return `${postDate.week}w`;
    }

    const handleViewProfile = () => {
        // Haters and media don't have profiles
        if (author.isPlayer || !author.id.startsWith('hater_') && author.id !== 'popbase' && author.id !== 'chartdata') {
            dispatch({ type: 'VIEW_X_PROFILE', payload: author.id });
        }
    }

    const isChartPost = post.image && post.image.startsWith('chart:');

    return (
        <div className="flex gap-3 p-3 border-b border-zinc-700/70">
            <button onClick={handleViewProfile}>
                <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
            </button>
            <div className="w-full min-w-0"> {/* min-w-0 ensures flex child shrinks properly */}
                <div className="flex items-center gap-1 text-sm">
                    <button onClick={handleViewProfile} className="font-bold hover:underline cursor-pointer truncate">{author.name}</button>
                    {author.isVerified && <CheckCircleIcon className="w-4 h-4 text-blue-400 flex-shrink-0" />}
                    <span className="text-zinc-500 truncate">@{author.username}</span>
                    <span className="text-zinc-500 flex-shrink-0">·</span>
                    <span className="text-zinc-500 hover:underline cursor-pointer flex-shrink-0">{timeAgo(post.date)}</span>
                </div>
                <p className="text-white whitespace-pre-wrap break-words">{post.content}</p>
                
                {isChartPost ? (
                    <YearEndChart dataString={post.image!} />
                ) : (
                    post.image && <img src={post.image} alt="Post image" className="mt-2 rounded-xl border border-zinc-700 max-w-full h-auto" />
                )}

                <div className="flex justify-between items-center mt-3 text-zinc-500 max-w-sm">
                    <div className="flex items-center gap-1 group">
                        <button disabled={isSuspended} className="p-1.5 group-hover:bg-blue-500/10 rounded-full disabled:cursor-not-allowed"><CommentIcon className="w-5 h-5 group-hover:text-blue-500" /></button>
                        <span className="text-xs group-hover:text-blue-500">0</span>
                    </div>
                     <div className="flex items-center gap-1 group">
                        <button disabled={isSuspended} className="p-1.5 group-hover:bg-green-500/10 rounded-full disabled:cursor-not-allowed"><RetweetIcon className="w-5 h-5 group-hover:text-green-500" /></button>
                        <span className="text-xs group-hover:text-green-500">{formatNumber(post.retweets)}</span>
                    </div>
                     <div className="flex items-center gap-1 group">
                        <button disabled={isSuspended} className="p-1.5 group-hover:bg-pink-500/10 rounded-full disabled:cursor-not-allowed"><HeartIcon className="w-5 h-5 group-hover:text-pink-500" /></button>
                        <span className="text-xs group-hover:text-pink-500">{formatNumber(post.likes)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ChartBarIcon className="w-5 h-5" />
                        <span className="text-xs">{formatNumber(post.views)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

const FeedView: React.FC = () => {
    const { activeArtistData } = useGame();
    const { xPosts, xUsers } = activeArtistData!;

    const findUser = (id: string) => xUsers.find(u => u.id === id);

    const sortedPosts = [...xPosts].sort((a, b) => {
        const dateA = a.date.year * 52 + a.date.week;
        const dateB = b.date.year * 52 + b.date.week;
        return dateB - dateA;
    }).slice(0, 20);

    return (
        <div>
            {sortedPosts.map(post => <Post key={post.id} post={post} author={findUser(post.authorId)} />)}
        </div>
    );
};

const TrendsView: React.FC = () => {
    const { activeArtistData } = useGame();
    const { xTrends } = activeArtistData!;
    
    return (
        <div className="p-3">
             <h2 className="text-xl font-bold mb-4">Trends for you</h2>
             <div className="space-y-4">
                {xTrends.map(trend => (
                    <div key={trend.id}>
                        <p className="text-xs text-zinc-500">{trend.category}</p>
                        <p className="font-bold">{trend.title}</p>
                        <p className="text-xs text-zinc-500">{formatNumber(trend.postCount)} posts</p>
                    </div>
                ))}
             </div>
        </div>
    );
};

const MessagesView: React.FC = () => {
    const { dispatch, activeArtistData } = useGame();
    const { xChats } = activeArtistData!;

    const getLastMessage = (chat: XChat) => {
        if (chat.messages.length === 0) return { text: "No messages yet", time: "" };
        const lastMsg = chat.messages[chat.messages.length - 1];
        return {
            text: lastMsg.text,
            time: `${lastMsg.date.week}w`
        };
    };

    return (
        <div className="text-white">
            <div className="p-3 border-b border-zinc-700">
                <h1 className="text-xl font-bold">Messages</h1>
            </div>
             <div className="p-3">
                <input type="text" placeholder="Search Direct Messages" className="w-full bg-zinc-800 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            {xChats.map(chat => {
                const lastMessage = getLastMessage(chat);
                return (
                    <button key={chat.id} onClick={() => dispatch({ type: 'VIEW_X_CHAT', payload: chat.id })} className="w-full flex gap-3 p-3 hover:bg-zinc-800/50 cursor-pointer">
                        <img src={chat.avatar} alt={chat.name} className="w-12 h-12 rounded-full flex-shrink-0 object-cover" />
                        <div className="w-full overflow-hidden text-left">
                             <div className="flex justify-between items-baseline">
                                <p className="font-bold truncate">{chat.name}</p>
                                <p className="text-xs text-zinc-500 flex-shrink-0">{lastMessage.time}</p>
                            </div>
                            <p className="text-sm text-zinc-400 truncate">{lastMessage.text}</p>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

const ComposeXPostModal: React.FC<{
    user: XUser;
    onClose: () => void;
    onPost: (payload: { content: string; image?: string; postType: 'normal' | 'fanWar' | 'push'; targetId?: string; songId?: string }) => void;
}> = ({ user, onClose, onPost }) => {
    const { gameState, activeArtistData } = useGame();
    const [content, setContent] = useState('');
    const [image, setImage] = useState<string | null>(null);
    const [postType, setPostType] = useState<'normal' | 'fanWar' | 'push'>('normal');
    const [targetId, setTargetId] = useState<string>('');
    const [songId, setSongId] = useState<string>('');
    const imageInputRef = useRef<HTMLInputElement>(null);
    const MAX_CHARS = 280;

    const npcArtists = useMemo(() => {
        const artistNames = new Set(gameState.npcs.map(npc => npc.artist).filter(name => name !== user.name));
        return Array.from(artistNames).sort();
    }, [gameState.npcs, user.name]);

    const playerSongs = useMemo(() => {
        return activeArtistData!.songs.filter(s => s.isReleased);
    }, [activeArtistData]);

    useEffect(() => {
        setTargetId('');
        setSongId('');
        
        if (postType === 'fanWar' && npcArtists.length > 0) {
            setTargetId(npcArtists[0]);
            setContent(`My fans are better than ${npcArtists[0]}'s fans...`);
        } else if (postType === 'push' && playerSongs.length > 0) {
            setSongId(playerSongs[0].id);
            setContent(`push ${playerSongs[0].title} to top 10 on iTunes`);
        } else {
            setContent('');
        }
    }, [postType, npcArtists, playerSongs]);


    const handlePost = () => {
        if (content.trim() || image || postType === 'push') {
            onPost({ 
                content: content.trim(), 
                image: image || undefined, 
                postType, 
                targetId: postType === 'fanWar' ? targetId : undefined,
                songId: postType === 'push' ? songId : undefined
            });
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const isPushDisabled = !activeArtistData?.fanWarStatus;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex justify-center items-start pt-16" onClick={onClose}>
            <div className="bg-black rounded-2xl w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
                <div className="p-2 border-b border-zinc-700/70 flex items-center justify-between">
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-zinc-800">
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>
                    <button className="text-sm font-bold text-blue-400 hover:bg-blue-500/20 px-3 py-1 rounded-full">Drafts</button>
                </div>
                <div className="p-4 flex flex-col gap-4">
                    <div className="flex gap-4">
                        <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover"/>
                        <div className="w-full">
                            <textarea
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="What is happening?!"
                                className="w-full bg-transparent text-xl focus:outline-none resize-none"
                                rows={5}
                                maxLength={MAX_CHARS}
                            />
                            {image && (
                                <div className="relative mt-2">
                                    <img src={image} className="rounded-xl w-full" />
                                    <button onClick={() => setImage(null)} className="absolute top-2 right-2 bg-black/70 text-white rounded-full p-1 text-xl font-bold leading-none w-6 h-6 flex items-center justify-center">&times;</button>
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="grid grid-cols-3 gap-2 mb-2">
                            <button onClick={() => setPostType('normal')} className={`py-2 text-sm font-semibold rounded-md ${postType === 'normal' ? 'bg-blue-500 text-white' : 'bg-zinc-800'}`}>Normal</button>
                            <button onClick={() => setPostType('fanWar')} className={`py-2 text-sm font-semibold rounded-md ${postType === 'fanWar' ? 'bg-red-500 text-white' : 'bg-zinc-800'}`}>Start Fan War</button>
                            <button onClick={() => setPostType('push')} disabled={isPushDisabled} className={`py-2 text-sm font-semibold rounded-md ${postType === 'push' ? 'bg-green-500 text-white' : 'bg-zinc-800'} disabled:opacity-50 disabled:cursor-not-allowed`}>Push on iTunes</button>
                        </div>
                        {isPushDisabled && postType === 'push' && <p className="text-xs text-zinc-500 text-center">Only available during a fan war.</p>}

                        {postType === 'fanWar' && (
                            <select value={targetId} onChange={e => setTargetId(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mt-2">
                                {npcArtists.map(artist => <option key={artist} value={artist}>Target: {artist}</option>)}
                            </select>
                        )}
                         {postType === 'push' && !isPushDisabled && (
                             <select value={songId} onChange={e => setSongId(e.target.value)} className="w-full bg-zinc-800 p-2 rounded-md mt-2">
                                {playerSongs.map(song => <option key={song.id} value={song.id}>Song: {song.title}</option>)}
                            </select>
                        )}
                    </div>
                </div>
                <div className="p-4 flex justify-between items-center border-t border-zinc-700/70">
                    <div>
                        <input type="file" ref={imageInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                        <button onClick={() => imageInputRef.current?.click()} className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-full">
                            <ImageIcon className="w-6 h-6"/>
                        </button>
                    </div>
                    <div className="flex items-center">
                        <span className="text-sm text-zinc-500 mr-4">{content.length}/{MAX_CHARS}</span>
                        <button 
                            onClick={handlePost} 
                            disabled={!content.trim() && !image}
                            className="bg-blue-500 text-white font-bold px-5 py-2 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


type XViewTab = 'For you' | 'Trending' | 'Messages';

const XView: React.FC = () => {
    const { dispatch, activeArtistData } = useGame();
    const [activeTab, setActiveTab] = useState<XViewTab>('For you');
    const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
    const [showAppealConfirm, setShowAppealConfirm] = useState(false);
    
    if (!activeArtistData) return null;
    const { xUsers, xSuspensionStatus } = activeArtistData;
    const playerUser = xUsers.find(u => u.isPlayer);

    const handleAppealClick = () => {
        if (!xSuspensionStatus || xSuspensionStatus.appealSentDate) return;
        setShowAppealConfirm(true);
    };

    const handleConfirmAppeal = () => {
        dispatch({ type: 'APPEAL_X_SUSPENSION' });
        setShowAppealConfirm(false);
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'For you':
                return <FeedView />;
            case 'Trending':
                return <TrendsView />;
            case 'Messages':
                return <MessagesView />;
            default:
                return <FeedView />;
        }
    };

    return (
        <div className="bg-black text-white min-h-screen flex flex-col">
            {isComposeModalOpen && playerUser && (
                <ComposeXPostModal 
                    user={playerUser}
                    onClose={() => setIsComposeModalOpen(false)}
                    onPost={(payload) => {
                        dispatch({ type: 'POST_ON_X', payload });
                        setIsComposeModalOpen(false);
                    }}
                />
            )}
             <ConfirmationModal
                isOpen={showAppealConfirm}
                onClose={() => setShowAppealConfirm(false)}
                onConfirm={handleConfirmAppeal}
                title="Submit an appeal?"
                message="Are you sure you want to appeal your suspension? You can only submit one appeal per week."
                confirmText="Submit Appeal"
            />
            <header className="sticky top-0 bg-black/80 backdrop-blur-sm z-20 border-b border-zinc-700/70 p-3 flex items-center">
                <div className="w-1/3 flex justify-start">
                    <button
                        onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'game' })}
                        className="h-8 text-sm font-semibold text-zinc-300 border border-zinc-600 rounded-full px-4 flex items-center justify-center hover:bg-zinc-800 transition-colors"
                    >
                        Exit
                    </button>
                </div>
                <div className="w-1/3 flex justify-center">
                    <XIcon className="w-7 h-7" />
                </div>
                <div className="w-1/3"></div>
            </header>

            <main className="flex-grow overflow-y-auto pb-20">
                 {xSuspensionStatus?.isSuspended && (
                    <div className="bg-black p-4 border-b border-zinc-700">
                        <h2 className="text-2xl font-bold text-white">Your account is suspended</h2>
                        <p className="text-zinc-400 mt-2">
                            After careful review, we determined your account broke the X Rules. Your account is permanently in read-only mode, which means you can’t post, Repost, or Like content. You won’t be able to create new accounts. If you think we got this wrong, you can {
                                xSuspensionStatus.appealSentDate 
                                ? <span className="text-zinc-500">appeal pending review.</span> 
                                : <button onClick={handleAppealClick} className="text-blue-400 hover:underline">submit an appeal</button>
                            }.
                        </p>
                    </div>
                )}
                {renderContent()}
            </main>

            <div className="fixed bottom-20 right-4 z-30">
                <button onClick={() => setIsComposeModalOpen(true)} disabled={xSuspensionStatus?.isSuspended} className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 transition-colors disabled:bg-zinc-600 disabled:cursor-not-allowed">
                    <PlusIcon className="w-7 h-7"/>
                </button>
            </div>
            
            <footer className="fixed bottom-0 left-0 right-0 h-20 bg-black border-t border-zinc-700/70 flex justify-around items-center z-30">
                <button onClick={() => setActiveTab('For you')} className={`${activeTab === 'For you' ? 'text-white' : 'text-zinc-500'}`}><HomeIcon className="w-7 h-7" /></button>
                <button onClick={() => setActiveTab('Trending')} className={`${activeTab === 'Trending' ? 'text-white' : 'text-zinc-500'}`}><SearchIcon className="w-7 h-7" /></button>
                <button className="text-zinc-500 cursor-not-allowed"><BellIcon className="w-7 h-7" /></button>
                <button onClick={() => setActiveTab('Messages')} className={`${activeTab === 'Messages' ? 'text-white' : 'text-zinc-500'}`}><EnvelopeIcon className="w-7 h-7" /></button>
            </footer>
        </div>
    );
};

export default XView;