import { Injectable } from '@nestjs/common';

import { SearchHelpCenterInputZodSchema } from 'src/engine/core-modules/tool/tools/search-help-center-tool/search-help-center-tool.schema';
import { searchBlackSyncHelpArticles } from 'src/engine/core-modules/tool/tools/search-help-center-tool/utils/search-blacksync-help-articles.util';
import { type ToolInput } from 'src/engine/core-modules/tool/types/tool-input.type';
import { type ToolOutput } from 'src/engine/core-modules/tool/types/tool-output.type';
import { type ToolExecutionContext } from 'src/engine/core-modules/tool/types/tool-execution-context.type';
import { type Tool } from 'src/engine/core-modules/tool/types/tool.type';

@Injectable()
export class SearchHelpCenterTool implements Tool {
  description =
    'Search the BlackSync Cloud help center for how features work, setup, usage, troubleshooting, and information about BlackSync Cloud and its founders.';
  inputSchema = SearchHelpCenterInputZodSchema;

  async execute(
    parameters: ToolInput,
    _context: ToolExecutionContext,
  ): Promise<ToolOutput> {
    const query = String(parameters.query ?? '');
    const results = searchBlackSyncHelpArticles(query);

    if (results.length === 0) {
      return {
        success: true,
        message: `No help center articles found for "${query}"`,
        result: [],
      };
    }

    return {
      success: true,
      message: `Found ${results.length} help center article${results.length === 1 ? '' : 's'} for "${query}"`,
      result: results,
    };
  }
}
