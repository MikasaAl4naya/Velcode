'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ymGoal } from '@/lib/ym';
import { Tag } from '@/components/ui/Tag';
import { CloseButton } from '@/components/ui/CloseButton';
import { LeadForm } from '@/components/ui/LeadForm';
import { AiOrbAvatar } from '@/components/ui/AiOrbAvatar';
import { getFaq, FaqItem, sendChatMessage } from '@/lib/api';
import { renderMarkdownLinks } from '@/lib/renderMarkdownLinks';

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
  prefill?: {
    name?: string | null;
    phone?: string | null;
  };
}

const DEFAULT_FREQUENT_QUESTIONS = [
  'Сколько стоит разработка под ключ',
  'Какие услуги вы предоставляете',
  'Какие вы даете гарантии на работу',
];

const STORAGE_MSGS_KEY = 'velcode_ai_chat_messages_v1';
const STORAGE_TOPIC_KEY = 'velcode_ai_chat_topic_v1';
const STORAGE_PROFILE_KEY = 'velcode_ai_chat_profile_v1';
const MAX_INPUT_LENGTH = 300;

/**
 * Рендерит текст сообщения с поддержкой markdown-ссылок [текст](url)
 */
function renderMessageContent(text: string) {
  return renderMarkdownLinks(text, 'ai-chat-link');
}

export function AiChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatTopic, setChatTopic] = useState<string>('');
  const [userProfile, setUserProfile] = useState<{ name?: string; phone?: string }>({});
  const [leadSent, setLeadSent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [faqList, setFaqList] = useState<FaqItem[]>([]);

  const chatBodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname();
  const prevPathnameRef = useRef(pathname);

  // Сворачивать чат при переходе между страницами сайта
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      setIsOpen(false);
    }
  }, [pathname]);

  // Загрузка актуального FAQ из БД для быстрых вопросов
  useEffect(() => {
    let active = true;
    getFaq()
      .then((items) => {
        if (active && Array.isArray(items) && items.length > 0) {
          setFaqList(items);
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Первые 3 вопроса берутся динамически из FAQ (с безопасным фоллбеком)
  const frequentQuestions =
    faqList.length >= 3
      ? faqList.slice(0, 3).map((f) => f.question)
      : DEFAULT_FREQUENT_QUESTIONS;

  // Восстановление истории чата
  useEffect(() => {
    try {
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
      const savedTopic = localStorage.getItem(STORAGE_TOPIC_KEY);
      if (savedTopic) {
        setChatTopic(savedTopic);
      }
      const savedProfile = localStorage.getItem(STORAGE_PROFILE_KEY);
      if (savedProfile) {
        try {
          const parsedProf = JSON.parse(savedProfile);
          if (parsedProf && typeof parsedProf === 'object') {
            setUserProfile(parsedProf);
          }
        } catch {
          // ignore
        }
      }
    } catch {
      // ignore
    } finally {
      setIsMounted(true);
    }
  }, []);

  // Синхронизация сообщений и профиля с localStorage
  useEffect(() => {
    if (!isMounted) return;
    try {
      localStorage.setItem(STORAGE_MSGS_KEY, JSON.stringify(messages));
      if (chatTopic) {
        localStorage.setItem(STORAGE_TOPIC_KEY, chatTopic);
      }
      if (userProfile && (userProfile.name || userProfile.phone)) {
        localStorage.setItem(STORAGE_PROFILE_KEY, JSON.stringify(userProfile));
      }
    } catch {
      // ignore
    }
  }, [messages, chatTopic, userProfile, isMounted]);

  // Прокрутка чата строго внутри тела сообщений
  useEffect(() => {
    if (isOpen && chatBodyRef.current) {
      chatBodyRef.current.scrollTo({
        top: chatBodyRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, isTyping, isOpen]);

  // Фокус на поле ввода при открытии чата и после получения ответа от бота
  useEffect(() => {
    if (isOpen && !isTyping) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isTyping]);

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

  const addUserMessage = async (text: string) => {
    const cappedText = text.slice(0, MAX_INPUT_LENGTH);
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: cappedText,
    };

    // Если предыдущая заявка уже была отправлена, а пользователь пишет дальше — начинаем новый чистый диалог
    const baseMessages = leadSent ? [] : messages;
    if (leadSent) {
      setLeadSent(false);
      setChatTopic('');
      setUserProfile({});
    }

    // Очищаем кнопки действий и показ формы из всех предыдущих сообщений
    const sanitizedPrevious = baseMessages.map((m) => ({
      ...m,
      actions: undefined,
      showLeadForm: false,
    }));
    const nextMessages = [...sanitizedPrevious, userMsg];
    setMessages(nextMessages);
    setIsTyping(true);

    try {
      const historyPayload = nextMessages.slice(-5, -1).map((m) => ({
        role: m.sender,
        text: m.text,
      }));

      const apiResponse = await sendChatMessage(text, historyPayload, chatTopic, userProfile);
      if (apiResponse && apiResponse.text) {
        if (apiResponse.topic) {
          setChatTopic(apiResponse.topic);
        }

        let detectedName = apiResponse.prefill?.name || null;
        if (!detectedName) {
          const introMatch = text.match(/(?:меня\s+([А-ЯЁа-яё]+)\s+зовут|зовут\s+([А-ЯЁа-яё]+)|^я\s+([А-ЯЁа-яё]+)\b)/i);
          const found = introMatch ? (introMatch[1] || introMatch[2] || introMatch[3]) : null;
          if (found && found.length >= 2) {
            detectedName = found.charAt(0).toUpperCase() + found.slice(1);
          }
        }

        const updatedPrefill = {
          name: detectedName || userProfile.name || null,
          phone: apiResponse.prefill?.phone || userProfile.phone || null,
        };

        setUserProfile((prev) => ({
          name: detectedName || prev.name,
          phone: apiResponse.prefill?.phone || prev.phone,
        }));

        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: 'assistant',
            text: apiResponse.text,
            actions: apiResponse.show_lead_form ? [] : apiResponse.actions,
            showLeadForm: apiResponse.show_lead_form,
            prefill: updatedPrefill,
          },
        ]);
        setIsTyping(false);
        return;
      }
    } catch {
      // Игнорируем сетевые сбои и переходим на вежливый фоллбек
    }

    // Резервный ответ при недоступности сети
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: 'Извините, сервис онлайн-ответов временно недоступен. Вы можете оставить заявку ниже или связаться с нами по телефону +7 (924) 534 51 82 или в Telegram @VelcodeIRK — наш специалист свяжется с вами в течение 15 минут.',
        showLeadForm: true,
      },
    ]);
    setIsTyping(false);
  };

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTyping) return;
    const text = inputText.trim().slice(0, MAX_INPUT_LENGTH);
    if (!text) return;
    setInputText('');
    addUserMessage(text);
  };

  const handleSelectQuestion = (question: string) => {
    addUserMessage(question);
  };

  const handleActionClick = (actionKey: string, messageId: string) => {
    if (actionKey === 'show_lead_form') {
      const hasUnsubmittedForm = messages.some((m) => m.showLeadForm) && !leadSent;
      if (hasUnsubmittedForm) {
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
        prefill: {
          name: userProfile.name || null,
          phone: userProfile.phone || null,
        },
      };
      setMessages((prev) => [
        ...prev.map((m) => (m.id === messageId ? { ...m, actions: undefined } : m)),
        leadMsg,
      ]);
      return;
    }
  };

  const handleResetChat = () => {
    setMessages([]);
    setChatTopic('');
    setUserProfile({});
    setLeadSent(false);
    setInputText('');
    try {
      localStorage.removeItem(STORAGE_MSGS_KEY);
      localStorage.removeItem(STORAGE_TOPIC_KEY);
      localStorage.removeItem(STORAGE_PROFILE_KEY);
    } catch {
      // ignore
    }
  };

  const handleLeadSuccess = (data: { name: string; phone: string }) => {
    setLeadSent(true);
    setUserProfile({});
    const successMsg: Message = {
      id: `bot-done-${Date.now()}`,
      sender: 'assistant',
      text: `Спасибо${data.name ? ', ' + data.name : ''}! Ваша заявка успешно принята. Специалист скоро свяжется с вами по номеру ${data.phone}.`,
    };
    setMessages((prev) => [...prev, successMsg]);
  };

  // Виджет рендерится всегда после монтирования в браузере
  if (!isMounted) {
    return null;
  }

  return (
    <>
      {/* Кнопка открытия виджета: чисто сам персонаж до клика на чат */}
      {!isOpen && (
        <button
          type="button"
          className="ai-widget-launcher"
          onClick={handleToggle}
          aria-label="Открыть AI чат"
        >
          <AiOrbAvatar size={76} trackScope="window" enableShyOnClick={false} />
        </button>
      )}

      {/* Окно виджета */}
      {isOpen && (
        <section
          className="ai-chat-window"
          role="dialog"
          aria-label="Чат с ИИ-консультантом Велкод"
        >
          {/* Шапка чата с заголовком, кнопкой очистки и крестиком закрытия */}
          <header className="ai-chat-header">
            <span className="ai-chat-header__title">ИИ-консультант</span>
            <div className="ai-chat-header__actions">
              {messages.length > 0 && (
                <button
                  type="button"
                  className="ai-chat-header__btn"
                  onClick={handleResetChat}
                  title="Начать новый диалог"
                  aria-label="Начать новый диалог"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M8 16H3v5" />
                  </svg>
                </button>
              )}
              <CloseButton
                variant="chat"
                onClick={handleToggle}
                title="Закрыть чат"
                aria-label="Закрыть чат"
              />
            </div>
          </header>

          {/* Тело чата */}
          <div ref={chatBodyRef} className="ai-chat-body">
            {/* Начальный экран со сферой-персонажем и вопросами в виде компонентов Tag */}
            {messages.length === 0 ? (
              <div className="ai-welcome-view">
                <div style={{ marginBottom: '18px' }}>
                  <AiOrbAvatar size={76} trackScope="chat" enableShyOnClick={true} isTyping={isTyping} />
                </div>
                <h3 className="ai-welcome-title">Задайте вопрос ИИ</h3>
                <p className="ai-welcome-subtitle">
                  Ответит на любой вопрос по нашим услугам
                </p>

                {/* Частые вопросы в виде компонентов тегов сайта (первые 3 из FAQ) */}
                <div className="ai-frequent-tags">
                  {frequentQuestions.map((q, idx) => (
                    <Tag
                      key={idx}
                      as="button"
                      type="button"
                      className="ai-tag"
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
                {messages.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`ai-msg ${msg.sender === 'user' ? 'ai-msg--user' : 'ai-msg--assistant'} ${msg.showLeadForm && !leadSent ? 'ai-msg--has-form' : ''}`}
                  >
                    <div className="ai-msg__bubble">
                      <div className="ai-msg__text">{renderMessageContent(msg.text)}</div>

                      {/* Полноценная форма LeadForm со скрытым вопросом, плавающими лейблами и согласием на обработку ПД */}
                      {msg.showLeadForm && !leadSent && idx === messages.length - 1 && (
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
                            initialName={msg.prefill?.name || userProfile.name || ''}
                            initialPhone={msg.prefill?.phone || userProfile.phone || ''}
                            initialQuestion={chatTopic || 'Консультация из чата'}
                            onSuccess={(data) => handleLeadSuccess(data)}
                          />
                        </div>
                      )}

                      {/* Быстрые кнопки действий (показываем только у последнего сообщения, если форма не открыта) */}
                      {msg.actions && msg.actions.length > 0 && !msg.showLeadForm && !leadSent && idx === messages.length - 1 && (
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

                {/* Карточка завершения диалога после успешной отправки заявки */}
                {leadSent && (
                  <div className="ai-lead-completed-card">
                    <div className="ai-lead-completed-badge">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                      <span>Заявка успешно отправлена</span>
                    </div>
                    <p className="ai-lead-completed-text">
                      Менеджер получил ваши контакты и свяжется с вами. Хотите обсудить другой проект или задать вопрос?
                    </p>
                    <button
                      type="button"
                      className="btn btn--primary-lg ai-lead-restart-btn"
                      onClick={handleResetChat}
                    >
                      <span>Начать новый диалог</span>
                    </button>
                  </div>
                )}

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
                placeholder={isTyping ? "ИИ печатает ответ" : "Ваш вопрос"}
                maxLength={MAX_INPUT_LENGTH}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                autoComplete="off"
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
