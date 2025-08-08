import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export interface BuildInfo {
  buildNumber: number;
  buildDate: string;
  version: string;
}

@Injectable({
  providedIn: 'root'
})
export class BuildInfoService {
  private buildInfo: BuildInfo | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Get build information from the build-info.json file
   */
  getBuildInfo(): Observable<BuildInfo> {
    if (this.buildInfo) {
      return of(this.buildInfo);
    }

    return this.http.get<BuildInfo>('/assets/build-info.json').pipe(
      catchError(() => {
        // Fallback build info if file doesn't exist
        const fallbackInfo: BuildInfo = {
          buildNumber: 1,
          buildDate: new Date().toISOString(),
          version: '0.0.0'
        };
        this.buildInfo = fallbackInfo;
        return of(fallbackInfo);
      })
    );
  }

  /**
   * Get formatted build number string
   */
  getFormattedBuildNumber(): Observable<string> {
    return new Observable(observer => {
      this.getBuildInfo().subscribe(info => {
        observer.next(`Build #${info.buildNumber}`);
        observer.complete();
      });
    });
  }

  /**
   * Get formatted build date string
   */
  getFormattedBuildDate(): Observable<string> {
    return new Observable(observer => {
      this.getBuildInfo().subscribe(info => {
        const date = new Date(info.buildDate);
        observer.next(date.toLocaleDateString());
        observer.complete();
      });
    });
  }

  /**
   * Get full build info string for display
   */
  getFullBuildInfo(): Observable<string> {
    return new Observable(observer => {
      this.getBuildInfo().subscribe(info => {
        const date = new Date(info.buildDate);
        observer.next(`Build #${info.buildNumber} ${info.version} (${date.toLocaleDateString()})`);
        observer.complete();
      });
    });
  }
}