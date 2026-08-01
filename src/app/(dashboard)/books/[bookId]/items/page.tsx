'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { repository } from '@/lib/store/repository';
import { Item, ItemStatus } from '@/types';
import { Package, User, MapPin, History, Plus, Edit3, Trash2, X, CheckCircle2, Merge, AlertCircle } from 'lucide-react';
import { UniversalMergeModal } from '@/components/common/UniversalMergeModal';

export default function ItemsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const bookId = (params?.bookId as string) || 'book-1';
  const initialId = searchParams.get('id');

  const [items, setItems] = useState<Item[]>([]);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [duplicates, setDuplicates] = useState<{ item1: Item; item2: Item; confidence: number }[]>([]);
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

  // Merge State
  const [mergeModalOpen, setMergeModalOpen] = useState(false);
  const [mergePrimary, setMergePrimary] = useState<Item | null>(null);
  const [mergeSecondary, setMergeSecondary] = useState<Item | null>(null);

  const loadItems = async () => {
    const list = await repository.getItems(bookId);
    setItems(list);
    setDuplicates(await repository.findDuplicateItemSuggestions(bookId));
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

  const handleOpenMerge = (primary: Item, secondary: Item) => {
    setMergePrimary(primary);
    setMergeSecondary(secondary);
    setMergeModalOpen(true);
  };

  const handleConfirmMerge = async (primaryId: string, secondaryId: string, overrides: any) => {
    const success = await repository.intelligentMergeItems(primaryId, secondaryId, overrides);
    if (success) {
      showToast('Intelligent Item Merge Complete!');
      await loadItems();
    }
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
      await repository.createItem(bookId, {
        name: name.trim(),
        description: description.trim(),
        type,
        ownerCharacterName: owner.trim(),
        currentLocationName: location.trim(),
        status
      });
      showToast(`Created item "${name.trim()}"`);
    }

    setIsModalOpen(false);
    await loadItems();
  };

  const handleDeleteItem = async (id: string, itemName: string) => {
    await repository.deleteItem(id);
    showToast(`Deleted "${itemName}"`);
    if (selectedItem?.id === id) setSelectedItem(null);
    await loadItems();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-[60] px-5 py-3 rounded-xl bg-[#7c3aed] text-white text-sm font-bold shadow-2xl animate-in slide-in-from-top-2 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" /> {toast}
        </div>
      )}

      {/* Duplicate Item Suggestions Banner */}
      {duplicates.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Duplicate Item Suggestions ({duplicates.length} detected)</span>
          </div>
          <div className="space-y-2 pt-1">
            {duplicates.map((dup, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-[#121218] border border-[#232334] text-xs">
                <div>
                  <span className="font-bold text-white">&quot;{dup.item1.name}&quot;</span>
                  <span className="text-[#8e8ea0] mx-2">matches</span>
                  <span className="font-bold text-white">&quot;{dup.item2.name}&quot;</span>
                </div>
                <button
                  onClick={() => handleOpenMerge(dup.item1, dup.item2)}
                  className="px-4 py-1.5 rounded-lg bg-amber-500 text-black hover:bg-amber-600 text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg"
                >
                  <Merge className="w-3.5 h-3.5" /> Intelligent Merge
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2.5">
            <Package className="w-6 h-6 text-[#06b6d4]" /> Items &amp; Weapons Vault
          </h1>
          <p className="text-xs text-[#8e8ea0] mt-1">
            Weapons, legendary artifacts, key items, documents, and equipment across your story.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#06b6d4] text-black font-bold text-xs hover:bg-[#0891b2] hover:text-white transition-all shadow-lg"
        >
          <Plus className="w-4 h-4" /> Add New Item
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Sidebar: Items List */}
        <div className="space-y-2 max-h-[78vh] overflow-y-auto pr-1">
          {items.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs space-y-2">
              <div>No items recorded in this story bible yet.</div>
              <button onClick={openCreateModal} className="px-4 py-1.5 rounded-lg bg-[#06b6d4] text-black font-bold text-xs">
                + Add Item
              </button>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`p-4 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#121218] border-[#06b6d4] shadow-lg'
                      : 'bg-[#121218]/60 border-[#232334] hover:border-[#06b6d4]/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Package className="w-4 h-4 text-[#06b6d4]" />
                      {item.name}
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-[#1e1e2a] text-[#06b6d4]">
                      {item.type || 'Artifact'}
                    </span>
                  </div>

                  <p className="text-xs text-[#8e8ea0] mt-1.5 line-clamp-2 leading-relaxed">
                    {item.description || 'No description recorded.'}
                  </p>
                </div>
              );
            })
          )}
        </div>

        {/* Right Details Panel */}
        {selectedItem ? (
          <div className="lg:col-span-2 p-6 rounded-2xl bg-[#121218] border border-[#232334] space-y-6">
            <div className="flex items-center justify-between border-b border-[#232334] pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] uppercase font-extrabold bg-[#06b6d4]/20 text-[#06b6d4] border border-[#06b6d4]/30">
                  {selectedItem.type || 'Artifact'}
                </span>
                <h2 className="text-2xl font-extrabold text-white mt-1">{selectedItem.name}</h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedItem)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-[#06b6d4] border-[#232334] hover:border-[#06b6d4]/50 transition-all"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit
                </button>

                {items.length > 1 && (
                  <button
                    onClick={() => {
                      const secondary = items.find(i => i.id !== selectedItem.id);
                      if (secondary) handleOpenMerge(selectedItem, secondary);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border bg-[#181820] text-amber-400 border-amber-500/30 hover:bg-amber-500/10 transition-all"
                  >
                    <Merge className="w-3.5 h-3.5" /> Merge
                  </button>
                )}

                <button
                  onClick={() => handleDeleteItem(selectedItem.id, selectedItem.name)}
                  className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 border border-[#232334]"
                  title="Delete Item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1.5">
                <h3 className="font-bold text-[#06b6d4] uppercase tracking-wider text-[10px]">Description &amp; Lore</h3>
                <p className="text-[#a1a1aa] leading-relaxed">{selectedItem.description || 'No detailed description.'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
                  <div className="text-[10px] font-bold text-[#8e8ea0] uppercase flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-[#06b6d4]" /> Current Holder
                  </div>
                  <div className="font-bold text-white text-sm">{selectedItem.ownerCharacterName || 'Unowned / Independent'}</div>
                </div>

                <div className="p-4 rounded-xl bg-[#181820] border border-[#232334] space-y-1">
                  <div className="text-[10px] font-bold text-[#8e8ea0] uppercase flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#06b6d4]" /> Current Location
                  </div>
                  <div className="font-bold text-white text-sm">{selectedItem.currentLocationName || 'Unknown Location'}</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 p-12 text-center rounded-2xl bg-[#121218] border border-[#232334] text-[#8e8ea0] text-xs">
            Select an item to view details.
          </div>
        )}

      </div>

      {/* Universal Merge Modal */}
      {mergePrimary && mergeSecondary && (
        <UniversalMergeModal
          isOpen={mergeModalOpen}
          entityType="item"
          primaryEntity={mergePrimary}
          secondaryEntity={mergeSecondary}
          onConfirmMerge={handleConfirmMerge}
          onClose={() => setMergeModalOpen(false)}
        />
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#121218] border border-[#232334] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#232334] pb-3">
              <h3 className="font-bold text-white text-base">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#8e8ea0] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Item Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Excalibur, Dragon Ring"
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#06b6d4]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#06b6d4]"
                >
                  <option value="Weapon">Weapon</option>
                  <option value="Artifact">Artifact</option>
                  <option value="Armor">Armor</option>
                  <option value="Consumable">Consumable</option>
                  <option value="Key Item">Key Item</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-[#8e8ea0]">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Item properties and lore..."
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#06b6d4] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-[#8e8ea0]">Current Owner</label>
                  <input
                    type="text"
                    value={owner}
                    onChange={(e) => setOwner(e.target.value)}
                    placeholder="e.g. Arthur"
                    className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#06b6d4]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-[#8e8ea0]">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Camelot Vault"
                    className="w-full px-3 py-2 rounded-xl bg-[#181820] border border-[#232334] text-white focus:outline-none focus:border-[#06b6d4]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#181820] text-[#a1a1aa] font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#06b6d4] text-black font-bold hover:bg-[#0891b2] hover:text-white"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
