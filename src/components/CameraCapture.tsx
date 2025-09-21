import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Camera, RotateCcw, Check, X, AlertTriangle, Settings } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface CameraCaptureProps {
  onCapture: (data: any) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [studentInfo, setStudentInfo] = useState({
    studentName: '',
    rollNumber: '',
    examDate: new Date().toISOString().split('T')[0]
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const checkCameraPermissions = useCallback(async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera not supported in this browser');
        return false;
      }

      // Check permission status if available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
        if (permission.state === 'denied') {
          setCameraError('Camera permission denied. Please enable camera access in your browser settings.');
          setHasPermission(false);
          return false;
        }
      }

      setHasPermission(true);
      return true;
    } catch (error) {
      console.error('Error checking camera permissions:', error);
      return true; // Assume permission is available if we can't check
    }
  }, []);

  const startCamera = useCallback(async () => {
    try {
      setCameraError(null);
      
      // Check permissions first
      const hasPermissions = await checkCameraPermissions();
      if (!hasPermissions) {
        return;
      }

      const constraints = {
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          facingMode: { ideal: 'environment' } // Prefer back camera but allow front as fallback
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsStreaming(true);
        setHasPermission(true);
        toast.success('Camera started successfully');
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      setIsStreaming(false);
      
      if (error.name === 'NotAllowedError') {
        setCameraError('Camera permission denied. Please allow camera access and try again.');
        setHasPermission(false);
        toast.error('Camera permission denied. Please allow camera access in your browser.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No camera found. Please connect a camera and try again.');
        toast.error('No camera found on this device.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('Camera is already in use by another application.');
        toast.error('Camera is already in use.');
      } else {
        setCameraError('Could not access camera. Please check your browser settings.');
        toast.error('Could not access camera. Please check permissions.');
      }
    }
  }, [checkCameraPermissions]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setIsStreaming(false);
    setCameraError(null);
  }, []);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const captureImage = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageDataUrl);
        stopCamera();
      }
    }
  }, [stopCamera]);

  const retakePhoto = useCallback(() => {
    setCapturedImage(null);
    startCamera();
  }, [startCamera]);

  const confirmCapture = useCallback(() => {
    if (capturedImage && studentInfo.studentName && studentInfo.rollNumber) {
      const captureData = {
        studentName: studentInfo.studentName,
        rollNumber: studentInfo.rollNumber,
        examDate: studentInfo.examDate,
        imageData: capturedImage,
        captureMethod: 'camera'
      };

      onCapture(captureData);
      setCapturedImage(null);
      setStudentInfo({
        studentName: '',
        rollNumber: '',
        examDate: new Date().toISOString().split('T')[0]
      });
      toast.success('OMR sheet captured successfully!');
    } else {
      toast.error('Please fill in student information before confirming.');
    }
  }, [capturedImage, studentInfo, onCapture]);

  return (
    <div className="space-y-6">
      {/* Student Information Form */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-medium mb-4">Student Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student Name</label>
              <input
                type="text"
                value={studentInfo.studentName}
                onChange={(e) => setStudentInfo(prev => ({ ...prev, studentName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter student name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Roll Number</label>
              <input
                type="text"
                value={studentInfo.rollNumber}
                onChange={(e) => setStudentInfo(prev => ({ ...prev, rollNumber: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter roll number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Exam Date</label>
              <input
                type="date"
                value={studentInfo.examDate}
                onChange={(e) => setStudentInfo(prev => ({ ...prev, examDate: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Camera Interface */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            {cameraError && (
              <Alert className="mb-4" variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {cameraError}
                  {hasPermission === false && (
                    <div className="mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.location.reload()}
                        className="gap-2"
                      >
                        <Settings className="h-3 w-3" />
                        Refresh & Try Again
                      </Button>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {!isStreaming && !capturedImage && (
              <div className="text-center py-12">
                <Camera className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Click to start camera and capture OMR sheet</p>
                <Button onClick={startCamera} className="gap-2" disabled={hasPermission === false}>
                  <Camera className="h-4 w-4" />
                  Start Camera
                </Button>
                {hasPermission === false && (
                  <p className="text-sm text-red-600 mt-2">
                    Camera access is required to capture OMR sheets
                  </p>
                )}
              </div>
            )}

            {isStreaming && (
              <div className="relative">
                <video
                  ref={videoRef}
                  className="w-full max-w-2xl mx-auto rounded-lg border"
                  autoPlay
                  playsInline
                  muted
                />
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50"></div>
                  <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    Position OMR sheet within the frame
                  </div>
                </div>
                <div className="flex justify-center mt-4 gap-4">
                  <Button onClick={captureImage} size="lg" className="gap-2">
                    <Camera className="h-4 w-4" />
                    Capture
                  </Button>
                  <Button onClick={stopCamera} variant="outline" size="lg">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {capturedImage && (
              <div className="relative">
                <img
                  src={capturedImage}
                  alt="Captured OMR sheet"
                  className="w-full max-w-2xl mx-auto rounded-lg border"
                />
                <div className="flex justify-center mt-4 gap-4">
                  <Button onClick={confirmCapture} size="lg" className="gap-2 bg-green-600 hover:bg-green-700">
                    <Check className="h-4 w-4" />
                    Confirm & Process
                  </Button>
                  <Button onClick={retakePhoto} variant="outline" size="lg" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Retake
                  </Button>
                </div>
              </div>
            )}

            <canvas ref={canvasRef} className="hidden" />
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <h4 className="font-medium text-blue-900 mb-2">Capture Instructions:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Ensure good lighting and minimal shadows</li>
            <li>• Keep the OMR sheet flat and within the frame</li>
            <li>• Make sure all bubbles are clearly visible</li>
            <li>• Avoid reflections and glare on the sheet</li>
            <li>• Fill in student information before capturing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}