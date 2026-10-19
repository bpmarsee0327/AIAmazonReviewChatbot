import React, { useState, useEffect, useRef } from 'react';
import { Search, BarChart3, FileText, AlertCircle, Loader2, Sun, Moon, ShoppingBag } from 'lucide-react';
import { analyzeProductReviews, createReviewChatSession, searchAmazonProducts } from './services/geminiService';
import { AnalysisResult, ProductSearchResult } from './types';
import { SentimentBar } from './components/SentimentBar';
import { Chatbot } from './components/Chatbot';
import { Chat } from '@google/genai';

const App: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<ProductSearchResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ||
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setError(null);
    setSearchResults([]);
    setShowDropdown(true);

    try {
      const results = await searchAmazonProducts(query);
      if (results.length === 0) {
        setError("No products found for that search. Try a different query or paste a direct URL.");
        setShowDropdown(false);
      } else {
        setSearchResults(results);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during search.");
      setShowDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async (targetUrl: string) => {
    setIsAnalyzing(true);
    setError(null);
    setAnalysis(null);
    setChatSession(null);
    setShowDropdown(false);
    setInputValue(targetUrl); // Update input to show what's being analyzed

    try {
      const result = await analyzeProductReviews(targetUrl);
      setAnalysis(result);
      
      // Initialize chat session with the new context
      const newChatSession = createReviewChatSession(result);
      setChatSession(newChatSession);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Check if it looks like a URL
    if (inputValue.match(/^https?:\/\//i) || inputValue.match(/amazon\.com/i)) {
      handleAnalyze(inputValue);
    } else {
      handleSearch(inputValue);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-20 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center justify-between md:justify-start gap-4 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">ReviewLens</h1>
              </div>
              
              {/* Mobile Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
            
            <div className="flex-1 max-w-2xl w-full flex items-center gap-4">
              <div className="relative flex-1" ref={dropdownRef}>
                <form onSubmit={handleSubmit} className="w-full">
                  <div className="relative flex items-center">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400 dark:text-slate-500" />
                    </div>
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => {
                        setInputValue(e.target.value);
                        setShowDropdown(false); // Hide dropdown when typing
                      }}
                      onFocus={() => {
                        if (searchResults.length > 0) setShowDropdown(true);
                      }}
                      placeholder="Search product name or paste Amazon URL..."
                      className="block w-full pl-10 pr-28 py-3 border border-slate-300 dark:border-slate-600 rounded-xl leading-5 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-all shadow-sm"
                      disabled={isAnalyzing || isSearching}
                    />
                    <button
                      type="submit"
                      disabled={isAnalyzing || isSearching || !inputValue.trim()}
                      className="absolute right-1.5 top-1.5 bottom-1.5 px-4 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                    >
                      {(isAnalyzing || isSearching) ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span className="hidden sm:inline">{isSearching ? 'Searching' : 'Analyzing'}</span>
                        </>
                      ) : (
                        'Search'
                      )}
                    </button>
                  </div>
                </form>

                {/* Search Results Dropdown */}
                {showDropdown && (isSearching || searchResults.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden z-50">
                    {isSearching ? (
                      <div className="p-6 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                        <span className="text-sm font-medium">Finding products on Amazon...</span>
                      </div>
                    ) : (
                      <ul className="max-h-80 overflow-y-auto custom-scrollbar">
                        <li className="px-4 py-2 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          Select a product to analyze
                        </li>
                        {searchResults.map((result, idx) => (
                          <li key={idx}>
                            <button
                              type="button"
                              onClick={() => handleAnalyze(result.url)}
                              className="w-full text-left px-4 py-3 hover:bg-indigo-50 dark:hover:bg-slate-700 border-b border-slate-100 dark:border-slate-700 last:border-0 transition-colors flex items-start gap-3 group"
                            >
                              <ShoppingBag className="w-5 h-5 text-slate-400 group-hover:text-indigo-500 mt-0.5 flex-shrink-0 transition-colors" />
                              <div className="flex-1 min-w-0">
                                <div className="font-medium text-sm text-slate-900 dark:text-white truncate">{result.name}</div>
                                <div className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{result.url}</div>
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>

              {/* Desktop Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className="hidden md:flex p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {!analysis && !isAnalyzing && !error && (
          <div className="h-[60vh] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-4">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 transition-colors">
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-xl font-medium text-slate-600 dark:text-slate-300">Ready to analyze reviews</h2>
            <p className="max-w-md text-center text-sm">
              Search for a product name or paste an Amazon URL above to instantly get a summary of customer opinions, key topics, and sentiment analysis.
            </p>
          </div>
        )}

        {isAnalyzing && (
          <div className="h-[60vh] flex flex-col items-center justify-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-indigo-100 dark:border-indigo-900/50 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-indigo-600 rounded-full border-t-transparent animate-spin absolute top-0 left-0"></div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200">Reading Reviews...</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Our AI is crunching the data to find the most important insights.</p>
            </div>
          </div>
        )}

        {analysis && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-full">
            {/* Left Column: Summary & Topics */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Summary Card */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Overall Summary</h2>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {analysis.summary}
                </p>
              </section>

              {/* Topics Card */}
              <section className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 transition-colors">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top Discussed Topics</h2>
                  </div>
                  <div className="text-xs font-medium text-slate-400 dark:text-slate-500 flex items-center gap-4">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> Negative</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400 dark:bg-gray-500"></span> Neutral</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Positive</span>
                  </div>
                </div>
                
                <div className="space-y-5">
                  {analysis.topics.map((topic, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-1/3 font-medium text-slate-700 dark:text-slate-300 truncate" title={topic.name}>
                        {topic.name}
                      </div>
                      <div className="sm:w-2/3">
                        <SentimentBar sentiment={topic.sentiment} />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column: Chatbot */}
            <div className="lg:col-span-1 h-[600px] lg:h-auto lg:sticky lg:top-24">
              <Chatbot chatSession={chatSession} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
