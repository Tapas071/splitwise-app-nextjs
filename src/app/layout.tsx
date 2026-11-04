import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { ThemeProvider } from "@/components/theme-provider";
import { SiteHeader } from "@/components/SiteHeader";
import { getDb, toObjectId } from "../../lib/mongodb";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Splitbill APP",
  description: "Manage and split expenses with ease",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const token = (await cookies()).get("token")?.value;
  let isAuthenticated = false;
  let firstName = "";

  if (token) {
    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key");
      const { payload } = await jwtVerify(token, secret);
      isAuthenticated = true;
      const userId = typeof payload.userId === "string" ? payload.userId : "";
      const objectId = toObjectId(userId);
      if (objectId) {
        try {
          const db = await getDb();
          const user = await db.collection("users").findOne({ _id: objectId }, { projection: { name: 1 } });
          firstName = typeof user?.name === "string" ? user.name.trim().split(/\s+/)[0] || "" : "";
        } catch (error) {
          console.error("Unable to load profile name for header:", error);
        }
      }
    } catch {
      isAuthenticated = false;
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <SiteHeader isAuthenticated={isAuthenticated} firstName={firstName} />
          <main className="min-h-[calc(100vh-4.5rem)]">{children}</main>
        </ThemeProvider>
      </body>
    </html>
  );
}
