import React, { useState, useEffect } from 'react';
import { IconPlus, IconEdit, IconTrash, IconClose, IconSearch } from './Icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function Inventory({ addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState([]);

  // Form modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    size: '',
    color: '',
    cost: '',
    price: '',
    stock: '',
    lowStockThreshold: '5',
    image: ''
  });

  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      addToast('Image size cannot exceed 2MB', 'warning');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image: '' }));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/products`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      setProducts(data);
      
      const cats = [...new Set(data.map(p => p.category))];
      setCategories(cats);
    } catch (error) {
      console.error(error);
      addToast('Error fetching products list', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      sku: '',
      name: '',
      category: categories[0] || 'Apparel',
      size: '',
      color: '',
      cost: '',
      price: '',
      stock: '',
      lowStockThreshold: '5',
      image: ''
    });
    setImagePreview(null);
    setShowModal(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      sku: p.sku,
      name: p.name,
      category: p.category,
      size: p.size || '',
      color: p.color || '',
      cost: p.cost.toString(),
      price: p.price.toString(),
      stock: p.stock.toString(),
      lowStockThreshold: p.lowStockThreshold.toString(),
      image: p.image || ''
    });
    setImagePreview(p.image || null);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to permanently delete this product? This cannot be undone.')) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete request failed');
      addToast('Product successfully deleted', 'success');
      fetchProducts();
    } catch (error) {
      console.error(error);
      addToast('Error deleting product', 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validations
    const cost = parseFloat(formData.cost);
    const price = parseFloat(formData.price);
    const stock = parseInt(formData.stock);
    const threshold = parseInt(formData.lowStockThreshold);

    if (isNaN(cost) || cost < 0 || isNaN(price) || price < 0) {
      addToast('Cost and Price must be positive decimal numbers', 'error');
      return;
    }
    if (isNaN(stock) || stock < 0 || isNaN(threshold) || threshold < 0) {
      addToast('Stock levels must be positive integers', 'error');
      return;
    }
    if (price < cost) {
      if (!window.confirm('Warning: Retail price is lower than purchase cost. Do you wish to proceed?')) return;
    }

    try {
      const url = editingProduct ? `${API_BASE_URL}/api/products/${editingProduct.id}` : `${API_BASE_URL}/api/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) throw new Error('Failed to save product details');
      
      addToast(editingProduct ? 'Product details updated' : 'Product successfully added', 'success');
      setShowModal(false);
      fetchProducts();
    } catch (error) {
      console.error(error);
      addToast('Error saving product records', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filtered products list
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === '' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val);
  };

  return (
    <div className="panel">
      {/* Actions and search bar */}
      <div className="inventory-actions-bar">
        <div className="action-row" style={{ flexGrow: 1, maxWidth: '600px' }}>
          <input
            type="text"
            className="search-input"
            placeholder="Filter catalog by name, SKU or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select
            className="category-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button className="btn primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }} onClick={handleOpenAdd}>
          <IconPlus size={16} /> Add New SKU
        </button>
      </div>

      {/* Products Table */}
      <div className="table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Loading inventory logs...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="empty-placeholder">
            <IconSearch size={40} style={{ color: 'var(--text-muted)', marginBottom: '12px' }} />
            <span>No catalog logs found matching criteria</span>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product Description</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Cost</th>
                <th style={{ textAlign: 'right' }}>Retail Price</th>
                <th style={{ textAlign: 'right' }}>Margin</th>
                <th style={{ textAlign: 'right' }}>Stock</th>
                <th>Status</th>
                <th style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(p => {
                const markup = p.price - p.cost;
                const marginPercent = p.price > 0 ? ((markup / p.price) * 100).toFixed(0) : 0;
                const isLowStock = p.stock <= p.lowStockThreshold;

                return (
                  <tr key={p.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{p.sku}</td>
                    <td style={{ fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {p.image && (
                          <img 
                            src={p.image} 
                            alt={p.name} 
                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }} 
                          />
                        )}
                        <div>
                          <div>{p.name}</div>
                          <div style={{ display: 'flex', gap: '6px', marginTop: '2px', fontSize: '11px', fontWeight: 'normal', color: 'var(--text-secondary)' }}>
                            {p.size && <span style={{ background: 'rgba(0,0,0,0.03)', padding: '1px 5px', borderRadius: '3px' }}>Size: {p.size}</span>}
                            {p.color && <span style={{ background: 'rgba(0,0,0,0.03)', padding: '1px 5px', borderRadius: '3px' }}>Color: {p.color}</span>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{p.category}</td>
                    <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{formatCurrency(p.cost)}</td>
                    <td style={{ textAlign: 'right', color: 'var(--success)', fontWeight: 600 }}>{formatCurrency(p.price)}</td>
                    <td style={{ textAlign: 'right', fontSize: '12px', color: markup >= 0 ? '#10b981' : '#ef4444' }}>
                      {marginPercent}%
                    </td>
                    <td style={{ 
                      textAlign: 'right', 
                      fontWeight: 700, 
                      color: p.stock === 0 ? 'var(--danger)' : isLowStock ? 'var(--warning)' : 'var(--text-primary)' 
                    }}>
                      {p.stock}
                    </td>
                    <td>
                      <span className={`badge ${p.stock === 0 ? 'danger' : isLowStock ? 'warning' : 'success'}`}>
                        {p.stock === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button 
                          className="btn secondary" 
                          style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleOpenEdit(p)}
                        >
                          <IconEdit size={12} /> Edit
                        </button>
                        <button 
                          className="btn danger" 
                          style={{ padding: '6px 10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => handleDelete(p.id)}
                        >
                          <IconTrash size={12} /> Delete
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

      {/* Add / Edit Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleSubmit}>
            <div className="modal-header">
              <h2 className="modal-title">{editingProduct ? 'Edit Product Details' : 'Add New Inventory SKU'}</h2>
              <button 
                type="button" 
                className="modal-close"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}
                onClick={() => setShowModal(false)}
              >
                <IconClose size={18} />
              </button>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="skuInput">Product SKU Code</label>
              <input
                id="skuInput"
                type="text"
                name="sku"
                className="form-input"
                placeholder="e.g. MA-SLKDRES-M"
                value={formData.sku}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="nameInput">Product Description Name</label>
              <input
                id="nameInput"
                type="text"
                name="name"
                className="form-input"
                placeholder="e.g. Silk Slip Midi Dress"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="sizeInput">Size / Sizing</label>
                <input
                  id="sizeInput"
                  type="text"
                  name="size"
                  className="form-input"
                  placeholder="e.g. M, 38, O/S"
                  value={formData.size}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="colorInput">Color Shade</label>
                <input
                  id="colorInput"
                  type="text"
                  name="color"
                  className="form-input"
                  placeholder="e.g. Champagne, Oatmeal"
                  value={formData.color}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="categorySelect">Department Category</label>
                <input
                  id="categorySelect"
                  type="text"
                  name="category"
                  className="form-input"
                  placeholder="e.g. Apparel"
                  value={formData.category}
                  onChange={handleInputChange}
                  required
                  list="categories-list"
                />
                <datalist id="categories-list">
                  {categories.map(c => <option key={c} value={c} />)}
                  <option value="Apparel" />
                  <option value="Leather Goods" />
                  <option value="Fragrances" />
                  <option value="Accessories" />
                </datalist>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="stockInput">Opening Stock Level</label>
                <input
                  id="stockInput"
                  type="number"
                  name="stock"
                  className="form-input"
                  placeholder="10"
                  value={formData.stock}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label" htmlFor="costInput">Supplier Cost (Price Paid)</label>
                <input
                  id="costInput"
                  type="number"
                  step="0.01"
                  name="cost"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.cost}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="priceInput">Selling Retail Price</label>
                <input
                  id="priceInput"
                  type="number"
                  step="0.01"
                  name="price"
                  className="form-input"
                  placeholder="0.00"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="thresholdInput">Low Stock Threshold Trigger</label>
              <input
                id="thresholdInput"
                type="number"
                name="lowStockThreshold"
                className="form-input"
                placeholder="5"
                value={formData.lowStockThreshold}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Product Garment Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    style={{ width: '48px', height: '48px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '48px', borderRadius: '6px', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.02)' }}>None</div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                  id="imageUploadInput"
                />
                <label 
                  htmlFor="imageUploadInput" 
                  className="btn secondary" 
                  style={{ cursor: 'pointer', fontSize: '12px', padding: '6px 12px', margin: 0 }}
                >
                  Choose File...
                </label>
                {imagePreview && (
                  <button 
                    type="button" 
                    className="btn danger" 
                    style={{ fontSize: '12px', padding: '6px 12px' }}
                    onClick={handleRemoveImage}
                  >
                    Remove
                  </button>
                )}
              </div>
            </div>

            <div className="form-actions">
              <button 
                type="button" 
                className="btn secondary"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button type="submit" className="btn primary">
                {editingProduct ? 'Save Changes' : 'Register Product'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
