import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Dumbbell, RefreshCw, Zap, Copy, Check } from 'lucide-react';
import { aiAPI } from '../services/api';

const SUGGESTED_PROMPTS = [
  {
    icon: Dumbbell,
    label: 'Beginner workout plan',
    text: 'Create a complete beginner workout plan for someone just starting at the gym. Include exercises for all muscle groups.',
  },
  {
    icon: Zap,
    label: 'Weight loss routine',
    text: 'Suggest an effective 4-week weight loss workout routine combining cardio and strength training.',
  },
  {
    icon: Sparkles,
    label: 'Muscle gain exercises',
    text: 'Recommend the best exercises for muscle gain and provide a weekly split routine.',
  },
  {
    icon: RefreshCw,
    label: '5-day schedule',
    text: 'Create a detailed 5-day workout schedule for general fitness and overall health improvement.',
  },
];

// ── Markdown Renderer ─────────────────────────────────────────────────────────
function renderInline(text) {
  // Bold **text** or __text__
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/__(.+?)__/g, '<strong>$1</strong>');
  // Italic *text* or _text_
  text = text.replace(/\*([^*]+?)\*/g, '<em>$1</em>');
  text = text.replace(/_([^_]+?)_/g, '<em>$1</em>');
  // Inline code `code`
  text = text.replace(/`([^`]+?)`/g, '<code class="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>');
  return text;
}

function MarkdownContent({ content }) {
  const lines = content.split('\n');
  const elements = [];
  let i = 0;
  let keyCounter = 0;
  const key = () => keyCounter++;

  while (i < lines.length) {
    const line = lines[i];

    // Skip empty lines
    if (line.trim() === '' || line.trim() === '---') {
      i++;
      continue;
    }

    // Heading 1  # Title
    if (/^# (.+)/.test(line)) {
      const text = line.replace(/^# /, '');
      elements.push(
        <h1 key={key()} className="text-xl font-black text-slate-900 mt-5 mb-3 pb-2 border-b border-slate-200"
          dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
      );
      i++;
      continue;
    }

    // Heading 2  ## Title
    if (/^## (.+)/.test(line)) {
      const text = line.replace(/^## /, '');
      elements.push(
        <h2 key={key()} className="text-base font-bold text-slate-800 mt-4 mb-2 flex items-center gap-2"
          dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
      );
      i++;
      continue;
    }

    // Heading 3  ### Title
    if (/^### (.+)/.test(line)) {
      const text = line.replace(/^### /, '');
      elements.push(
        <h3 key={key()} className="text-sm font-bold text-indigo-700 mt-3 mb-1.5"
          dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
      );
      i++;
      continue;
    }

    // Table  | col | col |
    if (/^\|.+\|/.test(line)) {
      const tableRows = [];
      while (i < lines.length && /^\|.+\|/.test(lines[i])) {
        tableRows.push(lines[i]);
        i++;
      }
      // First row = header, second row = separator, rest = body
      const [headerRow, , ...bodyRows] = tableRows;
      const headers = headerRow.split('|').map(h => h.trim()).filter(Boolean);
      const rows = bodyRows.map(r => r.split('|').map(c => c.trim()).filter(Boolean));

      elements.push(
        <div key={key()} className="overflow-x-auto my-3 rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead className="bg-indigo-50">
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="px-4 py-2.5 text-left text-xs font-bold text-indigo-700 uppercase tracking-wide"
                    dangerouslySetInnerHTML={{ __html: renderInline(h) }} />
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {rows.map((row, ri) => (
                <tr key={ri} className="hover:bg-slate-50">
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-4 py-2.5 text-slate-700"
                      dangerouslySetInnerHTML={{ __html: renderInline(cell) }} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Bullet list  - item or * item
    if (/^[-*•] (.+)/.test(line)) {
      const listItems = [];
      while (i < lines.length && /^[-*•] (.+)/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[-*•] /, ''));
        i++;
      }
      elements.push(
        <ul key={key()} className="space-y-1.5 my-2 ml-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2 text-slate-700">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list  1. item
    if (/^\d+\. (.+)/.test(line)) {
      const listItems = [];
      let num = 1;
      while (i < lines.length && /^\d+\. (.+)/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\. /, ''));
        i++;
        num++;
      }
      elements.push(
        <ol key={key()} className="space-y-1.5 my-2 ml-1">
          {listItems.map((item, li) => (
            <li key={li} className="flex items-start gap-2.5 text-slate-700">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center mt-0.5">
                {li + 1}
              </span>
              <span dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Code block  ``` ... ```
    if (line.startsWith('```')) {
      const lang = line.replace('```', '').trim();
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={key()} className="my-3 rounded-xl overflow-hidden border border-slate-200">
          {lang && (
            <div className="bg-slate-800 text-slate-400 text-xs px-4 py-1.5 font-mono">{lang}</div>
          )}
          <pre className="bg-slate-900 text-emerald-400 p-4 text-xs font-mono overflow-x-auto leading-relaxed">
            {codeLines.join('\n')}
          </pre>
        </div>
      );
      continue;
    }

    // Blockquote  > text
    if (/^> (.+)/.test(line)) {
      const text = line.replace(/^> /, '');
      elements.push(
        <blockquote key={key()} className="border-l-4 border-indigo-400 bg-indigo-50 px-4 py-2 my-2 rounded-r-xl text-slate-700 italic text-sm"
          dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
      );
      i++;
      continue;
    }

    // Regular paragraph
    if (line.trim()) {
      elements.push(
        <p key={key()} className="text-slate-700 leading-relaxed text-sm my-1"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

// ── Copy Button ────────────────────────────────────────────────────────────
function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 transition-colors px-1.5 py-1 rounded hover:bg-slate-100"
      title="Copy message"
    >
      {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Message Bubble ─────────────────────────────────────────────────────────
function MessageBubble({ message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center self-start mt-1
          ${isUser
            ? 'bg-indigo-600 text-white'
            : 'bg-gradient-to-br from-violet-500 to-indigo-600 text-white'
          }`}
      >
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>

      <div className={`max-w-[85%] flex flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm
            ${isUser
              ? 'bg-indigo-600 text-white rounded-tr-sm leading-relaxed'
              : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-sm'
            }`}
        >
          {isUser ? (
            <p className="leading-relaxed">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>
        <div className={`flex items-center gap-2 px-1 ${isUser ? 'flex-row-reverse' : ''}`}>
          <p className="text-xs text-slate-400">{message.time}</p>
          {!isUser && <CopyButton text={message.content} />}
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ───────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
        <Bot size={16} />
      </div>
      <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AIAssistant() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => { scrollToBottom(); }, [messages, loading]);

  const getTime = () =>
    new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  const sendMessage = async (text) => {
    const messageText = text || input.trim();
    if (!messageText || loading) return;

    const userMessage = { role: 'user', content: messageText, time: getTime() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await aiAPI.chat({ message: messageText, history });
      const aiMessage = {
        role: 'assistant',
        content: res.data.data.reply,
        time: getTime(),
        model: res.data.data.model,
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const errorMsg = {
        role: 'assistant',
        content: err.message || 'Sorry, I encountered an error. Please make sure your OpenRouter API key is set in server/.env and try again.',
        time: getTime(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => setMessages([]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 mb-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Bot size={24} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">FitAI Assistant</h2>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <p className="text-xs text-slate-500">Powered by Claude AI · OpenRouter</p>
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearChat}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <RefreshCw size={14} />
            <span>Clear</span>
          </button>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center mb-4">
                <Sparkles size={32} className="text-white" />
              </div>
              <h3 className="text-lg font-bold text-slate-700">Ask FitAI Anything</h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                Get personalized workout plans, exercise tips, nutrition advice, and more.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-6 w-full max-w-xl">
                {SUGGESTED_PROMPTS.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(prompt.text)}
                    disabled={loading}
                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl text-left transition-all group disabled:opacity-50"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white shadow-sm flex items-center justify-center flex-shrink-0 group-hover:bg-indigo-100">
                      <prompt.icon size={16} className="text-indigo-600" />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-700">
                      {prompt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <MessageBubble key={i} message={msg} />
          ))}

          {loading && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t border-slate-100 p-4 flex-shrink-0">
          <div className="flex gap-3">
            <textarea
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about workouts, nutrition, exercises..."
              rows={1}
              disabled={loading}
              className="flex-1 px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl resize-none
                focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
                placeholder:text-slate-400 disabled:opacity-60 transition-all"
              style={{ maxHeight: '120px', overflowY: 'auto' }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              className="w-12 h-12 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors
                flex items-center justify-center flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
