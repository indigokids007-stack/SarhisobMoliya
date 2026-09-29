import React, { useState } from 'react';
import { Category, AppUser } from '../types';
import { Tag, Plus, Edit2, Check, Lock, AlertCircle } from 'lucide-react';

interface CategoriesViewProps {
  categories: Category[];
  currentUser: AppUser | null;
  onAddCategory: (categoryData: { name: string; color?: string; icon?: string }) => Promise<void>;
  onUpdateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  categories,
  currentUser,
  onAddCategory,
  onUpdateCategory,
}) => {
  const isAdmin = currentUser?.role === 'admin';
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('#10b981');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !isAdmin) return;
    setIsAdding(true);
    try {
      await onAddCategory({
        name: newCatName.trim(),
        color: newCatColor,
        icon: 'Tag',
      });
      setNewCatName('');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveEdit = async (id: string) => {
    if (!editName.trim() || !isAdmin) return;
    await onUpdateCategory(id, { name: editName.trim() });
    setEditingId(null);
  };

  const handleToggleActive = async (cat: Category) => {
    if (!isAdmin || !cat.id) return;
    await onUpdateCategory(cat.id, { active: !cat.active });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Expense Categories
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Admin Managed
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Configure custom expense classification categories synchronized with Google Sheets
          </p>
        </div>
      </div>

      {!isAdmin && (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-400" />
          <span>Only the Administrator (<strong>4g.sudoer@gmail.com</strong>) can create or modify categories.</span>
        </div>
      )}

      {/* Add Category Form (Admin Only) */}
      {isAdmin && (
        <form onSubmit={handleAdd} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">Add New Category</h3>
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              required
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="e.g. Legal & Consulting, Warehouse Supplies"
              className="flex-1 w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer bg-slate-800 border border-slate-700 p-1"
                title="Category Color"
              />
              <button
                type="submit"
                disabled={isAdding || !newCatName.trim()}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>{isAdding ? 'Adding...' : 'Add Category'}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Categories Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {categories.map((c) => {
          const isCurrentEdit = editingId === c.id;
          return (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 truncate">
                <span
                  className="w-4 h-4 rounded-full shrink-0"
                  style={{ backgroundColor: c.color || '#10b981' }}
                />
                {isCurrentEdit ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded px-2 py-1 text-xs text-white"
                      autoFocus
                    />
                    <button
                      onClick={() => c.id && handleSaveEdit(c.id)}
                      className="p-1 text-emerald-400 hover:text-white"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <span className={`text-sm font-semibold truncate ${c.active ? 'text-white' : 'text-slate-500 line-through'}`}>
                    {c.name}
                  </span>
                )}
              </div>

              {isAdmin && !isCurrentEdit && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      setEditingId(c.id || null);
                      setEditName(c.name);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800"
                    title="Edit Name"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggleActive(c)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                      c.active
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-500 border border-slate-700'
                    }`}
                  >
                    {c.active ? 'Active' : 'Inactive'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
