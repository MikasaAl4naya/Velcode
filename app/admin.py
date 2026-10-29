import re
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from markupsafe import Markup
from sqladmin import Admin, BaseView, ModelView, expose
from sqladmin.authentication import AuthenticationBackend
from starlette.requests import Request
from starlette.responses import HTMLResponse, JSONResponse

from app.config import settings
from app.database import engine
from app.models import Lead, Portfolio, Service, Tag

UPLOADS_DIR = Path("uploads")

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
        if (
            form.get("username") == settings.admin_username
            and form.get("password") == settings.admin_password
        ):
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
            if file and getattr(file, "filename", ""):
                content = await file.read()
                if content:
                    UPLOADS_DIR.mkdir(exist_ok=True)
                    suffix = Path(file.filename).suffix or ".png"
                    fname = f"{uuid4().hex}{suffix}"
                    (UPLOADS_DIR / fname).write_bytes(content)
                    uploaded_url = f"/uploads/{fname}"
                else:
                    error = "Файл пустой"
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
                input[type=file] {{ display: none; }}
                button {{ padding: 10px 24px; background: #4f46e5; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-size: 15px; }}
                button:disabled {{ opacity: .5; cursor: default; }}
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
                <input type="file" name="file" id="file-input" accept="image/*">
                <div class="drop-zone" id="drop-zone">
                    <div class="drop-zone__icon">🖼️</div>
                    <div class="drop-zone__text">Перетащите файл сюда<br>или <b>нажмите для выбора</b></div>
                    <div class="drop-zone__filename" id="filename"></div>
                </div>
                <button type="submit" id="submit-btn" disabled>Загрузить</button>
            </form>
            {"" if not error else f'<div class="error">{error}</div>'}
            {result_block}
            <script>
            var dropZone = document.getElementById('drop-zone');
            var fileInput = document.getElementById('file-input');
            var submitBtn = document.getElementById('submit-btn');
            var filenameEl = document.getElementById('filename');

            dropZone.addEventListener('click', function() {{ fileInput.click(); }});

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
                if (files.length) setFile(files[0]);
            }});

            fileInput.addEventListener('change', function() {{
                if (fileInput.files.length) setFile(fileInput.files[0]);
            }});

            function setFile(file) {{
                var dt = new DataTransfer();
                dt.items.add(file);
                fileInput.files = dt.files;
                filenameEl.textContent = file.name;
                submitBtn.disabled = false;
            }}

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

    @expose("/uploads-manager", methods=["GET"])
    async def uploads_page(self, request: Request) -> HTMLResponse:
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
            is_img = ext in ("jpg", "jpeg", "png", "gif", "webp", "svg", "avif")
            thumb = f'<img src="{f["url"]}" style="height:36px;border-radius:4px;object-fit:cover;vertical-align:middle">' if is_img else "—"
            rows += f"""
            <tr>
                <td style="text-align:center">{thumb}</td>
                <td><code style="font-size:12px">{f["name"]}</code></td>
                <td>{f["size"]}</td>
                <td>{f["mtime"]}</td>
                <td>
                    <a href="{f["url"]}" target="_blank" style="color:#4f46e5;margin-right:8px">Открыть</a>
                    <button onclick="deleteFile('{f["name"]}')" style="background:#dc2626;color:#fff;border:none;border-radius:4px;padding:4px 10px;cursor:pointer;font-size:13px">Удалить</button>
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
                .count {{ color: #6b7280; margin-bottom: 24px; font-size: 14px; }}
                table {{ width: 100%; border-collapse: collapse; }}
                th {{ text-align: left; padding: 10px 12px; background: #f3f4f6; font-size: 13px; border-bottom: 2px solid #e5e7eb; }}
                td {{ padding: 8px 12px; border-bottom: 1px solid #e5e7eb; font-size: 13px; vertical-align: middle; }}
                tr:hover {{ background: #fafafa; }}
                .back {{ display: inline-block; margin-bottom: 20px; color: #4f46e5; text-decoration: none; }}
                .empty {{ color: #9ca3af; margin-top: 40px; text-align: center; }}
            </style>
        </head>
        <body>
            <a href="/admin" class="back">← Назад в админку</a>
            <h1>Управление загрузками</h1>
            <p class="count">Файлов: {len(files)}</p>
            {"" if files else '<p class="empty">Папка uploads пуста</p>'}
            {"<table><thead><tr><th>Превью</th><th>Имя файла</th><th>Размер</th><th>Дата</th><th>Действия</th></tr></thead><tbody>" + rows + "</tbody></table>" if files else ""}
            <script>
            async function deleteFile(name) {{
                if (!confirm('Удалить файл ' + name + '?')) return;
                const r = await fetch('/admin/uploads-delete', {{
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

    @expose("/uploads-delete", methods=["POST"])
    async def delete_file(self, request: Request) -> JSONResponse:
        try:
            data = await request.json()
            name = data.get("name", "")
            if not name or "/" in name or "\\" in name or name.startswith("."):
                return JSONResponse({"error": "invalid name"}, status_code=400)
            target = UPLOADS_DIR / name
            if not target.exists() or not target.is_file():
                return JSONResponse({"error": "not found"}, status_code=404)
            target.unlink()
            return JSONResponse({"ok": True})
        except Exception:
            return JSONResponse({"error": "server error"}, status_code=500)


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


class ServiceAdmin(ModelView, model=Service):
    name = "Услуга"
    name_plural = "Услуги"
    icon = "fa-solid fa-list"

    column_list = [Service.id, Service.title, Service.price_full, Service.is_featured, Service.sort_order]
    column_sortable_list = [Service.sort_order, Service.id]
    column_searchable_list = [Service.title]

    form_columns = [
        Service.title,
        Service.description,
        Service.price_full,
        Service.is_featured,
        Service.image_url,
        Service.sort_order,
    ]
    column_labels = {
        "title": "Название",
        "description": "Описание",
        "price_full": "Цена (₽)",
        "is_featured": "Фиолетовая карточка",
        "image_url": "Картинка (URL из «Загрузить изображение»)",
        "sort_order": "Порядок",
    }


def create_admin(app) -> Admin:
    auth = AdminAuth(secret_key=settings.admin_secret_key)
    admin = Admin(app=app, engine=engine, authentication_backend=auth, title="Велкод — Admin")
    admin.add_view(LeadAdmin)
    admin.add_view(PortfolioAdmin)
    admin.add_view(TagAdmin)
    admin.add_view(ServiceAdmin)
    admin.add_base_view(UploadView)
    admin.add_base_view(UploadsManagerView)
    return admin
