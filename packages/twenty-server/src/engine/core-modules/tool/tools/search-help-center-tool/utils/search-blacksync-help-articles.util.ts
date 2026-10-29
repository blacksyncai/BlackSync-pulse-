import {
  BLACKSYNC_HELP_ARTICLES,
  type BlackSyncHelpArticle,
} from 'src/engine/core-modules/tool/tools/search-help-center-tool/constants/blacksync-help-articles.constant';

const MAX_RESULTS = 3;

const toWords = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9-]+/)
    .filter((word) => word.length > 2);

export const searchBlackSyncHelpArticles = (
  query: string,
  articles: BlackSyncHelpArticle[] = BLACKSYNC_HELP_ARTICLES,
) => {
  const normalizedQuery = query.toLowerCase();
  const queryWords = toWords(query);

  return articles
    .map((article) => {
      const keywordScore = article.keywords.filter((keyword) =>
        normalizedQuery.includes(keyword),
      ).length;
      const haystack = `${article.title} ${article.content}`.toLowerCase();
      const wordScore = queryWords.filter((word) =>
        haystack.includes(word),
      ).length;

      return { article, score: keywordScore * 3 + wordScore };
    })
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, MAX_RESULTS)
    .map(({ article }) => ({ title: article.title, content: article.content }));
};
