import html
import hmac
import json
import re
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from markupsafe import Markup
from sqladmin import Admin, BaseView, ModelView, expose
from sqladmin.authentication import AuthenticationBackend
from sqlalchemy import select
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse, RedirectResponse

from app.config import settings
from app.database import AsyncSessionLocal, engine
from app.models import AiSettings, CompanyContact, Faq, Lead, Portfolio, Service, Tag

UPLOADS_DIR = Path("uploads")
ALLOWED_IMAGE_EXTENSIONS = {".png", ".jpg", ".jpeg", ".webp", ".gif", ".avif", ".ico"}
MAX_UPLOAD_SIZE = 10 * 1024 * 1024  # 10 MB

_TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd',
    'е': 'e', 'ё': 'yo', 'ж': 'zh', 'з': 'z', 'и': 'i',
    'й': 'j', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n',
    'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't',
    'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
    'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '',
    'э': 'e', 'ю': 'yu', 'я': 'ya',
}


def _slugify(text: str) -> str:
    text = text.lower()
    result = ''.join(_TRANSLIT.get(c, c) for c in text)
    result = re.sub(r'[^a-z0-9]+', '-', result)
    return result.strip('-')


def _img_thumb(url: str | None) -> str:
    if not url:
        return '—'
    return Markup(f'<img src="{url}" style="height:40px;border-radius:4px">')


class AdminAuth(AuthenticationBackend):
    async def login(self, request: Request) -> bool:
        form = await request.form()
        username = str(form.get("username", ""))
        password = str(form.get("password", ""))

        user_ok = hmac.compare_digest(username, settings.admin_username)
        pass_ok = hmac.compare_digest(password, settings.admin_password)

        if user_ok and pass_ok:
            request.session["authenticated"] = True
            return True
        return False

    async def logout(self, request: Request) -> bool:
        request.session.clear()
        return True

    async def authenticate(self, request: Request) -> bool:
        return bool(request.session.get("authenticated"))


class UploadView(BaseView):
    name = "Загрузить изображение"
    icon = "fa-solid fa-upload"

    @expose("/upload", methods=["GET", "POST"])
    async def upload_page(self, request: Request) -> HTMLResponse:
        uploaded_url = None
        error = None

        if request.method == "POST":
            form = await request.form()
            file = form.get("file")
            filename = getattr(file, "filename", "") or ""
            if file and filename:
                suffix = Path(filename).suffix.lower()
                if suffix not in ALLOWED_IMAGE_EXTENSIONS:
                    error = f"Недопустимый формат файла. Разрешены только изображения: {', '.join(sorted(ALLOWED_IMAGE_EXTENSIONS))}"
                else:
                    content = await file.read()
                    if not content:
                        error = "Файл пустой"
                    elif len(content) > MAX_UPLOAD_SIZE:
                        error = "Файл превышает максимально допустимый размер 10 МБ"
                    else:
                        UPLOADS_DIR.mkdir(exist_ok=True)
                        fname = f"{uuid4().hex}{suffix}"
                        (UPLOADS_DIR / fname).write_bytes(content)
                        uploaded_url = f"/uploads/{fname}"
            else:
                error = "Выберите файл"

        result_block = ""
        if uploaded_url:
            result_block = f"""
            <div class="result">
                <strong>Готово! Скопируйте URL в поле формы:</strong>
                <input type="text" id="url-field" readonly value="{uploaded_url}" onclick="this.select()">
                <button onclick="copyUrl()" type="button" id="copy-btn">Копировать</button>
                <br>
                <img src="{uploaded_url}" class="preview" alt="preview">
            </div>
            """

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Загрузить изображение — Велкод Admin</title>
            <style>
                body {{ font-family: sans-serif; max-width: 600px; margin: 60px auto; padding: 0 20px; }}
                h1 {{ font-size: 22px; margin-bottom: 24px; }}
                .drop-zone {{
                    border: 2px dashed #a5b4fc; border-radius: 12px; padding: 48px 24px;
                    text-align: center; cursor: pointer; background: #f8f8ff;
                    transition: background .2s, border-color .2s; margin-bottom: 16px;
                }}
                .drop-zone.dragover {{ background: #eef2ff; border-color: #4f46e5; }}
                .drop-zone__icon {{ font-size: 40px; margin-bottom: 12px; }}
                .drop-zone__text {{ color: #6b7280; font-size: 15px; }}
                .drop-zone__text b {{ color: #4f46e5; }}
                .drop-zone__filename {{ margin-top: 10px; font-size: 13px; color: #4f46e5; font-weight: 600; }}
                input[type=file] {{ display: block; margin: 12px 0; font-size: 14px; }}
                button {{ padding: 10px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; }}
                .result {{ margin-top: 24px; padding: 16px; background: #f0fdf4; border: 1px solid #86efac; border-radius: 8px; }}
                #url-field {{ display: block; width: 100%; font-size: 14px; margin: 8px 0 10px; padding: 8px; border-radius: 4px; border: 1px solid #d1fae5; background: #fff; box-sizing: border-box; cursor: text; }}
                .preview {{ max-width: 100%; max-height: 200px; margin-top: 12px; border-radius: 6px; }}
                .error {{ margin-top: 16px; padding: 12px; background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; color: #dc2626; }}
                .back {{ display: inline-block; margin-bottom: 20px; color: #4f46e5; text-decoration: none; }}
            </style>
        </head>
        <body>
            <a href="/admin" class="back">← Назад в админку</a>
            <h1>Загрузить изображение</h1>
            <form method="post" enctype="multipart/form-data" id="upload-form">
                <div class="drop-zone" id="drop-zone">
                    <div class="drop-zone__icon">🖼️</div>
                    <div class="drop-zone__text">Перетащите файл сюда<br>или выберите ниже</div>
                    <div class="drop-zone__filename" id="filename"></div>
                </div>
                <input type="file" name="file" id="file-input" accept="image/*">
                <button type="submit">Загрузить</button>
            </form>
            {"" if not error else f'<div class="error">{error}</div>'}
            {result_block}
            <script>
            var dropZone = document.getElementById('drop-zone');
            var fileInput = document.getElementById('file-input');
            var filenameEl = document.getElementById('filename');

            dropZone.addEventListener('dragover', function(e) {{
                e.preventDefault();
                dropZone.classList.add('dragover');
            }});
            dropZone.addEventListener('dragleave', function() {{
                dropZone.classList.remove('dragover');
            }});
            dropZone.addEventListener('drop', function(e) {{
                e.preventDefault();
                dropZone.classList.remove('dragover');
                var files = e.dataTransfer.files;
                if (!files.length) return;
                try {{
                    var dt = new DataTransfer();
                    dt.items.add(files[0]);
                    fileInput.files = dt.files;
                }} catch(ex) {{}}
                filenameEl.textContent = files[0].name;
            }});

            fileInput.addEventListener('change', function() {{
                if (fileInput.files.length) filenameEl.textContent = fileInput.files[0].name;
            }});

            function copyUrl() {{
                var field = document.getElementById('url-field');
                var btn = document.getElementById('copy-btn');
                field.select();
                field.setSelectionRange(0, 99999);
                if (navigator.clipboard && window.isSecureContext) {{
                    navigator.clipboard.writeText(field.value).then(function() {{
                        btn.textContent = 'Скопировано ✓';
                        setTimeout(function() {{ btn.textContent = 'Копировать'; }}, 2000);
                    }});
                }} else {{
                    try {{
                        document.execCommand('copy');
                        btn.textContent = 'Скопировано ✓';
                        setTimeout(function() {{ btn.textContent = 'Копировать'; }}, 2000);
                    }} catch(e) {{
                        btn.textContent = 'Выделите и скопируйте вручную (Ctrl+C)';
                    }}
                }}
            }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(html)


class UploadsManagerView(BaseView):
    name = "Управление загрузками"
    icon = "fa-solid fa-folder-open"

    @expose("/uploads-manager", methods=["GET", "POST"])
    async def uploads_manager(self, request: Request) -> HTMLResponse | JSONResponse:
        if request.method == "POST":
            try:
                data = await request.json()
                name = str(data.get("name", "")).strip()
                if not name or "/" in name or "\\" in name or name.startswith("."):
                    return JSONResponse({"error": "invalid name"}, status_code=400)
                base_dir = UPLOADS_DIR.resolve()
                target = (UPLOADS_DIR / name).resolve()
                if not str(target).startswith(str(base_dir)) or not target.is_file():
                    return JSONResponse({"error": "not found"}, status_code=404)
                target.unlink()
                return JSONResponse({"ok": True})
            except Exception:
                return JSONResponse({"error": "server error"}, status_code=500)

        files = []
        if UPLOADS_DIR.exists():
            for f in sorted(UPLOADS_DIR.iterdir(), key=lambda x: x.stat().st_mtime, reverse=True):
                if f.is_file():
                    stat = f.stat()
                    size_kb = stat.st_size / 1024
                    mtime = datetime.fromtimestamp(stat.st_mtime).strftime("%d.%m.%Y %H:%M")
                    files.append({"name": f.name, "size": f"{size_kb:.1f} КБ", "mtime": mtime, "url": f"/uploads/{f.name}"})

        rows = ""
        for f in files:
            ext = f["name"].rsplit(".", 1)[-1].lower() if "." in f["name"] else ""
            is_img = ext in ("jpg", "jpeg", "png", "gif", "webp", "avif", "ico")
            escaped_name = html.escape(f["name"])
            thumb = f'<img src="{f["url"]}" style="height:36px;border-radius:4px;object-fit:cover;vertical-align:middle">' if is_img else "—"
            rows += f"""
            <tr>
                <td style="text-align:center">{thumb}</td>
                <td><code style="font-size:12px">{escaped_name}</code></td>
                <td>{f["size"]}</td>
                <td>{f["mtime"]}</td>
                <td>
                    <a href="{f["url"]}" target="_blank" style="color:#4f46e5;margin-right:8px">Открыть</a>
                    <button onclick="deleteFile('{escaped_name}')" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:13px">Удалить</button>
                </td>
            </tr>"""

        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Загрузки — Велкод Admin</title>
            <style>
                body {{ font-family: sans-serif; max-width: 960px; margin: 40px auto; padding: 0 20px; }}
                h1 {{ font-size: 22px; margin-bottom: 8px; }}
                .top-bar {{ display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }}
                .count {{ color: #6b7280; font-size: 14px; margin: 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th {{ text-align: left; padding: 10px 12px; background: #f3f4f6; font-size: 13px; border-bottom: 2px solid #e5e7eb; }}
                td {{ padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; vertical-align: middle; }}
                tr:hover {{ background: #fafafa; }}
                .btn-link {{ display: inline-block; padding: 6px 14px; background: #4f46e5; color: #fff; text-decoration: none; border-radius: 6px; font-size: 13px; }}
                .back {{ display: inline-block; margin-bottom: 20px; color: #4f46e5; text-decoration: none; }}
                .empty {{ color: #9ca3af; margin-top: 40px; text-align: center; }}
            </style>
        </head>
        <body>
            <a href="/admin" class="back">← Назад в админку</a>
            <h1>Управление загрузками</h1>
            <div class="top-bar">
                <p class="count">Файлов: {len(files)}</p>
                <a href="/admin/upload" class="btn-link">+ Загрузить изображение</a>
            </div>
            {"" if files else '<p class="empty">Папка uploads пуста</p>'}
            {"<table><thead><tr><th>Превью</th><th>Имя файла</th><th>Размер</th><th>Дата</th><th>Действия</th></tr></thead><tbody>" + rows + "</tbody></table>" if files else ""}
            <script>
            async function deleteFile(name) {{
                if (!confirm('Удалить файл ' + name + '?')) return;
                const r = await fetch('/admin/uploads-manager', {{
                    method: 'POST',
                    headers: {{'Content-Type': 'application/json'}},
                    body: JSON.stringify({{name}})
                }});
                if (r.ok) location.reload();
                else alert('Ошибка удаления');
            }}
            </script>
        </body>
        </html>
        """
        return HTMLResponse(html)


class LeadAdmin(ModelView, model=Lead):
    name = "Заявка"
    name_plural = "Заявки"
    icon = "fa-solid fa-envelope"

    column_list = [Lead.id, Lead.name, Lead.phone, Lead.question, Lead.source, Lead.created_at]
    column_sortable_list = [Lead.id, Lead.created_at]
    column_searchable_list = [Lead.name, Lead.phone]
    column_default_sort = [(Lead.created_at, True)]

    column_labels = {
        "id": "ID",
        "name": "Имя",
        "phone": "Телефон",
        "question": "Вопрос",
        "source": "Источник",
        "created_at": "Дата",
    }

    can_create = False
    can_edit = False
    can_delete = True


class TagAdmin(ModelView, model=Tag):
    name = "Тег"
    name_plural = "Теги"
    icon = "fa-solid fa-tag"

    column_list = [Tag.id, Tag.name]
    column_searchable_list = [Tag.name]
    column_labels = {"id": "ID", "name": "Название"}

    form_columns = [Tag.name]


class PortfolioAdmin(ModelView, model=Portfolio):
    name = "Кейс"
    name_plural = "Портфолио"
    icon = "fa-solid fa-briefcase"

    column_list = [Portfolio.id, Portfolio.title, Portfolio.image_url, Portfolio.show_on_main, Portfolio.sort_order]
    column_formatters = {Portfolio.image_url: lambda m, a: _img_thumb(m.image_url)}
    column_searchable_list = [Portfolio.title, Portfolio.slug]
    column_sortable_list = [Portfolio.sort_order, Portfolio.id]

    form_columns = [
        Portfolio.slug,
        Portfolio.title,
        Portfolio.description,
        Portfolio.what_was_done,
        Portfolio.screenshots,
        Portfolio.image_url,
        Portfolio.hero_image_url,
        Portfolio.site_url,
        Portfolio.tags_list,
        Portfolio.show_on_main,
        Portfolio.sort_order,
    ]
    column_labels = {
        "slug": "URL-слаг (авто из названия, если пусто)",
        "image_url": "Картинка кейса — карточка + браузер-мокап (URL из «Загрузить изображение»)",
        "hero_image_url": "Фото на ноутбуке / устройстве — только на странице кейса (URL из «Загрузить изображение»)",
        "site_url": "URL в строке браузер-мокапа (напр. trattoria.ru/)",
        "tags_list": "Теги",
        "what_was_done": "Что было сделано (абзацы через пустую строку)",
        "screenshots": "Скриншоты проекта (по одному URL на строку, неограниченно)",
        "show_on_main": "Показывать на главной странице",
        "sort_order": "Порядок",
    }

    async def on_model_change(self, data: dict, model, is_created: bool, request: Request) -> None:
        if not str(data.get("slug") or "").strip() and data.get("title"):
            data["slug"] = _slugify(str(data["title"]))

    async def after_model_change(self, data: dict, model, is_created: bool, request: Request) -> None:
        from sqlalchemy import select, update as sa_update
        from app.database import AsyncSessionLocal
        from app.models import Tag, portfolio_tag

        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(Tag.name)
                .join(portfolio_tag, Tag.id == portfolio_tag.c.tag_id)
                .where(portfolio_tag.c.portfolio_id == model.id)
                .order_by(Tag.name)
            )
            tag_names = sorted([row[0] for row in result.all()])
            await session.execute(
                sa_update(Portfolio).where(Portfolio.id == model.id).values(tags=", ".join(tag_names))
            )
            await session.commit()

        # Автоматическая пересборка базы знаний ИИ при создании/изменении кейса
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")

    async def after_model_delete(self, model, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")


class ServiceAdmin(ModelView, model=Service):
    name = "Услуга"
    name_plural = "Услуги"
    icon = "fa-solid fa-list"

    column_list = [Service.id, Service.title, Service.short_title, Service.price_full, Service.is_featured, Service.sort_order]
    column_sortable_list = [Service.sort_order, Service.id]
    column_searchable_list = [Service.title]

    form_columns = [
        Service.title,
        Service.short_title,
        Service.description,
        Service.price_full,
        Service.is_featured,
        Service.image_url,
        Service.sort_order,
    ]
    column_labels = {
        "title": "Название",
        "short_title": "Сокращённое название (для плашки на главной)",
        "description": "Описание",
        "price_full": "Цена (₽)",
        "is_featured": "Фиолетовая карточка",
        "image_url": "Картинка (URL из «Загрузить изображение»)",
        "sort_order": "Порядок",
    }

    async def after_model_change(self, data: dict, model, is_created: bool, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")

    async def after_model_delete(self, model, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")


class FaqAdmin(ModelView, model=Faq):
    name = "FAQ / Регламент"
    name_plural = "FAQ / Регламенты"
    icon = "fa-solid fa-question"

    column_list = [Faq.id, Faq.question, Faq.sort_order]
    column_searchable_list = [Faq.question, Faq.answer]
    column_sortable_list = [Faq.sort_order, Faq.id]

    form_columns = [Faq.question, Faq.answer, Faq.sort_order]
    column_labels = {
        "question": "Вопрос",
        "answer": "Ответ",
        "sort_order": "Порядок",
    }

    async def after_model_change(self, data: dict, model, is_created: bool, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")

    async def after_model_delete(self, model, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")


class CompanyContactAdmin(ModelView, model=CompanyContact):
    name = "Контакты и реквизиты"
    name_plural = "Контакты и реквизиты"
    icon = "fa-solid fa-address-book"

    column_list = [
        CompanyContact.id,
        CompanyContact.company_name,
        CompanyContact.inn,
        CompanyContact.ogrnip,
        CompanyContact.phone,
        CompanyContact.email,
        CompanyContact.telegram_url,
        CompanyContact.max_url,
    ]
    column_labels = {
        "id": "ID",
        "company_name": "Организация / ИП",
        "inn": "ИНН",
        "ogrnip": "ОГРНИП / ОГРН",
        "phone": "Телефон",
        "email": "Email",
        "telegram_url": "Ссылка на Telegram",
        "max_url": "Ссылка на MAX",
    }
    form_columns = [
        CompanyContact.company_name,
        CompanyContact.inn,
        CompanyContact.ogrnip,
        CompanyContact.phone,
        CompanyContact.email,
        CompanyContact.telegram_url,
        CompanyContact.max_url,
    ]

    async def after_model_change(self, data: dict, model, is_created: bool, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")

    async def after_model_delete(self, model, request: Request) -> None:
        try:
            from scripts.build_knowledge_base import rebuild_knowledge_base
            await rebuild_knowledge_base()
        except Exception as e:
            print(f"[Admin] Ошибка пересборки базы знаний ИИ: {e}")


class AiSettingsView(BaseView):
    name = "Настройки ИИ"
    icon = "fa-solid fa-robot"

    @expose("/ai-settings", methods=["GET", "POST"])
    async def ai_settings_page(self, request: Request) -> HTMLResponse | JSONResponse:
        if not request.session.get("authenticated"):
            return RedirectResponse(url="/admin/login", status_code=302)

        async with AsyncSessionLocal() as session:
            res = await session.execute(select(AiSettings).limit(1))
            row = res.scalars().first()
            if not row:
                from app.services.ai_chat import DEFAULT_FAST_RESPONSES
                prompt_file = Path("knowledge_base/system_prompt.md")
                def_prompt = prompt_file.read_text(encoding="utf-8").strip() if prompt_file.exists() else ""
                row = AiSettings(
                    is_active=True,
                    model="gpt-4o-mini",
                    temperature=0.4,
                    max_tokens=450,
                    base_url=None,
                    rag_threshold=0.5,
                    rag_top_k=2,
                    custom_stop_words="",
                    system_prompt=def_prompt,
                    fast_responses_json=json.dumps(DEFAULT_FAST_RESPONSES, ensure_ascii=False),
                    minute_limit=15,
                )
                session.add(row)
                await session.commit()
                await session.refresh(row)

            if request.method == "POST":
                try:
                    content_type = request.headers.get("content-type", "")
                    if "application/json" in content_type:
                        payload = await request.json()
                    else:
                        form = await request.form()
                        payload = dict(form)
                        if "fast_responses" in payload and isinstance(payload["fast_responses"], str):
                            try:
                                payload["fast_responses"] = json.loads(payload["fast_responses"])
                            except Exception:
                                pass

                    row.is_active = bool(payload.get("is_active", True))
                    row.model = str(payload.get("model", "gpt-4o-mini")).strip() or "gpt-4o-mini"
                    row.temperature = float(payload.get("temperature", 0.4))
                    row.max_tokens = int(payload.get("max_tokens", 450))
                    row.base_url = str(payload.get("base_url", "")).strip() or None
                    row.rag_threshold = float(payload.get("rag_threshold", 0.5))
                    row.rag_top_k = int(payload.get("rag_top_k", 2))
                    row.custom_stop_words = str(payload.get("custom_stop_words", "")).strip()
                    row.system_prompt = str(payload.get("system_prompt", "")).strip()
                    row.minute_limit = int(payload.get("minute_limit", 15))

                    raw_rules = payload.get("fast_responses")
                    if raw_rules is not None:
                        if isinstance(raw_rules, str):
                            row.fast_responses_json = raw_rules
                        elif isinstance(raw_rules, list):
                            row.fast_responses_json = json.dumps(raw_rules, ensure_ascii=False)

                    session.add(row)
                    await session.commit()

                    from app.services.ai_chat import ai_chat_service
                    await ai_chat_service.reload_settings()

                    if "application/json" in content_type:
                        return JSONResponse({"ok": True, "message": "Настройки успешно сохранены!"})
                    return RedirectResponse(url="/admin/ai-settings?saved=1", status_code=303)
                except Exception as e:
                    if "application/json" in request.headers.get("content-type", ""):
                        return JSONResponse({"ok": False, "error": str(e)}, status_code=400)
                    return HTMLResponse(f"Ошибка сохранения: {e}", status_code=500)

            # GET: подготовка данных для интерфейса
            from app.services.ai_chat import _parse_fast_responses
            rules = _parse_fast_responses(row.fast_responses_json)
            rules_data = [
                {
                    "id": r.id,
                    "title": r.title,
                    "triggers": ", ".join(r.triggers) if isinstance(r.triggers, list) else str(r.triggers),
                    "response": r.response,
                    "is_active": r.is_active,
                }
                for r in rules
            ]
            rules_json_str = json.dumps(rules_data, ensure_ascii=False)

            is_active_checked = "checked" if row.is_active else ""
            model_val = html.escape(row.model or "gpt-4o-mini")
            temp_val = f"{row.temperature:.2f}"
            max_tokens_val = str(row.max_tokens)
            base_url_val = html.escape(row.base_url or "")
            rag_threshold_val = f"{row.rag_threshold:.2f}"
            rag_top_k_val = str(row.rag_top_k)
            custom_stops_val = html.escape(row.custom_stop_words or "")
            system_prompt_val = html.escape(row.system_prompt or "")
            minute_limit_val = str(getattr(row, "minute_limit", 15))

        html_content = f"""<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
    <title>Настройки ИИ — Велкод Admin</title>
    <link rel="stylesheet" href="/admin/statics/css/tabler.min.css">
    <link rel="stylesheet" href="/admin/statics/css/fontawesome.min.css">
    <style>
        body {{ background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }}
        .settings-container {{ max-width: 980px; margin: 32px auto; padding: 0 20px 80px; }}
        .card {{ border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); margin-bottom: 24px; background: #fff; }}
        .card-header {{ background: #f8fafc; border-bottom: 1px solid #e2e8f0; padding: 16px 20px; border-radius: 12px 12px 0 0; }}
        .card-title {{ font-size: 16px; font-weight: 600; color: #1e293b; margin: 0; display: flex; align-items: center; gap: 8px; }}
        .card-body {{ padding: 20px; }}
        .form-label {{ font-weight: 500; font-size: 13.5px; color: #334155; margin-bottom: 6px; }}
        .form-hint {{ font-size: 12px; color: #64748b; margin-top: 4px; }}
        .form-control {{ border-radius: 8px; border: 1px solid #cbd5e1; font-size: 14px; padding: 8px 12px; }}
        .form-control:focus {{ border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59,130,246,0.15); }}
        .rule-card {{ border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px; margin-bottom: 16px; background: #f8fafc; transition: all .2s; }}
        .rule-card:hover {{ border-color: #cbd5e1; background: #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.03); }}
        .badge-chip {{ cursor: pointer; padding: 3px 8px; background: #e2e8f0; border-radius: 6px; font-size: 12px; color: #475569; display: inline-block; margin-right: 4px; transition: background .15s; }}
        .badge-chip:hover {{ background: #cbd5e1; color: #0f172a; }}
        .sticky-footer {{ position: sticky; bottom: 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(8px); border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 20px; box-shadow: 0 4px 14px rgba(0,0,0,0.08); display: flex; align-items: center; justify-content: space-between; z-index: 100; }}
        .btn-save {{ background: #2563eb; color: #fff; border: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: background .2s; }}
        .btn-save:hover {{ background: #1d4ed8; }}
        .btn-save:disabled {{ opacity: 0.6; cursor: not-allowed; }}
        .top-nav {{ display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }}
        .back-link {{ color: #475569; text-decoration: none; font-size: 14px; display: inline-flex; align-items: center; gap: 6px; font-weight: 500; }}
        .back-link:hover {{ color: #2563eb; }}
        #alert-box {{ display: none; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px; font-size: 14px; font-weight: 500; }}
        #alert-box.success {{ display: block; background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }}
        #alert-box.danger {{ display: block; background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }}
    </style>
</head>
<body>
    <div class="settings-container">
        <div class="top-nav">
            <a href="/admin" class="back-link">
                <i class="fa-solid fa-arrow-left"></i> Назад в панель администратора
            </a>
            <span class="badge bg-blue-lt px-3 py-2" style="font-size:13px">Панель управления ИИ</span>
        </div>

        <div class="d-flex align-items-center justify-content-between mb-4">
            <div>
                <h1 style="font-size:24px;font-weight:700;color:#0f172a;margin:0 0 6px 0">
                    🤖 Настройки ИИ-консультанта
                </h1>
                <p style="color:#64748b;margin:0;font-size:14px">
                    Управляйте параметрами языковой модели, системным промптом, динамическими быстрыми ответами и защитой от спама.
                </p>
            </div>
        </div>

        <div id="alert-box"></div>

        <!-- 1. Основное и языковая модель -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fa-solid fa-sliders text-primary"></i> Параметры нейросети (LLM)
                </h3>
            </div>
            <div class="card-body">
                <div class="mb-3 d-flex align-items-center justify-content-between p-3 rounded" style="background:#f1f5f9">
                    <div>
                        <strong style="color:#0f172a;font-size:14px">ИИ-консультант активен на сайте</strong>
                        <div class="form-hint">Если выключить — чат покажет вежливую заглушку и форму заявки</div>
                    </div>
                    <label class="form-check form-switch cursor-pointer m-0">
                        <input class="form-check-input" type="checkbox" id="field-is-active" {is_active_checked} style="width:40px;height:22px">
                    </label>
                </div>

                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Модель нейросети</label>
                        <input type="text" class="form-control" id="field-model" value="{model_val}" placeholder="например: gpt-4o-mini">
                        <div class="mt-2">
                            <span class="badge-chip" onclick="setModel('gpt-4o-mini')">gpt-4o-mini</span>
                            <span class="badge-chip" onclick="setModel('gpt-4o')">gpt-4o</span>
                            <span class="badge-chip" onclick="setModel('gpt-3.5-turbo')">gpt-3.5-turbo</span>
                        </div>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Температура (креативность)</label>
                        <input type="number" step="0.05" min="0.0" max="1.0" class="form-control" id="field-temperature" value="{temp_val}">
                        <div class="form-hint">0.0 — строгие ответы, 0.4 — баланс, 0.8+ — свободные</div>
                    </div>

                    <div class="col-md-3">
                        <label class="form-label">Максимум токенов</label>
                        <input type="number" step="50" min="100" max="2000" class="form-control" id="field-max-tokens" value="{max_tokens_val}">
                        <div class="form-hint">Лимит длины одного ответа (по умолч. 450)</div>
                    </div>

                    <div class="col-12">
                        <label class="form-label">API Base URL (опционально)</label>
                        <input type="text" class="form-control" id="field-base-url" value="{base_url_val}" placeholder="Оставьте пустым, чтобы использовать адрес из .env">
                        <div class="form-hint">Позволяет переопределить эндпоинт провайдера без правки файлов сервера</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 2. Системный промпт -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fa-solid fa-scroll text-primary"></i> Системный промпт (Инструкция для роли ИИ)
                </h3>
            </div>
            <div class="card-body">
                <textarea id="field-system-prompt" class="form-control" rows="12" style="font-family:monospace;font-size:13px;line-height:1.5;resize:vertical">{system_prompt_val}</textarea>
                <div class="form-hint mt-2">
                    Здесь задается характер консультанта, правила форматирования ссылок <code>[Текст](/url)</code> и регламент сбора заявок.
                </div>
            </div>
        </div>

        <!-- 3. База знаний и RAG -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fa-solid fa-brain text-primary"></i> Поиск по базе знаний (RAG)
                </h3>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Порог уверенности RAG (score threshold)</label>
                        <input type="number" step="0.05" min="0.0" max="2.0" class="form-control" id="field-rag-threshold" value="{rag_threshold_val}">
                        <div class="form-hint">По умолчанию 0.5. Отсекает нерелевантные статьи базы знаний для простых фраз, экономя токены.</div>
                    </div>

                    <div class="col-md-6">
                        <label class="form-label">Количество статей базы знаний (top_k)</label>
                        <input type="number" min="1" max="5" class="form-control" id="field-rag-top-k" value="{rag_top_k_val}">
                        <div class="form-hint">Сколько наиболее точных фрагментов подмешивать к вопросу (по умолчанию 2).</div>
                    </div>

                    <div class="col-12">
                        <label class="form-label">Дополнительные стоп-слова для поиска</label>
                        <textarea id="field-custom-stop-words" class="form-control" rows="2" placeholder="например: сайт, разработка, вопрос">{custom_stops_val}</textarea>
                        <div class="form-hint">Слова через запятую или пробел, которые поисковик базы знаний должен игнорировать.</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- 4. Динамические быстрые ответы -->
        <div class="card">
            <div class="card-header d-flex align-items-center justify-content-between">
                <div>
                    <h3 class="card-title">
                        <i class="fa-solid fa-bolt text-warning"></i> Динамические быстрые ответы (Fast-Path)
                    </h3>
                    <div class="form-hint mt-1">
                        Если сообщение пользователя совпадает с ключевыми словами правила, ответ выдается мгновенно (0 мс, 0 токенов нейросети).
                    </div>
                </div>
                <button type="button" class="btn btn-sm btn-outline-primary" onclick="addRule()">
                    <i class="fa-solid fa-plus me-1"></i> Добавить правило
                </button>
            </div>
            <div class="card-body">
                <div id="rules-container"></div>
            </div>
        </div>

        <!-- 5. Защита от спама -->
        <div class="card">
            <div class="card-header">
                <h3 class="card-title">
                    <i class="fa-solid fa-shield-halved text-success"></i> Защита от спама (Rate Limiter)
                </h3>
            </div>
            <div class="card-body">
                <div class="row g-3">
                    <div class="col-md-6">
                        <label class="form-label">Лимит запросов в минуту на один IP</label>
                        <input type="number" min="1" max="120" class="form-control" id="field-minute-limit" value="{minute_limit_val}">
                        <div class="form-hint">По умолчанию 15 обращений в минуту. Достаточно для живого человека и надежно отсекает скрипты.</div>
                    </div>
                    <div class="col-md-6 d-flex align-items-center">
                        <div class="p-3 rounded text-muted" style="background:#f1f5f9;font-size:12.5px;line-height:1.4">
                            <i class="fa-solid fa-check text-success me-1"></i> <strong>Оптимизированная защита:</strong> избыточные 6-секундный и часовой фильтры отключены, чтобы не блокировать реальных клиентов из офисов и мобильных сетей. Защита от повторных кликов (&lt; 3 сек) включена автоматически.
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sticky action footer -->
        <div class="sticky-footer">
            <div class="d-flex align-items-center gap-2">
                <i class="fa-solid fa-cloud-arrow-up text-primary"></i>
                <span style="font-size:13px;color:#475569">Изменения применятся в памяти работающего бота мгновенно</span>
            </div>
            <button type="button" class="btn-save" id="save-btn" onclick="saveAll()">
                <i class="fa-solid fa-floppy-disk me-1"></i> Сохранить все настройки
            </button>
        </div>
    </div>

    <script>
    var initialRules = {rules_json_str};

    function setModel(name) {{
        document.getElementById('field-model').value = name;
    }}

    function showAlert(type, text) {{
        var box = document.getElementById('alert-box');
        box.className = type;
        box.textContent = text;
        window.scrollTo({{ top: 0, behavior: 'smooth' }});
        if (type === 'success') {{
            setTimeout(function() {{ box.style.display = 'none'; }}, 4000);
        }}
    }}

    function renderRules() {{
        var container = document.getElementById('rules-container');
        container.innerHTML = '';

        if (!initialRules.length) {{
            container.innerHTML = '<p class="text-muted text-center py-3">Нет активных правил. Нажмите «Добавить правило», чтобы создать.</p>';
            return;
        }}

        initialRules.forEach(function(rule, idx) {{
            var card = document.createElement('div');
            card.className = 'rule-card';
            card.dataset.id = rule.id || ('rule_' + idx);

            var isChecked = rule.is_active ? 'checked' : '';

            card.innerHTML = `
                <div class="d-flex align-items-center justify-content-between mb-2">
                    <div class="d-flex align-items-center gap-2" style="flex:1;max-width:400px">
                        <span class="badge bg-secondary-lt" style="font-size:11px">Правило #${{idx + 1}}</span>
                        <input type="text" class="form-control form-control-sm rule-title" value="${{escapeHtml(rule.title || '')}}" placeholder="Название (например, Прощание)">
                    </div>
                    <div class="d-flex align-items-center gap-3">
                        <label class="form-check form-switch cursor-pointer m-0" title="Включить / выключить правило">
                            <input class="form-check-input rule-active" type="checkbox" ${{isChecked}}>
                        </label>
                        <button type="button" class="btn btn-sm btn-outline-danger" onclick="removeRule(${{idx}})" title="Удалить правило">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                <div class="mb-2">
                    <label class="form-label" style="font-size:12px;margin-bottom:3px">Ключевые слова и фразы (через запятую или новую строку):</label>
                    <textarea class="form-control form-control-sm rule-triggers" rows="2" placeholder="пока, до свидания, до скорого, прощай">${{escapeHtml(rule.triggers || '')}}</textarea>
                </div>

                <div>
                    <label class="form-label" style="font-size:12px;margin-bottom:3px">Готовый ответ консультанта (0 токенов):</label>
                    <textarea class="form-control form-control-sm rule-response" rows="2" placeholder="Текст ответа бота клиенту...">${{escapeHtml(rule.response || '')}}</textarea>
                </div>
            `;
            container.appendChild(card);
        }});
    }}

    function addRule() {{
        syncRulesFromDOM();
        initialRules.push({{
            id: 'rule_' + Date.now(),
            title: 'Новое правило',
            triggers: 'фраза 1, фраза 2',
            response: 'Ответ на это правило...',
            is_active: true
        }});
        renderRules();
    }}

    function removeRule(idx) {{
        syncRulesFromDOM();
        if (confirm('Удалить правило «' + (initialRules[idx].title || '') + '»?')) {{
            initialRules.splice(idx, 1);
            renderRules();
        }}
    }}

    function syncRulesFromDOM() {{
        var cards = document.querySelectorAll('.rule-card');
        var updated = [];
        cards.forEach(function(card, idx) {{
            var id = card.dataset.id || ('rule_' + idx);
            var title = card.querySelector('.rule-title').value.trim();
            var triggers = card.querySelector('.rule-triggers').value.trim();
            var response = card.querySelector('.rule-response').value.trim();
            var isActive = card.querySelector('.rule-active').checked;
            updated.push({{
                id: id,
                title: title,
                triggers: triggers,
                response: response,
                is_active: isActive
            }});
        }});
        if (cards.length) {{
            initialRules = updated;
        }}
    }}

    function escapeHtml(text) {{
        return (text || '').toString()
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }}

    async function saveAll() {{
        syncRulesFromDOM();

        var saveBtn = document.getElementById('save-btn');
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fa fa-spinner fa-spin me-1"></i> Сохраняем...';

        var formattedRules = initialRules.map(function(r) {{
            var trigList = (r.triggers || '').split(/[\n,]+/).map(function(s) {{ return s.trim(); }}).filter(Boolean);
            return {{
                id: r.id,
                title: r.title,
                triggers: trigList,
                response: r.response,
                is_active: r.is_active
            }};
        }});

        var payload = {{
            is_active: document.getElementById('field-is-active').checked,
            model: document.getElementById('field-model').value.trim(),
            temperature: parseFloat(document.getElementById('field-temperature').value) || 0.4,
            max_tokens: parseInt(document.getElementById('field-max-tokens').value) || 450,
            base_url: document.getElementById('field-base-url').value.trim(),
            rag_threshold: parseFloat(document.getElementById('field-rag-threshold').value) || 0.5,
            rag_top_k: parseInt(document.getElementById('field-rag-top-k').value) || 2,
            custom_stop_words: document.getElementById('field-custom-stop-words').value.trim(),
            system_prompt: document.getElementById('field-system-prompt').value.trim(),
            minute_limit: parseInt(document.getElementById('field-minute-limit').value) || 15,
            fast_responses: formattedRules
        }};

        try {{
            var res = await fetch('/admin/ai-settings', {{
                method: 'POST',
                headers: {{ 'Content-Type': 'application/json' }},
                body: JSON.stringify(payload)
            }});
            var data = await res.json();
            if (data.ok) {{
                showAlert('success', '✓ Все настройки ИИ успешно сохранены и применены!');
            }} else {{
                showAlert('danger', 'Ошибка при сохранении: ' + (data.error || 'неизвестная ошибка'));
            }}
        }} catch(err) {{
            showAlert('danger', 'Сетевая ошибка: ' + err.message);
        }} finally {{
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fa-solid fa-floppy-disk me-1"></i> Сохранить все настройки';
        }}
    }}

    renderRules();
    </script>
</body>
</html>"""
        return HTMLResponse(html_content)


def create_admin(app) -> Admin:
    auth = AdminAuth(secret_key=settings.admin_secret_key)
    admin = Admin(app=app, engine=engine, authentication_backend=auth, title="Велкод — Admin")
    admin.add_view(LeadAdmin)
    admin.add_view(PortfolioAdmin)
    admin.add_view(TagAdmin)
    admin.add_view(ServiceAdmin)
    admin.add_view(FaqAdmin)
    admin.add_view(CompanyContactAdmin)
    admin.add_base_view(AiSettingsView)
    admin.add_base_view(UploadView)
    admin.add_base_view(UploadsManagerView)
    return admin
