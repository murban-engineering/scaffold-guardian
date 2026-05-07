import React, { useEffect, useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { formatReportDate, formatReportDateTime } from "@/lib/accountingDates";
import HireQuotationWorkflow from "@/components/dashboard/HireQuotationWorkflow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHireQuotations, HireQuotation } from "@/hooks/useHireQuotations";
import { useAllClientSites } from "@/hooks/useClientSites";
import { useScaffolds } from "@/hooks/useScaffolds";

const Sites = () => {
  const navigate = useNavigate();
  const { data: hireQuotations = [], isLoading } = useHireQuotations();
  const { data: allClientSites = [] } = useAllClientSites();
  const { data: scaffolds = [] } = useScaffolds();
  const [selectedQuotation, setSelectedQuotation] = useState<HireQuotation | null>(null);
  const [selectedClient, setSelectedClient] = useState<string>("");
  // Keep selectedQuotation live-synced with realtime DB updates
  const liveSelectedQuotation = selectedQuotation
    ? (hireQuotations.find(q => q.id === selectedQuotation.id) ?? selectedQuotation)
    : null;

  const activeQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      return status === "active" || status === "pending";
    });
  }, [hireQuotations]);

  // Helper: sum delivered quantities across all delivery_history batches
  const getDeliveredItemsFromHistory = (quotation: HireQuotation): Array<{ description: string; quantity: number }> => {
    const history = quotation.delivery_history;
    const batches: Array<{ items: Array<{ description?: string; itemCode?: string; quantityDelivered?: number }> }> = 
      Array.isArray(history) ? history : [];
    const totals: Record<string, number> = {};
    for (const batch of batches) {
      for (const item of batch.items ?? []) {
        const desc = item.description || item.itemCode || "Unknown item";
        totals[desc] = (totals[desc] ?? 0) + (item.quantityDelivered ?? 0);
      }
    }
    // Fallback to line_items.delivered_quantity if no delivery_history
    if (Object.keys(totals).length === 0) {
      for (const li of quotation.line_items ?? []) {
        if ((li.delivered_quantity ?? 0) > 0) {
          const desc = li.description || li.part_number || "Unknown item";
          totals[desc] = (totals[desc] ?? 0) + (li.delivered_quantity ?? 0);
        }
      }
    }
    return Object.entries(totals).map(([description, quantity]) => ({ description, quantity }));
  };

  const removalReportQuotations = useMemo(() => {
    return hireQuotations.filter((quotation) => {
      const status = quotation.status?.toLowerCase?.() ?? "";
      const isEligibleStatus = status === "dispatched" || status === "completed";
      const hasDelivered = getDeliveredItemsFromHistory(quotation).length > 0;
      return isEligibleStatus && hasDelivered;
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hireQuotations]);

  const inventoryBySiteRows = useMemo(() => {
    const rows: Array<{
      client: string;
      clientId: string;
      quotationNumber: string;
      siteNumber: string;
      siteName: string;
      siteAddress: string;
      siteContact: string;
      sitePhone: string;
      itemDescription: string;
      quantity: number;
    }> = [];

    removalReportQuotations.forEach((quotation) => {
      const client = quotation.company_name || quotation.site_manager_name || "Unknown client";
      const clientId = quotation.client_id || "";
      const deliveryHistory = Array.isArray(quotation.delivery_history) ? quotation.delivery_history : [];
      const sitesForQuotation = allClientSites.filter((site) => site.quotation_id === quotation.id);
      const siteMap = new Map(sitesForQuotation.map((site) => [site.site_number, site]));

      if (deliveryHistory.length > 0) {
        deliveryHistory.forEach((batch) => {
          const batchSiteNumber =
            (typeof batch === "object" && batch && "siteNumber" in batch ? String(batch.siteNumber ?? "") : "") ||
            "";
          const matchedSite = batchSiteNumber ? siteMap.get(batchSiteNumber) : undefined;
          const siteNumber = batchSiteNumber || matchedSite?.site_number || "";
          const siteName = matchedSite?.site_name || quotation.site_name || "";
          const siteAddress = matchedSite?.site_address || matchedSite?.site_location || quotation.site_address || quotation.delivery_address || "";
          const siteContact = matchedSite?.site_manager_name || quotation.site_manager_name || "";
          const sitePhone = matchedSite?.site_manager_phone || quotation.site_manager_phone || "";
          const batchItems =
            typeof batch === "object" && batch && "items" in batch && Array.isArray(batch.items) ? batch.items : [];

          batchItems.forEach((item) => {
            const itemDescription =
              (typeof item === "object" && item && "description" in item ? String(item.description ?? "") : "") ||
              (typeof item === "object" && item && "itemCode" in item ? String(item.itemCode ?? "") : "") ||
              "Unknown item";
            const quantity = Number(
              typeof item === "object" && item && "quantityDelivered" in item ? item.quantityDelivered : 0
            );
            if (quantity <= 0) return;
            rows.push({
              client,
              clientId,
              quotationNumber: quotation.quotation_number || "",
              siteNumber,
              siteName,
              siteAddress,
              siteContact,
              sitePhone,
              itemDescription,
              quantity,
            });
          });
        });
      } else {
        const fallbackSite = sitesForQuotation[0];
        const siteNumber = fallbackSite?.site_number || "";
        const siteName = fallbackSite?.site_name || quotation.site_name || "";
        const siteAddress = fallbackSite?.site_address || fallbackSite?.site_location || quotation.site_address || quotation.delivery_address || "";
        const siteContact = fallbackSite?.site_manager_name || quotation.site_manager_name || "";
        const sitePhone = fallbackSite?.site_manager_phone || quotation.site_manager_phone || "";

        (quotation.line_items ?? []).forEach((item) => {
          const quantity = item.delivered_quantity ?? 0;
          if (quantity <= 0) return;
          rows.push({
            client,
            clientId,
            quotationNumber: quotation.quotation_number || "",
            siteNumber,
            siteName,
            siteAddress,
            siteContact,
            sitePhone,
            itemDescription: item.description || item.part_number || "Unknown item",
            quantity,
          });
        });
      }
    });

    return rows;
  }, [allClientSites, removalReportQuotations]);

  const summarizedInventoryBySiteRows = useMemo(() => {
    const groupedRows = inventoryBySiteRows.reduce<Record<string, {
      client: string;
      clientId: string;
      quotationNumber: string;
      siteNumber: string;
      siteName: string;
      siteAddress: string;
      siteContact: string;
      sitePhone: string;
      itemDescription: string;
      quantity: number;
    }>>((acc, row) => {
      const key = [
        row.client,
        row.clientId,
        row.quotationNumber,
        row.siteNumber,
        row.siteName,
        row.siteAddress,
        row.siteContact,
        row.sitePhone,
        row.itemDescription,
      ].join("::");

      if (!acc[key]) {
        acc[key] = { ...row };
      } else {
        acc[key].quantity += row.quantity;
      }
      return acc;
    }, {});

    return Object.values(groupedRows).sort((a, b) => {
      const clientCompare = a.client.localeCompare(b.client);
      if (clientCompare !== 0) return clientCompare;
      const siteCompare = (a.siteNumber || a.siteName).localeCompare(b.siteNumber || b.siteName);
      if (siteCompare !== 0) return siteCompare;
      return a.itemDescription.localeCompare(b.itemDescription);
    });
  }, [inventoryBySiteRows]);

  const inventoryByClientSections = useMemo(() => {
    const groupedByClient = summarizedInventoryBySiteRows.reduce<
      Record<string, {
        client: string;
        clientId: string;
        sites: Record<string, {
          quotationNumber: string;
          siteNumber: string;
          siteName: string;
          siteAddress: string;
          siteContact: string;
          sitePhone: string;
          items: Array<{ itemDescription: string; quantity: number }>;
        }>;
      }>
    >((acc, row) => {
      const clientKey = `${row.client}::${row.clientId}`;
      const siteKey = [
        row.quotationNumber,
        row.siteNumber,
        row.siteName,
        row.siteAddress,
        row.siteContact,
        row.sitePhone,
      ].join("::");

      if (!acc[clientKey]) {
        acc[clientKey] = {
          client: row.client,
          clientId: row.clientId,
          sites: {},
        };
      }

      if (!acc[clientKey].sites[siteKey]) {
        acc[clientKey].sites[siteKey] = {
          quotationNumber: row.quotationNumber,
          siteNumber: row.siteNumber,
          siteName: row.siteName,
          siteAddress: row.siteAddress,
          siteContact: row.siteContact,
          sitePhone: row.sitePhone,
          items: [],
        };
      }

      acc[clientKey].sites[siteKey].items.push({
        itemDescription: row.itemDescription,
        quantity: row.quantity,
      });

      return acc;
    }, {});

    return Object.values(groupedByClient)
      .sort((a, b) => a.client.localeCompare(b.client))
      .map((clientSection) => ({
        ...clientSection,
        sites: Object.values(clientSection.sites)
          .map((site) => ({
            ...site,
            items: [...site.items].sort((a, b) => a.itemDescription.localeCompare(b.itemDescription)),
          }))
          .sort((a, b) => (a.siteNumber || a.siteName).localeCompare(b.siteNumber || b.siteName)),
      }));
  }, [summarizedInventoryBySiteRows]);

  // ── Matrix view: rows = items, columns = client → site, values = On Hire (delivered - returned per site)
  const inventoryMatrix = useMemo(() => {
    // Build site columns grouped by client, only for sites with movement
    type SiteCol = { client: string; clientId: string; quotationNumber: string; siteNumber: string; siteName: string };
    const siteColMap = new Map<string, SiteCol>();
    inventoryByClientSections.forEach((cs) => {
      cs.sites.forEach((s) => {
        const key = `${cs.client}::${cs.clientId}::${s.quotationNumber}::${s.siteNumber}::${s.siteName}`;
        if (!siteColMap.has(key)) {
          siteColMap.set(key, {
            client: cs.client,
            clientId: cs.clientId,
            quotationNumber: s.quotationNumber,
            siteNumber: s.siteNumber,
            siteName: s.siteName,
          });
        }
      });
    });
    const siteCols = Array.from(siteColMap.entries())
      .map(([key, v]) => ({ key, ...v }))
      .sort((a, b) => {
        const c = a.client.localeCompare(b.client);
        if (c !== 0) return c;
        return (a.siteNumber || a.siteName).localeCompare(b.siteNumber || b.siteName);
      });

    // Aggregate per-site delivered & returned by item description
    const deliveredByKey: Record<string, Record<string, number>> = {};
    const returnedByKey: Record<string, Record<string, number>> = {};

    removalReportQuotations.forEach((quotation) => {
      const client = quotation.company_name || quotation.site_manager_name || "Unknown client";
      const clientId = quotation.client_id || "";
      const sitesForQuotation = allClientSites.filter((s) => s.quotation_id === quotation.id);
      const siteMap = new Map(sitesForQuotation.map((s) => [s.site_number, s]));

      const colKeyFor = (siteNumber: string) => {
        const matched = siteNumber ? siteMap.get(siteNumber) : undefined;
        const sName = matched?.site_name || quotation.site_name || "";
        return `${client}::${clientId}::${quotation.quotation_number || ""}::${siteNumber}::${sName}`;
      };

      const deliveryHistory = Array.isArray(quotation.delivery_history) ? quotation.delivery_history : [];
      deliveryHistory.forEach((batch) => {
        const siteNumber =
          (typeof batch === "object" && batch && "siteNumber" in batch ? String((batch as { siteNumber?: string }).siteNumber ?? "") : "") || "";
        const items =
          typeof batch === "object" && batch && "items" in batch && Array.isArray((batch as { items?: unknown[] }).items)
            ? ((batch as { items: Array<{ description?: string; itemCode?: string; quantityDelivered?: number }> }).items)
            : [];
        const ck = colKeyFor(siteNumber);
        items.forEach((it) => {
          const desc = it.description || it.itemCode || "Unknown item";
          const q = Number(it.quantityDelivered ?? 0);
          if (q <= 0) return;
          deliveredByKey[ck] = deliveredByKey[ck] || {};
          deliveredByKey[ck][desc] = (deliveredByKey[ck][desc] ?? 0) + q;
        });
      });

      const returnHistory = Array.isArray(quotation.return_history) ? quotation.return_history : [];
      (returnHistory as Array<{ siteNumber?: string; items?: Array<{ description?: string; itemCode?: string; totalReturned?: number }> }>).forEach((batch) => {
        const siteNumber = String(batch?.siteNumber ?? "") || "";
        const ck = colKeyFor(siteNumber);
        (batch?.items ?? []).forEach((it) => {
          const desc = it.description || it.itemCode || "Unknown item";
          const q = Number(it.totalReturned ?? 0);
          if (q <= 0) return;
          returnedByKey[ck] = returnedByKey[ck] || {};
          returnedByKey[ck][desc] = (returnedByKey[ck][desc] ?? 0) + q;
        });
      });
    });

    // Collect all item descriptions that appear anywhere
    const itemSet = new Set<string>();
    Object.values(deliveredByKey).forEach((m) => Object.keys(m).forEach((d) => itemSet.add(d)));
    Object.values(returnedByKey).forEach((m) => Object.keys(m).forEach((d) => itemSet.add(d)));

    // Map description → qty_at_start from scaffolds (best-effort match by description, then part_number)
    const qtyAtStartFor = (desc: string): number | null => {
      const lower = desc.toLowerCase().trim();
      const found = scaffolds.find(
        (s) =>
          (s.description ?? "").toLowerCase().trim() === lower ||
          (s.part_number ?? "").toLowerCase().trim() === lower
      );
      return found?.qty_at_start ?? null;
    };

    const rows = Array.from(itemSet)
      .sort((a, b) => a.localeCompare(b))
      .map((desc) => {
        const perSite = siteCols.map((col) => {
          const delivered = deliveredByKey[col.key]?.[desc] ?? 0;
          const returned = returnedByKey[col.key]?.[desc] ?? 0;
          return Math.max(delivered - returned, 0);
        });
        const onHireTotal = perSite.reduce((a, b) => a + b, 0);
        return {
          description: desc,
          qtyAtStart: qtyAtStartFor(desc),
          perSite,
          onHireTotal,
        };
      })
      .filter((r) => r.onHireTotal > 0 || (r.qtyAtStart ?? 0) > 0);

    return { siteCols, rows };
  }, [inventoryByClientSections, removalReportQuotations, allClientSites, scaffolds]);

  const clientOptions = useMemo(() => {
    const uniqueClients = new Set(
      removalReportQuotations.map(
        (quotation) => quotation.company_name || quotation.site_manager_name || "Unknown client"
      )
    );
    return (Array.from(uniqueClients) as string[]).sort((a, b) => a.localeCompare(b));
  }, [removalReportQuotations]);

  const removalReportRows = useMemo(() => {
    return removalReportQuotations
      .flatMap((quotation) => {
        const client = quotation.company_name || quotation.site_manager_name || "Unknown client";
        return getDeliveredItemsFromHistory(quotation).map((item) => ({
          itemDescription: item.description,
          quantity: item.quantity,
          client,
        }));
      })
      .sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [removalReportQuotations]);

  useEffect(() => {
    if (!clientOptions.length) {
      setSelectedClient("");
      return;
    }

    if (!selectedClient || !clientOptions.includes(selectedClient)) {
      setSelectedClient(clientOptions[0] as string);
    }
  }, [clientOptions, selectedClient]);

  const filteredRemovalReportRows = useMemo(() => {
    return removalReportRows.filter((row) => row.client === selectedClient);
  }, [removalReportRows, selectedClient]);

  const summarizedRemovalRows = useMemo(() => {
    const groupedRows = filteredRemovalReportRows.reduce<Record<string, number>>((acc, row) => {
      acc[row.itemDescription] = (acc[row.itemDescription] ?? 0) + row.quantity;
      return acc;
    }, {});

    return Object.entries(groupedRows)
      .map(([itemDescription, quantity]) => ({ itemDescription, quantity }))
      .sort((a, b) => a.itemDescription.localeCompare(b.itemDescription));
  }, [filteredRemovalReportRows]);

  const formatDate = (value: string | null) => formatReportDate(value);

  const handleSidebarItemClick = (item: string) => {
    if (item === "dashboard") {
      navigate("/", { state: { activeItem: "dashboard" }, replace: true });
      return;
    }
    if (item === "inventory" || item === "workforce") {
      navigate("/", { state: { activeItem: item }, replace: true });
      return;
    }
    if (item === "previous-clients") {
      navigate("/previous-clients");
      return;
    }
    if (item === "maintenance") {
      navigate("/maintenance-logs");
      return;
    }
    if (item === "revenue") {
      navigate("/revenue");
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
  };

  const handleOpenWorkflow = (quotation: HireQuotation) => {
    setSelectedQuotation(quotation);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 100);
  };

  const handlePrintRemovalReport = () => {
    if (!selectedClient) {
      window.alert("Select a client to print the removal report.");
      return;
    }

    if (!summarizedRemovalRows.length) {
      window.alert("No inventory removal records available to print yet.");
      return;
    }

    // Pull site details from the first matching quotation for this client
    const clientQuotation = removalReportQuotations.find(
      (q) => (q.company_name || q.site_manager_name || "Unknown client") === selectedClient
    );
    const siteName = clientQuotation?.site_name || "";
    const siteAddress = clientQuotation?.site_address || clientQuotation?.delivery_address || "";
    const contactName = clientQuotation?.site_manager_name || "";
    const contactPhone = clientQuotation?.site_manager_phone || "";
    const clientId = clientQuotation?.client_id || "";

    const origin = window.location.origin;
    const printDate = formatReportDateTime(new Date());
    const docDate = formatReportDate(new Date());

    const tableRows = summarizedRemovalRows
      .map(
        (row) => `
          <tr>
            <td>${row.itemDescription}</td>
            <td class="text-right">${row.quantity}</td>
          </tr>
        `
      )
      .join("");

    const html = `<!DOCTYPE html><html><head><title>Inventory Removal Report - ${selectedClient}</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Arial Narrow", Arial, sans-serif; font-size: 9.5px; color: #1f2937; line-height: 1.3; padding: 12px; }

        /* ── Print controls ── */
        .print-controls {
          position: fixed; top: 12px; right: 12px; z-index: 9999;
          display: flex; padding: 8px; background: rgba(255,255,255,0.97);
          border: 1px solid #ddd; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .print-button {
          border: 1px solid #333; border-radius: 6px; background: #111; color: #fff;
          padding: 6px 12px; font-size: 11px; font-weight: 600; cursor: pointer;
        }

        /* ── 4-panel header layout ── */
        .standard-report-layout {
          display: grid; grid-template-columns: 1.5fr 1fr; gap: 12px; margin-bottom: 12px;
        }
        .standard-report-left { display: grid; gap: 8px; }
        .standard-report-right { display: grid; gap: 6px; }
        .brand-block { padding: 8px 10px; }
        .brand-top { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
        .brand-logo { width: 120px; height: auto; }
        .brand-title { font-size: 14px; font-weight: 800; line-height: 1.15; color: #111827; }
        .brand-meta { font-size: 9px; color: #374151; }
        .panel { border: 1px solid #111827; border-radius: 6px; padding: 7px 9px; }
        .panel h3 { font-size: 11px; font-weight: 800; margin-bottom: 4px; color: #111827; }
        .client-panel { min-height: 150px; }
        .report-title { font-size: 18px; font-weight: 900; letter-spacing: -0.2px; color: #111827; margin-bottom: 6px; }
        .info-row { display: flex; gap: 4px; margin-bottom: 2px; align-items: baseline; }
        .info-label { font-weight: 700; color: #111827; min-width: 110px; font-size: 9px; }
        .info-sep { color: #6b7280; }
        .info-value { color: #111827; word-break: break-word; flex: 1; font-size: 9px; }

        /* ── Repeating page header (print only) ── */
        .page-header { display: none; }
        @media print {
          body { padding: 0 !important; font-size: 8.5px; }
          .print-controls { display: none; }
          .page-header {
            display: block; position: fixed; top: 0; left: 0; right: 0;
            background: white; border-bottom: 1.5px solid #111; padding: 5px 10px 4px; z-index: 9999;
          }
          .page-header-spacer { display: block; height: 56px; }
          @page { size: A4; margin: 8mm; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        }
        .page-header-spacer { display: none; }

        /* ── Table ── */
        table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        th, td { border: 1px solid #111827; padding: 4px 6px; font-size: 8.5px; vertical-align: top; }
        th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.2px; font-weight: 800; }
        .text-right { text-align: right; }

        /* ── Page wrapper (flex so footer sticks) ── */
        .report-page { display: flex; flex-direction: column; min-height: 92vh; }
        @media print { .report-page { min-height: 92vh; } }

        /* ── Yellow footer ── */
        .footer-wrap { margin-top: auto; }
        .footer-brand {
          background: #facc15; color: #1f2937; font-weight: 700;
          display: flex; justify-content: space-between; align-items: center; padding: 6px 10px;
        }
        .footer-legal {
          text-align: center; font-size: 7.5px; color: #4b5563;
          padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none;
        }
        .footer-processed {
          display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0;
        }
      </style>
    </head><body>

      <!-- Print button (screen only) -->
      <div class="print-controls">
        <button type="button" class="print-button" onclick="window.print()">Print report</button>
      </div>


      <!-- Main page content -->
      <div class="report-page">

        <!-- 4-panel header (screen view) -->
        <div class="standard-report-layout">
          <div class="standard-report-left">
            <div class="brand-block">
              <div class="brand-top">
                <img src="${origin}/otn-logo-red.png" alt="OTNO Logo" class="brand-logo" />
                <div class="brand-title">OTNO Access Solutions</div>
              </div>
              <div class="brand-meta"><span><strong>Reg No:</strong> P052471711M</span></div>
            </div>
            <div class="panel client-panel">
              <h3>${selectedClient}</h3>
              <div style="margin-top:8px;">
                <div class="info-row"><span class="info-label">Client</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${selectedClient}</span></div>
              </div>
            </div>
          </div>

          <div class="standard-report-right">
            <h2 class="report-title">Inventory Removal Report</h2>
            <div class="panel">
              <h3>Document Details</h3>
              <div class="info-row"><span class="info-label">Document Type</span><span class="info-sep">:</span><span class="info-value">Inventory Removal Report</span></div>
              <div class="info-row"><span class="info-label">Document Date</span><span class="info-sep">:</span><span class="info-value">${docDate}</span></div>
            </div>
            <div class="panel">
              <h3>Company Details</h3>
              <div class="info-row"><span class="info-label">Company</span><span class="info-sep">:</span><span class="info-value">OTNO Access Solutions</span></div>
              <div class="info-row"><span class="info-label">Address</span><span class="info-sep">:</span><span class="info-value">P.O.BOX 142-00502 Nairobi Karen</span></div>
              <div class="info-row"><span class="info-label">Location</span><span class="info-sep">:</span><span class="info-value">P.O.BOX 142-00502 Nairobi Karen</span></div>
              <div class="info-row"><span class="info-label">Email</span><span class="info-sep">:</span><span class="info-value">otnoacess@gmail.com</span></div>
            </div>
            <div class="panel">
              <h3>Site Details</h3>
              ${clientId ? `<div class="info-row"><span class="info-label">Client ID</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${clientId}</span></div>` : ""}
              <div class="info-row"><span class="info-label">Client</span><span class="info-sep">:</span><span class="info-value" style="font-weight:800;">${selectedClient}</span></div>
              ${siteName ? `<div class="info-row"><span class="info-label">Site Name</span><span class="info-sep">:</span><span class="info-value">${siteName}</span></div>` : ""}
              ${siteAddress ? `<div class="info-row"><span class="info-label">Site Address</span><span class="info-sep">:</span><span class="info-value">${siteAddress}</span></div>` : ""}
              ${contactName ? `<div class="info-row"><span class="info-label">Contact</span><span class="info-sep">:</span><span class="info-value">${contactName}</span></div>` : ""}
              ${contactPhone ? `<div class="info-row"><span class="info-label">Tel No</span><span class="info-sep">:</span><span class="info-value">${contactPhone}</span></div>` : ""}
            </div>
          </div>
        </div>

        <!-- Items table -->
        <table>
          <thead>
            <tr>
              <th>Item Description</th>
              <th class="text-right">Quantity Removed</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- Yellow branded footer -->
        <div class="footer-wrap">
          <div class="footer-brand">
            <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
            <img src="${origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
          </div>
          <div class="footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com</div>
          <div class="footer-processed">
            <div><div>Processed Date : ${docDate}</div></div>
            <div style="text-align:right;"><div>Print date : ${printDate}</div></div>
          </div>
        </div>

      </div>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      window.alert("Please allow popups to print the report.");
      URL.revokeObjectURL(url);
      return;
    }
    printWindow.addEventListener("unload", () => URL.revokeObjectURL(url), { once: true });
  };

  const handlePrintInventoryBySiteReport = () => {
    if (!inventoryMatrix.rows.length) {
      window.alert("No inventory movement records available to print yet.");
      return;
    }

    const origin = window.location.origin;
    const printDate = formatReportDateTime(new Date());
    const docDate = formatReportDate(new Date());

    // Build grouped client header
    const clientGroups: Array<{ client: string; clientId: string; span: number }> = [];
    inventoryMatrix.siteCols.forEach((c) => {
      const last = clientGroups[clientGroups.length - 1];
      if (last && last.client === c.client && last.clientId === c.clientId) last.span++;
      else clientGroups.push({ client: c.client, clientId: c.clientId, span: 1 });
    });

    const clientHeaderCells = clientGroups
      .map(
        (g) =>
          `<th colspan="${g.span}" class="text-center client-th">${g.client}${g.clientId ? ` (${g.clientId})` : ""}</th>`
      )
      .join("");

    const siteSubHeaderCells = inventoryMatrix.siteCols
      .map(
        (c) =>
          `<th class="text-center site-th"><div>${c.quotationNumber || "-"}</div><div class="muted">${c.siteNumber || "-"}</div></th>`
      )
      .join("");

    const bodyRows = inventoryMatrix.rows
      .map((row) => {
        const cells = row.perSite.map((v) => `<td class="text-right">${v > 0 ? v : ""}</td>`).join("");
        return `<tr>
          <td>${row.description}</td>
          <td class="text-right">${row.qtyAtStart ?? "-"}</td>
          ${cells}
          <td class="text-right total-cell">${row.onHireTotal}</td>
        </tr>`;
      })
      .join("");

    const clientSections = `
      <table class="matrix">
        <thead>
          <tr>
            <th rowspan="2" class="align-bottom">Item Description</th>
            <th rowspan="2" class="text-right align-bottom">Qty at Start</th>
            ${clientHeaderCells}
            <th rowspan="2" class="text-right align-bottom">On Hire</th>
          </tr>
          <tr>
            ${siteSubHeaderCells}
          </tr>
        </thead>
        <tbody>
          ${bodyRows}
        </tbody>
      </table>`;

    const html = `<!DOCTYPE html><html><head><title>Inventory by Client & Site Report</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: "Arial Narrow", Arial, sans-serif; font-size: 9.5px; color: #1f2937; line-height: 1.3; padding: 12px; background: #fff; }
        a, a:visited, a:hover, a:active { color: #111827 !important; text-decoration: none !important; }

        /* ── Print controls ── */
        .print-controls { position: fixed; top: 12px; right: 12px; z-index: 9999; display: flex; padding: 8px; background: rgba(255,255,255,0.97); border: 1px solid #ddd; border-radius: 8px; }
        .print-button { border: 1px solid #333; border-radius: 6px; background: #111; color: #fff; padding: 6px 14px; font-size: 11px; font-weight: 600; cursor: pointer; }

        /* ── Branding block ── */
        .brand-block { padding: 8px 10px; margin-bottom: 10px; }
        .brand-top { display: flex; align-items: center; gap: 10px; margin-bottom: 5px; }
        .brand-logo { width: 120px; height: auto; }
        .brand-title { font-size: 20px; font-weight: 900; line-height: 1.15; color: #111827; letter-spacing: -0.3px; }
        .brand-meta { font-size: 9px; color: #374151; }

        /* ── Report title ── */
        .report-title { font-size: 22px; font-weight: 900; color: #111827; margin-bottom: 6px; letter-spacing: -0.2px; }

        /* ── Document info panel ── */
        .panel { border: 0.5px solid #aaa; border-radius: 8px; padding: 7px 9px; margin-bottom: 8px; background: #ffffff; }
        .panel h3 { font-size: 9px; font-weight: 800; margin-bottom: 3px; color: #111827; }

        /* ── Info rows ── */
        .info-row { display: flex; gap: 4px; margin-bottom: 2px; align-items: baseline; }
        .info-label { font-weight: 700; color: #111827; min-width: 80px; font-size: 8.5px; }
        .info-sep { color: #6b7280; }
        .info-value { color: #111827; word-break: break-word; flex: 1; font-size: 8.5px; font-weight: 700; }
        .info-row-full { grid-column: 1 / -1; }

        /* ── Client / site sections ── */
        .client-section { margin-bottom: 10px; }
        .site-section { margin-bottom: 10px; border: 0.5px solid #aaa; border-radius: 8px; padding: 8px; background: #ffffff; page-break-inside: avoid; }
        .site-header { display: flex; align-items: center; justify-content: space-between; background: #111827; color: #ffffff; font-weight: 800; font-size: 9px; text-transform: uppercase; letter-spacing: 0.3px; border-radius: 6px; padding: 5px 8px; margin-bottom: 6px; }
        .details-box { margin-bottom: 7px; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 10px; }

        /* ── Tables ── */
        .text-right { text-align: right; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
        th, td { border: 1px solid #111827; padding: 4px 6px; font-size: 8.5px; vertical-align: top; }
        th { background: #f3f4f6; text-transform: uppercase; letter-spacing: 0.2px; font-weight: 800; }
        .total-row td { background: #f9fafb; font-weight: 800; }
        tr { page-break-inside: avoid; }
        thead { display: table-header-group; }

        /* ── Footer ── */
        .footer-wrap { margin-top: auto; }
        .footer-brand {
          background: #facc15; color: #1f2937; font-weight: 700;
          display: flex; justify-content: space-between; align-items: center;
          padding: 6px 10px;
        }
        .footer-legal { text-align: center; font-size: 7.5px; color: #4b5563; padding: 3px 8px 4px; border: 1px solid #e5e7eb; border-top: none; }
        .footer-processed { display: flex; justify-content: space-between; font-size: 7px; color: #6b7280; padding: 4px 0 0; }

        /* ── Page wrapper ── */
        .page-wrapper { display: flex; flex-direction: column; min-height: 92vh; }
        .page-body { flex: 1; }

        @media print {
          body { padding: 0 !important; font-size: 8.5px; background: #ffffff; }
          .print-controls { display: none; }
          @page { size: A4 landscape; margin: 8mm; }
          .page-wrapper { min-height: 92vh; }
        }
      </style>
    </head><body>
      <div class="print-controls">
        <button type="button" class="print-button" onclick="window.print()">Print report</button>
      </div>
      <div class="page-wrapper">
        <div class="page-body">
          <div class="brand-block">
            <div class="brand-top">
              <img src="${origin}/otn-logo-red.png" alt="OTNO Logo" class="brand-logo" />
              <div class="brand-title">OTNO ACCESS SOLUTIONS LIMITED</div>
            </div>
            <div class="brand-meta">
              <div><strong>PIN No:</strong> P052199134H</div>
              <div><strong>Reg No:</strong> PVT-TYDZRM3</div>
            </div>
          </div>
          <h2 class="report-title">Inventory Movement by Client &amp; Site</h2>
          <div class="panel">
            <div class="info-row"><span class="info-label">Document Type</span><span class="info-sep">:</span><span class="info-value">Inventory Movement by Client &amp; Site</span></div>
            <div class="info-row"><span class="info-label">Document Date</span><span class="info-sep">:</span><span class="info-value">${docDate}</span></div>
            <div class="info-row"><span class="info-label">Company</span><span class="info-sep">:</span><span class="info-value">OTNO Access Solutions</span></div>
          </div>
          ${clientSections}
        </div>
        <div class="footer-wrap">
          <div class="footer-brand">
            <span>OTNO Access Solutions — Your Trusted Scaffolding &amp; Access Partner.</span>
            <img src="${origin}/otn-logo-red.png" alt="OTNO" style="width:80px;height:auto;"/>
          </div>
          <div class="footer-legal">All transactions are subject to our standard Terms of Trade which can be found at: otnoacess@gmail.com</div>
          <div class="footer-processed">
            <div><div>Processed Date : ${docDate}</div></div>
            <div style="text-align:right;"><div>Print date : ${printDate}</div></div>
          </div>
        </div>
      </div>
    </body></html>`;

    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const printWindow = window.open(url, "_blank");
    if (!printWindow) {
      window.alert("Please allow popups to print the report.");
      URL.revokeObjectURL(url);
      return;
    }
    printWindow.addEventListener("unload", () => URL.revokeObjectURL(url), { once: true });
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar activeItem="sites" onItemClick={handleSidebarItemClick} />

      <main className="ml-0 md:ml-64">
        <Header
          title="Sites"
          subtitle="Review saved client quotations, active sites, and continue hire quotation workflows."
        />

        <div className="p-4 md:p-6 space-y-4 md:space-y-6">
          <section className="space-y-3 md:space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-3">
                <div>
                  <CardTitle className="text-base md:text-lg">Inventory Removal Report</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Generate client-specific reports from dispatched and completed quotations only.
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handlePrintRemovalReport} className="w-full md:w-auto">
                  Print Report
                </Button>
              </CardHeader>
              <CardContent>
                {removalReportRows.length ? (
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-foreground">Select client</label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clientOptions.map((client) => (
                            <SelectItem key={client} value={client}>
                              {client}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="rounded-lg border border-border overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item Description</TableHead>
                            <TableHead className="text-right">Qty Removed</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {summarizedRemovalRows.map((row) => (
                            <TableRow key={`${selectedClient}-${row.itemDescription}`}>
                              <TableCell className="font-medium text-sm">{row.itemDescription}</TableCell>
                              <TableCell className="text-right font-bold">{row.quantity as React.ReactNode}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                    {!summarizedRemovalRows.length ? (
                      <p className="text-sm text-muted-foreground">
                        No report rows found for the selected client.
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No inventory removal records yet. Dispatched and completed quotations with deducted equipment will appear here.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3 md:space-y-4">
            <Card>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between pb-3">
                <div>
                  <CardTitle className="text-base md:text-lg text-foreground">Inventory Movement by Client &amp; Site</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    One combined report showing where all delivered inventory has gone, including each client and site details.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrintInventoryBySiteReport}
                  disabled={!inventoryMatrix.rows.length}
                  className="w-full md:w-auto"
                >
                  Print Combined Report
                </Button>
              </CardHeader>
              <CardContent>
                {inventoryMatrix.rows.length ? (
                  <div className="rounded-md border border-border overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#f4ca16]/50 hover:bg-[#f4ca16]/50">
                          <TableHead rowSpan={2} className="font-semibold text-foreground align-bottom">Item Description</TableHead>
                          <TableHead rowSpan={2} className="text-right font-semibold text-foreground align-bottom">Qty at Start</TableHead>
                          {(() => {
                            // Group columns by client for the spanned header
                            const groups: Array<{ client: string; clientId: string; span: number }> = [];
                            inventoryMatrix.siteCols.forEach((c) => {
                              const last = groups[groups.length - 1];
                              if (last && last.client === c.client && last.clientId === c.clientId) last.span++;
                              else groups.push({ client: c.client, clientId: c.clientId, span: 1 });
                            });
                            return groups.map((g, i) => (
                              <TableHead key={`grp-${i}`} colSpan={g.span} className="text-center font-semibold text-foreground border-l">
                                {g.client}{g.clientId ? ` (${g.clientId})` : ""}
                              </TableHead>
                            ));
                          })()}
                          <TableHead rowSpan={2} className="text-right font-semibold text-foreground align-bottom border-l">On Hire</TableHead>
                        </TableRow>
                        <TableRow className="bg-[#f4ca16]/30 hover:bg-[#f4ca16]/30">
                          {inventoryMatrix.siteCols.map((c) => (
                            <TableHead key={`sub-${c.key}`} className="text-center text-xs font-semibold text-foreground border-l">
                              <div>{c.quotationNumber || "-"}</div>
                              <div className="text-muted-foreground">{c.siteNumber || "-"}</div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryMatrix.rows.map((row) => (
                          <TableRow key={row.description}>
                            <TableCell className="font-medium text-sm">{row.description}</TableCell>
                            <TableCell className="text-right">{row.qtyAtStart ?? "-"}</TableCell>
                            {row.perSite.map((v, i) => (
                              <TableCell key={`v-${i}`} className="text-right border-l">
                                {v > 0 ? v : ""}
                              </TableCell>
                            ))}
                            <TableCell className="text-right font-bold border-l">{row.onHireTotal}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                    No delivered inventory movements found yet for the combined client/site report.
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid grid-cols-1 gap-4 md:gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                  <MapPin className="h-5 w-5" />
                  Active & Pending Quotations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                {isLoading ? (
                  <p className="text-sm text-muted-foreground">Loading active quotations...</p>
                ) : activeQuotations.length ? (
                  <div className="space-y-2.5">
                    {activeQuotations.map((quotation) => (
                      <div
                        key={quotation.id}
                        className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {quotation.company_name || quotation.site_manager_name || "Client pending"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {quotation.site_name || "Site name pending"} · Saved {formatDate(quotation.created_at)}
                            </p>
                          </div>
                          <span className="shrink-0 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase text-primary">
                            {quotation.status || "pending"}
                          </span>
                        </div>
                        <Button size="sm" variant="outline" className="w-full" onClick={() => handleOpenWorkflow(quotation)}>
                          Open workflow
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No active or pending quotations yet.</p>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="space-y-3 md:space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base md:text-lg font-semibold">Saved Hire Quotation Workflow</h2>
                <p className="text-sm text-muted-foreground">
                  Continue the selected client workflow, update equipment, and generate reports.
                </p>
              </div>
              {selectedQuotation ? (
                <Button variant="ghost" size="sm" onClick={() => setSelectedQuotation(null)}>
                  Clear selection
                </Button>
              ) : null}
            </div>
            {selectedQuotation ? (
              <HireQuotationWorkflow
                initialQuotation={liveSelectedQuotation}
                onClientProcessed={() => setSelectedQuotation(null)}
              />
            ) : (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  Select a client from the list above to open their hire quotation workflow.
                </CardContent>
              </Card>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};
export default Sites;
