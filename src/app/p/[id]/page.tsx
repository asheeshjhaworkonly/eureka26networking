import ProfilePage from "@/components/profile-page";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ProfilePage id={(await params).id} />;
}
