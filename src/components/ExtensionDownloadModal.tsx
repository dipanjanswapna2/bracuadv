import React, { useState } from 'react';
import { CoursePlan, BotSettings } from '../types/advising';
import {
  createExtensionZip,
  generateTampermonkeyUserscript,
  generateBookmarklet,
  generateContentScript,
  generateManifestJson,
} from '../utils/extensionGenerator';
import {
  Download,
  Copy,
  Check,
  Code,
  FileCode,
  Bookmark,
  ExternalLink,
  Laptop,
  CheckCircle,
} from 'lucide-react';

interface ExtensionDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  courses: CoursePlan[];
  settings: BotSettings;
}

export const ExtensionDownloadModal: React.FC<ExtensionDownloadModalProps> = ({
  isOpen,
  onClose,
  courses,
  settings,
}) => {
  const [activeTab, setActiveTab] = useState<'zip' | 'tampermonkey' | 'console' | 'source'>('zip');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const handleDownloadZip = async () => {
    try {
      setDownloading(true);
      const zipBlob = await createExtensionZip(courses, settings);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bracu-connect-advising-extension-${settings.targetPhase}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error creating extension zip. Please try copying the Userscript or Console code.');
    } finally {
      setDownloading(false);
    }
  };

  const userscriptCode = generateTampermonkeyUserscript(courses, settings);
  const bookmarkletCode = generateBookmarklet(courses, settings);
  const consoleSnippetCode = generateContentScript(courses, settings);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl my-8">
        {/* Modal Header */}
        <div className="p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 p-0.5">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Download className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">BRACU Advising Extension Suite</h2>
              <p className="text-xs text-slate-400">
                Generated with your exact {courses.length} courses &amp; custom fallback priority choices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-6 gap-2 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('zip')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'zip'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-4 h-4" />
            <span>Chrome Extension (.ZIP)</span>
          </button>
          <button
            onClick={() => setActiveTab('tampermonkey')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tampermonkey'
                ? 'border-blue-400 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Tampermonkey / Userscript</span>
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'console'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Laptop className="w-4 h-4" />
            <span>DevTools Console / Bookmarklet</span>
          </button>
          <button
            onClick={() => setActiveTab('source')}
            className={`py-3 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'source'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileCode className="w-4 h-4" />
            <span>Manifest V3 Source</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 text-xs text-slate-300 max-h-[70vh] overflow-y-auto space-y-5">
          {/* TAB 1: Chrome Extension ZIP */}
          {activeTab === 'zip' && (
            <div className="space-y-4">
              <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Complete Unpacked Chrome Extension (.ZIP)
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Includes Manifest V3, Content Script, Floating Robot HUD, and Popup controller.
                  </p>
                </div>
                <button
                  onClick={handleDownloadZip}
                  disabled={downloading}
                  className="w-full sm:w-auto px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloading ? 'Building ZIP...' : 'Download Extension (.ZIP)'}</span>
                </button>
              </div>

              {/* Install guide steps */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider">
                  How to Install in 3 Easy Steps (Chrome / Brave / Edge):
                </h5>
                <ol className="list-decimal list-inside space-y-2 text-slate-400 leading-relaxed">
                  <li>
                    Download the <strong className="text-white">.ZIP file</strong> above and{' '}
                    <strong className="text-white">extract it</strong> into a folder on your PC.
                  </li>
                  <li>
                    In your browser, open{' '}
                    <code className="bg-slate-800 text-blue-300 px-1.5 py-0.5 rounded font-mono">
                      chrome://extensions
                    </code>{' '}
                    and toggle <strong className="text-emerald-400">&quot;Developer mode&quot;</strong> in the top
                    right.
                  </li>
                  <li>
                    Click <strong className="text-white">&quot;Load unpacked&quot;</strong> in the top left and select
                    the extracted folder!
                  </li>
                </ol>
                <div className="pt-2 text-slate-400 border-t border-slate-800/80">
                  🎉 Navigate to{' '}
                  <a
                    href="https://connect.bracu.ac.bd/student/advising/self-registration"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-400 underline font-mono inline-flex items-center gap-1"
                  >
                    https://connect.bracu.ac.bd/student/advising/self-registration{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  . The Auto Advising Robot HUD will pop up on the bottom right automatically!
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Tampermonkey Userscript */}
          {activeTab === 'tampermonkey' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-sm">Tampermonkey / Violentmonkey Script</h4>
                  <p className="text-xs text-slate-400">
                    Run instantly without developer mode! Just copy this script into Tampermonkey.
                  </p>
                </div>
                <button
                  onClick={() => handleCopy(userscriptCode, 'userscript')}
                  className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm shrink-0"
                >
                  {copiedKey === 'userscript' ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Copied Script!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Full Script</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-72 overflow-y-auto leading-relaxed select-all">
                  {userscriptCode}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 3: DevTools Console / Bookmarklet */}
          {activeTab === 'console' && (
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-white text-sm">
                  Run Directly via Chrome DevTools Console (No install needed!)
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  1. Log in to <strong className="text-white">connect.bracu.ac.bd</strong>.<br />
                  2. Press <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded">F12</code> or{' '}
                  <code className="bg-slate-800 text-blue-300 px-1 py-0.5 rounded">Ctrl + Shift + J</code> to open
                  Console.<br />
                  3. Paste the code below and press <strong className="text-white">Enter</strong>!
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => handleCopy(consoleSnippetCode, 'console')}
                  className="px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
                >
                  {copiedKey === 'console' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Copied Console Code!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copy Console Code</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 max-h-72 overflow-y-auto leading-relaxed select-all">
                {consoleSnippetCode}
              </pre>
            </div>
          )}

          {/* TAB 4: Source Inspection */}
          {activeTab === 'source' && (
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm">manifest.json (Manifest V3)</h4>
              <pre className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                {generateManifestJson()}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-mono">Target: connect.bracu.ac.bd</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
