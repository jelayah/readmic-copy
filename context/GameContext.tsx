import React, { createContext, useReducer, useContext, ReactNode, useEffect, useState, useMemo } from 'react';
import { db } from '../db/db';
import type { GameState, GameAction, Email, NpcSong, ChartEntry, ChartHistory, ArtistData, Artist, Group, Song, LabelSubmission, Contract, Release, XUser, XPost, XTrend, XChat, CustomLabel, PopBaseOffer, NpcAlbum, AlbumChartEntry, RedMicProState, GrammyCategory, GrammyAward, GrammyContender, OscarCategory, OscarAward, OscarContender, OnlyFansProfile, OnlyFansPost, XSuspensionStatus, SoundtrackAlbum, SoundtrackTrack, Manager, SecurityTeam, Label, VoguePhotoshoot, FeatureOffer, VmaAward, VmaCategory } from '../types';
import { INITIAL_MONEY, STREAM_INCOME_MULTIPLIER, SUBSCRIBER_THRESHOLD_STORE, VIEW_INCOME_MULTIPLIER, NPC_ARTIST_NAMES, NPC_SONG_ADJECTIVES, NPC_SONG_NOUNS, NPC_COVER_ART, LABELS, PLAYLIST_PITCH_COST, PLAYLIST_PITCH_SUCCESS_RATE, PLAYLIST_BOOST_MULTIPLIER, PLAYLIST_BOOST_WEEKS, GENRES, MANAGERS, SECURITY_TEAMS, GIGS } from '../constants';
import { generateWeeklyXContent } from '../utils/xContentGenerator';
import { REAL_WORLD_DISCOGRAPHIES } from '../realWorldDiscographies';

export const formatNumber = (num: number): string => {
    const number = Math.floor(num);

    if (number >= 1e12) {
        return (number / 1e12).toFixed(1).replace(/\.0$/, '') + 'T';
    }
    if (number >= 1e9) {
        return (number / 1e9).toFixed(1).replace(/\.0$/, '') + 'B';
    }
    if (number >= 1e6) {
        return (number / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (number >= 1e3) {
        return (number / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return number.toLocaleString();
};

const getSongCertification = (streams: number): { level: string; multiplier: number } | null => {
    const DIAMOND = 1_200_000_000;
    const PLATINUM = 100_000_000;
    const GOLD = 60_000_000;

    if (streams >= DIAMOND) return { level: 'Diamond', multiplier: Math.floor(streams / DIAMOND) };
    if (streams >= PLATINUM) return { level: 'Platinum', multiplier: Math.floor(streams / PLATINUM) };
    if (streams >= GOLD) return { level: 'Gold', multiplier: 1 };
    return null;
};

const getAlbumCertification = (units: number): { level: string; multiplier: number } | null => {
    const DIAMOND = 10_000_000;
    const PLATINUM = 1_000_000;
    const GOLD = 500_000;

    if (units >= DIAMOND) return { level: 'Diamond', multiplier: Math.floor(units / DIAMOND) };
    if (units >= PLATINUM) return { level: 'Platinum', multiplier: Math.floor(units / PLATINUM) };
    if (units >= GOLD) return { level: 'Gold', multiplier: 1 };
    return null;
};

const formatCertification = (cert: { level: string; multiplier: number } | null): string | null => {
    if (!cert) return null;
    if (cert.multiplier > 1 && cert.level !== 'Gold') {
        return `${cert.multiplier}x ${cert.level}`;
    }
    return cert.level;
};

const generateNpcs = (count: number, existingNpcs: NpcSong[] = []): NpcSong[] => {
    const npcs: NpcSong[] = [];
    const usedNames = new Set<string>(existingNpcs.map(npc => `${npc.title}-${npc.artist}`));

    for (let i = 0; i < count; i++) {
        let title = "";
        let artist = "";
        let combo = "";
        let attempts = 0;

        do {
            artist = NPC_ARTIST_NAMES[Math.floor(Math.random() * NPC_ARTIST_NAMES.length)];
            const realDisco = REAL_WORLD_DISCOGRAPHIES[artist];
            if (realDisco && realDisco.songs.length > 0 && Math.random() < 0.8) {
                const availableSongs = realDisco.songs.filter(s => !usedNames.has(`${s}-${artist}`));
                if (availableSongs.length > 0) {
                    title = availableSongs[Math.floor(Math.random() * availableSongs.length)];
                }
            }
            if (!title) {
                const adj = NPC_SONG_ADJECTIVES[Math.floor(Math.random() * NPC_SONG_ADJECTIVES.length)];
                const noun = NPC_SONG_NOUNS[Math.floor(Math.random() * NPC_SONG_NOUNS.length)];
                title = `${adj} ${noun}`;
            }
            combo = `${title}-${artist}`;
            attempts++;
        } while (usedNames.has(combo) && attempts < 10);
        
        if (usedNames.has(combo)) {
             title = `${title} (Remix)`;
             combo = `${title}-${artist}`;
        }
        usedNames.add(combo);
        const basePopularity = Math.floor(75_000_000 * Math.exp(-0.04 * (i + existingNpcs.length)));
        npcs.push({
            uniqueId: `npc_${combo.replace(/[^a-zA-Z0-9]/g, '')}`,
            title,
            artist,
            genre: GENRES[Math.floor(Math.random() * GENRES.length)],
            basePopularity,
        });
    }
    return npcs;
};

const generateNewHits = (count: number, existingNpcs: NpcSong[]): NpcSong[] => {
    const hits: NpcSong[] = [];
    const usedNames = new Set<string>(existingNpcs.map(npc => `${npc.title}-${npc.artist}`));

    for (let i = 0; i < count; i++) {
        let title = "";
        let artist = "";
        let combo = "";
        let attempts = 0;

        do {
            artist = NPC_ARTIST_NAMES[Math.floor(Math.random() * NPC_ARTIST_NAMES.length)];
            const realDisco = REAL_WORLD_DISCOGRAPHIES[artist];
            if (realDisco && realDisco.songs.length > 0 && Math.random() < 0.8) {
                const availableSongs = realDisco.songs.filter(s => !usedNames.has(`${s}-${artist}`));
                if (availableSongs.length > 0) {
                    title = availableSongs[Math.floor(Math.random() * availableSongs.length)];
                }
            }
            if (!title) {
                const adj = NPC_SONG_ADJECTIVES[Math.floor(Math.random() * NPC_SONG_ADJECTIVES.length)];
                const noun = NPC_SONG_NOUNS[Math.floor(Math.random() * NPC_SONG_NOUNS.length)];
                title = `${adj} ${noun}`;
            }
            combo = `${title}-${artist}`;
            attempts++;
        } while (usedNames.has(combo) && attempts < 10);

         if (usedNames.has(combo)) {
             title = `${title} (Remix)`;
             combo = `${title}-${artist}`;
        }
        usedNames.add(combo);
        const effectiveRank = Math.floor(Math.random() * 100); 
        const basePopularity = Math.floor(75_000_000 * Math.exp(-0.04 * effectiveRank));

        hits.push({
            uniqueId: `npc_${combo.replace(/[^a-zA-Z0-9]/g, '')}`,
            title,
            artist,
            genre: GENRES[Math.floor(Math.random() * GENRES.length)],
            basePopularity,
        });
    }
    return hits;
};

const NPC_ALBUM_ADJECTIVES = ['Eternal', 'Chromatic', 'Digital', 'Fever', 'Concrete', 'Neon', 'Stardust', 'Afterparty', 'American', 'Broken', 'Suburban', 'Melodrama'];
const NPC_ALBUM_NOUNS = ['Summer', 'Dream', 'Jungle', 'Heart', 'Angel', 'Sunset', 'Romance', 'Fantasy', 'Youth', 'Rebellion', 'Mirage', 'Odyssey'];

const generateNpcAlbums = (count: number, allNpcSongs: NpcSong[]): NpcAlbum[] => {
    const albums: NpcAlbum[] = [];
    const labels: Array<NpcAlbum['label']> = ['UMG', 'Republic', 'RCA', 'Island'];
    let songIndex = 0;

    for (let i = 0; i < count; i++) {
        const albumSongCount = Math.floor(Math.random() * 5) + 8;
        if (songIndex + albumSongCount > allNpcSongs.length) break;
        const albumSongs = allNpcSongs.slice(songIndex, songIndex + albumSongCount);
        songIndex += albumSongCount;
        if (albumSongs.length === 0) continue;
        const mainArtist = albumSongs[0].artist;
        let title = "";
        const realDisco = REAL_WORLD_DISCOGRAPHIES[mainArtist];
        if (realDisco && realDisco.albums.length > 0 && Math.random() < 0.8) {
             title = realDisco.albums[Math.floor(Math.random() * realDisco.albums.length)];
        }
        if (!title) {
            const adj = NPC_ALBUM_ADJECTIVES[Math.floor(Math.random() * NPC_ALBUM_ADJECTIVES.length)];
            const noun = NPC_ALBUM_NOUNS[Math.floor(Math.random() * NPC_ALBUM_NOUNS.length)];
            title = `${adj} ${noun}`;
        }
        const uniqueId = `npcalbum_${title.replace(/[^a-zA-Z0-9]/g, '')}_${mainArtist.replace(/[^a-zA-Z0-9]/g, '')}`;
        if (albums.some(a => a.uniqueId === uniqueId)) continue;
        const salesPotential = Math.floor(Math.random() * 136000) + 14000;
        albums.push({
            uniqueId,
            title,
            artist: mainArtist,
            label: labels[Math.floor(Math.random() * labels.length)],
            coverArt: NPC_COVER_ART,
            songIds: albumSongs.map(s => s.uniqueId),
            salesPotential,
        });
    }
    return albums;
};


const initialArtistData: ArtistData = {
    money: INITIAL_MONEY,
    hype: 0,
    popularity: 10,
    songs: [],
    releases: [],
    monthlyListeners: 0,
    lastFourWeeksStreams: [],
    lastFourWeeksViews: [],
    youtubeSubscribers: 0,
    videos: [],
    youtubeStoreUnlocked: false,
    merch: [],
    merchStoreBanner: null,
    inbox: [],
    streamsThisMonth: 0,
    viewsThisQuarter: 0,
    subsThisQuarter: 0,
    promotions: [],
    performedGigThisWeek: false,
    contract: null,
    contractHistory: [],
    labelSubmissions: [],
    customLabels: [],
    artistImages: [],
    artistVideoThumbnails: [],
    paparazziPhotos: [],
    tourPhotos: [],
    tours: [],
    manager: null,
    securityTeamId: null,
    xUsers: [],
    xPosts: [],
    xChats: [],
    xTrends: [],
    xFollowingIds: [],
    xSuspensionStatus: null,
    followers: 0,
    saves: 0,
    artistPick: null,
    listeningNow: 0,
    streamsHistory: [],
    firstChartEntry: null,
    redMicPro: {
        unlocked: false,
        subscriptionType: null,
    },
    salesBoost: 0,
    isGoldTheme: false,
    grammyHistory: [],
    hasSubmittedForBestNewArtist: false,
    vmaHistory: [],
    hasSubmittedForVmaBestNewArtist: false,
    oscarHistory: [],
    onlyfans: null,
    fanWarStatus: null,
    soundtrackOfferCount: 0,
    offeredSoundtracks: [],
    weeksUntilNextSoundtrackOffer: Math.floor(Math.random() * 13) + 12,
};


const initialState: GameState = {
    careerMode: null,
    soloArtist: null,
    group: null,
    activeArtistId: null,
    artistsData: {},
    date: { week: 1, year: 2024 },
    currentView: 'game',
    activeTab: 'Home',
    activeYoutubeChannel: 'artist',
    npcs: [],
    npcAlbums: [],
    soundtrackAlbums: [],
    billboardHot100: [],
    billboardTopAlbums: [],
    albumChartHistory: {},
    chartHistory: {},
    spotifyGlobal50: [],
    hotPopSongs: [],
    hotRapRnb: [],
    electronicChart: [],
    countryChart: [],
    hotPopSongsHistory: {},
    hotRapRnbHistory: {},
    electronicChartHistory: {},
    countryChartHistory: {},
    spotifyNewEntries: 0,
    selectedVideoId: null,
    selectedReleaseId: null,
    selectedSoundtrackId: null,
    activeSubmissionId: null,
    activeGeniusOffer: null,
    activeOnTheRadarOffer: null,
    activeTrshdOffer: null,
    activeFallonOffer: null,
    activeSoundtrackOffer: null,
    activeFeatureOffer: null,
    selectedXUserId: null,
    selectedXChatId: null,
    contractRenewalOffer: null,
    activeTourId: null,
    viewingPastLabelId: null,
    activeVogueOffer: null,
    grammySubmissions: [],
    grammyCurrentYearNominations: null,
    activeGrammyPerformanceOffer: null,
    activeGrammyRedCarpetOffer: null,
    oscarSubmissions: [],
    oscarCurrentYearNominations: null,
    activeOscarPerformanceOffer: null,
};

const GameContext = createContext<{
    gameState: GameState;
    dispatch: React.Dispatch<GameAction>;
    activeArtist: Artist | Group | null;
    activeArtistData: ArtistData | null;
    allPlayerArtists: Array<Artist | Group>;
} | undefined>(undefined);

const calculateGenreChart = (
    allContenders: any[],
    genres: string[],
    previousChart: ChartEntry[],
    chartHistory: ChartHistory
): { newChart: ChartEntry[], newHistory: ChartHistory } => {
    const genreContenders = allContenders
        .filter(song => genres.includes(song.genre));
    
    genreContenders.sort((a, b) => b.weeklyStreams - a.weeklyStreams);

    const top50 = genreContenders.slice(0, 50);
    const newHistory: ChartHistory = { ...chartHistory };
    const newChart: ChartEntry[] = [];
    const prevChartMap = new Map(previousChart.map(entry => [entry.uniqueId, entry]));

    top50.forEach((song, index) => {
        const rank = index + 1;
        const history = newHistory[song.uniqueId];
        const prevChartEntry = prevChartMap.get(song.uniqueId);

        if (history) {
            history.weeksOnChart += 1;
            history.lastRank = rank;
            if (rank < history.peak) history.peak = rank;
            if (rank === 1) {
                history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
            }
        } else {
            newHistory[song.uniqueId] = { weeksOnChart: 1, peak: rank, lastRank: rank, weeksAtNo1: rank === 1 ? 1 : 0 };
        }

        newChart.push({
            rank: rank,
            lastWeek: prevChartEntry?.rank ?? null,
            peak: newHistory[song.uniqueId].peak,
            weeksOnChart: newHistory[song.uniqueId].weeksOnChart,
            title: song.title,
            artist: song.artist,
            coverArt: song.coverArt,
            isPlayerSong: song.isPlayerSong,
            songId: song.songId,
            uniqueId: song.uniqueId,
            weeklyStreams: song.weeklyStreams,
        });
    });

    return { newChart, newHistory };
};


const gameReducer = (state: GameState, action: GameAction): GameState => {
    const allPlayerArtistsAndGroups: (Artist | Group)[] = state.careerMode === 'solo' && state.soloArtist ? [state.soloArtist] : (state.group ? [state.group, ...state.group.members] : []);
    const tmzUser: XUser = {
        id: 'tmz', name: 'TMZ', username: 'TMZ',
        avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHJ4PSI4IiBmaWxsPSIjRkZGRkZGIi8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNCIgZmlsbD0iI0QzMjYyNiIvPjxwYXRoIGQ9Ik0xNiAyMHYyNGg2VjMybDQtNGg0djIwbC0xMi0xMi0xMiAxMnoiIGZpbGw9IiNGRkYiLz48cGF0aCBkPSJNMzYgMjB2MjRoNlYzMmw0LTRoNHYyMGwtMTItMTItMTIgMTJ6IiBmaWxsPSIjRkZGIi8+PC9zdmc+',
        isVerified: true, bio: 'breaking news & celebrity gossip', followersCount: 19500000, followingCount: 150,
    };

    switch (action.type) {
        case 'START_SOLO_GAME': {
            const { artist, startYear } = action.payload;
            const startDate = { week: 1, year: startYear };
            const welcomeEmail: Email = {
                id: crypto.randomUUID(),
                sender: 'Red Mic',
                subject: `Welcome to the Music Industry, ${artist.name}!`,
                body: `Hey ${artist.name},\n\nThis is it, your first step into the world of music. We've given you $100,000 to start. Your fandom, The ${artist.fandomName}, are waiting. Spend your money wisely. Record hits, build your fanbase, and take over the charts. Good luck.\n\nThe Red Mic Team`,
                date: startDate,
                isRead: false,
                senderIcon: 'default'
            };
            const initialSubs = Math.floor(Math.random() * 5000) + 1000;
            const playerXUser: XUser = {
                id: artist.id, name: artist.name, username: artist.name.replace(/\s/g, '').toLowerCase(), avatar: artist.image, isVerified: true, isPlayer: true, bio: `Official account. Leader of the ${artist.fandomName}.`, followersCount: Math.floor(initialSubs / 10), followingCount: 0,
            };
            const initialXUsers: XUser[] = [playerXUser, tmzUser];
            const newArtistData: ArtistData = {
                ...initialArtistData, money: INITIAL_MONEY, hype: 10, popularity: 10, youtubeSubscribers: initialSubs, inbox: [welcomeEmail], xUsers: initialXUsers, xPosts: [], xChats: [], xTrends: [], xFollowingIds: [], followers: Math.floor(initialSubs / 5),
            };
            const npcs = generateNpcs(600);
            const npcAlbums = generateNpcAlbums(60, npcs);
            return {
                ...initialState, careerMode: 'solo', soloArtist: artist, activeArtistId: artist.id, artistsData: { [artist.id]: newArtistData }, date: startDate, npcs, npcAlbums,
            };
        }
        case 'START_GROUP_GAME': {
            const { group, startYear } = action.payload;
            const startDate = { week: 1, year: startYear };
            const newArtistsData: { [artistId: string]: ArtistData } = {};
            newArtistsData[group.id] = { ...initialArtistData, money: INITIAL_MONEY, xUsers: [tmzUser] };
            group.members.forEach(m => { newArtistsData[m.id] = { ...initialArtistData, money: 25000, xUsers: [tmzUser] }; });
            const npcs = generateNpcs(600);
            const npcAlbums = generateNpcAlbums(60, npcs);
            return { ...initialState, careerMode: 'group', group, activeArtistId: group.id, artistsData: newArtistsData, date: startDate, npcs, npcAlbums };
        }
        case 'CHANGE_VIEW': return { ...state, currentView: action.payload };
        case 'CHANGE_TAB': return { ...state, activeTab: action.payload };
        case 'SWITCH_YOUTUBE_CHANNEL': return { ...state, activeYoutubeChannel: action.payload };
        case 'CHANGE_ACTIVE_ARTIST': return { ...state, activeArtistId: action.payload };
        case 'PROGRESS_WEEK': {
            const newWeek = state.date.week + 1;
            const newYear = state.date.year + (newWeek > 52 ? 1 : 0);
            const newDate = { week: newWeek > 52 ? 1 : newWeek, year: newYear };
            const updatedArtistsData = { ...state.artistsData };
            for (const id in updatedArtistsData) {
                const data = updatedArtistsData[id];
                data.hype = Math.max(0, data.hype - 5);
                // Calculate income
                data.money += data.songs.reduce((acc, s) => acc + (s.lastWeekStreams * STREAM_INCOME_MULTIPLIER), 0);
            }
            return { ...state, date: newDate, artistsData: updatedArtistsData };
        }
        case 'RECORD_SONG': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - action.payload.cost,
                        songs: [...activeData.songs, action.payload.song],
                    }
                }
            };
        }
        case 'RELEASE_PROJECT': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const release = action.payload.release;
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        releases: [...activeData.releases, release],
                        songs: activeData.songs.map(s => release.songIds.includes(s.id) ? { ...s, isReleased: true, releaseId: release.id } : s),
                        hype: Math.min(100, activeData.hype + 20)
                    }
                }
            };
        }
        case 'CREATE_VIDEO': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - action.payload.cost,
                        videos: [...activeData.videos, action.payload.video]
                    }
                }
            };
        }
        case 'ADD_REVIEW': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - action.payload.cost,
                        releases: activeData.releases.map(r => r.id === action.payload.releaseId ? { ...r, review: action.payload.review } : r)
                    }
                }
            };
        }
        case 'SIGN_CONTRACT': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, contract: action.payload.contract }
                }
            };
        }
        case 'CREATE_FALLON_VIDEO': {
            if (!state.activeArtistId || !state.activeFallonOffer) return state;
            const { video, songId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === state.activeArtistId);
            if (!artistProfile) return state;

            const updatedData: ArtistData = {
                ...activeData,
                videos: [...activeData.videos, video],
                hype: Math.min(100, activeData.hype + 25),
            };

            let postContent = '';
            const postImage: string | undefined = video.thumbnail;
            
            if (video.type === 'Live Performance' && songId) {
                const song = activeData.songs.find(s => s.id === songId);
                if (song) {
                    postContent = `${artistProfile.name} delivers an incredible performance of '${song.title}' on Jimmy Fallon.\n\nWatch: youtu.be/sIdlL8V83Cc`;
                }
            } else if (video.type === 'Interview') {
                const release = activeData.releases.find(r => r.id === state.activeFallonOffer!.releaseId);
                const interviewTropes = [
                    `reveals on Jimmy Fallon that they want to do more acting: "I'm very scared to freak my fans out... but I really do love acting. I'd love for that."`,
                    `teases a new sound for their next project on Jimmy Fallon: "I'm experimenting a lot right now, it's very different."`,
                    `talks about the meaning behind their new album '${release?.title || ''}' on Jimmy Fallon: "It's my most personal work yet, I poured everything into it."`
                ];
                postContent = `${artistProfile.name} ${interviewTropes[Math.floor(Math.random() * interviewTropes.length)]}`;
            }

            if (postContent) {
                const newPost: XPost = {
                    id: crypto.randomUUID(), authorId: 'popbase', content: postContent, image: postImage,
                    likes: Math.floor(Math.random() * 30000) + 15000, retweets: Math.floor(Math.random() * 7000) + 2000,
                    views: Math.floor(Math.random() * 800000) + 200000, date: state.date,
                };
                updatedData.xPosts.unshift(newPost);
            }
            
            let newState = { ...state };
            if (state.activeFallonOffer.offerType === 'both' && state.activeFallonOffer.step === 'performance') {
                newState.activeFallonOffer = { ...state.activeFallonOffer, step: 'interview' };
                newState.currentView = 'createFallonInterview';
            } else {
                newState.activeFallonOffer = null;
                newState.currentView = 'youtube';
            }
            newState.artistsData = { ...state.artistsData, [state.activeArtistId]: updatedData };
            return newState;
        }
        case 'SET_MONEY': {
            if (!state.activeArtistId) return state;
            const { newAmount } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, money: newAmount }
                }
            };
        }
        case 'SET_HYPE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, hype: action.payload }
                }
            };
        }
        case 'SET_POPULARITY': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, popularity: action.payload }
                }
            };
        }
        case 'TOGGLE_GOLD_THEME': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, isGoldTheme: action.payload.enabled }
                }
            };
        }
        case 'SET_SALES_BOOST': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, salesBoost: action.payload.newBoost }
                }
            };
        }
        case 'PRO_SIGN_LABEL': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const newContract: Contract = {
                labelId: action.payload.labelId,
                artistId: state.activeArtistId,
                startDate: state.date,
                durationWeeks: 156,
                albumQuota: 3,
                albumsReleased: 0,
            };
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, contract: newContract }
                }
            };
        }
        case 'UPDATE_SONG_QUALITY': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        songs: activeData.songs.map(s => s.id === action.payload.songId ? { ...s, quality: action.payload.newQuality } : s)
                    }
                }
            };
        }
        case 'UPDATE_WIKIPEDIA_SUMMARY': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        releases: activeData.releases.map(r => r.id === action.payload.releaseId ? { ...r, wikipediaSummary: action.payload.summary } : r)
                    }
                }
            };
        }
        case 'UPDATE_NPC_AVATAR': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        xUsers: activeData.xUsers.map(u => u.id === action.payload.userId ? { ...u, avatar: action.payload.newAvatar } : u)
                    }
                }
            };
        }
        case 'UPDATE_NPC_X_USER': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        xUsers: activeData.xUsers.map(u => u.id === action.payload.userId ? { ...u, name: action.payload.newName, username: action.payload.newUsername } : u)
                    }
                }
            };
        }
        case 'SET_PRO_HYPE_MODE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        redMicPro: { ...activeData.redMicPro, hypeMode: action.payload }
                    }
                }
            };
        }
        case 'LOAD_GAME': return action.payload;
        case 'RESET_GAME': return initialState;
        default: return state;
    }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);

    const allPlayerArtists = useMemo(() => {
        if (gameState.careerMode === 'solo' && gameState.soloArtist) return [gameState.soloArtist];
        if (gameState.group) return [gameState.group, ...gameState.group.members];
        return [];
    }, [gameState.careerMode, gameState.soloArtist, gameState.group]);

    const activeArtist = useMemo(() => {
        return allPlayerArtists.find(a => a.id === gameState.activeArtistId) || null;
    }, [allPlayerArtists, gameState.activeArtistId]);

    const activeArtistData = useMemo(() => {
        return gameState.activeArtistId ? gameState.artistsData[gameState.activeArtistId] : null;
    }, [gameState.activeArtistId, gameState.artistsData]);

    useEffect(() => {
        const load = async () => {
            const save = await db.saves.toArray();
            if (save.length > 0) {
                dispatch({ type: 'LOAD_GAME', payload: save[0].state });
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (gameState.careerMode) {
            db.saves.clear().then(() => db.saves.add({ state: gameState }));
        }
    }, [gameState]);

    return (
        <GameContext.Provider value={{ gameState, dispatch, activeArtist, activeArtistData, allPlayerArtists }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (!context) throw new Error('useGame must be used within a GameProvider');
    return context;
};