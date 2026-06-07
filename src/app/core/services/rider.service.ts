import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, delay, throwError, catchError, map } from 'rxjs';
import { RiderUser, RiderStatus } from '../models/rider.model';

/**
 * Rider Service
 * Manages rider approval workflow
 */
@Injectable({
  providedIn: 'root'
})
export class RiderService {
  private http = inject(HttpClient);
  private apiUrl = '/api/v1/riders';

  /**
   * Get all riders with optional status filter
   */
  getRiders(status?: RiderStatus): Observable<RiderUser[]> {
    let params = new HttpParams();
    
    if (status) {
      params = params.set('status', status);
    }
    
    return this.http.get<{ riders: RiderUser[]; count: number }>(
      `${this.apiUrl}/list`,
      { params }
    ).pipe(
      map(response => response.riders),
      catchError(error => {
        console.error('Error fetching riders:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get pending riders (status = SIGNUP_DONE)
   */
  getPendingRiders(): Observable<RiderUser[]> {
    return this.getRiders(RiderStatus.SIGNUP_DONE);
  }

  /**
   * Get rider by phone number
   * Fetches from all statuses since rider could be in any state
   */
  getRiderByPhone(phone: string): Observable<RiderUser | undefined> {
    // Fetch from all three status types and find the rider
    const pending$ = this.http.get<{ riders: RiderUser[] }>(`${this.apiUrl}/list?status=SIGNUP_DONE`);
    const approved$ = this.http.get<{ riders: RiderUser[] }>(`${this.apiUrl}/list?status=APPROVED`);
    const rejected$ = this.http.get<{ riders: RiderUser[] }>(`${this.apiUrl}/list?status=REJECTED`);
    
    return new Observable(observer => {
      Promise.all([
        pending$.toPromise(),
        approved$.toPromise(),
        rejected$.toPromise()
      ]).then(([pending, approved, rejected]) => {
        const allRiders = [
          ...(pending?.riders || []),
          ...(approved?.riders || []),
          ...(rejected?.riders || [])
        ];
        const rider = allRiders.find(r => r.phone === phone);
        observer.next(rider);
        observer.complete();
      }).catch(error => {
        console.error('Error fetching rider:', error);
        observer.next(undefined);
        observer.complete();
      });
    });
  }

  /**
   * Approve rider
   */
  approveRider(phone: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/approve`,
      { phone }
    ).pipe(
      map(response => ({
        success: true,
        message: response.message
      })),
      catchError(error => {
        console.error('Error approving rider:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Reject rider
   */
  rejectRider(phone: string, reason: string): Observable<{ success: boolean; message: string }> {
    return this.http.put<{ message: string }>(
      `${this.apiUrl}/reject`,
      { phone, reason }
    ).pipe(
      map(response => ({
        success: true,
        message: response.message
      })),
      catchError(error => {
        console.error('Error rejecting rider:', error);
        return throwError(() => error);
      })
    );
  }
}
