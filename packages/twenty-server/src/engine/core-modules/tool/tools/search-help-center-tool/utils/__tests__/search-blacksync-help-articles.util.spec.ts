import { searchBlackSyncHelpArticles } from 'src/engine/core-modules/tool/tools/search-help-center-tool/utils/search-blacksync-help-articles.util';

describe('searchBlackSyncHelpArticles', () => {
  it('answers who built the product from the BlackSync guide', () => {
    const [first] = searchBlackSyncHelpArticles('who built this crm');

    expect(first.title).toBe('About BlackSync Cloud');
    expect(first.content).toContain('Hamza Basal and Rithvik Burri');
  });

  it('finds the power dialer article', () => {
    expect(
      searchBlackSyncHelpArticles('how do I use the power dialer')[0].title,
    ).toBe('Power dialer');
  });

  it('returns nothing for unrelated queries', () => {
    expect(searchBlackSyncHelpArticles('zzz qqq')).toEqual([]);
  });
});
