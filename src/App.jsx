``jsx
import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, 
  deleteDoc, query, where
} from "firebase/firestore";
import { 
  Calendar as CalendarIcon, Users, User, Settings, Check, 
  X, ChevronLeft, ChevronRight, Shield, LogOut, Trash2, KeyRound, BookOpen, AlertTriangle, Edit2
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

const getPeriodListForDate = (date) => {
  const day = date.getDay();
  const base = ['1', '2', 'lunch', '3', '4'];
  if (day !== 0) base.push('5', '6');
  return base;
};

const formatPeriod = (p) => p === 'lunch' ? '昼休み' : `${p}限`;

const getLocalYMD = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// --- Tutorial Component ---
function TutorialModal({ onClose }) {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="h-2 bg-gray-100 w-full">
          <div 
            className="h-full bg-indigo-500 transition-all duration-300 ease-out" 
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
        
        <div className="p-6">
          {step === 1 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <CalendarIcon size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900">ようこそ！<br/>WPB BandSyncへ</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                このアプリは、バンドやサークルメンバー同士の<strong>「スケジュール調整」を劇的に簡単にする</strong>ために作られた専用アプリです。<br/><br/>
                使い方の基本を順番にご説明します。
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold">×</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">1. マイ予定を入力しよう</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                「マイ予定」タブからカレンダーの日付をタップします。<br/><br/>
                画面に表示されるボタンから<strong className="text-red-500">行けない（×）</strong>や<strong className="text-amber-500">微妙（△）</strong>のモードを選び、該当する時限（1限など）のボタンをタップするだけで登録完了です！
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-4">
              <div className="flex justify-center gap-2 mb-2">
                <div className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">毎週</div>
                <div className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold">全日一括</div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">2. 繰り返しと期間設定</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                「毎週」「毎月」などの繰り返しは、<strong>「開始日〜終了日」の期間を指定して</strong>登録できるようになりました。<br/><br/>
                また、<strong>「この日を一括で設定（全日）」</strong>のボタンを使えば、1日丸ごとの予定をまとめて入力・解除できます！
              </p>
            </div>
          )}

          {step === 4 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold">〇</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900">3. 「臨時OK」の裏ワザ</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                「普段は毎週火曜日NGにしているけど、<strong>来週の火曜は祝日だから特別に行ける！</strong>」<br/><br/>
                そんな時は、モードを<strong className="text-blue-500">「〇 臨時OK」</strong>にして該当の日をタップしてください。普段の「毎週×」の予定を崩さずに、その日だけ「行ける」に上書きできます。
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Users size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">4. グループに参加しよう</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                「グループ」タブから、自分が所属するバンドのグループを<strong>「新規作成」</strong>するか、リーダーから教わった<strong>6桁の参加コード</strong>を入力してグループに参加します。
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">5. 空き日が一目でわかる！</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                グループ画面の「空き日一覧」タブを見ると、メンバーの予定を自動で計算してリストアップします。<br/><br/>
                <strong>◎ 全員参加</strong>の日や、<strong>△ 一部NG（誰がいないか）</strong>がひと目で分かるので、練習日決めが圧倒的にスムーズになります！
              </p>
            </div>
          )}

          <div className="mt-8 flex gap-3">
            {step > 1 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="py-3 px-4 bg-gray-100 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-200 transition-colors"
              >
                戻る
              </button>
            )}
            <button 
              onClick={() => {
                if (step < totalSteps) setStep(step + 1);
                else onClose();
              }}
              className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-indigo-700 transition-colors"
            >
              {step < totalSteps ? '次へ' : 'アプリを使い始める！'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mySchedule');
  
  const [isLogin, setIsLogin] = useState(true);
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '', displayName: '', year: '2026年度', parts: [] });
  const [authError, setAuthError] = useState('');

  const [activeGroup, setActiveGroup] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const storedAuth = localStorage.getItem('wpb_bandsync_auth');
    if (storedAuth) {
      try {
        const { userData, expiresAt } = JSON.parse(storedAuth);
        if (new Date().getTime() < expiresAt) {
          setUser(userData);
        } else {
          localStorage.removeItem('wpb_bandsync_auth');
        }
      } catch (e) {
        localStorage.removeItem('wpb_bandsync_auth');
      }
    }
  }, []);

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
          const loggedInUser = { id: querySnapshot.docs[0].id, ...userData };
          setUser(loggedInUser);
          
          const expiresAt = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
          localStorage.setItem('wpb_bandsync_auth', JSON.stringify({ userData: loggedInUser, expiresAt }));
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
        const loggedInUser = { id: docRef.id, ...newUser };
        setUser(loggedInUser);

        const expiresAt = new Date().getTime() + 30 * 24 * 60 * 60 * 1000;
        localStorage.setItem('wpb_bandsync_auth', JSON.stringify({ userData: loggedInUser, expiresAt }));
        
        setShowTutorial(true);

      } catch (err) { setAuthError('登録エラー: ' + err.message); }
    }
  };

  const handleLogout = () => {
    setUser(null); 
    setActiveTab('mySchedule'); 
    setActiveGroup(null);
    setAuthForm({ username: '', password: '', confirmPassword: '', displayName: '', year: '2026年度', parts: [] });
    localStorage.removeItem('wpb_bandsync_auth');
  };

  const togglePart = (part) => {
    setAuthForm(prev => ({ ...prev, parts: prev.parts.includes(part) ? prev.parts.filter(p => p !== part) : [...prev.parts, part] }));
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
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
        {activeTab === 'profile' && <ProfileView user={user} setUser={setUser} setShowTutorial={setShowTutorial} handleLogout={handleLogout} />}
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

      {showTutorial && <TutorialModal onClose={handleCloseTutorial} />}
    </div>
  );
}

// --- MyScheduleView ---
function MyScheduleView({ user }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [mySchedules, setMySchedules] = useState([]);
  const [bossSchedules, setBossSchedules] = useState([]); 
  
  const [inputStatus, setInputStatus] = useState('x'); 
  const [customText, setCustomText] = useState(''); 
  const [isProcessing, setIsProcessing] = useState(false);

  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    if (!db) return;
    const fetchSchedules = async () => {
      const q = query(collection(db, "schedules"), where("userId", "==", user.id));
      const snap = await getDocs(q);
      setMySchedules(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const usersSnap = await getDocs(query(collection(db, "users"), where("username", "==", "Boss")));
      if (!usersSnap.empty) {
        const bossId = usersSnap.docs[0].id;
        const bossQ = query(collection(db, "schedules"), where("userId", "==", bossId));
        const bossSnap = await getDocs(bossQ);
        setBossSchedules(bossSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    };
    fetchSchedules();
  }, [user]);

  const getBossRule = (date, period) => {
    const rules = bossSchedules.filter(r => r.period === period);
    const dStr = getLocalYMD(date);
    
    const onceRule = rules.find(r => r.type === 'once' && r.date === dStr);
    if (onceRule) return onceRule;

    const isValidRule = (r) => {
      if (r.startDate && r.startDate > dStr) return false;
      if (r.endDate && r.endDate <= dStr) return false;
      return true;
    };

    const findValidRule = (type, condition) => {
       const validRules = rules.filter(r => r.type === type && condition(r) && isValidRule(r));
       if (validRules.length === 0) return null;
       validRules.sort((a, b) => {
         const sa = a.startDate || '1970-01-01';
         const sb = b.startDate || '1970-01-01';
         return sa < sb ? 1 : (sa > sb ? -1 : 0);
       });
       return validRules[0];
    };

    const weeklyRule = findValidRule('weekly', r => r.dayOfWeek === date.getDay());
    if (weeklyRule) return weeklyRule;
    
    const monthlyRule = findValidRule('monthly', r => r.dayOfMonth === date.getDate());
    if (monthlyRule) return monthlyRule;
    
    const dailyRule = findValidRule('daily', r => true);
    if (dailyRule) return dailyRule;
    
    return null;
  };

  const getScheduleRule = (date, period) => {
    const rules = mySchedules.filter(r => r.period === period);
    const dStr = getLocalYMD(date);
    
    const onceRule = rules.find(r => r.type === 'once' && r.date === dStr);
    if (onceRule) return { ...onceRule, status: onceRule.status || 'x', text: onceRule.text || '', isOverride: true };
    
    const isValidRule = (r) => {
      if (r.startDate && r.startDate > dStr) return false;
      if (r.endDate && r.endDate <= dStr) return false;
      return true;
    };

    const findValidRule = (type, condition) => {
       const validRules = rules.filter(r => r.type === type && condition(r) && isValidRule(r));
       if (validRules.length === 0) return null;
       validRules.sort((a, b) => {
         const sa = a.startDate || '1970-01-01';
         const sb = b.startDate || '1970-01-01';
         return sa < sb ? 1 : (sa > sb ? -1 : 0);
       });
       return validRules[0];
    };

    const weeklyRule = findValidRule('weekly', r => r.dayOfWeek === date.getDay());
    if (weeklyRule) return { ...weeklyRule, status: weeklyRule.status || 'x', text: weeklyRule.text || '', isOverride: false };
    
    const monthlyRule = findValidRule('monthly', r => r.dayOfMonth === date.getDate());
    if (monthlyRule) return { ...monthlyRule, status: monthlyRule.status || 'x', text: monthlyRule.text || '', isOverride: false };
    
    const dailyRule = findValidRule('daily', r => true);
    if (dailyRule) return { ...dailyRule, status: dailyRule.status || 'x', text: dailyRule.text || '', isOverride: false };
    
    return null;
  };

  const toggleSchedule = async (date, period, type, newStatus, textVal = '', endDateVal = '') => {
    if (isProcessing) return;
    setIsProcessing(true);
    
    const dStr = getLocalYMD(date);
    const rulesOfSameType = mySchedules.filter(r => r.period === period && r.type === type);
    
    let activeRule = null;
    if (type === 'once') {
        activeRule = rulesOfSameType.find(r => r.date === dStr);
    } else {
        const condition = type === 'weekly' ? (r => r.dayOfWeek === date.getDay()) :
                          type === 'monthly' ? (r => r.dayOfMonth === date.getDate()) :
                          (r => true);
        const validRules = rulesOfSameType.filter(r => condition(r) && (!r.startDate || r.startDate <= dStr) && (!r.endDate || r.endDate > dStr));
        if (validRules.length > 0) {
            validRules.sort((a, b) => {
              const sa = a.startDate || '1970-01-01';
              const sb = b.startDate || '1970-01-01';
              return sa < sb ? 1 : (sa > sb ? -1 : 0);
            });
            activeRule = validRules[0];
        }
    }

    try {
      let newSchedules = [...mySchedules];
      
      if (activeRule) {
        const currentStatus = activeRule.status || 'x';
        const currentText = activeRule.text || '';
        const currentEndDate = activeRule.endDate || '';
        const safeStartDate = activeRule.startDate || '2000-01-01';
        
        if ((currentStatus === newStatus && currentText === textVal && currentEndDate === endDateVal) || (!activeRule.status && newStatus === 'x' && !textVal && !endDateVal)) {
            if (type === 'once' || safeStartDate === dStr) {
                setMySchedules(newSchedules.filter(r => r.id !== activeRule.id));
                await deleteDoc(doc(db, "schedules", activeRule.id));
            } else {
                await updateDoc(doc(db, "schedules", activeRule.id), { endDate: dStr });
                const idx = newSchedules.findIndex(r => r.id === activeRule.id);
                if(idx >= 0) newSchedules[idx] = { ...newSchedules[idx], endDate: dStr };
                setMySchedules(newSchedules);
            }
        } else {
            if (type === 'once' || safeStartDate === dStr) {
                const updatePayload = { status: newStatus, text: textVal };
                if (type !== 'once') updatePayload.endDate = endDateVal;
                await updateDoc(doc(db, "schedules", activeRule.id), updatePayload);
                const idx = newSchedules.findIndex(r => r.id === activeRule.id);
                if(idx >= 0) newSchedules[idx] = { ...newSchedules[idx], ...updatePayload };
                setMySchedules(newSchedules);
            } else {
                await updateDoc(doc(db, "schedules", activeRule.id), { endDate: dStr });
                let newRule = { userId: user.id, period, type, status: newStatus, text: textVal, startDate: dStr, endDate: endDateVal };
                if (type === 'weekly') newRule.dayOfWeek = date.getDay();
                if (type === 'monthly') newRule.dayOfMonth = date.getDate();
                
                const docRef = await addDoc(collection(db, "schedules"), newRule);
                newSchedules = newSchedules.map(r => r.id === activeRule.id ? { ...r, endDate: dStr } : r);
                newSchedules.push({ id: docRef.id, ...newRule });
                setMySchedules(newSchedules);
            }
        }
      } else {
        let newRule = { userId: user.id, period, type, status: newStatus, text: textVal, startDate: dStr, endDate: endDateVal };
        if (type === 'once') newRule.date = dStr;
        if (type === 'weekly') newRule.dayOfWeek = date.getDay();
        if (type === 'monthly') newRule.dayOfMonth = date.getDate();
        
        const tempId = 'temp_' + Date.now();
        setMySchedules([...newSchedules, { id: tempId, ...newRule }]);
        
        const docRef = await addDoc(collection(db, "schedules"), newRule);
        setMySchedules(prev => prev.map(r => r.id === tempId ? { id: docRef.id, ...newRule } : r));
      }
      
      if (user.username === 'Boss') {
        const bossQ = query(collection(db, "schedules"), where("userId", "==", user.id));
        const bossSnap = await getDocs(bossQ);
        setBossSchedules(bossSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch(e) { 
      alert("更新エラー: " + e.message); 
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetAllDay = async (type, endDateVal = '') => {
    if (isProcessing) return;
    setIsProcessing(true);

    const periods = getPeriodListForDate(selectedDate);
    const dStr = getLocalYMD(selectedDate);
    let updatedSchedules = [...mySchedules];
    let hasError = false;
    let errorMessage = "";
    
    const getActiveRuleForType = (period, targetType) => {
        const rulesOfSameType = updatedSchedules.filter(r => r.period === period && r.type === targetType);
        if (targetType === 'once') {
            return rulesOfSameType.find(r => r.date === dStr);
        } else {
            const condition = targetType === 'weekly' ? (r => r.dayOfWeek === selectedDate.getDay()) :
                              targetType === 'monthly' ? (r => r.dayOfMonth === selectedDate.getDate()) :
                              (r => true);
            const validRules = rulesOfSameType.filter(r => condition(r) && (!r.startDate || r.startDate <= dStr) && (!r.endDate || r.endDate > dStr));
            if (validRules.length > 0) {
                validRules.sort((a, b) => {
                  const sa = a.startDate || '1970-01-01';
                  const sb = b.startDate || '1970-01-01';
                  return sa < sb ? 1 : (sa > sb ? -1 : 0);
                });
                return validRules[0];
            }
            return null;
        }
    };

    const isAllSet = periods.every(period => {
      const rule = getActiveRuleForType(period, type);
      return rule && (rule.status === inputStatus || (!rule.status && inputStatus === 'x'));
    });
    
    for (const period of periods) {
      try {
        const activeRule = getActiveRuleForType(period, type);

        if (isAllSet) {
          if (activeRule) {
             const safeStartDate = activeRule.startDate || '2000-01-01';
             if (type === 'once' || safeStartDate === dStr) {
                await deleteDoc(doc(db, "schedules", activeRule.id));
                updatedSchedules = updatedSchedules.filter(r => r.id !== activeRule.id);
             } else {
                await updateDoc(doc(db, "schedules", activeRule.id), { endDate: dStr });
                const idx = updatedSchedules.findIndex(r => r.id === activeRule.id);
                if(idx >= 0) updatedSchedules[idx] = { ...updatedSchedules[idx], endDate: dStr };
             }
          }
        } else {
          if (activeRule) {
             const currentStatus = activeRule.status || 'x';
             const safeStartDate = activeRule.startDate || '2000-01-01';
             if (currentStatus !== inputStatus) {
                 if (type === 'once' || safeStartDate === dStr) {
                     const updatePayload = { status: inputStatus, text: '' };
                     if (type !== 'once') updatePayload.endDate = endDateVal;
                     await updateDoc(doc(db, "schedules", activeRule.id), updatePayload);
                     const idx = updatedSchedules.findIndex(r => r.id === activeRule.id);
                     if(idx >= 0) updatedSchedules[idx] = { ...updatedSchedules[idx], ...updatePayload };
                 } else {
                     await updateDoc(doc(db, "schedules", activeRule.id), { endDate: dStr });
                     const idx = updatedSchedules.findIndex(r => r.id === activeRule.id);
                     if(idx >= 0) updatedSchedules[idx] = { ...updatedSchedules[idx], endDate: dStr };
                     
                     let newRule = { userId: user.id, period, type, status: inputStatus, text: '', startDate: dStr, endDate: endDateVal };
                     if (type === 'weekly') newRule.dayOfWeek = selectedDate.getDay();
                     if (type === 'monthly') newRule.dayOfMonth = selectedDate.getDate();
                     
                     const docRef = await addDoc(collection(db, "schedules"), newRule);
                     updatedSchedules.push({ id: docRef.id, ...newRule });
                 }
             }
          } else {
             let newRule = { userId: user.id, period, type, status: inputStatus, text: '', startDate: dStr, endDate: endDateVal };
             if (type === 'once') newRule.date = dStr;
             if (type === 'weekly') newRule.dayOfWeek = selectedDate.getDay();
             if (type === 'monthly') newRule.dayOfMonth = selectedDate.getDate();
             
             const docRef = await addDoc(collection(db, "schedules"), newRule);
             updatedSchedules.push({ id: docRef.id, ...newRule });
          }
        }
      } catch (err) {
        hasError = true;
        errorMessage = err.message;
      }
    }
    
    setMySchedules(updatedSchedules);
    if (user.username === 'Boss') {
      const bossQ = query(collection(db, "schedules"), where("userId", "==", user.id));
      const bossSnap = await getDocs(bossQ);
      setBossSchedules(bossSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }
    setIsProcessing(false);
    if (hasError) alert("一括更新の一部でエラーが発生しました: " + errorMessage);
  };

  const getStatusLabel = (st) => {
    if (st === 'x') return '× 行けない';
    if (st === 'triangle') return '△ 微妙';
    if (st === 'ok') return '〇 臨時OK';
    if (st === 'studio1') return '1スタジオ不可';
    if (st === 'studio2') return '2スタジオ不可';
    return st;
  };

  const getTypeLabel = (type, date) => {
    const dayName = ['日','月','火','水','木','金','土'][date.getDay()];
    if (type === 'once') return `${date.getMonth() + 1}/${date.getDate()}(${dayName})のみ`;
    if (type === 'weekly') return `毎週${dayName}曜日`;
    if (type === 'monthly') return `毎月${date.getDate()}日`;
    if (type === 'daily') return `毎日`;
    return type;
  };

  const requestToggleSchedule = (date, period, type, newStatus, textVal = '') => {
    if (type === 'once') {
      toggleSchedule(date, period, type, newStatus, textVal, '');
    } else {
      // 繰り返しの場合、終了日を設定できるモーダルを開く
      setConfirmDialog({
        type: 'periodInput',
        title: '繰り返し期間の指定',
        scheduleType: type,
        period: period,
        newStatus: newStatus,
        textVal: textVal,
        date: date,
        endDate: '' // 初期値は無期限（空）
      });
    }
  };

  const requestSetAllDay = (type) => {
    if (type === 'once') {
      setConfirmDialog({
        title: '1日一括設定の確認',
        message: `「${getTypeLabel(type, selectedDate)}」の【すべての時限（全日）】に「${getStatusLabel(inputStatus)}」を一括で設定（または解除）しますか？`,
        subMessage: '※この日のすべての時限が変更されます。',
        onConfirm: () => {
          setConfirmDialog(null);
          handleSetAllDay(type, '');
        }
      });
    } else {
      setConfirmDialog({
        type: 'periodInputAllDay',
        title: '1日一括（期間指定）の確認',
        scheduleType: type,
        endDate: ''
      });
    }
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
      let hasOk = false;
      
      periods.forEach(p => {
        const rule = getScheduleRule(d, p);
        if (rule) {
          if (rule.status === 'ok') hasOk = true;
          else if (rule.status === 'triangle') hasTriangle = true;
          else if (rule.status === 'x') hasX = true;
        }
      });
      
      let bgColor = 'bg-white border-gray-200';
      if (hasX) bgColor = 'bg-white border-gray-200';
      else if (hasTriangle) bgColor = 'bg-amber-50 border-amber-100';
      else if (hasOk) bgColor = 'bg-blue-50 border-blue-100';
      else bgColor = 'bg-indigo-50 border-indigo-100';

      days.push(
        <div key={i} onClick={() => setSelectedDate(d)} className="p-1 cursor-pointer">
          <div className={`h-12 rounded-xl flex flex-col items-center justify-center border ${bgColor} ${selectedDate?.toDateString() === d.toDateString() ? 'ring-2 ring-indigo-500' : ''}`}>
            <span className={`text-sm font-medium ${d.getDay()===0 ? 'text-red-500' : d.getDay()===6 ? 'text-blue-500' : 'text-gray-700'}`}>{i}</span>
            <div className="flex gap-0.5 mt-0.5 text-[12px] leading-none font-bold">
              {hasX && <span className="text-red-500">×</span>}
              {!hasX && hasTriangle && <span className="text-amber-500">△</span>}
              {!hasX && !hasTriangle && hasOk && <span className="text-blue-500">〇</span>}
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
    const isBoss = user.username === 'Boss';

    return (
      <div className={`p-4 bg-white border-t rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-4 animate-in slide-in-from-bottom-4 transition-opacity ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-800">{selectedDate.getMonth() + 1}/{selectedDate.getDate()} の予定</h3>
          <button onClick={() => setSelectedDate(null)} className="p-1 bg-gray-100 rounded-full hover:bg-gray-200"><X size={16}/></button>
        </div>
        
        <div className="flex gap-1 mb-2 bg-gray-100 p-1 rounded-xl">
          <button onClick={() => setInputStatus('x')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${inputStatus === 'x' ? 'bg-red-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>× 行けない</button>
          <button onClick={() => setInputStatus('triangle')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${inputStatus === 'triangle' ? 'bg-amber-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>△ 微妙</button>
          <button onClick={() => setInputStatus('ok')} className={`flex-1 py-2 text-xs font-bold rounded-lg transition-colors ${inputStatus === 'ok' ? 'bg-blue-500 text-white shadow' : 'text-gray-500 hover:bg-gray-200'}`}>〇 臨時OK</button>
        </div>

        {isBoss && (
          <div className="grid grid-cols-2 gap-1 mb-3">
            <button onClick={() => setInputStatus('studio1')} className={`py-2 text-xs font-bold rounded-lg transition-colors border ${inputStatus === 'studio1' ? 'bg-indigo-600 text-white border-indigo-700 shadow' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>1スタジオ不可</button>
            <button onClick={() => setInputStatus('studio2')} className={`py-2 text-xs font-bold rounded-lg transition-colors border ${inputStatus === 'studio2' ? 'bg-indigo-600 text-white border-indigo-700 shadow' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>2スタジオ不可</button>
          </div>
        )}

        {isBoss && (
          <div className="mb-4">
            <label className="block text-[10px] font-bold text-gray-700 mb-1">管理者手入力（各限に文字を表示）</label>
            <input 
              type="text" 
              placeholder="例: 機材メンテナンス 等" 
              className="w-full border border-gray-300 bg-gray-50 p-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500" 
              value={customText} 
              onChange={e => setCustomText(e.target.value)}
            />
          </div>
        )}

        <p className="text-[10px] text-gray-500 mb-4 bg-gray-50 p-2 rounded-lg leading-relaxed">
          上のボタンでモードを選択後、下の枠をタップしてください。<br/>
          {isBoss && <span className="text-indigo-700 font-bold">管理者権限：</span>}
          <span className="text-blue-600 font-bold">「〇 臨時OK」</span>は「この日」のみ選択可能です。
        </p>

        <div className="mb-4 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <div className="text-xs font-bold text-indigo-800 mb-2 flex items-center justify-between">
            <span>この日を一括で設定（全日）</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${inputStatus === 'x' ? 'bg-red-500' : inputStatus === 'triangle' ? 'bg-amber-500' : inputStatus === 'ok' ? 'bg-blue-500' : 'bg-indigo-600'}`}>
              選択中: {inputStatus === 'x' ? '×' : inputStatus === 'triangle' ? '△' : inputStatus === 'ok' ? '〇' : inputStatus === 'studio1' ? '1スタ不可' : '2スタ不可'}
            </span>
          </div>
          <div className="flex gap-1">
            {['once:この日', 'weekly:毎週', 'monthly:毎月', 'daily:毎日'].map(t => {
              const [type, label] = t.split(':');
              const isDisabled = (inputStatus === 'ok' || inputStatus === 'studio1' || inputStatus === 'studio2') && type !== 'once';

              return (
                <button 
                  key={`all-${type}`} 
                  onClick={() => requestSetAllDay(type)}
                  disabled={isDisabled}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors border ${
                    isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' :
                    'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2.5 border-t border-gray-100 pt-3">
          {periods.map(period => {
            const rule = getScheduleRule(selectedDate, period);
            const bossRule = getBossRule(selectedDate, period);

            const isActive = !!rule;
            const activeType = rule ? rule.type : null;
            const activeStatus = rule ? (rule.status || 'x') : null;
            const activeText = rule ? rule.text : '';

            let bossNoticeText = '';
            if (bossRule) {
              if (bossRule.status === 'studio1') bossNoticeText = '1スタジオ使用不可';
              else if (bossRule.status === 'studio2') bossNoticeText = '2スタジオ使用不可';
              else if (bossRule.text) bossNoticeText = bossRule.text;
            }
            
            const btnColor = (type) => {
              if (isActive && activeType === type) {
                if (activeStatus === 'studio1' || activeStatus === 'studio2') return 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-200';
                if (activeStatus === 'x') return 'bg-red-500 text-white shadow-sm ring-2 ring-red-200';
                if (activeStatus === 'triangle') return 'bg-amber-500 text-white shadow-sm ring-2 ring-amber-200';
                if (activeStatus === 'ok') return 'bg-blue-500 text-white shadow-sm ring-2 ring-blue-200';
              }
              if (isActive) return 'bg-white/60 text-gray-400 border border-gray-200/60 opacity-60';
              return 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100 shadow-sm';
            };

            const periodBadgeColor = () => {
              if (!isActive) return 'bg-white text-gray-700 border border-gray-200 shadow-sm';
              if (activeStatus === 'studio1' || activeStatus === 'studio2' || activeText) return 'bg-indigo-100 text-indigo-800 border border-indigo-200';
              if (activeStatus === 'x') return 'bg-red-100 text-red-700 border border-red-200';
              if (activeStatus === 'triangle') return 'bg-amber-100 text-amber-700 border border-amber-200';
              return 'bg-blue-100 text-blue-700 border border-blue-200';
            };

            return (
              <div 
                key={period} 
                className="p-2.5 rounded-2xl border bg-gray-50/70 border-gray-200/80 transition-all"
              >
                {bossNoticeText && (
                  <div className="mb-2 px-2.5 py-1.5 bg-white text-gray-800 rounded-xl text-[11px] font-bold flex items-center gap-1.5 border border-gray-200 shadow-sm">
                    <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                    <span>【{formatPeriod(period)}】管理者連絡: {bossNoticeText}</span>
                  </div>
                )}
                
                <div className="flex items-center gap-2">
                  <div className={`w-16 text-center font-bold py-2 rounded-xl text-xs flex flex-col items-center justify-center shrink-0 ${periodBadgeColor()}`}>
                    <span>{formatPeriod(period)}</span>
                    {isActive && (
                      <span className="text-[8px] font-normal opacity-90 -mt-0.5 truncate max-w-[54px]">
                        {activeText || (activeType === 'once' ? 'この日' : activeType === 'weekly' ? '毎週' : activeType === 'monthly' ? '毎月' : '毎日')}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 grid grid-cols-4 gap-1">
                    {['once:この日', 'weekly:毎週', 'monthly:毎月', 'daily:毎日'].map(t => {
                      const [type, label] = t.split(':');
                      const isDisabledByMode = (inputStatus === 'ok' || inputStatus === 'studio1' || inputStatus === 'studio2') && type !== 'once';

                      return (
                        <button 
                          key={type} 
                          onClick={() => requestToggleSchedule(selectedDate, period, type, inputStatus, isBoss ? customText : '')} 
                          disabled={isDisabledByMode} 
                          className={`py-2 text-[10px] font-bold rounded-xl transition-all ${btnColor(type)}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
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

      {/* 確認・期間設定ダイアログモーダル */}
      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <AlertTriangle size={22} className="shrink-0" />
              <h4 className="font-bold text-base text-gray-900">{confirmDialog.title}</h4>
            </div>

            {confirmDialog.type === 'periodInput' || confirmDialog.type === 'periodInputAllDay' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {confirmDialog.type === 'periodInput'
                    ? `「${getTypeLabel(confirmDialog.scheduleType, confirmDialog.date)}」の【${formatPeriod(confirmDialog.period)}】に「${getStatusLabel(confirmDialog.newStatus)}」を設定します。`
                    : `「${getTypeLabel(confirmDialog.scheduleType, selectedDate)}」の【すべての時限（全日）】に「${getStatusLabel(inputStatus)}」を一括設定します。`}
                </p>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">終了日（この日まで適用・空欄なら無期限）</label>
                  <input 
                    type="date" 
                    className="w-full border border-gray-300 p-2.5 rounded-xl text-xs font-bold text-gray-800"
                    value={confirmDialog.endDate}
                    onChange={(e) => setConfirmDialog({ ...confirmDialog, endDate: e.target.value })}
                  />
                  <p className="text-[10px] text-gray-400 mt-1">※指定した終了日を迎えると、この繰り返し予定は自動で終了します。</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      const endVal = confirmDialog.endDate;
                      const sType = confirmDialog.scheduleType;
                      const per = confirmDialog.period;
                      const st = confirmDialog.newStatus;
                      const txt = confirmDialog.textVal;
                      setConfirmDialog(null);

                      if (confirmDialog.type === 'periodInput') {
                        toggleSchedule(confirmDialog.date, per, sType, st, txt, endVal);
                      } else {
                        handleSetAllDay(sType, endVal);
                      }
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    決定して実行
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
                  {confirmDialog.message}
                </p>
                {confirmDialog.subMessage && (
                  <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl mb-5">
                    {confirmDialog.subMessage}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={confirmDialog.onConfirm}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    実行する
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function GroupsView({ user, activeGroup, setActiveGroup }) {
  const [groups, setGroups] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');

  const [groupMembers, setGroupMembers] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [groupViewTab, setGroupViewTab] = useState('calendar');
  const [listFilter, setListFilter] = useState('all'); 
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
        setGroupMembers(allU.filter(u => activeGroup.members.includes(u.id) || u.username === 'Boss'));
        
        const snapS = await getDocs(collection(db, "schedules"));
        const allS = snapS.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllSchedules(allS);
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

  const handleUpdateGroupName = async () => {
    if (!editingGroupName.trim()) return;
    try {
      const trimmed = editingGroupName.trim();
      await updateDoc(doc(db, "groups", activeGroup.id), { name: trimmed });
      setActiveGroup({ ...activeGroup, name: trimmed });
      setGroups(groups.map(g => g.id === activeGroup.id ? { ...g, name: trimmed } : g));
      setIsEditingGroupName(false);
    } catch (e) {
      alert("グループ名の変更に失敗しました: " + e.message);
    }
  };

  const getUserScheduleRule = (userId, date, period) => {
    const rules = allSchedules.filter(r => r.userId === userId && r.period === period);
    const dStr = getLocalYMD(date);
    
    // 期間（開始日・終了日）のチェック関数
    const isValidRule = (r) => {
      if (r.startDate && r.startDate > dStr) return false;
      if (r.endDate && r.endDate <= dStr) return false;
      return true;
    };

    const onceRule = rules.find(r => r.type === 'once' && r.date === dStr);
    if (onceRule) return { ...onceRule, status: onceRule.status || 'x', text: onceRule.text || '' };

    const findValidRule = (type, condition) => {
       const validRules = rules.filter(r => r.type === type && condition(r) && isValidRule(r));
       if (validRules.length === 0) return null;
       validRules.sort((a, b) => {
         const sa = a.startDate || '1970-01-01';
         const sb = b.startDate || '1970-01-01';
         return sa < sb ? 1 : (sa > sb ? -1 : 0);
       });
       return validRules[0];
    };

    const weeklyRule = findValidRule('weekly', r => r.dayOfWeek === date.getDay());
    if (weeklyRule) return { ...weeklyRule, status: weeklyRule.status || 'x', text: weeklyRule.text || '' };
    
    const monthlyRule = findValidRule('monthly', r => r.dayOfMonth === date.getDate());
    if (monthlyRule) return { ...monthlyRule, status: monthlyRule.status || 'x', text: monthlyRule.text || '' };
    
    const dailyRule = findValidRule('daily', r => true);
    if (dailyRule) return { ...dailyRule, status: dailyRule.status || 'x', text: dailyRule.text || '' };
    
    return null;
  };

  const getDayStatus = (date) => {
    if(groupMembers.length === 0) return { dayStatus: 'ng', detail: [] };
    const periods = getPeriodListForDate(date);
    const detail = [];
    let isAnyPeriodAllOK = false;
    let isAnyPeriodTriangleOnly = false;

    for (let p of periods) {
      const xMembers = [];
      const triangleMembers = [];
      const okMembers = [];
      let bossNotice = null; 
      
      groupMembers.forEach(m => {
        const rule = getUserScheduleRule(m.id, date, p);
        if (rule) {
          if (m.username === 'Boss') {
            if (rule.status === 'studio1') bossNotice = '1スタジオ使用不可';
            else if (rule.status === 'studio2') bossNotice = '2スタジオ使用不可';
            else if (rule.text) bossNotice = rule.text;
          }

          if (m.username !== 'Boss') {
            if (rule.status === 'ok') okMembers.push(m);
            else if (rule.status === 'triangle') triangleMembers.push(m);
            else if (rule.status === 'x') xMembers.push(m);
          }
        }
      });

      detail.push({ period: p, xMembers, triangleMembers, okMembers, bossNotice });
      
      const actualMembersCount = groupMembers.filter(m => m.username !== 'Boss').length;
      const isAllOkPeriod = xMembers.length === 0 && triangleMembers.length === 0 && actualMembersCount > 0;
      const isTriPeriod = xMembers.length === 0 && triangleMembers.length > 0 && actualMembersCount > 0;

      if (isAllOkPeriod) isAnyPeriodAllOK = true;
      else if (isTriPeriod) isAnyPeriodTriangleOnly = true;
    }
    
    let dayStatus = 'ng';
    if (isAnyPeriodAllOK) dayStatus = 'ok';
    else if (isAnyPeriodTriangleOnly) dayStatus = 'triangle';

    return { dayStatus, detail };
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
              const actualMembersCount = groupMembers.filter(m => m.username !== 'Boss').length;
              const isAllOK = p.xMembers.length === 0 && p.triangleMembers.length === 0 && actualMembersCount > 0;
              const isTriangle = p.xMembers.length === 0 && p.triangleMembers.length > 0 && actualMembersCount > 0;
              
              let itemBg = 'bg-gray-50 border-gray-100';
              let badgeBg = 'bg-gray-200 text-gray-700';
              if (isAllOK) { itemBg = 'bg-emerald-50 border-emerald-200'; badgeBg = 'bg-emerald-200 text-emerald-800'; } 
              else if (isTriangle) { itemBg = 'bg-amber-50 border-amber-200'; badgeBg = 'bg-amber-200 text-amber-800'; }

              return (
                <div key={p.period} className={`p-3 rounded-xl flex items-center gap-3 border ${itemBg}`}>
                  <div className={`w-14 text-center font-bold text-xs py-1.5 rounded-lg shrink-0 ${badgeBg}`}>{formatPeriod(p.period)}</div>
                  <div className="flex-1">
                    {p.bossNotice && (
                      <div className="text-xs font-bold text-gray-800 flex items-center gap-1 mb-1 bg-white/90 p-1.5 rounded-lg border border-gray-200 shadow-sm">
                        <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                        <span>【{formatPeriod(p.period)}】管理者連絡: {p.bossNotice}</span>
                      </div>
                    )}
                    {isAllOK ? (
                      <div>
                        <span className="text-sm font-bold text-emerald-600 flex items-center gap-1"><Check size={16} /> 全員空いています！</span>
                        {p.okMembers.length > 0 && (
                          <div className="text-[10px] text-blue-600 mt-1">
                            <span className="font-bold">〇 臨時({p.okMembers.length}人):</span> {p.okMembers.map(m => m.displayName).join(', ')}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-gray-600 space-y-1">
                        {p.xMembers.length > 0 && <div><span className="font-medium text-red-500">× ({p.xMembers.length}人)</span>: {p.xMembers.map(m => m.displayName).join(', ')}</div>}
                        {p.triangleMembers.length > 0 && <div><span className="font-medium text-amber-600">△ ({p.triangleMembers.length}人)</span>: {p.triangleMembers.map(m => m.displayName).join(', ')}</div>}
                        {p.okMembers.length > 0 && <div><span className="font-medium text-blue-600">〇 臨時({p.okMembers.length}人)</span>: {p.okMembers.map(m => m.displayName).join(', ')}</div>}
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
      const today = new Date();
      const list = [];
      const allAvailableSummary = [];
      const actualMembersCount = groupMembers.filter(m => m.username !== 'Boss').length;

      if (actualMembersCount === 0) return <div className="p-8 text-center text-gray-500">メンバーがいません。</div>;

      for(let i=0; i<60; i++) {
        const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
        const periods = getPeriodListForDate(d);
        const dayPeriods = [];
        const perfectOrOkPeriods = [];

        for (let p of periods) {
          const xMembers = [];
          const triangleMembers = [];
          const okMembers = [];
          let bossNotice = null;
          
          groupMembers.forEach(m => {
            const rule = getUserScheduleRule(m.id, d, p);
            if (rule) {
              if (m.username === 'Boss') {
                if (rule.status === 'studio1') bossNotice = '1スタジオ使用不可';
                else if (rule.status === 'studio2') bossNotice = '2スタジオ使用不可';
                else if (rule.text) bossNotice = rule.text;
              }

              if (m.username !== 'Boss') {
                if (rule.status === 'ok') okMembers.push(m);
                else if (rule.status === 'triangle') triangleMembers.push(m);
                else if (rule.status === 'x') xMembers.push(m);
              }
            }
          });

          const xCount = xMembers.length;
          const triCount = triangleMembers.length;

          if (xCount === actualMembersCount && !bossNotice) continue; 

          let category = 0;
          if (xCount === 0 && triCount === 0) category = 1;
          else if (xCount === 0 && triCount > 0) category = 2;
          else if (xCount > 0 && triCount === 0) category = 3;
          else if (xCount > 0 && triCount > 0) category = 4;

          const periodData = { period: p, category, xMembers, triangleMembers, okMembers, bossNotice };
          dayPeriods.push(periodData);

          if (category === 1 || category === 2) {
            perfectOrOkPeriods.push(periodData);
          }
        }

        if (dayPeriods.length > 0) {
          list.push({ date: d, dayPeriods });
        }
        if (perfectOrOkPeriods.length > 0) {
          allAvailableSummary.push({ date: d, periods: perfectOrOkPeriods });
        }
      }

      if (list.length === 0) return <div className="p-8 text-center text-gray-500">直近60日で1人でも参加できる枠はありません。</div>;

      const filteredList = list.map(item => {
        const filteredPeriods = item.dayPeriods.filter(dp => {
          if (listFilter === 'perfectOnly') return dp.category === 1;
          if (listFilter === 'allOk') return dp.category === 1 || dp.category === 2;
          return true;
        });
        return { ...item, dayPeriods: filteredPeriods };
      }).filter(item => item.dayPeriods.length > 0);

      return (
        <div className="p-4 space-y-4">
          <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-emerald-200">
              <div className="flex items-center gap-1.5">
                <Check size={18} className="text-emerald-600" strokeWidth={3} />
                <h3 className="font-bold text-emerald-950 text-sm">全員空いている日時まとめ（直近60日）</h3>
              </div>
              <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                {allAvailableSummary.length}日該当
              </span>
            </div>

            {allAvailableSummary.length === 0 ? (
              <p className="text-xs text-emerald-800 py-2 text-center">
                直近60日間でメンバー全員が揃う枠（×が0人の枠）はまだありません。
              </p>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {allAvailableSummary.map((sItem, sIdx) => {
                  const dayOfWeek = ['日','月','火','水','木','金','土'][sItem.date.getDay()];
                  const dayColor = sItem.date.getDay() === 0 ? 'text-red-600' : sItem.date.getDay() === 6 ? 'text-blue-600' : 'text-gray-800';
                  return (
                    <div key={sIdx} className="bg-white p-2.5 rounded-xl border border-emerald-200 flex flex-col gap-1.5 shadow-sm">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${dayColor}`}>
                          {sItem.date.getMonth() + 1}/{sItem.date.getDate()} ({dayOfWeek})
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {sItem.periods.map(p => (
                          <div 
                            key={p.period} 
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border ${
                              p.category === 1 
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            }`}
                          >
                            <span>{ p.category === 1 ? '◎' : '〇' } {formatPeriod(p.period)}</span>
                            {p.category === 2 && (
                              <span className="text-[9px] font-normal text-blue-700">
                                (△:{p.triangleMembers.map(m => m.displayName).join(',')})
                              </span>
                            )}
                            {p.bossNotice && (
                              <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300">
                                ※{p.bossNotice}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-2.5 pt-2 border-t border-emerald-200/60 flex items-center gap-3 text-[10px] text-emerald-900">
              <span><strong>◎</strong>：全員が完全OK</span>
              <span><strong>〇</strong>：全員参加可（△メンバー含む）</span>
            </div>
          </div>

          <div className="flex bg-gray-200/80 p-1 rounded-xl gap-1">
            <button 
              onClick={() => setListFilter('all')} 
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${listFilter === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-600'}`}
            >
              すべて表示
            </button>
            <button 
              onClick={() => setListFilter('allOk')} 
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${listFilter === 'allOk' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}
            >
              全員OK(◎・〇)のみ
            </button>
            <button 
              onClick={() => setListFilter('perfectOnly')} 
              className={`flex-1 py-1.5 text-[11px] font-bold rounded-lg transition-all ${listFilter === 'perfectOnly' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600'}`}
            >
              ◎全員参加のみ
            </button>
          </div>

          <div className="bg-white p-3 rounded-xl shadow-sm border text-xs space-y-1.5">
            <div className="font-bold text-gray-700 mb-2 border-b pb-1">状況の見方</div>
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">◎ 全員参加</span> 全員が「〇」の枠</div>
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">〇 全員OK</span> 全員参加できるが「△」を含む</div>
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-amber-100 text-amber-700 font-bold">△ 一部NG</span> 欠席者がいるが、参加者は全員「〇」</div>
            <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-red-100 text-red-700 font-bold">▲ 要調整</span> 欠席者がおり、参加者にも「△」を含む</div>
          </div>

          {filteredList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-gray-100 text-gray-500 text-sm">
              条件に一致する枠はありません。
            </div>
          ) : (
            filteredList.map((item, idx) => (
              <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="border-b border-gray-50 pb-2 mb-3">
                  <span className="text-sm text-gray-500">{item.date.getFullYear()}年</span>
                  <span className="text-lg font-bold text-gray-800 ml-1">
                    {item.date.getMonth()+1}/{item.date.getDate()} 
                    <span className="text-sm text-gray-500 ml-1">({['日','月','火','水','木','金','土'][item.date.getDay()]})</span>
                  </span>
                </div>
                <div className="space-y-3">
                  {item.dayPeriods.map(dp => {
                    let badge = '';
                    if (dp.category === 1) badge = <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">◎ 全員参加</span>;
                    else if (dp.category === 2) badge = <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">〇 全員OK(△有)</span>;
                    else if (dp.category === 3) badge = <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">△ 一部NG(残〇)</span>;
                    else if (dp.category === 4) badge = <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-1 rounded-md shrink-0">▲ 要調整(△有)</span>;

                    return (
                      <div key={dp.period} className="flex flex-col gap-1.5 p-2.5 rounded-xl border bg-gray-50 border-gray-100">
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-gray-800 w-12 text-center text-sm">{formatPeriod(dp.period)}</span>
                          {badge}
                        </div>
                        
                        {dp.bossNotice && (
                          <div className="text-xs font-bold text-gray-800 ml-14 bg-white p-2 rounded-lg flex items-center gap-1.5 border border-gray-200 shadow-sm">
                            <AlertTriangle size={14} className="shrink-0 text-amber-500" />
                            <span>【{formatPeriod(dp.period)}】管理者連絡: {dp.bossNotice}</span>
                          </div>
                        )}

                        {(dp.xMembers.length > 0 || dp.triangleMembers.length > 0 || dp.okMembers.length > 0) && (
                          <div className="text-[11px] ml-14 space-y-0.5 mt-1">
                            {dp.xMembers.length > 0 && (
                              <div className="text-red-600">
                                <span className="font-bold">×({dp.xMembers.length}人):</span> {dp.xMembers.map(m => m.displayName).join(', ')}
                              </div>
                            )}
                            {dp.triangleMembers.length > 0 && (
                              <div className="text-amber-600">
                                <span className="font-bold">△({dp.triangleMembers.length}人):</span> {dp.triangleMembers.map(m => m.displayName).join(', ')}
                              </div>
                            )}
                            {dp.okMembers.length > 0 && (
                              <div className="text-blue-600">
                                <span className="font-bold">〇 臨時({dp.okMembers.length}人):</span> {dp.okMembers.map(m => m.displayName).join(', ')}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      );
    };

    const renderMemberList = () => {
      const pureMembers = groupMembers.filter(m => m.username !== 'Boss');
      return (
        <div className="p-4 space-y-3">
          <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
            <span className="font-bold text-gray-800">メンバー一覧 ({pureMembers.length}人)</span>
          </div>
          {pureMembers.map(m => (
            <div key={m.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner shrink-0">
                {m.displayName.substring(0, 1)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h4 className="font-bold text-gray-900 truncate">{m.displayName}</h4>
                  <span className="text-[10px] text-gray-400">@{m.username}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{m.year}</div>
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {m.parts && m.parts.map(part => (
                    <span key={part} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-medium">{part}</span>
                  ))}
                  {(!m.parts || m.parts.length === 0) && <span className="text-[10px] text-gray-400">パート未設定</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white p-4 border-b flex items-center gap-3 sticky top-0 z-10 shadow-sm">
          <button onClick={() => setActiveGroup(null)} className="p-2 -ml-2 bg-gray-50 rounded-full hover:bg-gray-100"><ChevronLeft size={20} className="text-gray-700" /></button>
          <div className="flex-1 min-w-0">
            {isEditingGroupName ? (
              <div className="flex items-center gap-2">
                <input 
                  type="text" 
                  className="border border-indigo-300 px-2 py-1 rounded-lg text-sm font-bold w-full focus:ring-2 focus:ring-indigo-500"
                  value={editingGroupName}
                  onChange={e => setEditingGroupName(e.target.value)}
                  autoFocus
                />
                <button onClick={handleUpdateGroupName} className="bg-indigo-600 text-white px-3 py-1 rounded-lg text-xs font-bold shrink-0">保存</button>
                <button onClick={() => setIsEditingGroupName(false)} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-lg text-xs">取消</button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900 truncate">{activeGroup.name}</h2>
                <button 
                  onClick={() => { setEditingGroupName(activeGroup.name); setIsEditingGroupName(true); }}
                  className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 shrink-0"
                  title="グループ名を変更"
                >
                  <Edit2 size={16} />
                </button>
              </div>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-gray-500">メンバー {groupMembers.filter(m => m.username !== 'Boss').length}人</span>
              <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">コード: <strong className="font-mono tracking-widest">{activeGroup.joinCode}</strong></span>
            </div>
          </div>
        </div>

        <div className="flex p-2 bg-gray-100 mx-4 mt-4 rounded-xl overflow-x-auto hide-scrollbar gap-1">
            <button onClick={() => setGroupViewTab('calendar')} className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${groupViewTab === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>カレンダー</button>
            <button onClick={() => setGroupViewTab('list')} className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${groupViewTab === 'list' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>空き日一覧</button>
            <button onClick={() => setGroupViewTab('members')} className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${groupViewTab === 'members' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>メンバー</button>
        </div>

        {groupViewTab === 'calendar' && <>{renderGroupCalendar()}{renderGroupDayDetail()}</>}
        {groupViewTab === 'list' && renderAvailableList()}
        {groupViewTab === 'members' && renderMemberList()}
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

function ProfileView({ user, setUser, setShowTutorial, handleLogout }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user.displayName);
  const [nameError, setNameError] = useState('');

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setNameError('表示名を入力してください');
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.id), { displayName: newDisplayName.trim() });
      const updatedUser = { ...user, displayName: newDisplayName.trim() };
      setUser(updatedUser);
      
      const storedAuth = localStorage.getItem('wpb_bandsync_auth');
      if (storedAuth) {
        const parsed = JSON.parse(storedAuth);
        parsed.userData = updatedUser;
        localStorage.setItem('wpb_bandsync_auth', JSON.stringify(parsed));
      }

      setIsEditingName(false);
      setNameError('');
    } catch (e) {
      setNameError('更新に失敗しました: ' + e.message);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-10"></div>
        <div className="w-24 h-24 bg-white border-4 border-white shadow-lg rounded-full flex items-center justify-center text-indigo-600 font-bold text-4xl mx-auto mb-4 relative z-10">{user.displayName.substring(0, 1)}</div>
        
        {isEditingName ? (
          <div className="space-y-2 max-w-xs mx-auto mb-2">
            {nameError && <p className="text-xs text-red-500">{nameError}</p>}
            <input 
              type="text" 
              className="w-full border border-gray-300 p-2 rounded-xl text-sm text-center font-bold"
              value={newDisplayName}
              onChange={e => setNewDisplayName(e.target.value)}
              autoFocus
            />
            <div className="flex gap-2 justify-center">
              <button onClick={handleUpdateDisplayName} className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow">保存</button>
              <button onClick={() => { setIsEditingName(false); setNewDisplayName(user.displayName); }} className="bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs">取消</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="text-2xl font-bold text-gray-900">{user.displayName}</h2>
            <button 
              onClick={() => setIsEditingName(true)} 
              className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 transition-colors"
              title="ニックネームを変更"
            >
              <Edit2 size={16} />
            </button>
          </div>
        )}

        <p className="text-sm text-gray-500">@{user.username}</p>
        <div className="mt-6 flex justify-center gap-2 flex-wrap">
          <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">{user.year}</span>
          {user.parts.map(part => <span key={part} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">{part}</span>)}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mt-6">
         <div className="p-4 border-b border-gray-50 flex items-center gap-3 text-gray-700">
            <Settings size={20} className="text-gray-400" />
            <span className="font-medium text-sm">アカウント設定</span>
         </div>
         
         <div 
           className="p-4 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
           onClick={() => setShowTutorial(true)}
         >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-indigo-500" />
              <span className="font-medium text-sm text-gray-700">使い方を見る (チュートリアル)</span>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
         </div>

         <div 
           className="p-4 flex items-center justify-between bg-red-50 cursor-pointer hover:bg-red-100 transition-colors"
           onClick={handleLogout}
         >
            <span className="font-medium text-sm text-red-600">ログアウト</span>
            <LogOut size={16} className="text-red-500" />
         </div>
      </div>
    </div>
  );
}

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
```
