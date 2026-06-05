import { useState, useEffect } from 'react';
import { Save, Plus } from 'lucide-react';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';

const getNextQuotationNumber = (list) => {
  if (!list || list.length === 0) {
    return 'QTN-0001';
  }
  const numbers = list
    .map(q => {
      const numStr = q.recipient?.quotationNumber;
      if (!numStr) return null;
      const match = numStr.match(/QTN-(\d+)/i);
      return match ? parseInt(match[1], 10) : null;
    })
    .filter(n => n !== null);

  if (numbers.length === 0) {
    return 'QTN-0001';
  }
  const maxNumber = Math.max(...numbers);
  const nextNumber = maxNumber + 1;
  return `QTN-${String(nextNumber).padStart(4, '0')}`;
};

function App() {
  const [recipient, setRecipient] = useState({
    quotationNumber: 'QTN-0001',
    to: '',
    phone: '',
    clientGst: '',
    organization: '',
    address: '',
    date: new Date().toISOString().split('T')[0],
    subject: 'Quotation for furnishing items as required.',
  });

  const [items, setItems] = useState([
    { id: 1, particular: '', description: '', quantity: 1, rate: 0, discount: 0, total: 0, isLumpSum: false }
  ]);

  const [notes, setNotes] = useState([
    { id: 1, text: 'Rates are inclusive of GST.' },
    { id: 2, text: 'Warranty applicable as per company guidelines.' },
    { id: 3, text: 'Payment Terms - 50% advance and 50% before delivery.' }
  ]);

  const [savedQuotations, setSavedQuotations] = useState([]);
  const [toast, setToast] = useState(null);

  // Load saved quotations on mount
  useEffect(() => {
    try {
      const list = JSON.parse(localStorage.getItem('ahp_quotations') || '[]');
      setSavedQuotations(list);
      
      const nextQuotationNumber = getNextQuotationNumber(list);
      setRecipient(prev => ({
        ...prev,
        quotationNumber: nextQuotationNumber
      }));
    } catch (e) {
      console.error('Failed to parse saved quotations from localStorage', e);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSave = () => {
    try {
      const list = JSON.parse(localStorage.getItem('ahp_quotations') || '[]');
      const newQuotation = {
        id: recipient.quotationNumber || `QTN-${Date.now()}`,
        recipient,
        items,
        notes,
        updatedAt: new Date().toISOString(),
      };
      
      const updatedList = list.filter(q => q.recipient.quotationNumber !== recipient.quotationNumber);
      updatedList.unshift(newQuotation);
      
      localStorage.setItem('ahp_quotations', JSON.stringify(updatedList));
      setSavedQuotations(updatedList);
      showToast(`Quotation ${recipient.quotationNumber} saved successfully!`);
    } catch (e) {
      console.error(e);
      showToast('Failed to save quotation', 'error');
    }
  };

  const handleNew = () => {
    const list = JSON.parse(localStorage.getItem('ahp_quotations') || '[]');
    const nextQuotationNumber = getNextQuotationNumber(list);
    setRecipient({
      quotationNumber: nextQuotationNumber,
      to: '',
      phone: '',
      clientGst: '',
      organization: '',
      address: '',
      date: new Date().toISOString().split('T')[0],
      subject: 'Quotation for furnishing items as required.',
    });
    setItems([
      { id: 1, particular: '', description: '', quantity: 1, rate: 0, discount: 0, total: 0, isLumpSum: false }
    ]);
    setNotes([
      { id: 1, text: 'Rates are inclusive of GST.' },
      { id: 2, text: 'Warranty applicable as per company guidelines.' },
      { id: 3, text: 'Payment Terms - 50% advance and 50% before delivery.' }
    ]);
    showToast('Started a new quotation form');
  };

  const handleLoad = (quotation) => {
    setRecipient(quotation.recipient);
    setItems(quotation.items);
    setNotes(quotation.notes);
    showToast(`Loaded quotation ${quotation.recipient.quotationNumber}`);
  };

  const handleDelete = (quotationNumber) => {
    if (window.confirm(`Are you sure you want to delete quotation ${quotationNumber}?`)) {
      try {
        const list = JSON.parse(localStorage.getItem('ahp_quotations') || '[]');
        const updatedList = list.filter(q => q.recipient.quotationNumber !== quotationNumber);
        localStorage.setItem('ahp_quotations', JSON.stringify(updatedList));
        setSavedQuotations(updatedList);
        showToast(`Quotation ${quotationNumber} deleted`);
      } catch (e) {
        console.error(e);
        showToast('Failed to delete quotation', 'error');
      }
    }
  };

  const handleDownload = async () => {
    const element = document.getElementById('pdf-preview');
    
    // Store original styles to restore later
    const originalPadding = element.style.padding;
    const originalHeight = element.style.height;
    const originalMinHeight = element.style.minHeight;
    const originalClasses = element.className;
    
    // Temporarily modify styles to calculate true content height
    element.className = element.className.replace('h-full', 'h-auto');
    element.style.padding = '0 15mm';
    element.style.minHeight = '0'; // Remove any inherited min-heights

    // Calculate required height to push footer to the bottom of the last page
    const contentPx = element.scrollHeight;
    const mmToPx = 96 / 25.4;
    const pageHeightPx = 267 * mmToPx; // 267mm is the usable height (297mm A4 - 15mm top - 15mm bottom margin)
    
    // Force the element height to exactly match the multiple of A4 usable pages
    const totalPages = Math.max(1, Math.ceil(contentPx / pageHeightPx));
    element.style.height = `${totalPages * 267}mm`;

    // Helper: strip white background from an img element using canvas
    const makeLogoTransparent = (imgEl) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(imgEl, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        // Make near-white pixels transparent
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i], g = data[i + 1], b = data[i + 2];
          if (r > 230 && g > 230 && b > 230) {
            data[i + 3] = 0; // transparent
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      });
    };

    const opt = {
      margin:       [15, 0, 15, 0], // Top, Left, Bottom, Right
      filename:     `AHP - ${recipient.to || 'Client'}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true,
        onclone: async (clonedDoc) => {
          // Find all logo images in the cloned document and replace with transparent version
          const logoImgs = clonedDoc.querySelectorAll('img[alt="Aakarshan Home+ Logo"]');
          const originalLogoImgs = document.querySelectorAll('img[alt="Aakarshan Home+ Logo"]');
          for (let i = 0; i < logoImgs.length; i++) {
            if (originalLogoImgs[i]) {
              const transparentSrc = await makeLogoTransparent(originalLogoImgs[i]);
              logoImgs[i].src = transparentSrc;
              logoImgs[i].style.mixBlendMode = 'normal';
            }
          }
        }
      },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak:    { mode: 'css', avoid: 'tr' }
    };

    // Generate PDF and wait for completion
    await window.html2pdf().set(opt).from(element).save();

    // Restore original styles for the web preview
    element.style.padding = originalPadding || '15mm 15mm';
    element.style.height = originalHeight || '';
    element.style.minHeight = originalMinHeight || '';
    element.className = originalClasses;
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-gray-50 relative">
      {/* Left side: Editor */}
      <div className="w-full lg:w-1/2 p-4 lg:p-8 lg:h-full lg:overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="max-w-2xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
            <h1 className="text-3xl font-heading font-bold text-brand-charcoal">AHP Quotation Editor</h1>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleNew}
                className="bg-white hover:bg-gray-50 text-brand-charcoal font-semibold py-2 px-4 rounded-md shadow-sm border border-gray-200 transition duration-300 text-sm flex items-center gap-1.5"
              >
                <Plus size={16} /> New
              </button>
              <button
                onClick={handleSave}
                className="bg-brand-charcoal hover:bg-black text-white font-semibold py-2 px-4 rounded-md shadow-md transition duration-300 text-sm flex items-center gap-1.5"
              >
                <Save size={16} /> Save
              </button>
              <button
                onClick={handleDownload}
                className="bg-brand-gold hover:bg-brand-gold-light text-white font-semibold py-2 px-6 rounded-md shadow-md transition duration-300 text-sm"
              >
                Download PDF
              </button>
            </div>
          </div>
          
          <EditorPanel 
            recipient={recipient} 
            setRecipient={setRecipient}
            items={items}
            setItems={setItems}
            notes={notes}
            setNotes={setNotes}
            savedQuotations={savedQuotations}
            handleLoad={handleLoad}
            handleDelete={handleDelete}
          />
        </div>
      </div>

      {/* Right side: Live Preview */}
      <div className="w-full lg:w-1/2 p-4 lg:p-8 lg:h-full lg:overflow-auto bg-gray-200 custom-scrollbar">
        <PreviewPanel 
          recipient={recipient}
          items={items}
          notes={notes}
        />
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center p-4 rounded-lg shadow-lg border transition-all duration-300 transform translate-y-0 ${
          toast.type === 'success' 
            ? 'bg-brand-charcoal border-brand-gold text-white' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping"></span>
            <span className="text-sm font-semibold font-body">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
