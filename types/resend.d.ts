declare module 'resend' {
  export interface EmailAddress {
    email: string;
    name?: string;
  }

  export interface Attachment {
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }

  export interface SendEmailOptions {
    from: string;
    to: string | string[] | EmailAddress[];
    subject: string;
    html?: string;
    text?: string;
    attachments?: Attachment[];
    reply_to?: string | EmailAddress;
    cc?: string | string[] | EmailAddress[];
    bcc?: string | string[] | EmailAddress[];
  }

  export interface SendEmailResponse {
    id: string;
    from: string;
    to: string[];
    created_at: string;
  }

  export interface ResendError {
    name: string;
    message: string;
    stack?: string;
  }

  export class Resend {
    constructor(apiKey: string);

    emails: {
      send(options: SendEmailOptions): Promise<{
        data: SendEmailResponse | null;
        error: ResendError | null;
      }>;
    };
  }

  export default Resend;
}
