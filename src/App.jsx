import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, 
  deleteDoc, query, where
} from "firebase/firestore";
import { 
  Calendar as CalendarIcon, Users, User, Settings, Check, 
  X, ChevronLeft, ChevronRight, Shield, LogOut, Trash2, KeyRound
} from 'lucide-react';

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyCJewcEeVpF83wLDuYnFljlH2b9RxVf9iI",
  authDomain: "wpb2025-d1432.firebaseapp.com",
  projectId: "wpb2025-d1432",
  storageBucket: "wpb2025-d1432.firebasestorage.app",
  messagingSenderId: "834123232552",
  appId: "1:834123232552:web:4acd559725a5892aa6cc1d"
};

// Initialize Firebase
let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase Error:", e);
}

// --- Shared Logic ---
const generateJoinCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// 【追加】スケジュールの枠（限）を定義（昼休みを追加）
const getPeriodListForDate = (date) => {
  const day = date.getDay();
  // 基本は1, 2, 昼休み, 3, 4
  const base = ['1', '2', 'lunch', '3', '4'];
  // 平日は5, 6限を追加
  if (day !== 0 && day !== 6) base.push('5', '6');
  return base;
};

// 【追加】表示名の変換
const formatPeriod = (p) => p === 'lunch' ? '昼休み' : `${p}限`;


export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mySchedule');
  
  // Auth state
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '', displayName: '', year: '2026年度', parts: [] });
  const [authError, setAuthError] = useState('');

  const [activeGroup, setActiveGroup] = useState(null);

  // --- Auth Functions ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    if (!db) { setAuthError('データベースに接続できません。'); return; }
    
    if (isLogin) {
      try {
        const q = query(collection(db, "users"), where("username", "==", authForm.username), where("password", "==", authForm.password));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userData = querySnapshot.docs[0].data();
          setUser({ id: querySnapshot.docs[0].id, ...userData });
        } else {
          setAuthError('ユーザー名またはパスワードが間違っています。');
        }
      } catch (err) { setAuthError('エラーが発生しました: ' + err.message); }
    } else {
      if (!authForm.username || !authForm.password || !authForm.displayName) { setAuthError('必須項目を入力してください。'); return; }
      if (authForm.password !== authForm.confirmPassword) { setAuthError('パスワードと確認用パスワードが一致しません。'); return; }

      try {
        const newUser = {
          username: authForm.username, password: authForm.password,
          displayName: authForm.displayName, year: authForm.year,
          parts: authForm.parts, createdAt: new Date().toISOString()
        };
        const q = query(collection(db, "users"), where("username", "==", authForm.username));
        const querySnapshot = await getDocs(q);
        if(!querySnapshot.empty) { setAuthError('このユーザー名は既に使用されています。'); return; }
        
        const docRef = await addDoc(collection(db, "users"), newUser);
        setUser({ id: docRef.id, ...newUser });
      } catch (err) { setAuthError('登録エラー: ' + err.message); }
    }
  };

  const handleLogout = () => {
    setUser(null); setActiveTab('mySchedule'); setActiveGroup(null);
    setAuthForm({ username: '', password: '', confirmPassword: '', displayName: '', year: '2026年度', parts: [] });
  };

  const togglePart = (part) => {
    setAuthForm(prev => ({ ...prev, parts: prev.parts.includes(part) ? prev.parts.filter(p => p !== part) : [...prev.parts, part] }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">WPB BandSync</h1>
            <p className="text-sm text-gray-500 mt-2">バンドメンバーとスケジュールを共有しよう</p>
          </div>
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button className={`flex-1 py-2 text-sm font-medium rounded-lg ${isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`} onClick={() => { setIsLogin(true); setAuthError(''); }}>ログイン</button>
            <button className={`flex-1 py-2 text-sm font-medium rounded-lg ${!isLogin ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`} onClick={() => { setIsLogin(false); setAuthError(''); }}>新規登録</button>
          </div>
          {authError && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl">{authError}</div>}
          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">ユーザー名 (ログインID)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">@</span>
                <input type="text" className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl sm:text-sm" value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} required />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">パスワード</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><KeyRound size={14}/></span>
                <input type="password" className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl sm:text-sm" value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} required />
              </div>
            </div>
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">パスワード（再確認）</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400"><KeyRound size={14}/></span>
                  <input type="password" placeholder="もう一度入力してください" className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-xl sm:text-sm" value={authForm.confirmPassword} onChange={e => setAuthForm({...authForm, confirmPassword: e.target.value})} required={!isLogin} />
                </div>
              </div>
            )}
            {!isLogin && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">表示名 (ニックネーム)</label>
                  <input type="text" className="block w-full px-3 py-2 border border-gray-300 rounded-xl sm:text-sm" value={authForm.displayName} onChange={e => setAuthForm({...authForm, displayName: e.target.value})} required={!isLogin} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">入学年度</label>
                  <select className="block w-full px-3 py-2 border border-gray-300 rounded-xl sm:text-sm" value={authForm.year} onChange={e => setAuthForm({...authForm, year: e.target.value})}>
                    {['2026年度', '2025年度', '2024年度', '2023年度', 'OB/OG'].map(y => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">担当パート (複数選択可)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['ボーカル', 'ギター', 'ベース', 'ドラム', 'キーボード'].map(part => (
                      <button type="button" key={part} onClick={() => togglePart(part)} className={`py-2 px-3 border rounded-xl text-sm flex items-center justify-center ${authForm.parts.includes(part) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                        {authForm.parts.includes(part) && <Check size={14} className="mr-1" />} {part}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <button type="submit" className="w-full py-3 px-4 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 mt-6">{isLogin ? 'ログイン' : '登録してはじめる'}</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-gray-100 z-10 sticky top-0">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-900">WPB BandSync</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600"><LogOut size={20} /></button>
        </div>
      </header>
      <main className="flex-1 w-full max-w-md mx-auto overflow-y-auto pb-20 relative">
        {activeTab === 'mySchedule' && <MyScheduleView user={user} />}
        {activeTab === 'groups' && <GroupsView user={user} activeGroup={activeGroup} setActiveGroup={setActiveGroup} />}
        {activeTab === 'profile' && <ProfileView user={user} />}
        {activeTab === 'admin' && user.username === 'Boss' && <AdminView />}
      </main>
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-20 pb-safe">
        <div className="max-w-md mx-auto flex">
          <button onClick={() => setActiveTab('mySchedule')} className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 ${activeTab === 'mySchedule' ? 'text-indigo-600' : 'text-gray-400'}`}><CalendarIcon size={22} /><span className="text-[10px] font-medium">マイ予定</span></button>
          <button onClick={() => { setActiveTab('groups'); setActiveGroup(null); }} className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 ${activeTab === 'groups' ? 'text-indigo-600' : 'text-gray-400'}`}><Users size={22} /><span className="text-[10px] font-medium">グループ</span></button>
          <button onClick={() => setActiveTab('profile')} className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 ${activeTab === 'profile' ? 'text-indigo-600' : 'text-gray-400'}`}><User size={22} /><span className="text-[10px] font-medium">マイページ</span></button>
          {user.username === 'Boss' && <button onClick={() => setActiveTab('admin')} className={`flex-1 py-3 flex flex-col items-center justify-center space-y-1 ${activeTab === 'admin' ? 'text-red-600' : 'text-gray-400'}`}><Shield size={22} /><span className="text-[10px] font-medium">管理者</span></button>}
        </div>
      </nav>
    </div>
  );
}

// --- MyScheduleView ---
function MyScheduleView({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [mySchedules, setMySchedules] = useState([]);
  
  // 【追加】入力モード（x:行けない, triangle:微妙）
  const [inputStatus, setInputStatus] = useState('x'); 

  useEffect(() => {
    if (!db) return;
    const fetchSchedules = async () => {
      const q = query(collection(db, "schedules"), where("userId", "==", user.id));
      const snap = await getDocs(q);
      setMySchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    fetchSchedules();
  }, [user]);

  // 【変更】スケジュールの状態を検索
  const getScheduleRule = (date, period) => {
    const rules = mySchedules.filter(r => r.period === period);
    const dStr = date.toISOString().split('T')[0];
    const onceRule = rules.find(r => r.type === 'once' && r.date === dStr);
    if (onceRule) return { ...onceRule, status: onceRule.status || 'x' };
    const weeklyRule = rules.find(r => r.type === 'weekly' && r.dayOfWeek === date.getDay());
    if (weeklyRule) return { ...weeklyRule, status: weeklyRule.status || 'x' };
    const monthlyRule = rules.find(r => r.type === 'monthly' && r.dayOfMonth === date.getDate());
    if (monthlyRule) return { ...monthlyRule, status: monthlyRule.status || 'x' };
    const dailyRule = rules.find(r => r.type === 'daily');
    if (dailyRule) return { ...dailyRule, status: dailyRule.status || 'x' };
    return null;
  };

  // 【変更】ステータスを含めた登録処理
  const toggleSchedule = async (date, period, type, newStatus) => {
    const dStr = date.toISOString().split('T')[0];
    const existingIdx = mySchedules.findIndex(r => 
      r.period === period && r.type === type && 
      ((type === 'once' && r.date === dStr) || type === 'daily' || (type === 'weekly' && r.dayOfWeek === date.getDay()) || (type === 'monthly' && r.dayOfMonth === date.getDate()))
    );

    try {
      let newSchedules = [...mySchedules];
      if (existingIdx >= 0) {
        const rule = mySchedules[existingIdx];
        if (rule.status === newStatus || (!rule.status && newStatus === 'x')) {
          // 同じステータスなら削除（解除）
          await deleteDoc(doc(db, "schedules", rule.id));
          newSchedules.splice(existingIdx, 1);
        } else {
          // 違うステータスなら上書き
          await updateDoc(doc(db, "schedules", rule.id), { status: newStatus });
          newSchedules[existingIdx].status = newStatus;
        }
      } else {
        // 新規登録
        let newRule = { userId: user.id, period, type, status: newStatus };
        if (type === 'once') newRule.date = dStr;
        if (type === 'weekly') newRule.dayOfWeek = date.getDay();
        if (type === 'monthly') newRule.dayOfMonth = date.getDate();
        
        const docRef = await addDoc(collection(db, "schedules"), newRule);
        newSchedules.push({ id: docRef.id, ...newRule });
      }
      setMySchedules(newSchedules);
    } catch(e) { alert("更新エラー: Firebaseの設定を確認してください"); }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const days = [];
    
    for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`e-${i}`} className="p-2"></div>);
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
      const periods = getPeriodListForDate(d);
      
      let hasX = false;
      let hasTriangle = false;
      periods.forEach(p => {
        const rule = getScheduleRule(d, p);
        if (rule) {
          if (rule.status === 'triangle') hasTriangle = true;
          else hasX = true; // x or undefined
        }
      });
      
      days.push(
        <div key={i} onClick={() => setSelectedDate(d)} className="p-1 cursor-pointer">
          <div className={`h-12 rounded-xl flex flex-col items-center justify-center border ${hasX ? 'bg-white border-gray-200' : hasTriangle ? 'bg-amber-50 border-amber-100' : 'bg-indigo-50 border-indigo-100'} ${selectedDate?.toDateString() === d.toDateString() ? 'ring-2 ring-indigo-500' : ''}`}>
            <span className={`text-sm font-medium ${d.getDay()===0 ? 'text-red-500' : d.getDay()===6 ? 'text-blue-500' : 'text-gray-700'}`}>{i}</span>
            <div className="flex gap-0.5 mt-1">
              {hasX && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
              {!hasX && hasTriangle && <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>}
            </div>
          </div>
        </div>
      );
    }
    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-4 bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-1"><ChevronLeft size={20}/></button>
          <h2 className="text-lg font-bold">{currentDate.getFullYear()}年 {currentDate.getMonth() + 1}月</h2>
          <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-1"><ChevronRight size={20}/></button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => <div key={d} className={`text-center text-xs py-2 ${i===0?'text-red-500':i===6?'text-blue-500':'text-gray-500'}`}>{d}</div>)}
          {days}
        </div>
      </div>
    );
  };

  const renderDayDetail = () => {
    if (!selectedDate) return null;
    const periods = getPeriodListForDate(selectedDate);
    return (
      <div className="p-4 bg-white border-t rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{selectedDate.getMonth() + 1}/{selectedDate.getDate()} の予定</h3>
          <button onClick={() => setSelectedDate(null)} className="p-1 bg-gray-100 rounded-full"><X size={16}/></button>
        </div>
        
        {/* 【追加】入力モードの切り替え */}
        <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setInputStatus('x')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${inputStatus === 'x' ? 'bg-red-500 text-white shadow' : 'text-gray-500'}`}>× 行けない</button>
          <button onClick={() => setInputStatus('triangle')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${inputStatus === 'triangle' ? 'bg-amber-500 text-white shadow' : 'text-gray-500'}`}>△ 微妙</button>
        </div>
        <p className="text-xs text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg">上のボタンで「×」か「△」を選んでから、下の枠をタップしてください。</p>

        <div className="space-y-3">
          {periods.map(period => {
            const rule = getScheduleRule(selectedDate, period);
            const isActive = !!rule;
            const activeType = rule ? rule.type : null;
            const activeStatus = rule ? (rule.status || 'x') : null;
            
            const btnColor = (type) => {
              if (isActive && activeType === type) {
                return activeStatus === 'x' ? 'bg-red-500 text-white' : 'bg-amber-500 text-white';
              }
              if (isActive) return 'bg-gray-100 text-gray-400 opacity-50';
              return 'bg-gray-100 text-gray-600 hover:bg-gray-200';
            };

            return (
              <div key={period} className="flex items-center gap-2">
                <div className={`w-14 text-center font-bold py-2 rounded-xl text-xs ${isActive ? (activeStatus==='x'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700') : 'bg-gray-100 text-gray-700'}`}>
                  {formatPeriod(period)}
                </div>
                <div className="flex-1 grid grid-cols-4 gap-1">
                  {['once:この日', 'weekly:毎週', 'monthly:毎月', 'daily:毎日'].map(t => {
                    const [type, label] = t.split(':');
                    return (
                      <button 
                        key={type} 
                        onClick={() => toggleSchedule(selectedDate, period, type, inputStatus)} 
                        disabled={isActive && activeType !== type} 
                        className={`py-2 text-[10px] font-medium rounded-xl ${btnColor(type)}`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  return <div className="pb-4">{renderCalendar()}{renderDayDetail()}</div>;
}

// --- GroupsView ---
function GroupsView({ user, activeGroup, setActiveGroup }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const [groupMembers, setGroupMembers] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [groupViewTab, setGroupViewTab] = useState('calendar');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (!db) return;
    const fetchGroups = async () => {
      const q = query(collection(db, "groups"), where("members", "array-contains", user.id));
      const snap = await getDocs(q);
      setGroups(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (activeGroup && db) {
      const fetchDetails = async () => {
        const snapM = await getDocs(collection(db, "users"));
        const allU = snapM.docs.map(d => ({ id: d.id, ...d.data() }));
        setGroupMembers(allU.filter(u => activeGroup.members.includes(u.id)));
        
        const snapS = await getDocs(collection(db, "schedules"));
        const allS = snapS.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllSchedules(allS.filter(s => activeGroup.members.includes(s.userId)));
      };
      fetchDetails();
    }
  }, [activeGroup]);

  const handleCreateGroup = async () => {
    if (!newGroupName) return;
    try {
      const newGroup = { name: newGroupName, joinCode: generateJoinCode(), members: [user.id], createdAt: new Date().toISOString() };
      const docRef = await addDoc(collection(db, "groups"), newGroup);
      setGroups([...groups, { id: docRef.id, ...newGroup }]);
      setNewGroupName('');
      setShowCreate(false);
    } catch(e) { alert("グループ作成エラー"); }
  };

  const handleJoinGroup = async () => {
    if (!joinCode) return;
    try {
      const q = query(collection(db, "groups"), where("joinCode", "==", joinCode.toUpperCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        const groupDoc = snap.docs[0];
        const groupData = groupDoc.data();
        if (!groupData.members.includes(user.id)) {
          const newMembers = [...groupData.members, user.id];
          await updateDoc(doc(db, "groups", groupDoc.id), { members: newMembers });
          setGroups([...groups, { id: groupDoc.id, ...groupData, members: newMembers }]);
        }
        setJoinCode('');
        setShowJoin(false);
      } else { alert("無効な参加コードです"); }
    } catch(e) { alert("参加エラー"); }
  };

  // 【変更】ユーザーのスケジュールを検索してステータスを返す
  const getUserScheduleRule = (userId, date, period) => {
    const rules = allSchedules.filter(r => r.userId === userId && r.period === period);
    const dStr = date.toISOString().split('T')[0];
    const onceRule = rules.find(r => r.type === 'once' && r.date === dStr);
    if (onceRule) return { ...onceRule, status: onceRule.status || 'x' };
    const weeklyRule = rules.find(r => r.type === 'weekly' && r.dayOfWeek === date.getDay());
    if (weeklyRule) return { ...weeklyRule, status: weeklyRule.status || 'x' };
    const monthlyRule = rules.find(r => r.type === 'monthly' && r.dayOfMonth === date.getDate());
    if (monthlyRule) return { ...monthlyRule, status: monthlyRule.status || 'x' };
    const dailyRule = rules.find(r => r.type === 'daily');
    if (dailyRule) return { ...dailyRule, status: dailyRule.status || 'x' };
    return null;
  };

  // 【変更】1日の中の「×」と「△」を計算
  const getDayStatus = (date) => {
    if(groupMembers.length === 0) return { dayStatus: 'ng', detail: [] };
    const periods = getPeriodListForDate(date);
    const detail = [];
    let isAnyPeriodAllOK = false;
    let isAnyPeriodTriangleOnly = false;

    for (let p of periods) {
      const xMembers = [];
      const triangleMembers = [];
      groupMembers.forEach(m => {
        const rule = getUserScheduleRule(m.id, date, p);
        if (rule) {
          if (rule.status === 'triangle') triangleMembers.push(m);
          else xMembers.push(m); // x or undefined
        }
      });
      detail.push({ period: p, xMembers, triangleMembers });
      
      if (xMembers.length === 0 && triangleMembers.length === 0) isAnyPeriodAllOK = true;
      else if (xMembers.length === 0 && triangleMembers.length > 0) isAnyPeriodTriangleOnly = true;
    }
    
    let dayStatus = 'ng';
    if (isAnyPeriodAllOK) dayStatus = 'ok';
    else if (isAnyPeriodTriangleOnly) dayStatus = 'triangle';

    return { dayStatus, detail };
  };

  const generateAvailableList = () => {
    const list = [];
    const today = new Date();
    for(let i=0; i<60; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        const status = getDayStatus(d);
        if(status.dayStatus === 'ok' || status.dayStatus === 'triangle') {
            const okPeriods = status.detail.filter(p => p.xMembers.length === 0 && p.triangleMembers.length === 0).map(p => p.period);
            const trianglePeriods = status.detail.filter(p => p.xMembers.length === 0 && p.triangleMembers.length > 0).map(p => p.period);
            list.push({ date: d, okPeriods, trianglePeriods });
        }
    }
    return list;
  };

  if (activeGroup) {
    const renderGroupCalendar = () => {
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
      const days = [];
      
      const headers = ['日', '月', '火', '水', '木', '金', '土'].map((day, idx) => (
        <div key={`h-${idx}`} className={`text-center text-xs font-medium py-2 ${idx === 0 ? 'text-red-500' : idx === 6 ? 'text-blue-500' : 'text-gray-500'}`}>{day}</div>
      ));

      for (let i = 0; i < firstDayOfMonth; i++) days.push(<div key={`e-${i}`} className="p-2"></div>);

      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
        const status = getDayStatus(d);
        
        let bgColor = 'bg-white border border-gray-100';
        let icon = null;
        if (status.dayStatus === 'ok') {
          bgColor = 'bg-emerald-50 border border-emerald-300 shadow-sm';
          icon = <Check size={12} className="text-emerald-500 mt-1" strokeWidth={3} />;
        } else if (status.dayStatus === 'triangle') {
          bgColor = 'bg-amber-50 border border-amber-300 shadow-sm';
          icon = <span className="text-amber-500 text-[10px] font-bold mt-1">△</span>;
        }
        
        days.push(
          <div key={i} onClick={() => setSelectedDate(d)} className="p-1 cursor-pointer">
            <div className={`h-12 rounded-xl flex flex-col items-center justify-center transition-all ${bgColor} ${selectedDate?.toDateString() === d.toDateString() ? 'ring-2 ring-indigo-500' : ''}`}>
              <span className={`text-sm font-medium ${d.getDay()===0 ? 'text-red-500' : d.getDay()===6 ? 'text-blue-500' : 'text-gray-700'}`}>{i}</span>
              {icon}
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
          <div className="grid grid-cols-7 gap-1">{headers}{days}</div>
        </div>
      );
    };

    const renderGroupDayDetail = () => {
      if (!selectedDate) return null;
      const status = getDayStatus(selectedDate);
      return (
        <div className="p-4 bg-white border-t rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedDate.getMonth() + 1}/{selectedDate.getDate()} の空き状況
            </h3>
            <button onClick={() => setSelectedDate(null)} className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={16} /></button>
          </div>
          <div className="space-y-2">
            {status.detail.map((p) => {
              const isAllOK = p.xMembers.length === 0 && p.triangleMembers.length === 0;
              const isTriangle = p.xMembers.length === 0 && p.triangleMembers.length > 0;
              
              let itemBg = 'bg-gray-50 border-gray-100';
              let badgeBg = 'bg-gray-200 text-gray-700';
              if (isAllOK) { itemBg = 'bg-emerald-50 border-emerald-200'; badgeBg = 'bg-emerald-200 text-emerald-800'; } 
              else if (isTriangle) { itemBg = 'bg-amber-50 border-amber-200'; badgeBg = 'bg-amber-200 text-amber-800'; }

              return (
                <div key={p.period} className={`p-3 rounded-xl flex items-center gap-3 border ${itemBg}`}>
                  <div className={`w-14 text-center font-bold text-xs py-1.5 rounded-lg ${badgeBg}`}>{formatPeriod(p.period)}</div>
                  <div className="flex-1">
                    {isAllOK ? (
                      <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Check size={16} /> 全員空いています！</span>
                    ) : (
                      <div className="text-xs text-gray-600 space-y-1">
                        {p.xMembers.length > 0 && <div><span className="font-medium text-red-500">× ({p.xMembers.length}人)</span>: {p.xMembers.map(m => m.displayName).join(', ')}</div>}
                        {p.triangleMembers.length > 0 && <div><span className="font-medium text-amber-600">△ ({p.triangleMembers.length}人)</span>: {p.triangleMembers.map(m => m.displayName).join(', ')}</div>}
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
                            <div className="text-xl font-bold text-gray-800">{item.date.getMonth()+1}/{item.date.getDate()} <span className="text-sm text-gray-500">({['日','月','火','水','木','金','土'][item.date.getDay()]})</span></div>
                        </div>
                        <div className="flex flex-col gap-1 items-end">
                            {item.okPeriods.length > 0 && (
                              <div className="flex gap-1 flex-wrap justify-end">
                                  {item.okPeriods.map(p => <span key={`ok-${p}`} className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md">〇 {formatPeriod(p)}</span>)}
                              </div>
                            )}
                            {item.trianglePeriods.length > 0 && (
                              <div className="flex gap-1 flex-wrap justify-end mt-1">
                                  {item.trianglePeriods.map(p => <span key={`tri-${p}`} className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md">△ {formatPeriod(p)}</span>)}
                              </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10">
          <button onClick={() => setActiveGroup(null)} className="p-2 -ml-2 bg-gray-50 rounded-full hover:bg-gray-100"><ChevronLeft size={20} className="text-gray-700" /></button>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{activeGroup.name}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">メンバー {groupMembers.length}人</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">参加コード: <strong className="font-mono tracking-widest">{activeGroup.joinCode}</strong></span>
            </div>
          </div>
        </div>
        <div className="flex p-2 bg-gray-100 m-4 rounded-xl">
            <button onClick={() => setGroupViewTab('calendar')} className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${groupViewTab === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500'}`}>カレンダー</button>
            <button onClick={() => setGroupViewTab('list')} className={`flex-1 py-1.5 text-sm font-medium rounded-lg ${groupViewTab === 'list' ? 'bg-white shadow text-emerald-600' : 'text-gray-500'}`}>空いている日一覧</button>
        </div>
        {groupViewTab === 'calendar' ? (
            <>{renderGroupCalendar()}{renderGroupDayDetail()}</>
        ) : renderAvailableList()}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div className="flex gap-2">
        <button onClick={() => { setShowCreate(true); setShowJoin(false); }} className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-indigo-700 transition-colors">＋ 新規作成</button>
        <button onClick={() => { setShowJoin(true); setShowCreate(false); }} className="flex-1 bg-white text-indigo-600 border border-indigo-200 py-3 rounded-2xl font-bold text-sm shadow-sm hover:bg-indigo-50 transition-colors">コードで参加</button>
      </div>

      {showCreate && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 animate-in fade-in zoom-in-95">
          <h3 className="text-sm font-bold text-gray-800 mb-3">新しいグループを作成</h3>
          <input type="text" placeholder="グループ名 (例: 夏フェスバンド)" className="w-full border border-gray-300 p-3 rounded-xl mb-3 text-sm focus:ring-2 focus:ring-indigo-500" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleCreateGroup} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium">作成</button>
            <button onClick={() => setShowCreate(false)} className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">キャンセル</button>
          </div>
        </div>
      )}

      {showJoin && (
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 animate-in fade-in zoom-in-95">
          <h3 className="text-sm font-bold text-gray-800 mb-3">グループに参加</h3>
          <input type="text" placeholder="6桁の参加コードを入力" className="w-full border border-gray-300 p-3 rounded-xl mb-3 text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500" maxLength={6} value={joinCode} onChange={e => setJoinCode(e.target.value)} />
          <div className="flex gap-2">
            <button onClick={handleJoinGroup} className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-sm font-medium">参加</button>
            <button onClick={() => setShowJoin(false)} className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">キャンセル</button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">参加中のグループ</h3>
        {groups.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200"><p className="text-gray-400 text-sm">グループに所属していません</p></div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => (
              <div key={group.id} onClick={() => setActiveGroup(group)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all active:scale-[0.98]">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner">{group.name.substring(0, 1)}</div>
                  <div><h4 className="font-bold text-gray-900">{group.name}</h4><p className="text-xs text-gray-500 mt-0.5">{group.members.length}人のメンバー</p></div>
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
        <div className="w-24 h-24 bg-white border-4 border-white shadow-lg rounded-full flex items-center justify-center text-indigo-600 font-bold text-4xl mx-auto mb-4 relative z-10">{user.displayName.substring(0, 1)}</div>
        <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
        <p className="text-sm text-gray-500 mt-1">@{user.username}</p>
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">{user.year}</span>
          {user.parts.map(part => <span key={part} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">{part}</span>)}
        </div>
      </div>
    </div>
  );
}

// --- AdminView ---
function AdminView() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);

  useEffect(() => {
    if (!db) return;
    const fetchData = async () => {
       const snapU = await getDocs(collection(db, "users"));
       setUsers(snapU.docs.map(d => ({ id: d.id, ...d.data() })));
       const snapG = await getDocs(collection(db, "groups"));
       setGroups(snapG.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchData();
  }, []);

  const handleDelete = async (type, id) => {
    try {
      if (type === 'user') {
        await deleteDoc(doc(db, "users", id));
        setUsers(users.filter(u => u.id !== id));
      } else if (type === 'group') {
        await deleteDoc(doc(db, "groups", id));
        setGroups(groups.filter(g => g.id !== id));
      }
    } catch(e) { alert("削除に失敗しました"); }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
        <Shield className="text-red-500 shrink-0 mt-0.5" size={24} />
        <div><h2 className="text-red-800 font-bold">管理者ダッシュボード</h2></div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2">全ユーザー一覧 ({users.length})</h3>
        <div className="space-y-2">
          {users.map(u => (
            <div key={u.id} className="bg-white p-3 rounded-xl shadow-sm border flex justify-between">
              <div><p className="font-bold text-sm text-gray-900">{u.displayName}</p><p className="text-[10px] text-gray-500">@{u.username}</p></div>
              {u.username !== 'Boss' && <button onClick={() => handleDelete('user', u.id)} className="text-red-500 p-2"><Trash2 size={16}/></button>}
            </div>
          ))}
        </div>
      </div>
      <div>
        <h3 className="text-sm font-bold text-gray-800 mb-3 border-b pb-2 mt-6">全グループ一覧 ({groups.length})</h3>
        <div className="space-y-2">
          {groups.map(g => (
            <div key={g.id} className="bg-white p-3 rounded-xl shadow-sm border flex justify-between">
              <div><p className="font-bold text-sm text-gray-900">{g.name}</p><p className="text-[10px] text-gray-500">コード: {g.joinCode}</p></div>
              <button onClick={() => handleDelete('group', g.id)} className="text-red-500 p-2"><Trash2 size={16}/></button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
