import type { Metadata } from "next";
import { JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
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

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" data-theme="light" suppressHydrationWarning>
      <head>
        <Script
          id="theme-initialization"
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
