/**
 * Единый компонент тега/плашки для всех страниц проекта:
 * Главная (Hero), Каталог кейсов (PortfolioPage), Страница кейса (CasePage).
 */
export function Tag({
  children,
  className = '',
  as: Component = 'span',
  ...props
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  [key: string]: any;
}) {
  return (
    <Component className={`tag ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}

export default Tag;
