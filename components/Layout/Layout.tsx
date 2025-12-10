import React from 'react';
import Head from 'next/head';

interface LayoutProps {
  title?: string;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  title = 'StorySmith',
  children,
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="description"
          content="Create a storybook together in one sitting with StorySmith."
        />
      </Head>
      <div className="min-h-screen bg-orange-50 text-stone-900">
        <main className="min-h-screen flex flex-col">
          {children}
        </main>
      </div>
    </>
  );
};
