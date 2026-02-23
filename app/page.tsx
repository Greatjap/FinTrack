"use client";

import { useState, useEffect } from 'react';
import { 
  Search, 
  TrendingUp, 
  Newspaper, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Building2, 
  ArrowRight,
  Loader2,
  AlertCircle,
  TrendingDown,
  Minus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { fetchFinanceNews, fetchOnlyNews, NewsItem, Indicator } from '@/src/services/geminiService';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  const [query, setQuery] = useState('');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [analysis, setAnalysis] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [cache, setCache] = useState<Record<string, NewsItem[]>>({});

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    const trimmedQuery = query.trim();

    // Check cache for news searches
    if (trimmedQuery && cache[trimmedQuery]) {
      setNews(cache[trimmedQuery]);
      setLastUpdated(new Date());
      return;
    }
    
    // If there's a query, only update news
    if (trimmedQuery) {
      setNewsLoading(true);
      setError(null);
      try {
        const newsResult = await fetchOnlyNews(trimmedQuery);
        setNews(newsResult);
        setCache(prev => ({ ...prev, [trimmedQuery]: newsResult }));
        setLastUpdated(new Date());
      } catch (err) {
        setError('Falha ao buscar notícias. Por favor, tente novamente.');
        console.error(err);
      } finally {
        setNewsLoading(false);
      }
      return;
    }

    // Otherwise (initial load or empty query refresh), update everything
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFinanceNews();
      setNews(result.news);
      setAnalysis(result.analysis);
      setIndicators(result.indicators);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Falha ao coletar dados. Por favor, tente novamente.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const groupedIndicators = indicators.reduce((acc, curr) => {
    if (!acc[curr.institution]) {
      acc[curr.institution] = [];
    }
    acc[curr.institution].push(curr);
    return acc;
  }, {} as Record<string, Indicator[]>);

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1A1A1A] selection:bg-emerald-100">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-bottom border-black/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-200">
              <TrendingUp size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">FinTrack AI</h1>
              <p className="text-xs text-black/40 font-mono uppercase tracking-widest">Monitor de Crédito & Bancos</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black/30" size={18} />
            <input
              type="text"
              placeholder="Buscar tópicos específicos (ex: Selic, Fintechs...)"
              className="w-full bg-black/5 border-none rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all outline-none"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </form>

          <div className="flex items-center gap-4">
            {lastUpdated && (
              <span className="text-[10px] font-mono text-black/40 hidden lg:block">
                ÚLTIMA ATUALIZAÇÃO: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button 
              onClick={() => handleSearch()}
              disabled={loading || newsLoading}
              className="p-2 hover:bg-black/5 rounded-full transition-colors disabled:opacity-50"
            >
              <RefreshCw size={20} className={cn((loading || newsLoading) && "animate-spin")} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: News Feed */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-serif italic flex items-center gap-2">
                <Newspaper className="text-emerald-600" size={24} />
                Feed de Notícias
              </h2>
              <span className="mono-label text-black/40">{news.length} RESULTADOS</span>
            </div>

            <AnimatePresence mode="wait">
              {(loading || newsLoading) ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-4"
                >
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-6 border border-black/5 animate-pulse">
                      <div className="h-4 bg-black/5 rounded w-3/4 mb-4" />
                      <div className="h-3 bg-black/5 rounded w-full mb-2" />
                      <div className="h-3 bg-black/5 rounded w-5/6" />
                    </div>
                  ))}
                </motion.div>
              ) : error ? (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 text-red-600 p-8 rounded-2xl border border-red-100 flex flex-col items-center text-center gap-4"
                >
                  <AlertCircle size={48} />
                  <div>
                    <h3 className="font-bold">Erro na Conexão</h3>
                    <p className="text-sm opacity-80">{error}</p>
                  </div>
                  <button 
                    onClick={() => handleSearch()}
                    className="bg-red-600 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    Tentar Novamente
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {news.map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="group bg-white hover:bg-emerald-50/30 rounded-2xl p-6 border border-black/5 hover:border-emerald-200 transition-all cursor-pointer"
                      onClick={() => window.open(item.url, '_blank')}
                    >
                      <div className="flex justify-between items-start gap-4 mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="mono-label text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                              {item.source}
                            </span>
                            <span className="text-[10px] text-black/30 font-mono">{item.date}</span>
                          </div>
                          <h3 className="text-lg font-bold leading-tight group-hover:text-emerald-700 transition-colors">
                            {item.title}
                          </h3>
                        </div>
                        <div className="p-2 bg-black/5 rounded-lg text-black/30 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                          <ExternalLink size={16} />
                        </div>
                      </div>
                      <p className="text-sm text-black/60 leading-relaxed">
                        {item.summary}
                      </p>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right Column: Analysis & Insights */}
          <div className="lg:col-span-4 space-y-6">
            <div className="sticky top-28 space-y-6">
              
              {/* Indicators Card */}
              <div className="bg-white rounded-3xl p-6 border border-black/5 shadow-sm">
                <h2 className="text-lg font-serif italic mb-4 flex items-center gap-2">
                  <Building2 className="text-emerald-600" size={20} />
                  Indicadores Recentes
                </h2>
                
                <div className="space-y-6">
                  {loading ? (
                    [1, 2, 3].map(i => (
                      <div key={i} className="space-y-2">
                        <div className="h-4 bg-black/5 rounded w-1/3 animate-pulse" />
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-10 bg-black/5 rounded-xl animate-pulse" />
                          <div className="h-10 bg-black/5 rounded-xl animate-pulse" />
                        </div>
                      </div>
                    ))
                  ) : Object.keys(groupedIndicators).length > 0 ? (
                    Object.entries(groupedIndicators).map(([institution, items], idx) => (
                      <div key={idx} className="space-y-2">
                        <h3 className="text-[10px] font-mono text-black/40 uppercase tracking-widest border-b border-black/5 pb-1">
                          {institution}
                        </h3>
                        <div className="grid grid-cols-1 gap-1.5">
                          {items.map((ind, iIdx) => (
                            <div key={iIdx} className="flex items-center justify-between p-2 rounded-xl bg-black/5 hover:bg-emerald-50 transition-colors">
                              <span className="text-[10px] font-medium text-black/60">{ind.metric}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-mono font-bold text-emerald-700">{ind.value}</span>
                                {ind.trend === 'up' && <TrendingUp size={10} className="text-emerald-500" />}
                                {ind.trend === 'down' && <TrendingDown size={10} className="text-red-500" />}
                                {ind.trend === 'neutral' && <Minus size={10} className="text-black/20" />}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-black/40 italic text-center py-4">Nenhum indicador disponível</p>
                  )}
                </div>
              </div>

              {/* Analysis Card */}
              <div className="bg-white rounded-3xl p-8 border border-black/5 shadow-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <ShieldCheck size={120} />
                </div>
                
                <h2 className="text-xl font-serif italic mb-6 flex items-center gap-2">
                  <TrendingUp className="text-emerald-600" size={20} />
                  Análise do Especialista
                </h2>

                <div className="prose prose-sm prose-emerald max-w-none text-black/70">
                  {loading ? (
                    <div className="space-y-4">
                      <div className="h-3 bg-black/5 rounded w-full" />
                      <div className="h-3 bg-black/5 rounded w-full" />
                      <div className="h-3 bg-black/5 rounded w-2/3" />
                    </div>
                  ) : (
                    <div className="markdown-body">
                      <Markdown>{analysis}</Markdown>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Stats / Context */}
              <div className="bg-emerald-900 text-white rounded-3xl p-8 shadow-xl shadow-emerald-900/20">
                <h3 className="text-sm font-mono uppercase tracking-widest opacity-60 mb-6">Foco do Agente</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Instituições Financeiras</p>
                      <p className="text-xs opacity-60">Bancos, Fintechs e Cooperativas</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                      <TrendingUp size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Mercado de Crédito</p>
                      <p className="text-xs opacity-60">Taxas, Inadimplência e Oferta</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-xs opacity-60 leading-relaxed italic">
                    "Este agente utiliza IA para filtrar e sintetizar as informações mais críticas do setor financeiro em tempo real."
                  </p>
                </div>
              </div>

              {/* Footer Links */}
              <div className="px-4">
                <p className="text-[10px] font-mono text-black/30 uppercase tracking-tighter">
                  Powered by Gemini 3 Flash • Google Search Grounding
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
