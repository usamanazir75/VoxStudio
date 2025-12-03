
import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import { User, CreditRequest } from '../types';
import { Check, X, Shield, Users, DollarSign } from 'lucide-react';

const AdminDashboard: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [requests, setRequests] = useState<CreditRequest[]>([]);
    const [activeTab, setActiveTab] = useState<'users'|'requests'>('requests');

    const refresh = () => {
        setUsers(userService.getAllUsers());
        setRequests(userService.getAllRequests().reverse());
    };

    useEffect(() => {
        refresh();
    }, []);

    const handleProcess = (reqId: string, approved: boolean) => {
        userService.processRequest(reqId, approved);
        refresh();
    };

    return (
        <div className="glass rounded-3xl flex flex-col h-full shadow-2xl border border-white/10 bg-slate-900/40 overflow-hidden">
            <div className="p-6 border-b border-white/5 bg-slate-900/50 flex justify-between items-center">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-indigo-400" /> Admin Dashboard
                </h2>
                <div className="flex bg-slate-800 p-1 rounded-lg">
                    <button 
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'requests' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        Credit Requests
                    </button>
                    <button 
                        onClick={() => setActiveTab('users')}
                        className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'users' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                        User Management
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
                {activeTab === 'requests' ? (
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Pending Approvals</h3>
                        {requests.length === 0 && <p className="text-slate-500 text-sm">No requests found.</p>}
                        {requests.map(req => (
                            <div key={req.id} className="bg-slate-800/40 border border-white/5 p-4 rounded-xl flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold">{req.userName}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                                            req.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                                            req.status === 'approved' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                                        }`}>{req.status}</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-1">Requested <span className="text-indigo-300 font-mono">{req.amount}</span> credits • {new Date(req.date).toLocaleDateString()}</p>
                                </div>
                                {req.status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleProcess(req.id, true)} className="p-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg"><Check className="w-4 h-4" /></button>
                                        <button onClick={() => handleProcess(req.id, false)} className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg"><X className="w-4 h-4" /></button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-400">
                            <thead className="bg-slate-900/50 uppercase text-xs font-bold text-slate-500">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">User</th>
                                    <th className="px-4 py-3">Email</th>
                                    <th className="px-4 py-3">Role</th>
                                    <th className="px-4 py-3">Credits</th>
                                    <th className="px-4 py-3 rounded-r-lg">Cloned Voices</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {users.map(u => (
                                    <tr key={u.id} className="hover:bg-white/5">
                                        <td className="px-4 py-3 font-medium text-white">{u.name}</td>
                                        <td className="px-4 py-3">{u.email}</td>
                                        <td className="px-4 py-3"><span className="bg-slate-700 px-2 py-0.5 rounded text-xs">{u.role}</span></td>
                                        <td className="px-4 py-3 font-mono text-indigo-300">{u.credits}</td>
                                        <td className="px-4 py-3">{u.clonedVoices?.length || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;
