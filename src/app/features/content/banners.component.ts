import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banners',
  standalone: true,
  imports: [CommonModule],
  template: `<div><h1>Banners</h1><div class="card" style="margin-top: 24px;"><p>Banner management - Coming soon</p></div></div>`
})
export class BannersComponent {}
