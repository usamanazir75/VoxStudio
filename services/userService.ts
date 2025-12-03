
import { User, CreditRequest, Voice, VoiceCategory, VoiceQualityReport } from '../types';

const USERS_KEY = 'vox_users_db';
const REQUESTS_KEY = 'vox_requests_db';
const CURRENT_USER_KEY = 'vox_current_user';

// Initialize DB if empty
const initDB = () => {
    if (!localStorage.getItem(USERS_KEY)) {
        // Create Default Admin with specific credentials
        const adminUser: User = {
            id: 'admin_01',
            name: 'Vox Admin',
            email: 'voxstudioadmin@gmail.com',
            password: '123VS#', 
            role: 'admin',
            credits: 999999,
            clonedVoices: []
        };
        localStorage.setItem(USERS_KEY, JSON.stringify([adminUser]));
    }
    if (!localStorage.getItem(REQUESTS_KEY)) {
        localStorage.setItem(REQUESTS_KEY, JSON.stringify([]));
    }
};

export const userService = {
    // --- AUTHENTICATION ---
    loginWithEmail: (email: string, password: string): { success: boolean; user?: User; error?: string } => {
        initDB();
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
            return { success: true, user };
        }
        return { success: false, error: 'Invalid email or password' };
    },

    registerWithEmail: (name: string, email: string, password: string): { success: boolean; user?: User; error?: string } => {
        initDB();
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        
        if (users.find(u => u.email === email)) {
            return { success: false, error: 'User already exists' };
        }

        const newUser: User = {
            id: `user_${Date.now()}`,
            name,
            email,
            password,
            role: 'user',
            credits: 10000,
            clonedVoices: [],
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}`
        };

        users.push(newUser);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(newUser));
        
        return { success: true, user: newUser };
    },

    loginWithGoogle: (email: string, name: string, avatar?: string): User => {
        initDB();
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        let user = users.find(u => u.email === email);

        if (!user) {
            // Register new google user
            user = {
                id: `user_${Date.now()}`,
                name,
                email,
                role: email === 'voxstudioadmin@gmail.com' ? 'admin' : 'user',
                credits: 10000, 
                clonedVoices: [],
                avatar: avatar
            };
            users.push(user);
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
        } else {
            // Update admin status if email matches (security fallback for demo)
             if (email === 'voxstudioadmin@gmail.com' && user.role !== 'admin') {
                 user.role = 'admin';
                 // Update DB
                 const idx = users.findIndex(u => u.id === user?.id);
                 if(idx !== -1) {
                     users[idx] = user;
                     localStorage.setItem(USERS_KEY, JSON.stringify(users));
                 }
             }
        }

        localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
        return user;
    },

    getCurrentUser: (): User | null => {
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (!stored) return null;
        // Refresh from DB to get latest credits
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const parsed: User = JSON.parse(stored);
        const fresh = users.find(u => u.id === parsed.id);
        return fresh || null;
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    // --- CREDITS & DATA ---
    deductCredits: (userId: string, amount: number): boolean => {
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) return false;

        // Admin has unlimited in practice, but we track numbers
        if (users[index].role === 'admin') return true;

        if (users[index].credits >= amount) {
            users[index].credits -= amount;
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            // Update current session if match
            const current = userService.getCurrentUser();
            if (current && current.id === userId) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
            }
            return true;
        }
        return false;
    },

    requestCredits: (userId: string, userName: string, amount: number) => {
        const requests: CreditRequest[] = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
        const newReq: CreditRequest = {
            id: `req_${Date.now()}`,
            userId,
            userName,
            amount,
            status: 'pending',
            date: Date.now()
        };
        requests.push(newReq);
        localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    },

    // --- ADMIN ---
    getAllUsers: (): User[] => {
        return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    },

    getAllRequests: (): CreditRequest[] => {
        return JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
    },

    processRequest: (reqId: string, approved: boolean) => {
        const requests: CreditRequest[] = JSON.parse(localStorage.getItem(REQUESTS_KEY) || '[]');
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        
        const reqIndex = requests.findIndex(r => r.id === reqId);
        if (reqIndex === -1) return;

        requests[reqIndex].status = approved ? 'approved' : 'rejected';
        
        if (approved) {
            const userIndex = users.findIndex(u => u.id === requests[reqIndex].userId);
            if (userIndex !== -1) {
                users[userIndex].credits += requests[reqIndex].amount;
                localStorage.setItem(USERS_KEY, JSON.stringify(users));
            }
        }
        localStorage.setItem(REQUESTS_KEY, JSON.stringify(requests));
    },

    updateProfile: (userId: string, data: Partial<User>) => {
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            users[index] = { ...users[index], ...data };
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            // Update session
            const current = userService.getCurrentUser();
            if (current && current.id === userId) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
            }
        }
    },

    // Updated with Quality Report support
    addClonedVoice: (userId: string, voiceName: string, gender: 'Male'|'Female', qualityReport?: VoiceQualityReport) => {
        const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        const index = users.findIndex(u => u.id === userId);
        if (index !== -1) {
            const newVoice: Voice = {
                id: `cloned_${userId}_${Date.now()}`,
                name: voiceName,
                category: VoiceCategory.CLONED,
                gender: gender,
                tags: ['Cloned', 'Custom', 'High-Fidelity'],
                apiVoiceName: gender === 'Male' ? 'Fenrir' : 'Kore', // Mapping to base models for demo
                language: 'en-US',
                isCloned: true,
                qualityReport: qualityReport
            };
            
            if(!users[index].clonedVoices) users[index].clonedVoices = [];
            users[index].clonedVoices.push(newVoice);
            
            localStorage.setItem(USERS_KEY, JSON.stringify(users));
            
            const current = userService.getCurrentUser();
            if (current && current.id === userId) {
                localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(users[index]));
            }
        }
    }
};