'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Item, ItemStatus } from '@/types';
import { Package, User, MapPin, History, Plus, Edit3, Trash2, X, CheckCircle2 } from 'lucide-react';

export default function ItemsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialId = searchParams.get('id');

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [toast, setToast] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Artifact');
  const [owner, setOwner] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<ItemStatus>('Active');
  const [error, setError] = useState('');

  const loadItems = async () => {
    const list = await repository.getItems(bookId);
    setItems(list);
    if (list.length > 0) {
      const match = initialId ? list.find(i => i.id === initialId) || list[0] : list[0];
      setSelectedItem(prev => (prev && list.find(i => i.id === prev.id)) ? list.find(i => i.id === prev.id)! : match);
    } else {
      setSelectedItem(null);
    }
  };

  useEffect(() => {
    loadItems();
    const handleDataChanged = () => loadItems();
    window.addEventListener('storybible_data_changed', handleDataChanged);
    return () => window.removeEventListener('storybible_data_changed', handleDataChanged);
  }, [bookId, initialId]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setDescription('');
    setType('Artifact');
    setOwner('');
    setLocation('');
    setStatus('Active');
    setError('');
    setIsModalOpen(true);
  };

  const openEditModal = (it: Item) => {
    setEditingItem(it);
    setName(it.name);
    setDescription(it.description || '');
    setType(it.type || 'Artifact');
    setOwner(it.ownerCharacterName || '');
    setLocation(it.currentLocationName || '');
    setStatus(it.status || 'Active');
    setError('');
    setIsModalOpen(true);
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('Please enter an item name.');
      return;
    }

    if (editingItem) {
      await repository.updateItem(editingItem.id, {
        name: name.trim(),
        description: description.trim(),
        type,
        ownerCharacterName: owner.trim(),
        currentLocationName: location.trim(),
        status
      });
      showToast(`Updated "${name.trim()}"`);
    } else {
      const created = await repository.createItem(bookId, {
        name: name.trim(),
        description: description.trim(),
        type,
        ownerCharacterName: owner.trim(),
        currentLocationName: location.trim(),
        status
      });
      if (created) {
        showToast(`Created item "${created.name}"`);
        setSelectedItem(created);
      }
    }

    setIsModalOpen(false);
    await loadItems();
  };

  const handleDeleteItem = async (it: Item) => {
    if (confirm(`Delete item "${it.name}"?`)) {
      await repository.deleteItem(it.id);
      showToast(`Deleted "${it.name}"`);
      setSelectedItem(null);
      await loadItems();
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-20 right-8 z-50 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toast}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#f59e0b]" /> Items & Artifacts Registry
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Relics, weapons, key items, and legendary tools tracked automatically.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Item List */}
        <div className="space-y-3">
          {items.length === 0 && (
            <div className="p-8 text-center rounded-xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-3">
              <Package className="w-8 h-8 mx-auto text-[#f59e0b] opacity-40" />
              <div>No items or artifacts recorded yet.</div>
              <button
                onClick={openCreateModal}
                className="px-4 py-2 rounded-xl bg-[#7c3aed] text-white font-bold text-xs hover:bg-[#6d28d9] transition-all shadow-purple"
              >
                + Add First Item
              </button>
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              onClick={() => setSelectedItem(it)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${
                selectedItem?.id === it.id
                  ? 'bg-[#121218] border-[#f59e0b] shadow-purple'
                  : 'bg-[#121218]/60 border-[#232334] hover:border-[#f59e0b]/40'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-white text-sm">{it.name}</span>
                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#f59e0b]">
                  {it.status}
                </span>
              </div>
              <p className="text-xs text-[#8e8ea0] mt-1 line-clamp-2">{it.description}</p>
            </div>
          ))}
        </div>

        {/* Item Detail View */}
        {selectedItem ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            <div className="flex items-start justify-between border-b border-[#232334] pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30">
                  {selectedItem.status}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-2">{selectedItem.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-[#181820] text-white border-[#232334] hover:border-[#f59e0b]/50 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => handleDeleteItem(selectedItem)}
                  className="p-2 rounded-lg text-red-400 bg-[#181820] border border-[#232334] hover:bg-red-500/10 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#f59e0b]">Description</h3>
              <p className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-xs text-[#a1a1aa] leading-relaxed">
                {selectedItem.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="text-xs text-[#8e8ea0] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#a78bfa]" /> Current Owner
                </div>
                <div className="font-bold text-white text-sm mt-1">
                  {selectedItem.ownerCharacterName || 'Unclaimed'}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334]">
                <div className="text-xs text-[#8e8ea0] flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#10b981]" /> Current Location
                </div>
                <div className="font-bold text-white text-sm mt-1">
                  {selectedItem.currentLocationName || 'Unknown Location'}
                </div>
              </div>
            </div>

            {selectedItem.historyNotes && (
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8e8ea0] flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> Possession History & Notes
                </h3>
                <p className="p-4 rounded-xl bg-[#181820] border border-[#232334] text-xs text-[#a1a1aa]">
                  {selectedItem.historyNotes}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center bg-[#121218] border border-[#232334] rounded-2xl text-[#8e8ea0]">
            Select an item to view details.
          </div>
        )}
      </div>

      {/* Create / Edit Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#121218] border border-[#232334] rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-[#232334] bg-[#0c0c10] flex items-center justify-between">
              <h2 className="font-bold text-white text-base">
                {editingItem ? `Edit Item: ${editingItem.name}` : 'Add New Item / Artifact'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItem} className="p-6 space-y-4 text-xs">
              {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Item Name <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Excalibur, Sunblade, Dragon Amulet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Item description, powers, or lore..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#181820] border border-[#232334] rounded-xl p-3 text-white placeholder-[#8e8ea0] focus:outline-none focus:border-[#7c3aed]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Category / Type
                  </label>
                  <input
                    type="text"
                    placeholder="Weapon, Artifact, Key, Potion..."
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ItemStatus)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  >
                    <option value="Active">Active</option>
                    <option value="Destroyed">Destroyed</option>
                    <option value="Lost">Lost</option>
                    <option value="Stored">Stored</option>
                    <option value="Hidden">Hidden</option>
                    <option value="Borrowed">Borrowed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Owner Character Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Isaac Carter"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#8e8ea0] uppercase tracking-wider mb-1.5">
                    Current Location
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Library Vault"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-[#181820] border border-[#232334] rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-[#7c3aed]"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#232334] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181820] border border-[#232334] text-[#a1a1aa] hover:text-white font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#7c3aed] text-white font-bold hover:bg-[#6d28d9] shadow-purple"
                >
                  {editingItem ? 'Save Item' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
