import { Printer } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";

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
    if (item === "sites") { navigate("/sites"); return; }
    if (item === "previous-clients") { navigate("/previous-clients"); return; }
    if (item === "accounting") { navigate("/accounting"); return; }
    if (item === "site-master-plan") { navigate("/site-master-plan"); return; }
    if (item === "settings") { navigate("/settings"); return; }
    if (item === "maintenance") { navigate("/maintenance-logs"); }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="site-master-plan" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Site Master Plan"
          subtitle="Capture site setup details and print the completed form."
        />

        <div className="mx-auto w-full max-w-5xl px-6 py-8 print:px-0 print:py-0">
          <div className="mb-4 flex justify-end print:hidden">
            <Button onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print Site Master Plan
            </Button>
          </div>

          {/* Print-only styles */}
          <style>{`
            @media print {
              body * { visibility: hidden; }
              .site-master-print, .site-master-print * { visibility: visible; }
              .site-master-print {
                position: absolute;
                left: 0; top: 0;
                width: 100%;
                margin: 0; padding: 8px;
              }
              @page { size: A4 portrait; margin: 6mm; }
            }
            .site-master-print {
              font-family: Arial, Helvetica, sans-serif;
              font-size: 10px;
              color: #111;
              line-height: 1.3;
            }
            .site-master-print table {
              width: 100%;
              border-collapse: collapse;
            }
            .site-master-print td, .site-master-print th {
              border: 1px solid #999;
              padding: 3px 6px;
              vertical-align: top;
            }
            .site-master-print .sec-header {
              background: #cc0000;
              color: #fff;
              font-weight: bold;
              font-size: 10px;
              padding: 3px 6px;
              text-align: left;
            }
            .site-master-print .sec-header td {
              border-color: #cc0000;
              padding: 3px 6px;
            }
            .site-master-print .top-header {
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 10px 12px;
              border: 1px solid #999;
              border-bottom: none;
            }
            .site-master-print .top-header h1 {
              font-size: 22px;
              font-weight: bold;
              margin: 0;
            }
            .site-master-print .top-header img {
              height: 50px;
              width: auto;
            }
            .site-master-print .note-section {
              border: 1px solid #999;
              border-top: none;
              padding: 4px 6px;
              font-size: 9px;
            }
            .site-master-print .note-section ul {
              margin: 2px 0 0 14px;
              padding: 0;
            }
            .site-master-print .note-section li {
              margin-bottom: 1px;
            }
            .site-master-print .footer-row {
              display: flex;
              align-items: flex-end;
              border: 1px solid #999;
              border-top: none;
              padding: 6px 10px;
              gap: 10px;
            }
            .site-master-print .footer-row img {
              height: 36px;
              width: auto;
            }
            .site-master-print .sig-box {
              flex: 1;
              text-align: center;
              border-top: 1px dashed #999;
              padding-top: 3px;
              font-size: 9px;
            }
          `}</style>

          <div className="site-master-print">
            {/* Top Header */}
            <div className="top-header">
              <h1>Site Master</h1>
              <img src="/otn-logo-red.png" alt="O+N Logo" />
            </div>

            <table>
              {/* Customer Information */}
              <tbody>
                <tr className="sec-header"><td colSpan={4}>Customer Information</td></tr>
                <tr>
                  <td colSpan={4} style={{ fontSize: "9px" }}>
                    Thank you for choosing OTNO Access as your supplier of formwork / supportwork / scaffolding for your project. In order for us to correctly transact with your site, please assist us in supplying the correct details as set out in the sections below.
                  </td>
                </tr>

                {/* Invoicing */}
                <tr className="sec-header"><td colSpan={4}>Invoicing</td></tr>
                <tr>
                  <td colSpan={2}>Company name to appear on Invoice:</td>
                  <td colSpan={2}>Office Tel:</td>
                </tr>
                <tr>
                  <td colSpan={2}>Site Manager's contact details</td>
                  <td colSpan={2}>Office Email:</td>
                </tr>
                <tr><td colSpan={2}>Name:</td><td colSpan={2} rowSpan={3}></td></tr>
                <tr><td colSpan={2}>Cell:</td></tr>
                <tr><td colSpan={2}>Email:</td></tr>

                {/* Ordering */}
                <tr className="sec-header"><td colSpan={4}>Ordering</td></tr>
                <tr>
                  <td colSpan={2}>Customer Order Number:</td>
                  <td>Telephonic orders:</td>
                  <td style={{ textAlign: "right" }}>Yes ☐&nbsp; No ☐</td>
                </tr>
                <tr>
                  <td>Official orders used?:</td>
                  <td>Yes ☐&nbsp; No ☐</td>
                  <td>Persons name as order:</td>
                  <td style={{ textAlign: "right" }}>Yes ☐&nbsp; No ☐</td>
                </tr>
                <tr>
                  <td>Bulk orders used?:</td>
                  <td>Yes ☐&nbsp; No ☐</td>
                  <td colSpan={2}>Persons name:</td>
                </tr>
                <tr>
                  <td>New order for every quote:</td>
                  <td>Yes ☐&nbsp; No ☐</td>
                  <td>Requisition number used:</td>
                  <td style={{ textAlign: "right" }}>Yes ☐&nbsp; No ☐</td>
                </tr>
                <tr>
                  <td colSpan={2}></td>
                  <td colSpan={2}>Requisition number:</td>
                </tr>

                {/* Transport */}
                <tr className="sec-header"><td colSpan={4}>Transport</td></tr>
                <tr>
                  <td colSpan={2}>Fixed Rate Agreed:</td>
                  <td colSpan={2}>Returns:</td>
                </tr>
                <tr><td colSpan={4}>Deliveries:</td></tr>
                <tr>
                  <td colSpan={2}>Special Transport Arrangement</td>
                  <td colSpan={2}></td>
                </tr>

                {/* Discounts */}
                <tr className="sec-header"><td colSpan={4}>Discounts</td></tr>
              </tbody>
            </table>

            {/* Discounts table (separate for column control) */}
            <table>
              <thead>
                <tr>
                  <th style={{ width: "10%", textAlign: "left" }}>Type</th>
                  <th style={{ textAlign: "left" }}>Product</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Hire Discount</th>
                  <th style={{ width: "10%", textAlign: "center" }}>Sales Discount</th>
                  <th style={{ width: "8%", textAlign: "center" }}>Rate</th>
                </tr>
              </thead>
              <tbody>
                <tr><td>Nett</td><td></td><td></td><td></td><td></td></tr>
                <tr><td>Quote Number</td><td></td><td></td><td></td><td></td></tr>
              </tbody>
            </table>

            {/* Project Type / Market Segmentation */}
            <table>
              <tbody>
                <tr className="sec-header">
                  <td style={{ width: "15%" }}><strong>Project Type</strong></td>
                  <td colSpan={4}><strong>Market Segmentation</strong></td>
                </tr>
                <tr>
                  <td rowSpan={4}></td>
                  <td>☐ Building</td>
                  <td>☐ Civils</td>
                  <td>☐ Scaffolding</td>
                  <td>☐ Building Industry</td>
                </tr>
                <tr>
                  <td>☐ Education</td>
                  <td>☐ Residential</td>
                  <td>☐ Infrastructure</td>
                  <td>☐ Civils Industry</td>
                </tr>
                <tr>
                  <td>☐ Healthcare</td>
                  <td>☐ Shopping Centres</td>
                  <td>☐ Mines</td>
                  <td>☐ Industrial Industry</td>
                </tr>
                <tr>
                  <td>☐ Office Blocks</td>
                  <td>☐ Tourism / Hotels</td>
                  <td>☐ Petrochemical</td>
                  <td></td>
                </tr>
              </tbody>
            </table>

            {/* NOTE section */}
            <div className="note-section">
              <strong>NOTE</strong>
              <ul>
                <li>All OTNO Access equipment delivered to site conforms to international Standards Organization (ISO) - Quality Management System.</li>
                <li>Please do not accept any dirty or damaged equipment from our drivers.</li>
                <li>Please ensure that EVERY ITEM is checked, counted and signed for.</li>
                <li>It is your responsibility to load and off-load our trucks - please have labour and or a crane available.</li>
                <li>Please ensure that you are issued with a "Request for Collection" reference number when you instruct our offices to collect equipment.</li>
              </ul>
            </div>

            {/* Internal Information */}
            <table>
              <tbody>
                <tr className="sec-header"><td colSpan={4}>Internal Information</td></tr>
                <tr><td colSpan={4} style={{ fontStyle: "italic", fontSize: "9px" }}>OTNO Access Sales Representative to complete this section</td></tr>
                <tr><td colSpan={2}>Customer Account No.:</td><td colSpan={2}></td></tr>
                <tr><td colSpan={4}>Account Type: &nbsp;☐ 30 Day Account &nbsp;☐ Deposit Account</td></tr>
                <tr>
                  <td colSpan={2}>Money paid: Deposit &nbsp;&nbsp; R</td>
                  <td colSpan={2}>Payment: &nbsp;☐ EFT &nbsp;☐ Cheque</td>
                </tr>
                <tr>
                  <td colSpan={2}>Customer current:</td>
                  <td colSpan={2}>Mpesa: ☐</td>
                </tr>
                <tr>
                  <td colSpan={2}>OTNO Salesman:</td>
                  <td colSpan={2}>Site Name:</td>
                </tr>
                <tr>
                  <td colSpan={2}>Date:</td>
                  <td colSpan={2}>Site Address:</td>
                </tr>
                <tr><td colSpan={4} style={{ fontStyle: "italic", fontSize: "9px" }}>OTNO Access Administrator to complete this section</td></tr>
                <tr>
                  <td colSpan={2}>Site opened by:</td>
                  <td colSpan={2}>Site Number:</td>
                </tr>
                <tr>
                  <td colSpan={2}>Date:</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>

            {/* Footer with logo and signature lines */}
            <div className="footer-row">
              <img src="/otn-logo-red.png" alt="O+N Logo" />
              <div className="sig-box">Sales Rep</div>
              <div className="sig-box">Branch Co-ordinator</div>
              <div className="sig-box">Branch Manager</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SiteMasterPlan;
