import { Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

const sectionTitleClass = "bg-red-600 px-3 py-2 text-sm font-semibold uppercase tracking-wide text-white";
const rowClass = "grid grid-cols-1 gap-2 border-b border-border p-3 text-sm md:grid-cols-2";

const SiteMasterPlan = () => {
  const navigate = useNavigate();

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce" || item === "otnoai") {
      navigate("/", { state: { activeItem: item }, replace: true });
      return;
    }
    if (item === "sites") {
      navigate("/sites");
      return;
    }
    if (item === "previous-clients") {
      navigate("/previous-clients");
      return;
    }
    if (item === "accounting") {
      navigate("/accounting");
      return;
    }
    if (item === "site-master-plan") {
      navigate("/site-master-plan");
      return;
    }
    if (item === "settings") {
      navigate("/settings");
      return;
    }
    if (item === "maintenance") {
      navigate("/maintenance-logs");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="site-master-plan" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Site Master Plan"
          subtitle="Capture site setup details and print the completed form."
        />

        <div className="mx-auto w-full max-w-6xl px-6 py-8 print:px-0 print:py-0">
          <div className="mb-4 flex justify-end print:hidden">
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Site Master Plan
            </Button>
          </div>

          <section className="overflow-hidden rounded-xl border border-border bg-card print:rounded-none print:border-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <h2 className="text-3xl font-bold">Site Master</h2>
              <img src="/otn-logo.png" alt="OTN logo" className="h-14 w-auto" />
            </div>

            <h3 className={sectionTitleClass}>Customer Information</h3>
            <p className="border-b border-border p-3 text-sm">
              Thank you for choosing OTNO Access as your supplier of formwork / supportwork / scaffolding for your project. In order for us to correctly transact with your site, please provide the details below.
            </p>

            <h3 className={sectionTitleClass}>Invoicing</h3>
            <div className={rowClass}><span>Company name to appear on Invoice:</span><span>Office Tel:</span></div>
            <div className={rowClass}><span>Site Manager&apos;s contact details:</span><span>Office Email:</span></div>
            <div className={rowClass}><span>Name / Cell / Email:</span><span /></div>

            <h3 className={sectionTitleClass}>Ordering</h3>
            <div className={rowClass}><span>Customer Order Number:</span><span>Telephonic orders: Yes ☐ No ☐</span></div>
            <div className={rowClass}><span>Official orders used? Yes ☐ No ☐</span><span>Persons name as order: Yes ☐ No ☐</span></div>
            <div className={rowClass}><span>Bulk orders used? Yes ☐ No ☐</span><span>Persons name:</span></div>
            <div className={rowClass}><span>New order for every quote? Yes ☐ No ☐</span><span>Requisition number used: Yes ☐ No ☐</span></div>

            <h3 className={sectionTitleClass}>Transport</h3>
            <div className={rowClass}><span>Fixed Rate Agreed:</span><span>Returns:</span></div>
            <div className={rowClass}><span>Deliveries:</span><span /></div>
            <div className={rowClass}><span>Special Transport Arrangement:</span><span /></div>

            <h3 className={sectionTitleClass}>Discounts</h3>
            <div className="grid grid-cols-4 border-b border-border p-3 text-sm font-semibold">
              <span>Type / Product</span>
              <span>Hire Discount</span>
              <span>Sales Discount</span>
              <span>Rate</span>
            </div>
            <div className="grid grid-cols-4 border-b border-border p-3 text-sm">
              <span>Nett</span>
              <span />
              <span />
              <span />
            </div>

            <h3 className={sectionTitleClass}>Project Type / Market Segmentation</h3>
            <div className="grid grid-cols-2 gap-4 border-b border-border p-3 text-sm md:grid-cols-4">
              <span>☐ Building</span>
              <span>☐ Civils</span>
              <span>☐ Scaffolding</span>
              <span>☐ Building Industry</span>
              <span>☐ Education</span>
              <span>☐ Residential</span>
              <span>☐ Infrastructure</span>
              <span>☐ Civils Industry</span>
              <span>☐ Healthcare</span>
              <span>☐ Shopping Centres</span>
              <span>☐ Mines</span>
              <span>☐ Industrial Industry</span>
            </div>

            <h3 className={sectionTitleClass}>Internal Information</h3>
            <div className={rowClass}><span>Customer Account No.:</span><span /></div>
            <div className={rowClass}><span>Account Type: ☐ 30 Day Account ☐ Deposit Account</span><span /></div>
            <div className={rowClass}><span>Money paid: Deposit</span><span>Payment: ☐ EFT ☐ Cheque</span></div>
            <div className={rowClass}><span>Customer current:</span><span>M-Pesa:</span></div>
            <div className={rowClass}><span>OTNO Salesman:</span><span>Site Name:</span></div>
            <div className={rowClass}><span>Date:</span><span>Site Address:</span></div>
            <div className={rowClass}><span>Site opened by:</span><span>Site Number:</span></div>
            <div className="grid grid-cols-1 border-b border-border p-3 text-sm md:grid-cols-3">
              <span>Sales Rep</span>
              <span>Branch Co-ordinator</span>
              <span>Branch Manager</span>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default SiteMasterPlan;
