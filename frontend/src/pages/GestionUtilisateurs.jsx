import { useState } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import { STORAGE_KEYS, logAudit, AUDIT_ACTIONS, getData, setData } from "../services/dataStore";
import {
  USER_PROFILES,
  getDefaultPermissions,
} from "../services/modulesReporting";

const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 8,
  border: "0.5px solid #DDD9D0",
  background: "#FEFCF9",
  fontSize: 13.5,
  fontFamily: "'DM Sans', sans-serif",
  color: "#1A1917",
  outline: "none",
};
const labelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: "#6B6760",
  marginBottom: 6,
  display: "block",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const thStyle = {
  padding: "12px 16px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 500,
  color: "#A8A49C",
  textTransform: "uppercase",
  letterSpacing: "0.04em",
};
const tdStyle = (extra = {}) => ({
  padding: "13px 16px",
  color: "#6B6760",
  ...extra,
});

const AddBtn = ({ onClick, label }) => (
  <button
    onClick={onClick}
    style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      background: "#1A1917",
      color: "#F5F0E8",
      border: "none",
      borderRadius: 8,
      padding: "8px 14px",
      fontSize: 12.5,
      fontFamily: "'DM Sans', sans-serif",
      cursor: "pointer",
      fontWeight: 500,
    }}
  >
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path
        d="M6 1v10M1 6h10"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
    {label}
  </button>
);
const EmptyState = ({ message }) => (
  <div
    style={{
      background: "#FEFCF9",
      border: "0.5px solid #E8E4DC",
      borderRadius: 12,
      padding: "48px 24px",
      textAlign: "center",
    }}
  >
    <div style={{ fontSize: 13.5, color: "#A8A49C" }}>{message}</div>
  </div>
);
const FormCard = ({ title, onSave, onCancel, saveLabel, children }) => (
  <div
    style={{
      background: "#FEFCF9",
      border: "0.5px solid #E8E4DC",
      borderRadius: 12,
      padding: 24,
      marginBottom: 20,
    }}
  >
    <div
      style={{
        fontFamily: "'Syne', sans-serif",
        fontSize: 14,
        fontWeight: 600,
        color: "#1A1917",
        marginBottom: 20,
      }}
    >
      {title}
    </div>
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16,
        marginBottom: 16,
      }}
    >
      {children}
    </div>
    <div style={{ display: "flex", gap: 10 }}>
      <button
        onClick={onSave}
        style={{
          background: "#1A1917",
          color: "#F5F0E8",
          border: "none",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
          fontWeight: 500,
        }}
      >
        {saveLabel}
      </button>
      <button
        onClick={onCancel}
        style={{
          background: "transparent",
          color: "#6B6760",
          border: "0.5px solid #DDD9D0",
          borderRadius: 8,
          padding: "10px 20px",
          fontSize: 13,
          fontFamily: "'DM Sans', sans-serif",
          cursor: "pointer",
        }}
      >
        Annuler
      </button>
    </div>
  </div>
);
const StatusBadge = ({ status }) => {
  const c = {
    Actif: { bg: "#EAF4E2", color: "#3B6D11" },
    Inactif: { bg: "#F5F0E8", color: "#6B6760" },
  };
  const s = c[status] || c["Inactif"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      {status}
    </span>
  );
};
const RoleBadge = ({ role }) => {
  const c = {
    Admin: { bg: "#1A1917", color: "#F5F0E8" },
    Ordonnateur: { bg: "#3C3489", color: "#F5F0E8" },
    Comptable: { bg: "#8B6914", color: "#FEFCF9" },
    Gestionnaire: { bg: "#185FA5", color: "#F5F0E8" },
    Auditeur: { bg: "#6B6760", color: "#FEFCF9" },
  };
  const s = c[role] || c["Gestionnaire"];
  return (
    <span
      style={{
        background: s.bg,
        color: s.color,
        padding: "2px 8px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      {role}
    </span>
  );
};

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState(() => getData(STORAGE_KEYS.USERS, []));
  const [form, setForm] = useState({
    username: "",
    email: "",
    full_name: "",
    profile_id: "budget",
    status: "Actif",
    password: "",
    permissions: getDefaultPermissions("budget"),
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const saveUsers = (list) => {
    setUsers(list);
    setData(STORAGE_KEYS.USERS, list);
  };

  const onProfileChange = (profileId) => {
    setForm({
      ...form,
      profile_id: profileId,
      permissions: getDefaultPermissions(profileId),
    });
  };

  const submit = () => {
    if (!form.username || !form.email || !form.full_name) {
      alert("Nom d'utilisateur, email et nom complet sont obligatoires.");
      return;
    }
    const profile = USER_PROFILES.find((p) => p.id === form.profile_id);
    const entry = {
      ...form,
      _id: editId || Date.now(),
      role: profile?.label || form.profile_id,
      permissions: form.permissions || getDefaultPermissions(form.profile_id),
      updated_at: new Date().toISOString(),
    };
    delete entry.password;

    if (editId) {
      saveUsers(users.map((u) => (u._id === editId ? entry : u)));
      logAudit(AUDIT_ACTIONS.UPDATE, "USER", editId, {
        username: entry.username,
        profile: entry.profile_id,
      });
      setEditId(null);
    } else {
      saveUsers([...users, entry]);
      logAudit(AUDIT_ACTIONS.CREATE, "USER", entry._id, {
        username: entry.username,
        profile: entry.profile_id,
      });
    }
    setForm({
      username: "",
      email: "",
      full_name: "",
      profile_id: "budget",
      status: "Actif",
      password: "",
      permissions: getDefaultPermissions("budget"),
    });
    setShowForm(false);
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        overflow: "hidden",
      }}
    >
      <Topbar title="Gestion des Utilisateurs et Habilitations" />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          background: "#F6F5F2",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: "'Syne', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#1A1917",
              }}
            >
              Utilisateurs
            </div>
            <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
              Gestion des accès et habilitations
            </div>
          </div>
          <AddBtn
            onClick={() => setShowForm(true)}
            label="Nouvel Utilisateur"
          />
        </div>
        {showForm && (
          <FormCard
            title={editId ? "Modifier" : "Nouvel utilisateur"}
            onSave={submit}
            onCancel={() => {
              setShowForm(false);
              setEditId(null);
              setForm({
                username: "",
                email: "",
                full_name: "",
                role: "Gestionnaire",
                status: "Actif",
                password: "",
              });
            }}
            saveLabel={editId ? "Mettre à jour" : "Enregistrer"}
          >
            <div>
              <label style={labelStyle}>Nom d'utilisateur *</label>
              <input
                type="text"
                placeholder="ex: jdupont"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Nom complet *</label>
              <input
                type="text"
                placeholder="ex: Jean Dupont"
                value={form.full_name}
                onChange={(e) =>
                  setForm({ ...form, full_name: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Email *</label>
              <input
                type="email"
                placeholder="ex: jean@exemple.ma"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Mot de passe {!editId && "*"}</label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Profil CPS *</label>
              <select
                value={form.profile_id}
                onChange={(e) => onProfileChange(e.target.value)}
                style={inputStyle}
              >
                {USER_PROFILES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Statut</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                style={inputStyle}
              >
                <option>Actif</option>
                <option>Inactif</option>
              </select>
            </div>
          </FormCard>
        )}
        {users.length > 0 ? (
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              overflow: "hidden",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#F6F5F2",
                    borderBottom: "0.5px solid #E8E4DC",
                  }}
                >
                  {[
                    "Utilisateur",
                    "Nom",
                    "Email",
                    "Rôle",
                    "Statut",
                    "Actions",
                  ].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <tr
                    key={u._id}
                    style={{
                      borderBottom:
                        i < users.length - 1 ? "0.5px solid #F2EFE8" : "none",
                    }}
                  >
                    <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>
                      {u.username}
                    </td>
                    <td style={tdStyle()}>{u.full_name}</td>
                    <td style={tdStyle()}>{u.email}</td>
                    <td style={tdStyle()}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td style={tdStyle()}>
                      <StatusBadge status={u.status} />
                    </td>
                    <td style={tdStyle()}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => {
                            setForm({
                              ...u,
                              profile_id:
                                u.profile_id ||
                                USER_PROFILES.find((p) => p.label === u.role)?.id ||
                                "budget",
                              permissions:
                                u.permissions ||
                                getDefaultPermissions(u.profile_id || "budget"),
                            });
                            setEditId(u._id);
                            setShowForm(true);
                          }}
                          style={{
                            background: "#F2EFE8",
                            border: "0.5px solid #DDD9D0",
                            borderRadius: 6,
                            padding: "5px 12px",
                            fontSize: 12,
                            color: "#1A1917",
                            cursor: "pointer",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        >
                          Modifier
                        </button>
                        {u.profile_id !== "super_admin" && u.role !== "Admin" && (
                          <DeleteIconButton
                            onConfirm={() => {
                              saveUsers(users.filter((x) => x._id !== u._id));
                              logAudit(AUDIT_ACTIONS.DELETE, "USER", u._id, {
                                username: u.username,
                              });
                            }}
                            message="Supprimer ?"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !showForm && (
            <EmptyState message='Aucun utilisateur. Cliquez sur "Nouvel Utilisateur" pour commencer.' />
          )
        )}
      </div>
    </div>
  );
}
