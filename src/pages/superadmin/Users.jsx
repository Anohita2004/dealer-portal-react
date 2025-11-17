// src/pages/superadmin/Users.jsx
import React, { useEffect, useMemo, useState, useRef } from "react";
import api from "../../services/api";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaSearch,
  FaSort,
  FaSortUp,
  FaSortDown,
} from "react-icons/fa";

/**
 * Users.jsx
 *
 * - Works with backend responses like: { users: [...], total?, totalPages? }
 * - Features:
 *   • Search (debounced)
 *   • Filters (role / dealer / region)
 *   • Sorting
 *   • Pagination (works if backend returns total/totalPages, otherwise basic)
 *   • Add / Edit user modal (assign role, dealer, region)
 *   • Selecting a region in the modal filters dealers to that region
 *   • When editing/creating a user, the backend endpoint is called and (server-side)
 *     dealer.regionId will be updated as needed (this file expects that server logic)
 *   • Bulk actions: delete / activate / deactivate
 *
 * Copy-paste ready.
 */

export default function Users() {
  // data
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [regions, setRegions] = useState([]);

  // ui state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // search / filters / sort
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [filterDealer, setFilterDealer] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // modal / form
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    roleId: "",
    dealerId: "",
    regionId: "",
    isActive: true,
  });

  // bulk selection
  const [selected, setSelected] = useState(new Set());

  // debounce for search
  const debounceRef = useRef(null);
  useEffect(() => {
    // whenever filter/sort/pageSize/searchTerm changes, reset to page 1 and fetch
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchData(1);
    }, 350);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, filterRole, filterDealer, filterRegion, sortBy, sortOrder, pageSize]);

  // fetch data
  const fetchData = async (requestedPage = page) => {
    try {
      setLoading(true);

      const params = {
        page: requestedPage,
        pageSize,
        search: searchTerm || undefined,
        role: filterRole || undefined,
        dealer: filterDealer || undefined,
        region: filterRegion || undefined,
        sort: sortBy,
        order: sortOrder,
      };

      const [usersRes, rolesRes, dealersRes, regionsRes] = await Promise.all([
        api.get("/admin/users", { params }),
        api.get("/roles"),
        api.get("/dealers"),
        api.get("/regions"),
      ]);

      // Users (normalize)
      // Backend might return { users: [...] } or { data: [...] } or array
      const usersData = usersRes?.data?.users ?? usersRes?.data?.data ?? usersRes?.data ?? [];
      setUsers(Array.isArray(usersData) ? usersData : []);

      // Pagination metadata (if any)
      const totalFromRes = usersRes?.data?.total ?? usersRes?.data?.totalCount ?? null;
      const totalPagesFromRes = usersRes?.data?.totalPages ?? null;
      setTotal(totalFromRes ?? usersData.length);
      if (totalPagesFromRes) setTotalPages(totalPagesFromRes);
      else setTotalPages(Math.max(1, Math.ceil((totalFromRes ?? usersData.length) / pageSize)));

      // Roles / Dealers / Regions normalization (safe access)
      setRoles(rolesRes?.data?.roles ?? rolesRes?.data ?? []);
      setDealers(dealersRes?.data?.dealers ?? dealersRes?.data ?? []);
      setRegions(regionsRes?.data?.regions ?? regionsRes?.data ?? []);
    } catch (err) {
      console.error("Failed to load users & meta:", err);
      alert("Failed to load data. See console for details.");
    } finally {
      setLoading(false);
    }
  };

  // initial load + page changes
  useEffect(() => {
    fetchData(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // helpers
  const resetForm = () => {
    setForm({
      username: "",
      email: "",
      password: "",
      roleId: "",
      dealerId: "",
      regionId: "",
      isActive: true,
    });
    setEditingUser(null);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setForm({
      username: user.username ?? "",
      email: user.email ?? "",
      password: "",
      roleId: user.roleId ?? user.role ?? "",
      dealerId: user.dealerId ?? user.dealerId ?? user.dealer ?? "",
      regionId: user.regionId ?? user.regionId ?? "",
      isActive: typeof user.isActive === "boolean" ? user.isActive : true,
    });
    setModalOpen(true);
  };

  const openAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => {
      const next = { ...prev, [name]: type === "checkbox" ? checked : value };

      // If region changed in modal, clear dealer selection (so dealer chosen matches region)
      if (name === "regionId") next.dealerId = "";
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);

      const payload = {
        username: form.username,
        email: form.email,
        password: form.password || undefined, // don't send empty password if editing
        roleId: form.roleId || undefined,
        dealerId: form.dealerId || null,
        regionId: form.regionId || null,
        isActive: form.isActive,
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
      console.error("Save user error:", err);
      // try to show server message if present
      const serverMsg = err?.response?.data?.error ?? err?.response?.data?.message;
      alert(serverMsg || "Failed to save user - check console.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this user? This action is irreversible.")) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchData(1);
    } catch (err) {
      console.error("Delete user:", err);
      alert("Failed to delete user");
    }
  };

  const toggleActive = async (user) => {
    try {
      await api.put(`/admin/users/${user.id}`, { ...user, isActive: !user.isActive });
      fetchData(page);
    } catch (err) {
      console.error("Toggle active:", err);
      alert("Failed to change active status");
    }
  };

  // sorting
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
    setPage(1);
    fetchData(1);
  };

  const renderSortIcon = (column) => {
    if (sortBy !== column) return <FaSort className="inline-block ml-2 opacity-50" />;
    return sortOrder === "asc" ? <FaSortUp className="inline-block ml-2" /> : <FaSortDown className="inline-block ml-2" />;
  };

  // bulk selection
  const toggleSelect = (id) => {
    setSelected((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === users.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u.id)));
    }
  };

  const bulkDelete = async () => {
    if (selected.size === 0) {
      alert("Select at least one user.");
      return;
    }
    if (!window.confirm(`Delete ${selected.size} users?`)) return;
    try {
      setLoading(true);
      // replace with a real bulk endpoint if available for performance
      await Promise.all(Array.from(selected).map((id) => api.delete(`/admin/users/${id}`)));
      setSelected(new Set());
      fetchData(1);
    } catch (err) {
      console.error("Bulk delete failed:", err);
      alert("Some deletes failed. See console.");
    } finally {
      setLoading(false);
    }
  };

  const bulkSetActive = async (active) => {
    if (selected.size === 0) {
      alert("Select at least one user.");
      return;
    }
    if (!window.confirm(`${active ? "Activate" : "Deactivate"} ${selected.size} users?`)) return;
    try {
      setLoading(true);
      await Promise.all(Array.from(selected).map((id) => api.put(`/admin/users/${id}`, { isActive: active })));
      setSelected(new Set());
      fetchData(page);
    } catch (err) {
      console.error("Bulk update active failed:", err);
      alert("Bulk update failed");
    } finally {
      setLoading(false);
    }
  };

  // derived UI values
  const selectedCount = selected.size;
  const isAllSelected = users.length > 0 && selected.size === users.length;

  // memoized options
  const roleOptions = useMemo(() => roles, [roles]);
  const dealerOptions = useMemo(() => dealers, [dealers]);
  const regionOptions = useMemo(() => regions, [regions]);

  // When modal region selected, filter dealers shown in modal
  const filteredDealersForModal = useMemo(() => {
    if (!form.regionId) return dealerOptions;
    return dealerOptions.filter((d) => {
      // dealer.table may store regionId as "regionId" or "RegionId" — handle both
      return (d.regionId ?? d.RegionId ?? d.regionId ?? null) === form.regionId;
    });
  }, [dealerOptions, form.regionId]);

  // pagination helpers
  const gotoPage = (p) => {
    const newPage = Math.max(1, Math.min(p, totalPages));
    setPage(newPage);
    fetchData(newPage);
  };

  // small UI components
  const Badge = ({ children, color = "gray" }) => {
    const bg = {
      green: "bg-green-100 text-green-800",
      red: "bg-red-100 text-red-800",
      yellow: "bg-yellow-100 text-yellow-800",
      blue: "bg-blue-100 text-blue-800",
      gray: "bg-gray-100 text-gray-800",
    }[color];
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg}`}>{children}</span>;
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-sm text-gray-500">Manage users, roles, dealers, and regions.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded shadow hover:opacity-95"
          >
            <FaPlus /> Add User
          </button>

          <div className="flex items-center gap-2">
            <button onClick={() => bulkSetActive(true)} className="px-3 py-2 border rounded hover:bg-green-50" title="Activate selected">
              Activate
            </button>
            <button onClick={() => bulkSetActive(false)} className="px-3 py-2 border rounded hover:bg-yellow-50" title="Deactivate selected">
              Deactivate
            </button>
            <button onClick={bulkDelete} className="px-3 py-2 border rounded hover:bg-red-50 text-red-600" title="Delete selected">
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Filters/Search */}
      <div className="flex flex-col md:flex-row gap-3 items-start md:items-end mb-4">
        <div className="relative flex items-center w-full md:w-96">
          <FaSearch className="absolute left-3 text-gray-400" />
          <input
            className="pl-10 pr-3 py-2 border rounded w-full"
            placeholder="Search by username or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select
          value={filterRole}
          onChange={(e) => {
            setFilterRole(e.target.value);
            setPage(1);
            fetchData(1);
          }}
          className="border px-2 py-2 rounded"
        >
          <option value="">All Roles</option>
          {roleOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={filterDealer}
          onChange={(e) => {
            setFilterDealer(e.target.value);
            setPage(1);
            fetchData(1);
          }}
          className="border px-2 py-2 rounded"
        >
          <option value="">All Dealers</option>
          {dealerOptions.map((d) => (
            <option key={d.id} value={d.id}>
              {d.businessName}
            </option>
          ))}
        </select>

        <select
          value={filterRegion}
          onChange={(e) => {
            setFilterRegion(e.target.value);
            setPage(1);
            fetchData(1);
          }}
          className="border px-2 py-2 rounded"
        >
          <option value="">All Regions</option>
          {regionOptions.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={pageSize}
          onChange={(e) => {
            setPageSize(Number(e.target.value));
            setPage(1);
            fetchData(1);
          }}
          className="border px-2 py-2 rounded"
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
          <option value={25}>25 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded">
        <table className="min-w-full divide-y">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-3">
                <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} />
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("username")}>
                Username {renderSortIcon("username")}
              </th>
              <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("email")}>
                Email {renderSortIcon("email")}
              </th>
              <th className="p-3 text-left">Role</th>
              <th className="p-3 text-left">Dealer</th>
              <th className="p-3 text-left">Region</th>
              <th className="p-3 text-left cursor-pointer" onClick={() => toggleSort("isActive")}>
                Status {renderSortIcon("isActive")}
              </th>
              <th className="p-3 text-left">Actions</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3">
                    <input type="checkbox" checked={selected.has(u.id)} onChange={() => toggleSelect(u.id)} />
                  </td>

                  <td className="p-3">
                    <div className="font-medium">{u.username}</div>
                    <div className="text-xs text-gray-500">{u.email}</div>
                  </td>

                  <td className="p-3 text-sm">{u.email}</td>

                  <td className="p-3">
                    <div className="inline-block">
                      <Badge color="blue">{u.role ?? u.roleName ?? "—"}</Badge>
                    </div>
                  </td>

                  <td className="p-3">
                    {u.dealer ? (
                      <div>
                        <div className="font-medium">{u.dealer.businessName}</div>
                        <div className="text-xs text-gray-500">{u.dealer.dealerCode || ""}</div>
                      </div>
                    ) : u.dealerId ? (
                      <div className="text-sm text-gray-700">Dealer ID: {u.dealerId}</div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>

                  <td className="p-3">
                    {u.region ? <Badge color="green">{u.region.name}</Badge> : u.regionId ? <Badge color="gray">assigned</Badge> : <span className="text-sm text-gray-400">—</span>}
                  </td>

                  <td className="p-3">
                    {u.isBlocked ? (
                      <Badge color="red">Blocked</Badge>
                    ) : u.isActive ? (
                      <Badge color="green">Active</Badge>
                    ) : (
                      <Badge color="yellow">Inactive</Badge>
                    )}
                  </td>

                  <td className="p-3 flex gap-2">
                    <button onClick={() => openEdit(u)} className="text-blue-600 hover:underline">
                      <FaEdit />
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-600 hover:underline">
                      <FaTrash />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination & summary */}
      <div className="flex items-center justify-between gap-4 mt-4">
        <div className="text-sm text-gray-600">
          Showing page {page} of {totalPages} — {total ?? users.length} total
        </div>

        <div className="flex items-center gap-2">
          <button onClick={() => gotoPage(1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            « First
          </button>
          <button onClick={() => gotoPage(page - 1)} disabled={page === 1} className="px-3 py-1 border rounded disabled:opacity-50">
            ‹ Prev
          </button>

          <span className="px-3 py-1 border rounded bg-gray-50">{page}</span>

          <button onClick={() => gotoPage(page + 1)} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            Next ›
          </button>
          <button onClick={() => gotoPage(totalPages)} disabled={page === totalPages} className="px-3 py-1 border rounded disabled:opacity-50">
            Last »
          </button>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">{editingUser ? "Edit User" : "Add User"}</h2>
              <button onClick={() => { setModalOpen(false); resetForm(); }} className="text-gray-500">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Username</label>
                <input name="username" value={form.username} onChange={handleInput} required className="w-full border px-3 py-2 rounded" />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleInput} required className="w-full border px-3 py-2 rounded" />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-sm font-medium mb-1">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleInput} required className="w-full border px-3 py-2 rounded" />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Role</label>
                <select name="roleId" value={form.roleId} onChange={handleInput} required className="w-full border px-3 py-2 rounded">
                  <option value="">Select role</option>
                  {roleOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Region</label>
                <select name="regionId" value={form.regionId || ""} onChange={handleInput} className="w-full border px-3 py-2 rounded">
                  <option value="">Select region</option>
                  {regionOptions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Dealer</label>
                <select name="dealerId" value={form.dealerId || ""} onChange={handleInput} className="w-full border px-3 py-2 rounded">
                  <option value="">Select dealer</option>
                  {filteredDealersForModal.map((d) => <option key={d.id} value={d.id}>{d.businessName}</option>)}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input type="checkbox" name="isActive" checked={form.isActive} onChange={handleInput} />
                <label className="text-sm">Active</label>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 mt-3">
                <button type="button" onClick={() => { setModalOpen(false); resetForm(); }} className="px-4 py-2 border rounded">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-orange-500 text-white rounded">{saving ? "Saving..." : (editingUser ? "Update user" : "Create user")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
