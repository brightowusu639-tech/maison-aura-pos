import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'database.json');

// Helper to read DB state
async function readDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file, returning defaults', error);
    return { products: [], sales: [] };
  }
}

// Helper to write DB state
async function writeDb(data) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing to database file', error);
    throw error;
  }
}

// Product operations
export async function getProducts() {
  const db = await readDb();
  return db.products || [];
}

export async function addProduct(product) {
  const db = await readDb();
  const newProduct = {
    id: `prod-${Date.now()}`,
    sku: product.sku || `SKU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
    name: product.name,
    category: product.category || 'General',
    size: product.size || 'O/S',
    color: product.color || 'N/A',
    image: product.image || '/images/boutique_fallback.png',
    cost: parseFloat(product.cost) || 0,
    price: parseFloat(product.price) || 0,
    stock: parseInt(product.stock) || 0,
    lowStockThreshold: parseInt(product.lowStockThreshold) || 5
  };
  
  db.products.push(newProduct);
  await writeDb(db);
  return newProduct;
}

export async function updateProduct(id, updatedData) {
  const db = await readDb();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Product not found');
  
  db.products[index] = {
    ...db.products[index],
    ...updatedData,
    cost: updatedData.cost !== undefined ? parseFloat(updatedData.cost) : db.products[index].cost,
    price: updatedData.price !== undefined ? parseFloat(updatedData.price) : db.products[index].price,
    stock: updatedData.stock !== undefined ? parseInt(updatedData.stock) : db.products[index].stock,
    lowStockThreshold: updatedData.lowStockThreshold !== undefined ? parseInt(updatedData.lowStockThreshold) : db.products[index].lowStockThreshold
  };
  
  await writeDb(db);
  return db.products[index];
}

export async function deleteProduct(id) {
  const db = await readDb();
  const index = db.products.findIndex(p => p.id === id);
  if (index === -1) throw new Error('Product not found');
  
  const deleted = db.products.splice(index, 1);
  await writeDb(db);
  return deleted[0];
}

// Sales operations
export async function getSales() {
  const db = await readDb();
  return db.sales || [];
}

export async function addSale(saleData) {
  const db = await readDb();
  
  // Create sale record
  const newSale = {
    id: `sale-${Date.now()}`,
    timestamp: new Date().toISOString(),
    items: saleData.items.map(item => ({
      productId: item.productId,
      name: item.name,
      price: parseFloat(item.price),
      cost: parseFloat(item.cost),
      quantity: parseInt(item.quantity),
      size: item.size || 'O/S',
      color: item.color || 'N/A'
    })),
    subtotal: parseFloat(saleData.subtotal),
    discount: parseFloat(saleData.discount || 0),
    tax: parseFloat(saleData.tax),
    total: parseFloat(saleData.total),
    paymentMethod: saleData.paymentMethod || 'cash',
    amountPaid: parseFloat(saleData.amountPaid),
    changeDue: parseFloat(saleData.changeDue || 0),
    customerName: saleData.customerName || '',
    customerEmail: saleData.customerEmail || '',
    customerPhone: saleData.customerPhone || '',
    isGift: !!saleData.isGift,
    giftMessage: saleData.giftMessage || '',
    giftWrapFee: parseFloat(saleData.giftWrapFee || 0)
  };
  
  // Deduct inventory items
  for (const item of newSale.items) {
    const product = db.products.find(p => p.id === item.productId);
    if (product) {
      // Ensure stock does not go negative (or allow depending on business logic, but warning is better)
      product.stock = Math.max(0, product.stock - item.quantity);
    }
  }
  
  db.sales.push(newSale);
  await writeDb(db);
  return newSale;
}
