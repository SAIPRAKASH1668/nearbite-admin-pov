import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RiderService } from '../../core/services';
import { RiderUser, RiderStatus } from '../../core/models';
import { Subject, takeUntil, finalize } from 'rxjs';

@Component({
  selector: 'app-rider-approval-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rider-approval-detail.component.html',
  styleUrl: './rider-approval-detail.component.scss'
})
export class RiderApprovalDetailComponent implements OnInit, OnDestroy {
  rider?: RiderUser;
  loading = false;
  actionLoading = false;
  error: string = '';
  showApproveConfirm = false;
  showRejectModal = false;
  showImageModal = false;
  selectedImage = '';
  selectedImageTitle = '';
  rejectionReason = '';
  successMessage = '';
  private destroy$ = new Subject<void>();
  
  // Expose enum to template
  RiderStatus = RiderStatus;

  constructor(
    private riderService: RiderService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    let phone = this.route.snapshot.paramMap.get('phone');
    console.log('Raw phone from route:', phone);
    
    if (phone) {
      // Decode URL-encoded phone number (+ might be encoded as %2B or space)
      phone = decodeURIComponent(phone).replace(/ /g, '+');
      console.log('Decoded phone:', phone);
      this.loadRiderDetails(phone);
    } else {
      this.error = 'No phone number provided';
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadRiderDetails(phone: string): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    console.log('Loading rider with phone:', phone);
    
    this.riderService.getRiderByPhone(phone)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (rider) => {
          console.log('Rider loaded:', rider);
          if (rider) {
            this.rider = rider;
            this.error = '';
          } else {
            this.error = 'Rider not found';
            this.rider = undefined;
          }
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading rider:', error);
          this.error = error.message || 'Failed to load rider details';
          this.rider = undefined;
          this.cdr.detectChanges();
        }
      });
  }

  approveRider(): void {
    if (!this.rider) return;

    this.actionLoading = true;
    this.showApproveConfirm = false;

    this.riderService.approveRider(this.rider.phone)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.actionLoading = false;
          
          // Reload rider details
          this.loadRiderDetails(this.rider!.phone);

          // Navigate back after 2 seconds
          setTimeout(() => {
            this.goBack();
          }, 2000);
        },
        error: (error) => {
          alert('Error approving rider: ' + error.message);
          this.actionLoading = false;
        }
      });
  }

  rejectRider(): void {
    if (!this.rider || !this.rejectionReason.trim()) return;

    this.actionLoading = true;
    this.showRejectModal = false;

    this.riderService.rejectRider(this.rider.phone, this.rejectionReason)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.successMessage = response.message;
          this.actionLoading = false;
          this.rejectionReason = '';
          
          // Reload rider details
          this.loadRiderDetails(this.rider!.phone);

          // Navigate back after 2 seconds
          setTimeout(() => {
            this.goBack();
          }, 2000);
        },
        error: (error) => {
          alert('Error rejecting rider: ' + error.message);
          this.actionLoading = false;
        }
      });
  }

  goBack(): void {
    this.router.navigate(['/riders/approvals']);
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

  onImageError(event: any): void {
    event.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="400" height="250" fill="%23f0f0f0"/><text x="50%" y="50%" text-anchor="middle" fill="%23999" font-size="16">Image not available</text></svg>';
  }

  expandImage(imageUrl: string, title: string): void {
    this.selectedImage = imageUrl;
    this.selectedImageTitle = title;
    this.showImageModal = true;
  }

  closeImageModal(): void {
    this.showImageModal = false;
    this.selectedImage = '';
    this.selectedImageTitle = '';
  }

  getInitials(rider: RiderUser): string {
    const first = rider.firstName?.charAt(0) || '';
    const last = rider.lastName?.charAt(0) || '';
    return (first + last).toUpperCase();
  }
}
