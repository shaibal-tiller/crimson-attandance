import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, AlertCircle, Loader2, ArrowUpCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

export default function InventoryView() {
  const { user } = useUser();
  if (!user) return null;
  const [inventory, setInventory] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [restockItem, setRestockItem] = useState<any>(null);
  const [restockAmount, setRestockAmount] = useState<number>(0);

  const isManager = user.role === 'Admin' || user.role === 'Manager' || user.role === 'Supervisor';

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      axios.get('/api/inventory'),
      axios.get('/api/inventory_logs'),
      axios.get('/api/users')
    ]).then(([invRes, logsRes, usersRes]) => {
      const data = invRes.data || [];
      const lData = logsRes.data || [];
      setUsers(usersRes.data || []);

      if (user.role === 'Admin') {
        setInventory(data);
        setLogs(lData.reverse());
      } else {
        setInventory(data.filter((i: any) => i.branchId === user.branchId));
        setLogs(lData.filter((l: any) => l.branchId === user.branchId).reverse());
      }
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockAmount <= 0) return;
    try {
      await axios.put('/api/inventory/restock', {
        id: restockItem.id,
        branchId: restockItem.branchId,
        userId: user.id,
        amount: Number(restockAmount)
      });
      setRestockItem(null);
      setRestockAmount(0);
      fetchData();
    } catch(err) {
      console.error(err);
    }
  };

  const getUserName = (uid: string) => {
    const u = users.find(x => x.uid === uid);
    return u ? u.name : uid;
  };
  const getItemName = (iid: string) => {
    const i = inventory.find(x => x.id === iid);
    return i ? i.name : iid;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-glass-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-glass-text">Inventory Management</h1>
          <p className="text-sm text-glass-text-muted">Track supplies, low stock alerts, and reorders.</p>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-glass-text-muted" />
          <input 
            type="text" 
            placeholder="Search items..." 
            className="pl-9 pr-4 py-2 bg-glass-item border border-glass-border rounded-lg text-sm text-glass-text focus:outline-none focus:border-glass-accent focus:ring-1 focus:ring-glass-accent w-full sm:w-64 transition-all"
          />
        </div>
      </div>

      {restockItem && isManager && (
        <div className="glass-panel p-6 rounded-2xl max-w-xl">
          <h2 className="text-lg font-semibold text-glass-text mb-4">Restock: {restockItem.name}</h2>
          <form onSubmit={handleRestock} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-medium text-glass-text-muted mb-1">Amount to Add ({restockItem.unit})</label>
              <input 
                type="number" 
                min="1"
                required
                value={restockAmount}
                onChange={e => setRestockAmount(parseInt(e.target.value) || 0)}
                className="w-full bg-glass-item border border-glass-border rounded-lg p-2.5 text-sm text-glass-text focus:outline-none focus:border-glass-accent"
              />
            </div>
            <button type="submit" className="bg-[#2D6A4F] hover:bg-[#1a4a35] text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
              Confirm Restock
            </button>
            <button type="button" onClick={() => setRestockItem(null)} className="bg-glass-item text-glass-text px-6 py-2.5 rounded-lg text-sm font-medium transition-colors border border-glass-border">
              Cancel
            </button>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-panel rounded-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-glass-border-light bg-glass-item flex justify-between items-center shrink-0">
            <h2 className="text-lg font-semibold text-glass-text">Current Stock</h2>
            <span className="text-xs font-medium px-2 py-1 bg-glass-accent-light text-glass-accent rounded-full">
              {inventory.filter((i: any) => i.status === 'Low Stock').length} Low Stock
            </span>
          </div>
          <div className="overflow-y-auto flex-1 p-2 custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-glass-border-light text-glass-text-muted text-xs uppercase tracking-wider sticky top-0 bg-glass-panel backdrop-blur-md z-10">
                  <th className="p-4 font-medium">Item</th>
                  <th className="p-4 font-medium">Category</th>
                  <th className="p-4 font-medium">Quantity</th>
                  <th className="p-4 font-medium">Status</th>
                  {isManager && <th className="p-4 font-medium text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-glass-border-light text-sm">
                {inventory.map((item: any) => (
                  <tr key={item.id} className="hover:bg-glass-panel-hover transition-colors">
                    <td className="p-4 font-medium text-glass-text">{item.name}</td>
                    <td className="p-4 text-glass-text-muted">{item.category}</td>
                    <td className="p-4">
                      <span className="font-semibold text-glass-text">{item.quantity}</span>
                      <span className="text-glass-text-muted ml-1">{item.unit}</span>
                    </td>
                    <td className="p-4">
                      {item.status === 'Low Stock' ? (
                        <span className="inline-flex items-center text-glass-accent font-medium text-xs">
                          <AlertCircle className="w-3 h-3 mr-1" /> Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[#2D6A4F] font-medium text-xs">
                          In Stock
                        </span>
                      )}
                    </td>
                    {isManager && (
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => setRestockItem(item)}
                          className="text-xs px-3 py-1.5 bg-glass-item border border-glass-border text-glass-text rounded hover:bg-glass-accent hover:text-white transition-colors flex items-center justify-center gap-1 inline-flex"
                        >
                          <ArrowUpCircle className="w-3 h-3" /> Restock
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* LOGS */}
        <div className="glass-panel rounded-2xl overflow-hidden flex flex-col h-[600px]">
          <div className="px-6 py-4 border-b border-glass-border-light bg-glass-item shrink-0">
            <h2 className="text-lg font-semibold text-glass-text">Restock Logs</h2>
          </div>
          <div className="p-4 overflow-y-auto flex-1 custom-scrollbar space-y-3">
            {logs.length === 0 ? (
              <p className="text-sm text-glass-text-muted text-center py-4">No recent activity.</p>
            ) : (
              logs.map((log: any) => (
                <div key={log.id} className="p-3 rounded-lg border border-glass-border bg-glass-item text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-semibold text-glass-text">{getItemName(log.inventoryId)}</span>
                    <span className="text-xs text-[#2D6A4F] font-medium">+{log.quantityChange}</span>
                  </div>
                  <p className="text-xs text-glass-text-muted">By {getUserName(log.userId)}</p>
                  <p className="text-[10px] text-glass-text-muted mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
