'use client';

import type { LegalDocument } from '../../../../../shared/legal-content';

function renderBlock(block: LegalDocument['sections'][number]['blocks'][number], blockIndex: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p
          key={blockIndex}
          className="text-body-lg text-neutral-600 dark:text-dark-textSecondary leading-relaxed"
        >
          {block.text}
        </p>
      );
    case 'list':
      return (
        <ul
          key={blockIndex}
          className="list-disc list-inside space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary"
        >
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div key={blockIndex} className="overflow-x-auto">
          <table className="w-full text-body-md border-collapse">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-dark-border">
                {block.headers.map((header) => (
                  <th
                    key={header}
                    className="text-left py-2 pr-4 font-semibold text-neutral-700 dark:text-dark-textPrimary"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-neutral-600 dark:text-dark-textSecondary">
              {block.rows.map((row) => (
                <tr
                  key={row.join('-')}
                  className="border-b border-neutral-100 dark:border-dark-border"
                >
                  {row.map((cell) => (
                    <td
                      key={cell}
                      className={`py-2 pr-4 ${cell.startsWith('authjs.') ? 'font-mono text-body-sm' : ''}`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case 'contact':
      return (
        <div
          key={blockIndex}
          className="mt-2 p-4 bg-neutral-50 dark:bg-dark-surfaceRaised rounded-lg space-y-2 text-body-lg text-neutral-600 dark:text-dark-textSecondary"
        >
          {block.items.map((item) => (
            <p key={`${item.label}-${item.value}`}>
              <strong>{item.label}:</strong>{' '}
              {item.href ? (
                <a href={item.href} className="text-accent hover:underline">
                  {item.value}
                </a>
              ) : (
                item.value
              )}
            </p>
          ))}
        </div>
      );
    default:
      return null;
  }
}

export function LegalDocumentPage({ document }: { document: LegalDocument }) {
  return (
    <div className="max-w-4xl mx-auto px-6 py-16">
      <div className="bg-white dark:bg-dark-surface rounded-2xl border border-neutral-200/50 dark:border-dark-border p-8 md:p-12">
        <h1 className="text-h1 font-bold text-neutral-900 dark:text-dark-textPrimary mb-2">
          {document.title}
        </h1>
        {document.metaLines.map((line, index) => (
          <p key={`${line}-${index}`} className="text-body-md text-neutral-400 mb-2 last:mb-10">
            {line}
          </p>
        ))}

        <div className="space-y-8">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-h2 font-bold text-neutral-900 dark:text-dark-textPrimary mb-4">
                {section.title}
              </h2>
              <div className="space-y-4">
                {section.blocks.map((block, index) => renderBlock(block, index))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
