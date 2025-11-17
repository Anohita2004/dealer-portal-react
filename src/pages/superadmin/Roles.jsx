import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { toast } from "react-toastify";

export default function SuperAdminRolesPage() {
  const [roles, setRoles] = useState([]);
  const [permissions, setPermissions] = useState([]);

  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [assignModalOpen, setAssignModalOpen] = useState(false);

  const [newRole, setNewRole] = useState({ name: "", category: "", description: "" });
  const [newPermission, setNewPermission] = useState({ key: "", description: "" });

  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedPermissions, setSelectedPermissions] = useState([]);

  // Fetch data
  const loadData = async () => {
    const r = await api.get("/roles");
    const p = await api.get("/permissions");
    setRoles(r.data);
    setPermissions(p.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Create Role
  const createRole = async (e) => {
    e.preventDefault();
    try {
      await api.post("/roles", newRole);
      toast.success("Role created!");
      setRoleModalOpen(false);
      setNewRole({ name: "", category: "", description: "" });
      loadData();
    } catch (err) {
      toast.error("Failed to create role");
    }
  };

  // Create Permission
  const createPermission = async (e) => {
    e.preventDefault();
    try {
      await api.post("/permissions", newPermission);
      toast.success("Permission created!");
      setPermissionModalOpen(false);
      setNewPermission({ key: "", description: "" });
      loadData();
    } catch (err) {
      toast.error("Failed to create permission");
    }
  };

  // Assign permissions to role
  const assignPermissions = async () => {
    try {
      for (const pid of selectedPermissions) {
        await api.post("/roles/assign-permission", {
          roleId: selectedRole.id,
          permissionId: pid,
        });
      }
      toast.success("Permissions updated");
      setAssignModalOpen(false);
      loadData();
    } catch (err) {
      toast.error("Failed to assign permissions");
    }
  };

  const togglePermission = (pid) => {
    setSelectedPermissions((prev) =>
      prev.includes(pid)
        ? prev.filter((id) => id !== pid)
        : [...prev, pid]
    );
  };

  return (
    <div className="p-6">

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Roles & Permissions</h1>

        <div className="flex gap-3">
          <button
            onClick={() => setRoleModalOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded"
          >
            + Add Role
          </button>

          <button
            onClick={() => setPermissionModalOpen(true)}
            className="px-4 py-2 bg-green-600 text-white rounded"
          >
            + Add Permission
          </button>
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-semibold mb-3">All Roles</h2>

        <table className="w-full border">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Permissions</th>
              <th className="p-2 border w-32">Actions</th>
            </tr>
          </thead>
          <tbody>
            {roles.map((role) => (
              <tr key={role.id}>
                <td className="p-2 border">{role.name}</td>
                <td className="p-2 border">{role.category || "-"}</td>
                <td className="p-2 border">
                  {role.permissions?.length === 0 && <span className="text-gray-500">None</span>}
                  {role.permissions?.map((p) => (
                    <span
                      key={p.id}
                      className="px-2 py-1 bg-gray-200 rounded text-xs mr-2"
                    >
                      {p.key}
                    </span>
                  ))}
                </td>
                <td className="p-2 border">
                  <button
                    onClick={() => {
                      setSelectedRole(role);
                      setSelectedPermissions(role.permissions.map((p) => p.id));
                      setAssignModalOpen(true);
                    }}
                    className="px-3 py-1 bg-orange-500 text-white rounded"
                  >
                    Assign
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Role Modal */}
      {roleModalOpen && (
        <Modal onClose={() => setRoleModalOpen(false)} title="Create Role">
          <form onSubmit={createRole} className="grid gap-3">
            <input
              placeholder="Role Name"
              className="border p-2 rounded"
              value={newRole.name}
              onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
              required
            />
            <input
              placeholder="Category"
              className="border p-2 rounded"
              value={newRole.category}
              onChange={(e) => setNewRole({ ...newRole, category: e.target.value })}
            />
            <textarea
              placeholder="Description"
              className="border p-2 rounded"
              value={newRole.description}
              onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
            />

            <button className="bg-blue-600 text-white py-2 rounded">Create</button>
          </form>
        </Modal>
      )}

      {/* Create Permission Modal */}
      {permissionModalOpen && (
        <Modal onClose={() => setPermissionModalOpen(false)} title="Create Permission">
          <form onSubmit={createPermission} className="grid gap-3">
            <input
              placeholder="Permission Key"
              className="border p-2 rounded"
              value={newPermission.key}
              onChange={(e) =>
                setNewPermission({ ...newPermission, key: e.target.value })
              }
              required
            />
            <textarea
              placeholder="Description"
              className="border p-2 rounded"
              value={newPermission.description}
              onChange={(e) =>
                setNewPermission({ ...newPermission, description: e.target.value })
              }
            />
            <button className="bg-green-600 text-white py-2 rounded">Create</button>
          </form>
        </Modal>
      )}

      {/* Assign Permissions Modal */}
      {assignModalOpen && (
        <Modal onClose={() => setAssignModalOpen(false)} title={`Assign Permissions to ${selectedRole?.name}`}>
          <div className="grid gap-2 max-h-80 overflow-y-auto p-2">
            {permissions.map((p) => (
              <label key={p.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={selectedPermissions.includes(p.id)}
                  onChange={() => togglePermission(p.id)}
                />
                {p.key}
              </label>
            ))}
          </div>

          <button
            onClick={assignPermissions}
            className="w-full mt-4 bg-orange-500 text-white py-2 rounded"
          >
            Save Permissions
          </button>
        </Modal>
      )}
    </div>
  );
}

// Simple modal component
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button onClick={onClose} className="text-gray-500">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
