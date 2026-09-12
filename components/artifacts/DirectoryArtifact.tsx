"use client";

import { FormEvent, useState } from "react";
import { Lock, Search } from "lucide-react";
import type { DirectoryContent } from "@/lib/cases";

export function DirectoryArtifact({ content }: { content: DirectoryContent }) {
  const [query, setQuery] = useState(content.searchTerm);
  const [searched, setSearched] = useState(content.searchTerm);

  const matches = searched
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .some(
      (term) =>
        term.length > 0 &&
        (content.name.toLowerCase().includes(term) ||
          content.department.toLowerCase().includes(term)),
    );

  function onSearch(event: FormEvent) {
    event.preventDefault();
    setSearched(query);
  }

  const initials = content.name
    .replace(", Ph.D.", "")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2);

  return (
    <div className="artifact bg-white text-[#222222]">
      {/* Browser-style address strip, so the real domain is always visible. */}
      <div className="flex items-center gap-2 border-b border-[#d5d5d5] bg-[#f1f3f4] px-3 py-2">
        <Lock size={13} strokeWidth={2.25} aria-hidden className="text-[#5f6368]" />
        <span className="truncate text-[13px] text-[#3c4043]">
          {content.domain}
        </span>
      </div>

      <div className="bg-[#003366] px-4 py-3 text-white">
        <p className="text-[16px] font-semibold">{content.university}</p>
        <p className="text-[12px] text-[#d6dde6]">Faculty and Staff Directory</p>
      </div>

      <form
        onSubmit={onSearch}
        className="flex gap-2 border-b border-[#d5d5d5] bg-[#eef1f4] px-4 py-3"
      >
        <label className="sr-only" htmlFor="directory-search">
          Search the {content.university} directory
        </label>
        <input
          id="directory-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search by name or department"
          className="h-11 min-w-0 flex-1 rounded border border-[#b9b9b9] bg-white px-3 text-[15px] text-[#222222]"
        />
        <button
          type="submit"
          className="inline-flex h-11 items-center gap-2 rounded bg-[#003366] px-4 text-[14px] font-medium text-white"
        >
          <Search size={16} strokeWidth={2.25} aria-hidden />
          Search
        </button>
      </form>

      {matches ? (
        <>
          <div className="border-b border-[#dddddd] bg-white px-4 py-2 text-[13px] text-[#444444]">
            {content.breadcrumbs.map((crumb, index) => (
              <span key={crumb}>
                {index > 0 ? <span className="text-[#888888]"> / </span> : null}
                {crumb}
              </span>
            ))}
          </div>

          <div className="grid gap-6 px-4 py-5 md:grid-cols-[1fr_180px]">
            <div>
              <div className="flex gap-4">
                <div
                  aria-hidden
                  className="flex h-[120px] w-[96px] shrink-0 items-center justify-center bg-[#d0d0d0] text-[20px] font-semibold text-[#666666]"
                >
                  {initials}
                </div>
                <div className="min-w-0">
                  <h3 className="text-[20px] font-semibold">{content.name}</h3>
                  <p className="mt-1 text-[15px]">{content.title}</p>
                  <p className="text-[14px] text-[#444444]">
                    {content.department}
                  </p>
                </div>
              </div>

              <dl className="mt-5 text-[14px]">
                {(
                  [
                    ["Office", content.office],
                    ["Email", content.email],
                    ["Phone", content.phone],
                  ] as const
                ).map(([term, value]) => (
                  <div
                    key={term}
                    className="grid grid-cols-[72px_1fr] gap-2 border-t border-[#dddddd] py-2.5"
                  >
                    <dt className="text-[#555555]">{term}</dt>
                    <dd className="break-words">
                      {term === "Email" ? (
                        <a
                          href={`mailto:${value}`}
                          onClick={(event) => event.preventDefault()}
                          className="text-[#003366] underline"
                        >
                          {value}
                        </a>
                      ) : (
                        value
                      )}
                    </dd>
                  </div>
                ))}
              </dl>

              {content.note ? (
                <p className="mt-4 border-t border-[#dddddd] pt-3 text-[14px] leading-[1.6] text-[#444444]">
                  {content.note}
                </p>
              ) : null}
            </div>

            <aside className="border-t border-[#dddddd] pt-3 text-[14px] md:border-t-0 md:border-l md:pt-0 md:pl-4">
              <p className="mb-2 font-semibold text-[#003366]">On this site</p>
              <ul className="space-y-1.5 text-[#003366]">
                {content.sidebar.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </aside>
          </div>
        </>
      ) : (
        <div className="px-4 py-10 text-center">
          <p className="text-[15px] text-[#444444]">
            No directory entries match “{searched}”.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery(content.searchTerm);
              setSearched(content.searchTerm);
            }}
            className="mt-3 text-[14px] text-[#003366] underline"
          >
            Search for “{content.searchTerm}” instead
          </button>
        </div>
      )}
    </div>
  );
}
