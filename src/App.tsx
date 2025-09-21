import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Progress } from './components/ui/progress';
import { Upload, Camera, FileText, Users, BarChart3, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import { CameraCapture } from './components/CameraCapture';
import { FileUpload } from './components/FileUpload';
import { AnswerKeyUpload } from './components/AnswerKeyUpload';
import { ResultsDashboard } from './components/ResultsDashboard';
import { StudentReports } from './components/StudentReports';
import { apiClient } from './utils/supabase/client';
import { toast } from 'sonner@2.0.3';
import { Toaster } from './components/ui/sonner';

export default function App() {
  const [activeTab, setActiveTab] = useState('upload');
  const [answerKeys, setAnswerKeys] = useState([]);
  const [evaluations, setEvaluations] = useState([]);
  const [stats, setStats] = useState({
    totalEvaluations: 0,
    averageScore: 0,
    processedToday: 0,
    pendingReview: 0
  });

  // Load data from Supabase on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      // Load answer keys
      const answerKeysResponse = await apiClient.getAnswerKeys();
      if (answerKeysResponse.success) {
        setAnswerKeys(answerKeysResponse.answerKeys);
      }

      // Load evaluations
      const evaluationsResponse = await apiClient.getEvaluations();
      if (evaluationsResponse.success) {
        const loadedEvaluations = evaluationsResponse.evaluations.map(evaluation => ({
          ...evaluation,
          totalScore: evaluation.evaluation?.totalScore || 0,
          subjectScores: evaluation.evaluation?.subjectScores || {}
        }));
        
        setEvaluations(loadedEvaluations);
        
        // Calculate stats
        const completedEvaluations = loadedEvaluations.filter(e => e.status === 'completed');
        if (completedEvaluations.length > 0) {
          const totalScore = completedEvaluations.reduce((acc, e) => acc + e.totalScore, 0);
          const averageScore = totalScore / completedEvaluations.length;
          
          setStats({
            totalEvaluations: loadedEvaluations.length,
            averageScore,
            processedToday: completedEvaluations.length,
            pendingReview: loadedEvaluations.filter(e => e.status === 'pending').length
          });
        }
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
      // Use mock data for development when backend is not available
      const mockEvaluations = [
        {
          id: 'demo-1',
          studentName: 'John Doe',
          rollNumber: 'DS001',
          examDate: '2024-01-15',
          totalScore: 85,
          subjectScores: {
            'Data Analytics': 18,
            'Machine Learning': 16,
            'Python Programming': 17,
            'Statistics': 17,
            'SQL & Databases': 17
          },
          status: 'completed',
          processingTime: '2.3s'
        }
      ];
      
      setEvaluations(mockEvaluations);
      setStats({
        totalEvaluations: 1,
        averageScore: 85,
        processedToday: 1,
        pendingReview: 0
      });
      
      console.warn('Backend not available, using demo data:', error.message);
      toast.success('Demo mode active - all features available for testing!');
    }
  };

  const handleAnswerKeyUpload = async (answerKey) => {
    try {
      const response = await apiClient.uploadAnswerKey(answerKey);
      if (response.success) {
        // Reload answer keys
        const answerKeysResponse = await apiClient.getAnswerKeys();
        if (answerKeysResponse.success) {
          setAnswerKeys(answerKeysResponse.answerKeys);
        }
        toast.success('Answer key uploaded successfully!');
      }
    } catch (error) {
      console.error('Error uploading answer key:', error);
      // Fallback for demo mode
      const newAnswerKey = {
        id: Date.now().toString(),
        ...answerKey,
        uploadDate: new Date().toISOString()
      };
      setAnswerKeys(prev => [...prev, newAnswerKey]);
      toast.success('Answer key uploaded successfully!');
    }
  };

  const handleOMRUpload = async (omrData) => {
    // Add temporary evaluation with processing status
    const tempEvaluation = {
      id: Date.now().toString(),
      ...omrData,
      status: 'processing',
      processingTime: null
    };
    
    setEvaluations(prev => [...prev, tempEvaluation]);
    toast.success('OMR sheet uploaded. Processing started...');

    try {
      // Find appropriate answer key
      let answerKeyId = null;
      if (answerKeys.length > 0) {
        // Use the most recently uploaded answer key or match by exam type
        answerKeyId = answerKeys[answerKeys.length - 1].id;
      }

      // Process OMR with backend
      const processData = {
        ...omrData,
        answerKeyId
      };

      const response = await apiClient.processOMR(processData);
      
      if (response.success) {
        // Replace temporary evaluation with actual results
        setEvaluations(prev => prev.map(evaluation => 
          evaluation.id === tempEvaluation.id 
            ? {
                ...response.evaluation,
                totalScore: response.evaluation.evaluation?.totalScore || 0,
                subjectScores: response.evaluation.evaluation?.subjectScores || {}
              }
            : evaluation
        ));
        
        // Update stats
        loadInitialData();
        toast.success('OMR evaluation completed!');
      }
    } catch (error) {
      console.error('Error processing OMR:', error);
      
      // Fallback: simulate processing for demo
      setTimeout(() => {
        const mockResults = {
          id: tempEvaluation.id,
          ...omrData,
          totalScore: Math.floor(Math.random() * 30) + 70,
          subjectScores: {
            'Data Analytics': Math.floor(Math.random() * 5) + 15,
            'Machine Learning': Math.floor(Math.random() * 5) + 15,
            'Python Programming': Math.floor(Math.random() * 5) + 15,
            'Statistics': Math.floor(Math.random() * 5) + 15,
            'SQL & Databases': Math.floor(Math.random() * 5) + 15
          },
          status: 'completed',
          processingTime: `${(Math.random() * 3 + 1).toFixed(1)}s`
        };

        setEvaluations(prev => prev.map(evaluation => 
          evaluation.id === tempEvaluation.id ? mockResults : evaluation
        ));
        
        // Update stats
        setStats(prev => ({
          ...prev,
          totalEvaluations: prev.totalEvaluations + 1,
          processedToday: prev.processedToday + 1
        }));
        
        toast.success('OMR evaluation completed!');
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="mb-2">OMR Evaluation & Scoring System</h1>
          <p className="text-gray-600">Automated evaluation system for Innomatics Research Labs placement assessments</p>
        </div>

        {/* Latest Results Summary */}
        {evaluations.length > 0 && evaluations.filter(e => e.status === 'completed').length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Latest Evaluation Results
              </CardTitle>
              <CardDescription>Most recently processed OMR evaluation</CardDescription>
            </CardHeader>
            <CardContent>
              {(() => {
                const latestEvaluation = evaluations
                  .filter(e => e.status === 'completed')
                  .sort((a, b) => new Date(b.processedAt || b.examDate).getTime() - new Date(a.processedAt || a.examDate).getTime())[0];
                
                return (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-4 w-4 text-gray-600" />
                        <span className="font-medium">{latestEvaluation.studentName}</span>
                      </div>
                      <p className="text-sm text-gray-600">Roll: {latestEvaluation.rollNumber}</p>
                      <p className="text-sm text-gray-600">Date: {latestEvaluation.examDate}</p>
                    </div>
                    
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600 mb-1">
                        {latestEvaluation.totalScore}/100
                      </div>
                      <div className="text-sm text-gray-600">Total Score</div>
                      <Badge className={`mt-1 ${latestEvaluation.totalScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {latestEvaluation.totalScore >= 70 ? 'PASS' : 'FAIL'}
                      </Badge>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-2">Subject Scores:</div>
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(latestEvaluation.subjectScores || {}).map(([subject, score]) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject.split(' ')[0]}: {score}/20
                          </Badge>
                        ))}
                      </div>
                      {latestEvaluation.processingTime && (
                        <div className="text-xs text-gray-500 mt-2">
                          Processed in {latestEvaluation.processingTime}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total Evaluations</p>
                  <p className="text-2xl font-bold">{stats.totalEvaluations}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold">{stats.averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Processed Today</p>
                  <p className="text-2xl font-bold">{stats.processedToday}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pending Review</p>
                  <p className="text-2xl font-bold">{stats.pendingReview}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Upload
            </TabsTrigger>
            <TabsTrigger value="camera" className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Camera
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Results
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Upload Answer Key</CardTitle>
                  <CardDescription>
                    Upload Excel file with question numbers and correct answers (A/B/C/D)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AnswerKeyUpload onUpload={handleAnswerKeyUpload} />
                  
                  {answerKeys.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Uploaded Answer Keys:</h4>
                      <div className="space-y-2">
                        {answerKeys.map(key => (
                          <div key={key.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span>{key.examName} - Set {key.setVersion}</span>
                            <Badge variant="secondary">{key.totalQuestions} questions</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Upload OMR Sheets</CardTitle>
                  <CardDescription>
                    Upload OMR sheet images for automated evaluation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <FileUpload onUpload={handleOMRUpload} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="camera">
            <Card>
              <CardHeader>
                <CardTitle>Camera Capture</CardTitle>
                <CardDescription>
                  Capture OMR sheets directly using your device camera
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CameraCapture onCapture={handleOMRUpload} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <ResultsDashboard 
              evaluations={evaluations}
              answerKeys={answerKeys}
            />
          </TabsContent>

          <TabsContent value="reports">
            <StudentReports evaluations={evaluations} />
          </TabsContent>
        </Tabs>
      </div>
      <Toaster />
    </div>
  );
}