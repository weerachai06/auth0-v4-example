export default async function ProfilePage() {
  const returnTo = `http://localhost:3000/api/auth/logout`;
  const url = new URL(returnTo, process.env.NEXT_PUBLIC_BASE_URL);

  url.searchParams.set('returnTo', 'http://localhost:3000/api/auth/clear-session');
  const redirectTo = url.toString();

  return (
    <div className="container mx-auto py-8 px-4">
      <a href={redirectTo}>Logout</a>
      {/* <ClientComponent accessTokenPromise={accessToken} /> */}
    </div>
  );
}
