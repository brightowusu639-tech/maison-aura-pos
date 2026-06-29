import React, { useState, useEffect } from 'react';
import { IconDownload, IconSearch, IconEye, IconClose, IconPrint } from './Icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function Reports({ addToast }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Selected sale for modal detail view
  const [selectedSale, setSelectedSale] = useState(null);
  const [smsPhone, setSmsPhone] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    if (selectedSale) {
      setSmsPhone(selectedSale.customerPhone || '');
    } else {
      setSmsPhone('');
    }
  }, [selectedSale]);

  const handleSendSMS = async () => {
    if (!smsPhone.trim()) {
      addToast('Please enter a valid phone number', 'warning');
      return;
    }
    try {
      setSendingSms(true);
      const res = await fetch(`${API_BASE_URL}/api/sales/${selectedSale.id}/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: smsPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to dispatch receipt SMS');
      addToast(`Receipt SMS sent to ${smsPhone} successfully!`, 'success');
    } catch (error) {
      console.error(error);
      addToast(error.message, 'error');
    } finally {
      setSendingSms(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/sales`);
      if (!res.ok) throw new Error('Failed to load transaction history');
      const data = await res.json();
      setSales(data);
    } catch (error) {
      console.error(error);
      addToast('Error loading transaction history logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Compile and download transaction CSV
  const handleExportCSV = () => {
    if (sales.length === 0) {
      addToast('No transaction logs available to export', 'warning');
      return;
    }

    const headers = ['Sale ID', 'Timestamp', 'Client Name', 'Client Email', 'Client Phone', 'Is Gift', 'Gift Message', 'Payment Method', 'Items Count', 'Subtotal', 'Discount', 'Tax', 'Gift Box Fee', 'Total Paid'];
    const rows = sales.map(s => [
      s.id,
      new Date(s.timestamp).toLocaleString(),
      s.customerName || 'Walk-in Client',
      s.customerEmail || '',
      s.customerPhone || '',
      s.isGift ? 'Yes' : 'No',
      (s.giftMessage || '').replace(/"/g, '""').replace(/,/g, ' '),
      s.paymentMethod.toUpperCase(),
      s.items.reduce((sum, item) => sum + item.quantity, 0),
      s.subtotal.toFixed(2),
      s.discount.toFixed(2),
      s.tax.toFixed(2),
      (s.giftWrapFee || 0).toFixed(2),
      s.total.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(r => `"${r.join('","')}"`)].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `MaisonAura_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    addToast('CSV spreadsheet downloaded successfully', 'success');
  };

  // Filter list
  const filteredSales = sales.filter(s => 
    s.id.toLowerCase().includes(search.toLowerCase()) ||
    s.paymentMethod.toLowerCase().includes(search.toLowerCase()) ||
    (s.customerName && s.customerName.toLowerCase().includes(search.toLowerCase())) ||
    (s.customerEmail && s.customerEmail.toLowerCase().includes(search.toLowerCase()))
  );

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val);
  };

  return (
    <div className="panel">
      {/* Search and export bar */}
      <div className="inventory-actions-bar">
        <div style={{ flexGrow: 1, maxWidth: '400px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Search by transaction ID or payment method..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button className="btn success" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleExportCSV}>
          <IconDownload size={16} /> Export CSV Summary
        </button>
      </div>

      {/* Transaction Log Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading database ledger logs...
          </div>
        ) : filteredSales.length === 0 ? (
          <div className="empty-placeholder">
            <IconSearch size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <span>No transactions matching criteria logged in history</span>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Timestamp Date</th>
                <th>Client Profile</th>
                <th>Payment Method</th>
                <th style={{ textAlign: 'right' }}>Items Sold</th>
                <th style={{ textAlign: 'right' }}>Discount</th>
                <th style={{ textAlign: 'right' }}>Sales Tax</th>
                <th style={{ textAlign: 'right' }}>Grand Total</th>
                <th style={{ textAlign: 'center' }}>Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(s => {
                const qtySold = s.items.reduce((sum, i) => sum + i.quantity, 0);

                return (
                  <tr key={s.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{s.id}</td>
                    <td>{new Date(s.timestamp).toLocaleString()}</td>
                    <td>
                      {s.customerName ? (
                        <div>
                          <div style={{ fontWeight: 600 }}>{s.customerName}</div>
                          {s.isGift && <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 600 }}>Gift Wrapped</span>}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Walk-in Client</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${s.paymentMethod === 'card' ? 'info' : 'success'}`}>
                        💳 {s.paymentMethod.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>{qtySold}</td>
                    <td style={{ textAlign: 'right', color: 'var(--danger)' }}>
                      {s.discount > 0 ? `-${formatCurrency(s.discount)}` : '-'}
                    </td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(s.tax)}</td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>
                      {formatCurrency(s.total)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                          className="btn secondary" 
                          style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => setSelectedSale(s)}
                        >
                          <IconEye size={12} /> View Order
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* View Detail Receipt Modal */}
      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Receipt Detail</h2>
              <button 
                type="button" 
                className="modal-close"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                onClick={() => setSelectedSale(null)}
              >
                <IconClose size={18} />
              </button>
            </div>
            
            <div className="receipt-wrapper" style={{ background: '#fff', color: '#222', borderRadius: '4px' }}>
              <div className="receipt-header">
                <span className="receipt-store-name" style={{ fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>MAISON AURA</span>
                <span>123 High Street, Business District</span>
                <span>Tel: (555) 019-2834</span>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row">
                <span>Receipt: {selectedSale.id}</span>
              </div>
              <div className="receipt-row">
                <span>Date: {new Date(selectedSale.timestamp).toLocaleString()}</span>
              </div>

              {selectedSale.customerName && (
                <>
                  <div className="receipt-divider"></div>
                  <div style={{ fontSize: '12px', textAlign: 'left', padding: '2px 0' }}>
                    <strong>Client Name:</strong> {selectedSale.customerName}
                  </div>
                  {selectedSale.customerEmail && (
                    <div style={{ fontSize: '11px', textAlign: 'left', color: '#666' }}>
                      <strong>Email:</strong> {selectedSale.customerEmail}
                    </div>
                  )}
                </>
              )}

              {selectedSale.isGift && (
                <>
                  <div className="receipt-divider"></div>
                  <div style={{ fontSize: '12px', textAlign: 'left', padding: '6px', background: '#faf8f5', border: '1px solid #e5dccb', borderRadius: '4px' }}>
                    <strong>Gift Wrapped</strong><br/>
                    Style: {selectedSale.giftWrapFee > 0 ? 'Premium Signature Gift Box' : 'Complimentary Wrap'}<br/>
                    {selectedSale.giftMessage && <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#555' }}>Message: "{selectedSale.giftMessage}"</span>}
                  </div>
                </>
              )}
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-items-header">ITEMS SOLD:</div>
              {selectedSale.items.map((item, index) => (
                <div className="receipt-item-line" key={index}>
                  <div className="receipt-row" style={{ fontWeight: 600 }}>
                    <span>{item.name} {item.size && item.size !== 'O/S' ? `(${item.size})` : ''}</span>
                    <span>{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                  <div className="receipt-row" style={{ fontSize: '11px', color: '#666' }}>
                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                  </div>
                </div>
              ))}
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row">
                <span>Subtotal:</span>
                <span>{formatCurrency(selectedSale.subtotal)}</span>
              </div>
              <div className="receipt-row">
                <span>Discount:</span>
                <span>-{formatCurrency(selectedSale.discount)}</span>
              </div>
              <div className="receipt-row">
                <span>Sales Tax:</span>
                <span>{formatCurrency(selectedSale.tax)}</span>
              </div>
              {selectedSale.giftWrapFee > 0 && (
                <div className="receipt-row">
                  <span>Gift Box Packaging:</span>
                  <span>{formatCurrency(selectedSale.giftWrapFee)}</span>
                </div>
              )}
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row" style={{ fontWeight: 'bold' }}>
                <span>TOTAL PAID:</span>
                <span>{formatCurrency(selectedSale.total)}</span>
              </div>
              <div className="receipt-row">
                <span>Payment:</span>
                <span>{selectedSale.paymentMethod.toUpperCase()}</span>
              </div>
              {selectedSale.paymentMethod === 'cash' && (
                <>
                  <div className="receipt-row">
                    <span>Cash Tendered:</span>
                    <span>{formatCurrency(selectedSale.amountPaid)}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Change Returned:</span>
                    <span>{formatCurrency(selectedSale.changeDue)}</span>
                  </div>
                </>
              )}
              
              <div className="receipt-divider"></div>
              <div className="receipt-footer">
                <p>THANK YOU FOR PATRONIZING MAISON AURA!</p>
                <p style={{ fontWeight: 'bold', fontSize: '10px', marginTop: '6px', letterSpacing: '0.5px' }}>GOODS BOUGHT ARE NOT RETURNABLE</p>
                <p>Maison Aura Boutique POS</p>
              </div>
            </div>

            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-color)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Send Digital Receipt via SMS</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="tel"
                  placeholder="e.g. +233241234567"
                  value={smsPhone}
                  onChange={(e) => setSmsPhone(e.target.value)}
                  className="form-input"
                  style={{ flexGrow: 1, padding: '8px 12px', fontSize: '13px' }}
                />
                <button 
                  type="button"
                  className="btn success"
                  style={{ fontSize: '13px', padding: '8px 14px' }}
                  onClick={handleSendSMS}
                  disabled={sendingSms}
                >
                  {sendingSms ? 'Sending...' : 'Send SMS'}
                </button>
              </div>
            </div>

            <div className="form-actions" style={{ marginTop: '20px' }}>
              <button 
                type="button" 
                className="btn secondary"
                onClick={() => {
                  setSelectedSale(null);
                  setSmsPhone('');
                }}
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
