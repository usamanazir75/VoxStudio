
import React, { useState } from 'react';
import { User } from '../types';
import { userService } from '../services/userService';
import { Save, User as UserIcon } from 'lucide-react';

interface SettingsProps {
    user: User;
    onUpdate: (u: User) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdate }) => {
    const [name, setName] = useState(user.name);
    const [msg, setMsg] = useState('');

    const handleSave = () => {
        userService.updateProfile(user.id, { name });
        const updated = userService.getCurrentUser();
        if (updated) onUpdate(updated);
        setMsg('Profile updated successfully.');
        setTimeout(() => setMsg(''), 3000);
    }

    return (
        <div className="glass rounded-3xl p-8 max-w-2xl mx-auto border border-white/10 shadow-2xl bg-slate-900/40">
            <h2 className="text-2xl font-bold text-white mb-8 pb-4 border-b border-white/5 flex items-center gap-3">
                <UserIcon className="w-6 h-6 text-indigo-400" /> Account Settings
            </h2>

            <div className="space-y-6">
                <div className="flex items-center gap-6 mb-8">
                    <img src={user.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback"} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-800 shadow-xl bg-slate-700" />
                    <div>
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">User ID</div>
                        <code className="bg-black/30 px-3 py-1 rounded text-slate-400 font-mono text-sm block mb-2">{user.id}</code>
                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Role</div>
                        <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded text-xs font-bold uppercase">{user.role}</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Display Name</label>
                        <input 
                            type="text" 
                            value={name} 
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">Email Address</label>
                        <input 
                            type="text" 
                            value={user.email} 
                            disabled
                            className="w-full bg-slate-900/30 border border-white/5 rounded-xl p-3 text-slate-500 cursor-not-allowed"
                        />
                    </div>
                </div>

                <div className="bg-slate-800/30 p-6 rounded-xl border border-white/5 mt-6">
                    <div className="flex justify-between items-center">
                        <div>
                            <h3 className="text-white font-bold text-sm">Subscription Plan</h3>
                            <p className="text-slate-400 text-xs mt-1">Free Tier (10,000 Credits/mo)</p>
                        </div>
                        <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-xs font-bold border border-white/10">Manage Subscription</button>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-white/5">
                    <span className="text-emerald-400 text-sm font-medium">{msg}</span>
                    <button 
                        onClick={handleSave}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                    >
                        <Save className="w-4 h-4" /> Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
}

export default Settings;
