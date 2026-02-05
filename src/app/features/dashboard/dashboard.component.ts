import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardService } from '../../core/services';
import { PlatformMetrics } from '../../core/models';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <div class="page-header">
        <div>
          <h1>Platform Overview</h1>
          <p class="text-secondary">Real-time monitoring and key performance indicators</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="23 4 23 10 17 10"></polyline>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
            </svg>
            Refresh
          </button>
          <button class="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            Export Report
          </button>
        </div>
      </div>
      
      <!-- Real-time Metrics -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Active Orders</span>
            <div class="status-dot online"></div>
          </div>
          <div class="metric-value">{{ metrics.activeOrders }}</div>
          <div class="metric-footer">
            <span class="text-success">↑ 12%</span> vs last hour
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Online Riders</span>
            <div class="status-dot online"></div>
          </div>
          <div class="metric-value">{{ metrics.activeRiders }}</div>
          <div class="metric-footer">
            <span class="text-warning">{{ metrics.activeRiders - 20 }}</span> on delivery
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Orders Today</span>
          </div>
          <div class="metric-value">{{ metrics.ordersToday | number }}</div>
          <div class="metric-footer">
            <span class="text-success">↑ 18.3%</span> vs yesterday
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Revenue Today</span>
          </div>
          <div class="metric-value">\${{ (metrics.revenueToday / 1000).toFixed(1) }}k</div>
          <div class="metric-footer">
            <span class="text-success">↑ 24.1%</span> vs yesterday
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Completion Rate</span>
          </div>
          <div class="metric-value">{{ metrics.orderCompletionRate.toFixed(1) }}%</div>
          <div class="metric-footer">
            Target: <span class="text-primary">95%</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">Avg Delivery Time</span>
          </div>
          <div class="metric-value">{{ metrics.avgDeliveryTime }} min</div>
          <div class="metric-footer">
            <span class="text-success">↓ 2min</span> improvement
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">System Uptime</span>
          </div>
          <div class="metric-value">{{ metrics.systemUptime }}%</div>
          <div class="metric-footer">
            <span class="text-success">Excellent</span>
          </div>
        </div>
        
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">API Latency</span>
          </div>
          <div class="metric-value">{{ metrics.apiLatency }}ms</div>
          <div class="metric-footer">
            <span class="text-success">Good</span> performance
          </div>
        </div>
      </div>
      
      <!-- Charts Section -->
      <div class="charts-grid">
        <div class="card">
          <h3>Revenue Trend (7 Days)</h3>
          <canvas #revenueChart></canvas>
        </div>
        
        <div class="card">
          <h3>Order Status Distribution</h3>
          <canvas #orderChart></canvas>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="section">
        <h3>Quick Actions</h3>
        <div class="quick-actions">
          <button class="action-card">
            <div class="action-icon primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path>
                <path d="M7 2v20"></path>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Approve Restaurant</div>
              <div class="action-subtitle">8 pending</div>
            </div>
          </button>
          
          <button class="action-card">
            <div class="action-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Process Settlements</div>
              <div class="action-subtitle">12 pending</div>
            </div>
          </button>
          
          <button class="action-card">
            <div class="action-icon error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Support Tickets</div>
              <div class="action-subtitle">47 open</div>
            </div>
          </button>
          
          <button class="action-card">
            <div class="action-icon success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="3" width="15" height="13"></rect>
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
              </svg>
            </div>
            <div class="action-content">
              <div class="action-title">Verify Riders</div>
              <div class="action-subtitle">5 pending</div>
            </div>
          </button>
        </div>
      </div>
      
      <!-- Recent Activity -->
      <div class="section">
        <h3>Recent Activity</h3>
        <div class="activity-list card">
          <div class="activity-item" *ngFor="let activity of recentActivity">
            <div class="activity-icon" [class]="'icon-' + activity.type">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <div class="activity-content">
              <div class="activity-title">{{ activity.title }}</div>
              <div class="activity-meta">{{ activity.user }} • {{ activity.time }}</div>
            </div>
            <span class="status-chip" [class]="'status-' + activity.status">{{ activity.statusText }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      max-width: 1600px;
    }
    
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: var(--space-xl);
      
      h1 {
        margin-bottom: var(--space-xs);
      }
    }
    
    .header-actions {
      display: flex;
      gap: var(--space-sm);
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }
    
    .metric-card {
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: var(--space-lg);
      transition: all 0.2s;
      
      &:hover {
        border-color: var(--color-primary);
        box-shadow: 0 0 0 3px rgba(255, 107, 53, 0.05);
      }
    }
    
    .metric-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-sm);
    }
    
    .metric-label {
      font-size: 12px;
      color: var(--color-text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 32px;
      font-weight: 700;
      color: var(--color-text-primary);
      line-height: 1;
      margin-bottom: var(--space-sm);
    }
    
    .metric-footer {
      font-size: 12px;
      color: var(--color-text-tertiary);
    }
    
    .section {
      margin-bottom: var(--space-xl);
      
      h3 {
        margin-bottom: var(--space-lg);
      }
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: var(--space-xl);
      margin-bottom: var(--space-xl);
      
      .card {
        h3 {
          font-size: 14px;
          margin-bottom: var(--space-lg);
        }
        
        canvas {
          max-height: 300px;
        }
      }
    }
    
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: var(--space-lg);
    }
    
    .action-card {
      display: flex;
      align-items: center;
      gap: var(--space-lg);
      background: var(--color-bg-secondary);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      padding: var(--space-lg);
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
      
      &:hover {
        border-color: var(--color-primary);
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
    }
    
    .action-icon {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.primary {
        background: rgba(255, 107, 53, 0.1);
        color: var(--color-primary);
      }
      
      &.success {
        background: var(--color-success-bg);
        color: var(--color-success);
      }
      
      &.warning {
        background: var(--color-warning-bg);
        color: var(--color-warning);
      }
      
      &.error {
        background: var(--color-error-bg);
        color: var(--color-error);
      }
    }
    
    .action-content {
      flex: 1;
    }
    
    .action-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--color-text-primary);
      margin-bottom: 2px;
    }
    
    .action-subtitle {
      font-size: 12px;
      color: var(--color-text-secondary);
    }
    
    .activity-list {
      padding: 0;
    }
    
    .activity-item {
      display: flex;
      align-items: center;
      gap: var(--space-md);
      padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--color-border-light);
      
      &:last-child {
        border-bottom: none;
      }
      
      &:hover {
        background: var(--color-bg-tertiary);
      }
    }
    
    .activity-icon {
      width: 32px;
      height: 32px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      
      &.icon-restaurant {
        background: rgba(255, 107, 53, 0.1);
        color: var(--color-primary);
      }
      
      &.icon-order {
        background: var(--color-info-bg);
        color: var(--color-info);
      }
      
      &.icon-rider {
        background: var(--color-success-bg);
        color: var(--color-success);
      }
    }
    
    .activity-content {
      flex: 1;
    }
    
    .activity-title {
      font-size: 13px;
      color: var(--color-text-primary);
      margin-bottom: 2px;
    }
    
    .activity-meta {
      font-size: 11px;
      color: var(--color-text-tertiary);
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('orderChart') orderChartRef!: ElementRef<HTMLCanvasElement>;
  
  private revenueChart?: Chart;
  private orderChart?: Chart;

  metrics: PlatformMetrics = {
    activeOrders: 0,
    activeRiders: 0,
    activeRestaurants: 0,
    onlineCustomers: 0,
    ordersToday: 0,
    revenueToday: 0,
    newCustomersToday: 0,
    newRestaurantsToday: 0,
    avgDeliveryTime: 0,
    avgOrderPreparationTime: 0,
    orderCompletionRate: 0,
    orderCancellationRate: 0,
    apiLatency: 0,
    failedPaymentRate: 0,
    systemUptime: 0,
    errorRate: 0
  };

  recentActivity = [
    { type: 'restaurant', title: 'New restaurant approved: The Golden Spoon', user: 'Sarah Johnson', time: '2 min ago', status: 'success', statusText: 'Approved' },
    { type: 'order', title: 'Large order placed: $456.80', user: 'System', time: '5 min ago', status: 'info', statusText: 'New' },
    { type: 'rider', title: 'Rider verified: John Martinez', user: 'David Kumar', time: '12 min ago', status: 'success', statusText: 'Verified' },
    { type: 'restaurant', title: 'Restaurant suspended: Pizza Corner', user: 'Sarah Johnson', time: '1 hour ago', status: 'warning', statusText: 'Suspended' }
  ];

  constructor(private dashboardService: DashboardService) {}

  ngOnInit() {
    this.dashboardService.metrics$.subscribe(metrics => {
      this.metrics = metrics;
    });
  }
  
  ngAfterViewInit() {
    // Initialize charts after view is ready
    setTimeout(() => this.initializeCharts(), 100);
  }
  
  private initializeCharts() {
    this.createRevenueChart();
    this.createOrderChart();
  }
  
  private createRevenueChart() {
    const ctx = this.revenueChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.revenueChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Revenue ($)',
          data: [18400, 22300, 19800, 24100, 26700, 31200, 28900],
          borderColor: '#FF6B35',
          backgroundColor: 'rgba(255, 107, 53, 0.1)',
          tension: 0.4,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#1a1f29',
            titleColor: '#e8eaed',
            bodyColor: '#e8eaed',
            borderColor: '#3c4248',
            borderWidth: 1
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#9aa0a6' },
            grid: { color: '#2d3339' }
          },
          x: {
            ticks: { color: '#9aa0a6' },
            grid: { color: '#2d3339' }
          }
        }
      }
    });
  }
  
  private createOrderChart() {
    const ctx = this.orderChartRef.nativeElement.getContext('2d');
    if (!ctx) return;
    
    this.orderChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Delivered', 'In Progress', 'Cancelled'],
        datasets: [{
          data: [2456, 342, 49],
          backgroundColor: ['#34a853', '#4285f4', '#ea4335'],
          borderWidth: 0
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: '#e8eaed',
              padding: 12,
              font: { size: 12 }
            }
          },
          tooltip: {
            backgroundColor: '#1a1f29',
            titleColor: '#e8eaed',
            bodyColor: '#e8eaed',
            borderColor: '#3c4248',
            borderWidth: 1
          }
        }
      }
    });
  }
}
