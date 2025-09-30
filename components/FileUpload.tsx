import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  imageUrl: string | null;
  file: File | null;
  onScanClick: () => void;
}

const PDFPreview: React.FC<{ fileName: string }> = ({ fileName }) => (
    <div className="flex flex-col items-center justify-center py-8 text-slate-300 h-full">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>
        <p className="mt-2 font-semibold truncate max-w-full px-4">{fileName}</p>
        <p className="text-xs text-slate-500 mt-1">PDF Document</p>
    </div>
);


export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, imageUrl, file, onScanClick }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files[0]);
    }
  }, [onFileSelect]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-3">
        <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors duration-300 min-h-[220px] flex justify-center items-center ${
            isDragging ? 'border-cyan-400 bg-slate-700' : 'border-slate-600 hover:border-cyan-500 hover:bg-slate-700/50'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        role="button"
        aria-label="Upload a document image or PDF"
        >
        <input
            id="file-input"
            type="file"
            className="hidden"
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, application/pdf"
        />
        {imageUrl ? (
            <img src={imageUrl} alt="Document preview" className="max-h-60 w-auto mx-auto rounded-md object-contain" />
        ) : file && file.type === 'application/pdf' ? (
            <PDFPreview fileName={file.name} />
        ) : (
            <div className="flex flex-col items-center justify-center py-8">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                <p className="mt-2 text-slate-300">
                    Drag & drop a document here, or <span className="font-semibold text-cyan-400">click to browse</span>.
                </p>
                <p className="text-xs text-slate-500 mt-1">PNG, JPG, WEBP, PDF supported.</p>
            </div>
        )}
        </div>
        <div className="flex items-center justify-center">
            <div className="flex-grow border-t border-slate-600"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-sm">OR</span>
            <div className="flex-grow border-t border-slate-600"></div>
        </div>
        <button
            type="button"
            onClick={onScanClick}
            className="w-full bg-slate-700 hover:bg-slate-600 text-cyan-300 font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center gap-2"
        >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 6a2 2 0 012-2h12a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM4 4a1 1 0 00-1 1v1h14V5a1 1 0 00-1-1H4zM3 9h14v5a1 1 0 01-1 1H4a1 1 0 01-1-1V9z" />
                <path d="M6 11a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" />
            </svg>
            Scan with Camera
        </button>
    </div>
  );
};