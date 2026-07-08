import React, { useState } from 'react';
import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package, Search, Plus, AlertCircle, Loader2, ArrowRight, CheckCircle2, XCircle, Truck, PackageCheck, Image as ImageIcon } from 'lucide-react';
import { useUser } from '../context/UserContext';
import toast from 'react-hot-toast';

export default function InventoryView() {
  const { user } = useUser();
  if (!user) return null;
  const isManager = ['Admin', 'Manager'].includes(user.role);

  const [activeTab, setActiveTab] = useState(isManager ? 'warehouse' : 'my_stock');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', category: '', unit: '', imageUrl: '', quantity: 0, threshold: 10 });
  
  // Stock Order State
  const [orderCart, setOrderCart] = useState<{itemId: string, quantity: number}[]>([]);

  const queryClient = useQueryClient();

  const { data: warehouseItems = [], isLoading: loadingWarehouse } = useQuery({
    queryKey: ['warehouse_items'],
    queryFn: async () => (await axios.get('/api/inventory/warehouse')).data
  });

  const { data: branchStock = [], isLoading: loadingBranch } = useQuery({
    queryKey: ['branch_inventory', user.branchId],
    queryFn: async () => (await axios.get(`/api/inventory/branch/${user.branchId}`)).data
  });

  const { data: stockRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['stock_requests', isManager ? 'all' : user.branchId],
    queryFn: async () => {
      const url = isManager ? '/api/inventory/requests' : `/api/inventory/requests?branchId=${user.branchId}`;
      return (await axios.get(url)).data;
    }
  });

  const addItemMutation = useMutation({
    mutationFn: (data: any) => axios.post('/api/inventory/warehouse/items', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['warehouse_items'] });
      setShowAddModal(false);
      toast.success('Warehouse item added successfully!');
    }
  });

  const placeOrderMutation = useMutation({
    mutationFn: (data: any) => axios.post('/api/inventory/requests', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock_requests'] });
      setOrderCart([]);
      toast.success('Stock request submitted!');
      setActiveTab('shipments');
    }
  });

  const updateRequestMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => axios.put(`/api/inventory/requests/${id}/status`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['stock_requests'] });
      if (variables.status === 'received') {
        queryClient.invalidateQueries({ queryKey: ['branch_inventory', user.branchId] });
        queryClient.invalidateQueries({ queryKey: ['warehouse_items'] });
      }
      toast.success(`Request marked as ${variables.status}`);
    }
  });

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    addItemMutation.mutate(newItem);
  };

  const handleAddToCart = (itemId: string, qty: number) => {
    setOrderCart(prev => {
      const exists = prev.find(p => p.itemId === itemId);
      if (exists) return prev.map(p => p.itemId === itemId ? { ...p, quantity: p.quantity + qty } : p);
      return [...prev, { itemId, quantity: qty }];
    });
  };

  const getFallbackImage = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('bean') || c.includes('coffee')) return 'https://images.unsplash.com/photo-1559525839-b184a4d698c7?w=500&q=80';
    if (c.includes('milk') || c.includes('dairy')) return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80';
    if (c.includes('syrup')) return 'https://images.unsplash.com/photo-1589133887131-0df20b57e7a7?w=500&q=80';
    if (c.includes('cup') || c.includes('package')) return 'https://images.unsplash.com/photo-1572119865084-43c285814d63?w=500&q=80';
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&q=80'; // generic cafe
  };

  if (loadingWarehouse || loadingBranch || loadingRequests) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-glass-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-glass-text">Inventory & Supply Chain</h1>
          <p className="text-sm text-glass-text-muted">Manage global catalog, local stock, and branch requisitions.</p>
        </div>
        {isManager && activeTab === 'warehouse' && (
          <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
            <Plus className="w-4 h-4" /> Add Master Item
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto space-x-2 border-b border-glass-border custom-scrollbar pb-1">
        {isManager && (
          <>
            <button onClick={() => setActiveTab('warehouse')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'warehouse' ? 'border-glass-accent text-glass-accent' : 'border-transparent text-glass-text-muted hover:text-glass-text'}`}>
              Master Warehouse
            </button>
            <button onClick={() => setActiveTab('requests_admin')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requests_admin' ? 'border-glass-accent text-glass-accent' : 'border-transparent text-glass-text-muted hover:text-glass-text'}`}>
              Branch Requests ({stockRequests.filter((r:any) => r.status === 'pending').length})
            </button>
          </>
        )}
        <button onClick={() => setActiveTab('my_stock')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'my_stock' ? 'border-glass-accent text-glass-accent' : 'border-transparent text-glass-text-muted hover:text-glass-text'}`}>
          My Branch Stock
        </button>
        <button onClick={() => setActiveTab('order')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'order' ? 'border-glass-accent text-glass-accent' : 'border-transparent text-glass-text-muted hover:text-glass-text'}`}>
          Order Stock {orderCart.length > 0 && <span className="ml-1 bg-glass-accent text-white text-[10px] px-1.5 py-0.5 rounded-full">{orderCart.length}</span>}
        </button>
        <button onClick={() => setActiveTab('shipments')} className={`shrink-0 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'shipments' ? 'border-glass-accent text-glass-accent' : 'border-transparent text-glass-text-muted hover:text-glass-text'}`}>
          Shipments
        </button>
      </div>

      {/* Warehouse View */}
      {activeTab === 'warehouse' && isManager && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {warehouseItems.length === 0 && <p className="col-span-full text-glass-text-muted p-8 text-center glass-panel rounded-xl">No master items yet. Add one to get started.</p>}
          {warehouseItems.map((item: any) => (
            <div key={item.id} className="glass-panel rounded-xl overflow-hidden group">
              <div className="h-32 w-full relative">
                <img src={item.imageUrl || getFallbackImage(item.category)} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                  <span className="text-white font-semibold truncate block">{item.name}</span>
                </div>
              </div>
              <div className="p-3">
                <p className="text-xs text-glass-text-muted mb-2">{item.category}</p>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-glass-text">{item.quantity} {item.unit}</span>
                  {item.quantity <= item.threshold && <AlertCircle className="w-4 h-4 text-glass-accent" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Branch Stock View */}
      {activeTab === 'my_stock' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {branchStock.length === 0 && <p className="col-span-full text-glass-text-muted p-8 text-center glass-panel rounded-xl">No items in branch stock yet. Place an order to restock.</p>}
          {branchStock.map((bItem: any) => (
            <div key={bItem.id} className="glass-panel rounded-xl overflow-hidden group">
              <div className="h-32 w-full relative">
                <img src={bItem.item?.imageUrl || getFallbackImage(bItem.item?.category || '')} alt={bItem.item?.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                <div className="absolute bottom-2 left-2 right-2">
                  <span className="text-white font-semibold truncate block">{bItem.item?.name}</span>
                </div>
              </div>
              <div className="p-3 bg-glass-panel">
                <p className="text-xs text-glass-text-muted mb-2">{bItem.item?.category}</p>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-glass-text">{bItem.quantity} <span className="text-xs font-normal text-glass-text-muted">{bItem.item?.unit}</span></span>
                  {bItem.quantity <= bItem.threshold && <span className="text-[10px] bg-glass-accent/20 text-glass-accent px-2 py-0.5 rounded-full font-medium flex items-center"><AlertCircle className="w-3 h-3 mr-1" /> Low</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Stock View */}
      {activeTab === 'order' && (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-glass-text mb-4">Available Master Items</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {warehouseItems.map((item: any) => (
                <div key={item.id} className="glass-panel p-3 rounded-xl flex items-center space-x-3 hover:border-glass-accent transition">
                  <img src={item.imageUrl || getFallbackImage(item.category)} alt={item.name} className="w-12 h-12 rounded object-cover" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-glass-text truncate">{item.name}</p>
                    <p className="text-xs text-glass-text-muted">{item.category}</p>
                  </div>
                  <button onClick={() => handleAddToCart(item.id, 1)} className="p-2 bg-glass-item rounded-lg hover:bg-glass-accent hover:text-white transition text-glass-text">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          <div className="w-full lg:w-80 glass-panel rounded-2xl flex flex-col h-fit">
            <div className="p-4 border-b border-glass-border bg-glass-item rounded-t-2xl">
              <h2 className="font-semibold text-glass-text">Requisition Cart</h2>
            </div>
            <div className="p-4 space-y-3">
              {orderCart.length === 0 ? (
                <p className="text-sm text-glass-text-muted text-center py-6">Cart is empty</p>
              ) : (
                orderCart.map((cartItem, idx) => {
                  const itemInfo = warehouseItems.find((w:any) => w.id === cartItem.itemId);
                  return (
                    <div key={idx} className="flex justify-between items-center text-sm">
                      <span className="text-glass-text truncate pr-2">{itemInfo?.name}</span>
                      <div className="flex items-center space-x-2">
                        <input 
                          type="number" min="1" 
                          value={cartItem.quantity}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 1;
                            setOrderCart(prev => prev.map(p => p.itemId === cartItem.itemId ? { ...p, quantity: val } : p));
                          }}
                          className="w-16 bg-transparent border border-glass-border rounded px-2 py-1 text-right text-glass-text"
                        />
                        <button onClick={() => setOrderCart(prev => prev.filter(p => p.itemId !== cartItem.itemId))} className="text-glass-accent hover:opacity-70"><XCircle className="w-4 h-4" /></button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {orderCart.length > 0 && (
              <div className="p-4 border-t border-glass-border">
                <button 
                  onClick={() => placeOrderMutation.mutate({ branchId: user.branchId, items: orderCart })}
                  disabled={placeOrderMutation.isPending}
                  className="w-full bg-[#2D6A4F] hover:bg-[#1a4a35] text-white py-2 rounded-lg text-sm font-medium transition"
                >
                  {placeOrderMutation.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin Requests View */}
      {activeTab === 'requests_admin' && isManager && (
        <div className="space-y-4">
          {stockRequests.length === 0 && <p className="text-glass-text-muted">No stock requests found.</p>}
          {stockRequests.map((req: any) => (
            <div key={req.id} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-glass-text">Request {req.id.split('_')[1]}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                    ${req.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 
                      req.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' : 
                      req.status === 'received' ? 'bg-green-500/20 text-green-400' : 'bg-glass-item text-glass-text-muted'}`}>
                    {req.status}
                  </span>
                </div>
                <p className="text-sm text-glass-text-muted mb-2">From Branch: <span className="font-medium text-glass-text">{req.branchId}</span></p>
                <div className="text-sm text-glass-text flex flex-wrap gap-2">
                  {req.items.map((i:any) => (
                    <span key={i.id} className="bg-glass-item border border-glass-border px-2 py-1 rounded">{i.item?.item?.name} (x{i.quantity})</span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 w-full md:w-auto">
                {req.status === 'pending' && (
                  <button onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'shipped' })} className="w-full md:w-auto flex items-center justify-center gap-2 bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-4 py-2.5 rounded-lg text-sm font-medium transition">
                    <Truck className="w-4 h-4" /> Approve & Ship
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shipments View (Branch) */}
      {activeTab === 'shipments' && (
        <div className="space-y-4">
          {stockRequests.length === 0 && <p className="text-glass-text-muted">No shipment history.</p>}
          {stockRequests.map((req: any) => (
            <div key={req.id} className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-semibold text-glass-text">Order {req.id.split('_')[1]}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider
                    ${req.status === 'pending' ? 'bg-orange-500/20 text-orange-400' : 
                      req.status === 'shipped' ? 'bg-blue-500/20 text-blue-400' : 
                      req.status === 'received' ? 'bg-green-500/20 text-green-400' : 'bg-glass-item text-glass-text-muted'}`}>
                    {req.status}
                  </span>
                </div>
                <div className="text-sm text-glass-text-muted mb-2">
                  Ordered on {new Date(req.createdAt).toLocaleDateString()}
                </div>
                <div className="text-sm text-glass-text flex flex-wrap gap-2">
                  {req.items.map((i:any) => (
                    <span key={i.id} className="bg-glass-item border border-glass-border px-2 py-1 rounded">{i.item?.item?.name} (x{i.quantity})</span>
                  ))}
                </div>
              </div>
              <div className="w-full md:w-auto">
                {req.status === 'shipped' && (
                  <button onClick={() => updateRequestMutation.mutate({ id: req.id, status: 'received' })} className="w-full md:w-auto flex items-center justify-center gap-2 bg-glass-accent hover:bg-glass-accent/80 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition shadow-lg shadow-glass-accent/20">
                    <PackageCheck className="w-4 h-4" /> Mark Received
                  </button>
                )}
                {req.status === 'received' && (
                  <span className="flex items-center justify-center gap-1 text-[#2D6A4F] text-sm font-medium bg-[#2D6A4F]/10 px-4 py-2 rounded-lg">
                    <CheckCircle2 className="w-4 h-4" /> Restocked
                  </span>
                )}
                {req.status === 'pending' && (
                  <span className="flex items-center justify-center gap-1 text-orange-400 text-sm font-medium bg-orange-400/10 px-4 py-2 rounded-lg">
                    Awaiting Shipment
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Master Item Modal */}
      {showAddModal && isManager && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full rounded-2xl p-6 relative shadow-2xl">
            <button onClick={() => setShowAddModal(false)} className="absolute top-4 right-4 text-glass-text-muted hover:text-white">
              <XCircle className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold text-glass-text mb-6">Add Master Item</h2>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-glass-text-muted mb-1">Item Name</label>
                <input required type="text" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:border-glass-accent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-glass-text-muted mb-1">Category</label>
                  <select required value={newItem.category} onChange={e => setNewItem({...newItem, category: e.target.value})} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:border-glass-accent outline-none">
                    <option value="">Select...</option>
                    <option value="Coffee Beans">Coffee Beans</option>
                    <option value="Dairy & Milk">Dairy & Milk</option>
                    <option value="Syrups & Flavors">Syrups & Flavors</option>
                    <option value="Cups & Lids">Cups & Lids</option>
                    <option value="Pastries">Pastries</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-glass-text-muted mb-1">Unit</label>
                  <input required type="text" placeholder="e.g. kg, L, pcs" value={newItem.unit} onChange={e => setNewItem({...newItem, unit: e.target.value})} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:border-glass-accent outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-glass-text-muted mb-1">Stock (Warehouse)</label>
                  <input required type="number" min="0" value={newItem.quantity} onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:border-glass-accent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-glass-text-muted mb-1">Low Alert Threshold</label>
                  <input required type="number" min="0" value={newItem.threshold} onChange={e => setNewItem({...newItem, threshold: parseInt(e.target.value)})} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:border-glass-accent outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-glass-text-muted mb-1">Image URL (Optional)</label>
                <input type="url" placeholder="Leave blank for auto-image" value={newItem.imageUrl} onChange={e => setNewItem({...newItem, imageUrl: e.target.value})} className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:border-glass-accent outline-none" />
              </div>
              <div className="pt-4">
                <button type="submit" disabled={addItemMutation.isPending} className="w-full bg-glass-accent hover:bg-glass-accent/80 text-white py-2.5 rounded-lg text-sm font-medium transition shadow-lg">
                  {addItemMutation.isPending ? 'Adding...' : 'Add Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
