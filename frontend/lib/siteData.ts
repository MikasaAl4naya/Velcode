export type ServiceData = {
  num: string;
  name?: string;
  title?: string;
  price?: string;
  unit?: string;
  theme: string;
  badgeTheme?: string;
  btnClass?: string;
  decor?: boolean;
  desc?: string;
  badgeTitle?: string;
  badgeDesc?: string;
};

export const SERVICES_DATA: ServiceData[] = [
  {
    num: '01',
    name: 'Разработка сайта\nпод ключ',
    price: 'от 36 000 ₽',
    unit: 'за проект',
    theme: 'blue-grad',
    badgeTheme: 'blue-grad',
    btnClass: 'btn--card-white',
    decor: true,
    desc: 'От простых лендингов до сложных экосистем с ИИ, интеграцией 1С и Битрикс24',
  },
  {
    num: '02',
    name: 'Реклама\nи продвижение',
    price: 'от 36 000 ₽',
    unit: 'за проект',
    theme: 'dark',
    badgeTheme: 'dark',
    btnClass: 'btn--card-blue',
    decor: false,
    desc: 'Контекстная и таргетированная реклама, сквозная аналитика и привлечение целевых заявок',
  },
  {
    num: '03',
    name: 'Интеграции\nс 1С и Битрикс24',
    price: 'от 36 000 ₽',
    unit: 'за проект',
    theme: 'dark',
    badgeTheme: 'dark',
    btnClass: 'btn--card-blue',
    decor: false,
    desc: 'Синхронизация баз данных, автоматизация бизнес-процессов и единое окно управления продажами',
  },
  {
    num: '04',
    name: 'Создание и внедрение\nИИ-ассистентов\nи агентов',
    price: 'от 36 000 ₽',
    unit: 'за проект',
    theme: 'blue-soft',
    badgeTheme: 'blue-soft',
    btnClass: 'btn--card-white',
    decor: false,
    desc: 'Умные чат-боты, голосовые ассистенты и автономные агенты для поддержки и продаж 24/7',
  },
  {
    num: '05',
    name: 'Интеграции\nс 1С и Битрикс24',
    price: 'от 36 000 ₽',
    unit: 'за проект',
    theme: 'dark',
    badgeTheme: 'dark',
    btnClass: 'btn--card-blue',
    decor: false,
    desc: 'Настройка API, обмен остатками и заказами в реальном времени, безопасность данных',
  },
];

export const CONSULTATION_SERVICE: ServiceData = {
  num: '00',
  title: 'Не можете определиться с выбором услуги?',
  desc: 'Оставьте заявку на бесплатную консультацию. Наши специалисты помогут вам подобрать услугу под ваши потребности и рассчитают ориентировочную смету.',
  theme: 'outline',
  badgeTheme: 'outline',
  badgeTitle: 'Индивидуальная консультация',
  badgeDesc: 'Поможем подобрать оптимальный стек технологий и рассчитаем смету под ваши задачи',
};

export const ADVANTAGES_DATA = [
  {
    title: 'Бесплатная консультация',
    desc: 'Мы начинаем работу с бесплатной консультации, на которой выявляем ваши потребности и определяем приблизительную стоимость работ.',
  },
  {
    title: 'Разделение проекта на этапы',
    desc: 'Делим проект на логические этапы (анализ, дизайн, разработка). Вы контролируете каждый этап и можете влиять на него в реальном времени.',
  },
  {
    title: 'Многопрофильность решений',
    desc: 'В нашей команде работают опытные специалисты, которые разработают IT-решения под ключ для проектов любой сложности и сферы бизнеса.',
  },
  {
    title: 'Разработка под ключ',
    desc: 'Вам достаточно описать концепцию или задачу. Мы превратим ее в готовый цифровой продукт, который привлекает клиентов и приносит деньги.',
  },
];

export const PORTFOLIO_DATA = [
  {
    title: 'Кейс Trattoria Pomodoro',
    img: '/assets/portfolio-site-preview-1.png',
    url: 'velcode.ru/',
    link: '/portfolio/case',
  },
  {
    title: 'Кейс интернет-магазин',
    img: '/assets/portfolio-site-preview-2.png',
    url: 'velcode.ru/',
    link: '/portfolio/case',
  },
  {
    title: 'Кейс корпоративный портал',
    img: '/assets/portfolio-site-preview-3.png',
    url: 'velcode.ru/',
    link: '/portfolio/case',
  },
];

export const PORTFOLIO_PAGE_ITEMS = [
  {
    id: 'case-1',
    title: 'Сайт-визитка для рестобара',
    img: '/assets/portfolio-site-preview-1.png',
    tags: ['Веб-дизайн'],
    link: '/portfolio/case',
    empty: false,
  },
  {
    id: 'case-2',
    title: 'Сайт для магазина спорт-товаров',
    img: '/assets/portfolio-site-preview-2.png',
    tags: ['Веб-дизайн'],
    link: '/portfolio/case',
    empty: false,
  },
  {
    id: 'case-3',
    title: 'Модуль интеграции Битрикс24 и 1С:Предприятие',
    img: '/assets/portfolio-site-preview-3.png',
    tags: ['Интеграции с 1С и Битрикс24'],
    link: '/portfolio/case',
    empty: false,
  },
  {
    id: 'case-4',
    title: 'Новый проект в разработке',
    img: '/assets/case-placeholder.svg',
    tags: ['В процессе'],
    link: '#',
    empty: true,
  },
];

export const HERO_TAGS: string[][] = [
  ['Разработка сайтов', 'Веб-дизайн', 'Внедрение ИИ'],
  ['Продвижение', 'Интеграции с 1С и Битрикс24'],
];

export const NAV_LINKS = [
  { href: '/services', label: 'Услуги' },
  { href: '/advantages', label: 'Преимущества' },
  { href: '/portfolio', label: 'Портфолио' },
  { href: '/contacts', label: 'Контакты' },
];
