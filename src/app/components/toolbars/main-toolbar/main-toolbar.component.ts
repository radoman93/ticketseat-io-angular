import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolService, ToolType } from '../../../services/tool.service';
import { AssetService } from '../../../services/asset.service';

@Component({
  selector: 'app-main-toolbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-toolbar.component.html',
  styleUrl: './main-toolbar.component.css'
})
export class MainToolbarComponent {
  ToolType = ToolType; // Make enum available in template

  constructor(
    private toolService: ToolService,
    private assetService: AssetService
  ) {}

  toggleTool(tool: ToolType): void {
    // If the tool is already active, deactivate it
    if (this.toolService.getActiveTool() === tool) {
      this.toolService.setActiveTool(ToolType.None);
    } else {
      // Otherwise, activate the selected tool
      this.toolService.setActiveTool(tool);
    }
  }

  isToolActive(tool: ToolType): boolean {
    return this.toolService.getActiveTool() === tool;
  }

  getToolbarIcon(iconName: string, isActive: boolean): string {
    return this.assetService.getToolbarIcon(iconName, isActive ? 'active' : 'inactive');
  }
}
