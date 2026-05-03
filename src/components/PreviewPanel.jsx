import React, { useRef, useEffect, useState } from 'react';
import { Phone, Mail, Globe, MapPin } from 'lucide-react';

export default function PreviewPanel({ recipient, items, notes }) {
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const targetWidth = 794; // approx 210mm in pixels at 96dpi
        const padding = 32; // padding inside the container
        const availableWidth = containerWidth - padding;
        
        // Scale down if container is smaller than A4
        const newScale = Math.min(availableWidth / targetWidth, 1);
        setScale(newScale);
      }
    };

    // Initial scale and add resize listener
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Calculate Grand Total
  const grandTotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);

  // Format date to local string (e.g., DD/MM/YYYY)
  const formattedDate = recipient.date ? new Date(recipient.date).toLocaleDateString('en-IN', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }) : '';

  return (
    <div ref={containerRef} className="w-full flex justify-center mb-8">
      {/* Scaled Layout Wrapper */}
      <div 
        style={{ 
          width: `${794 * scale}px`, 
          minHeight: `${1122 * scale}px` 
        }}
        className="relative"
      >
        {/* A4 Container */}
        <div 
          className="absolute top-0 left-0 origin-top-left shadow-2xl bg-white print:shadow-none font-body text-brand-charcoal flex flex-col"
          style={{ 
            transform: `scale(${scale})`, 
            width: '210mm', 
            minHeight: '297mm' 
          }}
        >
          {/* Target div for html2pdf */}
          <div id="pdf-preview" className="relative flex-1" style={{ padding: '15mm 15mm' }}>
        
        {/* HEADER */}
        <header className="pb-6 mb-8 flex justify-between items-start">
          {/* Left: Logo Image */}
          <div className="flex-shrink-0">
            <img src="/logo.png" alt="Aakarshan Home+ Logo" className="w-64 object-contain" />
          </div>

          {/* Right: Contact Info */}
          <div className="flex-1 flex flex-col items-end text-right space-y-1.5 text-[14px] text-brand-charcoal pt-2">
            <div className="text-[#c79c3d] text-lg mb-1 tracking-wide">8986655533 / 9334800533</div>
            <div>aakarshanhomeplus@gmail.com</div>
            <div>aakarshanhomeplus.com</div>
            <div className="pt-2">Maharaja Mansion, Kharkai Link Road</div>
            <div>Bistupur - 831001</div>
            <div className="text-gray-500 pt-2">GST: 20ABQFA9712L1Z8</div>
            <div className="text-gray-500">UDYAM: UDYAM-JH-06-0026526</div>
          </div>
        </header>

        {/* RECIPIENT & SUBJECT */}
        <section className="mb-8 flex justify-between items-end">
          <div className="space-y-1">
            <p className="text-sm font-semibold text-brand-gold">Billed To,</p>
            <p className="text-lg font-heading font-bold text-brand-charcoal">{recipient.to || 'Recipient Name'}</p>
            {recipient.organization && <p className="text-sm">{recipient.organization}</p>}
            {recipient.address && <p className="text-sm text-gray-600">{recipient.address}</p>}
            {recipient.phone && <p className="text-sm text-gray-600">Phone: {recipient.phone}</p>}
            {recipient.clientGst && <p className="text-sm text-gray-600">GSTIN: {recipient.clientGst}</p>}
          </div>
          <div className="text-right space-y-1">
            {recipient.quotationNumber && (
              <p className="text-sm"><span className="font-semibold text-brand-gold">Quotation #:</span> {recipient.quotationNumber}</p>
            )}
            <p className="text-sm"><span className="font-semibold text-brand-gold">Quotation Date:</span> {formattedDate}</p>
          </div>
        </section>

        {recipient.subject && (
          <div className="mb-8 bg-gray-50 p-3 border-l-4 border-brand-gold">
            <p className="text-sm"><span className="font-semibold">Subject:</span> {recipient.subject}</p>
          </div>
        )}

        {/* ITEMS TABLE */}
        <section className="mb-8">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="bg-brand-gold text-white font-heading tracking-wide">
                <th className="py-2 px-4 border border-brand-gold w-12 text-center text-sm">Sn.</th>
                <th className="py-2 px-4 border border-brand-gold text-sm">Particular</th>
                <th className="py-2 px-4 border border-brand-gold w-16 text-center text-sm">Qty</th>
                <th className="py-2 px-4 border border-brand-gold w-24 text-right text-sm">Rate (₹)</th>
                <th className="py-2 px-4 border border-brand-gold w-20 text-center text-sm whitespace-nowrap">Disc. (%)</th>
                <th className="py-2 px-4 border border-brand-gold w-28 text-right text-sm">Total (₹)</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id} className={`break-inside-avoid ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="py-3 px-4 border border-gray-200 text-center text-sm text-gray-500">{idx + 1}</td>
                  <td className="py-3 px-4 border border-gray-200 text-sm font-medium">{item.particular}</td>
                  <td className="py-3 px-4 border border-gray-200 text-center text-sm">{item.isLumpSum ? '-' : item.quantity}</td>
                  <td className="py-3 px-4 border border-gray-200 text-right text-sm">{item.isLumpSum ? '-' : Number(item.rate).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 border border-gray-200 text-center text-sm">{item.isLumpSum || !item.discount ? '-' : `${item.discount}%`}</td>
                  <td className="py-3 px-4 border border-gray-200 text-right text-sm font-semibold">{Number(item.total).toLocaleString('en-IN')}</td>
                </tr>
              ))}
              {/* Grand Total Row */}
              <tr className="bg-gray-100">
                <td colSpan="4" className="py-3 px-4 border border-gray-200 text-right font-heading font-bold text-brand-charcoal">Grand Total</td>
                <td colSpan="2" className="py-3 px-4 border border-gray-200 text-right font-bold text-brand-charcoal text-lg text-brand-gold-dark whitespace-nowrap">
                  ₹ {grandTotal.toLocaleString('en-IN')}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* NOTES */}
        {notes.length > 0 && (
          <section className="mb-12">
            <h3 className="font-heading font-semibold text-brand-gold mb-2 border-b border-gray-100 pb-1 inline-block">Terms & Conditions</h3>
            <ul className="space-y-1 mt-2 text-xs text-gray-700">
              {notes.map((note) => (
                <li key={note.id} className="flex items-start">
                  <span className="text-brand-gold mr-2">•</span>
                  <span>{note.text}</span>
                </li>
              ))}
            </ul>
          </section>
        )}



        {/* FOOTER */}
        <footer className="absolute bottom-0 left-0 right-0 px-15mm pb-2">
          <div className="border-t border-brand-gold pt-3 text-center">
            <p className="text-xs italic font-heading text-brand-gold-light">
              Deals in all kinds of curtains, flooring, wallpapers, sofa fabrics, blinds, mattresses, decorative items and all other home decor items.
            </p>
          </div>
        </footer>

      </div>
    </div>
      </div>
    </div>
  );
}
