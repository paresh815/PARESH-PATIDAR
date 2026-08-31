import React, { useState } from 'react';
import { Lock, Unlock, KeyRound, ShieldAlert, Check } from 'lucide-react';
import { dbService } from '../services/dbSimulator';

interface AdminPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  subtitle?: string;
}

export const AdminPinModal: React.FC<AdminPinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Admin Security Verification',
  subtitle = 'Enter your 4-digit Master PIN to manage settings (Default PIN: 1234)',
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinChangeSuccess, setPinChangeSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const currentPin = dbService.getAdminPin();
    if (pin === currentPin) {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setError('Incorrect Admin PIN. Default is 1234');
      setPin('');
    }
  };

  const handlePinPadClick = (num: string) => {
    if (pin.length < 6) {
      const next = pin + num;
      setPin(next);
      setError(null);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(null);
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      setError('New PIN must be at least 4 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('New PIN and Confirm PIN do not match');
      return;
    }
    dbService.setAdminPin(newPin);
    setPinChangeSuccess(true);
    setTimeout(() => {
      setPinChangeSuccess(false);
      setIsChangingPin(false);
      setNewPin('');
      setConfirmPin('');
      setError(null);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-sky-500/20 text-sky-400 rounded-xl border border-sky-500/30">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-lg">{title}</h3>
              <p className="text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
        </div>

        {!isChangingPin ? (
          <div>
            <form onSubmit={handleVerify}>
              {/* PIN Display Dots */}
              <div className="my-6 flex justify-center items-center gap-3">
                {[0, 1, 2, 3].map(idx => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full border transition-all duration-200 ${
                      pin.length > idx
                        ? 'bg-sky-400 border-sky-400 scale-110 shadow-sm shadow-sky-400/50'
                        : 'border-slate-600 bg-slate-800'
                    }`}
                  />
                ))}
              </div>

              {error && (
                <div className="mb-4 p-2.5 bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-lg flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Number Pad */}
              <div className="grid grid-cols-3 gap-2.5 mb-5">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map(item => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      if (item === 'C') setPin('');
                      else if (item === '⌫') handleBackspace();
                      else handlePinPadClick(item);
                    }}
                    className={`h-12 rounded-xl text-lg font-semibold transition-all duration-150 active:scale-95 flex items-center justify-center ${
                      item === 'C' || item === '⌫'
                        ? 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        : 'bg-slate-800 text-slate-100 hover:bg-slate-700 hover:text-sky-400'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pin.length < 4}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold bg-sky-500 hover:bg-sky-400 text-slate-950 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-lg shadow-sky-500/20"
                >
                  Unlock
                </button>
              </div>
            </form>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center text-xs">
              <span className="text-slate-500">Demo PIN: <strong className="text-slate-400 font-mono">1234</strong></span>
              <button
                type="button"
                onClick={() => setIsChangingPin(true)}
                className="text-sky-400 hover:underline flex items-center gap-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                Change PIN
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSaveNewPin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">New 4-Digit PIN</label>
              <input
                type="password"
                maxLength={6}
                value={newPin}
                onChange={e => setNewPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 4-6 digits"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-center text-lg tracking-widest focus:outline-none focus:border-sky-400"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Confirm New PIN</label>
              <input
                type="password"
                maxLength={6}
                value={confirmPin}
                onChange={e => setConfirmPin(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Re-enter PIN"
                className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-100 font-mono text-center text-lg tracking-widest focus:outline-none focus:border-sky-400"
                required
              />
            </div>

            {error && (
              <p className="text-xs text-rose-400">{error}</p>
            )}

            {pinChangeSuccess && (
              <div className="p-2.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-xs flex items-center gap-2">
                <Check className="w-4 h-4" />
                <span>Admin PIN updated successfully!</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsChangingPin(false);
                  setError(null);
                }}
                className="flex-1 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 rounded-lg text-xs font-bold"
              >
                Save PIN
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
