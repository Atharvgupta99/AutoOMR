import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js';
import * as kv from './kv_store.tsx';

const app = new Hono();

app.use('*', logger(console.log));
app.use('*', cors({
  origin: '*',
  allowHeaders: ['*'],
  allowMethods: ['*'],
}));

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// Create storage buckets on startup
const bucketName = 'make-f11ea3c3-omr-sheets';
const answerKeyBucketName = 'make-f11ea3c3-answer-keys';

async function initializeBuckets() {
  try {
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets?.some(bucket => bucket.name === bucketName)) {
      await supabase.storage.createBucket(bucketName, { public: false });
      console.log(`Created bucket: ${bucketName}`);
    }
    
    if (!buckets?.some(bucket => bucket.name === answerKeyBucketName)) {
      await supabase.storage.createBucket(answerKeyBucketName, { public: false });
      console.log(`Created bucket: ${answerKeyBucketName}`);
    }
  } catch (error) {
    console.error('Error initializing buckets:', error);
  }
}

// Initialize buckets
initializeBuckets();

// Upload answer key
app.post('/make-server-f11ea3c3/answer-keys', async (c) => {
  try {
    const body = await c.req.json();
    const { examName, setVersion, totalQuestions, answers, subjects } = body;
    
    if (!examName || !setVersion || !answers) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    const answerKeyId = `answer_key_${Date.now()}`;
    const answerKeyData = {
      id: answerKeyId,
      examName,
      setVersion,
      totalQuestions,
      answers,
      subjects,
      uploadDate: new Date().toISOString()
    };

    await kv.set(answerKeyId, answerKeyData);
    
    return c.json({ 
      success: true, 
      answerKeyId,
      message: 'Answer key uploaded successfully' 
    });
  } catch (error) {
    console.error('Error uploading answer key:', error);
    return c.json({ error: 'Failed to upload answer key' }, 500);
  }
});

// Get all answer keys
app.get('/make-server-f11ea3c3/answer-keys', async (c) => {
  try {
    const answerKeys = await kv.getByPrefix('answer_key_');
    return c.json({ success: true, answerKeys });
  } catch (error) {
    console.error('Error fetching answer keys:', error);
    return c.json({ error: 'Failed to fetch answer keys' }, 500);
  }
});

// Process OMR sheet
app.post('/make-server-f11ea3c3/process-omr', async (c) => {
  try {
    const body = await c.req.json();
    const { studentName, rollNumber, examDate, imageData, answerKeyId } = body;
    
    if (!studentName || !rollNumber || !imageData) {
      return c.json({ error: 'Missing required fields' }, 400);
    }

    // Get answer key if provided
    let answerKey = null;
    if (answerKeyId) {
      answerKey = await kv.get(answerKeyId);
    }

    // Simulate OMR processing - in production, this would call your OpenCV pipeline
    const detectedAnswers = await simulateOMRProcessing();
    
    // Calculate scores if answer key is available
    let evaluation = null;
    if (answerKey) {
      evaluation = calculateScores(detectedAnswers, answerKey.answers);
    }

    const evaluationId = `evaluation_${Date.now()}`;
    const evaluationData = {
      id: evaluationId,
      studentName,
      rollNumber,
      examDate,
      detectedAnswers,
      answerKeyId,
      evaluation,
      imageData: imageData.substring(0, 50) + '...', // Store reference only
      status: 'completed',
      processingTime: `${(Math.random() * 3 + 1).toFixed(1)}s`,
      processedAt: new Date().toISOString()
    };

    await kv.set(evaluationId, evaluationData);
    
    return c.json({ 
      success: true, 
      evaluationId,
      evaluation: evaluationData,
      message: 'OMR sheet processed successfully' 
    });
  } catch (error) {
    console.error('Error processing OMR sheet:', error);
    return c.json({ error: 'Failed to process OMR sheet' }, 500);
  }
});

// Get all evaluations
app.get('/make-server-f11ea3c3/evaluations', async (c) => {
  try {
    const evaluations = await kv.getByPrefix('evaluation_');
    return c.json({ success: true, evaluations });
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return c.json({ error: 'Failed to fetch evaluations' }, 500);
  }
});

// Get detailed answer comparison
app.get('/make-server-f11ea3c3/evaluations/:id/answers', async (c) => {
  try {
    const evaluationId = c.req.param('id');
    const evaluation = await kv.get(evaluationId);
    
    if (!evaluation) {
      return c.json({ error: 'Evaluation not found' }, 404);
    }

    let answerComparison = null;
    if (evaluation.answerKeyId) {
      const answerKey = await kv.get(evaluation.answerKeyId);
      if (answerKey) {
        answerComparison = generateAnswerComparison(
          evaluation.detectedAnswers, 
          answerKey.answers,
          answerKey.subjects
        );
      }
    }

    return c.json({ 
      success: true, 
      evaluation,
      answerComparison 
    });
  } catch (error) {
    console.error('Error fetching answer comparison:', error);
    return c.json({ error: 'Failed to fetch answer comparison' }, 500);
  }
});

// Simulate OMR processing (replace with actual OpenCV processing)
async function simulateOMRProcessing() {
  const answers = {};
  const options = ['A', 'B', 'C', 'D'];
  
  for (let i = 1; i <= 100; i++) {
    // Simulate some uncertainty in detection
    if (Math.random() > 0.05) { // 95% detection rate
      answers[i] = options[Math.floor(Math.random() * 4)];
    } else {
      answers[i] = null; // Undetected
    }
  }
  
  return answers;
}

// Calculate scores based on detected answers and answer key
function calculateScores(detectedAnswers, correctAnswers) {
  let totalScore = 0;
  const subjectScores = {
    'Data Analytics': 0,
    'Machine Learning': 0,
    'Python Programming': 0,
    'Statistics': 0,
    'SQL & Databases': 0
  };

  const subjectRanges = [
    { subject: 'Data Analytics', start: 1, end: 20 },
    { subject: 'Machine Learning', start: 21, end: 40 },
    { subject: 'Python Programming', start: 41, end: 60 },
    { subject: 'Statistics', start: 61, end: 80 },
    { subject: 'SQL & Databases', start: 81, end: 100 }
  ];

  for (let q = 1; q <= 100; q++) {
    const detected = detectedAnswers[q];
    const correct = correctAnswers[q];
    
    if (detected && detected === correct) {
      totalScore++;
      
      // Add to subject score
      const subjectRange = subjectRanges.find(range => q >= range.start && q <= range.end);
      if (subjectRange) {
        subjectScores[subjectRange.subject]++;
      }
    }
  }

  return {
    totalScore,
    subjectScores
  };
}

// Generate detailed answer comparison
function generateAnswerComparison(detectedAnswers, correctAnswers, subjects) {
  const comparison = [];
  
  for (let q = 1; q <= 100; q++) {
    const detected = detectedAnswers[q];
    const correct = correctAnswers[q];
    const isCorrect = detected && detected === correct;
    
    // Find subject for this question
    let subject = 'Unknown';
    if (q <= 20) subject = 'Data Analytics';
    else if (q <= 40) subject = 'Machine Learning';
    else if (q <= 60) subject = 'Python Programming';
    else if (q <= 80) subject = 'Statistics';
    else subject = 'SQL & Databases';
    
    comparison.push({
      questionNumber: q,
      subject,
      detectedAnswer: detected,
      correctAnswer: correct,
      isCorrect,
      status: detected ? (isCorrect ? 'correct' : 'incorrect') : 'undetected'
    });
  }
  
  return comparison;
}

app.get('/make-server-f11ea3c3/health', (c) => {
  return c.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

Deno.serve(app.fetch);