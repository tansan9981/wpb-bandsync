
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, 
  deleteDoc, query, where, serverTimestamp, setDoc, getDoc 
} from "firebase/firestore";
import { 
  Calendar as CalendarIcon, Users, User, Settings, Check, 
  X, ChevronLeft, ChevronRight, Shield, LogOut, Trash2, KeyRound, Copy
} from 'lucide-react';

// --- Firebase Configuration ---
// ⚠️ 本番環境ではここに取得した設定を貼り付けます
const firebaseConfig = {
  apiKey: "AIzaSyCJewcEeVpF83wLDuYnFljlH2b9RxVf9iI",
  authDomain: "wpb2025-d1432.firebaseapp.com",
  projectId: "wpb2025-d1432",
  storageBucket: "wpb2025-d1432.firebasestorage.app",
  messagingSenderId: "834123232552",
  appId: "1:834123232552:web:4acd559725a5892aa6cc1d"
};

// Initialize Firebase (プレビュー環境ではダミーを使用)
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase not configured or running in preview.");
}

// --- Mock Database for Preview ---
const mockDB = {
  users: [],
  groups: [],
  schedules: []
};

// --- Helper: Generate Join Code ---
const generateJoinCode = () => {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
};

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mySchedule');
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', displayName: '', year: '2026年度', parts: [] });
  const [authError, setAuthError] = useState('');

  // Data state
  const [mySchedules, setMySchedules] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [activeGroup, setActiveGroup] = useState(null);
  
  // Admin state
  const [allUsers, setAllUsers] = useState([]);
  const [allGroups, setAllGroups] = useState([]);

  // --- Auth Functions ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    if (isLogin) {
      // Login
      try {
        if(db) {
          const q = query(collection(db, "users"), where("username", "==", authForm.username), where("password", "==", authForm.password));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setUser({ id: querySnapshot.docs[0].id, ...userData });
          } else {
            setAuthError('ユーザー名またはパスワードが間違っています。');
          }
        } else {
          // Mock login
          const mockUser = mockDB.users.find(u => u.username === authForm.username && u.password === authForm.password);
          if (mockUser) setUser(mockUser);
          else setAuthError('ユーザー名またはパスワードが間違っています。(プレビュー環境)');
        }
      } catch (err) {
        setAuthError(err.message);
      }
    } else {
      // Register
      if (!authForm.username || !authForm.password || !authForm.displayName) {
        setAuthError('必須項目を入力してください。');
        return;
      }
      try {
        const newUser = {
          username: authForm.username,
          password: authForm.password, // 本番ではハッシュ化推奨
          displayName: authForm.displayName,
          year: authForm.year,
          parts: authForm.parts,
          createdAt: new Date().toISOString()
        };
        
        if(db) {
           // Check if username exists
           const q = query(collection(db, "users"), where("username", "==", authForm.username));
           const querySnapshot = await getDocs(q);
           if(!querySnapshot.empty) {
               setAuthError('このユーザー名は既に使用されています。');
               return;
           }
           const docRef = await addDoc(collection(db, "users"), newUser);
           setUser({ id: docRef.id, ...newUser });
        } else {
           if(mockDB.users.find(u => u.username === authForm.username)) {
               setAuthError('このユーザー名は既に使用されています。(プレビュー環境)');
               return;
           }
           const id = Math.random().toString(36).substr(2, 9);
           const u = { id, ...newUser };
           mockDB.users.push(u);
           setUser(u);
        }
      } catch (err) {
        setAuthError(err.message);
      }
    }
  };

  const handleLogout = () => {
    setUser(null);
    setActiveTab('mySchedule');
    setActiveGroup(null);
    setAuthForm({ username: '', password: '', displayName: '', year: '2026年度', parts: [] });
  };

  const togglePart = (part) => {
    setAuthForm(prev => {
      const parts = prev.parts.includes(part)
        ? prev.parts.filter(p => p !== part)
        : [...prev.parts, part];
      return { ...prev, parts };
    });
  };

  // --- Main App Logic ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">WPB BandSync</h1>
            <p className="text-sm text-gray-500 mt-2">バンドメンバーとスケジュールを共有しよう</p>
          </div>
          
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsLogin(true); setAuthError(''); }}
            >
              ログイン
            </button>
            <button 
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => { setIsLogin(false); setAuthError(''); }}
            >
              新規登録
            </button>
          </div>

          {authError && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
              {authError}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ユーザー名 (ログインID)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">@</span>
                <input 
                  type="text" 
                  className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" 
                  value={authForm.username} 
                  onChange={e => setAuthForm({...authForm, username: e.target.value})}
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">パスワード</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><KeyRound size={14}/></span>
                <input 
                  type="password" 
                  className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-shadow" 
                  value={authForm.password} 
                  onChange={e => setAuthForm({...authForm, password: e.target.value})}
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">表示名 (ニックネーム)</label>
                  <input 
                    type="text" 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                    value={authForm.displayName} 
                    onChange={e => setAuthForm({...authForm, displayName: e.target.value})}
                    required={!isLogin}
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">入学年度</label>
                  <select 
                    className="block w-full px-3 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    value={authForm.year}
                    onChange={e => setAuthForm({...authForm, year: e.target.value})}
                  >
                    {['2026年度', '2025年度', '2024年度', '2023年度', 'OB/OG'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">担当パート (複数選択可)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ボーカル', 'ギター', 'ベース', 'ドラム', 'キーボード'].map(part => (
                      <button
                        type="button"
                        key={part}
                        onClick={() => togglePart(part)}
                        className={`py-2 px-3 border rounded-xl text-sm flex items-center justify-center transition-colors ${
                          authForm.parts.includes(part)
                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-medium'
                            : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {authForm.parts.includes(part) && <Check size={14} className="mr-1" />}
                        {part}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            <button 
              type="submit" 
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mt-6 transition-colors"
            >
              {isLogin ? 'ログイン' : '登録してはじめる'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- Main App Shell ---
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-900 tracking-tight">WPB BandSync</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-md mx-auto overflow-y-auto pb-20 relative">
        {activeTab === 'mySchedule' && <MyScheduleView user={user} />}
        {activeTab === 'groups' && <GroupsView user={user} activeGroup={activeGroup} setActiveGroup={setActiveGroup} />}
        {activeTab === 'profile' && <ProfileView user={user} />}
        {/* 管理者IDを 'Boss' に変更 */}
        {activeTab === 'admin' && user.username === 'Boss' && <AdminView user={user} />}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-20 pb-safe">
        <div className="max-w-md mx-auto flex">
          <button 
            onClick={() => setActiveTab('mySchedule')} 
            className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 transition-colors ${activeTab === 'mySchedule' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <CalendarIcon size={22} strokeWidth={activeTab === 'mySchedule' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">マイ予定</span>
          </button>
          <button 
            onClick={() => { setActiveTab('groups'); setActiveGroup(null); }} 
            className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 transition-colors ${activeTab === 'groups' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <Users size={22} strokeWidth={activeTab === 'groups' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">グループ</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')} 
            className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 transition-colors ${activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
          >
            <User size={22} strokeWidth={activeTab === 'profile' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">マイページ</span>
          </button>
          {/* 管理者IDを 'Boss' に変更 */}
          {user.username === 'Boss' && (
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 transition-colors ${activeTab === 'admin' ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Shield size={22} strokeWidth={activeTab === 'admin' ? 2.5 : 2} />
              <span className="text-[10px] font-medium">管理者</span>
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

// ==========================================
// Views
// ==========================================

// --- MyScheduleView ---
function MyScheduleView({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [mySchedules, setMySchedules] = useState([]); // Array of rules

  useEffect(() => {
    // Mock Load schedules
    setMySchedules(mockDB.schedules.filter(s => s.userId === user.id) || []);
  }, [user]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  // Check if a specific date/period is NG based on rules
  const isNG = (date, period) => {
    return mySchedules.some(rule => {
      if (rule.period !== period) return false;
      const d = new Date(date);
      if (rule.type === 'once') return rule.date === d.toISOString().split('T')[0];
      if (rule.type === 'daily') return true;
      if (rule.type === 'weekly') return d.getDay() === rule.dayOfWeek;
      if (rule.type === 'monthly') return d.getDate() === rule.dayOfMonth;
      return false;
    });
  };

  const getPeriodsForDate = (date) => {
    const day = date.getDay();
    return (day === 0 || day === 6) ? 4 : 6;
  };

  const toggleNG = (date, period, type = 'once') => {
    const dStr = date.toISOString().split('T')[0];
    
    // Find existing rule
    const existingIdx = mySchedules.findIndex(r => 
      r.period === period && (
        (r.type === 'once' && r.date === dStr) ||
        (r.type === 'daily' && type === 'daily') ||
        (r.type === 'weekly' && r.dayOfWeek === date.getDay() && type === 'weekly') ||
        (r.type === 'monthly' && r.dayOfMonth === date.getDate() && type === 'monthly')
      )
    );

    let newSchedules = [...mySchedules];
    if (existingIdx >= 0) {
      newSchedules.splice(existingIdx, 1);
    } else {
      let newRule = { id: Math.random().toString(), userId: user.id, period, type };
      if (type === 'once') newRule.date = dStr;
      if (type === 'weekly') newRule.dayOfWeek = date.getDay();
      if (type === 'monthly') newRule.dayOfMonth = date.getDate();
      newSchedules.push(newRule);
    }
    setMySchedules(newSchedules);
    // update mockDB
    mockDB.schedules = [...mockDB.schedules.filter(s => s.userId !== user.id), ...newSchedules];
  };

  const renderCalendar = () => {
    const days = [];
    const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
    
    // Weekday headers
    const headers = weekDays.map((day, idx) => (
      <div key={`h-${idx}`} className={`text-center text-xs font-medium py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
        {day}
      </div>
    ));

    // Empty slots before 1st day
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="p-2"></div>);
    }

    // Days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const isToday = new Date().toDateString() === d.toDateString();
      const periods = getPeriodsForDate(d);
      
      // Count NG periods for this day
      let ngCount = 0;
      for(let p=1; p<=periods; p++) { if(isNG(d, p)) ngCount++; }
      const hasNG = ngCount > 0;
      
      days.push(
        <div key={i} onClick={() => setSelectedDate(d)} className="p-1 cursor-pointer">
          <div className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
            isToday ? 'bg-indigo-50 border border-indigo-200' : 'bg-white shadow-sm border border-gray-100 hover:border-indigo-300'
          } ${selectedDate?.toDateString() === d.toDateString() ? 'ring-2 ring-indigo-500' : ''}`}>
            <span className={`text-sm font-medium ${d.getDay()===0 ? 'text-red-500' : d.getDay()===6 ? 'text-blue-500' : 'text-gray-700'}`}>
              {i}
            </span>
            {hasNG && (
              <div className="flex gap-0.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} className="text-gray-600"/></button>
          <h2 className="text-lg font-bold text-gray-800">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h2>
          <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} className="text-gray-600"/></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {headers}
          {days}
        </div>
      </div>
    );
  };

  const renderDayDetail = () => {
    if (!selectedDate) return null;
    const periods = getPeriodsForDate(selectedDate);
    
    return (
      <div className="p-4 bg-white border-t rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4 animate-in slide-in-from-bottom-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">
            {selectedDate.getMonth() + 1}/{selectedDate.getDate()} ({['日','月','火','水','木','金','土'][selectedDate.getDay()]}) の予定
          </h3>
          <button onClick={() => setSelectedDate(null)} className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
            <X size={16} />
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">タップして「行けない時間」を登録します。再度タップで解除できます。</p>
        
        <div className="space-y-3">
          {[...Array(periods)].map((_, i) => {
            const period = i + 1;
            const currentlyNG = isNG(selectedDate, period);
            
            // Determine active rule type for this specific slot if NG
            let activeRuleType = null;
            if(currentlyNG) {
                const rule = mySchedules.find(r => r.period === period && (
                    (r.type === 'once' && r.date === selectedDate.toISOString().split('T')[0]) ||
                    r.type === 'daily' ||
                    (r.type === 'weekly' && r.dayOfWeek === selectedDate.getDay()) ||
                    (r.type === 'monthly' && r.dayOfMonth === selectedDate.getDate())
                ));
                if(rule) activeRuleType = rule.type;
            }

            return (
              <div key={period} className="flex items-center gap-2">
                <div className="w-10 text-center font-bold text-gray-700 bg-gray-100 py-2 rounded-xl text-sm">{period}限</div>
                
                <div className="flex-1 grid grid-cols-4 gap-1">
                  <button 
                    onClick={() => toggleNG(selectedDate, period, 'once')}
                    className={`py-2 text-[10px] font-medium rounded-xl transition-colors ${currentlyNG && activeRuleType === 'once' ? 'bg-red-500 text-white shadow-md shadow-red-200' : currentlyNG ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
                    disabled={currentlyNG && activeRuleType !== 'once'}
                  >この日</button>
                  <button 
                    onClick={() => toggleNG(selectedDate, period, 'weekly')}
                    className={`py-2 text-[10px] font-medium rounded-xl transition-colors ${currentlyNG && activeRuleType === 'weekly' ? 'bg-red-500 text-white shadow-md shadow-red-200' : currentlyNG ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
                    disabled={currentlyNG && activeRuleType !== 'weekly'}
                  >毎週</button>
                  <button 
                    onClick={() => toggleNG(selectedDate, period, 'monthly')}
                    className={`py-2 text-[10px] font-medium rounded-xl transition-colors ${currentlyNG && activeRuleType === 'monthly' ? 'bg-red-500 text-white shadow-md shadow-red-200' : currentlyNG ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
                    disabled={currentlyNG && activeRuleType !== 'monthly'}
                  >毎月</button>
                   <button 
                    onClick={() => toggleNG(selectedDate, period, 'daily')}
                    className={`py-2 text-[10px] font-medium rounded-xl transition-colors ${currentlyNG && activeRuleType === 'daily' ? 'bg-red-500 text-white shadow-md shadow-red-200' : currentlyNG ? 'bg-gray-100 text-gray-400 opacity-50 cursor-not-allowed' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'}`}
                    disabled={currentlyNG && activeRuleType !== 'daily'}
                  >毎日</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="pb-4">
      {renderCalendar()}
      {renderDayDetail()}
    </div>
  );
}

// --- GroupsView ---
function GroupsView({ user, activeGroup, setActiveGroup }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  // Group Detail State
  const [groupMembers, setGroupMembers] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [groupViewTab, setGroupViewTab] = useState('calendar'); // 'calendar' or 'list'
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    // Mock Load Groups
    const userGroups = mockDB.groups.filter(g => g.members.includes(user.id));
    setGroups(userGroups);
  }, [user]);

  useEffect(() => {
    if (activeGroup) {
      // Mock load members and schedules for this group
      const members = mockDB.users.filter(u => activeGroup.members.includes(u.id));
      setGroupMembers(members);
      const scheds = mockDB.schedules.filter(s => activeGroup.members.includes(s.userId));
      setAllSchedules(scheds);
    }
  }, [activeGroup]);

  const handleCreateGroup = () => {
    if (!newGroupName) return;
    const newGroup = {
      id: Math.random().toString(36).substr(2, 9),
      name: newGroupName,
      joinCode: generateJoinCode(),
      members: [user.id],
      createdAt: new Date().toISOString()
    };
    mockDB.groups.push(newGroup);
    setGroups([...groups, newGroup]);
    setNewGroupName('');
    setShowCreate(false);
  };

  const handleJoinGroup = () => {
    if (!joinCode) return;
    const code = joinCode.toUpperCase();
    const groupIndex = mockDB.groups.findIndex(g => g.joinCode === code);
    
    if (groupIndex >= 0) {
      const group = mockDB.groups[groupIndex];
      if (!group.members.includes(user.id)) {
        group.members.push(user.id);
        setGroups([...groups, group]);
      }
      setJoinCode('');
      setShowJoin(false);
    } else {
      alert("無効な参加コードです");
    }
  };

  const isUserNG = (userId, date, period) => {
    return allSchedules.some(rule => {
      if (rule.userId !== userId || rule.period !== period) return false;
      const d = new Date(date);
      if (rule.type === 'once') return rule.date === d.toISOString().split('T')[0];
      if (rule.type === 'daily') return true;
      if (rule.type === 'weekly') return d.getDay() === rule.dayOfWeek;
      if (rule.type === 'monthly') return d.getDate() === rule.dayOfMonth;
      return false;
    });
  };

  const getDayStatus = (date) => {
    if(groupMembers.length === 0) return { isAvailable: false, detail: [] };
    const periods = (date.getDay() === 0 || date.getDay() === 6) ? 4 : 6;
    const detail = [];
    let isAnyPeriodAllOK = false;

    for (let p = 1; p <= periods; p++) {
      const ngMembers = groupMembers.filter(m => isUserNG(m.id, date, p));
      detail.push({ period: p, ngMembers });
      if (ngMembers.length === 0) isAnyPeriodAllOK = true;
    }
    return { isAvailable: isAnyPeriodAllOK, detail };
  };

  const generateAvailableList = () => {
    const list = [];
    const today = new Date();
    // Look ahead 60 days
    for(let i=0; i<60; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        const status = getDayStatus(d);
        if(status.isAvailable) {
            const okPeriods = status.detail.filter(p => p.ngMembers.length === 0).map(p => p.period);
            list.push({ date: d, okPeriods });
        }
    }
    return list;
  };

  // --- Group Detail View ---
  if (activeGroup) {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

    const renderGroupCalendar = () => {
      const days = [];
      const weekDays = ['日', '月', '火', '水', '木', '金', '土'];
      
      const headers = weekDays.map((day, idx) => (
        <div key={`h-${idx}`} className={`text-center text-xs font-medium py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'}`}>
          {day}
        </div>
      ));

      for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(<div key={`empty-${i}`} className="p-2"></div>);
      }

      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const status = getDayStatus(d);
        
        days.push(
          <div key={i} onClick={() => setSelectedDate(d)} className="p-1 cursor-pointer">
            <div className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all ${
               status.isAvailable ? 'bg-emerald-50 border border-emerald-300 shadow-sm' : 'bg-white border border-gray-100'
            } ${selectedDate?.toDateString() === d.toDateString() ? 'ring-2 ring-indigo-500' : ''}`}>
              <span className={`text-sm font-medium ${d.getDay()===0 ? 'text-red-500' : d.getDay()===6 ? 'text-blue-500' : 'text-gray-700'}`}>
                {i}
              </span>
              {status.isAvailable && (
                <Check size={12} className="text-emerald-500 mt-1" strokeWidth={3} />
              )}
            </div>
          </div>
        );
      }

      return (
        <div className="p-4">
          <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronLeft size={20} className="text-gray-600"/></button>
            <h2 className="text-lg font-bold text-gray-800">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h2>
            <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1 hover:bg-gray-100 rounded-lg"><ChevronRight size={20} className="text-gray-600"/></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {headers}
            {days}
          </div>
        </div>
      );
    };

    const renderGroupDayDetail = () => {
      if (!selectedDate) return null;
      const status = getDayStatus(selectedDate);
      
      return (
        <div className="p-4 bg-white border-t rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4 animate-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedDate.getMonth() + 1}/{selectedDate.getDate()} ({['日','月','火','水','木','金','土'][selectedDate.getDay()]}) の空き状況
            </h3>
            <button onClick={() => setSelectedDate(null)} className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200">
              <X size={16} />
            </button>
          </div>
          
          <div className="space-y-2">
            {status.detail.map((p) => {
              const isAllOK = p.ngMembers.length === 0;
              return (
                <div key={p.period} className={`p-3 rounded-xl flex items-center gap-3 border ${isAllOK ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                  <div className={`w-12 text-center font-bold text-sm py-1 rounded-lg ${isAllOK ? 'bg-emerald-200 text-emerald-800' : 'bg-gray-200 text-gray-700'}`}>
                    {p.period}限
                  </div>
                  <div className="flex-1">
                    {isAllOK ? (
                      <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                        <Check size={16} /> 全員空いています！
                      </span>
                    ) : (
                      <div className="text-xs text-gray-600">
                        <span className="font-medium text-red-500">{p.ngMembers.length}人NG</span>: 
                        {p.ngMembers.map(m => m.displayName).join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    };

    const renderAvailableList = () => {
        const list = generateAvailableList();
        if(list.length === 0) return <div className="p-8 text-center text-gray-500">直近60日で全員が揃う日はありません。</div>;
        
        return (
            <div className="p-4 space-y-3">
                {list.map((item, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-100 flex items-center justify-between">
                        <div>
                            <div className="text-sm text-gray-500 mb-1">{item.date.getFullYear()}年</div>
                            <div className="text-xl font-bold text-gray-800">
                                {item.date.getMonth()+1}/{item.date.getDate()} <span className="text-sm text-gray-500">({['日','月','火','水','木','金','土'][item.date.getDay()]})</span>
                            </div>
                        </div>
                        <div className="flex gap-1 flex-wrap justify-end max-w-[150px]">
                            {item.okPeriods.map(p => (
                                <span key={p} className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-1 rounded-md">
                                    {p}限
                                </span>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setActiveGroup(null)} className="p-2 -ml-2 bg-gray-50 rounded-full hover:bg-gray-100">
            <ChevronLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{activeGroup.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">メンバー {groupMembers.length}人</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                参加コード: <strong className="font-mono tracking-widest">{activeGroup.joinCode}</strong>
              </span>
            </div>
          </div>
        </div>

        <div className="flex p-2 bg-gray-100 m-4 rounded-xl">
            <button 
                onClick={() => setGroupViewTab('calendar')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${groupViewTab === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}
            >カレンダー</button>
            <button 
                onClick={() => setGroupViewTab('list')}
                className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${groupViewTab === 'list' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}
            >空いている日一覧</button>
        </div>

        {groupViewTab === 'calendar' ? (
            <>
                {renderGroupCalendar()}
                {renderGroupDayDetail()}
            </>
        ) : (
            renderAvailableList()
        )}
      </div>
    );
  }

  // --- Group List View ---
  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2">
        <button 
          onClick={() => { setShowCreate(true); setShowJoin(false); }}
          className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-colors"
        >
          ＋ 新規作成
        </button>
        <button 
          onClick={() => { setShowJoin(true); setShowCreate(false); }}
          className="flex-1 bg-white text-indigo-600 border border-indigo-200 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors"
        >
          コードで参加
        </button>
      </div>

      {showCreate && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 animate-in fade-in zoom-in-95">
          <h3 className="text-sm font-bold text-gray-800 mb-3">新しいグループを作成</h3>
          <input 
            type="text" 
            placeholder="グループ名 (例: 夏フェスバンド)" 
            className="w-full border border-gray-300 p-3 rounded-xl mb-3 text-sm focus:ring-2 focus:ring-indigo-500"
            value={newGroupName}
            onChange={e => setNewGroupName(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleCreateGroup} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium">作成</button>
            <button onClick={() => setShowCreate(false)} className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">キャンセル</button>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 animate-in fade-in zoom-in-95">
          <h3 className="text-sm font-bold text-gray-800 mb-3">グループに参加</h3>
          <input 
            type="text" 
            placeholder="6桁の参加コードを入力" 
            className="w-full border border-gray-300 p-3 rounded-xl mb-3 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500"
            maxLength={6}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
          />
          <div className="flex gap-2">
            <button onClick={handleJoinGroup} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium">参加</button>
            <button onClick={() => setShowJoin(false)} className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">キャンセル</button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">参加中のグループ</h3>
        {groups.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm">グループに所属していません</p>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <div 
                key={group.id} 
                onClick={() => setActiveGroup(group)}
                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner">
                    {group.name.substring(0, 1)}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900">{group.name}</h4>
                    <p className="text-xs text-gray-500 mt-0.5">{group.members.length}人のメンバー</p>
                  </div>
                </div>
                <ChevronRight className="text-gray-300" size={20} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ProfileView ---
function ProfileView({ user }) {
  return (
    <div className="p-4 space-y-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
        <div className="w-24 h-24 bg-white border-4 border-white shadow-lg rounded-full flex items-center justify-center text-indigo-600 font-bold text-4xl mx-auto mb-4 relative z-10">
          {user.displayName.substring(0, 1)}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
        <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
        
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
            {user.year}
          </span>
          {user.parts.map(part => (
            <span key={part} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
              {part}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
         <div className="p-4 border-b border-gray-50 flex items-center gap-3 text-gray-700">
            <Settings size={20} className="text-gray-400" />
            <span className="font-medium text-sm">アカウント設定</span>
         </div>
         <div className="p-4 flex items-center justify-between bg-red-50 cursor-pointer hover:bg-red-100 transition-colors">
            <span className="font-medium text-sm text-red-600">ログアウト</span>
            <LogOut size={16} className="text-red-500" />
         </div>
      </div>
    </div>
  );
}

// --- AdminView ---
// ⚠️ user.username === 'Boss' の場合のみアクセス可能
function AdminView() {
  const [users, setUsers] = useState(mockDB.users);
  const [groups, setGroups] = useState(mockDB.groups);
  const [confirmModal, setConfirmModal] = useState({ show: false, type: '', id: '', name: '' });

  // 本来は useEffect で db から全件取得するが、プレビューなので mockDB を参照

  const handleDelete = (type, id) => {
    if (type === 'user') {
      mockDB.users = mockDB.users.filter(u => u.id !== id);
      // ユーザーが所属しているグループからも削除
      mockDB.groups.forEach(g => {
        g.members = g.members.filter(mId => mId !== id);
      });
      setUsers([...mockDB.users]);
      setGroups([...mockDB.groups]); // update member count UI
    } else if (type === 'group') {
      mockDB.groups = mockDB.groups.filter(g => g.id !== id);
      setGroups([...mockDB.groups]);
    }
    setConfirmModal({ show: false, type: '', id: '', name: '' });
  };

  const requestDelete = (type, id, name) => {
    setConfirmModal({ show: true, type, id, name });
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
        <Shield className="text-red-500 shrink-0 mt-0.5" size={24} />
        <div>
          <h2 className="text-red-800 font-bold">管理者ダッシュボード (Boss専用)</h2>
          <p className="text-xs text-red-600 mt-1">システム全体のユーザーとグループを管理・削除できます。削除したデータは復元できません。</p>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">全ユーザー一覧 ({users.length})</h3>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-900">{u.displayName}</p>
                <p className="text-[10px] text-gray-500">@{u.username} | {u.id}</p>
              </div>
              {u.username !== 'Boss' && (
                <button onClick={() => requestDelete('user', u.id, u.displayName)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 mt-6">全グループ一覧 ({groups.length})</h3>
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-gray-900">{g.name}</p>
                <p className="text-[10px] text-gray-500">コード: {g.joinCode} | メンバー: {g.members.length}人</p>
              </div>
              <button onClick={() => requestDelete('group', g.id, g.name)} className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-bold text-gray-900 mb-2">本当に削除しますか？</h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmModal.type === 'user' ? 'ユーザー' : 'グループ'}「<strong className="text-red-600">{confirmModal.name}</strong>」をシステムから完全に削除します。この操作は取り消せません。
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmModal({ show: false, type: '', id: '', name: '' })}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm"
              >
                キャンセル
              </button>
              <button 
                onClick={() => handleDelete(confirmModal.type, confirmModal.id)}
                className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md shadow-red-200"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
