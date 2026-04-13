const systemPrompt = `You are a financial assistant that recommends the best credit card for a given transaction. You analyze user cards, categories, cashback rates, and offers. Always return:
1. Best card
2. Reason
3. Estimated reward
4. Alternative options`;

const OFFER_CATEGORIES = ['fuel', 'dining', 'travel', 'shopping', 'grocery', 'entertainment', 'other', 'all'];
const REWARD_CATEGORIES = ['fuel', 'dining', 'travel', 'shopping', 'grocery', 'entertainment', 'other'];

const parseJsonText = (text) => {
  const trimmed = String(text || '').trim();
  if (!trimmed) return null;

  const cleaned = trimmed
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw error;
  }
};

const getGeminiConfig = () => {
  const apiKey = (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

  if (!apiKey) return null;
  return { apiKey, model };
};

const callGeminiJson = async ({ systemInstruction, userPayload, temperature = 0.2, modelOverride }) => {
  const config = getGeminiConfig();
  if (!config) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const models = [...new Set([modelOverride || config.model, 'gemini-2.0-flash', 'gemini-flash-latest'].filter(Boolean))];
  let lastError = null;

  for (const model of models) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: JSON.stringify(userPayload) }]
          }
        ],
        generationConfig: {
          temperature,
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      lastError = new Error(`Gemini API error ${response.status} (${model}): ${errorText}`);
      if (response.status === 429 || response.status === 503 || response.status === 500) {
        continue;
      }
      throw lastError;
    }

    const data = await response.json();
    const text = (data.candidates || [])
      .flatMap((candidate) => candidate.content?.parts || [])
      .map((part) => part.text || '')
      .join('')
      .trim();

    if (!text) {
      lastError = new Error(`Empty Gemini response (${model})`);
      continue;
    }

    const parsed = parseJsonText(text);
    if (!parsed) {
      lastError = new Error(`Unable to parse Gemini response JSON (${model})`);
      continue;
    }

    return parsed;
  }

  throw lastError || new Error('Gemini call failed');
};

const getAIRecommendationSummary = async (payload) => {
  try {
    const parsed = await callGeminiJson({
      systemInstruction: systemPrompt,
      userPayload: {
        instruction:
          'Use the provided computation results as ground truth for reward values. Improve explanation clarity and list alternatives.',
        data: payload
      },
      temperature: 0.2
    });

    return {
      reason: parsed.reason || parsed.why || 'Best match based on rewards and offers.',
      alternatives: parsed.alternatives || [],
      estimatedReward: parsed.estimatedReward,
      aiUsed: true
    };
  } catch (error) {
    console.error('Gemini recommendation error:', error.message);
    return {
      reason: 'Best card selected by rule-based reward calculation.',
      alternatives: [],
      aiUsed: false
    };
  }
};

const detectCategoryWithAI = async (merchant) => {
  try {
    const parsed = await callGeminiJson({
      systemInstruction:
        'Classify merchant names into one category: fuel, dining, travel, shopping, grocery, entertainment, other. Return JSON: {"category":"..."}',
      userPayload: { merchant },
      temperature: 0
    });

    return parsed.category || null;
  } catch (error) {
    console.error('Gemini category detection error:', error.message);
    return null;
  }
};

const stripHtml = (html = '') =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const decodeDuckDuckGoRedirect = (url) => {
  const normalizedUrl = url.startsWith('//') ? `https:${url}` : url;

  try {
    const parsed = new URL(normalizedUrl);
    if (parsed.hostname.includes('duckduckgo.com') && parsed.searchParams.get('uddg')) {
      return decodeURIComponent(parsed.searchParams.get('uddg'));
    }
  } catch (error) {
    return normalizedUrl;
  }

  return normalizedUrl;
};

const extractResultLinks = (html) => {
  const links = [];
  const anchorPattern = /<a[^>]+class="result__a"[^>]+href="([^"]+)"/g;
  let match;

  while ((match = anchorPattern.exec(html)) !== null && links.length < 8) {
    const raw = match[1];
    const decoded = decodeDuckDuckGoRedirect(raw);
    if (decoded.startsWith('http')) {
      links.push(decoded);
    }
  }

  return [...new Set(links)];
};

const fetchWithTimeout = async (url, timeoutMs = 9000) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CardWise/1.0 (+benefit-discovery)'
      }
    });
    return response;
  } finally {
    clearTimeout(timer);
  }
};

const getOfferContextFromWeb = async (cardName, bankName) => {
  const query = encodeURIComponent(`${bankName} ${cardName} credit card offers cashback rewards India`);
  const searchUrl = `https://html.duckduckgo.com/html/?q=${query}`;

  try {
    const searchResponse = await fetchWithTimeout(searchUrl, 10000);
    const searchHtml = await searchResponse.text();
    const links = extractResultLinks(searchHtml);

    const pages = [];
    for (const url of links.slice(0, 5)) {
      try {
        const pageRes = await fetchWithTimeout(url, 10000);
        const raw = await pageRes.text();
        const text = stripHtml(raw).slice(0, 5000);
        if (text.length > 120) {
          pages.push({ url, text });
        }
      } catch (error) {
        continue;
      }
    }

    return {
      pages,
      links
    };
  } catch (error) {
    console.error('Offer search error:', error.message);
    return {
      pages: [],
      links: []
    };
  }
};

const normalizeOffers = (offers = []) =>
  offers
    .map((offer) => {
      const discountType = offer.discountType === 'flat' ? 'flat' : 'percentage';
      const category = OFFER_CATEGORIES.includes(offer.category) ? offer.category : 'all';
      const discountValue = Number(offer.discountValue) || 0;

      return {
        merchant: String(offer.merchant || '').toLowerCase().trim(),
        category,
        discountType,
        discountValue,
        description: String(offer.description || '').trim(),
        sourceUrl: String(offer.sourceUrl || '').trim()
      };
    })
    .filter((offer) => offer.discountValue > 0)
    .slice(0, 15);

const normalizeRewardRates = (rewardRates = []) => {
  const normalized = rewardRates
    .map((rateItem) => ({
      category: REWARD_CATEGORIES.includes(rateItem.category) ? rateItem.category : 'other',
      rate: Number(rateItem.rate) || 0
    }))
    .filter((rateItem) => rateItem.rate > 0);

  const byCategory = new Map();
  for (const item of normalized) {
    const existing = byCategory.get(item.category);
    if (!existing || item.rate > existing.rate) {
      byCategory.set(item.category, item);
    }
  }

  return Array.from(byCategory.values()).slice(0, 10);
};

const extractHeuristicRewardRates = (pages = []) => {
  const categoryHints = {
    dining: ['dining', 'restaurant', 'food'],
    travel: ['travel', 'flight', 'hotel', 'airline', 'cab'],
    fuel: ['fuel', 'petrol', 'diesel'],
    shopping: ['shopping', 'online', 'ecommerce', 'amazon', 'flipkart'],
    grocery: ['grocery', 'supermarket'],
    entertainment: ['entertainment', 'movies', 'ott', 'streaming'],
    other: ['all spends', 'all transactions', 'all categories'],
  };

  const found = [];
  const percentRegex = /(\d{1,2}(?:\.\d+)?)\s*%/gi;

  for (const page of pages) {
    const text = String(page.text || '').toLowerCase();
    let match;
    while ((match = percentRegex.exec(text)) !== null) {
      const rate = Number(match[1]);
      if (!rate || rate > 30) continue;

      const start = Math.max(0, match.index - 90);
      const end = Math.min(text.length, match.index + 120);
      const windowText = text.slice(start, end);

      let category = 'other';
      for (const [cat, hints] of Object.entries(categoryHints)) {
        if (hints.some((hint) => windowText.includes(hint))) {
          category = cat;
          break;
        }
      }

      found.push({ category, rate });
    }
  }

  return normalizeRewardRates(found);
};

const extractHeuristicOffers = (pages = []) => {
  const offers = [];
  const noisyMerchantHints = ['cashback', 'reward', 'rewards', 'benefit', 'brands', 'cashpoints', 'transactions'];
  const cleanMerchant = (merchantText) => {
    const value = String(merchantText || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (!value) return '';
    if (value.length > 24) return '';
    if (/\d/.test(value)) return '';
    if (noisyMerchantHints.some((hint) => value.includes(hint))) return '';
    return value;
  };

  for (const page of pages) {
    const text = String(page.text || '');
    const sourceUrl = page.url || '';

    const percentOnMerchant = /(\d{1,2}(?:\.\d+)?)\s*%\s*(?:cashback|off|discount)[^.]{0,80}?(?:on|at|for)\s+([a-z][a-z0-9&\s.-]{2,40})/gi;
    let pMatch;
    while ((pMatch = percentOnMerchant.exec(text)) !== null) {
      const discountValue = Number(pMatch[1]);
      if (!discountValue || discountValue > 30) continue;

      const merchant = cleanMerchant(pMatch[2]);
      offers.push({
        merchant,
        category: 'all',
        discountType: 'percentage',
        discountValue,
        description: merchant ? `${discountValue}% offer on ${merchant}` : `${discountValue}% offer`,
        sourceUrl,
      });
    }

    const flatOnMerchant = /(?:₹|rs\.?)\s?(\d{2,5})[^.]{0,80}?(?:off|discount|cashback)[^.]{0,80}?(?:on|at|for)\s+([a-z][a-z0-9&\s.-]{2,40})/gi;
    let fMatch;
    while ((fMatch = flatOnMerchant.exec(text)) !== null) {
      const discountValue = Number(fMatch[1]);
      if (!discountValue || discountValue > 5000) continue;

      const merchant = cleanMerchant(fMatch[2]);
      offers.push({
        merchant,
        category: 'all',
        discountType: 'flat',
        discountValue,
        description: merchant ? `Flat ₹${discountValue} offer on ${merchant}` : `Flat ₹${discountValue} offer`,
        sourceUrl,
      });
    }
  }

  return normalizeOffers(offers);
};

const discoverCardBenefitsFromWeb = async (cardName, bankName) => {
  const config = getGeminiConfig();
  if (!config) {
    return {
      offers: [],
      rewardRates: [],
      sources: [],
      aiUsed: false,
      message: 'GEMINI_API_KEY missing, benefit auto-fetch skipped.'
    };
  }

  const context = await getOfferContextFromWeb(cardName, bankName);
  if (!context.pages.length) {
    return {
      offers: [],
      rewardRates: [],
      sources: context.links,
      aiUsed: false,
      message: 'No web snippets available for this card.'
    };
  }

  const runGeminiExtraction = async (pages) =>
    callGeminiJson({
      systemInstruction:
        'Extract credit card reward rates and offers into strict JSON: {"rewardRates":[{"category":"fuel|dining|travel|shopping|grocery|entertainment|other","rate":0}],"offers":[{"merchant":"","category":"all|fuel|dining|travel|shopping|grocery|entertainment|other","discountType":"percentage|flat","discountValue":0,"description":"","sourceUrl":""}]}. Use only evidence from provided web text. If unsure, omit.',
      userPayload: {
        cardName,
        bankName,
        pages,
      },
      temperature: 0.1,
    });

  try {
    const parsed = await runGeminiExtraction(context.pages);
    const offers = normalizeOffers(parsed.offers || []);
    const rewardRates = normalizeRewardRates(parsed.rewardRates || []);

    if (offers.length || rewardRates.length) {
      return {
        offers,
        rewardRates,
        sources: [...new Set(offers.map((o) => o.sourceUrl).filter(Boolean).concat(context.links))],
        aiUsed: true,
        message: 'Card benefits discovered from the web.',
      };
    }

    // Retry with smaller context if first pass returns empty.
    const compactPages = context.pages.slice(0, 2).map((page) => ({
      ...page,
      text: page.text.slice(0, 2500),
    }));
    const retryParsed = await runGeminiExtraction(compactPages);
    const retryOffers = normalizeOffers(retryParsed.offers || []);
    const retryRewardRates = normalizeRewardRates(retryParsed.rewardRates || []);

    if (retryOffers.length || retryRewardRates.length) {
      return {
        offers: retryOffers,
        rewardRates: retryRewardRates,
        sources: [...new Set(retryOffers.map((o) => o.sourceUrl).filter(Boolean).concat(context.links))],
        aiUsed: true,
        message: 'Card benefits discovered from the web (retry mode).',
      };
    }

    const heuristicOffers = extractHeuristicOffers(context.pages);
    const heuristicRewardRates = extractHeuristicRewardRates(context.pages);

    return {
      offers: heuristicOffers,
      rewardRates: heuristicRewardRates,
      sources: context.links,
      aiUsed: false,
      message:
        heuristicOffers.length || heuristicRewardRates.length
          ? 'Card benefits discovered via fallback parser.'
          : 'No structured card benefits extracted from web results.',
    };
  } catch (error) {
    console.error('Benefit extraction error:', error.message);

    const heuristicOffers = extractHeuristicOffers(context.pages);
    const heuristicRewardRates = extractHeuristicRewardRates(context.pages);

    if (heuristicOffers.length || heuristicRewardRates.length) {
      return {
        offers: heuristicOffers,
        rewardRates: heuristicRewardRates,
        sources: context.links,
        aiUsed: false,
        message: 'Card benefits discovered via fallback parser after AI error.',
      };
    }

    return {
      offers: [],
      rewardRates: [],
      sources: context.links,
      aiUsed: false,
      message: `Failed to extract card benefits via AI (${error.message}).`
    };
  }
};

const discoverCardOffersFromWeb = async (cardName, bankName) => {
  const data = await discoverCardBenefitsFromWeb(cardName, bankName);
  return {
    offers: data.offers,
    sources: data.sources,
    aiUsed: data.aiUsed,
    message: data.message
  };
};

module.exports = {
  getAIRecommendationSummary,
  detectCategoryWithAI,
  discoverCardBenefitsFromWeb,
  discoverCardOffersFromWeb
};
