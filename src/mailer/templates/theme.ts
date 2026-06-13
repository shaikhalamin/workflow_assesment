export const palette = {
  bg: '#f5f7fb',
  card: '#ffffff',
  border: '#d9e2ef',
  ink: '#172033',
  body: '#4f5f75',
  muted: '#7a8798',
  accent: '#1d6fd8',
} as const;

export const fonts = {
  sans: "-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif",
} as const;

export const headStyles = `
body,table,td,a{ -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; }
table,td{ mso-table-lspace:0pt; mso-table-rspace:0pt; }
table{ border-collapse:collapse !important; }
body{ margin:0 !important; padding:0 !important; width:100% !important; }
a{ color:${palette.accent}; }
@media screen and (max-width:620px){
  .container{ width:100% !important; }
  .px{ padding-left:24px !important; padding-right:24px !important; }
  .h1{ font-size:25px !important; line-height:1.2 !important; }
  .btn a{ display:block !important; }
}
`;
