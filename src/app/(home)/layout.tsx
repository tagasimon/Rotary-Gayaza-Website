import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { getHomeClub } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function HomeLayout({ children }: { children: React.ReactNode }) {
  const club = await getHomeClub();
  return (
    <>
      <Header logoUrl={club.logoUrl} />
      <main id="main">{children}</main>
      <Footer club={club} />
    </>
  );
}
