import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { LayoutExportData, LayoutExportImportService } from './layout-export-import.service';

@Injectable({ providedIn: 'root' })
export class PresetLoaderService {
  constructor(
    private http: HttpClient,
    private importService: LayoutExportImportService,
  ) {}

  async load(presetUrl: string): Promise<void> {
    const data = await firstValueFrom(this.http.get<LayoutExportData>(presetUrl));
    this.importService.importLayout(data, 'replace');
  }
}
