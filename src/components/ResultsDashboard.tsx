import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  Download, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock,
  CheckCircle2,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { AnswerComparison } from './AnswerComparison';
import { toast } from 'sonner@2.0.3';

interface ResultsDashboardProps {
  evaluations: any[];
  answerKeys: any[];
}

export function ResultsDashboard({ evaluations, answerKeys }: ResultsDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedEvaluationId, setSelectedEvaluationId] = useState<string | null>(null);
  const [selectedEvaluationData, setSelectedEvaluationData] = useState<any | null>(null);

  const filteredEvaluations = useMemo(() => {
    return evaluations.filter(evaluation => {
      const matchesSearch = evaluation.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           evaluation.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || evaluation.status === statusFilter;
      const matchesDate = dateFilter === 'all' || evaluation.examDate === dateFilter;
      
      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [evaluations, searchTerm, statusFilter, dateFilter]);

  const completedEvaluations = evaluations.filter(e => e.status === 'completed');
  
  const statsData = useMemo(() => {
    if (completedEvaluations.length === 0) return null;

    const totalScore = completedEvaluations.reduce((sum, e) => sum + e.totalScore, 0);
    const averageScore = totalScore / completedEvaluations.length;
    
    const subjectAverages = {};
    Object.keys(completedEvaluations[0]?.subjectScores || {}).forEach(subject => {
      const subjectTotal = completedEvaluations.reduce((sum, e) => sum + (e.subjectScores[subject] || 0), 0);
      subjectAverages[subject] = subjectTotal / completedEvaluations.length;
    });

    const scoreDistribution = [
      { range: '90-100', count: completedEvaluations.filter(e => e.totalScore >= 90).length },
      { range: '80-89', count: completedEvaluations.filter(e => e.totalScore >= 80 && e.totalScore < 90).length },
      { range: '70-79', count: completedEvaluations.filter(e => e.totalScore >= 70 && e.totalScore < 80).length },
      { range: '60-69', count: completedEvaluations.filter(e => e.totalScore >= 60 && e.totalScore < 70).length },
      { range: 'Below 60', count: completedEvaluations.filter(e => e.totalScore < 60).length }
    ];

    return {
      averageScore,
      subjectAverages,
      scoreDistribution,
      totalCompleted: completedEvaluations.length
    };
  }, [completedEvaluations]);

  const handleExportResults = () => {
    // Simulate CSV export
    const csvData = filteredEvaluations.map(evaluation => ({
      'Student Name': evaluation.studentName,
      'Roll Number': evaluation.rollNumber,
      'Exam Date': evaluation.examDate,
      'Total Score': evaluation.totalScore,
      'Status': evaluation.status,
      ...evaluation.subjectScores
    }));
    
    toast.success('Results exported successfully!');
    console.log('Export data:', csvData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4 animate-spin" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by student name or roll number..."
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="error">Error</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={handleExportResults} className="gap-2">
              <Download className="h-4 w-4" />
              Export Results
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
      {statsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Students Evaluated</p>
                  <p className="text-2xl font-bold">{statsData.totalCompleted}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Average Score</p>
                  <p className="text-2xl font-bold">{statsData.averageScore.toFixed(1)}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <CheckCircle2 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Pass Rate (≥70%)</p>
                  <p className="text-2xl font-bold">
                    {((completedEvaluations.filter(e => e.totalScore >= 70).length / statsData.totalCompleted) * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Avg Processing</p>
                  <p className="text-2xl font-bold">2.1s</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Recent Evaluations Summary */}
      {completedEvaluations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Evaluations</CardTitle>
            <CardDescription>Last 5 processed evaluations with detailed results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedEvaluations
                .sort((a, b) => new Date(b.processedAt || b.examDate).getTime() - new Date(a.processedAt || a.examDate).getTime())
                .slice(0, 5)
                .map(evaluation => (
                  <div key={evaluation.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="font-medium">{evaluation.studentName}</div>
                        <div className="text-sm text-gray-600">{evaluation.rollNumber} • {evaluation.examDate}</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">{evaluation.totalScore}/100</div>
                        <div className="text-xs text-gray-600">Total Score</div>
                      </div>
                      
                      <div className="flex flex-wrap gap-1">
                        {Object.entries(evaluation.subjectScores || {}).slice(0, 3).map(([subject, score]) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject.split(' ')[0]}: {score}/20
                          </Badge>
                        ))}
                      </div>
                      
                      <Badge className={`${evaluation.totalScore >= 70 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {evaluation.totalScore >= 70 ? 'PASS' : 'FAIL'}
                      </Badge>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedEvaluationId(evaluation.id.toString());
                          setSelectedEvaluationData(evaluation);
                        }}
                        className="gap-1"
                      >
                        <Eye className="h-3 w-3" />
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Charts */}
      {statsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subject-wise Performance</CardTitle>
              <CardDescription>Average scores across different subjects</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={Object.entries(statsData.subjectAverages).map(([subject, avg]) => ({
                  subject: subject.replace(' ', '\n'),
                  average: Number(avg)
                }))}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="subject" fontSize={10} />
                  <YAxis domain={[0, 20]} />
                  <Tooltip />
                  <Bar dataKey="average" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Score Distribution</CardTitle>
              <CardDescription>Number of students in each score range</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsData.scoreDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, count }) => `${range}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {statsData.scoreDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'][index]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Results Table */}
      <Card>
        <CardHeader>
          <CardTitle>Evaluation Results</CardTitle>
          <CardDescription>
            Showing {filteredEvaluations.length} of {evaluations.length} evaluations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2 font-medium">Student</th>
                  <th className="text-left p-2 font-medium">Roll Number</th>
                  <th className="text-left p-2 font-medium">Exam Date</th>
                  <th className="text-left p-2 font-medium">Total Score</th>
                  <th className="text-left p-2 font-medium">Status</th>
                  <th className="text-left p-2 font-medium">Processing Time</th>
                  <th className="text-left p-2 font-medium">Subject Scores</th>
                  <th className="text-left p-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEvaluations.map(evaluation => (
                  <tr key={evaluation.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">{evaluation.studentName}</td>
                    <td className="p-2 font-mono text-sm">{evaluation.rollNumber}</td>
                    <td className="p-2 text-sm">{evaluation.examDate}</td>
                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{evaluation.totalScore}/100</span>
                        <Progress value={evaluation.totalScore} className="w-16 h-2" />
                      </div>
                    </td>
                    <td className="p-2">
                      <Badge className={`gap-1 ${getStatusColor(evaluation.status)}`}>
                        {getStatusIcon(evaluation.status)}
                        {evaluation.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm">{evaluation.processingTime || '-'}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {evaluation.subjectScores && Object.entries(evaluation.subjectScores).map(([subject, score]) => (
                          <Badge key={subject} variant="outline" className="text-xs">
                            {subject.split(' ')[0]}: {score}/20
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="p-2">
                      {evaluation.status === 'completed' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedEvaluationId(evaluation.id.toString());
                            setSelectedEvaluationData(evaluation);
                          }}
                          className="gap-1"
                        >
                          <Eye className="h-3 w-3" />
                          View Answers
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredEvaluations.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No evaluations found matching the current filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Answer Comparison Modal */}
      {selectedEvaluationId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <AnswerComparison 
                evaluationId={selectedEvaluationId}
                evaluationData={selectedEvaluationData}
                onClose={() => {
                  setSelectedEvaluationId(null);
                  setSelectedEvaluationData(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}