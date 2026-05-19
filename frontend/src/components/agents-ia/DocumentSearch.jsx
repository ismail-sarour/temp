import React, { useState, useEffect } from "react";
import "./DocumentSearch.css";

const mockDocuments = [
  {
    id: "1",
    title: "Supplier Contract - Q3 2024",
    type: "Contract",
    preview: "This contract outlines terms for Q3 2024 supply...", // Simplified preview
    content:
      "This is the full content of the supplier contract for Q3 2024. It includes clauses on delivery, payment, and quality assurance. Specific terms include Net 30 payment and a 5% quality guarantee.",
    keywords: [
      "supplier",
      "contract",
      "Q3",
      "2024",
      "delivery",
      "payment",
      "quality",
    ],
    confidence: 0.95,
    aiInsights: ["This document references delayed payment procedures."],
  },
  {
    id: "2",
    title: "Budget Report - Marketing Department H1 2024",
    type: "Report",
    preview: "H1 2024 marketing budget allocation and expenditure.",
    content:
      "Detailed budget report for the Marketing Department for the first half of 2024. Key areas of expenditure include digital advertising, social media campaigns, and event sponsorships. Revenue generation initiatives are also outlined. This report shows a 10% overspend in digital advertising.",
    keywords: [
      "budget",
      "report",
      "marketing",
      "H1",
      "2024",
      "expenditure",
      "revenue",
    ],
    confidence: 0.88,
    aiInsights: ["3 similar budget anomalies detected."],
  },
  {
    id: "3",
    title: "Audit Document - Internal Review 2023",
    type: "Audit",
    preview: "Summary of findings from the 2023 internal audit.",
    content:
      "Comprehensive audit document detailing findings from the 2023 internal review. Covers financial records, operational efficiency, and compliance. Several minor discrepancies were noted in article 4 regarding data handling.",
    keywords: ["audit", "internal review", "2023", "financial", "compliance"],
    confidence: 0.92,
    aiInsights: ["Potential compliance issue identified in article 4."],
  },
  {
    id: "4",
    title: "Quotation - Cloud Services Upgrade",
    type: "Quotation",
    preview: "Quotation for upgrading cloud infrastructure services.",
    content:
      "Quotation provided by Tech Solutions for upgrading our cloud services. Includes pricing for various tiers, service level agreements, and implementation timelines. Expires in 30 days.",
    keywords: ["quotation", "cloud services", "upgrade", "pricing", "SLA"],
    confidence: 0.85,
    aiInsights: [],
  },
  {
    id: "5",
    title: "Payment Record - Vendor X Invoice #12345",
    type: "Payment",
    preview: "Record of payment for Vendor X invoice #12345.",
    content:
      "This document confirms payment for invoice #12345 to Vendor X. Payment was processed on 2024-05-15 via bank transfer. Total amount: $15,000.",
    keywords: ["payment", "record", "vendor", "invoice", "bank transfer"],
    confidence: 0.98,
    aiInsights: [],
  },
  {
    id: "6",
    title: "Regulatory File - GDPR Compliance Guide",
    type: "Regulatory",
    preview: "Guidelines for ensuring GDPR compliance.",
    content:
      "Official regulatory file outlining guidelines and requirements for GDPR compliance. Covers data privacy, consent management, and data breach protocols. Mandatory annual review.",
    keywords: ["regulatory", "GDPR", "compliance", "data privacy"],
    confidence: 0.96,
    aiInsights: [],
  },
  {
    id: "7",
    title: "Engagement Document - Project Alpha Kick-off",
    type: "Engagement",
    preview: "Meeting minutes and agenda for Project Alpha kick-off.",
    content:
      "Engagement document for the Project Alpha kick-off meeting. Agenda included project scope, team roles, and initial timelines. Key decisions made on phase 1 deliverables.",
    keywords: ["engagement", "project", "alpha", "kick-off", "meeting"],
    confidence: 0.89,
    aiInsights: [],
  },
];

const DocumentSearch = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [suggestedSearches, setSuggestedSearches] = useState([
    "Supplier Contracts",
    "Budget Reports 2024",
    "GDPR Compliance",
    "Audit Findings",
  ]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 5;

  useEffect(() => {
    // Load recent searches from local storage
    const storedSearches = localStorage.getItem("recentSearches");
    if (storedSearches) {
      setRecentSearches(JSON.parse(storedSearches));
    }
  }, []);

  useEffect(() => {
    // Save recent searches to local storage
    localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
  }, [recentSearches]);

  const handleSearch = (term = searchTerm) => {
    if (!term.trim()) return;

    setLoading(true);
    setSelectedDocument(null);
    setCurrentPage(1);

    // Simulate API call
    setTimeout(() => {
      const filteredResults = mockDocuments.filter((doc) => {
        const searchLower = term.toLowerCase();
        return (
          doc.title.toLowerCase().includes(searchLower) ||
          doc.content.toLowerCase().includes(searchLower) ||
          doc.keywords.some((keyword) =>
            keyword.toLowerCase().includes(searchLower),
          )
        );
      });
      setSearchResults(filteredResults);
      setLoading(false);

      // Add to recent searches
      setRecentSearches((prev) => {
        const newSearches = [term, ...prev.filter((s) => s !== term)];
        return newSearches.slice(0, 5); // Keep last 5 recent searches
      });
    }, 1000);
  };

  const highlightKeywords = (text, keywords) => {
    let highlightedText = text;
    keywords.forEach((keyword) => {
      const regex = new RegExp(`(${keyword})`, "gi");
      highlightedText = highlightedText.replace(regex, "<mark>$1</mark>");
    });
    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  const getDocumentTypeBadgeClass = (type) => {
    switch (type.toLowerCase()) {
      case "contract":
        return "badge-contract";
      case "report":
        return "badge-report";
      case "audit":
        return "badge-audit";
      case "quotation":
        return "badge-quotation";
      case "payment":
        return "badge-payment";
      case "regulatory":
        return "badge-regulatory";
      case "engagement":
        return "badge-engagement";
      default:
        return "badge-default";
    }
  };

  const indexOfLastResult = currentPage * resultsPerPage;
  const indexOfFirstResult = indexOfLastResult - resultsPerPage;
  const currentResults = searchResults.slice(
    indexOfFirstResult,
    indexOfLastResult,
  );
  const totalPages = Math.ceil(searchResults.length / resultsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="document-search-container">
      <h1 className="search-title">Intelligent Document Search</h1>

      <div className="search-bar-container">
        <input
          type="text"
          className="search-input"
          placeholder="Search documents, reports, contracts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              handleSearch();
            }
          }}
        />
        <button className="search-button" onClick={() => handleSearch()}>
          Search
        </button>
      </div>

      <div className="search-suggestions">
        <strong>Recent:</strong>
        {recentSearches.map((term, index) => (
          <span
            key={index}
            className="suggestion-tag"
            onClick={() => {
              setSearchTerm(term);
              handleSearch(term);
            }}
          >
            {term}
          </span>
        ))}
        <strong>Suggested:</strong>
        {suggestedSearches.map((term, index) => (
          <span
            key={index}
            className="suggestion-tag"
            onClick={() => {
              setSearchTerm(term);
              handleSearch(term);
            }}
          >
            {term}
          </span>
        ))}
      </div>

      {loading && (
        <div className="loading-state">Searching for documents...</div>
      )}

      {!loading && searchResults.length === 0 && searchTerm && (
        <div className="empty-state">
          No documents found for "{searchTerm}". Try a different search term.
        </div>
      )}

      {!loading && searchResults.length > 0 && (
        <div className="search-results-layout">
          <div className="search-results-list">
            {currentResults.map((doc) => (
              <div
                key={doc.id}
                className="document-card"
                onClick={() => setSelectedDocument(doc)}
              >
                <div className="document-card-header">
                  <span
                    className={`document-type-badge ${getDocumentTypeBadgeClass(doc.type)}`}
                  >
                    {doc.type}
                  </span>
                  <span className="confidence-indicator">
                    Confidence: {(doc.confidence * 100).toFixed(0)}%
                  </span>
                </div>
                <h3>{highlightKeywords(doc.title, searchTerm.split(" "))}</h3>
                <p className="document-preview">
                  {highlightKeywords(doc.preview, searchTerm.split(" "))}
                </p>
                {doc.aiInsights && doc.aiInsights.length > 0 && (
                  <div className="ai-insights">
                    {doc.aiInsights.map((insight, i) => (
                      <span key={i} className="ai-insight-tag">
                        AI Insight: {insight}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div className="pagination">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => paginate(i + 1)}
                  className={currentPage === i + 1 ? "active" : ""}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>

          {selectedDocument && (
            <div className="document-detail-panel">
              <h2>{selectedDocument.title}</h2>
              <span
                className={`document-type-badge ${getDocumentTypeBadgeClass(selectedDocument.type)}`}
              >
                {selectedDocument.type}
              </span>
              <p className="document-full-content">
                {highlightKeywords(
                  selectedDocument.content,
                  searchTerm.split(" "),
                )}
              </p>
              {selectedDocument.aiInsights &&
                selectedDocument.aiInsights.length > 0 && (
                  <div className="ai-insights-detail">
                    <h3>AI-Generated Insights:</h3>
                    <ul>
                      {selectedDocument.aiInsights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              <button
                className="close-detail-button"
                onClick={() => setSelectedDocument(null)}
              >
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DocumentSearch;
