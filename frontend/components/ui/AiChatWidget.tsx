'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ymGoal } from '@/lib/ym';
import { Tag } from '@/components/ui/Tag';
import { LeadForm } from '@/components/ui/LeadForm';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  actions?: Array<{
    label: string;
    actionKey: string;
    primary?: boolean;
  }>;
  showLeadForm?: boolean;
}

const FREQUENT_QUESTIONS = [
  'Сколько стоит разработка под ключ',
  'Какие услуги вы предоставляете',
  'Какие вы даете гарантии на работу',
];

const EXACT_QUESTION_ANSWERS: Record<string, { text: string; actionLabel: string }> = {
  'сколько стоит разработка под ключ': {
    text: 'Стоимость разработки под ключ рассчитывается индивидуально: лендинги — от 45 000 ₽, корпоративные сайты — от 75 000 ₽, интернет-магазины и веб-сервисы — от 110 000 ₽. В стоимость входят аналитика, дизайн, верстка, интеграции и базовая оптимизация. Смета и сроки фиксируются в договоре.',
    actionLabel: 'Оставить заявку на расчет',
  },
  'какие услуги вы предоставляете': {
    text: 'Велкод предоставляет комплексную разработку и автоматизацию: создание сайтов и веб-сервисов (Next.js, React, TypeScript, Python/FastAPI), внедрение Битрикс24 и 1С, разработка ИИ-ассистентов и чат-ботов, а также реклама и SEO-продвижение.\n\nВсе направления подробно описаны на [странице услуг](/services).',
    actionLabel: 'Оставить заявку на проект',
  },
  'какие вы даете гарантии на работу': {
    text: 'Мы работаем строго по официальному договору (ИП), где четко зафиксированы смета, этапы и сроки. Предоставляем гарантию на весь разработанный код и работоспособность проекта, а также бесплатную гарантийную поддержку после сдачи.\n\nПодробнее о нашем подходе читайте в [разделе преимуществ](/advantages).',
    actionLabel: 'Оставить заявку',
  },
};

const STORAGE_MSGS_KEY = 'velcode_ai_chat_messages_v1';
const STORAGE_OPEN_KEY = 'velcode_ai_chat_open_v1';
const STORAGE_DEBUG_KEY = 'velcode_ai_debug_mode';

/**
 * Рендерит текст сообщения с поддержкой markdown-ссылок [текст](url)
 */
function renderMessageContent(text: string) {
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match;

  while ((match = linkRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    const label = match[1];
    const href = match[2];
    const isInternal = href.startsWith('/');

    parts.push(
      <Link
        key={match.index}
        href={href}
        className="ai-chat-link"
        target={isInternal ? undefined : '_blank'}
        rel={isInternal ? undefined : 'noopener noreferrer'}
      >
        {label}
      </Link>
    );
    lastIndex = linkRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts;
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [leadSent, setLeadSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isDebugMode, setIsDebugMode] = useState(false);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Восстановление истории чата, состояния открытости и проверка режима дебага (?ai_debug=1)
  useEffect(() => {
    try {
      // Проверяем URL параметр (как в Яндекс Метрике: ?ai_debug=1 включает, ?ai_debug=0 отключает)
      const urlParams = new URLSearchParams(window.location.search);
      const debugParam = urlParams.get('ai_debug') ?? urlParams.get('debug_ai');

      let debugActive = false;
      if (debugParam === '1' || debugParam === 'true') {
        localStorage.setItem(STORAGE_DEBUG_KEY, '1');
        debugActive = true;
      } else if (debugParam === '0' || debugParam === 'false') {
        localStorage.removeItem(STORAGE_DEBUG_KEY);
        debugActive = false;
      } else {
        debugActive = localStorage.getItem(STORAGE_DEBUG_KEY) === '1';
      }

      setIsDebugMode(debugActive);

      // Если дебаг режим не активирован — не загружаем историю и не показываем виджет
      if (!debugActive) {
        return;
      }

      const savedMsgs = localStorage.getItem(STORAGE_MSGS_KEY);
      if (savedMsgs) {
        const parsed = JSON.parse(savedMsgs);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          if (parsed.some((m: Message) => m.id.startsWith('bot-done-'))) {
            setLeadSent(true);
          }
        }
      }
      const savedOpen = localStorage.getItem(STORAGE_OPEN_KEY);
      if (savedOpen === 'true') {
        setIsOpen(true);
      }
    } catch {
      // ignore
    } finally {
      setIsMounted(true);
    }
  }, []);

  // Синхронизация сообщений с localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_MSGS_KEY, JSON.stringify(messages));
      localStorage.setItem(STORAGE_OPEN_KEY, String(isOpen));
    } catch {
      // ignore
    }
  }, [messages, isOpen, isMounted]);

  // Прокрутка чата строго внутри тела сообщений (без смещения родительских блоков)
  useEffect(() => {
    if (isOpen && chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping, isOpen]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen((prev) => {
      const next = !prev;
      if (next) {
        try {
          ymGoal('open_ai_chat');
        } catch {
          // ignore
        }
      }
      return next;
    });
  };

  const addUserMessage = (text: string) => {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Имитация ответа ИИ с задержкой (болванка)
    setTimeout(() => {
      const botResponse = generateBotResponse(text);
      setMessages((prev) => [...prev, botResponse]);
      setIsTyping(false);
    }, 750);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    addUserMessage(text);
  };

  const handleSelectQuestion = (question: string) => {
    addUserMessage(question);
  };

  const generateBotResponse = (query: string): Message => {
    const trimmed = query.trim().toLowerCase();

    // За быстрым вопросом закреплён точный ответ — поиск не выполняется
    if (EXACT_QUESTION_ANSWERS[trimmed]) {
      const fixed = EXACT_QUESTION_ANSWERS[trimmed];
      return {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: fixed.text,
        actions: [
          { label: fixed.actionLabel, actionKey: 'show_lead_form', primary: true },
        ],
      };
    }

    const q = trimmed;

    // 1. Сколько стоит разработка под ключ / расчет / цены
    if (
      q.includes('стоим') ||
      q.includes('цен') ||
      q.includes('сколько') ||
      q.includes('расчет') ||
      q.includes('прайс') ||
      q.includes('тариф') ||
      q.includes('бюджет') ||
      q.includes('под ключ')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Стоимость разработки под ключ рассчитывается индивидуально: лендинги — от 45 000 ₽, корпоративные сайты — от 75 000 ₽, интернет-магазины и веб-сервисы — от 110 000 ₽. В стоимость входят аналитика, дизайн, верстка, интеграции и базовая оптимизация. Смета и сроки фиксируются в договоре.',
        actions: [
          { label: 'Оставить заявку на расчет', actionKey: 'show_lead_form', primary: true },
        ],
      };
    }

    // 2. Какие вы даете гарантии на работу
    if (
      q.includes('гарант') ||
      q.includes('договор') ||
      q.includes('надежн') ||
      q.includes('правк') ||
      q.includes('ответственност')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Мы работаем строго по официальному договору (ИП), где четко зафиксированы смета, этапы и сроки. Предоставляем гарантию на весь разработанный код и работоспособность проекта, а также бесплатную гарантийную поддержку после сдачи.\n\nПодробнее о нашем подходе читайте в [разделе преимуществ](/advantages).',
        actions: [
          { label: 'Оставить заявку', actionKey: 'show_lead_form', primary: true },
        ],
      };
    }

    // 3. Какие услуги вы предоставляете
    if (
      q.includes('услуг') ||
      q.includes('стек') ||
      q.includes('технолог') ||
      q.includes('что дел') ||
      q.includes('предоставля') ||
      q.includes('направлен')
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Велкод предоставляет комплексную разработку и автоматизацию: создание сайтов и веб-сервисов (Next.js, React, TypeScript, Python/FastAPI), внедрение Битрикс24 и 1С, разработка ИИ-ассистентов и чат-ботов, а также реклама и SEO-продвижение.\n\nВсе направления подробно описаны на [странице услуг](/services).',
        actions: [
          { label: 'Оставить заявку на проект', actionKey: 'show_lead_form', primary: true },
        ],
      };
    }

    // 4. Примеры выполненных кейсов / портфолио
    if (
      q.includes('кейс') ||
      q.includes('портфолио') ||
      q.includes('пример') ||
      q.includes('выполнен') ||
      (q.includes('покаж') && (q.includes('работ') || q.includes('проект') || q.includes('сайт'))) ||
      (q.includes('посмотр') && (q.includes('работ') || q.includes('проект') || q.includes('сайт'))) ||
      q === 'работы' ||
      q === 'наши работы' ||
      q === 'ваши работы'
    ) {
      return {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text:
          'Вот несколько реализованных кейсов Велкод:\n\n' +
          '— [«Спорт-Товары»](/portfolio/sport-shop) — разработали интернет-магазин с каталогом, корзиной и интеграцией 1С для синхронизации остатков.\n\n' +
          '— [«Trattoria Pomodoro»](/portfolio/trattoria) — сайт-визитка рестобара с передачей атмосферы, интерактивным меню и бронированием столиков.\n\n' +
          '— [«Битрикс24 & 1С»](/portfolio/bitrix-1c) — модуль двусторонней интеграции CRM и 1С:Предприятие для обмена заказами и клиентами.\n\n' +
          'Больше работ смотрите на [этой странице](/portfolio).',
        actions: [
          { label: 'Обсудить мой проект', actionKey: 'show_lead_form', primary: true },
        ],
      };
    }

    // 5. Заявка / контакты
    if (
      q.includes('заявк') ||
      q.includes('связат') ||
      q.includes('консульт') ||
      q.includes('телефон') ||
      q.includes('позвон')
    ) {
      const hasUnsubmittedForm = messages.some((m) => m.showLeadForm) && !leadSent;
      if (hasUnsubmittedForm) {
        return {
          id: `bot-${Date.now()}`,
          sender: 'assistant',
          text: 'Форма для связи уже открыта выше. Пожалуйста, укажите имя и телефон, и специалист сразу с вами свяжется!',
        };
      }
      return {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'С удовольствием проконсультируем вас! Заполните, пожалуйста, форму ниже — специалист свяжется с вами в течение 15 минут:',
        showLeadForm: true,
      };
    }

    // Дефолтный ответ
    return {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: 'Спасибо за вопрос! Я умный ассистент Велкод. Могу рассказать о стоимости, услугах, гарантиях, показать [кейсы в портфолио](/portfolio) или передать ваши контакты для детальной консультации.',
      actions: [
        { label: 'Обсудить мой проект', actionKey: 'show_lead_form', primary: true },
      ],
    };
  };

  const handleActionClick = (actionKey: string, messageId: string) => {
    if (actionKey === 'show_lead_form') {
      const hasUnsubmittedForm = messages.some((m) => m.showLeadForm) && !leadSent;
      if (hasUnsubmittedForm) {
        // Убираем кнопку и скроллим к уже открытой форме
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, actions: undefined } : m))
        );
        if (chatBodyRef.current) {
          chatBodyRef.current.scrollTo({
            top: chatBodyRef.current.scrollHeight,
            behavior: 'smooth',
          });
        }
        return;
      }

      const leadMsg: Message = {
        id: `bot-lead-${Date.now()}`,
        sender: 'assistant',
        text: 'Заполните, пожалуйста, форму ниже — специалист свяжется с вами:',
        showLeadForm: true,
      };
      // Убираем кнопку действия из сообщения и выводим форму
      setMessages((prev) => [
        ...prev.map((m) => (m.id === messageId ? { ...m, actions: undefined } : m)),
        leadMsg,
      ]);
      return;
    }

    if (actionKey === 'ask_cases') {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, actions: undefined } : m))
      );
      addUserMessage('Примеры выполненных кейсов');
    }
  };

  const handleLeadSuccess = (data: { name: string; phone: string }) => {
    setLeadSent(true);
    const successMsg: Message = {
      id: `bot-done-${Date.now()}`,
      sender: 'assistant',
      text: `Спасибо${data.name ? ', ' + data.name : ''}! Ваша заявка успешно принята. Специалист перезвонит вам по номеру ${data.phone} в рабочее время (Пн-Пт с 10:00 до 18:00). Чат завершен.`,
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  // Виджет рендерится ТОЛЬКО если активирован режим дебага (?ai_debug=1)
  if (!isMounted || !isDebugMode) {
    return null;
  }

  return (
    <>
      {/* Кнопка открытия виджета (Лаунчер) */}
      {!isOpen && (
        <button
          type="button"
          className="ai-widget-launcher"
          onClick={handleToggle}
          aria-label="Открыть AI чат"
        >
          <div
            className="ai-widget-launcher__orb"
            aria-hidden="true"
            style={{
              background: 'radial-gradient(circle at 35% 35%, #ffffff 0%, #f0f3ff 25%, #a4b6f4 60%, #7d98f0 85%, #5366a4 100%)',
              boxShadow: '0 0 12px rgba(125, 152, 240, 0.55)',
            }}
          />
          <span className="ai-widget-launcher__text">AI Чат</span>
        </button>
      )}

      {/* Окно виджета */}
      {isOpen && (
        <section
          className="ai-chat-window"
          role="dialog"
          aria-label="Чат с ИИ-консультантом Велкод"
        >
          {/* Шапка чата с заголовком и крестиком закрытия */}
          <header className="ai-chat-header">
            <span className="ai-chat-header__title">ИИ-консультант</span>
            <button
              type="button"
              className="ai-chat-header__btn ai-chat-header__btn--close"
              onClick={handleToggle}
              title="Закрыть чат"
              aria-label="Закрыть чат"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </header>

          {/* Тело чата */}
          <div ref={chatBodyRef} className="ai-chat-body">
            {/* Начальный экран с бело-фиолетовой сферой и вопросами в виде компонентов Tag */}
            {messages.length === 0 ? (
              <div className="ai-welcome-view">
                <div
                  className="ai-hero-orb"
                  aria-hidden="true"
                  style={{
                    background: 'radial-gradient(circle at 35% 30%, #ffffff 0%, #f0f3ff 28%, #a4b6f4 60%, #7d98f0 85%, #5366a4 100%)',
                    boxShadow: '0 0 32px rgba(125, 152, 240, 0.45), 0 0 16px rgba(164, 182, 244, 0.35)',
                  }}
                />
                <h3 className="ai-welcome-title">Задайте вопрос ИИ</h3>
                <p className="ai-welcome-subtitle">
                  Ответит на любой вопрос по нашим услугам
                </p>

                {/* Частые вопросы в виде компонентов тегов сайта */}
                <div className="ai-frequent-tags">
                  {FREQUENT_QUESTIONS.map((q, idx) => (
                    <Tag
                      key={idx}
                      as="button"
                      type="button"
                      className="hero__tag-btn ai-tag"
                      onClick={() => handleSelectQuestion(q)}
                    >
                      {q}
                    </Tag>
                  ))}
                </div>
              </div>
            ) : (
              /* Список сообщений */
              <div className="ai-messages-list">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ai-msg ${msg.sender === 'user' ? 'ai-msg--user' : 'ai-msg--assistant'} ${msg.showLeadForm && !leadSent ? 'ai-msg--has-form' : ''}`}
                  >
                    <div className="ai-msg__bubble">
                      <div className="ai-msg__text">{renderMessageContent(msg.text)}</div>

                      {/* Полноценная форма LeadForm со скрытым вопросом, плавающими лейблами и согласием на обработку ПД */}
                      {msg.showLeadForm && !leadSent && (
                        <div className="ai-msg__lead-wrapper" style={{ width: '100%' }}>
                          <LeadForm
                            id={`chat-lead-${msg.id}`}
                            className="lead-form--chat"
                            theme="light"
                            source="ai_chat_widget"
                            submitLabel="Отправить"
                            submitButtonClass="btn--modal"
                            hideQuestion={true}
                            hideSuccessModal={true}
                            footerLayout="column"
                            onSuccess={(data) => handleLeadSuccess(data)}
                          />
                        </div>
                      )}

                      {/* Быстрые кнопки действий */}
                      {msg.actions && msg.actions.length > 0 && !leadSent && (
                        <div className="ai-msg__actions">
                          {msg.actions.map((act, i) => (
                            <button
                              key={i}
                              type="button"
                              className="btn btn--primary-lg"
                              onClick={() => handleActionClick(act.actionKey, msg.id)}
                            >
                              <span>{act.label}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Индикатор набора текста */}
                {isTyping && (
                  <div className="ai-typing-indicator" aria-label="ИИ отвечает...">
                    <div className="ai-typing-dot" />
                    <div className="ai-typing-dot" />
                    <div className="ai-typing-dot" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Панель ввода */}
          <footer className="ai-chat-footer">
            <form className="ai-chat-input-bar" onSubmit={handleInputSubmit}>
              <input
                ref={inputRef}
                type="text"
                className="ai-chat-input-bar__field"
                placeholder="Message"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                className="ai-chat-input-bar__send"
                disabled={!inputText.trim() || isTyping}
                aria-label="Отправить"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="12" y1="19" x2="12" y2="5" />
                  <polyline points="5 12 12 5 19 12" />
                </svg>
              </button>
            </form>
            <p className="ai-chat-footer__hint">ИИ может ошибаться</p>
          </footer>
        </section>
      )}
    </>
  );
}
