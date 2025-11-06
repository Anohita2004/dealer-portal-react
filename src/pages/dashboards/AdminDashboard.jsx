import React, { useEffect, useState } from "react";
import api from "../../services/api";
import socket from "../../services/socket"; // ✅ new import
import { useNavigate } from "react-router-dom";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Card from "../../components/Card";
import DataTable from "../../components/DataTable";
import Toolbar from "../../components/Toolbar";
import SearchInput from "../../components/SearchInput";
import IconPillButton from "../../components/IconPillButton";
import { toast } from "react-toastify";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState({});
  const [approvals, setApprovals] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [dealerActivity, setDealerActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // 📊 Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // 1️⃣ Dealer performance summary
        const performanceRes = await api.get("/reports/dealer-performance");
        const invoices = performanceRes.data?.invoices || [];
        const totalSales = performanceRes.data?.totalSales || 0;
        const dealers = new Set(invoices.map((i) => i.dealerId)).size;

        setSummary({
          activeCampaigns: 0,
          dealers,
          pendingApprovals: 0,
          blockedDealers: 2,
          totalSales,
        });

        // 2️⃣ Campaigns
        const campaignRes = await api.get("/campaigns");
        setCampaigns(campaignRes.data.campaigns || campaignRes.data);
        setSummary((prev) => ({
          ...prev,
          activeCampaigns: campaignRes.data.campaigns?.length || 0,
        }));

        // 3️⃣ Dealer activity trend
        const monthly = {};
        invoices.forEach((i) => {
          const month = new Date(i.invoiceDate).toLocaleString("default", {
            month: "short",
          });
          monthly[month] = monthly[month] || {
            dealersOnboarded: 0,
            blockedDealers: 0,
          };
          monthly[month].dealersOnboarded += 1;
        });
        const dealerTrend = Object.keys(monthly).map((m) => ({
          month: m,
          dealersOnboarded: monthly[m].dealersOnboarded,
          blockedDealers: Math.floor(Math.random() * 3),
        }));
        setDealerActivity(dealerTrend);

        // 4️⃣ Pending approvals
        const approvalRes = await api.get("/documents");
        setApprovals(approvalRes.data.documents || []);
        setSummary((prev) => ({
          ...prev,
          pendingApprovals: approvalRes.data.documents?.length || 0,
        }));
      } catch (e) {
        console.error("Error fetching admin dashboard:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // ⚡ Real-time socket connection
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) socket.auth = { token };
    socket.connect();

    socket.on("connect", () => console.log("✅ Admin socket connected"));

    // 🆕 Dealer uploads a new document → Add to approvals
    socket.on("document:new", (data) => {
      toast.info(`📄 New document uploaded by Dealer ${data.dealerId}`);
      setApprovals((prev) => [
        {
          id: data.id || Date.now(),
          dealerName: data.dealerName || `Dealer ${data.dealerId}`,
          documentType: data.documentType || "Document",
          createdAt: new Date(),
          status: "pending",
        },
        ...prev,
      ]);
      setSummary((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals + 1,
      }));
    });

    // ✅ A document was approved/rejected elsewhere
    socket.on("document:pending:update", () => {
      toast.info("🔁 Document approval status updated");
      api.get("/documents").then((res) => {
        setApprovals(res.data.documents || []);
        setSummary((prev) => ({
          ...prev,
          pendingApprovals: res.data.documents?.length || 0,
        }));
      });
    });

    // 📨 A new campaign was pushed
    socket.on("campaign:new", (campaign) => {
      toast.success(`📢 New campaign launched: ${campaign.title}`);
      setCampaigns((prev) => [campaign, ...prev]);
      setSummary((prev) => ({
        ...prev,
        activeCampaigns: (prev.activeCampaigns || 0) + 1,
      }));
    });

    // 🔔 General system notifications
    socket.on("notification:update", (notif) => {
      toast.info(`🔔 ${notif.message || "System update received"}`);
    });

    return () => {
      socket.off("document:new");
      socket.off("document:pending:update");
      socket.off("campaign:new");
      socket.off("notification:update");
      socket.disconnect();
    };
  }, []);

  // ✅ Handle approve/reject buttons
  const handleApproval = async (id, action) => {
    try {
      await api.patch(`/documents/${id}/status`, { action });
      toast.success(`Document ${action}d successfully`);
      setApprovals((prev) => prev.filter((doc) => doc.id !== id));
      setSummary((prev) => ({
        ...prev,
        pendingApprovals: prev.pendingApprovals - 1,
      }));
    } catch (err) {
      toast.error(`Failed to ${action} document`);
      console.error(err);
    }
  };

  if (loading)
    return (
      <div className="center text-center" style={{ height: "80vh" }}>
        Loading admin dashboard...
      </div>
    );

  return (
    <div style={{ padding: "2rem" }}>
      <PageHeader
        title="Administrator Dashboard"
        subtitle="Manage campaigns, dealer approvals, and monitor business operations."
      />

      <Toolbar
        right={[
          <IconPillButton key="new-camp" icon="➕" label="New Campaign" onClick={() => navigate("/campaigns")} />,
          <IconPillButton key="manage" icon="⚙️" label="Manage Dealers" tone="warning" onClick={() => navigate("/admin")} />,
        ]}
      >
        <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dealers, campaigns..." />
      </Toolbar>

      <div className="grid mt-4">
        <StatCard title="Active Campaigns" value={summary.activeCampaigns || 0} icon="📢" accent="#a78bfa" />
        <StatCard title="Registered Dealers" value={summary.dealers || 0} icon="🏪" accent="#f97316" />
        <StatCard title="Pending Approvals" value={summary.pendingApprovals || 0} icon="🕒" accent="#f59e0b" />
        <StatCard title="Blocked Dealers" value={summary.blockedDealers || 0} icon="🚫" accent="#ef4444" />
      </div>

      <Card title="Dealer Activity (Last 6 Months)" style={{ marginTop: "1.5rem" }}>
        {dealerActivity.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dealerActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="dealersOnboarded" fill="#f97316" name="Dealers Onboarded" />
              <Bar dataKey="blockedDealers" fill="#ef4444" name="Blocked Dealers" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ color: "#94a3b8" }}>No dealer activity data available</p>
        )}
      </Card>

      <Card title="Pending Approvals" style={{ marginTop: "1.5rem" }}>
        <DataTable
          columns={[
            { key: "dealer", label: "Dealer" },
            { key: "documentType", label: "Document Type" },
            { key: "uploadedOn", label: "Uploaded On" },
            { key: "action", label: "Action" },
          ]}
          rows={approvals
            .filter((a) => {
              const q = search.toLowerCase();
              return !q || a.dealerName?.toLowerCase().includes(q) || a.documentType?.toLowerCase().includes(q);
            })
            .slice(0, 10)
            .map((a) => ({
              id: a.id,
              dealer: a.dealerName,
              documentType: a.documentType,
              uploadedOn: new Date(a.createdAt).toLocaleDateString(),
              action: (
                <div>
                  <button
                    className="primary"
                    style={{ background: "linear-gradient(90deg, #22c55e, #16a34a)", marginRight: "0.5rem" }}
                    onClick={() => handleApproval(a.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    className="primary"
                    style={{ background: "linear-gradient(90deg, #ef4444, #b91c1c)" }}
                    onClick={() => handleApproval(a.id, "reject")}
                  >
                    Reject
                  </button>
                </div>
              ),
            }))}
          emptyMessage="No pending approvals"
        />
      </Card>

      <Card title="Active Campaigns" style={{ marginTop: "1.5rem" }}>
        {campaigns.length > 0 ? (
          <div className="grid">
            {campaigns.slice(0, 4).map((c) => (
              <div
                key={c.id}
                className="card hover-glow"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/campaigns/${c.id}`)}
              >
                <h4 style={{ color: "#f97316" }}>{c.title}</h4>
                <p style={{ color: "#6b7280" }}>{c.description}</p>
                <p style={{ fontSize: "0.8rem", color: "#9ca3af" }}>
                  Valid till: {new Date(c.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: "#94a3b8" }}>No active campaigns</p>
        )}
      </Card>

      <div className="mt-6 flex" style={{ gap: "1rem" }}>
        <IconPillButton icon="➕" label="Create Campaign" onClick={() => navigate("/campaigns")} />
        <IconPillButton icon="⚙️" label="Manage Dealers" tone="warning" onClick={() => navigate("/admin")} />
        <IconPillButton icon="📊" label="View Reports" onClick={() => navigate("/reports")} />
      </div>
    </div>
  );
}

// (legacy local Card removed in favor of shared components)
