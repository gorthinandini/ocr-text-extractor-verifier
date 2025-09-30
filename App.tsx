import React, { useState, useCallback } from 'react';
import { FileUpload } from './components/FileUpload';
import { DataForm } from './components/DataForm';
import { VerificationResults } from './components/VerificationResults';
import { extractDataFromImage, verifyDataWithGemini, analyzeImageQuality } from './services/ocrService';
import { fileToBase64 } from './utils/fileUtils';
import { FormData, VerificationResult, ImageQualityReport } from './types';
import { Header } from './components/Header';
import { Spinner } from './components/Spinner';
import { CameraScanner } from './components/CameraScanner';


// --- New component defined in-file for Image Quality Feedback ---
interface ImageQualityFeedbackProps {
    report: ImageQualityReport;
}

const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
};

const getIcon = (isGoodQuality: boolean) => {
    if (isGoodQuality) {
        return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
    }
    return <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
}

const ImageQualityFeedback: React.FC<ImageQualityFeedbackProps> = ({ report }) => {
    return (
        <div className="p-4 bg-slate-800 rounded-lg shadow-lg border border-slate-700">
            <div className="flex items-start gap-4">
                <div>{getIcon(report.isGoodQuality)}</div>
                <div className="flex-1">
                    <div className="flex justify-between items-center">
                        <h4 className="font-semibold text-white">Image Quality Analysis</h4>
                        <span className={`font-bold text-xl ${getScoreColor(report.score)}`}>{report.score}/100</span>
                    </div>
                    <div className="w-full bg-slate-600 rounded-full h-2 my-2">
                        <div className={`h-2 rounded-full ${report.isGoodQuality ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${report.score}%` }}></div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 mt-3 text-sm text-slate-300">
                        {report.feedback.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};
// --- End of new component ---

enum AppState {
  IDLE,
  ANALYZING_QUALITY,
  LOADING_OCR,
  EDITING,
  VERIFYING,
  VERIFIED,
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [formData, setFormData] = useState<FormData>({});
  const [verificationResults, setVerificationResults] = useState<VerificationResult>({});
  const [qualityReport, setQualityReport] = useState<ImageQualityReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [documentType, setDocumentType] = useState<string>('generic');

  const handleFileSelect = useCallback(async (file: File) => {
    setImageFile(file);
    // Only create object URLs for images, not for PDFs
    if (file.type.startsWith('image/')) {
        setImageUrl(URL.createObjectURL(file));
    } else {
        setImageUrl('');
    }
    setAppState(AppState.ANALYZING_QUALITY);
    setFormData({});
    setVerificationResults({});
    setQualityReport(null);
    setError(null);
    setDocumentType('generic');

    try {
      const base64Image = await fileToBase64(file);
      const report = await analyzeImageQuality(base64Image, file.type);
      setQualityReport(report);
      setAppState(AppState.IDLE);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred during image analysis.");
      setAppState(AppState.IDLE);
    }
  }, []);
  
  const handleImageCapture = useCallback((imageBlob: Blob) => {
    const imageFile = new File([imageBlob], `scan-${Date.now()}.jpeg`, { type: 'image/jpeg' });
    handleFileSelect(imageFile);
    setIsScannerOpen(false);
  }, [handleFileSelect]);

  const handleExtraction = useCallback(async () => {
    if (!imageFile) {
      setError("Please select a file first.");
      return;
    }
    setAppState(AppState.LOADING_OCR);
    setError(null);

    try {
      const base64Image = await fileToBase64(imageFile);
      const extractedData = await extractDataFromImage(base64Image, imageFile.type, documentType);
      setFormData(extractedData);
      setAppState(AppState.EDITING);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : "An unknown error occurred during extraction.");
      setAppState(AppState.IDLE);
    }
  }, [imageFile, documentType]);

  const handleFormDataChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    if (appState === AppState.VERIFIED) {
        setAppState(AppState.EDITING);
        setVerificationResults({});
    }
  };

  const handleVerification = useCallback(async () => {
    if (!imageFile) {
        setError("An image is required for verification.");
        return;
    }
    setAppState(AppState.VERIFYING);
    setError(null);
    try {
        const base64Image = await fileToBase64(imageFile);
        const results = await verifyDataWithGemini(base64Image, imageFile.type, formData);
        setVerificationResults(results);
        setAppState(AppState.VERIFIED);
    } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : "An unknown error occurred during verification.");
        setAppState(AppState.EDITING);
    }
  }, [imageFile, formData]);

  const hasData = Object.keys(formData).length > 0;

  return (
    <>
      <Header />
      <main className="container mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Upload Document</h2>
            <FileUpload 
                onFileSelect={handleFileSelect} 
                imageUrl={imageUrl} 
                file={imageFile}
                onScanClick={() => setIsScannerOpen(true)} 
            />
            
            {appState === AppState.ANALYZING_QUALITY && (
                <div className="flex justify-center items-center gap-4 p-4 bg-slate-800 rounded-lg">
                    <Spinner />
                    <p className="text-slate-300">Analyzing image quality...</p>
                </div>
            )}

            {qualityReport && appState === AppState.IDLE && (
              <ImageQualityFeedback report={qualityReport} />
            )}

            {imageFile && appState === AppState.IDLE && (
              <div className="space-y-4">
                 <div className="space-y-2">
                    <label htmlFor="docType" className="block text-sm font-medium text-slate-300">
                        Select Document Type (Optional)
                    </label>
                    <select
                        id="docType"
                        value={documentType}
                        onChange={(e) => setDocumentType(e.target.value)}
                        className="w-full bg-slate-700 border-2 border-slate-600 rounded-md py-2 px-3 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
                    >
                        <option value="generic">Generic Document</option>
                        <option value="id_card">ID Card</option>
                        <option value="invoice">Invoice</option>
                        <option value="receipt">Receipt</option>
                    </select>
                    <p className="text-xs text-slate-400">Providing context helps improve extraction accuracy.</p>
                </div>
                <button
                    onClick={handleExtraction}
                    className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center disabled:opacity-50"
                    disabled={!imageFile}
                >
                    Extract Data
                </button>
              </div>
            )}
             {appState === AppState.LOADING_OCR && (
                <div className="flex justify-center items-center gap-4 p-4 bg-slate-800 rounded-lg">
                    <Spinner />
                    <p className="text-slate-300">Extracting data from document...</p>
                </div>
            )}
          </div>

          <div className="space-y-4">
            { (appState === AppState.EDITING || appState === AppState.VERIFYING || appState === AppState.VERIFIED) && hasData && (
              <>
                <h2 className="text-xl font-semibold text-white">2. Review & Verify Data</h2>
                <div className="p-6 bg-slate-800 rounded-lg shadow-lg">
                  <DataForm 
                    formData={formData} 
                    onChange={handleFormDataChange} 
                    verificationResults={verificationResults}
                    isVerified={appState === AppState.VERIFIED}
                  />
                </div>
              </>
            )}
            
            {error && <div className="p-4 bg-red-900/50 border border-red-700 text-red-300 rounded-lg">{error}</div>}

            {appState === AppState.EDITING && hasData && (
               <button
                onClick={handleVerification}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white font-bold py-3 px-4 rounded-lg transition duration-300 ease-in-out flex items-center justify-center"
               >
                 Verify Data with AI
               </button>
            )}

            {appState === AppState.VERIFYING && (
                <div className="flex justify-center items-center gap-4 p-4 bg-slate-800 rounded-lg">
                    <Spinner />
                    <p className="text-slate-300">AI is verifying against the document...</p>
                </div>
            )}

            {appState === AppState.VERIFIED && (
              <VerificationResults results={verificationResults} />
            )}
          </div>
        </div>
      </main>
      {isScannerOpen && (
        <CameraScanner 
            onCapture={handleImageCapture}
            onClose={() => setIsScannerOpen(false)}
        />
      )}
    </>
  );
}