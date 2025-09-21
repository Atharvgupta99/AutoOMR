import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Upload, FileSpreadsheet, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface AnswerKeyUploadProps {
  onUpload: (answerKey: any) => void;
}

export function AnswerKeyUpload({ onUpload }: AnswerKeyUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [examInfo, setExamInfo] = useState({
    examName: '',
    setVersion: 'A',
    totalQuestions: 100,
    subjectsPerQuestion: 20
  });
  const [parsedData, setParsedData] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.name.endsWith('.csv')) {
      setFile(selectedFile);
      parseExcelFile(selectedFile);
    } else if (selectedFile && (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls'))) {
      toast.error('Excel files not supported yet. Please convert to CSV format.');
    } else {
      toast.error('Please upload a CSV file');
    }
  }, []);

  const parseExcelFile = useCallback(async (file: File) => {
    setIsProcessing(true);
    
    try {
      const text = await file.text();
      const answers: { [key: number]: string } = {};
      
      // Parse CSV format
      if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          const [questionStr, answerStr] = line.split(',').map(s => s.trim().replace(/"/g, ''));
          const questionNum = parseInt(questionStr);
          const answer = answerStr.toUpperCase();
          
          // Validate question number and answer
          if (!isNaN(questionNum) && questionNum > 0 && ['A', 'B', 'C', 'D'].includes(answer)) {
            answers[questionNum] = answer;
          }
        }
      } else {
        // For Excel files, we'll parse as CSV for now
        // In a real implementation, you'd use a library like xlsx
        toast.error('Excel parsing not implemented yet. Please use CSV format with Question,Answer columns.');
        setIsProcessing(false);
        return;
      }
      
      // Validate that we have the expected number of questions
      const questionCount = Object.keys(answers).length;
      if (questionCount === 0) {
        toast.error('No valid answers found. Please check your file format.');
        setIsProcessing(false);
        return;
      }
      
      const parsedData = {
        filename: file.name,
        totalQuestions: questionCount,
        answers,
        subjects: [
          { name: 'Data Analytics', questions: '1-20' },
          { name: 'Machine Learning', questions: '21-40' },
          { name: 'Python Programming', questions: '41-60' },
          { name: 'Statistics', questions: '61-80' },
          { name: 'SQL & Databases', questions: '81-100' }
        ]
      };
      
      setParsedData(parsedData);
      toast.success(`Answer key parsed successfully! Found ${questionCount} questions.`);
    } catch (error) {
      console.error('Error parsing file:', error);
      toast.error('Failed to parse answer key file. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const confirmUpload = useCallback(() => {
    if (!parsedData || !examInfo.examName) {
      toast.error('Please fill in exam information and upload a valid file');
      return;
    }

    const answerKey = {
      examName: examInfo.examName,
      setVersion: examInfo.setVersion,
      totalQuestions: examInfo.totalQuestions,
      answers: parsedData.answers,
      subjects: parsedData.subjects
    };

    onUpload(answerKey);
    
    // Reset form
    setFile(null);
    setParsedData(null);
    setExamInfo({
      examName: '',
      setVersion: 'A',
      totalQuestions: 100,
      subjectsPerQuestion: 20
    });
  }, [parsedData, examInfo, onUpload]);

  return (
    <div className="space-y-6">
      {/* Exam Information */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <h4 className="font-medium">Exam Information</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="examName">Exam Name</Label>
              <Input
                id="examName"
                value={examInfo.examName}
                onChange={(e) => setExamInfo(prev => ({ ...prev, examName: e.target.value }))}
                placeholder="e.g., Placement Assessment Q1 2024"
              />
            </div>
            
            <div>
              <Label htmlFor="setVersion">Set Version</Label>
              <Select
                value={examInfo.setVersion}
                onValueChange={(value) => setExamInfo(prev => ({ ...prev, setVersion: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A">Set A</SelectItem>
                  <SelectItem value="B">Set B</SelectItem>
                  <SelectItem value="C">Set C</SelectItem>
                  <SelectItem value="D">Set D</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="totalQuestions">Total Questions</Label>
              <Input
                id="totalQuestions"
                type="number"
                value={examInfo.totalQuestions}
                onChange={(e) => setExamInfo(prev => ({ ...prev, totalQuestions: parseInt(e.target.value) || 100 }))}
                min="1"
                max="200"
              />
            </div>
            
            <div>
              <Label htmlFor="subjectsPerQuestion">Questions per Subject</Label>
              <Input
                id="subjectsPerQuestion"
                type="number"
                value={examInfo.subjectsPerQuestion}
                onChange={(e) => setExamInfo(prev => ({ ...prev, subjectsPerQuestion: parseInt(e.target.value) || 20 }))}
                min="1"
                max="50"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Upload */}
      <Card>
        <CardContent className="p-4">
          <h4 className="font-medium mb-4">Upload Answer Key File</h4>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="mb-2">Upload Excel or CSV file with answer key</p>
            <p className="text-sm text-gray-600 mb-4">
              File should contain Question Number and Correct Answer (A/B/C/D) columns
            </p>
            
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
              id="answer-key-upload"
            />
            <Button asChild variant="outline">
              <label htmlFor="answer-key-upload" className="cursor-pointer">
                <Upload className="h-4 w-4 mr-2" />
                Choose File
              </label>
            </Button>
          </div>
          
          {file && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium">{file.name}</span>
                <span className="text-xs text-gray-600">
                  ({(file.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processing Status */}
      {isProcessing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-blue-700">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600"></div>
              <span>Processing answer key file...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Data Preview */}
      {parsedData && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2 mb-4">
              <Check className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Answer Key Parsed Successfully</h4>
                <p className="text-sm text-green-700">
                  Found {parsedData.totalQuestions} questions with answers
                </p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <h5 className="font-medium text-sm mb-2">Subject Distribution:</h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {parsedData.subjects.map((subject: any, index: number) => (
                    <div key={index} className="flex justify-between bg-white px-2 py-1 rounded">
                      <span>{subject.name}</span>
                      <span className="text-gray-600">Q{subject.questions}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-sm mb-2">Sample Answers:</h5>
                <div className="bg-white p-2 rounded text-sm font-mono">
                  {Object.entries(parsedData.answers).slice(0, 10).map(([q, a]) => (
                    <span key={q} className="inline-block mr-3">
                      Q{q}: {a}
                    </span>
                  ))}
                  {parsedData.totalQuestions > 10 && <span>...</span>}
                </div>
              </div>
            </div>
            
            <Button 
              onClick={confirmUpload} 
              className="w-full mt-4 bg-green-600 hover:bg-green-700"
              disabled={!examInfo.examName}
            >
              Confirm & Save Answer Key
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-800 mb-2">File Format Requirements:</h4>
              <ul className="text-sm text-amber-700 space-y-1">
                <li>• CSV file format (Excel files coming soon)</li>
                <li>• First column: Question Number (1, 2, 3, ...)</li>
                <li>• Second column: Correct Answer (A, B, C, or D)</li>
                <li>• No header row required, but acceptable if present</li>
                <li>• Questions should be numbered from 1 to {examInfo.totalQuestions}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}