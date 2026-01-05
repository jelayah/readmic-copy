import React, { useState, useRef } from 'react';
import { useGame } from '../context/GameContext';
import type { Artist, Group } from '../types';

type Mode = 'solo' | 'group';

interface MemberState {
    name: string;
    image: string | null;
}

const StartScreen: React.FC = () => {
    const { dispatch } = useGame();
    const [mode, setMode] = useState<Mode>('solo');
    
    // Solo state
    const [soloName, setSoloName] = useState('');
    const [soloAge, setSoloAge] = useState(18);
    const [soloCountry, setSoloCountry] = useState<'UK' | 'US'>('US');
    const [soloImage, setSoloImage] = useState<string | null>(null);
    const [soloFandomName, setSoloFandomName] = useState('');
    const [soloPronouns, setSoloPronouns] = useState<'he/him' | 'she/her' | 'they/them'>('they/them');
    const [startYear, setStartYear] = useState(new Date().getFullYear());
    
    // Group state
    const [groupName, setGroupName] = useState('');
    const [groupFandomName, setGroupFandomName] = useState('');
    const [groupImage, setGroupImage] = useState<string | null>(null);
    const [memberCount, setMemberCount] = useState(2);
    const [members, setMembers] = useState<MemberState[]>(Array(2).fill({ name: '', image: null }));

    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleMemberCountChange = (count: number) => {
        const newCount = Math.max(2, Math.min(4, count));
        setMemberCount(newCount);
        const newMembers = [...members];
        while (newMembers.length < newCount) {
            newMembers.push({ name: '', image: null });
        }
        setMembers(newMembers.slice(0, newCount));
    };

    const handleMemberChange = (index: number, field: keyof MemberState, value: string | null) => {
        const newMembers = [...members];
        newMembers[index] = { ...newMembers[index], [field]: value };
        setMembers(newMembers);
    };

    const handleImageUpload = (setter: (value: string | null) => void) => (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const reader = new FileReader();
            reader.onloadend = () => {
                setter(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (mode === 'solo') {
            if (!soloName.trim() || !soloImage || !soloFandomName.trim()) {
                setError('Artist name, image, and fandom name are required.'); return;
            }
            if (soloAge < 16) {
                setError('Artist must be at least 16 years old.'); return;
            }
            const newArtist: Artist = {
                id: crypto.randomUUID(),
                name: soloName.trim(),
                age: soloAge,
                country: soloCountry,
                image: soloImage,
                pronouns: soloPronouns,
                fandomName: soloFandomName.trim()
            };
            dispatch({ type: 'START_SOLO_GAME', payload: { artist: newArtist, startYear } });
        } else {
            if (!groupName.trim() || !groupImage || !groupFandomName.trim()) {
                setError('Group name, image, and fandom name are required.'); return;
            }
            if (members.some(m => !m.name.trim() || !m.image)) {
                setError('All group members must have a name and image.'); return;
            }

            const newGroup: Group = {
                id: crypto.randomUUID(),
                name: groupName.trim(),
                image: groupImage,
                fandomName: groupFandomName.trim(),
                members: members.map(m => ({
                    id: crypto.randomUUID(),
                    name: m.name.trim(),
                    image: m.image!,
                    age: Math.floor(Math.random() * 5) + 18,
                    country: Math.random() > 0.5 ? 'US' : 'UK',
                    pronouns: 'they/them', // Group members get default pronouns
                    fandomName: groupFandomName.trim()
                }))
            };
            dispatch({ type: 'START_GROUP_GAME', payload: { group: newGroup, startYear } });
        }
    };

    const handleFileUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        setError('');
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
    
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result;
                if (typeof text !== 'string') {
                    throw new Error('Failed to read file content.');
                }
    
                const loadedState = JSON.parse(text);
                if (loadedState.careerMode && loadedState.artistsData) {
                    dispatch({ type: 'LOAD_GAME', payload: loadedState });
                } else {
                    throw new Error('Invalid save data structure.');
                }
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
                console.error("Failed to import save data:", err);
                setError(`Invalid or corrupted save file. ${errorMessage}`);
            }
        };
        reader.onerror = () => {
             setError('Failed to read the save file.');
        }
        reader.readAsText(file);
    
        // Reset file input value to allow re-uploading the same file
        event.target.value = '';
    };

    return (
        <>
            <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-lg p-8 border border-red-500/30">
                    <h1 className="text-4xl font-black text-center text-red-500 mb-2">RED MIC</h1>
                    <h2 className="text-xl font-bold text-center text-white mb-6">ARTIST SIMULATOR</h2>
                    
                    <div className="grid grid-cols-2 gap-2 mb-6">
                        <button onClick={() => setMode('solo')} className={`py-3 rounded-lg font-bold transition-colors ${mode === 'solo' ? 'bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}>Solo</button>
                        <button onClick={() => setMode('group')} className={`py-3 rounded-lg font-bold transition-colors ${mode === 'group' ? 'bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}>Group</button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {mode === 'solo' ? (
                            <>
                                <div className="flex justify-center">
                                    <label htmlFor="artist-image" className="cursor-pointer">
                                        <div className="w-32 h-32 rounded-full bg-zinc-700 border-2 border-dashed border-zinc-500 flex items-center justify-center hover:border-red-500 transition-colors">
                                            {soloImage ? (
                                                <img src={soloImage} alt="Artist" className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                <span className="text-zinc-400 text-sm text-center">Upload Image</span>
                                            )}
                                        </div>
                                    </label>
                                    <input id="artist-image" type="file" accept="image/*" className="hidden" onChange={handleImageUpload(setSoloImage)} />
                                </div>
                                <div>
                                    <label htmlFor="artist-name" className="block text-sm font-medium text-zinc-300">Artist Name</label>
                                    <input type="text" id="artist-name" value={soloName} onChange={e => setSoloName(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div>
                                    <label htmlFor="fandom-name" className="block text-sm font-medium text-zinc-300">Fandom Name</label>
                                    <input type="text" id="fandom-name" value={soloFandomName} onChange={e => setSoloFandomName(e.target.value)} placeholder="e.g. Swifties, The Hive" className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="artist-age" className="block text-sm font-medium text-zinc-300">Age</label>
                                        <input type="number" id="artist-age" value={soloAge} onChange={e => setSoloAge(parseInt(e.target.value))} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                    </div>
                                    <div>
                                    <label htmlFor="pronouns" className="block text-sm font-medium text-zinc-300">Pronouns</label>
                                        <select id="pronouns" value={soloPronouns} onChange={e => setSoloPronouns(e.target.value as any)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                            <option>they/them</option>
                                            <option>she/her</option>
                                            <option>he/him</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="country" className="block text-sm font-medium text-zinc-300">Country</label>
                                        <select id="country" value={soloCountry} onChange={e => setSoloCountry(e.target.value as 'UK' | 'US')} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3">
                                            <option>US</option>
                                            <option>UK</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="start-year" className="block text-sm font-medium text-zinc-300">Start Year</label>
                                        <input type="number" id="start-year" value={startYear} onChange={e => setStartYear(parseInt(e.target.value))} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="flex justify-center">
                                    <label htmlFor="group-image" className="cursor-pointer">
                                        <div className="w-32 h-32 rounded-lg bg-zinc-700 border-2 border-dashed border-zinc-500 flex items-center justify-center hover:border-red-500 transition-colors">
                                            {groupImage ? (
                                                <img src={groupImage} alt="Group" className="w-full h-full rounded-lg object-cover" />
                                            ) : (
                                                <span className="text-zinc-400 text-sm text-center">Upload Group Image</span>
                                            )}
                                        </div>
                                    </label>
                                    <input id="group-image" type="file" accept="image/*" className="hidden" onChange={handleImageUpload(setGroupImage)} />
                                </div>
                                <div>
                                    <label htmlFor="group-name" className="block text-sm font-medium text-zinc-300">Group Name</label>
                                    <input type="text" id="group-name" value={groupName} onChange={e => setGroupName(e.target.value)} className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div>
                                    <label htmlFor="group-fandom-name" className="block text-sm font-medium text-zinc-300">Fandom Name</label>
                                    <input type="text" id="group-fandom-name" value={groupFandomName} onChange={e => setGroupFandomName(e.target.value)} placeholder="e.g. The Army, Directioners" className="mt-1 block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-zinc-300">Members</label>
                                    <div className="mt-1 grid grid-cols-3 gap-2">
                                        {[2, 3, 4].map(count => (
                                            <button type="button" key={count} onClick={() => handleMemberCountChange(count)} className={`py-2 rounded-lg font-bold text-sm transition-colors ${memberCount === count ? 'bg-red-600' : 'bg-zinc-700 hover:bg-zinc-600'}`}>{count}</button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-4 max-h-48 overflow-y-auto pr-2">
                                    {members.map((member, index) => (
                                        <div key={index} className="flex items-center gap-3">
                                            <label htmlFor={`member-image-${index}`} className="cursor-pointer">
                                                <div className="w-12 h-12 rounded-full bg-zinc-700 border-2 border-dashed border-zinc-600 flex items-center justify-center hover:border-red-500 transition-colors flex-shrink-0">
                                                    {member.image ? (
                                                        <img src={member.image} alt={`Member ${index + 1}`} className="w-full h-full rounded-full object-cover" />
                                                    ) : <span className="text-zinc-400 text-[10px] text-center">Img</span>}
                                                </div>
                                            </label>
                                            <input id={`member-image-${index}`} type="file" accept="image/*" className="hidden" onChange={handleImageUpload((val) => handleMemberChange(index, 'image', val))} />
                                            <input type="text" placeholder={`Member ${index + 1} Name`} value={member.name} onChange={e => handleMemberChange(index, 'name', e.target.value)} className="block w-full bg-zinc-700 border-zinc-600 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 sm:text-sm h-10 px-3"/>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}

                        {error && <p className="text-red-400 text-sm text-center">{error}</p>}

                        <button type="submit" className="w-full h-12 bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg shadow-red-600/20">
                            START CAREER
                        </button>
                    </form>
                    <div className="mt-4 text-center">
                         <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileImport}
                            className="hidden"
                            accept=".json,application/json"
                        />
                        <button onClick={handleFileUploadClick} className="text-sm text-zinc-400 hover:text-white hover:underline">
                            Upload Save File (.json)
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default StartScreen;