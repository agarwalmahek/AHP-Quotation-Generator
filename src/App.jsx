import { useState } from 'react';
import EditorPanel from './components/EditorPanel';
import PreviewPanel from './components/PreviewPanel';

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
    { id: 3, text: 'Payment terms- Upon bill submission.' }
  ]);

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
      filename:     `Quotation_${recipient.organization || 'AakarshanHomePlus'}.pdf`,
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
    <div className="min-h-screen flex flex-col lg:flex-row lg:h-screen lg:overflow-hidden bg-gray-50">
      {/* Left side: Editor */}
      <div className="w-full lg:w-1/2 p-4 lg:p-8 lg:h-full lg:overflow-y-auto custom-scrollbar border-b lg:border-b-0 lg:border-r border-gray-200">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-brand-charcoal">Quotation Editor</h1>
            <button
              onClick={handleDownload}
              className="bg-brand-gold hover:bg-brand-gold-light text-white font-semibold py-2 px-6 rounded-md shadow-md transition duration-300"
            >
              Download PDF
            </button>
          </div>
          
          <EditorPanel 
            recipient={recipient} 
            setRecipient={setRecipient}
            items={items}
            setItems={setItems}
            notes={notes}
            setNotes={setNotes}
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
    </div>
  );
}

export default App;
