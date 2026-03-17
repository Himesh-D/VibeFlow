import { botKnowledge, getRandomFallback } from './botData';

/**
 * AI Utility Functions (Client-side)
 * Provides text summarization, task extraction, and chat responses
 */

function summarizeText(text) {
  if (!text || text.trim().length === 0) {
    return 'No content to summarize.';
  }

  const cleaned = text.replace(/\s+/g, ' ').trim();
  const sentences = cleaned.match(/[^.!?]+[.!?]+/g) || [cleaned];

  if (sentences.length <= 3) {
    return cleaned;
  }

  const wordFreq = {};
  const words = cleaned.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];

  const stopWords = new Set([
    'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'her',
    'was', 'one', 'our', 'out', 'has', 'have', 'had', 'this', 'that', 'with',
    'they', 'been', 'from', 'will', 'would', 'could', 'should', 'into',
    'more', 'some', 'than', 'them', 'very', 'just', 'about', 'also',
    'which', 'their', 'what', 'when', 'make', 'like', 'each', 'does'
  ]);

  words.forEach(word => {
    if (!stopWords.has(word)) {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    }
  });

  const scored = sentences.map((sentence, index) => {
    const sentenceWords = sentence.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
    let score = 0;

    sentenceWords.forEach(word => {
      score += wordFreq[word] || 0;
    });

    score = sentenceWords.length > 0 ? score / sentenceWords.length : 0;

    if (index === 0) score *= 1.5;
    if (index === sentences.length - 1) score *= 1.2;

    const keyPhrases = ['important', 'key', 'summary', 'conclusion', 'result',
      'therefore', 'main', 'primary', 'essential', 'critical', 'deadline',
      'task', 'complete', 'submit', 'due', 'required', 'must', 'need'];
    keyPhrases.forEach(phrase => {
      if (sentence.toLowerCase().includes(phrase)) score *= 1.3;
    });

    return { sentence: sentence.trim(), score, index };
  });

  const numSentences = Math.min(4, Math.max(2, Math.ceil(sentences.length * 0.3)));
  const topSentences = scored
    .sort((a, b) => b.score - a.score)
    .slice(0, numSentences)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence);

  return topSentences.join(' ');
}

function extractTasks(text) {
  if (!text || text.trim().length === 0) {
    return [];
  }

  const tasks = [];
  const lines = text.split(/\n/);

  const taskPatterns = [
    /(?:TODO|TASK|ACTION|DEADLINE):\s*(.+)/i,
    /(?:need to|must|should|have to|required to)\s+(.+?)(?:\.|$)/i,
    /(?:complete|finish|submit|prepare|review|create|write|send|schedule|organize)\s+(.+?)(?:\.|$)/i,
    /(?:due|deadline|by)\s+(.+?)(?:\.|$)/i,
    /^\s*[-*•]\s+(.+)/,
    /^\s*\d+[.)]\s+(.+)/,
  ];

  lines.forEach(line => {
    const trimmed = line.trim();
    if (trimmed.length < 5 || trimmed.length > 200) return;

    for (const pattern of taskPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        const taskText = (match[1] || match[0]).trim();
        if (taskText.length >= 5 && taskText.length <= 200) {
          const dateMatch = taskText.match(
            /(?:by|due|before|until)\s+(\w+\s+\d{1,2}(?:,?\s+\d{4})?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)/i
          );

          tasks.push({
            title: taskText.replace(/[.!?]+$/, '').trim(),
            due_date: dateMatch ? dateMatch[1] : null,
            priority: determinePriority(taskText)
          });
        }
        break;
      }
    }
  });

  const unique = [];
  const seen = new Set();
  tasks.forEach(task => {
    const key = task.title.toLowerCase().substring(0, 50);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(task);
    }
  });

  return unique.slice(0, 20);
}

function determinePriority(text) {
  const highWords = ['urgent', 'asap', 'immediately', 'critical', 'important', 'deadline'];
  const lowWords = ['optional', 'later', 'whenever', 'maybe', 'consider'];

  const lower = text.toLowerCase();
  if (highWords.some(w => lower.includes(w))) return 'high';
  if (lowWords.some(w => lower.includes(w))) return 'low';
  return 'medium';
}

function chatResponse(message, context = {}) {
  const lower = message.toLowerCase().trim();
  const { taskCount = 0, docCount = 0, noteCount = 0 } = context;

  // 1. Check for specific keyword matches in our 100+ questions database
  for (const item of botKnowledge) {
    if (item.keywords.some(keyword => lower.includes(keyword))) {
      let response = item.answer;

      // Inject real-time stats if the answer allows for it
      response = response.replace(/\$\{taskCount\}/g, taskCount);
      response = response.replace(/\$\{docCount\}/g, docCount);
      response = response.replace(/\$\{noteCount\}/g, noteCount);

      return response;
    }
  }

  // 2. Handle dynamic queries that might not be in the keyword list but are useful
  if (/how many|status|overview|count|total/.test(lower)) {
    return `📊 **Your Real-time Stats**:\n• 📋 **${taskCount}** tasks\n• 📄 **${docCount}** documents\n• 📒 **${noteCount}** notes\n\nYou're doing great! Keep it up! 🚀`;
  }

  // 3. Fallback to random helper response
  return getRandomFallback();
}

export { summarizeText, extractTasks, chatResponse };
