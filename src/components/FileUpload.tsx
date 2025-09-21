import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Upload, File, X, Check } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface FileUploadProps {
  onUpload: (data: any) => void;
}

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  studentName: string;
  rollNumber: string;
  examDate: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
}

export function FileUpload({ onUpload }: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  }, []);

  const handleFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length !== files.length) {
      toast.error('Please upload only image files (PNG, JPG, JPEG)');
    }

    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        const newFile: UploadedFile = {
          id,
          file,
          preview: e.target?.result as string,
          studentName: '',
          rollNumber: '',
          examDate: new Date().toISOString().split('T')[0],
          status: 'pending',
          progress: 0
        };
        
        setUploadedFiles(prev => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });
  }, []);

  const removeFile = useCallback((id: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== id));
  }, []);

  const updateFileInfo = useCallback((id: string, field: string, value: string) => {
    setUploadedFiles(prev => prev.map(file => 
      file.id === id ? { ...file, [field]: value } : file
    ));
  }, []);

  const processFile = useCallback((id: string) => {
    const file = uploadedFiles.find(f => f.id === id);
    if (!file || !file.studentName || !file.rollNumber) {
      toast.error('Please fill in all student information');
      return;
    }

    // Update status to processing
    setUploadedFiles(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'processing', progress: 0 } : f
    ));

    // Simulate processing with progress
    const progressInterval = setInterval(() => {
      setUploadedFiles(prev => prev.map(f => {
        if (f.id === id && f.status === 'processing') {
          const newProgress = Math.min(f.progress + Math.random() * 20, 90);
          return { ...f, progress: newProgress };
        }
        return f;
      }));
    }, 200);

    // Complete processing after 3 seconds
    setTimeout(() => {
      clearInterval(progressInterval);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === id ? { ...f, status: 'completed', progress: 100 } : f
      ));

      // Prepare data for processing
      const uploadData = {
        studentName: file.studentName,
        rollNumber: file.rollNumber,
        examDate: file.examDate,
        imageData: file.preview,
        captureMethod: 'upload'
      };

      onUpload(uploadData);
      toast.success(`OMR sheet processed for ${file.studentName}`);
    }, 3000);
  }, [uploadedFiles, onUpload]);

  const processBatch = useCallback(() => {
    const pendingFiles = uploadedFiles.filter(f => f.status === 'pending' && f.studentName && f.rollNumber);
    
    if (pendingFiles.length === 0) {
      toast.error('No files ready for processing. Please fill in student information.');
      return;
    }

    pendingFiles.forEach(file => processFile(file.id));
    toast.success(`Processing ${pendingFiles.length} OMR sheets...`);
  }, [uploadedFiles, processFile]);

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={(e) => { e.preventDefault(); setDragActive(false); }}
        onDragOver={(e) => { e.preventDefault(); }}
        onDrop={handleDrop}
      >
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="mb-2">Drag and drop OMR sheet images here</p>
        <p className="text-sm text-gray-600 mb-4">or</p>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileInput}
          className="hidden"
          id="file-upload"
        />
        <Button asChild variant="outline">
          <label htmlFor="file-upload" className="cursor-pointer">
            Choose Files
          </label>
        </Button>
        <p className="text-xs text-gray-500 mt-2">Supports PNG, JPG, JPEG files</p>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-medium">Uploaded Files ({uploadedFiles.length})</h3>
            <Button onClick={processBatch} className="gap-2">
              <Check className="h-4 w-4" />
              Process All Ready
            </Button>
          </div>
          
          <div className="space-y-4">
            {uploadedFiles.map(file => (
              <Card key={file.id} className="p-4">
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <img
                      src={file.preview}
                      alt="OMR preview"
                      className="w-20 h-20 object-cover rounded border"
                    />
                  </div>
                  
                  <div className="flex-1 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{file.file.name}</p>
                        <p className="text-sm text-gray-600">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {file.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => processFile(file.id)}
                            disabled={!file.studentName || !file.rollNumber}
                          >
                            Process
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFile(file.id)}
                          disabled={file.status === 'processing'}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1">Student Name</label>
                        <input
                          type="text"
                          value={file.studentName}
                          onChange={(e) => updateFileInfo(file.id, 'studentName', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Enter name"
                          disabled={file.status !== 'pending'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Roll Number</label>
                        <input
                          type="text"
                          value={file.rollNumber}
                          onChange={(e) => updateFileInfo(file.id, 'rollNumber', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          placeholder="Enter roll no."
                          disabled={file.status !== 'pending'}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1">Exam Date</label>
                        <input
                          type="date"
                          value={file.examDate}
                          onChange={(e) => updateFileInfo(file.id, 'examDate', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                          disabled={file.status !== 'pending'}
                        />
                      </div>
                    </div>
                    
                    {file.status === 'processing' && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>Processing...</span>
                          <span>{Math.round(file.progress)}%</span>
                        </div>
                        <Progress value={file.progress} className="h-2" />
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Processing completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}