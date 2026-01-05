import React from 'react';
import { useGame, formatNumber } from '../context/GameContext';
import { XPost, XUser } from '../types';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import CheckCircleIcon from './icons/CheckCircleIcon';
import MessageIcon from './icons/MessageIcon';
import CommentIcon from './icons/CommentIcon';
import RetweetIcon from './icons/RetweetIcon';
import HeartIcon from './icons/HeartIcon';
import ChartBarIcon from './icons/ChartBarIcon';

const Post: React.FC<{ post: XPost; author: XUser }> = ({ post, author }) => {
    const timeAgo = (postDate: { week: number, year: number }) => `${postDate.week}w`;

    return (
        <div className="flex gap-3 p-3 border-b border-zinc-700/70">
            <img src={author.avatar} alt={author.name} className="w-10 h-10 rounded-full flex-shrink-0 object-cover" />
            <div className="w-full">
                <div className="flex items-center gap-1 text-sm">
                    <span className="font-bold">{author.name}</span>
                    {author.isVerified && <CheckCircleIcon className="w-4 h-4 text-blue-400" />}
                    <span className="text-zinc-500">@{author.username}</span>
                    <span className="text-zinc-500">·</span>
                    <span className="text-zinc-500">{timeAgo(post.date)}</span>
                </div>
                <p className="text-white whitespace-pre-wrap">{post.content}</p>
                {post.image && <img src={post.image} alt="Post image" className="mt-2 rounded-xl border border-zinc-700" />}
                 <div className="flex justify-between items-center mt-3 text-zinc-500 max-w-sm">
                    <div className="flex items-center gap-1 group">
                        <button className="p-1.5 group-hover:bg-blue-500/10 rounded-full"><CommentIcon className="w-5 h-5 group-hover:text-blue-500" /></button>
                        <span className="text-xs group-hover:text-blue-500">0</span>
                    </div>
                     <div className="flex items-center gap-1 group">
                        <button className="p-1.5 group-hover:bg-green-500/10 rounded-full"><RetweetIcon className="w-5 h-5 group-hover:text-green-500" /></button>
                        <span className="text-xs group-hover:text-green-500">{formatNumber(post.retweets)}</span>
                    </div>
                     <div className="flex items-center gap-1 group">
                        <button className="p-1.5 group-hover:bg-pink-500/10 rounded-full"><HeartIcon className="w-5 h-5 group-hover:text-pink-500" /></button>
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


const XProfileView: React.FC = () => {
    const { gameState, dispatch, activeArtistData } = useGame();
    const { selectedXUserId } = gameState;
    const { xUsers, xPosts, xFollowingIds, xSuspensionStatus } = activeArtistData!;

    const user = xUsers.find(u => u.id === selectedXUserId);
    const userPosts = xPosts
        .filter(p => p.authorId === selectedXUserId)
        .sort((a, b) => {
            const dateA = a.date.year * 52 + a.date.week;
            const dateB = b.date.year * 52 + b.date.week;
            return dateB - dateA;
        }).slice(0, 20);

    const isFollowing = user ? xFollowingIds.includes(user.id) : false;

    const handleFollow = () => {
        if (!user) return;
        if (isFollowing) {
            dispatch({ type: 'UNFOLLOW_X_USER', payload: user.id });
        } else {
            dispatch({ type: 'FOLLOW_X_USER', payload: user.id });
        }
    };
    
    const handleMessage = () => {
        if (!user || !isFollowing) return;
        const chat = activeArtistData!.xChats.find(c => !c.isGroup && c.participants.includes(user.id));
        if (chat) {
            dispatch({ type: 'VIEW_X_CHAT', payload: chat.id });
        } else {
            // Future: Implement DM creation
            alert("No direct message found with this user.");
        }
    };

    if (!user) {
        return <div className="p-4">User not found. <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'x' })}>Back</button></div>;
    }

    return (
        <div className="bg-black text-white min-h-screen">
            <header className="sticky top-0 bg-black/80 backdrop-blur-sm z-20 p-3 flex items-center gap-4">
                <button onClick={() => dispatch({ type: 'CHANGE_VIEW', payload: 'x' })} className="p-2 rounded-full hover:bg-zinc-800">
                    <ArrowLeftIcon className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="font-bold text-lg">{user.name}</h2>
                    <p className="text-xs text-zinc-500">{userPosts.length} posts</p>
                </div>
            </header>
            
            {user.isPlayer && xSuspensionStatus?.isSuspended && (
                <div className="bg-zinc-800 p-3 text-center text-sm text-zinc-300">
                    <strong>Account suspended</strong>
                    <p className="text-xs">X suspends accounts which violate the X Rules.</p>
                </div>
            )}

            <div className="h-32 bg-zinc-800"></div>
            <div className="p-3">
                <div className="flex justify-between items-start -mt-14">
                    <img src={user.avatar} alt={user.name} className="w-28 h-28 rounded-full object-cover border-4 border-black" />
                    {!user.isPlayer && (
                         <div className="flex items-center gap-2 pt-14">
                            {isFollowing && (
                                <button onClick={handleMessage} className="border border-zinc-600 rounded-full p-2 hover:bg-zinc-800">
                                    <MessageIcon className="w-5 h-5"/>
                                </button>
                            )}
                            <button 
                                onClick={handleFollow}
                                className={`font-bold px-4 py-1.5 rounded-full text-sm ${isFollowing ? 'bg-transparent text-white border border-zinc-600' : 'bg-white text-black'}`}
                            >
                                {isFollowing ? 'Following' : 'Follow'}
                            </button>
                         </div>
                    )}
                </div>

                <div className="mt-3">
                    <div className="flex items-center gap-1">
                        <h1 className="text-xl font-bold">{user.name}</h1>
                        {user.isVerified && <CheckCircleIcon className="w-5 h-5 text-blue-400" />}
                    </div>
                    <p className="text-zinc-500">@{user.username}</p>
                    {user.bio && <p className="mt-2">{user.bio}</p>}
                    <div className="flex gap-4 text-sm text-zinc-500 mt-2">
                        <p><span className="font-bold text-white">{formatNumber(user.followingCount)}</span> Following</p>
                        <p><span className="font-bold text-white">{formatNumber(user.followersCount)}</span> Followers</p>
                    </div>
                </div>
            </div>
            
            <div className="border-b border-zinc-700/70 mt-3">
                <div className="flex justify-around">
                    <div className="flex-1 text-center font-bold p-3 border-b-2 border-blue-500">Posts</div>
                </div>
            </div>

            <div>
                {userPosts.map(post => <Post key={post.id} post={post} author={user} />)}
            </div>
        </div>
    );
};

export default XProfileView;