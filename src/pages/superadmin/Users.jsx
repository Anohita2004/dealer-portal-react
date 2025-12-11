// src/pages/superadmin/Users.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import api from "../../services/api";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown
} from "react-icons/fa";

export default function Users() {
  // ---------------- STATE ----------------
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [areas, setAreas] = useState([]);
  const [territories, setTerritories] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    regionId: "",
    areaId: "",
    territoryId: "",
    dealerId: "",
    isActive: true
  });

  const debounceRef = useRef();

  // ---------------- FETCH DATA ----------------
  const fetchData = async (requestedPage = page) => {
    try {
      setLoading(true);

      const params = {
        page: requestedPage,
        pageSize,
        search: searchTerm || undefined,
        role: filterRole || undefined,
        sort: sortBy,
        order: sortOrder
      };

      const [usersRes, rolesRes, dealersRes, regionsRes, areasRes, territoriesRes] =
        await Promise.all([
          api.get("/admin/users", { params }),
          api.get("/roles"),
          api.get("/dealers"),
          api.get("/regions"),
          api.get("/areas"),
          api.get("/territories")
        ]);

      const list = usersRes.data.users || [];
      setUsers(list);

      setTotal(usersRes.data.total || list.length);
      setTotalPages(usersRes.data.totalPages || 1);

      setRoles(rolesRes.data?.roles ?? rolesRes.data ?? []);
      setDealers(dealersRes.data?.dealers ?? dealersRes.data ?? []);
      setRegions(regionsRes.data?.regions ?? regionsRes.data ?? []);
      setAreas(areasRes.data ?? []);
      setTerritories(territoriesRes.data ?? []);
    } catch (err) {
      console.error(err);
      alert("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    fetchData(page);
  }, [page]);

  // debounce search/filter/sort changes
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, filterRole, sortBy, sortOrder, pageSize]);

  // ---------------- UI HANDLERS ----------------
  const resetForm = () =>
    setForm({
      username: "",
      email: "",
      password: "",
      roleId: "",
      regionId: "",
      areaId: "",
      territoryId: "",
      dealerId: "",
      isActive: true
    });

  const openAdd = () => {
    resetForm();
    setEditingUser(null);
    setModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username,
      email: user.email,
      password: "",
      roleId: user.roleId,
      regionId: user.regionId || "",
      areaId: user.areaId || "",
      territoryId: user.territoryId || "",
      dealerId: user.dealerId || "",
      isActive: user.isActive
    });
    setModalOpen(true);
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        username: form.username,
        email: form.email,
        password: form.password || undefined,
        roleId: form.roleId,
        regionId: form.regionId || null,
        areaId: form.areaId || null,
        territoryId: form.territoryId || null,
        dealerId: form.dealerId || null,
        isActive: form.isActive
      };

      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
      } else {
        await api.post(`/admin/users`, payload);
      }

      setModalOpen(false);
      resetForm();
      fetchData(1);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData(1);
    } catch (err) {
      console.error(err);
      alert("Failed to delete user");
    }
  };

  // ---------------- SORT ----------------
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const sortIcon = (column) => {
    if (sortBy !== column) return <FaSort className="inline-block ml-1" />;
    return sortOrder === "asc" ? (
      <FaSortUp className="inline-block ml-1" />
    ) : (
      <FaSortDown className="inline-block ml-1" />
    );
  };

  // ---------------- TABLE ----------------
  const Badge = ({ children, color }) => {
    const colorClass = {
      green: "bg-green-100 text-green-800",
      red: "bg-red-100 text-red-800",
      yellow: "bg-yellow-100 text-yellow-800",
      blue: "bg-blue-100 text-blue-800",
      gray: "bg-gray-100 text-gray-800"
    }[color];

    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${colorClass}`}>
        {children}
      </span>
    );
  };

  // ---------------- FILTER DROPDOWNS ----------------
  const roleOptions = useMemo(() => roles, [roles]);

  // ---------------- RENDER ----------------
  return (
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">User Management</h1>

        <button
          onClick={openAdd}
          className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded shadow"
        >
          <FaPlus /> Add User
        </button>
      </div>

      {/* -------- FILTERS -------- */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input
            className="pl-10 pr-3 py-2 border rounded"
            placeholder="Search username/email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Roles</option>
          {roleOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value))}
          className="border px-3 py-2 rounded"
        >
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      {/* -------- TABLE -------- */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50 text-left">
            <tr>
              <th className="p-3 cursor-pointer" onClick={() => toggleSort("username")}>
                Username {sortIcon("username")}
              </th>
              <th className="p-3 cursor-pointer" onClick={() => toggleSort("email")}>
                Email {sortIcon("email")}
              </th>
              <th className="p-3">Role</th>
              <th className="p-3">Region</th>
              <th className="p-3">Area</th>
              <th className="p-3">Territory</th>
              <th className="p-3">Dealer</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created</th>
              <th className="p-3">Last Login</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {loading ? (
              <tr>
                <td colSpan={11} className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={11} className="p-6 text-center text-gray-500">
                  No users found
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3 font-medium">{u.username}</td>
                  <td className="p-3">{u.email}</td>

                  {/* ROLE */}
                  <td className="p-3">
                    <Badge color="blue">{u.roleDetails?.name || "—"}</Badge>
                  </td>

                  {/* REGION */}
                  <td className="p-3">
                    {u.region?.name || u.regionId || "—"}
                  </td>

                  {/* AREA */}
                  <td className="p-3">{u.areaId || "—"}</td>

                  {/* TERRITORY */}
                  <td className="p-3">{u.territoryId || "—"}</td>

                  {/* DEALER */}
                  <td className="p-3">
                    {u.dealer?.businessName ||
                      (u.dealerId ? `Dealer ${u.dealerId}` : "—")}
                  </td>

                  {/* STATUS */}
                  <td className="p-3">
                    {u.isBlocked ? (
                      <Badge color="red">Blocked</Badge>
                    ) : u.isActive ? (
                      <Badge color="green">Active</Badge>
                    ) : (
                      <Badge color="yellow">Inactive</Badge>
                    )}
                  </td>

                  {/* CREATED */}
                  <td className="p-3 text-sm text-gray-600">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  {/* LAST LOGIN */}
                  <td className="p-3 text-sm text-gray-600">
                    {u.lastLogin
                      ? new Date(u.lastLogin).toLocaleString()
                      : "—"}
                  </td>

                  {/* ACTIONS */}
                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-600">
                      <FaEdit />
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-600"
                    >
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* -------- PAGINATION -------- */}
      <div className="flex justify-between mt-4">
        <div>
          Page {page} of {totalPages} — {total} users
        </div>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Prev
          </button>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {/* -------- MODAL -------- */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-xl">
            <div className="flex justify-between mb-3">
              <h2 className="text-xl font-bold">
                {editingUser ? "Edit User" : "Add User"}
              </h2>
              <button onClick={() => setModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
              <input
                name="username"
                value={form.username}
                onChange={handleInput}
                placeholder="Username"
                className="border p-2 rounded col-span-2"
                required
              />

              <input
                name="email"
                value={form.email}
                onChange={handleInput}
                type="email"
                placeholder="Email"
                className="border p-2 rounded col-span-2"
                required
              />

              {!editingUser && (
                <input
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleInput}
                  placeholder="Password"
                  className="border p-2 rounded col-span-2"
                  required
                />
              )}

              <select
                name="roleId"
                value={form.roleId}
                onChange={handleInput}
                className="border p-2 rounded col-span-2"
                required
              >
                <option value="">Select Role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* REGION */}
              <select
                name="regionId"
                value={form.regionId}
                onChange={handleInput}
                className="border p-2 rounded"
              >
                <option value="">Region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>

              {/* DEALER */}
              <select
                name="dealerId"
                value={form.dealerId}
                onChange={handleInput}
                className="border p-2 rounded"
              >
                <option value="">Dealer</option>
                {dealers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.businessName}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-2 col-span-2">
                <input
                  type="checkbox"
                  name="isActive"
                  checked={form.isActive}
                  onChange={handleInput}
                />
                <label>Active</label>
              </div>

              <button
                type="submit"
                className="bg-orange-500 text-white px-4 py-2 rounded col-span-2"
              >
                {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
