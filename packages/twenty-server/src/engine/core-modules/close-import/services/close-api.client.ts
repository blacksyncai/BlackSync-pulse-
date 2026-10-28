import { type CloseListResponse } from 'src/engine/core-modules/close-import/types/close-api.type';

const CLOSE_API_BASE_URL = 'https://api.close.com/api/v1';
const CLOSE_PAGE_SIZE = 100;
const CLOSE_MAX_RETRIES = 5;

export class CloseApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

const sleep = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

export class CloseApiClient {
  private readonly authorization: string;

  constructor(apiKey: string) {
    this.authorization = `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
  }

  authorizationHeader(): Record<string, string> {
    return { Authorization: this.authorization };
  }

  async get<TResponse>(
    path: string,
    params: Record<string, string | number> = {},
  ): Promise<TResponse> {
    const url = new URL(`${CLOSE_API_BASE_URL}${path}`);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    for (let attempt = 0; ; attempt++) {
      const response = await fetch(url, {
        headers: {
          Authorization: this.authorization,
          Accept: 'application/json',
        },
      });

      if (response.ok) {
        return (await response.json()) as TResponse;
      }

      const isRetryable = response.status === 429 || response.status >= 500;

      if (!isRetryable || attempt >= CLOSE_MAX_RETRIES) {
        throw new CloseApiError(
          response.status === 401
            ? 'Close rejected the API key'
            : `Close API responded with ${response.status}`,
          response.status,
        );
      }

      // Close sends the seconds until the rate limit window resets.
      const resetSeconds = Number(
        response.headers.get('ratelimit-reset') ??
          response.headers.get('retry-after') ??
          2 ** attempt,
      );

      await sleep(Math.max(resetSeconds, 1) * 1000);
    }
  }

  async *paginate<TRecord>(
    path: string,
    params: Record<string, string | number> = {},
  ): AsyncGenerator<TRecord[]> {
    for (let skip = 0; ; skip += CLOSE_PAGE_SIZE) {
      const page = await this.get<CloseListResponse<TRecord>>(path, {
        ...params,
        _skip: skip,
        _limit: CLOSE_PAGE_SIZE,
      });

      if (page.data.length > 0) {
        yield page.data;
      }

      if (!page.has_more) {
        return;
      }
    }
  }
}
