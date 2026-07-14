import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import { headers } from "next/headers";
import Script from "next/script";
import "./globals.css";

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

const themeInitializationScript = `try{const theme=localStorage.getItem("lab-ui-theme");const resolved=theme==="dark"?"dark":"light";document.documentElement.dataset.theme=resolved;document.documentElement.style.colorScheme=resolved}catch{document.documentElement.dataset.theme="light";document.documentElement.style.colorScheme="light"}`;

export const metadata: Metadata = {
  title: "APIセキュリティ学習・検証プラットフォーム",
  description:
    "脆弱なAPI例と安全なAPI例をローカル環境で比較する学習・検証プラットフォームです。",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const nonce = (await headers()).get("x-nonce") ?? undefined;

  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initialization"
          nonce={nonce}
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitializationScript }}
        />
      </head>
      <body className={`${notoSansJp.variable} ${jetBrainsMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
