import React from 'react';
import { FormData, VerificationResult } from '../types';

interface DataFormProps {
  formData: FormData;
  onChange: (key: string, value: string) => void;
  verificationResults: VerificationResult;
  isVerified: boolean;
}

const getBorderColor = (isVerified: boolean, key: string, results: VerificationResult): string => {
    if (!isVerified) return 'border-slate-600 focus:border-cyan-500';
    if (results[key]?.match) return 'border-green-500';
    return 'border-red-500';
}

const getIcon = (isVerified: boolean, key: string, results: VerificationResult) => {
    if (!isVerified) return null;
    if (results[key]?.match) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>;
}


export const DataForm: React.FC<DataFormProps> = ({ formData, onChange, verificationResults, isVerified }) => {
  return (
    <form className="space-y-4">
      {Object.keys(formData).map((key) => {
        const result = verificationResults[key];
        const hasError = isVerified && result && !result.match;
        
        return (
            <div key={key}>
              <label htmlFor={key} className="block text-sm font-medium text-slate-300 mb-1">
                {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </label>
              <div className="relative">
                <input
                  type="text"
                  id={key}
                  name={key}
                  value={formData[key]}
                  onChange={(e) => onChange(key, e.target.value)}
                  className={`w-full bg-slate-700 border-2 rounded-md py-2 px-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 ${getBorderColor(isVerified, key, verificationResults)}`}
                  aria-invalid={hasError}
                  aria-describedby={hasError ? `${key}-error` : undefined}
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    {getIcon(isVerified, key, verificationResults)}
                </div>
              </div>
              {hasError && result.reason && (
                <p id={`${key}-error`} className="mt-1 text-sm text-red-400">
                  {result.reason}
                </p>
              )}
            </div>
        );
      })}
    </form>
  );
};
