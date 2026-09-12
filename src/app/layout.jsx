import './globals.css';
import { ToastProvider } from '../components/ui/Toast';
import { ClerkProvider } from '@clerk/nextjs';
import { UserSync } from '../components/auth/UserSync';

export const metadata = {
  title: 'AEGIS AI - Advanced Fake & Fraud Email Detection Platform',
  description: 'Awwwards-winning enterprise AI platform for detecting phishing, spoofing, BEC wire fraud, and malicious attachments.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-darkBg text-textPrimary antialiased selection:bg-primaryBlue/30 selection:text-white">
        <ClerkProvider>
          <UserSync />
          <ToastProvider>
            {children}
          </ToastProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
