import React from "react";
import TaskList from "../components/TaskList";
import PageHeader from "../components/PageHeader";

export default function Tasks() {
  return (
    <div style={{ padding: "1rem" }}>
      <PageHeader title="Pending Tasks" subtitle="Review and manage pending approvals" />
      <TaskList />
    </div>
  );
}

