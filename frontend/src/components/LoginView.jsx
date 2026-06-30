import React, { useState } from 'react';
import { Sparkles, Loader2, Lock, Mail, AlertTriangle } from 'lucide-react';

export default function LoginView({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(''); // Czyszczenie błędu przy nowej próbie

        try {
            const response = await fetch('https://localhost:7094/api/Auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            if (!response.ok) {
                throw new Error('Błędne dane logowania');
            }

            const data = await response.json();

            localStorage.setItem('token', data.token);
            localStorage.setItem('role', data.role.toLowerCase());
            localStorage.setItem('fullName', data.fullName);

            onLogin(data.role.toLowerCase());
        } catch (err) {
            // Ustawiamy komunikat błędu
            setError('Nieprawidłowy adres e-mail lub hasło dostępu. Spróbuj ponownie.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-indigo-100 selection:text-indigo-900 relative">

            {/* ANIMACJA CSS DLA BŁĘDU */}
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slideDownFade {
                    0% { opacity: 0; transform: translateY(-15px) scale(0.98); }
                    100% { opacity: 1; transform: translateY(0) scale(1); }
                }
                .animate-error-slide {
                    animation: slideDownFade 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}} />

            {/* GŁÓWNA KARTA LOGOWANIA */}
            <div className="max-w-md w-full bg-white p-10 rounded-[2rem] ring-1 ring-slate-900/5 shadow-2xl relative overflow-hidden transition-all duration-300">

                <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-50 to-white rounded-full -mr-20 -mt-20 opacity-50 pointer-events-none"></div>

                <div className="relative">
                    <div className="flex items-center space-x-4 mb-10 justify-center">
                        <div className="bg-gradient-to-br from-indigo-600 to-violet-600 p-3.5 rounded-[1.25rem] shadow-lg shadow-indigo-200">
                            <Sparkles className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black tracking-tight text-slate-900">Promoter<span className="text-indigo-600">Selection</span></h1>
                            <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase mt-0.5">Logowanie do systemu</p>
                        </div>
                    </div>

                    {/* BANER BŁĘDU*/}
                    {error && (
                        <div className="mb-6 p-4 bg-rose-50 rounded-2xl ring-1 ring-rose-200 flex items-start space-x-3 animate-error-slide">
                            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <h4 className="text-sm font-black text-rose-800">Błąd logowania</h4>
                                <p className="text-xs font-bold text-rose-600 mt-1">{error}</p>
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                        <div>
                            <div className="relative flex items-center">
                                <Mail className="absolute left-5 w-5 h-5 text-slate-400" />
                                <input
                                    type="email" required placeholder="Adres e-mail"
                                    value={email} onChange={(e) => setEmail(e.target.value)}
                                    className={`w-full pl-14 pr-4 py-4 bg-slate-50 border-0 ring-1 rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all text-slate-800 placeholder:font-medium
                                    ${error ? 'ring-rose-200 focus:ring-rose-500' : 'ring-slate-200 focus:ring-indigo-500'}`}
                                />
                            </div>
                        </div>
                        <div>
                            <div className="relative flex items-center">
                                <Lock className="absolute left-5 w-5 h-5 text-slate-400" />
                                <input
                                    type="password" required placeholder="Hasło dostępu"
                                    value={password} onChange={(e) => setPassword(e.target.value)}
                                    className={`w-full pl-14 pr-4 py-4 bg-slate-50 border-0 ring-1 rounded-2xl text-sm font-bold focus:ring-2 outline-none transition-all text-slate-800 placeholder:font-medium
                                    ${error ? 'ring-rose-200 focus:ring-rose-500' : 'ring-slate-200 focus:ring-indigo-500'}`}
                                />
                            </div>
                        </div>
                        <div className="pt-2">
                            <button
                                type="submit" disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl shadow-lg shadow-slate-200 hover:bg-slate-800 transition-all active:scale-95 flex justify-center items-center disabled:opacity-70 disabled:scale-100"
                            >
                                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Zaloguj się'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}