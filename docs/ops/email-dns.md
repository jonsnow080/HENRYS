# Email DNS templates

Use these templates when configuring `henrys.club` for outbound mail via Resend and any fallback SMTP relay. Replace placeholder values before publishing.

## SPF

| Type | Name/Host | Value |
| ---- | --------- | ----- |
| TXT  | `@`       | `v=spf1 include:spf.resend.com include:spf.smtp-placeholder.example ~all` |

- Replace `spf.smtp-placeholder.example` with the SPF include string for the secondary SMTP provider (remove the include if unused).
- Use `-all` instead of `~all` once DNS is validated in production.

## DKIM

Create one record per sending service. The example selectors mirror Resend defaults; replace the placeholders with the values provided by your provider dashboards.

| Type | Name/Host | Value |
| ---- | --------- | ----- |
| CNAME | `resend1._domainkey` | `resend1.dkim.resend.com` |
| CNAME | `resend2._domainkey` | `resend2.dkim.resend.com` |
| CNAME | `<smtp-selector>._domainkey` | `<smtp-selector>._domainkey.smtp-placeholder.example` |

- If your SMTP relay provides a TXT DKIM record instead of CNAME, create a TXT record with the supplied value instead of the placeholder above.

## DMARC

| Type | Name/Host | Value |
| ---- | --------- | ----- |
| TXT  | `_dmarc`  | `v=DMARC1; p=quarantine; pct=100; rua=mailto:<dmarc-aggregate@henrys.club>; ruf=mailto:<dmarc-forensics@henrys.club>; fo=1; aspf=s; adkim=s` |

- Switch the policy (`p=`) to `reject` after monitoring aggregate reports for deliverability issues.
- Replace the placeholder reporting addresses with active mailboxes or aliases managed by the operations team.
- Keep `aspf` and `adkim` in strict mode (`s`) so only signatures from `henrys.club` are accepted.
