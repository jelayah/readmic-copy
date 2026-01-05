
import React, { createContext, useReducer, useContext, ReactNode, useEffect, useState } from 'react';
import { db } from '../db/db';
import type { GameState, GameAction, Email, NpcSong, ChartEntry, ChartHistory, ArtistData, Artist, Group, Song, LabelSubmission, Contract, Release, XUser, XPost, XTrend, XChat, CustomLabel, PopBaseOffer, NpcAlbum, AlbumChartEntry, RedMicProState, GrammyCategory, GrammyAward, GrammyContender, OscarCategory, OscarAward, OscarContender, OnlyFansProfile, OnlyFansPost, XSuspensionStatus, SoundtrackAlbum, SoundtrackTrack, Manager, SecurityTeam, Label, VoguePhotoshoot, FeatureOffer } from '../types';
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
            
            // Try to get a real song
            const realDisco = REAL_WORLD_DISCOGRAPHIES[artist];
            if (realDisco && realDisco.songs.length > 0 && Math.random() < 0.8) { // 80% chance to pick a real song if available
                // Filter out songs already used by this artist
                const availableSongs = realDisco.songs.filter(s => !usedNames.has(`${s}-${artist}`));
                if (availableSongs.length > 0) {
                    title = availableSongs[Math.floor(Math.random() * availableSongs.length)];
                }
            }
            
            // Fallback to random generator if no real song found or randomly chosen
            if (!title) {
                const adj = NPC_SONG_ADJECTIVES[Math.floor(Math.random() * NPC_SONG_ADJECTIVES.length)];
                const noun = NPC_SONG_NOUNS[Math.floor(Math.random() * NPC_SONG_NOUNS.length)];
                title = `${adj} ${noun}`;
            }

            combo = `${title}-${artist}`;
            attempts++;
        } while (usedNames.has(combo) && attempts < 10);
        
        // If we couldn't find a unique name in 10 attempts, just add a random suffix to force uniqueness
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
        const albumSongCount = Math.floor(Math.random() * 5) + 8; // 8-12 songs per album
        if (songIndex + albumSongCount > allNpcSongs.length) break;

        const albumSongs = allNpcSongs.slice(songIndex, songIndex + albumSongCount);
        songIndex += albumSongCount;

        if (albumSongs.length === 0) continue;

        const mainArtist = albumSongs[0].artist;
        let title = "";
        
        // Try to find a real album title
        const realDisco = REAL_WORLD_DISCOGRAPHIES[mainArtist];
        if (realDisco && realDisco.albums.length > 0 && Math.random() < 0.8) {
             title = realDisco.albums[Math.floor(Math.random() * realDisco.albums.length)];
        }

        // Fallback if no real title
        if (!title) {
            const adj = NPC_ALBUM_ADJECTIVES[Math.floor(Math.random() * NPC_ALBUM_ADJECTIVES.length)];
            const noun = NPC_ALBUM_NOUNS[Math.floor(Math.random() * NPC_ALBUM_NOUNS.length)];
            title = `${adj} ${noun}`;
        }
        
        const uniqueId = `npcalbum_${title.replace(/[^a-zA-Z0-9]/g, '')}_${mainArtist.replace(/[^a-zA-Z0-9]/g, '')}`;
        if (albums.some(a => a.uniqueId === uniqueId)) continue; // Avoid duplicate albums

        // Ensure top tier sales potential
        // Higher index (later generated) means slightly less potential, but we want chart ready albums.
        // Generate potential between 14,000 and 150,000
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
    oscarHistory: [],
    onlyfans: null,
    fanWarStatus: null,
    // Soundtracks
    soundtrackOfferCount: 0,
    offeredSoundtracks: [],
    weeksUntilNextSoundtrackOffer: Math.floor(Math.random() * 13) + 12, // 12-24 weeks
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
                id: artist.id,
                name: artist.name,
                username: artist.name.replace(/\s/g, '').toLowerCase(),
                avatar: artist.image,
                isVerified: true,
                isPlayer: true,
                bio: `Official account. Leader of the ${artist.fandomName}.`,
                followersCount: Math.floor(initialSubs / 10),
                followingCount: 0,
            };
            const popBaseUser: XUser = {
                id: 'popbase', name: 'Pop Base', username: 'PopBase',
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzcyOGRmYSIvPjxwYXRoIGQ9Ik0zMiA0MC4yNTdMMjEuMjUgNDRsMy43NS0zLjc0M3ptMTQtOC41MTVMNDIgMjhsLTMuNzUgMy43NDN6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwLjUgMzMuNUw0MCAyNGw0IDQgTDM0LjUgMzcuNSA1IDU3bDctN3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
                isVerified: true, bio: 'all things pop culture', followersCount: 1800000, followingCount: 50
            };
            const chartDataUser: XUser = {
                id: 'chartdata', name: 'chart data', username: 'chartdata',
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjQgMzJBNzIgNzIgMCAwMS04IDMyQTcyIDcyIDAgMDE2NCAzMnoiIGZpbGw9IiMxZDFkMWQiLz48cGF0aCBkPSJNMCAzMkE3MiA3MiAwIDAwNzIgMzJBNzIgNzIgMCAwMDAtMzJ6IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
                isVerified: true, bio: 'facts & stats', followersCount: 2300000, followingCount: 1,
            };
            const addictionUser: XUser = {
                id: `addiction_fan_solo`,
                name: `addiction to ${artist.name}`,
                username: `addiction${artist.name.replace(/\s/g, '').toLowerCase()}`,
                avatar: artist.image,
                isVerified: true,
                bio: `the very best of ${artist.name}`,
                followersCount: Math.floor(Math.random() * 300000) + 200000,
                followingCount: 1,
            };

            const chartsFanUser: XUser = {
                id: 'charts_fan_solo',
                name: `${artist.name} Charts`,
                username: `${artist.name.replace(/\s/g, '').toLowerCase()}charts`,
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFEQTFGMiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iMjgiIHk9IjI0IiB3aWR0aD0iOCIgaGVpZHRoPSIyNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0MCIgeT0iMTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjMyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
                isVerified: false,
                bio: `stats & updates for ${artist.name}`,
                followersCount: Math.floor(Math.random() * 40000) + 15000,
                followingCount: 1,
            };

            const statsFanUser: XUser = {
                id: 'stats_fan_solo',
                name: `${artist.name} Stats`,
                username: `${artist.name.replace(/\s/g, '').toLowerCase()}stats`,
                avatar: artist.image,
                isVerified: true,
                bio: `Parody account. Weekly stats & updates for ${artist.name}.`,
                followersCount: Math.floor(Math.random() * 80000) + 35000,
                followingCount: 1,
            };

            const fanAvatars = [
                'https://i.imgur.com/3Y3j3jQ.png', 'https://i.imgur.com/O6G2e1E.png', 'https://i.imgur.com/sW12a89.png',
                'https://i.imgur.com/pBw2r70.png', 'https://i.imgur.com/c2802k5.png', 'https://i.imgur.com/vHqX3ch.png'
            ];
            const fanUsernames = ['StarlightStan', 'PopCultureGuru', 'MusicLover_99', 'LyricLooker', 'ConcertCraver', 'FanAccount_01'];

            const fanUsers: XUser[] = Array.from({ length: 6 }, (_, i) => ({
                id: `fan${i + 1}`,
                name: fanUsernames[i],
                username: fanUsernames[i].toLowerCase(),
                avatar: fanAvatars[i],
                isVerified: false,
                bio: `part of the ${artist.fandomName}!`,
                followersCount: Math.floor(Math.random() * (1500 - 500 + 1)) + 500,
                followingCount: Math.floor(Math.random() * (500 - 50 + 1)) + 50,
            }));

            const initialXUsers: XUser[] = [playerXUser, popBaseUser, chartDataUser, tmzUser, addictionUser, chartsFanUser, statsFanUser, ...fanUsers];
            
            const initialXPosts: XPost[] = [{
                id: crypto.randomUUID(), authorId: 'popbase', content: `Welcome to the industry, ${artist.name}! All eyes are on you.`,
                likes: 1200, retweets: 350, views: 25000, date: startDate,
            }];

            const fanGroupChat: XChat = {
                id: 'gc1',
                name: artist.fandomName,
                avatar: fanUsers[0].avatar,
                isGroup: true,
                participants: [playerXUser.id, ...fanUsers.map(f => f.id)],
                messages: [
                    { id: crypto.randomUUID(), senderId: 'fan1', text: `OMG ${artist.pronouns === 'they/them' ? 'they are' : artist.pronouns === 'she/her' ? 'she is' : 'he is'} in the chat!!`, date: startDate },
                    { id: crypto.randomUUID(), senderId: 'fan2', text: "hiiii we love you!!", date: startDate },
                    { id: crypto.randomUUID(), senderId: 'fan3', text: "Welcome!!! So excited for new music!", date: startDate },
                ],
                isRead: true,
            };
             const dmWithFan: XChat = {
                id: 'dm1',
                name: fanUsers[0].name,
                avatar: fanUsers[0].avatar,
                isGroup: false,
                participants: [playerXUser.id, 'fan1'],
                messages: [
                    { id: crypto.randomUUID(), senderId: 'fan1', text: `Just wanted to say I'm so excited for your career!!`, date: startDate }
                ],
                isRead: false,
            };
            
            const newArtistData: ArtistData = {
                ...initialArtistData,
                money: INITIAL_MONEY,
                hype: 10,
                popularity: 10,
                youtubeSubscribers: initialSubs,
                inbox: [welcomeEmail],
                xUsers: initialXUsers,
                xPosts: initialXPosts,
                xChats: [fanGroupChat, dmWithFan],
                xTrends: [
                    { id: crypto.randomUUID(), category: 'Music · Trending', title: `${artist.name}`, postCount: 18400 },
                    { id: crypto.randomUUID(), category: 'Trending in United States', title: '#newartist', postCount: 98000 }
                ],
                xFollowingIds: [],
                followers: Math.floor(initialSubs / 5),
            };
            // Increase songs and albums for more realistic charts
            const npcs = generateNpcs(600);
            const npcAlbums = generateNpcAlbums(60, npcs);

            return {
                ...initialState,
                careerMode: 'solo',
                soloArtist: artist,
                activeArtistId: artist.id,
                artistsData: {
                    [artist.id]: newArtistData
                },
                date: startDate,
                npcs,
                npcAlbums,
            };
        }
        case 'START_GROUP_GAME': {
            const { group, startYear } = action.payload;
            const startDate = { week: 1, year: startYear };

            const newArtistsData: { [artistId: string]: ArtistData } = {};
            
            const createWelcomeEmail = (name: string): Email => ({
                id: crypto.randomUUID(),
                sender: 'Red Mic',
                subject: `Welcome to the Music Industry, ${name}!`,
                body: `Hey ${name},\n\nThis is it, your first step into the world of music. Your fandom, The ${group.fandomName}, is waiting. We've given you $100,000 to start. Spend it wisely. Record hits, build your fanbase, and take over the charts. Good luck.\n\nThe Red Mic Team`,
                date: startDate,
                isRead: false,
                senderIcon: 'default'
            });

            // Social media setup for group
             const playerXUser: XUser = {
                id: group.id, name: group.name, username: group.name.replace(/\s/g, '').toLowerCase(),
                avatar: group.image, isVerified: true, isPlayer: true, bio: `Official account for ${group.name}`, followersCount: 0, followingCount: 0,
            };
            const popBaseUser: XUser = {
                id: 'popbase', name: 'Pop Base', username: 'PopBase',
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzcyOGRmYSIvPjxwYXRoIGQ9Ik0zMiA0MC4yNTdMMjEuMjUgNDRsMy43NS0zLjc0M3ptMTQtOC41MTVMNDIgMjhsLTMuNzUgMy43NDN6IiBmaWxsPSIjZmZmIi8+PHBhdGggZD0iTTMwLjUgMzMuNUw0MCAyNGw0IDQgTDM0LjUgMzcuNSA1IDU3bDctN3oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=',
                isVerified: true, bio: 'all things pop culture', followersCount: 1800000, followingCount: 50,
            };
            const chartDataUser: XUser = {
                id: 'chartdata', name: 'chart data', username: 'chartdata',
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjQgMzJBNzIgNzIgMCAwMS04IDMyQTcyIDcyIDAgMDE2NCAzMnoiIGZpbGw9IiMxZDFkMWQiLz48cGF0aCBkPSJNMCAzMkE3MiA3MiAwIDAwNzIgMzJBNzIgNzIgMCAwMDAtMzJ6IiBmaWxsPSIjZmZmIi8+PC9zdmc+',
                isVerified: true, bio: 'facts & stats', followersCount: 2300000, followingCount: 1,
            };
             const addictionUser: XUser = {
                id: 'addiction_fan_group',
                name: `addiction to ${group.name}`,
                username: `addiction${group.name.replace(/\s/g, '').toLowerCase()}`,
                avatar: group.image,
                isVerified: true,
                bio: `the very best of ${group.name}`,
                followersCount: Math.floor(Math.random() * 400000) + 300000,
                followingCount: 1,
            };
            const chartsFanUser: XUser = {
                id: 'charts_fan_group',
                name: `${group.name} Charts`,
                username: `${group.name.replace(/\s/g, '').toLowerCase()}charts`,
                avatar: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48Y2lyY2xlIGN4PSIzMiIgY3k9IjMyIiByPSIzMiIgZmlsbD0iIzFEQTFGMiIvPjxyZWN0IHg9IjE2IiB5PSIzMiIgd2lkdGg9IjgiIGhlaWdodD0iMTYiIGZpbGw9IndoaXRlIi8+PHJlY3QgeD0iMjgiIHk9IjI0IiB3aWR0aD0iOCIgaGVpZHRoPSIyNCIgZmlsbD0id2hpdGUiLz48cmVjdCB4PSI0MCIgeT0iMTYiIHdpZHRoPSI4IiBoZWlnaHQ9IjMyIiBmaWxsPSJ3aGl0ZSIvPjwvc3ZnPg==',
                isVerified: false,
                bio: `stats & updates for ${group.name}`,
                followersCount: Math.floor(Math.random() * 50000) + 20000,
                followingCount: 1,
            };
            const statsFanUser: XUser = {
                id: 'stats_fan_group',
                name: `${group.name} Stats`,
                username: `${group.name.replace(/\s/g, '').toLowerCase()}stats`,
                avatar: group.image,
                isVerified: true,
                bio: `Parody account. Weekly stats & updates for ${group.name}.`,
                followersCount: Math.floor(Math.random() * 100000) + 40000,
                followingCount: 1,
            };
            const initialXUsers: XUser[] = [playerXUser, popBaseUser, chartDataUser, tmzUser, addictionUser, chartsFanUser, statsFanUser];
            const initialXPosts: XPost[] = [{
                id: crypto.randomUUID(), authorId: 'popbase', content: `The industry is buzzing about the debut of ${group.name}!`,
                likes: 2500, retweets: 800, views: 52000, date: startDate,
            }];
            const initialTrends = [
                 { id: crypto.randomUUID(), category: 'Music · Trending', title: `${group.name}`, postCount: 25100 },
                 { id: crypto.randomUUID(), category: 'Trending in United States', title: '#newgroup', postCount: 150000 }
            ];

            // Group data
            newArtistsData[group.id] = {
                ...initialArtistData,
                hype: 15, // Start with a bit more hype
                popularity: 15,
                youtubeSubscribers: Math.floor(Math.random() * 8000) + 2000,
                inbox: [createWelcomeEmail(group.name)],
                xUsers: initialXUsers,
                xPosts: initialXPosts,
                xTrends: initialTrends,
                xFollowingIds: [],
                followers: Math.floor(Math.random() * 4000) + 1000,
            };

            // Member data
            group.members.forEach(member => {
                 const memberXUser: XUser = {
                    id: member.id, name: member.name, username: member.name.replace(/\s/g, '').toLowerCase(),
                    avatar: member.image, isVerified: true, isPlayer: true, bio: `member of ${group.name}`, followersCount: 0, followingCount: 0,
                };
                 newArtistsData[member.id] = {
                    ...initialArtistData,
                    money: 25000, // Members start with less personal cash
                    hype: 5,
                    popularity: 5,
                    youtubeSubscribers: Math.floor(Math.random() * 2000) + 500,
                    inbox: [createWelcomeEmail(member.name)],
                    xUsers: [memberXUser, popBaseUser, chartDataUser, tmzUser, addictionUser, chartsFanUser],
                    xPosts: initialXPosts,
                    xTrends: initialTrends,
                    xFollowingIds: [],
                    followers: Math.floor(Math.random() * 1000) + 200,
                 }
            });

            // Increase songs and albums for more realistic charts
            const npcs = generateNpcs(600);
            const npcAlbums = generateNpcAlbums(60, npcs);

             return {
                ...initialState,
                careerMode: 'group',
                group: group,
                activeArtistId: group.id,
                artistsData: newArtistsData,
                date: startDate,
                npcs,
                npcAlbums,
            };
        }
        case 'CHANGE_VIEW':
            return {
                ...state,
                currentView: action.payload,
            };
        case 'CHANGE_TAB':
            return {
                ...state,
                activeTab: action.payload,
            };
        case 'SWITCH_YOUTUBE_CHANNEL':
            return {
                ...state,
                activeYoutubeChannel: action.payload,
            };
        case 'CHANGE_ACTIVE_ARTIST':
            return {
                ...state,
                activeArtistId: action.payload,
            };
        case 'PROGRESS_WEEK': {
            // NPC Churn Logic: Simulate new songs releasing
            let newNpcsList = [...state.npcs];
            const CHURN_COUNT = 100;
            // Remove 100 NPCs from the bottom of the list.
            if (newNpcsList.length >= CHURN_COUNT) {
                 newNpcsList.splice(newNpcsList.length - CHURN_COUNT, CHURN_COUNT);
            }
           
            // Generate 100 new NPCs, avoiding name collisions
            const newlyGeneratedNpcs = generateNewHits(CHURN_COUNT, newNpcsList);

            // Add them back to the list
            newNpcsList.push(...newlyGeneratedNpcs);

            // NPC Album Churn Logic
            let newNpcAlbums = [...state.npcAlbums];
            const ALBUM_CHURN_COUNT = 5;
            if (newNpcAlbums.length > ALBUM_CHURN_COUNT) {
                newNpcAlbums.splice(newNpcAlbums.length - ALBUM_CHURN_COUNT, ALBUM_CHURN_COUNT);
            }
            // Generate new albums using the newest songs
            const newestSongsForAlbums = newlyGeneratedNpcs.slice(0, ALBUM_CHURN_COUNT * 12); // Assuming max 12 songs per album
            const newlyGeneratedAlbums = generateNpcAlbums(ALBUM_CHURN_COUNT, newestSongsForAlbums);
            newNpcAlbums.unshift(...newlyGeneratedAlbums); // Add new albums to the top


            const newWeek = state.date.week + 1;
            const newYear = state.date.year + (newWeek > 52 ? 1 : 0);
            const newDate = { week: newWeek > 52 ? 1 : newWeek, year: newYear };

            // --- NEW MUSIC FRIDAY TWEET LOGIC ---
            let popBaseNewMusicPost: XPost | null = null;
            try {
                const newMusicItems: { artist: string, title: string, type: 'song' | 'album' }[] = [];
                
                for (const artistId in state.artistsData) {
                    const artistData = state.artistsData[artistId];
                    const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                    if (!artistProfile) continue;

                    artistData.releases.forEach(release => {
                        if (!release.releasingLabel && release.releaseDate.week === newDate.week && release.releaseDate.year === newDate.year) {
                            newMusicItems.push({
                                artist: artistProfile.name,
                                title: release.title,
                                type: (release.type === 'Single') ? 'song' : 'album',
                            });
                        }
                    });
                    
                    artistData.labelSubmissions.forEach(sub => {
                        if (sub.status === 'scheduled') {
                            sub.singlesToRelease?.forEach(single => {
                                if (single.releaseDate.week === newDate.week && single.releaseDate.year === newDate.year) {
                                    const song = artistData.songs.find(s => s.id === single.songId);
                                    if (song) {
                                        newMusicItems.push({ artist: artistProfile.name, title: song.title, type: 'song' });
                                    }
                                }
                            });
                            if (sub.projectReleaseDate && sub.projectReleaseDate.week === newDate.week && sub.projectReleaseDate.year === newDate.year) {
                                newMusicItems.push({
                                    artist: artistProfile.name,
                                    title: sub.release.title,
                                    type: 'album'
                                });
                            }
                        }
                    });
                }

                newlyGeneratedAlbums.slice(0, 4).forEach(album => {
                    newMusicItems.push({ artist: album.artist, title: album.title, type: 'album' });
                });
                const npcAlbumSongIds = new Set(newlyGeneratedAlbums.slice(0, 4).flatMap(a => a.songIds));
                newlyGeneratedNpcs.filter(song => !npcAlbumSongIds.has(song.uniqueId)).slice(0, 4).forEach(song => {
                    newMusicItems.push({ artist: song.artist, title: song.title, type: 'song' });
                });

                if (newMusicItems.length > 0) {
                    const shuffledItems = newMusicItems.sort(() => 0.5 - Math.random()).slice(0, 8);
                    const content = "New music out tonight:\n\n" + shuffledItems.map(item => {
                        const emoji = (item.type === 'album') ? '💿' : '🎵';
                        return `• ${item.artist} — ${item.title} ${emoji}`;
                    }).join('\n');
                    
                    popBaseNewMusicPost = {
                        id: crypto.randomUUID(),
                        authorId: 'popbase',
                        content: content,
                        likes: Math.floor(Math.random() * 8000) + 4000,
                        retweets: Math.floor(Math.random() * 1500) + 400,
                        views: Math.floor(Math.random() * 200000) + 80000,
                        date: newDate
                    };
                }
            } catch (e) {
                console.error("Error generating New Music Friday tweet:", e);
            }
            
            let contractRenewalForActivePlayer: GameState['contractRenewalOffer'] = null;
            const updatedArtistsData: { [id: string]: ArtistData } = JSON.parse(JSON.stringify(state.artistsData));
            
            const allCustomLabels: CustomLabel[] = [];
            for (const artistId in updatedArtistsData) {
                allCustomLabels.push(...updatedArtistsData[artistId].customLabels);
            }

            const playerArtistIds = new Set(allPlayerArtistsAndGroups.map(a => a.id));

            for (const artistId in updatedArtistsData) {
                const artistData = updatedArtistsData[artistId];
                let newEmails: Email[] = [];
                const artistProfileForEmail = allPlayerArtistsAndGroups.find(a => a.id === artistId);

                if (popBaseNewMusicPost) {
                    artistData.xPosts.unshift(popBaseNewMusicPost);
                }

                // --- MANAGER LOGIC ---
                if (artistData.manager) {
                    const manager = MANAGERS.find(m => m.id === artistData.manager!.id);
                    const contractEnded = (newDate.year > artistData.manager.contractEndDate.year) || 
                                          (newDate.year === artistData.manager.contractEndDate.year && newDate.week >= artistData.manager.contractEndDate.week);
                
                    if (contractEnded) {
                        artistData.manager = null;
                        if (manager) {
                            artistData.popularity = Math.max(0, artistData.popularity - manager.popularityBoost);
                        }
                        if(artistProfileForEmail) {
                            newEmails.push({
                                id: crypto.randomUUID(),
                                sender: 'Business Alert',
                                senderIcon: 'business',
                                subject: 'Manager Contract Expired',
                                body: `Hi ${artistProfileForEmail.name},\n\nYour yearly contract with ${manager?.name || 'your manager'} has expired. You will need to hire a new one if you wish to continue using management services.\n\n- Red Mic Business Team`,
                                date: newDate,
                                isRead: false,
                            });
                        }
                    } else {
                        // Auto-book gigs
                        const gigsToBook = manager?.autoGigsPerWeek || 0;
                        const availableGigs = GIGS.filter(g => g.isAvailable(artistData)).sort((a,b) => b.cashRange[1] - a.cashRange[1]);
                        let gigsBookedThisWeek = 0;
                        let weeklyGigIncome = 0;
                        let weeklyGigHype = 0;
                        let bookedGigNames = [];
                
                        for (const gig of availableGigs) {
                            if (gigsBookedThisWeek < gigsToBook) {
                                 const cashEarned = Math.floor(Math.random() * (gig.cashRange[1] - gig.cashRange[0] + 1)) + gig.cashRange[0];
                                 weeklyGigIncome += cashEarned;
                                 weeklyGigHype += gig.hype;
                                 bookedGigNames.push(`- ${gig.name}: $${formatNumber(cashEarned)}, +${gig.hype} hype`);
                                 gigsBookedThisWeek++;
                            }
                        }
                        if (gigsBookedThisWeek > 0) {
                            artistData.money += weeklyGigIncome;
                            artistData.hype = Math.min(1000, artistData.hype + weeklyGigHype);
                             if(artistProfileForEmail) {
                                newEmails.push({
                                    id: crypto.randomUUID(),
                                    sender: manager?.name || 'Your Manager',
                                    senderIcon: 'business',
                                    subject: `Weekly Gig Report`,
                                    body: `Hi ${artistProfileForEmail.name},\n\nI've booked ${gigsBookedThisWeek} gig(s) for you this week, earning a total of $${formatNumber(weeklyGigIncome)} and +${weeklyGigHype} hype.\n\nDetails:\n${bookedGigNames.join('\n')}\n\nKeep up the great work!\n\nBest,\n${manager?.name}`,
                                    date: newDate,
                                    isRead: false,
                                });
                            }
                        }
                    }
                }

                // --- SECURITY LOGIC ---
                if (artistData.securityTeamId) {
                    const team = SECURITY_TEAMS.find(s => s.id === artistData.securityTeamId);
                    if (team) {
                        if (artistData.money < team.weeklyCost) {
                            artistData.securityTeamId = null;
                            if(artistProfileForEmail) {
                                newEmails.push({
                                    id: crypto.randomUUID(),
                                    sender: 'Business Alert',
                                    senderIcon: 'business',
                                    subject: 'Security Payment Failed',
                                    body: `Hi ${artistProfileForEmail.name},\n\nYour weekly payment of $${formatNumber(team.weeklyCost)} for ${team.name} failed due to insufficient funds. Your security contract has been terminated.\n\n- Red Mic Business Team`,
                                    date: newDate,
                                    isRead: false,
                                });
                            }
                        } else {
                            artistData.money -= team.weeklyCost;
                        }
                    }
                }

                // --- PROMOTION PAYMENT LOGIC ---
                const totalWeeklyPromoCost = artistData.promotions.reduce((sum, p) => sum + p.weeklyCost, 0);

                if (totalWeeklyPromoCost > 0) {
                    if (artistData.money < totalWeeklyPromoCost) {
                        // Can't afford, cancel all promotions
                        artistData.promotions = [];
                        if (artistProfileForEmail) {
                            newEmails.push({
                                id: crypto.randomUUID(),
                                sender: 'Red Mic Promotions',
                                subject: 'Promotion Payment Failed',
                                body: `Hi ${artistProfileForEmail.name},\n\nYour weekly payment of $${formatNumber(totalWeeklyPromoCost)} for active promotions could not be processed due to insufficient funds.\n\nAll your active promotions have been cancelled.\n\n- The Red Mic Team`,
                                date: newDate,
                                isRead: false,
                                senderIcon: 'default',
                            });
                        }
                    } else {
                        // Can afford, deduct cost and send invoice
                        artistData.money -= totalWeeklyPromoCost;
                        if (artistProfileForEmail) {
                            let invoiceBody = `Hi ${artistProfileForEmail.name},\n\nThis is your invoice for this week's promotions. A total of $${formatNumber(totalWeeklyPromoCost)} has been deducted from your account.\n\nBreakdown:\n`;
                            artistData.promotions.forEach(p => {
                                const item = p.itemType === 'video' 
                                    ? artistData.videos.find(v => v.id === p.itemId) 
                                    : artistData.songs.find(s => s.id === p.itemId);
                                invoiceBody += `• ${p.promoType} for "${item?.title || 'Item'}": $${formatNumber(p.weeklyCost)}\n`;
                            });
                            invoiceBody += `\nPromotions will automatically renew next week. You can cancel them at any time in the 'Promote' menu.\n\n- The Red Mic Team`;

                            newEmails.push({
                                id: crypto.randomUUID(),
                                sender: 'Red Mic Promotions',
                                subject: `Weekly Promotion Invoice: $${formatNumber(totalWeeklyPromoCost)}`,
                                body: invoiceBody,
                                date: newDate,
                                isRead: false,
                                senderIcon: 'default',
                            });
                        }
                    }
                }
                
                // --- TOUR LOGIC ---
                artistData.tours = artistData.tours.map(tour => {
                    if (tour.status === 'active') {
                        if (tour.currentVenueIndex < tour.venues.length) {
                            const venue = tour.venues[tour.currentVenueIndex];
                            
                            // Calculate sales
                            // Base demand based on popularity (0-100) and hype (0-1000)
                            // e.g. Pop 50, Hype 100 -> 40000 + 5000 = 45000 base interest
                            let baseDemand = (artistData.popularity * 800) + (artistData.hype * 50); 
                            
                            // Price sensitivity: Suggestion is around $25-$120. 
                            // If price is high, demand drops.
                            const priceSensitivity = 1.2 - (venue.ticketPrice / 200); // Simple linear drop
                            let demand = baseDemand * Math.max(0.1, priceSensitivity);
                            
                            // Random flux
                            demand = demand * (0.8 + Math.random() * 0.4);
                            
                            const ticketsSold = Math.floor(Math.min(venue.capacity, demand));
                            const revenue = ticketsSold * venue.ticketPrice;
                            
                            const updatedVenue = {
                                ...venue,
                                ticketsSold,
                                revenue,
                                soldOut: ticketsSold >= venue.capacity
                            };
                            
                            const newVenues = [...tour.venues];
                            newVenues[tour.currentVenueIndex] = updatedVenue;
                            
                            const nextIndex = tour.currentVenueIndex + 1;
                            const isFinished = nextIndex >= tour.venues.length;
                            
                            // Add income to artist
                            artistData.money += revenue;
                            
                            // Add hype for successful shows
                            if (updatedVenue.soldOut) {
                                artistData.hype = Math.min(1000, artistData.hype + 5);
                            }

                            // Notifications/Posts about the tour
                            if (artistProfileForEmail && updatedVenue.soldOut) {
                                 const postContent = `Sold out show in ${venue.city} tonight! Thank you all for coming out! ❤️ #TourLife`;
                                 artistData.xPosts.unshift({
                                    id: crypto.randomUUID(),
                                    authorId: artistProfileForEmail.id,
                                    content: postContent,
                                    likes: Math.floor(ticketsSold * 0.5),
                                    retweets: Math.floor(ticketsSold * 0.1),
                                    views: Math.floor(ticketsSold * 10),
                                    date: newDate
                                 });
                            }

                            return {
                                ...tour,
                                venues: newVenues,
                                currentVenueIndex: nextIndex,
                                ticketsSold: tour.ticketsSold + ticketsSold,
                                totalRevenue: tour.totalRevenue + revenue,
                                status: isFinished ? 'finished' : 'active'
                            };
                        } else {
                            // Should have been marked finished, but just in case
                            return { ...tour, status: 'finished' };
                        }
                    }
                    return tour;
                });

                // --- SOUNDTRACK OFFER LOGIC ---
                if (artistData.weeksUntilNextSoundtrackOffer === undefined) {
                    // Initialize for games started before this feature was added.
                    artistData.weeksUntilNextSoundtrackOffer = Math.floor(Math.random() * 13) + 12;
                }
                
                artistData.weeksUntilNextSoundtrackOffer -= 1;

                if (artistData.weeksUntilNextSoundtrackOffer <= 0) {
                    // Time for an offer, reset for next time.
                    artistData.weeksUntilNextSoundtrackOffer = Math.floor(Math.random() * 13) + 12;

                    if (artistData.soundtrackOfferCount < 3 && artistProfileForEmail) {
                        const allSoundtracks: Array<'F1 The Album' | 'Wicked' | 'Breaking Bad'> = ['F1 The Album', 'Wicked', 'Breaking Bad'];
                        const availableSoundtracks = allSoundtracks.filter(title => !artistData.offeredSoundtracks.includes(title));
                
                        if (availableSoundtracks.length > 0) {
                            const chosenSoundtrack = availableSoundtracks[Math.floor(Math.random() * availableSoundtracks.length)];
                            
                            const emailId = crypto.randomUUID();
                            newEmails.push({
                                id: emailId,
                                sender: 'Major Film Studio',
                                senderIcon: 'soundtrack',
                                subject: `Opportunity: Contribute to "${chosenSoundtrack}" Soundtrack`,
                                body: `Hi ${artistProfileForEmail.name},\n\nWe are currently curating the official soundtrack for the upcoming blockbuster "${chosenSoundtrack}" and would be honored to feature your music.\n\nThis is a major opportunity to reach a global audience. If you are interested in contributing 1-3 unreleased songs, please accept this offer.\n\nBest regards,\nMusic Supervisor`,
                                date: newDate,
                                isRead: false,
                                offer: {
                                    type: 'soundtrackOffer',
                                    albumTitle: chosenSoundtrack,
                                    isAccepted: false,
                                    emailId: emailId
                                }
                            });
                
                            artistData.soundtrackOfferCount += 1;
                            artistData.offeredSoundtracks.push(chosenSoundtrack);
                        }
                    }
                }

                // --- VOGUE OFFER LOGIC ---
                const totalWeeksElapsed = newDate.year * 52 + newDate.week;

                if (
                    artistProfileForEmail &&
                    totalWeeksElapsed > 10 &&
                    totalWeeksElapsed % 20 === 0 &&
                    artistData.lastVogueOfferYear !== newDate.year
                ) {
                    const magazines: Array<'Vogue' | 'Vogue Korea' | 'Vogue Italy'> = ['Vogue', 'Vogue Korea', 'Vogue Italy'];
                    const chosenMagazine = magazines[Math.floor(Math.random() * magazines.length)];
                    const emailId = crypto.randomUUID();

                    newEmails.push({
                        id: emailId,
                        sender: chosenMagazine,
                        senderIcon: 'vogue',
                        subject: `Invitation: Grace the Cover of ${chosenMagazine}`,
                        body: `Dear ${artistProfileForEmail.name},\n\nYour recent impact on the music and fashion worlds has not gone unnoticed. We at ${chosenMagazine} would be honored to feature you on our upcoming cover.\n\nThis opportunity includes a full photoshoot and an in-depth interview. Please let us know if you're interested in this prestigious feature.\n\nSincerely,\nThe Editors`,
                        date: newDate,
                        isRead: false,
                        offer: {
                            type: 'vogueOffer',
                            magazine: chosenMagazine,
                            isAccepted: false,
                            emailId: emailId,
                        }
                    });
                    artistData.lastVogueOfferYear = newDate.year;
                }

                // --- FEATURE OFFER LOGIC ---
                if (artistData.weeksUntilNextFeatureOffer === undefined) {
                    artistData.weeksUntilNextFeatureOffer = Math.floor(Math.random() * (8 - 2 + 1)) + 2; // 2-8 weeks
                }

                artistData.weeksUntilNextFeatureOffer -= 1;

                if (artistData.weeksUntilNextFeatureOffer <= 0 && artistProfileForEmail) {
                    // Reset counter
                    artistData.weeksUntilNextFeatureOffer = Math.floor(Math.random() * (8 - 2 + 1)) + 2;
                    
                    // Check conditions
                    if (artistData.popularity > 30 && Math.random() < 0.5) { // 50% chance if eligible
                        const emailId = crypto.randomUUID();
                        const payout = Math.floor(50000 + (artistData.popularity * 2000 * (Math.random() * 1.5 + 0.5)));
                        const songQuality = Math.floor(40 + (artistData.popularity / 2.5) + (Math.random() * 10));
                        
                        let promotion: FeatureOffer['promotion'] | undefined = undefined;
                        if (Math.random() < 0.2) { // 20% chance of promotion
                            promotion = {
                                name: "Payola Push", // Generic promo name
                                durationWeeks: Math.floor(Math.random() * 3) + 2 // 2-4 weeks
                            };
                        }

                        let npcArtistName;
                        do {
                            npcArtistName = NPC_ARTIST_NAMES[Math.floor(Math.random() * NPC_ARTIST_NAMES.length)];
                        } while (npcArtistName === artistProfileForEmail.name)
                        

                        const offer: FeatureOffer = {
                            type: 'featureOffer',
                            npcArtistName,
                            payout,
                            songQuality: Math.min(100, songQuality),
                            promotion,
                            isAccepted: false,
                            emailId,
                        };

                        newEmails.push({
                            id: emailId,
                            sender: npcArtistName,
                            senderIcon: 'feature',
                            subject: 'Feature Request',
                            body: `Hey ${artistProfileForEmail.name},\n\nBig fan of your work. I have a track that I think you'd sound perfect on.\n\nI can offer a payout of $${formatNumber(payout)} for your verse. The song quality is looking to be around ${Math.min(100, songQuality)}${promotion ? `, and we'll be running a ${promotion.name} for ${promotion.durationWeeks} weeks` : ''}.\n\nLet me know if you're interested.\n\nBest,\n${npcArtistName}`,
                            date: newDate,
                            isRead: false,
                            offer: offer
                        });
                    }
                }

                let newHype: number;
                const hypeMode = artistData.redMicPro.hypeMode || 'locked';

                if (artistData.redMicPro.unlocked && hypeMode === 'locked') {
                    newHype = 1000;
                } else {
                    newHype = Math.max(0, artistData.hype - 2);
                }

                let newPopularity = artistData.popularity;
                const lastRelease = [...artistData.releases].sort((a,b) => (b.releaseDate.year * 52 + b.releaseDate.week) - (a.releaseDate.year * 52 + a.releaseDate.week))[0];
                if (lastRelease) {
                    const weeksSinceLastRelease = (newDate.year * 52 + newDate.week) - (lastRelease.releaseDate.year * 52 + lastRelease.week);
                    if (weeksSinceLastRelease > 12) { // 3 months
                        newPopularity = Math.max(0, newPopularity - 0.25);
                    }
                } else if ( (newDate.year * 52 + newDate.week) > 12 ) { // If no releases at all after 12 weeks
                    newPopularity = Math.max(0, newPopularity - 0.25);
                }

                const popularityMultiplier = 1 + (newPopularity / 100);
                const hypeMultiplier = 1 + (newHype / 100);
                
                let leakedSongThisWeek: Song | null = null;
                // --- SONG LEAK LOGIC ---
                artistData.songs.forEach(song => {
                    // Update already leaked songs
                    if (song.leakInfo) {
                        const weeklyIllegalStreams = Math.floor((song.quality * newHype * (Math.random() * 20 + 10)));
                        song.leakInfo.illegalStreams += weeklyIllegalStreams;
                        song.leakInfo.illegalDownloads += Math.floor(weeklyIllegalStreams / (Math.random() * 10 + 5));
                    } 
                    // Check for new leaks
                    else if (!song.isReleased) {
                        let leakChance = newHype / 5000; // 2% chance at 100 hype, 20% at 1000 hype
                        if (artistData.securityTeamId) {
                            const team = SECURITY_TEAMS.find(s => s.id === artistData.securityTeamId);
                            if (team) {
                                leakChance *= team.leakProtection;
                            }
                        }
                        if (Math.random() < leakChance) {
                            const illegalStreams = Math.floor((song.quality * newHype * (Math.random() * 50 + 20)));
                            const illegalDownloads = Math.floor(illegalStreams / (Math.random() * 10 + 5));
                            song.leakInfo = { illegalStreams, illegalDownloads };
                            leakedSongThisWeek = song;

                            let sender = "Music Insider";
                            let senderIcon: Email['senderIcon'] = 'default';
                             if (artistData.contract) {
                                const label = LABELS.find(l => l.id === artistData.contract!.labelId) || allCustomLabels.find(l => l.id === artistData.contract!.labelId);
                                if(label) {
                                    sender = label.name;
                                    senderIcon = 'label';
                                }
                            }
                            
                            const emailId = crypto.randomUUID();
                            newEmails.push({
                                id: emailId,
                                sender: sender,
                                senderIcon: senderIcon,
                                subject: `URGENT: Your song "${song.title}" has leaked!`,
                                body: `Hi ${artistProfileForEmail?.name || 'Artist'},\n\nWe've detected an unauthorized leak of your unreleased song "${song.title}". The track is spreading online via illegal streams and downloads.\n\nThis will likely impact your official release plans. We recommend releasing the song officially as soon as possible to mitigate the damage.\n\n- ${sender}`,
                                date: newDate,
                                isRead: false,
                                offer: { type: 'leak', songId: song.id }
                            });
                        }
                    }
                });

                // --- X SUSPENSION & APPEAL LOGIC ---
                if (!artistData.xSuspensionStatus?.isSuspended) {
                    let suspensionChance = 0.005; // 0.5% random chance per week
                    let suspensionReason: XSuspensionStatus['reason'] = 'random';
                
                    if (artistData.fanWarStatus) {
                        suspensionChance += 0.15; // Add 15% chance if in a fan war
                        suspensionReason = 'fan_war_reports';
                    }
                
                    if (Math.random() < suspensionChance) {
                        artistData.xSuspensionStatus = { isSuspended: true, reason: suspensionReason };
                        artistData.hype = Math.max(0, artistData.hype - 50);
                        artistData.popularity = Math.max(0, artistData.popularity - 10);
                
                        const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                        if (artistProfile) {
                            const username = artistProfile.name.replace(/\s/g, '').toLowerCase();
                            artistData.xPosts.unshift({
                                id: crypto.randomUUID(), authorId: 'popbase',
                                content: `X has permanently suspended ${artistProfile.name}'s account (@${username}) for violations of the X Rules.`,
                                likes: Math.floor(Math.random() * 40000) + 15000, retweets: Math.floor(Math.random() * 9000) + 4000, views: Math.floor(Math.random() * 1200000) + 400000, date: newDate,
                            });
                            const fanAccount = artistData.xUsers.find(u => u.id.startsWith('addiction_fan'));
                            if (fanAccount) {
                                artistData.xPosts.unshift({
                                    id: crypto.randomUUID(), authorId: fanAccount.id,
                                    content: `NO WAY ${artistProfile.name} GOT SUSPENDED???? #Free${username}`,
                                    likes: Math.floor(Math.random() * 50000) + 20000, retweets: Math.floor(Math.random() * 15000) + 5000, views: Math.floor(Math.random() * 1000000) + 300000, date: newDate,
                                });
                            }
                            newEmails.push({
                                id: crypto.randomUUID(), sender: 'X Support', senderIcon: 'x', subject: 'Your account has been suspended',
                                body: `Hello,\n\nYour account, @${username}, has been suspended for violating the X Rules.\n\nAfter careful review, we determined your account broke the X Rules. Your account is permanently in read-only mode, which means you can’t post, Repost, or Like content. You won’t be able to create new accounts.\n\nIf you think we got this wrong, you can submit an appeal.\n\nThanks,\nX Support`,
                                date: newDate, isRead: false, offer: { type: 'xSuspension', isSuspended: true }
                            });
                        }
                    }
                } else if (artistData.xSuspensionStatus.isSuspended && artistData.xSuspensionStatus.appealSentDate) {
                    const weeksSinceAppeal = (newDate.year * 52 + newDate.week) - (artistData.xSuspensionStatus.appealSentDate.year * 52 + artistData.xSuspensionStatus.appealSentDate.week);
                    if (weeksSinceAppeal >= 1) {
                        const reason = artistData.xSuspensionStatus.reason;
                        const successChance = reason === 'random' ? 0.9 : 0.1;
                        const isSuccessful = Math.random() < successChance;
                        const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                
                        if (isSuccessful) {
                            artistData.xSuspensionStatus = null;
                            if (artistProfile) {
                                const username = artistProfile.name.replace(/\s/g, '').toLowerCase();
                                artistData.xPosts.unshift({
                                    id: crypto.randomUUID(), authorId: 'popbase',
                                    content: `X has reinstated ${artistProfile.name}'s account (@${username}) following an appeal.`,
                                    likes: Math.floor(Math.random() * 25000) + 10000, retweets: Math.floor(Math.random() * 5000) + 2000, views: Math.floor(Math.random() * 800000) + 300000, date: newDate,
                                });
                                newEmails.push({
                                    id: crypto.randomUUID(), sender: 'X Support', senderIcon: 'x', subject: 'Update on your appeal',
                                    body: `Hello,\n\nAfter a review of your appeal, we've determined that your account, @${username}, did not violate the X Rules. Your account has been reinstated and your suspension has been lifted.\n\nWe apologize for this error.\n\nThanks,\nX Support`,
                                    date: newDate, isRead: false, offer: { type: 'xAppealResult', isSuccessful: true }
                                });
                            }
                        } else {
                            artistData.xSuspensionStatus.appealSentDate = undefined;
                            if (artistProfile) {
                                newEmails.push({
                                    id: crypto.randomUUID(), sender: 'X Support', senderIcon: 'x', subject: 'Update on your appeal',
                                    body: `Hello,\n\nWe've reviewed the appeal for your account, @${artistProfile.name.replace(/\s/g, '').toLowerCase()}.\n\nOur review found that your account broke the X Rules. As a result, your account will remain suspended.\n\nThanks,\nX Support`,
                                    date: newDate, isRead: false, offer: { type: 'xAppealResult', isSuccessful: false }
                                });
                            }
                        }
                    }
                }


                let labelMultiplier = 1;
                if (artistData.contract) {
                    let label: { promotionMultiplier: number } | undefined;
                    if (artistData.contract.isCustom) {
                        label = allCustomLabels.find(l => l.id === artistData.contract!.labelId);
                    } else {
                        label = LABELS.find(l => l.id === artistData.contract!.labelId);
                    }
                    if (label) {
                        labelMultiplier = label.promotionMultiplier;
                    }
                }

                let totalWeeklyStreams = 0;
                const updatedSongs = artistData.songs.map(song => {
                    if (song.isReleased && !song.isTakenDown) {
                        const baseStreams = (song.quality ** 2) * 50;
                        let weeklyStreams = Math.floor(baseStreams * hypeMultiplier * labelMultiplier * popularityMultiplier * (Math.random() * 0.4 + 0.8)); 

                        // Christmas Genre Seasonal Logic
                        if (song.genre === 'Christmas') {
                            const week = newDate.week;
                            let christmasMultiplier = 1.0;

                            if (week >= 50) { // Peak: Weeks 50-52
                                christmasMultiplier = Math.random() * 5 + 15; // 15x to 20x
                            } else if (week >= 45) { // Huge gains: Weeks 45-49
                                christmasMultiplier = Math.random() * 5 + 8; // 8x to 13x
                            } else if (week >= 41) { // Momentum: Weeks 41-44
                                christmasMultiplier = Math.random() * 1.5 + 1.5; // 1.5x to 3x
                            } else { // Off-season: Before week 41
                                christmasMultiplier = Math.random() * 0.2 + 0.05; // 0.05x to 0.25x (significant reduction)
                            }
                            
                            weeklyStreams = Math.floor(weeklyStreams * christmasMultiplier);
                        }

                        if (song.pitchforkBoost) {
                            weeklyStreams = Math.floor(weeklyStreams * (Math.random() * 2 + 2));
                        }
                        
                        let newPlaylistBoostWeeks = song.playlistBoostWeeks;
                        if (typeof song.playlistBoostWeeks === 'number' && song.playlistBoostWeeks > 0) {
                            weeklyStreams = Math.floor(weeklyStreams * PLAYLIST_BOOST_MULTIPLIER);
                            newPlaylistBoostWeeks = song.playlistBoostWeeks - 1;
                        }

                        const songPromo = artistData.promotions.find(p => p.itemId === song.id && p.itemType === 'song');
                        if (songPromo) {
                            weeklyStreams = Math.floor(weeklyStreams * songPromo.boostMultiplier);
                        }
                        
                        // Generate daily streams for the week
                        const daily = new Array(7).fill(0);
                        if (weeklyStreams > 0) {
                            const weights = Array(7).fill(0).map(() => Math.random());
                            const totalWeight = weights.reduce((s, w) => s + w, 0);
                            if (totalWeight > 0) {
                                const dailyStreamsUnadjusted = weights.map(w => Math.floor((w / totalWeight) * weeklyStreams));
                                const sum = dailyStreamsUnadjusted.reduce((s, d) => s + d, 0);
                                dailyStreamsUnadjusted[6] += weeklyStreams - sum; // Adjust last day to match total
                                for(let i=0; i<7; i++) daily[i] = dailyStreamsUnadjusted[i];
                            } else {
                                daily[0] = weeklyStreams;
                            }
                        }
                        const newDailyStreams = [...(song.dailyStreams || []), ...daily];

                        totalWeeklyStreams += weeklyStreams;
                        
                        const release = artistData.releases.find(r => r.id === song.releaseId);
                        let firstWeekStreamsData = {};
                        if (release && (newDate.year * 52 + newDate.week) - (release.releaseDate.year * 52 + release.releaseDate.week) === 1) {
                            firstWeekStreamsData = { firstWeekStreams: weeklyStreams };
                        }

                        return { 
                            ...song, 
                            streams: (song.streams || 0) + weeklyStreams,
                            prevWeekStreams: song.lastWeekStreams || 0,
                            lastWeekStreams: weeklyStreams,
                            ...firstWeekStreamsData,
                            playlistBoostWeeks: newPlaylistBoostWeeks,
                            dailyStreams: newDailyStreams,
                        };
                    }
                    
                    if (song.isTakenDown) {
                        return {
                            ...song,
                            prevWeekStreams: song.lastWeekStreams || 0,
                            lastWeekStreams: 0,
                        };
                    }
                    return song;
                });

                artistData.songs = updatedSongs;
                
                artistData.releases = artistData.releases.map(release => {
                    if ((newDate.year * 52 + newDate.week) - (release.releaseDate.year * 52 + release.releaseDate.week) === 1) {
                        const firstWeekProjectStreams = release.songIds.reduce((sum, songId) => {
                            const song = updatedSongs.find(s => s.id === songId);
                            return sum + (song?.firstWeekStreams || 0);
                        }, 0);
                        return { ...release, firstWeekStreams: firstWeekProjectStreams };
                    }
                    return release;
                });

                const updatedLastFourWeeksStreams = [totalWeeklyStreams, ...artistData.lastFourWeeksStreams].slice(0, 4);
                const totalStreamsLastMonth = updatedLastFourWeeksStreams.reduce((sum, streams) => sum + streams, 0);
                artistData.monthlyListeners = Math.floor(totalStreamsLastMonth * 0.1);
                
                artistData.listeningNow = Math.floor(artistData.monthlyListeners * (Math.random() * 0.001));
                artistData.saves = Math.floor((artistData.saves || 0) + (totalWeeklyStreams / 1000) * (Math.random() * 0.5 + 0.5));
                const newFollowers = Math.floor(totalWeeklyStreams / 50000);
                artistData.followers = (artistData.followers || 0) + newFollowers;

                const updatedStreamsHistory = [...(artistData.streamsHistory || []), { date: newDate, streams: totalWeeklyStreams }];
                if (updatedStreamsHistory.length > 52) {
                    updatedStreamsHistory.shift();
                }
                artistData.streamsHistory = updatedStreamsHistory;


                let totalWeeklyViews = 0;
                const updatedVideos = artistData.videos.map(video => {
                    const song = updatedSongs.find(s => s.id === video.songId);
                    if (!song) return video;

                    const videoPromo = artistData.promotions.find(p => p.itemId === video.id && p.itemType === 'video');
                    let weeklyViews;

                    if (videoPromo && videoPromo.boostMultiplier === -1) { // Synergy Campaign
                        weeklyViews = song.lastWeekStreams;
                    } else {
                        let videoTypeMultiplier = 1;
                        switch(video.type) {
                            case 'Music Video': videoTypeMultiplier = 2; break;
                            case 'Lyric Video': videoTypeMultiplier = 1; break;
                            case 'Visualizer': videoTypeMultiplier = 0.5; break;
                            case 'Genius Verified': videoTypeMultiplier = 1.2; break;
                            case 'Live Performance': videoTypeMultiplier = 2.5; break;
                            case 'Interview': videoTypeMultiplier = 1.5; break;
                        }
                        weeklyViews = Math.floor((song.quality ** 2) * 10 * videoTypeMultiplier * hypeMultiplier * popularityMultiplier * (Math.random() * 0.4 + 0.8)); 
                    }

                    if (song.pitchforkBoost) {
                        weeklyViews = Math.floor(weeklyViews * (Math.random() * 2 + 2));
                    }
                    
                    if (videoPromo && videoPromo.boostMultiplier !== -1) {
                        weeklyViews = Math.floor(weeklyViews * videoPromo.boostMultiplier);
                    }

                    let firstWeekViewsData = {};
                    if ((newDate.year * 52 + newDate.week) - (video.releaseDate.year * 52 + video.releaseDate.week) === 1) {
                        firstWeekViewsData = { firstWeekViews: weeklyViews };
                    }

                    totalWeeklyViews += weeklyViews;
                    return { ...video, views: video.views + weeklyViews, ...firstWeekViewsData };
                });
                artistData.videos = updatedVideos;

                const updatedLastFourWeeksViews = [totalWeeklyViews, ...artistData.lastFourWeeksViews].slice(0, 4);

                const newSubscribersGained = Math.floor(totalWeeklyViews / (350 - Math.min(300, artistData.youtubeSubscribers / 4000)));
                const newYoutubeSubscribers = artistData.youtubeSubscribers + newSubscribersGained;

                const streamIncome = totalWeeklyStreams * STREAM_INCOME_MULTIPLIER;
                const viewIncome = totalWeeklyViews * VIEW_INCOME_MULTIPLIER;
                
                let merchIncome = 0;
                if (artistData.youtubeStoreUnlocked) {
                    artistData.merch.forEach(item => {
                        let weeklySales = Math.floor((artistData.youtubeSubscribers / 50000) * popularityMultiplier * (Math.random() * 5 + 1));
                        if (artistData.redMicPro.unlocked && artistData.salesBoost > 0) {
                            weeklySales = Math.floor(weeklySales * (1 + artistData.salesBoost / 100));
                        }
                        merchIncome += weeklySales * item.price;
                    });
                }
                
                // --- ONLYFANS INCOME ---
                let onlyfansIncome = 0;
                const ofProfile = artistData.onlyfans;
                if (ofProfile) {
                    const ONLYFANS_CUT = 0.2;
                    // 1. Calculate new subscribers
                    const subPrice = ofProfile.subscriptionPrice > 0 ? ofProfile.subscriptionPrice : 4.99;
                    const subscriberPotential = (artistData.hype / (subPrice * 0.5)) * (Math.random() * 20 + 10);
                    const newSubscribers = Math.floor(subscriberPotential);
                    ofProfile.subscribers += newSubscribers;

                    // 2. Calculate engagement and income from existing posts
                    let tipsIncome = 0;
                    ofProfile.posts = ofProfile.posts.map(post => {
                        const newLikes = Math.floor(ofProfile.subscribers * (artistData.hype / 2000) * (Math.random() * 0.05 + 0.01));
                        const newComments = Math.floor(newLikes / (Math.random() * 30 + 15));
                        const newTips = newLikes * (Math.random() * 0.02); // average tip per like
                        
                        tipsIncome += newTips;

                        return {
                            ...post,
                            likes: post.likes + newLikes,
                            comments: post.comments + newComments,
                            tips: post.tips + newTips,
                        };
                    });
                    
                    // 3. Calculate income from new subscribers buying old posts
                    let postPurchaseIncome = 0;
                    const pricedPosts = ofProfile.posts.filter(p => p.price > 0);
                    if (newSubscribers > 0 && pricedPosts.length > 0) {
                        for (let i = 0; i < newSubscribers; i++) {
                            // Assume each new sub has a 25% chance to buy a random priced post
                            if (Math.random() < 0.25) {
                                postPurchaseIncome += pricedPosts[Math.floor(Math.random() * pricedPosts.length)].price;
                            }
                        }
                    }

                    // 4. Calculate total income
                    const subscriptionIncome = ofProfile.subscribers * ofProfile.subscriptionPrice;
                    const weeklyGross = subscriptionIncome + tipsIncome + postPurchaseIncome;
                    const weeklyNet = weeklyGross * (1 - ONLYFANS_CUT);

                    ofProfile.totalGross += weeklyGross;
                    ofProfile.totalNet += weeklyNet;
                    onlyfansIncome = weeklyNet;

                    const yearMonth = `${newDate.year}-${String(Math.floor(newDate.week/4)).padStart(2, '0')}`;
                    if(!ofProfile.earningsByMonth[yearMonth]) {
                        ofProfile.earningsByMonth[yearMonth] = { gross: 0, net: 0 };
                    }
                    ofProfile.earningsByMonth[yearMonth].gross += weeklyGross;
                    ofProfile.earningsByMonth[yearMonth].net += weeklyNet;
                    
                    // 5. Generate new content requests
                    if (ofProfile.subscribers > 50 && Math.random() < 0.15) { // 15% chance per week
                        const emailId = crypto.randomUUID();
                        const payout = Math.floor(Math.random() * 4501) + 500;
                        const requestType = Math.random() > 0.5 ? 'image' : 'video';
                        const senderUsername = `user${Math.floor(Math.random() * 90000) + 10000}`;
                        newEmails.push({
                            id: emailId,
                            sender: 'OnlyFans',
                            senderIcon: 'onlyfans',
                            subject: 'New Content Request from a Subscriber',
                            body: `Hi ${artistProfileForEmail?.name},\n\nA subscriber (@${senderUsername}) has sent a request for custom content.\n\nRequest Type: ${requestType}\nPayout: $${payout.toLocaleString()}\n\nAccepting this will instantly transfer the funds to your account. The content is assumed to be sent privately.\n\n- The OnlyFans Team`,
                            date: newDate,
                            isRead: false,
                            offer: {
                                type: 'onlyfansRequest',
                                requestType,
                                payout,
                                isFulfilled: false,
                                emailId,
                                senderUsername,
                            }
                        });
                    }
                }
                
                const totalIncome = streamIncome + viewIncome + merchIncome + onlyfansIncome;

                const newStreamsThisMonth = artistData.streamsThisMonth + totalWeeklyStreams;
                const newViewsThisQuarter = artistData.viewsThisQuarter + totalWeeklyViews;
                const newSubsThisQuarter = artistData.subsThisQuarter + newSubscribersGained;
                
                // Stream removal logic (every 4 weeks)
                if (newDate.week % 4 === 0 && artistData.promotions.length > 0) {
                    let totalRemovedStreams = 0;
                    const newSongs = [...artistData.songs];
                    
                    const songPromotions = artistData.promotions.filter(p => p.itemType === 'song');

                    for (const promo of songPromotions) {
                        const songIndex = newSongs.findIndex(s => s.id === promo.itemId);
                        if (songIndex !== -1) {
                            const song = newSongs[songIndex];

                            if (song.isReleased && song.streams > 1000) {
                                const getRemovalPercentage = (boost: number): number => {
                                    if (boost >= 30) return 0.80; // 80%
                                    if (boost >= 10) return 0.25 + Math.random() * 0.15; // 25-40%
                                    if (boost >= 4) return 0.10 + Math.random() * 0.10; // 10-20%
                                    if (boost >= 2.5) return 0.05 + Math.random() * 0.05; // 5-10%
                                    if (boost >= 1.5) return 0.01 + Math.random() * 0.04; // 1-5%
                                    return 0.001 + Math.random() * 0.01; // fallback
                                };
                                
                                const removalPercentage = getRemovalPercentage(promo.boostMultiplier);
                                const streamsToRemove = Math.floor(song.streams * removalPercentage);

                                if (streamsToRemove > 0) {
                                    totalRemovedStreams += streamsToRemove;
                                    newSongs[songIndex] = {
                                        ...song,
                                        streams: song.streams - streamsToRemove,
                                        lastWeekStreams: (song.lastWeekStreams || 0) - streamsToRemove,
                                        removedStreams: (song.removedStreams || 0) + streamsToRemove
                                    };
                                }
                            }
                        }
                    }
                    artistData.songs = newSongs;

                    if (totalRemovedStreams > 0) {
                        if(artistProfileForEmail){
                            newEmails.push({
                                id: crypto.randomUUID(),
                                sender: 'Spotify',
                                subject: 'Adjustment to your stream counts',
                                body: `Hi ${artistProfileForEmail.name},\n\nWe're writing to let you know that we've made an adjustment to your stream counts. After a routine review, we identified and removed approximately ${formatNumber(totalRemovedStreams)} artificial streams from songs in your active promotional campaigns.\n\nThis is a standard process to ensure that our data is accurate and reflects genuine listener activity. For more information on artificial streams, please visit Spotify for Artists.\n\nThanks,\nThe Spotify Team`,
                                date: newDate,
                                isRead: false,
                                senderIcon: 'spotify',
                            });
                            artistData.streamsRemovedThisWeek = totalRemovedStreams;
                        }
                    }
                }

                const artistProfile = state.soloArtist || state.group?.members.find(m => m.id === artistId) || state.group;

                if (newDate.week % 4 === 0 && newStreamsThisMonth > 0 && artistProfile) {
                    newEmails.push({
                        id: crypto.randomUUID(), sender: 'Spotify', subject: 'Your Spotify Recap',
                        body: `Congratulations ${artistProfile.name},\n\nHere's your performance recap for the last month. Your tracks generated a total of ${newStreamsThisMonth.toLocaleString()} new streams!\n\nKeep up the great work.\n- The Spotify Team`,
                        date: newDate, isRead: false, senderIcon: 'spotify'
                    });
                }

                if (newDate.week > 1 && newDate.week % 13 === 0 && (newViewsThisQuarter > 0 || newSubsThisQuarter > 0) && artistProfile) {
                    newEmails.push({
                        id: crypto.randomUUID(), sender: 'YouTube', subject: 'Your Quarterly Channel Recap',
                        body: `Dear ${artistProfile.name},\n\nLet's check out your channel's growth over the last 3 months. You've gained ${newSubsThisQuarter.toLocaleString()} subscribers and your videos received ${newViewsThisQuarter.toLocaleString()} views.\n\nKeep creating!\n- The YouTube Team`,
                        date: newDate, isRead: false, senderIcon: 'youtube'
                    });
                }
                
                // --- CONTRACT & LABEL LOGIC ---
                if (artistData.contract) {
                    const contract = artistData.contract;
                    const label = LABELS.find(l => l.id === contract.labelId);
                    const weeksPassed = (newDate.year * 52 + newDate.week) - (contract.startDate.year * 52 + contract.startDate.week);

                    if (contract.durationWeeks && weeksPassed >= contract.durationWeeks) {
                        if (artistId === state.activeArtistId) {
                            contractRenewalForActivePlayer = {
                                labelId: contract.labelId,
                                isCustom: contract.isCustom,
                                artistId: artistId,
                            };
                        } else {
                            artistData.contractHistory.push(contract);
                            artistData.contract = null;
                            if (label && artistProfile) {
                                newEmails.push({
                                    id: crypto.randomUUID(), sender: label.name, subject: 'Contract Expired',
                                    body: `Dear ${artistProfile.name},\n\nYour contract with ${label.name} has officially ended. You are now an independent artist.\n\nSincerely,\n${label.name}`,
                                    date: newDate, isRead: false, senderIcon: 'label'
                                });
                            }
                        }
                    }

                    // Process pending submissions for approval/rejection
                    artistData.labelSubmissions = artistData.labelSubmissions.map(sub => {
                        if (sub.status === 'pending' && label) {
                            const weeksSinceSubmission = (newDate.year * 52 + newDate.week) - (sub.submittedDate.year * 52 + sub.submittedDate.week);
                            if (weeksSinceSubmission >= 2) {
                                const avgQuality = sub.release.songIds.reduce((sum, id) => sum + (artistData.songs.find(s => s.id === id)?.quality || 0), 0) / sub.release.songIds.length;
                                
                                let minQuality = label.minQuality ?? 0;
                                let feedback = `The average quality of ${avgQuality.toFixed(0)} didn't meet our standard of ${minQuality}. Back to the drawing board.`;

                                if (label.contractType === 'petty' && avgQuality < 70) {
                                    minQuality = 70; // Hard override for petty labels
                                    feedback = `The average quality of ${avgQuality.toFixed(0)} is unacceptable. We require a minimum quality of 70 for all releases. Do better.`;
                                }

                                if (avgQuality >= minQuality) {
                                    newEmails.push({
                                        id: crypto.randomUUID(), sender: label.name, subject: `Submission Approved: "${sub.release.title}"`,
                                        body: `Great news!\n\nWe've approved your submission for "${sub.release.title}". Please head to the 'Labels' tab to select your pre-release singles and set a release date for the project. Get ready!\n\n- ${label.name}`,
                                        date: newDate, isRead: false, senderIcon: 'label'
                                    });
                                    return { ...sub, status: 'awaiting_player_input', decisionDate: newDate };
                                } else {
                                    newEmails.push({
                                        id: crypto.randomUUID(), sender: label.name, subject: `Submission Update: "${sub.release.title}"`,
                                        body: `Hi ${artistProfile?.name},\n\nAfter careful consideration, we've decided to pass on releasing "${sub.release.title}" at this time. ${feedback}\n\n- ${label.name}`,
                                        date: newDate, isRead: false, senderIcon: 'label'
                                    });
                                    return { ...sub, status: 'rejected', decisionDate: newDate, feedback };
                                }
                            }
                        }
                        return sub;
                    });

                    // Process scheduled releases
                    const scheduledSubmissions = [...artistData.labelSubmissions.filter(s => s.status === 'scheduled')];
                    let submissionsToRemove: string[] = [];
                    let submissionsToUpdate: LabelSubmission[] = [];

                    const contractLabel = LABELS.find(l => l.id === artistData.contract!.labelId) || artistData.customLabels.find(l => l.id === artistData.contract!.labelId);
                    let releasingLabelInfo: Release['releasingLabel'] = null;
                    if (contractLabel) {
                        releasingLabelInfo = { name: contractLabel.name };
                        if ('dealWithMajorId' in contractLabel && contractLabel.dealWithMajorId) {
                            const major = LABELS.find(l => l.id === contractLabel.dealWithMajorId);
                            if (major) {
                                releasingLabelInfo.dealWithMajor = major.name;
                            }
                        }
                    }

                    scheduledSubmissions.forEach(sub => {
                        let subModified = false;
                        // Check for single releases
                        const singlesReadyToRelease = sub.singlesToRelease?.filter(single =>
                            single.releaseDate.week === newDate.week && single.releaseDate.year === newDate.year
                        ) || [];

                        if (singlesReadyToRelease.length > 0) {
                            singlesReadyToRelease.forEach(single => {
                                const songToRelease = artistData.songs.find(s => s.id === single.songId);
                                if (songToRelease) {
                                    const singleRelease: Release = {
                                        id: crypto.randomUUID(),
                                        title: songToRelease.title,
                                        type: 'Single',
                                        coverArt: sub.release.coverArt, // Use album cover for pre-release single
                                        songIds: [songToRelease.id],
                                        releaseDate: newDate,
                                        artistId: songToRelease.artistId,
                                        releasingLabel: releasingLabelInfo,
                                    };
                                    artistData.releases.push(singleRelease);
                                    artistData.songs = artistData.songs.map(s => s.id === single.songId ? { ...s, isReleased: true, releaseId: singleRelease.id, isPreReleaseSingle: true, coverArt: sub.release.coverArt } : s);
                                    artistData.hype = Math.min(100, artistData.hype + 15);

                                    // Genius offer for single
                                    if (artistProfile) {
                                        const emailId = crypto.randomUUID();
                                        newEmails.push({
                                            id: emailId,
                                            sender: 'Genius',
                                            subject: `Verified Interview for "${songToRelease.title}"?`,
                                            body: `Hey ${artistProfile.name},\n\nWe're big fans of your new single "${songToRelease.title}" over at Genius. We'd love to have you for our 'Verified' series to break down the lyrics and meaning behind the track.\n\nLet us know if you're interested.\n\nBest,\nThe Genius Team`,
                                            date: newDate,
                                            isRead: false,
                                            senderIcon: 'genius',
                                            offer: {
                                                type: 'geniusInterview',
                                                songId: songToRelease.id,
                                                isAccepted: false,
                                                emailId: emailId,
                                            }
                                        });
                                    }
                                }
                            });

                            const releasedSingleIds = new Set(singlesReadyToRelease.map(s => s.songId));
                            sub.singlesToRelease = sub.singlesToRelease?.filter(s => !releasedSingleIds.has(s.songId));
                            subModified = true;
                        }

                        // Check for main project release
                        if (sub.projectReleaseDate && sub.projectReleaseDate.week === newDate.week && sub.projectReleaseDate.year === newDate.year) {
                            const release = sub.release;
                            artistData.releases.push({ ...release, releaseDate: newDate, releasingLabel: releasingLabelInfo });

                            artistData.songs = artistData.songs.map(s => {
                                if (release.songIds.includes(s.id)) {
                                    return { ...s, isReleased: true, releaseId: release.id };
                                }
                                return s;
                            });

                            let hypeIncrease = 0;
                            switch (release.type) {
                                case 'EP': hypeIncrease = 25; break;
                                case 'Album': hypeIncrease = 40; break;
                            }
                            artistData.hype = Math.min(100, artistData.hype + hypeIncrease);

                            if (artistData.contract && (release.type === 'Album' || release.type === 'EP')) {
                                artistData.contract.albumsReleased += 1;
                            }

                             // Fallon offer for EP/Album
                            if (artistProfile && (release.type === 'EP' || release.type === 'Album')) {
                                const emailId = crypto.randomUUID();
                                const offerTypes: Array<'performance' | 'interview' | 'both'> = ['performance', 'interview', 'both'];
                                const selectedOfferType = offerTypes[Math.floor(Math.random() * offerTypes.length)];
                                
                                let subject = '';
                                let body = '';
                                switch (selectedOfferType) {
                                    case 'performance':
                                        subject = `Performance on The Tonight Show Starring Jimmy Fallon?`;
                                        body = `Hey ${artistProfile.name},\n\nHuge fans of the new ${release.type.toLowerCase()} "${release.title}"! We'd be thrilled to have you on the show to perform a song from it.\n\nLet us know if you're interested.\n\nBest,\nThe Tonight Show Team`;
                                        break;
                                    case 'interview':
                                        subject = `Interview on The Tonight Show Starring Jimmy Fallon?`;
                                        body = `Hey ${artistProfile.name},\n\nThe new ${release.type.toLowerCase()} "${release.title}" is all anyone's talking about! Jimmy would love to have you on the show for an interview to discuss the project.\n\nLet us know if you're interested.\n\nBest,\nThe Tonight Show Team`;
                                        break;
                                    case 'both':
                                        subject = `Appearance on The Tonight Show Starring Jimmy Fallon?`;
                                        body = `Hey ${artistProfile.name},\n\nCongratulations on the new ${release.type.toLowerCase()} "${release.title}"! The whole office has it on repeat. Jimmy would love to have you on the show for an interview AND a performance.\n\nLet us know if you're interested.\n\nBest,\nThe Tonight Show Team`;
                                        break;
                                }

                                newEmails.push({
                                    id: emailId,
                                    sender: 'The Tonight Show',
                                    subject,
                                    body,
                                    date: newDate,
                                    isRead: false,
                                    senderIcon: 'fallon',
                                    offer: {
                                        type: 'fallonOffer',
                                        releaseId: release.id,
                                        offerType: selectedOfferType,
                                        isAccepted: false,
                                        emailId: emailId,
                                    }
                                });
                            }

                            submissionsToRemove.push(sub.id);
                            subModified = false;
                        }

                        if (subModified) {
                            submissionsToUpdate.push(JSON.parse(JSON.stringify(sub)));
                        }
                    });

                    if (submissionsToUpdate.length > 0) {
                        artistData.labelSubmissions = artistData.labelSubmissions.map(sub =>
                            submissionsToUpdate.find(updated => updated.id === sub.id) || sub
                        );
                    }
                    if (submissionsToRemove.length > 0) {
                        artistData.labelSubmissions = artistData.labelSubmissions.filter(sub => !submissionsToRemove.includes(sub.id));
                    }
                }

                // --- POP BASE INTERVIEW/CLARIFICATION LOGIC ---
                if (Math.random() < 0.3) { // 30% chance for a PopBase email
                    const emailId = crypto.randomUUID();
                    let popBaseEmail: Email;

                    const controversialPaparazzi = artistData.paparazziPhotos.find(p => p.category === 'Scandal');
                    const recentLowScoreRelease = artistData.releases
                        .find(r => r.review && r.review.score < 5 && (newDate.year * 52 + newDate.week) - (r.releaseDate.year * 52 + r.releaseDate.week) <= 4);

                    if (controversialPaparazzi && Math.random() < 0.5) { // 50% chance to be about scandal
                        // Clarification email
                        popBaseEmail = {
                            id: emailId,
                            sender: 'Pop Base',
                            senderIcon: 'popbase',
                            subject: `Clarification needed regarding recent photos`,
                            body: `Hi ${artistProfileForEmail?.name},\n\nWe're reaching out about some recent photos that have been circulating. We'd like to give you an opportunity to address the situation directly.\n\nCould you clarify what was happening in these photos?\n\nBest,\nPop Base Team`,
                            date: newDate,
                            isRead: false,
                            offer: {
                                type: 'popBaseClarification',
                                emailId: emailId,
                                isAnswered: false,
                                originalPostContent: 'recent photos',
                                isControversial: true,
                            }
                        };
                        newEmails.push(popBaseEmail);
                        // Remove photo so it's not asked about again
                        artistData.paparazziPhotos = artistData.paparazziPhotos.filter(p => p.id !== controversialPaparazzi.id);
                    } else if (recentLowScoreRelease && Math.random() < 0.5) {
                        popBaseEmail = {
                            id: emailId,
                            sender: 'Pop Base',
                            senderIcon: 'popbase',
                            subject: `Regarding the reviews for "${recentLowScoreRelease.title}"`,
                            body: `Hi ${artistProfileForEmail?.name},\n\nThe reviews for your latest project "${recentLowScoreRelease.title}" have been quite divisive. We'd like to get your thoughts on the reception.\n\nHow do you feel about the critical response to your new music?\n\nBest,\nPop Base Team`,
                            date: newDate,
                            isRead: false,
                            offer: {
                                type: 'popBaseClarification',
                                emailId: emailId,
                                isAnswered: false,
                                originalPostContent: `the reviews for ${recentLowScoreRelease.title}`,
                                isControversial: true,
                            }
                        };
                        newEmails.push(popBaseEmail);
                    } else {
                        // General interview question
                        const questions = [ `What was the inspiration behind your latest project?`, `Fans are dying to know, are you planning a tour soon?`, `What's your songwriting process like?`, `Are there any artists you're hoping to collaborate with in the future?`, `Your style has evolved so much. What can we expect from your next era?` ];
                        const pickRandom = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
                        const question = pickRandom(questions);

                        popBaseEmail = { id: emailId, sender: 'Pop Base', senderIcon: 'popbase', subject: `Quick Question for Pop Base`, body: `Hi ${artistProfileForEmail?.name},\n\nHope you're doing well! We have a quick question for a piece we're running:\n\n${question}\n\nThanks!\nPop Base Team`, date: newDate, isRead: false, offer: { type: 'popBaseInterview', emailId: emailId, isAnswered: false, question: question, } };
                        newEmails.push(popBaseEmail);
                    }
                }

                // --- GRAMMY SUBMISSION OFFER LOGIC ---
                // This logic sends the yearly email inviting the player to submit for the GRAMMYs.
                // It checks if an email for the current year has already been sent to avoid duplicates.
                const hasGrammyEmailThisYear = artistData.inbox.some(e => 
                    e.offer?.type === 'grammySubmission' && e.date.year === newDate.year
                );

                if (newDate.week === 40 && artistProfileForEmail && !hasGrammyEmailThisYear) {
                    const emailId = crypto.randomUUID();
                    newEmails.push({
                        id: emailId,
                        sender: 'Recording Academy',
                        senderIcon: 'grammys',
                        subject: `Submit Your Music for the ${newDate.year + 1} GRAMMY Awards`,
                        body: `Hi ${artistProfileForEmail.name},\n\nThe submission window for the ${newDate.year + 1} GRAMMY Awards is now open. Please submit your eligible releases from this year for consideration.\n\nSubmissions close in a few weeks.\n\n- The Recording Academy`,
                        date: newDate,
                        isRead: false,
                        offer: {
                            type: 'grammySubmission',
                            emailId: emailId,
                            isSubmitted: false
                        }
                    });
                }
                
                if (artistData.fanWarStatus) {
                    artistData.fanWarStatus.weeksRemaining -= 1;
                    if (artistData.fanWarStatus.weeksRemaining <= 0) {
                        artistData.fanWarStatus = null;
                    }
                }

                // --- CERTIFICATION POSTS ---
                if (artistProfile) {
                    const newCertificationPosts: XPost[] = [];
            
                    // Song Certifications
                    artistData.songs = artistData.songs.map(song => {
                        if (!song.isReleased) return song;
            
                        const currentCert = getSongCertification(song.streams);
                        const currentCertString = formatCertification(currentCert);
            
                        if (currentCertString && currentCertString !== song.lastCertification) {
                            const country = Math.random() > 0.5 ? 'UK' : 'US';
                            const postContent = `${artistProfile.name}'s "${song.title}" is now certified ${currentCertString} in the ${country}.`;
                            
                            newCertificationPosts.push({
                                id: crypto.randomUUID(),
                                authorId: 'chartdata',
                                content: postContent,
                                image: song.coverArt,
                                likes: Math.floor(Math.random() * 20000) + 8000,
                                retweets: Math.floor(Math.random() * 5000) + 2000,
                                views: Math.floor(Math.random() * 300000) + 100000,
                                date: newDate,
                            });
            
                            return { ...song, lastCertification: currentCertString };
                        }
                        return song;
                    });
            
                    // Album Certifications
                    artistData.releases = artistData.releases.map(release => {
                        if (release.type === 'Single') return release;
            
                        const totalStreams = release.songIds.reduce((sum, songId) => {
                            const song = artistData.songs.find(s => s.id === songId);
                            return sum + (song?.streams || 0);
                        }, 0);
                        const units = Math.floor(totalStreams / 1500);
            
                        const currentCert = getAlbumCertification(units);
                        const currentCertString = formatCertification(currentCert);
            
                        if (currentCertString && currentCertString !== release.lastCertification) {
                            const country = Math.random() > 0.5 ? 'UK' : 'US';
                            const postContent = `${artistProfile.name}'s '${release.title}' is now certified ${currentCertString} in the ${country}.`;
            
                            newCertificationPosts.push({
                                id: crypto.randomUUID(),
                                authorId: 'chartdata',
                                content: postContent,
                                image: release.coverArt,
                                likes: Math.floor(Math.random() * 30000) + 12000,
                                retweets: Math.floor(Math.random() * 7000) + 3000,
                                views: Math.floor(Math.random() * 450000) + 150000,
                                date: newDate,
                            });
            
                            return { ...release, lastCertification: currentCertString };
                        }
                        return release;
                    });
            
                    if (newCertificationPosts.length > 0) {
                        artistData.xPosts.unshift(...newCertificationPosts);
                    }
                }

                if (artistProfile) {
                    const playerChartSongs = artistData.songs.map(s => {
                        const chartInfo = state.billboardHot100.find(entry => entry.songId === s.id);
                        return { ...s, chartRank: chartInfo?.rank };
                    });

                    const { newPosts, newUsers, newTrends } = generateWeeklyXContent(artistData, { ...state, date: newDate }, artistProfile.name, playerChartSongs, leakedSongThisWeek);

                    const existingUsernames = new Set(artistData.xUsers.map(u => u.username));
                    const uniqueNewUsers = newUsers.filter(u => !existingUsernames.has(u.username));

                    artistData.xUsers.push(...uniqueNewUsers);
                    artistData.xPosts.unshift(...newPosts);
                    artistData.xTrends = newTrends;

                    // Cap the number of posts to prevent performance degradation over time
                    if (artistData.xPosts.length > 250) {
                        artistData.xPosts = artistData.xPosts.slice(0, 250);
                    }
                }
                
                // --- YEAR-END ALBUM CHART TWEET LOGIC ---
                if (newDate.week === 50) {
                    // 1. Gather User Albums from this year
                    const userAlbums = artistData.releases.filter(r => 
                        (r.type === 'Album' || r.type === 'Album (Deluxe)' || r.type === 'EP') &&
                        r.releaseDate.year === newDate.year
                    ).map(album => {
                        // Calculate total streams for the album
                        const streams = album.songIds.reduce((sum, songId) => {
                            const song = artistData.songs.find(s => s.id === songId);
                            return sum + (song?.streams || 0);
                        }, 0);
                        // Simple formula for units: streams / 1500.
                        const units = Math.floor(streams / 1500); 
                        return {
                            title: album.title,
                            artist: artistProfile?.name || 'Unknown',
                            coverArt: album.coverArt,
                            units: units
                        };
                    });

                    // 2. Gather NPC Albums from this year
                    const npcAlbumsThisYear = newNpcAlbums.filter(a => {
                        // newNpcAlbums are added to the top, so we just filter by generated "age" implicitly or we need releaseDate on NPC albums. 
                        // Since we don't store releaseDate on NPC albums explicitly in the type yet, we'll approximate by using the current list 
                        // and assuming ones generated this session belong to "this year". 
                        // A better way: In generateNpcAlbums, we could tag them, but for now let's use a heuristic based on index or assume all current `newNpcAlbums` are recent.
                        return true; // Simplified: Consider all active NPC albums as contenders
                    }).map(album => {
                        // Simulate units for NPC albums. 
                        // We don't track release date perfectly for old ones, but let's assume a random "release week" for simulation.
                        const randomReleaseWeek = Math.floor(Math.random() * 48) + 1;
                        const weeksActive = Math.max(1, 50 - randomReleaseWeek);
                        // Units = salesPotential * weeksActive * variance
                        const variance = 0.8 + Math.random() * 0.4;
                        const units = Math.floor(album.salesPotential * weeksActive * variance);
                        
                        return {
                            title: album.title,
                            artist: album.artist,
                            coverArt: album.coverArt,
                            units: units
                        };
                    });

                    // 3. Combine and Sort
                    const allAlbums = [...userAlbums, ...npcAlbumsThisYear];
                    allAlbums.sort((a, b) => b.units - a.units);
                    const top8 = allAlbums.slice(0, 8);

                    // 4. Create Tweet Payload
                    if (top8.length > 0) {
                        const chartData = JSON.stringify({
                            year: newDate.year,
                            items: top8.map(a => ({
                                title: a.title,
                                artist: a.artist,
                                cover: a.coverArt,
                                units: formatNumber(a.units)
                            }))
                        });

                        artistData.xPosts.unshift({
                            id: crypto.randomUUID(),
                            authorId: 'popbase',
                            content: `Best Selling Albums of ${newDate.year} 🇺🇸`,
                            image: `chart:${chartData}`, // Special prefix to trigger custom rendering
                            likes: Math.floor(Math.random() * 50000) + 20000,
                            retweets: Math.floor(Math.random() * 15000) + 5000,
                            views: Math.floor(Math.random() * 2000000) + 500000,
                            date: newDate
                        });
                    }
                }

                artistData.popularity = Math.max(0, Math.min(100, newPopularity));
                artistData.money = Math.floor(artistData.money + totalIncome);
                artistData.hype = newHype;
                artistData.lastFourWeeksStreams = updatedLastFourWeeksStreams;
                artistData.lastFourWeeksViews = updatedLastFourWeeksViews;
                artistData.youtubeSubscribers = newYoutubeSubscribers;
                artistData.youtubeStoreUnlocked = artistData.youtubeStoreUnlocked || newYoutubeSubscribers >= SUBSCRIBER_THRESHOLD_STORE;
                artistData.streamsThisMonth = (newDate.week % 4 === 0) ? 0 : newStreamsThisMonth;
                artistData.viewsThisQuarter = (newDate.week % 13 === 0) ? 0 : newViewsThisQuarter;
                artistData.subsThisQuarter = (newDate.week % 13 === 0) ? 0 : newSubsThisQuarter;
                artistData.performedGigThisWeek = false;
                artistData.inbox.push(...newEmails);
            }

            // --- FEATURE SONG RELEASE LOGIC ---
            const newNpcsWithReleases = [...newNpcsList];
            newNpcsWithReleases.forEach(npc => {
                if (npc.isPlayerFeature && !npc.isReleased && npc.releaseDate && npc.releaseDate.week === newDate.week && npc.releaseDate.year === newDate.year) {
                    npc.isReleased = true;

                    // Find which player artist was featured to send them the email
                    const featuredArtist = allPlayerArtistsAndGroups.find(a => a.name === npc.featuring);
                    if (featuredArtist && updatedArtistsData[featuredArtist.id]) {
                        
                        const releaseEmail: Email = {
                            id: crypto.randomUUID(),
                            sender: 'Spotify',
                            senderIcon: 'spotify',
                            subject: `New Release: "${npc.title}"`,
                            body: `Hi ${featuredArtist.name},\n\nYour collaboration with ${npc.artist}, "${npc.title}", has been released today!\n\nIt is now available on your Spotify profile under the "Featured On" section.\n\n- The Spotify Team`,
                            date: newDate,
                            isRead: false,
                            offer: {
                                type: 'featureRelease',
                                songTitle: npc.title,
                                npcArtistName: npc.artist,
                            }
                        };
                        updatedArtistsData[featuredArtist.id].inbox.push(releaseEmail);
                    }
                }
            });

            // --- CHART CALCULATION ---
            const allPlayerSongsFlat = Object.values(updatedArtistsData).flatMap(d => d.songs);
            const allPlayerReleases = Object.values(updatedArtistsData).flatMap(d => d.releases);

            const playerChartContenders = allPlayerSongsFlat
                .filter(song => song.isReleased)
                .map(song => {
                    const artist = allPlayerArtistsAndGroups.find(a => a.id === song.artistId);
                    return {
                        uniqueId: song.id, title: song.title, artist: artist?.name || 'Unknown',
                        weeklyStreams: song.lastWeekStreams, isPlayerSong: true, coverArt: song.coverArt, songId: song.id,
                        genre: song.genre
                    }
                });
            
            const npcChartContenders = newNpcsWithReleases.map(npc => ({
                uniqueId: npc.uniqueId, title: npc.title, artist: npc.artist,
                weeklyStreams: Math.floor(npc.basePopularity * (Math.random() * 0.4 + 0.8)),
                isPlayerSong: false, coverArt: npc.coverArt || NPC_COVER_ART, songId: undefined,
                genre: npc.genre
            }));
            
            const allContenders = [...playerChartContenders, ...npcChartContenders];
            allContenders.sort((a, b) => b.weeklyStreams - a.weeklyStreams);

            const newChartHistory: ChartHistory = { ...state.chartHistory };

            const eligibleBillboardContenders = allContenders.filter((song, index) => {
                const potentialRank = index + 1;
                const history = state.chartHistory[song.uniqueId];
                if (history && history.weeksOnChart >= 20 && potentialRank > 50) return false;
                return true;
            });

            const top100 = eligibleBillboardContenders.slice(0, 100);
            const newBillboardHot100: ChartEntry[] = [];
            const prevBillboardMap = new Map(state.billboardHot100.map(entry => [entry.uniqueId, entry]));

            top100.forEach((song, index) => {
                const rank = index + 1;
                const history = newChartHistory[song.uniqueId];
                const prevChartEntry = prevBillboardMap.get(song.uniqueId);

                if (history) {
                    history.weeksOnChart += 1;
                    history.lastRank = rank;
                    if (rank < history.peak) history.peak = rank;
                    if (rank === 1) {
                        history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
                    }
                } else {
                    newChartHistory[song.uniqueId] = { weeksOnChart: 1, peak: rank, lastRank: rank, weeksAtNo1: rank === 1 ? 1 : 0 };
                }
                
                newBillboardHot100.push({
                    rank: rank, lastWeek: prevChartEntry?.rank ?? null, peak: newChartHistory[song.uniqueId].peak,
                    weeksOnChart: newChartHistory[song.uniqueId].weeksOnChart, title: song.title, artist: song.artist,
                    coverArt: song.coverArt, isPlayerSong: song.isPlayerSong, songId: song.songId,
                    uniqueId: song.uniqueId, weeklyStreams: song.weeklyStreams,
                });
            });

            const artistsWithFirstChartEntry = new Set<string>();

            for (const entry of newBillboardHot100) {
                if (entry.isPlayerSong && entry.songId) {
                    const song = allPlayerSongsFlat.find(s => s.id === entry.songId);
                    if (song && playerArtistIds.has(song.artistId) && !artistsWithFirstChartEntry.has(song.artistId)) {
                        const artistData = updatedArtistsData[song.artistId];
                        if (artistData && !artistData.firstChartEntry) {
                            if (entry.weeksOnChart === 1) {
                                artistData.firstChartEntry = {
                                    songTitle: entry.title,
                                    rank: entry.rank,
                                    date: newDate,
                                };
                                artistsWithFirstChartEntry.add(song.artistId);
                            }
                        }
                    }
                }
            }
            
            const top50 = allContenders.slice(0, 50);
            const newSpotifyGlobal50: ChartEntry[] = [];
            const prevSpotifyMap = new Map(state.spotifyGlobal50.map(entry => [entry.uniqueId, entry.rank]));
            let newEntriesCount = 0;
            
            top50.forEach((song, index) => {
                const rank = index + 1;
                const lastWeekRank = prevSpotifyMap.get(song.uniqueId) ?? null;
                if (lastWeekRank === null) newEntriesCount++;
                newSpotifyGlobal50.push({
                    rank: rank, lastWeek: lastWeekRank, peak: newChartHistory[song.uniqueId].peak,
                    weeksOnChart: newChartHistory[song.uniqueId].weeksOnChart, title: song.title, artist: song.artist,
                    coverArt: song.coverArt, isPlayerSong: song.isPlayerSong, songId: song.songId,
                    uniqueId: song.uniqueId, weeklyStreams: song.weeklyStreams,
                });
            });

            // --- GENRE CHART CALCULATION ---
            const { newChart: newHotPopSongs, newHistory: newHotPopSongsHistory } = calculateGenreChart(
                allContenders, ['Pop'], state.hotPopSongs, state.hotPopSongsHistory
            );
            const { newChart: newHotRapRnb, newHistory: newHotRapRnbHistory } = calculateGenreChart(
                allContenders, ['Hip Hop', 'R&B'], state.hotRapRnb, state.hotRapRnbHistory
            );
            const { newChart: newElectronicChart, newHistory: newElectronicChartHistory } = calculateGenreChart(
                allContenders, ['Electronic'], state.electronicChart, state.electronicChartHistory
            );
            const { newChart: newCountryChart, newHistory: newCountryChartHistory } = calculateGenreChart(
                allContenders, ['Country'], state.countryChart, state.countryChartHistory
            );

            // --- ALBUM CHART CALCULATION ---
            const playerAlbumContenders = allPlayerReleases
                .filter(r => r.type === 'EP' || r.type === 'Album' || r.type === 'Album (Deluxe)')
                .map(release => {
                    const artist = allPlayerArtistsAndGroups.find(a => a.id === release.artistId);
                    const artistData = updatedArtistsData[release.artistId];

                    const totalWeeklyStreams = release.songIds.reduce((sum, songId) => {
                        const song = artistData.songs.find(s => s.id === songId);
                        return sum + (song?.lastWeekStreams || 0);
                    }, 0);

                    const albumMerch = artistData.merch.filter(m => m.releaseId === release.id);
                    const totalWeeklySales = albumMerch.reduce((sum, item) => {
                        const weeklySales = artistData.youtubeStoreUnlocked ? Math.floor((artistData.youtubeSubscribers / 50000) * (Math.random() * 5 + 1)) : 0;
                        return sum + weeklySales;
                    }, 0);

                    const weeklyActivity = Math.floor(totalWeeklyStreams / 1500) + totalWeeklySales;
                    const labelName = release.releasingLabel ? release.releasingLabel.name : 'Independent';

                    return {
                        uniqueId: release.id,
                        title: release.title,
                        artist: artist?.name || 'Unknown',
                        label: labelName,
                        coverArt: release.coverArt,
                        isPlayerAlbum: true,
                        albumId: release.id,
                        weeklyActivity,
                        weeklySales: totalWeeklySales,
                    };
                });

            const npcAlbumContenders = newNpcAlbums.map(album => {
                const albumSongs = album.songIds.map(id => newNpcsWithReleases.find(s => s.uniqueId === id)).filter(Boolean);
                
                const totalWeeklyStreams = albumSongs.reduce((sum, song) => {
                    if (!song) return sum;
                    return sum + Math.floor(song.basePopularity * (Math.random() * 0.4 + 0.8));
                }, 0);

                const streamActivity = Math.floor(totalWeeklyStreams / 1500);
                // Use the sales potential to guarantee higher chart positions
                // Sales potential (14k+) ensures chart relevance.
                // Vary sales weekly by +/- 10%
                const variance = 0.9 + (Math.random() * 0.2); 
                const weeklySales = Math.floor((album.salesPotential || 1000) * variance);
                
                const weeklyActivity = streamActivity + weeklySales;

                return {
                    uniqueId: album.uniqueId,
                    title: album.title,
                    artist: album.artist,
                    label: album.label,
                    coverArt: album.coverArt,
                    isPlayerAlbum: false,
                    albumId: album.uniqueId,
                    weeklyActivity,
                    weeklySales,
                };
            });

            const allAlbumContenders = [...playerAlbumContenders, ...npcAlbumContenders];
            allAlbumContenders.sort((a, b) => b.weeklyActivity - a.weeklyActivity);

            const top50Albums = allAlbumContenders.slice(0, 50);
            const newAlbumChartHistory: ChartHistory = { ...state.albumChartHistory };
            const newBillboardTopAlbums: AlbumChartEntry[] = [];
            const prevBillboardAlbumsMap = new Map(state.billboardTopAlbums.map(entry => [entry.uniqueId, entry]));

            top50Albums.forEach((album, index) => {
                const rank = index + 1;
                const history = newAlbumChartHistory[album.uniqueId];
                const prevChartEntry = prevBillboardAlbumsMap.get(album.uniqueId);

                if (history) {
                    history.weeksOnChart += 1;
                    history.lastRank = rank;
                    if (rank < history.peak) history.peak = rank;
                    if (rank === 1) {
                        history.weeksAtNo1 = (history.weeksAtNo1 || 0) + 1;
                    }
                } else {
                    newAlbumChartHistory[album.uniqueId] = { weeksOnChart: 1, peak: rank, lastRank: rank, weeksAtNo1: rank === 1 ? 1 : 0 };
                }

                newBillboardTopAlbums.push({
                    rank,
                    lastWeek: prevChartEntry?.rank ?? null,
                    peak: newAlbumChartHistory[album.uniqueId].peak,
                    weeksOnChart: newAlbumChartHistory[album.uniqueId].weeksOnChart,
                    title: album.title,
                    artist: album.artist,
                    label: album.label,
                    coverArt: album.coverArt,
                    isPlayerAlbum: album.isPlayerAlbum,
                    albumId: album.albumId,
                    uniqueId: album.uniqueId,
                    weeklyActivity: album.weeklyActivity,
                    weeklySales: album.weeklySales,
                });
            });
            
            // --- AWARDS LOGIC ---
            let finalState: GameState = { ...state };
            
            // --- OSCARS LOGIC ---
            let newOscarNominations: GameState['oscarCurrentYearNominations'] = state.oscarCurrentYearNominations;
            
            // Week 1: Oscar Submission Email
            if (newDate.week === 1) {
                for (const artistId in updatedArtistsData) {
                    const artistData = updatedArtistsData[artistId];
                    const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                    const hasOscarEmailThisYear = artistData.inbox.some(e => e.offer?.type === 'oscarSubmission' && e.date.year === newDate.year);
                    
                    if (artistProfile && !hasOscarEmailThisYear) {
                        const eligibleSongs = artistData.songs.filter(s => {
                            const release = artistData.releases.find(r => r.id === s.releaseId);
                            return s.soundtrackTitle && release && release.releaseDate.year === newDate.year - 1;
                        });

                        if (eligibleSongs.length > 0) {
                            const emailId = crypto.randomUUID();
                            artistData.inbox.push({
                                id: emailId,
                                sender: 'The Academy',
                                senderIcon: 'oscars',
                                subject: `Submit for the ${newDate.year} Academy Awards`,
                                body: `Hi ${artistProfile.name},\n\nThe submission window for Best Original Song at the ${newDate.year} Academy Awards is open. Please submit your eligible soundtrack releases from last year.\n\n- The Academy of Motion Picture Arts and Sciences`,
                                date: newDate,
                                isRead: false,
                                offer: { type: 'oscarSubmission', emailId, isSubmitted: false }
                            });
                        }
                    }
                }
            }
            
            // Week 5: Determine Oscar Nominations
            if (newDate.week === 5 && state.oscarSubmissions.length > 0) {
                const categoryName = 'Best Original Song';
                const contenders: OscarContender[] = [];

                // Player contenders
                for (const sub of state.oscarSubmissions) {
                    const artistData = updatedArtistsData[sub.artistId];
                    const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === sub.artistId);
                    const song = artistData.songs.find(s => s.id === sub.itemId);
                    if (artistData && artistProfile && song) {
                        const score = (song.quality * 3) + (song.streams / 1000000);
                        contenders.push({ id: song.id, name: song.title, artistName: artistProfile.name, isPlayer: true, score, coverArt: song.coverArt });
                    }
                }

                // NPC contenders
                const npcSongsForOscars = [...newNpcsList].sort((a,b) => b.basePopularity - a.basePopularity).slice(0, 10);
                npcSongsForOscars.forEach(song => {
                    contenders.push({ id: song.uniqueId, name: song.title, artistName: song.artist, isPlayer: false, score: (song.basePopularity / 100000) * 1.5, coverArt: song.coverArt || NPC_COVER_ART });
                });

                contenders.sort((a,b) => b.score - a.score);
                const nominees = contenders.slice(0, 5);

                if (nominees.length > 0) {
                    newOscarNominations = [{ name: categoryName, nominees, winner: nominees[0] }];
                    
                    const playerNominee = nominees.find(n => n.isPlayer);
                    if (playerNominee) {
                        const artistData = updatedArtistsData[playerNominee.artistName === state.soloArtist?.name ? state.soloArtist.id : state.group!.id];
                        const artistProfile = allPlayerArtistsAndGroups.find(a => a.name === playerNominee.artistName);

                        if(artistData && artistProfile) {
                            artistData.popularity = Math.min(100, artistData.popularity + 5);
                            const hasPerformanceOffer = Math.random() < 0.5;
                            let body = `Dear ${artistProfile.name},\n\nCongratulations! The Academy is pleased to announce your nomination for Best Original Song for "${playerNominee.name}".`;
                            if (hasPerformanceOffer) {
                                body += `\n\nAdditionally, we would be honored to have you perform at the ceremony. Please respond to accept.`;
                            }
                            body += `\n\nSincerely,\nThe Academy`;
                            const emailId = crypto.randomUUID();
                            artistData.inbox.push({
                                id: emailId, sender: 'The Academy', senderIcon: 'oscars', subject: 'Congratulations! You\'re an Oscar Nominee!',
                                body, date: newDate, isRead: false, offer: { type: 'oscarNominations', emailId, hasPerformanceOffer }
                            });
                        }
                    }

                    let postContent = `The nominees for Best Original Song at the ${newDate.year} #Oscars have been announced:\n\n`;
                    postContent += nominees.map(n => `• ${n.isPlayer ? `**${n.name}**` : n.name} (${n.artistName})`).join('\n');
                    Object.values(updatedArtistsData).forEach(d => d.xPosts.unshift({
                        id: crypto.randomUUID(), authorId: 'popbase', content: postContent,
                        likes: Math.floor(Math.random() * 60000) + 30000, retweets: Math.floor(Math.random() * 15000) + 7000,
                        views: Math.floor(Math.random() * 2000000) + 800000, date: newDate,
                    }));
                }
            }

            // Week 10: Oscar Ceremony
            if (newDate.week === 10 && state.oscarCurrentYearNominations) {
                const category = state.oscarCurrentYearNominations[0];
                if (category.winner) {
                     const winner = category.winner;
                     const content = `The Oscar for Best Original Song goes to... "${winner.name}" by ${winner.artistName}! #Oscars`;
                     Object.values(updatedArtistsData).forEach(d => d.xPosts.unshift({
                        id: crypto.randomUUID(), authorId: 'popbase', content, image: winner.coverArt,
                        likes: Math.floor(Math.random() * 100000) + 50000, retweets: Math.floor(Math.random() * 20000) + 10000,
                        views: Math.floor(Math.random() * 5000000) + 2000000, date: newDate,
                     }));
                }

                for (const artistId in updatedArtistsData) {
                    const artistData = updatedArtistsData[artistId];
                    const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                    const nomination = category.nominees.find(n => n.isPlayer && n.artistName === artistProfile?.name);
                    if (nomination) {
                        const isWinner = category.winner?.id === nomination.id;
                        if(isWinner) artistData.popularity = Math.min(100, artistData.popularity + 10);
                        artistData.oscarHistory.push({
                            year: newDate.year, category: 'Best Original Song', itemId: nomination.id,
                            itemName: nomination.name, artistName: nomination.artistName, isWinner
                        });
                    }
                }
                finalState.oscarSubmissions = [];
                finalState.oscarCurrentYearNominations = null;
            }

            // --- GRAMMYS LOGIC ---
            let newGrammyNominations: GameState['grammyCurrentYearNominations'] = state.grammyCurrentYearNominations;
            
            // Week 45: Determine Grammy Nominations
            if (newDate.week === 45 && state.grammySubmissions.length > 0) {
                const newNominations: GrammyCategory[] = [];
                const categories: GrammyAward['category'][] = [
                    'Record of the Year', 'Song of the Year', 'Album of the Year', 'Best New Artist',
                    'Best Pop Song', 'Best Rap Song', 'Best R&B Song', 'Pop Album', 'Rap Album', 'R&B Album'
                ];

                for (const categoryName of categories) {
                    const contenders: GrammyContender[] = [];
                    
                    let genreFilter: string | null = null;
                    let isAlbumCategory = false;
                    let isSongCategory = false;

                    switch (categoryName) {
                        case 'Pop Album': genreFilter = 'Pop'; isAlbumCategory = true; break;
                        case 'Rap Album': genreFilter = 'Hip Hop'; isAlbumCategory = true; break;
                        case 'R&B Album': genreFilter = 'R&B'; isAlbumCategory = true; break;
                        case 'Best Pop Song': genreFilter = 'Pop'; isSongCategory = true; break;
                        case 'Best Rap Song': genreFilter = 'Hip Hop'; isSongCategory = true; break;
                        case 'Best R&B Song': genreFilter = 'R&B'; isSongCategory = true; break;
                        case 'Album of the Year': isAlbumCategory = true; break;
                        case 'Record of the Year':
                        case 'Song of the Year':
                            isSongCategory = true;
                            break;
                    }

                    const playerSubmissions = state.grammySubmissions.filter(s => s.category === categoryName);
                    for (const sub of playerSubmissions) {
                        const artistData = updatedArtistsData[sub.artistId];
                        const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === sub.artistId);
                        if (!artistData || !artistProfile) continue;

                        let score = 0;
                        let coverArt: string | undefined = undefined;
                        let isValid = false;

                        if (isAlbumCategory) {
                            const release = artistData.releases.find(r => r.id === sub.itemId);
                            if (release) {
                                const releaseSongs = release.songIds.map(id => artistData.songs.find(s => s.id === id)).filter((s): s is Song => !!s);
                                if (releaseSongs.length > 0) {
                                    let genreMatch = !genreFilter;
                                    if(genreFilter) {
                                        const genreCounts = releaseSongs.reduce((acc, song) => {
                                            acc[song.genre] = (acc[song.genre] || 0) + 1;
                                            return acc;
                                        }, {} as {[genre: string]: number});
                                        const majorGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b);
                                        if (majorGenre === genreFilter) genreMatch = true;
                                    }
                                    if(genreMatch) {
                                        const avgQuality = releaseSongs.reduce((sum, s) => sum + s.quality, 0) / releaseSongs.length;
                                        score = (avgQuality * 2) + ((release.firstWeekStreams || 0) / 100000);
                                        coverArt = release.coverArt;
                                        isValid = true;
                                    }
                                }
                            }
                        } else if (categoryName === 'Best New Artist') {
                            const totalStreamsThisYear = artistData.songs.reduce((sum, s) => {
                                const release = artistData.releases.find(r => r.id === s.releaseId);
                                return (release && release.releaseDate.year === newDate.year) ? sum + s.streams : sum;
                            }, 0);
                            score = artistData.hype + (totalStreamsThisYear / 1000000);
                            coverArt = artistProfile.image;
                            isValid = true;
                        } else { // Song categories
                            const song = artistData.songs.find(s => s.id === sub.itemId);
                            if (song) {
                                if (!genreFilter || song.genre === genreFilter) {
                                    score = (song.quality * 2) + ((song.firstWeekStreams || 0) / 25000);
                                    coverArt = song.coverArt;
                                    isValid = true;
                                }
                            }
                        }
                        
                        if (isValid) {
                            contenders.push({ id: sub.itemId, name: sub.itemName, artistName: artistProfile.name, isPlayer: true, score, coverArt });
                        }
                    }
                    
                    const numNpcContenders = 15;
                    if (isAlbumCategory) {
                        newNpcAlbums.slice(0, numNpcContenders * 5)
                            .filter(album => {
                                if (!genreFilter) return true;
                                const albumSongs = album.songIds.map(id => newNpcsWithReleases.find(s => s.uniqueId === id)).filter((s): s is NpcSong => !!s);
                                if (albumSongs.length === 0) return false;
                                const genreCounts = albumSongs.reduce((acc, song) => {
                                    acc[song.genre] = (acc[song.genre] || 0) + 1;
                                    return acc;
                                }, {} as {[genre: string]: number});
                                const majorGenre = Object.keys(genreCounts).reduce((a, b) => genreCounts[a] > genreCounts[b] ? a : b);
                                return majorGenre === genreFilter;
                            })
                            .slice(0, numNpcContenders)
                            .forEach(album => {
                                const albumSongs = album.songIds.map(id => newNpcsWithReleases.find(s => s.uniqueId === id)).filter(Boolean);
                                const avgPopularity = albumSongs.reduce((sum, s) => sum + (s?.basePopularity || 0), 0) / (albumSongs.length || 1);
                                contenders.push({ id: album.uniqueId, name: album.title, artistName: album.artist, isPlayer: false, score: (avgPopularity / 100000) * 1.5, coverArt: album.coverArt });
                            });
                    } else if (categoryName !== 'Best New Artist') {
                        newNpcsWithReleases.slice(0, numNpcContenders * 5)
                            .filter(song => !genreFilter || song.genre === genreFilter)
                            .slice(0, numNpcContenders)
                            .forEach(song => {
                                contenders.push({ id: song.uniqueId, name: song.title, artistName: song.artist, isPlayer: false, score: song.basePopularity / 100000, coverArt: NPC_COVER_ART });
                            });
                    } else {
                        [...new Set(newNpcAlbums.slice(0, numNpcContenders).map(a => a.artist))].slice(0, 5).forEach(artistName => {
                            contenders.push({ id: `npc_${artistName}`, name: artistName, artistName, isPlayer: false, score: Math.random() * 100 + 50 });
                        });
                    }

                    contenders.sort((a, b) => b.score - a.score);
                    const nominees = contenders.slice(0, 5);
                    if (nominees.length > 0) {
                        newNominations.push({ name: categoryName, nominees, winner: nominees[0] });
                    }
                }
                
                newGrammyNominations = newNominations;

                const majorCatsForPosts: GrammyAward['category'][] = ['Album of the Year', 'Record of the Year', 'Song of the Year', 'Best New Artist'];
                const nominationPosts: XPost[] = [];
                newNominations.forEach(category => {
                    if (majorCatsForPosts.includes(category.name)) {
                        const playerNominee = category.nominees.find(n => n.isPlayer);
                        let content = `The nominees for ${category.name} at the ${newDate.year + 1} #GRAMMYs have been announced:\n\n`;
                        content += category.nominees.map(n => `• ${n.isPlayer ? `**${n.name}**` : n.name}`).join('\n');
                        
                        const image = playerNominee?.coverArt || category.nominees[0]?.coverArt || undefined;

                        nominationPosts.push({
                            id: crypto.randomUUID(),
                            authorId: 'popbase',
                            content,
                            image,
                            likes: Math.floor(Math.random() * 50000) + 25000,
                            retweets: Math.floor(Math.random() * 12000) + 5000,
                            views: Math.floor(Math.random() * 1500000) + 500000,
                            date: newDate,
                        });
                    }
                });

                if (nominationPosts.length > 0) {
                    for (const artistId in updatedArtistsData) {
                        updatedArtistsData[artistId].xPosts.unshift(...nominationPosts);
                    }
                }


                for (const artistId in updatedArtistsData) {
                    const artistData = updatedArtistsData[artistId];
                    const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                    const artistNominations = newNominations.flatMap(cat => cat.nominees).filter(nom => nom.isPlayer && nom.artistName === artistProfile?.name);
                        
                    if (artistNominations.length > 0 && artistProfile) {
                        artistData.popularity = Math.min(100, artistData.popularity + (artistNominations.length * 3));
                        const hasPerformanceOffer = Math.random() < 0.5;
                        let body = `Dear ${artistProfile.name},\n\nCongratulations! The Recording Academy is pleased to announce your nomination(s) for the ${newDate.year + 1} GRAMMY Awards:\n\n`;
                        artistNominations.forEach(nom => {
                            const category = newNominations.find(c => c.nominees.includes(nom));
                            body += `• ${category?.name} - "${nom.name}"\n`;
                        });
                        if(hasPerformanceOffer) body += `\nAdditionally, we would be honored to have you perform at the ceremony. Please respond to this email to accept or decline the offer.\n\n`;
                        body += `\nSincerely,\nThe Recording Academy`;
                        const emailId = crypto.randomUUID();
                        artistData.inbox.push({
                            id: emailId, sender: 'Recording Academy', senderIcon: 'grammys', subject: 'Congratulations! You\'re a GRAMMY Nominee!',
                            body, date: newDate, isRead: false, offer: { type: 'grammyNominations', emailId, hasPerformanceOffer }
                        });

                        const redCarpetEmailId = crypto.randomUUID();
                        artistData.inbox.push({
                            id: redCarpetEmailId,
                            sender: 'Recording Academy',
                            senderIcon: 'grammys',
                            subject: 'Invitation: GRAMMYs Red Carpet',
                            body: `Hi ${artistProfile.name},\n\nWe're excited to invite you to walk the red carpet at this year's GRAMMY Awards ceremony. Pop Base and other outlets will be covering the event.\n\nPlease let us know if you'll be attending by sharing your look.\n\n- The Recording Academy`,
                            date: newDate,
                            isRead: false,
                            offer: { type: 'grammyRedCarpet', emailId: redCarpetEmailId }
                        });
                    }
                }
            }

            // Week 52: Grammy Awards Ceremony
            if (newDate.week === 52 && state.grammyCurrentYearNominations) {
                for (const category of state.grammyCurrentYearNominations) {
                    if (category.winner) {
                        const winner = category.winner;
                        const content = `Recording Academy / GRAMMYS 🏆\n\nCongrats ${category.name} winner - '${winner.name}' @${winner.artistName.replace(/\s/g, '')} #GRAMMYs`;
                        Object.values(updatedArtistsData).forEach(d => d.xPosts.unshift({
                            id: crypto.randomUUID(), authorId: 'popbase', content, image: winner.coverArt,
                            likes: Math.floor(Math.random() * 40000) + 15000, retweets: Math.floor(Math.random() * 10000) + 5000,
                            views: Math.floor(Math.random() * 2000000) + 1000000, date: newDate,
                        }));
                    }
                }

                for(const artistId in updatedArtistsData) {
                    const artistData = updatedArtistsData[artistId];
                    const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                    
                    for (const category of state.grammyCurrentYearNominations) {
                        const nomination = category.nominees.find(n => n.isPlayer && n.artistName === artistProfile?.name);
                        if (nomination) {
                            const isWinner = category.winner?.id === nomination.id && category.winner.artistName === nomination.artistName;
                            if (isWinner) {
                                artistData.popularity = Math.min(100, artistData.popularity + 5);
                            }
                            artistData.grammyHistory.push({
                                year: newDate.year, category: category.name, itemId: nomination.id,
                                itemName: nomination.name, artistName: artistProfile?.name || 'Unknown',
                                isWinner
                            });
                        }
                    }
                }
                
                finalState.grammySubmissions = [];
                finalState.grammyCurrentYearNominations = null;
            }

            // --- ADD CHART EMAILS TO INBOX ---
            // This is done last, after all other logic for the week.
            for (const artistId in updatedArtistsData) {
                const artistData = updatedArtistsData[artistId];
                const artistProfileForEmail = allPlayerArtistsAndGroups.find(a => a.id === artistId);
                const newChartEmails: Email[] = [];

                 // --- CHART UPDATE EMAILS ---
                if (artistProfileForEmail) {
                    // Billboard Chart Email
                    const playerHot100Entries = newBillboardHot100.filter(e => e.isPlayerSong && allPlayerSongsFlat.find(s => s.id === e.songId)?.artistId === artistId);
                    const playerAlbumEntries = newBillboardTopAlbums.filter(e => e.isPlayerAlbum && allPlayerReleases.find(r => r.id === e.albumId)?.artistId === artistId);

                    if (playerHot100Entries.length > 0 || playerAlbumEntries.length > 0) {
                        let body = `Hi ${artistProfileForEmail.name},\n\nHere's your weekly recap of your performance on the Billboard charts.\n`;
                        
                        if (playerHot100Entries.length > 0) {
                            body += `\n**Billboard Hot 100**\n`;
                            playerHot100Entries.forEach(entry => {
                                body += `#${entry.rank} "${entry.title}"\n`;
                            });
                        }

                        if (playerAlbumEntries.length > 0) {
                            body += `\n**Billboard Top 50 Albums**\n`;
                            playerAlbumEntries.forEach(entry => {
                                body += `#${entry.rank} "${entry.title}"\n`;
                            });
                        }

                        body += `\nCongratulations on your chart success!\n- The Billboard Team`;

                        newChartEmails.push({
                            id: crypto.randomUUID(),
                            sender: 'Billboard',
                            subject: 'Your Weekly Billboard Chart Recap',
                            body: body,
                            date: newDate,
                            isRead: false,
                            senderIcon: 'default',
                        });
                    }

                    // Spotify Chart Email
                    const playerSpotifyEntries = newSpotifyGlobal50.filter(e => e.isPlayerSong && allPlayerSongsFlat.find(s => s.id === e.songId)?.artistId === artistId);
                    
                    if (playerSpotifyEntries.length > 0) {
                        let body = `Hi ${artistProfileForEmail.name},\n\nHere are your current entries on the Spotify Global Top 50 chart this week.\n\n**Global Top 50**\n`;
                        playerSpotifyEntries.forEach(entry => {
                            body += `#${entry.rank} "${entry.title}" - ${formatNumber(entry.weeklyStreams)} streams\n`;
                        });
                        body += `\nKeep up the great work!\n- Spotify Charts Team`;

                        newChartEmails.push({
                            id: crypto.randomUUID(),
                            sender: 'Spotify Charts',
                            subject: 'Your Global Top 50 Chart Update',
                            body: body,
                            date: newDate,
                            isRead: false,
                            senderIcon: 'spotify',
                        });
                    }
                }
                artistData.inbox.push(...newChartEmails);
            }

            if (contractRenewalForActivePlayer) {
                return {
                    ...finalState,
                    date: newDate,
                    artistsData: updatedArtistsData,
                    billboardHot100: newBillboardHot100,
                    billboardTopAlbums: newBillboardTopAlbums,
                    chartHistory: newChartHistory,
                    albumChartHistory: newAlbumChartHistory,
                    spotifyGlobal50: newSpotifyGlobal50,
                    hotPopSongs: newHotPopSongs,
                    hotRapRnb: newHotRapRnb,
                    electronicChart: newElectronicChart,
                    countryChart: newCountryChart,
                    hotPopSongsHistory: newHotPopSongsHistory,
                    hotRapRnbHistory: newHotRapRnbHistory,
                    electronicChartHistory: newElectronicChartHistory,
                    countryChartHistory: newCountryChartHistory,
                    spotifyNewEntries: newEntriesCount,
                    npcs: newNpcsWithReleases,
                    npcAlbums: newNpcAlbums,
                    grammyCurrentYearNominations: newGrammyNominations,
                    oscarCurrentYearNominations: newOscarNominations,
                    contractRenewalOffer: contractRenewalForActivePlayer,
                    currentView: 'contractRenewal'
                };
            }

            return {
                ...finalState,
                date: newDate,
                artistsData: updatedArtistsData,
                billboardHot100: newBillboardHot100,
                billboardTopAlbums: newBillboardTopAlbums,
                chartHistory: newChartHistory,
                albumChartHistory: newAlbumChartHistory,
                spotifyGlobal50: newSpotifyGlobal50,
                hotPopSongs: newHotPopSongs,
                hotRapRnb: newHotRapRnb,
                electronicChart: newElectronicChart,
                countryChart: newCountryChart,
                hotPopSongsHistory: newHotPopSongsHistory,
                hotRapRnbHistory: newHotRapRnbHistory,
                electronicChartHistory: newElectronicChartHistory,
                countryChartHistory: newCountryChartHistory,
                spotifyNewEntries: newEntriesCount,
                npcs: newNpcsWithReleases,
                npcAlbums: newNpcAlbums,
                grammyCurrentYearNominations: newGrammyNominations,
                oscarCurrentYearNominations: newOscarNominations,
            };
        }
        case 'RECORD_SONG': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const newSong: Song = {
                ...action.payload.song,
                dailyStreams: [],
            };
            const updatedData = {
                ...activeData,
                money: activeData.money - action.payload.cost,
                songs: [...activeData.songs, newSong],
            };
            return {
                ...state,
                artistsData: { ...state.artistsData, [state.activeArtistId]: updatedData },
            };
        }
        case 'RELEASE_PROJECT': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];

            if (activeData.contract) return state;

            const releaseWithLabel = { ...action.payload.release, releasingLabel: null };

            let hypeIncrease = 0;
            switch (releaseWithLabel.type) {
                case 'Single': hypeIncrease = 15; break;
                case 'EP': hypeIncrease = 25; break;
                case 'Album': hypeIncrease = 40; break;
            }

            let newEmails: Email[] = [];
            const artistName = state.soloArtist?.name || state.group?.name || 'Artist';

            if (releaseWithLabel.type === 'Single') {
                const song = activeData.songs.find(s => s.id === releaseWithLabel.songIds[0]);
                if (song) {
                    const emailIdGenius = crypto.randomUUID();
                    newEmails.push({
                        id: emailIdGenius,
                        sender: 'Genius',
                        subject: `Verified Interview for "${song.title}"?`,
                        body: `Hey ${artistName},\n\nWe're big fans of your new single "${song.title}" over at Genius. We'd love to have you for our 'Verified' series to break down the lyrics and meaning behind the track.\n\nLet us know if you're interested.\n\nBest,\nThe Genius Team`,
                        date: releaseWithLabel.releaseDate,
                        isRead: false,
                        senderIcon: 'genius',
                        offer: {
                            type: 'geniusInterview',
                            songId: song.id,
                            isAccepted: false,
                            emailId: emailIdGenius,
                        }
                    });

                    // On The Radar / TRSH'D offer for Hip Hop singles
                    if (song.genre === 'Hip Hop' && Math.random() < 0.75) { // 75% chance
                        const platform = Math.random() < 0.5 ? 'On The Radar' : "TRSH'D";
                        const emailIdPlatform = crypto.randomUUID();
                        if (platform === 'On The Radar') {
                            newEmails.push({
                                id: emailIdPlatform,
                                sender: 'On The Radar',
                                senderIcon: 'ontheradar',
                                subject: `Performance Invite for "${song.title}"`,
                                body: `Yo ${artistName},\n\nWe've been hearing the buzz around your new single "${song.title}". We'd like to invite you to our studio for an "On The Radar" freestyle performance.\n\nThis is a huge look. Let us know.\n\n- On The Radar Team`,
                                date: releaseWithLabel.releaseDate,
                                isRead: false,
                                offer: {
                                    type: 'onTheRadarOffer',
                                    songId: song.id,
                                    isAccepted: false,
                                    emailId: emailIdPlatform,
                                }
                            });
                        } else { // TRSH'D
                             newEmails.push({
                                id: emailIdPlatform,
                                sender: "TRSH'D",
                                senderIcon: 'trshd',
                                subject: `TRSH'D Performance: ${song.title}`,
                                body: `What's good ${artistName},\n\nYour new track "${song.title}" is making waves. We want you to come through and lay down a performance for TRSH'D.\n\nHit us back if you're down.\n\n- TRSH'D`,
                                date: releaseWithLabel.releaseDate,
                                isRead: false,
                                offer: {
                                    type: 'trshdOffer',
                                    songId: song.id,
                                    isAccepted: false,
                                    emailId: emailIdPlatform,
                                }
                            });
                        }
                    }
                }
            }

            if (releaseWithLabel.type === 'EP' || releaseWithLabel.type === 'Album') {
                const emailId = crypto.randomUUID();
                const offerTypes: Array<'performance' | 'interview' | 'both'> = ['performance', 'interview', 'both'];
                const selectedOfferType = offerTypes[Math.floor(Math.random() * offerTypes.length)];
                
                let subject = '';
                let body = '';
                switch (selectedOfferType) {
                    case 'performance':
                        subject = `Performance on The Tonight Show Starring Jimmy Fallon?`;
                        body = `Hey ${artistName},\n\nHuge fans of the new ${releaseWithLabel.type.toLowerCase()} "${releaseWithLabel.title}"! We'd be thrilled to have you on the show to perform a song from it.\n\nLet us know if you're interested.\n\nBest,\nThe Tonight Show Team`;
                        break;
                    case 'interview':
                        subject = `Interview on The Tonight Show Starring Jimmy Fallon?`;
                        body = `Hey ${artistName},\n\nThe new ${releaseWithLabel.type.toLowerCase()} "${releaseWithLabel.title}" is all anyone's talking about! Jimmy would love to have you on the show for an interview to discuss the project.\n\nLet us know if you're interested.\n\nBest,\nThe Tonight Show Team`;
                        break;
                    case 'both':
                        subject = `Appearance on The Tonight Show Starring Jimmy Fallon?`;
                        body = `Hey ${artistName},\n\nCongratulations on the new ${releaseWithLabel.type.toLowerCase()} "${releaseWithLabel.title}"! The whole office has it on repeat. Jimmy would love to have you on the show for an interview AND a performance.\n\nLet us know if you're interested.\n\nBest,\nThe Tonight Show Team`;
                        break;
                }

                newEmails.push({
                    id: emailId,
                    sender: 'The Tonight Show',
                    subject,
                    body,
                    date: releaseWithLabel.releaseDate,
                    isRead: false,
                    senderIcon: 'fallon',
                    offer: {
                        type: 'fallonOffer',
                        releaseId: releaseWithLabel.id,
                        offerType: selectedOfferType,
                        isAccepted: false,
                        emailId: emailId,
                    }
                });
            }

            const newSongs = activeData.songs.map(song => 
                releaseWithLabel.songIds.includes(song.id)
                ? { ...song, isReleased: true, releaseId: releaseWithLabel.id }
                : song
            );
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        releases: [...activeData.releases, releaseWithLabel],
                        songs: newSongs,
                        hype: Math.min(100, activeData.hype + hypeIncrease),
                        inbox: [...activeData.inbox, ...newEmails],
                    }
                }
            };
        }
        case 'ADD_REVIEW': {
            const { releaseId, review, cost, artistId } = action.payload;
            const artistData = state.artistsData[artistId];
            if (!artistData) return state;

            let songsWithBoost = [...artistData.songs];
            let hypeIncrease = 0;
            let popularityIncrease = 0;
            if (review.score >= 8.5) {
                hypeIncrease = 20;
                popularityIncrease = 5;
            } else if (review.score >= 7.0) {
                 popularityIncrease = 2;
            }

            if (review.score >= 7) {
                const release = artistData.releases.find(r => r.id === releaseId);
                if (release) {
                    const songIdsToBoost = new Set(release.songIds);
                    songsWithBoost = artistData.songs.map(song => 
                        songIdsToBoost.has(song.id) ? { ...song, pitchforkBoost: true } : song
                    );
                }
            }
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [artistId]: {
                        ...artistData,
                        money: artistData.money - cost,
                        songs: songsWithBoost,
                        releases: artistData.releases.map(r => r.id === releaseId ? { ...r, review } : r),
                        hype: Math.min(100, artistData.hype + hypeIncrease),
                        popularity: Math.min(100, artistData.popularity + popularityIncrease),
                    }
                }
            };
        }
        case 'CREATE_VIDEO': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const { video, cost } = action.payload;

            let hypeIncrease = 0;
            switch (video.type) {
                case 'Music Video': hypeIncrease = 20; break;
                case 'Lyric Video': hypeIncrease = 10; break;
                case 'Visualizer': hypeIncrease = 5; break;
            }
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - cost,
                        videos: [...activeData.videos, video],
                        hype: Math.min(100, activeData.hype + hypeIncrease),
                    }
                }
            };
        }
        case 'ADD_MERCH': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        merch: [...activeData.merch, action.payload.item]
                    }
                }
            };
        }
        case 'REMOVE_MERCH': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                 artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        merch: activeData.merch.filter(item => item.id !== action.payload.id)
                    }
                }
            };
        }
        case 'UPDATE_MERCH_BANNER': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        merchStoreBanner: action.payload,
                    }
                }
            };
        }
        case 'MARK_INBOX_READ': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: activeData.inbox.map(email => ({...email, isRead: true}))
                    }
                }
            };
        }
        case 'START_PROMOTION': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const { promotion } = action.payload;
            return {
                ...state,
                 artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - promotion.weeklyCost,
                        promotions: [...activeData.promotions, promotion]
                    }
                }
            };
        }
        case 'CANCEL_PROMOTION': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        promotions: activeData.promotions.filter(p => p.id !== action.payload.promotionId),
                    }
                }
            };
        }
        case 'SELECT_VIDEO': {
            return { ...state, selectedVideoId: action.payload };
        }
        case 'SELECT_RELEASE': {
            return { ...state, selectedReleaseId: action.payload };
        }
        case 'PERFORM_GIG': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                currentView: 'game',
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money + action.payload.cash,
                        hype: Math.min(100, activeData.hype + action.payload.hype),
                        performedGigThisWeek: true,
                    }
                }
            };
        }
        case 'SIGN_CONTRACT': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            
            const allCustomLabels: CustomLabel[] = Object.values(state.artistsData).flatMap(d => d.customLabels);
            const { contract } = action.payload;

            const label = contract.isCustom 
                ? allCustomLabels.find(l => l.id === contract.labelId)
                : LABELS.find(l => l.id === contract.labelId);
            
            const artist = allPlayerArtistsAndGroups.find(a => a.id === contract.artistId);

            let newPosts: XPost[] = [];
            if (label && artist) {
                const playerUser = activeData.xUsers.find(u => u.isPlayer);
                if (playerUser) {
                    newPosts.push({
                        id: crypto.randomUUID(),
                        authorId: 'tmz',
                        content: `${artist.name} has officially signed a record deal with ${label.name}. Sources say it's a multi-album deal.`,
                        image: playerUser.avatar,
                        likes: Math.floor(Math.random() * 5000) + 1000,
                        retweets: Math.floor(Math.random() * 1000) + 200,
                        views: Math.floor(Math.random() * 400000) + 150000,
                        date: state.date,
                    });
                }
            }
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        contract: action.payload.contract,
                        xPosts: [...newPosts, ...activeData.xPosts]
                    }
                }
            };
        }
        case 'END_CONTRACT': {
            if (!state.activeArtistId) return state;
            const activeData = { ...state.artistsData[state.activeArtistId] };
            if (!activeData.contract) {
                return state;
            }

            const label = LABELS.find(l => l.id === activeData.contract!.labelId);
            if (label && label.contractType === 'petty') {
                const fine = Math.floor(Math.random() * 750001) + 250000;
                activeData.money -= fine;

                const takenDownReleaseIds = new Set<string>();
                activeData.releases = activeData.releases.map(release => {
                    if (release.releasingLabel?.name === label.name) {
                        takenDownReleaseIds.add(release.id);
                        return { ...release, isTakenDown: true };
                    }
                    return release;
                });

                activeData.songs = activeData.songs.map(song => {
                    if (song.releaseId && takenDownReleaseIds.has(song.releaseId)) {
                        return { ...song, isTakenDown: true };
                    }
                    return song;
                });

                const artistProfile = allPlayerArtistsAndGroups.find(a => a.id === state.activeArtistId);
                if (artistProfile) {
                    activeData.inbox.push({
                        id: crypto.randomUUID(),
                        sender: label.name,
                        senderIcon: 'label',
                        subject: 'Regarding Your Departure',
                        body: `Hi ${artistProfile.name},\n\nWe've processed your departure from the label. As per our agreement, a fine of $${formatNumber(fine)} has been deducted from your account.\n\nFurthermore, all projects released under our name have been removed from streaming services and digital storefronts.\n\nWe wish you the best in your future endeavors.\n\n- ${label.name}`,
                        date: state.date,
                        isRead: false,
                    });
                }
            }
            
            const updatedData = {
                ...activeData,
                contractHistory: [...(activeData.contractHistory || []), activeData.contract],
                contract: null,
            };

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData
                }
            };
        }
        case 'SUBMIT_TO_LABEL': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        labelSubmissions: [...activeData.labelSubmissions, action.payload.submission],
                    }
                }
            };
        }
        case 'GO_TO_LABEL_PLAN':
            return {
                ...state,
                activeSubmissionId: action.payload.submissionId,
                currentView: 'labelReleasePlan',
            };
        case 'PLAN_LABEL_RELEASE': {
            if (!state.activeArtistId) return state;
            const { submissionId, singles, projectReleaseDate } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const allCustomLabels: CustomLabel[] = [];
             for (const artistId in state.artistsData) {
                allCustomLabels.push(...state.artistsData[artistId].customLabels);
            }

            let labelMultiplier = 1;
            let avgQuality = 0;

            const submission = activeData.labelSubmissions.find(s => s.id === submissionId);
            if (submission) {
                avgQuality = submission.release.songIds.reduce((sum, id) => {
                    const song = activeData.songs.find(s => s.id === id);
                    return sum + (song?.quality || 0);
                }, 0) / (submission.release.songIds.length || 1);
            }

            if (activeData.contract) {
                let label: { promotionMultiplier: number } | undefined;
                if (activeData.contract.isCustom) {
                    label = allCustomLabels.find(l => l.id === activeData.contract!.labelId);
                } else {
                    label = LABELS.find(l => l.id === activeData.contract!.labelId);
                }
                if (label) {
                    labelMultiplier = label.promotionMultiplier;
                }
            }

            const releaseTypeMultiplier = submission?.release.type === 'Album' ? 2 : 1.25;
            const promoBudget = Math.floor((avgQuality * 5000) * labelMultiplier * releaseTypeMultiplier);

            const updatedSubmissions = activeData.labelSubmissions.map((sub): LabelSubmission => {
                if (sub.id === submissionId) {
                    return {
                        ...sub,
                        status: 'scheduled',
                        singlesToRelease: singles,
                        projectReleaseDate: projectReleaseDate,
                        promoBudget: promoBudget,
                        promoBudgetSpent: 0,
                    };
                }
                return sub;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        labelSubmissions: updatedSubmissions,
                    }
                },
                activeSubmissionId: null,
                currentView: 'game',
            };
        }
        case 'ACCEPT_GENIUS_OFFER': {
            if (!state.activeArtistId) return state;
            const { songId, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'geniusInterview') {
                    return {
                        ...email,
                        offer: { ...email.offer, isAccepted: true }
                    };
                }
                return email;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money + 100000,
                        inbox: updatedInbox,
                    }
                },
                activeGeniusOffer: { songId, emailId },
                currentView: 'createGeniusInterview',
            };
        }
        case 'CREATE_GENIUS_INTERVIEW': {
            if (!state.activeArtistId || !state.activeGeniusOffer) return state;
            const { video } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedSongs = activeData.songs.map(song => {
                if (song.id === state.activeGeniusOffer!.songId) {
                    return { ...song, pitchforkBoost: true };
                }
                return song;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        videos: [...activeData.videos, video],
                        songs: updatedSongs,
                        hype: Math.min(100, activeData.hype + 15),
                    }
                },
                activeGeniusOffer: null,
                currentView: 'youtube',
            };
        }
        case 'CANCEL_GENIUS_OFFER': {
            return {
                ...state,
                activeGeniusOffer: null,
                currentView: 'inbox',
            };
        }
        case 'ACCEPT_ONTHERADAR_OFFER': {
            if (!state.activeArtistId) return state;
            const { songId, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'onTheRadarOffer') {
                    return { ...email, offer: { ...email.offer, isAccepted: true } };
                }
                return email;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        hype: Math.min(1000, activeData.hype + 10),
                        inbox: updatedInbox,
                    }
                },
                activeOnTheRadarOffer: { songId, emailId },
                currentView: 'createOnTheRadarPerformance',
            };
        }
        case 'CREATE_ONTHERADAR_PERFORMANCE': {
            if (!state.activeArtistId || !state.activeOnTheRadarOffer) return state;
            const { video } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedSongs = activeData.songs.map(song => {
                if (song.id === state.activeOnTheRadarOffer!.songId) {
                    return { ...song, pitchforkBoost: true }; // Re-using for generic boost
                }
                return song;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        videos: [...activeData.videos, video],
                        songs: updatedSongs,
                        hype: Math.min(1000, activeData.hype + 20),
                    }
                },
                activeOnTheRadarOffer: null,
                currentView: 'youtube',
            };
        }
        case 'CANCEL_ONTHERADAR_OFFER': {
            return {
                ...state,
                activeOnTheRadarOffer: null,
                currentView: 'inbox',
            };
        }
        case 'ACCEPT_TRSHD_OFFER': {
            if (!state.activeArtistId) return state;
            const { songId, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'trshdOffer') {
                    return { ...email, offer: { ...email.offer, isAccepted: true } };
                }
                return email;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        hype: Math.min(1000, activeData.hype + 10),
                        inbox: updatedInbox,
                    }
                },
                activeTrshdOffer: { songId, emailId },
                currentView: 'createTrshdPerformance',
            };
        }
        case 'CREATE_TRSHD_PERFORMANCE': {
            if (!state.activeArtistId || !state.activeTrshdOffer) return state;
            const { video } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedSongs = activeData.songs.map(song => {
                if (song.id === state.activeTrshdOffer!.songId) {
                    return { ...song, pitchforkBoost: true }; // Re-using for generic boost
                }
                return song;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        videos: [...activeData.videos, video],
                        songs: updatedSongs,
                        hype: Math.min(1000, activeData.hype + 20),
                    }
                },
                activeTrshdOffer: null,
                currentView: 'youtube',
            };
        }
        case 'CANCEL_TRSHD_OFFER': {
            return {
                ...state,
                activeTrshdOffer: null,
                currentView: 'inbox',
            };
        }
        case 'ACCEPT_FALLON_OFFER': {
            if (!state.activeArtistId) return state;
            const { releaseId, offerType, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'fallonOffer') {
                    return { ...email, offer: { ...email.offer, isAccepted: true } };
                }
                return email;
            });

            const firstStepView = offerType === 'interview' ? 'createFallonInterview' : 'createFallonPerformance';
            const firstStep = offerType === 'interview' ? 'interview' : 'performance';

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                    }
                },
                activeFallonOffer: { releaseId, offerType, emailId, step: firstStep },
                currentView: firstStepView,
            };
        }
        case 'CREATE_FALLON_VIDEO': {
            if (!state.activeArtistId || !state.activeFallonOffer) return state;
            
            const { video, songId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const artistProfile = state.soloArtist || state.group;
            if (!artistProfile) return state;

            const updatedData: ArtistData = {
                ...activeData,
                videos: [...activeData.videos, video],
                hype: Math.min(100, activeData.hype + 25),
            };

            let postContent = '';
            let postImage: string | undefined = video.thumbnail;
            
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
                    id: crypto.randomUUID(),
                    authorId: 'popbase',
                    content: postContent,
                    image: postImage,
                    likes: Math.floor(Math.random() * 30000) + 15000,
                    retweets: Math.floor(Math.random() * 7000) + 2000,
                    views: Math.floor(Math.random() * 800000) + 200000,
                    date: state.date,
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
        case 'CANCEL_FALLON_OFFER': {
            return {
                ...state,
                activeFallonOffer: null,
                currentView: 'inbox',
            };
        }
        case 'ADD_ARTIST_IMAGE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (activeData.artistImages.length >= 100) return state;
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        artistImages: [...activeData.artistImages, action.payload]
                    }
                }
            };
        }
        case 'ADD_ARTIST_VIDEO': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (activeData.artistVideoThumbnails.length >= 10) return state;
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        artistVideoThumbnails: [...activeData.artistVideoThumbnails, action.payload]
                    }
                }
            };
        }
        case 'ADD_PAPARAZZI_PHOTO': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        paparazziPhotos: [...activeData.paparazziPhotos, action.payload.photo],
                    }
                }
            };
        }
        case 'ANSWER_POPBASE_QUESTION': {
            if (!state.activeArtistId) return state;
            const { emailId, answer } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const playerUser = activeData.xUsers.find(u => u.isPlayer);

            if (!playerUser) return state;

            const email = activeData.inbox.find(e => e.id === emailId);
            const offer = email?.offer as PopBaseOffer | undefined;

            if (!offer) return state;

            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type.startsWith('popBase')) {
                    return { ...email, offer: { ...email.offer, isAnswered: true } };
                }
                return email;
            });

            let popBaseContent = '';
            if (offer.type === 'popBaseClarification') {
                popBaseContent = `${playerUser.name} addresses recent controversy regarding ${offer.originalPostContent}:\n\n"${answer}"`;
            } else if (offer.type === 'popBaseInterview') {
                popBaseContent = `${playerUser.name} on ${offer.question?.toLowerCase()}:\n\n"${answer}"`;
            }

            if (!popBaseContent) return state;

            const newPost: XPost = { id: crypto.randomUUID(), authorId: 'popbase', content: popBaseContent, likes: Math.floor(Math.random() * 40000) + 20000, retweets: Math.floor(Math.random() * 8000) + 3000, views: Math.floor(Math.random() * 1000000) + 400000, date: state.date, };
            const hypeBoost = offer.isControversial ? 10 : 5;

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                        xPosts: [newPost, ...activeData.xPosts],
                        hype: Math.min(100, activeData.hype + hypeBoost),
                    }
                },
                currentView: 'inbox',
            };
        }
        case 'POST_ON_X': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            
            const playerUser = activeData.xUsers.find(u => u.isPlayer);
            if (!playerUser) return state;

            const baseFollowers = playerUser.followersCount || 1000;
            const popularityMultiplier = 1 + (activeData.popularity / 100);
            const views = Math.floor(baseFollowers * (Math.random() * 0.8 + 0.4) * popularityMultiplier + (activeData.hype * 1000));
            const likes = Math.floor(views * (Math.random() * 0.08 + 0.02)); // 2-10% of views
            const retweets = Math.floor(likes * (Math.random() * 0.15 + 0.05)); // 5-20% of likes

            const { content, image, postType, targetId, songId } = action.payload;
            let postContent = content;

            if (postType === 'push' && songId) {
                const song = activeData.songs.find(s => s.id === songId);
                if (song) {
                    postContent = content.trim() ? content : `push ${song.title} to top 10 on iTunes`;
                }
            }

            const newPost: XPost = {
                id: crypto.randomUUID(),
                authorId: playerUser.id,
                content: postContent,
                image: image,
                likes: likes,
                retweets: retweets,
                views: views,
                date: state.date,
            };

            const updatedData: ArtistData = {
                ...activeData,
                xPosts: [newPost, ...activeData.xPosts],
            };

            if (postType === 'fanWar' && targetId) {
                updatedData.fanWarStatus = {
                    targetArtistName: targetId,
                    weeksRemaining: 4 // Fan wars last 4 weeks
                };
            }

            return {
                ...state,
                artistsData: { ...state.artistsData, [state.activeArtistId]: updatedData },
            };
        }
        case 'VIEW_X_PROFILE':
            return { ...state, selectedXUserId: action.payload, currentView: 'xProfile' };
        case 'VIEW_X_CHAT':
            return { ...state, selectedXChatId: action.payload, currentView: 'xChatDetail' };
        case 'FOLLOW_X_USER': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (activeData.xFollowingIds.includes(action.payload)) return state;
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        xFollowingIds: [...activeData.xFollowingIds, action.payload],
                    }
                }
            };
        }
        case 'UNFOLLOW_X_USER': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        xFollowingIds: activeData.xFollowingIds.filter(id => id !== action.payload),
                    }
                }
            };
        }
        case 'SEND_X_MESSAGE': {
             if (!state.activeArtistId) return state;
            const { chatId, message } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedChats = activeData.xChats.map(chat => {
                if (chat.id === chatId) {
                    return { ...chat, messages: [...chat.messages, message] };
                }
                return chat;
            });

            return {
                ...state,
                 artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        xChats: updatedChats,
                    }
                }
            };
        }
        case 'APPEAL_X_SUSPENSION': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
        
            if (activeData.xSuspensionStatus && activeData.xSuspensionStatus.isSuspended && !activeData.xSuspensionStatus.appealSentDate) {
                const updatedSuspensionStatus = {
                    ...activeData.xSuspensionStatus,
                    appealSentDate: state.date,
                };
                return {
                    ...state,
                    artistsData: {
                        ...state.artistsData,
                        [state.activeArtistId]: {
                            ...activeData,
                            xSuspensionStatus: updatedSuspensionStatus,
                        }
                    }
                };
            }
            return state;
        }
        case 'SET_ARTIST_PICK': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        artistPick: action.payload
                    }
                }
            };
        }
        case 'PITCH_TO_PLAYLIST': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (activeData.money < PLAYLIST_PITCH_COST) return state;

            let updatedSongs = [...activeData.songs];

            if (Math.random() < PLAYLIST_PITCH_SUCCESS_RATE) {
                // Success
                updatedSongs = updatedSongs.map(song => {
                    if (song.id === action.payload.songId) {
                        return { ...song, playlistBoostWeeks: PLAYLIST_BOOST_WEEKS };
                    }
                    return song;
                });
            }

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - PLAYLIST_PITCH_COST,
                        songs: updatedSongs,
                    }
                }
            };
        }
        case 'CREATE_CUSTOM_LABEL': {
            if (!state.activeArtistId) return state;
            const { label, cost, membersToSign } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            // Create contract for owner
            const ownerContract: Contract = {
                labelId: label.id,
                isCustom: true,
                artistId: state.activeArtistId,
                startDate: state.date,
                albumsReleased: 0,
            };

            const updatedArtistsData = { ...state.artistsData };

            const artist = allPlayerArtistsAndGroups.find(a => a.id === state.activeArtistId);
            let newPosts: XPost[] = [];

            if(artist) {
                const playerUser = activeData.xUsers.find(u => u.isPlayer);
                if (playerUser) {
                    let content = `${artist.name} is starting their own record label, "${label.name}". Boss moves.`;
                    if (label.dealWithMajorId) {
                        const major = LABELS.find(l => l.id === label.dealWithMajorId);
                        content = `${artist.name} is launching a new imprint, "${label.name}", in partnership with ${major?.name}.`;
                    }
                    newPosts.push({
                        id: crypto.randomUUID(),
                        authorId: 'tmz',
                        content,
                        image: playerUser.avatar,
                        likes: Math.floor(Math.random() * 5000) + 1000,
                        retweets: Math.floor(Math.random() * 1000) + 200,
                        views: Math.floor(Math.random() * 400000) + 150000,
                        date: state.date,
                    });
                }
            }


            // Update owner's data
            updatedArtistsData[state.activeArtistId] = {
                ...activeData,
                customLabels: [...activeData.customLabels, label],
                money: activeData.money - cost,
                contract: ownerContract,
                xPosts: [...newPosts, ...activeData.xPosts],
            };

            // Create contracts for signed members
            for (const memberId of membersToSign) {
                const memberData = state.artistsData[memberId];
                if (memberData) {
                    const memberContract: Contract = {
                        labelId: label.id,
                        isCustom: true,
                        artistId: memberId,
                        startDate: state.date,
                        albumsReleased: 0,
                    };
                    updatedArtistsData[memberId] = {
                        ...memberData,
                        contract: memberContract,
                    };
                }
            }

            return {
                ...state,
                artistsData: updatedArtistsData,
                currentView: 'game',
                activeTab: 'Business',
            };
        }
        case 'DELETE_SONG': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedSongs = activeData.songs.filter(song => song.id !== action.payload.songId);
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        songs: updatedSongs,
                    }
                }
            };
        }
        case 'GO_TO_ALBUM_PROMO':
            return {
                ...state,
                activeSubmissionId: action.payload.submissionId,
                currentView: 'albumPromo',
            };
        case 'LAUNCH_COUNTDOWN_PAGE': {
            if (!state.activeArtistId) return state;
            const { submissionId, cost } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
        
            const updatedSubmissions = activeData.labelSubmissions.map(sub => {
                if (sub.id === submissionId) {
                    return {
                        ...sub,
                        hasCountdownPage: true,
                        promoBudgetSpent: (sub.promoBudgetSpent || 0) + cost,
                    };
                }
                return sub;
            });
        
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        labelSubmissions: updatedSubmissions,
                    }
                }
            };
        }
        case 'REQUEST_GENIUS_PROMO': {
            if (!state.activeArtistId) return state;
            const { submissionId, songId, cost } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
        
            const updatedSubmissions = activeData.labelSubmissions.map(sub => {
                if (sub.id === submissionId) {
                    return {
                        ...sub,
                        geniusInterviewRequestedForSongId: songId,
                        promoBudgetSpent: (sub.promoBudgetSpent || 0) + cost,
                    };
                }
                return sub;
            });
        
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        labelSubmissions: updatedSubmissions,
                    }
                }
            };
        }
        case 'REQUEST_FALLON_PROMO': {
            if (!state.activeArtistId) return state;
            const { submissionId, songId, cost } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
        
            const updatedSubmissions = activeData.labelSubmissions.map(sub => {
                if (sub.id === submissionId) {
                    return {
                        ...sub,
                        fallonPerformanceRequestedForSongId: songId,
                        promoBudgetSpent: (sub.promoBudgetSpent || 0) + cost,
                    };
                }
                return sub;
            });
        
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        labelSubmissions: updatedSubmissions,
                    }
                }
            };
        }
        case 'RESET_GAME':
            return initialState;
        case 'LOAD_GAME':
            return action.payload;
        case 'UNLOCK_RED_MIC_PRO': {
            if (!state.activeArtistId) return state;
            const { type, cost } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const newRedMicProState: RedMicProState = {
                unlocked: true,
                subscriptionType: type,
                hypeMode: 'locked',
            };

            if (type === 'yearly') {
                newRedMicProState.subscriptionEndDate = { week: state.date.week, year: state.date.year + 1 };
            }

            const updatedData: ArtistData = {
                ...activeData,
                money: activeData.money - cost,
                hype: 1000,
                redMicPro: newRedMicProState,
            };

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData,
                },
            };
        }
        case 'UPDATE_SONG_QUALITY': {
            if (!state.activeArtistId) return state;
            const { songId, newQuality } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            
            const clampedQuality = Math.max(0, Math.min(100, newQuality));

            const updatedSongs = activeData.songs.map(song =>
                song.id === songId ? { ...song, quality: clampedQuality } : song
            );
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, songs: updatedSongs },
                },
            };
        }
        case 'SET_MONEY': {
            if (!state.activeArtistId) return state;
            const { newAmount } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, money: newAmount },
                },
            };
        }
        case 'TOGGLE_GOLD_THEME': {
            if (!state.activeArtistId) return state;
            const { enabled } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, isGoldTheme: enabled },
                },
            };
        }
        case 'SET_SALES_BOOST': {
            if (!state.activeArtistId) return state;
            const { newBoost } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, salesBoost: newBoost },
                },
            };
        }
        case 'PRO_SIGN_LABEL': {
            if (!state.activeArtistId) return state;
            const { labelId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            
            const newContract: Contract = {
                labelId,
                artistId: state.activeArtistId,
                startDate: state.date,
                durationWeeks: 156, // 3 years
                albumQuota: 3,
                albumsReleased: 0,
            };

            const artist = allPlayerArtistsAndGroups.find(a => a.id === state.activeArtistId);
            const label = LABELS.find(l => l.id === labelId);
            let newPosts: XPost[] = [];

            if (label && artist) {
                const playerUser = activeData.xUsers.find(u => u.isPlayer);
                if(playerUser) {
                    newPosts.push({
                        id: crypto.randomUUID(),
                        authorId: 'tmz',
                        content: `${artist.name} has inked a major deal with ${label.name}. Big things coming.`,
                        image: playerUser.avatar,
                        likes: Math.floor(Math.random() * 5000) + 1000,
                        retweets: Math.floor(Math.random() * 1000) + 200,
                        views: Math.floor(Math.random() * 400000) + 150000,
                        date: state.date,
                    });
                }
            }

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { 
                        ...activeData, 
                        contract: newContract,
                        xPosts: [...newPosts, ...activeData.xPosts]
                    },
                },
            };
        }
        case 'UPDATE_WIKIPEDIA_SUMMARY': {
            if (!state.activeArtistId) return state;
            const { releaseId, summary } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedReleases = activeData.releases.map(r => 
                r.id === releaseId ? { ...r, wikipediaSummary: summary } : r
            );

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        releases: updatedReleases,
                    }
                }
            };
        }
        case 'GO_TO_GRAMMY_SUBMISSIONS': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === action.payload.emailId) {
                    return { ...email, isRead: true };
                }
                return email;
            });
            return { 
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                    }
                },
                currentView: 'submitForGrammys' 
            };
        }
        case 'SUBMIT_FOR_GRAMMYS': {
            if (!state.activeArtistId) return state;
            const { submissions, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'grammySubmission') {
                    return { ...email, offer: { ...email.offer, isSubmitted: true }};
                }
                return email;
            });

            const bnaSubmission = submissions.find(s => s.category === 'Best New Artist');
            const hasSubmittedBna = bnaSubmission ? true : activeData.hasSubmittedForBestNewArtist;

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                        hasSubmittedForBestNewArtist: hasSubmittedBna
                    }
                },
                grammySubmissions: [...state.grammySubmissions, ...submissions],
                currentView: 'game'
            };
        }
        case 'ACCEPT_GRAMMY_PERFORMANCE': {
            if (!state.activeArtistId) return state;
            return {
                ...state,
                activeGrammyPerformanceOffer: { emailId: action.payload.emailId },
                currentView: 'createGrammyPerformance',
            };
        }
        case 'CREATE_GRAMMY_PERFORMANCE': {
            if (!state.activeArtistId || !state.activeGrammyPerformanceOffer) return state;
            const { video } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === state.activeGrammyPerformanceOffer!.emailId && email.offer?.type === 'grammyNominations') {
                    return { ...email, offer: { ...email.offer, isPerformanceAccepted: true }};
                }
                return email;
            });
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        videos: [...activeData.videos, video],
                        hype: Math.min(100, activeData.hype + 30),
                        inbox: updatedInbox,
                    }
                },
                activeGrammyPerformanceOffer: null,
                currentView: 'game',
            };
        }
        case 'DECLINE_GRAMMY_PERFORMANCE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === action.payload.emailId && email.offer?.type === 'grammyNominations') {
                    return { ...email, offer: { ...email.offer, isPerformanceAccepted: false }};
                }
                return email;
            });
            return {
                ...state,
                artistsData: { ...state.artistsData, [state.activeArtistId]: { ...activeData, inbox: updatedInbox }},
                currentView: 'inbox',
            };
        }
        case 'ACCEPT_GRAMMY_RED_CARPET': {
            if (!state.activeArtistId) return state;
            const { emailId, lookUrl } = action.payload;

            if (lookUrl) { 
                const artistName = state.soloArtist?.name || state.group?.name;
                const popBasePost: XPost = {
                    id: crypto.randomUUID(),
                    authorId: 'popbase',
                    content: `${artistName} arrives at the #GRAMMYs red carpet.`,
                    image: lookUrl,
                    likes: Math.floor(Math.random() * 99000) + 16000,
                    retweets: Math.floor(Math.random() * 16000) + 7000,
                    views: Math.floor(Math.random() * 3100000) + 1200000,
                    date: state.date,
                };
                const activeData = state.artistsData[state.activeArtistId];
                const updatedInbox = activeData.inbox.map(email => {
                    if (email.id === emailId && email.offer?.type === 'grammyRedCarpet') {
                        return { ...email, offer: { ...email.offer, isAttending: true }};
                    }
                    return email;
                });

                return {
                    ...state,
                    artistsData: {
                        ...state.artistsData,
                        [state.activeArtistId]: {
                            ...activeData,
                            inbox: updatedInbox,
                            xPosts: [popBasePost, ...activeData.xPosts]
                        }
                    },
                    activeGrammyRedCarpetOffer: null,
                    currentView: 'game',
                };
            } else { 
                 return {
                    ...state,
                    activeGrammyRedCarpetOffer: { emailId },
                    currentView: 'grammyRedCarpet',
                };
            }
        }
        case 'DECLINE_GRAMMY_RED_CARPET': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === action.payload.emailId && email.offer?.type === 'grammyRedCarpet') {
                    return { ...email, offer: { ...email.offer, isAttending: false }};
                }
                return email;
            });
            return {
                ...state,
                artistsData: { ...state.artistsData, [state.activeArtistId]: { ...activeData, inbox: updatedInbox }},
                currentView: 'inbox',
                activeGrammyRedCarpetOffer: null
            };
        }
        case 'GO_TO_OSCAR_SUBMISSIONS': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === action.payload.emailId) {
                    return { ...email, isRead: true };
                }
                return email;
            });
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                    }
                },
                currentView: 'submitForOscars'
            };
        }
        case 'SUBMIT_FOR_OSCARS': {
            if (!state.activeArtistId) return state;
            const { submissions, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'oscarSubmission') {
                    return { ...email, offer: { ...email.offer, isSubmitted: true }};
                }
                return email;
            });
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                    }
                },
                oscarSubmissions: [...state.oscarSubmissions, ...submissions],
                currentView: 'game'
            };
        }
        case 'ACCEPT_OSCAR_PERFORMANCE': {
            if (!state.activeArtistId) return state;
            return {
                ...state,
                activeOscarPerformanceOffer: { emailId: action.payload.emailId },
                currentView: 'createOscarPerformance',
            };
        }
        case 'CREATE_OSCAR_PERFORMANCE': {
            if (!state.activeArtistId || !state.activeOscarPerformanceOffer) return state;
            const { video } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === state.activeOscarPerformanceOffer!.emailId && email.offer?.type === 'oscarNominations') {
                    return { ...email, offer: { ...email.offer, isPerformanceAccepted: true }};
                }
                return email;
            });
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        videos: [...activeData.videos, video],
                        hype: Math.min(100, activeData.hype + 40),
                        inbox: updatedInbox,
                    }
                },
                activeOscarPerformanceOffer: null,
                currentView: 'game',
            };
        }
        case 'DECLINE_OSCAR_PERFORMANCE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === action.payload.emailId && email.offer?.type === 'oscarNominations') {
                    return { ...email, offer: { ...email.offer, isPerformanceAccepted: false }};
                }
                return email;
            });
            return {
                ...state,
                artistsData: { ...state.artistsData, [state.activeArtistId]: { ...activeData, inbox: updatedInbox }},
                activeOscarPerformanceOffer: null,
                currentView: 'inbox',
            };
        }
        case 'RENEW_CONTRACT': {
            if (!state.contractRenewalOffer) return state;
            const { labelId, isCustom, artistId } = state.contractRenewalOffer;
            const artistData = state.artistsData[artistId];
            if (!artistData) return state;
    
            const newContract: Contract = {
                labelId,
                isCustom,
                artistId,
                startDate: state.date,
                durationWeeks: 104, // 2 years
                albumQuota: 2, // A standard renewal deal
                albumsReleased: 0,
            };
    
            const updatedData = { ...artistData, contract: newContract };
    
            return {
                ...state,
                artistsData: { ...state.artistsData, [artistId]: updatedData },
                contractRenewalOffer: null,
                currentView: 'game',
            };
        }
        case 'GO_INDEPENDENT': {
            if (!state.contractRenewalOffer) return state;
            const { artistId } = state.contractRenewalOffer;
            const artistData = state.artistsData[artistId];
            if (!artistData || !artistData.contract) return state;
            
            const updatedData = { 
                ...artistData, 
                contractHistory: [...(artistData.contractHistory || []), artistData.contract],
                contract: null 
            };
    
            return {
                ...state,
                artistsData: { ...state.artistsData, [artistId]: updatedData },
                contractRenewalOffer: null,
                currentView: 'game',
            };
        }
        case 'UPDATE_ARTIST_IMAGE': {
            const { artistId, newImage } = action.payload;
            const newState = { ...state };

            // Update solo artist
            if (newState.soloArtist?.id === artistId) {
                newState.soloArtist = { ...newState.soloArtist, image: newImage };
            }

            // Update group or group member
            if (newState.group) {
                if (newState.group.id === artistId) {
                    newState.group = { ...newState.group, image: newImage };
                } else {
                    const memberIndex = newState.group.members.findIndex(m => m.id === artistId);
                    if (memberIndex > -1) {
                        const updatedMembers = [...newState.group.members];
                        updatedMembers[memberIndex] = { ...updatedMembers[memberIndex], image: newImage };
                        newState.group = { ...newState.group, members: updatedMembers };
                    }
                }
            }

            // Update XUser avatar in the corresponding artistsData
            const artistDataToUpdate = newState.artistsData[artistId];
            if (artistDataToUpdate) {
                const updatedXUsers = artistDataToUpdate.xUsers.map(user =>
                    user.id === artistId ? { ...user, avatar: newImage } : user
                );
                newState.artistsData = {
                    ...newState.artistsData,
                    [artistId]: {
                        ...artistDataToUpdate,
                        xUsers: updatedXUsers,
                    },
                };
            }
            
            return newState;
        }
        case 'CREATE_ONLYFANS_PROFILE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        onlyfans: action.payload.profile,
                    }
                },
                currentView: 'onlyfans',
            };
        }
        case 'UPDATE_ONLYFANS_SETTINGS': {
            if (!state.activeArtistId || !state.artistsData[state.activeArtistId].onlyfans) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        onlyfans: {
                            ...activeData.onlyfans!,
                            subscriptionPrice: action.payload.price
                        }
                    }
                }
            };
        }
        case 'CREATE_ONLYFANS_POST': {
            if (!state.activeArtistId || !state.artistsData[state.activeArtistId].onlyfans) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const ofProfile = activeData.onlyfans!;
            
            // Calculate initial engagement and income
            const initialLikes = Math.floor(ofProfile.subscribers * (Math.random() * 0.15 + 0.10)); // 10-25% engage on new post
            const initialComments = Math.floor(initialLikes / (Math.random() * 15 + 10));
            const initialTips = initialLikes * (Math.random() * 0.1); // Tip rate is higher for new posts
            
            let postPurchaseIncome = 0;
            if (action.payload.post.price > 0) {
                 // 15-30% of subscribers buy it
                const purchaseRate = Math.random() * 0.15 + 0.15;
                postPurchaseIncome = action.payload.post.price * Math.floor(ofProfile.subscribers * purchaseRate);
            }

            const newPost: OnlyFansPost = { ...action.payload.post, likes: initialLikes, comments: initialComments, tips: initialTips };

            const postGrossIncome = postPurchaseIncome + initialTips;
            const postNetIncome = postGrossIncome * 0.8; // 80% cut
            
            const yearMonth = `${state.date.year}-${String(Math.floor(state.date.week/4)).padStart(2, '0')}`;
            const updatedEarningsByMonth = { ...ofProfile.earningsByMonth };
            if(!updatedEarningsByMonth[yearMonth]) {
                updatedEarningsByMonth[yearMonth] = { gross: 0, net: 0 };
            }
            updatedEarningsByMonth[yearMonth].gross += postGrossIncome;
            updatedEarningsByMonth[yearMonth].net += postNetIncome;

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money + postNetIncome, // Add income immediately
                        onlyfans: {
                            ...ofProfile,
                            posts: [newPost, ...ofProfile.posts],
                            totalGross: ofProfile.totalGross + postGrossIncome,
                            totalNet: ofProfile.totalNet + postNetIncome,
                            earningsByMonth: updatedEarningsByMonth,
                        }
                    }
                }
            };
        }
        case 'ACCEPT_ONLYFANS_REQUEST': {
            if (!state.activeArtistId) return state;
            const { emailId, payout } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'onlyfansRequest') {
                    return { ...email, offer: { ...email.offer, isFulfilled: true } };
                }
                return email;
            });
            
            const updatedData: ArtistData = { ...activeData, inbox: updatedInbox, money: activeData.money + payout };

            if (updatedData.onlyfans) {
                const ONLYFANS_CUT = 0.2;
                const grossPayout = payout / (1 - ONLYFANS_CUT); // Back-calculate gross from net payout
                updatedData.onlyfans.totalGross += grossPayout;
                updatedData.onlyfans.totalNet += payout;
                
                const yearMonth = `${state.date.year}-${String(Math.floor(state.date.week/4)).padStart(2, '0')}`;
                if(!updatedData.onlyfans.earningsByMonth[yearMonth]) {
                    updatedData.onlyfans.earningsByMonth[yearMonth] = { gross: 0, net: 0 };
                }
                updatedData.onlyfans.earningsByMonth[yearMonth].gross += grossPayout;
                updatedData.onlyfans.earningsByMonth[yearMonth].net += payout;
            }

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData,
                },
                currentView: 'inbox',
            };
        }
        case 'SET_PRO_HYPE_MODE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (!activeData.redMicPro.unlocked) return state;

            const newHype = action.payload === 'locked' ? 1000 : activeData.hype;

            const updatedData: ArtistData = {
                ...activeData,
                hype: newHype,
                redMicPro: {
                    ...activeData.redMicPro,
                    hypeMode: action.payload,
                }
            };
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData
                }
            };
        }
        case 'SET_HYPE': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (!activeData.redMicPro.unlocked || (activeData.redMicPro.hypeMode || 'locked') !== 'manual') return state;
            
            const updatedData: ArtistData = {
                ...activeData,
                hype: Math.max(0, action.payload),
            };
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData
                }
            };
        }
        case 'SET_POPULARITY': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (!activeData.redMicPro.unlocked) return state;

            const updatedData: ArtistData = {
                ...activeData,
                popularity: Math.max(0, Math.min(100, action.payload)),
            };
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData
                }
            };
        }
        case 'UPDATE_RELEASE_COVER_ART': {
            if (!state.activeArtistId) return state;
            const { releaseId, newCoverArt } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const updatedReleases = activeData.releases.map(r => 
                r.id === releaseId ? { ...r, coverArt: newCoverArt } : r
            );

            // Also update cover art for songs that might be using the album art
            const updatedSongs = activeData.songs.map(s => {
                if (s.releaseId === releaseId) {
                    return { ...s, coverArt: newCoverArt };
                }
                return s;
            });

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        releases: updatedReleases,
                        songs: updatedSongs,
                    }
                }
            };
        }
        case 'ACCEPT_SOUNDTRACK_OFFER': {
            if (!state.activeArtistId) return state;
            const { albumTitle, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'soundtrackOffer') {
                    return { ...email, offer: { ...email.offer, isAccepted: true } };
                }
                return email;
            });
        
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox,
                    }
                },
                activeSoundtrackOffer: { albumTitle, emailId },
                currentView: 'createSoundtrack',
            };
        }
        case 'CREATE_SOUNDTRACK_CONTRIBUTION': {
            if (!state.activeArtistId) return state;
            const { albumTitle, coverArt, songIds } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];

            const playerTracks: SoundtrackTrack[] = songIds.map(songId => {
                const song = activeData.songs.find(s => s.id === songId)!;
                return {
                    isPlayerSong: true,
                    songId: song.id,
                    title: song.title,
                    artist: state.soloArtist?.name || state.group?.name || 'Artist',
                    streams: 0,
                    lastWeekStreams: 0,
                    prevWeekStreams: 0,
                    duration: song.duration,
                    explicit: song.explicit,
                };
            });
            
            const npcTracks: SoundtrackTrack[] = state.npcs.slice(0, 7).map(npc => ({
                isPlayerSong: false,
                songId: npc.uniqueId,
                title: npc.title,
                artist: npc.artist,
                streams: 0,
                lastWeekStreams: 0,
                prevWeekStreams: 0,
                duration: 180 + Math.floor(Math.random() * 60),
                explicit: Math.random() > 0.7,
            }));
            
            const allTracks = [...playerTracks, ...npcTracks].sort(() => Math.random() - 0.5);

            const newSoundtrack: SoundtrackAlbum = {
                id: crypto.randomUUID(),
                title: albumTitle,
                coverArt,
                tracks: allTracks,
                releaseDate: state.date,
                label: 'Major Film Studio',
                artistId: state.activeArtistId,
                isReleased: true,
            };
            
            const newRelease: Release = {
                id: crypto.randomUUID(),
                title: albumTitle,
                type: 'Album',
                coverArt: coverArt,
                songIds: songIds,
                releaseDate: state.date,
                artistId: state.activeArtistId,
                soundtrackInfo: { albumTitle },
            };
            
            const updatedSongs = activeData.songs.map(song => {
                if (songIds.includes(song.id)) {
                    return {
                        ...song,
                        isReleased: true,
                        soundtrackTitle: albumTitle,
                        releaseId: newRelease.id,
                    };
                }
                return song;
            });

            return {
                ...state,
                soundtrackAlbums: [...state.soundtrackAlbums, newSoundtrack],
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        songs: updatedSongs,
                        releases: [...activeData.releases, newRelease],
                    }
                },
                activeSoundtrackOffer: null,
                selectedSoundtrackId: newSoundtrack.id,
                currentView: 'spotifySoundtrackDetail',
            };
        }
        case 'CANCEL_SOUNDTRACK_OFFER': {
            return {
                ...state,
                activeSoundtrackOffer: null,
                currentView: 'inbox',
            };
        }
        case 'ACCEPT_FEATURE_OFFER': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const { emailId, ...offerDetails } = action.payload;

            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'featureOffer') {
                    return { ...email, offer: { ...email.offer, isAccepted: true } };
                }
                return email;
            });
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        inbox: updatedInbox
                    }
                },
                activeFeatureOffer: { ...offerDetails, emailId },
                currentView: 'createFeature',
            };
        }
        case 'CANCEL_FEATURE_OFFER': {
            return {
                ...state,
                activeFeatureOffer: null,
                currentView: 'inbox',
            };
        }
        case 'CREATE_FEATURE_SONG': {
            if (!state.activeArtistId || !state.activeFeatureOffer) return state;
            
            const activeData = state.artistsData[state.activeArtistId];
            const activeArtist = allPlayerArtistsAndGroups.find(a => a.id === state.activeArtistId);
            if (!activeArtist) return state;

            const { songTitle, coverArt, releaseDate } = action.payload;
            const { npcArtistName, payout, songQuality, promotion } = state.activeFeatureOffer;

            const newNpcSong: NpcSong = {
                uniqueId: `playerfeat_${crypto.randomUUID()}`,
                title: `${songTitle} (feat. ${activeArtist.name})`,
                artist: npcArtistName,
                genre: GENRES[Math.floor(Math.random() * GENRES.length)],
                basePopularity: songQuality * 100000,
                featuring: activeArtist.name,
                isPlayerFeature: true,
                coverArt: coverArt,
                isReleased: false,
                releaseDate: releaseDate,
                promotion: promotion ? { name: promotion.name, boost: 2.0 } : undefined,
                promoWeeksLeft: promotion ? promotion.durationWeeks : undefined,
            };

            const updatedData = {
                ...activeData,
                money: activeData.money + payout,
            };

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData
                },
                npcs: [...state.npcs, newNpcSong],
                activeFeatureOffer: null,
                currentView: 'game'
            };
        }
        case 'SELECT_SOUNDTRACK': {
             return {
                ...state,
                selectedSoundtrackId: action.payload,
                currentView: 'spotifySoundtrackDetail',
            };
        }
        case 'CREATE_TOUR': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        tours: [...activeData.tours, action.payload]
                    }
                }
            };
        }
        case 'START_TOUR': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedTours = activeData.tours.map(tour => {
                if (tour.id === action.payload.tourId) {
                    // Only start a tour if it's in 'planning' status
                    return tour.status === 'planning' ? { ...tour, status: 'active' as 'active' } : tour;
                }
                return tour;
            });
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        tours: updatedTours,
                    }
                },
                activeTourId: action.payload.tourId,
            };
        }
        case 'UPLOAD_TOUR_PHOTO': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            if (activeData.tourPhotos.length >= 9) return state;

            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        tourPhotos: [...activeData.tourPhotos, action.payload]
                    }
                }
            }
        }
        case 'SELECT_TOUR':
            return {
                ...state,
                activeTourId: action.payload,
            };
        case 'HIRE_MANAGER': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const manager = MANAGERS.find(m => m.id === action.payload.managerId);
            if (!manager || activeData.money < manager.yearlyCost) return state;
        
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        money: activeData.money - manager.yearlyCost,
                        popularity: Math.min(100, activeData.popularity + manager.popularityBoost),
                        manager: {
                            id: manager.id,
                            contractEndDate: { week: state.date.week, year: state.date.year + 1 }
                        }
                    }
                },
            };
        }
        case 'FIRE_MANAGER': {
            if (!state.activeArtistId || !state.artistsData[state.activeArtistId].manager) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const manager = MANAGERS.find(m => m.id === activeData.manager!.id);
        
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        popularity: Math.max(0, activeData.popularity - (manager?.popularityBoost || 0)),
                        manager: null,
                    }
                },
            };
        }
        case 'HIRE_SECURITY': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            const team = SECURITY_TEAMS.find(s => s.id === action.payload.teamId);
            if (!team || activeData.money < team.weeklyCost) return state;
            
            const updatedData = {
                ...activeData,
                money: activeData.money - team.weeklyCost,
                securityTeamId: team.id,
            };
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData,
                }
            };
        }
        case 'FIRE_SECURITY': {
            if (!state.activeArtistId) return state;
            const activeData = state.artistsData[state.activeArtistId];
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: {
                        ...activeData,
                        securityTeamId: null,
                    }
                }
            };
        }
        case 'UPDATE_NPC_X_USER': {
            const { userId, newName, newUsername } = action.payload;
            const updatedArtistsData = { ...state.artistsData };

            for (const artistId in updatedArtistsData) {
                const artistData = updatedArtistsData[artistId];
                const updatedXUsers = artistData.xUsers.map(user =>
                    user.id === userId ? { ...user, name: newName, username: newUsername } : user
                );
                updatedArtistsData[artistId] = {
                    ...artistData,
                    xUsers: updatedXUsers,
                };
            }

            return {
                ...state,
                artistsData: updatedArtistsData,
            };
        }
        case 'VIEW_PAST_LABEL_CHANNEL': {
            return {
                ...state,
                viewingPastLabelId: action.payload,
                activeYoutubeChannel: 'label',
                currentView: 'youtube'
            };
        }
        case 'UPDATE_NPC_AVATAR': {
            const { userId, newAvatar } = action.payload;
            const updatedArtistsData = { ...state.artistsData };

            for (const artistId in updatedArtistsData) {
                const artistData = updatedArtistsData[artistId];
                const updatedXUsers = artistData.xUsers.map(user =>
                    user.id === userId ? { ...user, avatar: newAvatar } : user
                );
                updatedArtistsData[artistId] = {
                    ...artistData,
                    xUsers: updatedXUsers,
                };
            }

            return {
                ...state,
                artistsData: updatedArtistsData,
            };
        }
        case 'ACCEPT_VOGUE_OFFER': {
            if (!state.activeArtistId) return state;
            const { magazine, emailId } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const updatedInbox = activeData.inbox.map(email => {
                if (email.id === emailId && email.offer?.type === 'vogueOffer') {
                    return { ...email, offer: { ...email.offer, isAccepted: true } };
                }
                return email;
            });
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: { ...activeData, inbox: updatedInbox },
                },
                activeVogueOffer: { magazine, emailId },
                currentView: 'createVogueFeature'
            };
        }
        case 'CANCEL_VOGUE_OFFER': {
            return {
                ...state,
                activeVogueOffer: null,
                currentView: 'inbox',
            };
        }
        case 'CREATE_VOGUE_FEATURE': {
            if (!state.activeArtistId || !state.activeVogueOffer) return state;
            const { photoshoot } = action.payload;
            const activeData = state.artistsData[state.activeArtistId];
            const activeArtist = state.soloArtist || state.group;
            if (!activeArtist) return state;
    
            const newPosts: XPost[] = [];
    
            // PopBase posts
            newPosts.push({
                id: crypto.randomUUID(),
                authorId: 'popbase',
                content: `${activeArtist.name} is gorgeous on the cover of ${photoshoot.magazine}.`,
                image: photoshoot.coverImage,
                likes: Math.floor(Math.random() * 40000) + 25000,
                retweets: Math.floor(Math.random() * 8000) + 4000,
                views: Math.floor(Math.random() * 800000) + 300000,
                date: state.date
            });
    
            newPosts.push({
                id: crypto.randomUUID(),
                authorId: 'popbase',
                content: `${activeArtist.name} looks flawless for ${photoshoot.magazine}.`,
                image: photoshoot.photoshootImages[0], // Use one of the photoshoot images
                likes: Math.floor(Math.random() * 20000) + 10000,
                retweets: Math.floor(Math.random() * 3000) + 1000,
                views: Math.floor(Math.random() * 400000) + 150000,
                date: state.date
            });
            
            const interviewAnswer = photoshoot.interviewAnswers[0]; // Take the first Q&A
            newPosts.push({
                id: crypto.randomUUID(),
                authorId: 'popbase',
                content: `${activeArtist.name} tells ${photoshoot.magazine} the craziest rumor they have heard about themself:\n\n“${interviewAnswer.answer}”`,
                image: photoshoot.photoshootImages[1],
                likes: Math.floor(Math.random() * 80000) + 50000,
                retweets: Math.floor(Math.random() * 10000) + 5000,
                views: Math.floor(Math.random() * 5000000) + 1000000,
                date: state.date
            });
    
            // TMZ post (shady)
            const shadyComments = [
                `Is that... hair? ${activeArtist.name}'s new ${photoshoot.magazine} cover has people talking, and not in a good way.`,
                `Sources say ${activeArtist.name} was a nightmare on the set of their ${photoshoot.magazine} shoot. Diva alert?`,
                `Another magazine cover for ${activeArtist.name}. Groundbreaking. 🙄`,
                `Someone's trying hard to stay relevant. ${activeArtist.name}'s ${photoshoot.magazine} spread is... a choice.`
            ];
            
            newPosts.push({
                id: crypto.randomUUID(),
                authorId: 'tmz',
                content: shadyComments[Math.floor(Math.random() * shadyComments.length)],
                image: photoshoot.coverImage,
                likes: Math.floor(Math.random() * 5000) + 1000,
                retweets: Math.floor(Math.random() * 1500) + 500,
                views: Math.floor(Math.random() * 400000) + 100000,
                date: state.date
            });
    
            const updatedData = {
                ...activeData,
                voguePhotoshoots: [...(activeData.voguePhotoshoots || []), photoshoot],
                xPosts: [...newPosts, ...activeData.xPosts],
                hype: Math.min(1000, activeData.hype + 50),
                popularity: Math.min(100, activeData.popularity + 5),
            };
            
            return {
                ...state,
                artistsData: {
                    ...state.artistsData,
                    [state.activeArtistId]: updatedData,
                },
                activeVogueOffer: null,
                currentView: 'game',
            };
        }
        default:
            return state;
    }
};

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [gameState, dispatch] = useReducer(gameReducer, initialState);
    const [isLoading, setIsLoading] = useState(true);

    // Effect for loading game state from IndexedDB on mount
    useEffect(() => {
        const loadGameFromDB = async () => {
            try {
                // We'll use a single record with a known ID for the save state
                const savedGame = await db.saves.get(1);
                if (savedGame && savedGame.state.careerMode && savedGame.state.artistsData) {
                    dispatch({ type: 'LOAD_GAME', payload: savedGame.state });
                }
            } catch (err) {
                console.error("Could not load saved game state from DB", err);
            } finally {
                setIsLoading(false);
            }
        };
        loadGameFromDB();
    }, []); // Empty dependency array means this runs once on mount

    // Effect for saving game state to IndexedDB on change
    useEffect(() => {
        // Don't save while loading, or if the game hasn't started yet
        if (!isLoading && gameState.careerMode) {
            const saveGameToDB = async () => {
                try {
                    // Use put with a known ID to always update the same record
                    await db.saves.put({ id: 1, state: gameState });
                } catch (err) {
                    console.error("Could not save game state to DB", err);
                }
            };
            saveGameToDB();
        }
    }, [gameState, isLoading]);


    const { activeArtistId, soloArtist, group, artistsData, careerMode } = gameState;
    const activeArtistData = activeArtistId ? artistsData[activeArtistId] : null;

    let activeArtist: Artist | Group | null = null;
    let allPlayerArtists: Array<Artist | Group> = [];

    if (careerMode === 'solo' && soloArtist) {
        activeArtist = soloArtist;
        allPlayerArtists = [soloArtist];
    } else if (careerMode === 'group' && group) {
        allPlayerArtists = [group, ...group.members];
        activeArtist = allPlayerArtists.find(a => a.id === activeArtistId) || null;
    }
    
    if (isLoading) {
        return (
            <div className="bg-zinc-900 text-white min-h-screen flex items-center justify-center">
                <p className="text-xl animate-pulse">Loading Game...</p>
            </div>
        );
    }

    return (
        <GameContext.Provider value={{ gameState, dispatch, activeArtist, activeArtistData, allPlayerArtists }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
