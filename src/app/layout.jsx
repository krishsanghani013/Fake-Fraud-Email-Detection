import './globals.css';
import { ToastProvider } from '../components/ui/Toast';
import { ClerkProvider } from '@clerk/nextjs';
import { UserSync } from '../components/auth/UserSync';
import { ThemeProvider } from '../context/ThemeContext';
import { NavigationProgress } from '../components/ui/NavigationProgress';
import { RoutePrewarmer } from '../components/layout/RoutePrewarmer';

export const metadata = {
  title: 'AEGIS AI - Advanced Fake & Fraud Email Detection Platform',
  description: 'Enterprise AI platform for detecting phishing, spoofing, BEC wire fraud, and email forensics.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('aegis_theme');
                  var supportDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (theme === 'dark' || (!theme && supportDark) || (theme === 'system' && supportDark)) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.style.colorScheme = 'dark';
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.style.colorScheme = 'light';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-softWhite dark:bg-deepSlate text-deepSlate dark:text-softWhite antialiased selection:bg-accentBlue/20 selection:text-accentBlue transition-colors duration-200">
        <NavigationProgress />
        <RoutePrewarmer />
        <ClerkProvider>
          <UserSync />
          <ThemeProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
