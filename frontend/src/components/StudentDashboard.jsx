import React, { useState, useEffect } from 'react';
import {
    User, Users, AlertTriangle, Save, Star, BadgeCheck, Compass,
    Lock, Info, Clock, BookOpen, KeyRound, Search, Award, GraduationCap,
    CheckCircle2, CircleDashed, ChevronLeft, ChevronRight, Briefcase
} from 'lucide-react';
import { apiFetch } from '../api';

/**
 * KOMPONENTY UI
 */

// Modal z animacją wejścia/wyjścia (obsługuje cykl życia poprzez stan render)
const AnimatedModal = ({ isOpen, onClose, children, maxWidth = "max-w-sm", zIndex = "z-[110]" }) => {
    const [render, setRender] = useState(isOpen);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setRender(true);
            const t = setTimeout(() => setVisible(true), 10);
            return () => clearTimeout(t);
        } else {
            setVisible(false);
            const t = setTimeout(() => setRender(false), 300);
            return () => clearTimeout(t);
        }
    }, [isOpen]);

    if (!render) return null;

    return (
        <div className={`fixed top-0 left-0 w-screen h-screen flex items-center justify-center p-4 overflow-hidden ${zIndex}`}>
            <div className={`absolute inset-0 bg-slate-900/30 transition-all duration-300 ${visible ? 'opacity-100 backdrop-blur-md' : 'opacity-0 backdrop-blur-none'}`}></div>
            <div className={`relative bg-white p-8 rounded-[2rem] shadow-2xl w-full ${maxWidth} border border-white/60 transition-all duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${visible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-95'}`}>
                {children}
            </div>
        </div>
    );
};

// Komponent stronicowania dla list (tematy/zadania)
const Pagination = ({ currentPage, totalItems, itemsPerPage, onPageChange }) => {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;
    return (
        <div className="flex justify-between items-center pt-6 mt-4 border-t border-slate-100 w-full">
            <button onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold text-sm flex items-center transition-all active:scale-95"><ChevronLeft className="w-4 h-4 mr-1" /> Poprzednia</button>
            <span className="text-sm text-slate-500 font-bold bg-slate-50 px-4 py-1.5 rounded-lg">Strona {currentPage} z {totalPages}</span>
            <button onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-2.5 rounded-xl hover:bg-slate-100 disabled:opacity-40 text-slate-600 font-bold text-sm flex items-center transition-all active:scale-95">Następna <ChevronRight className="w-4 h-4 ml-1" /></button>
        </div>
    );
};

/**
 * GŁÓWNY KOMPONENT DASHBOARDU
 */
export default function StudentDashboard() {
    // --- STAN DANYCH ---
    const [me, setMe] = useState(null);
    const [myTeam, setMyTeam] = useState(null);
    const [supervisors, setSupervisors] = useState([]);
    const [topics, setTopics] = useState([]);
    const [myAssignment, setMyAssignment] = useState(null);
    const [schedule, setSchedule] = useState({ isActive: false, exists: false, utcEnd: null });

    // --- STAN UI / FORMULARZY ---
    const [activeTab, setActiveTab] = useState('dashboard');
    const [gpaInput, setGpaInput] = useState('');
    const [prefs, setPrefs] = useState({ p1: '', p2: '', p3: '' });
    const [searchTopic, setSearchTopic] = useState('');
    const [pageTopic, setPageTopic] = useState(1);
    const [passwords, setPasswords] = useState({ newPass: '', confirmPass: '' });

    // --- STAN OPERACYJNY ---
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [timeLeft, setTimeLeft] = useState('');
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });

    const ITEMS_PER_PAGE = 6;
    const notify = (title, message, type = 'success') => { setNotification({ isOpen: true, title, message, type }); };

    // --- EFEKTY ---
    useEffect(() => { loadData(); }, []);

    // Licznik czasu do końca etapu
    useEffect(() => {
        if (!schedule.utcEnd || !schedule.isActive) return;
        const updateTimer = () => {
            const now = new Date().getTime();
            const end = new Date(schedule.utcEnd.endsWith('Z') ? schedule.utcEnd : schedule.utcEnd + 'Z').getTime();
            const distance = end - now;
            if (distance < 0) { setTimeLeft('Czas upłynął'); }
            else {
                const d = Math.floor(distance / (1000 * 60 * 60 * 24));
                const h = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                const m = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                setTimeLeft(`${d} dni, ${h} godz. ${m} min.`);
            }
        };
        updateTimer();
        const timerId = setInterval(updateTimer, 60000);
        return () => clearInterval(timerId);
    }, [schedule.utcEnd, schedule.isActive]);

    // --- LOGIKA API ---
    // Pobiera zestaw danych startowych z wielu endpointów
    const loadData = async () => {
        try {
            const [meData, supsData, teamsData, topicsData, assignmentsData] = await Promise.all([
                apiFetch('/Users/me'), apiFetch('/Users/supervisors'), apiFetch('/Teams'),
                apiFetch('/Topics').catch(() => []), apiFetch('/Assignments').catch(() => [])
            ]);

            setMe(meData); setGpaInput(meData.gpa || ''); setSupervisors(supsData); setTopics(topicsData);
            if (meData.teamId) { setMyTeam(teamsData.find(t => t.id === meData.teamId)); }

            const myFinalAssignment = assignmentsData.find(a => a.studentId === meData.id);
            if (myFinalAssignment) setMyAssignment(myFinalAssignment);

            const myPrefs = await apiFetch('/Preferences/me').catch(() => []);
            const newPrefs = { p1: '', p2: '', p3: '' };
            myPrefs.forEach(p => {
                if (p.priority === 1) newPrefs.p1 = p.supervisorId.toString();
                if (p.priority === 2) newPrefs.p2 = p.supervisorId.toString();
                if (p.priority === 3) newPrefs.p3 = p.supervisorId.toString();
            });
            setPrefs(newPrefs);

            try {
                const sched = await apiFetch('/Schedules/current');
                setSchedule({ isActive: sched.isActive, exists: true, utcEnd: sched.endDate });
            } catch { setSchedule({ isActive: false, exists: false, utcEnd: null }); }

        } catch (error) { console.error("Błąd ładowania danych", error); } finally { setLoading(false); }
    };

    const handleConfirmGpa = async (e) => {
        e.preventDefault();
        if (!gpaInput || isNaN(gpaInput) || gpaInput < 2.0 || gpaInput > 5.0) return notify("Błąd", "Podaj poprawną średnią (2.0 - 5.0).", "error");
        try {
            await apiFetch('/Users/me/gpa', { method: 'PUT', body: JSON.stringify({ gpa: parseFloat(gpaInput) }) });
            notify("Sukces", "Średnia zaktualizowana.", "success");
            loadData();
        } catch (error) { notify("Błąd", "Nie udało się zapisać średniej.", "error"); }
    };

    const handleSavePreferences = async () => {
        if (!prefs.p1 || !prefs.p2 || !prefs.p3) return notify("Uwaga", "Wybierz wszystkich 3 promotorów.", "error");
        if (new Set([prefs.p1, prefs.p2, prefs.p3]).size !== 3) return notify("Błąd", "Promotorzy muszą być unikalni.", "error");
        setSaving(true);
        try {
            const payload = { preferences: [{ supervisorId: parseInt(prefs.p1), priority: 1 }, { supervisorId: parseInt(prefs.p2), priority: 2 }, { supervisorId: parseInt(prefs.p3), priority: 3 }] };
            await apiFetch('/Preferences', { method: 'POST', body: JSON.stringify(payload) });
            notify("Sukces", "Preferencje zapisane.", "success");
            loadData();
        } catch (error) { notify("Błąd", error.message || "Błąd zapisu preferencji.", "error"); } finally { setSaving(false); }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.newPass !== passwords.confirmPass) return notify("Błąd", "Hasła muszą być identyczne.", "error");
        if (passwords.newPass.length < 6) return notify("Błąd", "Minimum 6 znaków.", "error");
        try {
            await apiFetch(`/Users/${me.id}`, { method: 'PUT', body: JSON.stringify({ password: passwords.newPass }) });
            notify("Sukces", "Hasło zostało zmienione.", "success");
            setPasswords({ newPass: '', confirmPass: '' });
        } catch (error) { notify("Błąd", "Błąd zmiany hasła.", "error"); }
    };

    const formatFullDate = (utcString) => {
        if (!utcString) return 'Brak daty';
        const str = String(utcString);
        const d = new Date(str.endsWith('Z') ? str : str + 'Z');
        if (isNaN(d.getTime())) return 'Brak daty';
        return d.toLocaleDateString('pl-PL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDEROWANIE ---
    if (loading || !me) return <div className="text-center mt-32 text-slate-500 font-bold animate-pulse">Trwa inicjalizacja...</div>;

    const isLeader = myTeam ? myTeam.leaderId === me.id : true;
    const canEditPreferences = schedule.isActive && isLeader;
    const isFinished = !schedule.isActive && myAssignment != null;
    const executionDate = schedule.utcEnd || (myAssignment ? myAssignment.assignedAt : null);

    const filteredTopics = topics.filter(t => `${t.title} ${t.supervisorName || ''} ${t.description || ''}`.toLowerCase().includes(searchTopic.toLowerCase()));
    const paginatedTopics = filteredTopics.slice((pageTopic - 1) * ITEMS_PER_PAGE, pageTopic * ITEMS_PER_PAGE);

    const hour = new Date().getHours();
    const greeting = hour < 5 ? 'Dobrej nocy' : hour < 18 ? 'Dzień dobry' : 'Dobry wieczór';

    return (
        <div className="space-y-8 relative">
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes springPop { 0% { opacity: 0; transform: scale(0.9) translateY(30px); } 60% { opacity: 1; transform: scale(1.02) translateY(-5px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
                @keyframes smoothFade { from { opacity: 0; backdrop-filter: blur(0px); } to { opacity: 1; backdrop-filter: blur(12px); } }
            `}} />

            {/* POWIADOMIENIA */}
            <AnimatedModal isOpen={notification.isOpen} onClose={() => setNotification({ ...notification, isOpen: false })} zIndex="z-[110]">
                <div className="flex justify-center mb-5">
                    <div className={`p-4 rounded-full ring-8 ${notification.type === 'error' ? 'bg-rose-50 text-rose-600 ring-rose-50' : 'bg-emerald-50 text-emerald-600 ring-emerald-50'}`}>
                        {notification.type === 'error' ? <AlertTriangle className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
                    </div>
                </div>
                <h3 className="font-black text-xl text-slate-800 leading-tight mb-2 text-center">{notification.title}</h3>
                <p className="text-sm text-slate-500 mb-8 font-medium leading-relaxed text-center">{notification.message}</p>
                <button onClick={() => setNotification({ ...notification, isOpen: false })} className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all active:scale-95">
                    Zrozumiałem
                </button>
            </AnimatedModal>

            {/* SEKCJA STATUSU */}
            {isFinished && (
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-1 rounded-[2rem] shadow-lg animate-in zoom-in-95 duration-500">
                    <div className="bg-white p-8 rounded-[1.8rem] flex flex-col sm:flex-row items-center justify-between">
                        <div className="flex items-center mb-4 sm:mb-0">
                            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mr-6 shrink-0 shadow-inner">
                                <Award className="w-10 h-10 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Decyzja Algorytmu</p>
                                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Twój Promotor został przydzielony!</h3>
                                <p className="text-slate-500 mt-1 font-medium">Opiekunem Twojej pracy będzie <strong className="text-indigo-700">{myAssignment.supervisorName}</strong>.</p>
                                {executionDate && <p className="text-xs font-bold text-slate-400 mt-2">Data przydziału: {formatFullDate(executionDate)}</p>}
                            </div>
                        </div>
                        <div className="text-center bg-slate-50 px-8 py-5 rounded-2xl ring-1 ring-slate-200">
                            <span className="block text-[10px] font-black text-slate-400 uppercase mb-1.5 tracking-widest">Tryb realizacji</span>
                            <span className="text-lg font-black text-slate-700">{myAssignment.isTeamAssignment ? 'W Zespole' : 'Indywidualnie'}</span>
                        </div>
                    </div>
                </div>
            )}

            {!isFinished && !schedule.isActive && schedule.exists && (
                <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded-r-2xl flex items-start shadow-sm animate-in fade-in duration-300">
                    <Lock className="w-5 h-5 text-rose-500 mr-3 shrink-0 mt-0.5" />
                    <div><h4 className="text-sm font-bold text-rose-800">Proces wyborów zablokowany</h4><p className="text-sm text-rose-600 mt-1 font-medium">Oczekujemy na uruchomienie algorytmu przydziału.</p></div>
                </div>
            )}

            {!isLeader && schedule.isActive && (
                <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-2xl flex items-start shadow-sm animate-in fade-in duration-300">
                    <Info className="w-5 h-5 text-amber-500 mr-3 shrink-0 mt-0.5" />
                    <div><h4 className="text-sm font-bold text-amber-800">Uczestnictwo w zespole</h4><p className="text-sm text-amber-700 mt-1 font-medium">Liderem jest <strong>{myTeam?.leaderName}</strong>. Tylko on może zarządzać preferencjami.</p></div>
                </div>
            )}

            {/* NAWIGACJA ZAKŁADEK */}
            <div className="mb-8 sticky top-4 z-40">
                <div className="flex bg-white/60 backdrop-blur-2xl p-2 rounded-[2rem] ring-1 ring-slate-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-x-auto w-full gap-2 transition-all duration-500 ease-out">
                    {[
                        { id: 'dashboard', icon: Compass, label: 'Wybory i Status' },
                        { id: 'topics', icon: BookOpen, label: 'Baza Tematów' },
                        { id: 'settings', icon: KeyRound, label: 'Konto i GPA' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex-1 flex justify-center items-center space-x-2 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] whitespace-nowrap 
                            ${activeTab === tab.id ? 'text-indigo-700 bg-white shadow-md scale-100' : 'text-slate-500 hover:text-slate-800 hover:bg-white/40 scale-[0.98] hover:scale-100'}`}
                        >
                            <tab.icon className={`w-5 h-5 transition-transform duration-500 ${activeTab === tab.id ? 'scale-110 text-indigo-600' : 'scale-100'}`} />
                            <span className="relative z-10">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* TREŚĆ ZAKŁADEK */}
            {activeTab === 'dashboard' && (
                <div className="space-y-8 animate-in fade-in duration-500">
                    <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-32 bg-gradient-to-br from-indigo-50 to-white rounded-full -mr-20 -mt-20 opacity-50 pointer-events-none"></div>
                        <div className="relative">
                            <h2 className="text-3xl font-black text-slate-800 mb-3 tracking-tight">{greeting}, {me.firstName}.</h2>
                            <p className="text-slate-500 mb-8 font-medium">Podsumowanie Twoich obowiązków w procesie przydziału.</p>

                            {/* KROKI PROCESU */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                                <div className={`p-6 rounded-3xl border-l-[6px] flex flex-col justify-between h-36 bg-slate-50 ${me.isGPAConfirmed ? 'border-emerald-500' : 'border-amber-500'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Krok 1</span>
                                        {me.isGPAConfirmed ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <CircleDashed className="w-6 h-6 text-amber-500 animate-spin-slow" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg">Weryfikacja GPA</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1">{me.isGPAConfirmed ? 'Potwierdzono poprawnie.' : 'Wymaga weryfikacji w ustawieniach.'}</p>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border-l-[6px] flex flex-col justify-between h-36 bg-slate-50 ${prefs.p1 ? 'border-emerald-500' : 'border-amber-500'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Krok 2</span>
                                        {prefs.p1 ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <CircleDashed className="w-6 h-6 text-amber-500 animate-spin-slow" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg">Deklaracja Wyborów</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1">{prefs.p1 ? 'Złożono listę preferencji.' : 'Brak przypisanych promotorów.'}</p>
                                    </div>
                                </div>
                                <div className={`p-6 rounded-3xl border-l-[6px] flex flex-col justify-between h-36 bg-slate-50 ${myAssignment ? 'border-indigo-500' : 'border-slate-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Krok 3</span>
                                        {myAssignment ? <CheckCircle2 className="w-6 h-6 text-indigo-500" /> : <Clock className="w-6 h-6 text-slate-400" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 text-lg">Wynik Systemowy</h4>
                                        <p className="text-xs font-bold text-slate-500 mt-1">{myAssignment ? 'Przydział zatwierdzony.' : 'Oczekiwanie na algorytm.'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* PROFIL STUDENTA */}
                        <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm flex flex-col justify-center">
                            <div className="flex items-center space-x-4 mb-6">
                                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><GraduationCap className="w-7 h-7" /></div>
                                <div><h3 className="text-xl font-black text-slate-800 tracking-tight">Profil Studenta</h3></div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-4 border-b border-slate-50"><span className="text-slate-500 font-bold text-sm">Nr albumu</span><span className="font-black text-slate-800 font-mono text-lg">{me.albumNumber || 'Brak'}</span></div>
                                <div className="flex justify-between items-center py-4 border-b border-slate-50">
                                    <span className="text-slate-500 font-bold text-sm">Średnia ocen (GPA)</span>
                                    {me.isGPAConfirmed ? <span className="font-black text-indigo-600 text-2xl">{me.gpa?.toFixed(2)}</span> : <span className="text-[10px] font-black uppercase text-rose-500 bg-rose-50 px-3 py-1.5 rounded-lg ring-1 ring-rose-200">Brak Potwierdzenia</span>}
                                </div>
                                {!me.isGPAConfirmed && (<button onClick={() => setActiveTab('settings')} className="w-full mt-2 py-4 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200">Zaktualizuj w ustawieniach</button>)}
                            </div>
                        </div>

                        {/* ZESPÓŁ */}
                        <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm lg:col-span-2">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                                <div className="flex items-center space-x-3"><div className="p-3 bg-sky-50 text-sky-600 rounded-2xl"><Users className="w-6 h-6" /></div><h2 className="text-xl font-black text-slate-800 tracking-tight">Zarządzanie Zespołem</h2></div>
                                {schedule.isActive && timeLeft && <div className="flex items-center px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold ring-1 ring-slate-200"><Clock className="w-4 h-4 mr-2 text-slate-400" /> Pozostało: {timeLeft}</div>}
                            </div>
                            {!myTeam ? (
                                <div className="flex flex-col justify-center items-center h-32 border-2 border-dashed border-slate-200 rounded-[1.5rem] bg-slate-50/50">
                                    <p className="text-slate-500 font-bold text-sm">Realizacja w trybie indywidualnym.</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-[1.5rem] ring-1 ring-slate-200 shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-slate-50 border-b border-slate-200"><tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th className="px-6 py-4">Skład zespołu</th><th className="px-6 py-4 text-center">GPA</th><th className="px-6 py-4 text-center">Funkcja</th></tr></thead>
                                        <tbody className="divide-y divide-slate-100 text-sm">
                                            {myTeam.members.map(m => (
                                                <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-800">{m.fullName} <span className="text-slate-400 font-medium ml-1">({m.albumNumber})</span></td>
                                                    <td className="px-6 py-4 text-center font-black text-slate-600">{m.gpa?.toFixed(2) || '?'}</td>
                                                    <td className="px-6 py-4 text-center">{myTeam.leaderId === m.id ? <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-[10px] font-black bg-amber-100 text-amber-700 ring-1 ring-amber-200 uppercase tracking-wider"><Star className="w-3.5 h-3.5 mr-1.5 fill-amber-500 text-amber-500" />Lider grupy</span> : <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Członek</span>}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* PREFERENCJE */}
                    {!isFinished && (
                        <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-100 pb-6">
                                <div><h3 className="text-2xl font-black text-slate-800 flex items-center tracking-tight"><Compass className="w-7 h-7 mr-3 text-indigo-500" />Wybór Promotorów</h3><p className="text-sm text-slate-500 font-medium mt-1">Definicja priorytetów dla algorytmu.</p></div>
                                {canEditPreferences && (
                                    <button onClick={handleSavePreferences} disabled={saving || !me.isGPAConfirmed} className="flex items-center space-x-2 px-8 py-4 bg-slate-900 text-white font-bold rounded-2xl text-sm hover:bg-slate-800 shadow-lg shadow-slate-200 disabled:opacity-50 transition-all active:scale-95">
                                        <Save className="w-5 h-5 mr-2" /> <span>{saving ? 'Zapisuję...' : 'Zatwierdź'}</span>
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
                                {[1, 2, 3].map((num) => (
                                    <div key={num} className={`p-6 rounded-3xl ring-1 transition-all ${canEditPreferences ? 'bg-slate-50/50 ring-slate-200 hover:ring-indigo-300 focus-within:ring-2 focus-within:ring-indigo-500' : 'bg-slate-100/50 ring-slate-200 opacity-70'}`}>
                                        <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-4 ml-1">Priorytet #{num}</label>
                                        <select value={prefs[`p${num}`]} onChange={(e) => setPrefs({ ...prefs, [`p${num}`]: e.target.value })} disabled={!canEditPreferences || !me.isGPAConfirmed} className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm text-slate-800 font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm cursor-pointer disabled:cursor-not-allowed transition-all">
                                            <option value="">Wybierz promotora...</option>
                                            {supervisors.map(s => <option key={s.id} value={s.id}>{s.title} {s.firstName} {s.lastName} (Limit: {s.maxStudents || 0})</option>)}
                                        </select>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ZAKŁADKA TEMATY */}
            {activeTab === 'topics' && (
                <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm animate-in fade-in duration-500 min-h-[700px] flex flex-col">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6 w-full">
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 flex items-center m-0"><BookOpen className="w-6 h-6 mr-3 text-indigo-500" /> Baza Tematów</h2>
                        </div>
                        <div className="relative w-full md:w-80 shrink-0">
                            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
                            <input placeholder="Filtruj tematy..." value={searchTopic} onChange={e => { setSearchTopic(e.target.value); setPageTopic(1); }} className="w-full pl-11 pr-4 py-3 bg-slate-50 border-0 ring-1 ring-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 flex-grow items-stretch">
                        {paginatedTopics.map(topic => (
                            <div key={topic.id} className="p-7 rounded-3xl ring-1 ring-slate-200 bg-white hover:bg-slate-50 hover:shadow-xl transition-all duration-300 shadow-sm group flex flex-col h-full justify-between">
                                <div>
                                    <div className="flex items-center space-x-3 mb-5">
                                        <div className="p-2.5 bg-indigo-50 rounded-xl"><Briefcase className="w-4 h-4 text-indigo-600" /></div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{topic.supervisorName}</span>
                                    </div>
                                    <h3 className="font-black text-slate-800 text-xl leading-snug mb-3 tracking-tight line-clamp-2">{topic.title}</h3>
                                    <p className="text-sm text-slate-600 font-medium leading-relaxed line-clamp-4">{topic.description}</p>
                                </div>
                            </div>
                        ))}
                        {paginatedTopics.length === 0 && <div className="col-span-full flex justify-center items-center p-12 text-slate-400 font-bold border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50">Brak tematów.</div>}
                    </div>

                    <div className="mt-6">
                        <Pagination currentPage={pageTopic} totalItems={filteredTopics.length} itemsPerPage={ITEMS_PER_PAGE} onPageChange={setPageTopic} />
                    </div>
                </div>
            )}

            {/* ZAKŁADKA USTAWIENIA */}
            {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-500">
                    <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-800 flex items-center mb-6 tracking-tight"><GraduationCap className="w-6 h-6 mr-3 text-indigo-500" /> Dane Akademickie</h2>
                        <div className="bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-200">
                            <h3 className="font-bold text-slate-700 mb-2">GPA</h3>
                            <form onSubmit={handleConfirmGpa} className="space-y-5">
                                <input type="number" step="0.01" min="2.0" max="5.0" required value={gpaInput} onChange={e => setGpaInput(e.target.value)} disabled={!schedule.isActive && schedule.exists} className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none disabled:opacity-50 transition-all" />
                                <button type="submit" disabled={!schedule.isActive && schedule.exists} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all active:scale-95">Zatwierdź</button>
                            </form>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[2rem] ring-1 ring-slate-900/5 shadow-sm">
                        <h2 className="text-xl font-black text-slate-800 flex items-center mb-6 tracking-tight"><KeyRound className="w-6 h-6 mr-3 text-slate-500" /> Bezpieczeństwo</h2>
                        <div className="bg-slate-50 p-6 rounded-3xl ring-1 ring-slate-200">
                            <h3 className="font-bold text-slate-700 mb-2">Zmiana hasła</h3>
                            <form onSubmit={handleChangePassword} className="space-y-5">
                                <input type="password" placeholder="Nowe hasło" required minLength="6" value={passwords.newPass} onChange={e => setPasswords({ ...passwords, newPass: e.target.value })} className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-slate-500 outline-none transition-all" />
                                <input type="password" placeholder="Powtórz hasło" required minLength="6" value={passwords.confirmPass} onChange={e => setPasswords({ ...passwords, confirmPass: e.target.value })} className="w-full bg-white border-0 ring-1 ring-slate-200 rounded-2xl p-4 text-sm font-bold focus:ring-2 focus:ring-slate-500 outline-none transition-all" />
                                <button type="submit" className="w-full py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all active:scale-95">Zaktualizuj</button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}