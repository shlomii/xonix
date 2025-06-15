
import React from 'react';
import { HighScore } from '../utils/HighScoreManager';

interface HighScoreTableProps {
  scores: HighScore[];
  currentScore?: number;
}

const HighScoreTable: React.FC<HighScoreTableProps> = ({ scores, currentScore }) => {
  return (
    <div className="bg-black/90 border-4 border-green-500 p-6 font-mono text-green-400 max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-center mb-6 tracking-wider text-yellow-400">
        *** HIGH SCORES ***
      </h2>
      
      <div className="space-y-2">
        <div className="flex justify-between text-sm border-b border-green-500 pb-2 mb-4">
          <span>RANK</span>
          <span>NAME</span>
          <span>SCORE</span>
        </div>
        
        {scores.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            NO SCORES YET
          </div>
        ) : (
          scores.map((score, index) => (
            <div 
              key={index}
              className={`flex justify-between py-1 ${
                currentScore === score.score ? 'text-yellow-400 font-bold' : ''
              }`}
            >
              <span className="w-8">{(index + 1).toString().padStart(2, '0')}</span>
              <span className="w-8 text-center">{score.name}</span>
              <span className="text-right">{score.score.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
      
      <div className="text-center mt-6 text-xs text-green-300">
        PRESS ESC TO CONTINUE
      </div>
    </div>
  );
};

export default HighScoreTable;
