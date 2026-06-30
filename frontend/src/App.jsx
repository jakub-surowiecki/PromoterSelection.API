import React, { useState, useEffect } from 'react';
import StudentDashboard from './components/StudentDashboard';
import SupervisorDashboard from './components/SupervisorDashboard';
import AdminDashboard from './components/AdminDashboard';
import LoginView from './components/LoginView';
import { LogOut, Sparkles, UserCircle } from 'lucide-react';

export default function App() {
    const [role, setRole] = useState(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [fullName, setFullName] = useState('');

    useEffect(() => {
        // Sprawdzamy, czy użytkownik jest już zalogowany w pamięci przeglądarki
        const token = localStorage.getItem('token');
        const savedRole = localStorage.getItem('role');
        const savedName = localStorage.getItem('fullName');

        if (token && savedRole) {
            setIsAuthenticated(true);
            setRole(savedRole);
            setFullName(savedName || 'Użytkownik');
        }
    }, []);

    const handleLogin = (userRole) => {
        setIsAuthenticated(true);
        setRole(userRole);
        setFullName(localStorage.getItem('fullName'));
    };

    const handleLogout = () => {
        localStorage.clear();
        setIsAuthenticated(false);
        setRole(null);
    };

    if (!isAuthenticated) {
        return <LoginView onLogin={handleLogin} />;
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-lg border-b border-slate-200/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center h-20">
                    <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
                            <Sparkles className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-slate-900">Promoter<span className="text-indigo-600">Selection</span></h1>
                            <p className="text-[10px] font-semibold tracking-widest text-slate-400 uppercase">Wydziałowy System Przydziału</p>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4 p-1.5">
                        <div className="flex items-center space-x-2 text-sm font-semibold text-slate-700 bg-slate-100 px-4 py-2 rounded-xl ring-1 ring-slate-200">
                            <UserCircle className="w-5 h-5 text-indigo-500" />
                            <span>{fullName}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-bold bg-rose-50 text-rose-600 rounded-xl ring-1 ring-rose-200 hover:bg-rose-100 transition-colors flex items-center space-x-2"
                        >
                            <LogOut className="w-4 h-4" />
                            <span>Wyloguj</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
                    {role === 'student' && <StudentDashboard />}
                    {role === 'supervisor' && <SupervisorDashboard />}
                    {role === 'admin' && <AdminDashboard />}
                </div>
            </main>
        </div>
    );
}