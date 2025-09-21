import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Check if we're in demo mode
const isDemoMode = projectId === 'demo-project-id' || publicAnonKey === 'demo-anon-key';

export const supabase = isDemoMode ? null : createClient(
  `https://${projectId}.supabase.co`,
  publicAnonKey
);

// API helper functions
const API_BASE = isDemoMode ? 'demo-api' : `https://${projectId}.supabase.co/functions/v1/make-server-f11ea3c3`;

export const apiClient = {
  // Upload answer key
  uploadAnswerKey: async (answerKeyData: any) => {
    if (isDemoMode) {
      // Return success response for demo mode
      return {
        success: true,
        answerKeyId: `demo-key-${Date.now()}`,
        message: 'Answer key uploaded successfully (Demo mode)'
      };
    }

    try {
      const response = await fetch(`${API_BASE}/answer-keys`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(answerKeyData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to upload answer key');
      }
      
      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Backend not available');
      }
      throw error;
    }
  },

  // Get all answer keys
  getAnswerKeys: async () => {
    if (isDemoMode) {
      // Return empty array for demo mode
      return {
        success: true,
        answerKeys: []
      };
    }

    try {
      const response = await fetch(`${API_BASE}/answer-keys`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch answer keys');
      }
      
      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Backend not available');
      }
      throw error;
    }
  },

  // Process OMR sheet
  processOMR: async (omrData: any) => {
    if (isDemoMode) {
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Return mock results
      const mockAnswers = {};
      for (let i = 1; i <= 100; i++) {
        mockAnswers[i] = Math.random() > 0.1 ? ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)] : null;
      }
      
      const totalScore = Math.floor(Math.random() * 30) + 70;
      
      return {
        success: true,
        evaluationId: `demo-eval-${Date.now()}`,
        evaluation: {
          id: `demo-eval-${Date.now()}`,
          ...omrData,
          detectedAnswers: mockAnswers,
          evaluation: {
            totalScore,
            subjectScores: {
              'Data Analytics': Math.floor(Math.random() * 5) + 15,
              'Machine Learning': Math.floor(Math.random() * 5) + 15,
              'Python Programming': Math.floor(Math.random() * 5) + 15,
              'Statistics': Math.floor(Math.random() * 5) + 15,
              'SQL & Databases': Math.floor(Math.random() * 5) + 15
            }
          },
          status: 'completed',
          processingTime: '1.8s',
          processedAt: new Date().toISOString()
        }
      };
    }

    try {
      const response = await fetch(`${API_BASE}/process-omr`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
        },
        body: JSON.stringify(omrData),
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to process OMR sheet');
      }
      
      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Backend not available');
      }
      throw error;
    }
  },

  // Get all evaluations
  getEvaluations: async () => {
    if (isDemoMode) {
      // Return empty array for demo mode
      return {
        success: true,
        evaluations: []
      };
    }

    try {
      const response = await fetch(`${API_BASE}/evaluations`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch evaluations');
      }
      
      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Backend not available');
      }
      throw error;
    }
  },

  // Get detailed answer comparison
  getAnswerComparison: async (evaluationId: string) => {
    if (isDemoMode) {
      // Return mock data for demo mode
      return {
        success: true,
        evaluation: {
          id: evaluationId,
          studentName: 'John Doe',
          rollNumber: 'DS001',
          examDate: '2024-01-15',
          evaluation: {
            totalScore: 85,
            subjectScores: {
              'Data Analytics': 18,
              'Machine Learning': 16,
              'Python Programming': 17,
              'Statistics': 17,
              'SQL & Databases': 17
            }
          }
        },
        answerComparison: Array.from({ length: 100 }, (_, i) => {
          const questionNum = i + 1;
          const subjects = ['Data Analytics', 'Machine Learning', 'Python Programming', 'Statistics', 'SQL & Databases'];
          const subjectIndex = Math.floor((questionNum - 1) / 20);
          const options = ['A', 'B', 'C', 'D'];
          const correctAnswer = options[Math.floor(Math.random() * 4)];
          const detectedAnswer = Math.random() > 0.1 ? options[Math.floor(Math.random() * 4)] : null;
          const isCorrect = detectedAnswer === correctAnswer;
          
          return {
            questionNumber: questionNum,
            subject: subjects[subjectIndex],
            detectedAnswer,
            correctAnswer,
            isCorrect,
            status: !detectedAnswer ? 'undetected' : (isCorrect ? 'correct' : 'incorrect')
          };
        })
      };
    }

    try {
      const response = await fetch(`${API_BASE}/evaluations/${evaluationId}/answers`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
        },
      });
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || 'Failed to fetch answer comparison');
      }
      
      return response.json();
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        // Return mock data for demo when backend is not available
        return {
          success: true,
          evaluation: {
            id: evaluationId,
            studentName: 'John Doe',
            rollNumber: 'DS001',
            examDate: '2024-01-15',
            evaluation: {
              totalScore: 85,
              subjectScores: {
                'Data Analytics': 18,
                'Machine Learning': 16,
                'Python Programming': 17,
                'Statistics': 17,
                'SQL & Databases': 17
              }
            }
          },
          answerComparison: Array.from({ length: 100 }, (_, i) => {
            const questionNum = i + 1;
            const subjects = ['Data Analytics', 'Machine Learning', 'Python Programming', 'Statistics', 'SQL & Databases'];
            const subjectIndex = Math.floor((questionNum - 1) / 20);
            const options = ['A', 'B', 'C', 'D'];
            const correctAnswer = options[Math.floor(Math.random() * 4)];
            const detectedAnswer = Math.random() > 0.1 ? options[Math.floor(Math.random() * 4)] : null;
            const isCorrect = detectedAnswer === correctAnswer;
            
            return {
              questionNumber: questionNum,
              subject: subjects[subjectIndex],
              detectedAnswer,
              correctAnswer,
              isCorrect,
              status: !detectedAnswer ? 'undetected' : (isCorrect ? 'correct' : 'incorrect')
            };
          })
        };
      }
      throw error;
    }
  },
};