import React, { useState } from 'react';
import { BookOpen, CheckCircle, ShieldAlert, Sparkles, HelpCircle, Laptop } from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [lang, setLang] = useState<'bn' | 'en'>('bn');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-8">
        {/* Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {lang === 'bn' ? 'অ্যাডভাইজিং বট ব্যবহারের পূর্ণাঙ্গ গাইডলাইন' : 'Advising Bot Complete User Manual'}
              </h2>
              <p className="text-xs text-slate-400">
                BRAC University Connect Portal (Self-Registration, Phase 1 &amp; Phase 2)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  lang === 'bn' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                বাংলা
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 rounded font-bold transition-all ${
                  lang === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                English
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 text-xs text-slate-300 max-h-[70vh] overflow-y-auto space-y-6 leading-relaxed">
          {lang === 'bn' ? (
            <>
              {/* Bangla Guide */}
              <div className="bg-blue-950/20 border border-blue-500/30 p-4 rounded-2xl space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  ১. এই বট কীভাবে কাজ করে? (How it works)
                </h4>
                <p className="text-slate-300">
                  ব্র্যাক ইউনিভার্সিটির নতুন ইউসিস কানেক্ট পোর্টালে (connect.bracu.ac.bd) অ্যাডভাইজিংয়ের সময় সার্ভার প্রচুর জ্যাম থাকে এবং কয়েক সেকেন্ডের ব্যবধানে পছন্দের সেকশনের সীট শেষ হয়ে যায়। এই বটটি স্বয়ংক্রিয়ভাবে:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                  <li>কোর্স ও সেকশন দুটোতেই আনলিমিটেড চয়েস: যতগুলো ইচ্ছা কোর্স ক্রমানুসারে (Serial by serial) সাজিয়ে রাখতে পারবেন।</li>
                  <li>প্রতিটি কোর্সে ১ নম্বর থেকে যতগুলো ইচ্ছা ব্যাকআপ সেকশন চয়েস সিরিয়াল বাই সিরিয়াল প্রায়োরিটি হিসেবে যুক্ত করতে পারবেন।</li>
                  <li>
                    যেমন: <strong className="text-white">CSE230-[05](0)-AVB</strong> তে যদি সীট <span className="text-amber-400 font-bold">0</span> থাকে, বট তৎক্ষণাৎ ২য় চয়েস <strong className="text-white">CSE230-[04](2)-TSM</strong> খুঁজবে এবং চোখের পলকে সবুজ <span className="text-emerald-400 font-bold">[+]</span> বাটনে ক্লিক করে স্লট লক করে ফেলবে!
                  </li>
                  <li>ল্যাব কোর্স থাকলে (যেমন CSE111 এর সাথে CSE111L) অটোমেটিক ল্যাব সেকশনও অ্যাড করে নিবে।</li>
                </ul>
              </div>

              {/* Steps for 3 phases */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-sm">
                  ২. কোন কোন ফেইজে চালানো যাবে?
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-blue-400 block font-semibold mb-1">Pre-Reg Phase One</strong>
                    <span className="text-slate-400 text-[11px]">/student/advising/phase-one ইউআরএলে রোবট স্বয়ংক্রিয়ভাবে একটিভ হবে।</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-indigo-400 block font-semibold mb-1">Pre-Reg Phase Two</strong>
                    <span className="text-slate-400 text-[11px]">/student/advising/phase-two পেজে সেকশন শিফটিং বা কারেকশনে কাজ করবে।</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                    <strong className="text-emerald-400 block font-semibold mb-1">Self Registration</strong>
                    <span className="text-slate-400 text-[11px]">/student/advising/self-registration ফাইনাল অ্যাডভাইজিং এবং স্লট লক নিশ্চিত করবে।</span>
                  </div>
                </div>
              </div>

              {/* Setup methods */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">
                  ৩. কীভাবে ইনস্টল ও চালাবেন? (২টি সহজ উপায়)
                </h4>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <strong className="text-emerald-400 text-xs flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4" />
                    উপায় ১: Chrome Extension হিসেবে (সবচেয়ে রিকমেন্ডেড)
                  </strong>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-2">
                    <li>উপরের <strong className="text-white">&quot;Download Chrome Extension (.ZIP)&quot;</strong> বাটনে ক্লিক করে ফাইলটি ডাউনলোড করুন এবং আনজিপ (Extract) করুন।</li>
                    <li>ব্রাউজারে <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">chrome://extensions</code> এ যান এবং উপরে ডানে <strong className="text-white">Developer mode</strong> অন করুন।</li>
                    <li>বামে <strong className="text-white">Load unpacked</strong> এ ক্লিক করে আনজিপ করা ফোল্ডারটি সিলেক্ট করুন।</li>
                    <li>এখন connect.bracu.ac.bd তে লগইন করে অ্যাডভাইজিং পেজে ঢুকলেই নিচে ডানে রোবটের কন্ট্রোল প্যানেল দেখতে পাবেন!</li>
                  </ol>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <strong className="text-purple-400 text-xs flex items-center gap-1.5">
                    <Laptop className="w-4 h-4" />
                    উপায় ২: এক্সটেনশন ছাড়া সরাসরি ব্রাউজার কনসোল দিয়ে (DevTools Console)
                  </strong>
                  <ol className="list-decimal list-inside space-y-1 text-slate-400 pl-2">
                    <li>ব্রাউজারে <strong className="text-white">connect.bracu.ac.bd</strong> ওপেন করে লগইন করুন।</li>
                    <li>কীবোর্ডে <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">F12</code> অথবা <code className="bg-slate-800 px-1 py-0.5 rounded text-blue-300">Ctrl + Shift + J</code> চাপুন।</li>
                    <li><strong className="text-white">Console</strong> ট্যাবে গিয়ে আমাদের অ্যাপ থেকে কপি করা কোডটি পেস্ট করে <strong className="text-white">Enter</strong> চাপুন। তৎক্ষণাৎ বট চালু হয়ে যাবে!</li>
                  </ol>
                </div>
              </div>

              {/* Safety warning */}
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-2xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <strong className="text-amber-300 block text-xs">জরুরি টিপস ও সতর্কতা (Advising Rush Tips):</strong>
                  <p className="text-slate-400 text-[11px]">
                    ১. অ্যাডভাইজিং শুরুর অন্তত ৫ মিনিট আগে পোর্টালে লগইন করে পেজ রেডি রাখুন যাতে সেশন টাইমআউট না হয়।<br />
                    ২. পোলিং স্পিড ৪০০ms থেকে ৬০০ms রাখলে ব্র্যাকইউ সার্ভারে রিকোয়েস্ট ব্লক হওয়ার কোনো ঝুঁকি থাকে না।<br />
                    ৩. রোবট সমস্ত কোর্স লক করার পর নিজের চোখে রুটিনটি একবার যাচাই করে নিন।
                  </p>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* English Guide */}
              <div className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">How Priority Fallback Works</h4>
                  <p className="text-slate-300">
                    The bot reads the live AG-Grid in BRACU Connect. For each planned course, it scans your prioritized choices in order (1st, 2nd, 3rd, 4th... unlimited fallback chain):
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-slate-400 pl-2">
                    <li>If Choice #1 has &gt;0 seats, it immediately triggers the green [+] add button.</li>
                    <li>If Choice #1 has 0 seats, it automatically jumps to Choice #2 without refreshing the page.</li>
                    <li>If co-requisite labs exist (e.g. CSE111 + CSE111L), it auto-locks the lab section simultaneously.</li>
                  </ul>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                  <h4 className="font-bold text-white text-sm">Target URL Matching</h4>
                  <p className="text-slate-400">
                    The extension and userscript are configured to automatically wake up on all BRACU advising routes:
                  </p>
                  <div className="font-mono text-[11px] bg-slate-900 p-3 rounded-xl border border-slate-800 text-blue-300 space-y-1">
                    <div>https://connect.bracu.ac.bd/student/advising/self-registration</div>
                    <div>https://connect.bracu.ac.bd/student/advising/phase-one</div>
                    <div>https://connect.bracu.ac.bd/student/advising/phase-two</div>
                    <div>https://connect.bracu.ac.bd/student/advising/wish-list</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs transition-all"
          >
            {lang === 'bn' ? 'বুঝতে পেরেছি' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
};
