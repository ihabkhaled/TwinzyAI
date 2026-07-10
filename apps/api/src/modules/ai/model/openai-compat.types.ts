/**
 * Minimal chat-completions wire shapes used by the shared OpenAI-compatible
 * adapter (OpenAI, DeepSeek, Qwen, Kimi, GLM). Only the fields the adapter
 * actually reads/writes — everything else a provider returns is ignored.
 */

interface OpenAiCompatMessage {
  readonly role: 'user';
  readonly content: string;
}

export interface OpenAiCompatRequestBody {
  readonly model: string;
  readonly messages: readonly OpenAiCompatMessage[];
  readonly temperature: number;
  readonly response_format: { readonly type: 'json_object' };
}

/** The single field the adapter reads from a chat-completions response. */
export interface OpenAiCompatResponseBody {
  readonly choices?: readonly {
    readonly message?: { readonly content?: string | null };
  }[];
}
