import { Injectable, InjectionToken, Inject, Optional } from '@angular/core';

// Configuration token for asset base path
export const TICKETSEAT_ASSET_BASE_PATH = new InjectionToken<string>('TICKETSEAT_ASSET_BASE_PATH', {
  providedIn: 'root',
  factory: () => 'assets' // default path
});

export interface ToolbarIcon {
  active: string;
  inactive: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssetService {
  private basePath: string;
  
  constructor(@Optional() @Inject(TICKETSEAT_ASSET_BASE_PATH) basePath: string | null) {
    this.basePath = basePath || 'assets';
  }

  /**
   * Get the full path for a toolbar icon
   * @param iconName The name of the icon (e.g., 'round-table-tool')
   * @param state The state of the icon ('active' or 'inactive')
   * @returns The full path to the icon
   */
  getToolbarIcon(iconName: string, state: 'active' | 'inactive'): string {
    return `${this.basePath}/icons/toolbar/${state}/${iconName}.svg`;
  }

  /**
   * Get both active and inactive paths for a toolbar icon
   * @param iconName The name of the icon (e.g., 'round-table-tool')
   * @returns Object with active and inactive paths
   */
  getToolbarIconPaths(iconName: string): ToolbarIcon {
    return {
      active: this.getToolbarIcon(iconName, 'active'),
      inactive: this.getToolbarIcon(iconName, 'inactive')
    };
  }

  /**
   * Set the base path for assets (useful for configuration)
   * @param basePath The base path for assets
   */
  setBasePath(basePath: string): void {
    this.basePath = basePath;
  }

  /**
   * Get the current base path
   * @returns The current base path
   */
  getBasePath(): string {
    return this.basePath;
  }
}
