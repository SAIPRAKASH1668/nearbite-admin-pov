import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurants-performance',
  standalone: true,
  imports: [CommonModule],
  template: `<div><h1>Restaurant Performance</h1><div class="card" style="margin-top: 24px;"><p>Restaurant performance metrics - Coming soon</p></div></div>`
})
export class RestaurantsPerformanceComponent {}
