import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import { MuiShell } from "@/components/mui/MuiShell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <MuiShell>
      <Nav />
      <main id="top">{children}</main>
      <Footer />
    </MuiShell>
  );
}
