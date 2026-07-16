import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import { headers } from "next/headers";

const notoSansJp = Noto_Sans_JP({
  variable: "--font-sans-jp",
  subsets: ["latin"],
  display: "swap",
});
const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

const themeInitializationScript = `try{const theme=localStorage.getItem("lab-ui-theme");document.documentElement.dataset.theme=theme==="dark"?"dark":"light"}catch{document.documentElement.dataset.theme="light"}`;
const publicUrl = "https://showcase.api-security-lab-platform.workers.dev/";

export const metadata: Metadata = {
  metadataBase: new URL(publicUrl),
  title: "APIセキュリティ学習・検証プラットフォーム",
  description:
    "脆弱なAPI例と安全なAPI例をローカル環境で比較する学習・検証プラットフォームです。",
  alternates: { canonical: publicUrl },
  openGraph: {
    type: "website",
    url: publicUrl,
    locale: "ja_JP",
    siteName: "APIセキュリティ学習・検証プラットフォーム",
    title: "APIセキュリティ学習・検証プラットフォーム",
    description:
      "脆弱なAPI例と安全なAPI例をローカル環境で比較する学習・検証プラットフォームです。",
  },
  twitter: {
    card: "summary",
    title: "APIセキュリティ学習・検証プラットフォーム",
    description:
      "脆弱なAPI例と安全なAPI例をローカル環境で比較する学習・検証プラットフォームです。",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <head>
        <script
          id="theme-initialization"
          nonce={nonce}
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body className={`${notoSansJp.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
