import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Spinner } from './Spinner';

interface CameraScannerProps {
    onCapture: (blob: Blob) => void;
    onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onCapture, onClose }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
            setError(null);
        } catch (err) {
            console.error("Error accessing camera:", err);
            setError("Could not access the camera. Please ensure permissions are granted and you are using a secure (HTTPS) connection.");
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        startCamera();
        return () => {
            stream?.getTracks().forEach(track => track.stop());
        };
    }, [startCamera, stream]);

    const handleCanPlay = () => {
        setIsLoading(false);
    };

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            if (context) {
                context.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
                stream?.getTracks().forEach(track => track.stop());
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        setIsLoading(true);
        startCamera();
    };

    const handleConfirm = () => {
        if (canvasRef.current) {
            canvasRef.current.toBlob(blob => {
                if (blob) {
                    onCapture(blob);
                }
            }, 'image/jpeg', 0.9);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
            <div className="relative w-full max-w-4xl aspect-video bg-slate-900 rounded-lg overflow-hidden shadow-2xl flex items-center justify-center">
                {error && <div className="p-8 text-center text-red-400">{error}</div>}
                
                {isLoading && !error && (
                    <div className="flex flex-col items-center gap-4">
                        <Spinner />
                        <p className="text-slate-300">Starting camera...</p>
                    </div>
                )}
                
                <video 
                    ref={videoRef} 
                    autoPlay 
                    playsInline 
                    className={`w-full h-full object-contain transition-opacity duration-300 ${capturedImage || isLoading || error ? 'opacity-0' : 'opacity-100'}`}
                    onCanPlay={handleCanPlay}
                />
                
                <canvas ref={canvasRef} className="hidden" />

                {capturedImage && (
                    <img src={capturedImage} alt="Captured document" className="w-full h-full object-contain" />
                )}
            </div>

            <div className="mt-6 flex gap-4 items-center">
                {!capturedImage ? (
                    <button 
                        onClick={handleCapture}
                        disabled={isLoading || !!error}
                        className="p-4 bg-white rounded-full focus:outline-none focus:ring-4 focus:ring-cyan-500/50 disabled:opacity-50"
                        aria-label="Capture photo"
                    >
                        <div className="w-8 h-8 rounded-full border-4 border-slate-800 bg-white"></div>
                    </button>
                ) : (
                    <>
                        <button onClick={handleRetake} className="text-white font-semibold py-3 px-6 rounded-lg bg-slate-700 hover:bg-slate-600 transition">
                            Retake
                        </button>
                        <button onClick={handleConfirm} className="text-white font-bold py-3 px-8 rounded-lg bg-cyan-600 hover:bg-cyan-700 transition">
                            Use Photo
                        </button>
                    </>
                )}
            </div>

            <button onClick={onClose} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/80 transition" aria-label="Close scanner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
    );
};
