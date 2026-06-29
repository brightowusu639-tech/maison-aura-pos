import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  getProducts, 
  addProduct, 
  updateProduct, 
  deleteProduct, 
  getSales, 
  addSale 
} from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5005;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Helper to save base64 uploaded image
async function handleProductImageUpload(body) {
  if (body.image && body.image.startsWith('data:image/')) {
    try {
      const matches = body.image.match(/^data:image\/([A-Za-z+-]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) return;
      
      const ext = matches[1];
      const base64Data = matches[2];
      
      const filename = `uploaded_${Date.now()}.${ext === 'jpeg' ? 'jpg' : ext}`;
      const uploadDir = path.join(__dirname, '..', 'frontend', 'public', 'images');
      
      await fs.mkdir(uploadDir, { recursive: true });
      await fs.writeFile(path.join(uploadDir, filename), Buffer.from(base64Data, 'base64'));
      
      body.image = `/images/${filename}`;
    } catch (e) {
      console.error('Error saving base64 image upload:', e);
      body.image = '/images/boutique_fallback.png';
    }
  }
}

// Log middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Products Routes
app.get('/api/products', async (req, res) => {
  try {
    const products = await getProducts();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, price, cost } = req.body;
    if (!name || price === undefined || cost === undefined) {
      return res.status(400).json({ error: 'Name, price, and cost are required' });
    }
    await handleProductImageUpload(req.body);
    const product = await addProduct(req.body);
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    await handleProductImageUpload(req.body);
    const product = await updateProduct(req.params.id, req.body);
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const product = await deleteProduct(req.params.id);
    res.json({ message: 'Product deleted successfully', product });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sales Routes
app.get('/api/sales', async (req, res) => {
  try {
    const sales = await getSales();
    // Sort sales by newest first
    sales.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(sales);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sales', async (req, res) => {
  try {
    const { items, subtotal, tax, total, amountPaid } = req.body;
    if (!items || !items.length || subtotal === undefined || tax === undefined || total === undefined || amountPaid === undefined) {
      return res.status(400).json({ error: 'Incomplete transaction details' });
    }
    const sale = await addSale(req.body);
    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Phone number formatter for Arkesel Ghana gateway
function formatGhanaPhoneNumber(num) {
  let cleaned = num.replace(/\D/g, ''); // Remove all non-digits
  if (cleaned.startsWith('233') && cleaned.length === 12) {
    return cleaned;
  }
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    return '233' + cleaned.substring(1);
  }
  if (cleaned.length === 9) {
    return '233' + cleaned;
  }
  return cleaned;
}

// Send receipt via SMS Route
app.post('/api/sales/:id/sms', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: 'Recipient phone number is required' });
    }
    const sales = await getSales();
    const sale = sales.find(s => s.id === req.params.id);
    if (!sale) {
      return res.status(404).json({ error: 'Transaction record not found' });
    }

    // Build SMS content
    const itemsSummary = sale.items.map(item => `${item.name} (${item.quantity}x)`).join(', ');
    const totalCedi = new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(sale.total);
    const smsMessage = `Maison Aura: Thank you for your purchase. Receipt ID: ${sale.id}. Items: ${itemsSummary}. Total Paid: ${totalCedi}. Note: Goods bought are not returnable.`;

    const formattedNumber = formatGhanaPhoneNumber(phoneNumber);
    console.log(`[SMS Gateway] Dispatching SMS to ${formattedNumber} via Arkesel...`);

    const arkeselApiKey = 'aVBZVHhQakN6blpJRERDcXpUZVk';
    let success = false;
    let responseData = null;
    let errorMsg = '';

    // Method 1: Try Arkesel v1 GET API (highly compatible with hex key structures)
    try {
      console.log(`[SMS Gateway] Attempting Arkesel v1 GET gateway dispatch...`);
      const v1Url = `https://sms.arkesel.com/sms/api?action=send-sms&api_key=${arkeselApiKey}&to=${formattedNumber}&from=MaisonAura&sms=${encodeURIComponent(smsMessage)}&media=json`;
      const v1Response = await fetch(v1Url);
      responseData = await v1Response.json();
      console.log('[SMS Gateway v1 Response]', responseData);

      if (v1Response.ok && (responseData.code === '1000' || responseData.code === 1000)) {
        success = true;
      } else {
        errorMsg = responseData.message || `v1 error code: ${responseData.code || responseData.status}`;
      }
    } catch (err) {
      console.error('[SMS Gateway v1 Exception]', err);
      errorMsg = err.message;
    }

    // Method 2: Fallback to Arkesel v2 POST API if v1 failed
    if (!success) {
      try {
        console.log(`[SMS Gateway] Fallback: Attempting Arkesel v2 POST gateway dispatch...`);
        const v2Response = await fetch('https://sms.arkesel.com/api/v2/sms/send', {
          method: 'POST',
          headers: {
            'api-key': arkeselApiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify({
            sender: 'MaisonAura',
            recipients: [formattedNumber],
            message: smsMessage
          })
        });

        const v2Data = await v2Response.json();
        console.log('[SMS Gateway v2 Response]', v2Data);

        if (v2Response.ok && (v2Data.status === 'success' || v2Data.code === 1000)) {
          success = true;
          responseData = v2Data;
        } else {
          errorMsg = v2Data.message || errorMsg;
        }
      } catch (err) {
        console.error('[SMS Gateway v2 Exception]', err);
        errorMsg = err.message || errorMsg;
      }
    }

    if (!success) {
      throw new Error(errorMsg || 'Arkesel API gateway rejected key authentication');
    }

    res.json({ 
      success: true, 
      message: `Receipt SMS successfully dispatched to ${phoneNumber}`,
      providerDetails: responseData
    });
  } catch (error) {
    console.error('[SMS Dispatch Error]', error);
    res.status(500).json({ error: `SMS Gateway Error: ${error.message}` });
  }
});

// Dashboard Analytics Route
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const products = await getProducts();
    const sales = await getSales();
    
    // 1. Basic Stats
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.total, 0);
    const totalCostOfGoodsSold = sales.reduce((sum, sale) => {
      return sum + sale.items.reduce((itemSum, item) => itemSum + (item.cost * item.quantity), 0);
    }, 0);
    const grossProfit = totalRevenue - totalCostOfGoodsSold;
    
    // Today's Sales
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter(sale => sale.timestamp.startsWith(todayStr));
    const todayRevenue = todaySales.reduce((sum, sale) => sum + sale.total, 0);
    const todayCount = todaySales.length;

    // Inventory status
    const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold);
    const outOfStockCount = products.filter(p => p.stock === 0).length;
    
    // Boutique metrics
    const averageOrderValue = sales.length ? parseFloat((totalRevenue / sales.length).toFixed(2)) : 0;
    const giftCount = sales.filter(s => s.isGift).length;
    const giftRate = sales.length ? parseFloat(((giftCount / sales.length) * 100).toFixed(1)) : 0;
    const uniqueCustomersCount = new Set(sales.map(s => s.customerEmail).filter(Boolean)).size;

    // 2. Sales Trend (Past 7 Days)
    const trendMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // Format as 'Jun 28'
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
      trendMap[dateStr] = { date: label, revenue: 0, transactions: 0 };
    }

    sales.forEach(sale => {
      const dateStr = sale.timestamp.split('T')[0];
      if (trendMap[dateStr]) {
        trendMap[dateStr].revenue += sale.total;
        trendMap[dateStr].transactions += 1;
      }
    });

    const salesTrend = Object.values(trendMap);

    // 3. Top Selling Products
    const productSalesCount = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        if (!productSalesCount[item.name]) {
          productSalesCount[item.name] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSalesCount[item.name].quantity += item.quantity;
        productSalesCount[item.name].revenue += item.price * item.quantity;
      });
    });

    const topProducts = Object.values(productSalesCount)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Sales by Category
    const categorySalesMap = {};
    sales.forEach(sale => {
      sale.items.forEach(item => {
        // Find product's category from active products list or default
        const pInfo = products.find(p => p.id === item.productId);
        const category = pInfo ? pInfo.category : 'General';
        
        if (!categorySalesMap[category]) {
          categorySalesMap[category] = 0;
        }
        categorySalesMap[category] += item.price * item.quantity;
      });
    });

    const categoryStats = Object.entries(categorySalesMap).map(([name, value]) => ({
      name,
      value: parseFloat(value.toFixed(2))
    }));

    res.json({
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        grossProfit: parseFloat(grossProfit.toFixed(2)),
        todayRevenue: parseFloat(todayRevenue.toFixed(2)),
        todayCount,
        totalProducts: products.length,
        lowStockCount: lowStockItems.length,
        outOfStockCount,
        averageOrderValue,
        giftCount,
        giftRate,
        uniqueCustomersCount
      },
      lowStockItems: lowStockItems.map(p => ({ id: p.id, name: p.name, stock: p.stock, threshold: p.lowStockThreshold })),
      salesTrend,
      topProducts,
      categoryStats
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
