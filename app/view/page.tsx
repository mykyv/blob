import { ViewClient } from './ViewClient';

export const metadata = {
  title: 'GlassBlob',
  robots: { index: false, follow: false },
};

export default function ViewPage() {
  return <ViewClient />;
}
