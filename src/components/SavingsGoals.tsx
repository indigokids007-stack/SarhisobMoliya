import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  PiggyBank, 
  Calendar, 
  Check, 
  Clock, 
  ShieldCheck, 
  Laptop, 
  Plane,
  X,
  PlusCircle,
  AlertCircle
} from 'lucide-react';
import { SavingsGoal, RecurringBill } from '../types';
import { formatUZS, formatShortUZS, formatDateUz } from '../utils/formatters';

interface SavingsGoalsProps {
  goals: SavingsGoal[];
  recurringBills: RecurringBill[];
  onAddDepositToGoal: (goalId: string, amount: number) => void;
  onAddNewGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  onToggleBillPaid: (billId: string) => void;
  onAddNewBill: (bill: Omit<RecurringBill, 'id'>) => void;
}

export const SavingsGoals: React.FC<SavingsGoalsProps> = ({
  goals,
  recurringBills,
  onAddDepositToGoal,
  onAddNewGoal,
  onToggleBillPaid,
  onAddNewBill,
}) => {
  // Deposit modal state
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState<SavingsGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // New Goal modal state
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTargetAmount, setNewGoalTargetAmount] = useState('');
  const [newGoalInitialAmount, setNewGoalInitialAmount] = useState('');
  const [newGoalDate, setNewGoalDate] = useState('2026-12-31');
  const [newGoalCategory, setNewGoalCategory] = useState('Zaxira');

  // New Bill modal state
  const [isAddBillModalOpen, setIsAddBillModalOpen] = useState(false);
  const [newBillTitle, setNewBillTitle] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDay, setNewBillDueDay] = useState(1);
  const [newBillCategory, setNewBillCategory] = useState('Kommunal va Uy');

  const handleDepositSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGoalForDeposit) return;
    const amount = parseFloat(depositAmount.replace(/[\s,]/g, ''));
    if (!amount || amount <= 0) return;

    onAddDepositToGoal(selectedGoalForDeposit.id, amount);
    setSelectedGoalForDeposit(null);
    setDepositAmount('');
  };

  const handleCreateGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(newGoalTargetAmount.replace(/[\s,]/g, ''));
    const initial = parseFloat(newGoalInitialAmount.replace(/[\s,]/g, '')) || 0;
    if (!newGoalTitle || !target) return;

    onAddNewGoal({
      title: newGoalTitle,
      targetAmount: target,
      currentAmount: initial,
      targetDate: newGoalDate,
      category: newGoalCategory,
      color: 'emerald',
      icon: 'Target',
    });

    setIsAddGoalModalOpen(false);
    setNewGoalTitle('');
    setNewGoalTargetAmount('');
    setNewGoalInitialAmount('');
  };

  const handleCreateBillSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newBillAmount.replace(/[\s,]/g, ''));
    if (!newBillTitle || !amount) return;

    onAddNewBill({
      title: newBillTitle,
      amount,
      dueDay: newBillDueDay,
      category: newBillCategory,
      frequency: 'Oylik',
      isPaidThisMonth: false,
    });

    setIsAddBillModalOpen(false);
    setNewBillTitle('');
    setNewBillAmount('');
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalSaved = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalGoalPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;

  const totalMonthlyBills = recurringBills.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="space-y-8">
      {/* Top Banner: Total Goal Progress */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <PiggyBank className="w-5 h-5 text-emerald-400" />
              <span>Jamg‘arma Maqsadlari & Doimiy To‘lovlar</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Katta orzular va favqulodda xavfsizlik yostig'ini shakllantiring
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddBillModalOpen(true)}
              className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700"
            >
              + Doimiy To‘lov
            </button>
            <button
              onClick={() => setIsAddGoalModalOpen(true)}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Maqsad</span>
            </button>
          </div>
        </div>

        {/* Global progress */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="text-slate-300">Barcha maqsadlar bo‘yicha umumiy jamg‘arma:</span>
            <span className="text-emerald-400 font-bold">
              {formatUZS(totalSaved)} / {formatUZS(totalTarget)} ({totalGoalPercent}%)
            </span>
          </div>
          <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalGoalPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* SECTION 1: Jamg'arma Maqsadlari */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Target className="w-4 h-4 text-emerald-400" />
          <span>Faol Jamg‘arma Maqsadlari</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map((goal) => {
            const percent = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
            const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

            return (
              <div
                key={goal.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-colors space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-900">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">{goal.title}</h4>
                        <span className="text-[11px] text-slate-400">{goal.category}</span>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-emerald-400">
                      {percent}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1 mt-3">
                    <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 pt-1">
                      <span>Jamg‘arildi: <strong className="text-white">{formatShortUZS(goal.currentAmount)}</strong></span>
                      <span>Maqsad: <strong className="text-slate-300">{formatShortUZS(goal.targetAmount)}</strong></span>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>Qoldi:</span>
                      <span className="text-amber-400 font-semibold">{formatUZS(remaining)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Muddati:</span>
                      <span className="text-slate-300">{formatDateUz(goal.targetDate)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedGoalForDeposit(goal)}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold text-xs rounded-xl transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Mablag‘ qo‘shish</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Doimiy Majburiyatlar & Obunalar */}
      <div className="space-y-4 pt-4 border-t border-slate-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Doimiy Oylik Majburiyatlar & Obunalar</span>
            </h3>
            <p className="text-xs text-slate-400">
              Jami oylik majburiy to‘lovlar: <strong className="text-white">{formatUZS(totalMonthlyBills)}</strong>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recurringBills.map((bill) => (
            <div
              key={bill.id}
              className={`p-4 rounded-2xl border transition-all ${
                bill.isPaidThisMonth
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300'
                  : 'bg-slate-900/90 border-amber-900/50 text-white shadow-sm'
              }`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h4 className="text-xs sm:text-sm font-bold truncate">{bill.title}</h4>
                <span className="text-[10px] text-slate-400 shrink-0">Har {bill.dueDay}-sana</span>
              </div>

              <div className="text-base font-bold text-white mb-3">
                {formatUZS(bill.amount)}
              </div>

              <button
                onClick={() => onToggleBillPaid(bill.id)}
                className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  bill.isPaidThisMonth
                    ? 'bg-slate-800 text-emerald-400 hover:bg-slate-750'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {bill.isPaidThisMonth ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>To‘landi</span>
                  </>
                ) : (
                  <span>To‘langan deb belgilash</span>
                )}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Deposit to Goal Modal */}
      {selectedGoalForDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 text-white animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-bold">Jamg‘armaga mablag‘ qo‘shish</h4>
              <button onClick={() => setSelectedGoalForDeposit(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              Maqsad: <strong className="text-emerald-400">{selectedGoalForDeposit.title}</strong>
            </p>
            <form onSubmit={handleDepositSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Qo‘shiladigan summa (so‘m):
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="Masalan: 500000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl transition-colors"
              >
                Qo‘shish
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {isAddGoalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 text-white animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-bold">Yangi Jamg‘arma Maqsadi</h4>
              <button onClick={() => setIsAddGoalModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoalSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Maqsad nomi:</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="Masalan: Yangi noutbuk, Umra safari, Avtomobil..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kerakli summa (so‘m):</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="1000"
                    value={newGoalTargetAmount}
                    onChange={(e) => setNewGoalTargetAmount(e.target.value)}
                    placeholder="25000000"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Boshlang‘ich mablag‘:</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newGoalInitialAmount}
                    onChange={(e) => setNewGoalInitialAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Erishish muddati:</label>
                  <input
                    type="date"
                    required
                    value={newGoalDate}
                    onChange={(e) => setNewGoalDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Toifa:</label>
                  <select
                    value={newGoalCategory}
                    onChange={(e) => setNewGoalCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Zaxira">Xavfsizlik yostig'i</option>
                    <option value="Texnika">Texnika & Gadjetlar</option>
                    <option value="Sayohat">Sayohat & Ta'til</option>
                    <option value="Uy & Ta'mirlash">Uy & Ta'mirlash</option>
                    <option value="Boshqa">Boshqa maqsad</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                Maqsadni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Add New Bill Modal */}
      {isAddBillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-6 text-white animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-base font-bold">Yangi Doimiy To‘lov</h4>
              <button onClick={() => setIsAddBillModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateBillSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">To‘lov nomi:</label>
                <input
                  type="text"
                  required
                  value={newBillTitle}
                  onChange={(e) => setNewBillTitle(e.target.value)}
                  placeholder="Masalan: Uy interneti, Sport zal, Ijara"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Oylik miqdori (so‘m):</label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="1000"
                  value={newBillAmount}
                  onChange={(e) => setNewBillAmount(e.target.value)}
                  placeholder="250000"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Har oyning qaysi sanasida (1-31):</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="31"
                  value={newBillDueDay}
                  onChange={(e) => setNewBillDueDay(parseInt(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
              >
                To‘lovni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
