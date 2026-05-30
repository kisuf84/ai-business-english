import "./globals.css";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata = {
  title: "AI Business English Training Platform",
  description: "MVP scaffold",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-theme="dark" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500;9..144,600;9..144,700;9..144,800&family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('theme') || localStorage.getItem('kl-theme');
                  var next = saved === 'light' ? 'light' : 'dark';
                  document.documentElement.setAttribute('data-theme', next);
                  document.documentElement.classList.toggle('dark', next === 'dark');
                  document.documentElement.classList.toggle('light', next === 'light');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen lumen-shell-bg text-[var(--ink)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
