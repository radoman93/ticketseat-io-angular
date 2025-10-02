import { HistoryStore } from './history.store';
import { Command } from '../models/command.interface';
import { setupMobXForTesting, resetMobXConfiguration } from '../../test-helpers/mobx-test.helpers';

describe('HistoryStore', () => {
  let store: HistoryStore;
  let mockCommand: Command;
  let executeSpy: jasmine.Spy;
  let undoSpy: jasmine.Spy;

  beforeAll(() => {
    setupMobXForTesting();
  });

  afterAll(() => {
    resetMobXConfiguration();
  });

  beforeEach(() => {
    store = new HistoryStore();

    executeSpy = jasmine.createSpy('execute');
    undoSpy = jasmine.createSpy('undo');

    mockCommand = {
      execute: executeSpy,
      undo: undoSpy
    };
  });

  describe('initialization', () => {
    it('should initialize with empty stacks', () => {
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(false);
    });
  });

  describe('executeCommand', () => {
    it('should execute the command', () => {
      store.executeCommand(mockCommand);

      expect(executeSpy).toHaveBeenCalled();
    });

    it('should add command to undo stack', () => {
      store.executeCommand(mockCommand);

      expect(store.canUndo).toBe(true);
    });

    it('should clear redo stack', () => {
      const command1: Command = {
        execute: jasmine.createSpy('execute1'),
        undo: jasmine.createSpy('undo1')
      };
      const command2: Command = {
        execute: jasmine.createSpy('execute2'),
        undo: jasmine.createSpy('undo2')
      };

      store.executeCommand(command1);
      store.undo();
      expect(store.canRedo).toBe(true);

      store.executeCommand(command2);
      expect(store.canRedo).toBe(false);
    });

    it('should execute multiple commands in sequence', () => {
      const command1: Command = {
        execute: jasmine.createSpy('execute1'),
        undo: jasmine.createSpy('undo1')
      };
      const command2: Command = {
        execute: jasmine.createSpy('execute2'),
        undo: jasmine.createSpy('undo2')
      };

      store.executeCommand(command1);
      store.executeCommand(command2);

      expect(command1.execute).toHaveBeenCalled();
      expect(command2.execute).toHaveBeenCalled();
      expect(store.canUndo).toBe(true);
    });
  });

  describe('undo', () => {
    beforeEach(() => {
      store.executeCommand(mockCommand);
    });

    it('should undo the last command', () => {
      store.undo();

      expect(undoSpy).toHaveBeenCalled();
    });

    it('should move command from undo stack to redo stack', () => {
      expect(store.canUndo).toBe(true);
      expect(store.canRedo).toBe(false);

      store.undo();

      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(true);
    });

    it('should do nothing if undo stack is empty', () => {
      store.undo(); // First undo
      store.undo(); // Second undo should do nothing

      expect(undoSpy).toHaveBeenCalledTimes(1);
    });

    it('should undo multiple commands in reverse order', () => {
      const command1 = mockCommand;
      const command2: Command = {
        execute: jasmine.createSpy('execute2'),
        undo: jasmine.createSpy('undo2')
      };

      store.executeCommand(command2);

      store.undo(); // Undo command2
      expect(command2.undo).toHaveBeenCalled();

      store.undo(); // Undo command1
      expect(command1.undo).toHaveBeenCalled();
    });
  });

  describe('redo', () => {
    beforeEach(() => {
      store.executeCommand(mockCommand);
      store.undo();
    });

    it('should redo the last undone command', () => {
      store.redo();

      expect(executeSpy).toHaveBeenCalledTimes(2); // Once on execute, once on redo
    });

    it('should move command from redo stack to undo stack', () => {
      expect(store.canUndo).toBe(false);
      expect(store.canRedo).toBe(true);

      store.redo();

      expect(store.canUndo).toBe(true);
      expect(store.canRedo).toBe(false);
    });

    it('should do nothing if redo stack is empty', () => {
      store.redo(); // First redo
      store.redo(); // Second redo should do nothing

      expect(executeSpy).toHaveBeenCalledTimes(2); // Original execute + one redo
    });

    it('should redo multiple commands in order', () => {
      const command1: Command = {
        execute: jasmine.createSpy('execute1'),
        undo: jasmine.createSpy('undo1')
      };
      const command2: Command = {
        execute: jasmine.createSpy('execute2'),
        undo: jasmine.createSpy('undo2')
      };

      store.executeCommand(command1);
      store.executeCommand(command2);
      store.undo(); // Undo command2
      store.undo(); // Undo command1

      store.redo(); // Redo command1
      expect(command1.execute).toHaveBeenCalledTimes(2);

      store.redo(); // Redo command2
      expect(command2.execute).toHaveBeenCalledTimes(2);
    });
  });

  describe('undo/redo chain', () => {
    it('should handle complex undo/redo sequence', () => {
      const commands: Command[] = [];

      for (let i = 0; i < 3; i++) {
        commands.push({
          execute: jasmine.createSpy(`execute${i}`),
          undo: jasmine.createSpy(`undo${i}`)
        });
        store.executeCommand(commands[i]);
      }

      // Undo twice
      store.undo();
      store.undo();

      expect(commands[2].undo).toHaveBeenCalled();
      expect(commands[1].undo).toHaveBeenCalled();

      // Redo once
      store.redo();

      expect(commands[1].execute).toHaveBeenCalledTimes(2);

      // Undo again
      store.undo();

      expect(commands[1].undo).toHaveBeenCalledTimes(2);
    });
  });

  describe('canUndo computed property', () => {
    it('should reactively update', () => {
      expect(store.canUndo).toBe(false);

      store.executeCommand(mockCommand);
      expect(store.canUndo).toBe(true);

      store.undo();
      expect(store.canUndo).toBe(false);

      store.redo();
      expect(store.canUndo).toBe(true);
    });
  });

  describe('canRedo computed property', () => {
    it('should reactively update', () => {
      expect(store.canRedo).toBe(false);

      store.executeCommand(mockCommand);
      expect(store.canRedo).toBe(false);

      store.undo();
      expect(store.canRedo).toBe(true);

      store.redo();
      expect(store.canRedo).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle executing command after partial undo', () => {
      const command1: Command = {
        execute: jasmine.createSpy('execute1'),
        undo: jasmine.createSpy('undo1')
      };
      const command2: Command = {
        execute: jasmine.createSpy('execute2'),
        undo: jasmine.createSpy('undo2')
      };
      const command3: Command = {
        execute: jasmine.createSpy('execute3'),
        undo: jasmine.createSpy('undo3')
      };

      store.executeCommand(command1);
      store.executeCommand(command2);
      store.undo();

      // Execute new command should clear redo stack
      store.executeCommand(command3);

      expect(store.canRedo).toBe(false);
      expect(store.canUndo).toBe(true);

      store.undo(); // Should undo command3
      expect(command3.undo).toHaveBeenCalled();

      store.undo(); // Should undo command1
      expect(command1.undo).toHaveBeenCalled();
    });
  });
});
