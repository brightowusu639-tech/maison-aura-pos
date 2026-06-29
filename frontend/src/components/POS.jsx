import React, { useState, useEffect } from 'react';
import { 
  IconApparel, 
  IconLeather, 
  IconFragrance, 
  IconAccessories, 
  IconSparkles, 
  IconCart, 
  IconBag, 
  IconGift, 
  IconClose, 
  IconPrint,
  IconSearch,
  IconTrash,
  IconGem
} from './Icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function POS({ addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);
  
  // Cart state
  const [cart, setCart] = useState([]);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [taxPercent] = useState(10); // Standard 10% tax rate

  // Client & Gift state
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState('');
  const [giftWrapFee, setGiftWrapFee] = useState(0);

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [checkoutResult, setCheckoutResult] = useState(null);

  // SMS Receipt states
  const [smsPhone, setSmsPhone] = useState('');
  const [sendingSms, setSendingSms] = useState(false);

  useEffect(() => {
    if (checkoutResult) {
      setSmsPhone(checkoutResult.customerPhone || '');
    } else {
      setSmsPhone('');
    }
  }, [checkoutResult]);

  const handleSendSMS = async () => {
    if (!smsPhone.trim()) {
      addToast('Please enter a valid phone number', 'warning');
      return;
    }
    try {
      setSendingSms(true);
      const res = await fetch(`${API_BASE_URL}/api/sales/${checkoutResult.id}/sms`, {
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
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed to load products');
      const data = await res.json();
      setProducts(data);
      
      // Extract unique categories
      const cats = [...new Set(data.map(p => p.category))];
      setCategories(cats);
    } catch (error) {
      console.error(error);
      addToast('Error retrieving product catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Add item to cart
  const addToCart = (product) => {
    if (product.stock <= 0) {
      addToast(`${product.name} is currently out of stock!`, 'error');
      return;
    }

    const existingIndex = cart.findIndex(item => item.productId === product.id);
    
    if (existingIndex > -1) {
      const currentQty = cart[existingIndex].quantity;
      if (currentQty >= product.stock) {
        addToast(`Cannot add more. Only ${product.stock} items available in stock.`, 'warning');
        return;
      }
      const updatedCart = [...cart];
      updatedCart[existingIndex].quantity += 1;
      setCart(updatedCart);
    } else {
      setCart([...cart, {
        productId: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        cost: product.cost,
        quantity: 1,
        stock: product.stock // keep track of max stock limit
      }]);
    }
    addToast(`${product.name} added to cart`, 'success');
  };

  // Update item quantity in cart
  const updateQty = (productId, delta) => {
    const updatedCart = cart.map(item => {
      if (item.productId === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return null;
        if (newQty > item.stock) {
          addToast(`Maximum stock limit reached (${item.stock})`, 'warning');
          return item;
        }
        return { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean);
    
    setCart(updatedCart);
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    addToast('Cart cleared', 'info');
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discountVal = (subtotal * (discountPercent / 100));
  const taxableAmount = Math.max(0, subtotal - discountVal);
  const taxVal = taxableAmount * (taxPercent / 100);
  const total = taxableAmount + taxVal + parseFloat(giftWrapFee || 0);

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Open checkout modal
  const handleOpenCheckout = () => {
    setAmountPaid(total.toFixed(2));
    setPaymentMethod('cash');
    setShowCheckoutModal(true);
  };

  // Run transaction checkout API
  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    const paid = parseFloat(amountPaid) || 0;
    const change = Math.max(0, paid - total);

    if (paymentMethod === 'cash' && paid < total) {
      addToast('Paid amount is less than the transaction total', 'error');
      return;
    }

    try {
      const salePayload = {
        items: cart.map(item => ({
          productId: item.productId,
          name: item.name,
          price: item.price,
          cost: item.cost,
          quantity: item.quantity,
          size: item.size || 'O/S',
          color: item.color || 'N/A'
        })),
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discountVal.toFixed(2)),
        tax: parseFloat(taxVal.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        paymentMethod,
        amountPaid: paymentMethod === 'cash' ? paid : total,
        changeDue: paymentMethod === 'cash' ? parseFloat(change.toFixed(2)) : 0,
        customerName,
        customerEmail,
        customerPhone,
        isGift,
        giftMessage,
        giftWrapFee: parseFloat(giftWrapFee || 0)
      };

      const res = await fetch(`${API_BASE_URL}/api/sales`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(salePayload)
      });

      if (!res.ok) throw new Error('Transaction submission failed');
      const savedSale = await res.json();
      
      setCheckoutResult(savedSale);
      setShowCheckoutModal(false);
      setCart([]);
      setDiscountPercent(0);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setIsGift(false);
      setGiftMessage('');
      setGiftWrapFee(0);
      addToast('Transaction completed successfully!', 'success');
      
      // Refresh inventory stock amounts
      fetchProducts();
    } catch (error) {
      console.error(error);
      addToast('Transaction checkout error', 'error');
    }
  };

  // Mock receipt trigger
  const handlePrintReceipt = () => {
    const w = window.open('', '_blank', 'width=450,height=650');
    w.document.write(`
      <html>
      <head>
        <title>Receipt - Maison Aura</title>
        <style>
          body { font-family: 'Playfair Display', Georgia, monospace; padding: 20px; color: #222; font-size: 14px; background: #fff; }
          .center { text-align: center; }
          .brand { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
          .subtitle { font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-bottom: 10px; }
          .divider { border-top: 1px dashed #aaa; margin: 12px 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 6px; }
          .footer { text-align: center; margin-top: 25px; font-size: 11px; color: #555; line-height: 1.4; }
          .client-box { font-size: 12px; margin: 8px 0; border: 1px solid #eee; padding: 8px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="brand">MAISON AURA</div>
          <div class="subtitle">Luxury Boutique Terminal</div>
          <p style="font-size: 12px; margin: 2px 0;">123 High Street, Business District</p>
          <p style="font-size: 12px; margin: 2px 0;">Tel: (555) 019-2834</p>
        </div>
        <div class="divider"></div>
        <p style="font-size: 12px; margin: 4px 0;"><strong>Receipt ID:</strong> ${checkoutResult?.id}</p>
        <p style="font-size: 12px; margin: 4px 0;"><strong>Date:</strong> ${new Date(checkoutResult?.timestamp).toLocaleString()}</p>
        <p style="font-size: 12px; margin: 4px 0;"><strong>Concierge:</strong> Salon Representative</p>
        
        ${checkoutResult?.customerName ? `
          <div class="client-box">
            <strong>Client Account Details:</strong><br/>
            Name: ${checkoutResult.customerName}<br/>
            ${checkoutResult.customerEmail ? `Email: ${checkoutResult.customerEmail}<br/>` : ''}
            ${checkoutResult.customerPhone ? `Phone: ${checkoutResult.customerPhone}` : ''}
          </div>
        ` : ''}

        ${checkoutResult?.isGift ? `
          <div class="client-box" style="background-color: #faf8f5; border-color: #e5dccb;">
            <strong>🎁 Gift Preparation:</strong><br/>
            Wrap: ${checkoutResult.giftWrapFee > 0 ? 'Premium Signature Gift Box' : 'Complimentary Ribbon'}<br/>
            ${checkoutResult.giftMessage ? `Message: "${checkoutResult.giftMessage}"` : ''}
          </div>
        ` : ''}

        <div class="divider"></div>
        <div class="row" style="font-weight: bold; font-size: 12px; text-transform: uppercase;">
          <span>Item Details</span>
          <span>Qty x Price</span>
          <span>Total</span>
        </div>
        ${checkoutResult?.items.map(item => `
          <div class="row" style="font-size: 13px;">
            <span>${item.name} ${item.size && item.size !== 'O/S' ? `(${item.size})` : ''}</span>
            <span>${item.quantity} x GH₵${item.price.toFixed(2)}</span>
            <span>GH₵${(item.quantity * item.price).toFixed(2)}</span>
          </div>
        `).join('')}
        <div class="divider"></div>
        <div class="row"><span>Subtotal:</span> <span>GH₵${checkoutResult?.subtotal.toFixed(2)}</span></div>
        <div class="row"><span>Discount:</span> <span>-GH₵${checkoutResult?.discount.toFixed(2)}</span></div>
        <div class="row"><span>Sales Tax (10%):</span> <span>GH₵${checkoutResult?.tax.toFixed(2)}</span></div>
        ${checkoutResult?.giftWrapFee > 0 ? `<div class="row"><span>Gift Packaging:</span> <span>GH₵${checkoutResult.giftWrapFee.toFixed(2)}</span></div>` : ''}
        <div class="row" style="font-weight: bold; font-size: 15px; border-top: 1px double #999; padding-top: 5px; margin-top: 5px;">
          <span>GRAND TOTAL:</span>
          <span>GH₵${checkoutResult?.total.toFixed(2)}</span>
        </div>
        <div class="divider"></div>
        <div class="row"><span>Payment Method:</span> <span>${checkoutResult?.paymentMethod.toUpperCase()}</span></div>
        <div class="row"><span>Amount Tendered:</span> <span>GH₵${checkoutResult?.amountPaid.toFixed(2)}</span></div>
        <div class="row"><span>Change Returned:</span> <span>GH₵${checkoutResult?.changeDue.toFixed(2)}</span></div>
        <div class="divider"></div>
        <div class="footer">
          <p>THANK YOU FOR PATRONIZING MAISON AURA</p>
          <p style="font-weight: bold;">GOODS BOUGHT FROM THIS SHOP ARE NOT RETURNABLE</p>
        </div>
        <script>window.print();</script>
      </body>
      </html>
    `);
    w.document.close();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val);
  };

  return (
    <div className="pos-layout">
      
      {/* Products Catalog Screen (Left Side) */}
      <div className="pos-products-container">
        
        {/* Search and Category Filtering Row */}
        <div className="controls-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          
          <select
            className="category-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Product Cards Grid */}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Loading catalog...</span>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-placeholder">
            <IconSearch size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <span style={{ fontWeight: 500 }}>No products match filters</span>
          </div>
        ) : (
          <div className="products-grid">
            {filteredProducts.map(p => {
              const inCartItem = cart.find(item => item.productId === p.id);
              const remainingStock = p.stock - (inCartItem ? inCartItem.quantity : 0);
              const isLowStock = p.stock <= p.lowStockThreshold;

              return (
                <div 
                  key={p.id}
                  className={`product-card ${remainingStock <= 0 ? 'out-of-stock' : ''} ${isLowStock ? 'low-stock' : ''}`}
                  onClick={() => remainingStock > 0 && addToCart(p)}
                >
                  <div className="product-avatar" style={{ overflow: 'hidden', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {p.image ? (
                      <img 
                        src={p.image} 
                        alt={p.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                      />
                    ) : (
                      p.category === 'Apparel' ? <IconApparel size={20} /> : 
                      p.category === 'Leather Goods' ? <IconLeather size={20} /> : 
                      p.category === 'Accessories' ? <IconAccessories size={20} /> : 
                      p.category === 'Fragrances' ? <IconFragrance size={20} /> : <IconSparkles size={20} />
                    )}
                  </div>
                  
                  <div className="product-card-details">
                    <span className="product-card-name" title={p.name}>{p.name}</span>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '2px', flexWrap: 'wrap' }}>
                      <span className="product-card-category">{p.category}</span>
                      {p.size && <span className="product-card-category" style={{ background: 'rgba(255,255,255,0.05)', padding: '0 4px', borderRadius: '3px' }}>{p.size}</span>}
                      {p.color && <span className="product-card-category" style={{ background: 'rgba(255,255,255,0.05)', padding: '0 4px', borderRadius: '3px' }}>{p.color}</span>}
                    </div>
                  </div>

                  <div className="product-card-footer">
                    <span className="product-card-price">{formatCurrency(p.price)}</span>
                    <span className="product-card-stock" title="Available stock">
                      {remainingStock > 0 ? `${remainingStock} left` : 'Out of Stock'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* POS Cart Sidebar (Right Side) */}
      <div className="cart-panel">
        <div className="cart-header">
          <span className="cart-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <IconCart size={18} /> Checkout Cart ({cart.reduce((sum, i) => sum + i.quantity, 0)})
          </span>
          {cart.length > 0 && (
            <button className="clear-cart-btn" style={{ display: 'flex', alignItems: 'center', gap: '4px' }} onClick={clearCart}>
              <IconTrash size={14} /> Clear
            </button>
          )}
        </div>

        {/* Cart items list */}
        <div className="cart-items">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <IconBag size={48} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
              <span>Cart is empty</span>
              <span style={{ fontSize: '11px', textAlign: 'center' }}>Click products on the left to add items to your sale</span>
            </div>
          ) : (
            cart.map(item => (
              <div className="cart-item" key={item.productId}>
                <div className="cart-item-info">
                  <span className="cart-item-name" title={item.name}>{item.name}</span>
                  <span className="cart-item-price">{formatCurrency(item.price)}</span>
                </div>
                
                <div className="cart-item-qty-control">
                  <button className="qty-btn" onClick={() => updateQty(item.productId, -1)}>-</button>
                  <span className="qty-val">{item.quantity}</span>
                  <button className="qty-btn" onClick={() => updateQty(item.productId, 1)}>+</button>
                </div>
                
                <span className="cart-item-total">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))
          )}
        </div>

        {/* Customer Loyalty & Gifting Section */}
        {cart.length > 0 && (
          <div className="cart-metadata-section" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary)', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IconGem size={14} /> Customer & Gift Details
            </span>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '8px', fontSize: '12px' }}
                placeholder="Client Name" 
                value={customerName} 
                onChange={(e) => setCustomerName(e.target.value)} 
              />
              <input 
                type="email" 
                className="form-input" 
                style={{ padding: '8px', fontSize: '12px' }}
                placeholder="Client Email" 
                value={customerEmail} 
                onChange={(e) => setCustomerEmail(e.target.value)} 
              />
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '8px', fontSize: '12px' }}
                placeholder="Client Phone" 
                value={customerPhone} 
                onChange={(e) => setCustomerPhone(e.target.value)} 
              />
            </div>

            <div style={{ borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '12px', color: 'var(--text-secondary)' }}>
                <input 
                  type="checkbox" 
                  checked={isGift} 
                  onChange={(e) => {
                    setIsGift(e.target.checked);
                    if (!e.target.checked) {
                      setGiftMessage('');
                      setGiftWrapFee(0);
                    } else {
                      setGiftWrapFee(5); // default $5 premium package
                    }
                  }} 
                />
                Prepare as Gift Package
              </label>

              {isGift && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginLeft: '22px', marginTop: '4px' }}>
                  <select 
                    className="form-select" 
                    style={{ padding: '6px', fontSize: '11px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
                    value={giftWrapFee}
                    onChange={(e) => setGiftWrapFee(parseFloat(e.target.value))}
                  >
                    <option value="0">Complimentary Wrap ($0.00)</option>
                    <option value="5">Premium Signature Box ($5.00)</option>
                  </select>
                  <textarea 
                    className="form-input" 
                    style={{ padding: '6px', fontSize: '11px', height: '48px', resize: 'none' }}
                    placeholder="Engrave a gift message..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Totals & Checkout Actions */}
        <div className="cart-totals-section">
          <div className="totals-row">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>

          <div className="totals-row" style={{ alignItems: 'center' }}>
            <span>Discount (%):</span>
            <div className="discount-row-input">
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                placeholder="0"
                onChange={(e) => setDiscountPercent(Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
              />
            </div>
          </div>

          {discountPercent > 0 && (
            <div className="totals-row">
              <span style={{ color: 'var(--danger)' }}>Discount Amount:</span>
              <span style={{ color: 'var(--danger)' }}>-{formatCurrency(discountVal)}</span>
            </div>
          )}

          <div className="totals-row">
            <span>Tax ({taxPercent}%):</span>
            <span>{formatCurrency(taxVal)}</span>
          </div>

          {giftWrapFee > 0 && (
            <div className="totals-row">
              <span>Gift Box Packaging:</span>
              <span>{formatCurrency(giftWrapFee)}</span>
            </div>
          )}

          <div className="totals-row grand-total">
            <span>Grand Total:</span>
            <span>{formatCurrency(total)}</span>
          </div>

          <button 
            className="checkout-btn"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            disabled={cart.length === 0}
            onClick={handleOpenCheckout}
          >
            <IconBag size={18} /> Complete Order
          </button>
        </div>
      </div>

      {/* Checkout Input Modal */}
      {showCheckoutModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleConfirmCheckout}>
            <div className="modal-header">
              <h2 className="modal-title">Finalize Order</h2>
              <button 
                type="button" 
                className="modal-close"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                onClick={() => setShowCheckoutModal(false)}
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Payment Method</label>
              <select 
                className="form-select"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="cash">Cash Payment</option>
                <option value="card">Credit/Debit Card</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Order Grand Total</label>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--success)' }}>
                {formatCurrency(total)}
              </span>
            </div>

            {paymentMethod === 'cash' && (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="cashPaidInput">Amount Rendered (Cash)</label>
                  <input
                    id="cashPaidInput"
                    type="number"
                    step="0.01"
                    min={total}
                    className="form-input"
                    value={amountPaid}
                    onChange={(e) => setAmountPaid(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Balance Change Due</label>
                  <span style={{ fontSize: '20px', fontWeight: 700, color: 'var(--warning)' }}>
                    {formatCurrency(Math.max(0, (parseFloat(amountPaid) || 0) - total))}
                  </span>
                </div>
              </>
            )}

            {paymentMethod === 'card' && (
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Swipe or insert customer card on external payment terminal. Confirm terminal authorization before clicking Checkout.
              </p>
            )}

            <div className="form-actions">
              <button 
                type="button" 
                className="btn secondary"
                onClick={() => setShowCheckoutModal(false)}
              >
                Go Back
              </button>
              <button type="submit" className="btn success">
                Process Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transaction Receipt Printout Modal */}
      {checkoutResult && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '420px', padding: '24px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Transaction Completed</h2>
            </div>
            
            <div className="receipt-wrapper" style={{ background: '#fff', color: '#222', borderRadius: '4px' }}>
              <div className="receipt-header">
                <span className="receipt-store-name" style={{ fontFamily: 'var(--font-serif)', fontWeight: 'bold' }}>MAISON AURA</span>
                <span>123 High Street, Business District</span>
                <span>Tel: (555) 019-2834</span>
              </div>
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row">
                <span>Receipt: {checkoutResult.id}</span>
              </div>
              <div className="receipt-row">
                <span>Date: {new Date(checkoutResult.timestamp).toLocaleString()}</span>
              </div>

              {checkoutResult.customerName && (
                <>
                  <div className="receipt-divider"></div>
                  <div style={{ fontSize: '12px', textAlign: 'left', padding: '2px 0' }}>
                    <strong>Client Name:</strong> {checkoutResult.customerName}
                  </div>
                  {checkoutResult.customerEmail && (
                    <div style={{ fontSize: '11px', textAlign: 'left', color: '#666' }}>
                      <strong>Email:</strong> {checkoutResult.customerEmail}
                    </div>
                  )}
                </>
              )}

              {checkoutResult.isGift && (
                <>
                  <div className="receipt-divider"></div>
                  <div style={{ fontSize: '12px', textAlign: 'left', padding: '6px', background: '#faf8f5', border: '1px solid #e5dccb', borderRadius: '4px' }}>
                    <strong>Gift Wrapped</strong><br/>
                    Style: {checkoutResult.giftWrapFee > 0 ? 'Premium Signature Gift Box' : 'Complimentary Wrap'}<br/>
                    {checkoutResult.giftMessage && <span style={{ fontSize: '11px', fontStyle: 'italic', color: '#555' }}>Message: "{checkoutResult.giftMessage}"</span>}
                  </div>
                </>
              )}
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-items-header">ITEMS SOLD:</div>
              {checkoutResult.items.map((item, index) => (
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
                <span>{formatCurrency(checkoutResult.subtotal)}</span>
              </div>
              <div className="receipt-row">
                <span>Discount:</span>
                <span>-{formatCurrency(checkoutResult.discount)}</span>
              </div>
              <div className="receipt-row">
                <span>Sales Tax:</span>
                <span>{formatCurrency(checkoutResult.tax)}</span>
              </div>
              {checkoutResult.giftWrapFee > 0 && (
                <div className="receipt-row">
                  <span>Gift Box Packaging:</span>
                  <span>{formatCurrency(checkoutResult.giftWrapFee)}</span>
                </div>
              )}
              
              <div className="receipt-divider"></div>
              
              <div className="receipt-row" style={{ fontWeight: 'bold' }}>
                <span>TOTAL PAID:</span>
                <span>{formatCurrency(checkoutResult.total)}</span>
              </div>
              <div className="receipt-row">
                <span>Payment:</span>
                <span>{checkoutResult.paymentMethod.toUpperCase()}</span>
              </div>
              {checkoutResult.paymentMethod === 'cash' && (
                <>
                  <div className="receipt-row">
                    <span>Cash Tendered:</span>
                    <span>{formatCurrency(checkoutResult.amountPaid)}</span>
                  </div>
                  <div className="receipt-row">
                    <span>Change Returned:</span>
                    <span>{formatCurrency(checkoutResult.changeDue)}</span>
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
                style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}
                onClick={handlePrintReceipt}
              >
                <IconPrint size={14} /> Open Print Page
              </button>
              <button 
                type="button" 
                className="btn primary"
                onClick={() => {
                  setCheckoutResult(null);
                  setSmsPhone('');
                }}
              >
                Close & Clear
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
