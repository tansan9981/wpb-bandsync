import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { 
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, 
  deleteDoc, query, where
} from "firebase/firestore";
import { 
  Calendar as CalendarIcon, Users, User, Settings, Check, 
  X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Shield, LogOut, 
  Trash2, KeyRound, BookOpen, AlertTriangle, Edit2, Plus, Eye, EyeOff
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

let db;
try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase Error:", e);
}

// --- Shared Logic & Constants ---
const BAND_CATEGORIES = ['通年バンド', '企画バンド', '復活バンド', '卒コンバンド', 'その他'];

const getBandCategoryBadgeStyle = (category) => {
  switch (category) {
    case '通年バンド':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case '企画バンド':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case '復活バンド':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case '卒コンバンド':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

// 現在の「年度」を取得（毎年4月1日に年度が1つ上がる）
const getCurrentAcademicYear = (date = new Date()) => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  return month >= 4 ? year : year - 1;
};

// 選択可能な入学年度リストを生成
const getYearOptions = () => {
  const currentAY = getCurrentAcademicYear();
  const options = [];
  for (let y = currentAY; y >= currentAY - 5; y--) {
    options.push(`${y}年度`);
  }
  options.push('OB/OG');
  return options;
};

// 入学年度から「〇〇年度 (〇回生)」の文字列を算出
const formatYearWithGrade = (yearStr) => {
  if (!yearStr) return '年度未設定';
  if (yearStr === 'OB/OG') return 'OB/OG';
  const match = String(yearStr).match(/(\d{4})/);
  if (!match) return yearStr;
  const entryYear = parseInt(match[1], 10);
  const currentAY = getCurrentAcademicYear();
  const grade = currentAY - entryYear + 1;
  if (grade <= 0) return `${entryYear}年度 (入学予定)`;
  return `${entryYear}年度 (${grade}回生)`;
};

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
                また、<strong>「この日を一括で設定（全日）」</strong>のボタンを使えば、1日丸ごとの予定をまとめて入力・切り替え・解除できます！
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
              <h3 className="text-lg font-bold text-gray-900">4. グループ参加と閲覧者モード</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                「グループ」タブから、バンドのグループを<strong>「新規作成」</strong>するか、<strong>6桁の参加コード</strong>で参加します。<br/><br/>
                参加する時だけでなく、<strong>グループに入った後でも「メンバー ⇄ 閲覧者（予定に影響しない）」をいつでも切り替え</strong>られます！
              </p>
            </div>
          )}

          {step === 6 && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <Check size={32} strokeWidth={3} />
              </div>
              <h3 className="text-lg font-bold text-gray-900">5. 特定のメンバーとも予定を合わせられる！</h3>
              <p className="text-sm text-gray-600 leading-relaxed text-left">
                グループ画面の「カレンダー」や「空き日一覧」では、<strong>メンバーごとのON/OFFフィルター</strong>を使って特定のメンバー同士だけの空き日も簡単に探せます！
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

// --- Main App Component ---
export default function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('mySchedule');
  
  const [isLogin, setIsLogin] = useState(true);
  const defaultYearOption = `${getCurrentAcademicYear()}年度`;
  const [authForm, setAuthForm] = useState({ username: '', password: '', confirmPassword: '', displayName: '', year: defaultYearOption, parts: [] });
  const [authError, setAuthError] = useState('');

  const [activeGroup, setActiveGroup] = useState(null);
  const [showTutorial, setShowTutorial] = useState(false);

  // ブラウザの自動翻訳を完全に無効化
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = 'ja';
      document.documentElement.setAttribute('translate', 'no');
      document.documentElement.classList.add('notranslate');
      if (document.body) {
        document.body.setAttribute('translate', 'no');
        document.body.classList.add('notranslate');
      }
      let meta = document.querySelector('meta[name="google"]');
      if (!meta) {
        meta = document.createElement('meta');
        meta.name = 'google';
        document.head.appendChild(meta);
      }
      meta.content = 'notranslate';
    }
  }, []);

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
          username: authForm.username,
          password: authForm.password,
          displayName: authForm.displayName,
          year: authForm.year,
          parts: authForm.parts,
          bands: [],
          createdAt: new Date().toISOString()
        };
        const q = query(collection(db, "users"), where("username", "==", authForm.username));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) { setAuthError('このユーザー名は既に使用されています。'); return; }
        
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
    setAuthForm({ username: '', password: '', confirmPassword: '', displayName: '', year: defaultYearOption, parts: [] });
    localStorage.removeItem('wpb_bandsync_auth');
  };

  const togglePart = (part) => {
    setAuthForm(prev => ({ ...prev, parts: prev.parts.includes(part) ? prev.parts.filter(p => p !== part) : [...prev.parts, part] }));
  };

  const handleCloseTutorial = () => {
    setShowTutorial(false);
  };

  if (!user) {
    const yearOptions = getYearOptions();
    return (
      <div translate="no" className="notranslate min-h-screen bg-gray-50 flex items-center justify-center p-4">
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
                  <label className="block text-xs font-medium text-gray-700 mb-1">入学年度（現在の回生）</label>
                  <select className="block w-full px-3 py-2 border border-gray-300 rounded-xl sm:text-sm" value={authForm.year} onChange={e => setAuthForm({...authForm, year: e.target.value})}>
                    {yearOptions.map(y => <option key={y} value={y}>{formatYearWithGrade(y)}</option>)}
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
    <div translate="no" className="notranslate min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white shadow-sm border-b border-gray-100 z-30 sticky top-0">
        <div className="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-lg font-bold text-indigo-900">WPB BandSync</h1>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600"><LogOut size={20} /></button>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-md mx-auto pb-20 relative">
        {activeTab === 'mySchedule' && <MyScheduleView user={user} />}
        {activeTab === 'groups' && <GroupsView user={user} activeGroup={activeGroup} setActiveGroup={setActiveGroup} />}
        {activeTab === 'profile' && <ProfileView user={user} setUser={setUser} setShowTutorial={setShowTutorial} handleLogout={handleLogout} />}
        {activeTab === 'admin' && user.username === 'Boss' && <AdminView />}
      </main>

      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full z-30 pb-safe">
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

  const computeScheduleRule = (schedulesList, date, period) => {
    const rules = schedulesList.filter(r => r.period === period);
    const dStr = getLocalYMD(date);
    
    const isValidRule = (r) => {
      if (r.startDate && r.startDate > dStr) return false;
      if (r.endDate && r.endDate < dStr) return false;
      return true;
    };

    const onceRule = rules.find(r => r.type === 'once' && r.date === dStr);
    if (onceRule) return { ...onceRule, status: onceRule.status || 'x', text: onceRule.text || '', isOverride: true };

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

  const getBossRule = (date, period) => {
    return computeScheduleRule(bossSchedules, date, period);
  };

  const getScheduleRule = (date, period) => {
    return computeScheduleRule(mySchedules, date, period);
  };

  const getPrevDayYMD = (ymdStr) => {
    const [y, m, d] = ymdStr.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    return getLocalYMD(prev);
  };

  const applyPeriodRuleChange = async (schedulesList, date, period, type, newStatus, textVal, startDateVal, endDateVal, mode) => {
    let updated = [...schedulesList];
    const dStr = startDateVal || getLocalYMD(date);
    const prevDayStr = getPrevDayYMD(dStr);

    const getValidRecurringRules = (targetType = null) => {
      return updated.filter(r => {
        if (r.period !== period || r.type === 'once') return false;
        if (targetType && r.type !== targetType) return false;
        if (r.startDate && r.startDate > dStr) return false;
        if (r.endDate && r.endDate < dStr) return false;
        if (r.type === 'weekly' && r.dayOfWeek !== date.getDay()) return false;
        if (r.type === 'monthly' && r.dayOfMonth !== date.getDate()) return false;
        return true;
      });
    };

    const terminateRuleAtDate = async (rule) => {
      const safeStart = rule.startDate || '2000-01-01';
      if (rule.type === 'once' || safeStart >= dStr) {
        await deleteDoc(doc(db, "schedules", rule.id));
        updated = updated.filter(r => r.id !== rule.id);
      } else {
        await updateDoc(doc(db, "schedules", rule.id), { endDate: prevDayStr });
        updated = updated.map(r => r.id === rule.id ? { ...r, endDate: prevDayStr } : r);
      }
    };

    if (mode === 'remove') {
      const currentDisplayed = computeScheduleRule(updated, date, period);
      if (currentDisplayed) {
        await terminateRuleAtDate(currentDisplayed);
      }
      return updated;
    }

    if (type === 'once') {
      const sameDayRecurring = getValidRecurringRules().filter(r => (r.startDate || '2000-01-01') >= dStr);
      for (const r of sameDayRecurring) {
        await deleteDoc(doc(db, "schedules", r.id));
        updated = updated.filter(item => item.id !== r.id);
      }

      const existingOnce = updated.find(r => r.period === period && r.type === 'once' && r.date === dStr);
      if (existingOnce) {
        await updateDoc(doc(db, "schedules", existingOnce.id), { status: newStatus, text: textVal });
        updated = updated.map(r => r.id === existingOnce.id ? { ...r, status: newStatus, text: textVal } : r);
      } else {
        const newRule = { userId: user.id, period, type: 'once', date: dStr, status: newStatus, text: textVal, startDate: dStr, endDate: '' };
        const docRef = await addDoc(collection(db, "schedules"), newRule);
        updated.push({ id: docRef.id, ...newRule });
      }
    } else {
      const existingOnce = updated.find(r => r.period === period && r.type === 'once' && r.date === dStr);
      if (existingOnce) {
        await deleteDoc(doc(db, "schedules", existingOnce.id));
        updated = updated.filter(r => r.id !== existingOnce.id);
      }

      const otherRecurring = getValidRecurringRules().filter(r => r.type !== type);
      for (const r of otherRecurring) {
        await terminateRuleAtDate(r);
      }

      const sameTypeRecurring = getValidRecurringRules(type);
      if (sameTypeRecurring.length > 0) {
        sameTypeRecurring.sort((a, b) => ((a.startDate || '1970-01-01') < (b.startDate || '1970-01-01') ? 1 : -1));
        const targetRule = sameTypeRecurring[0];
        for (let i = 1; i < sameTypeRecurring.length; i++) {
          await terminateRuleAtDate(sameTypeRecurring[i]);
        }

        const safeStart = targetRule.startDate || '2000-01-01';
        if (safeStart >= dStr) {
          const updatePayload = { status: newStatus, text: textVal, startDate: dStr, endDate: endDateVal };
          await updateDoc(doc(db, "schedules", targetRule.id), updatePayload);
          updated = updated.map(r => r.id === targetRule.id ? { ...r, ...updatePayload } : r);
        } else {
          await updateDoc(doc(db, "schedules", targetRule.id), { endDate: prevDayStr });
          updated = updated.map(r => r.id === targetRule.id ? { ...r, endDate: prevDayStr } : r);

          let newRule = { userId: user.id, period, type, status: newStatus, text: textVal, startDate: dStr, endDate: endDateVal };
          if (type === 'weekly') newRule.dayOfWeek = date.getDay();
          if (type === 'monthly') newRule.dayOfMonth = date.getDate();
          const docRef = await addDoc(collection(db, "schedules"), newRule);
          updated.push({ id: docRef.id, ...newRule });
        }
      } else {
        let newRule = { userId: user.id, period, type, status: newStatus, text: textVal, startDate: dStr, endDate: endDateVal };
        if (type === 'weekly') newRule.dayOfWeek = date.getDay();
        if (type === 'monthly') newRule.dayOfMonth = date.getDate();
        const docRef = await addDoc(collection(db, "schedules"), newRule);
        updated.push({ id: docRef.id, ...newRule });
      }
    }

    return updated;
  };

  const toggleSchedule = async (date, period, type, newStatus, textVal = '', startDateVal = '', endDateVal = '') => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const currentDisplayed = computeScheduleRule(mySchedules, date, period);
      const isSameAlreadyDisplayed = currentDisplayed &&
        currentDisplayed.type === type &&
        (currentDisplayed.status || 'x') === newStatus &&
        (currentDisplayed.text || '') === textVal &&
        (type === 'once' || (currentDisplayed.endDate || '') === endDateVal);

      const mode = isSameAlreadyDisplayed ? 'remove' : 'set';
      const updatedSchedules = await applyPeriodRuleChange(
        mySchedules,
        date,
        period,
        type,
        newStatus,
        textVal,
        startDateVal,
        endDateVal,
        mode
      );

      setMySchedules(updatedSchedules);

      if (user.username === 'Boss') {
        const bossQ = query(collection(db, "schedules"), where("userId", "==", user.id));
        const bossSnap = await getDocs(bossQ);
        setBossSchedules(bossSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      }
    } catch (e) {
      alert("更新エラー: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSetAllDay = async (type, startDateVal = '', endDateVal = '') => {
    if (isProcessing) return;
    setIsProcessing(true);

    const periods = getPeriodListForDate(selectedDate);
    const isBoss = user.username === 'Boss';
    const textVal = isBoss ? customText : '';

    const isAllAlreadyDisplayed = periods.every(period => {
      const currentDisplayed = computeScheduleRule(mySchedules, selectedDate, period);
      return currentDisplayed &&
        currentDisplayed.type === type &&
        (currentDisplayed.status || 'x') === inputStatus &&
        (currentDisplayed.text || '') === textVal &&
        (type === 'once' || (currentDisplayed.endDate || '') === endDateVal);
    });

    const mode = isAllAlreadyDisplayed ? 'remove' : 'set';
    let updatedSchedules = [...mySchedules];
    let hasError = false;
    let errorMessage = "";

    for (const period of periods) {
      try {
        updatedSchedules = await applyPeriodRuleChange(
          updatedSchedules,
          selectedDate,
          period,
          type,
          inputStatus,
          textVal,
          startDateVal,
          endDateVal,
          mode
        );
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
    const defaultStart = getLocalYMD(date);
    if (type === 'once') {
      toggleSchedule(date, period, type, newStatus, textVal, defaultStart, '');
    } else {
      const existingRule = getScheduleRule(date, period);
      const isAlreadySameType = existingRule && existingRule.type === type;
      setConfirmDialog({
        type: 'periodInput',
        title: isAlreadySameType ? '繰り返し予定の変更・解除' : '繰り返し期間の指定',
        scheduleType: type,
        period: period,
        newStatus: newStatus,
        textVal: textVal,
        date: date,
        startDate: defaultStart,
        endDate: isAlreadySameType && existingRule.endDate ? existingRule.endDate : ''
      });
    }
  };

  const requestSetAllDay = (type) => {
    const defaultStart = getLocalYMD(selectedDate);
    if (type === 'once') {
      setConfirmDialog({
        title: '1日一括設定の確認',
        message: `「${getTypeLabel(type, selectedDate)}」の【すべての時限（全日）】に「${getStatusLabel(inputStatus)}」を一括で設定（または解除）しますか？`,
        subMessage: '※他の繰り返し設定になっている枠も、すべて「この日」に切り替わります。',
        onConfirm: () => {
          setConfirmDialog(null);
          handleSetAllDay(type, defaultStart, '');
        }
      });
    } else {
      setConfirmDialog({
        type: 'periodInputAllDay',
        title: '1日一括（期間指定）の確認',
        scheduleType: type,
        startDate: defaultStart,
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
              const isAllSetForThisType = periods.every(period => {
                const r = getScheduleRule(selectedDate, period);
                return r && r.type === type && (r.status || 'x') === inputStatus;
              });

              return (
                <button 
                  key={`all-${type}`} 
                  onClick={() => requestSetAllDay(type)}
                  disabled={isDisabled}
                  className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-colors border ${
                    isDisabled ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50' :
                    isAllSetForThisType
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm'
                      : 'bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50'
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

      {confirmDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-indigo-600 mb-3">
              <AlertTriangle size={22} className="shrink-0" />
              <h4 className="font-bold text-base text-gray-900">{confirmDialog.title}</h4>
            </div>

            {confirmDialog.type === 'periodInput' || confirmDialog.type === 'periodInputAllDay' ? (
              <div className="space-y-4">
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {confirmDialog.type === 'periodInput'
                    ? `「${getTypeLabel(confirmDialog.scheduleType, confirmDialog.date)}」の【${formatPeriod(confirmDialog.period)}】に「${getStatusLabel(confirmDialog.newStatus)}」を設定（または解除）します。`
                    : `「${getTypeLabel(confirmDialog.scheduleType, selectedDate)}」の【すべての時限（全日）】に「${getStatusLabel(inputStatus)}」を一括設定（または解除）します。`}
                </p>
                <div className="space-y-3 bg-gray-50 p-3 rounded-2xl border border-gray-200">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">開始日（この日から適用）</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 bg-white p-2 rounded-xl text-xs font-bold text-gray-800"
                      value={confirmDialog.startDate}
                      onChange={(e) => setConfirmDialog({ ...confirmDialog, startDate: e.target.value })}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">終了日（この日まで適用・空欄なら無期限）</label>
                    <input 
                      type="date" 
                      className="w-full border border-gray-300 bg-white p-2 rounded-xl text-xs font-bold text-gray-800"
                      value={confirmDialog.endDate}
                      min={confirmDialog.startDate}
                      onChange={(e) => setConfirmDialog({ ...confirmDialog, endDate: e.target.value })}
                    />
                  </div>
                  <p className="text-[10px] text-gray-500">※他の種類（この日など）が設定されている枠も、すべてこの設定に切り替わります。</p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setConfirmDialog(null)}
                    className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => {
                      const startVal = confirmDialog.startDate;
                      const endVal = confirmDialog.endDate;
                      if (startVal && endVal && startVal > endVal) {
                        alert('終了日は開始日以降の日付を指定してください。');
                        return;
                      }
                      const sType = confirmDialog.scheduleType;
                      const per = confirmDialog.period;
                      const st = confirmDialog.newStatus;
                      const txt = confirmDialog.textVal;
                      const targetDate = confirmDialog.date;
                      setConfirmDialog(null);

                      if (confirmDialog.type === 'periodInput') {
                        toggleSchedule(targetDate, per, sType, st, txt, startVal, endVal);
                      } else {
                        handleSetAllDay(sType, startVal, endVal);
                      }
                    }}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-indigo-700 transition-colors"
                  >
                    決定して実行
                  </button>
                </div>
              </div>
            ) : (
              <div>
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
              </div>
            )}
          </div>
        </div>
      )}
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
  const [joinAsViewer, setJoinAsViewer] = useState(false);
  
  const [isEditingGroupName, setIsEditingGroupName] = useState(false);
  const [editingGroupName, setEditingGroupName] = useState('');

  // 各種ワンクッション確認モーダル用ステート
  const [showDeleteGroupModal, setShowDeleteGroupModal] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  const [showLeaveGroupModal, setShowLeaveGroupModal] = useState(false);
  const [isLeavingGroup, setIsLeavingGroup] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState(null);
  const [isRemovingMember, setIsRemovingMember] = useState(false);
  const [showRoleSwitchModal, setShowRoleSwitchModal] = useState(false);
  const [isSwitchingRole, setIsSwitchingRole] = useState(false);

  const [groupMembers, setGroupMembers] = useState([]);
  const [allSchedules, setAllSchedules] = useState([]);
  const [groupViewTab, setGroupViewTab] = useState('calendar');
  const [listFilter, setListFilter] = useState('all'); 
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);

  // 特定のメンバーだけで予定を合わせるためのメンバーフィルター（ON / OFF）用ステート
  const [showMemberFilterPanel, setShowMemberFilterPanel] = useState(true);
  const [excludedMemberIds, setExcludedMemberIds] = useState([]);

  // カレンダー＆空き日一覧で共有する「所属バンド表示パネル」用ステート
  const [showBandPanel, setShowBandPanel] = useState(true);
  const [selectedBandCategoryFilter, setSelectedBandCategoryFilter] = useState('すべて');
  const [hiddenBandKeys, setHiddenBandKeys] = useState([]);
  const [isManagingBandVisibility, setIsManagingBandVisibility] = useState(false);

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
    setExcludedMemberIds([]);
    if (activeGroup && db) {
      const fetchDetails = async () => {
        const snapM = await getDocs(collection(db, "users"));
        const allU = snapM.docs.map(d => ({ id: d.id, ...d.data() }));
        const memberIds = activeGroup.members || [];
        const viewerIds = activeGroup.viewers || [];
        setGroupMembers(allU.filter(u => memberIds.includes(u.id) || viewerIds.includes(u.id) || u.username === 'Boss'));
        
        const snapS = await getDocs(collection(db, "schedules"));
        const allS = snapS.docs.map(d => ({ id: d.id, ...d.data() }));
        setAllSchedules(allS);
      };
      fetchDetails();
    }
  }, [activeGroup?.id, user]);

  // 指定したユーザーがそのグループの閲覧者かどうか判定
  const isViewerInGroup = (groupObj, targetUserId) => {
    if (!groupObj || !Array.isArray(groupObj.viewers)) return false;
    return groupObj.viewers.includes(targetUserId);
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const newGroup = {
        name: newGroupName.trim(),
        joinCode: generateJoinCode(),
        members: [user.id],
        viewers: [],
        createdBy: user.id,
        createdAt: new Date().toISOString()
      };
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
        const currentMembers = groupData.members || [];
        const currentViewers = groupData.viewers || [];

        const newMembers = currentMembers.includes(user.id)
          ? currentMembers
          : [...currentMembers, user.id];

        let newViewers = [...currentViewers];
        if (joinAsViewer) {
          if (!newViewers.includes(user.id)) newViewers.push(user.id);
        } else {
          newViewers = newViewers.filter(id => id !== user.id);
        }

        await updateDoc(doc(db, "groups", groupDoc.id), {
          members: newMembers,
          viewers: newViewers
        });

        const updatedGroupObj = { id: groupDoc.id, ...groupData, members: newMembers, viewers: newViewers };
        const existsIdx = groups.findIndex(g => g.id === groupDoc.id);
        if (existsIdx >= 0) {
          setGroups(groups.map(g => g.id === groupDoc.id ? updatedGroupObj : g));
        } else {
          setGroups([...groups, updatedGroupObj]);
        }

        setJoinCode('');
        setJoinAsViewer(false);
        setShowJoin(false);
      } else { alert("無効な参加コードです"); }
    } catch(e) { alert("参加エラー: " + e.message); }
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

  // 自分の参加モード（メンバー ⇄ 閲覧者）を切り替える処理
  const handleConfirmSwitchMyRole = async () => {
    if (!activeGroup || isSwitchingRole) return;
    setIsSwitchingRole(true);
    try {
      const currentMembers = activeGroup.members || [];
      const currentViewers = activeGroup.viewers || [];
      const currentlyViewer = currentViewers.includes(user.id);

      const ensuredMembers = currentMembers.includes(user.id)
        ? currentMembers
        : [...currentMembers, user.id];

      const newViewers = currentlyViewer
        ? currentViewers.filter(id => id !== user.id)
        : [...currentViewers, user.id];

      await updateDoc(doc(db, "groups", activeGroup.id), {
        members: ensuredMembers,
        viewers: newViewers
      });

      // 閲覧者からメンバーに戻った際、メンバーフィルターでOFFになっていた場合はONに戻す
      if (currentlyViewer) {
        setExcludedMemberIds(prev => prev.filter(id => id !== user.id));
      }

      const updatedGroup = { ...activeGroup, members: ensuredMembers, viewers: newViewers };
      setActiveGroup(updatedGroup);
      setGroups(groups.map(g => g.id === activeGroup.id ? updatedGroup : g));
      setShowRoleSwitchModal(false);
    } catch (e) {
      alert("参加モードの切り替えに失敗しました: " + e.message);
    } finally {
      setIsSwitchingRole(false);
    }
  };

  // バンドグループ削除の実行処理
  const handleConfirmDeleteGroup = async () => {
    if (!activeGroup || isDeletingGroup) return;
    setIsDeletingGroup(true);
    try {
      await deleteDoc(doc(db, "groups", activeGroup.id));
      setGroups(groups.filter(g => g.id !== activeGroup.id));
      setShowDeleteGroupModal(false);
      setActiveGroup(null);
    } catch (e) {
      alert("グループの削除に失敗しました: " + e.message);
    } finally {
      setIsDeletingGroup(false);
    }
  };

  // メンバー自身がグループから退出する処理
  const handleConfirmLeaveGroup = async () => {
    if (!activeGroup || isLeavingGroup) return;
    setIsLeavingGroup(true);
    try {
      const newMembers = (activeGroup.members || []).filter(id => id !== user.id);
      const newViewers = (activeGroup.viewers || []).filter(id => id !== user.id);
      await updateDoc(doc(db, "groups", activeGroup.id), {
        members: newMembers,
        viewers: newViewers
      });
      setGroups(groups.filter(g => g.id !== activeGroup.id));
      setShowLeaveGroupModal(false);
      setActiveGroup(null);
    } catch (e) {
      alert("グループからの退出に失敗しました: " + e.message);
    } finally {
      setIsLeavingGroup(false);
    }
  };

  // グループ作成者が指定メンバーを退出させる処理
  const handleConfirmRemoveMember = async () => {
    if (!activeGroup || !memberToRemove || isRemovingMember) return;
    setIsRemovingMember(true);
    try {
      const targetId = memberToRemove.id;
      const newMembers = (activeGroup.members || []).filter(id => id !== targetId);
      const newViewers = (activeGroup.viewers || []).filter(id => id !== targetId);
      await updateDoc(doc(db, "groups", activeGroup.id), {
        members: newMembers,
        viewers: newViewers
      });
      const updatedGroup = { ...activeGroup, members: newMembers, viewers: newViewers };
      setActiveGroup(updatedGroup);
      setGroups(groups.map(g => g.id === activeGroup.id ? updatedGroup : g));
      setGroupMembers(groupMembers.filter(m => m.id !== targetId || m.username === 'Boss'));
      setExcludedMemberIds(prev => prev.filter(id => id !== targetId));
      setMemberToRemove(null);
    } catch (e) {
      alert("メンバーの削除に失敗しました: " + e.message);
    } finally {
      setIsRemovingMember(false);
    }
  };

  const getUserScheduleRule = (userId, date, period) => {
    const rules = allSchedules.filter(r => r.userId === userId && r.period === period);
    const dStr = getLocalYMD(date);
    
    const isValidRule = (r) => {
      if (r.startDate && r.startDate > dStr) return false;
      if (r.endDate && r.endDate < dStr) return false;
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

  // スケジュールが反映される「通常メンバー全員」を取得（Bossと閲覧者を除外）
  const getActivePlayingMembers = () => {
    const viewerIds = activeGroup?.viewers || [];
    return groupMembers.filter(m => m.username !== 'Boss' && !viewerIds.includes(m.id));
  };

  // メンバーフィルターで「ON」になっている対象メンバーのみを取得
  const getTargetPlayingMembers = () => {
    return getActivePlayingMembers().filter(m => !excludedMemberIds.includes(m.id));
  };

  // 閲覧者のみを取得
  const getViewerMembers = () => {
    const viewerIds = activeGroup?.viewers || [];
    return groupMembers.filter(m => m.username !== 'Boss' && viewerIds.includes(m.id));
  };

  // メンバーフィルターの個別ON/OFF切り替え
  const toggleMemberFilter = (memberId) => {
    setExcludedMemberIds(prev =>
      prev.includes(memberId) ? prev.filter(id => id !== memberId) : [...prev, memberId]
    );
  };

  const getDayStatus = (date) => {
    const targetMembers = getTargetPlayingMembers();
    if (targetMembers.length === 0) return { dayStatus: 'ng', detail: [] };
    const periods = getPeriodListForDate(date);
    const detail = [];
    let isAnyPeriodAllOK = false;
    let isAnyPeriodTriangleOnly = false;

    for (let p of periods) {
      const xMembers = [];
      const triangleMembers = [];
      const okMembers = [];
      let bossNotice = null; 
      
      // 管理者連絡のチェック
      groupMembers.forEach(m => {
        if (m.username === 'Boss') {
          const rule = getUserScheduleRule(m.id, date, p);
          if (rule) {
            if (rule.status === 'studio1') bossNotice = '1スタジオ使用不可';
            else if (rule.status === 'studio2') bossNotice = '2スタジオ使用不可';
            else if (rule.text) bossNotice = rule.text;
          }
        }
      });

      // ONになっている対象メンバーの予定のみを集計
      targetMembers.forEach(m => {
        const rule = getUserScheduleRule(m.id, date, p);
        if (rule) {
          if (rule.status === 'ok') okMembers.push(m);
          else if (rule.status === 'triangle') triangleMembers.push(m);
          else if (rule.status === 'x') xMembers.push(m);
        }
      });

      detail.push({ period: p, xMembers, triangleMembers, okMembers, bossNotice });
      
      const actualMembersCount = targetMembers.length;
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

  // 現在ONになっているメンバーの所属バンドを集約する関数
  const getAggregatedGroupBands = () => {
    const targetMembers = getTargetPlayingMembers();
    const bandMap = new Map();

    targetMembers.forEach(member => {
      const bands = member.bands || [];
      bands.forEach(b => {
        if (!b || !b.name) return;
        const cat = b.category || 'その他';
        const key = `${cat}__${b.name.trim()}`;
        if (!bandMap.has(key)) {
          bandMap.set(key, {
            key,
            category: cat,
            name: b.name.trim(),
            members: [member.displayName]
          });
        } else {
          const item = bandMap.get(key);
          if (!item.members.includes(member.displayName)) {
            item.members.push(member.displayName);
          }
        }
      });
    });

    return Array.from(bandMap.values());
  };

  const toggleBandVisibility = (bandKey) => {
    setHiddenBandKeys(prev =>
      prev.includes(bandKey) ? prev.filter(k => k !== bandKey) : [...prev, bandKey]
    );
  };

  // カレンダー＆空き日一覧で共通利用する「スクロール追従：メンバー絞り込み＆所属バンドパネル」
  const renderStickyBandPanel = () => {
    const allPlayingMembers = getActivePlayingMembers();
    const targetPlayingMembers = getTargetPlayingMembers();
    const isMemberFiltered = excludedMemberIds.length > 0;

    const allGroupBands = getAggregatedGroupBands();
    const categoryFilteredBands = selectedBandCategoryFilter === 'すべて'
      ? allGroupBands
      : allGroupBands.filter(b => b.category === selectedBandCategoryFilter);
    const visibleBands = categoryFilteredBands.filter(b => !hiddenBandKeys.includes(b.key));

    return (
      <div className="sticky top-14 z-20 pt-2 pb-1 px-4 bg-gray-50/95 backdrop-blur-sm space-y-2">
        {/* 1. 予定を合わせるメンバー絞り込み（ON / OFF）パネル */}
        <div className="bg-white rounded-2xl shadow-md border border-emerald-200 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <User size={15} className="text-emerald-600 shrink-0" />
              <span className="text-xs font-bold text-gray-800 truncate">
                予定を合わせるメンバー
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border shrink-0 ${
                isMemberFiltered
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                ON {targetPlayingMembers.length}/{allPlayingMembers.length}人
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowMemberFilterPanel(!showMemberFilterPanel)}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors shrink-0 ${
                showMemberFilterPanel
                  ? 'bg-emerald-600 text-white border-emerald-700'
                  : 'bg-gray-100 text-gray-600 border-gray-200'
              }`}
            >
              <span>メンバー選択: {showMemberFilterPanel ? '開く' : '閉じる'}</span>
              {showMemberFilterPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </div>

          {showMemberFilterPanel && (
            <div className="space-y-2 pt-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-gray-500">
                  タップして個人の予定反映をON/OFFできます
                </span>
                <div className="flex gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setExcludedMemberIds([])}
                    className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100"
                  >
                    全員ON
                  </button>
                  {allPlayingMembers.some(m => m.id === user.id) && (
                    <button
                      type="button"
                      onClick={() => setExcludedMemberIds(allPlayingMembers.filter(m => m.id !== user.id).map(m => m.id))}
                      className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold hover:bg-indigo-100"
                    >
                      自分のみON
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setExcludedMemberIds(allPlayingMembers.map(m => m.id))}
                    className="px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-bold hover:bg-gray-200"
                  >
                    全員OFF
                  </button>
                </div>
              </div>

              {allPlayingMembers.length === 0 ? (
                <p className="text-[11px] text-gray-400 text-center py-1">メンバーがいません</p>
              ) : (
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-0.5">
                  {allPlayingMembers.map(m => {
                    const isOn = !excludedMemberIds.includes(m.id);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => toggleMemberFilter(m.id)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-bold border transition-all ${
                          isOn
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-gray-100 text-gray-400 border-gray-200 opacity-70'
                        }`}
                      >
                        <span className={`px-1 py-0.2 rounded text-[9px] font-bold ${
                          isOn ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                        }`}>
                          {isOn ? 'ON' : 'OFF'}
                        </span>
                        <span>{m.displayName}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 2. メンバーの所属バンド確認＆表示ON/OFFパネル */}
        <div className="bg-white rounded-2xl shadow-md border border-indigo-100 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <Users size={15} className="text-indigo-600 shrink-0" />
              <span className="text-xs font-bold text-gray-800 truncate">
                メンバーの所属バンド
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold border border-indigo-100 shrink-0">
                表示 {visibleBands.length}/{categoryFilteredBands.length}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {showBandPanel && categoryFilteredBands.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsManagingBandVisibility(!isManagingBandVisibility)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-colors ${
                    isManagingBandVisibility
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {isManagingBandVisibility ? '個別設定を完了' : '個別ON/OFF'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowBandPanel(!showBandPanel)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 border transition-colors ${
                  showBandPanel
                    ? 'bg-indigo-600 text-white border-indigo-700'
                    : 'bg-gray-100 text-gray-600 border-gray-200'
                }`}
              >
                {showBandPanel ? <Eye size={12} /> : <EyeOff size={12} />}
                <span>バンド表示: {showBandPanel ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {showBandPanel && (
            <>
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {['すべて', ...BAND_CATEGORIES].map(cat => {
                  const count = cat === 'すべて'
                    ? allGroupBands.length
                    : allGroupBands.filter(b => b.category === cat).length;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => setSelectedBandCategoryFilter(cat)}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap border transition-all ${
                        selectedBandCategoryFilter === cat
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                          : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {cat} ({count})
                    </button>
                  );
                })}
              </div>

              {isManagingBandVisibility && categoryFilteredBands.length > 0 && (
                <div className="flex items-center justify-between bg-amber-50 border border-amber-200 px-2.5 py-1.5 rounded-xl text-[10px]">
                  <span className="text-amber-800 font-bold">各バンドをタップして表示(ON)/非表示(OFF)を切替</span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        const keysToShow = categoryFilteredBands.map(b => b.key);
                        setHiddenBandKeys(prev => prev.filter(k => !keysToShow.includes(k)));
                      }}
                      className="bg-white text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded font-bold"
                    >
                      すべてON
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const keysToHide = categoryFilteredBands.map(b => b.key);
                        setHiddenBandKeys(prev => Array.from(new Set([...prev, ...keysToHide])));
                      }}
                      className="bg-white text-gray-600 border border-gray-200 px-1.5 py-0.5 rounded font-bold"
                    >
                      すべてOFF
                    </button>
                  </div>
                </div>
              )}

              <div className="max-h-28 overflow-y-auto pr-0.5">
                {categoryFilteredBands.length === 0 ? (
                  <p className="text-[11px] text-gray-400 text-center py-2">
                    {targetPlayingMembers.length === 0
                      ? 'メンバーが全員OFFになっています'
                      : `「${selectedBandCategoryFilter}」に登録されているバンドはありません`}
                  </p>
                ) : isManagingBandVisibility ? (
                  <div className="flex flex-wrap gap-1.5">
                    {categoryFilteredBands.map(b => {
                      const isHidden = hiddenBandKeys.includes(b.key);
                      return (
                        <button
                          type="button"
                          key={b.key}
                          onClick={() => toggleBandVisibility(b.key)}
                          className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-xl text-[11px] border transition-all ${
                            isHidden
                              ? 'bg-gray-100 text-gray-400 border-gray-200 opacity-60'
                              : 'bg-white text-gray-800 border-indigo-300 shadow-sm'
                          }`}
                        >
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            isHidden ? 'bg-gray-300 text-gray-600' : 'bg-indigo-600 text-white'
                          }`}>
                            {isHidden ? 'OFF' : 'ON'}
                          </span>
                          <span className="font-bold">{b.name}</span>
                          <span className="text-[10px] text-gray-500">({b.members.join(', ')})</span>
                        </button>
                      );
                    })}
                  </div>
                ) : visibleBands.length === 0 ? (
                  <div className="text-center py-2 space-y-1">
                    <p className="text-[11px] text-gray-400">表示がすべてOFFになっています</p>
                    <button
                      type="button"
                      onClick={() => setIsManagingBandVisibility(true)}
                      className="text-[10px] text-indigo-600 font-bold underline"
                    >
                      個別ON/OFF設定を開く
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {visibleBands.map(b => (
                      <div
                        key={b.key}
                        className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-xl px-2 py-1 text-[11px]"
                      >
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBandCategoryBadgeStyle(b.category)}`}>
                          {b.category}
                        </span>
                        <span className="font-bold text-gray-900">{b.name}</span>
                        <span className="text-[10px] text-indigo-700 font-medium">
                          ({b.members.join(', ')})
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleBandVisibility(b.key)}
                          className="ml-0.5 p-0.5 text-gray-400 hover:text-red-500 rounded"
                          title="このバンドを非表示(OFF)にする"
                        >
                          <X size={11} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  if (activeGroup) {
    // グループ作成者かどうか判定
    const isGroupCreator = activeGroup.createdBy
      ? activeGroup.createdBy === user.id
      : (Array.isArray(activeGroup.members) && activeGroup.members[0] === user.id) || user.username === 'Boss';

    const amIViewer = isViewerInGroup(activeGroup, user.id);
    const activePlayingMembers = getActivePlayingMembers();
    const targetPlayingMembers = getTargetPlayingMembers();
    const viewerMembers = getViewerMembers();

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
        <div className="px-4 pt-2 pb-4">
          {excludedMemberIds.length > 0 && (
            <div className="mb-3 px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <span>
                <strong>絞り込み中 ({targetPlayingMembers.length}人):</strong> {targetPlayingMembers.map(m => m.displayName).join(', ') || '対象なし'}
              </span>
              <button
                type="button"
                onClick={() => setExcludedMemberIds([])}
                className="text-[10px] font-bold text-amber-800 underline shrink-0 ml-2"
              >
                全員に戻す
              </button>
            </div>
          )}

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
      const actualMembersCount = targetPlayingMembers.length;

      return (
        <div className="p-4 bg-white border-t rounded-t-3xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] mt-2">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-800">
                {selectedDate.getMonth() + 1}/{selectedDate.getDate()} の空き状況
              </h3>
              {excludedMemberIds.length > 0 && (
                <p className="text-[11px] text-amber-700 font-bold">
                  ※ONの{actualMembersCount}人（{targetPlayingMembers.map(m => m.displayName).join(', ')}）で計算中
                </p>
              )}
            </div>
            <button onClick={() => setSelectedDate(null)} className="p-1 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200"><X size={16} /></button>
          </div>

          {actualMembersCount === 0 ? (
            <div className="p-6 text-center text-xs text-gray-500 bg-gray-50 rounded-2xl">
              予定を合わせるメンバーが全員OFFになっています。上部パネルでメンバーをONにしてください。
            </div>
          ) : (
            <div className="space-y-2">
              {status.detail.map((p) => {
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
                          <span className="text-sm font-bold text-emerald-600 flex items-center gap-1">
                            <Check size={16} />
                            {excludedMemberIds.length > 0 ? `選択中の${actualMembersCount}人全員空いています！` : '全員空いています！'}
                          </span>
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
          )}
        </div>
      );
    };

    const renderAvailableList = () => {
      const today = new Date();
      const list = [];
      const allAvailableSummary = [];
      const actualMembersCount = targetPlayingMembers.length;

      if (activePlayingMembers.length === 0) {
        return <div className="p-8 text-center text-gray-500">予定を反映するメンバーがいません（全員が閲覧者、またはメンバー0人です）。</div>;
      }

      if (actualMembersCount === 0) {
        return (
          <div className="p-8 text-center text-gray-500 bg-white m-4 rounded-2xl border border-gray-100 space-y-2">
            <p className="text-sm font-bold text-gray-700">予定を合わせるメンバーが全員OFFになっています</p>
            <p className="text-xs text-gray-500">上部の「予定を合わせるメンバー」から、予定を合わせたい人をONにしてください。</p>
            <button
              type="button"
              onClick={() => setExcludedMemberIds([])}
              className="mt-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-sm"
            >
              全員をONに戻す
            </button>
          </div>
        );
      }

      for (let i = 0; i < 60; i++) {
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
            if (m.username === 'Boss') {
              const rule = getUserScheduleRule(m.id, d, p);
              if (rule) {
                if (rule.status === 'studio1') bossNotice = '1スタジオ使用不可';
                else if (rule.status === 'studio2') bossNotice = '2スタジオ使用不可';
                else if (rule.text) bossNotice = rule.text;
              }
            }
          });

          // ONになっている対象メンバーのスケジュールのみ計算
          targetPlayingMembers.forEach(m => {
            const rule = getUserScheduleRule(m.id, d, p);
            if (rule) {
              if (rule.status === 'ok') okMembers.push(m);
              else if (rule.status === 'triangle') triangleMembers.push(m);
              else if (rule.status === 'x') xMembers.push(m);
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

      const filteredList = list.map(item => {
        const filteredPeriods = item.dayPeriods.filter(dp => {
          if (listFilter === 'perfectOnly') return dp.category === 1;
          if (listFilter === 'allOk') return dp.category === 1 || dp.category === 2;
          return true;
        });
        return { ...item, dayPeriods: filteredPeriods };
      }).filter(item => item.dayPeriods.length > 0);

      return (
        <div className="px-4 pt-2 pb-6 space-y-4">
          {excludedMemberIds.length > 0 && (
            <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900">
              <span>
                <strong>絞り込み中 ({targetPlayingMembers.length}人):</strong> {targetPlayingMembers.map(m => m.displayName).join(', ')}
              </span>
              <button
                type="button"
                onClick={() => setExcludedMemberIds([])}
                className="text-[10px] font-bold text-amber-800 underline shrink-0 ml-2"
              >
                全員に戻す
              </button>
            </div>
          )}

          {list.length === 0 ? (
            <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100">
              直近60日で1人でも参加できる枠はありません。
            </div>
          ) : (
            <>
              <div className="bg-emerald-50/90 border-2 border-emerald-300 rounded-2xl p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-emerald-200">
                  <div className="flex items-center gap-1.5">
                    <Check size={18} className="text-emerald-600" strokeWidth={3} />
                    <h3 className="font-bold text-emerald-950 text-sm">
                      {excludedMemberIds.length > 0
                        ? `選択した${actualMembersCount}人が空いている日時まとめ`
                        : '全員空いている日時まとめ（直近60日）'}
                    </h3>
                  </div>
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold shrink-0">
                    {allAvailableSummary.length}日該当
                  </span>
                </div>

                {allAvailableSummary.length === 0 ? (
                  <p className="text-xs text-emerald-800 py-2 text-center">
                    直近60日間で対象メンバー全員が揃う枠（×が0人の枠）はまだありません。
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
                                  <span className="text-[9px] bg-amber-100 text-amber-800 px-1 py-0.5 rounded border border-amber-300">
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
                  <span><strong>◎</strong>：対象全員が完全OK</span>
                  <span><strong>〇</strong>：対象全員参加可（△含む）</span>
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
                <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-bold">◎ 全員参加</span> 対象全員が「〇」の枠</div>
                <div className="flex items-center gap-2"><span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 font-bold">〇 全員OK</span> 対象全員参加できるが「△」を含む</div>
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
            </>
          )}
        </div>
      );
    };

    const renderMemberCard = (m, isViewerCard = false) => {
      const isCreatorMember = activeGroup.createdBy
        ? activeGroup.createdBy === m.id
        : Array.isArray(activeGroup.members) && activeGroup.members[0] === m.id;
      const isMe = m.id === user.id;

      return (
        <div key={m.id} className={`bg-white p-4 rounded-2xl shadow-sm border flex items-start gap-4 ${
          isMe ? 'border-indigo-300 ring-1 ring-indigo-100' : 'border-gray-100'
        }`}>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl shadow-inner shrink-0 mt-0.5 ${
            isViewerCard ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-600'
          }`}>
            {m.displayName.substring(0, 1)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="font-bold text-gray-900 truncate">{m.displayName}</h4>
                  <span className="text-[10px] text-gray-400">@{m.username}</span>
                  {isMe && (
                    <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded-full font-bold">
                      あなた
                    </span>
                  )}
                  {isCreatorMember && (
                    <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold">
                      作成者
                    </span>
                  )}
                  {isViewerCard && (
                    <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      <Eye size={10} /> 閲覧者（予定反映なし）
                    </span>
                  )}
                </div>
                <div className="text-xs font-medium text-indigo-600 mt-0.5">
                  {formatYearWithGrade(m.year)}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {/* 自分自身のカードには「閲覧者に変更 / メンバーに戻る」ボタンを表示 */}
                {isMe && user.username !== 'Boss' && (
                  <button
                    type="button"
                    onClick={() => setShowRoleSwitchModal(true)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors ${
                      isViewerCard
                        ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700 shadow-xs'
                        : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {isViewerCard ? <Users size={11} /> : <Eye size={11} />}
                    <span>{isViewerCard ? 'メンバーに戻る' : '閲覧者に変更'}</span>
                  </button>
                )}

                {/* グループ作成者によるメンバー退出ボタン（自分以外） */}
                {isGroupCreator && !isMe && (
                  <button
                    type="button"
                    onClick={() => setMemberToRemove(m)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-[10px] font-bold transition-colors"
                    title="このメンバーをグループから退出させる"
                  >
                    <Trash2 size={12} />
                    <span>退出させる</span>
                  </button>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mt-2">
              {m.parts && m.parts.map(part => (
                <span key={part} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-medium">{part}</span>
              ))}
              {(!m.parts || m.parts.length === 0) && <span className="text-[10px] text-gray-400">パート未設定</span>}
            </div>

            <div className="mt-2.5 pt-2 border-t border-gray-100">
              <p className="text-[10px] font-bold text-gray-400 mb-1.5">所属バンド</p>
              {m.bands && m.bands.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {m.bands.map((band, bIdx) => (
                    <div 
                      key={band.id || bIdx} 
                      className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-[11px]"
                    >
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${getBandCategoryBadgeStyle(band.category)}`}>
                        {band.category}
                      </span>
                      <span className="font-bold text-gray-800">{band.name}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-gray-400">未登録</p>
              )}
            </div>
          </div>
        </div>
      );
    };

    const renderMemberList = () => {
      return (
        <div className="p-4 space-y-4">
          {/* 通常メンバー一覧 */}
          <div className="space-y-3">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-800 text-sm">バンドメンバー一覧 ({activePlayingMembers.length}人)</span>
              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                カレンダーに予定を反映
              </span>
            </div>
            {activePlayingMembers.length === 0 ? (
              <div className="p-6 text-center bg-white rounded-2xl border border-gray-100 text-xs text-gray-400">
                メンバーがいません
              </div>
            ) : (
              activePlayingMembers.map(m => renderMemberCard(m, false))
            )}
          </div>

          {/* 閲覧者一覧 */}
          <div className="space-y-3 pt-2">
            <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Eye size={16} className="text-amber-600" />
                <span className="font-bold text-gray-800 text-sm">閲覧者一覧 ({viewerMembers.length}人)</span>
              </div>
              <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full font-bold border border-amber-200">
                予定に影響しない閲覧専用
              </span>
            </div>
            {viewerMembers.length === 0 ? (
              <div className="p-4 text-center bg-white rounded-2xl border border-dashed border-gray-200 text-xs text-gray-400">
                現在、閲覧者として参加している人はいません
              </div>
            ) : (
              viewerMembers.map(m => renderMemberCard(m, true))
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white p-4 border-b shadow-sm space-y-3">
          <div className="flex items-center gap-3">
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
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 truncate">{activeGroup.name}</h2>
                    <button 
                      onClick={() => { setEditingGroupName(activeGroup.name); setIsEditingGroupName(true); }}
                      className="p-1 text-gray-400 hover:text-indigo-600 rounded-lg hover:bg-gray-100 shrink-0"
                      title="グループ名を変更"
                    >
                      <Edit2 size={16} />
                    </button>
                  </div>

                  {/* 右上アクションボタン：自分の退出 ＆ 作成者のグループ削除 */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {user.username !== 'Boss' && (
                      <button
                        type="button"
                        onClick={() => setShowLeaveGroupModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 rounded-xl text-[11px] font-bold transition-colors"
                        title="このグループから退出する"
                      >
                        <LogOut size={12} />
                        <span>グループ退出</span>
                      </button>
                    )}

                    {isGroupCreator && (
                      <button
                        type="button"
                        onClick={() => setShowDeleteGroupModal(true)}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded-xl text-[11px] font-bold transition-colors"
                        title="このバンドグループを削除"
                      >
                        <Trash2 size={12} />
                        <span>グループ削除</span>
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center flex-wrap gap-2 mt-1">
                <span className="text-xs text-gray-600 font-medium">
                  メンバー {activePlayingMembers.length}人
                  {viewerMembers.length > 0 && ` ・ 閲覧者 ${viewerMembers.length}人`}
                </span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  コード: <strong className="font-mono tracking-widest">{activeGroup.joinCode}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* グループに入った後でもいつでも「メンバー ⇄ 閲覧者」を切り替えられる専用バー */}
          {user.username !== 'Boss' && (
            <div className="bg-gray-50 p-2 rounded-2xl border border-gray-200 flex items-center justify-between gap-2">
              <div className="text-[11px] font-bold text-gray-700 pl-1">
                あなたの参加モード:
              </div>
              <div className="flex bg-white p-0.5 rounded-xl border border-gray-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => { if (amIViewer) setShowRoleSwitchModal(true); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    !amIViewer
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Users size={12} />
                  <span>メンバー (予定反映)</span>
                </button>
                <button
                  type="button"
                  onClick={() => { if (!amIViewer) setShowRoleSwitchModal(true); }}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all ${
                    amIViewer
                      ? 'bg-amber-500 text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <Eye size={12} />
                  <span>閲覧者 (見るだけ)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex p-2 bg-gray-100 mx-4 mt-4 rounded-xl overflow-x-auto hide-scrollbar gap-1">
            <button onClick={() => setGroupViewTab('calendar')} className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${groupViewTab === 'calendar' ? 'bg-white shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700'}`}>カレンダー</button>
            <button onClick={() => setGroupViewTab('list')} className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${groupViewTab === 'list' ? 'bg-white shadow text-emerald-600' : 'text-gray-500 hover:text-gray-700'}`}>空き日一覧</button>
            <button onClick={() => setGroupViewTab('members')} className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${groupViewTab === 'members' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>メンバー</button>
        </div>

        {/* カレンダーと空き日一覧の両方で上部固定の「メンバー絞り込み＆所属バンドパネル」を表示 */}
        {(groupViewTab === 'calendar' || groupViewTab === 'list') && renderStickyBandPanel()}

        {groupViewTab === 'calendar' && <>{renderGroupCalendar()}{renderGroupDayDetail()}</>}
        {groupViewTab === 'list' && renderAvailableList()}
        {groupViewTab === 'members' && renderMemberList()}

        {/* 1. バンドグループ削除の確認ポップアップ（ワンクッション） */}
        {showDeleteGroupModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <AlertTriangle size={22} className="shrink-0" />
                <h4 className="font-bold text-base text-gray-900">グループ削除の確認</h4>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
                バンドグループ「<strong>{activeGroup.name}</strong>」を本当に削除しますか？
              </p>
              <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl mb-5 border border-red-100">
                ※削除するとメンバー全員の画面からこのグループが消去され、元に戻すことはできません。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isDeletingGroup}
                  onClick={() => setShowDeleteGroupModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={isDeletingGroup}
                  onClick={handleConfirmDeleteGroup}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isDeletingGroup ? '削除中...' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. 自分自身がグループから退出する確認ポップアップ（ワンクッション） */}
        {showLeaveGroupModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-amber-600 mb-3">
                <AlertTriangle size={22} className="shrink-0" />
                <h4 className="font-bold text-base text-gray-900">グループ退出の確認</h4>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
                バンドグループ「<strong>{activeGroup.name}</strong>」から退出しますか？
              </p>
              <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl mb-5 border border-gray-200">
                ※退出しても、後から再度6桁の参加コードを入力すればいつでも再参加できます。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isLeavingGroup}
                  onClick={() => setShowLeaveGroupModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={isLeavingGroup}
                  onClick={handleConfirmLeaveGroup}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isLeavingGroup ? '退出中...' : '退出する'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 3. 作成者がメンバーを退出させる確認ポップアップ（ワンクッション） */}
        {memberToRemove && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-red-600 mb-3">
                <AlertTriangle size={22} className="shrink-0" />
                <h4 className="font-bold text-base text-gray-900">メンバー削除の確認</h4>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
                「<strong>{memberToRemove.displayName} (@{memberToRemove.username})</strong>」さんをこのグループから退出させますか？
              </p>
              <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl mb-5 border border-gray-200">
                ※グループから除外され、カレンダーの空き状況計算からも外れます。
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isRemovingMember}
                  onClick={() => setMemberToRemove(null)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={isRemovingMember}
                  onClick={handleConfirmRemoveMember}
                  className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {isRemovingMember ? '処理中...' : '退出させる'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 4. メンバー ⇄ 閲覧者モード切り替え確認ポップアップ */}
        {showRoleSwitchModal && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2 text-indigo-600 mb-3">
                {amIViewer ? <Users size={22} className="shrink-0" /> : <Eye size={22} className="shrink-0 text-amber-600" />}
                <h4 className="font-bold text-base text-gray-900">
                  {amIViewer ? 'メンバーに戻る確認' : '閲覧者への変更確認'}
                </h4>
              </div>
              <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
                このグループでの参加モードを「<strong>{amIViewer ? 'メンバー（予定を反映する）' : '閲覧者（見るだけ・予定を反映しない）'}</strong>」に変更しますか？
              </p>
              <p className="text-[11px] text-gray-500 bg-gray-50 p-2.5 rounded-xl mb-5 border border-gray-200">
                {amIViewer
                  ? '※メンバーに戻ると、あなたのマイ予定がグループのカレンダーや空き日計算に再び反映されます。'
                  : '※閲覧者に変更すると、あなたのマイ予定はグループのカレンダーや空き日計算から除外され、他のメンバーの予定だけを見ることができます（いつでもメンバーに戻れます）。'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={isSwitchingRole}
                  onClick={() => setShowRoleSwitchModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  disabled={isSwitchingRole}
                  onClick={handleConfirmSwitchMyRole}
                  className={`flex-1 py-2.5 text-white rounded-xl font-bold text-xs shadow-md transition-colors disabled:opacity-50 ${
                    amIViewer ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {isSwitchingRole ? '変更中...' : amIViewer ? 'メンバーに戻る' : '閲覧者に変更'}
                </button>
              </div>
            </div>
          </div>
        )}
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
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-indigo-100 animate-in fade-in zoom-in-95 space-y-3">
          <h3 className="text-sm font-bold text-gray-800">グループに参加</h3>
          <input
            type="text"
            placeholder="6桁の参加コードを入力"
            className="w-full border border-gray-300 p-3 rounded-xl text-sm font-mono uppercase focus:ring-2 focus:ring-indigo-500"
            maxLength={6}
            value={joinCode}
            onChange={e => setJoinCode(e.target.value)}
          />

          {/* 参加方法（メンバー or 閲覧者）の選択 */}
          <div>
            <span className="block text-[11px] font-bold text-gray-700 mb-1.5">参加方法を選択（参加後もいつでも変更できます）</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setJoinAsViewer(false)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  !joinAsViewer
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-1 ring-indigo-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Users size={13} className={!joinAsViewer ? 'text-indigo-600' : 'text-gray-400'} />
                  <span>メンバーとして参加</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">自分の予定をカレンダーに反映します</p>
              </button>

              <button
                type="button"
                onClick={() => setJoinAsViewer(true)}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  joinAsViewer
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-1 ring-amber-500'
                    : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <div className="font-bold text-xs flex items-center gap-1">
                  <Eye size={13} className={joinAsViewer ? 'text-amber-600' : 'text-gray-400'} />
                  <span>閲覧者として参加</span>
                </div>
                <p className="text-[10px] opacity-80 mt-0.5">予定に影響を与えず閲覧のみ行います</p>
              </button>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={handleJoinGroup} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-sm">
              {joinAsViewer ? '閲覧者として参加' : 'メンバーとして参加'}
            </button>
            <button onClick={() => setShowJoin(false)} className="px-4 bg-gray-100 text-gray-600 py-2.5 rounded-xl text-sm font-medium">
              キャンセル
            </button>
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">参加中のグループ</h3>
        {groups.length === 0 ? (
          <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-gray-200"><p className="text-gray-400 text-sm">グループに所属していません</p></div>
        ) : (
          <div className="space-y-3">
            {groups.map(group => {
              const viewerIds = group.viewers || [];
              const totalMembers = (group.members || []).filter(id => !viewerIds.includes(id)).length;
              const totalViewers = viewerIds.length;
              const isViewer = viewerIds.includes(user.id);

              return (
                <div key={group.id} onClick={() => setActiveGroup(group)} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between cursor-pointer hover:border-indigo-300 transition-all active:scale-[0.98]">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner shrink-0">{group.name.substring(0, 1)}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-gray-900 truncate">{group.name}</h4>
                        {isViewer ? (
                          <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                            <Eye size={10} /> 閲覧者モード
                          </span>
                        ) : (
                          <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                            メンバー
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        メンバー {totalMembers}人{totalViewers > 0 ? ` ・ 閲覧者 ${totalViewers}人` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="text-gray-300 shrink-0" size={20} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// --- ProfileView ---
function ProfileView({ user, setUser, setShowTutorial, handleLogout }) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState(user.displayName);
  const [nameError, setNameError] = useState('');

  // 入学年度変更用のステート
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [newYear, setNewYear] = useState(user.year || `${getCurrentAcademicYear()}年度`);

  // ログインID・パスワード表示＆変更用のステート
  const [showPasswordText, setShowPasswordText] = useState(true);
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username || '');
  const [newPassword, setNewPassword] = useState(user.password || '');
  const [credError, setCredError] = useState('');
  const [credSuccess, setCredSuccess] = useState('');
  const [isSavingCreds, setIsSavingCreds] = useState(false);

  // 所属バンド追加用のステート
  const [selectedBandCategory, setSelectedBandCategory] = useState(BAND_CATEGORIES[0]);
  const [newBandName, setNewBandName] = useState('');
  const [bandError, setBandError] = useState('');
  const [isUpdatingBands, setIsUpdatingBands] = useState(false);

  // 自身のアカウント削除確認モーダル用ステート
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const saveUserToLocalStorage = (updatedUser) => {
    const storedAuth = localStorage.getItem('wpb_bandsync_auth');
    if (storedAuth) {
      try {
        const parsed = JSON.parse(storedAuth);
        parsed.userData = updatedUser;
        localStorage.setItem('wpb_bandsync_auth', JSON.stringify(parsed));
      } catch (e) {
        console.warn("Storage update error", e);
      }
    }
  };

  const handleUpdateDisplayName = async () => {
    if (!newDisplayName.trim()) {
      setNameError('表示名を入力してください');
      return;
    }
    try {
      await updateDoc(doc(db, "users", user.id), { displayName: newDisplayName.trim() });
      const updatedUser = { ...user, displayName: newDisplayName.trim() };
      setUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
      setIsEditingName(false);
      setNameError('');
    } catch (e) {
      setNameError('更新に失敗しました: ' + e.message);
    }
  };

  const handleUpdateYear = async () => {
    try {
      await updateDoc(doc(db, "users", user.id), { year: newYear });
      const updatedUser = { ...user, year: newYear };
      setUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
      setIsEditingYear(false);
    } catch (e) {
      alert('入学年度の更新に失敗しました: ' + e.message);
    }
  };

  const handleUpdateCredentials = async (e) => {
    e.preventDefault();
    setCredError('');
    setCredSuccess('');

    const trimmedUsername = newUsername.trim();
    const trimmedPassword = newPassword.trim();

    if (!trimmedUsername || !trimmedPassword) {
      setCredError('ログインIDとパスワードを入力してください');
      return;
    }

    if (user.username === 'Boss' && trimmedUsername !== 'Boss') {
      setCredError('管理者アカウント(Boss)のログインIDは変更できません（パスワードは変更可能です）');
      return;
    }

    if (isSavingCreds) return;
    setIsSavingCreds(true);

    try {
      if (trimmedUsername !== user.username) {
        const q = query(collection(db, "users"), where("username", "==", trimmedUsername));
        const snap = await getDocs(q);
        const isTaken = snap.docs.some(d => d.id !== user.id);
        if (isTaken) {
          setCredError('このログインIDは既に他のユーザーに使用されています');
          setIsSavingCreds(false);
          return;
        }
      }

      await updateDoc(doc(db, "users", user.id), {
        username: trimmedUsername,
        password: trimmedPassword
      });

      const updatedUser = { ...user, username: trimmedUsername, password: trimmedPassword };
      setUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
      setIsEditingCredentials(false);
      setCredSuccess('ログインID・パスワードを更新しました');
    } catch (err) {
      setCredError('更新に失敗しました: ' + err.message);
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handleAddBand = async (e) => {
    e.preventDefault();
    setBandError('');
    if (!newBandName.trim()) {
      setBandError('バンド名を入力してください');
      return;
    }
    if (isUpdatingBands) return;
    setIsUpdatingBands(true);

    try {
      const currentBands = user.bands || [];
      const newBandItem = {
        id: 'band_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
        category: selectedBandCategory,
        name: newBandName.trim()
      };
      const updatedBands = [...currentBands, newBandItem];

      await updateDoc(doc(db, "users", user.id), { bands: updatedBands });
      const updatedUser = { ...user, bands: updatedBands };
      setUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
      setNewBandName('');
    } catch (err) {
      setBandError('バンドの追加に失敗しました: ' + err.message);
    } finally {
      setIsUpdatingBands(false);
    }
  };

  const handleDeleteBand = async (bandId) => {
    if (isUpdatingBands) return;
    setIsUpdatingBands(true);
    try {
      const currentBands = user.bands || [];
      const updatedBands = currentBands.filter(b => b.id !== bandId);

      await updateDoc(doc(db, "users", user.id), { bands: updatedBands });
      const updatedUser = { ...user, bands: updatedBands };
      setUser(updatedUser);
      saveUserToLocalStorage(updatedUser);
    } catch (err) {
      alert('削除に失敗しました: ' + err.message);
    } finally {
      setIsUpdatingBands(false);
    }
  };

  // 自分自身のアカウントを削除する処理
  const handleConfirmDeleteSelfAccount = async () => {
    if (isDeletingAccount) return;
    setIsDeletingAccount(true);
    try {
      const schedQ = query(collection(db, "schedules"), where("userId", "==", user.id));
      const schedSnap = await getDocs(schedQ);
      for (const sDoc of schedSnap.docs) {
        await deleteDoc(doc(db, "schedules", sDoc.id));
      }

      const groupQ = query(collection(db, "groups"), where("members", "array-contains", user.id));
      const groupSnap = await getDocs(groupQ);
      for (const gDoc of groupSnap.docs) {
        const gData = gDoc.data();
        const updatedMembers = (gData.members || []).filter(mId => mId !== user.id);
        const updatedViewers = (gData.viewers || []).filter(mId => mId !== user.id);
        await updateDoc(doc(db, "groups", gDoc.id), {
          members: updatedMembers,
          viewers: updatedViewers
        });
      }

      await deleteDoc(doc(db, "users", user.id));

      setShowDeleteAccountModal(false);
      handleLogout();
    } catch (err) {
      alert('アカウント削除中にエラーが発生しました: ' + err.message);
      setIsDeletingAccount(false);
    }
  };

  const userBands = user.bands || [];
  const yearOptions = getYearOptions();
  if (user.year && !yearOptions.includes(user.year)) {
    yearOptions.unshift(user.year);
  }

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

        {/* 入学年度（回生表示）と変更フォーム */}
        <div className="mt-5 flex flex-col items-center gap-2">
          {isEditingYear ? (
            <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-200">
              <select
                className="border border-gray-300 bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-gray-800 focus:ring-2 focus:ring-indigo-500"
                value={newYear}
                onChange={e => setNewYear(e.target.value)}
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>{formatYearWithGrade(y)}</option>
                ))}
              </select>
              <button
                onClick={handleUpdateYear}
                className="bg-indigo-600 text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm"
              >
                保存
              </button>
              <button
                onClick={() => { setIsEditingYear(false); setNewYear(user.year); }}
                className="bg-white border border-gray-200 text-gray-600 px-2.5 py-1.5 rounded-xl text-xs"
              >
                取消
              </button>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 bg-gray-100 text-gray-800 pl-3 pr-2 py-1 rounded-full text-xs font-bold border border-gray-200">
              <span>{formatYearWithGrade(user.year)}</span>
              <button
                onClick={() => { setNewYear(user.year || `${getCurrentAcademicYear()}年度`); setIsEditingYear(true); }}
                className="p-1 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-white transition-colors"
                title="入学年度を変更"
              >
                <Edit2 size={13} />
              </button>
            </div>
          )}

          {/* 担当パート */}
          <div className="flex justify-center gap-1.5 flex-wrap mt-1">
            {user.parts && user.parts.map(part => (
              <span key={part} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-bold border border-indigo-100">
                {part}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ログインID ＆ パスワードの表示・変更セクション */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <KeyRound size={18} className="text-indigo-600" />
            <h3 className="font-bold text-gray-800 text-sm">ログインID・パスワード</h3>
          </div>
          {!isEditingCredentials && (
            <button
              type="button"
              onClick={() => {
                setNewUsername(user.username || '');
                setNewPassword(user.password || '');
                setCredError('');
                setCredSuccess('');
                setIsEditingCredentials(true);
              }}
              className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-xl flex items-center gap-1 transition-colors"
            >
              <Edit2 size={12} /> 変更する
            </button>
          )}
        </div>

        {credSuccess && (
          <div className="p-2.5 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">
            {credSuccess}
          </div>
        )}

        {isEditingCredentials ? (
          <form onSubmit={handleUpdateCredentials} className="space-y-3 pt-1">
            {credError && <div className="p-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-xl">{credError}</div>}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">新しいログインID</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-xs">@</span>
                <input
                  type="text"
                  disabled={user.username === 'Boss'}
                  className="w-full border border-gray-300 pl-7 pr-3 py-2 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400"
                  value={newUsername}
                  onChange={e => setNewUsername(e.target.value)}
                  required
                />
              </div>
              {user.username === 'Boss' && (
                <p className="text-[10px] text-gray-400 mt-1">※管理者(Boss)のログインIDは固定されています</p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-gray-700 mb-1">新しいパスワード</label>
              <input
                type="text"
                className="w-full border border-gray-300 px-3 py-2 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-indigo-500"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="submit"
                disabled={isSavingCreds}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
              >
                保存する
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingCredentials(false);
                  setCredError('');
                }}
                className="px-4 bg-gray-100 text-gray-600 py-2 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-2 gap-2.5 bg-gray-50 p-3 rounded-2xl border border-gray-200 text-xs">
            <div>
              <span className="block text-[10px] text-gray-400 font-bold mb-0.5">現在のログインID</span>
              <span className="font-mono font-bold text-gray-900 text-sm break-all">@{user.username}</span>
            </div>
            <div>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[10px] text-gray-400 font-bold">現在のパスワード</span>
                <button
                  type="button"
                  onClick={() => setShowPasswordText(!showPasswordText)}
                  className="text-gray-400 hover:text-indigo-600 p-0.5"
                  title={showPasswordText ? 'パスワードを隠す' : 'パスワードを表示'}
                >
                  {showPasswordText ? <EyeOff size={13} /> : <Eye size={13} />}
                </button>
              </div>
              <span className="font-mono font-bold text-gray-900 text-sm break-all">
                {showPasswordText ? (user.password || '未設定') : '••••••••'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 所属バンド管理セクション */}
      <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <h3 className="font-bold text-gray-800 text-sm">所属バンド ({userBands.length})</h3>
          </div>
          <span className="text-[10px] text-gray-400">グループメンバーに公開されます</span>
        </div>

        {userBands.length === 0 ? (
          <div className="text-center py-4 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <p className="text-xs text-gray-400">所属しているバンドがまだ登録されていません</p>
          </div>
        ) : (
          <div className="space-y-2">
            {userBands.map((band) => (
              <div 
                key={band.id} 
                className="flex items-center justify-between p-2.5 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${getBandCategoryBadgeStyle(band.category)}`}>
                    {band.category}
                  </span>
                  <span className="text-sm font-bold text-gray-800 truncate">{band.name}</span>
                </div>
                <button
                  onClick={() => handleDeleteBand(band.id)}
                  disabled={isUpdatingBands}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  title="削除"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleAddBand} className="pt-3 border-t border-gray-100 space-y-3">
          <label className="block text-xs font-bold text-gray-700">新しい所属バンドを追加</label>
          {bandError && <p className="text-xs text-red-500">{bandError}</p>}
          
          <div>
            <span className="block text-[10px] font-medium text-gray-500 mb-1.5">1. バンド種別を選択</span>
            <div className="grid grid-cols-3 gap-1.5">
              {BAND_CATEGORIES.map(cat => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setSelectedBandCategory(cat)}
                  className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border transition-all ${
                    selectedBandCategory === cat
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-[10px] font-medium text-gray-500 mb-1.5">2. バンド名を入力して追加</span>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`${selectedBandCategory}の名前を入力`}
                className="flex-1 border border-gray-300 px-3 py-2 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500"
                value={newBandName}
                onChange={e => setNewBandName(e.target.value)}
              />
              <button
                type="submit"
                disabled={isUpdatingBands}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm hover:bg-indigo-700 transition-colors flex items-center gap-1 shrink-0 disabled:opacity-50"
              >
                <Plus size={14} /> 追加
              </button>
            </div>
          </div>
        </form>
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
           className="p-4 border-b border-gray-50 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
           onClick={handleLogout}
         >
            <span className="font-medium text-sm text-gray-700">ログアウト</span>
            <LogOut size={16} className="text-gray-500" />
         </div>

         {user.username !== 'Boss' && (
           <div 
             className="p-4 flex items-center justify-between bg-red-50/70 cursor-pointer hover:bg-red-100 transition-colors"
             onClick={() => setShowDeleteAccountModal(true)}
           >
              <span className="font-bold text-sm text-red-600">アカウントを削除する</span>
              <Trash2 size={16} className="text-red-500" />
           </div>
         )}
      </div>

      {/* 自分自身のアカウント削除確認モーダル（ワンクッション） */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle size={22} className="shrink-0" />
              <h4 className="font-bold text-base text-gray-900">アカウント削除の確認</h4>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
              あなたのアカウント「<strong>{user.displayName} (@{user.username})</strong>」を本当に削除しますか？
            </p>
            <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl mb-5 border border-red-100">
              ※登録した予定・プロフィール・グループ参加情報がすべて削除され、元に戻すことはできません。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteAccountModal(false)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={handleConfirmDeleteSelfAccount}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeletingAccount ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- AdminView ---
function AdminView() {
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // 名簿一覧・バンド一覧の折りたたみ用ステート
  const [isUserListOpen, setIsUserListOpen] = useState(true);
  const [isGroupListOpen, setIsGroupListOpen] = useState(true);

  // Boss用：ユーザー・グループ削除確認モーダル用ステート
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmAdminDelete = async () => {
    if (!deleteTarget || isDeleting) return;
    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'user') {
        const targetUserId = deleteTarget.id;
        const schedQ = query(collection(db, "schedules"), where("userId", "==", targetUserId));
        const schedSnap = await getDocs(schedQ);
        for (const sDoc of schedSnap.docs) {
          await deleteDoc(doc(db, "schedules", sDoc.id));
        }
        const updatedGroups = [];
        for (const g of groups) {
          if (Array.isArray(g.members) && g.members.includes(targetUserId)) {
            const newMembers = g.members.filter(mId => mId !== targetUserId);
            const newViewers = (g.viewers || []).filter(mId => mId !== targetUserId);
            await updateDoc(doc(db, "groups", g.id), { members: newMembers, viewers: newViewers });
            updatedGroups.push({ ...g, members: newMembers, viewers: newViewers });
          } else {
            updatedGroups.push(g);
          }
        }
        setGroups(updatedGroups);
        await deleteDoc(doc(db, "users", targetUserId));
        setUsers(users.filter(u => u.id !== targetUserId));
      } else if (deleteTarget.type === 'group') {
        await deleteDoc(doc(db, "groups", deleteTarget.id));
        setGroups(groups.filter(g => g.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
    } catch(e) {
      alert("削除に失敗しました: " + e.message);
    } finally {
      setIsDeleting(false);
    }
  };

  // ユーザーが参加しているバンドグループ一覧を取得
  const getUserJoinedGroups = (userId) => {
    return groups.filter(g => Array.isArray(g.members) && g.members.includes(userId));
  };

  // グループに参加しているメンバー一覧を取得（Bossを除く）
  const getGroupMemberUsers = (group) => {
    if (!Array.isArray(group.members)) return [];
    return users.filter(u => group.members.includes(u.id) && u.username !== 'Boss');
  };

  const filteredUsers = users.filter(u => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const joinedGroups = getUserJoinedGroups(u.id);
    const matchName = (u.displayName || '').toLowerCase().includes(q);
    const matchUsername = (u.username || '').toLowerCase().includes(q);
    const matchGroup = joinedGroups.some(g => (g.name || '').toLowerCase().includes(q));
    const matchProfileBand = (u.bands || []).some(b => (b.name || '').toLowerCase().includes(q));
    return matchName || matchUsername || matchGroup || matchProfileBand;
  });

  const filteredGroups = groups.filter(g => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    const memberUsers = getGroupMemberUsers(g);
    const matchGroupName = (g.name || '').toLowerCase().includes(q);
    const matchCode = (g.joinCode || '').toLowerCase().includes(q);
    const matchMember = memberUsers.some(
      m => (m.displayName || '').toLowerCase().includes(q) || (m.username || '').toLowerCase().includes(q)
    );
    return matchGroupName || matchCode || matchMember;
  });

  return (
    <div className="p-4 space-y-5">
      <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-start gap-3">
        <Shield className="text-red-500 shrink-0 mt-0.5" size={24} />
        <div>
          <h2 className="text-red-800 font-bold">管理者ダッシュボード</h2>
          <p className="text-xs text-red-600 mt-0.5">各見出しをタップして「名簿一覧」「バンド一覧」を折りたたむことができます</p>
        </div>
      </div>

      {/* 検索フィルタ */}
      <div>
        <input
          type="text"
          placeholder="名前・ログインID・バンドグループ名で検索..."
          className="w-full border border-gray-300 bg-white px-3.5 py-2.5 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 shadow-sm"
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
        />
      </div>

      {/* 折りたたみ可能：名簿一覧（全ユーザー一覧） */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsUserListOpen(!isUserListOpen)}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <User size={18} className="text-indigo-600" />
            <h3 className="text-sm font-bold text-gray-900">
              名簿一覧・全ユーザー ({filteredUsers.length} / {users.length}人)
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
            <span>{isUserListOpen ? '折りたたむ' : '開く'}</span>
            {isUserListOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {isUserListOpen && (
          <div className="p-3 space-y-3 border-t border-gray-100">
            {filteredUsers.map(u => {
              const joinedGroups = getUserJoinedGroups(u.id);
              const profileBands = u.bands || [];

              return (
                <div key={u.id} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-3 shadow-xs">
                  <div className="flex justify-between items-start gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-base text-gray-900">{u.displayName}</p>
                        <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                          {formatYearWithGrade(u.year)}
                        </span>
                      </div>
                      {u.parts && u.parts.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {u.parts.map(part => (
                            <span key={part} className="bg-gray-100 text-gray-600 text-[10px] px-1.5 py-0.5 rounded-md font-medium">
                              {part}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {u.username !== 'Boss' && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ type: 'user', id: u.id, name: `${u.displayName} (@${u.username})` })}
                        className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0"
                        title="ユーザーを削除"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  {/* ログインID ＆ パスワード表示ボックス */}
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold">ログインID</span>
                      <span className="font-mono font-bold text-gray-800 break-all">@{u.username}</span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-400 font-bold">パスワード</span>
                      <span className="font-mono font-bold text-gray-800 break-all">{u.password || '未設定'}</span>
                    </div>
                  </div>

                  {/* 参加しているバンドグループ一覧（グループ機能） */}
                  <div className="pt-1">
                    <span className="block text-[10px] font-bold text-gray-500 mb-1.5">
                      参加中のバンドグループ ({joinedGroups.length})
                    </span>
                    {joinedGroups.length === 0 ? (
                      <p className="text-[11px] text-gray-400">参加しているグループはありません</p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {joinedGroups.map(g => {
                          const isViewer = Array.isArray(g.viewers) && g.viewers.includes(u.id);
                          return (
                            <span
                              key={g.id}
                              className={`inline-flex items-center gap-1 border px-2.5 py-1 rounded-lg text-[11px] font-bold ${
                                isViewer
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              }`}
                            >
                              {isViewer ? <Eye size={12} className="shrink-0 text-amber-600" /> : <Users size={12} className="shrink-0 text-indigo-600" />}
                              <span>{g.name}</span>
                              {isViewer && <span className="text-[9px] bg-white px-1 rounded border border-amber-200">閲覧者</span>}
                              <span className="text-[9px] font-mono opacity-75 ml-0.5">({g.joinCode})</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* マイページで登録している所属バンド一覧 */}
                  {profileBands.length > 0 && (
                    <div className="pt-2 border-t border-gray-100">
                      <span className="block text-[10px] font-bold text-gray-400 mb-1.5">
                        プロフィール登録バンド ({profileBands.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {profileBands.map((band, bIdx) => (
                          <div
                            key={band.id || bIdx}
                            className="inline-flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 py-0.5 text-[10px]"
                          >
                            <span className={`text-[9px] font-bold px-1 py-0.5 rounded border ${getBandCategoryBadgeStyle(band.category)}`}>
                              {band.category}
                            </span>
                            <span className="font-bold text-gray-700">{band.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 折りたたみ可能：バンド一覧（全グループ一覧） */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setIsGroupListOpen(!isGroupListOpen)}
          className="w-full p-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors text-left"
        >
          <div className="flex items-center gap-2">
            <Users size={18} className="text-emerald-600" />
            <h3 className="text-sm font-bold text-gray-900">
              バンド一覧・全グループ ({filteredGroups.length} / {groups.length}グループ)
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-gray-500">
            <span>{isGroupListOpen ? '折りたたむ' : '開く'}</span>
            {isGroupListOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {isGroupListOpen && (
          <div className="p-3 space-y-3 border-t border-gray-100">
            {filteredGroups.map(g => {
              const allParticipants = getGroupMemberUsers(g);
              const viewerIds = g.viewers || [];
              const playingMembers = allParticipants.filter(m => !viewerIds.includes(m.id));
              const viewingMembers = allParticipants.filter(m => viewerIds.includes(m.id));

              return (
                <div key={g.id} className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2.5 shadow-xs">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm text-gray-900">{g.name}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        参加コード: <strong className="font-mono text-gray-800">{g.joinCode}</strong> ・ メンバー {playingMembers.length}人
                        {viewingMembers.length > 0 && ` ・ 閲覧者 ${viewingMembers.length}人`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'group', id: g.id, name: g.name })}
                      className="text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors shrink-0"
                      title="グループを削除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* グループ所属メンバーの名前一覧 */}
                  <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 space-y-2">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 mb-1">メンバー ({playingMembers.length}人)</span>
                      {playingMembers.length === 0 ? (
                        <p className="text-[11px] text-gray-400">メンバーがいません</p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {playingMembers.map(m => (
                            <span
                              key={m.id}
                              className="bg-white border border-gray-200 text-gray-800 text-[11px] font-bold px-2 py-0.5 rounded-lg"
                            >
                              {m.displayName} <span className="text-[9px] font-normal text-gray-400">(@{m.username})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {viewingMembers.length > 0 && (
                      <div className="pt-1.5 border-t border-gray-200/70">
                        <span className="block text-[10px] font-bold text-gray-400 mb-1">閲覧者 ({viewingMembers.length}人)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {viewingMembers.map(m => (
                            <span
                              key={m.id}
                              className="bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-lg inline-flex items-center gap-1"
                            >
                              <Eye size={10} />
                              {m.displayName} <span className="text-[9px] font-normal text-amber-600">(@{m.username})</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Boss用：ユーザー／グループ削除の確認ポップアップ（ワンクッション） */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2 text-red-600 mb-3">
              <AlertTriangle size={22} className="shrink-0" />
              <h4 className="font-bold text-base text-gray-900">
                {deleteTarget.type === 'user' ? 'アカウント削除の確認' : 'グループ削除の確認'}
              </h4>
            </div>
            <p className="text-xs text-gray-700 leading-relaxed font-medium mb-2">
              {deleteTarget.type === 'user'
                ? `ユーザー「${deleteTarget.name}」を本当に削除しますか？`
                : `バンドグループ「${deleteTarget.name}」を本当に削除しますか？`}
            </p>
            <p className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl mb-5 border border-red-100">
              ※この操作は取り消せません。関連するデータも削除されます。
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-bold text-xs hover:bg-gray-200 transition-colors"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmAdminDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? '削除中...' : '削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
