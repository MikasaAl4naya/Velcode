import Link from 'next/link';

type BreadcrumbItem = {
  label: string;
  href?: string;
  current?: boolean;
};

type BreadcrumbsProps = {
  items?: BreadcrumbItem[];
};

export function Breadcrumbs({ items = [] }: BreadcrumbsProps) {
  if (!items || items.length === 0) return null;

  return (
    <nav className="breadcrumbs" aria-label="Хлебные крошки">
      {items.map((item, index) => {
        const isLast = item.current || index === items.length - 1;

        return (
          <div key={item.label + index} className="breadcrumbs__item">
            {isLast ? (
              <span className="breadcrumbs__current" aria-current="page">
                {item.label}
              </span>
            ) : (
              <>
                <Link href={item.href || '/'} className="breadcrumbs__link">
                  {item.label}
                </Link>
                <span className="breadcrumbs__separator" aria-hidden="true">
                  /
                </span>
              </>
            )}
          </div>
        );
      })}
    </nav>
  );
}
