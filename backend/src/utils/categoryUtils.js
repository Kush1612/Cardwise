const keywordMap = {
  dining: ['swiggy', 'zomato', 'ubereats', 'dominos', 'mcdonald', 'restaurant', 'cafe'],
  travel: ['uber', 'ola', 'airbnb', 'makemytrip', 'ixigo', 'cleartrip', 'flight', 'hotel'],
  fuel: ['hp', 'indian oil', 'bharat petroleum', 'shell', 'fuel', 'petrol'],
  shopping: ['amazon', 'flipkart', 'myntra', 'ajio', 'shopping'],
  grocery: ['bigbasket', 'blinkit', 'zepto', 'dmart', 'grocery'],
  entertainment: ['netflix', 'spotify', 'bookmyshow', 'prime video', 'entertainment'],
};

const detectCategoryFromMerchant = (merchant = '') => {
  const merchantLower = merchant.toLowerCase();

  for (const [category, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((keyword) => merchantLower.includes(keyword))) {
      return category;
    }
  }

  return 'other';
};

module.exports = {
  detectCategoryFromMerchant,
};
