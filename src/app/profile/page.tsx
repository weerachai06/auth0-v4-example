import { auth0 } from '@/lib/auth0';
import ClientComponent from './client';

export default async function ProfilePage() {
  const token = await auth0.getAccessToken();
  return (
    <div className="container mx-auto py-8 px-4">
      <span className="wrap-anywhere">Token from server: {token.token}</span>
      <ClientComponent />
    </div>
  );
}
