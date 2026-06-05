import { useState } from 'react';
import { Plus, Trash2, FolderOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function EditorPanel({ recipient, setRecipient, items, setItems, notes, setNotes, savedQuotations = [], handleLoad, handleDelete }) {
  const [isSavedOpen, setIsSavedOpen] = useState(false);

  const handleRecipientChange = (e) => {
    const { name, value } = e.target;
    setRecipient(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (id, field, value) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Auto-calculate total if it's not a lump sum item
        if (!updated.isLumpSum && (field === 'quantity' || field === 'rate' || field === 'discount')) {
          const subtotal = Number(updated.quantity) * Number(updated.rate);
          const discountAmt = (subtotal * (Number(updated.discount) || 0)) / 100;
          updated.total = subtotal - discountAmt;
        }
        return updated;
      }
      return item;
    }));
  };

  const addItem = () => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    setItems([...items, { id: newId, particular: '', description: '', quantity: 1, rate: 0, discount: 0, total: 0, isLumpSum: false }]);
  };

  const insertItemAfter = (index) => {
    const newId = items.length > 0 ? Math.max(...items.map(i => i.id)) + 1 : 1;
    const newItem = { id: newId, particular: '', description: '', quantity: 1, rate: 0, discount: 0, total: 0, isLumpSum: false };
    const updatedItems = [...items];
    updatedItems.splice(index + 1, 0, newItem);
    setItems(updatedItems);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const addNote = () => {
    const newId = notes.length > 0 ? Math.max(...notes.map(n => n.id)) + 1 : 1;
    setNotes([...notes, { id: newId, text: '' }]);
  };

  const updateNote = (id, text) => {
    setNotes(notes.map(n => n.id === id ? { ...n, text } : n));
  };

  const removeNote = (id) => {
    setNotes(notes.filter(n => n.id !== id));
  };

  return (
    <div className="space-y-8 font-body">
      {/* Saved Quotations */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <button 
          onClick={() => setIsSavedOpen(!isSavedOpen)} 
          className="w-full flex justify-between items-center text-xl font-heading font-semibold text-brand-charcoal outline-none"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="text-brand-gold" size={22} />
            <span>Saved Quotations ({savedQuotations.length})</span>
          </div>
          {isSavedOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
        </button>

        {isSavedOpen && (
          <div className="mt-4 space-y-3 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
            {savedQuotations.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-2">No saved quotations found. Create and save one above!</p>
            ) : (
              savedQuotations.map((q) => {
                const total = q.items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
                const dateStr = q.recipient.date ? new Date(q.recipient.date).toLocaleDateString('en-IN', {
                  day: '2-digit', month: '2-digit', year: 'numeric'
                }) : '';
                
                return (
                  <div key={q.id} className="flex justify-between items-center p-3 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-brand-charcoal text-sm">{q.recipient.quotationNumber}</span>
                        <span className="text-xs text-gray-400 font-medium">{dateStr}</span>
                      </div>
                      <div className="text-xs text-gray-600">
                        <span className="font-semibold">{q.recipient.to || 'No Recipient'}</span>
                        {q.recipient.organization && ` - ${q.recipient.organization}`}
                      </div>
                      <div className="text-xs font-semibold text-brand-gold">
                        Total: ₹ {total.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleLoad(q)} 
                        className="px-3 py-1 text-xs font-semibold bg-brand-gold hover:bg-brand-gold-light text-white rounded transition-colors"
                      >
                        Load
                      </button>
                      <button 
                        onClick={() => handleDelete(q.recipient.quotationNumber)} 
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-gray-200 transition-colors"
                        title="Delete quotation"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </section>

      {/* Recipient Details */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-xl font-heading font-semibold text-brand-charcoal mb-4">Recipient Details</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation #</label>
              <input type="text" name="quotationNumber" value={recipient.quotationNumber} onChange={handleRecipientChange} className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quotation Date</label>
              <input type="date" name="date" value={recipient.date} onChange={handleRecipientChange} className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Billed To</label>
              <input type="text" name="to" value={recipient.to} onChange={handleRecipientChange} placeholder="e.g., The Principal" className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input type="text" name="phone" value={recipient.phone} onChange={handleRecipientChange} placeholder="e.g., +91 9876543210" className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
              <input type="text" name="organization" value={recipient.organization} onChange={handleRecipientChange} placeholder="e.g., Polytechnic College" className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Client GST Number (Optional)</label>
              <input type="text" name="clientGst" value={recipient.clientGst} onChange={handleRecipientChange} placeholder="e.g., 22AAAAA0000A1Z5" className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
            <input type="text" name="address" value={recipient.address} onChange={handleRecipientChange} placeholder="e.g., Adityapur, Jamshedpur" className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
            <input type="text" name="subject" value={recipient.subject} onChange={handleRecipientChange} className="w-full p-2 border border-gray-300 rounded focus:ring-brand-gold focus:border-brand-gold outline-none" />
          </div>
        </div>
      </section>

      {/* Items Table */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-semibold text-brand-charcoal">Line Items</h2>
          <button onClick={addItem} className="flex items-center text-sm text-brand-gold hover:text-brand-gold-light font-medium">
            <Plus size={16} className="mr-1" /> Add Row
          </button>
        </div>
        
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 border border-gray-100 rounded bg-gray-50 relative group">
              <div className="absolute top-2 right-2 flex items-center gap-2">
                <button 
                  onClick={() => insertItemAfter(index)} 
                  title="Insert row below"
                  className="p-1 text-gray-400 hover:text-brand-gold hover:bg-gray-100 rounded transition-colors"
                >
                  <Plus size={16} />
                </button>
                <button 
                  onClick={() => removeItem(item.id)} 
                  title="Delete row"
                  className="p-1 text-gray-400 hover:text-red-500 hover:bg-gray-100 rounded transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mt-2">
                <div className="md:col-span-4">
                  <label className="block text-xs text-gray-500 mb-1">Particular</label>
                  <input type="text" value={item.particular} onChange={(e) => handleItemChange(item.id, 'particular', e.target.value)} placeholder="Item description" className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-brand-gold outline-none" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Qty</label>
                  <input type="number" min="1" value={item.quantity} onChange={(e) => handleItemChange(item.id, 'quantity', e.target.value)} disabled={item.isLumpSum} className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-brand-gold outline-none disabled:bg-gray-200" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Rate (₹)</label>
                  <input type="number" min="0" value={item.rate} onChange={(e) => handleItemChange(item.id, 'rate', e.target.value)} disabled={item.isLumpSum} className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-brand-gold outline-none disabled:bg-gray-200" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Disc. (%)</label>
                  <input type="number" min="0" max="100" value={item.discount} onChange={(e) => handleItemChange(item.id, 'discount', e.target.value)} disabled={item.isLumpSum} className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-brand-gold outline-none disabled:bg-gray-200 no-spinner" />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Total (₹)</label>
                  <input type="number" min="0" value={item.total} onChange={(e) => handleItemChange(item.id, 'total', e.target.value)} disabled={!item.isLumpSum} className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-brand-gold outline-none disabled:bg-gray-200 font-semibold" />
                </div>
              </div>

              {/* Full-width description field */}
              <div className="mt-2">
                <textarea
                  rows={2}
                  value={item.description || ''}
                  onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                  placeholder="Optional details / specs (shown in small font below the item)"
                  className="w-full p-2 text-xs border border-gray-200 rounded focus:ring-brand-gold outline-none resize-none text-gray-500"
                />
              </div>
              <div className="mt-2 flex items-center">
                <input type="checkbox" id={`lump-${item.id}`} checked={item.isLumpSum} onChange={(e) => handleItemChange(item.id, 'isLumpSum', e.target.checked)} className="mr-2 text-brand-gold focus:ring-brand-gold rounded border-gray-300" />
                <label htmlFor={`lump-${item.id}`} className="text-xs text-gray-600 cursor-pointer">Lump Sum Item (Enter total manually, ignore rate/qty)</label>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-4">No items added. Click "Add Row" to start.</p>
          )}
        </div>
      </section>

      {/* Notes Section */}
      <section className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-heading font-semibold text-brand-charcoal">Terms & Conditions</h2>
          <button onClick={addNote} className="flex items-center text-sm text-brand-gold hover:text-brand-gold-light font-medium">
            <Plus size={16} className="mr-1" /> Add Note
          </button>
        </div>
        
        <div className="space-y-3">
          {notes.map((note) => (
            <div key={note.id} className="flex items-start gap-2">
              <div className="mt-2 text-brand-gold">•</div>
              <input 
                type="text" 
                value={note.text} 
                onChange={(e) => updateNote(note.id, e.target.value)} 
                className="flex-1 p-2 border border-transparent hover:border-gray-200 focus:border-brand-gold focus:bg-white bg-gray-50 rounded outline-none transition-colors" 
              />
              <button onClick={() => removeNote(note.id)} className="p-2 text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
