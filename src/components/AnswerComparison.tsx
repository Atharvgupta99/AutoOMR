import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  Search, 
  Filter,
  Download,
  Eye,
  BarChart3
} from 'lucide-react';
import { apiClient } from '../utils/supabase/client';
import { toast } from 'sonner@2.0.3';

interface AnswerComparisonProps {
  evaluationId: string;
  onClose: () => void;
}

export function AnswerComparison({ evaluationId, onClose }: AnswerComparisonProps) {
  const [loading, setLoading] = useState(true);
  const [evaluation, setEvaluation] = useState<any>(null);
  const [answerComparison, setAnswerComparison] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  useEffect(() => {
    fetchAnswerComparison();
  }, [evaluationId]);

  const fetchAnswerComparison = async () => {
    try {
      setLoading(true);
      const response = await apiClient.getAnswerComparison(evaluationId);
      setEvaluation(response.evaluation);
      setAnswerComparison(response.answerComparison || []);
    } catch (error) {
      console.error('Error fetching answer comparison:', error);
      toast.error('Failed to load answer comparison');
    } finally {
      setLoading(false);
    }
  };

  const filteredAnswers = answerComparison.filter(answer => {
    const matchesSearch = answer.questionNumber.toString().includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || answer.status === statusFilter;
    const matchesSubject = subjectFilter === 'all' || answer.subject === subjectFilter;
    
    return matchesSearch && matchesStatus && matchesSubject;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'correct': return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'incorrect': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'undetected': return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default: return <AlertCircle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'correct': return 'bg-green-100 text-green-800';
      case 'incorrect': return 'bg-red-100 text-red-800';
      case 'undetected': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const generateDetailedReport = () => {
    const reportData = {
      student: evaluation,
      comparison: filteredAnswers,
      summary: {
        total: answerComparison.length,
        correct: answerComparison.filter(a => a.status === 'correct').length,
        incorrect: answerComparison.filter(a => a.status === 'incorrect').length,
        undetected: answerComparison.filter(a => a.status === 'undetected').length
      }
    };
    
    console.log('Generating detailed report:', reportData);
    toast.success('Detailed answer report generated!');
  };

  const subjects = [...new Set(answerComparison.map(a => a.subject))];
  const subjectStats = subjects.map(subject => {
    const subjectAnswers = answerComparison.filter(a => a.subject === subject);
    const correct = subjectAnswers.filter(a => a.status === 'correct').length;
    const total = subjectAnswers.length;
    
    return {
      subject,
      correct,
      total,
      percentage: total > 0 ? (correct / total) * 100 : 0
    };
  });

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading answer comparison...</p>
        </CardContent>
      </Card>
    );
  }

  if (!evaluation) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p>Failed to load evaluation data</p>
          <Button onClick={onClose} className="mt-4">Go Back</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Answer Comparison - {evaluation.studentName}</CardTitle>
              <CardDescription>
                Roll Number: {evaluation.rollNumber} | Exam Date: {evaluation.examDate}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button onClick={generateDetailedReport} className="gap-2">
                <Download className="h-4 w-4" />
                Export Report
              </Button>
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {answerComparison.filter(a => a.status === 'correct').length}
              </div>
              <div className="text-sm text-gray-600">Correct</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {answerComparison.filter(a => a.status === 'incorrect').length}
              </div>
              <div className="text-sm text-gray-600">Incorrect</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {answerComparison.filter(a => a.status === 'undetected').length}
              </div>
              <div className="text-sm text-gray-600">Undetected</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {evaluation.evaluation ? evaluation.evaluation.totalScore : 0}/100
              </div>
              <div className="text-sm text-gray-600">Total Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="answers" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="answers">Answer Details</TabsTrigger>
          <TabsTrigger value="analytics">Subject Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="answers" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by question number..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="correct">Correct</SelectItem>
                    <SelectItem value="incorrect">Incorrect</SelectItem>
                    <SelectItem value="undetected">Undetected</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={subjectFilter} onValueChange={setSubjectFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Subjects</SelectItem>
                    {subjects.map(subject => (
                      <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Answer Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Question-wise Answer Comparison</CardTitle>
              <CardDescription>
                Showing {filteredAnswers.length} of {answerComparison.length} questions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredAnswers.map(answer => (
                  <div 
                    key={answer.questionNumber}
                    className={`border rounded-lg p-3 ${
                      answer.status === 'correct' ? 'border-green-200 bg-green-50' :
                      answer.status === 'incorrect' ? 'border-red-200 bg-red-50' :
                      'border-yellow-200 bg-yellow-50'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">Q{answer.questionNumber}</div>
                      <Badge className={`gap-1 ${getStatusColor(answer.status)}`}>
                        {getStatusIcon(answer.status)}
                        {answer.status}
                      </Badge>
                    </div>
                    
                    <div className="text-xs text-gray-600 mb-2">{answer.subject}</div>
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Student:</span>
                        <span className={`font-medium ${
                          answer.detectedAnswer ? '' : 'text-gray-400'
                        }`}>
                          {answer.detectedAnswer || 'Not detected'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Correct:</span>
                        <span className="font-medium text-green-600">
                          {answer.correctAnswer}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {filteredAnswers.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No questions found matching the current filters.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Subject Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
              <CardDescription>Detailed breakdown by subject area</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {subjectStats.map(stat => (
                  <div key={stat.subject} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">{stat.subject}</h4>
                      <Badge variant="outline">
                        {stat.correct}/{stat.total} ({stat.percentage.toFixed(0)}%)
                      </Badge>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${stat.percentage}%` }}
                      ></div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center">
                        <div className="font-medium text-green-600">
                          {answerComparison.filter(a => a.subject === stat.subject && a.status === 'correct').length}
                        </div>
                        <div className="text-gray-600">Correct</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-red-600">
                          {answerComparison.filter(a => a.subject === stat.subject && a.status === 'incorrect').length}
                        </div>
                        <div className="text-gray-600">Incorrect</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-yellow-600">
                          {answerComparison.filter(a => a.subject === stat.subject && a.status === 'undetected').length}
                        </div>
                        <div className="text-gray-600">Undetected</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}