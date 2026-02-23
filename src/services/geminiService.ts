import { GoogleGenAI, ThinkingLevel } from "@google/genai";

const getApiKey = () => {
  // Try Vite environment variable first (standard for Vercel/Vite)
  // @ts-ignore
  const viteKey = import.meta.env?.VITE_GEMINI_API_KEY;
  if (viteKey) return viteKey;
  
  // Fallback to process.env.GEMINI_API_KEY
  // Vite's define will replace this literal string if configured
  try {
    const processKey = process.env.GEMINI_API_KEY;
    if (processKey) return processKey;
  } catch (e) {
    // process might not be defined in some environments
  }

  return "";
};

let aiInstance: GoogleGenAI | null = null;

const getAI = () => {
  if (!aiInstance) {
    const key = getApiKey();
    if (!key) {
      throw new Error("API key must be set when using the Gemini API.");
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
};

export interface Indicator {
  institution: string;
  metric: string;
  value: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface NewsItem {
  title: string;
  summary: string;
  url: string;
  source: string;
  date: string;
}

export async function fetchOnlyNews(query: string): Promise<NewsItem[]> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Aja como um analista financeiro sênior. 
    Colete as 10 notícias mais recentes e relevantes sobre: "${query}".
    
    IMPORTANTE: Você DEVE usar o Google Search para encontrar notícias REAIS e ATUAIS. 
    As URLs fornecidas devem ser links diretos e válidos para os artigos originais encontrados na busca. Não invente URLs.
    
    Para cada uma das 10 notícias, forneça:
    1. Título
    2. Um resumo conciso de 2 frases
    3. A URL exata e funcional da fonte
    4. O nome da fonte
    5. A data aproximada
    
    Retorne os dados em formato JSON seguindo este esquema:
    {
      "news": [
        {
          "title": "string",
          "summary": "string",
          "url": "string",
          "source": "string",
          "date": "string"
        }
      ]
    }
  `;

  try {
    const response = await getAI().models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    return (data.news || []).map((item: any) => ({
      ...item,
      url: item.url?.replace(/[\[\]\(\)]/g, '').trim() || '#'
    }));
  } catch (error) {
    console.error("Error fetching only news:", error);
    throw error;
  }
}

export async function fetchFinanceNews(query: string = "notícias sobre crédito e instituições financeiras no Brasil"): Promise<{ news: NewsItem[]; analysis: string; indicators: Indicator[] }> {
  const model = "gemini-3-flash-preview";
  
  const prompt = `
    Aja como um analista financeiro sênior. 
    Colete as 10 notícias mais recentes e relevantes sobre: "${query}".
    
    IMPORTANTE: Você DEVE usar o Google Search para encontrar notícias REAIS e ATUAIS. 
    As URLs fornecidas devem ser links diretos e válidos para os artigos originais encontrados na busca. Não invente URLs.
    
    Para cada uma das 10 notícias, forneça:
    1. Título
    2. Um resumo conciso de 2 frases
    3. A URL exata e funcional da fonte
    4. O nome da fonte
    5. A data aproximada
    
    Além das notícias:
    1. Forneça uma análise EXTREMAMENTE concisa (máximo 2 parágrafos curtos) sobre o cenário atual.
    2. Para as principais instituições financeiras (Itaú, Bradesco, Santander, Nubank, Banco do Brasil), liste obrigatoriamente estes 5 indicadores recentes:
       - Carteira (Total de crédito)
       - Inadimplência 15 a 90 (dias)
       - Inadimplência > 90 (dias)
       - ROE (Retorno sobre Patrimônio)
       - Lucro Líquido (Resultado do período)
    
    Retorne os dados em formato JSON seguindo este esquema:
    {
      "news": [
        {
          "title": "string",
          "summary": "string",
          "url": "string",
          "source": "string",
          "date": "string"
        }
      ],
      "analysis": "string (markdown format)",
      "indicators": [
        {
          "institution": "string",
          "metric": "string",
          "value": "string",
          "trend": "up | down | neutral"
        }
      ]
    }
  `;

  try {
    const response = await getAI().models.generateContent({
      model: model,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW }
      },
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    const cleanNews = (data.news || []).map((item: any) => ({
      ...item,
      url: item.url?.replace(/[\[\]\(\)]/g, '').trim() || '#'
    }));

    return {
      news: cleanNews,
      analysis: data.analysis || "Não foi possível gerar uma análise no momento.",
      indicators: data.indicators || []
    };
  } catch (error) {
    console.error("Error fetching news:", error);
    throw error;
  }
}
