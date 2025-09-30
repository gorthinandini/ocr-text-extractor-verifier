import React from 'react';
import { VerificationResult } from '../types';

interface VerificationResultsProps {
  results: VerificationResult;
}

export const VerificationResults: React.FC<VerificationResultsProps> = ({ results }) => {
  const totalFields = Object.keys(results).length;
  // FIX: Used Object.entries to correctly infer the type of the result values. The original `Object.values` was inferring the type as 'unknown', causing a TypeScript error.
  const matchedFields = Object.entries(results).filter(([, value]) => value.match).length;
  const accuracy = totalFields > 0 ? ((matchedFields / totalFields) * 100).toFixed(0) : 0;

  return (
    <div className="mt-4 p-4 bg-slate-800 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold text-cyan-400 mb-2">Verification Summary</h3>
      <div className="flex items-center justify-between">
        <p className="text-slate-300">Overall Match Accuracy:</p>
        <p className={`font-bold text-2xl ${accuracy === '100' ? 'text-green-400' : 'text-yellow-400'}`}>{accuracy}%</p>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-2.5 mt-2">
        <div className="bg-cyan-500 h-2.5 rounded-full" style={{ width: `${accuracy}%` }}></div>
      </div>
      <p className="text-sm text-slate-400 mt-2 text-right">{matchedFields} of {totalFields} fields matched.</p>
    </div>
  );
};