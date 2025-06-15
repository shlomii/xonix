
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
    
    if (e.key === 'ArrowUp') {
      const newName = name.split('');
      const charCode = newName[currentChar].charCodeAt(0);
      newName[currentChar] = String.fromCharCode(charCode === 90 ? 65 : charCode + 1); // A-Z wrap
      setName(newName.join(''));
    } else if (e.key === 'ArrowDown') {
      const newName = name.split('');
      const charCode = newName[currentChar].charCodeAt(0);
      newName[currentChar] = String.fromCharCode(charCode === 65 ? 90 : charCode - 1); // Z-A wrap
      setName(newName.join(''));
    } else if (e.key === 'ArrowRight') {
      setCurrentChar(Math.min(2, currentChar + 1));
    } else if (e.key === 'ArrowLeft') {
      setCurrentChar(Math.max(0, currentChar - 1));
    } else if (e.key === 'Enter' || e.key === ' ') {
      onSubmit(name);
    }
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
                className={`w-12 h-12 border-2 flex items-center justify-center text-2xl font-bold ${
                  index === currentChar 
                    ? 'border-yellow-400 bg-yellow-400/20 text-yellow-400' 
                    : 'border-green-500 text-green-400'
                }`}
              >
                {char}
              </div>
            ))}
          </div>
          
          <div className="text-sm space-y-1 text-green-300">
            <div>USE ↑↓ TO CHANGE LETTER</div>
            <div>USE ←→ TO MOVE CURSOR</div>
            <div>PRESS ENTER TO CONFIRM</div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default HighScoreDialog;
