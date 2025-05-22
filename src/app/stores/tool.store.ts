import { makeAutoObservable, action } from 'mobx';
import { ToolType } from '../services/tool.service';

export class ToolStore {
  activeTool: ToolType = ToolType.None;
  
  constructor() {
    makeAutoObservable(this, {
      // Explicitly mark actions
      setActiveTool: action
    });
  }
  
  setActiveTool = action('setActiveTool', (tool: ToolType) => {
    console.log('MobX Tool Store: setActiveTool', tool);
    this.activeTool = tool;
  });
  
  getActiveTool(): ToolType {
    return this.activeTool;
  }
}

// Create singleton instance
export const toolStore = new ToolStore(); 