import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';

interface HighScoreDialogProps {
  isOpen: boolean;
  score: number;
  onSubmit: (name: string) => void;
}

const HighScoreDialog: React.FC<HighScoreDialogProps> = ({ isOpen, score, onSubmit }) => {
  const [name, setName] = useState('');
  const [currentChar, setCurrentChar] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setName('AAA');
      setCurrentChar(0);
    }
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.preventDefault();
    
    // Handle direct character input (A-Z)
    if (e.key.length === 1 && e.key.match(/[a-zA-Z]/)) {
      const upperChar = e.key.toUpperCase();
      const newName = name.split('');
      newName[currentChar] = upperChar;
      setName(newName.join(''));
      
      // Auto-advance to next character position
      if (currentChar < 2) {
        setCurrentChar(currentChar + 1);
      }
      return;
    }
    
    // Handle arrow key navigation for scrolling through letters
    if (e.key === 'ArrowUp') {
      const newName = name.split('');
      const charCode = newName[currentChar].charCodeAt(0);
      newName[currentChar] = String.fromCharCode(charCode === 90 ? 65 : charCode + 1); // A-Z wrap
      setName(newName.join(''));
    } else if (e.key === 'ArrowDown') {
      const newName = name.split('');
      const charCode = newName[currentChar].charCodeAt(0);
      newName[currentChar] = String.fromCharCode(charCode === 65 ? 90 : charCode - 1); // Z-A wrap
    } else if (e.key === 'ArrowRight') {
      setCurrentChar(Math.min(2, currentChar + 1));
    } else if (e.key === 'ArrowLeft') {
      setCurrentChar(Math.max(0, currentChar - 1));
    } else if (e.key === 'Tab') {
      // Tab to move between characters
      if (e.shiftKey) {
        setCurrentChar(Math.max(0, currentChar - 1));
      } else {
        setCurrentChar(Math.min(2, currentChar + 1));
      }
    } else if (e.key === 'Backspace') {
      // Backspace to clear current character and move back
      const newName = name.split('');
      newName[currentChar] = 'A';
      setName(newName.join(''));
      if (currentChar > 0) {
        setCurrentChar(currentChar - 1);
      }
    } else if (e.key === 'Delete') {
      // Delete to clear current character
      const newName = name.split('');
      newName[currentChar] = 'A';
      setName(newName.join(''));
    } else if (e.key === 'Enter' || e.key === ' ' || e.key === 'Escape') {
      onSubmit(name);
    }
  };

  // Handle mouse/touch input for character selection
  const handleCharacterClick = (index: number) => {
    setCurrentChar(index);
  };

  // Handle mouse wheel for character scrolling
  const handleCharacterWheel = (e: React.WheelEvent, index: number) => {
    e.preventDefault();
    const newName = name.split('');
    const charCode = newName[index].charCodeAt(0);
    
    if (e.deltaY < 0) {
      // Scroll up - next letter
      newName[index] = String.fromCharCode(charCode === 90 ? 65 : charCode + 1);
    } else {
      // Scroll down - previous letter
      newName[index] = String.fromCharCode(charCode === 65 ? 90 : charCode - 1);
    }
    
    setName(newName.join(''));
  };

  return (
    <Dialog open={isOpen}>
      <DialogContent 
        className="bg-black border-4 border-green-500 text-green-400 font-mono max-w-md"
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-green-400 mb-4 tracking-wider">
            *** HIGH SCORE ***
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-6">
          <div className="text-xl">
            SCORE: <span className="text-yellow-400">{score.toLocaleString()}</span>
          </div>
          
          <div className="text-lg">
            ENTER YOUR INITIALS:
          </div>
          
          <div className="flex justify-center space-x-2">
            {name.split('').map((char, index) => (
              <div
                key={index}
                className={`w-12 h-12 border-2 flex items-center justify-center text-2xl font-bold cursor-pointer transition-all duration-200 hover:scale-110 ${
                  index === currentChar 
                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400 shadow-lg shadow-yellow-400/50' 
                    : 'border-green-500 text-green-400 hover:border-green-300 hover:bg-green-500/10'
                }`}
                onClick={() => handleCharacterClick(index)}
                onWheel={(e) => handleCharacterWheel(e, index)}
                title={`Click to select, scroll to change letter`}
              >
                {char}
              </div>
            ))}
          </div>
          
          <div className="text-sm space-y-2 text-green-300 bg-black/50 rounded-lg p-4">
            <div className="text-yellow-400 font-bold mb-2">INPUT METHODS:</div>
            <div className="grid grid-cols-1 gap-1 text-xs">
              <div>🔤 <strong>Type A-Z:</strong> Direct character input</div>
              <div>⬆️⬇️ <strong>Arrow Keys:</strong> Scroll through letters</div>
              <div>⬅️➡️ <strong>Left/Right:</strong> Move cursor</div>
              <div>🖱️ <strong>Click:</strong> Select character position</div>
              <div>🎯 <strong>Mouse Wheel:</strong> Scroll letters</div>
              <div>⌫ <strong>Backspace:</strong> Clear & move back</div>
              <div>🗑️ <strong>Delete:</strong> Clear current character</div>
              <div>↹ <strong>Tab:</strong> Move between characters</div>
            </div>
            <div className="border-t border-green-500/30 pt-2 mt-2">
              <div>✅ <strong>ENTER/SPACE:</strong> Confirm entry</div>
              <div>❌ <strong>ESC:</strong> Skip entry</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HighScoreDialog;