import type { AppProps } from 'next/app';
import { StoryProvider } from '../lib/state/StoryContext';
import '../styles/globals.css';

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <StoryProvider>
      <Component {...pageProps} />
    </StoryProvider>
  );
}
