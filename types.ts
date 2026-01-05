
export interface Artist {
    id: string;
    name: string;
    age: number;
    country: 'UK' | 'US';
    image: string;
    pronouns: 'he/him' | 'she/her' | 'they/them';
    fandomName: string;
}

export interface Group {
    id: string;
    name: string;
    image: string;
    members: Artist[];
    fandomName: string;
}

export interface Song {
    id: string;
    title: string;
    genre: string;
    quality: number;
    coverArt: string;
    isReleased: boolean;
    releaseId?: string;
    streams: number;
    lastWeekStreams: number;
    prevWeekStreams: number;
    pitchforkBoost?: boolean;
    duration: number; // in seconds
    explicit: boolean;
    artistId: string;
    isPreReleaseSingle?: boolean;
    isDeluxeTrack?: boolean;
    firstWeekStreams?: number;
    removedStreams?: number;
    playlistBoostWeeks?: number;
    tourBoostWeeks?: number;
    leakInfo?: {
        illegalStreams: number;
        illegalDownloads: number;
    };
    dailyStreams?: number[];
    soundtrackTitle?: 'F1 The Album' | 'Wicked' | 'Breaking Bad';
    collaboration?: {
        artistName: string;
        cost: number;
        qualityBoost: number;
    };
    lastCertification?: string;
    isTakenDown?: boolean;
    reRecordingOf?: string; // ID of the original song
}

export type ReleaseType = 'Single' | 'EP' | 'Album' | 'Album (Deluxe)';

export interface Review {
    publication: 'Pitchfork';
    score: number;
    text: string;
    reviewer: string;
}

export interface Release {
    id:string;
    title: string;
    type: ReleaseType;
    coverArt: string;
    songIds: string[];
    releaseDate: GameDate;
    review?: Review;
    artistId: string;
    countdownVideoUrl?: string; // For upcoming albums
    standardEditionId?: string;
    releasingLabel?: {
        name: string;
        dealWithMajor?: string;
    } | null;
    firstWeekStreams?: number;
    wikipediaSummary?: string;
    soundtrackInfo?: { albumTitle: string };
    lastCertification?: string;
    isTakenDown?: boolean;
}

export interface Video {
    id: string;
    songId: string;
    title: string;
    type: 'Music Video' | 'Lyric Video' | 'Visualizer' | 'Genius Verified' | 'Live Performance' | 'Interview' | 'Custom';
    views: number;
    thumbnail: string;
    releaseDate: GameDate;
    artistId: string;
    channelId: string;
    firstWeekViews?: number;
    description?: string;
    mentionedNpcs?: string[];
}

export interface MerchProduct {
    id: string;
    releaseId: string; // From an EP or Album
    name: string;
    type: 'Vinyl' | 'CD';
    price: number;
    image: string;
    artistId: string;
}

export interface GeniusOffer {
    type: 'geniusInterview';
    songId: string;
    isAccepted: boolean;
    emailId: string;
}

export interface OnTheRadarOffer {
    type: 'onTheRadarOffer';
    songId: string;
    isAccepted: boolean;
    emailId: string;
}

export interface TrshdOffer {
    type: 'trshdOffer';
    songId: string;
    isAccepted: boolean;
    emailId: string;
}

export interface FallonOffer {
    type: 'fallonOffer';
    releaseId: string;
    offerType: 'performance' | 'interview' | 'both';
    isAccepted: boolean;
    emailId: string;
}

export interface PopBaseOffer {
    type: 'popBaseInterview' | 'popBaseClarification';
    emailId: string;
    isAnswered: boolean;
    question?: string;
    originalPostContent?: string;
    isControversial?: boolean;
}

export interface GrammySubmissionOffer {
    type: 'grammySubmission';
    emailId: string;
    isSubmitted: boolean;
}

export interface GrammyNominationOffer {
    type: 'grammyNominations';
    emailId: string;
    hasPerformanceOffer: boolean;
    isPerformanceAccepted?: boolean;
}

export interface GrammyRedCarpetOffer {
    type: 'grammyRedCarpet';
    emailId: string;
    isAttending?: boolean;
}

export interface OscarsSubmissionOffer {
    type: 'oscarSubmission';
    emailId: string;
    isSubmitted: boolean;
}

export interface OscarsNominationOffer {
    type: 'oscarNominations';
    emailId: string;
    hasPerformanceOffer: boolean;
    isPerformanceAccepted?: boolean;
}


export interface LeakNotification {
    type: 'leak';
    songId: string;
}

export interface XSuspensionEmail {
    type: 'xSuspension';
    isSuspended: boolean; // true for suspension, false for reinstatement
}

export interface XAppealResultEmail {
    type: 'xAppealResult';
    isSuccessful: boolean;
}

export interface OnlyFansOffer {
    type: 'onlyfansRequest';
    requestType: 'image' | 'video';
    payout: number;
    isFulfilled: boolean;
    emailId: string;
    senderUsername: string;
}

export interface SoundtrackOffer {
    type: 'soundtrackOffer';
    albumTitle: 'F1 The Album' | 'Wicked' | 'Breaking Bad';
    isAccepted: boolean;
    emailId: string;
}

export interface TouringDataUpdate {
    type: 'touringDataUpdate';
    tourId: string;
    venueIndex: number;
}

export interface VogueOffer {
    type: 'vogueOffer';
    magazine: 'Vogue' | 'Vogue Korea' | 'Vogue Italy';
    isAccepted: boolean;
    emailId: string;
}

export interface FeatureOffer {
    type: 'featureOffer';
    npcArtistName: string;
    payout: number;
    songQuality: number;
    promotion?: {
        name: string;
        durationWeeks: number;
    };
    isAccepted: boolean;
    emailId: string;
}

export interface FeatureReleaseNotification {
    type: 'featureRelease';
    songTitle: string;
    npcArtistName: string;
}

export interface VmaSubmissionOffer {
    type: 'vmaSubmission';
    emailId: string;
    isSubmitted: boolean;
}

export interface VmaNominationOffer {
    type: 'vmaNominations';
    emailId: string;
    hasPerformanceOffer: boolean;
    isPerformanceAccepted?: boolean;
}

export interface VmaRedCarpetOffer {
    type: 'vmaRedCarpet';
    emailId: string;
    isAttending?: boolean;
}


export interface Email {
    id: string;
    sender: string;
    senderIcon?: 'spotify' | 'youtube' | 'default' | 'label' | 'genius' | 'fallon' | 'popbase' | 'grammys' | 'x' | 'onlyfans' | 'soundtrack' | 'touringdata' | 'business' | 'vogue' | 'feature' | 'ontheradar' | 'trshd' | 'oscars' | 'vmas';
    subject: string;
    body: string;
    date: GameDate;
    isRead: boolean;
    offer?: GeniusOffer | FallonOffer | PopBaseOffer | GrammySubmissionOffer | GrammyNominationOffer | GrammyRedCarpetOffer | LeakNotification | XSuspensionEmail | XAppealResultEmail | OnlyFansOffer | SoundtrackOffer | TouringDataUpdate | VogueOffer | FeatureOffer | FeatureReleaseNotification | OnTheRadarOffer | TrshdOffer | OscarsSubmissionOffer | OscarsNominationOffer | VmaSubmissionOffer | VmaNominationOffer | VmaRedCarpetOffer;
}

export interface GameDate {
    week: number;
    year: number;
}

export interface Promotion {
    id: string;
    itemId: string; // songId, releaseId, or videoId
    itemType: 'song' | 'release' | 'video';
    promoType: string; // e.g., 'Playlist Push', 'Nostalgia Campaign'
    weeklyCost: number;
    boostMultiplier: number;
    artistId: string;
}

export interface NpcSong {
    uniqueId: string;
    title: string;
    artist: string;
    genre: string;
    basePopularity: number; // A value to derive weekly streams from
    featuring?: string; // Player artist name
    isPlayerFeature?: boolean;
    coverArt?: string;
    isReleased?: boolean;
    releaseDate?: GameDate;
    promotion?: { name: string; boost: number };
    promoWeeksLeft?: number;
}

export interface NpcAlbum {
    uniqueId: string;
    title: string;
    artist: string;
    label: 'UMG' | 'Republic' | 'RCA' | 'Island';
    coverArt: string;
    songIds: string[]; // uniqueId of NpcSong
    salesPotential: number;
}

export interface ChartEntry {
    rank: number;
    lastWeek: number | null;
    peak: number;
    weeksOnChart: number;
    title: string;
    artist: string;
    coverArt: string;
    isPlayerSong: boolean;
    songId?: string;
    uniqueId: string;
    weeklyStreams: number;
}

export interface AlbumChartEntry {
    rank: number;
    lastWeek: number | null;
    peak: number;
    weeksOnChart: number;
    title: string;
    artist: string;
    label: string;
    coverArt: string;
    isPlayerAlbum: boolean;
    albumId?: string;
    uniqueId: string;
    weeklyActivity: number;
    weeklySales: number;
}


export interface ChartHistory {
    [uniqueId: string]: {
        peak: number;
        weeksOnChart: number;
        lastRank: number | null;
        weeksAtNo1?: number;
    }
}

export interface Label {
    id: 'umg' | 'republic' | 'rca' | 'island' | 'interscope' | 'columbia' | 'atlantic' | 'epic' | 'quality_control' | 'tde' | 'roc_nation';
    name: string;
    tier: 'Top' | 'Mid-high' | 'Mid-Low' | 'Low';
    logo: string;
    promotionMultiplier: number;
    creativeControl: number; // 0-100, lower is less freedom for player
    minQuality: number;
    streamRequirement: number;
    youtubeChannel?: {
        name: string;
        handle: string;
        subscribers: number;
        banner: string;
    };
    contractType?: 'standard' | 'petty';
}

export interface CustomLabel {
    id: string;
    name: string;
    logo: string;
    artistOwnerId: string;
    dealWithMajorId?: Label['id'];
    tier: 'Indie' | 'Mid' | 'High';
    promotionMultiplier: number;
}

export interface Contract {
    labelId: string;
    isCustom?: boolean;
    artistId: string;
    startDate: GameDate;
    durationWeeks?: number;
    albumQuota?: number;
    albumsReleased: number;
}

export interface LabelSubmission {
    id: string;
    release: Release;
    submittedDate: GameDate;
    status: 'pending' | 'awaiting_player_input' | 'rejected' | 'scheduled';
    decisionDate?: GameDate;
    projectReleaseDate?: GameDate;
    feedback?: string;
    singlesToRelease?: { songId: string; releaseDate: GameDate }[];
    promoBudget?: number;
    promoBudgetSpent?: number;
    hasCountdownPage?: boolean;
    geniusInterviewRequestedForSongId?: string;
    fallonPerformanceRequestedForSongId?: string;
    recommendedSingles?: { songId: string; reason: string }[];
}


export interface XUser {
    id: string;
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
    isPlayer?: boolean;
    bio?: string;
    followersCount: number;
    followingCount: number;
}

export interface XPost {
    id: string;
    authorId: string;
    content: string;
    image?: string;
    likes: number;
    retweets: number;
    views: number;
    quoteOf?: XPost;
    date: GameDate;
}

export interface XMessage {
    id: string;
    senderId: string; // 'player' or a userId
    text: string;
    image?: string;
    date: GameDate;
}

export interface XChat {
    id: string;
    name: string;
    avatar: string;
    isGroup: boolean;
    participants: string[]; // array of userIds, 'player' is one of them
    messages: XMessage[];
    isRead: boolean;
}

export interface XTrend {
    id: string;
    category: string;
    title: string;
    postCount: number;
}

export type PaparazziPhotoCategory = 'Spotted' | 'Scandal' | 'Fashion' | 'Candid';

export interface PaparazziPhoto {
    id: string;
    image: string;
    category: PaparazziPhotoCategory;
}

export interface GrammyAward {
    year: number;
    category: 'Best New Artist' | 'Album of the Year' | 'Record of the Year' | 'Song of the Year' | 'Best Pop Song' | 'Best Rap Song' | 'Best R&B Song' | 'Pop Album' | 'Rap Album' | 'R&B Album';
    itemId: string; // releaseId, songId, or artistId
    itemName: string;
    artistName: string;
    isWinner: boolean;
}

export interface VmaAward {
    year: number;
    category: 'Video of the Year' | 'Artist of the Year' | 'Song of the Year' | 'Best New Artist' | 'Best Pop' | 'Best Hip Hop' | 'Best R&B';
    itemId: string; // videoId, songId, or artistId
    itemName: string;
    artistName: string;
    isWinner: boolean;
}

export interface OscarAward {
    year: number;
    category: 'Best Original Song';
    itemId: string; // songId
    itemName: string;
    artistName: string;
    isWinner: boolean;
}

export interface GrammyContender {
    id: string;
    name: string;
    artistName: string;
    isPlayer: boolean;
    score: number;
    coverArt?: string;
}

export interface VmaContender {
    id: string;
    name: string;
    artistName: string;
    isPlayer: boolean;
    score: number;
    coverArt?: string;
}

export interface OscarContender {
    id: string;
    name: string;
    artistName: string;
    isPlayer: boolean;
    score: number;
    coverArt?: string;
}


export interface GrammyCategory {
    name: 'Best New Artist' | 'Record of the Year' | 'Song of the Year' | 'Album of the Year' | 'Best Pop Song' | 'Best Rap Song' | 'Best R&B Song' | 'Pop Album' | 'Rap Album' | 'R&B Album';
    nominees: GrammyContender[];
    winner?: GrammyContender;
}

export interface VmaCategory {
    name: 'Video of the Year' | 'Artist of the Year' | 'Song of the Year' | 'Best New Artist' | 'Best Pop' | 'Best Hip Hop' | 'Best R&B';
    nominees: VmaContender[];
    winner?: VmaContender;
}

export interface OscarCategory {
    name: 'Best Original Song';
    nominees: OscarContender[];
    winner?: OscarContender;
}

export type GameView = 'game' | 'spotify' | 'studio' | 'release' | 'pitchfork' | 'youtube' | 'createVideo' | 'merchStore' | 'inbox' | 'catalog' | 'promote' | 'billboard' | 'spotifyChart' | 'youtubeVideoDetail' | 'youtubeStudio' | 'gigs' | 'labelReleasePlan' | 'createGeniusInterview' | 'x' | 'xProfile' | 'xChatDetail' | 'spotifyForArtists' | 'createFallonPerformance' | 'createFallonInterview' | 'spotifyAlbumCountdown' | 'createLabel' | 'albumPromo' | 'billboardAlbums' | 'achievements' | 'redMicProUnlock' | 'redMicProDashboard' | 'wikipedia' | 'grammys' | 'submitForGrammys' | 'createGrammyPerformance' | 'grammyRedCarpet' | 'contractRenewal' | 'itunes' | 'onlyfansSetup' | 'onlyfans' | 'createOnlyFansPost' | 'chartHistory' | 'albumSalesChart' | 'labels' | 'releaseHub' | 'createSoundtrack' | 'spotifySoundtrackDetail' | 'gameGuide' | 'tours' | 'createTour' | 'tourDetail' | 'management' | 'security' | 'spotifyTopSongs' | 'spotifyTopAlbums' | 'createVogueFeature' | 'spotifyWrapped' | 'hotPopSongs' | 'hotRapRnb' | 'electronicChart' | 'countryChart' | 'createFeature' | 'createOnTheRadarPerformance' | 'createTrshdPerformance' | 'appleMusic' | 'oscars' | 'submitForOscars' | 'createOscarPerformance';

export type Tab = 'Home' | 'Apps' | 'Charts' | 'Misc' | 'Business';

export interface RedMicProState {
    unlocked: boolean;
    subscriptionType: 'yearly' | 'lifetime' | 'code' | null;
    subscriptionEndDate?: GameDate;
    hypeMode?: 'locked' | 'manual';
}

export interface OnlyFansPost {
    id: string;
    date: GameDate;
    caption: string;
    image: string;
    price: number;
    likes: number;
    comments: number;
    tips: number;
}

export interface OnlyFansProfile {
    username: string;
    displayName: string;
    bio: string;
    profilePicture: string; 
    bannerPicture: string; 
    subscriptionPrice: number;
    subscribers: number;
    posts: OnlyFansPost[];
    likes: number;
    totalGross: number;
    totalNet: number;
    earningsByMonth: { [yearMonth: string]: { gross: number, net: number } };
}

export interface XSuspensionStatus {
    isSuspended: boolean;
    reason: 'fan_war_reports' | 'random';
    appealSentDate?: GameDate;
}

export interface SoundtrackTrack {
  isPlayerSong: boolean;
  songId: string; // Player Song ID or NPC uniqueId
  title: string;
  artist: string;
  streams: number;
  lastWeekStreams: number;
  prevWeekStreams: number;
  duration: number;
  explicit: boolean;
}

export interface SoundtrackAlbum {
    id: string;
    title: 'F1 The Album' | 'Wicked' | 'Breaking Bad';
    coverArt: string;
    tracks: SoundtrackTrack[];
    releaseDate: GameDate;
    label: string;
    artistId: string; // The player who contributed
    isReleased: boolean;
}

export interface Venue {
    id: string;
    name: string;
    city: string;
    capacity: number;
    ticketPrice: number;
    soldOut: boolean;
    revenue: number;
    ticketsSold: number;
}

export interface Tour {
    id: string;
    artistId: string;
    name: string;
    bannerImage: string;
    venues: Venue[];
    setlist: string[];
    status: 'planning' | 'active' | 'finished';
    currentVenueIndex: number;
    totalRevenue: number;
    ticketsSold: number;
}

export interface Manager {
    id: string;
    name: string;
    yearlyCost: number;
    popularityBoost: number;
    autoGigsPerWeek: number;
    unlocksTier: number;
}

export interface SecurityTeam {
    id: string;
    name: string;
    weeklyCost: number;
    leakProtection: number;
}

export interface VoguePhotoshoot {
    id: string;
    magazine: 'Vogue' | 'Vogue Korea' | 'Vogue Italy';
    coverImage: string;
    photoshootImages: string[];
    interviewAnswers: { question: string; answer: string }[];
    date: GameDate;
}

export interface ArtistData {
    money: number;
    hype: number;
    popularity: number;
    songs: Song[];
    releases: Release[];
    monthlyListeners: number;
    lastFourWeeksStreams: number[];
    lastFourWeeksViews: number[];
    youtubeSubscribers: number;
    videos: Video[];
    youtubeStoreUnlocked: boolean;
    merch: MerchProduct[];
    merchStoreBanner: string | null;
    inbox: Email[];
    streamsThisMonth: number;
    viewsThisQuarter: number;
    subsThisQuarter: number;
    promotions: Promotion[];
    performedGigThisWeek: boolean;
    contract: Contract | null;
    contractHistory: Contract[];
    labelSubmissions: LabelSubmission[];
    customLabels: CustomLabel[];
    artistImages: string[];
    artistVideoThumbnails: string[];
    paparazziPhotos: PaparazziPhoto[];
    tourPhotos: string[];
    tours: Tour[];
    streamsRemovedThisWeek?: number;
    manager: { id: string; contractEndDate: GameDate } | null;
    securityTeamId: string | null;
    xUsers: XUser[];
    xPosts: XPost[];
    xChats: XChat[];
    xTrends: XTrend[];
    xFollowingIds: string[];
    xSuspensionStatus: XSuspensionStatus | null;
    followers: number;
    saves: number;
    artistPick: { itemId: string; itemType: 'song' | 'release'; message: string; } | null;
    listeningNow: number;
    streamsHistory: { date: GameDate; streams: number }[];
    firstChartEntry?: { songTitle: string; rank: number; date: GameDate } | null;
    redMicPro: RedMicProState;
    salesBoost: number; // percentage
    isGoldTheme: boolean;
    grammyHistory: GrammyAward[];
    hasSubmittedForBestNewArtist: boolean;
    vmaHistory: VmaAward[];
    hasSubmittedForVmaBestNewArtist: boolean;
    oscarHistory: OscarAward[];
    onlyfans: OnlyFansProfile | null;
    fanWarStatus: { targetArtistName: string; weeksRemaining: number; } | null;
    soundtrackOfferCount: number;
    offeredSoundtracks: Array<'F1 The Album' | 'Wicked' | 'Breaking Bad'>;
    weeksUntilNextSoundtrackOffer?: number;
    lastVogueOfferYear?: number;
    voguePhotoshoots?: VoguePhotoshoot[];
    weeksUntilNextFeatureOffer?: number;
}

export interface GameState {
    careerMode: 'solo' | 'group' | null;
    soloArtist: Artist | null;
    group: Group | null;
    activeArtistId: string | null;

    artistsData: {
        [artistId: string]: ArtistData;
    };
    
    date: GameDate;
    currentView: GameView;
    activeTab: Tab;
    activeYoutubeChannel: 'artist' | 'label';
    
    npcs: NpcSong[];
    npcAlbums: NpcAlbum[];
    soundtrackAlbums: SoundtrackAlbum[];
    billboardHot100: ChartEntry[];
    billboardTopAlbums: AlbumChartEntry[];
    albumChartHistory: ChartHistory;
    chartHistory: ChartHistory;
    spotifyGlobal50: ChartEntry[];
    hotPopSongs: ChartEntry[];
    hotRapRnb: ChartEntry[];
    electronicChart: ChartEntry[];
    countryChart: ChartEntry[];
    hotPopSongsHistory: ChartHistory;
    hotRapRnbHistory: ChartHistory;
    electronicChartHistory: ChartHistory;
    countryChartHistory: ChartHistory;
    spotifyNewEntries: number;
    selectedVideoId: string | null;
    selectedReleaseId: string | null;
    selectedSoundtrackId: string | null;
    activeSubmissionId: string | null;
    activeGeniusOffer: { songId: string; emailId: string } | null;
    activeOnTheRadarOffer: { songId: string; emailId: string } | null;
    activeTrshdOffer: { songId: string; emailId: string } | null;
    activeFallonOffer: { releaseId: string; offerType: 'performance' | 'interview' | 'both'; emailId: string; step?: 'performance' | 'interview' } | null;
    activeSoundtrackOffer: { albumTitle: 'F1 The Album' | 'Wicked' | 'Breaking Bad'; emailId: string } | null;
    activeFeatureOffer: {
        npcArtistName: string;
        payout: number;
        songQuality: number;
        promotion?: { name: string; durationWeeks: number };
        emailId: string;
    } | null;
    selectedXUserId: string | null;
    selectedXChatId: string | null;
    contractRenewalOffer: { labelId: string; isCustom?: boolean; artistId: string } | null;
    activeTourId: string | null;
    viewingPastLabelId: string | null;
    // Fix: Updated activeVogueOffer magazine type to match VogueOffer for type safety in components.
    activeVogueOffer: { magazine: VogueOffer['magazine']; emailId: string } | null;
    grammySubmissions: { artistId: string; category: string; itemId: string; itemName: string }[];
    grammyCurrentYearNominations: GrammyCategory[] | null;
    activeGrammyPerformanceOffer: { emailId: string } | null;
    activeGrammyRedCarpetOffer: { emailId: string } | null;
    oscarSubmissions: { artistId: string; category: string; itemId: string; itemName: string }[];
    oscarCurrentYearNominations: OscarCategory[] | null;
    activeOscarPerformanceOffer: { emailId: string } | null;
    activeVmaPerformanceOffer?: { emailId: string } | null;
    activeVmaRedCarpetOffer?: { emailId: string } | null;
}

export type GameAction =
    | { type: 'START_SOLO_GAME'; payload: { artist: Artist; startYear: number } }
    | { type: 'START_GROUP_GAME'; payload: { group: Group; startYear: number } }
    | { type: 'CHANGE_VIEW'; payload: GameView }
    | { type: 'CHANGE_TAB'; payload: Tab }
    | { type: 'SWITCH_YOUTUBE_CHANNEL'; payload: 'artist' | 'label' }
    | { type: 'CHANGE_ACTIVE_ARTIST'; payload: string }
    | { type: 'PROGRESS_WEEK' }
    | { type: 'RECORD_SONG'; payload: { song: Song; cost: number } }
    | { type: 'RELEASE_PROJECT'; payload: { release: Release } }
    | { type: 'ADD_REVIEW'; payload: { releaseId: string; review: Review; cost: number; artistId: string } }
    | { type: 'CREATE_VIDEO'; payload: { video: Video; cost: number } }
    | { type: 'ADD_MERCH'; payload: { item: MerchProduct } }
    | { type: 'REMOVE_MERCH'; payload: { id: string } }
    | { type: 'UPDATE_MERCH_BANNER'; payload: string | null }
    | { type: 'MARK_INBOX_READ' }
    | { type: 'START_PROMOTION'; payload: { promotion: Promotion } }
    | { type: 'CANCEL_PROMOTION'; payload: { promotionId: string } }
    | { type: 'SELECT_VIDEO'; payload: string | null }
    | { type: 'SELECT_RELEASE'; payload: string | null }
    | { type: 'PERFORM_GIG'; payload: { cash: number; hype: number } }
    | { type: 'SIGN_CONTRACT'; payload: { contract: Contract } }
    | { type: 'END_CONTRACT' }
    | { type: 'SUBMIT_TO_LABEL'; payload: { submission: LabelSubmission } }
    | { type: 'GO_TO_LABEL_PLAN'; payload: { submissionId: string } }
    | { type: 'PLAN_LABEL_RELEASE'; payload: { submissionId: string; singles: { songId: string; releaseDate: GameDate }[]; projectReleaseDate: GameDate } }
    | { type: 'ACCEPT_GENIUS_OFFER'; payload: { songId: string; emailId: string } }
    | { type: 'CREATE_GENIUS_INTERVIEW'; payload: { video: Video } }
    | { type: 'CANCEL_GENIUS_OFFER' }
    | { type: 'ACCEPT_ONTHERADAR_OFFER'; payload: { songId: string; emailId: string } }
    | { type: 'CREATE_ONTHERADAR_PERFORMANCE'; payload: { video: Video } }
    | { type: 'CANCEL_ONTHERADAR_OFFER' }
    | { type: 'ACCEPT_TRSHD_OFFER'; payload: { songId: string; emailId: string } }
    | { type: 'CREATE_TRSHD_PERFORMANCE'; payload: { video: Video } }
    | { type: 'CANCEL_TRSHD_OFFER' }
    | { type: 'ACCEPT_FALLON_OFFER'; payload: { releaseId: string; offerType: 'performance' | 'interview' | 'both'; emailId: string } }
    | { type: 'CREATE_FALLON_VIDEO'; payload: { video: Video; songId?: string } }
    | { type: 'CANCEL_FALLON_OFFER' }
    | { type: 'ADD_ARTIST_IMAGE'; payload: string }
    | { type: 'ADD_ARTIST_VIDEO'; payload: string }
    | { type: 'ADD_PAPARAZZI_PHOTO'; payload: { photo: PaparazziPhoto } }
    | { type: 'ANSWER_POPBASE_QUESTION'; payload: { emailId: string; answer: string } }
    | { type: 'POST_ON_X'; payload: { content: string; image?: string; postType: 'normal' | 'fanWar' | 'push'; targetId?: string; songId?: string } }
    | { type: 'VIEW_X_PROFILE'; payload: string }
    | { type: 'VIEW_X_CHAT'; payload: string }
    | { type: 'FOLLOW_X_USER'; payload: string }
    | { type: 'UNFOLLOW_X_USER'; payload: string }
    | { type: 'SEND_X_MESSAGE'; payload: { chatId: string; message: XMessage } }
    | { type: 'APPEAL_X_SUSPENSION' }
    | { type: 'SET_ARTIST_PICK'; payload: { itemId: string; itemType: 'song' | 'release'; message: string; } }
    | { type: 'PITCH_TO_PLAYLIST'; payload: { songId: string } }
    | { type: 'CREATE_CUSTOM_LABEL'; payload: { label: CustomLabel; cost: number; membersToSign: string[] } }
    | { type: 'DELETE_SONG'; payload: { songId: string } }
    | { type: 'GO_TO_ALBUM_PROMO'; payload: { submissionId: string } }
    | { type: 'LAUNCH_COUNTDOWN_PAGE'; payload: { submissionId: string; cost: number } }
    | { type: 'REQUEST_GENIUS_PROMO'; payload: { submissionId: string; songId: string; cost: number } }
    | { type: 'REQUEST_FALLON_PROMO'; payload: { submissionId: string; songId: string; cost: number } }
    | { type: 'RESET_GAME' }
    | { type: 'LOAD_GAME'; payload: GameState }
    | { type: 'UNLOCK_RED_MIC_PRO'; payload: { type: 'yearly' | 'lifetime' | 'code'; cost: number } }
    | { type: 'UPDATE_SONG_QUALITY'; payload: { songId: string; newQuality: number } }
    | { type: 'SET_MONEY'; payload: { newAmount: number } }
    | { type: 'TOGGLE_GOLD_THEME'; payload: { enabled: boolean } }
    | { type: 'SET_SALES_BOOST'; payload: { newBoost: number } }
    | { type: 'PRO_SIGN_LABEL'; payload: { labelId: string } }
    | { type: 'UPDATE_WIKIPEDIA_SUMMARY'; payload: { releaseId: string; summary: string } }
    | { type: 'GO_TO_GRAMMY_SUBMISSIONS'; payload: { emailId: string } }
    | { type: 'SUBMIT_FOR_GRAMMYS'; payload: { submissions: any[]; emailId: string } }
    | { type: 'ACCEPT_GRAMMY_PERFORMANCE'; payload: { emailId: string } }
    | { type: 'CREATE_GRAMMY_PERFORMANCE'; payload: { video: Video } }
    | { type: 'DECLINE_GRAMMY_PERFORMANCE'; payload: { emailId: string } }
    | { type: 'ACCEPT_GRAMMY_RED_CARPET'; payload: { emailId: string; lookUrl: string } }
    | { type: 'DECLINE_GRAMMY_RED_CARPET'; payload: { emailId: string } }
    | { type: 'GO_TO_OSCAR_SUBMISSIONS'; payload: { emailId: string } }
    | { type: 'SUBMIT_FOR_OSCARS'; payload: { submissions: any[]; emailId: string } }
    | { type: 'ACCEPT_OSCAR_PERFORMANCE'; payload: { emailId: string } }
    | { type: 'CREATE_OSCAR_PERFORMANCE'; payload: { video: Video } }
    | { type: 'DECLINE_OSCAR_PERFORMANCE'; payload: { emailId: string } }
    | { type: 'RENEW_CONTRACT' }
    | { type: 'GO_INDEPENDENT' }
    | { type: 'UPDATE_ARTIST_IMAGE'; payload: { artistId: string; newImage: string } }
    | { type: 'CREATE_ONLYFANS_PROFILE'; payload: { profile: OnlyFansProfile } }
    | { type: 'UPDATE_ONLYFANS_SETTINGS'; payload: { price: number } }
    | { type: 'CREATE_ONLYFANS_POST'; payload: { post: OnlyFansPost } }
    | { type: 'ACCEPT_ONLYFANS_REQUEST'; payload: { emailId: string; payout: number } }
    | { type: 'SET_PRO_HYPE_MODE'; payload: 'locked' | 'manual' }
    | { type: 'SET_HYPE'; payload: number }
    | { type: 'SET_POPULARITY'; payload: number }
    | { type: 'UPDATE_RELEASE_COVER_ART'; payload: { releaseId: string; newCoverArt: string } }
    | { type: 'ACCEPT_SOUNDTRACK_OFFER'; payload: { albumTitle: string; emailId: string } }
    | { type: 'CREATE_SOUNDTRACK_CONTRIBUTION'; payload: { albumTitle: string; coverArt: string; songIds: string[] } }
    | { type: 'CANCEL_SOUNDTRACK_OFFER' }
    | { type: 'ACCEPT_FEATURE_OFFER'; payload: any }
    | { type: 'CANCEL_FEATURE_OFFER' }
    | { type: 'CREATE_FEATURE_SONG'; payload: { songTitle: string; coverArt: string; releaseDate: GameDate } }
    | { type: 'SELECT_SOUNDTRACK'; payload: string }
    | { type: 'CREATE_TOUR'; payload: Tour }
    | { type: 'START_TOUR'; payload: { tourId: string } }
    | { type: 'UPLOAD_TOUR_PHOTO'; payload: string }
    | { type: 'SELECT_TOUR'; payload: string }
    | { type: 'HIRE_MANAGER'; payload: { managerId: string } }
    | { type: 'FIRE_MANAGER' }
    | { type: 'HIRE_SECURITY'; payload: { teamId: string } }
    | { type: 'FIRE_SECURITY' }
    | { type: 'UPDATE_NPC_X_USER'; payload: { userId: string; newName: string; newUsername: string } }
    | { type: 'VIEW_PAST_LABEL_CHANNEL'; payload: string }
    | { type: 'UPDATE_NPC_AVATAR'; payload: { userId: string; newAvatar: string } }
    | { type: 'ACCEPT_VOGUE_OFFER'; payload: { magazine: string; emailId: string } }
    | { type: 'CANCEL_VOGUE_OFFER' }
    | { type: 'CREATE_VOGUE_FEATURE'; payload: { photoshoot: VoguePhotoshoot } }
    | { type: 'SUBMIT_FOR_VMAS'; payload: { submissions: any[]; emailId: string } }
    | { type: 'ACCEPT_VMA_PERFORMANCE'; payload: { emailId: string } }
    | { type: 'CREATE_VMA_PERFORMANCE'; payload: { video: Video } }
    | { type: 'DECLINE_VMA_PERFORMANCE'; payload: { emailId: string } }
    | { type: 'ACCEPT_VMA_RED_CARPET'; payload: { emailId: string; lookUrl: string } }
    | { type: 'DECLINE_VMA_RED_CARPET'; payload: { emailId: string } };
