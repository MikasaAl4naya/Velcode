import type { PortfolioItem } from '@/lib/api'

type Props = { items: PortfolioItem[] }

function TagChip({ label }: { label: string }) {
  return (
    <span className="bg-[#2583FF]/10 text-[#2583FF] text-[12px] font-medium px-2.5 py-0.5 rounded-full">
      {label}
    </span>
  )
}

export default function Portfolio({ items }: Props) {
  if (items.length === 0) return null

  return (
    <section id="portfolio" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h2 className="text-3xl sm:text-4xl font-bold text-[#333] mb-4">
          Портфолио
        </h2>
        <p className="text-[#666] text-lg mb-10 max-w-2xl">
          Проекты, которые мы реализовали для наших клиентов.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const tags = item.tags
              ? item.tags.split(',').map((t) => t.trim()).filter(Boolean)
              : []

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow flex flex-col"
              >
                {item.image_url ? (
                  <div className="h-48 overflow-hidden bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-48 bg-gradient-to-br from-[#2583FF]/20 to-[#2583FF]/5 flex items-center justify-center">
                    <span className="text-[#2583FF]/40 text-5xl font-bold">
                      {item.title.charAt(0)}
                    </span>
                  </div>
                )}

                <div className="p-5 flex flex-col flex-1">
                  <h3 className="font-semibold text-[#333] text-[16px] mb-2">
                    {item.title}
                  </h3>

                  {item.description && (
                    <p className="text-[#666] text-[14px] mb-4 flex-1 line-clamp-3">
                      {item.description}
                    </p>
                  )}

                  <div className="mt-auto">
                    {tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map((tag) => (
                          <TagChip key={tag} label={tag} />
                        ))}
                      </div>
                    )}

                    {item.site_url && (
                      <a
                        href={item.site_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[#2583FF] hover:underline font-medium"
                      >
                        Открыть сайт ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
