import React from "react";
import Head from "next/head";
import { Header } from "./Header";
import { Footer } from "./Footer";

export type LayoutProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
};

export function Layout({ title, description, children }: LayoutProps) {
  const baseTitle = "StorySmith";
  const pageTitle = title
    ? title.toLowerCase().includes("storysmith")
      ? title
      : `${title} | ${baseTitle}`
    : baseTitle;

  return (
    <div className="ss-page">
      <Head>
        <title>{pageTitle}</title>
        {description ? <meta name="description" content={description} /> : null}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <Header />

      <main>
        <div className="ss-container" style={{ paddingTop: 10 }}>
          {children}
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Layout;
