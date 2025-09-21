import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { 
  Download, 
  Search, 
  User, 
  Calendar, 
  Target, 
  TrendingUp,
  Award,
  BookOpen,
  FileText,
  Eye
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { AnswerComparison } from './AnswerComparison';

interface StudentReportsProps {
  evaluations: any[];
}

export function StudentReports({ evaluations }: StudentReportsProps) {
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAnswerComparison, setShowAnswerComparison] = useState<string | null>(null);
  const [selectedEvaluationData, setSelectedEvaluationData] = useState<any | null>(null);

  const completedEvaluations = evaluations.filter(e => e.status === 'completed');
  
  const filteredStudents = useMemo(() => {
    return completedEvaluations.filter(evaluation => 
      evaluation.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      evaluation.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [completedEvaluations, searchTerm]);

  const selectedStudentData = useMemo(() => {
    if (!selectedStudent) return null;
    return completedEvaluations.find(evaluation => evaluation.id.toString() === selectedStudent);
  }, [completedEvaluations, selectedStudent]);

  const studentPerformanceData = useMemo(() => {
    if (!selectedStudentData) return null;

    const subjectData = Object.entries(selectedStudentData.subjectScores).map(([subject, score]) => ({
      subject: subject.replace(' ', '\n'),
      score: Number(score),
      maxScore: 20,
      percentage: (Number(score) / 20) * 100
    }));

    const radarData = Object.entries(selectedStudentData.subjectScores).map(([subject, score]) => ({
      subject: subject.split(' ')[0], // Shortened name for radar chart
      score: Number(score),
      fullMark: 20
    }));

    return { subjectData, radarData };
  }, [selectedStudentData]);

  const classAverages = useMemo(() => {
    if (completedEvaluations.length === 0) return {};
    
    const averages = {};
    Object.keys(completedEvaluations[0]?.subjectScores || {}).forEach(subject => {
      const total = completedEvaluations.reduce((sum, evaluation) => sum + (evaluation.subjectScores[subject] || 0), 0);
      averages[subject] = total / completedEvaluations.length;
    });
    
    return averages;
  }, [completedEvaluations]);

  const getPerformanceLevel = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    if (percentage >= 90) return { level: 'Excellent', color: 'bg-green-500' };
    if (percentage >= 80) return { level: 'Good', color: 'bg-blue-500' };
    if (percentage >= 70) return { level: 'Average', color: 'bg-yellow-500' };
    return { level: 'Needs Improvement', color: 'bg-red-500' };
  };

  const generateDetailedReport = () => {
    if (!selectedStudentData) return;
    
    toast.success('Detailed report generated successfully!');
    console.log('Generating detailed report for:', selectedStudentData);
  };

  const viewAnswerDetails = (evaluation: any) => {
    setShowAnswerComparison(evaluation.id);
    setSelectedEvaluationData(evaluation);
  };

  const getSubjectRecommendations = (subjectScore: number, subjectName: string, classAverage: number) => {
    const percentage = (subjectScore / 20) * 100;
    const avgPercentage = (classAverage / 20) * 100;
    
    if (percentage >= avgPercentage + 10) {
      return `Excellent performance in ${subjectName}! Consider taking advanced topics.`;
    } else if (percentage >= avgPercentage - 5) {
      return `Good performance in ${subjectName}. Focus on practice problems for improvement.`;
    } else {
      return `${subjectName} needs attention. Recommend additional study and practice sessions.`;
    }
  };

  // Show answer comparison if requested
  if (showAnswerComparison) {
    return (
      <AnswerComparison 
        evaluationId={showAnswerComparison} 
        evaluationData={selectedEvaluationData}
        onClose={() => {
          setShowAnswerComparison(null);
          setSelectedEvaluationData(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Student Selection */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger className="w-full md:w-64">
                <SelectValue placeholder="Select a student for detailed report" />
              </SelectTrigger>
              <SelectContent>
                {filteredStudents.map(student => (
                  <SelectItem key={student.id} value={student.id.toString()}>
                    {student.studentName} ({student.rollNumber})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStudents.map(student => (
          <Card 
            key={student.id} 
            className={`transition-all hover:shadow-md ${
              selectedStudent === student.id.toString() ? 'ring-2 ring-blue-500' : ''
            }`}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{student.studentName}</h3>
                  <p className="text-sm text-gray-600">{student.rollNumber}</p>
                </div>
                <Badge variant="secondary">{student.totalScore}/100</Badge>
              </div>
              
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-600">{student.examDate}</span>
              </div>
              
              <Progress value={student.totalScore} className="h-2 mb-3" />
              
              <div className="flex flex-wrap gap-1 mb-3">
                {Object.entries(student.subjectScores).map(([subject, score]) => (
                  <Badge key={subject} variant="outline" className="text-xs">
                    {subject.split(' ')[0]}: {score}/20
                  </Badge>
                ))}
              </div>
              
              <div className="flex gap-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1 gap-2"
                  onClick={() => setSelectedStudent(student.id.toString())}
                >
                  <User className="h-3 w-3" />
                  View Report
                </Button>
                <Button 
                  size="sm" 
                  variant="default" 
                  className="flex-1 gap-2"
                  onClick={() => viewAnswerDetails(student)}
                >
                  <Eye className="h-3 w-3" />
                  View Answers
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Student Report */}
      {selectedStudentData && studentPerformanceData && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    {selectedStudentData.studentName}
                  </CardTitle>
                  <CardDescription>
                    Roll Number: {selectedStudentData.rollNumber} | Exam Date: {selectedStudentData.examDate}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => viewAnswerDetails(selectedStudentData)} 
                    variant="outline" 
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    View Answers
                  </Button>
                  <Button onClick={generateDetailedReport} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download Report
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{selectedStudentData.totalScore}/100</div>
                  <div className="text-sm text-gray-600">Total Score</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">
                    {((selectedStudentData.totalScore / 100) * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-gray-600">Percentage</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">
                    #{completedEvaluations
                      .sort((a, b) => b.totalScore - a.totalScore)
                      .findIndex(evaluation => evaluation.id === selectedStudentData.id) + 1}
                  </div>
                  <div className="text-sm text-gray-600">Class Rank</div>
                </div>
                <div className="text-center">
                  <div className={`text-3xl font-bold ${
                    selectedStudentData.totalScore >= 70 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedStudentData.totalScore >= 70 ? 'PASS' : 'FAIL'}
                  </div>
                  <div className="text-sm text-gray-600">Result</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Subject-wise Performance</CardTitle>
                <CardDescription>Score comparison with class average</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={studentPerformanceData.subjectData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="subject" fontSize={10} />
                    <YAxis domain={[0, 20]} />
                    <Tooltip />
                    <Bar dataKey="score" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills Radar</CardTitle>
                <CardDescription>Performance across different skill areas</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={studentPerformanceData.radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" fontSize={12} />
                    <PolarRadiusAxis domain={[0, 20]} tickCount={5} fontSize={10} />
                    <Radar name="Score" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Subject Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Analysis</CardTitle>
              <CardDescription>Detailed breakdown of performance in each subject</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(selectedStudentData.subjectScores).map(([subject, score]) => {
                  const performance = getPerformanceLevel(Number(score), 20);
                  const classAvg = classAverages[subject] || 0;
                  const recommendation = getSubjectRecommendations(Number(score), subject, classAvg);
                  
                  return (
                    <div key={subject} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium">{subject}</h4>
                          <p className="text-sm text-gray-600">Score: {score}/20 ({((Number(score)/20)*100).toFixed(0)}%)</p>
                        </div>
                        <Badge className={`${performance.color} text-white`}>
                          {performance.level}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>Your Score</span>
                          <span>Class Average: {classAvg.toFixed(1)}</span>
                        </div>
                        <Progress value={(Number(score)/20)*100} className="h-2" />
                      </div>
                      
                      <div className="bg-blue-50 p-3 rounded text-sm text-blue-800">
                        <div className="flex gap-2">
                          <BookOpen className="h-4 w-4 flex-shrink-0 mt-0.5" />
                          <span>{recommendation}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-blue-600" />
                Performance Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-green-700">Strengths:</h4>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(selectedStudentData.subjectScores)
                      .filter(([_, score]) => Number(score) >= 17)
                      .map(([subject, score]) => (
                        <li key={subject} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>{subject}: Excellent performance ({score}/20)</span>
                        </li>
                      ))}
                    {Object.entries(selectedStudentData.subjectScores).filter(([_, score]) => Number(score) >= 17).length === 0 && (
                      <li className="text-gray-600">Focus on achieving scores above 17 to build strengths</li>
                    )}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-red-700">Areas for Improvement:</h4>
                  <ul className="space-y-1 text-sm">
                    {Object.entries(selectedStudentData.subjectScores)
                      .filter(([_, score]) => Number(score) < 15)
                      .map(([subject, score]) => (
                        <li key={subject} className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span>{subject}: Needs attention ({score}/20)</span>
                        </li>
                      ))}
                    {Object.entries(selectedStudentData.subjectScores).filter(([_, score]) => Number(score) < 15).length === 0 && (
                      <li className="text-gray-600">Great job! All subjects performing well</li>
                    )}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {completedEvaluations.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="font-medium mb-2">No Completed Evaluations</h3>
            <p className="text-gray-600">Upload and process some OMR sheets to see student reports here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}