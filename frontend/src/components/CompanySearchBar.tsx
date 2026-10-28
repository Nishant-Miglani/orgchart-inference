import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Search,
  Building2,
  Check,
  ChevronDown,
  X,
  RotateCcw,
} from "lucide-react";
import { CompanySummary } from "../types";

interface CompanySearchBarProps {
  companies: CompanySummary[];
  selectedCompanyId: string;
  onSelectCompany: (companyId: string) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedDomainType: string;
  onSelectDomainType: (domainType: string) => void;
}

export const CompanySearchBar: React.FC<CompanySearchBarProps> = ({
  companies,
  selectedCompanyId,
  onSelectCompany,
  selectedCategory,
  onSelectCategory,
  selectedDomainType,
  onSelectDomainType,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedCompany = useMemo(() => {
    return companies.find((c) => c.id === selectedCompanyId);
  }, [companies, selectedCompanyId]);

  // Extract unique categories and domain types
  const categories = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.sub_sector) set.add(c.sub_sector);
    });
    return Array.from(set).sort();
  }, [companies]);

  const domainTypes = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.domain_type) set.add(c.domain_type);
    });
    return Array.from(set).sort();
  }, [companies]);

  // Filter companies based on category, domain type, and search term
  const filteredCompanies = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return companies.filter((c) => {
      // Category filter
      if (selectedCategory !== "All" && c.sub_sector.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Domain type filter
      if (
        selectedDomainType !== "All" &&
        c.domain_type &&
        !c.domain_type.toLowerCase().includes(selectedDomainType.toLowerCase())
      ) {
        return false;
      }
      // Search term
      if (term) {
        const nameMatch = c.name.toLowerCase().includes(term);
        const domainMatch = c.domain ? c.domain.toLowerCase().includes(term) : false;
        const hqMatch = c.headquarters ? c.headquarters.toLowerCase().includes(term) : false;
        const sectorMatch = c.sub_sector ? c.sub_sector.toLowerCase().includes(term) : false;
        if (!nameMatch && !domainMatch && !hqMatch && !sectorMatch) {
          return false;
        }
      }
      return true;
    });
  }, [companies, selectedCategory, selectedDomainType, searchTerm]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasActiveFilters = selectedCategory !== "All" || selectedDomainType !== "All" || searchTerm.length > 0;

  const handleResetFilters = () => {
    onSelectCategory("All");
    onSelectDomainType("All");
    setSearchTerm("");
  };

  return (
    <div
      style={{
        background: "#ffffff",
        borderBottom: "1px solid var(--border-subtle)",
        padding: "12px 24px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Left Side: Searchable Combobox & Filters */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1, minWidth: "320px", maxWidth: "900px" }}>
          {/* Search Box / Dropdown Input */}
          <div ref={containerRef} style={{ position: "relative", flex: "1 1 360px", minWidth: "260px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#ffffff",
                border: isOpen ? "1px solid var(--accent-blue)" : "1px solid var(--border-medium)",
                borderRadius: "8px",
                padding: "0 10px",
                height: "38px",
                boxShadow: isOpen ? "0 0 0 3px rgba(37, 99, 235, 0.12)" : "0 1px 2px 0 rgba(0,0,0,0.04)",
                transition: "all 0.15s ease",
              }}
            >
              <Search size={16} color="var(--text-muted)" style={{ flexShrink: 0, marginRight: "8px" }} />
              <input
                ref={inputRef}
                type="text"
                placeholder={
                  selectedCompany
                    ? `${selectedCompany.name} (type to search 500 companies)...`
                    : "Search companies by name or domain..."
                }
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!isOpen) setIsOpen(true);
                }}
                onFocus={() => setIsOpen(true)}
                style={{
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  width: "100%",
                  fontSize: "13px",
                  color: "var(--text-primary)",
                  fontWeight: 500,
                }}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-muted)",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                  padding: "2px",
                  marginLeft: "4px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <ChevronDown size={15} style={{ transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
              </button>
            </div>

            {/* Searchable Dropdown Popup */}
            {isOpen && (
              <div
                className="glass-dropdown"
                style={{
                  position: "absolute",
                  top: "calc(100% + 6px)",
                  left: 0,
                  right: 0,
                  borderRadius: "8px",
                  maxHeight: "360px",
                  overflowY: "auto",
                  zIndex: 200,
                  padding: "6px",
                }}
              >
                {/* Result header info */}
                <div
                  style={{
                    padding: "6px 10px 8px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: "1px solid var(--border-subtle)",
                    fontSize: "11px",
                    fontWeight: 600,
                    color: "var(--text-muted)",
                  }}
                >
                  <span>
                    Showing {filteredCompanies.length} of {companies.length} companies
                  </span>
                  {selectedCategory !== "All" && (
                    <span style={{ color: "var(--accent-blue)" }}>Category: {selectedCategory}</span>
                  )}
                </div>

                {filteredCompanies.length === 0 ? (
                  <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: "13px" }}>
                    No companies found matching &ldquo;{searchTerm}&rdquo;
                  </div>
                ) : (
                  <div style={{ paddingTop: "4px" }}>
                    {filteredCompanies.map((c) => {
                      const isSelected = c.id === selectedCompanyId;
                      return (
                        <div
                          key={c.id}
                          onClick={() => {
                            onSelectCompany(c.id);
                            setIsOpen(false);
                            setSearchTerm("");
                          }}
                          style={{
                            padding: "8px 10px",
                            borderRadius: "6px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            background: isSelected ? "var(--accent-blue-subtle)" : "transparent",
                            border: isSelected ? "1px solid #bfdbfe" : "1px solid transparent",
                            marginBottom: "2px",
                            transition: "background 0.12s ease",
                          }}
                          onMouseEnter={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "var(--bg-muted)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected) e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
                            <div
                              style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "6px",
                                background: isSelected ? "#dbeafe" : "#f1f5f9",
                                color: isSelected ? "var(--accent-blue)" : "var(--text-secondary)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                fontWeight: 700,
                                fontSize: "12px",
                              }}
                            >
                              {c.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span
                                  style={{
                                    fontWeight: isSelected ? 700 : 600,
                                    fontSize: "13px",
                                    color: "var(--text-primary)",
                                    whiteSpace: "nowrap",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                  }}
                                >
                                  {c.name}
                                </span>
                                {c.domain && (
                                  <span
                                    style={{
                                      fontSize: "11px",
                                      color: "var(--text-muted)",
                                      background: "#f1f5f9",
                                      padding: "1px 6px",
                                      borderRadius: "4px",
                                    }}
                                  >
                                    {c.domain}
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "11px", color: "var(--text-muted)", display: "flex", gap: "8px", marginTop: "2px" }}>
                                <span>{c.sub_sector}</span>
                                <span>•</span>
                                <span>{c.employee_count} emps</span>
                                <span>•</span>
                                <span>{c.headquarters}</span>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                            {c.domain_type && (
                              <span
                                style={{
                                  fontSize: "11px",
                                  color: "var(--text-secondary)",
                                  background: "#f8fafc",
                                  border: "1px solid var(--border-subtle)",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                }}
                              >
                                {c.domain_type.split(" ")[0]}
                              </span>
                            )}
                            <span
                              style={{
                                fontSize: "11px",
                                fontWeight: 600,
                                color: c.precision >= 0.8 ? "var(--accent-emerald)" : "var(--accent-blue)",
                              }}
                            >
                              {(c.precision * 100).toFixed(0)}% acc
                            </span>
                            {isSelected && <Check size={16} color="var(--accent-blue)" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Category Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Category:
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => onSelectCategory(e.target.value)}
              style={{
                height: "38px",
                padding: "0 10px",
                background: "#ffffff",
                border: selectedCategory !== "All" ? "1px solid var(--accent-blue)" : "1px solid var(--border-medium)",
                borderRadius: "8px",
                fontSize: "12px",
                color: selectedCategory !== "All" ? "var(--accent-blue)" : "var(--text-primary)",
                fontWeight: selectedCategory !== "All" ? 600 : 500,
                outline: "none",
                cursor: "pointer",
                maxWidth: "200px",
              }}
            >
              <option value="All">All Categories ({companies.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Domain Type Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
              Domain:
            </label>
            <select
              value={selectedDomainType}
              onChange={(e) => onSelectDomainType(e.target.value)}
              style={{
                height: "38px",
                padding: "0 10px",
                background: "#ffffff",
                border: selectedDomainType !== "All" ? "1px solid var(--accent-blue)" : "1px solid var(--border-medium)",
                borderRadius: "8px",
                fontSize: "12px",
                color: selectedDomainType !== "All" ? "var(--accent-blue)" : "var(--text-primary)",
                fontWeight: selectedDomainType !== "All" ? 600 : 500,
                outline: "none",
                cursor: "pointer",
                maxWidth: "180px",
              }}
            >
              <option value="All">All Domains</option>
              {domainTypes.map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="btn-secondary"
              style={{
                height: "38px",
                padding: "0 10px",
                fontSize: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                color: "var(--text-muted)",
              }}
              title="Reset all search & filters"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>

        {/* Right Side: Active Selection Indicator */}
        {selectedCompany && (
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                color: "var(--text-secondary)",
                background: "#f1f5f9",
                padding: "4px 10px",
                borderRadius: "6px",
              }}
            >
              <Building2 size={13} color="var(--accent-blue)" />
              <strong style={{ color: "var(--text-primary)" }}>{selectedCompany.name}</strong>
              {selectedCompany.domain && (
                <span style={{ color: "var(--text-muted)" }}>• {selectedCompany.domain}</span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
