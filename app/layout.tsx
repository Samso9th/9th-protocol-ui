import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider, themeScript } from "@/components/theme";

export const metadata: Metadata = {
  title: "9th Protocol",
  description: "Agentic coding with the model of your choice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
