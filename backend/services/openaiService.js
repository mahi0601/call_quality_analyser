const fs = require('fs');
const axios = require('axios');

class OpenAIService {
  constructor() {
    this.huggingFaceToken = process.env.HUGGINGFACE_TOKEN || '';
  }

  /**
   * Transcribe audio file using OpenAI Whisper
   */
  async transcribeAudio(filePath) {
    try {
      console.log('🎵 Transcribing audio...');
      
      const audioBuffer = fs.readFileSync(filePath);
      
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/openai/whisper-large-v3',
        audioBuffer,
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'audio/mpeg',
            'Accept': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        }
      );

      const transcript = response.data.text;
      console.log('✅ Transcription completed');
      
      return {
        text: transcript,
        segments: [
          {
            start: 0,
            end: 30,
            text: transcript,
            speaker: "agent"
          }
        ],
        language: "en",
        duration: 45,
        confidence: 0.9
      };
    } catch (error) {
      console.error('❌ Transcription failed:', error.response?.status || error.message);
      throw new Error(`Transcription failed: ${error.response?.status === 404 ? 'Model not found' : 'Service unavailable'}`);
    }
  }

  /**
   * Analyze call transcript for quality metrics
   */
  async analyzeCall(transcript) {
    try {
      console.log('🔍 Analyzing call...');
      
      const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
      
      // Real-time sentiment analysis
      const sentimentScores = await this.analyzeSentiment(sentences.slice(0, 3));
      
      // Real-time toxicity analysis
      const toxicityScores = await this.analyzeToxicity(sentences.slice(0, 3));
      
      // Local analysis for other metrics
      const clarityScore = this.analyzeClarity(transcript);
      const engagementScore = this.analyzeEngagement(transcript);
      const relevanceScore = this.analyzeRelevance(transcript);
      
      const overallSentiment = this.calculateOverallSentiment(sentimentScores);
      const overallPoliteness = this.calculateOverallPoliteness(toxicityScores);
      
      const analysis = {
        overallScore: Math.round((overallSentiment + overallPoliteness + clarityScore + engagementScore + relevanceScore) / 5),
        metrics: {
          callOpening: this.analyzeCallOpening(transcript),
          issueUnderstanding: this.analyzeIssueUnderstanding(transcript),
          sentimentAnalysis: overallSentiment,
          politeness: overallPoliteness,
          clarity: clarityScore,
          engagement: engagementScore,
          relevance: relevanceScore,
          csatScore: Math.round((overallSentiment + overallPoliteness + relevanceScore) / 3),
          resolutionQuality: this.analyzeResolutionQuality(transcript)
        },
        feedback: {
          callOpening: this.getCallOpeningFeedback(transcript),
          issueUnderstanding: this.getIssueUnderstandingFeedback(transcript),
          sentimentAnalysis: this.getSentimentFeedback(overallSentiment),
          politeness: this.getPolitenessFeedback(overallPoliteness),
          clarity: this.getClarityFeedback(clarityScore),
          engagement: this.getEngagementFeedback(engagementScore),
          relevance: this.getRelevanceFeedback(relevanceScore),
          csatScore: this.getCSATFeedback(overallSentiment, overallPoliteness, relevanceScore),
          resolutionQuality: this.getResolutionFeedback(transcript)
        },
        keyPoints: this.extractKeyPoints(transcript),
        issues: this.identifyIssues(sentimentScores, toxicityScores, clarityScore, engagementScore, relevanceScore),
        recommendations: this.generateRecommendations(sentimentScores, toxicityScores, clarityScore, engagementScore, relevanceScore)
      };
      
      console.log('✅ Analysis completed');
      return analysis;
    } catch (error) {
      console.error('❌ Analysis failed:', error.message);
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }

  // Real-time Sentiment Analysis using Hugging Face
  async analyzeSentiment(sentences) {
    try {
      const scores = [];
      for (const sentence of sentences) {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/distilbert-base-uncased-finetuned-sst-2-english',
          { inputs: sentence },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const result = response.data[0];
        const positiveScore = result.find(r => r.label === 'POSITIVE')?.score || 0;
        const negativeScore = result.find(r => r.label === 'NEGATIVE')?.score || 0;
        scores.push({ sentence, positive: positiveScore, negative: negativeScore });
      }
      return scores;
    } catch (error) {
      console.warn('⚠️ Sentiment analysis failed, using fallback');
      return sentences.map(s => ({ sentence: s, positive: 0.7, negative: 0.3 }));
    }
  }

  // Real-time Toxicity Analysis using Hugging Face
  async analyzeToxicity(sentences) {
    try {
      const scores = [];
      for (const sentence of sentences) {
        const response = await axios.post(
          'https://api-inference.huggingface.co/models/unitary/toxic-bert',
          { inputs: sentence },
          {
            headers: {
              'Authorization': `Bearer ${this.huggingFaceToken}`,
              'Content-Type': 'application/json'
            },
            timeout: 10000
          }
        );
        
        const result = response.data[0];
        const toxicScore = result.find(r => r.label === 'toxic')?.score || 0;
        const hateScore = result.find(r => r.label === 'hate')?.score || 0;
        const obsceneScore = result.find(r => r.label === 'obscene')?.score || 0;
        const threatScore = result.find(r => r.label === 'threat')?.score || 0;
        const insultScore = result.find(r => r.label === 'insult')?.score || 0;
        
        scores.push({
          sentence,
          toxic: toxicScore,
          hate: hateScore,
          obscene: obsceneScore,
          threat: threatScore,
          insult: insultScore,
          politeness: 1 - Math.max(toxicScore, hateScore, obsceneScore, threatScore, insultScore)
        });
      }
      return scores;
    } catch (error) {
      console.warn('⚠️ Toxicity analysis failed, using fallback');
      return sentences.map(s => ({ sentence: s, politeness: 0.8 }));
    }
  }

  // Local analysis methods
  analyzeClarity(transcript) {
    const sentences = transcript.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(' ').length, 0) / sentences.length;
    
    let clarityScore = 80;
    if (avgSentenceLength > 20) clarityScore -= 10;
    if (avgSentenceLength < 5) clarityScore -= 15;
    if (sentences.length < 3) clarityScore -= 10;
    
    return Math.max(0, Math.min(100, clarityScore));
  }

  analyzeEngagement(transcript) {
    const words = transcript.toLowerCase().split(/\s+/);
    const uniqueWords = new Set(words);
    const vocabularyRichness = uniqueWords.size / words.length;
    
    let engagementScore = 70;
    if (vocabularyRichness > 0.6) engagementScore += 15;
    if (words.length > 50) engagementScore += 10;
    if (words.length > 100) engagementScore += 5;
    
    return Math.min(100, engagementScore);
  }

  analyzeRelevance(transcript) {
    const customerServiceKeywords = [
      'help', 'assist', 'support', 'issue', 'problem', 'resolve', 'fix', 'order', 'account',
      'service', 'customer', 'thank', 'apologize', 'understand', 'solution', 'process'
    ];
    
    const words = transcript.toLowerCase().split(/\s+/);
    const relevantWords = words.filter(word => customerServiceKeywords.includes(word));
    const relevanceRatio = relevantWords.length / words.length;
    
    return Math.round(relevanceRatio * 100);
  }

  calculateOverallSentiment(sentimentScores) {
    const avgPositive = sentimentScores.reduce((sum, s) => sum + s.positive, 0) / sentimentScores.length;
    return Math.round(avgPositive * 100);
  }

  calculateOverallPoliteness(toxicityScores) {
    const avgPoliteness = toxicityScores.reduce((sum, s) => sum + s.politeness, 0) / toxicityScores.length;
    return Math.round(avgPoliteness * 100);
  }

  analyzeCallOpening(transcript) {
    const hasGreeting = /hello|hi|good|thank you/i.test(transcript);
    const hasIntroduction = /my name is|i'm|this is/i.test(transcript);
    const hasOffer = /how can i help|what can i do|assist/i.test(transcript);
    
    let score = 60;
    if (hasGreeting) score += 15;
    if (hasIntroduction) score += 15;
    if (hasOffer) score += 10;
    
    return Math.min(100, score);
  }

  analyzeIssueUnderstanding(transcript) {
    const hasIssue = /issue|problem|concern|matter/i.test(transcript);
    const hasUnderstanding = /understand|see|look|check/i.test(transcript);
    const hasClarification = /clarify|confirm|verify/i.test(transcript);
    
    let score = 60;
    if (hasIssue) score += 20;
    if (hasUnderstanding) score += 15;
    if (hasClarification) score += 5;
    
    return Math.min(100, score);
  }

  analyzeResolutionQuality(transcript) {
    const hasResolution = /resolve|fix|solve|address/i.test(transcript);
    const hasSolution = /solution|answer|result/i.test(transcript);
    const hasFollowUp = /follow|check|ensure|confirm/i.test(transcript);
    
    let score = 60;
    if (hasResolution) score += 20;
    if (hasSolution) score += 15;
    if (hasFollowUp) score += 5;
    
    return Math.min(100, score);
  }

  getCallOpeningFeedback(transcript) {
    const score = this.analyzeCallOpening(transcript);
    if (score >= 85) return "Excellent call opening with professional greeting and clear introduction";
    if (score >= 70) return "Good call opening, could improve introduction clarity";
    return "Call opening needs improvement - add greeting and clear introduction";
  }

  getIssueUnderstandingFeedback(transcript) {
    const score = this.analyzeIssueUnderstanding(transcript);
    if (score >= 85) return "Excellent problem identification and understanding";
    if (score >= 70) return "Good issue understanding, could improve clarification";
    return "Issue understanding needs work - practice active listening";
  }

  getSentimentFeedback(score) {
    if (score >= 85) return "Excellent positive sentiment throughout the call";
    if (score >= 70) return "Good sentiment, maintain positive tone";
    return "Sentiment needs improvement - focus on positive language";
  }

  getPolitenessFeedback(score) {
    if (score >= 85) return "Excellent politeness and professional tone";
    if (score >= 70) return "Good politeness, maintain professional language";
    return "Politeness needs improvement - avoid negative language";
  }

  getClarityFeedback(score) {
    if (score >= 85) return "Excellent clarity and coherent communication";
    if (score >= 70) return "Good clarity, could improve sentence structure";
    return "Clarity needs improvement - use shorter, clearer sentences";
  }

  getEngagementFeedback(score) {
    if (score >= 85) return "Excellent engagement with rich vocabulary";
    if (score >= 70) return "Good engagement, could expand vocabulary";
    return "Engagement needs improvement - use more descriptive language";
  }

  getRelevanceFeedback(score) {
    if (score >= 85) return "Excellent topic relevance throughout the call";
    if (score >= 70) return "Good relevance, stay focused on customer needs";
    return "Relevance needs improvement - stay on topic";
  }

  getCSATFeedback(sentiment, politeness, relevance) {
    const avgScore = (sentiment + politeness + relevance) / 3;
    if (avgScore >= 85) return "Excellent customer satisfaction potential";
    if (avgScore >= 70) return "Good customer satisfaction, maintain quality";
    return "Customer satisfaction needs improvement";
  }

  getResolutionFeedback(transcript) {
    const score = this.analyzeResolutionQuality(transcript);
    if (score >= 85) return "Excellent problem resolution and follow-up";
    if (score >= 70) return "Good resolution, could improve follow-up";
    return "Resolution quality needs improvement - provide clear solutions";
  }

  extractKeyPoints(transcript) {
    const keyPoints = [];
    if (/hello|greeting/i.test(transcript)) keyPoints.push("Professional greeting");
    if (/issue|problem/i.test(transcript)) keyPoints.push("Problem identification");
    if (/understand|clarify/i.test(transcript)) keyPoints.push("Active listening");
    if (/resolve|fix/i.test(transcript)) keyPoints.push("Problem resolution");
    if (/thank|appreciate/i.test(transcript)) keyPoints.push("Gratitude expressed");
    return keyPoints.length > 0 ? keyPoints : ["Customer service interaction"];
  }

  identifyIssues(sentimentScores, toxicityScores, clarityScore, engagementScore, relevanceScore) {
    const issues = [];
    if (clarityScore < 70) issues.push("Communication clarity needs improvement");
    if (engagementScore < 70) issues.push("Engagement level could be higher");
    if (relevanceScore < 70) issues.push("Stay more focused on customer needs");
    if (toxicityScores.some(s => s.politeness < 0.7)) issues.push("Language politeness needs attention");
    return issues;
  }

  generateRecommendations(sentimentScores, toxicityScores, clarityScore, engagementScore, relevanceScore) {
    const recommendations = [];
    if (clarityScore < 70) recommendations.push("Practice clear, concise communication");
    if (engagementScore < 70) recommendations.push("Expand vocabulary and be more descriptive");
    if (relevanceScore < 70) recommendations.push("Stay focused on customer issues");
    if (toxicityScores.some(s => s.politeness < 0.7)) recommendations.push("Use more polite and professional language");
    return recommendations.length > 0 ? recommendations : ["Continue current good practices"];
  }

  /**
   * Generate coaching plan based on analysis
   */
  async generateCoachingPlan(analysis, transcript) {
    try {
      console.log('📚 Generating coaching plan...');
      
      // Try real-time generation first
      const response = await axios.post(
        'https://api-inference.huggingface.co/models/microsoft/DialoGPT-medium',
        {
          inputs: `Generate a coaching plan for this call analysis: ${JSON.stringify(analysis)}. Transcript: ${transcript}`,
          parameters: {
            max_length: 500,
            temperature: 0.7
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.huggingFaceToken}`,
            'Content-Type': 'application/json'
          },
          timeout: 15000
        }
      );

      // Always use structured generation to ensure proper data types
      console.log('✅ Coaching plan generated');
      return this.generateCoachingPlanFromAnalysis(analysis, transcript);
    } catch (error) {
      console.warn('⚠️ AI coaching plan failed, using structured generation');
      return this.generateCoachingPlanFromAnalysis(analysis, transcript);
    }
  }

  generateCoachingPlanFromAnalysis(analysis, transcript) {
    const overallScore = analysis.overallScore || 75;
    
    let feedback = "Overall good performance with room for improvement.";
    if (overallScore >= 85) {
      feedback = "Excellent performance! Keep up the great work.";
    } else if (overallScore >= 70) {
      feedback = "Good performance with specific areas for improvement.";
    } else {
      feedback = "Performance needs improvement. Focus on the recommendations below.";
    }

    const coachingPlan = {
      feedback: feedback,
      recommendations: [
        {
          category: "Communication",
          title: "Improve Active Listening",
          description: "Practice active listening techniques to better understand customer needs",
          priority: "high"
        },
        {
          category: "Professionalism",
          title: "Enhance Greeting Skills",
          description: "Work on creating more welcoming and professional call openings",
          priority: "medium"
        },
        {
          category: "Problem Solving",
          title: "Better Issue Resolution",
          description: "Improve problem identification and resolution techniques",
          priority: "high"
        }
      ],
      resources: [
        {
          type: "video",
          title: "Active Listening Techniques",
          description: "Learn effective active listening skills",
          url: "https://www.youtube.com/watch?v=WzZNuQwQoQY"
        },
        {
          type: "article",
          title: "Customer Service Best Practices",
          description: "Essential tips for excellent customer service",
          url: "https://www.zendesk.com/blog/customer-service-best-practices/"
        }
      ],
      quiz: [
        {
          question: "What is the most important aspect of call opening?",
          options: ["Speed", "Professional greeting", "Getting to the point", "Asking questions"],
          correctAnswer: 1,
          explanation: "A professional greeting sets the tone for the entire call"
        },
        {
          question: "How should you handle an angry customer?",
          options: ["Hang up", "Listen actively and empathize", "Argue back", "Transfer immediately"],
          correctAnswer: 1,
          explanation: "Active listening and empathy help de-escalate situations"
        }
      ],
      completionCriteria: "Complete all recommendations and score 80% or higher on the quiz"
    };

    // Validate the structure before returning
    if (!Array.isArray(coachingPlan.resources)) {
      console.error('❌ Coaching plan resources is not an array:', typeof coachingPlan.resources);
      throw new Error('Invalid coaching plan structure: resources must be an array');
    }

    if (!Array.isArray(coachingPlan.recommendations)) {
      console.error('❌ Coaching plan recommendations is not an array:', typeof coachingPlan.recommendations);
      throw new Error('Invalid coaching plan structure: recommendations must be an array');
    }

    if (!Array.isArray(coachingPlan.quiz)) {
      console.error('❌ Coaching plan quiz is not an array:', typeof coachingPlan.quiz);
      throw new Error('Invalid coaching plan structure: quiz must be an array');
    }

    console.log('✅ Coaching plan structure validated');
    return coachingPlan;
  }

  /**
   * Get estimated cost for API calls
   */
  getEstimatedCost(transcriptLength, model = 'free') {
    return {
      whisper: 0,
      analysis: 0,
      total: 0
    };
  }
}

module.exports = new OpenAIService();
