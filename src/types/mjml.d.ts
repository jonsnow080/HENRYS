declare module "mjml" {
  interface MJMLParseResults {
    html: string;
    errors: Array<{ message: string }>;
  }

  interface MJMLParseOptions {
    beautify?: boolean;
    validationLevel?: "strict" | "soft" | "skip";
    minify?: boolean;
  }

  export default function mjml2html(template: string, options?: MJMLParseOptions): MJMLParseResults;
}
