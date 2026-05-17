import { useState, useEffect } from "react";
import Topbar from "../components/Topbar";
import DeleteIconButton from "../components/DeleteIconButton";
import { logAudit, AUDIT_ACTIONS, linkDocument, STORAGE_KEYS, getData, setData } from "../services/dataStore";
import {
  GED_DOC_TYPES,
  getGedDocuments,
  saveGedDocuments,
  getGedVersions,
  saveGedVersions,
  getNextGedReference,
  exportGedListCsv,
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
const formatNumber = (v) => Number(v || 0).toLocaleString("fr-FR");

export default function GestionGED() {
  const [documents, setDocuments] = useState(() => getGedDocuments());
  const [documentVersions, setDocumentVersions] = useState(() =>
    getGedVersions(),
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [expiringDocs, setExpiringDocs] = useState([]);
  const [filterExercice, setFilterExercice] = useState("all");
  const [form, setForm] = useState({
    reference: getNextGedReference(),
    title: "",
    type: "BC",
    entity_type: "COMMANDE",
    entity_id: "",
    file_path: "",
    file_size: "",
    mime_type: "",
    date: new Date().toISOString().split("T")[0],
    expiry_date: "",
    description: "",
    tags: [],
  });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [commandes] = useState(() => getData(STORAGE_KEYS.COMMANDES, []));
  const [suppliers] = useState(() => getData(STORAGE_KEYS.FOURNISSEURS, []));
  const [engagements] = useState(() => getData(STORAGE_KEYS.ENGAGEMENTS, []));
  const [ordonnances] = useState(() => getData(STORAGE_KEYS.ORDONNANCES, []));
  const [exercices] = useState(() => getData(STORAGE_KEYS.EXERCICES, []));

  const save = (list) => {
    setDocuments(list);
    saveGedDocuments(list);
  };

  const saveVersions = (versions) => {
    setDocumentVersions(versions);
    saveGedVersions(versions);
  };

  useEffect(() => {
    const today = new Date();
    const in30 = new Date();
    in30.setDate(today.getDate() + 30);
    setExpiringDocs(
      documents.filter((doc) => {
        if (!doc.expiry_date) return false;
        const exp = new Date(doc.expiry_date);
        return exp >= today && exp <= in30;
      }),
    );
  }, [documents]);

  const getBc = (id) => {
    const b = commandes.find((x) => String(x._id) === String(id));
    return b ? b.reference || "BC-" + b._id : "-";
  };

  const getEntityLabel = (entityType, entityId) => {
    switch (entityType) {
      case "COMMANDE":
        return getBc(entityId);
      case "PAIEMENT":
        const p = getData(STORAGE_KEYS.PAIEMENTS, []).find(
          (x) => String(x._id) === String(entityId),
        );
        return p ? p.reference : "-";
      case "FOURNISSEUR":
        const s = suppliers.find((x) => String(x._id) === String(entityId));
        return s ? s.company_name : "-";
      case "ENGAGEMENT":
        const e = engagements.find((x) => String(x._id) === String(entityId));
        return e ? e.reference : "-";
      case "ORDONNANCE":
        const o = ordonnances.find((x) => String(x._id) === String(entityId));
        return o ? o.reference : "-";
      default:
        return "-";
    }
  };

  const submit = () => {
    if (!form.reference || !form.title || !form.file_path?.trim()) {
      alert("Référence, titre et chemin/fichier du document sont obligatoires.");
      return;
    }

    const entityId =
      form.entity_id ||
      (form.entity_type === "COMMANDE" ? form.bc_id : "") ||
      "";
    const entry = {
      ...form,
      entity_id: entityId,
      bc_id: form.entity_type === "COMMANDE" ? entityId : form.bc_id || "",
      _id: editId || Date.now(),
      version: 1,
      uploaded_at: new Date().toISOString(),
      uploaded_by: "Superviseur",
      file_size: form.file_size ? Number(form.file_size) : 0,
    };

    if (editId) {
      // Create new version
      const oldDoc = documents.find((d) => d._id === editId);
      if (oldDoc) {
        // Save old version to version history
        const versions = { ...documentVersions };
        if (!versions[editId]) {
          versions[editId] = [];
        }
        versions[editId].push({
          ...oldDoc,
          version: oldDoc.version + 1,
          archived_at: new Date().toISOString(),
        });
        saveVersions(versions);

        // Update document
        entry.version = oldDoc.version + 1;
      }

      save(documents.map((d) => (d._id === editId ? entry : d)));

      logAudit(AUDIT_ACTIONS.UPDATE, "DOCUMENT", editId, {
        reference: form.reference,
        title: form.title,
        version: entry.version,
      });

      setEditId(null);
    } else {
      save([...documents, entry]);

      // Link document to entity if specified
      if (form.entity_type && form.entity_id) {
        linkDocument(form.entity_type, form.entity_id, {
          document_id: entry._id,
          title: form.title,
          type: form.type,
          file_path: form.file_path,
        });
      }

      logAudit(AUDIT_ACTIONS.CREATE, "DOCUMENT", entry._id, {
        reference: form.reference,
        title: form.title,
        entity_type: form.entity_type,
      });
    }

    setForm({
      reference: getNextGedReference(),
      title: "",
      type: "BC",
      entity_type: "COMMANDE",
      entity_id: "",
      exercice_id: "",
      file_path: "",
      file_size: "",
      mime_type: "",
      date: new Date().toISOString().split("T")[0],
      expiry_date: "",
      description: "",
      tags: [],
    });
    setShowForm(false);
  };

  const docTypes = GED_DOC_TYPES;

  const entityTypes = [
    { value: "COMMANDE", label: "Bon de Commande" },
    { value: "FOURNISSEUR", label: "Fournisseur" },
    { value: "ENGAGEMENT", label: "Engagement" },
    { value: "ORDONNANCE", label: "Ordonnance" },
    { value: "PAIEMENT", label: "Paiement" },
    { value: "AUTRE", label: "Autre" },
  ];

  const entityOptionsForForm = () => {
    switch (form.entity_type) {
      case "COMMANDE":
        return commandes.map((bc) => ({
          id: String(bc._id),
          label: bc.reference || `BC-${bc._id}`,
        }));
      case "FOURNISSEUR":
        return suppliers.map((s) => ({
          id: String(s._id),
          label: s.company_name || s.name,
        }));
      case "ENGAGEMENT":
        return engagements.map((e) => ({
          id: String(e._id),
          label: e.reference || `ENG-${e._id}`,
        }));
      case "ORDONNANCE":
        return ordonnances.map((o) => ({
          id: String(o._id),
          label: o.reference || `OP-${o._id}`,
        }));
      case "PAIEMENT": {
        const paiements = getData(STORAGE_KEYS.PAIEMENTS, []);
        return paiements.map((p) => ({
          id: String(p._id),
          label: p.reference || `PAI-${p._id}`,
        }));
      }
      default:
        return [];
    }
  };

  // Filter documents based on search and filters
  const filteredDocuments = documents.filter((doc) => {
    if (
      filterExercice !== "all" &&
      String(doc.exercice_id) !== String(filterExercice)
    ) {
      return false;
    }
    if (filterType !== "all" && doc.type !== filterType) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        doc.reference?.toLowerCase().includes(query) ||
        doc.title?.toLowerCase().includes(query) ||
        doc.description?.toLowerCase().includes(query) ||
        doc.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }
    return true;
  });

  // Get document type icon
  const getDocIcon = (type) => {
    const icons = {
      BC: "📋",
      Devis: "📄",
      OP: "💰",
      PV: "✅",
      Facture: "🧾",
      "Bon de livraison": "📦",
      Contrat: "📝",
      Attestation: "🏆",
      RIB: "🏦",
      "Attestation fiscale": "🏛️",
      "Attestation CNSS": "🏥",
      Autre: "📎",
    };
    return icons[type] || "📎";
  };

  // Check if document is expired
  const isExpired = (doc) => {
    if (!doc.expiry_date) return false;
    return new Date(doc.expiry_date) < new Date();
  };

  // Check if document is expiring soon (within 30 days)
  const isExpiringSoon = (doc) => {
    if (!doc.expiry_date) return false;
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const expiryDate = new Date(doc.expiry_date);
    return expiryDate >= today && expiryDate <= thirtyDaysFromNow;
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
      <Topbar title="Gestion Électronique des Documents (GED)" />
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
              Documents
            </div>
            <div style={{ fontSize: 12, color: "#A8A49C", marginTop: 2 }}>
              Archivage électronique des documents
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <AddBtn onClick={() => setShowForm(true)} label="Nouveau Document" />
            <button
              type="button"
              onClick={() => exportGedListCsv(filteredDocuments)}
              style={{
                background: "#F2EFE8",
                border: "0.5px solid #DDD9D0",
                borderRadius: 8,
                padding: "8px 14px",
                fontSize: 12,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              Export CSV
            </button>
          </div>
        </div>
        {showForm && (
          <FormCard
            title={editId ? "Modifier" : "Nouveau document"}
            onSave={submit}
            onCancel={() => {
              setShowForm(false);
              setEditId(null);
              setForm({
                reference: getNextGedReference(),
                title: "",
                type: "BC",
                entity_type: "COMMANDE",
                entity_id: "",
                exercice_id: "",
                file_path: "",
                file_size: "",
                mime_type: "",
                date: new Date().toISOString().split("T")[0],
                expiry_date: "",
                description: "",
                tags: [],
              });
            }}
            saveLabel={editId ? "Mettre à jour" : "Enregistrer"}
          >
            <div>
              <label style={labelStyle}>Référence *</label>
              <input
                type="text"
                placeholder="ex: DOC-2026-001"
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Titre *</label>
              <input
                type="text"
                placeholder="ex: Bon de commande N°..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                style={inputStyle}
              >
                {docTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Exercice</label>
              <select
                value={form.exercice_id || ""}
                onChange={(e) =>
                  setForm({ ...form, exercice_id: e.target.value })
                }
                style={inputStyle}
              >
                <option value="">— Non renseigné —</option>
                {exercices.map((ex) => (
                  <option key={ex._id} value={String(ex._id)}>
                    {ex.label || ex.year || ex._id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Type d'entité</label>
              <select
                value={form.entity_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    entity_type: e.target.value,
                    entity_id: "",
                  })
                }
                style={inputStyle}
              >
                {entityTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Référence entité</label>
              <select
                value={form.entity_id || form.bc_id || ""}
                onChange={(e) =>
                  setForm({
                    ...form,
                    entity_id: e.target.value,
                    bc_id: e.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="">— Aucune —</option>
                {entityOptionsForForm().map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Chemin / fichier *</label>
              <input
                type="text"
                placeholder="ex: /docs/bc-001.pdf"
                value={form.file_path}
                onChange={(e) =>
                  setForm({ ...form, file_path: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Expiration</label>
              <input
                type="date"
                value={form.expiry_date || ""}
                onChange={(e) =>
                  setForm({ ...form, expiry_date: e.target.value })
                }
                style={inputStyle}
              />
            </div>
            <div style={{ gridColumn: "1/-1" }}>
              <label style={labelStyle}>Description</label>
              <textarea
                placeholder="Description du document..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                style={{ ...inputStyle, minHeight: 60 }}
              />
            </div>
          </FormCard>
        )}
        {expiringDocs.length > 0 && (
          <div
            style={{
              background: "#FAEEDA",
              border: "0.5px solid #E8D4A8",
              borderRadius: 10,
              padding: "12px 16px",
              marginBottom: 16,
              fontSize: 13,
              color: "#854F0B",
            }}
          >
            {expiringDocs.length} document(s) expirent dans les 30 prochains jours.
          </div>
        )}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginBottom: 16,
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            placeholder="Rechercher…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ ...inputStyle, maxWidth: 220 }}
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ ...inputStyle, maxWidth: 160 }}
          >
            <option value="all">Tous types</option>
            {docTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={filterExercice}
            onChange={(e) => setFilterExercice(e.target.value)}
            style={{ ...inputStyle, maxWidth: 160 }}
          >
            <option value="all">Tous exercices</option>
            {exercices.map((ex) => (
              <option key={ex._id} value={String(ex._id)}>
                {ex.label || ex.year}
              </option>
            ))}
          </select>
        </div>
        {selectedDocument && (
          <div
            style={{
              background: "#FEFCF9",
              border: "0.5px solid #E8E4DC",
              borderRadius: 12,
              padding: 16,
              marginBottom: 16,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              Versions — {selectedDocument.reference}
            </div>
            {(documentVersions[selectedDocument._id] || []).length === 0 ? (
              <div style={{ fontSize: 13, color: "#6B6760" }}>
                Aucune version archivée.
              </div>
            ) : (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13 }}>
                {(documentVersions[selectedDocument._id] || []).map((v) => (
                  <li key={v.archived_at}>
                    v{v.version} — {v.file_path} (
                    {new Date(v.archived_at).toLocaleDateString("fr-FR")})
                  </li>
                ))}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setSelectedDocument(null)}
              style={{
                marginTop: 12,
                background: "transparent",
                border: "0.5px solid #DDD9D0",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Fermer
            </button>
          </div>
        )}
        {filteredDocuments.length > 0 ? (
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
                  {["Réf", "Titre", "Type", "Entité", "Date", "Actions"].map(
                    (h) => (
                      <th key={h} style={thStyle}>
                        {h}
                      </th>
                    ),
                  )}
                </tr>
              </thead>
              <tbody>
                {filteredDocuments.map((d, i) => (
                  <tr
                    key={d._id}
                    style={{
                      borderBottom:
                        i < filteredDocuments.length - 1
                          ? "0.5px solid #F2EFE8"
                          : "none",
                    }}
                  >
                    <td style={tdStyle({ fontWeight: 600, color: "#1A1917" })}>
                      {d.reference}
                    </td>
                    <td style={tdStyle()}>{d.title}</td>
                    <td style={tdStyle()}>
                      <span
                        style={{
                          background: "#E8F0FA",
                          color: "#185FA5",
                          padding: "2px 8px",
                          borderRadius: 20,
                          fontSize: 11.5,
                          fontWeight: 500,
                        }}
                      >
                        {d.type}
                      </span>
                    </td>
                    <td style={tdStyle()}>
                      {getEntityLabel(
                        d.entity_type || "COMMANDE",
                        d.entity_id || d.bc_id,
                      )}
                    </td>
                    <td style={tdStyle()}>
                      {new Date(d.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td style={tdStyle()}>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => setSelectedDocument(d)}
                          style={{
                            background: "#3C3489",
                            color: "#F5F0E8",
                            border: "none",
                            borderRadius: 6,
                            padding: "5px 12px",
                            fontSize: 12,
                            cursor: "pointer",
                            fontFamily: "'DM Sans',sans-serif",
                          }}
                        >
                          Versions
                        </button>
                        <button
                          onClick={() => {
                            setForm(d);
                            setEditId(d._id);
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
                        <DeleteIconButton
                          onConfirm={() =>
                            save(documents.filter((x) => x._id !== d._id))
                          }
                          message="Supprimer ?"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !showForm && (
            <EmptyState message='Aucun document. Cliquez sur "Nouveau Document" pour commencer.' />
          )
        )}
      </div>
    </div>
  );
}
