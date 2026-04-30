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
  ToolType = ToolType;

  tools = [
    { type: ToolType.RoundTable, icon: 'round-table-tool', label: 'Round Table' },
    { type: ToolType.RectangleTable, icon: 'rectangular-table-tool', label: 'Rectangle Table' },
    { type: ToolType.SeatingRow, icon: 'row-tool', label: 'Seating Row' },
    { type: ToolType.SegmentedSeatingRow, icon: 'segmented-row-tool', label: 'Segmented Row' },
    { type: ToolType.Line, icon: 'line-tool', label: 'Line' },
    { type: ToolType.Polygon, icon: 'polygon-tool', label: 'Polygon' },
    { type: ToolType.Text, icon: '20. Text tool', label: 'Text' },
  ];

  constructor(
    private toolService: ToolService,
    private assetService: AssetService
  ) { }

  toggleTool(tool: ToolType): void {
    if (this.toolService.getActiveTool() === tool) {
      this.toolService.setActiveTool(ToolType.None);
    } else {
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
