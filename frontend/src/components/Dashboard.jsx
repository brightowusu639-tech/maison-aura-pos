import React, { useState, useEffect } from 'react';
import { IconRevenue, IconMargin, IconGem, IconGift, IconClients, IconAlert } from './Icons';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export default function Dashboard({ addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/dashboard/stats`);
      if (!res.ok) throw new Error('Failed to fetch dashboard stats');
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error(error);
      addToast('Error loading dashboard statistics', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="live-indicator" style={{ width: '16px', height: '16px', marginRight: '12px' }}></div>
        <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Retrieving live ledger stats...</span>
      </div>
    );
  }

  const { summary, lowStockItems, salesTrend, topProducts, categoryStats } = stats;

  // Custom SVG Area Chart calculation
  const chartHeight = 220;
  const chartWidth = 600;
  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 30;

  const graphHeight = chartHeight - paddingTop - paddingBottom;
  const graphWidth = chartWidth - paddingLeft - paddingRight;

  const maxRevenue = Math.max(...salesTrend.map(d => d.revenue), 100);
  // Round maxRevenue up to a neat number for grid lines
  const niceMax = Math.ceil(maxRevenue / 100) * 100;

  const getCoordinates = () => {
    if (!salesTrend.length) return [];
    return salesTrend.map((d, index) => {
      const x = paddingLeft + (index / (salesTrend.length - 1)) * graphWidth;
      const y = paddingTop + graphHeight - (d.revenue / niceMax) * graphHeight;
      return { x, y, data: d };
    });
  };

  const points = getCoordinates();
  
  // Create SVG path for Area fill
  let areaPath = '';
  let linePath = '';
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + graphHeight} L ${points[0].x} ${paddingTop + graphHeight} Z`;
  }

  // Define chart grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  // Helper formatting
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-GH', { style: 'currency', currency: 'GHS' }).format(val);
  };

  const colors = ['#c5a880', '#a2b097', '#dbaf88', '#b07d7d', '#7d776f'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card sales">
          <div className="kpi-info">
            <span className="kpi-label">Today's Revenue</span>
            <span className="kpi-value">{formatCurrency(summary.todayRevenue)}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {summary.todayCount} transactions
            </span>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--primary)' }}><IconRevenue size={24} /></div>
        </div>

        <div className="kpi-card profit">
          <div className="kpi-info">
            <span className="kpi-label">Gross Margin (Est)</span>
            <span className="kpi-value">{formatCurrency(summary.grossProfit)}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Avg. {summary.totalRevenue ? Math.round((summary.grossProfit / summary.totalRevenue) * 100) : 0}% markup
            </span>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--success)' }}><IconMargin size={24} /></div>
        </div>

        <div className="kpi-card aov">
          <div className="kpi-info">
            <span className="kpi-label">Avg Order Value (AOV)</span>
            <span className="kpi-value">{formatCurrency(summary.averageOrderValue || 0)}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Standard order basket size
            </span>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--primary)' }}><IconGem size={24} /></div>
        </div>

        <div className="kpi-card gifting">
          <div className="kpi-info">
            <span className="kpi-label">Gift Presentation</span>
            <span className="kpi-value">{summary.giftRate || 0}%</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {summary.giftCount || 0} gift wrapped orders
            </span>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--warning)' }}><IconGift size={24} /></div>
        </div>

        <div className="kpi-card clients">
          <div className="kpi-info">
            <span className="kpi-label">VIP Client Registry</span>
            <span className="kpi-value">{summary.uniqueCustomersCount || 0}</span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Registered boutique loyalty profiles
            </span>
          </div>
          <div className="kpi-icon-container" style={{ color: 'var(--primary)' }}><IconClients size={24} /></div>
        </div>

        <div className="kpi-card lowstock">
          <div className="kpi-info">
            <span className="kpi-label">Restock Alerts</span>
            <span className="kpi-value" style={{ color: summary.lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>
              {summary.lowStockCount}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Active low-stock SKUs
            </span>
          </div>
          <div className="kpi-icon-container" style={{ color: summary.lowStockCount > 0 ? 'var(--danger)' : 'var(--text-muted)' }}><IconAlert size={24} /></div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div className="charts-grid">
        {/* Sales Trend Chart */}
        <div className="chart-card">
          <div className="chart-header">
            <span className="chart-title">Revenue Trends (Past 7 Days)</span>
            <span className="badge info">Realtime Data</span>
          </div>
          <div style={{ position: 'relative', width: '100%', height: `${chartHeight}px` }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height="100%" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              
              {/* Y Gridlines & Y Labels */}
              {gridLines.map((ratio, i) => {
                const y = paddingTop + graphHeight - ratio * graphHeight;
                const value = ratio * niceMax;
                return (
                  <g key={i}>
                    <line 
                      x1={paddingLeft} 
                      y1={y} 
                      x2={chartWidth - paddingRight} 
                      y2={y} 
                      stroke="var(--border-color)" 
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text 
                      x={paddingLeft - 8} 
                      y={y + 4} 
                      fill="var(--text-muted)" 
                      fontSize="10" 
                      textAnchor="end"
                      fontWeight="500"
                    >
                      {value >= 1000 ? `$${(value / 1000).toFixed(1)}k` : `$${value.toFixed(0)}`}
                    </text>
                  </g>
                );
              })}

              {/* Area path */}
              {areaPath && (
                <path d={areaPath} fill="url(#areaGrad)" />
              )}

              {/* Line path */}
              {linePath && (
                <path 
                  d={linePath} 
                  fill="none" 
                  stroke="var(--primary)" 
                  strokeWidth="3" 
                  strokeLinecap="round"
                  style={{ filter: 'drop-shadow(0px 4px 6px rgba(197, 168, 128, 0.3))' }}
                />
              )}

              {/* Interactive Dots and Labels */}
              {points.map((p, index) => (
                <g key={index} className="chart-dot-group">
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="5" 
                    fill="var(--bg-secondary)" 
                    stroke="var(--primary)" 
                    strokeWidth="2.5" 
                  />
                  {/* Tooltip trigger hover circle */}
                  <circle 
                    cx={p.x} 
                    cy={p.y} 
                    r="12" 
                    fill="transparent" 
                    style={{ cursor: 'pointer' }}
                  >
                    <title>{`${p.data.date}: ${formatCurrency(p.data.revenue)}`}</title>
                  </circle>
                  <text 
                    x={p.x} 
                    y={paddingTop + graphHeight + 18} 
                    fill="var(--text-secondary)" 
                    fontSize="10" 
                    textAnchor="middle"
                    fontWeight="500"
                  >
                    {p.data.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>

        {/* Sales by Category Panel */}
        <div className="chart-card" style={{ minHeight: 'auto' }}>
          <div className="chart-header">
            <span className="chart-title">Revenue by Department</span>
          </div>
          <div className="custom-donut-chart">
            {categoryStats.length === 0 ? (
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>No sales recorded yet.</span>
            ) : (
              <div className="category-list">
                {categoryStats.map((cat, index) => {
                  const percent = summary.totalRevenue ? ((cat.value / summary.totalRevenue) * 100).toFixed(0) : 0;
                  const color = colors[index % colors.length];
                  return (
                    <div className="category-item" key={cat.name}>
                      <div className="category-info">
                        <span className="category-color-dot" style={{ backgroundColor: color }}></span>
                        <span>{cat.name}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span className="category-value">{formatCurrency(cat.value)}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', width: '30px', textAlign: 'right' }}>
                          {percent}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row with Top Products and Low Stock Alerts */}
      <div className="charts-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        
        {/* Top Sellers */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Top Selling Products</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {topProducts.length === 0 ? (
              <div className="empty-placeholder" style={{ padding: '24px' }}>
                <span style={{ fontSize: '13px' }}>Record sales to populate list</span>
              </div>
            ) : (
              topProducts.map((p, idx) => {
                const maxQty = Math.max(...topProducts.map(tp => tp.quantity), 1);
                const percent = (p.quantity / maxQty) * 100;
                return (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                      <span style={{ color: 'var(--text-secondary)' }}>
                        {p.quantity} units <span style={{ color: 'var(--text-muted)' }}>|</span> {formatCurrency(p.revenue)}
                      </span>
                    </div>
                    <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.03)', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ width: `${percent}%`, height: '100%', background: 'linear-gradient(to right, var(--primary), var(--success))', borderRadius: '3px' }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Low Stock Watch */}
        <div className="panel">
          <div className="panel-header">
            <h2 className="panel-title">Low Stock Alert Ledger</h2>
            {lowStockItems.length > 0 && <span className="badge warning">{lowStockItems.length} Warnings</span>}
          </div>
          <div className="table-container">
            {lowStockItems.length === 0 ? (
              <div className="empty-placeholder" style={{ padding: '24px' }}>
                <div className="empty-icon" style={{ fontSize: '24px' }}>🛡️</div>
                <span style={{ fontSize: '13px' }}>All item stock levels are healthy</span>
              </div>
            ) : (
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th style={{ textAlign: 'right' }}>On Hand</th>
                    <th style={{ textAlign: 'right' }}>Min limit</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map(item => (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 500 }}>{item.name}</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: item.stock === 0 ? 'var(--danger)' : 'var(--warning)' }}>
                        {item.stock}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)' }}>{item.threshold}</td>
                      <td>
                        <span className={`badge ${item.stock === 0 ? 'danger' : 'warning'}`}>
                          {item.stock === 0 ? 'Out of Stock' : 'Low Stock'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
