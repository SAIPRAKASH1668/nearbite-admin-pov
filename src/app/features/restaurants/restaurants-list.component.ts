import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-restaurants-list',
  standalone: true,
  imports: [CommonModule],
  template: `<div><h1>All Restaurants</h1><div class="card" style="margin-top: 24px;"><p>Restaurant management - Coming soon</p></div></div>`
})
export class RestaurantsListComponent {}
