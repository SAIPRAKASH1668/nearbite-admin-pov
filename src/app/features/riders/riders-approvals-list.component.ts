import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RiderService } from '../../core/services';
import { RiderUser, RiderStatus } from '../../core/models';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-riders-approvals-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './riders-approvals-list.component.html',
  styleUrl: './riders-approvals-list.component.scss'
})
export class RidersApprovalsListComponent implements OnInit, OnDestroy {
  allRiders: RiderUser[] = [];
  filteredRiders: RiderUser[] = [];
  selectedStatus: RiderStatus = RiderStatus.SIGNUP_DONE;
  loading = false;
  private destroy$ = new Subject<void>();
  
  // Expose enum to template
  RiderStatus = RiderStatus;

  constructor(
    private riderService: RiderService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRiders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRiders(): void {
    this.loading = true;
    this.cdr.detectChanges();
    
    this.riderService.getRiders()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (riders) => {
          this.allRiders = riders;
          this.applyFilter();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading riders:', error);
          this.cdr.detectChanges();
        }
      });
  }

  refreshRiders(): void {
    this.loadRiders();
  }

  filterByStatus(status: RiderStatus): void {
    this.selectedStatus = status;
    this.applyFilter();
  }

  private applyFilter(): void {
    this.filteredRiders = this.allRiders.filter(r => r.riderStatus === this.selectedStatus);
  }

  getPendingCount(): number {
    return this.allRiders.filter(r => r.riderStatus === RiderStatus.SIGNUP_DONE).length;
  }

  getApprovedCount(): number {
    return this.allRiders.filter(r => r.riderStatus === RiderStatus.APPROVED).length;
  }

  getRejectedCount(): number {
    return this.allRiders.filter(r => r.riderStatus === RiderStatus.REJECTED).length;
  }

  viewRiderDetails(rider: RiderUser): void {
    // Encode phone number to handle special characters like +
    const encodedPhone = encodeURIComponent(rider.phone);
    this.router.navigate(['/riders/approvals', encodedPhone]);
  }

  getInitials(rider: RiderUser): string {
    const first = rider.firstName?.charAt(0) || '';
    const last = rider.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }

  getStatusClass(status: RiderStatus): string {
    switch (status) {
      case RiderStatus.SIGNUP_DONE: return 'pending';
      case RiderStatus.APPROVED: return 'approved';
      case RiderStatus.REJECTED: return 'rejected';
      default: return '';
    }
  }

  getStatusLabel(status: RiderStatus): string {
    switch (status) {
      case RiderStatus.SIGNUP_DONE: return 'Pending';
      case RiderStatus.APPROVED: return 'Approved';
      case RiderStatus.REJECTED: return 'Rejected';
      default: return status;
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
