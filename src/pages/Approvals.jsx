import React, { useState } from "react";
import { Box, Tabs, Tab, Typography } from "@mui/material";
import { FileText, Receipt, CreditCard, File, DollarSign } from "lucide-react";
import PageHeader from "../components/PageHeader";
import AdminOrders from "./orders/AdminOrders";
import PricingApprovals from "./PricingApprovals";
import { useNavigate } from "react-router-dom";

export default function Approvals() {
  const [selectedTab, setSelectedTab] = useState(0);
  const navigate = useNavigate();

  const tabs = [
    { label: "Orders", value: "orders", icon: <FileText size={18} />, component: AdminOrders },
    {
      label: "Invoices",
      value: "invoices",
      icon: <Receipt size={18} />,
      component: () => {
        navigate("/invoices");
        return null;
      },
    },
    {
      label: "Payments",
      value: "payments",
      icon: <CreditCard size={18} />,
      component: () => {
        navigate("/payments/finance/pending");
        return null;
      },
    },
    {
      label: "Documents",
      value: "documents",
      icon: <File size={18} />,
      component: () => {
        navigate("/documents");
        return null;
      },
    },
    {
      label: "Pricing",
      value: "pricing",
      icon: <DollarSign size={18} />,
      component: PricingApprovals,
    },
  ];

  const CurrentComponent = tabs[selectedTab].component;

  return (
    <Box sx={{ p: 3 }}>
      <PageHeader
        title="Pending Approvals"
        subtitle="Review and approve pending requests"
      />

      <Tabs
        value={selectedTab}
        onChange={(e, newValue) => setSelectedTab(newValue)}
        sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
      >
        {tabs.map((tab, index) => (
          <Tab
            key={tab.value}
            label={
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                {tab.icon}
                <span>{tab.label}</span>
              </Box>
            }
            value={index}
          />
        ))}
      </Tabs>

      <Box>
        <CurrentComponent />
      </Box>
    </Box>
  );
}

