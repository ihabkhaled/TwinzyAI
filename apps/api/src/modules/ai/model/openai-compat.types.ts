/**
 * Minimal chat-completions wire shapes used by the shared OpenAI-compatible
 * adapter (OpenAI, DeepSeek, Qwen, Kimi, GLM). Only the fields the adapter
 * actually reads/writes — everything else a provider returns is ignored.
 */

/** A text part or an image part of a user message's content array. */
export type OpenAiCompatContentPart =
  | { readonly type: 'text'; readonly text: string }
  | { readonly type: 'image_url'; readonly image_url: { readonly url: string } };

export interface OpenAiCompatMessage {
  readonly role: 'user';
  readonly content: string | readonly OpenAiCompatContentPart[];
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
